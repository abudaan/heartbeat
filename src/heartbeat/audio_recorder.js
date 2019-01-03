function audioRecorder() {

    'use strict';

    var
        // import
        context, // defined in open_module.js
        encode64, // defined in util.js
        dispatchEvent, // defined in song_event_listener.js
        createWorker, // defined in audio_recorder_worker.js
        getWaveformData, //defined in util.js

        microphoneAccessGranted = null,
        localMediaStream,

        bufferSize = 8192,
        millisPerSample,
        bufferMillis,

        waveformConfig = {
            height: 200,
            width: 800,
            //density: 0.0001,
            sampleStep: 1,
            color: '#71DE71',
            bgcolor: '#000'
        };


    function AudioRecorder(track) {
        this.track = track;
        this.song = track.song;
        this.audioEvents = {};
        this.callback = null; // callback after wav audio file of the recording has been created or updated
        this.worker = createWorker();
        this.waveformConfig = track.waveformConfig || waveformConfig;

        var scope = this;
        this.worker.onmessage = function (e) {
            //createAudioBuffer(scope, e.data.wavArrayBuffer, e.data.interleavedSamples, e.data.planarSamples, e.data.id);
            encodeAudioBuffer(scope, e.data.wavArrayBuffer, e.data.interleavedSamples, e.data.id);
        };
    }


    function createAudioBuffer(scope, wavArrayBuffer, interleavedSamples, planarSamples, type) {
        var
            i,
            frameCount = planarSamples.length,
            base64 = encode64(wavArrayBuffer),
            audioBuffer = context.createBuffer(1, frameCount, context.sampleRate),
            samples = audioBuffer.getChannelData(0),
            recording = {
                id: scope.recordId,
                audioBuffer: null,
                wavArrayBuffer: wavArrayBuffer,
                wav: {
                    blob: new Blob([new Uint8Array(wavArrayBuffer)], { type: 'audio/wav' }),
                    base64: base64,
                    dataUrl: 'data:audio/wav;base64,' + base64
                },
                waveform: {}
            };

        for (i = 0; i < frameCount; i++) {
            samples[i] = planarSamples[i];
        }
        recording.audioBuffer = audioBuffer;

        // keep a copy of the original samples for non-destructive editing
        if (type === 'new') {
            recording.planarSamples = planarSamples;
            recording.interleavedSamples = interleavedSamples;
        } else {
            recording.planarSamples = sequencer.storage.audio.recordings[scope.recordId].planarSamples;
            recording.interleavedSamples = sequencer.storage.audio.recordings[scope.recordId].interleavedSamples;
        }

        sequencer.storage.audio.recordings[scope.recordId] = recording;
        //console.log('create took', window.performance.now() - scope.timestamp);

        if (scope.callback !== null) {
            scope.callback(recording);
            scope.callback = null;
        }
    }


    function encodeAudioBuffer(scope, wavArrayBuffer, interleavedSamples, type) {
        //console.log(wavArrayBuffer, interleavedSamples, type);
        context.decodeAudioData(wavArrayBuffer, function (audioBuffer) {
            var
                base64 = encode64(wavArrayBuffer),
                recording = {
                    id: scope.recordId,
                    audioBuffer: audioBuffer,
                    wavArrayBuffer: wavArrayBuffer,
                    wav: {
                        blob: new Blob([new Uint8Array(wavArrayBuffer)], { type: 'audio/wav' }),
                        base64: base64,
                        dataUrl: 'data:audio/wav;base64,' + base64
                    },
                    waveform: {}
                };

            // keep a copy of the original samples for non-destructive editing
            if (type === 'new') {
                recording.interleavedSamples = interleavedSamples;
            } else {
                recording.interleavedSamples = sequencer.storage.audio.recordings[scope.recordId].interleavedSamples;
            }

            // create waveform images
            getWaveformData(
                audioBuffer,
                scope.waveformConfig,
                //callback
                function (data) {
                    recording.waveform = { dataUrls: data };
                    sequencer.storage.audio.recordings[scope.recordId] = recording;
                    //console.log('encode took', window.performance.now() - scope.timestamp);
                    if (scope.callback !== null) {
                        scope.callback(recording);
                        scope.callback = null;
                    }
                }
            );

        }, function () {
            if (sequencer.debug >= sequencer.WARN) {
                console.warn('no valid audiodata');
            }
        });
    }


    function record(callback) {

        navigator.getUserMedia({ audio: true },

            // successCallback
            function (stream) {
                microphoneAccessGranted = true;
                // localMediaStream is type of MediaStream that comes from microphone
                localMediaStream = stream;
                //console.log(localMediaStream.getAudioTracks());
                //console.log(localMediaStream.getVideoTracks());
                callback();
            },

            // errorCallback
            function (error) {
                if (sequencer.debug >= sequencer.WARN) {
                    console.log(error);
                }
                microphoneAccessGranted = false;
                callback();
            }
        );
    }


    // this triggers the little popup in the browser where the user has to grant access to her microphone
    AudioRecorder.prototype.prepare = function (recordId, callback) {
        var scope = this;

        this.recordId = recordId;

        if (microphoneAccessGranted === null) {
            record(function () {
                callback(microphoneAccessGranted);
                if (localMediaStream !== undefined) {
                    //scope.localMediaStream = localMediaStream.clone(); -> not implemented yet
                    scope.start();
                }
            });
        } else {
            callback(microphoneAccessGranted);
            if (localMediaStream !== undefined) {
                //this.localMediaStream = localMediaStream.clone(); -> not implemented yet
                this.start();
            }
        }
    };


    AudioRecorder.prototype.start = function () {
        var scope = this,
            song = this.track.song;

        scope.worker.postMessage({
            command: 'init',
            sampleRate: context.sampleRate
        });

        this.scriptProcessor = context.createScriptProcessor(bufferSize, 1, 1);

        this.scriptProcessor.onaudioprocess = function (e) {

            if (e.inputBuffer.numberOfChannels === 1) {

                scope.worker.postMessage({
                    command: 'record_mono',
                    buffer: e.inputBuffer.getChannelData(0)
                });


            } else {

                scope.worker.postMessage({
                    command: 'record_stereo',
                    buffer: [
                        e.inputBuffer.getChannelData(0),
                        e.inputBuffer.getChannelData(1)
                    ]
                });
            }

            if (song.recording === false && song.precounting === false) {
                scope.createAudio();
            }
        };

        this.sourceNode = context.createMediaStreamSource(localMediaStream);
        this.sourceNode.connect(this.scriptProcessor);
        this.scriptProcessor.connect(context.destination);
    };


    AudioRecorder.prototype.stop = function (callback) {
        this.stopRecordingTimestamp = context.currentTime * 1000;
        this.timestamp = window.performance.now();
        if (this.sourceNode === undefined) {
            callback();
            return;
        }
        this.callback = callback;
    };


    // create wav audio file after recording has stopped
    AudioRecorder.prototype.createAudio = function () {
        this.sourceNode.disconnect(this.scriptProcessor);
        this.scriptProcessor.disconnect(context.destination);
        this.scriptProcessor.onaudioprocess = null;
        this.sourceNode = null;
        this.scriptProcessors = null;

        // remove precount bars and latency
        var bufferIndexStart = parseInt((this.song.metronome.precountDurationInMillis + this.song.audioRecordingLatency) / millisPerSample),
            bufferIndexEnd = -1;

        this.worker.postMessage({
            command: 'get_wavfile',
            //command: 'get_wavfile2', // use this if you want to create the audio buffer instead of decoding it
            bufferIndexStart: bufferIndexStart,
            bufferIndexEnd: bufferIndexEnd
        });
    };


    // adjust latency for specific recording -> all audio events that use this audio data will be updated!
    // if you don't want that, please use AudioEvent.sampleOffset to adjust the starting point of the audio data
    AudioRecorder.prototype.setAudioRecordingLatency = function (recordId, value, callback) {
        var bufferIndexStart = parseInt(value / millisPerSample),
            bufferIndexEnd = -1;

        this.callback = callback;
        this.worker.postMessage({
            command: 'update_wavfile',
            samples: sequencer.storage.audio.recordings[recordId].interleavedSamples,
            bufferIndexStart: bufferIndexStart,
            bufferIndexEnd: bufferIndexEnd
        });
    };


    AudioRecorder.prototype.cleanup = function () {
        if (localMediaStream === undefined) {
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


    sequencer.protectedScope.createAudioRecorder = function (track) {
        if (sequencer.record_audio === false) {
            return false;
        }
        return new AudioRecorder(track);
    };


    sequencer.protectedScope.addInitMethod(function () {
        encode64 = sequencer.util.encode64;
        context = sequencer.protectedScope.context;
        getWaveformData = sequencer.getWaveformData;
        createWorker = sequencer.protectedScope.createAudioRecorderWorker;
        millisPerSample = (1 / context.sampleRate) * 1000;
        dispatchEvent = sequencer.protectedScope.songDispatchEvent;
        bufferMillis = bufferSize * millisPerSample;
    });

}


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



/*
            getWaveformImageUrlFromBuffer(
                audioBuffer,

                {
                    height: 200,
                    //density: 0.0001,
                    width: 800,
                    sampleStep: 1,
                    // density: 0.5,
                    color: '#71DE71',
                    bgcolor: '#000',
                    samples: samples
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
                    console.log('took', window.performance.now() - scope.timestamp);
                    if(scope.callback !== null){
                        scope.callback(recording);
                        scope.callback = null;
                    }
                }
            );
*/
