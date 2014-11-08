
(function(){

    'use strict';

    var
        sequencer = window.sequencer,
        console = window.console,

        // import
        context, // defined in open_module.js
        storeItem, //defined in util.js
        typeString, // defined in util.js
        getWaveformImageUrlFromBuffer, //defined in util.js
        repetitiveTasks, // defined in open_module.js

        sampleSize = 8192,
        latency = null,
        microphoneAccessGranted = null,
        localMediaStream,

        _record;


    function AudioRecorder(track){
        this.track = track;
        this.recBuffersL = [];
        this.recBuffersR = [];
        this.audioEvents = {};
        this.callback = null;
        this.worker = createWorker();

        var scope = this;

        this.worker.onmessage = function(e){
            var
                song = track.song,
                event,
                recordId = scope.recordId;

            context.decodeAudioData(e.data, function(buffer){

/*

                event = sequencer.createAudioEvent({
                    ticks: song.recordTimestampTicks,
                    latencyCompensation: latency/1000,
                    //latencyCompensation: 0,
                    //sampleOffsetMillis: latency,
                    buffer: buffer,
                    sampleId: scope.recordId
                });

                song.addAudioRecording(new AudioRecording(recordId, buffer, latency));

*/

                storeItem(buffer, 'recordings/' + recordId, sequencer.storage.audio);

                event = sequencer.createAudioEvent({
                    ticks: song.recordTimestampTicks,
                    //latencyCompensation: latency/1000,
                    latencyCompensation: 0,
                    path: 'recordings/' + recordId
                });

                getWaveformImageUrlFromBuffer(
                    buffer,

                    {
                        height: 200,
                        //density: 0.0001,
                        width: 800,
                        sampleStep: 1,
                        // density: 0.5,
                        color: '#71DE71',
                        bgcolor: '#000'
                    },

                    function(urls){
                        var image, images = [],
                            i, maxi = urls.length;

                        for(i = 0; i < maxi; i++){
                            image = document.createElement('img');
                            image.src = urls[i];
                            image.origWidth = image.width;
                            image.height = 100;
                            images.push(image);
                        }

                        event.waveformImage = images[0];
                        event.waveformImages = images;
                        event.waveformSmallImageDataUrl = urls[0];
                        event.waveformImageDataUrls = urls;
                        //console.log(event);

                        // return the recording as a audio event
                        if(scope.callback !== null){
                            scope.callback(event);
                            scope.callback = null;
                        }
                    }
                );

            }, function(){
                if(sequencer.debug >= sequencer.WARN){
                    console.warn('no valid audiodata');
                }
            });
        };
    }


    _record = function(callback){

        navigator.getUserMedia({audio: true},

            // successCallback
            function(stream) {
                microphoneAccessGranted = true;
                localMediaStream = stream;
                callback();
            },

            // errorCallback
            function(error) {
                if(sequencer.debug >= sequencer.WARN){
                    console.log(error);
                }
                microphoneAccessGranted = false;
                callback();
            }
        );
    };



    AudioRecorder.prototype.prepare = function(recordId, callback){
        var self = this;
        this.recordId = recordId;

        if(microphoneAccessGranted === null){
            _record(function(){
                callback(microphoneAccessGranted);
                if(localMediaStream !== undefined){
                    self.start();
                }
            });
        }else{
            callback(microphoneAccessGranted);
            if(localMediaStream !== undefined){
                this.start();
            }
        }
    };


    AudioRecorder.prototype.start = function(){
        var scope = this,
            song = this.track.song,
            timestamp;

        this.sourceNode = context.createMediaStreamSource(localMediaStream);
        this.javascriptNode = context.createScriptProcessor(sampleSize, 1, 1);
/*
        this.analyserNode = context.createAnalyser();
        this.sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.javascriptNode);
        this.amplitudeArray = [];
        this.numAmplitudes = 0;
*/
        this.sourceNode.connect(this.javascriptNode);

        repetitiveTasks.startAudioRecording = null;
        delete repetitiveTasks.startAudioRecording;

        scope.worker.postMessage({
            command: 'init',
            sampleRate: context.sampleRate
        });


        if(song.recording !== true){
            repetitiveTasks.startAudioRecording = function(){
                if(song.recording === true){
                    scope.start();
                }
            };
            return;
        }


        this.javascriptNode.onaudioprocess = function(e){
            // TODO: fix latency issue
/*
            if(timestamp !== null){
                //console.log((context.currentTime * 1000) - timestamp);
                //timestamp = context.currentTime * 1000;
                latency = (context.currentTime * 1000) - timestamp;
                timestamp = null;
            }
*/
            if(e.inputBuffer.numberOfChannels === 1){
                scope.recBuffersL.push(e.inputBuffer.getChannelData(0));

                scope.worker.postMessage({
                    command: 'record_mono',
                    buffer: e.inputBuffer.getChannelData(0)
                });

            }else{
                scope.recBuffersL.push(e.inputBuffer.getChannelData(0));
                scope.recBuffersR.push(e.inputBuffer.getChannelData(1));

                scope.worker.postMessage({
                    command: 'record_stereo',
                    buffer:[
                        e.inputBuffer.getChannelData(0),
                        e.inputBuffer.getChannelData(1)
                    ]
                });
            }

/*
            var tmp = new Uint8Array(scope.analyserNode.frequencyBinCount);
            scope.analyserNode.getByteTimeDomainData(tmp);
            scope.amplitudeArray.push(tmp);
            scope.numAmplitudes += tmp.length;
*/
        };

        //latency = sampleSize * (1/context.sampleRate) * 1000 ;
        //latency = latency + (context.currentTime * 1000) - song.recordTimestamp - song.metronome.precountDurationInMillis;
        latency = (context.currentTime * 1000) - song.recordTimestamp - song.metronome.precountDurationInMillis;
        //console.log(context.currentTime * 1000, song.recordTimestamp, latency);
        timestamp = (context.currentTime * 1000);
        this.javascriptNode.connect(context.destination);
    };


    AudioRecorder.prototype.stop = function(callback){
        if(this.sourceNode === undefined){
            callback();
            return;
        }
        this.callback = callback;
        this.sourceNode.disconnect(this.javascriptNode);
        this.javascriptNode.onaudioprocess = null;

        repetitiveTasks.startAudioRecorder = undefined;
        delete repetitiveTasks.startAudioRecorder;

        this.worker.postMessage({
            command: 'get_arraybuffer'
        });
    };


    AudioRecorder.prototype.cleanup = function(){
        if(localMediaStream === undefined){
            this.worker.terminate();
            return;
        }
        //localMediaStream.stop(); -> better not to stop the microphone stream
        this.analyserNode.disconnect();
        this.sourceNode.disconnect();
        this.worker.terminate();
    };


    AudioRecorder.prototype.drawCanvas = function(amplitudeArray, column){
        var minValue = 9999999;
        var maxValue = 0;
        var canvasHeight = 100;
        var canvasWidth = 1000;

        for (var i = 0; i < amplitudeArray.length; i++) {
            var value = amplitudeArray[i] / 256;
            if(value > maxValue) {
                maxValue = value;
            } else if(value < minValue) {
                minValue = value;
            }
        }

        var y_lo = canvasHeight - (canvasHeight * minValue) - 1;
        var y_hi = canvasHeight - (canvasHeight * maxValue) - 1;

        this.context2d.fillStyle = '#ffffff';
        this.context2d.fillRect(column, y_lo, 1, y_hi - y_lo);
    };


    function createWorker(){
        var blobURL = URL.createObjectURL(new Blob(['(',

            function(){
                var
                    recLength,
                    recBuffersL,
                    recBuffersR,
                    sampleRate,
                    numberOfChannels;

                this.onmessage = function(e){
                    switch(e.data.command){
                        case 'init':
                            sampleRate = e.data.sampleRate;
                            recLength = 0;
                            recBuffersL = [];
                            recBuffersR = [];
                            break;
                        case 'record_mono':
                            numberOfChannels = 1;
                            recBuffersL.push(e.data.buffer);
                            recLength += e.data.buffer.length;
                            break;
                        case 'record_stereo':
                            numberOfChannels = 2;
                            recBuffersL.push(e.data.buffer[0]);
                            recBuffersR.push(e.data.buffer[1]);
                            recLength += e.data.buffer[0].length;
                            break;
                        case 'export_wav':
                            this.postMessage(exportWAV());
                            break;
                        case 'export_mp3':
                            this.postMessage(exportMp3());
                            break;
                        case 'get_arraybuffer':
                            var ab = getArrayBuffer();
                            this.postMessage(ab, [ab]);
                            break;
                    }
                };


                // TODO: add code to handle mono recordings
                function getArrayBuffer(){
                    var index,
                        length,
                        bufferL,
                        bufferR,
                        result,
                        dataview;
/*
                    if(numberOfChannels === 2){
                        bufferL = mergeBuffers(recBuffersL, recLength);
                        bufferR = mergeBuffers(recBuffersR, recLength);
                        result = interleave(bufferL, bufferR);
                    }else if(numberOfChannels === 1){
                        length = recBuffersL.length;
                        result = new Float32Array(length);
                        index = 0;

                        while(index < length){
                            result[index] = recBuffersL[index];
                            index++;
                        }
                    }
*/
                    bufferL = mergeBuffers(recBuffersL, recLength);
                    bufferR = mergeBuffers(recBuffersR, recLength);
                    result = interleave(bufferL, bufferR);
                    dataview = encodeWAV(result);

                    return dataview.buffer;
                }


                function exportWAV(){
                    var bufferL = mergeBuffers(recBuffersL, recLength),
                        bufferR = mergeBuffers(recBuffersR, recLength),
                        interleaved = interleave(bufferL, bufferR),
                        dataview = encodeWAV(interleaved),
                        audioBlob = new Blob([dataview], {type: 'audio/wav'});

                    return audioBlob;
                }


                // TODO: implement this
                function exportMp3(){
                    var wav = exportWAV();
                }

                function mergeBuffers(recBuffers, recLength){
                    var result = new Float32Array(recLength);
                    var offset = 0;
                    for (var i = 0; i < recBuffers.length; i++){
                        result.set(recBuffers[i], offset);
                        offset += recBuffers[i].length;
                    }
                    return result;
                }


                function interleave(inputL, inputR){
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


                function floatTo16BitPCM(output, offset, input){
                    for (var i = 0; i < input.length; i++, offset+=2){
                        var s = Math.max(-1, Math.min(1, input[i]));
                        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }
                }


                function writeString(view, offset, string){
                    for (var i = 0; i < string.length; i++){
                        view.setUint8(offset + i, string.charCodeAt(i));
                    }
                }


                // TODO: change header for mono files
                function encodeWAV(samples){
                    var buffer = new ArrayBuffer(44 + samples.length * 2),
                        view = new DataView(buffer);

                    /* RIFF identifier */
                    writeString(view, 0, 'RIFF');
                    /* RIFF chunk length */
                    view.setUint32(4, 36 + samples.length * 2, true);
                    /* RIFF type */
                    writeString(view, 8, 'WAVE');
                    /* format chunk identifier */
                    writeString(view, 12, 'fmt ');
                    /* format chunk length */
                    view.setUint32(16, 16, true);
                    /* sample format (raw) */
                    view.setUint16(20, 1, true);
                    /* channel count */
                    view.setUint16(22, 2, true);
                    /* sample rate */
                    view.setUint32(24, sampleRate, true);
                    /* byte rate (sample rate * block align) */
                    view.setUint32(28, sampleRate * 4, true);
                    /* block align (channel count * bytes per sample) */
                    view.setUint16(32, 4, true);
                    /* bits per sample */
                    view.setUint16(34, 16, true);
                    /* data chunk identifier */
                    writeString(view, 36, 'data');
                    /* data chunk length */
                    view.setUint32(40, samples.length * 2, true);

                    floatTo16BitPCM(view, 44, samples);

                    return view;
                }


            }.toString(),

        ')()' ], {type: 'application/javascript'}));

        return new Worker(blobURL);
    }


/*
    function AudioRecording(id, buffer, latency, name){
        this.className = 'AudioRecording';
        this.id = id;
        this.name = name === undefined ? id : name;
        this.buffer = buffer;
        this.latency = latency;
        //console.log(buffer.duration, latency);
    }


    AudioRecording.prototype.setName = function(name){
        this.name = name;
    };
*/


    sequencer.protectedScope.createAudioRecorder = function(track){
        if(sequencer.record_audio === false){
            return false;
        }
        return new AudioRecorder(track);
    };


    sequencer.protectedScope.addInitMethod(function(){
        context = sequencer.protectedScope.context;
        storeItem = sequencer.protectedScope.storeItem;
        typeString = sequencer.protectedScope.typeString;
        repetitiveTasks = sequencer.protectedScope.repetitiveTasks;
        getWaveformImageUrlFromBuffer = sequencer.getWaveformImageUrlFromBuffer;
        //latency = sampleSize * (1/context.sampleRate) * 1000;
        //console.log(latency, context.sampleRate);
        //_record();
    });
}());




