window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        createSlider = sequencer.util.createSlider,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start');


    // disable ui until all data is loaded
    enableUI(false);

    // add asset pack, this pack contains a impulse response called simple_ir
    sequencer.addAssetPack({url: '/heartbeat/assets/examples/asset_pack_basic.json'}, function init(){
        var song,
            track,
            tracks = [],
            reverbs = [],
            part,
            events,
            reverb,
            i = 0,
            j,
            ticks,
            noteNumber = [60, 64, 67]; // C major chord

        while(i < 3){
            part = sequencer.createPart();
            track = sequencer.createTrack();
            reverb = sequencer.createReverb('simple_ir');
            reverbs.push(reverb);
            track.addEffect(reverb);
            events = [];
            j = 0;
            ticks = 0;
            while(j < 4){
                events.push(
                    sequencer.createMidiEvent(ticks, 144, noteNumber[i], 100),
                    sequencer.createMidiEvent(ticks + 960/2, 128, noteNumber[i], 0)
                );
                ticks += 960;
                j++;
            }
            part.addEvent(events);
            track.addPart(part);
            //track.setInstrument('piano');
            tracks.push(track);
            i++;
        }

        song = sequencer.createSong({
            bpm: 60,
            tracks: tracks,
            useMetronome: false,
            loop: true
        });

        song.setLeftLocator('barsbeats', 1);
        song.setRightLocator('barsbeats', 2);

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        i = 0;
        while(i < 3){

            (function(){
                var
                elem = document.getElementById('volume-track' + (i + 1)),
                track = tracks[i],
                slider = createSlider({
                    slider: elem,
                    label: elem.previousSibling,
                    message: 'track ' + (i + 1) + ': <em>{value}</em>',
                    onMouseMove: process,
                    //onMouseDown: process,
                    onMouseUp: process,
                });

                function process(value){
                    slider.setLabel(value);
                    track.setVolume(value);
                }
            }());

            (function(){
                var
                elem = document.getElementById('panning-track' + (i + 1)),
                track = tracks[i],
                slider = createSlider({
                    slider: elem,
                    label: elem.previousSibling,
                    message: 'track ' + (i + 1) + ': <em>{value}</em>',
                    onMouseMove: process,
                    onMouseDown: process,
                    onMouseUp: process,
                });

                function process(value){
                    slider.setLabel(value);
                    track.setPanning(value);
                }
            }());


            (function(){
                var
                elem = document.getElementById('reverb-track' + (i + 1)),
                amount = 0,
                reverb = reverbs[i],
                slider = createSlider({
                    slider: elem,
                    label: elem.previousSibling,
                    message: 'track ' + (i + 1) + ': <em>{value}</em>',
                    onMouseMove: handle,
                    onMouseDown: handle,
                    onMouseUp: process,
                });

                slider.setValue(amount);
                slider.setLabel(amount);

                function handle(value){
                    amount = value;
                    slider.setLabel(value);
                }

                function process(){
                    reverb.setAmount(amount);
                }
            }());

            i++;
        }

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