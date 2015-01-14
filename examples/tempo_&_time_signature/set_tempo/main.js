/*
    Calling setTempo() multiplies the bpm value of all tempo events in the song by a factor newValue/oldValue.

    For instance if your song has a tempo of 120 bpm and you call setTempo(200), this factor will be 200/120.

    setTempo() also changes the length of the song and the position in bars and beats and millis of all events.

    Note that the ticks value of events and the duration of the song in ticks does not change if you change the tempo.
*/

window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        createSlider = sequencer.util.createSlider,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnMetronome = document.getElementById('metronome'),
        sliderTempo;


    // disable ui until all data is loaded
    enableUI(false);

    sequencer.ready(function init(){
        var song,
            events;

        events = sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            numNotes: 32,
            noteLength: sequencer.defaultPPQ // note length is a quarter note
        });


        song = sequencer.createSong({
            bpm: 120,
            loop: true,
            events: events,
            useMetronome: true
        });

        song.setLeftLocator('barsbeats', 1);
        song.setRightLocator('barsbeats', 9);

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        btnMetronome.addEventListener('click', function(){
            if(song.useMetronome === true){
                song.useMetronome = false;
                btnMetronome.value = 'metronome on';
            }else if(song.useMetronome === false){
                song.useMetronome = true;
                btnMetronome.value = 'metronome off';
            }
        });

        (function(){
            var bpm;
            sliderTempo = createSlider({
                slider: document.getElementById('tempo'),
                min: 10,
                max: 600,
                step: 1,
                message: 'tempo: {value}bpm',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process,
            });

            sliderTempo.setValue(120);
            sliderTempo.setLabel(120);

            function handle(value){
                bpm = value;
                sliderTempo.setLabel(value);
            }

            function process(){
                song.setTempo(bpm);
            }
        }());

        enableUI(true);
    });


    function enableUI(flag){
        var elements = document.querySelectorAll('input'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }
};