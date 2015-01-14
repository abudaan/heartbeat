window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        btnPlay = document.getElementById('play'),
        btnStop = document.getElementById('stop'),
        btnLoop = document.getElementById('loop'),
        btnMetronome = document.getElementById('metronome'),

        samplePackUrl = '../../../assets/looperman/kaynine/loops';


    enableUI(false);

    // load sample pack, the sample pack contains a drum loop @ 120 bpm
    sequencer.ready(function(){
        samplePackUrl = sequencer.ogg === false ? samplePackUrl + '.mp3.json' : samplePackUrl + '.ogg.json';
        sequencer.addSamplePack({url: samplePackUrl}, init, true);
    });


    function init(){
        var track, part, song, event, events = [];

        track = sequencer.createTrack();
        part = sequencer.createPart();

        // create audio event at ticks 0
        event = sequencer.createAudioEvent({
            ticks: 0,
            velocity: 70,
            path: 'looperman/kaynine/electro-drum-120'
        });
        events.push(event);

        // create another audio event at 4 bars; the duration of the loop is 4 bars
        event = event.copy();
        event.ticks = 960 * 16; // 4 x 4 x ppq
        events.push(event);

        part.addEvents(events);
        track.addPart(part);

        // set the song to match the bpm of the loop
        song = sequencer.createSong({
            bpm: 120,
            useMetronome: true,
            tracks: track,
            loop: true,
            bars: 8 // 2 audio events containing loops of 4 bars
        });

        song.setLeftLocator('barsbeats', 1,1,1,0);
        song.setRightLocator('barsbeats', 9,1,1,0);


        btnPlay.addEventListener('click', function(){
            if(song.playing){
                song.pause();
            }else{
                song.play();
            }
            btnPlay.value = song.playing === true ? 'pause' : 'play';
        });


        btnStop.addEventListener('click', function(){
            song.stop();
            btnPlay.value = 'play';
        });


        btnLoop.addEventListener('click', function(){
            song.setLoop();
            this.value = song.loop ? 'turn loop off' : 'turn loop on';
        }, false);


        btnMetronome.addEventListener('click', function(){
            song.useMetronome = !song.useMetronome;
            this.value = song.useMetronome ? 'turn metronome off' : 'turn metronome on';
        }, false);


        song.addEventListener('end', function(){
            btnPlay.value = 'play';
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