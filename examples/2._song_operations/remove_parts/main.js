window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnRemoveParts = document.getElementById('remove'),

        // relative path to assets
        path = '../../../assets';


    /*
        load asset pack, this asset pack contains:
        - sample pack with name 'piano' -> will be stored in sequencer/storage/audio/instruments/piano
        - sample pack with name 'VS8F' -> will be stored in sequencer/storage/audio/ir/VS8F
        - instrument with name 'piano' -> will be stored in sequencer/instruments/piano
        - midifile with name 'Sonata Facile' -> will be stored in sequencer/midi/Classical/Sonata Facile

        after the loading has completed, the init method is called
    */
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);

    enableUI(false);

    function init(){
        var song, midiFile;

        // get the midi file from sequencer.storage
        midiFile = sequencer.getMidiFile('Sonata Facile');

        midiFile.useMetronome = true;

        song = sequencer.createSong(midiFile);
        song.tracks.forEach(function(track){
            track.setInstrument('piano');
        });

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        btnRemoveParts.addEventListener('click', function(){
            // song.removeParts(song.parts);
            song.tracks.forEach(function(track){
                track.removeParts(track.parts);
            });
            song.update();
            song.tracks.forEach(function(track){
                console.log(track.parts);
            });
        });

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

};