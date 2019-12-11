window.onload = function () {

  'use strict';

  var
    // satisfy jslint
    sequencer = window.sequencer,
    console = window.console,
    btnMonitor = document.getElementById('monitor'),
    pMessage = document.getElementById('message'),

    // relative path to assets
    path = '../../../assets',
    url;



  sequencer.ready(function () {
    // as soon as the sequencer is ready we know if the browser supports ogg and/or mp3
    //url = sequencer.ogg === true ? path + '/sso/strings/violin.ogg.4.json' : path + '/sso/strings/violin.mp3.128.json';

    // load asset pack; this pack contains a violin
    //sequencer.addAssetPack({url: url}, init);
    // load a piano
    // sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);
    sequencer.addAssetPack({ url: path + '/instruments/output/mono-mp3-128/Solfege-Katy.json' }, init);

    function init() {
      var track, song;

      track = sequencer.createTrack();
      //track.setInstrument('Violin');
      track.setInstrument('Solfege-Katy');
      // set monitor to true to route the incoming midi events to the track
      track.monitor = true;
      track.setMidiInput('all');

      song = sequencer.createSong({
        tracks: track
      });

      // use button to toggle monitor on and off
      btnMonitor.addEventListener('click', function () {
        if (track.monitor === true) {
          btnMonitor.value = 'monitor on';
          track.monitor = false;
        } else {
          btnMonitor.value = 'monitor off';
          track.monitor = true;
        }
      }, false);

      if (sequencer.midi === false) {
        pMessage.innerHTML = 'No MIDI I/O';
      } else {
        pMessage.innerHTML = 'Play some note on your midi keyboard';
      }
    }
  });
};