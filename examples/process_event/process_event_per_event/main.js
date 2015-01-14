window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        i, midiEvent,
        ticks = 0,
        noteNumber,
        velocity,
        bpm = 240,
        noteDuration = 120, // ticks
        numEvents = 100;


    sequencer.ready(function init(){
        btnStart.addEventListener('click', function(){
            createEvents();
        });

        btnStop.addEventListener('click', function(){
            sequencer.stopProcessEvents();
        });
    });


    function getRandom(min, max, round){
        var r = Math.random() * (max - min) + min;
        if(round === true){
            return Math.round(r);
        }else{
            return r;
        }
    }


    function createEvents(){
        ticks = 0;

        for(i = 0; i < numEvents; i++){
            noteNumber = getRandom(50, 100, true);
            velocity = getRandom(30, 80, true);

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
            sequencer.processEvents(midiEvent, bpm);
            ticks += noteDuration;

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
            sequencer.processEvents(midiEvent, bpm);
            ticks += noteDuration;
        }
    }
};