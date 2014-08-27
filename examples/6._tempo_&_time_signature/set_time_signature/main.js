/*
    Calling setTimeSignature() changes the nominator and/or the denominator of all time events in the song.

    If you want to change a specific time event use updateTimeSignatureEvent() or updateTempoEvent()
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
        divPosition = document.getElementById('position'),
        divTimeSignature = document.getElementById('time-signature'),
        selectDenominator = document.getElementById('denominator'),
        sliderTempo,
        sliderNominator;


    // disable ui until all data is loaded
    enableUI(false);

    sequencer.ready(function init(){
        var song,
            nominator = 4,
            denominator = 4;

        song = sequencer.createSong({
            nominator: 4,
            denominator: 4,
            loop: true,
            bars: 2,
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

        (function(){
            var slider = document.getElementById('tempo'),
                currentValue;

            sliderTempo = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: 10,
                max: 300,
                step: 0.01,
                message: 'tempo: <em>{value}bpm</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process,
            });

            sliderTempo.setValue(120);
            sliderTempo.setLabel(120);

            function handle(value){
                currentValue = value;
                sliderTempo.setLabel(value);
            }

            function process(){
                song.setTempo(currentValue);
            }
        }());


        (function(){
            var slider = document.getElementById('nominator');
            sliderNominator = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: 1,
                max: 24, // note that there is no music theoretically defined limit to the value of the nominator
                step: 1,
                message: 'nominator: <em>{value}</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process,
            });

            sliderNominator.setValue(4);
            sliderNominator.setLabel(4);

            function handle(value){
                nominator = value;
                sliderNominator.setLabel(value);
            }

            function process(){
                song.setTimeSignature(nominator, denominator);
                divTimeSignature.innerHTML = nominator + '/' + denominator;
                song.setRightLocator('barsbeats', 3);
            }
        }());


        selectDenominator.addEventListener('change', function(){
            denominator = selectDenominator.options[selectDenominator.selectedIndex].value;
            song.setTimeSignature(nominator, denominator);
            divTimeSignature.innerHTML = nominator + '/' + denominator;
            song.setRightLocator('barsbeats', 3);
        });


        (function render(){
            divPosition.innerHTML = song.barsAsString;
            requestAnimationFrame(render);
        }());

        selectDenominator.selectedIndex = 2;
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