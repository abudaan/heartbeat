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
        velocity = 100, // velocity of the notes
        noteNumber = 70,
        events = [],
        noteDuration = 384/2, // ticks
        numEvents = 12,
        panning = 0,
        panningStep = 127/numEvents;

    /*

        Note that panning events are not perfectly scheduled (yet); the panning event is processed
        as soon as the scheduler sends it to the instrument. So the panning event is always processed
        a few milliseconds too early (dependent on the value of sequencerbufferTime.
        Will be improved/fixed in later versions of heartbeat.

    */


    sequencer.ready(function init(){
        // start with panning fully to the left (0)
        midiEvent = sequencer.createMidiEvent(ticks, sequencer.CONTROL_CHANGE, 10, panning);
        events.push(midiEvent);

        // then gradually change panning to full right (127)
        for(i = 0; i < numEvents; i++){
            noteNumber = i % 2 === 0 ? 70 : 72;
            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
            events.push(midiEvent);
            ticks += noteDuration;

            ticks += noteDuration;
            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
            events.push(midiEvent);

            // change panning after each note off event
            panning = round(panning + panningStep);
            panning = panning < 0 ? 0 : panning;
            midiEvent = sequencer.createMidiEvent(ticks, sequencer.CONTROL_CHANGE, 10, panning);
            events.push(midiEvent);
        }


        song = sequencer.createSong({
            bpm: bpm,
            events: events,
            useMetronome: true
        });


        btnStart.addEventListener('click', function(e){
            song.play();
        });


        btnStop.addEventListener('click', function(e){
            song.stop();
        });

    });
};