(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //import
        createNote, // → defined in note.js
        typeString, // → defined in utils.js
        copyName, // → defined in util.js

        MidiEvent,
        midiEventId = 0;


    /*
        arguments:
        - [ticks, type, data1, data2]
        - ticks, type, data1, data2

        data1 and data2 are optional but must be numbers if provided

    */

    MidiEvent = function(args){
        var data, note;

        this.className =  'MidiEvent';
        this.id = 'M' + midiEventId + new Date().getTime();
        this.eventNumber = midiEventId;
        this.channel = 'any';
        //console.log(midiEventId, this.type, this.id);
        this.isDirty = true;
        this.muted = false;
        //console.log(midiEventId, this.type);
        midiEventId++;

        if(!args){
            // bypass for cloning
            return;
        }

        //console.log('create', args);

        if(typeString(args[0]) === 'midimessageevent'){
            console.log('midimessageevent');
            return;
            //data = [0].concat(args[0].data);
        }else if(typeString(args[0]) === 'array'){
            data = args[0];
        }else if(typeString(args[0]) === 'number' && typeString(args[1]) === 'number'){
            data = [args[0],args[1]];
            if(args.length >= 3 && typeString(args[2]) === 'number'){
                data.push(args[2]);
            }
            if(args.length === 4 && typeString(args[3]) === 'number'){
                data.push(args[3]);
            }
            if(args.length === 5 && typeString(args[4]) === 'number'){
                data.push(args[4]);//channel
            }
        }else{
            console.log('wrong number of arguments, please consult documentation');
            return false;
        }
        //console.log(data);

        this.ticks = data[0];
        this.status = data[1];
        this.type = (this.status >> 4) * 16;
        //console.log(this.type, this.status);
        if(this.type >= 0x80){
            //the higher 4 bits of the status byte is the command
            this.command = this.type;
            //the lower 4 bits of the status byte is the channel number
            this.channel = (this.status & 0xF) + 1; // from zero-based to 1-based
        }else{
            this.type = this.status;
            this.channel = data[4] || 'any';
        }

        //console.log(this.status, this.type, this.channel);

        switch(this.type){
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
                if(this.data2 === 0){
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
/*
        this.className =  'MidiEvent';
        this.id = 'M' + midiEventId + new Date().getTime();
        this.eventNumber = midiEventId;
        //console.log(midiEventId, this.type, this.id);
        this.isDirty = false;
        //console.log(midiEventId, this.type);
        midiEventId++;
        //this.setPosition({});
*/
    };


    MidiEvent.prototype.clone = function(){
        var event = new MidiEvent(),
            property;
        //console.log('clone midi event', this.id, '->', event.id);
        for(property in this){
            if(this.hasOwnProperty(property)){
                if(property !== 'clone' && property !== 'id' && property !== 'eventNumber' && property !== 'midiNote'){
                    event[property] = this[property];
                }
                //event.ticks = 0;
                event.part = undefined;
                event.track = undefined;
                // if(property === 'id'){
                //  //event.id = copyName(this.id);
                //  event.id = 'event_' + midiEventId;
                //  event.eventNumber = midiEventId;
                //  //console.log(midiEventId, this.type);
                //  midiEventId++;
                // }else if(property !== 'clone'){
                //  event[property] = this[property];
                // }
            }
        }
        return event;
    };

    // not sure if this should be added to the public API of MidiEvent
    MidiEvent.prototype.transpose = function(semi){
        if(this.type !== 0x80 && this.type !== 0x90){
            console.error('you can only transpose note on and note off events');
            return;
        }
        //console.log('transpose',semi,this);
        if(typeString(semi) === 'array'){
            //check for semitones or hertz, not urgent
            semi = parseInt(semi[1],10);
        }
        var tmp = this.data1 + semi;
        if(tmp < 0){
            tmp = 0;
        }else if(tmp > 127){
            tmp = 127;
        }
        this.data1 = tmp;
        var note = createNote(this.data1);
        this.note = note;
        this.noteName = note.fullName;
        this.noteNumber = note.number;
        this.octave = note.octave;
        this.frequency = note.frequency;

        if(this.state !== 'new'){
            this.state = 'changed';
        }
        if(this.part !== undefined){
            this.part.needsUpdate = true;
        }
    };


    // not sure if this should be added to the public API of MidiEvent
    MidiEvent.prototype.setPitch = function(pitch){
        if(this.type !== 0x80 && this.type !== 0x90){
            console.error('you can only set the pitch of note on and note off events');
            return;
        }
        if(typeString(pitch) === 'array'){
            //check for note number or hertz, not urgent
            pitch = parseInt(pitch[1],10);
        }

        this.data1 = pitch;
        var note = createNote(this.data1);
        this.note = note;
        this.noteName = note.fullName;
        this.noteNumber = note.number;
        this.octave = note.octave;
        this.frequency = note.frequency;

        if(this.state !== 'new'){
            this.state = 'changed';
        }
        if(this.part !== undefined){
            this.part.needsUpdate = true;
        }
    };

/*
    MidiEvent.prototype.setPosition = function(position){
        this.bpm = this.bpm || position.bpm || -1;
        this.ticks = this.ticks || position.ticks || this.ticks;

        this.millis = position.millis || -1;
        this.seconds = position.seconds || -1;

        this.hour = position.hour || -1;
        this.minute = position.minute || -1;
        this.second = position.second || -1;
        this.millisecond = position.millisecond || -1;
        this.timeAsString = position.timeAsString || -1;
        this.timeAsArray = position.timeAsArray || -1;

        this.bar = position.bar || -1;
        this.beat = position.beat || -1;
        this.sixteenth = position.sixteenth || -1;
        this.tick = position.tick || -1;
        this.barsAsString = position.barsAsString || 'N/A';
        this.barsAsArray = position.barsAsArray || 'N/A';

        if(this.state !== 'new'){
            this.state = 'changed';
        }
        if(this.part !== undefined){
            this.part.needsUpdate = true;
        }
    };
*/

    MidiEvent.prototype.reset = function(fromPart, fromTrack, fromSong){
        fromPart = fromPart === undefined ? true : false;
        fromTrack = fromTrack === undefined ? true : false;
        fromSong = fromSong === undefined ? true : false;
        if(fromPart){
            this.part = undefined;
            this.partId = undefined;
        }
        if(fromTrack){
            this.track = undefined;
            this.trackId = undefined;
            this.channel = 0;
        }
        if(fromSong){
            this.song = undefined;
        }
        //this.setPosition({});
    };



    sequencer.createMidiEvent = function(){
        var args = Array.prototype.slice.call(arguments),
            className = args[0].className;

        if(className === 'MidiEvent'){
            //return args;
            return args[0].clone();
        }
        return new MidiEvent(args);
    };

    sequencer.protectedScope.addInitMethod(function(){
        createNote = sequencer.createNote;
        typeString = sequencer.protectedScope.typeString;
        copyName = sequencer.protectedScope.copyName;
    });

}());