window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        path = '../../assets/';

    // disable ui until all data is loaded
    enableUI(false);


    // add asset pack, this pack contains a piano
    //sequencer.ready(function init(){
    sequencer.addAssetPack({url: path + 'examples/asset_pack_basic.json'}, function init(){

        //sequencer.loadMusicXML(path + 'simple_musicxml_test.xml', function(song){
        sequencer.loadMusicXML(path + 'reunion.xml', function(song){
        //sequencer.loadMusicXML(path + 'mozk545a.xml', function(song){

            //console.log(song);

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
        });
    });


    function enableUI(flag){
        var elements = document.querySelectorAll('input'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }
};