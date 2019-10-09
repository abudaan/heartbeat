function midiNote() {

    'use strict';

    var
        MidiNote,

        //public
        createMidiEvent,

        //protected
        typeString,

        midiNoteId = 0;

    /*
        @params: noteOn event, noteOff event
        @params: start ticks, end ticks, note number, velocity

    */

    MidiNote = function (args) {
        var numArgs = args.length,
            on, off, startTicks, endTicks, noteNumber, velocity;

        //console.log(args);

        if (numArgs === 1) {
            on = args[0];
            if (on === undefined) {
                console.error('please provide at least a note on event');
                return;
            }
            this.noteOn = on;
        } else if (numArgs === 2) {
            on = args[0];
            off = args[1];
            if (on === undefined) {
                console.error('please provide at least a note on event');
                return;
            }
            if (on.className === 'MidiEvent' && off & off.className === 'MidiEvent') {
                if (on.ticks >= off.ticks) {
                    console.error('MidiNote has wrong duration');
                    return;
                }
                this.noteOn = on;
                this.noteOff = off;
            }
        } else if (numArgs === 4) {
            startTicks = args[0];
            endTicks = args[1];
            noteNumber = args[2];
            velocity = args[3];
            if (startTicks && endTicks && startTicks >= endTicks) {
                console.error('MidiNote has wrong duration');
                return;
            }
            if (noteNumber < 0 || noteNumber > 127) {
                console.error('MidiNote has wrong note number');
                return;
            }
            if (velocity < 0 || velocity > 127) {
                console.error('MidiNote has wrong velocity');
                return;
            }
            on = createMidiEvent(startTicks, sequencer.NOTE_ON, noteNumber, velocity);
            if (off) {
                off = createMidiEvent(endTicks, sequencer.NOTE_OFF, noteNumber, 0);
            }
        } else {
            console.error('wrong number of arguments, please consult documentation');
            return;
        }

        on.midiNote = this;
        this.noteOn = on;

        if (off === undefined) {
            this.endless = true;
        } else {
            off.midiNote = this;
            this.endless = false;
            this.noteOff = off;
            this.durationTicks = off.ticks - on.ticks;
            this.durationMillis = off.millis - on.millis;
        }


        this.note = on.note;
        this.number = on.noteNumber;
        this.ticks = on.ticks;
        this.pitch = on.data1;
        this.velocity = on.velocity;
        this.id = 'N' + midiNoteId + new Date().getTime();
        this.name = on.noteName;
        this.className = 'MidiNote';
        this.type = sequencer.MIDI_NOTE;
        midiNoteId++;
    };


    MidiNote.prototype.addNoteOff = function (off) {
        if (this.noteOff !== undefined) {
            console.log(off.ticks, off.noteNumber, this.id, 'override note off event');
            this.noteOff.midiNote = undefined;
        }
        var on = this.noteOn;
        off.midiNote = this;
        this.endless = false;
        this.noteOff = off;
        this.durationTicks = off.ticks - on.ticks;
        this.durationMillis = off.millis - on.millis;
        this.endless = false;
    };

    /*
        MidiNote.prototype.setDuration = function(duration_in_ticks){
            if(duration_in_ticks <= 0){
                console.error('duration of a MidiNote has to be greater then 0');
                return;
            }
            this.noteOff.ticks = this.noteOn.ticks + duration_in_ticks;
            this.durationTicks = this.noteOff.ticks - this.noteOn.ticks;
            //this.durationMillis = this.noteOff.millis - this.noteOn.millis;
            if(this.part){
                this.part.needsUpdate = true;
            }
        };
    */
    /*
        MidiNote.prototype.setEnd = function(ticks){
            this.noteOff.ticks = ticks;
            if(this.part){
                this.part.needsUpdate = true;
            }
        };
    
    
        MidiNote.prototype.setStart = function(ticks){
            this.noteOn.ticks = ticks;
            if(this.part){
                this.part.needsUpdate = true;
            }
        };
    
    
        MidiNote.prototype.setVelocity = function(velocity){
            if(velocity < 0 || velocity > 127){
                return;
            }
            this.velocity = this.noteOn.data1 = this.noteOn.velocity = velocity;
        };
    
    */
    MidiNote.prototype.setPitch = function (pitch) {
        if (pitch < 0 || pitch > 127) {
            return;
        }
        this.noteOn.setPitch(pitch);
        if (this.endless === false) {
            this.noteOff.setPitch(pitch);
        }
        this.number = this.noteOn.noteNumber;
        this.name = this.noteOn.noteName;
        this.pitch = pitch;
    };


    MidiNote.prototype.mute = function (flag) {
        if (flag !== undefined) {
            this.mute = flag;
        } else {
            this.mute = !this.mute;
        }
    };

    sequencer.protectedScope.addInitMethod(function () {
        createMidiEvent = sequencer.createMidiEvent;
        typeString = sequencer.protectedScope.typeString;
    });


    sequencer.createMidiNote = function () {
        return new MidiNote(Array.prototype.slice.call(arguments));
    };

}