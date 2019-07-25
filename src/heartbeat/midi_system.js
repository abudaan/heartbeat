function midiSystem() {

  'use strict';

  var
    context, // defined in open_module.js
    typeString, // defined in util.js
    objectForEach, // defined in util.js
    createMidiNote, // defined in midi_note.js
    createMidiEvent, // defined in midi_event.js

    slice = Array.prototype.slice,

    songMidiEventListener,

    midiAccess,
    midiInputsOrder,
    midiOutputsOrder,
    midiInitialized = false,
    midiEventListenerId = 0;


  function initMidi(cb) {

    // console.log(midiInitialized, navigator.requestMIDIAccess);

    if (midiInitialized === true) {
      cb();
      return;
    }

    midiInitialized = true;

    if (navigator.requestMIDIAccess !== undefined) {
      navigator.requestMIDIAccess().then(
        // on success
        function midiAccessOnSuccess(midi) {
          if (midi._jazzInstances !== undefined) {
            sequencer.jazz = midi._jazzInstances[0]._Jazz.version;
            sequencer.midi = true;
          } else {
            sequencer.webmidi = true;
            sequencer.midi = true;
          }
          midiAccess = midi;
          midiAccess.onstatechange = getDevices;
          if (!midiAccess.inputs || !midiAccess.outputs) {
            // Firefox WebMIDI API support is still in progress
            cb();
          } else {
            getDevices();
            //console.log(midi, sequencer.midi, sequencer.webmidi, sequencer.jazz);    
            cb();
          }
        },
        // on error
        function midiAccessOnError(e) {
          console.log('MIDI could not be initialized:', e);
          cb();
        }
      );
      // browsers without WebMIDI API
    } else {
      if (sequencer.browser === 'chrome') {
        console.log('Web MIDI API not enabled');
      } else {
        console.log('Web MIDI API not supported');
      }
      cb();
    }
  }


  function getDevices(e) {
    //console.log('getDevices', e);
    var inputs, outputs;
    midiInputsOrder = [];
    midiOutputsOrder = [];

    inputs = midiAccess.inputs;

    inputs.forEach(function (input) {
      midiInputsOrder.push({ name: input.name, id: input.id });
      sequencer.midiInputs[input.id] = input;
    });

    midiInputsOrder.sort(function (a, b) {
      var nameA = a.name.toLowerCase(),
        nameB = b.name.toLowerCase();
      if (nameA < nameB) { //sort string ascending
        return -1;
      } else if (nameA > nameB) {
        return 1;
      }
      return 0; //default return value (no sorting)
    });

    sequencer.numMidiInputs = midiInputsOrder.length;


    outputs = midiAccess.outputs;

    outputs.forEach(function (output) {
      midiOutputsOrder.push({ name: output.name, id: output.id });
      sequencer.midiOutputs[output.id] = output;
    });


    midiOutputsOrder.sort(function (a, b) {
      var nameA = a.name.toLowerCase(),
        nameB = b.name.toLowerCase();
      if (nameA < nameB) { //sort string ascending
        return -1;
      } else if (nameA > nameB) {
        return 1;
      }
      return 0; //default return value (no sorting)
    });

    sequencer.numMidiOutputs = midiOutputsOrder.length;
  }


  function initMidiSong(song) {
    songMidiEventListener = function (e) {
      //console.log(e);
      handleMidiMessageSong(e, song, this);
    };

    // by default a song listens to all available midi-in ports
    objectForEach(sequencer.midiInputs, function (port) {
      //port.addEventListener('midimessage', songMidiEventListener, false);
      port.onmidimessage = songMidiEventListener;
      song.midiInputs[port.id] = port;
      //console.log(port);
    });
    //console.log(sequencer.midiInputs);

    objectForEach(sequencer.midiOutputs, function (port) {
      song.midiOutputs[port.id] = port;
    });

    song.numMidiInputs = sequencer.numMidiInputs;
    song.numMidiOutputs = sequencer.numMidiOutputs;
  }


  function setMidiInputSong(id, flag, song) {
    var input = sequencer.midiInputs[id],
      tracks = song.tracks,
      maxi = song.numTracks - 1,
      i, track;

    flag = flag === undefined ? true : flag;

    if (input === undefined) {
      if (sequencer.debug === true) {
        console.log('no midi input with id', id, 'found');
      }
      return;
    }

    if (flag === false) {
      delete song.midiInputs[id];
      //input.removeEventListener('midimessage', songMidiEventListener, false);
      input.onmidimessage = null;
      song.numMidiInputs--;
    } else if (input !== undefined) {
      song.midiInputs[id] = input;
      //input.addEventListener('midimessage', songMidiEventListener, false);
      input.onmidimessage = songMidiEventListener;
      song.numMidiInputs++;
    }

    for (i = maxi; i >= 0; i--) {
      track = tracks[i];
      track.setMidiInput(id, flag);
      // if(flag === false){
      //     delete track.midiInputs[id];
      // }
    }
  }

  function setMidiOutputSong(id, flag, song) {
    var output = sequencer.midiOutputs[id],
      tracks = song.tracks,
      maxi = song.numTracks - 1,
      i, track, time;

    flag = flag === undefined ? true : flag;

    if (output === undefined) {
      if (sequencer.debug === true) {
        console.log('no midi output with id', id, 'found');
      }
      return;
    }

    if (flag === false) {
      delete song.midiOutputs[id];
      song.numMidiOutputs--;
      time = song.scheduler.lastEventTime + 100;
      output.send([0xB0, 0x7B, 0x00], time); // stop all notes
      output.send([0xB0, 0x79, 0x00], time); // reset all controllers
    } else if (output !== undefined) {
      song.midiOutputs[id] = output;
      song.numMidiOutputs++;
    }

    for (i = maxi; i >= 0; i--) {
      track = tracks[i];
      track.setMidiOutput(id, flag);
      // if(flag === false){
      //     delete track.midiOutputs[id];
      // }
    }
  }

  function handleMidiMessageSong(midiMessageEvent, song, input) {
    var data = midiMessageEvent.data,
      i, track,
      tracks = song.tracks,
      numTracks = song.numTracks,
      midiEvent,
      listeners;

    //console.log(midiMessageEvent.data);
    midiEvent = createMidiEvent(song.ticks, data[0], data[1], data[2]);

    for (i = 0; i < numTracks; i++) {
      track = tracks[i];
      //console.log(track.midiInputs, input);
      /*
      if(midiEvent.channel === track.channel || track.channel === 0 || track.channel === 'any'){
          handleMidiMessageTrack(midiEvent, track);
      }
      */
      // like in Cubase, midi events from all devices, sent on any midi channel are forwarded to all tracks
      // set track.monitor to false if you don't want to receive midi events on a certain track
      // note that track.monitor is by default set to false and that track.monitor is automatically set to true
      // if you are recording on that track
      // console.log(track.monitor, track.id, input.id);
      if (track.monitor === true && track.midiInputs[input.id] !== undefined) {
        handleMidiMessageTrack(midiEvent, track, input);
      }
    }

    listeners = song.midiEventListeners[midiEvent.type];
    if (listeners === undefined) {
      return;
    }

    objectForEach(listeners, function (listener) {
      listener(midiEvent, input);
    });
  }


  //function handleMidiMessageTrack(midiMessageEvent, track, input){
  function handleMidiMessageTrack(midiEvent, track, input) {
    var song = track.song,
      note, listeners, channel;
    //data = midiMessageEvent.data,
    //midiEvent = createMidiEvent(song.ticks, data[0], data[1], data[2]);

    //midiEvent.source = midiMessageEvent.srcElement.name;
    //console.log(midiMessageEvent)
    //console.log('---->', midiEvent.type);

    // add the exact time of this event so we can calculate its ticks position
    midiEvent.recordMillis = context.currentTime * 1000; // millis
    midiEvent.state = 'recorded';

    if (midiEvent.type === 144) {
      note = createMidiNote(midiEvent);
      track.recordingNotes[midiEvent.data1] = note;
      //track.song.recordingNotes[note.id] = note;
    } else if (midiEvent.type === 128) {
      note = track.recordingNotes[midiEvent.data1];
      // check if the note exists: if the user plays notes on her keyboard before the midi system has
      // been fully initialized, it can happen that the first incoming midi event is a NOTE OFF event
      if (note === undefined) {
        return;
      }
      note.addNoteOff(midiEvent);
      delete track.recordingNotes[midiEvent.data1];
      //delete track.song.recordingNotes[note.id];
    }

    //console.log(song.preroll, song.recording, track.recordEnabled);

    if ((song.prerolling || song.recording) && track.recordEnabled === 'midi') {
      if (midiEvent.type === 144) {
        track.song.recordedNotes.push(note);
      }
      track.recordPart.addEvent(midiEvent);
      // song.recordedEvents is used in the key editor
      track.song.recordedEvents.push(midiEvent);
    } else if (track.enableRetrospectiveRecording) {
      track.retrospectiveRecording.push(midiEvent);
    }

    // call all midi event listeners
    listeners = track.midiEventListeners[midiEvent.type];
    if (listeners !== undefined) {
      objectForEach(listeners, function (listener) {
        listener(midiEvent, input);
      });
    }

    channel = track.channel;
    if (channel === 'any' || channel === undefined || isNaN(channel) === true) {
      channel = 0;
    }

    objectForEach(track.midiOutputs, function (output) {
      //console.log('midi out', output, midiEvent.type);
      if (midiEvent.type === 128 || midiEvent.type === 144 || midiEvent.type === 176) {
        //console.log(midiEvent.type, midiEvent.data1, midiEvent.data2);
        output.send([midiEvent.type, midiEvent.data1, midiEvent.data2]);
        // }else if(midiEvent.type === 192){
        //     output.send([midiEvent.type + channel, midiEvent.data1]);
      }
      //output.send([midiEvent.status + channel, midiEvent.data1, midiEvent.data2]);
    });

    // @TODO: maybe a track should be able to send its event to both a midi-out port and an internal heartbeat song?
    //console.log(track.routeToMidiOut);
    if (track.routeToMidiOut === false) {
      midiEvent.track = track;
      track.instrument.processEvent(midiEvent);
    }
  }


  function addMidiEventListener(args, obj) { // obj can be a track or a song
    args = slice.call(args);

    var id = midiEventListenerId++,
      types = {},
      ids = [],
      listener,
      loop;


    // should I inline this?
    loop = function (args, i, maxi) {
      for (i = 0; i < maxi; i++) {
        var arg = args[i],
          type = typeString(arg);
        //console.log(type);
        if (type === 'array') {
          loop(arg, 0, arg.length);
        } else if (type === 'function') {
          listener = arg;
        } else if (isNaN(arg) === false) {
          arg = parseInt(arg, 10);
          if (sequencer.checkEventType(arg) !== false) {
            types[arg] = arg;
          }
        } else if (type === 'string') {
          if (sequencer.checkEventType(arg) !== false) {
            arg = sequencer.midiEventNumberByName(arg);
            types[arg] = arg;
          }
        }
      }
    };

    loop(args, 0, args.length);
    //console.log('types', types, 'listener', listener);

    objectForEach(types, function (type) {
      //console.log(type);
      if (obj.midiEventListeners[type] === undefined) {
        obj.midiEventListeners[type] = {};
      }
      obj.midiEventListeners[type][id] = listener;
      ids.push(type + '_' + id);
    });

    //console.log(obj.midiEventListeners);
    return ids.length === 1 ? ids[0] : ids;
  }


  function removeMidiEventListener(id, obj) {
    var type;
    id = id.split('_');
    type = id[0];
    id = id[1];
    delete obj.midiEventListeners[type][id];
  }


  function removeMidiEventListeners() {

  }


  function getMidiPortsAsDropdown(config, obj) {
    var select = document.createElement('select'),
      option, ports,
      type = config.type,
      id = config.id || type,
      div = config.div,
      firstOption = config.firstOption;

    if (type !== 'input' && type !== 'output') {
      console.log('please set type to "input" or "output"');
      return;
    }

    if (firstOption === undefined) {
      firstOption = type === 'input' ? 'choose MIDI in' : 'choose MIDI out';
    }

    select.id = id;
    ports = type === 'input' ? obj.midiInputs : obj.midiOutputs;

    if (firstOption !== false) {
      option = document.createElement('option');
      option.value = -1;
      option.innerHTML = firstOption;
      select.appendChild(option);
    }

    objectForEach(ports, function (port) {
      option = document.createElement('option');
      option.value = port.id;
      option.innerHTML = port.name;
      select.appendChild(option);
    });

    if (div) {
      div.appendChild(select);
    }
    return select;
  }


  sequencer.getMidiPortsAsDropdown = function () {
    getMidiPortsAsDropdown(sequencer);
  };


  sequencer.getMidiInputsAsDropdown = function (config) {
    config = config || {
      type: 'input'
    };
    return getMidiPortsAsDropdown(config, sequencer);
  };


  sequencer.getMidiOutputsAsDropdown = function (config) {
    config = config || {
      type: 'output'
    };
    return getMidiPortsAsDropdown(config, sequencer);
  };


  function getMidiInputs(cb, obj) {
    var i, maxi;
    if (obj === sequencer) {
      for (i = 0, maxi = midiInputsOrder.length; i < maxi; i++) {
        cb(obj.midiInputs[midiInputsOrder[i].id], i);
      }
    } else {
      objectForEach(obj.midiInputs, function (port) {
        cb(port, i);
      });
    }
  }


  function getMidiOutputs(cb, obj) {
    var i, maxi;
    if (obj === sequencer) {
      for (i = 0, maxi = midiOutputsOrder.length; i < maxi; i++) {
        cb(obj.midiOutputs[midiOutputsOrder[i].id], i);
      }
    } else {
      objectForEach(obj.midiOutputs, function (port, i) {
        cb(port, i);
      });
    }
  }


  sequencer.getMidiInputs = function (cb) {
    getMidiInputs(cb, sequencer);
  };


  sequencer.getMidiOutputs = function (cb) {
    getMidiOutputs(cb, sequencer);
  };


  sequencer.protectedScope.addInitMethod(function () {
    context = sequencer.protectedScope.context;
    createMidiNote = sequencer.createMidiNote;
    createMidiEvent = sequencer.createMidiEvent;
    typeString = sequencer.protectedScope.typeString;
    objectForEach = sequencer.protectedScope.objectForEach;
  });


  // close_module.js
  sequencer.protectedScope.initMidi = initMidi;

  // song.js
  sequencer.protectedScope.initMidiSong = initMidiSong;
  sequencer.protectedScope.getMidiInputs = getMidiInputs;
  sequencer.protectedScope.getMidiOutputs = getMidiOutputs;
  sequencer.protectedScope.setMidiInputSong = setMidiInputSong;
  sequencer.protectedScope.setMidiOutputSong = setMidiOutputSong;
  sequencer.protectedScope.addMidiEventListener = addMidiEventListener;
  sequencer.protectedScope.getMidiPortsAsDropdown = getMidiPortsAsDropdown;
  sequencer.protectedScope.removeMidiEventListener = removeMidiEventListener;
  sequencer.protectedScope.removeMidiEventListeners = removeMidiEventListeners;
  sequencer.protectedScope.handleMidiMessageTrack = handleMidiMessageTrack;

}




