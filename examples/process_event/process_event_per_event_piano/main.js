window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        i,
        midiEvent,
        ticks,
        noteNumber,
        velocity,
        bpm = 240,
        noteDuration = 120, // ticks
        numEvents = 100,

        path = '../../../assets';


    enableUI(false);

    // add asset pack, this pack contains a piano
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);

    function init(){
        btnStart.addEventListener('click', function(e){
            createEvents();
        });

        btnStop.addEventListener('click', function(e){
            sequencer.stopProcessEvents();
        });

        enableUI(true);
    }


    function enableUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }


    function getRandom(min, max, round){
        var r = Math.random() * (max - min) + min;
        if(round === true){
            return Math.round(r);
        }else{
            return r;
        }
    }


    function createEvents(){
        ticks = 0;

        for(i = 0; i < numEvents; i++){
            noteNumber = getRandom(60, 100, true);
            velocity = getRandom(30, 80, true);

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
            sequencer.processEvents(midiEvent, bpm, 'piano');
            ticks += noteDuration;

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
            sequencer.processEvents(midiEvent, bpm, 'piano');
            ticks += noteDuration;
        }
    }


    function init(){
        btnStart.addEventListener('click', function(e){
            createEvents();
        });

        btnStop.addEventListener('click', function(e){
            sequencer.stopProcessEvents();
        });

        enableUI(true);
    }
};