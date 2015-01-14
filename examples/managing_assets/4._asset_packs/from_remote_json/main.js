window.onload = function() {

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        // specify the load method that you want to test with
        loadMethod = 1,

        // relative path to assets
        path = '../../../../assets';


    enableUI(false);


    function init(){
        var midifile, song;

        midifile = sequencer.getMidiFile('Sonata Facile');
        midifile.useMetronome = true;
        song = sequencer.createSong(midifile);
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
        console.log(sequencer.storage);
    }

    switch(loadMethod){

        case 1:
            /*
                asset pack will be stored by its id in the folder sequencer.storage.assetpacks
            */
            sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);
            break;

        case 2:
            /*
                a name an a folder are specified, so the asset pack will be stored here:
                sequencer.storage.assetpacks["some folder name"].basic
            */
            sequencer.addAssetPack({
                    name: 'basic',
                    folder: 'some folder name',
                    url: path + '/examples/asset_pack_basic.json'
                },
                init
            );
            break;
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
