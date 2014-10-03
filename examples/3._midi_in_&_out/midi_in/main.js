window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        btnMonitor = document.getElementById('monitor'),
        pMessage = document.getElementById('message'),

        // relative path to assets
        path = '../../../assets',
        url = sequencer.ogg === true ? path + '/sso/strings/violin.ogg.4.json' : path + '/sso/strings/violin.mp3.128.json';



    // load asset pack; this pack contains a violin
    sequencer.addAssetPack({url: url}, init);

    function init(){
        var track, song;

        track = sequencer.createTrack();
        track.setInstrument('Violin');
        // set monitor to true to route the incoming midi events to the track
        track.monitor = true;
        track.setMidiInput('all');

        song = sequencer.createSong({
            tracks: track
        });

        // use button to toggle monitor on and off
        btnMonitor.addEventListener('click', function(){
            if(track.monitor === true){
                btnMonitor.value = 'monitor on';
                track.monitor = false;
            }else{
                btnMonitor.value = 'monitor off';
                track.monitor = true;
            }
        }, false);

        pMessage.innerHTML = 'Play some note on your midi keyboard';
    }
};