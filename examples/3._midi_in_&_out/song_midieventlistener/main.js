window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        output = document.getElementById('console');


    sequencer.ready(function init(){
        var song = sequencer.createSong();

        output.innerHTML = 'move pitch bend or other controllers';

        // a song receives midi events from all available midi inputs by default, so we can add an event listener right away
        song.addMidiEventListener(sequencer.PITCH_BEND, function(midiEvent, input){
            // do something useful with the pitch bend data
            var html = output.innerHTML;
            output.innerHTML = 'input:' + input.name + ' type:pitch bend data:' + midiEvent.data1 + ', ' + midiEvent.data2 + '<br/>';
            output.innerHTML += html;
        });


        song.addMidiEventListener(sequencer.CONTROL_CHANGE, function(midiEvent, input){
            // do something useful with the control change data
            var html = output.innerHTML;
            output.innerHTML = 'input:' + input.name + ' type:control change data:' + midiEvent.data1 + ', ' + midiEvent.data2 + '<br/>';
            output.innerHTML += html;
        });


        // you can also add an event listener for multiple midi event types in one go
        song.addMidiEventListener('note on', 'note off', function(midiEvent, input){
            // do something useful with the control change data
            var html = output.innerHTML;
            output.innerHTML = 'input:' + input.name + ' type:channel data:' + midiEvent.data1 + ', ' + midiEvent.data2 + '<br/>';
            output.innerHTML += html;
        });
    });
};