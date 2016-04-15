window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        AP = Array.prototype,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        divPosition = document.getElementById('position');


    sequencer.ready(function init(){
        var song,
            track,
            part,
            events,
            position;

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


        divPosition.addEventListener('change', function(){
            var args = ['barsbeats'];
            //console.log(divPosition.value.split(','))
            args = args.concat(divPosition.value.split(','));
            //track.movePartTo.apply(null, args);
            track.movePartTo(part, args);
            song.update();
        });
    });

};