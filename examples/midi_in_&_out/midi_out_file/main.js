/*
  Note that for using midi out you need to configure virtual midi port on your system, see:

  http://abumarkub.net/abublog/?page_id=399#midi-out
*/

import sequencer from 'heartbeat-sequencer';
import 'jzz';

window.onload = async () => {
  await sequencer.ready();
  // relative path to assets
  const path = '../../../assets/';
  enableUI(false);

  /*
    load asset pack, this asset pack contains:
    - sample pack with name 'piano' -> will be stored in sequencer/storage/audio/instruments/piano
    - sample pack with name 'VS8F' -> will be stored in sequencer/storage/audio/ir/VS8F
    - instrument with name 'piano' -> will be stored in sequencer/instruments/piano
    - midifile with name 'Sonata Facile' -> will be stored in sequencer/midi/classical/Sonata Facile

    after the loading has completed, the init method is called
  */

  sequencer.addAssetPack({ url: path + '/examples/asset_pack_basic.json' }, init);
};

const enableUI = (flag) => {
  const elements = document.querySelectorAll('input, select');
  const maxi = elements.length;

  for (let i = 0; i < maxi; i++) {
    const element = elements[i];
    element.disabled = !flag;
  }
}

const init = () => {
  const btnStop = document.getElementById('stop');
  const btnStart = document.getElementById('start');
  const form = document.getElementById('form');
  // get the midi file from sequencer.storage
  const midiFile = sequencer.getMidiFile('Sonata Facile');
  midiFile.useMetronome = true;
  const song = sequencer.createSong(midiFile);

  if (sequencer.midi === false) {
    form.innerHTML = '<div>No MIDI I/O<div>';
    return;
  }

  // replace the loading message
  form.innerHTML = '<div>Route the events of the tracks of the song to one (or more) midi output(s) by selecting the checkbox:<div>';

  // get all midi outputs from this song
  song.getMidiOutputs(function (port) {
    const checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('value', port.id);
    checkbox.id = port.id;

    const label = document.createElement('label');
    label.setAttribute('for', port.id);
    form.appendChild(label);
    label.appendChild(checkbox);
    label.innerHTML += port.name;

    document.getElementById(checkbox.id).addEventListener('click', function (e) {
      song.tracks.forEach(function (track) {
        track.setMidiOutput(e.target.value, e.target.checked);
        // track.setVolume(0);
        track.audioLatency = 100;
      });
    }, false);
  });


  song.setLeftLocator('barsbeats', 2, 1, 0, 0);
  song.setRightLocator('barsbeats', 4, 1, 0, 0);
  //song.loop = true;

  btnStart.addEventListener('click', function (e) {
    song.play();
  });

  btnStop.addEventListener('click', function (e) {
    song.stop();
  });

  enableUI(true);
}
