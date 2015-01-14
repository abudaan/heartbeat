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

        // set the instrument to the track
        switch(loadMethod){

            case 1:
            /*
                See the file "percussion-small-instrument.json" displayed below this code block (in the html page).
                The name of the instrument is set in the json file, so we have to use that name to add the
                instrument to the track.
            */
                track.setInstrument('Percussion Small');
                break;

            case 2:
            /*
                A name and a folder are supplied to the method addInstrument() which overrides the values specified
                in the json file.
            */
                track.setInstrument('Small Percussion Instruments');
                break;

            case 3:
            /*
                Same as method 1 only we use a keyrange instead of a mapping in the instrument file. The sample pack uses
                notenumbers instead of sample names for id, see the file percussion-small-samplepack-notenumbers.json below.
            */
                track.setInstrument('Percussion Small');
                break;
        }


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


    /*
        We need to add samples as well to test the instrument, so we load a sample pack. Note that we don't have to
        set a callback for addSamplePack(). This is because all methods that add/load assets to heartbeat are added to an
        internal queue that handles the add methods in the order they are added. This means that "init()" is called after
        both the sample pack and the instrument are loaded and available.
    */

    switch(loadMethod){

        case 1:
            sequencer.addSamplePack({url: path + '/examples/percussion-small-samplepack.json'});
            sequencer.addInstrument({url: path + '/examples/percussion-small-instrument.json'}, init);
            break;

        case 2:
            sequencer.addSamplePack({url: path + '/examples/percussion-small-samplepack.json'});
            sequencer.addInstrument({
                    name: 'Small Percussion Instruments',
                    folder: 'percussive',
                    url: path + '/examples/percussion-small-instrument.json'
                },
                init
            );
            break;

        case 3:
            sequencer.addSamplePack({url: path + '/examples/percussion-small-samplepack-notenumbers.json'});
            sequencer.addInstrument({url: path + '/examples/percussion-small-instrument-keyrange.json'}, init);
            break;
    }
};
