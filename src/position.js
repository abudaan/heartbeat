function position() {

    'use strict';

    var
        //import
        round, // → defined in util.js
        floor, // → defined in util.js
        typeString, // → defined in util.js

        supportedTypes = 'barsandbeats barsbeats time millis ticks perc percentage',
        supportedReturnTypes = 'barsandbeats barsbeats time millis ticks all',

        //local
        bpm,
        nominator,
        denominator,

        ticksPerBeat,
        ticksPerBar,
        ticksPerSixteenth,

        millisPerTick,
        secondsPerTick,
        numSixteenth,

        ticks,
        millis,
        diffTicks,
        diffMillis,

        bar,
        beat,
        sixteenth,
        tick,

        type,
        index,
        returnType = 'all',
        beyondEndOfSong = true,

        //public (song)
        millisToTicks,
        ticksToMillis,
        barsToMillis,
        barsToTicks,
        ticksToBars,
        millisToBars,

        //private
        checkBarsAndBeats,
        getDataFromEvent,
        getPositionData,
        calculateBarsAndBeats,

        //protected
        getPosition,
        checkPosition,
        fromMillis,
        fromTicks,
        fromBars;


    function getTimeEvent(song, unit, target) {
        // finds the time event that comes the closest before the target position
        var timeEvents = song.timeEvents,
            i, event;

        for (i = timeEvents.length - 1; i >= 0; i--) {
            event = timeEvents[i];
            if (event[unit] <= target) {
                index = i;
                return event;
            }
        }
    }


    millisToTicks = function (song, targetMillis, beos) {
        beyondEndOfSong = beos === undefined ? true : false;
        fromMillis(song, targetMillis);
        //return round(ticks);
        return ticks;
    };


    ticksToMillis = function (song, targetTicks, beos) {
        beyondEndOfSong = beos === undefined ? true : false;
        fromTicks(song, targetTicks);
        return millis;
    };


    barsToMillis = function (song, position, beos) { // beos = beyondEndOfSong
        position = ['barsbeats'].concat(position);
        getPosition(song, position, 'millis', beos);
        return millis;
    };


    barsToTicks = function (song, position, beos) { // beos = beyondEndOfSong
        position = ['barsbeats'].concat(position);
        getPosition(song, position, 'ticks', beos);
        //return round(ticks);
        return ticks;
    };


    ticksToBars = function (song, ticks, beos) {
        beyondEndOfSong = beos === undefined ? true : false;
        fromTicks(song, ticks);
        calculateBarsAndBeats();
        returnType = 'barsandbeats';
        return getPositionData();
    };


    millisToBars = function (song, millis, beos) {
        beyondEndOfSong = beos === undefined ? true : false;
        fromMillis(song, millis);
        calculateBarsAndBeats();
        returnType = 'barsandbeats';
        return getPositionData();
    };


    fromMillis = function (song, targetMillis, event) {
        var lastEvent = song.lastEvent;

        if (beyondEndOfSong === false) {
            if (targetMillis > lastEvent.millis) {
                targetMillis = lastEvent.millis;
            }
        }

        if (event === undefined) {
            event = getTimeEvent(song, 'millis', targetMillis);
        }
        getDataFromEvent(event);

        // if the event is not exactly at target millis, calculate the diff
        if (event.millis === targetMillis) {
            diffMillis = 0;
            diffTicks = 0;
        } else {
            diffMillis = targetMillis - event.millis;
            diffTicks = diffMillis / millisPerTick;
        }

        millis += diffMillis;
        ticks += diffTicks;

        return ticks;
    };


    fromTicks = function (song, targetTicks, event) {
        var lastEvent = song.lastEvent;

        if (beyondEndOfSong === false) {
            if (targetTicks > lastEvent.ticks) {
                targetTicks = lastEvent.ticks;
            }
        }

        if (event === undefined) {
            event = getTimeEvent(song, 'ticks', targetTicks);
        }
        getDataFromEvent(event);

        // if the event is not exactly at target ticks, calculate the diff
        if (event.ticks === targetTicks) {
            diffTicks = 0;
            diffMillis = 0;
        } else {
            diffTicks = targetTicks - ticks;
            diffMillis = diffTicks * millisPerTick;
        }

        ticks += diffTicks;
        millis += diffMillis;

        return millis;
    };


    fromBars = function (song, targetBar, targetBeat, targetSixteenth, targetTick, event) {
        //console.time('fromBars');
        var i = 0,
            diffBars,
            diffBeats,
            diffSixteenth,
            diffTick,
            lastEvent = song.lastEvent;

        if (beyondEndOfSong === false) {
            if (targetBar > lastEvent.bar) {
                targetBar = lastEvent.bar;
            }
        }

        targetBar = checkBarsAndBeats(targetBar);
        targetBeat = checkBarsAndBeats(targetBeat);
        targetSixteenth = checkBarsAndBeats(targetSixteenth);
        targetTick = checkBarsAndBeats(targetTick, true);

        if (event === undefined) {
            event = getTimeEvent(song, 'bar', targetBar);
        }
        getDataFromEvent(event);

        //correct wrong position data, for instance: '3,3,2,788' becomes '3,4,4,068' in a 4/4 measure at PPQ 480
        while (targetTick >= ticksPerSixteenth) {
            targetSixteenth++;
            targetTick -= ticksPerSixteenth;
        }

        while (targetSixteenth > numSixteenth) {
            targetBeat++;
            targetSixteenth -= numSixteenth;
        }

        while (targetBeat > nominator) {
            targetBar++;
            targetBeat -= nominator;
        }

        event = getTimeEvent(song, 'bar', targetBar, index);
        for (i = index; i >= 0; i--) {
            event = song.timeEvents[i];
            if (event.bar <= targetBar) {
                getDataFromEvent(event);
                break;
            }
        }

        // get the differences
        diffTick = targetTick - tick;
        diffSixteenth = targetSixteenth - sixteenth;
        diffBeats = targetBeat - beat;
        diffBars = targetBar - bar; //bar is always less then or equal to targetBar, so diffBars is always >= 0

        //console.log('diff',diffBars,diffBeats,diffSixteenth,diffTick);
        //console.log('millis',millis,ticksPerBar,ticksPerBeat,ticksPerSixteenth,millisPerTick);

        // convert differences to milliseconds and ticks
        diffMillis = (diffBars * ticksPerBar) * millisPerTick;
        diffMillis += (diffBeats * ticksPerBeat) * millisPerTick;
        diffMillis += (diffSixteenth * ticksPerSixteenth) * millisPerTick;
        diffMillis += diffTick * millisPerTick;
        diffTicks = diffMillis / millisPerTick;
        //console.log(diffBars, ticksPerBar, millisPerTick, diffMillis, diffTicks);

        // set all current position data
        bar = targetBar;
        beat = targetBeat;
        sixteenth = targetSixteenth;
        tick = targetTick;
        //console.log(tick, targetTick)

        millis += diffMillis;
        //console.log(targetBar, targetBeat, targetSixteenth, targetTick, ' -> ', millis);
        ticks += diffTicks;

        //console.timeEnd('fromBars');
    };


    calculateBarsAndBeats = function () {
        // spread the difference in tick over bars, beats and sixteenth
        var tmp = round(diffTicks);
        while (tmp >= ticksPerSixteenth) {
            sixteenth++;
            tmp -= ticksPerSixteenth;
            while (sixteenth > numSixteenth) {
                sixteenth -= numSixteenth;
                beat++;
                while (beat > nominator) {
                    beat -= nominator;
                    bar++;
                }
            }
        }
        tick = round(tmp);
    };


    getDataFromEvent = function (event) {

        bpm = event.bpm;
        nominator = event.nominator;
        denominator = event.denominator;

        ticksPerBar = event.ticksPerBar;
        ticksPerBeat = event.ticksPerBeat;
        ticksPerSixteenth = event.ticksPerSixteenth;
        numSixteenth = event.numSixteenth;
        millisPerTick = event.millisPerTick;
        secondsPerTick = event.secondsPerTick;

        bar = event.bar;
        beat = event.beat;
        sixteenth = event.sixteenth;
        tick = event.tick;

        ticks = event.ticks;
        millis = event.millis;

        //console.log(bpm, event.type);
        //console.log('ticks', ticks, 'millis', millis, 'bar', bar);
    };


    getPositionData = function (song) {
        var timeData,
            tickAsString,
            positionData = {};

        switch (returnType) {

            case 'millis':
                //positionData.millis = millis;
                positionData.millis = round(millis * 1000) / 1000;
                positionData.millisRounded = round(millis);
                break;

            case 'ticks':
                //positionData.ticks = ticks;
                positionData.ticks = round(ticks);
                //positionData.ticksUnrounded = ticks;
                break;

            case 'barsbeats':
            case 'barsandbeats':
                positionData.bar = bar;
                positionData.beat = beat;
                positionData.sixteenth = sixteenth;
                positionData.tick = tick;
                tickAsString = tick === 0 ? '000' : tick < 10 ? '00' + tick : tick < 100 ? '0' + tick : tick;
                //positionData.barsAsString = (bar + 1) + ':' + (beat + 1) + ':' + (sixteenth + 1) + ':' + tickAsString;
                positionData.barsAsString = bar + ':' + beat + ':' + sixteenth + ':' + tickAsString;
                break;

            case 'time':
                timeData = sequencer.getNiceTime(millis);
                positionData.hour = timeData.hour;
                positionData.minute = timeData.minute;
                positionData.second = timeData.second;
                positionData.millisecond = timeData.millisecond;
                positionData.timeAsString = timeData.timeAsString;
                break;

            case 'all':
                // millis
                //positionData.millis = millis;
                positionData.millis = round(millis * 1000) / 1000;
                positionData.millisRounded = round(millis);

                // ticks
                //positionData.ticks = ticks;
                positionData.ticks = round(ticks);
                //positionData.ticksUnrounded = ticks;

                // barsbeats
                positionData.bar = bar;
                positionData.beat = beat;
                positionData.sixteenth = sixteenth;
                positionData.tick = tick;
                tickAsString = tick === 0 ? '000' : tick < 10 ? '00' + tick : tick < 100 ? '0' + tick : tick;
                //positionData.barsAsString = (bar + 1) + ':' + (beat + 1) + ':' + (sixteenth + 1) + ':' + tickAsString;
                positionData.barsAsString = bar + ':' + beat + ':' + sixteenth + ':' + tickAsString;

                // time
                timeData = sequencer.getNiceTime(millis);
                positionData.hour = timeData.hour;
                positionData.minute = timeData.minute;
                positionData.second = timeData.second;
                positionData.millisecond = timeData.millisecond;
                positionData.timeAsString = timeData.timeAsString;

                // extra data
                positionData.bpm = round(bpm * song.playbackSpeed, 3);
                positionData.nominator = nominator;
                positionData.denominator = denominator;

                positionData.ticksPerBar = ticksPerBar;
                positionData.ticksPerBeat = ticksPerBeat;
                positionData.ticksPerSixteenth = ticksPerSixteenth;

                positionData.numSixteenth = numSixteenth;
                positionData.millisPerTick = millisPerTick;
                positionData.secondsPerTick = secondsPerTick;

                // use ticks to make tempo changes visible by a faster moving playhead
                positionData.percentage = ticks / song.durationTicks;
                //positionData.percentage = millis / song.durationMillis;
                break;
        }

        return positionData;
    };


    checkBarsAndBeats = function (value, isTick) {
        value = isNaN(value) ? isTick ? 0 : 1 : value;
        value = round(value);
        //value = value > maxValue ? maxValue : value;
        if (isTick) {
            value = value < 0 ? 0 : value;
        } else {
            value = value < 1 ? 1 : value;
        }
        return value;
    };


    //@param: 'millis', 1000, [true]
    //@param: 'ticks', 1000, [true]
    //@param: 'barsandbeats', 1, ['all', true]
    //@param: 'barsandbeats', 60, 4, 3, 120, ['all', true]
    //@param: 'barsandbeats', 60, 4, 3, 120, [true, 'all']

    checkPosition = function (args) {
        returnType = 'all';
        beyondEndOfSong = true;
        //console.log('----> checkPosition:', args);

        if (typeString(args) === 'array') {
            var
                numArgs = args.length,
                position,
                i, a, positionLength;

            type = args[0];

            // support for [['millis', 3000]]
            if (typeString(args[0]) === 'array') {
                //console.warn('this shouldn\'t happen!');
                args = args[0];
                type = args[0];
                numArgs = args.length;
            }

            position = [type];

            //console.log('check position', args, numArgs);

            //console.log('arg', 0, '->', type);

            if (supportedTypes.indexOf(type) !== -1) {
                for (i = 1; i < numArgs; i++) {
                    a = args[i];
                    //console.log('arg', i, '->', a);
                    if (a === true || a === false) {
                        beyondEndOfSong = a;
                    } else if (isNaN(a)) {
                        if (supportedReturnTypes.indexOf(a) !== -1) {
                            returnType = a;
                        } else {
                            return false;
                        }
                    } else {
                        position.push(a);
                    }
                }
                //check number of arguments -> either 1 number or 4 numbers in position, e.g. ['barsbeats', 1] or ['barsbeats', 1, 1, 1, 0],
                // or ['perc', 0.56, numberOfTicksToSnapTo]
                positionLength = position.length;
                if (positionLength !== 2 && positionLength !== 3 && positionLength !== 5) {
                    return false;
                }
                //console.log(position, returnType, beyondEndOfSong);
                //console.log('------------------------------------')
                return position;
            }
        }
        return false;
    };

    function getPosition2(song, unit, target, type, event) {
        if (unit === 'millis') {
            fromMillis(song, target, event);
        } else if (unit === 'ticks') {
            fromTicks(song, target, event);
        }
        if (type === 'all') {
            calculateBarsAndBeats();
        }
        return getPositionData(song);
    }

    getPosition = function (song, args) {
        //console.log('getPosition', args);

        var position = checkPosition(args),
            millis, tmp, snap;

        if (position === false) {
            console.error('wrong position data');
            return false;
        }

        switch (type) {

            case 'barsbeats':
            case 'barsandbeats':
                fromBars(song, position[1], position[2], position[3], position[4]);
                return getPositionData(song);

            case 'time':
                // calculate millis out of time array: hours, minutes, seconds, millis
                millis = 0;
                tmp = position[1] || 0;
                millis += tmp * 60 * 60 * 1000; //hours
                tmp = position[2] || 0;
                millis += tmp * 60 * 1000; //minutes
                tmp = position[3] || 0;
                millis += tmp * 1000; //seconds
                tmp = position[4] || 0;
                millis += tmp; //milliseconds

                fromMillis(song, millis);
                calculateBarsAndBeats();
                return getPositionData(song);

            case 'millis':
                fromMillis(song, position[1]);
                calculateBarsAndBeats();
                return getPositionData(song);

            case 'ticks':
                fromTicks(song, position[1]);
                calculateBarsAndBeats();
                return getPositionData(song);

            case 'perc':
            case 'percentage':
                snap = position[2];

                //millis = position[1] * song.durationMillis;
                //fromMillis(song, millis);
                //console.log(millis);

                ticks = position[1] * song.durationTicks;
                if (snap !== undefined) {
                    ticks = floor(ticks / snap) * snap;
                    //fromTicks(song, ticks);
                    //console.log(ticks);
                }
                fromTicks(song, ticks);
                calculateBarsAndBeats();
                tmp = getPositionData(song);
                //console.log('diff', position[1] - tmp.percentage);
                return tmp;
        }
        return false;
    };


    sequencer.protectedScope.getPosition = getPosition;
    sequencer.protectedScope.getPosition2 = getPosition2;
    sequencer.protectedScope.checkPosition = checkPosition;

    sequencer.protectedScope.millisToTicks = millisToTicks;
    sequencer.protectedScope.ticksToMillis = ticksToMillis;
    sequencer.protectedScope.ticksToBars = ticksToBars;
    sequencer.protectedScope.millisToBars = millisToBars;
    sequencer.protectedScope.barsToTicks = barsToTicks;
    sequencer.protectedScope.barsToMillis = barsToMillis;

    sequencer.protectedScope.addInitMethod(function () {
        round = sequencer.protectedScope.round;
        floor = sequencer.protectedScope.floor;
        typeString = sequencer.protectedScope.typeString;
    });
}
