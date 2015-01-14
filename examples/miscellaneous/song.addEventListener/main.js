window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        output = document.getElementById('console'),

        btnPlay = document.getElementById('play'),
        btnStop = document.getElementById('stop'),
        btnClear = document.getElementById('clear'),
        btnRecord = document.getElementById('record');


    // this is a simple example that only shows some basic events sent by the song
    // for a more complete example about midi recording see /examples/3._midi_in_&_out/midi_record
    sequencer.ready(function(){
        var song, events, i = 0, ticks = 0, bpm = 150;

        events = sequencer.util.getRandomNotes({
            minNoteNumber: 55,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            noteDuration: 384/4, //ticks
            numNotes: 32
        });

        song = sequencer.createSong({
            bpm: bpm,
            events: events,
            useMetronome: true
        });

        // add an accelerando by adding tempo events to the first 8 beats
        events = [];
        while(i < 8){
            bpm += 10;
            events.push(sequencer.createMidiEvent(ticks, sequencer.TEMPO, bpm));
            ticks += song.ppq; // increase the ticks value by a beat
            i++;
        }
        // add a time signature event
        events.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, 3, 4));

        song.addTimeEvents(events);

        song.setLeftLocator('ticks', 0);
        song.setRightLocator('ticks', song.durationTicks);
        song.setLoop();

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

        btnClear.addEventListener('click', function(){
            output.innerHTML = '';
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
            output.innerHTML = 'play<br/>' + output.innerHTML;
        });

        song.addEventListener('pause', function(){
            output.innerHTML = 'pause<br/>' + output.innerHTML;
        });

        song.addEventListener('stop', function(){
            output.innerHTML = 'stop<br/>' + output.innerHTML;
        });

        song.addEventListener('end', function(){
            output.innerHTML = 'end<br/>' + output.innerHTML;
        });

        song.addEventListener('loop', function(){
            output.innerHTML = 'song has just looped<br/>' + output.innerHTML;
        });

        song.addEventListener('record_start', function(){
            output.innerHTML = 'record_start<br/>' + output.innerHTML;
        });

        song.addEventListener('record_stop', function(){
            output.innerHTML = 'record_stop<br/>' + output.innerHTML;
        });

        // listen for the start of the 2nd bar
        song.addEventListener('position', 'barsandbeats = 2', function(pattern){
            output.innerHTML = '[' + song.barsAsString + '] match for "' + pattern + '"<br/>' + output.innerHTML;
        });

        // listen for every 2nd beat
        song.addEventListener('position', 'beat = 2', function(pattern){
            output.innerHTML = '[' + song.barsAsString + '] match for "' + pattern + '"<br/>' + output.innerHTML;
        });


        // listen for every even bar number
        song.addEventListener('position', 'bar %= 2', function(pattern){
            output.innerHTML = '[' + song.barsAsString + '] match for "' + pattern + '"<br/>' + output.innerHTML;
        });

        // listen for position equals ticks 1920
        song.addEventListener('position', 'ticks = 1920', function(pattern){
            output.innerHTML = '[' + song.barsAsString + '] match for "' + pattern + '"<br/>' + output.innerHTML;
        });

        // listen for all NOTE_ON events
        song.addEventListener('event', 'type = NOTE_ON', function(event){
            output.innerHTML = '[' + event.barsAsString + '] event with id ' + event.id + ' is of type NOTE_ON<br/>' + output.innerHTML;
        });

        // listen for all NOTE_OFF events starting from bar 3
        song.addEventListener('event', 'type = NOTE_OFF AND bar > 3', function(event){
            output.innerHTML = '[' + event.barsAsString + '] event with id ' + event.id + ' is of type NOTE_OFF<br/>' + output.innerHTML;
        });

        // listen for all TEMPO events
        song.addEventListener('event', 'type = TEMPO', function(event){
            output.innerHTML = '[' + event.barsAsString + '] event with id ' + event.id + ' is of type TEMPO (' + event.bpm + ')<br/>' + output.innerHTML;
        });

        // listen for all TIME_SIGNATURE events
        song.addEventListener('event', 'type = TIME_SIGNATURE', function(event){
            output.innerHTML = '[' + event.barsAsString + '] event with id ' + event.id + ' is of type TIME_SIGNATURE (' + event.nominator + '/' + event.denominator + ')<br/>' + output.innerHTML;
        });

        // listen for all C4 notes, note that the song is generated randomly so this note is not always present
        song.addEventListener('event', 'noteNumber = 60', function(event){
            output.innerHTML = '[' + event.barsAsString + '] event with id ' + event.id + ' is the central C<br/>' + output.innerHTML;
        });

        // listen for the 4th event in the song
        song.addEventListener('event', song.events[3], function(event){
            output.innerHTML = '[' + event.barsAsString + '] event with id ' + event.id + ' is the 4th event of this song<br/>' + output.innerHTML;
        });

    });
};