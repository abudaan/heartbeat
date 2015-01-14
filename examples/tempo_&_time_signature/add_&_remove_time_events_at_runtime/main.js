/*

*/
window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        createSlider = sequencer.util.createSlider,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnAddTempoEvent = document.getElementById('add-tempo'),
        btnAddTimeSignatureEvent = document.getElementById('add-time-signature'),
        btnRemoveTimeEvent = document.getElementById('remove-time-event'),
        btnRemoveDoubleTimeEvents = document.getElementById('remove-double-time-events'),
        inputTempo = document.getElementById('tempo'),
        inputTimeSignature = document.getElementById('time-signature'),
        selectTimeEvent = document.getElementById('time-events'),
        sliderPlayhead,

        userInteraction = false;


    // disable ui until everything is initialized
    enableUI(false);

    sequencer.ready(function init(){
        var song,
            timeEvent,
            timeEventsById;

        song = sequencer.createSong({
            loop: true,
            fixedLength: false,
            bars: 4,
            useMetronome: true
        });

        song.setLeftLocator('barsbeats', 1);
        song.setRightLocator('barsbeats', 5);

        song.addEventListener('play', function(){
            btnStart.value = 'pause';
        });

        song.addEventListener('pause', function(){
            btnStart.value = 'play';
        });

        song.addEventListener('stop', function(){
            btnStart.value = 'play';
        });


        btnStart.addEventListener('click', function(){
            song.play();
        });


        btnStop.addEventListener('click', function(){
            song.stop();
        });


        btnAddTempoEvent.addEventListener('click', function(){
            var bpm = parseInt(inputTempo.value, 10),
                tempoEvent = sequencer.createMidiEvent(song.ticks, sequencer.TEMPO, bpm);

            // set the input back to a neutral value
            inputTempo.value = 120;
            song.addTimeEvent(tempoEvent);
            populateTimeEventDropDown();
        });


        btnAddTimeSignatureEvent.addEventListener('click', function(){
            var tmp = inputTimeSignature.value.split('/'),
                nominator = parseInt(tmp[0], 10),
                denominator = parseInt(tmp[1], 10),
                timeSignatureEvent;

            /*
                A time signature event can only be positioned at the beginning of a bar, if you put a time signature event
                at some other position, heartbeat will automatically round this position off to the beginning of the nearest bar.
            */
            timeSignatureEvent = sequencer.createMidiEvent(song.ticks, sequencer.TIME_SIGNATURE, nominator, denominator);

            // set the input back to a neutral value
            inputTimeSignature.value = '4/4';
            song.addTimeEvent(timeSignatureEvent);
            /*
                Because the number of bars can change if you add or remove a time signature event,
                we have to position the right locator at the end of the song again.
            */
            song.setRightLocator('barsbeats', song.bars + 1);
            populateTimeEventDropDown();
        });


        btnRemoveTimeEvent.addEventListener('click', function(){
            if(timeEvent !== undefined){
                song.removeTimeEvent(timeEvent);
                populateTimeEventDropDown();
                if(timeEvent.type === sequencer.TIME_SIGNATURE){
                    song.setRightLocator('barsbeats', song.bars + 1);
                }
                timeEvent = undefined;
            }
        });


        btnRemoveDoubleTimeEvents.addEventListener('click', function(){
            song.removeDoubleTimeEvents();
            populateTimeEventDropDown();
        });


        selectTimeEvent.addEventListener('change', function(){
            var id = selectTimeEvent.options[selectTimeEvent.selectedIndex].value;
            timeEvent = timeEventsById[id];
        });


        function populateTimeEventDropDown(){
            var timeEvents = song.timeEvents,
                i, maxi = timeEvents.length, event, type,
                options = '<option value="0">select a time event to remove</option>';

            timeEventsById = {};

            for(i = 0; i < maxi; i++){
                event = timeEvents[i];
                // you can't remove the first tempo and time signature event: these are required by the MIDI specification
                if(event === song.tempoEvent || event === song.timeSignatureEvent){
                    continue;
                }
                type = event.type;
                if(type === sequencer.TEMPO){
                    options += '<option value="' + event.id + '">' + event.barsAsString + ' ' + event.bpm + 'bpm</option>';
                }else if(type === sequencer.TIME_SIGNATURE){
                    options += '<option value="' + event.id + '">' + event.barsAsString + ' ' +  event.nominator + '/' + event.denominator + ' </option>';
                }
                timeEventsById[event.id] = event;
            }

            selectTimeEvent.innerHTML = options;
        }


        (function(){
            var position;
            sliderPlayhead = createSlider({
                slider: document.getElementById('playhead'),
                message: '{value}',
                onMouseDown: handle,
                onMouseMove: handle,
                onMouseUp: handle
            });

            function handle(value, e){
                if(e.type === 'mousedown' || e.type === 'mousemove'){
                    position = song.getPosition('percentage', value);
                    sliderPlayhead.setLabel(position.barsAsString + ' | bpm: ' + position.bpm + ' | time signature: ' + position.nominator + '/' + position.denominator);
                }

                if(e.type === 'mousedown'){
                    userInteraction = true;
                }else if(e.type === 'mouseup'){
                    userInteraction = false;
                    song.setPlayhead('millis', position.millis);
                }
            }
        }());


        (function render(){
            if(userInteraction === false){
                sliderPlayhead.setValue(song.percentage);
                sliderPlayhead.setLabel(song.barsAsString + ' | bpm: ' + song.bpm + ' | time signature: ' + song.nominator + '/' + song.denominator);
            }
            window.requestAnimationFrame(render);
        }());

        populateTimeEventDropDown();
        enableUI(true);
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