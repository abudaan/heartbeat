function parseTimeEvents() {

    'use strict';

    var
        //import
        createMidiEvent, // → defined in midi_event.js

        //local
        ppq,
        bpm,
        factor,
        nominator,
        denominator,
        playbackSpeed,

        bar,
        beat,
        sixteenth,
        tick,
        ticks,
        millis,

        millisPerTick,
        secondsPerTick,

        ticksPerBeat,
        ticksPerBar,
        ticksPerSixteenth,
        numSixteenth,

        timeEvents,
        numTimeEvents,
        index;


    function setTickDuration() {
        secondsPerTick = (1 / playbackSpeed * 60) / bpm / ppq;
        millisPerTick = secondsPerTick * 1000;
        //console.log(millisPerTick, bpm, ppq, playbackSpeed, (ppq * millisPerTick));
        //console.log(ppq);
    }


    function setTicksPerBeat() {
        factor = (4 / denominator);
        numSixteenth = factor * 4;
        ticksPerBeat = ppq * factor;
        ticksPerBar = ticksPerBeat * nominator;
        ticksPerSixteenth = ppq / 4;
        //console.log(denominator, factor, numSixteenth, ticksPerBeat, ticksPerBar, ticksPerSixteenth);
    }


    function parse(song) {
        //console.time('parse time events ' + song.name);
        var diffTicks,
            event,
            type,
            i = 0;

        if (song === undefined) {
            timeEvents = [];
            console.log('reset', timeEvents);
            return;
        }

        reset(song);

        //console.log('parse time events', numTimeEvents);
        setTickDuration();
        setTicksPerBeat();

        timeEvents.sort(function (a, b) {
            return a.ticks - b.ticks;
        });

        for (i = 0; i < numTimeEvents; i++) {

            event = timeEvents[i];
            event.song = song;
            diffTicks = event.ticks - ticks;
            tick += diffTicks;
            ticks = event.ticks;
            type = event.type;
            //console.log(diffTicks, millisPerTick);
            millis += diffTicks * millisPerTick;

            while (tick >= ticksPerSixteenth) {
                sixteenth++;
                tick -= ticksPerSixteenth;
                while (sixteenth > numSixteenth) {
                    sixteenth -= numSixteenth;
                    beat++;
                    while (beat > nominator) {
                        beat -= nominator;
                        bar++;
                    }
                }
            }

            switch (type) {

                case 0x51:
                    bpm = event.bpm;
                    setTickDuration();
                    break;

                case 0x58:
                    nominator = event.nominator;
                    denominator = event.denominator;
                    setTicksPerBeat();
                    break;

                default:
                    continue;
            }

            //time data of time event is valid from (and included) the position of the time event
            updateEvent(event);
            //console.log(event.barsAsString);
        }

        song.lastEventTmp = event;
        //console.log(event);
        //console.log(timeEvents);
    }


    function reset(song) {
        playbackSpeed = song.playbackSpeed;
        timeEvents = song.timeEvents;
        numTimeEvents = timeEvents.length;
        ppq = song.ppq;
        bpm = song.bpm;
        nominator = song.nominator;
        denominator = song.denominator;

        //console.log('reset', timeEvents, numTimeEvents, bpm, ppq, nominator, denominator);
        //console.log('reset', numTimeEvents, bpm, ppq, nominator, denominator);

        index = 0;

        bar = 1;//0
        beat = 1;//0
        sixteenth = 1;//0
        tick = 0;
        ticks = 0;
        millis = 0;
    }


    function updateEvent(event) {

        //console.log(event, bpm, millisPerTick, ticks, millis);

        event.bpm = bpm;
        event.nominator = nominator;
        event.denominator = denominator;

        event.ticksPerBar = ticksPerBar;
        event.ticksPerBeat = ticksPerBeat;
        event.ticksPerSixteenth = ticksPerSixteenth;

        event.factor = factor;
        event.numSixteenth = numSixteenth;
        event.secondsPerTick = secondsPerTick;
        event.millisPerTick = millisPerTick;


        event.ticks = ticks;

        event.millis = millis;
        event.seconds = millis / 1000;


        event.bar = bar;
        event.beat = beat;
        event.sixteenth = sixteenth;
        event.tick = tick;
        //event.barsAsString = (bar + 1) + ':' + (beat + 1) + ':' + (sixteenth + 1) + ':' + tick;
        var tickAsString = tick === 0 ? '000' : tick < 10 ? '00' + tick : tick < 100 ? '0' + tick : tick;
        event.barsAsString = bar + ':' + beat + ':' + sixteenth + ':' + tickAsString;
        event.barsAsArray = [bar, beat, sixteenth, tick];


        var timeData = sequencer.getNiceTime(millis);

        event.hour = timeData.hour;
        event.minute = timeData.minute;
        event.second = timeData.second;
        event.millisecond = timeData.millisecond;
        event.timeAsString = timeData.timeAsString;
        event.timeAsArray = timeData.timeAsArray;
    }


    sequencer.protectedScope.parseTimeEvents = parse;

    sequencer.protectedScope.addInitMethod(function () {
        createMidiEvent = sequencer.createMidiEvent;
    });

}


