/*
    If you use setTempo() all tempo events in the song will be changed.

    In this example we use updateTempoEvent() to update a single tempo event and leaving
    the other tempo events and the song's base tempo unaffected.

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
        divPosition = document.getElementById('position'),
        sliderTempo;


    // disable ui until all data is loaded
    enableUI(false);

    sequencer.ready(function init(){
        var song,
            tempoEvent,
            ppq = sequencer.defaultPPQ,
            events = [],
            timeEvents = [],
            i, ticks = 0,
            divider = 4;

        // add a tempo and a time signature event at the start of the song
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, 4, 4));
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TEMPO, 120));

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

        // the tempo event whose bpm value gets updated by the tempo slider
        tempoEvent = timeEvents[2];

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
            var slider = document.getElementById('tempo'),
                bpm;

            sliderTempo = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: 10,
                max: 300,
                step: 0.01,
                message: 'bpm value of 2nd time event in bar 2: {value}',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process,
            });

            sliderTempo.setValue(240);
            sliderTempo.setLabel(240);

            function handle(value){
                sliderTempo.setLabel(value);
                bpm = value;
            }

            function process(){
                song.updateTempoEvent(tempoEvent, bpm);
            }
        }());

        (function render(){
            divPosition.innerHTML = song.barsAsString + ' ' + song.bpm + ' bpm';
            requestAnimationFrame(render);
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