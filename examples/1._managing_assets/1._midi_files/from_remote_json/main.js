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
        path = '../../../../assets';


    function init(){
        var midifile, song;

        // get the midi file from the storage
        switch(loadMethod){
            case 1:
            /*
                See the file "mozart_kv545a.json" displayed below this code block (in the html page).
                A name and a folder are specified in the json file, so the midi file is stored here:

                sequencer.storage.midi.classical.Mozart["Sonata Facile"]
            */
                midifile = sequencer.getMidiFile('classical/Mozart/Sonata Facile', true);
                //or just:
                //midifile = sequencer.getMidiFile('Sonata Facile');
                break;

            case 2:
            /*
                A name and a folder are supplied to createMidiFile(), this will override the name and
                the folder specified in the json file, the midi file is stored here:

                sequencer.storage.midi["classical piano music"]["W.A. Mozart"]["Sonata Facile 1st movement"]
            */
                midifile = sequencer.getMidiFile('classical piano music/W.A. Mozart/Sonata Facile 1st movement', true);
                //or just:
                //midifile = sequencer.getMidiFile('Sonata Facile 1st movement');
                break;

            case 3:
            /*
                No name and no folder are specified in the json file, the file is stored
                in the main midi folder by the name of the json file:

                sequencer.storage.midi.mozart_kv545a_no_name_no_folder
            */
                midifile = sequencer.getMidiFile('mozart_kv545a_no_name_no_folder', true);
                //or just:
                //midifile = sequencer.getMidiFile('mozart_kv545a_no_name_no_folder');
                break;

            case 4:
            /*
                Only a folder "classical/Mozart" is specified in the json file, the file is stored
                by the name of the json file:

                sequencer.storage.midi.classical.Mozart.mozart_kv545a_no_name
            */
                midifile = sequencer.getMidiFile('classical/Mozart/mozart_kv545a_no_name', true);
                //or just:
                //midifile = sequencer.getMidiFile('mozart_kv545a_no_name');
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
            sequencer.addMidiFile({url: path + '/examples/mozart_kv545a.json'}, init);
            break;

        case 2:
            sequencer.addMidiFile({
                    name: 'Sonata Facile 1st movement',
                    folder: 'classical piano music/W.A. Mozart',
                    url: path + '/examples/mozart_kv545a.json'
                },
                init
            );
            break;

        case 3:
            sequencer.addMidiFile({url: path + '/examples/mozart_kv545a_no_name_no_folder.json'}, init);
            break;

        case 4:
            sequencer.addMidiFile({url: path + '/examples/mozart_kv545a_no_name.json'}, init);
            break;
    }
};
