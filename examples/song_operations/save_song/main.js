import sequencer from 'heartbeat-sequencer';
import 'jzz';

window.onload = async () => {
  await sequencer.ready();
  sequencer.addMidiFile({ url: '/heartbeat/assets/midi/minute_waltz.mid' }, init);
};

const init = () => {
  const song = sequencer.createSong(sequencer.getMidiFile('minute_waltz'));

  const btnStart = document.getElementById('start');
  btnStart.addEventListener('click', () => {
    song.play();
  });

  const btnStop = document.getElementById('stop');
  btnStop.addEventListener('click', () => {
    song.stop();
  });

  const btnSave = document.getElementById('save');
  btnSave.addEventListener('click', () => {
    sequencer.saveSongAsMidiFile(song);
  });
}