/*
    If you use setTimeSignature() all time signature events in the song will be changed.

    In this example we use updateTimeSignatureEvent() to update a single time signature event and leaving
    the other time signature events and the song's base time signature unaffected.

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
        divTimeSignature = document.getElementById('time-signature'),
        selectDenominator = document.getElementById('denominator'),
        sliderNominator;


    // disable ui until all data is loaded
    enableUI(false);

    sequencer.ready(function init(){
        var song,
            nominator = 3,
            denominator = 8,
            timeSignatureEvent,
            ticks = 0,
            ppq = sequencer.defaultPPQ,
            timeEvents = [];


        // add a tempo and a time signature event at the start of the song
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, 4, 4));
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TEMPO, 120));

        // add another time signature event at the start of the 2nd bar
        ticks += 4 * ppq;
        timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, 3, 8));

        // the time signature event whose nominator and denominator value gets updated by the tempo slider and the dropdown
        timeSignatureEvent = timeEvents[2];

        song = sequencer.createSong({
            loop: true,
            bars: 2,
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

        selectDenominator.addEventListener('change', function(){
            denominator = selectDenominator.options[selectDenominator.selectedIndex].value;
            song.updateTimeSignatureEvent(timeSignatureEvent, nominator, denominator);
            divTimeSignature.innerHTML = '<em>' + nominator + '/' + denominator + '</em>';
            song.setRightLocator('barsbeats', 3);
        });


        (function(){
            var slider = document.getElementById('nominator');

            sliderNominator = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: 1,
                max: 24,
                step: 1,
                message: 'nominator: <em>{value}</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process,
            });

            sliderNominator.setValue(nominator);
            sliderNominator.setLabel(nominator);

            function handle(value){
                nominator = value;
                sliderNominator.setLabel(value);
            }

            function process(){
                song.updateTimeSignatureEvent(timeSignatureEvent, nominator, denominator);
                divTimeSignature.innerHTML = '<em>' + nominator + '/' + denominator + '</em>';
                /*
                    Locators are ultimately positioned on tick positions. If you change the time signature the tick position
                    of a bar can change, therefor the locators have to be re-positioned. Because the left locator is at the
                    start of the song, only the right locator has to be re-positioned.
                */
                song.setRightLocator('barsbeats', 3);
            }
        }());


        (function render(){
            divPosition.innerHTML = song.barsAsString + ' ' + song.nominator + '/' + song.denominator;
            requestAnimationFrame(render);
        }());

        selectDenominator.selectedIndex = 3; // eighth note
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