
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
        dispatchEvent, // defined in song_event_listener.js

        microphoneAccessGranted = null,
        localMediaStream,

        bufferSize = 8192 * 2,
        millisPerSample,
        bufferMillis,

        _record;


    function AudioRecorder(track){
        this.track = track;
        this.song = track.song;
        this.audioEvents = {};
        this.callback = null;
        this.bufferOffset = 0;
        this.worker = createWorker();

        this.latency = this.song.audioRecordingLatency;

        var scope = this;

        this.worker.onmessage = function(e){
            var
                song = track.song,
                recordId = scope.recordId,
                id = e.data.id;

            context.decodeAudioData(e.data.ab, function(buffer){

                storeItem(buffer, 'recordings/' + recordId, sequencer.storage.audio);

                if(id === 'new'){
                    scope.event = sequencer.createAudioEvent({
                        ticks: song.recordTimestampTicks,
                        path: 'recordings/' + recordId
                    });
                }else{
                    scope.event.buffer = buffer;
                }


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

                        scope.event.waveformImage = images[0];
                        scope.event.waveformImages = images;
                        scope.event.waveformSmallImageDataUrl = urls[0];
                        scope.event.waveformImageDataUrls = urls;

                        //console.log(e.data.id, scope.event);

                        if(id === 'new'){
                            // return the recording as a audio event
                            if(scope.callback !== null){
                                scope.callback(scope.event);
                                scope.callback = null;
                            }
                        }else if(id === 'update'){
                            dispatchEvent(song, 'latency_adjusted');
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
    };


    AudioRecorder.prototype.setAudioRecordingLatency = function(value){
        this.latency = value;
        this.bufferIndexStart = parseInt((this.song.metronome.precountDurationInMillis + this.latency)/millisPerSample);

        //console.log('2 ' +  this.bufferIndexStart + ' - ' + this.bufferIndexEnd + ' latency:' + this.latency);

        // update last recorded audio data
        this.worker.postMessage({
            command: 'update_arraybuffer',
            bufferIndexStart: this.bufferIndexStart,
            bufferIndexEnd: this.bufferIndexEnd
        });
    };


    AudioRecorder.prototype.prepare = function(recordId, callback){
        var scope = this;

        this.recordId = recordId;

        if(microphoneAccessGranted === null){
            _record(function(){
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


    AudioRecorder.prototype.createAudio = function(){
        this.sourceNode.disconnect(this.scriptProcessor);
        this.scriptProcessor.disconnect(context.destination);
        this.scriptProcessor.onaudioprocess = null;
        this.sourceNode = null;
        this.scriptProcessors = null;

        // remove precount bars and latency
        this.bufferIndexStart = parseInt((this.song.metronome.precountDurationInMillis + this.latency)/millisPerSample);
        this.bufferIndexEnd = -1;

        //console.log('1 ' +  this.bufferIndexStart + ' - ' + this.bufferIndexEnd + ' latency:' + this.latency);

        this.worker.postMessage({
            command: 'get_arraybuffer',
            bufferIndexStart: this.bufferIndexStart,
            bufferIndexEnd: this.bufferIndexEnd
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
                            this.postMessage(exportWAV());
                            break;
                        case 'export_mp3':
                            this.postMessage(exportMp3());
                            break;
                        case 'get_arraybuffer':
                            bufferIndexStart = e.data.bufferIndexStart;
                            bufferIndexEnd = e.data.bufferIndexEnd;
                            data = {};
                            data.ab = getArrayBuffer();
                            data.id = 'new';
                            this.postMessage(data, [data.ab]);
                            break;
                        case 'update_arraybuffer':
                            bufferIndexStart = e.data.bufferIndexStart;
                            bufferIndexEnd = e.data.bufferIndexEnd;
                            data = {};
                            data.ab = updateArrayBuffer();
                            data.id = 'update';
                            this.postMessage(data, [data.ab]);
                            break;
                    }
                };


                function getArrayBuffer(){
                    var index = 0, i,
                        result,
                        //marker,
                        dataview;

                    if(numberOfChannels === 1){
                        mergedBuffer = mergeBuffers(recBuffersL, recLength);
                    }else if(numberOfChannels === 2){
                        mergedBuffer = interleave(
                            mergeBuffers(recBuffersL, recLength),
                            mergeBuffers(recBuffersR, recLength)
                        );
                    }

                    if(bufferIndexEnd > 0 || bufferIndexStart > 0){
                        if(bufferIndexEnd === -1){
                            bufferIndexEnd = mergedBuffer.length;
                        }
                        result = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);
                        //marker = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
                        //result.set(marker, 0);
                        for(i = bufferIndexStart; i < bufferIndexEnd; i++){
                            result[index++] = mergedBuffer[i];
                        }
                        dataview = encodeWAV(result);
                    }else{
                        dataview = encodeWAV(mergedBuffer);
                    }

                    return dataview.buffer;
                }


                function updateArrayBuffer(){
                    var index = 0, i,
                        result,
                        dataview;

                    if(bufferIndexEnd === -1){
                        bufferIndexEnd = mergedBuffer.length;
                    }

                    result = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);

                    for(i = bufferIndexStart; i < bufferIndexEnd; i++){
                        result[index++] = mergedBuffer[i];
                    }

                    dataview = encodeWAV(result);
                    return dataview.buffer;
                }


                function exportWAV(){
                    var bufferL,
                        bufferR,
                        interleaved,
                        dataview,
                        audioBlob;

                    if(numberOfChannels === 1){
                        bufferL = mergeBuffers(recBuffersL, recLength);
                        dataview = encodeWAV(bufferL);
                    }else if(numberOfChannels === 2){
                        bufferL = mergeBuffers(recBuffersL, recLength);
                        bufferR = mergeBuffers(recBuffersR, recLength);
                        interleaved = interleave(bufferL, bufferR);
                        dataview = encodeWAV(interleaved);
                    }

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
                    view.setUint16(22, numberOfChannels, true);
                    /* sample rate */
                    view.setUint32(24, sampleRate, true);
                    /* byte rate (sample rate * block align) */
                    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
                    /* block align (channel count * bytes per sample) */
                    view.setUint16(32, numberOfChannels * 2, true);
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
        millisPerSample = (1/context.sampleRate) * 1000;
        dispatchEvent = sequencer.protectedScope.songDispatchEvent;
        bufferMillis = bufferSize * millisPerSample;
    });
}());




