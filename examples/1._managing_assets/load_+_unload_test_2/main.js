window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        btnLoad = document.getElementById('load'),
        btnUnload1 = document.getElementById('unload1'),
        btnUnload2 = document.getElementById('unload2'),
        btnUnload3 = document.getElementById('unload3'),
        divConsole = document.getElementById('console'),

        // relative path to assets
        path = '../../../assets';


    sequencer.ready(function(){
        var track = sequencer.createTrack(),
            song = sequencer.createSong({
                tracks: track
            });

        track.monitor = true;
        track.setMidiInput('all');

        btnLoad.addEventListener('click', function(){
            divConsole.innerHTML = 'loading...';
            sequencer.addAssetPack({
                    url: path + '/examples/asset_pack_piano.json',
                    name: 'basic asset pack'
                }, function(){
                    track.setInstrument('piano');
                    printAssets();
                }
            );
        }, false);

        btnUnload1.addEventListener('click', function(){
            sequencer.removeInstrument('piano');
            printAssets();
            // force garbage collection so you can see that the memory usage drops immediately
            try{
                window.gc();
            }catch(e){
                console.info('no gc');
                // run your browser from the command line with gc enabled
                // for Chrome use: --js-flags="--expose-gc"
            }
        }, false);

        btnUnload2.addEventListener('click', function(){
            sequencer.removeSamplePack('piano');
            printAssets();
            try{
                window.gc();
            }catch(e){
                console.info('no gc');
            }
        }, false);

        btnUnload3.addEventListener('click', function(){
            sequencer.removeInstrument('piano', true);
            printAssets();
            try{
                window.gc();
            }catch(e){
                console.info('no gc');
            }
        }, false);
    });


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