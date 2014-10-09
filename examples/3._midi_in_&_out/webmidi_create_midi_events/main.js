window.onload = function(){

    'use strict';

    var
        alert = window.alert,
        console = window.console,
        sequencer = window.sequencer,

        divLog = document.getElementById('log'),
        divInputs = document.getElementById('inputs'),
        divOutputs = document.getElementById('outputs'),
        selectChannel = document.getElementById('channel'),
        selectType = document.getElementById('event_type'),
        rangeData1 = document.getElementById('data1'),
        rangeData2 = document.getElementById('data2'),
        btnSend = document.getElementById('send'),

        createSlider = sequencer.util.createSlider,

        inputs,
        outputs,
        activeOutputs = {},

        channel = 0,
        type = 128,
        data1 = 0,
        data2 = 0,
        data1Description = 'note number',
        data2Description = 'velocity',
        controlChangeData1Descriptions;


    function initMIDI(cb){
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


    function sendMidiEvent(){
        var port, portId;
        //console.log(channel, type, data1, data2);


        for(portId in activeOutputs){
            if(activeOutputs.hasOwnProperty(portId)){
                port = activeOutputs[portId];
                if(type === 192 || type === 208){
                    port.send([type + channel, data1, 0xFF]);
                }else{
                    port.send([type + channel, data1, data2]);
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


    function load(){
        var request = new XMLHttpRequest();
        request.onload = function(){
            if(request.status !== 200){
                return;
            }
            controlChangeData1Descriptions = JSON.parse(request.response);
            init();
        };

        request.open('GET', 'control_change_numbers.json', true);
        // we can't use reponse type json because iOS doesn't support it
        request.responseType = 'text';
        request.send();
    }


    function init(){
        var checkbox, checkboxes, i, maxi, port;

        inputs.forEach(function(input, i){
            checkbox = '<label><input type="checkbox" name="input_' + i + '" value="' + i + '">' + input.name + ' ' + input.id + '</label>';
            divInputs.innerHTML += checkbox + '<br>';
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


        outputs.forEach(function(output, i){
            checkbox = '<label><input type="checkbox" name="output_' + i + '" value="' + i + '">' + output.name + ' ' + output.id + '</label>';
            divOutputs.innerHTML += checkbox + '<br>';
        });

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


        selectChannel.addEventListener('change', function(){
            channel = parseInt(selectChannel.options[selectChannel.selectedIndex].id, 10);
        }, false);


        selectType.addEventListener('change', function(){
            type = parseInt(selectType.options[selectType.selectedIndex].id, 10);

            rangeData1.elem.disabled = false;
            rangeData2.elem.disabled = false;

            switch(type){
                case 0:
                    rangeData1.elem.disabled = true;
                    rangeData2.elem.disabled = true;
                    break;

                case 128:
                case 144:
                    data1Description = 'note number';
                    data2Description = 'velocity';
                    rangeData1.set();
                    rangeData2.set();
                    break;

                case 160:
                    data1Description = 'note number';
                    data2Description = 'pressure';
                    rangeData1.set();
                    rangeData2.set();
                    break;

                case 176:
                    data1Description = 'controller';
                    data2Description = 'amount';
                    rangeData1.set();
                    rangeData2.set();
                    break;

                case 192:
                    data1Description = 'program number';
                    data2Description = '---';
                    rangeData1.set();
                    rangeData2.set();
                    data2 = 0;
                    rangeData2.elem.value = data2;
                    rangeData2.elem.disabled = true;
                    break;

                case 208:
                    data1Description = 'pressure';
                    data2Description = '---';
                    rangeData1.set();
                    rangeData2.set();
                    data2 = 0;
                    rangeData2.elem.value = data2;
                    rangeData2.elem.disabled = true;
                    break;

                case 224:
                    data1Description = 'fine';
                    data2Description = 'coarse';
                    rangeData1.set();
                    rangeData2.set();
                    break;

            }
        }, false);


        (function(){
            rangeData1 = createSlider({
                slider: document.getElementById('data1'),
                message: '{value}',
                step: 1,
                onMouseDown: handle,
                onMouseMove: handle
            });

            rangeData1.elem.disabled = true;

            function handle(value){
                var hexString;
                data1 = value;
                if(type === 128 || type === 144){
                    rangeData1.setLabel(data1Description + ': ' + data1 + ' | note name: ' + sequencer.getFullNoteName(data1));
                }else if(type === 176){
                    hexString = data1.toString(16).toUpperCase();
                    rangeData1.setLabel(data1Description + ': ' + data1 + ' | description: ' + controlChangeData1Descriptions[hexString]);
                }else{
                    rangeData1.setLabel(data1Description + ': ' + data1);
                }
            }

            rangeData1.set = function(){
                handle(data1);
            };

        }());


        (function(){
            rangeData2 = createSlider({
                slider: document.getElementById('data2'),
                message: '{value}',
                step: 1,
                onMouseDown: handle,
                onMouseMove: handle
            });

            rangeData2.elem.disabled = true;

            function handle(value){
                data2 = value;
                if(type === 192 || type === 208){
                    rangeData2.setLabel(data2Description);
                }else{
                    rangeData2.setLabel(data2Description + ': ' + data2);
                }
            }

            rangeData2.set = function(){
                handle(data2);
            };
        }());


        btnSend.addEventListener('click', function(){
            sendMidiEvent();
        }, false);
    }

    initMIDI(load);
};