window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        message = document.getElementById('message'),
        sliderTranspose = document.getElementById('transpose'),
        path = '../../../assets';


    sliderTranspose.name = 'transpose';
    sliderTranspose.label = sliderTranspose.parentNode.firstChild;
    enableUI(false);

    /*
        load asset pack, this asset pack contains:
        - sample pack with name 'piano' -> will be stored in sequencer/storage/audio/instruments/piano
        - sample pack with name 'VS8F' -> will be stored in sequencer/storage/audio/ir/VS8F
        - instrument with name 'piano' -> will be stored in sequencer/instruments/piano
        - midifile with name 'Sonata Facile' -> will be stored in sequencer/midi/classical/Sonata Facile

        after the loading has completed, the init method is called
    */
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);


    function init(){
        var track, song, instrument;

        track = sequencer.createTrack();
        track.setInstrument('piano');
        // set monitor to true to route the incoming midi events to the track
        track.monitor = true;
        track.setMidiInput('all');
        instrument = track.instrument;

        song = sequencer.createSong({
            tracks: track
        });

        sliderTranspose.addEventListener('mousedown', function(){
            sliderTranspose.addEventListener('mousemove', handleSliderMove, false);
        }, false);

        sliderTranspose.addEventListener('mouseup', function(){
            sliderTranspose.removeEventListener('mousemove', handleSliderMove, false);
            enableUI(false);
            setTimeout(function(){
                instrument.transpose(
                    sliderTranspose.valueAsNumber,
                    function(){
                        message.innerHTML = '';
                        enableUI(true);
                    },
                    function(msg){
                        message.innerHTML = msg;
                    }
                );
            },10);
        }, false);


        enableUI(true);
    }


    function enableUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }


    function handleSliderMove(e){
        var slider = e.target;
        slider.label.innerHTML = slider.name + ': ' + slider.valueAsNumber;
    }
};