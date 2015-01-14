window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start');


    sequencer.ready(function init(){
        var song,
            part,
            note,
            events = [];

        events.push(sequencer.createMidiEvent(0, 144, 60, 100));
        events.push(sequencer.createMidiEvent(240, 128, 60, 0));

        part = sequencer.createPart();
        part.addEvents(events);

        // call part.update() so notes will be created from the events
        part.update();

        // now we can get the first note
        note = part.notes[0];
        console.log(note.name, note.number);

        // and transpose it from C4 (60) to E7 (100)
        note.setPitch(100);
        console.log(note.name, note.number);

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
    });

};