window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        divConsole = document.getElementById('console'),
        btnAddEvents = document.getElementById('add_events'),
        btnRemoveEvents = document.getElementById('remove_events'),
        cbKeepWhenEmpty = document.getElementById('keep_when_empty');



    sequencer.ready(function init(){
        var song,
            part,
            events;

        part = sequencer.createPart();

        song = sequencer.createSong({
            useMetronome: true,
            parts: part
        });

        divConsole.innerHTML = 'number of parts in song: ' + song.numParts;

        function addEvents(){
            events = sequencer.util.getRandomNotes({
                minNoteNumber: 60,
                maxNoteNumber: 100,
                minVelocity: 30,
                maxVelocity: 80,
                numNotes: 60
            });

            // if the part has been removed, add it again
            if(song.parts.length === 0){
                song.addPart(part);
            }
            part.addEvents(events);
            song.update();
            divConsole.innerHTML = 'number of parts after adding events: ' + song.numParts;
        }


        function removeEvents(){
            part.removeEvents(part.events);
            song.update();
            divConsole.innerHTML = 'number of parts after removing events: ' + song.numParts;
        }


        btnStart.addEventListener('click', function(){
            song.play();
        });


        btnStop.addEventListener('click', function(){
            song.stop();
        });


        btnAddEvents.addEventListener('click', function(){
            addEvents();
        });


        btnRemoveEvents.addEventListener('click', function(){
            removeEvents();
        });


        cbKeepWhenEmpty.addEventListener('change', function(){
            part.keepWhenEmpty = cbKeepWhenEmpty.checked;
        });
    });
};