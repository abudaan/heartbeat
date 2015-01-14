window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        createSlider = sequencer.util.createSlider,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        sliderReverb;


    // disable ui until all data is loaded
    enableUI(false);


    // add asset pack, this pack contains a piano
    sequencer.addAssetPack({url: '/heartbeat/assets/examples/asset_pack_basic.json'}, init);

    function init(){
        var song,
            track,
            reverb,
            events;

        events = sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            numNotes: 16
        });


        song = sequencer.createSong({
            bpm: 60,
            events: events,
            useMetronome: true,
            loop: true
        });

        song.setLeftLocator('barsbeats', 1);
        song.setRightLocator('barsbeats', 5);

        // create the convolution reverb; the parameter 'simple_ir' is the name of the audio file that is used as impulse response
        // 'simple_ir' is a sample in the sample pack 'VS8F', see below
        reverb = sequencer.createReverb('simple_ir');

        track = song.tracks[0];
        track.setInstrument('piano');
        track.addEffect(reverb);

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });


        (function(){
            var slider = document.getElementById('reverb'),
                amount = 0;

            sliderReverb = createSlider({
                slider: slider,
                label: slider.previousSibling,
                message: 'reverb: <em>{value}</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process,
            });

            sliderReverb.setValue(amount);
            sliderReverb.setLabel(amount);

            function handle(value){
                amount = value;
                sliderReverb.setLabel(value);
            }

            function process(){
                reverb.setAmount(amount);
            }
        }());

        enableUI(true);
    }


    function enableUI(flag){
        var elements = document.querySelectorAll('input'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }
};