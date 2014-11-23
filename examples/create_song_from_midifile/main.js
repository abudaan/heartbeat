window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        testMethod = 1,
        path = '../../assets';


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
        var song, midiFile;

        // get the midi file from sequencer.storage
        midiFile = sequencer.getMidiFile('Sonata Facile');
        //console.log(sequencer.storage);

        switch(testMethod){

            case 1:
                // method 1: create a song directly from the midi file, this way the midi file is treated as a config object
                midiFile.useMetronome = true;
                song = sequencer.createSong(midiFile);
                break;

            case 2:
                // method 2: copy over some parts of the midi to a config object
                song = sequencer.createSong({
                    bpm: 80, // original tempo is 125 bpm
                    nominator: midiFile.nominator,
                    denominator: midiFile.denominator,
                    timeEvents: midiFile.timeEvents,
                    tracks: midiFile.tracks,
                    useMetronome: true
                });
                break;
        }


        // set all tracks of the song to use 'piano'
        song.tracks.forEach(function(track){
            track.setInstrument('piano');
        });

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
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