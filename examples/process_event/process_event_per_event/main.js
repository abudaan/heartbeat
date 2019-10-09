import sequencer from 'heartbeat-sequencer';
import 'jzz';

const bpm = 240;
const noteDuration = 120; // ticks
const numEvents = 100;

window.onload = async () => {
  await sequencer.ready();

  const btnStart = document.getElementById('start');
  btnStart.addEventListener('click', function () {
    createEvents(numEvents, noteDuration, bpm);
  });

  const btnStop = document.getElementById('stop');
  btnStop.addEventListener('click', function () {
    sequencer.stopProcessEvents();
  });

  const getRandom = (min, max, round) => {
    const r = Math.random() * (max - min) + min;
    if (round === true) {
      return Math.round(r);
    } else {
      return r;
    }
  }

  const createEvents = (numEvents, noteDuration, bpm) => {
    let ticks = 0;

    for (let i = 0; i < numEvents; i++) {
      noteNumber = getRandom(50, 100, true);
      velocity = getRandom(30, 80, true);

      midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
      sequencer.processEvents(midiEvent, bpm);
      ticks += noteDuration;

      midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
      sequencer.processEvents(midiEvent, bpm);
      ticks += noteDuration;
    }
  }
};