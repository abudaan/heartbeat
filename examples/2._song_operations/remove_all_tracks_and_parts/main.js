window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnRemoveTracksAndParts = document.getElementById('remove'),

        // relative path to assets
        path = '../../../assets';


    // add asset pack, this pack contains a basic piano sound
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);

    enableUI(false);

    function init(){
        var song, track, part, tracks = [], events, i = 0;

        song = sequencer.createSong();

        while(i < 6){
            part = sequencer.createPart();
            track = sequencer.createTrack();

            events = sequencer.util.getRandomNotes({
                minNoteNumber: 60,
                maxNoteNumber: 100,
                minVelocity: 30,
                maxVelocity: 80,
                noteDuration: 120, //ticks
                numNotes: 8
            });

            part.addEvents(events);
            track.addPart(part);

            if(i % 2 !== 0){
                track.update();
                track.movePart(part, i * 240);
            }

            track.setInstrument('piano');
            tracks.push(track);

            i++;
        }

        song.addTracks(tracks);
        song.update();

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        btnRemoveTracksAndParts.addEventListener('click', function(){
            // removeTracks returns an array containing the removed tracks
            song.removeTracks(song.tracks).forEach(function(track){
                // removeParts returns an array containing the removed parts
                track.removeParts(track.parts).forEach(function(part){
                    // we don't want to reuse the part, so set it to null and hand it to the garbage collector
                    part = null;
                });
                // same for track
                track = null;
            });

            song.update();
            // now show the empty song
            console.log(song.tracks);
            console.log(song.parts);
            console.log(song.events);
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