function playhead() {

    'use strict';
    var
        instanceId = 0,
        range = 10,

        debug,

        Playhead,

        //import
        getPosition2, // → defined in position.js
        objectForEach; // → defined in util.js


    Playhead = function (song, type, name, data) {
        this.id = 'POS' + instanceId++ + '' + new Date().getTime();
        //console.log(name);
        this.song = song;
        this.type = type || '';
        this.name = name || this.id;
        this.data = data || {};
        this.lastEvent = undefined;

        this.activeParts = [];
        this.activeNotes = [];
        this.activeEvents = [];
    };


    Playhead.prototype.set = function (u, v) {
        //console.log(this.name, 'set', u, v);
        this.unit = u;
        this.currentValue = v;
        this.eventIndex = 0;
        this.noteIndex = 0;
        this.partIndex = 0;
        this.calculate();
        return this.data;
    };


    Playhead.prototype.get = function () {
        return this.data;
    };


    Playhead.prototype.update = function (u, diff) {
        //console.log(this.name, 'update', u, diff);
        if (diff === 0) {
            return this.data;
        }
        this.unit = u;
        this.currentValue += diff;
        this.calculate();
        return this.data;
    };


    Playhead.prototype.updateSong = function () {
        this.events = this.song.eventsMidiTime;
        this.numEvents = this.events.length;
        this.notes = this.song.notes;
        this.numNotes = this.song.numNotes;
        this.parts = this.song.parts;
        this.numParts = this.song.numParts;

        this.set('millis', this.song.millis || 0);
    };


    Playhead.prototype.setType = function (t) {
        this.type = t;
        this.set(this.unit, this.currentValue);
        //console.log(type,activeParts);
    };


    Playhead.prototype.addType = function (t) {
        this.type += ' ' + t;
        this.set(this.unit, this.currentValue);
        //console.log(type,activeParts);
    };


    Playhead.prototype.removeType = function (t) {
        var arr = this.type.split(' ');
        this.type = '';
        arr.forEach(function (type) {
            if (type !== t) {
                this.type += t + ' ';
            }
        });
        this.type.trim();
        this.set(this.currentValue);
        //console.log(type,activeParts);
    };


    Playhead.prototype.calculate = function () {
        var
            i,
            event,
            note,
            part,
            position,
            newParts = [],
            stillActiveNotes = [],
            stillActiveEvents = [],
            collectedParts = [],
            collectedNotes = [],
            collectedEvents = [];

        for (i = this.eventIndex; i < this.numEvents; i++) {
            event = this.events[i];
            //console.log(event);
            //event.mute = event.mute || event.part.mute || event.track.mute;
            if (event[this.unit] <= this.currentValue) {
                //console.log(event[this.unit], this.currentValue, event.type)
                //if(event.mute === false && event.type !== sequencer.MIDI_NOTE && event.type !== sequencer.DUMMY_EVENT){
                if (event.type !== sequencer.MIDI_NOTE && event.type !== sequencer.DUMMY_EVENT) {
                    //console.log(event.mute, event.part.mute, event.track.mute);
                    collectedEvents.push(event);
                }
                this.lastEvent = event;
                this.eventIndex++;
            } else {
                break;
            }
        }

        // if a song has no events yet, use the first time event as reference
        if (this.lastEvent === undefined) {
            this.lastEvent = this.song.timeEvents[0];
        }

        position = getPosition2(this.song, this.unit, this.currentValue, 'all', this.lastEvent);
        this.data.eventIndex = this.eventIndex;
        this.data.millis = position.millis;
        this.data.ticks = position.ticks;

        //console.log('millis:', position.millis, 'ticks:', position.ticks, this.unit, ':', this.currentValue);
        // if(this.name === 'iterators'){
        //     console.log('nominator:', position.nominator, 'ticks:', position.ticks, this.unit, ':', this.currentValue);
        // }

        if (this.type.indexOf('all') !== -1) {
            var data = this.data;
            objectForEach(position, function (value, key) {
                data[key] = value;
            });
        } else if (this.type.indexOf('barsbeats') !== -1) {
            this.data.bar = position.bar;
            this.data.beat = position.beat;
            this.data.sixteenth = position.sixteenth;
            this.data.tick = position.tick;
            this.data.barsAsString = position.barsAsString;

            this.data.ticksPerBar = position.ticksPerBar;
            this.data.ticksPerBeat = position.ticksPerBeat;
            this.data.ticksPerSixteenth = position.ticksPerSixteenth;
            this.data.numSixteenth = position.numSixteenth;
        } else if (this.type.indexOf('time') !== -1) {
            this.data.hour = position.hour;
            this.data.minute = position.minute;
            this.data.second = position.second;
            this.data.millisecond = position.millisecond;
            this.data.timeAsString = position.timeAsString;
        } else if (this.type.indexOf('percentage') !== -1) {
            this.data.percentage = position.percentage;
        }

        if (this.type.indexOf('events') !== -1 || this.type.indexOf('all') !== -1) {

            this.collectedEvents = collectedEvents;

            for (i = this.activeEvents.length - 1; i >= 0; i--) {
                event = this.activeEvents[i];

                // skip the tempo and time signature events
                if (event.type === 0x51 || event.type === 0x58) {
                    continue;
                }
                //event.mute = event.mute || event.part.mute || event.track.mute;
                /*
                if(event.mute === true){
                    //console.log('skipping muted event', event.id);
                    continue;
                }
                */
                if (event.state.indexOf('removed') === 0 || this.song.eventsById[event.id] === undefined) {
                    //console.log('skipping removed event', event.id);
                    continue;
                }

                if (event[this.unit] <= this.currentValue && event[this.unit] > this.currentValue - range) {
                    stillActiveEvents.push(event);
                }
            }

            this.activeEvents = [].concat(stillActiveEvents);

            // find and add new active events
            for (i = collectedEvents.length - 1; i >= 0; i--) {
                event = collectedEvents[i];
                //console.log(event.mute);
                if (event[this.unit] > this.currentValue - range) {
                    this.activeEvents.push(event);
                }
            }

            this.song.activeEvents = {};

            for (i = this.activeEvents.length - 1; i >= 0; i--) {
                event = this.activeEvents[i];
                //console.log('active', event);
                this.song.activeEvents[event.id] = event;
            }
        }


        if (this.type.indexOf('notes') !== -1 || this.type.indexOf('all') !== -1) {

            // get all events between the noteIndex and the current playhead position
            for (i = this.noteIndex; i < this.numNotes; i++) {
                note = this.notes[i];
                if (note.noteOn[this.unit] <= this.currentValue) {
                    //note.mute = note.noteOn.mute || note.noteOff.mute;
                    //if(note.mute === false){
                    collectedNotes.push(note);
                    //}
                    this.noteIndex++;
                } else {
                    break;
                }
            }


            // filter notes that are no longer active
            for (i = this.activeNotes.length - 1; i >= 0; i--) {
                note = this.activeNotes[i];
                //note.mute = note.noteOn.mute || note.noteOff.mute;
                //if(note.mute){
                //    continue;
                //}
                if (note.noteOn.state.indexOf('removed') === 0 || this.song.notesById[note.id] === undefined) {
                    //console.log('skipping removed note', note.id);
                    continue;
                }

                if (note.noteOff === undefined) {
                    if (sequencer.debug) {
                        console.warn('note with id', note.id, 'has no noteOff event', note.noteOn.track.name);
                    }
                    continue;
                }

                if (note.noteOn[this.unit] <= this.currentValue && note.noteOff[this.unit] > this.currentValue) {
                    //note.active = true;
                    stillActiveNotes.push(note);
                } else {
                    //note.active = false;

                    //@TODO: do something here to unschedule notes
                }
            }


            // add the still active notes back to the active notes array
            this.activeNotes = [].concat(stillActiveNotes);


            // find and add new active notes
            for (i = collectedNotes.length - 1; i >= 0; i--) {
                note = collectedNotes[i];

                if (note.noteOff === undefined) {
                    if (sequencer.debug) {
                        console.warn('note with id', note.id, 'has no noteOff event', note.noteOn.track.name);
                    }
                    continue;
                }

                if (note.noteOff[this.unit] > this.currentValue) {
                    this.activeNotes.push(note);
                    //note.active = true;
                } else {
                    //note.active = false;
                }
            }

            this.song.activeNotes = {};

            for (i = this.activeNotes.length - 1; i >= 0; i--) {
                note = this.activeNotes[i];
                //console.log('active', note);
                this.song.activeNotes[note.id] = note;
            }
        }



        // get active parts
        if (this.type.indexOf('parts') !== -1 || this.type.indexOf('all') !== -1) {


            for (i = this.partIndex; i < this.numParts; i++) {
                part = this.parts[i];
                //console.log(part, this.unit, this.currentValue);
                if (part.start[this.unit] <= this.currentValue) {// && part.end[this.unit] > this.currentValue){
                    //part.mute = part.mute || part.track.mute;
                    //if(part.mute === false){
                    collectedParts.push(part);
                    //}
                    this.partIndex++;
                } else {
                    break;
                }
            }

            // filter existing active parts
            for (i = this.activeParts.length - 1; i >= 0; i--) {
                part = this.activeParts[i];
                //part.mute = part.mute || part.track.mute;
                //if(part.mute){
                //    continue;
                //}
                if (part.start[this.unit] <= this.currentValue && part.end[this.unit] > this.currentValue) {
                    newParts.push(part);
                }
            }

            this.activeParts = [].concat(newParts);

            for (i = collectedParts.length - 1; i >= 0; i--) {
                part = collectedParts[i];
                if (part.end[this.unit] > this.currentValue) {
                    this.activeParts.push(part);
                }
            }

            this.song.activeParts = {};
            for (i = this.activeParts.length - 1; i >= 0; i--) {
                part = this.activeParts[i];
                //console.log('active part', part);
                this.song.activeParts[part.id] = part;
            }
        }

        if (this.busy === true) {
            this.busy = false;
        }
    };


    sequencer.protectedScope.createPlayhead = function (song, type, name, data) {
        return new Playhead(song, type, name, data);
    };


    sequencer.protectedScope.addInitMethod(function () {
        getPosition2 = sequencer.protectedScope.getPosition2;
        objectForEach = sequencer.protectedScope.objectForEach;
        debug = sequencer.debug;
    });

}