window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnPlayhead = document.getElementById('playhead'),
        inputPosition = document.getElementById('position');


    sequencer.ready(function init(){
        var song,
            part,
            events;

        events = sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            numNotes: 40,
            noteLength: 960/8
        });


        part = sequencer.createPart();
        part.addEvents(events);

        song = sequencer.createSong({
            parts: part,
            useMetronome: false
        });


        btnStart.addEventListener('click', function(){
            song.play();
        });


        btnStop.addEventListener('click', function(){
            song.stop();
        });


        btnPlayhead.addEventListener('click', function(){
            var params = inputPosition.value.split(' '),
                position = song.getPosition(params);

            if(position === false){
                return;
            }
            song.setPlayhead('ticks', position.ticks);
        });
    });

};