window.onload = function(){

    'use strict';

    var
        divLog = document.getElementById('log'),
        divInputs = document.getElementById('inputs'),
        divOutputs = document.getElementById('outputs'),
        inputs,
        outputs,
        activeOutputs = {};

    function init(cb){
        if(navigator.requestMIDIAccess !== undefined){
            navigator.requestMIDIAccess().then(
                // on success
                function midiAccessOnSuccess(midi){
                    inputs = midi.inputs();
                    outputs = midi.outputs();

                    // onconnect and ondisconnect are not yet implemented in Chrome and Chromium
                    /*
                    midi.addEventListener('onconnect', function(e){
                        console.log('device connected', e);
                    }, false);

                    midi.addEventListener('ondisconnect', function(e){
                        console.log('device disconnected', e);
                    }, false);
                    */
                    cb();
                },

                // on error
                function midiAccessOnError(e){
                    divInputs.innerHTML = 'MIDI could not be initialized:' + e;
                    divOutputs.innerHTML = '';
                    cb();
                }
            );
        }

        // browsers without WebMIDI API or Jazz plugin
        else{
            divInputs.innerHTML = 'No MIDI I/O';
            divOutputs.innerHTML = '';
            cb();
        }
    }


    function inputListener(midimessageEvent){
        var port, portId,
            data = midimessageEvent.data,
            type = data[0],
            data1 = data[1],
            data2 = data[2];

        // do something graphical with the incoming midi data
        divLog.innerHTML = type + ' ' + data1 + ' ' + data2 + '<br>' + divLog.innerHTML;

        for(portId in activeOutputs){
            if(activeOutputs.hasOwnProperty(portId)){
                port = activeOutputs[portId];
                port.send(data);
            }
        }
    }


    init(function(){
        var checkbox, checkboxes, i, maxi, port;

        inputs.forEach(function(input, i){
            checkbox = '<label><input type="checkbox" name="input_' + i + '" value="' + i + '">' + input.name + ' ' + input.id + '</label>';
            divInputs.innerHTML += checkbox + '<br>';
        });

        outputs.forEach(function(output, i){
            checkbox = '<label><input type="checkbox" name="output_' + i + '" value="' + i + '">' + output.name + ' ' + output.id + '</label>';
            divOutputs.innerHTML += checkbox + '<br>';
        });

        checkboxes = document.querySelectorAll('#inputs input[type="checkbox"');

        for(i = 0, maxi = checkboxes.length; i < maxi; i++){
            checkbox = checkboxes[i];
            checkbox.addEventListener('change', function(){
                port = inputs[this.value];
                if(this.checked === true){
                    port.addEventListener('midimessage', inputListener);
                }else{
                    port.removeEventListener('midimessage', inputListener);
                }
            }, false);
        }


        checkboxes = document.querySelectorAll('#outputs input[type="checkbox"');

        for(i = 0, maxi = checkboxes.length; i < maxi; i++){
            checkbox = checkboxes[i];
            checkbox.addEventListener('change', function(){
                port = outputs[this.value];
                if(this.checked === true){
                    activeOutputs[port.name + port.id] = port;
                }else{
                    delete activeOutputs[port.name + port.id];
                }
            }, false);
        }
    });
};