window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        btnLoad = document.getElementById('load'),
        btnUnload1 = document.getElementById('unload1'),
        btnUnload2 = document.getElementById('unload2'),
        divConsole = document.getElementById('console');


    btnUnload1.value = 'unload piano1';
    btnUnload2.value = 'unload all instruments in folder';

    btnLoad.addEventListener('click', function(){
        // load an instrument
        sequencer.addInstrument({
            name: 'piano1',
            folder: 'instruments',
            sample_path: 'samples',
            mapping: [20, 108],
            release_duration: 1200
        }, printAssets);


        // load another instrument in the same folder
        sequencer.addInstrument({
            name: 'piano2',
            folder: 'instruments',
            sample_path: 'samples',
            mapping: [20, 108],
            release_duration: 1200
        }, printAssets);
    });


    sequencer.ready(function init(){

        // remove piano1 only
        btnUnload1.addEventListener('click', function(){
            sequencer.removeInstrument('piano1');
            printAssets();
        });

        // remove all instruments in the folder "instruments"
        btnUnload2.addEventListener('click', function(){
            sequencer.removeInstrument('instruments');
            printAssets();
        });

    });



    // print which assets are stored
    function printAssets(){
        var assets, asset, i;

        divConsole.innerHTML = '';

        assets = sequencer.getInstruments(); // if you don't specify a folder all instruments in the storage will be returned
        if(assets.length > 0){
            divConsole.innerHTML += 'instruments:<br/>';
            for(i = assets.length - 1; i >= 0; i--){
                asset = assets[i];
                //console.log(asset);
                divConsole.innerHTML += ' - ' + asset.name + '<br/>';
            }
            divConsole.innerHTML += '<br/>';
        }

        console.log(sequencer.storage);
    }
};