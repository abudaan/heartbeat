window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        divConsole = document.getElementById('console'),

        samplePack,
        instrument,

        // relative path to assets
        path = '../../../../assets';


    sequencer.addSamplePack({url: path + '/examples/percussion-small-samplepack.json'}, function(asset){
        samplePack = asset;
    });


    sequencer.addInstrument({url: path + '/examples/percussion-small-instrument.json'}, function(asset){
        instrument = asset;
        init();
    });


    function init(){
        var track = sequencer.createTrack(),
            song = sequencer.createSong({
                tracks: track
            });

        track.setInstrument('Percussion Small');
        track.monitor = true;
        track.setMidiInput('all');

        initButtons();
        printAssets();
    }


    function removeAsset(methodId){

        switch(methodId){
            case 1:
                //remove sample pack by supplying a reference
                sequencer.removeSamplePack(samplePack);
                break;

            case 2:
                // remove sample pack by supplying the name of the sample pack
                sequencer.removeSamplePack('Percussion Small');
                break;

            case 3:
                // remove instrument by supplying the name of the instrument
                sequencer.removeInstrument('Percussion Small');
                break;

            case 4:
                // second argument is set to true: all samples that are in use
                // by the instrument will be removeed as well
                sequencer.removeInstrument('Percussion Small', true);
                break;

            case 5:
                // remove instrument by supplying a reference
                sequencer.removeInstrument(instrument);
                break;

            case 6:
                // also remove the samples
                sequencer.removeInstrument(instrument, true);
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
                removeAsset(id);
            }, false);
        }
    }


    // print which assets are stored
    function printAssets(){
        var assets, asset, i;

        divConsole.innerHTML = '';

        assets = sequencer.getAssetPacks(); // if you don't specify a folder all assetpacks in the storage will be returned
        if(assets !== false){
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