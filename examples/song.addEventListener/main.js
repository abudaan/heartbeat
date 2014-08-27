window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        output = document.getElementById('console'),

        btnPlay = document.getElementById('play'),
        btnStop = document.getElementById('stop'),
        btnRecord = document.getElementById('record');


    // this is a simple example that only shows some basic events sent by the song
    // for a more complete example about midi recording see /examples/3._midi_in_&_out/midi_record
    sequencer.ready(function(){
        var song, events;

        events = sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            noteDuration: 384/4, //ticks
            numNotes: 12
        });

        song = sequencer.createSong({
            bars: 2,
            bpm: 120,
            events: events,
            useMetronome: true
        });


        // setup the buttons

        btnPlay.addEventListener('click', function(){
            song.pause();
            if(song.playing){
                btnPlay.value = 'pause';
            }else{
                btnPlay.value = 'play';
            }
        }, false);

        btnStop.addEventListener('click', function(){
            btnPlay.value = 'play';
            song.stop();
        }, false);

        btnRecord.addEventListener('click', function(){
            if(song.recording){
                song.stopRecording();
                btnRecord.value = 'start recording';
            }else{
                song.startRecording();
                btnRecord.value = 'stop recording';
            }
        }, false);


        // add event listeners to the song

        song.addEventListener('play', function(){
            output.innerHTML = output.innerHTML + 'play<br/>';
        });

        song.addEventListener('pause', function(){
            output.innerHTML = output.innerHTML + 'pause<br/>';
        });

        song.addEventListener('stop', function(){
            output.innerHTML = output.innerHTML + 'stop<br/>';
        });

        song.addEventListener('end', function(){
            output.innerHTML = output.innerHTML + 'end<br/>';
        });

        song.addEventListener('record_start', function(){
            output.innerHTML = output.innerHTML + 'record_start<br/>';
        });

        song.addEventListener('record_stop', function(){
            output.innerHTML = output.innerHTML + 'record_stop<br/>';
        });
    });
};