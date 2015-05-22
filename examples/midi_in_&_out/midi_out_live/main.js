/*
    Note that for using midi out you need to configure virtual midi port on your system, see:

    http://abumarkub.net/abublog/?page_id=399#midi-out
*/

window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        formInputs = document.getElementById('inputs'),
        formOutputs = document.getElementById('outputs');


    // use sequencer.ready(callback) to allow the browser to initialize navigator.requestMIDIAccess
    // this is not necessary if you use sequencer.addAssetPack() or any of the other methods that
    // add assets to heartbeat (addMidiFile(), addSamplePack(), addInstrument())

    sequencer.ready(function(){
        var track, song, checkbox, label;

        if(sequencer.midi === false){
            document.querySelectorAll('p')[0].innerHTML = '';
            formInputs.innerHTML = '<div>No MIDI I/O</div>';
            return;
        }

        // create a track to connect the midi input to
        track = sequencer.createTrack();
        // set monitor to true to route the incoming midi events to the track
        track.monitor = true;

        // add track to new song
        song = sequencer.createSong({
            tracks: track
        });


        formInputs.innerHTML = '<div><em>Select one ore more inputs:</em></div>';

        // get all midi inputs from this song
        song.getMidiInputs(function(port){

            checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('value', port.id);
            checkbox.id = 'input_' + port.id;

            label = document.createElement('label');
            label.setAttribute('for', checkbox.id);
            formInputs.appendChild(label);
            label.appendChild(checkbox);
            label.innerHTML += port.name;

            document.getElementById(checkbox.id).addEventListener('click', function(e){
                var cb = e.target;
                song.tracks.forEach(function(track){
                    track.setMidiInput(cb.value, cb.checked);
                });
            }, false);
        });


        formOutputs.innerHTML = '<div><em>Select one ore more outputs:</em></div>';

        // get all midi outputs from this song
        song.getMidiOutputs(function(port){

            checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('value', port.id);
            checkbox.id = 'output_' + port.id;

            label = document.createElement('label');
            label.setAttribute('for', checkbox.id);
            formOutputs.appendChild(label);
            label.appendChild(checkbox);
            label.innerHTML += port.name;

            document.getElementById(checkbox.id).addEventListener('click', function(e){
                var cb = e.target;
                song.tracks.forEach(function(track){
                    track.setMidiOutput(cb.value, cb.checked);
                });
            }, false);
        });
    });
};