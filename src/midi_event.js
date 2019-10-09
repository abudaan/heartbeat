function midiEvent() {

    /*
        @public
        @class MidiEvent
        @param time {int} the time that the event is scheduled
        @param type {int} type of MidiEvent, e.g. NOTE_ON, NOTE_OFF or, 144, 128, etc.
        @param data1 {int} if type is 144 or 128: note number
        @param [data2] {int} if type is 144 or 128: velocity


        @example
        // plays the central c at velocity 100
        var event = sequencer.createMidiEvent(120, sequencer.NOTE_ON, 60, 100);

        // pass arguments as array
        var event = sequencer.createMidiEvent([120, sequencer.NOTE_ON, 60, 100]);

        // if you pass a MidiEvent instance a copy/clone will be returned
        var copy = sequencer.createMidiEvent(event);
    */


    'use strict';

    var
        slice = Array.prototype.slice,

        //import
        createNote, // → defined in note.js
        typeString, // → defined in utils.js

        MidiEvent,
        midiEventId = 0;


    /*
       arguments:
       - [ticks, type, data1, data2]
       - ticks, type, data1, data2

       data1 and data2 are optional but must be numbers if provided
    */
    MidiEvent = function (args) {
        var data, note;

        this.className = 'MidiEvent';
        this.id = 'M' + midiEventId + new Date().getTime();
        this.eventNumber = midiEventId;
        this.channel = 'any';
        this.time = 0;
        //this.offset = 0;
        //console.log(midiEventId, this.type, this.id);
        this.muted = false;
        //console.log(midiEventId, this.type);
        midiEventId++;

        if (!args) {
            // bypass for cloning
            return;
        }

        //console.log('create', args);

        if (typeString(args[0]) === 'midimessageevent') {
            console.log('midimessageevent');
            return;
            //data = [0].concat(args[0].data);
        } else if (typeString(args[0]) === 'array') {
            data = args[0];
        } else if (typeString(args[0]) === 'number' && typeString(args[1]) === 'number') {
            data = [args[0], args[1]];
            if (args.length >= 3 && typeString(args[2]) === 'number') {
                data.push(args[2]);
            }
            if (args.length === 4 && typeString(args[3]) === 'number') {
                data.push(args[3]);
            }
            if (args.length === 5 && typeString(args[4]) === 'number') {
                data.push(args[4]);//channel
            }
        } else {
            if (sequencer.debug >= 1) {
                console.error('wrong number of arguments, please consult documentation');
            }
            return false;
        }
        //console.log(data);

        this.ticks = data[0];
        this.status = data[1];
        this.type = (this.status >> 4) * 16;
        //console.log(this.type, this.status);
        if (this.type >= 0x80) {
            //the higher 4 bits of the status byte is the command
            this.command = this.type;
            //the lower 4 bits of the status byte is the channel number
            this.channel = (this.status & 0xF) + 1; // from zero-based to 1-based
        } else {
            this.type = this.status;
            this.channel = data[4] || 'any';
        }

        //this.sortIndex = parseInt(this.type, 10) + parseInt(this.ticks, 10); // note off events come before note on events
        this.sortIndex = this.type + this.ticks; // note off events come before note on events
        //console.log(this.sortIndex);

        //console.log(this.status, this.type, this.channel);

        switch (this.type) {
            case 0x0:
                break;
            case 0x80:
                this.data1 = data[2];
                note = createNote(this.data1);
                this.note = note;
                this.noteName = note.fullName;
                this.noteNumber = note.number;
                this.octave = note.octave;
                this.frequency = note.frequency;
                this.data2 = 0;//data[3];
                this.velocity = this.data2;
                break;
            case 0x90:
                this.data1 = data[2];//note number
                this.data2 = data[3];//velocity
                if (this.data2 === 0) {
                    //if velocity is 0, this is a NOTE OFF event
                    this.type = 0x80;
                }
                note = createNote(this.data1);
                this.note = note;
                this.noteName = note.fullName;
                this.noteNumber = note.number;
                this.octave = note.octave;
                this.frequency = note.frequency;
                this.velocity = this.data2;
                //console.log(data[2], this.note);
                break;
            case 0x51:
                this.bpm = data[2];
                break;
            case 0x58:
                this.nominator = data[2];
                this.denominator = data[3];
                break;
            case 0xB0:// control change
                this.data1 = data[2];
                this.data2 = data[3];
                this.controllerType = data[2];
                this.controllerValue = data[3];
                break;
            case 0xC0:// program change
                this.data1 = data[2];
                this.programNumber = data[2];
                break;
            case 0xD0:// channel pressure
                this.data1 = data[2];
                this.data2 = data[3];
                break;
            case 0xE0:// pitch bend
                this.data1 = data[2];
                this.data2 = data[3];
                //console.log('pitch bend');
                break;
            case 0x2F:
                break;
            default:
                console.warn('not a recognized type of midi event!');
        }
    };

    /**
        Creates a copy of the MidiEvent
        @memberof MidiEvent
        @function clone
        @instance
    */
    MidiEvent.prototype.clone = MidiEvent.prototype.copy = function () {
        var event = new MidiEvent(),
            property;

        for (property in this) {
            if (this.hasOwnProperty(property)) {
                //console.log(property);
                if (property !== 'id' && property !== 'eventNumber' && property !== 'midiNote') {
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


    /**
    *  Transposes the MidiEvent by the provided number of semitones
    *  @param {int} semi
    */
    MidiEvent.prototype.transpose = function (semi) {
        if (this.type !== 0x80 && this.type !== 0x90) {
            if (sequencer.debug >= 1) {
                console.error('you can only transpose note on and note off events');
            }
            return;
        }

        //console.log('transpose', semi);
        if (typeString(semi) === 'array') {
            var type = semi[0];
            if (type === 'hertz') {
                //convert hertz to semi
            } else if (type === 'semi' || type === 'semitone') {
                semi = semi[1];
            }
        } else if (isNaN(semi) === true) {
            if (sequencer.debug >= 1) {
                console.error('please provide a number');
            }
            return;
        }

        var tmp = this.data1 + parseInt(semi, 10);
        if (tmp < 0) {
            tmp = 0;
        } else if (tmp > 127) {
            tmp = 127;
        }
        this.data1 = tmp;
        var note = createNote(this.data1);
        this.note = note;
        this.noteName = note.fullName;
        this.noteNumber = note.number;
        this.octave = note.octave;
        this.frequency = note.frequency;

        if (this.midiNote !== undefined) {
            this.midiNote.pitch = this.data1;
        }

        if (this.state !== 'new') {
            this.state = 'changed';
        }
        if (this.part !== undefined) {
            this.part.needsUpdate = true;
        }
    };


    MidiEvent.prototype.setPitch = function (pitch) {
        if (this.type !== 0x80 && this.type !== 0x90) {
            if (sequencer.debug >= 1) {
                console.error('you can only set the pitch of note on and note off events');
            }
            return;
        }
        if (typeString(pitch) === 'array') {
            var type = pitch[0];
            if (type === 'hertz') {
                //convert hertz to pitch
            } else if (type === 'semi' || type === 'semitone') {
                pitch = pitch[1];
            }
        } else if (isNaN(pitch) === true) {
            if (sequencer.debug >= 1) {
                console.error('please provide a number');
            }
            return;
        }

        this.data1 = parseInt(pitch, 10);
        var note = createNote(this.data1);
        this.note = note;
        this.noteName = note.fullName;
        this.noteNumber = note.number;
        this.octave = note.octave;
        this.frequency = note.frequency;

        if (this.midiNote !== undefined) {
            this.midiNote.pitch = this.data1;
        }
        if (this.state !== 'new') {
            this.state = 'changed';
        }
        if (this.part !== undefined) {
            this.part.needsUpdate = true;
        }
    };


    MidiEvent.prototype.move = function (ticks) {
        if (isNaN(ticks)) {
            if (sequencer.debug >= 1) {
                console.error('please provide a number');
            }
            return;
        }
        this.ticks += parseInt(ticks, 10);
        if (this.state !== 'new') {
            this.state = 'changed';
        }
        if (this.part !== undefined) {
            this.part.needsUpdate = true;
        }
    };


    MidiEvent.prototype.moveTo = function () {
        var position = slice.call(arguments);
        //console.log(position);

        if (position[0] === 'ticks' && isNaN(position[1]) === false) {
            this.ticks = parseInt(position[1], 10);
        } else if (this.song === undefined) {
            if (sequencer.debug >= 1) {
                console.error('The midi event has not been added to a song yet; you can only move to ticks values');
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

        if (this.state !== 'new') {
            this.state = 'changed';
        }
        if (this.part !== undefined) {
            this.part.needsUpdate = true;
        }
    };


    MidiEvent.prototype.reset = function (fromPart, fromTrack, fromSong) {

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


    // implemented because of the common interface of midi and audio events
    MidiEvent.prototype.update = function () {
    };


    /**@exports sequencer*/
    sequencer.createMidiEvent = function () {
        /**
            @function createMidiEvent
            @param time {int}
            @param type {int}
            @param data1 {int}
            @param data2 {int}
        */
        var args = slice.call(arguments),
            className = args[0].className;

        if (className === 'MidiEvent') {
            return args[0].copy();
        }
        return new MidiEvent(args);
    };


    sequencer.protectedScope.addInitMethod(function () {
        createNote = sequencer.createNote;
        typeString = sequencer.protectedScope.typeString;
    });

}