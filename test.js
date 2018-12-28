import sequencer from './build/heartbeat';

// console.log(sequencer);

sequencer.ready(() => {
    
    const events = sequencer.util.getRandomNotes({
        minNoteNumber: 60,
        maxNoteNumber: 100,
        minVelocity: 30,
        maxVelocity: 80,
        numNotes: 60
    });
        
    const part = sequencer.createPart();
    part.addEvents(events);

    const song = sequencer.createSong({
        parts: part,
        useMetronome: true
    });
    
    document.addEventListener('click', () => {   
        if (song.isPlaying) {
            song.pause();
        } else {
            song.play();
        }
    });
});