/*
    function handleMidiMessageTrack(e, track){
        var data = e.data,
            midiEvent,
            song = track.song,
            note, listeners;

        //console.log(track.recordPart);
        if(song){
            midiEvent = sequencer.createMidiEvent(song.ticks, data[0], data[1], data[2]);
            //console.log(midiEvent);
            if(midiEvent.type === 144){
                note = createMidiNote(midiEvent);
                track.recordingNotes[midiEvent.data1] = note;
                //track.song.recordingNotes[note.id] = note;
            }else if(midiEvent.type === 128){
                note = track.recordingNotes[midiEvent.data1];
                note.addNoteOff(midiEvent);
                delete track.recordingNotes[midiEvent.data1];
                //delete track.song.recordingNotes[note.id];
            }
            if(song.recording && song.playing && track.recordEnabled){
                if(midiEvent.type === 144){
                    track.song.recordedNotes.push(note);
                }
                track.recordPart.addEvent(midiEvent);
                track.song.recordedEvents.push(midiEvent);
            }else if(track.enableRetrospectiveRecording){
                track.retrospectiveRecording.push(midiEvent);
            }

            // call all midi event listeners
            listeners = track.midiEventListeners[midiEvent.type];
            if(listeners !== undefined){
                objectForEach(listeners, function(listener, id){
                    listener(midiEvent);
                });
            }
        }else{
            console.error('unexpected situation!');
            // does this ever happen?
            midiEvent = sequencer.createMidiEvent(0, data[0], data[1], data[2]);
            midiEvent.millis = song.recordTimestamp - sequencer.getTime();
            if(track.enableRetrospectiveRecording){
                track.retrospectiveRecording.push(midiEvent);
            }
            //@TODO: add parser for retrospective recording: convert millis to ticks
        }

        if(track.midiOutput !== undefined){
            track.midiOutput.send([data[0], data[1], data[2]]);
        }else{
            midiEvent.track = track;
            track.instrument.processEvent(midiEvent);
        }
    }
*/