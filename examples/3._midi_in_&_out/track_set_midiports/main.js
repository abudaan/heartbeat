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

        // replace the loading message
        form.innerHTML = '<div>Deselect one of the following midi inputs to stop receiving events from that input in the track:<div>';


        track = sequencer.createTrack();
        track.setInstrument('piano');
        // set monitor to true to route the incoming midi events to the piano
        track.monitor = true;
        track.setMidiInput('all');

        song = sequencer.createSong({
            tracks: track
        });

        /*
            Show available midi inputs of this song and create checkboxes for each of them.
            If you deselect a checkbox the song won't receive events from this input anymore.
            Note the that we are using song.getMidiInputs() instead of sequencer.getMidiInputs() -> see song_set_midiports
        */

        // first check if there are any midi inports
        if(sequencer.numMidiInputs === 0){
            form.innerHTML = '<div>No midi inputs detected</div>'
            return;
        }

        // then check if this song has any midi inputs
        if(song.numMidiInputs === 0){
            form.innerHTML = '<div>No midi inputs available in this song</div>'
            return;
        }

        song.getMidiInputs(function(port){
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
                track.setMidiInput(cb.value, cb.checked);
            }, false);
        });
    }
};