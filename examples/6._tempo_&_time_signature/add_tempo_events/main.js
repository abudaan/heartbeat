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
            divider = 4;

        // add the mandatory tempo events at the start of the song
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TEMPO, 120));
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, 4, 4));

        // add a bar containing central C notes on every beat
        for(i = 0; i < 4; i++){
            events.push(sequencer.createMidiEvent(ticks, 144, 60, 100)); // note on
            ticks += ppq/divider; // note duration is a 16th note
            events.push(sequencer.createMidiEvent(ticks, 128, 60, 0)); // note off
            ticks += (divider - 1) * (ppq/divider); // next note comes on the next beat
        }

        // double the tempo at the start of the 2nd bar
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TEMPO, 240));

        // add one more bar containing D notes on every beat
        for(i = 0; i < 4; i++){
            events.push(sequencer.createMidiEvent(ticks, 144, 62, 100)); // note on
            ticks += ppq/divider; // note duration is a 16th note
            events.push(sequencer.createMidiEvent(ticks, 128, 62, 0)); // note off
            ticks += (divider - 1) * (ppq/divider); // next note comes on the next beat
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