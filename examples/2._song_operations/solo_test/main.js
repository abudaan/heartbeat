window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnPart1Solo = document.getElementById('part1-solo'),
        btnPart2Solo = document.getElementById('part2-solo'),
        btnPart3Solo = document.getElementById('part3-solo'),
        btnUnmuteAll = document.getElementById('unmute'),
        soloButtons = [btnPart1Solo, btnPart2Solo, btnPart3Solo];


    sequencer.ready(function init(){
        var song,
            part1 = sequencer.createPart(),
            part2 = sequencer.createPart(),
            part3 = sequencer.createPart(),
            i, event,
            events = [],
            ticks = 0,
            ppq = 960,
            duration = 120;

        for(i = 0; i < 8; i++){
            event = sequencer.createMidiEvent(ticks, 144, 60, 100);
            events.push(event);
            ticks += duration;
            event = sequencer.createMidiEvent(ticks, 128, 60, 0);
            events.push(event);
            ticks += ppq - duration;
        }
        part1.addEvents(events);

        events = [];
        ticks = ppq/2;

        for(i = 0; i < 8; i++){
            event = sequencer.createMidiEvent(ticks, 144, 70, 100);
            events.push(event);
            ticks += duration;
            event = sequencer.createMidiEvent(ticks, 128, 70, 0);
            events.push(event);
            ticks += ppq - duration;
        }

        part2.addEvents(events);


        events = [];
        ticks = 0;

        for(i = 0; i < 8; i++){
            event = sequencer.createMidiEvent(ticks, 144, 84, 50);
            events.push(event);
            ticks += duration;
            event = sequencer.createMidiEvent(ticks, 128, 84, 0);
            events.push(event);
            ticks += (ppq/2) - duration;
        }

        part3.addEvents(events);

        song = sequencer.createSong({
            parts: [part1, part2, part3],
            useMetronome: true,
            bars: 2,
            loop: true
        });

        song.setLeftLocator('barsbeats', 1);
        song.setRightLocator('barsbeats', 3);

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        btnPart1Solo.addEventListener('click', function(){
            part1.setSolo(true);
            setSoloButtons(btnPart1Solo);
        });

        btnPart2Solo.addEventListener('click', function(){
            part2.setSolo(true);
            setSoloButtons(btnPart2Solo);
        });

        btnPart3Solo.addEventListener('click', function(){
            part3.setSolo(true);
            setSoloButtons(btnPart3Solo);
        });

        btnUnmuteAll.addEventListener('click', function(){
            part1.setSolo(false);
            part2.setSolo(false);
            part3.setSolo(false);
            setSoloButtons();
        });

        function setSoloButtons(button){
            soloButtons.forEach(function(b){
                b.disabled = b === button;
            });
            btnUnmuteAll.disabled = button === undefined ? true : false;
        }

        btnUnmuteAll.disabled = true;
    });

};