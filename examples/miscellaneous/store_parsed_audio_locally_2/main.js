window.onload = function(){

    'use strict';

    if(!window.indexedDB){
        if(!window.webkitIndexedDB){
            alert('no support for indexedDB');
            return;
        }
        window.indexedDB = window.webkitIndexedDB;
    }
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;


    var
    blobURL = URL.createObjectURL(new Blob(['(', storeWav.toString(), ')()'], {type: 'application/javascript'})),
    storeWavWorker = new Worker(blobURL),
    db,
    timestamp,
    contextMuted = true,
    version = 0,
    context = new window.AudioContext(),
    btnLoad = document.getElementById('load');


    initDB(function(){
        if(context.createGain === undefined){
            context.createGain = context.createGainNode;
        }
        if(context.start === undefined){
            context.start = context.noteOn;
            context.stop = context.noteOff;
        }

        //console.time('loading mp3 from server and parsing took');
        timestamp = new Date().getTime();

        var
        request = new XMLHttpRequest();
        request.open('GET', '/heartbeat/assets/looperman.mp3', true);
        request.responseType = 'arraybuffer';
        request.onload = function(){
            if(request.status !== 200){
                return;
            }
            context.decodeAudioData(request.response, function(buffer){
                //console.timeEnd('loading mp3 from server and parsing took');
                console.log('loading mp3 from server and parsing took:', new Date().getTime() - timestamp);
                var numChannels = buffer.numberOfChannels,
                    data = {
                        id: 'looperman',
                        sample_rate: context.sampleRate,
                        num_channels: numChannels,
                        samples_left_channel: buffer.getChannelData(0)
                    };
                if(numChannels === 2){
                    data.samples_right_channel = buffer.getChannelData(1);
                }
                storeWavWorker.postMessage(data);
            });
        };
        request.send();
    });


    storeWavWorker.onmessage = function(e){
        var wavBlob = new Blob([new Uint8Array(e.data.buffer)], {type: 'audio/wav'});
        store(e.data.id, wavBlob);
    };


    function initDB(callback){
        var request = window.indexedDB.open('audio-2'),
            objectStore;

        request.onerror = function(event){
            console.error(event);
        };

        // create new database
        request.onupgradeneeded = function(event){
            db = event.target.result;
            objectStore = db.createObjectStore('samples', {keyPath: 'id'});
            objectStore.createIndex('id', 'id', {unique: false});
            version = db.version;
            callback();
        };

        // database already exists
        request.onsuccess = function(event){
            db = event.target.result;
            version = db.version;
            //callback();
            objectStore = db.transaction(['samples'], 'readwrite').objectStore('samples');
            // remove sample so we can test multiple times
            request = objectStore.delete('looperman');
            request.onsuccess = function(){
                callback();
            };
        };
    }


    function store(id, wavBlob){
        var transaction, objectStore, request, reader;

        try{
            transaction = db.transaction(['samples'], 'readwrite');
            objectStore = transaction.objectStore('samples');
            request = objectStore.add({
                id: id,
                wav: wavBlob
            });

            request.onsuccess = function(){
                btnLoad.disabled = false;
            };

            request.onerror = function(event){
                console.error(event);
            };
        }catch(e) {
            console.log('indexedDB has no blob support');
            reader = new FileReader();
            reader.onload = function(event) {
                transaction = db.transaction(['samples'], 'readwrite');
                objectStore = transaction.objectStore('samples');
                request = objectStore.add({
                    id: id,
                    wav: event.target.result
                });

                request.onerror = function(e) {
                    console.log(e);
                };

                request.onsuccess = function() {
                    btnLoad.disabled = false;
                };
            };
            reader.readAsDataURL(wavBlob);
        }
    }


    btnLoad.addEventListener('click', function(){
        if(contextMuted === true){
            unmuteContext();
        }

        //console.time('loading wav from DB and parsing took');
        timestamp = new Date().getTime();

        var objectStore = db.transaction(['samples']).objectStore('samples'),
            request = objectStore.get('looperman');

        request.onerror = function(event) {
            console.error(event);
        };

        request.onsuccess = function(event) {
            var fileReader = new FileReader(),
                source = context.createBufferSource(),
                wav = event.target.result.wav;

            fileReader.onload = function(e){
                context.decodeAudioData(e.target.result, function(buffer){
                    //console.timeEnd('loading wav from DB and parsing took');
                    console.log('loading wav from DB and parsing took:', new Date().getTime() - timestamp);
                    source.buffer = buffer;
                    source.connect(context.destination);
                    source.start(0);
                });
            };

            if(typeof wav === 'string'){
                wav = dataURItoBlob(wav);
            }
            fileReader.readAsArrayBuffer(wav);
        };
    });


    function unmuteContext(){
        var src = context.createOscillator(),
            gainNode = context.createGain();
        gainNode.gain.value = 0;
        src.connect(gainNode);
        gainNode.connect(context.destination);
        if(src.noteOn !== undefined){
            src.start = src.noteOn;
            src.stop = src.noteOff;
        }
        src.start(0);
        src.stop(0.001);
        contextMuted = false;
    }


    function dataURItoBlob(dataURI) {
        // convert base64 to raw binary data held in a string
        var byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to an ArrayBuffer
        var arrayBuffer = new ArrayBuffer(byteString.length);
        var _ia = new Uint8Array(arrayBuffer);
        for (var i = 0; i < byteString.length; i++) {
            _ia[i] = byteString.charCodeAt(i);
        }

        var dataView = new DataView(arrayBuffer);
        var blob = new Blob([dataView], { type: mimeString });
        return blob;
    }


    // web worker
    function storeWav(){

        var numberOfChannels,
            sampleRate;

        // see: https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
        // samples is a Float32Array
        function encodeWAV(samples){
            var bitsPerSample = 16,
                bytesPerSample = bitsPerSample/8,
                buffer = new ArrayBuffer(44 + samples.length * bytesPerSample),
                view = new DataView(buffer);

            /* RIFF identifier */
            writeString(view, 0, 'RIFF');
            /* RIFF chunk length */
            view.setUint32(4, 36 + samples.length * bytesPerSample, true);
            /* RIFF type */
            writeString(view, 8, 'WAVE');
            /* format chunk identifier */
            writeString(view, 12, 'fmt ');
            /* format chunk length */
            view.setUint32(16, 16, true);
            /* sample format (raw) */
            view.setUint16(20, 1, true);
            /* channel count */
            view.setUint16(22, numberOfChannels, true);
            /* sample rate */
            view.setUint32(24, sampleRate, true);
            /* byte rate (sample rate * block align) */
            view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
            /* block align (channel count * bytes per sample) */
            view.setUint16(32, numberOfChannels * bytesPerSample, true);
            /* bits per sample */
            view.setUint16(34, bitsPerSample, true);
            /* data chunk identifier */
            writeString(view, 36, 'data');
            /* data chunk length */
            view.setUint32(40, samples.length * bytesPerSample, true);

            floatTo16BitPCM(view, 44, samples);
            return view;
        }



        function writeString(view, offset, string){
            for (var i = 0; i < string.length; i++){
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }


        function floatTo16BitPCM(output, offset, input){
            for (var i = 0; i < input.length; i++, offset+=2){
                var s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        }


        function toInterleavedBuffer(inputL, inputR){
            var length = inputL.length + inputR.length,
                result = new Float32Array(length),
                index = 0,
                inputIndex = 0;

            while(index < length){
                result[index++] = inputL[inputIndex];
                result[index++] = inputR[inputIndex];
                inputIndex++;
            }
            return result;
        }

        self.addEventListener('message', function(e){
            sampleRate = e.data.sample_rate;
            numberOfChannels = e.data.num_channels;

            var samplesLeftChannel = e.data.samples_left_channel,
                samplesRightChannel = e.data.samples_right_channel,
                interLeaved, data;

            if(numberOfChannels === 2){
                interLeaved = toInterleavedBuffer(samplesLeftChannel, samplesRightChannel);
            }else if(numberOfChannels === 1){
                interLeaved = samplesLeftChannel;
            }
            data = {
                id: e.data.id,
                buffer: encodeWAV(interLeaved).buffer
            };
            self.postMessage(data, [data.buffer]);
        }, false);
    }

};