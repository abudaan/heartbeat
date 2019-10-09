function parseEvents() {

    'use strict';

    var
        round = Math.round,

        precision = Math.pow(10, sequencer.precision),

        //local
        factor,
        nominator,
        denominator,

        bar,
        beat,
        sixteenth,
        tick,

        ticksPerBar,
        ticksPerBeat,
        ticksPerSixteenth,
        numSixteenth,
        millisPerTick,
        secondsPerTick,

        millis,

        bpm;

    // public
    function parse(song, events) {

        var event,
            numEvents,
            startEvent = 0,
            lastEventTick = 0,
            diffTicks,
            i;

        numEvents = events.length;
        //console.log('parseEvents', numEvents);
        events.sort(function (a, b) {
            return a.sortIndex - b.sortIndex;
        });

        getDataFromEvent(song.timeEvents[0]);

        for (i = startEvent; i < numEvents; i++) {

            event = events[i];
            //console.log(i, event);
            diffTicks = event.ticks - lastEventTick;
            tick += diffTicks;

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


            switch (event.type) {

                case 0x51:
                    bpm = event.bpm;
                    millis = event.millis;
                    millisPerTick = event.millisPerTick;
                    secondsPerTick = event.secondsPerTick;
                    //console.log(millisPerTick,event.millisPerTick);
                    //console.log(event);
                    break;

                case 0x58:
                    factor = event.factor;
                    nominator = event.nominator;
                    denominator = event.denominator;
                    numSixteenth = event.numSixteenth;
                    ticksPerBar = event.ticksPerBar;
                    ticksPerBeat = event.ticksPerBeat;
                    ticksPerSixteenth = event.ticksPerSixteenth;
                    millis = event.millis;
                    //console.log(nominator,numSixteenth,ticksPerSixteenth);
                    //console.log(event);
                    break;

                default:
                    millis = millis + (diffTicks * millisPerTick);
                    updateEvent(event);
            }

            lastEventTick = event.ticks;
        }
        song.lastEventTmp = event;
    }


    function getDataFromEvent(event) {

        bpm = event.bpm;
        factor = event.factor;
        nominator = event.nominator;
        denominator = event.denominator;

        ticksPerBar = event.ticksPerBar;
        ticksPerBeat = event.ticksPerBeat;
        ticksPerSixteenth = event.ticksPerSixteenth;

        numSixteenth = event.numSixteenth;

        millisPerTick = event.millisPerTick;
        secondsPerTick = event.secondsPerTick;

        millis = event.millis;

        bar = event.bar;
        beat = event.beat;
        sixteenth = event.sixteenth;
        tick = event.tick;
    }


    function updateEvent(event) {
        var timeData, tickAsString;

        timeData = sequencer.getNiceTime(millis);

        event.bpm = bpm;
        event.factor = factor;
        event.nominator = nominator;
        event.denominator = denominator;

        event.ticksPerBar = ticksPerBar;
        event.ticksPerBeat = ticksPerBeat;
        event.ticksPerSixteenth = ticksPerSixteenth;

        event.numSixteenth = numSixteenth;

        event.millisPerTick = millisPerTick;
        event.secondsPerTick = secondsPerTick;

        event.millis = round(millis * precision) / precision;
        //event.millis = millis;
        //event.seconds = millis/1000;

        event.hour = timeData.hour;
        event.minute = timeData.minute;
        event.second = timeData.second;
        event.millisecond = timeData.millisecond;
        event.timeAsString = timeData.timeAsString;
        event.timeAsArray = timeData.timeAsArray;

        event.bar = bar;
        event.beat = beat;
        event.sixteenth = sixteenth;
        event.tick = tick;
        tickAsString = tick === 0 ? '000' : tick < 10 ? '00' + tick : tick < 100 ? '0' + tick : tick;
        event.barsAsString = bar + ':' + beat + ':' + sixteenth + ':' + tickAsString;
        event.barsAsArray = [bar, beat, sixteenth, tick];

        event.state = 'clean';
        event.update();

        //console.log(event.nominator, event.ticks);
    }



    sequencer.protectedScope.parseEvents = parse;

    sequencer.protectedScope.addInitMethod(function () {
    });

}
