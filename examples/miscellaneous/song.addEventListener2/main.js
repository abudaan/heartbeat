window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        output = document.getElementById('console'),

        btnPlay = document.getElementById('play'),
        btnStop = document.getElementById('stop'),
        btnClear = document.getElementById('clear'),
        btnOk = document.getElementById('ok'),
        inputPattern = document.getElementById('input-pattern'),
        selectPattern = document.getElementById('select-pattern');


    sequencer.ready(function(){
        var song,
            events,
            type,
            pattern,
            listenerId = false,
            i = 0,
            ticks = 0,
            bpm = 150;

        events = sequencer.util.getRandomNotes({
            minNoteNumber: 55,
            maxNoteNumber: 100,
            minVelocity: 30,
            maxVelocity: 80,
            noteDuration: 384/4, //ticks
            numNotes: 32
        });

        song = sequencer.createSong({
            bpm: bpm,
            events: events,
            useMetronome: true
        });

        // add an accelerando by adding tempo events to the first 8 beats
        events = [];
        while(i < 8){
            bpm += 10;
            events.push(sequencer.createMidiEvent(ticks, sequencer.TEMPO, bpm));
            ticks += song.ppq; // increase the ticks value by a beat
            i++;
        }
        // add a time signature event
        events.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, 3, 4));

        song.addTimeEvents(events);

        song.setLeftLocator('ticks', 0);
        song.setRightLocator('ticks', song.durationTicks);
        song.setLoop();


        // set up the buttons
        btnPlay.addEventListener('click', function(){
            song.pause();
            if(song.playing){
                btnPlay.value = 'pause';
            }else{
                btnPlay.value = 'play';
            }
        }, false);

        btnStop.addEventListener('click', function(){
            btnPlay.value = 'play';
            song.stop();
        }, false);

        btnClear.addEventListener('click', function(){
            output.innerHTML = '';
        }, false);


        btnOk.addEventListener('click', function(){
            var data = inputPattern.value.split(',');
            type = data[0].trim();
            if(data[1] !== undefined){
                pattern = data[1].trim();
            }else{
                pattern = undefined;
            }
            selectPattern.selectedIndex = 0;
            setPattern();
        }, false);


        selectPattern.addEventListener('change', function(){
            if(selectPattern.selectedIndex === 0){
                if(listenerId !== false){
                    song.removeEventListener(listenerId);
                }
                return;
            }
            var data = selectPattern.options[selectPattern.selectedIndex].getAttribute('data');
            data = data.split(',');
            type = data[0].trim();
            pattern = data[1].trim();
            inputPattern.value = type + ', ' + pattern;
            setPattern();

        }, false);


        function setPattern(){
            if(listenerId !== false){
                song.removeEventListener(listenerId);
            }

            if(type === 'event' || type === 'note'){
                listenerId = song.addEventListener(type, pattern, function(event){
                    output.innerHTML = '[' + event.barsAsString + '] event with id ' + event.id + ' matches "' + pattern + '"<br/>' + output.innerHTML;
                });
            }else if(type === 'position'){
                listenerId = song.addEventListener(type, pattern, function(pattern){
                    output.innerHTML = '[' + song.barsAsString + '] match for "' + pattern + '"<br>' + output.innerHTML;
                });
            }else{
                listenerId = song.addEventListener(type, function(){
                    output.innerHTML = '[' + song.barsAsString + '] match for "' + type + '"<br>' + output.innerHTML;
                });
            }

            if(listenerId === false || listenerId === -1 || listenerId === undefined){
                output.innerHTML = 'wrong pattern <br>' + output.innerHTML;
                listenerId = false;
            }else{
                if(pattern === undefined){
                    output.innerHTML = 'listener added "' + type + '"<br>' + output.innerHTML;
                }else{
                    output.innerHTML = 'listener added "' + type + ', ' + pattern + '"<br>' + output.innerHTML;
                }
            }
        }
    });
};