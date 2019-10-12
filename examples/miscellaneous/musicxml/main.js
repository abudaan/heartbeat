import sequencer from 'heartbeat-sequencer';
import 'jzz';

window.onload = async () => {
  await sequencer.ready();

  const btnStop = document.getElementById('stop');
  const btnStart = document.getElementById('start');

  // disable ui until all data is loaded
  enableUI(false);

  // add asset pack, this pack contains a piano
  sequencer.addAssetPack({ url: '/heartbeat/assets/examples/asset_pack_basic.json' }, () => {

    //sequencer.loadMusicXML('/heartbeat/assets/simple_musicxml_test.xml', song => {
    //sequencer.loadMusicXML('/heartbeat/assets/mozk545a.xml', song => {
    sequencer.loadMusicXML('/heartbeat/assets/reunion.xml', song => {
      //console.log(song);
      song.tracks.forEach(track => {
        track.setInstrument('piano');
      });

      btnStart.addEventListener('click', () => {
        song.play();
      });

      btnStop.addEventListener('click', () => {
        song.stop();
      });

      enableUI(true);
    });
  });
};

const enableUI = (flag) => {
  const elements = document.querySelectorAll('input');
  const maxi = elements.length;

  for (let i = 0; i < maxi; i++) {
    const element = elements[i];
    element.disabled = !flag;
  }
};