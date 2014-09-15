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
    };


    Scheduler.prototype.getEvents = function(maxtime){
        var i, event, events = [], note;

        // if we approach the loop point, we schedule a whole buffer of events at the start of the loop and then start
        // to schedule again after the song position has reached the loop end point. at that time, the value of this.looped
        // will be set to false again so the scheduler can continue to schedule events
        if(this.looped === true){
            //console.log('bypass');
            return events;
        }

        //console.log(this.song.millis, maxtime, this.index);
        //console.log(this.song.millis < this.song.loopEnd);

        if(this.song.doLoop && maxtime >= this.song.loopEnd && this.looped === false && this.song.millis < this.song.loopEnd){
            this.looped = true;
            //console.log('LOOP', this.song.loopEnd, maxtime);
            for(i = this.index; i < this.numEvents; i++){
                event = this.events[i];
                if(event.millis < this.song.loopEnd){
                    //console.log('  ', event.track.name, maxtime, this.index, this.numEvents);
                    events.push(event);
                    this.index++;
                }else{
                    break;
                }
            }
///*
            // stop overflowing notes
            for(i in this.notes){
                if(this.notes.hasOwnProperty(i)){
                    note = this.notes[i].noteOn;
                    event = sequencer.createMidiEvent(this.song.loopEndTicks - 1, 128, note.data1, 0);
                    event.millis = this.song.loopEnd - 1;
                    event.part = note.part;
                    event.track = note.track;
                    event.midiNote = note.midiNote;
                    events.push(event);
                }
            }
            this.notes = {};
//*/
            this.setIndex(this.song.loopStart);
            //maxtime = this.song.loopStart + (maxtime - this.song.loopEnd);
            maxtime = this.song.loopStart + bufferTime;
            //console.log('---> overflow', maxtime);
        }


        for(i = this.index; i < this.numEvents; i++){
            event = this.events[i];
            if(event.millis < maxtime){
                //if(this.looped){
                //    console.log(event);
                //}
                // if(this.song.bar >= 6 && event.track.name === 'Sonata # 3'){
                //     console.log('  song:', this.song.millis, 'event:', event.millis, ('(' + event.type + ')'), 'max:', maxtime, 'id:', event.midiNote.id);
                // }
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
            time,
            track,
            channel,
            //currentTime = sequencer.getTime() * 1000,
            startTime,
            startTime2,
            songStartMillis,
            millis,
            maxtime,
            events,
            numEvents;

        this.inTransition = false;

        //console.log('precounting', this.song.precounting);

        if(this.song.precounting === true){
            millis = this.song.metronome.millis;
            maxtime = millis + (sequencer.bufferTime * 1000);
            events = this.song.metronome.getPrecountEvents(maxtime);
            //console.log(maxtime, millis, this.song.metronome.endMillis);

            if(maxtime > this.song.metronome.endMillis){
                // start scheduling events of the song -> add the first events of the song
                maxtime = this.song.millis + (sequencer.bufferTime * 1000);
                events = events.concat(this.getEvents(maxtime));
                //this.song.precounting = false;
                // we are in transition, meaning that for calculating their schedule time the precount events
                // use the startTime of the metronome, and the song events use the startTime of the song
                this.inTransition = true;
                //console.log(this.inTransition, sequencer.getTime());
            }
        }else{
            millis = this.song.millis;
            maxtime = millis + (sequencer.bufferTime * 1000);
            events = this.getEvents(maxtime);
        }

        numEvents = events.length;

        for(i = 0; i < numEvents; i++){
            event = events[i];
            track = event.track;
            //console.log((sequencer.bufferTime/event.secondsPerTick) * event.ticksPerBeat);

            if(
                event.mute === true ||
                event.part.mute === true ||
                event.track.mute === true ||
                //event.track.midiOutput !== undefined ||
                (event.track.type === 'metronome' && this.song.useMetronome === false)
                )
            {
                continue;
            }

            if(this.inTransition === true){
                if(event.part.id === 'precount'){
                    startTime = this.song.metronome.startTime;
                    startTime2 = this.song.metronome.startTime2;
                    songStartMillis = 0;//this.song.metronome.startMillis;
                }else{
                    startTime = this.song.startTime;
                    startTime2 = this.song.startTime2;
                    songStartMillis = this.song.startMillis;
                }
            }else if(this.song.precounting === true){
                startTime = this.song.metronome.startTime;
                startTime2 = this.song.metronome.startTime2;
                songStartMillis = 0;//this.song.metronome.startMillis;
            }else{
                startTime = this.song.startTime;
                startTime2 = this.song.startTime2;
                songStartMillis = this.song.startMillis;
            }

            if(track.routeToMidiOut === false){
                time = (startTime + event.millis - songStartMillis)/1000;
/*
                if(this.song.precounting){
                    console.log(startTime, event.millis, songStartMillis, time, sequencer.getTime());
                }
*/
                //console.log(time, event.millis, event.ticks);
                //if(this.song.precounting){
                //   console.log(time, sequencer.getTime(), startTime, songStartMillis, event.millis);
                //}
                //console.log(time, event.part.id, event.id, sequencer.getTime(), startTime, this.song.precounting, this.inTransition);
                if(time < sequencer.getTime() && this.looped === true){
                    time += (this.song.loopEnd - this.song.loopStart)/1000;
                }
/*
                if(event.type === 144){
                    console.log('e', event.millis, 's', millis, 'now', sequencer.getTime() * 1000, 'rt', time * 1000, 'ss', this.song.startTime);
                }
*/
                track.instrument.processEvent(event, time);
            }else{
                // if(startTime2 === undefined){
                //     startTime2 = window.performance.now();
                // }
                time = startTime2 + event.millis - songStartMillis;
                if(time < sequencer.getTime() && this.looped === true){
                    time += (this.song.loopEnd - this.song.loopStart);
                }
                channel = track.channel;
                if(channel === 'any' || channel === undefined || isNaN(channel) === true){
                    channel = 0;
                }
                objectForEach(track.midiOutputs, function(midiOutput){
                    if(event.type === 128 || event.type === 144 || event.type === 176){
                        //midiOutput.send([event.type, event.data1, event.data2], time + sequencer.midiOutLatency);
                        midiOutput.send([event.type + channel, event.data1, event.data2], time);
                    }else if(event.type === 192 || event.type === 224){
                        midiOutput.send([event.type + channel, event.data1], time);
                    }
                });
                this.lastEventTime = time;
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