window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start');


    sequencer.ready(function init(){
        var song,
            ticks = 0,
            events = [],
            midiEvent;

        // sustain pedal down
        midiEvent = sequencer.createMidiEvent(ticks, sequencer.CONTROL_CHANGE, 64, 127);
        events.push(midiEvent);

        // add some random notes
        events = events.concat(sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 80,
            minVelocity: 30,
            maxVelocity: 80,
            numNotes: 8
        }));

        // sustain pedal up at the end of bar 2, 384 is the default value for ppq
        ticks = 384 * 4 * 2;
        midiEvent = sequencer.createMidiEvent(ticks, sequencer.CONTROL_CHANGE, 64, 0);
        events.push(midiEvent);

        song = sequencer.createSong({
            events: events,
            useMetronome: true
        });

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });
    });

};