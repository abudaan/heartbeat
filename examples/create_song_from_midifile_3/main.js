window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnLoad = document.getElementById('load'),
        selectSong = document.getElementById('select-song'),

        song = null,
        path = '../../assets';


    enableUI(false);

    sequencer.addAssetPack(

        {url: path + '/examples/asset_pack_piano.json'},

        function init(){

            btnStart.addEventListener('click', function(){
                song.play();
            });

            btnStop.addEventListener('click', function(){
                song.stop();
            });

            btnLoad.addEventListener('click', function(){
                sequencer.addAssetPack(
                    {url: path + '/examples/asset_pack_piano.json'},
                    function(data){
                        // check your developer tools to see that the memory does not increase after trying to load an assetpack twice
                        console.log(sequencer.storage);
                    }
                );
            });


            selectSong.addEventListener('change', function(){
                btnStart.disabled = true;
                btnStop.disabled = true;

                var songUrl;
                if(this.selectedIndex === 0){
                    // see: http://stackoverflow.com/questions/9205070/javascript-how-can-i-set-an-object-reference-to-null-from-a-function
                    song = sequencer.deleteSong(song);
                    return;
                }else if(this.selectedIndex === 1){
                    songUrl = path + '/examples/mozk545a.mid';
                }else if(this.selectedIndex === 2){
                    songUrl = path + '/examples/minute_waltz.mid';
                }

                sequencer.addMidiFile({url: songUrl}, function(midiFile){
                    song = sequencer.deleteSong(song);
                    song = sequencer.createSong(midiFile.copy());
                    song.tracks.forEach(function(track){
                        track.setInstrument('piano');
                    });
                    btnStart.disabled = false;
                    btnStop.disabled = false;
                });
            });

            btnLoad.disabled = false;
            selectSong.disabled = false;
        }
    );


    function enableUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }
};