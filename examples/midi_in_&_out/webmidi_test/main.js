window.onload = function(){

    'use strict';

    var
        divLog = document.getElementById('log'),
        divInputs = document.getElementById('inputs'),
        divOutputs = document.getElementById('outputs'),
        MIDIAccess,
        activeInputs = {},
        activeOutputs = {};


    if(navigator.requestMIDIAccess !== undefined){
        navigator.requestMIDIAccess().then(

            function onFulfilled(access, options){
                MIDIAccess = access;
                MIDIAccess.onstatechange = function(e){
                   showMIDIPorts();
                };
                showMIDIPorts();
             },

            function onRejected(e){
                divInputs.innerHTML = 'No access to MIDI devices:' + e;
                divOutputs.innerHTML = '';
            }
        );
    }

    // browsers without WebMIDI API or Jazz plugin
    else{
        divInputs.innerHTML = 'No access to MIDI devices';
        divOutputs.innerHTML = '';
    }


    function showMIDIPorts(){
        var checkbox,
            checkboxes,
            inputs, outputs,
            i, maxi, id, port;

        inputs = MIDIAccess.inputs;
        divInputs.innerHTML = '';
        inputs.forEach(function(port){
            checkbox = '<label><input type="checkbox" id="' + port.id + '">' + port.name + '(' + port.state + ', ' +  port.connection + ')</label>';
            divInputs.innerHTML += checkbox + '<br>';
        });


        outputs = MIDIAccess.outputs;
        divOutputs.innerHTML = '';
        outputs.forEach(function(port){
            checkbox = '<label><input type="checkbox" id="' + port.id + '">' + port.name + '(' + port.state + ', ' +  port.connection + ')</label>';
            divOutputs.innerHTML += checkbox + '<br>';
        });

        /*
        ECMA6

        for(port of inputs.values()){
            checkbox = '<label><input type="checkbox" name="input_' + i + '" value="' + port.id + '">' + port.name + ' ' + port.id + '</label>';
            divInputs.innerHTML += checkbox + '<br>';
        }

        for(port of outputs.values()){
            checkbox = '<label><input type="checkbox" name="output_' + i + '" value="' + port.id + '">' + port.name + ' ' + port.id + '</label>';
            divOutputs.innerHTML += checkbox + '<br>';
        }
        */

        checkboxes = document.querySelectorAll('#inputs input[type="checkbox"]');

        for(i = 0, maxi = checkboxes.length; i < maxi; i++){
            checkbox = checkboxes[i];
            checkbox.addEventListener('change', function(){
                // get port by id
                id = this.id;
                port = inputs.get(id);
                if(this.checked === true){
                    activeInputs[id] = port;
                    // implicitly open port by adding a listener
                    port.onmidimessage = inputListener;
                }else{
                    delete activeInputs[id];
                    port.close();
                }
                //console.log(activeInputs);
            }, false);
        }


        checkboxes = document.querySelectorAll('#outputs input[type="checkbox"]');

        for(i = 0, maxi = checkboxes.length; i < maxi; i++){
            checkbox = checkboxes[i];
            checkbox.addEventListener('change', function(){
                // get port by id
                id = this.id;
                port = outputs.get(id);
                if(this.checked === true){
                    activeOutputs[id] = port;
                    port.open();
                }else{
                    delete activeOutputs[id];
                    port.close();
                }
            }, false);
        }


        for(id in activeOutputs){
            if(activeOutputs.hasOwnProperty(id)){
                if(outputs.has(id)){
                    checkbox = document.getElementById(id);
                    checkbox.checked = true;
                }else{
                    port = activeOutputs[id];
                    delete activeOutputs[id];
                    port.close();
                }
            }
        }

        for(id in activeInputs){
            if(activeInputs.hasOwnProperty(id)){
                if(inputs.has(id)){
                    checkbox = document.getElementById(id);
                    checkbox.checked = true;
                }else{
                    port = activeInputs[id];
                    delete activeInputs[id];
                    port.close();
                }
            }
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

};