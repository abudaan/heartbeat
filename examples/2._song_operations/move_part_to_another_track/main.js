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
        divConsole = document.getElementById('console'),

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


        part = sequencer.createPart();
        part.addEvents(events);

        track1 = sequencer.createTrack();
        track2 = sequencer.createTrack();
        track2.setInstrument('piano');

        track1.addPart(part);
        btnTrack1.disabled = true;

        song = sequencer.createSong({
            tracks: [track1, track2],
            useMetronome: true
        });

        divConsole.innerHTML  = 'track1.parts' + track1.parts + '<br/>';
        divConsole.innerHTML += 'track2.parts' + track2.parts;


        btnTrack1.addEventListener('click', function(){
            btnTrack1.disabled = true;
            btnTrack2.disabled = false;
            var part = track2.removePart(track2.parts[0]);
            song.update();
            track1.addPart(part);
            song.update();
            divConsole.innerHTML  = 'track1.parts' + track1.parts + '<br/>';
            divConsole.innerHTML += 'track2.parts' + track2.parts;
            console.log('track1.parts', track1.parts);
            console.log('track2.parts', track2.parts);
        });


        btnTrack2.addEventListener('click', function(){
            btnTrack1.disabled = false;
            btnTrack2.disabled = true;
            var part = track1.removePart(track1.parts[0]);
            song.update();
            track2.addPart(part);
            song.update();
            divConsole.innerHTML  = 'track1.parts' + track1.parts + '<br/>';
            divConsole.innerHTML += 'track2.parts' + track2.parts;
            console.log('track1.parts', track1.parts);
            console.log('track2.parts', track2.parts);
        });


        btnStart.addEventListener('click', function(){
            song.play();
        });


        btnStop.addEventListener('click', function(){
            song.stop();
        });

        enableUI(true);
        btnTrack1.disabled = true;
    });


    function enableUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }
};