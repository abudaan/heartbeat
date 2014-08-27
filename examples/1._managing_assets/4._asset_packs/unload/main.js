window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        divConsole = document.getElementById('console'),

        assetPack,

        // specify the remove/unload method that you want to test with
        removeMethod = 6,

        // relative path to assets
        path = '../../../../assets';


    divConsole.innerHTML = 'loading...';

    sequencer.addAssetPack({
            url: path + '/examples/asset_pack_basic_keyrange.json',
            name: 'basic asset pack'
        }, function(asset){
        assetPack = asset;
        init();
    });


    function init(){
        var track = sequencer.createTrack(),
            song = sequencer.createSong({
                tracks: track
            });

        track.setInstrument('piano');
        track.monitor = true;
        track.setMidiInput('all');

        initButtons();
        printAssets();
    }


    function removeAsset(methodId){
        /*
            See the file "asset_pack_basic_keyrange.json" displayed below this code block (in the html page).
        */
        switch(methodId){
            case 1:
                //remove asset pack by supplying a reference
                sequencer.removeAssetPack(assetPack);
                break;

            case 2:
                // remove asset pack by supplying its name
                sequencer.removeAssetPack('basic asset pack');
                break;

            case 3:
                // remove the piano
                sequencer.removeInstrument('piano');
                break;

            case 4:
                // remove the piano and the samples that the piano uses (2nd argument is "true")
                sequencer.removeInstrument('piano', true);
                break;

            case 5:
                // remove the midi file
                sequencer.removeMidiFile('Sonata Facile');
                break;

            case 6:
                // remove the IR sample pack
                sequencer.removeSamplePack('VS8F');
                break;

        }

        // force garbage collection so you can see that the memory usage drops immediately
        try{
            window.gc();
        }catch(e){
            console.info('no gc');
            // run your browser from the command line with gc enabled
            // for Chrome use: --js-flags="--expose-gc"
        }

        // after removing/unloading print the asset again
        printAssets();
    }


    function initButtons(){
        var i, id, btn;
        for(i = 1; i <= 6; i++){
            btn = document.getElementById('method' + i);
            btn.addEventListener('click', function(){
                id = parseInt(this.id.replace('method', ''), 10);
                console.log(id);
                removeAsset(id);
            }, false);
        }
    }


    // print which assets are stored
    function printAssets(){
        var assets, asset, i;

        divConsole.innerHTML = '';

        assets = sequencer.getAssetPacks(); // if you don't specify a folder all assetpacks in the storage will be returned
        if(assets.length > 0){
            divConsole.innerHTML += 'assetpacks:<br/>';
            for(i = assets.length - 1; i >= 0; i--){
                asset = assets[i];
                //console.log(asset)
                divConsole.innerHTML += ' - ' + asset.name + '<br/>';
            }
            divConsole.innerHTML += '<br/>';
        }

        assets = sequencer.getSamplePacks(); // if you don't specify a folder all samplepacks in the storage will be returned
        if(assets.length > 0){
            divConsole.innerHTML += 'samplepacks:<br/>';
            for(i = assets.length - 1; i >= 0; i--){
                asset = assets[i];
                //console.log(asset);
                divConsole.innerHTML += ' - ' + asset.name + '<br/>';
            }
            divConsole.innerHTML += '<br/>';
        }

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

        assets = sequencer.getMidiFiles(); // if you don't specify a folder all midi files in the storage will be returned
        if(assets.length > 0){
            divConsole.innerHTML += 'midi files:<br/>';
            for(i = assets.length - 1; i >= 0; i--){
                asset = assets[i];
                //console.log(asset);
                divConsole.innerHTML += ' - ' + asset.name + '<br/>';
            }
            divConsole.innerHTML += '<br/>';
        }

        assets = sequencer.getSamples(); // if you don't specify a folder all samples in the storage will be returned
        if(assets.length > 0){
            divConsole.innerHTML += 'samples:<br/>';
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