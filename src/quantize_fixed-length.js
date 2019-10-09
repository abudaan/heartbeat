function quantizeFixedLength() {

    'use strict';

    var
        copyObject, // defined in util.js

        floor = Math.floor,
        round = Math.round,

        noteFractions =
        {
            '1': 1 * 4, // whole note
            '1.': 1.5 * 4,
            '1..': 1.75 * 4,
            '1...': 1.875 * 4,
            '1T': 2 / 3 * 4,

            '2': 1 * 2, // half note
            '2.': 1.5 * 2,
            '2..': 1.75 * 2,
            '2...': 1.875 * 2,
            '2T': 2 / 3 * 2,

            '4': 1 * 1, // quarter note (beat)
            '4.': 1.5 * 1,
            '4..': 1.75 * 1,
            '4...': 1.875 * 1,
            '4T': 2 / 3 * 1,

            '8': 1 * 1 / 2, // eighth note
            '8.': 1.5 * 1 / 2,
            '8..': 1.75 * 1 / 2,
            '8...': 1.875 * 1 / 2,
            '8T': 2 / 3 * 1 / 2,

            '16': 1 * 1 / 4, // sixteenth note
            '16.': 1.5 * 1 / 4,
            '16..': 1.75 * 1 / 4,
            '16...': 1.875 * 1 / 4,
            '16T': 2 / 3 * 1 / 4,

            '32': 1 * 1 / 8,
            '32.': 1.5 * 1 / 8,
            '32..': 1.75 * 1 / 8,
            '32...': 1.875 * 1 / 8,
            '32T': 2 / 3 * 1 / 8,

            '64': 1 * 1 / 16,
            '64.': 1.5 * 1 / 16,
            '64..': 1.75 * 1 / 16,
            '64...': 1.875 * 1 / 16,
            '64T': 2 / 3 * 1 / 16,

            '128': 1 * 1 / 32,
            '128.': 1.5 * 1 / 32,
            '128..': 1.75 * 1 / 32,
            '128...': 1.875 * 1 / 32,
            '128T': 2 / 3 * 1 / 32
        };




    function quantize(events, value, ppq, history) {
        var track;

        value = '' + value;
        value = value.toUpperCase();
        ppq = ppq || sequencer.defaultPPQ;
        //console.log('quantize', value);
        if (value === 0) {// pass by
            return {};
        }
        var i, event, ticks, quantized, diff, quantizeTicks,
            quantizeHistory = history || {};

        if (quantizeHistory.events === undefined) {
            quantizeHistory.events = {};
        }

        if (quantizeHistory.tracks === undefined) {
            quantizeHistory.tracks = {};
        }

        //console.log(events, value, ppq, history);

        if (value.indexOf('TICKS') !== -1) {
            quantizeTicks = parseInt(value.replace(/TICKS/, ''), 10);
        } else {
            quantizeTicks = noteFractions[value] * ppq;
        }

        //console.log('quantize', quantizeTicks);

        if (quantizeTicks === undefined) {
            if (sequencer.debug) {
                console.warn('invalid quantize value');
            }
            return;
        }

        for (i = events.length - 1; i >= 0; i--) {
            event = events[i];

            quantizeHistory.events[event.id] = {
                event: event,
                ticks: event.ticks
            };

            if (event.type !== 128) {
                ticks = event.ticks;
                quantized = round(ticks / quantizeTicks) * quantizeTicks;
                //console.log(ticks, quantized, '[', ppq, ']');
                diff = quantized - ticks;
                event.ticks = quantized;
                event.state = 'changed';
                event.part.needsUpdate = true;
                event.track.needsUpdate = true;

                // add quantize history per track as well
                track = event.track;
                if (quantizeHistory.tracks[track.id] === undefined) {
                    quantizeHistory.tracks[track.id] = {
                        track: track,
                        quantizedEvents: []
                    };
                }
                quantizeHistory.tracks[track.id].quantizedEvents.push(event);

                // quantize the note off event
                if (event.midiNote !== undefined) {
                    event.midiNote.noteOff.ticks += diff;
                    event.midiNote.noteOff.state = 'changed';
                    event.midiNote.state = 'changed';
                    quantizeHistory.tracks[track.id].quantizedEvents.push(event.midiNote.noteOff);
                }
            }
        }

        return quantizeHistory;//copyObject(quantizeHistory);
    }


    function fixedLength(events, value, ppq, history) {
        var fixedLengthHistory = history || {};

    }


    sequencer.protectedScope.addInitMethod(function () {
        copyObject = sequencer.protectedScope.copyObject;
    });

    sequencer.quantize = quantize;
    sequencer.fixedLength = fixedLength;

}


