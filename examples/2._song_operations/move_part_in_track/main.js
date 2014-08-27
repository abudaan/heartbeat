window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnMovePart = document.getElementById('move-part');


    sequencer.ready(function init(){
        var song,
            track,
            part,
            events;

        events = sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            numNotes: 4
        });

        part = sequencer.createPart();
        part.addEvents(events);

        track = sequencer.createTrack();
        track.addPart(part);

        song = sequencer.createSong({
            tracks: track,
            useMetronome: true
        });


        btnStart.addEventListener('click', function(){
            song.play();
        });


        btnStop.addEventListener('click', function(){
            song.stop();
        });

        btnMovePart.addEventListener('click', function(){
            track.movePart(part, 960);
            song.update();
        });
    });

};