var sequencer;
import { version } from './package.json';

function openModule() {

  'use strict';

  var
    protectedScope,
    initMethods = [],

    webaudioUnlocked = false,
    src,
    context,
    gainNode,
    compressor,
    sampleIndex = 0,
    compressorParams = ['threshold', 'knee', 'ratio', 'reduction', 'attack', 'release'],

    ua = navigator.userAgent,
    os,
    browser,
    legacy = false;

  if (ua.match(/(iPad|iPhone|iPod)/g)) {
    os = 'ios';
    // webaudioUnlocked = false;
  } else if (ua.indexOf('Android') !== -1) {
    os = 'android';
  } else if (ua.indexOf('Linux') !== -1) {
    os = 'linux';
  } else if (ua.indexOf('Macintosh') !== -1) {
    os = 'osx';
  } else if (ua.indexOf('Windows') !== -1) {
    os = 'windows';
  }

  if (ua.indexOf('Chrome') !== -1) {
    // chrome, chromium and canary
    browser = 'chrome';

    if (ua.indexOf('OPR') !== -1) {
      browser = 'opera';
    } else if (ua.indexOf('Chromium') !== -1) {
      browser = 'chromium';
    }
  } else if (ua.indexOf('Safari') !== -1) {
    browser = 'safari';
  } else if (ua.indexOf('Firefox') !== -1) {
    browser = 'firefox';
  } else if (ua.indexOf('Trident') !== -1) {
    browser = 'Internet Explorer';
  }

  if (os === 'ios') {
    if (ua.indexOf('CriOS') !== -1) {
      browser = 'chrome';
    }
  }

  // console.log(os, browser, '---', ua);

  if (window.AudioContext) {
    context = new window.AudioContext();
    if (typeof context.createGainNode !== 'function') {
      context.createGainNode = context.createGain;
    }
  } else if (window.webkitAudioContext) {
    context = new window.webkitAudioContext();
    if (typeof context.createGainNode !== 'function') {
      context.createGainNode = context.createGain;
    }
  } else {
    //alert('Your browser does not support AudioContext!\n\nPlease use one of these browsers:\n\n- Chromium (Linux | Windows)\n- Firefox (OSX | Windows)\n- Chrome (Linux | Android | OSX | Windows)\n- Canary (OSX | Windows)\n- Safari (iOS 6.0+ | OSX)\n\nIf you use Chrome or Chromium, heartbeat uses the WebMIDI api');
    throw new Error('The WebAudio API hasn\'t been implemented in ' + browser + ', please use any other browser');
  }

  compressor = context.createDynamicsCompressor();
  compressor.connect(context.destination);
  //console.log(compressor);
  gainNode = context.createGainNode();
  //gainNode.connect(compressor);
  gainNode.connect(context.destination);
  gainNode.gain.value = 1;


  protectedScope = {

    context: context,
    //destination: context.destination,
    masterGainNode: gainNode,
    masterCompressor: compressor,

    useDelta: false,

    timedTasks: {},
    scheduledTasks: {},
    repetitiveTasks: {},

    getSampleId: function () {
      return 'S' + sampleIndex++ + new Date().getTime();
    },

    addInitMethod: function (method) {
      initMethods.push(method);
    },

    callInitMethods: function () {
      var i, maxi = initMethods.length;
      for (i = 0; i < maxi; i++) {
        initMethods[i]();
      }
    }
  };


  /**
      @namespace sequencer
  */
  sequencer = {
    name: 'qambi',
    version: version,
    protectedScope: protectedScope,
    ui: {},
    ua: ua,
    os: os,
    browser: browser,
    legacy: false,
    midi: false,
    webmidi: false,
    webaudio: true,
    jazz: false,
    ogg: false,
    mp3: false,
    record_audio: navigator.getUserMedia !== undefined,
    bitrate_mp3_encoding: 128,
    util: {},
    debug: 0, // 0 = off, 1 = error, 2 = warn, 3 = info, 4 = log
    defaultInstrument: 'sinewave',
    pitch: 440,
    bufferTime: 350 / 1000, //seconds
    autoAdjustBufferTime: false,
    noteNameMode: 'sharp',
    minimalSongLength: 60000, //millis
    pauseOnBlur: false,
    restartOnFocus: true,
    defaultPPQ: 960,
    overrulePPQ: true,
    precision: 3, // means float with precision 3, e.g. 10.437

    midiInputs: {},
    midiOutputs: {},

    storage: {
      midi: {
        id: 'midi'
      },
      audio: {
        id: 'audio',
        recordings: {}
      },
      instruments: {
        id: 'instruments'
      },
      samplepacks: {
        id: 'samplepacks'
      },
      assetpacks: {
        id: 'assetpacks'
      }
    },

    getAudioContext: function () {
      return context;
    },

    getTime: function () {
      return context.currentTime;
      // return performance.now() / 1000;
    },

    getTimeDiff: function () {
      var contextTime = context.currentTime * 1000;
      return performance.now() - contextTime;
    },

    setMasterVolume: function (value) {
      value = value < 0 ? 0 : value > 1 ? 1 : value;
      gainNode.gain.value = value;
    },

    getMasterVolume: function () {
      return gainNode.gain.value;
    },

    getCompressionReduction: function () {
      //console.log(compressor);
      return compressor.reduction.value;
    },

    enableMasterCompressor: function (flag) {
      if (flag) {
        gainNode.disconnect(0);
        gainNode.connect(compressor);
        compressor.disconnect(0);
        compressor.connect(context.destination);
      } else {
        compressor.disconnect(0);
        gainNode.disconnect(0);
        gainNode.connect(context.destination);
      }
    },

    configureMasterCompressor: function (cfg) {
      /*
          readonly attribute AudioParam threshold; // in Decibels
          readonly attribute AudioParam knee; // in Decibels
          readonly attribute AudioParam ratio; // unit-less
          readonly attribute AudioParam reduction; // in Decibels
          readonly attribute AudioParam attack; // in Seconds
          readonly attribute AudioParam release; // in Seconds
      */
      var i, param;
      for (i = compressorParams.length; i >= 0; i--) {
        param = compressorParams[i];
        if (cfg[param] !== undefined) {
          compressor[param].value = cfg[param];
        }
      }
    },

    unlockWebAudio: function () {
      // console.log('unlock webaudio');
      if (webaudioUnlocked === true) {
        // console.log('already unlocked');
        return;
      }
      if (typeof context.resume === 'function') {
        context.resume();
      }
      var src = context.createOscillator(),
        gainNode = context.createGainNode();
      gainNode.gain.value = 0;
      src.connect(gainNode);
      gainNode.connect(context.destination);
      if (src.noteOn !== undefined) {
        src.start = src.noteOn;
        src.stop = src.noteOff;
      }
      src.start(0);
      src.stop(0.001);
      webaudioUnlocked = true;
    }


  };

  // debug levels
  Object.defineProperty(sequencer, 'ERROR', { value: 1 });
  Object.defineProperty(sequencer, 'WARN', { value: 2 });
  Object.defineProperty(sequencer, 'INFO', { value: 3 });
  Object.defineProperty(sequencer, 'LOG', { value: 4 });

}
