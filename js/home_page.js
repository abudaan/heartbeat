window.onload = function(){

    'use strict';

    var
        listItems = document.querySelectorAll('li'),
        testButton = document.getElementById('test'),
        numItems = listItems.length,
        links = ['./api', './docs', 'https://github.com/abudaan/heartbeat', './examples'],
        i, item, width;

    for(i = 0; i < numItems; i++){
        item = listItems[i];
        width = item.getBoundingClientRect().width;
        item.style.width = width + 10 + 'px';
        item.id = i;
        item.addEventListener('click', function(){
            window.location.href = links[this.id];
        }, false);
    }
/*
    testButton.enabled = false;

    sequencer.ready(function init(){
        var song,
            events,
            listenerId;

        testButton.enabled = true;
        testButton.addEventListener('click', function(){
            if(song && song.playing){
                testButton.value = 'test';
                //song.removeEventListener(listenerId);
                song.stop();
                return;
            }
            testButton.value = 'stop';
            events = sequencer.util.getRandomNotes({
                minNoteNumber: 60,
                maxNoteNumber: 100,
                minVelocity: 30,
                maxVelocity: 80,
                numNotes: 30
            });
            song = sequencer.createSong({
                events: events,
                bpm: 500
            });
            song.play();
            listenerId = song.addEventListener('end', function(){
                testButton.value = 'test';
                //console.log(listenerId);
            });
        }, false);
    });
*/

};