/*
    scaffoldingTicks = function(song){
        var end = song.ticks,
            interval = 480,
            range = 0,
            event,
            events,
            numEvents,
            diffTicks,
            diffMillis;

        song.eventRanges.ticks = {};
        reset();

        while(range <= end){
            events = getNextTimeEvents('ticks',range);
            numEvents = events.length;

            if(numEvents === 0){
                //add at least one event in this range
                event = createMidiEvent(0,sequencer.DUMMY_EVENT);
                //calculate position
                diffTicks = range - ticks;
                tick += diffTicks;
                diffMillis = diffTicks * millisPerTick;
                millis += diffMillis;

                while(tick >= ticksPerSixteenth){
                    sixteenth++;
                    tick -= ticksPerSixteenth;
                    while(sixteenth >= numSixteenth){
                        sixteenth -= numSixteenth;
                        beat++;
                        while(beat >= nominator){
                            beat -= nominator;
                            bar++;
                        }
                    }
                }
                ticks = range;
                updateEvent(event);
                events.push(event);
            }else{
                getDataFromEvent(events[numEvents - 1]);
            }
            song.eventRanges.ticks[range] = events;
            //console.log(bar+1,beat+1,sixteenth+1,tick+1);
            range += interval;
        }
    };


    scaffoldingMillis = function(song){
        var end = song.durationMillis,
            interval = 500,
            events,
            numEvents,
            event,
            range = 0,
            diffTicks;

        song.eventRanges.millis = {};
        reset();

        while(range <= end){
            events = getNextTimeEvents('millis',range);
            numEvents = events.length;
            if(numEvents === 0){
                //add at least one event in this range
                event = createMidiEvent(range,sequencer.DUMMY_EVENT);
                //calculate position data
                diffTicks = (range - millis)/millisPerTick;
                tick += diffTicks;
                ticks += diffTicks;

                while(tick >= ticksPerSixteenth){
                    sixteenth++;
                    tick -= ticksPerSixteenth;
                    tick = tick;
                    while(sixteenth >= numSixteenth){
                        sixteenth -= numSixteenth;
                        beat++;
                        while(beat >= nominator){
                            beat -= nominator;
                            bar++;
                        }
                    }
                }
                millis = range;
                updateEvent(event);
                events.push(event);
            }else{
                getDataFromEvent(events[numEvents - 1]);
            }
            song.eventRanges.millis[range] = events;
            //console.log(bar+1,beat+1,sixteenth+1,tick+1);
            range += interval;
        }
    };


    scaffoldingBars = function(){
        var song = sequencer.song,
            end = song.durationTicks,
            range = 0,
            bars = [],
            event,
            events,
            numEvents,
            diffTicks,
            diffMillis;

        index = 0;
        getDataFromEvent(song.timeEvents[0]);

        while(range <= end){
            events = getNextTimeEvents('ticks',ticksPerBar);
            numEvents = events.length;
            if(numEvents > 0){
                getDataFromEvent(events[numEvents - 1]);
            }
            event = createMidiEvent(0,sequencer.DUMMY_EVENT);

            //calculate position of newly created event
            diffTicks = range - ticks;
            tick += diffTicks;
            diffMillis = diffTicks * millisPerTick;
            millis += diffMillis;

            while(tick >= ticksPerSixteenth){
                sixteenth++;
                tick -= ticksPerSixteenth;
                while(sixteenth >= numSixteenth){
                    sixteenth -= numSixteenth;
                    beat++;
                    while(beat >= nominator){
                        beat -= nominator;
                        bar++;
                    }
                }
            }

            ticks = range;
            updateEvent(event);
            bars.push(event);
            range += ticksPerBar;
        }
        return bars;
    };



    sequencer.protectedScope.createScaffolding = function(song){
        reset(song);
        scaffoldingTicks(song);
        scaffoldingMillis(song);
        console.log(song.eventRanges);
    };

    sequencer.protectedScope.getScaffoldingBars = scaffoldingBars;


*/
