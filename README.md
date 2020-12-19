heartbeat
=========

#### important update 19/12/2020

This repository will no longer be maintained here as heartbeat is now part of [WebDAW modules](https://github.com/abudaan/webdaw-modules). You can still use heartbeat but you have to import it to your project like so:

```typescript
import { heartbeat, Heartbeat } from 'webdaw-modules';

heartbeat.ready().then(() => {
  const song: Heartbeat.Song = heartbeat.createSong();
});
```
So `heartbeat` (all lowercase) is the module and `Heartbeat` (with capital) is the namespace where all heartbeat typings live.

Obviously you don't have to use typescript and you can use in your plain javascript projects as well.


#### introduction

Heartbeat is a MIDI/Audio sequencer for your browser. Heartbeat has no GUI. It is intended to be used as an engine behind your application. Heartbeat is set up very flexible so you can make any kind of application on top of it; a game, an online DAW, artistic sites, music science experiments and so on. [Read more](http://abudaan.github.io/heartbeat/docs).

So far heartbeat has been used in 2 [MusicFirst](https://musicfirst.com/splash) projects:
- [Groovy](https://musicfirst.com/groovy-music)
- [Morton Subotnick’s Music Academy](https://musicfirst.com/msma)


#### example

Install heartbeat:
`yarn add heartbeat-sequencer`

or:
`npm i heartbeat-sequencer`


```javascript
import sequencer from 'heartbeat-sequencer';

const init = async () => {
  await sequencer.ready();

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
}

init();

```

or:

```javascript
import sequencer from 'heartbeat-sequencer';

sequencer
.ready()
.then(init);

const init = () => {
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
}


```


#### key features

###### MIDI
- create MIDI file from scratch
- import existing MIDI files
- save MIDI data to a file (SMF 1.0)
- record MIDI (only in browsers that support the WebMIDI API or have the [Jazz plugin](http://jazz-soft.net) installed)
- play back MIDI via external hardware, virtual MIDI ports or included softsynths or sample player
- quantize and fixed length functions
- keep a history of edit actions very easily
- set the PPQ value of a file or song
- support for tempo and time signature changes
- multiple songs can be loaded and played back at the same time
- MIDI data can be shared or moved across songs, tracks and parts very easily
- import MusicXML files (in progress)


###### Audio
- volume and panning controller per track
- volume controller per song and one master volume output with compression
- channel effects per track: reverb, panning, autopan and more to come
- record audio directly in your browser
- save audio recordings as wav, mp3 or base64 file
- transpose audio (experimental)


###### Instruments
- support for multiple velocity layers
- support for control change events: sustain pedal, volume and panning
- sustained instruments (like organ, stings, pads)
- keyscaling for release and panning
- configurable release duration and envelope type
- support for .sfz format (up to a certain level)
- instrument samples can be transposed at runtime (experimental)
- 12 sample based instruments included for the sample player (570MB of samples)
- 1 simple sinewave synthesizer included as fallback instrument



More documentation can be found [here](http://abudaan.github.io/heartbeat/docs).
