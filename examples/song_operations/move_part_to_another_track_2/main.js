window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnTrack1 = document.getElementById('track1'),
        btnTrack2 = document.getElementById('track2'),

        // relative path to assets
        path = '../../../assets';



    enableUI(false);

    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, function init(){
        var song,
            part,
            track1,
            track2,
            events;

        events = sequencer.util.getRandomNotes({
            minNoteNumber: 60,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            numNotes: 24
        });


        // track1 plays back with the default instrument, track2 play the piano
        track1 = sequencer.createTrack();
        track2 = sequencer.createTrack();
        track2.setInstrument('piano');

        song = sequencer.createSong({
            tracks: [track1, track2],
            useMetronome: true
        });

        part = sequencer.createPart();
        part.addEvents(events);

        track1.addPartAt(part, ['barsandbeats', 2]);
        song.update();

        enableUI(true);
        // part is added to the first track, so disable the "move part to track1" button
        btnTrack1.disabled = true;

        btnTrack1.addEventListener('click', function(){
            btnTrack1.disabled = true;
            btnTrack2.disabled = false;
            var part = track2.removePart(track2.parts[0]);
            song.update();
            track1.addPartAt(part, ['barsandbeats', 2]);
            song.update();
            printEvents([track1, track2]);
        });


        btnTrack2.addEventListener('click', function(){
            btnTrack1.disabled = false;
            btnTrack2.disabled = true;
            var part = track1.removePart(track1.parts[0]);
            song.update();
            track2.addPartAt(part, ['barsandbeats', 2]);
            song.update();
            printEvents([track1, track2]);
        });


        btnStart.addEventListener('click', function(){
            song.play();
        });


        btnStop.addEventListener('click', function(){
            song.stop();
        });
    });


    function printEvents(tracks){
        tracks.forEach(function(track){
            track.events.forEach(function(event){
                console.log(track.id, event.track.instrumentId);
            });
        });
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