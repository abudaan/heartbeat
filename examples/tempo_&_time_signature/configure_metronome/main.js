window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        round = sequencer.util.round,
        createSlider = sequencer.util.createSlider,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnReset = document.getElementById('reset'),
        selectInstrument = document.getElementById('instrument'),
        sliderTempo,
        sliderVolume,
        sliderNoteNumberAccented,
        sliderNoteNumberNonAccented,
        sliderVelocityAccented,
        sliderVelocityNonAccented,
        sliderNoteLengthAccented,
        sliderNoteLengthNonAccented,

        path = '../../../assets';


    // disable ui until all data is loaded
    enableUI(false);

    //sequencer.ready(function init(){
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, function init(){
        var song = sequencer.createSong({
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

        btnReset.addEventListener('click', function(){
            song.resetMetronome();
            resetUI();
        });


        function resetUI(){
            var metronome = song.metronome;
            sliderTempo.set(120);
            sliderVolume.set(1);
            sliderVelocityAccented.set(metronome.velocityAccented);
            sliderVelocityNonAccented.set(metronome.velocityNonAccented);
            sliderNoteNumberAccented.set(metronome.noteNumberAccented);
            sliderNoteNumberNonAccented.set(metronome.noteNumberNonAccented);
            sliderNoteLengthAccented.set(metronome.noteLengthAccented);
            sliderNoteLengthNonAccented.set(metronome.noteLengthNonAccented);
            selectInstrument.selectedIndex = 0;
        }


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
                onMouseUp: process
            });


            function handle(value){
                currentValue = value;
                sliderTempo.setLabel(value);
            }

            function process(){
                song.setTempo(currentValue);
            }

            sliderTempo.set = function(value){
                currentValue = value;
                this.setLabel(value);
                this.setValue(value);
                process(value);
            };
        }());


        (function(){
            var slider = document.getElementById('volume');
            sliderVolume = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: 0,
                max: 1,
                step: 'any',
                message: 'volume: <em>{value}%</em>',
                onMouseMove: process,
                onMouseDown: process
            });

            function process(value){
                sliderVolume.setLabel(round(value * 100, 1));
                song.setMetronomeVolume(value);
            }

            sliderVolume.set = function(value){
                this.setValue(value);
                process(value);
            };
        }());


        (function(){
            var slider = document.getElementById('velocity-accented-tick'),
                currentValue;

            sliderVelocityAccented = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: 0,
                max: 127,
                step: 1,
                message: 'velocity accented tick: <em>{value}</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process
            });

            function handle(value){
                currentValue = value;
                sliderVelocityAccented.setLabel(value);
            }

            function process(){
                song.configureMetronome({
                    velocityAccentedTick: currentValue
                });
                // or use:
                //song.metronome.setVelocityAccentedTick(currentValue);
            }

            sliderVelocityAccented.set = function(value){
                currentValue = value;
                this.setValue(value);
                this.setLabel(value);
                process(value);
            };
        }());


        (function(){
            var slider = document.getElementById('velocity-non-accented-tick'),
                currentValue;

            sliderVelocityNonAccented = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: 0,
                max: 127,
                step: 1,
                message: 'velocity non accented tick: <em>{value}</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process
            });


            function handle(value){
                currentValue = value;
                sliderVelocityNonAccented.setLabel(value);
            }

            function process(){
                song.configureMetronome({
                    velocityNonAccentedTick: currentValue
                });
                // or use:
                //song.metronome.setVelocityNonAccentedTick(currentValue);
            }

            sliderVelocityNonAccented.set = function(value){
                currentValue = value;
                this.setValue(value);
                this.setLabel(value);
                process(value);
            };
        }());


        (function(){
            var slider = document.getElementById('notenumber-accented-tick'),
                currentValue;

            sliderNoteNumberAccented = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: 0,
                max: 127,
                step: 1,
                message: 'note number accented tick: <em>{value}</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process
            });


            function handle(value){
                currentValue = value;
                sliderNoteNumberAccented.setLabel(value);
            }

            function process(){
                song.configureMetronome({
                    noteNumberAccentedTick: currentValue
                });
                // or use:
                //song.metronome.setNoteNumberAccentedTick(currentValue);
            }

            sliderNoteNumberAccented.set = function(value){
                currentValue = value;
                this.setValue(value);
                this.setLabel(value);
                process(value);
            };
        }());


        (function(){
            var slider = document.getElementById('notenumber-non-accented-tick'),
                currentValue;

            sliderNoteNumberNonAccented = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: 0,
                max: 127,
                step: 1,
                message: 'note number non accented tick: <em>{value}</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process
            });


            function handle(value){
                currentValue = value;
                sliderNoteNumberNonAccented.setLabel(value);
            }

            function process(){
                song.configureMetronome({
                    noteNumberNonAccentedTick: currentValue
                });
                // or use:
                //song.metronome.setNoteNumberNonAccentedTick(currentValue);
            }

            sliderNoteNumberNonAccented.set = function(value){
                currentValue = value;
                this.setValue(value);
                this.setLabel(value);
                process(value);
            };
        }());


        (function(){
            var slider = document.getElementById('notelength-accented-tick'),
                currentValue;

            sliderNoteLengthAccented = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: song.ppq/16,
                max: song.ppq,
                step: 1,
                message: 'note length accented tick: <em>{value}</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process
            });

            function handle(value){
                currentValue = value;
                getNoteLengthName();
            }

            function getNoteLengthName(){
                var name = song.getNoteLengthName(currentValue);
                if(name !== false){
                    sliderNoteLengthAccented.setLabel(name);
                }else{
                    sliderNoteLengthAccented.setLabel(currentValue + ' ticks');
                }
            }

            function process(){
                song.configureMetronome({
                    noteLengthAccentedTick: currentValue
                });
                // or use:
                //song.metronome.setNoteLengthAccentedTick(currentValue);
            }

            sliderNoteLengthAccented.set = function(value){
                currentValue = value;
                getNoteLengthName();
                this.setValue(value);
                process(value);
            };
        }());


        (function(){
            var slider = document.getElementById('notelength-non-accented-tick'),
                currentValue;

            sliderNoteLengthNonAccented = createSlider({
                slider: slider,
                label: slider.previousSibling,
                min: song.ppq/16,
                max: song.ppq,
                step: 1,
                message: 'note length non accented tick: <em>{value}</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process
            });

            function handle(value){
                currentValue = value;
                getNoteLengthName();
            }

            function getNoteLengthName(){
                var name = song.getNoteLengthName(currentValue);
                if(name !== false){
                    sliderNoteLengthNonAccented.setLabel(name);
                }else{
                    sliderNoteLengthNonAccented.setLabel(currentValue + ' ticks');
                }
            }

            function process(){
                song.configureMetronome({
                    noteLengthNonAccentedTick: currentValue
                });
                // or use:
                //song.metronome.setNoteLengthNonAccentedTick(value);
            }

            sliderNoteLengthNonAccented.set = function(value){
                currentValue = value;
                getNoteLengthName();
                this.setValue(value);
                process(value);
            };
        }());


        selectInstrument.addEventListener('change', function(){
            var instrument = selectInstrument.options[selectInstrument.selectedIndex].value;
            song.configureMetronome({
                instrument: instrument
            });
            // or use:
            //song.metronome.setInstrument(instrument);
        });

        enableUI(true);
        resetUI();
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