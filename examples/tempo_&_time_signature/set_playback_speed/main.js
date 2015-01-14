window.onload = function(){

    'use strict';

    /*
        Changing the playback speed of a song does not change the tempo of the song, the song duration nor the
        position of the events.

        So if a song has a tempo of 120 bpm and you play it at double speed by song.setPlaybackSpeed(2), it only
        sounds like the song plays back at tempo 240 bpm.
    */

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        createSlider = sequencer.util.createSlider,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnMetronome = document.getElementById('metronome'),
        sliderSpeed;


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
            numNotes: 32
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
            var currentValue;
            sliderSpeed = createSlider({
                slider: document.getElementById('playbackspeed'),
                min: 0.1,
                max: 20,
                step: 0.1,
                message: 'playbackspeed: {value}x',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process,
            });

            sliderSpeed.setValue(1);
            sliderSpeed.setLabel(1);

            function handle(value){
                currentValue = value;
                sliderSpeed.setLabel(value);
            }

            function process(){
                song.setPlaybackSpeed(currentValue);
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