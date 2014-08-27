window.onload = function() {

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        // relative path to assets
        path = '../../../../assets';



    sequencer.addMidiFile({url: path + '/midi/mozk545a.mid'}, function(midifile){

        var song;

        midifile.useMetronome = true;
        song = sequencer.createSong(midifile);

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        console.log(sequencer.storage.midi);
    });
};
