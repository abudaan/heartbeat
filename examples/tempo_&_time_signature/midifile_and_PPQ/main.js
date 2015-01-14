window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        path = '../../../assets',
        testMethod = 1;


    enableUI(false);

    /*
        By default the PPQ value of the imported midi file is converted to the default PPQ of heartbeat. In some cases you
        might not want to overrule the PPQ of the midi file, or you might want to set the PPQ value of your song to another
        value than heartbeat's default PPQ. In these cases you need to convert the PPQ value of the events. See below.
    */

    // tell heartbeat to note overrule the PPQ value of the midi file
    sequencer.overrulePPQ = false;

    // change the default value of heartbeat's PPQ (the default value is 960)
    sequencer.defaultPPQ = 480;

    //now load and parse a midi file, the midi file will keep its original PPQ
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);


    function init(){
        var song, midiFile;

        // get the midi file from sequencer.storage
        midiFile = sequencer.getMidiFile('Sonata Facile');

        // show the PPQ value of the midi file, this is the original value
        console.log('original PPQ value of the midi file:', midiFile.ppq);

        switch(testMethod){

            case 1:
            /*
                Create a song and set the PPQ to the same value as the imported midi file. All is fine now,
                the song plays back like it should.
            */
                song = sequencer.createSong({
                    ppq: midiFile.ppq,
                    tracks: midiFile.tracks,
                    useMetronome: true
                });
                break;

            case 2:
            /*
                Create a song and don't set the PPQ; now the PPQ of the song is the default value which we have
                set to 480. If you play it, you'll hear a mess: the metronome plays at PPQ 480 and the midi file
                at PPQ 384. This means that the midi file plays 480/384 = 1.25 times faster that the metronome.
            */
                song = sequencer.createSong({
                    tracks: midiFile.tracks,
                    useMetronome: true
                });
                break;

            case 3:
            /*
                We can convert the events of the midi file to PPQ 480 by using sequencer.convertPPQ(). The first
                2 arguments of this method are oldPPQ and newPPQ, and after these you can add any number of arrays containing
                events, and instances of Part, Track, Song and MidiFile. The operation affects the events directly, so you
                have to make a copy if you want to keep the events with the old PPQ value as well.
            */

                sequencer.convertPPQ(midiFile.ppq, 480, midiFile);
                // now the events of the midi file are converted to PPQ 480, the song plays back fine at 480

                song = sequencer.createSong({
                    tracks: midiFile.tracks,
                    useMetronome: true
                });
                break;
        }



        // set all tracks of the song to use 'piano'
        song.tracks.forEach(function(track){
            track.setInstrument('piano');
        });

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        enableUI(true);
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