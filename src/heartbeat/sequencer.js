function createSequencer() {

    'use strict';

    var
        slice = Array.prototype.slice,

        //import
        typeString, // defined in util.js
        isEmptyObject, // defined in util.js
        objectToArray, // defined in util.js
        objectForEach, // defined in util.js
        createMidiEvent, // defined in midi_event.js
        context, // defined in open_module.js
        timedTasks, // defined in open_module.js
        scheduledTasks, // defined in open_module.js
        repetitiveTasks, // defined in open_module.js
        masterGainNode, // defined in open_module.js
        parseTimeEvents, // defined in parse_time_events.js

        r = 0,

        heartbeat, // the heartbeat of the sequencer
        lastTimeStamp,

        processEventTracks = {},
        events, // the events that are currently been processed

        pausedSongs = [],
        activeSongs = {},
        snapshots = {};


    function addSong(song) {
        activeSongs[song.id] = song;
    }


    sequencer.getSongs = function () {
        return activeSongs;
    };


    function removeProperties(obj) {
        var i;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                //console.log(i);
                obj[i] = null;
            }
        }
    }

    sequencer.deleteSong = function (song) {
        if (song === undefined || song === null || song.className !== 'Song') {
            return;
        }

        // clean up
        song.stop();
        song.disconnect(masterGainNode);
        //parseTimeEvents();

        // remove reference
        delete activeSongs[song.id];

        var i, track,
            j, part,
            k, note, event;

        //console.log(allEvents.length, song.events.length, metronome.events.length);
        ///*
        for (i = song.eventsMidiAudioMetronome.length - 1; i >= 0; i--) {
            event = song.eventsMidiAudioMetronome[i];
            removeProperties(event);
        }

        for (i = song.timeEvents.length - 1; i >= 0; i--) {
            event = song.timeEvents[i];
            //removeProperties(event);
        }
        //*/

        for (i = song.numTracks - 1; i >= 0; i--) {

            track = song.tracks[i];

            if (track.audio !== undefined) {
                track.audio.recorder.cleanup();
            }

            for (j = track.numParts - 1; j >= 0; j--) {
                part = track.parts[j];

                for (k = part.numNotes - 1; k >= 0; k--) {
                    note = part.notes[k];
                    removeProperties(note);
                }

                // for(k = part.numEvents - 1; k >= 0; k--){
                //     event = part.events[k];
                //     removeProperties(event);
                // }

                removeProperties(part);
                part = null;
            }
            removeProperties(track);
            track = null;
        }
        removeProperties(song);
        song = null;
        return null;
    };


    sequencer.getSnapshot = function (song, id) {

        if (song === undefined) {
            console.error('song is undefined');
            return;
        }

        id = id || song.id;

        var snapshot = snapshots[id],
            activeEvents = song.activeEvents,
            activeNotes = song.activeNotes,
            activeParts = song.activeParts,
            nonActiveEvents = [],
            nonActiveNotes = [],
            nonActiveParts = [],
            prevActiveEvents,
            prevActiveNotes,
            prevActiveParts,
            e, n, p, i;

        if (snapshot !== undefined) {
            prevActiveEvents = snapshot.activeEvents;
            prevActiveNotes = snapshot.activeNotes;
            prevActiveParts = snapshot.activeParts;

            for (i = prevActiveEvents.length - 1; i >= 0; i--) {
                e = prevActiveEvents[i];
                if (activeEvents[e.id] === undefined) {
                    if (song.eventsLib[e.id] !== undefined) {
                        nonActiveEvents.push(e);
                    }
                }
            }

            for (i = prevActiveNotes.length - 1; i >= 0; i--) {
                n = prevActiveNotes[i];
                if (activeNotes[n.id] === undefined) {
                    if (song.notesLib[n.id] !== undefined) {
                        nonActiveNotes.push(n);
                    }
                }
            }

            for (i = prevActiveParts.length - 1; i >= 0; i--) {
                p = prevActiveParts[i];
                if (activeParts[p.id] === undefined) {
                    nonActiveParts.push(p);
                }
            }
        }

        snapshot = {
            activeEvents: objectToArray(activeEvents),
            activeNotes: objectToArray(activeNotes),
            activeParts: objectToArray(activeParts),
            nonActiveEvents: nonActiveEvents,
            nonActiveNotes: nonActiveNotes,
            nonActiveParts: nonActiveParts
        };

        snapshots[id] = snapshot;

        return snapshot;
    };


    heartbeat = function (timestamp) {
        var i, diff, task, now = sequencer.getTime();

        // if(isEmptyObject(timedTasks) === false){
        //     console.log(timedTasks);
        // }

        // for instance: the callback of sample.unschedule;
        for (i in timedTasks) {
            if (timedTasks.hasOwnProperty(i)) {
                task = timedTasks[i];
                if (task.time >= now) {
                    task.execute();
                    task = null;
                    delete timedTasks[i];
                }
            }
        }


        // for instance: song.update();
        for (i in scheduledTasks) {
            if (scheduledTasks.hasOwnProperty(i)) {
                scheduledTasks[i]();
            }
        }

        // for instance: song.pulse();
        for (i in repetitiveTasks) {
            if (repetitiveTasks.hasOwnProperty(i)) {
                repetitiveTasks[i]();
            }
        }

        // skip the first 10 frames because they tend to have weird intervals
        if (r >= 10) {
            diff = (timestamp - lastTimeStamp) / 1000;
            sequencer.diff = diff;
            // if(r < 40){
            //     console.log(diff);
            //     r++;
            // }
            if (diff > sequencer.bufferTime && sequencer.autoAdjustBufferTime === true) {
                if (sequencer.debug) {
                    console.log('adjusted buffertime:' + sequencer.bufferTime + ' -> ' + diff);
                }
                sequencer.bufferTime = diff;
            }
        } else {
            r++;
        }
        lastTimeStamp = timestamp;
        scheduledTasks = {};

        //setTimeout(heartbeat, 100);
        window.requestAnimationFrame(heartbeat);
    };


    sequencer.processEvent = sequencer.processEvents = function () {
        var args = slice.call(arguments),
            loop, arg, i, maxi, time, contextTime, event,
            bpm = 60,
            midiEvent, type,
            instrument, part, track,
            secondsPerTick;

        events = [];

        loop = function (data, i, maxi) {
            for (i = 0; i < maxi; i++) {
                arg = data[i];
                type = typeString(arg);
                if (arg === undefined) {
                    //console.log(i, arg);
                    continue;
                } else if (type === 'midimessageevent') {
                    data = arg.data;
                    midiEvent = createMidiEvent(0, data[0], data[1], data[2]);
                    events.push(midiEvent);
                } else if (arg.className === 'MidiEvent') {
                    events.push(arg);
                } else if (type === 'array') {
                    loop(arg, 0, arg.length);
                } else if (type === 'string') {
                    instrument = arg;
                } else if (isNaN(arg) === false) {
                    bpm = arg;
                }
            }
        };

        loop(args, 0, args.length);

        part = sequencer.createPart();
        track = sequencer.createTrack();
        track.setInstrument(instrument);

        if (processEventTracks[track.instrumentId] === undefined) {
            processEventTracks[track.instrumentId] = track;
            track.addPart(part);
            track.connect(context.destination);
        } else {
            track = processEventTracks[track.instrumentId];
            part = track.parts[0];
        }

        part.addEvents(events);
        track.update();

        maxi = events.length;
        contextTime = sequencer.getTime();
        secondsPerTick = 60 / bpm / sequencer.defaultPPQ;
        for (i = 0; i < maxi; i++) {
            event = events[i];
            event.time = contextTime + (event.ticks * secondsPerTick) + (2 / 1000);//ms -> sec, add 2 ms prebuffer time
            //time = contextTime + (event.ticks * secondsPerTick) + (2/1000);//ms -> sec, add 2 ms prebuffer time
            //console.log(event.ticks, time, contextTime);
            //track.instrument.processEvent(event, time);
            track.instrument.processEvent(event);
        }
    };


    sequencer.stopProcessEvent = sequencer.stopProcessEvents = function () {
        objectForEach(processEventTracks, function (track) {
            track.instrument.allNotesOff();
            track = undefined;
        });
        processEventTracks = {};
    };


    sequencer.play = function () {
        var args = slice.call(arguments),
            events = [],
            parts = [],
            tracks = [],
            songs = [],
            timeEvents = [],
            i, arg, loop, store = false,
            song, track, part, bpm, nominator, denominator, instrument;

        //console.log('sequencer.play()', args);

        loop = function (data, i, maxi, indentation) {
            for (i = 0; i < maxi; i++) {
                arg = data[i];
                if (arg === undefined) {
                    //console.log(indentation, i, arg);
                    continue;
                } else if (typeString(arg) === 'string') {
                    instrument = arg;
                } else if (arg.className === 'Song') {
                    if (bpm === undefined) {
                        bpm = arg.bpm;
                        nominator = arg.nominator;
                        denominator = arg.denominator;
                    }
                    songs.push(arg);
                } else if (arg.className === 'Track') {
                    if (bpm === undefined) {
                        song = arg.song;
                        if (song !== undefined) {
                            bpm = song.bpm;
                            nominator = song.nominator;
                            denominator = song.denominator;
                        }
                    }
                    tracks.push(arg);
                } else if (arg.className === 'Part') {
                    if (bpm === undefined) {
                        song = arg.song;
                        if (song !== undefined) {
                            bpm = song.bpm;
                            nominator = song.nominator;
                            denominator = song.denominator;
                        }
                    }
                    parts.push(arg);
                } else if (arg.className === 'MidiEvent' || arg.className === 'AudioEvent') {
                    if (bpm === undefined) {
                        part = arg.part;
                        if (part !== undefined) {
                            song = part.song;
                            if (song !== undefined) {
                                bpm = song.bpm;
                                nominator = song.nominator;
                                denominator = song.denominator;
                            }
                        }
                    }
                    if (arg.type === 0x51 || arg.type === 0x58) {
                        timeEvents.push(arg);
                    } else {
                        events.push(arg);
                    }
                } else if (typeString(arg) === 'array') {
                    //console.log('recursive loop')
                    loop(arg, 0, arg.length, '    ');
                } else if (arg === true || arg === false) {
                    store = arg;
                } else if (arg.indexOf('S') === 0) {
                    // play song by id, not sure if this is useful
                    song = activeSongs[arg];
                    if (song) {
                        song.play();
                    }
                }
            }
        };

        loop(args, 0, args.length, '  ');

        for (i = songs.length - 1; i >= 0; i--) {
            song = songs[i];
            //console.log(song.numEvents);
            tracks = tracks.concat(song.tracks);
            //parts = parts.concat(song.parts);
            //events = events.concat(song.events);
            timeEvents = timeEvents.concat(song.timeEvents);
        }

        if (parts.length > 0) {
            track = sequencer.createTrack();
            track.instrument = instrument;
            track.addParts(parts);
            tracks.push(track);
        }

        if (events.length > 0) {
            track = sequencer.createTrack();
            track.instrument = instrument;
            part = sequencer.createPart();
            part.addEvents(events);
            track.addPart(part);
            tracks.push(track);
        }


        //console.log(songs.length, tracks.length, parts.length, events.length, bpm, nominator, denominator);

        song = sequencer.createSong({
            bpm: bpm || 120,
            nominator: nominator || 4,
            denominator: denominator || 4,
            timeEvents: timeEvents,
            tracks: tracks
        });

        addSong(song);
        song.play();
        return song;
    };


    /*
        animationFrame = function(cb) {
            animationFrameRequests.push(cb);
    
            if (animationFrameTimer !== undefined) {
                return animationFrameTimer;
            }
    
            animationFrameTimer = setTimeout(function() {
                while (animationFrameRequests.length > 0) {
                    animationFrameRequests.shift()();
                }
                animationFrameTimer = undefined;
            }, animationFrameInterval);
    
            return animationFrameTimer;
        };
    */


    sequencer.setAnimationFrameType = function (type, interval) {
        type = type || 'default';
        type = type.toLowerCase();
        interval = interval || 15;
        switch (type) {
            case 'settimeout':
                /*
                animationFrameInterval = interval || animationFrameInterval;
                animationFrameRequests = [];
                window.requestAnimationFrame = animationFrame;
                */
                // quick and dirty
                window.requestAnimationFrame = function (cb) {
                    setTimeout(cb, interval);
                };
                break;
            default:
                /*
                clearTimeout(animationFrameTimer);
                */
                window.requestAnimationFrame = window.webkitRequestAnimationFrame || window.requestAnimationFrame;
        }
    };


    // used by asset_manager.js if an instrument or a sample pack has been unloaded
    sequencer.protectedScope.updateInstruments = function () {
        var i, j, tracks, track, song;

        for (i in activeSongs) {
            if (activeSongs.hasOwnProperty(i)) {
                song = activeSongs[i];
                tracks = song.tracks;
                for (j = tracks.length - 1; j >= 0; j--) {
                    track = tracks[j];
                    //console.log(track.id);
                    track.instrument.reset();
                }
            }
        }
    };


    sequencer.allNotesOff = function () {
        objectForEach(activeSongs, function (song) {
            song.allNotesOff();
        });
    };


    window.onblur = function () {
        if (sequencer.pauseOnBlur === false) {
            return;
        }
        //console.log('blur', sequencer.getTime() * 1000);
        sequencer.allNotesOff();
        pausedSongs = [];
        objectForEach(activeSongs, function (song) {
            if (song.playing === true) {
                if (sequencer.debug) {
                    console.log('pause song', song.id);
                }
                pausedSongs.push(song);
                song.pause();
                //song.stop();
            }
        });
    };


    window.onfocus = function () {
        if (sequencer.pauseOnBlur === false) {
            return;
        }
        //console.log('focus', sequencer.getTime() * 1000);
        var song, millis, i, maxi = pausedSongs.length;
        for (i = 0; i < maxi; i++) {
            song = pausedSongs[i];
            millis = song.millis;
            song.stop();
            song.setPlayhead('millis', millis);
            if (sequencer.restartOnFocus) {
                song.play();
            }
        }
        pausedSongs = [];
    };


    sequencer.protectedScope.addSong = addSong;

    sequencer.protectedScope.addInitMethod(function () {
        objectToArray = sequencer.protectedScope.objectToArray;
        isEmptyObject = sequencer.protectedScope.isEmptyObject;
        isEmptyObject = sequencer.protectedScope.isEmptyObject;
        objectForEach = sequencer.protectedScope.objectForEach;
        timedTasks = sequencer.protectedScope.timedTasks;
        scheduledTasks = sequencer.protectedScope.scheduledTasks;
        repetitiveTasks = sequencer.protectedScope.repetitiveTasks;
        typeString = sequencer.protectedScope.typeString;
        context = sequencer.protectedScope.context;
        createMidiEvent = sequencer.createMidiEvent;
        masterGainNode = sequencer.protectedScope.masterGainNode;
        parseTimeEvents = sequencer.protectedScope.parseTimeEvents;
        heartbeat();
    });

}




