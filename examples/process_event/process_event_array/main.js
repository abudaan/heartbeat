import sequencer from 'heartbeat-sequencer';
import 'jzz';

window.onload = async () => {
  const btnStop = document.getElementById('stop');
  const btnStart = document.getElementById('start');
  const bpm = 240;

  await sequencer.ready();

  const events = sequencer.util.getRandomNotes({
    minNoteNumber: 60,
    maxNoteNumber: 100,
    minVelocity: 30,
    maxVelocity: 80,
    noteDuration: 120, //ticks
    numNotes: 30
  });

  btnStart.addEventListener('click', () => {
    sequencer.processEvents(events, bpm);
  });

  btnStop.addEventListener('click', () => {
    sequencer.stopProcessEvents();
  });
};