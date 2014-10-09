window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console;


    sequencer.ready(function init(){
        var track, song, output = document.getElementById('console');

        if(sequencer.midi === false){
            output.innerHTML = 'No MIDI I/O';
            return;
        }

        // create a track that receives the incoming midi events
        track = sequencer.createTrack();
        // set monitor to true to route the incoming midi events to the track
        track.monitor = true;
        track.setMidiInput('all');

        song = sequencer.createSong({
            tracks: track
        });


        output.innerHTML = 'move your pitch bend wheel';


        track.addMidiEventListener(sequencer.PITCH_BEND, function(midiEvent, input){
            // do something useful with the pitch bend data
            var html = output.innerHTML;
            output.innerHTML = 'input:' + input.name + ' type:control change data:' + midiEvent.data1 + ', ' + midiEvent.data2 + '<br/>';
            output.innerHTML += html;
        });
    });
};