window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        bpm = 240;


    sequencer.ready(function init(){
        var events = sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            noteDuration: 120, //ticks
            numNotes: 30
        });

        btnStart.addEventListener('click', function(){
            sequencer.processEvents(events, bpm);
        });

        btnStop.addEventListener('click', function(){
            sequencer.stopProcessEvents();
        });
    });
};