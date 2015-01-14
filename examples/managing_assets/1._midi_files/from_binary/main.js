window.onload = function() {

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),

        // specify the load method that you want to test with
        loadMethod = 2,

        // relative path to assets
        path = '../../../../assets';


    function init(){
        var midifile, song;

        switch(loadMethod){
            case 1:
                /*
                    the midi file is stored by the name of the binary file "mozk545a" in the root folder:
                    sequencer.storage.midi.mozk545a
                */
                midifile = sequencer.getMidiFile('mozk545a');
                break;

            case 2:
                /*
                    local_path is specified, the file is stored here:
                    sequencer.storage.midi.classical.Mozart["Sonata Facile"]
                */
                midifile = sequencer.getMidiFile('classical/Mozart/Sonata Facile');
                //or just:
                //midifile = sequencer.getMidiFile('Sonata Facile');
                break;
        }

        midifile.useMetronome = true;
        song = sequencer.createSong(midifile);

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        console.log(sequencer.storage.midi);
    }


    switch(loadMethod){

        case 1:
            sequencer.addMidiFile({url: path + '/midi/mozk545a.mid'}, init);
            break;

        case 2:
            sequencer.addMidiFile({
                    name: 'Sonata Facile',
                    folder: 'classical/Mozart',
                    url: path + '/midi/mozk545a.mid'
                },
                init);
            break;
    }
};
