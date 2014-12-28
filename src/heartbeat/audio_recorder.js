(function(){

    'use strict';

    var
        sequencer = window.sequencer,
        console = window.console,

        // import
        context, // defined in open_module.js
        encode64, // defined in util.js
        getWaveformImageUrlFromBuffer, //defined in util.js
        dispatchEvent, // defined in song_event_listener.js

        microphoneAccessGranted = null,
        localMediaStream,

        bufferSize = 8192,
        millisPerSample,
        bufferMillis;


    function AudioRecorder(track){
        this.track = track;
        this.song = track.song;
        this.audioEvents = {};
        this.callback = null; // callback after wav audio file of the recording has been created or updated
        this.worker = createWorker();

        var scope = this;
        this.worker.onmessage = function(e){
            encodeAudioData(scope, e.data.ab, e.data.samples, e.data.id);
        };
    }


    function encodeAudioData(scope, arrayBuffer, samples, type){

        context.decodeAudioData(arrayBuffer, function(audioBuffer){
            //console.log(audioBuffer);
            var
            base64 = encode64(arrayBuffer),
            recording = {
                id: scope.recordId,
                audioBuffer: audioBuffer,
                arrayBuffer: arrayBuffer,
                wav: {
                    blob: new Blob([new Uint8Array(arrayBuffer)], {type: 'audio/wav'}),
                    base64: base64,
                    dataUrl: 'data:audio/wav;base64,' + base64
                },
                waveform: {}
            };

            // keep a copy of the original samples for non-destructive editing
            if(type === 'new'){
                recording.samples = samples;
            }else{
                recording.samples = sequencer.storage.audio.recordings[scope.recordId].samples;
            }

            getWaveformImageUrlFromBuffer(
                audioBuffer,

                {
                    height: 200,
                    //density: 0.0001,
                    width: 800,
                    sampleStep: 1,
                    // density: 0.5,
                    color: '#71DE71',
                    bgcolor: '#000'
                },

                //callback
                function(urls){
                    var image, images = [],
                        i, maxi = urls.length;

                    // create html image instances from the data-urls
                    for(i = 0; i < maxi; i++){
                        image = document.createElement('img');
                        image.src = urls[i];
                        image.origWidth = image.width;
                        image.height = 100;
                        images.push(image);
                    }

                    recording.waveform.images = images;
                    recording.waveform.dataUrls = urls;

                    sequencer.storage.audio.recordings[scope.recordId] = recording;

                    if(scope.callback !== null){
                        scope.callback(recording);
                        scope.callback = null;
                    }
                }
            );

        }, function(){
            if(sequencer.debug >= sequencer.WARN){
                console.warn('no valid audiodata');
            }
        });
    }


    function record(callback){

        navigator.getUserMedia({audio: true},

            // successCallback
            function(stream) {
                microphoneAccessGranted = true;
                // localMediaStream is type of MediaStream that comes from microphone
                localMediaStream = stream;
                //console.log(localMediaStream.getAudioTracks());
                //console.log(localMediaStream.getVideoTracks());
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
    }


    // this triggers the little popup in the browser where the user has to grant access to her microphone
    AudioRecorder.prototype.prepare = function(recordId, callback){
        var scope = this;

        this.recordId = recordId;

        if(microphoneAccessGranted === null){
            record(function(){
                callback(microphoneAccessGranted);
                if(localMediaStream !== undefined){
                    //scope.localMediaStream = localMediaStream.clone(); -> not implemented yet
                    scope.start();
                }
            });
        }else{
            callback(microphoneAccessGranted);
            if(localMediaStream !== undefined){
                //this.localMediaStream = localMediaStream.clone(); -> not implemented yet
                this.start();
            }
        }
    };


    AudioRecorder.prototype.start = function(){
        var scope = this,
            song = this.track.song;

        scope.worker.postMessage({
            command: 'init',
            sampleRate: context.sampleRate
        });

        this.scriptProcessor = context.createScriptProcessor(bufferSize, 1, 1);

        this.scriptProcessor.onaudioprocess = function(e){

            if(e.inputBuffer.numberOfChannels === 1){

                scope.worker.postMessage({
                    command: 'record_mono',
                    buffer: e.inputBuffer.getChannelData(0)
                });


            }else{

                scope.worker.postMessage({
                    command: 'record_stereo',
                    buffer:[
                        e.inputBuffer.getChannelData(0),
                        e.inputBuffer.getChannelData(1)
                    ]
                });
            }

            if(song.recording === false && song.precounting === false){
                scope.createAudio();
            }
        };

        this.sourceNode = context.createMediaStreamSource(localMediaStream);
        this.sourceNode.connect(this.scriptProcessor);
        this.scriptProcessor.connect(context.destination);
    };


    AudioRecorder.prototype.stop = function(callback){
        this.stopRecordingTimestamp = context.currentTime * 1000;
        if(this.sourceNode === undefined){
            callback();
            return;
        }
        this.callback = callback;
    };


    // create wav audio file after recording has stopped
    AudioRecorder.prototype.createAudio = function(){
        this.sourceNode.disconnect(this.scriptProcessor);
        this.scriptProcessor.disconnect(context.destination);
        this.scriptProcessor.onaudioprocess = null;
        this.sourceNode = null;
        this.scriptProcessors = null;

        // remove precount bars and latency
        var bufferIndexStart = parseInt((this.song.metronome.precountDurationInMillis + this.song.audioRecordingLatency)/millisPerSample),
            bufferIndexEnd = -1;

        this.worker.postMessage({
            command: 'get_arraybuffer',
            bufferIndexStart: bufferIndexStart,
            bufferIndexEnd: bufferIndexEnd
        });
    };


    // adjust latency for specific recording -> all audio events that use this audio data will be updated!
    // if you don't want that, please use AudioEvent.sampleOffset to adjust the starting point of the audio data
    AudioRecorder.prototype.setAudioRecordingLatency = function(recordId, value, callback){
        var bufferIndexStart = parseInt(value/millisPerSample),
            bufferIndexEnd = -1;

        this.callback = callback;
        this.worker.postMessage({
            command: 'update_arraybuffer',
            samples: sequencer.storage.audio.recordings[recordId].samples,
            bufferIndexStart: bufferIndexStart,
            bufferIndexEnd: bufferIndexEnd
        });
    };


    AudioRecorder.prototype.cleanup = function(){
        if(localMediaStream === undefined){
            this.worker.terminate();
            return;
        }
        //this.localMediaStream.stop();
        this.scriptProcessor.disconnect();
        this.scriptProcessor.onaudioprocess = null;
        this.sourceNode.disconnect();
        this.scriptProcessor = null;
        this.sourceNode = null;
        this.worker.terminate();
    };


    sequencer.protectedScope.createAudioRecorder = function(track){
        if(sequencer.record_audio === false){
            return false;
        }
        return new AudioRecorder(track);
    };


    sequencer.protectedScope.addInitMethod(function(){
        encode64 = sequencer.util.encode64;
        context = sequencer.protectedScope.context;
        getWaveformImageUrlFromBuffer = sequencer.getWaveformImageUrlFromBuffer;
        millisPerSample = (1/context.sampleRate) * 1000;
        dispatchEvent = sequencer.protectedScope.songDispatchEvent;
        bufferMillis = bufferSize * millisPerSample;
    });



    // ============================== WEB WORKER ============================== //


    function createWorker(){
        var blobURL = URL.createObjectURL(new Blob(['(',

            function(){
                var
                    data,
                    bufferIndexStart,
                    bufferIndexEnd,
                    mergedBuffer,
                    recLength,
                    recBuffersL,
                    recBuffersR,
                    sampleRate,
                    numberOfChannels;

                self.onmessage = function(e){
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
                            this.postMessage(new Blob([getArrayBufferView()], {type: 'audio/wav'}));
                            break;
                        case 'get_arraybuffer':
                            bufferIndexStart = e.data.bufferIndexStart;
                            bufferIndexEnd = e.data.bufferIndexEnd;
                            data = {};
                            data.ab = getArrayBufferView().buffer;
                            data.samples = mergedBuffer;
                            data.id = 'new';
                            this.postMessage(data, [data.ab, data.samples.buffer]);
                            break;
                        case 'update_arraybuffer':
                            bufferIndexStart = e.data.bufferIndexStart;
                            bufferIndexEnd = e.data.bufferIndexEnd;
                            mergedBuffer = e.data.samples;
                            data = {};
                            data.ab = updateArrayBufferView().buffer;
                            data.id = 'update';
                            this.postMessage(data, [data.ab]);
                            break;
                    }
                };


                function getArrayBufferView(){
                    var dataview, i, length, result, index = 0;

                    if(numberOfChannels === 1){
                        mergedBuffer = mergeBuffers(recBuffersL, recLength);
                    }else if(numberOfChannels === 2){
                        mergedBuffer = interleave(
                            mergeBuffers(recBuffersL, recLength),
                            mergeBuffers(recBuffersR, recLength)
                        );
                    }

                    //console.log('1:' + mergedBuffer.length);
                    if(bufferIndexEnd > 0 || bufferIndexStart > 0){
                        if(bufferIndexEnd === -1){
                            bufferIndexEnd = mergedBuffer.length;
                        }
                        result = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);
                        for(i = bufferIndexStart; i < bufferIndexEnd; i++){
                            result[index++] = mergedBuffer[i];
                        }
                        mergedBuffer = result;
                    }
                    //console.log('2:' + mergedBuffer.length);

                    dataview = encodeWAV(mergedBuffer);
                    return dataview;
                }


                function updateArrayBufferView(){
                    var dataview, i, length, result, index = 0;
                    //console.log(bufferIndexStart + ':' + mergedBuffer.length);

                    if(bufferIndexEnd === -1){
                        bufferIndexEnd = mergedBuffer.length;
                    }
                    result = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);
                    for(i = bufferIndexStart; i < bufferIndexEnd; i++){
                        result[index++] = mergedBuffer[i];
                    }
                    dataview = encodeWAV(result);
                    return dataview;
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


            }.toString(),

        ')()' ], {type: 'application/javascript'}));

        return new Worker(blobURL);
    }

}());


/*
    // real-time waveform rendering, not implemented
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
*/


