/*

    operators:

    - max
    - min
    - avg
    - all


    eventStats.get('noteNumber max');
    eventStats.get('noteNumber min');
    eventStats.get('noteNumber avg');

    eventStats.get('data2 max type = PITCH_BEND');
    eventStats.get('data2 min');
    eventStats.get('data2 avg');

    eventStats.get('velocity avg bar = 3');

    eventStats.get('velocity max musical_time > 1,1,1,0 < 8,1,1,0');


    return {
        min: min,
        max: max,
        avg: avg
    };


    implementation:

    song.getStats(searchString);
    track.getStats(searchString);
    sequencer.getStats(events, searchString);


*/

function eventStatistics() {

    'use strict';

    var
        //import
        createNote = sequencer.createNote, // → defined in note.js
        findEvent = sequencer.findEvent, // → defined in find_event.js
        round = sequencer.protectedScope.round, // → defined in util.js
        getEvents = sequencer.protectedScope.getEvents, // → defined in find_event.js
        typeString = sequencer.protectedScope.typeString, // → defined in util.js

        supportedOperators = 'max min avg all',
        supportedProperties = 'data1 data2 velocity noteNumber noteName frequency',

        //public
        getStats;


    /**
        @memberof sequencer
        @instance
        @param {array} events
        @param {string} searchString
        @description Get statistics of an array of events, see [documentation]{@link http://heartbeatjs.org/docs/statistics}
    */
    getStats = function () {
        var args = Array.prototype.slice.call(arguments),
            numArgs = args.length,
            property,
            operator,
            events,
            searchPattern,
            patternLength,
            i, maxi, event, propValue,
            minNoteName,
            maxNoteName,
            min = 128,//Number.MAX_VALUE,
            max = -1,
            sum = 0,
            avg = 0,
            useNoteName = false;


        events = getEvents(args[0]);

        if (events.length === 0) {
            //console.warn('getStats: no events');
            return -1;
        }

        searchPattern = args[1];

        if (typeString(searchPattern) !== 'string') {
            console.error('please provide a search string like for instance get(\'velocity max bar >= 1 < 8\')');
            return -1;
        }

        if (numArgs > 2) {
            console.warn('ignoring invalid arguments, please consult documentation');
        }

        searchPattern = searchPattern.split(' ');
        patternLength = searchPattern.length;

        property = searchPattern[0];
        operator = searchPattern[1];

        if (supportedProperties.indexOf(property) === -1) {
            console.error('you can\'t use \'min\', \'max\' or \'avg\'', 'on the property', property);
            return -1;
        }

        if (supportedOperators.indexOf(operator) === -1) {
            console.error(operator, 'is not a valid operator');
            return -1;
        }


        if (patternLength > 2) {

            //if(patternLength !== 5 && !(patternLength >= 7)){
            if (patternLength === 6) {
                console.warn('ignoring cruft found in search string, please consult documentation');
            }

            searchPattern.shift(); // remove property
            searchPattern.shift(); // remove operator

            //filter events
            events = findEvent(events, searchPattern.join(' '));
        }

        //console.log(events);

        if (property === 'noteName') {
            property = 'noteNumber';
            useNoteName = true;
        }

        for (i = 0, maxi = events.length; i < maxi; i++) {
            event = events[i];
            propValue = event[property];

            if (propValue > max) {
                //console.log('max', propValue, max);
                max = propValue;
                maxNoteName = event.noteName;
            }
            if (propValue < min) {
                //console.log('min', propValue, min);
                min = propValue;
                minNoteName = event.noteName;
            }

            if (propValue !== undefined) {
                sum += propValue;
            }
        }

        avg = sum / maxi;

        if (useNoteName) {
            avg = round(avg);
            avg = createNote(avg).name;
            min = minNoteName;
            max = maxNoteName;
        }

        if (operator === 'max') {
            return max;
        }

        if (operator === 'min') {
            return min;
        }

        if (operator === 'avg') {
            return avg;
        }

        if (operator === 'all') {
            return {
                min: min,
                max: max,
                avg: avg
            };
        }
    };

    sequencer.getStats = getStats;

    sequencer.protectedScope.addInitMethod(function () {
        createNote = sequencer.createNote;
        findEvent = sequencer.findEvent;
        round = sequencer.protectedScope.round;
        getEvents = sequencer.protectedScope.getEvents;
        typeString = sequencer.protectedScope.typeString;
    });

}