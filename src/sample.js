function sample() {

    'use strict';

    var
        //import
        context, // defined in open_module.js
        timedTasks, // defined in open_module.js
        legacy, // defined in open_module.js
        typeString, // defined in util.js
        getSampleId, // defined in open_module.js
        createPanner, // defined in effects.js
        getEqualPowerCurve, // defined in util.js

        //private
        stopSample,
        fadeOut,

        SampleSynth,
        SampleRelease,
        SampleSustainRelease,
        SampleReleasePanning,
        SampleSustainReleasePanning,


        Sample = function (config) {
            this.id = getSampleId();
            this.output = context.createGainNode();
            this.output.connect(config.track.input);
            this.buffer = config.buffer;
            if (this.buffer) {
                this.duration = this.buffer.duration;
            }
            this.noteNumber = config.noteNumber;
            this.stopCallback = function () { };
            this.track = config.track;
            //console.log(this.buffer, this.noteNumber)
        };


    stopSample = function (sample, time) {
        sample.source.onended = function () {
            sample.stopCallback(sample);
        };
        time = time || 0;
        try {
            sample.source.stop(time);
        } catch (e) {
            console.log(e);
        }
    };


    fadeOut = function (sample) {
        var now = context.currentTime,
            values,
            i, maxi;

        if (sample.release_duration > 0) {
            //console.log(sample.releaseEnvelope);
            try {
                switch (sample.releaseEnvelope) {

                    case 'linear':
                        sample.output.gain.linearRampToValueAtTime(sample.volume, now);
                        sample.output.gain.linearRampToValueAtTime(0, now + sample.releaseDuration);
                        break;

                    case 'equal power':
                        values = getEqualPowerCurve(100, 'fadeOut', sample.volume);
                        sample.output.gain.setValueCurveAtTime(values, now, sample.releaseDuration);
                        break;

                    case 'array':
                        maxi = sample.releaseEnvelopeArray.length;
                        values = new Float32Array(maxi);
                        for (i = 0; i < maxi; i++) {
                            values[i] = sample.releaseEnvelopeArray[i] * sample.volume;
                        }
                        sample.output.gain.setValueCurveAtTime(values, now, sample.releaseDuration);
                        break;
                }
            } catch (e) {
                console.error(sample.id, e);
            }
        }
    };


    Sample.prototype.addData = function (obj) {
        this.sourceId = obj.sourceId;
        this.noteName = obj.noteName;
        this.midiNote = obj.midiNote;
    };

    Sample.prototype.createSource = function () {
        // overrule to do or add other stuff
        this.source = context.createBufferSource();
        this.source.buffer = this.buffer;
    };

    Sample.prototype.route = function () {
        // overrule to do or add other stuff
        this.source.connect(this.output);
    };


    // called on a NOTE ON event
    Sample.prototype.start = function (event) {
        // console.log('NOTE ON', event.velocity, legacy);
        if (this.source !== undefined) {
            console.error('this should never happen');
            return;
        }

        this.volume = event.velocity / 127;
        this.output.gain.value = this.volume;

        this.createSource();
        this.phase = 'decay'; // -> naming of phases is not completely correct, we skip attack
        this.route();

        if (legacy === true) {
            this.source.start = this.source.noteOn;
            this.source.stop = this.source.noteOff;
        }

        try {
            // if(event.offset !== undefined){
            //     console.log(event.offset);
            // }
            this.source.start(event.time, event.offset || 0, event.duration || this.duration);
            //alert(event.offset + ':' + event.duration);
            //this.source.start(event.time, 0, 0);
            //this.source.start(event.time);
            //console.log('start', event.time, event.offset, event.duration, sequencer.getTime());
            //console.log('start', time, sequencer.getTime());
        } catch (e) {
            console.warn(e);
        }
    };


    // called on a NOTE OFF event
    Sample.prototype.stop = function (seconds, cb) {
        //console.log('NOTE OFF', cb);
        //console.log('NOTE OFF', this.source);
        //console.log('NOTE OFF', this.release);
        if (this.source === undefined) {
            if (sequencer.debug) {
                console.log('Sample.stop() source is undefined');
            }
            return;
        }

        // this happens when midi events are sent live from a midi device
        if (seconds === 0 || seconds === undefined) {
            //console.log('seconds is undefined!');
            seconds = sequencer.getTime();
        }
        this.stopCallback = cb || function () { };

        if (this.release) {
            this.source.loop = false;
            this.startReleasePhase = seconds;
            this.stopTime = seconds + this.releaseDuration;
            //console.log(this.stopTime, seconds, this.releaseDuration);
        } else {
            stopSample(this, seconds);
        }
    };


    Sample.prototype.unschedule = function (when, cb) {
        var now = context.currentTime,
            sample = this,
            fadeOut = when === null ? 100 : when;//milliseconds

        this.source.onended = undefined;
        // Comment this out, see fix by Nicolar Lair below:
        // this.output.gain.cancelScheduledValues(now);

        //console.log(this.volume, now);
        //this.output.gain.linearRampToValueAtTime(this.volume, now);

        try {
            // Fix by Nicolar Lair:
            /*
              A DOM Exception occurs when a fade out is called while the sound is playing / planned to play
              until a later value in time:
              "Failed to execute 'linearRampToValueAtTime' on 'AudioParam': linearRampToValueAtTime()
              overlaps setValueCurveAt()"
            */
            this.output.gain.cancelScheduledValues(0);
            this.output.gain.linearRampToValueAtTime(0, now + fadeOut / 1000); // fade out in seconds

            if (fadeOut === 0) {
                if (sample.source !== undefined) {
                    sample.source.disconnect(0);
                    sample.source = undefined;
                    if (typeof cb === 'function') {
                        cb(sample);
                    }
                }
            } else {
                timedTasks['unschedule_' + this.id] = {
                    time: now + fadeOut / 1000,
                    execute: function () {
                        if (!sample) {
                            console.log('sample is gone');
                            return;
                        }
                        if (sample.panner) {
                            sample.panner.node.disconnect(0);
                        }
                        if (sample.source !== undefined) {
                            sample.source.disconnect(0);
                            sample.source = undefined;
                        }
                        if (cb) {
                            cb(sample);
                        }
                    }
                };
            }
        } catch (e) {
            // firefox gives sometimes an error "SyntaxError: An invalid or illegal string was specified"
            console.log(e);
        }

    };


    // called every frame
    Sample.prototype.update = function (value) {
        var doLog = this.track.name === 'Sonata # 3' && this.track.song.bar >= 6 && this.track.song.bar <= 10;
        //var doLog = true;
        //console.log('update', this.phase);
        if (this.autopan) {
            this.panner.setPosition(value);
        }

        if (this.startReleasePhase !== undefined && context.currentTime >= this.startReleasePhase && this.phase === 'decay') {
            if (doLog === true) {
                console.log(this.phase, '-> release', this.releaseDuration);
            }
            this.phase = 'release';
            fadeOut(this);
        } else if (this.stopTime !== undefined && context.currentTime >= this.stopTime && this.phase === 'release') {
            if (doLog === true) {
                console.log(this.phase, '-> stopped', this.stopTime, context.currentTime);
            }
            this.phase = 'stopped';
            stopSample(this);
        }
    };


    sequencer.createSample = function (config) {
        var debug = false;
        //return new Sample(config);
        //console.log(config.release_duration);
        if (debug) console.log(config);

        if (config.oscillator) {
            if (debug) console.log('synth');
            return new SampleSynth(config);

        } else if (config.sustain && config.release && config.panning) {
            if (debug) console.log('sustain, release, panning');
            return new SampleSustainReleasePanning(config);

        } else if (config.release && config.panning) {
            if (debug) console.log('release, panning');
            return new SampleReleasePanning(config);

        } else if (config.release && config.sustain) {
            if (debug) console.log('release, sustain');
            return new SampleSustainRelease(config);

        } else if (config.release) {
            if (debug) console.log('release');
            return new SampleRelease(config);

        } else {
            if (debug) console.log('simple');
            return new Sample(config);
        }
    };


    sequencer.protectedScope.addInitMethod(function () {
        var createClass = sequencer.protectedScope.createClass;

        context = sequencer.protectedScope.context;
        timedTasks = sequencer.protectedScope.timedTasks;
        getEqualPowerCurve = sequencer.util.getEqualPowerCurve;
        legacy = sequencer.legacy;
        getSampleId = sequencer.protectedScope.getSampleId;
        typeString = sequencer.protectedScope.typeString;
        createPanner = sequencer.createPanner;


        SampleRelease = createClass(Sample, function (config) {
            this.release = true;

            this.releaseDuration = config.release_duration / 1000;
            this.releaseEnvelope = config.release_envelope;
            //console.log(this.releaseDuration, this.releaseEnvelope);
        });


        SampleSustainRelease = createClass(Sample, function (config) {
            this.release = true;

            this.sustainStart = config.sustain_start / 1000;
            this.sustainEnd = config.sustain_end / 1000;
            this.releaseDuration = config.release_duration / 1000;
            this.releaseEnvelope = config.release_envelope;
            if (this.releaseEnvelope === undefined) {
                this.releaseEnvelope = 'equal power';
            } else if (typeString(this.releaseEnvelope) === 'array') {
                this.releaseEnvelopeArray = config.release_envelope_array;
                this.releaseEnvelope = 'array';
            }
        });

        SampleSustainRelease.prototype.route = function () {
            this.source.loop = true;
            this.source.loopStart = this.sustainStart;
            this.source.loopEnd = this.sustainEnd;
            this.source.connect(this.output);
            //console.log(this.sustainStart, this.sustainEnd);
        };


        SampleReleasePanning = createClass(Sample, function (config) {
            this.release = true;

            this.releaseDuration = config.release_duration / 1000;
            this.releaseEnvelope = config.release_envelope;
            if (this.releaseEnvelope === undefined) {
                this.releaseEnvelope = 'equal power';
            } else if (typeString(this.releaseEnvelope) === 'array') {
                this.releaseEnvelopeArray = config.release_envelope_array;
                this.releaseEnvelope = 'array';
            }
            this.panPosition = config.panPosition;
        });


        SampleReleasePanning.prototype.route = function () {
            //console.log(this.panning);
            this.panner = createPanner();
            this.panner.setPosition(this.panPosition || 0);
            this.source.connect(this.panner.node);
            this.panner.node.connect(this.output);
        };

        SampleSustainReleasePanning = createClass(Sample, function (config) {
            this.release = true;

            this.sustainStart = config.sustain_start / 1000;
            this.sustainEnd = config.sustain_end / 1000;
            this.releaseDuration = config.release_duration / 1000;
            this.releaseEnvelope = config.release_envelope;
            if (this.releaseEnvelope === undefined) {
                this.releaseEnvelope = 'equal power';
            } else if (typeString(this.releaseEnvelope) === 'array') {
                this.releaseEnvelopeArray = config.release_envelope_array;
                this.releaseEnvelope = 'array';
            }
            this.panPosition = config.panPosition;
        });


        SampleSustainReleasePanning.prototype.route = function () {
            this.source.loop = true;
            this.source.loopStart = this.sustainStart;
            this.source.loopEnd = this.sustainEnd;

            this.panner = createPanner();
            this.panner.setPosition(this.panPosition || 0);
            this.source.connect(this.panner.node);
            this.panner.node.connect(this.output);
        };


        SampleSynth = createClass(Sample, function (config) {
            this.release = true;
            this.panPosition = 0;
            this.autopan = config.autopan || false;
            this.frequency = config.event.frequency;
            this.waveForm = config.wave_form || 0;//'sine';
            this.releaseDuration = config.release_duration / 1000 || 1.5;
            this.releaseEnvelope = config.release_envelope || 'equal power';
            //console.log(config);
        });

        SampleSynth.prototype.createSource = function () {
            this.source = context.createOscillator();
            this.source.type = this.waveForm;
            this.source.frequency.value = this.frequency;
        };

        SampleSynth.prototype.route = function () {
            //create some headroom for multi-timbrality
            this.volume *= 0.3;
            this.output.gain.value = this.volume;

            if (this.autopan) {
                this.panner = createPanner();
                this.panner.setPosition(0);
                this.source.connect(this.panner.node);
                this.panner.node.connect(this.output);
            } else {
                //alert(this.source + ':' + this.output.gain.value);
                this.source.connect(this.output);
            }
        };
/*
        SampleSynth.prototype.createSource = function(){
            this.autoPanner = context.createOscillator();
            this.autoPanner.type = 0;
            this.autoPanner.frequency.value = 50;


            var tmp = context.createScriptProcessor(256,1,1);
            tmp.onaudioprocess = function(e){
                console.log(e.inputBuffer.getChannelData(0)[0]);
            };
            this.autoPanner.connect(tmp);
            tmp.connect(context.destination);

            this.source = context.createOscillator();
            this.source.type = this.waveForm;
            this.source.frequency.value = this.frequency;
        };

        SampleSynth.prototype.route = function(){
            this.panner = createPanner();
            this.panner.setPosition(0);
            this.source.connect(this.panner.node);
            this.panner.node.connect(this.output);
            this.autoPanner.start();

            //create some headroom for multi-timbrality
            this.volume *= 0.3;
            this.output.gain.value = this.volume;
        };
*/
    });
}
