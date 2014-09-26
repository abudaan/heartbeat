    (function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        typeString, // defined in util.js
        objectForEach, // defined in util.js

        // the amount of time in millis that events are scheduled ahead relative to the current playhead position, defined in open_module.js
        bufferTime = sequencer.bufferTime * 1000,

        called,

        Scheduler;


    Scheduler = function(song){
        this.song = song;
        this.looped = false;
        this.notes = {};
    };


    Scheduler.prototype.updateSong = function(){
        this.events = this.song.songAndMetronomeEvents;
        this.numEvents = this.events.length;
        this.index = 0;
        this.notes = {};
        this.setIndex(this.song.millis);
        this.looped = false;
        //console.log('Scheduler.setIndex', this.index, this.numEvents, this.instruments);
    };


    Scheduler.prototype.setIndex = function(millis){
        var i;
        for(i = 0; i < this.numEvents; i++){
            if(this.events[i].millis >= millis){
                this.index = i;
                break;
            }
        }
        called = 0;
    };


    Scheduler.prototype.getEvents = function(){
        var i, event, events = [], note, noteOn, noteOff, endMillis, endTicks, diff, buffertime;

        // if we approach the loop point, we schedule a whole buffer of events at the start of the loop and then start
        // to schedule again after the song position has reached the loop end point. at that time, the value of this.looped
        // will be set to false again so the scheduler can continue to schedule events
/*
        if(this.looped === true){
            //console.log('bypass');
            return events;
        }
*/
        //console.log(this.song.millis, maxtime, this.index);
        //console.log(this.song.millis < this.song.loopEnd);
        //console.log(this.song.millis, maxtime);

        buffertime = sequencer.bufferTime * 1000;
        if(this.song.doLoop === true && this.song.loopDuration < buffertime){
            this.maxtime = this.songMillis + this.song.loopDuration - 1;
            //console.log(maxtime, this.song.loopDuration);
        }

        if(this.song.doLoop === true){

            if(this.maxtime >= this.song.loopEnd){

                diff = this.maxtime - this.song.loopEnd;
                this.maxtime = this.song.loopStart + diff;

                //console.log(maxtime, this.song.loopEnd, diff);

                if(this.looped === false){
                    //console.log(this.song.millis, maxtime, diff);
                    this.looped = true;
                    //console.log('LOOP', this.song.loopEnd, maxtime);
                    for(i = this.index; i < this.numEvents; i++){
                        event = this.events[i];
                        if(event.millis < this.song.loopEnd){
                            //console.log('  ', event.track.name, maxtime, this.index, this.numEvents);
                            event.elapsedLoops = this.song.elapsedLoops;
                            event.time = this.startTime + event.millis - this.songStartMillis;
                            events.push(event);
                            this.index++;
                        }else{
                            break;
                        }
                    }

                    // stop overflowing notes-> move the note off event to the position of the right locator (end of the loop)
                    endTicks = this.song.loopEndTicks - 1;
                    endMillis = this.song.getPosition('ticks', endTicks).millis;
                    for(i in this.notes){
                        if(this.notes.hasOwnProperty(i)){
                            note = this.notes[i];
                            noteOn = note.noteOn;
                            noteOff = note.noteOff;
                            if(noteOff.millis <= this.song.loopEnd){
                                continue;
                            }
                            event = sequencer.createMidiEvent(endTicks, 128, noteOn.data1, 0);
                            event.millis = endMillis;
                            event.part = noteOn.part;
                            event.track = noteOn.track;
                            event.midiNote = noteOn.midiNote;
                            event.elapsedLoops = this.song.elapsedLoops;
                            event.time = this.startTime + event.millis - this.songStartMillis;
                            events.push(event);
                        }
                    }
                    this.notes = {};
                    this.setIndex(this.song.loopStart);
                    this.song.startTime += this.song.loopDuration;
                    this.startTime = this.song.startTime;
                }
            }else{
                this.looped = false;
            }
        }


        for(i = this.index; i < this.numEvents; i++){
            event = this.events[i];
            if(event.millis < this.maxtime){
                // if(this.song.bar >= 6 && event.track.name === 'Sonata # 3'){
                //     console.log('  song:', this.song.millis, 'event:', event.millis, ('(' + event.type + ')'), 'max:', maxtime, 'id:', event.midiNote.id);
                // }
                event.elapsedLoops = this.song.elapsedLoops;
                event.time = this.startTime + event.millis - this.songStartMillis;
                events.push(event);
                if(event.midiNote !== undefined){
                    if(event.type === 144){
                        this.notes[event.midiNote.id] = event.midiNote;
                    }else if(event.type === 128){
                        delete this.notes[event.midiNote.id];
                    }
                }
                this.index++;
            }else{
                break;
            }
        }
        return events;
    };


    Scheduler.prototype.update = function(){
        var i,
            event,
            events,
            numEvents,
            track,
            channel;

        if(this.song.precounting === true){
            this.songMillis = this.song.metronome.millis;
            this.maxtime = this.songMillis + (sequencer.bufferTime * 1000);
            events = this.song.metronome.getPrecountEvents(this.maxtime);

            if(this.maxtime > this.song.metronome.endMillis){
                // start scheduling events of the song -> add the first events of the song
                this.songMillis = 0;//this.song.millis;
                this.maxtime = this.song.millis + (sequencer.bufferTime * 1000);
                this.startTime = this.song.startTime;
                this.startTime2 = this.song.startTime2;
                this.songStartMillis = this.song.startMillis;
                events = events.concat(this.getEvents());
            }
        }else{
            this.songMillis = this.song.millis;
            this.maxtime = this.songMillis + (sequencer.bufferTime * 1000);
            this.startTime = this.song.startTime;
            this.startTime2 = this.song.startTime2;
            this.songStartMillis = this.song.startMillis;
            events = this.getEvents();
        }

        numEvents = events.length;

        for(i = 0; i < numEvents; i++){
            event = events[i];
            track = event.track;

            if(
                event.mute === true ||
                event.part.mute === true ||
                event.track.mute === true ||
                (event.track.type === 'metronome' && this.song.useMetronome === false)
                )
            {
                continue;
            }


            if(track.routeToMidiOut === false){
                // if(event.type === 144){
                //     console.log(event.time/1000, sequencer.getTime(), event.time/1000 - sequencer.getTime());
                // }
                track.instrument.processEvent(event, event.time/1000);
            }else{
                channel = track.channel;
                if(channel === 'any' || channel === undefined || isNaN(channel) === true){
                    channel = 0;
                }
                objectForEach(track.midiOutputs, function(midiOutput){
                    if(event.type === 128 || event.type === 144 || event.type === 176){
                        //midiOutput.send([event.type, event.data1, event.data2], event.time + sequencer.midiOutLatency);
                        midiOutput.send([event.type + channel, event.data1, event.data2], event.time);
                    }else if(event.type === 192 || event.type === 224){
                        midiOutput.send([event.type + channel, event.data1], event.time);
                    }
                });
                // needed for Song.resetExternalMidiDevices()
                this.lastEventTime = event.time;
            }
        }
    };


    function loop(data, i, maxi, events){
        var arg;
        for(i = 0; i < maxi; i++){
            arg = data[i];
            if(arg === undefined){
                continue;
            }else if(arg.className === 'MidiEvent'){
                events.push(arg);
            }else if(arg.className === 'MidiNote'){
                events.push(arg.noteOn);
            }else if(typeString(arg) === 'array'){
                loop(arg, 0, arg.length);
            }
        }
    }


    Scheduler.prototype.unschedule = function(){
        var args = Array.prototype.slice.call(arguments),
            events = [],
            i, e, track, instrument;

        loop(args, 0, args.length, events);

        for(i = events.length - 1; i >= 0; i--){
            e = events[i];
            track = e.track;
            instrument = track.instrument;
            if(instrument){
                instrument.unscheduleEvent(e);
            }
        }
    };


    Scheduler.prototype.reschedule = function(){
        var i, track,
            numTracks = this.song.numTracks,
            tracks = this.song.tracks;

        for(i = 0; i < numTracks; i++){
            track = tracks[i];
            track.instrument.reschedule(this.song);
        }
    };

    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
        objectForEach = sequencer.protectedScope.objectForEach;
    });


    sequencer.protectedScope.createScheduler = function(song) {
        return new Scheduler(song);
    };

}());