function audioEvent() {

    'use strict';

    var
        slice = Array.prototype.slice,

        //import
        typeString, // → defined in utils.js

        AudioEvent,
        audioEventId = 0;


    AudioEvent = function (config) {

        if (config === undefined) {
            // bypass for cloning
            return;
        }

        // use ticks like in MidiEvent
        if (config.ticks === undefined) {
            this.ticks = 0;
        } else {
            this.ticks = config.ticks;
        }


        // provide either buffer (AudioBuffer) or path to a sample in the sequencer.storage object
        this.buffer = config.buffer;
        this.sampleId = config.sampleId;
        this.path = config.path;

        if (this.buffer === undefined && this.path === undefined) {
            if (sequencer.debug >= sequencer.WARN) {
                console.warn('please provide an AudioBuffer or a path to a sample in the sequencer.storage object');
            }
            return;
        }

        if (this.buffer !== undefined && typeString(this.buffer) !== 'audiobuffer') {
            if (sequencer.debug >= sequencer.WARN) {
                console.warn('buffer has to be an AudioBuffer');
            }
            return;
        }

        if (this.path !== undefined) {
            if (typeString(this.path) !== 'string') {
                if (sequencer.debug >= sequencer.WARN) {
                    console.warn('path has to be a String');
                }
                return;
            } else {

                this.sampleId = this.path;
                this.sampleId = this.sampleId.replace(/^\//, '');
                this.sampleId = this.sampleId.replace(/\/$/, '');
                this.sampleId = this.sampleId.split('/');
                this.sampleId = this.sampleId[this.sampleId.length - 1];

                this.buffer = sequencer.getSample(this.path);
                if (this.buffer === false) {
                    if (sequencer.debug >= sequencer.WARN) {
                        console.warn('no sample found at', this.path);
                    }
                    return;
                }
                this.buffer = sequencer.getSample(this.path);
                //console.log(this.sampleId, this.path, this.buffer);
                //console.log(this.buffer);
            }
        }

        // set either durationTicks of durationMillis, or both if they represent the same value
        this.durationTicks = config.durationTicks;
        this.durationMillis = config.durationMillis;

        //console.log(this.durationTicks, this.durationMillis);

        if (this.durationTicks === undefined && this.durationMillis === undefined) {
            this.duration = this.buffer.duration;
            this.durationMillis = this.duration * 1000;
        }
        //console.log(this.durationMillis, this.duration, this.buffer);

        this.muted = false;

        if (config.velocity === undefined) {
            this.velocity = 127;
        } else {
            this.velocity = config.velocity;
        }

        // start of audio, also the quantize point, value in ticks or millis
        this.sampleOffsetTicks = config.sampleOffsetTicks;
        this.sampleOffsetMillis = config.sampleOffsetMillis;

        if (this.sampleOffsetMillis === undefined && this.sampleOffsetTicks === undefined) {
            this.sampleOffsetTicks = 0;
            this.sampleOffsetMillis = 0;
            this.sampleOffset = 0;
        } else if (this.sampleOffsetMillis !== undefined) {
            this.sampleOffset = this.sampleOffsetMillis / 1000;
        }

        this.latencyCompensation = config.latencyCompensation;
        if (this.latencyCompensation === undefined) {
            this.latencyCompensation = 0;
        }

        // if the playhead starts somewhere in the sample, this value will be set by the scheduler
        this.playheadOffset = 0;

        this.className = 'AudioEvent';
        this.time = 0;
        this.type = 'audio';
        this.id = 'A' + audioEventId + new Date().getTime();
    };


    AudioEvent.prototype.update = function () {
        var pos;
        if (this.duration === undefined) {
            pos = this.song.getPosition('ticks', this.ticks + this.durationTicks);
            this.durationMillis = pos.millis - this.millis;
            this.duration = this.durationMillis / 1000;
            //console.log(pos, this.durationMillis);
        } else if (this.durationTicks === undefined) {
            pos = this.song.getPosition('millis', this.millis + this.durationMillis);
            this.durationTicks = pos.ticks - this.ticks;
        }

        if (this.sampleOffset === undefined) {
            pos = this.song.getPosition('ticks', this.ticks + this.sampleOffsetTicks);
            //console.log(pos.barsAsString);
            this.sampleOffsetMillis = pos.millis - this.millis;
            this.sampleOffset = this.sampleOffsetMillis / 1000;
            //console.log(this.sampleOffsetMillis);
        } else if (this.sampleOffsetTicks === undefined) {
            pos = this.song.getPosition('millis', this.millis + this.sampleOffsetMillis);
            this.sampleOffsetTicks = pos.ticks - this.ticks;
        }

        this.endTicks = this.ticks + this.durationTicks;
        this.endMillis = this.millis + this.durationMillis;
    };



    AudioEvent.prototype.stopSample = function (seconds) {
        this.track.audio.stopSample(this, seconds);
    };


    AudioEvent.prototype.setSampleOffset = function (type, value) {
        if (type === 'millis') {
            this.sampleOffsetMillis = value;
            this.sampleOffset = value / 1000;
            this.durationTicks = undefined;
            if (this.song !== undefined) {
                this.update();
            }
        } else if (type === 'ticks') {
            this.sampleOffsetTicks = value;
            this.sampleOffset = undefined;
            this.sampleOffsetMillis = undefined;
            if (this.song !== undefined) {
                this.update();
            }
        } else {
            if (sequencer.debug >= sequencer.WARN) {
                console.warn('you have to provide a type "ticks" or "millis" and a value');
            }
        }
    };


    AudioEvent.prototype.setDuration = function (type, value) {
        if (type === 'millis') {
            this.durationMillis = value;
            this.duration = value / 1000;
            this.durationTicks = undefined;
            if (this.song !== undefined) {
                this.update();
            }
        } else if (type === 'ticks') {
            this.durationTicks = value;
            this.duration = undefined;
            this.durationMillis = undefined;
            if (this.song !== undefined) {
                this.update();
            }
        } else {
            if (sequencer.debug >= sequencer.WARN) {
                console.warn('you have to provide a type "ticks" or "millis" and a value');
            }
        }
    };


    AudioEvent.prototype.clone = AudioEvent.prototype.copy = function () {
        var event = new AudioEvent(),
            property;

        for (property in this) {
            if (this.hasOwnProperty(property)) {
                //console.log(property);
                if (property !== 'id' && property !== 'eventNumber') {
                    event[property] = this[property];
                }
                event.song = undefined;
                event.track = undefined;
                event.trackId = undefined;
                event.part = undefined;
                event.partId = undefined;
            }
        }
        return event;
    };


    // same as MidiEvent, could be inherited from generic Event
    AudioEvent.prototype.reset = function (fromPart, fromTrack, fromSong) {

        fromPart = fromPart === undefined ? true : false;
        fromTrack = fromTrack === undefined ? true : false;
        fromSong = fromSong === undefined ? true : false;

        if (fromPart) {
            this.part = undefined;
            this.partId = undefined;
        }
        if (fromTrack) {
            this.track = undefined;
            this.trackId = undefined;
            this.channel = 0;
        }
        if (fromSong) {
            this.song = undefined;
        }
    };



    // same as MidiEvent, could be inherited from generic Event
    AudioEvent.prototype.move = function (ticks) {
        if (isNaN(ticks)) {
            if (sequencer.debug >= 1) {
                console.error('please provide a number');
            }
            return;
        }
        this.ticks += parseInt(ticks, 10);
        if (this.song !== undefined) {
            this.update();
        }
        if (this.state !== 'new') {
            this.state = 'changed';
        }
        if (this.part !== undefined) {
            this.part.needsUpdate = true;
        }
    };


    // same as MidiEvent, could be inherited from generic Event
    AudioEvent.prototype.moveTo = function () {
        var position = slice.call(arguments);
        //console.log(position);

        if (position[0] === 'ticks' && isNaN(position[1]) === false) {
            this.ticks = parseInt(position[1], 10);
        } else if (this.song === undefined) {
            if (sequencer.debug >= 1) {
                console.error('The audio event has not been added to a song yet; you can only move to ticks values');
            }
        } else {
            position = this.song.getPosition(position);
            if (position === false) {
                if (sequencer.debug >= 1) {
                    console.error('wrong position data');
                }
            } else {
                this.ticks = position.ticks;
            }
        }

        if (this.song !== undefined) {
            this.update();
        }
        if (this.state !== 'new') {
            this.state = 'changed';
        }
        if (this.part !== undefined) {
            this.part.needsUpdate = true;
        }
    };


    sequencer.createAudioEvent = function (config) {
        if (config.className === 'AudioEvent') {
            return config.clone();
        }
        return new AudioEvent(config);
    };


    sequencer.protectedScope.addInitMethod(function () {
        typeString = sequencer.protectedScope.typeString;
    });

}