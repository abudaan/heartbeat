window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        round = Math.round,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        i,
        song,
        midiEvent,
        bpm = 60,
        ticks = 0,
        volume = 127, // volume of track
        velocity = 100, // velocity of the notes (note: volume != velocity)
        noteNumber = 70,
        events = [],
        noteDuration = 384/2, // ticks
        numEvents = 12,
        volumeStep = volume/numEvents;


    sequencer.ready(function init(){
        // create notes and a fade out by using control change number 7, i.e. volume
        for(i = 0; i < numEvents; i++){
            noteNumber = i % 2 === 0 ? 70 : 72;
            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
            events.push(midiEvent);
            ticks += noteDuration;
            ticks += noteDuration;
            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
            events.push(midiEvent);

            // decrease volume of track gradually after each note off event
            volume = round(volume - volumeStep);
            volume = volume < 0 ? 0 : volume;
            midiEvent = sequencer.createMidiEvent(ticks, sequencer.CONTROL_CHANGE, 7, volume);
            events.push(midiEvent);
        }

        song = sequencer.createSong({
            bpm: bpm,
            events: events,
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