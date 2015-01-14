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
            ppq = sequencer.defaultPPQ,
            events = [],
            timeEvents = [],
            i, ticks = 0,
            noteDuration;

        // start with a regular 4/4 at 120 bpm
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TEMPO, 120));
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, 4, 4));

        // set note duration to eighth notes
        noteDuration = ppq/2;

        // add a bar containing central C notes on every beat
        for(i = 0; i < 4; i++){
            events.push(sequencer.createMidiEvent(ticks, 144, 60, 100)); // note on
            ticks += noteDuration;
            events.push(sequencer.createMidiEvent(ticks, 128, 60, 0)); // note off
            ticks += noteDuration;
        }

        // change time signature to 3/8, note that the metronome ticks are on each eighth note now
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, 3, 8));

        // set note duration to 16th notes
        noteDuration = ppq/4;

        // add a bar containing D notes on every beat
        for(i = 0; i < 3; i++){
            events.push(sequencer.createMidiEvent(ticks, 144, 62, 100)); // note on
            ticks += noteDuration;
            events.push(sequencer.createMidiEvent(ticks, 128, 62, 0)); // note off
            ticks += noteDuration;
        }

        song = sequencer.createSong({
            loop: true,
            bars: 2,
            events: events,
            timeEvents: timeEvents,
            useMetronome: true
        });


        song.setLeftLocator('barsbeats', 1);
        song.setRightLocator('barsbeats', 3);

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        btnMetronome.addEventListener('click', function(){
            song.useMetronome = !song.useMetronome;
            if(song.useMetronome === true){
                btnMetronome.value = 'metronome on';
            }else if(song.useMetronome === false){
                btnMetronome.value = 'metronome off';
            }
        });

        (function(){
            var bpm;
            sliderTempo = createSlider({
                slider: document.getElementById('tempo'),
                min: 10,
                max: 300,
                step: 0.01,
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