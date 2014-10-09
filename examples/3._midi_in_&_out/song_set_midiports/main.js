window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        form = document.getElementById('form'),

        path = '../../../assets';


    // add asset pack, this pack contains a piano
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);


    function init(){
        var song, track, checkbox, label;

        if(sequencer.midi === false){
            form.innerHTML = 'No MIDI I/O';
            return;
        }

        // replace the loading message
        form.innerHTML = '<div>Deselect one of the following midi inputs to stop receiving events from that input in the song:<div>';


        track = sequencer.createTrack();
        track.setInstrument('piano');
        // set monitor to true to route the incoming midi events to the piano
        track.monitor = true;
        track.setMidiInput('all');

        song = sequencer.createSong({
            tracks: track
        });

        /*
            Show available midi inputs and create checkboxes for each of them.
            If you deselect a checkbox the song doesn't receive the midi events send from that input anymore.
            This also means that the tracks of the song don't receive the midi events from this input anymore
        */

        // first check if there are any midi inports
        if(sequencer.numMidiInputs === 0){
            form.innerHTML = '<div>No midi inputs detected</div>'
            return;
        }

        sequencer.getMidiInputs(function(port){
            checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('value', port.id);
            checkbox.setAttribute('checked', true);
            checkbox.id = port.id;

            label = document.createElement('label');
            label.setAttribute('for', port.id);
            form.appendChild(label);
            label.appendChild(checkbox);
            label.innerHTML += port.label;

            document.getElementById(checkbox.id).addEventListener('click', function(e){
                var cb = e.target;
                song.setMidiInput(cb.value, cb.checked);
            }, false);
        });
    }
};