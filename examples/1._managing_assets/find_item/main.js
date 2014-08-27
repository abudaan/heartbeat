window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        btnLoad1 = document.getElementById('load1'),
        btnLoad2 = document.getElementById('load2'),
        btnTest1 = document.getElementById('test1'),
        btnTest2 = document.getElementById('test2'),
        divConsole = document.getElementById('console');


    btnLoad1.addEventListener('click', function(){
        // add an instrument
        sequencer.addInstrument({
            name: 'piano',
            folder: 'zzzz/instruments',
            sample_path: 'samples',
            mapping: [60, 65],
            release_duration: 1200
        });
        divConsole.innerHTML = 'piano stored at zzzz/instruments';
    });


    btnLoad2.addEventListener('click', function(){
        // add an instrument with the same name in a different folder
        sequencer.addInstrument({
            name: 'piano',
            folder: 'aaaa/instruments',
            sample_path: 'samples',
            mapping: [60, 65],
            release_duration: 1200
        });
        divConsole.innerHTML = 'piano stored at aaaa/instruments';
    }, false);


    btnTest1.addEventListener('click', function(){
        /*
            The methods getInstrument(), getMidiFile(), getSamplePack(), getSample() always return the first found asset, so
            if you click btnLoad1 first and then btnLoad2, "zzzz/instruments/piano" will be printed, and if you clicked in
            reversed order "aaaa/instruments/piano" will be printed.

            Note however that his can't be said for sure because the storage is an object, and in javascript objects the order
            of keys is not always the same. Also note that the folders are not stored in alphabetical order.
        */

        var asset = sequencer.getInstrument('piano');
        divConsole.innerHTML = 'sequencer.getInstrument(\'piano\') -> ' + asset.localPath;

        console.log(sequencer.storage.instruments);

    }, false);


    btnTest2.addEventListener('click', function(){
        /*
            The methods getInstrument(), getMidiFile() and getSamplePack() have a second optional parameter "strict",
            if set to "true", it return only an asset if the specified path matches exactly
        */
        var asset;

        asset = sequencer.getInstrument('piano', true);
        divConsole.innerHTML = 'sequencer.getInstrument(\'piano\', true) -> ' + asset + '<br/><br/>';

        asset = sequencer.getInstrument('zzzz/instruments/piano', true);
        divConsole.innerHTML += 'sequencer.getInstrument(\'zzzz/instruments/piano\', true) -> ' + asset.localPath + '<br/><br/>';

        asset = sequencer.getInstrument('aaaa/instruments/piano', true);
        divConsole.innerHTML += 'sequencer.getInstrument(\'aaaa/instruments/piano\', true) -> ' + asset.localPath + '<br/><br/>';

    }, false);

};