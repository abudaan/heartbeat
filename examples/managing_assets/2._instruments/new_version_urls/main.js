window.onload = function() {

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

/*
        You can use notenumbers or notenames (in any notename mode) as keys

        notenumbers:

        samples = {
            '60': 'http://...',
            '61': 'http://...',
            '62': 'http://...',
            '63': 'http://...',
            '64': 'http://...',
            '65': 'http://...',
        };


        notenames in sharp mode:

        samples = {
            'C4':  'http://...',
            'C#4': 'http://...',
            'D4':  'http://...',
            'D#4': 'http://...',
            'E4':  'http://...',
            'F4':  'http://...',
        };


        notenames in flat mode:
*/
        samples = {
            'C4':  'http://abumarkub.net/heartbeat/assets/conga-mut-rr1.wav',
            'Db4': 'http://abumarkub.net/heartbeat/assets/conga-mut-rr2.wav',
            'D4':  'http://abumarkub.net/heartbeat/assets/conga-opn-rr1.wav',
            'Eb4': 'http://abumarkub.net/heartbeat/assets/conga-opn-rr2.wav',
            'E4':  'http://abumarkub.net/heartbeat/assets/conga-slp-rr1.wav',
            'F4':  'http://abumarkub.net/heartbeat/assets/conga-slp-rr2.wav'
        };


    sequencer.ready(function init(){
        var events = sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 65,
            minVelocity: 30,
            maxVelocity: 80,
            numNotes: 32
        }),

        song = sequencer.createSong({
            bpm: 120,
            events: events
        });

        /*
            The method sequencer.createInstrument2() is the new way of creating instruments, it makes it super easy to create an instrument.

            Older methods will be removed in the upcoming version. Also all asset loading methods will be removed. This means that the upcoming
            version will not be backwards compatible!
        */
        sequencer.createInstrument2({samples: samples}).then(
            function onFullfilled(instrument){
                //console.log(instrument);
                song.tracks[0].setInstrument(instrument);
                btnStart.disabled = false;
                btnStop.disabled = false;
            },
            function onRejected(e){
                console.log(e.stack);
            }
        );

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });
    });
};
