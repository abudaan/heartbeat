window.onload = function() {

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        // specify the load method that you want to test with
        loadMethod = 1,

        // relative path to assets
        path = '../../../../assets';


    enableUI(false);


    function init(){
        var song, track, part;

        part = sequencer.createPart();
        part.addEvents(createEvents(30));

        track = sequencer.createTrack();
        track.addPart(part);
        track.setInstrument('Small Percussion');

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

        enableUI(true);
        console.log(sequencer.storage);
    }


    switch(loadMethod){

        case 0:
            // don't load anything, see what happens
            sequencer.ready(function(){
                init();
            });
            break;

        case 1:
            /*
                See the file 'percussion-small-samplepack-notenames.json' displayed below this code block (in the html page).
                In the file a name and a folder are specified, so the samples are stored at the path
                'heartbeat/percussive/Percussion Small'.
            */
            sequencer.addSamplePack({url: path + '/examples/percussion-small-samplepack-notenames.json'});

            sequencer.addInstrument({
                name: 'Small Percussion',
                folder: 'heartbeat/percussive',
                sample_path: 'heartbeat/percussive/Percussion Small',
                mapping: [60, 65],
                release_duration: 1200
            }, init);
            break;

        case 2:
            /*
                Because a name and a folder are supplied to the addSamplePack() method, the name and the folder
                specified in the json file get overruled, therefor the samples of the sample pack are stored in a
                different location: 'percussion instruments/Small Percussion Instruments'.
                As you can see, we change the value of the sample_path of the instrument accordingly
            */
            sequencer.addSamplePack({
                name: 'Small Percussion Instruments',
                folder: 'percussion instruments',
                url: path + '/examples/percussion-small-samplepack-notenames.json'
            });

            sequencer.addInstrument({
                name: 'Small Percussion',
                folder: 'heartbeat/percussive',
                sample_path: 'percussion instruments/Small Percussion Instruments',
                mapping: [60, 65],
                release_duration: 1200
            }, init);
            break;
    }


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

    function enableUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }
};
