window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        output = document.getElementById('console');


    sequencer.ready(function(){

        if(sequencer.midi === false){
            output.innerHTML = 'No MIDI I/O';
            return;
        }

        // print all available midi inputs and outputs
        output.innerHTML = 'MIDI in:<br/>';
        sequencer.getMidiInputs(function(port){
            output.innerHTML += port.label + '<br/>';
            //output.innerHTML += port.name + ' ' + port.id + '<br/>';
        });

        output.innerHTML += '<br/>MIDI out:<br/>';
        sequencer.getMidiOutputs(function(port){
            output.innerHTML += port.label + '<br/>';
            //output.innerHTML += port.name + ' ' + port.id + '<br/>';
        });
    });
};