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
            events = [],
            i, ticks = 0;


        for(i = 0; i < 127; i++){
            events.push(sequencer.createMidiEvent(ticks, sequencer.PITCH_BEND, i));
            ticks += 120/4;
        }

        part = sequencer.createPart();
        part.addEvents(events);

        song = sequencer.createSong({
            parts: part,
            useMetronome: true
        });

        //console.log(song.events);

        /*
            Pitch bend events are not (yet) processed by heartbeat's internal sample player.

            However pitch bend events are send to midi outport so if you connect an external (soft)synth to heartbeat they will be processed properly if your external
            (soft) synth supports them.

            In this example we process the pitch bend event in the graphical environment (read: we simply print them to the console) so we use song.addEventListener().

            Note that not all events are printed because update frequency of the song.addEventListener() depends on requestAnimationFrame which intervals are too coarse for midi.
        */
        song.addEventListener('event', 'type = pitch_bend', function(e){
            console.log(e.data1);
        });

        btnStart.addEventListener('click', function(){
            song.play();
        });


        btnStop.addEventListener('click', function(){
            song.stop();
        });
    });

};