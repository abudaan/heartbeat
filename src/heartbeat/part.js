function part() {

    'use strict';

    var
        //import
        createMidiNote, // → defined in midi_note.js
        createMidiEvent, // → defined in midi_event.js
        copyName, // → defined in utils.js
        typeString, // → defined in utils.js

        findEvent, // → defined in find_event.js
        findNote, // → defined in find_event.js
        getStats, // → defined in event_statistics.js

        //private
        getEvent,
        addEvents,
        moveEvents,
        removeEvents,
        transposeEvents,
        getEventsAndConfig,

        reverseByPitch,
        reverseByTicks,

        partId = 0,

        //public/protected
        Part;


    Part = function (name) {
        this.className = 'Part';
        this.id = 'P' + partId++ + '' + new Date().getTime();
        this.partIndex = partId;
        this.name = name || this.id;

        this.events = [];
        this.eventsById = {};
        this.numEvents = 0;

        this.notes = [];
        this.notesById = {};
        this.numNotes = 0;

        this.dirtyEvents = {};
        this.dirtyNotes = {};

        this.song = undefined;
        this.autoSize = 'right'; // 'right' or 'both'

        this.ticks = 0;
        this.millis = 0;
        this.start = {
            ticks: this.ticks,
            millis: this.millis
        };
        this.end = {
            ticks: 0,
            millis: 0
        };
        this.duration = {
            ticks: 0,
            millis: 0
        };
        this.startPosition = undefined;
        this.endPosition = undefined;

        //this.fixedPitch = false;
        this.needsUpdate = false;
        this.state = 'clean';
        this.mute = false;
        this.solo = false;
        this.keepWhenEmpty = true; // if set to false, the parts gets deleted automatically if it contains no events
    };

    getEventsAndConfig = function (args, part) {

        args = Array.prototype.slice.call(args);

        var
            j = 0,
            i = 0,
            maxi,
            e,
            arg,
            arg0 = args[0],
            events = [],
            config = [];

        //console.log(args, arg0);

        if (typeString(arg0) === 'array') {

            for (i = arg0.length - 1; i >= 0; i--) {
                arg = arg0[i];
                e = getEvent(arg, part);
                if (e) {
                    events.push(e);
                }
            }
            j = events.length === 0 ? 0 : 1;
        }

        maxi = args.length;
        for (i = j; i < maxi; i++) {
            arg = args[i];
            e = getEvent(arg, part);
            if (e) {
                events.push(e);
            } else {
                config.push(arg);
            }
        }

        if (events.length === 0) {
            //console.error('Please provide one or more events, event ids, event indices, or an array of events, events ids, event indices');
            if (sequencer.debug) {
                console.warn('no events added', part.name);
            }
            return false;
        }

        if (config.length === 1 && typeString(config[0]) === 'array') {
            config = config[0];
        }

        //console.log(events, config);

        return {
            events: events,
            config: config
        };
    };



    getEvent = function (data, part) {
        var event = false;
        if (!data) {
            event = false;
        } else if (data.className === 'MidiEvent' || data.className === 'AudioEvent') {
            // new event
            event = data;
        } else if (typeString(data) === 'array' && data.length === 4) {
            // new event as array
            event = createMidiEvent(data);
        } else if (typeString(data) === 'string') {
            // get by id
            event = part.eventsById[data];
        } else if (isNaN(data) === false) {
            // get by index
            event = part.events[data];
        }
        return event;
    };



    addEvents = function (args, part, relative) {
        if (args === false) {
            return;
        }
        var i, e,
            newEvents = args.events,
            ticks = part.ticks,
            maxi = newEvents.length,
            track = part.track,
            eventsById = part.eventsById;

        //console.log(newEvents);

        //for(i = newEvents.length - 1; i >=0; i--){
        for (i = 0; i < maxi; i++) {

            e = newEvents[i];

            if (e.type === sequencer.END_OF_TRACK || (e.className !== 'MidiEvent' && e.className !== 'AudioEvent')) {
                continue;
            }
            if (e.className === 'AudioEvent' && part.hasAudioEvents !== true) {
                part.hasAudioEvents = true;
            }

            if (e.part !== undefined) {
                //console.warn('this event has already been added to part', e.part.id, ', adding a copy to', part.id);
                e = e.clone();
            }

            e.part = part;
            e.partId = part.id;

            if (relative) {
                ticks += e.ticks;
                e.ticks = ticks;
            }

            e.track = track;
            e.trackId = track ? track.id : undefined;

            e.song = undefined;
            if (track !== undefined) {
                e.song = track.song;
            }

            if (e.state !== 'recorded') {
                e.state = 'new';
            }
            eventsById[e.id] = e;
        }

        if (part.state !== 'new') {
            part.state = 'changed';
        }
        part.needsUpdate = true;
    };


    transposeEvents = function (args, part) {
        //if(args === false || part.fixedPitch === true){
        if (args === false) {
            return;
        }
        var i, e,
            events = args.events,
            semi = args.config[0];

        //console.log(semi, args);

        for (i = events.length - 1; i >= 0; i--) {
            e = events[i];
            e.transpose(semi);
            /*
                // moved to midi_event.js
                if(e.state !== 'new'){
                    e.state = 'changed';
                }
            */
            //console.log(e.state);
        }
        //part.needsUpdate = true; -> moved to midi_event.js
        if (part.state !== 'new' && part.track !== undefined) {
            part.state = 'changed';
            part.track.needsUpdate = true;
        }
    };


    moveEvents = function (args, part) {
        if (args === false) {
            return;
        }
        var i, e, newTicks,
            events = args.events,
            ticks = args.config[0];
        //console.log('moveEvents', events, ticks, events.length);
        if (isNaN(ticks)) {
            console.warn('Part.moveEvent(s) -> please provide a number');
            return;
        }

        for (i = events.length - 1; i >= 0; i--) {
            e = events[i];
            newTicks = e.ticks + ticks;

            if (newTicks < 0) {
                newTicks = 0;
            }
            e.ticks = newTicks;

            if (e.state !== 'new') {
                e.state = 'changed';
            }
        }
        part.needsUpdate = true;
        if (part.state !== 'new' && part.track) {
            part.state = 'changed';
            part.track.needsUpdate = true;
        }
    };


    removeEvents = function (tobeRemoved, part) {
        var i, event,
            removed = [];

        //console.log('removeEvents', tobeRemoved);

        for (i = tobeRemoved.length - 1; i >= 0; i--) {
            event = getEvent(tobeRemoved[i], part);
            if (event === false) {
                continue;
            }
            // console.log('removing event', e);
            if (event.part !== part && event.part !== null) {
                console.warn('can\'t remove: this event belongs to part', event.part.id);
                continue;
            }
            event.state = 'removed';
            event.reset();
            removed.push(event);
        }
        if (part.track !== undefined) {
            part.track.needsUpdate = true;
        }
        part.needsUpdate = true;
        return removed;
    };


    reverseByPitch = function (part) {
        var notes = part.notes,
            min = part.lowestNote,
            max = part.highestNote,
            on, off,
            i, note;

        for (i = notes.length - 1; i >= 0; i--) {
            note = notes[i];
            note.setPitch(min + (max - note.number));
            on = note.noteOn;
            off = note.noteOff;
            on.state = 'changed';
            off.state = 'changed';
            note.state = 'changed';
        }
        part.needsUpdate = true;
        if (part.state !== 'new' && part.track) {
            part.state = 'changed';
            part.track.needsUpdate = true;
        }
    };


    reverseByTicks = function (part, durationTicks) {
        var notes = part.notes,
            note, on, off, onTicks, offTicks, i;

        durationTicks = durationTicks || part.duration.ticks;

        for (i = notes.length - 1; i >= 0; i--) {
            note = notes[i];
            on = note.noteOn;
            off = note.noteOff;

            onTicks = durationTicks - off.ticks;
            offTicks = durationTicks - on.ticks;

            on.ticks = onTicks;
            off.ticks = offTicks;
            note.ticks = onTicks;
            //console.log('on', onTicks, 'off', offTicks, note.noteOn.ticks, note.noteOff.ticks);
            on.state = 'changed';
            off.state = 'changed';
            note.state = 'changed';
        }
        part.needsUpdate = true;
        if (part.state !== 'new' && part.track) {
            part.state = 'changed';
            part.track.needsUpdate = true;
        }
    };


    Part.prototype.addEvent = Part.prototype.addEvents = function () {//events
        //console.log(arguments);
        var args = getEventsAndConfig(arguments, this);
        //console.log(args.events, args.config);
        addEvents(args, this, false);
    };


    Part.prototype.addEventsRelative = function () {//events
        var args = getEventsAndConfig(arguments, this);
        addEvents(args, this, true);
    };


    Part.prototype.removeEvent = Part.prototype.removeEvents = function () {//events
        var args = getEventsAndConfig(arguments, this);
        if (args === false) {
            return false;
        }
        return removeEvents(args.events, this);
    };


    Part.prototype.moveEvent = Part.prototype.moveEvents = function () {//events, ticks
        var args = getEventsAndConfig(arguments, this);
        //console.log(args)
        moveEvents(args, this);
    };

    Part.prototype.moveAllEvents = function (ticks) {//events, ticks
        //console.log(args)
        moveEvents({ events: this.events, config: [ticks] }, this);
    };


    Part.prototype.moveNote = function (note, ticks) {
        moveEvents({ events: [note.noteOn, note.noteOff], config: [ticks] }, this);
    };


    Part.prototype.transposeEvents = function () {//events, semi
        var args = getEventsAndConfig(arguments, this);
        transposeEvents(args, this);
    };


    Part.prototype.transposeAllEvents = function (semi) {
        //console.log('transposeAllEvents', semi);
        transposeEvents({ events: this.events, config: [semi] }, this);
    };


    Part.prototype.transposeNote = function (note, semi) {
        //console.log('transposeNote', semi);
        transposeEvents({ events: [note.noteOn, note.noteOff], config: [semi] }, this);
    };
    /*
        Part.prototype.setNotePitch = function(note, pitch){
            note.setPitch(pitch);
        };
    */

    Part.prototype.reverseByTicks = function (duration) {
        if (this.needsUpdate) {
            this.update();
        }
        reverseByTicks(this, duration);
    };


    Part.prototype.reverseByPitch = function () {
        if (this.needsUpdate) {
            this.update();
        }
        reverseByPitch(this);
    };


    Part.prototype.findEvents = function (pattern) {
        return findEvent(this, pattern);
    };


    Part.prototype.findNotes = function (pattern) {
        return findNote(this, pattern);
    };


    Part.prototype.getStats = function (pattern) {
        return getStats(this, pattern);
    };


    Part.prototype.getIndex = function () {
        var parts, part, i;

        if (this.track) {
            parts = this.track.parts;

            for (i = this.track.numParts - 1; i >= 0; i--) {
                part = parts[i];
                if (part.id === this.id) {
                    return i;
                }
            }
        }
        return -1;
    };


    Part.prototype.copy = function () {
        var part = new Part(copyName(this.name)),
            partTicks = this.ticks,
            eventsById = this.eventsById,
            copies = [],
            copy, id, event;
        //console.log('Part.copy', events);

        part.song = undefined;
        part.track = undefined;
        part.trackId = undefined;

        for (id in eventsById) {
            if (eventsById.hasOwnProperty(id)) {
                event = eventsById[id];
                copy = event.copy();
                //console.log(copy.ticks, partTicks);
                copy.ticks = copy.ticks - partTicks;
                copies.push(copy);
            }
        }
        part.addEvents(copies);
        return part;
    };

    Part.prototype.setSolo = function (flag) {
        if (flag === undefined) {
            flag = !this.solo;
        }
        this.mute = false;
        this.solo = flag;
        // stop all sounds here
        this.allNotesOff();
        if (this.track) {
            this.track.setPartSolo(this, flag);
        }
        //console.log(this.solo, this.mute);
    };


    Part.prototype.allNotesOff = function () {
        if (this.track === undefined) {
            return;
        }
        this.track.instrument.allNotesOffPart(this.id);
    };


    // called by Track if a part gets removed from a track
    Part.prototype.reset = function (fromTrack, fromSong) {
        var eventsById = this.eventsById,
            id, event;

        if (fromSong) {
            this.song = undefined;
        }
        if (fromTrack) {
            this.track = undefined;
        }
        this.trackId = undefined;
        this.start.millis = undefined;
        this.end.millis = undefined;

        for (id in eventsById) {
            if (eventsById.hasOwnProperty(id)) {
                event = eventsById[id];
                event.ticks -= this.ticks;
                event.reset(false, fromTrack, fromSong);
                //event.state = 'removed';
            }
        }
        this.ticks = 0;
        this.needsUpdate = true;
    };


    Part.prototype.update = function () {
        //console.log('part update');

        var i, maxi, j, maxj, id, event, noteNumber, note, onEvents, onEvent,
            firstEvent, lastEvent, stats,
            noteOnEvents = [],
            notes = [],
            numNotes = 0,
            part = this,
            partId = this.id,
            track = this.track,
            trackId = this.track ? this.track.id : undefined;

        // if(!trackId){
        //     console.log(this, 'does not belong to a track anymore');
        // }

        //console.log('Part.update()', this.state, this.eventsById);

        this.events = [];

        for (id in this.eventsById) {
            if (this.eventsById.hasOwnProperty(id)) {
                event = this.eventsById[id];
                //console.log(event);
                if (event.state !== 'clean') {
                    //console.log(event.state);
                    this.dirtyEvents[event.id] = event;
                }

                if (event.state !== 'removed') {
                    this.events.push(event);
                }
            }
        }

        this.events.sort(function (a, b) {
            return a.sortIndex - b.sortIndex;
        });


        for (i = 0, maxi = this.notes.length; i < maxi; i++) {
            note = this.notes[i];
            //console.log(note.noteOn.state);
            if (note.noteOn.state === 'removed' || (note.noteOff !== undefined && note.noteOff.state === 'removed')) {
                note.state = 'removed';
                this.dirtyNotes[note.id] = note;
                delete this.notesById[note.id];
            } else if (note.noteOn.state === 'changed' || (note.noteOff !== undefined && note.noteOff.state === 'changed')) {
                note.state = 'changed';
                this.dirtyNotes[note.id] = note;
            }
        }

        //console.log('part', this.events.length);

        for (i = 0, maxi = this.events.length; i < maxi; i++) {
            event = this.events[i];
            noteNumber = event.noteNumber;

            if (event.type === sequencer.NOTE_ON) {
                if (event.midiNote === undefined) {

                    /*
                    if(noteOnEvents[noteNumber] === undefined){
                        noteOnEvents[noteNumber] = [];
                    }
                    noteOnEvents[noteNumber].push(event);
                    */


                    //console.log(i, 'NOTE_ON', event.eventNumber, noteNumber, noteOnEvents[noteNumber]);
                    note = createMidiNote(event);
                    note.part = part;
                    note.partId = partId;
                    note.track = track;
                    note.trackId = trackId;
                    note.state = 'new';
                    this.notesById[note.id] = note;
                    this.dirtyNotes[note.id] = note;
                    if (notes[noteNumber] === undefined) {
                        notes[noteNumber] = [];
                    }
                    notes[noteNumber].push(note);
                    //console.log('create note:', note.id, 'for:', noteNumber, 'ticks:', event.ticks);
                }
            } else if (event.type === sequencer.NOTE_OFF) {
                //console.log(event.midiNote);
                if (event.midiNote === undefined) {
                    if (notes[noteNumber] === undefined) {
                        //console.log('no note!', noteNumber);
                        continue;
                    }

                    var l = notes[noteNumber].length - 1;
                    note = notes[noteNumber][l];
                    if (note.noteOff !== undefined && note.durationTicks > 0) {
                        //console.log('has already a note off event!', noteNumber, note.durationTicks, note.noteOff.ticks, event.ticks);
                        continue;
                    }
                    /*
                                        // get the lastly added note
                                        var l = notes[noteNumber].length - 1;
                                        var t = 0;
                                        note = null;
                    
                                        while(t <= l){
                                            note = notes[noteNumber][t];
                                            if(note.noteOff === undefined){
                                                break;
                                            }
                                            t++
                                        }
                    */
                    if (note === null) {
                        continue;
                    }

                    //console.log('add note off to note:', note.id, 'for:', noteNumber, 'ticks:', event.ticks, 'num note on:', l, 'index:', t);
                    if (note.noteOn === undefined) {
                        //console.log('no NOTE ON');
                        continue;
                    }
                    if (note.state !== 'new') {
                        note.state = 'changed';
                    }
                    this.dirtyNotes[note.id] = note;
                    note.addNoteOff(event);


                    /*
                    onEvents = noteOnEvents[noteNumber];
                    if(onEvents){
                        onEvent = onEvents.shift();
                        //console.log(note.midiNote);
                        if(onEvent && onEvent.midiNote){
                            note = onEvent.midiNote;
                            if(note.state !== 'new'){
                                note.state = 'changed';
                            }
                            this.dirtyNotes[note.id] = note;
                            if(event.ticks - note.noteOn.ticks === 0){
                                console.log(note.noteOn.ticks, event.ticks);
                                note.adjusted = true;
                                //event.ticks += 120;
                            }
                            note.addNoteOff(event);
                            //console.log(i, 'NOTE_OFF', event.midiNote);
                        }
                    }else{
                        maxj = this.notes.length;
                        for(j = maxj - 1; j >= 0; j--){
                            note = this.notes[j];
                            if(note.number === event.noteNumber){
                                note.state = 'changed';
                                note.addNoteOff(event);
                                this.dirtyNotes[note.id] = note;
                                //console.log(note.id);
                                break;
                            }
                        }
                    }
                    */

                } else if (this.notesById[event.midiNote.id] === undefined) {
                    //console.log('not here');
                    // note is recorded and has already a duration
                    note = event.midiNote;
                    //console.log('recorded notes', note.id);
                    //note.state = 'new';
                    note.part = part;
                    note.partId = partId;
                    note.track = track;
                    note.trackId = trackId;
                    //this.dirtyNotes[note.id] = note;
                    this.notesById[note.id] = note;
                } else {
                    //console.log('certainly not here');
                }
            }
        }

        this.notes = [];
        notes = null;
        for (id in this.notesById) {
            if (this.notesById.hasOwnProperty(id)) {
                note = this.notesById[id];
                this.notes.push(note);
            }
        }

        this.notes.sort(function (a, b) {
            return a.ticks - b.ticks;
        });

        this.numEvents = this.events.length;
        this.numNotes = this.notes.length;

        //console.log(this.numEvents, this.numNotes);

        firstEvent = this.events[0];
        lastEvent = this.events[this.numEvents - 1];

        //console.log(firstEvent.ticks, lastEvent.ticks);

        if (firstEvent) {
            if (firstEvent.ticks < this.ticks) {
                this.autoSize = 'both';
            }

            switch (this.autoSize) {
                case 'right':
                    this.start.ticks = this.ticks;
                    this.end.ticks = lastEvent.ticks;
                    this.duration.ticks = lastEvent.ticks - this.start.ticks;
                    break;
                case 'both':
                    this.start.ticks = firstEvent.ticks;
                    this.end.ticks = lastEvent.ticks;
                    this.duration.ticks = lastEvent.ticks - firstEvent.ticks;
                    break;
            }
        } else {
            // fixing issue #6
            this.start.ticks = this.ticks;
            this.end.ticks = this.ticks + 100; // give the part a minimal duration of 100 ticks
            this.duration.ticks = 100;
        }

        stats = this.getStats('noteNumber all');
        this.lowestNote = stats.min;
        this.highestNote = stats.max;

        this.ticks = this.start.ticks;

        if (this.state === 'clean') {
            //@TODO: check if this is the preferred way of doing it after all, add: part.track.needsUpdate = true;
            //console.log('part sets its own status in update() -> this shouldn\'t happen');
            this.state = 'changed';
        }

        this.needsUpdate = false;
    };

    sequencer.createPart = function () {
        return new Part();
    };


    sequencer.protectedScope.addInitMethod(function () {

        createMidiNote = sequencer.createMidiNote;
        createMidiEvent = sequencer.createMidiEvent;

        copyName = sequencer.protectedScope.copyName;
        typeString = sequencer.protectedScope.typeString;

        findEvent = sequencer.findEvent;
        findNote = sequencer.findNote;
        getStats = sequencer.getStats;
    });

}