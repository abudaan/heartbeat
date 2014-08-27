window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        btnTest1 = document.getElementById('test1'),
        btnTest2 = document.getElementById('test2'),
        btnTest3 = document.getElementById('test3'),
        btnTest4 = document.getElementById('test4'),
        divConsole = document.getElementById('console');


    /*
        setup a folder structure:

        instruments
            - acoustic
                - keyboard_instruments
                    - piano
                    - organ
                - bowed_instruments
                    - violin
                    - viola
                    - violon cello
            -electric
                - keyboard_instruments
                    - Rhodes
                    - Wurlitzer

    */

    btnTest1.value = 'getInstruments()';
    btnTest2.value = 'getInstruments(\'acoustic\', false)';
    btnTest3.value = 'getInstruments(\'acoustic\', true)';
    btnTest4.value = 'getInstruments(\'acoustic\')';

    sequencer.addInstrument({
        name: 'piano',
        folder: 'acoustic/keyboard_instruments',
        mapping: [20, 108]
    });

    sequencer.addInstrument({
        name: 'organ',
        folder: 'acoustic/keyboard_instruments',
        mapping: [20, 108]
    });

    sequencer.addInstrument({
        name: 'Rhodes',
        folder: 'electric/keyboard_instruments',
        mapping: [20, 108]
    });

    sequencer.addInstrument({
        name: 'Wurlitzer',
        folder: 'electric/keyboard_instruments',
        mapping: [20, 108]
    });

    sequencer.addInstrument({
        name: 'violin',
        folder: 'acoustic/bowed_instruments',
        mapping: [55, 100]
    });

    sequencer.addInstrument({
        name: 'viola',
        folder: 'acoustic/bowed_instruments',
        mapping: [48, 96]
    });

    sequencer.addInstrument({
        name: 'violoncello',
        folder: 'acoustic/bowed_instruments',
        mapping: [36, 84]
    }, init);


    function init(){

        console.log(sequencer.storage.instruments);

        btnTest1.addEventListener('click', function(){
            var assets = sequencer.getInstruments();
            divConsole.innerHTML = assets.length === 0 ? 'no instruments found' : '';
            assets.forEach(function(asset){
                divConsole.innerHTML += asset.localPath + '<br/>';
            });
        }, false);


        btnTest2.addEventListener('click', function(){
            // set include search in subfolders to false
            var assets = sequencer.getInstruments('acoustic', false);
            divConsole.innerHTML = assets.length === 0 ? 'no instruments found' : '';
            assets.forEach(function(asset){
                divConsole.innerHTML += asset.localPath + '<br/>';
            });
        }, false);


        btnTest3.addEventListener('click', function(){
            // include search in subfolders is set to true, which is the default if you omit the second argument
            var assets = sequencer.getInstruments('acoustic', true);
            divConsole.innerHTML = assets.length === 0 ? 'no instruments found' : '';
            assets.forEach(function(asset){
                divConsole.innerHTML += asset.localPath + '<br/>';
            });
        }, false);


        btnTest4.addEventListener('click', function(){
            // same as above
            var assets = sequencer.getInstruments('acoustic');
            divConsole.innerHTML = assets.length === 0 ? 'no instruments found' : '';
            assets.forEach(function(asset){
                divConsole.innerHTML += asset.localPath + '<br/>';
            });
        }, false);
    }

};