/*
    // removed for clarity

    sequencer.play = function(song){
        song = checkSong(song);
        if(song === false){
            console.error('no song loaded or specified');
            return;
        }
        song.play();
    };


    sequencer.pause = function(song){
        song = checkSong(song);
        if(song === false){
            console.error('no song loaded or specified');
            return;
        }
        song.pause();
    };


    sequencer.stop = function(song){
        song = checkSong(song);
        if(song === false){
            console.error('no song loaded or specified');
            return;
        }
        song.stop();
    };


    sequencer.addEventListener = function(){
        if(sequencer.song === undefined){
            console.error('no song in sequencer');
            return;
        }
        return sequencer.song.addEventListener.apply(sequencer.song, arguments);
    };


    sequencer.removeEventListener = function(){
        if(sequencer.song === undefined){
            console.error('no song in sequencer');
            return;
        }
        return sequencer.song.removeEventListener.apply(sequencer.song, arguments);
    };


    checkSong = function(song){
        if(song){
            return song.className === 'Song' ? song : false;
        }else if(sequencer.song){
            return sequencer.song.className === 'Song' ? sequencer.song : false;
        }else{
            return false;
        }
    };



*/


/*
    sequencer.playEvents = function(){
        var args = slice.call(arguments),
            i, arg, loop, bpm, nominator, denominator,
            part, song, events = [];

        loop = function(data){
            for(i = data.length - 1; i >= 0; i--){
                arg = data[i];
                if(typeString(arg) === 'array'){
                    loop(arg);
                }else if(arg.className === 'MidiEvent' || arg.className === 'AudioEvent'){
                    if(bpm === undefined){
                        part = arg.part;
                        if(part !== undefined){
                            song = part.song
                            if(song !== undefined){
                                bpm = song.bpm;
                                nominator = song.nominator;
                                denominator = song.denominator;
                            }
                        }
                    }
                    events.push(arg);
                }
            }
        };

        loop(args);

        //console.log(events, bpm, nominator, denominator);

        song = sequencer.createSong({
            bpm: bpm || 120,
            nominator: nominator || 4,
            denominator: denominator || 4,
            events: events
        });

        songs[song.id] = song;
        //console.log(song.durationMillis);
        //console.log(songs);

        song.addEventListener('end', function(){
            console.log('end', this.id);
            //delete songs[this.id];
            //console.log(songs);
        });
        song.play();
        return song.id;
    };
*/

/*
    // moved to song

    sequencer.midiIn = function(){// events, [song|track|part]

    };


    sequencer.midiOut = function(){// channel

    };


    sequencer.midiThru = function(){// channel

    };

*/
