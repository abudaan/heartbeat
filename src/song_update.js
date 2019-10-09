function songUpdate() {

    'use strict';

    var
        // import
        getPosition, // -> defined in position.js
        parseTimeEvents, // -> defined in parse_time_events.js
        parseEvents, // -> defined in parse_events.js
        getInstrument, // -> defined in instrument_manager.js
        scheduledTasks, // -> defined in open_module.js

        update,
        update2;


    update = function (song, updateTimeEvents) {

        if (sequencer.playing === true) {
            scheduledTasks.updateSong = function () {
                update2(song, updateTimeEvents);
            };
            return;
        }
        //console.log('not here while playing');
        // console.log('update song');
        update2(song, updateTimeEvents);
    };


    update2 = function (song, updateTimeEvents) {
        //console.log('update song');
        //console.time('update song');
        var
            i, id1, id2, id3, tmp,
            track,
            part,
            event,
            note,

            dirtyEvents,
            dirtyNotes,

            newEvents = [],
            changedEvents = [],
            removedEvents = [],
            recordedEvents = [],

            newNotes = [],
            changedNotes = [],
            removedNotes = [],

            newParts = [],
            changedParts = [],
            removedParts = [],

            newTracks = [],
            changedTracks = [],
            removedTracks = [],

            eventsMidiAudioMetronome = [],
            eventsMidiTime = [],
            events = [],
            midiEvents = [],
            audioEvents = [],
            notes = [],
            parts = [],
            tracks = [],

            eventsById = {},
            notesById = {},
            partsById = {};


        if (updateTimeEvents === true) {
            //console.log('update time events');
            parseTimeEvents(song);
        }


        for (id1 in song.tracksById) {

            if (song.tracksById.hasOwnProperty(id1)) {

                track = song.tracksById[id1];

                // console.log('song update track', track.needsUpdate);

                if (track.needsUpdate === true) {
                    track.update();
                }


                for (id2 in track.partsById) {
                    if (track.partsById.hasOwnProperty(id2)) {

                        part = track.partsById[id2];
                        // console.log(part.id, part.needsUpdate, part.dirtyEvents);

                        if (part.needsUpdate === true) {
                            // console.log('song update calls part.update()');
                            part.update();
                        }

                        //console.log(part);

                        dirtyEvents = part.dirtyEvents;

                        for (id3 in dirtyEvents) {
                            if (dirtyEvents.hasOwnProperty(id3)) {
                                event = dirtyEvents[id3];
                                switch (event.state) {
                                    case 'new':
                                        newEvents.push(event);
                                        break;
                                    case 'recorded':
                                        recordedEvents.push(event);
                                        break;
                                    case 'changed':
                                        changedEvents.push(event);
                                        break;
                                    case 'removed':
                                        removedEvents.push(event);
                                        delete part.eventsById[id3];
                                        break;
                                }
                            }
                        }


                        dirtyNotes = part.dirtyNotes;

                        for (id3 in dirtyNotes) {
                            if (dirtyNotes.hasOwnProperty(id3)) {
                                note = dirtyNotes[id3];
                                //console.log(note.state);
                                switch (note.state) {
                                    case 'new':
                                        newNotes.push(note);
                                        break;
                                    case 'changed':
                                        changedNotes.push(note);
                                        break;
                                    case 'removed':
                                        removedNotes.push(note);
                                        delete part.notesById[id3];
                                        break;
                                }
                            }
                        }

                        part.dirtyEvents = {};
                        part.dirtyNotes = {};
                        /*
                        if(part.state === 'new' && part.track !== track){
                            part.state = 'removed';
                        }
                        console.log(part.state, part.track);
                        */
                        if (part.state !== 'removed') {
                            notes = notes.concat(part.notes);
                            events = events.concat(part.events);
                        } else {
                            removedNotes = removedNotes.concat(part.notes);
                            removedEvents = removedEvents.concat(part.events);
                        }


                        switch (part.state) {
                            case 'new':
                                newParts.push(part);
                                partsById[part.id] = part;
                                break;
                            case 'changed':
                                //console.log(part.id);
                                changedParts.push(part);
                                partsById[part.id] = part;
                                break;
                            case 'removed':
                                removedParts.push(part);
                                delete track.partsById[part.id];
                                break;
                        }
                    }
                }

                //events = events.concat(track.events);
                //notes = notes.concat(track.notes);
                parts = parts.concat(track.parts);


                switch (track.state) {
                    case 'clean':
                        track.index = tracks.length;
                        tracks.push(track);
                        break;
                    case 'new':
                        newTracks.push(track);
                        track.state = 'clean';
                        track.index = tracks.length;
                        tracks.push(track);
                        break;
                    case 'changed':
                        changedTracks.push(track);
                        track.state = 'clean';
                        track.index = tracks.length;
                        tracks.push(track);
                        break;
                    case 'removed':
                        removedTracks.push(track);
                        delete song.tracksById[track.id];
                        break;
                }
            }
        }


        for (i = removedEvents.length - 1; i >= 0; i--) {
            event = removedEvents[i];
            event.state = 'clean';
        }

        for (i = removedNotes.length - 1; i >= 0; i--) {
            note = removedNotes[i];
            note.state = 'clean';
        }

        for (i = removedParts.length - 1; i >= 0; i--) {
            part = removedParts[i];
            part.state = 'clean';
        }


        // calculate the ticks position of the recorded events
        if (recordedEvents.length > 0) {
            parseRecordedEvents(song, recordedEvents);
        }

        events.sort(function (a, b) {
            return a.sortIndex - b.sortIndex;
        });

        notes.sort(function (a, b) {
            return a.ticks - b.ticks;
        });

        parts.sort(function (a, b) {
            return a.ticks - b.ticks;
        });

        for (i = events.length - 1; i >= 0; i--) {
            event = events[i];
            eventsById[event.id] = event;
            if (event.type === 'audio') {
                audioEvents.push(event);
            } else {
                midiEvents.push(event);
            }
        }

        for (i = notes.length - 1; i >= 0; i--) {
            note = notes[i];
            notesById[note.id] = note;
        }


        if (updateTimeEvents === false) {

            //console.log(newEvents);
            //console.log(tmp.length, events.length, newEvents.length, changedEvents.length, song.timeEvents.length, song.metronome.events.length);

            tmp = song.timeEvents.concat(newEvents, changedEvents);
            parseEvents(song, tmp);

            tmp = [].concat(newNotes, changedNotes);
            parseMidiNotes(song, tmp);

            tmp = [].concat(newParts, changedParts);
            parseParts(song, tmp);
        } else {
            // if time events have changed we need to update everything!
            tmp = song.timeEvents.concat(events);
            parseEvents(song, tmp);
            parseMidiNotes(song, notes);
            parseParts(song, parts);
        }

        /*
                console.log('  Song.update()');
                console.log('new tracks', newTracks.length);
                console.log('new parts', newParts.length);
                console.log('new events', newEvents.length);
                console.log('changed tracks', changedTracks.length);
                console.log('changed parts', changedParts.length);
                console.log('changed events', changedEvents.length);
                console.log('removed tracks', removedTracks.length);
                console.log('removed parts', removedParts.length);
                console.log('removed events', removedEvents.length);
                console.log('all events', events.length);
                console.log('all parts', parts.length);
                console.log('all tracks', tracks.length);
                console.log('time events', song.timeEvents.length);
                console.log('--------');
        */
        /*
                if(changedEvents.length > 0){
                    console.log('changed events', changedEvents.length);
                    console.log('changed notes', changedNotes.length);
                }
        */


        checkDuration(song);


        // check if we need to generate new metronome events, metronome.update() calls parseMetronomeEvents()
        if (song.metronome.bars !== song.bars) {
            //song.metronome.update(song.metronome.bars, song.bars);
            song.metronome.update();
        } else if (updateTimeEvents === true) {
            song.metronome.update();
        }
        eventsMidiAudioMetronome = [].concat(midiEvents, audioEvents, song.metronome.events);
        eventsMidiAudioMetronome.sort(function (a, b) {
            //return a.sortIndex - b.sortIndex;
            return a.ticks - b.ticks;
        });


        eventsMidiTime = [].concat(events, song.timeEvents);
        eventsMidiTime.sort(function (a, b) {
            return a.ticks - b.ticks;
            //return a.sortIndex - b.sortIndex;
        });

        song.eventsMidiAudioMetronome = eventsMidiAudioMetronome; // all midi, audio and metronome events
        song.eventsMidiTime = eventsMidiTime; // all midi events plus time events
        song.events = events; // all events excluding tempo and time signature events and metronome ticks
        song.midiEvents = midiEvents; // all midi events excluding metronome events
        song.audioEvents = audioEvents;
        song.notes = notes;
        song.parts = parts;
        song.tracks = tracks;

        song.numEvents = events.length;
        song.numNotes = notes.length;
        song.numParts = parts.length;
        song.numTracks = tracks.length;

        song.eventsById = eventsById;
        song.notesById = notesById;
        song.partsById = partsById;

        song.newEvents = newEvents;
        song.changedEvents = changedEvents;
        song.removedEvents = removedEvents;

        song.newNotes = newNotes;
        song.changedNotes = changedNotes;
        song.removedNotes = removedNotes;

        song.newParts = newParts;
        song.changedParts = changedParts;
        song.removedParts = removedParts;


        // update all dependent objects

        song.playhead.updateSong();
        song.playheadRecording.updateSong();
        song.scheduler.updateSong();
        song.scheduler.reschedule();
        song.followEvent.updateSong();

        if (song.grid !== undefined) {
            song.grid.update();
        }

        if (song.keyEditor !== undefined) {
            song.keyEditor.updateSong({
                numBars: song.bars,
                newEvents: newEvents,
                changedEvents: changedEvents,
                removedEvents: removedEvents,
                newNotes: newNotes,
                changedNotes: changedNotes,
                removedNotes: removedNotes,
                newParts: newParts,
                changedParts: changedParts,
                removedParts: removedParts
            });
        }
        //console.timeEnd('update song')
    };


    function checkDuration(song, trim) {
        var lastEvent = song.lastEventTmp,
            position, key;

        //console.log('checkDuration', lastEvent.barsAsString,lastEvent.bar,song.lastBar);
        //console.log(lastEvent);
        //console.log(song.autoSize);

        if (song.autoSize === false) {
            // don't allow the song to grow
            song.lastBar = song.bars;
        } else if (trim) {
            // remove bars that don't contain any events(called via song.trim())
            song.lastBar = lastEvent.bar;
        } else {
            // grow if needed
            song.lastBar = Math.max(song.lastBar, lastEvent.bar);
        }

        song.bars = parseInt(song.lastBar);
        position = getPosition(song, ['barsandbeats',
            song.bars,
            lastEvent.nominator,
            lastEvent.numSixteenth,
            lastEvent.ticksPerSixteenth,
            true
        ]);

        //console.log(song.bars, lastEvent.nominator, lastEvent.numSixteenth, lastEvent.ticksPerSixteenth);

        song.durationTicks = position.ticks;
        song.durationMillis = position.millis;
        //console.log(song.bars, '->', position.barsAsString, song.durationMillis, song.durationTicks);

        // update song.lastEvent
        for (key in position) {
            if (position.hasOwnProperty(key)) {
                //console.log(key, position[key])
                song.lastEvent[key] = position[key];
            }
        }
        //console.log(song.name, song.durationTicks, song.durationMillis, song.bars);
    }


    function parseMetronomeEvents(song, events) {
        //console.log('parseMetronomeEvents', events.length);
        var tmp = events.concat(song.timeEvents);
        parseEvents(song, tmp);

        events = events.concat(song.events);
        events.sort(function (a, b) {
            return a.sortIndex - b.sortIndex;
        });
        //console.log(1,song.allEvents.length);
        song.eventsMidiAudioMetronome = [].concat(events);
        //console.log(2,song.allEvents.length);
        //console.log(song.allEvents);

        // song.playhead.updateSong();
        // song.scheduler.updateSong();
        // song.scheduler.reschedule();
        // song.followEvent.updateSong();
    }


    function parseParts(song, parts) {
        var i, part;

        //console.log(' → parse parts', parts.length);

        for (i = parts.length - 1; i >= 0; i--) {
            part = parts[i];
            //part.update();
            //part.track.update();
            part.startPosition = song.getPosition('ticks', part.start.ticks);
            part.endPosition = song.getPosition('ticks', part.end.ticks);
            part.start.millis = part.startPosition.millis;
            part.end.millis = part.endPosition.millis;
            part.duration.millis = part.end.millis - part.start.millis;
            part.state = 'clean';
            //console.log('s', part.start.ticks, 'e', part.end.ticks);
            //console.log('s', part.startPosition.barsAsString, 'e', part.endPosition.barsAsString);
        }
    }


    function parseMidiNotes(song, notes) {
        var i, note;

        //console.log(' → parseMidiNotes', notes.length);

        for (i = notes.length - 1; i >= 0; i--) {
            note = notes[i];
            //console.log(note);
            if (note.endless === true) {
                note.durationTicks = sequencer.ticks - note.noteOn.ticks;
                note.durationMillis = sequencer.millis - note.noteOn.millis;
            } else {
                note.durationTicks = note.noteOff.ticks - note.noteOn.ticks;
                note.durationMillis = note.noteOff.millis - note.noteOn.millis;
            }
            note.ticks = note.noteOn.ticks;
            note.millis = note.noteOn.millis;
            note.number = note.noteOn.noteNumber;
            note.state = 'clean';
        }
    }


    function parseRecordedEvents(song, events) {
        var i, timeData,
            position, event,
            time,
            timestamp = song.recordTimestamp,
            startMillis = song.recordStartMillis,
            totalTime = startMillis,
            maxi = events.length,
            playhead = song.playheadRecording;

        //if(startMillis < 0){
        //    playhead.set('millis', 0);
        //}else{
        playhead.set('millis', startMillis);
        //}
        //console.log(song, events, timestamp);
        //console.log('parseRecordedEvents', timestamp, startMillis);

        for (i = 0; i < maxi; i++) {
            event = events[i];

            time = (event.recordMillis - timestamp) + startMillis;
            position = playhead.update('millis', time - totalTime); // update by supplying the diff in millis
            totalTime = time;

            timeData = sequencer.getNiceTime(position.millis);

            //console.log(event.ticks, position.ticks);
            //console.log(event.recordMillis, event.recordMillis - timestamp);

            event.ticks = position.ticks;

            event.bpm = position.bpm;
            event.factor = position.factor;
            event.nominator = position.nominator;
            event.denominator = position.denominator;

            event.ticksPerBar = position.ticksPerBar;
            event.ticksPerBeat = position.ticksPerBeat;
            event.ticksPerSixteenth = position.ticksPerSixteenth;

            event.numSixteenth = position.numSixteenth;

            event.millisPerTick = position.millisPerTick;
            event.secondsPerTick = position.secondsPerTick;

            event.millis = position.millis;
            event.seconds = position.millis / 1000;

            event.hour = timeData.hour;
            event.minute = timeData.minute;
            event.second = timeData.second;
            event.millisecond = timeData.millisecond;
            event.timeAsString = timeData.timeAsString;
            event.timeAsArray = timeData.timeAsArray;

            event.bar = position.bar;
            event.beat = position.beat;
            event.sixteenth = position.sixteenth;
            event.tick = position.tick;
            event.barsAsString = position.bar + ':' + position.beat + ':' + position.sixteenth + ':' + position.tick;
            event.barsAsArray = [position.bar, position.beat, position.sixteenth, position.tick];

            event.state = 'clean';
        }

        song.recordStartMillis = undefined;
        song.recordTimestamp = undefined;
    }


    // not in use!
    function sortEvents(events) {
        var maxi = events.length,
            i, event, lastTick = -100000,
            buffer,
            newOrder = [];

        for (i = 0; i < maxi; i++) {
            event = events[i];
            if (buffer === undefined) {
                buffer = [];
            }
            buffer.push(event);
            if (event.ticks !== lastTick) {
                if (buffer.length > 1) {
                    // console.log('unsorted', buffer.length);
                    // buffer.forEach(function(e){
                    //     console.log(e.ticks, e.type, e.data1, e.data2);
                    // });

                    buffer.sort(function (a, b) {

                        // question is: comes a after b

                        if (b.type === 144 && a.type === 128) {
                            // note off before note on
                            return false;


                        } else if (b.type === 144 && a.type === 176 && a.data1 === 64 && a.data2 === 127) {
                            // sustain pedal down before note on
                            return false;


                        } else if (b.type === 176 && b.data1 === 64 && b.data2 === 127 && a.type === 128) {
                            // note off before sustain pedal down
                            return false;


                        } else if (b.type === 128 && a.type === 176 && a.data1 === 64 && a.data2 === 0) {
                            // sustain pedal up before note off -> for better performance, the note off event doesn't get added to the sustainPedalSamples array
                            return false;

                        } else if (b.type === 144 && a.type === 176 && a.data1 === 64 && a.data2 === 0) {
                            // sustain pedal up before note on
                            return false;


                        } else if (a.type === 176 && a.data1 === 64 && a.data2 === 0 && b.type === 176 && b.data1 === 64 && b.data2 === 127) {
                            // sustain pedal up should come before sustain pedal up
                            return false;

                        } else {
                            return true;
                        }
                    });
                    // console.log('sorted');
                    // buffer.forEach(function(e){
                    //     console.log(e.ticks, e.type, e.data1, e.data2);
                    // });
                    // console.log('---');
                    newOrder = newOrder.concat(buffer);
                    buffer = undefined;
                } else {
                    newOrder.push(buffer[0]);
                }
            }
            lastTick = event.ticks;
        }
    }


    sequencer.protectedScope.update = update;
    sequencer.protectedScope.checkDuration = checkDuration;
    sequencer.protectedScope.parseMetronomeEvents = parseMetronomeEvents;

    sequencer.protectedScope.addInitMethod(function () {
        getPosition = sequencer.protectedScope.getPosition;
        parseEvents = sequencer.protectedScope.parseEvents;
        parseTimeEvents = sequencer.protectedScope.parseTimeEvents;
        getInstrument = sequencer.protectedScope.getInstrument;
        scheduledTasks = sequencer.protectedScope.scheduledTasks;
    });
}
