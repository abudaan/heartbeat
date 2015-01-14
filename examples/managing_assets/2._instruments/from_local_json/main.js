window.onload = function() {

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        // relative path to assets
        path = '../../../../assets';


    function getRandom(min, max, round){
        var r = Math.random() * (max - min) + min;
        if(round === true){
            return Math.round(r);
        }else{
            return r;
        }
    }


    function createEvents(numEvents){
        var i, noteNumber, velocity, midiEvent,
        noteDuration = 384/8,
        events = [],
        ticks = 0;

        for(i = 0; i < numEvents; i++){
            noteNumber = getRandom(60, 65, true);
            velocity = getRandom(30, 80, true);

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
            events.push(midiEvent);
            ticks += noteDuration;

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
            events.push(midiEvent);
            ticks += noteDuration;
        }
        return events;
    }


    function init(){
        var song, track, part;

        part = sequencer.createPart();
        part.addEvents(createEvents(30));

        track = sequencer.createTrack();
        track.monitor = true;
        track.setMidiInput('all');
        track.addPart(part);

        track.setInstrument('Percussion Small');

        song = sequencer.createSong({
            useMetronome: true,
            tracks: track
        });

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        console.log(sequencer.storage);
    }

    // sample pack is loaded remotely
    sequencer.addSamplePack({url: path + '/examples/percussion-small-samplepack-notenames.json'});

    // instrument is added locally
    sequencer.addInstrument({
        name: 'Percussion Small',
        folder: 'percussive',
        sample_path: 'heartbeat/percussive/Percussion Small',
        mapping: [60, 65],
        release_duration: 1200
    }, init);

};
