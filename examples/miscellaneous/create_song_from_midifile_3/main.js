window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnLoad = document.getElementById('load');


    enableUI(false);

    sequencer.addAssetPack(

        {url: '/heartbeat/assets/examples/asset_pack_piano.json'},

        function init(){

            btnLoad.addEventListener('click', function(){
                sequencer.addAssetPack(
                    {url: '/heartbeat/assets/examples/asset_pack_piano.json'},
                    function(data){
                        // check the profiler in your developer tools to see that the memory does not increase after trying to load an assetpack twice
                        console.log(sequencer.storage);
                    }
                );
            });

            enableUI(true);
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