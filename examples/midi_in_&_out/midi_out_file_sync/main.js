/*
    This test connects one track to an external instrument and the other track to an internal instrument, this
    allows you to check whether these to instrument are in sync with eachother. It is possible that the external
    instrument is bit ahead of the internal instrument, this is dependent on your hardware and your soundcard drivers.

    By setting sequencer.midiOutputLatency you can adjust the playback of the external instrument.

    Note that for using midi out you need to configure virtual midi port on your system, see:

    http://abumarkub.net/abublog/?page_id=399#midi-out
*/


window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        path = '../../../assets';


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
        var song, midiOutputsMenu, midiFile, warning;

        if(sequencer.midi === false){
            warning = document.createElement('div');
            warning.innerHTML = 'No MIDI I/O';
            document.body.insertBefore(warning, document.getElementsByTagName('pre')[0]);
            return;
        }

        // get the available midi outputs as dropdown menu
        midiOutputsMenu = sequencer.getMidiOutputsAsDropdown();
        document.body.insertBefore(midiOutputsMenu, document.getElementsByTagName('pre')[0]);

        // connect the chosen output to one of the 2 tracks of the song to check if the
        // internal heartbeat instrument is in sync with the external instrument that is connected via midi out
        midiOutputsMenu.addEventListener('change', function(){
            song.tracks[1].setMidiOutput(midiOutputsMenu.value);
        }, false);

        // get the midi file from sequencer.storage
        midiFile = sequencer.getMidiFile('Sonata Facile');
        midiFile.useMetronome = true;
        song = sequencer.createSong(midiFile);

        // set all tracks of the song to use 'piano'
        song.tracks.forEach(function(track){
            track.setInstrument('piano');
        });

        btnStart.addEventListener('click', function(e){
            song.play();
        });

        btnStop.addEventListener('click', function(e){
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