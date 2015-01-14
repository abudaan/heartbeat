window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnMoveEvents = document.getElementById('move-events'),
        btnMoveEventToPosition = document.getElementById('move-note-off-event');


    sequencer.ready(function init(){
        var song,
            part,
            events;

        events = [
                sequencer.createMidiEvent(0, 144, 60, 100),
                sequencer.createMidiEvent(240, 128, 60, 100)
            ];

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

        btnMoveEvents.addEventListener('click', function(){
            events.forEach(function(event){
                event.move(960);
            });
            song.update();
        });

        btnMoveEventToPosition.addEventListener('click', function(){
            // move the note off event to a specific position
            events[1].moveTo('barsbeats', 2, 1, 1, 0);
            song.update();
        });
    });

};