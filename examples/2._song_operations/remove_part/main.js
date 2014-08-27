window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnRemovePart = document.getElementById('part');


    sequencer.ready(function init(){
        var song,
            part,
            events;

        events = sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            numNotes: 20
        });

        part = sequencer.createPart();
        part.addEvents(events);


        song = sequencer.createSong({
            parts: part,
            useMetronome: true
        });


        btnStart.addEventListener('click', function(){
            song.play();
        });


        btnStop.addEventListener('click', function(){
            song.stop();
        });


        btnRemovePart.addEventListener('click', function(){
            song.tracks[0].removePart(part);
            song.update();
        });
    });
};