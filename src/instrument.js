function instrument() {

  'use strict';

  var
    debug = sequencer.debug,

    //import
    context, // → defined in open_module.js
    storage, // → defined in open_module.js
    timedTasks, // → defined in open_module.js
    repetitiveTasks, // → defined in open_module.js
    findItem, // → defined in utils.js
    storeItem, // → defined in utils.js
    typeString, // → defined in utils.js
    pathToArray, // → defined in utils.js
    //createClass, // → defined in utils.js
    isEmptyObject, // → defined in utils.js
    objectForEach, // → defined in utils.js
    createSample, // → defined in sample.js
    createReverb, // → defined in effects.js
    dispatchEvent, // → defined in song.js
    remap, // defined in util.js
    round, // defined in util.js
    getEqualPowerCurve, // defined in util.js
    transpose, // defined in transpose.js

    Instrument,
    SimpleSynth;


  function unscheduleCallback(sample) {
    //console.log(sample.id, 'has been unscheduled');
    sample = null;
  }


  Instrument = function (config) {
    //console.log(config);
    this.className = 'Instrument';
    this.config = config;
    this.scheduledEvents = {};
    this.scheduledSamples = {};
    this.sustainPedalDown = false;
    this.sustainPedalSamples = {};
    this.sampleDataByNoteNumber = {};
    this.sampleData = [];

    this.info = config.info || config.instrument_info;
    this.author = config.author || config.instrument_author;
    this.license = config.license || config.instrument_license;
    this.pack = config.pack;

    this.parse();
  };


  // called by asset manager when a sample pack or an instrument has been unloaded, see asset_manager.js
  Instrument.prototype.reset = function () {
    var instrument = sequencer.getInstrument(this.config.localPath),
      samplepack = sequencer.getSamplePack(this.config.sample_path);

    if (samplepack === false || instrument === false) {
      this.scheduledEvents = {};
      this.scheduledSamples = {};
      this.sustainPedalSamples = {};
      this.sampleDataByNoteNumber = {};
      this.sampleData = [];
      if (this.update) {
        delete repetitiveTasks[this.updateTaskId];
      }
      // if the instrument has been unloaded, set the track to the default instrument
      if (instrument === false) {
        this.track.setInstrument();
      }
    }
  };


  Instrument.prototype.parse = function () {
    var i, maxi, v, v1, v2, length, octave, note, noteName, noteNumber,
      pathArray,
      buffer, names,
      id, data, subdata,
      update,
      sample,
      sampleConfig,
      samplePack,
      audioFolder,
      config = this.config,
      noteNameMode = config.notename_mode === undefined ? sequencer.noteNameMode : config.notename_mode,
      mapping = config.mapping,
      me = this;

    if (config.name === undefined) {
      console.error('instruments must have a name', config);
      return false;
    }

    if (mapping === undefined) {
      console.error('instruments must have a mapping to samples', config);
      return false;
    }

    this.name = config.name;
    this.folder = config.folder || '';
    this.autopan = config.autopan || false; // for simple synth
    this.singlePitch = config.single_pitch || false;
    this.samplePath = config.sample_path || this.name;
    this.keyScalingRelease = config.keyscaling_release;
    this.keyScalingPanning = config.keyscaling_panning;
    this.keyRange = config.keyrange || config.key_range;
    //console.log(this.keyRange, config);
    pathArray = this.samplePath.split('/');

    //console.log(this.keyScalingRelease, config);

    samplePack = storage.samplepacks;
    for (i = 0, maxi = pathArray.length; i < maxi; i++) {
      if (samplePack === undefined) {
        if (sequencer.debug) {
          console.log('sample pack not found', pathArray.join('/'));
        }
        return;
      }
      samplePack = samplePack[pathArray[i]];
    }
    //console.log(samplePack.name);

    audioFolder = storage.audio;
    try {
      for (i = 0, maxi = pathArray.length; i < maxi; i++) {
        audioFolder = audioFolder[pathArray[i]];
      }
    } catch (e) {
      if (sequencer.debug) {
        console.log('sample pack "' + pathArray[i] + '" is not loaded');
      }
      //sampleConfig = false;
      return;
    }

    if (audioFolder === undefined) {
      if (sequencer.debug) {
        console.log('sample pack not found', pathArray.join('/'));
      }
      //sampleConfig = false;
      return;
    }


    if (typeString(mapping) === 'array') {
      this.keyRange = mapping;
      mapping = {};
      for (i = this.keyRange[0]; i <= this.keyRange[1]; i++) {
        mapping[i] = '';
      }
    }

    if (this.keyRange === undefined) {
      this.lowestNote = 128;
      this.highestNote = -1;
    } else {
      this.lowestNote = this.keyRange[0];
      this.highestNote = this.keyRange[1];
      this.numNotes = this.highestNote - this.lowestNote;
    }


    if (config.release_duration !== undefined) {
      this.releaseDuration = config.release_duration;
    } else {
      this.releaseDuration = 0;
    }

    this.releaseEnvelope = config.release_envelope || 'equal power';


    if (this.autopan) {
      this.autoPanner = createAutoPanner();
    }

    this.samplepack = samplePack;
    //console.log(samplePack);

    for (id in mapping) {
      if (mapping.hasOwnProperty(id)) {
        data = mapping[id];

        if (isNaN(id)) {
          // C3, D#5, Bb0, etc.
          length = id.length;
          octave = id.substring(length - 1);
          note = id.substring(0, length - 1);
          noteName = id;
          noteNumber = sequencer.getNoteNumber(note, octave);
        } else {
          noteName = sequencer.getNoteNameFromNoteNumber(id, noteNameMode);
          noteName = noteName.join('');
          noteNumber = id;
        }
        //console.log(id, noteNameMode);

        noteNumber = parseInt(noteNumber, 10);

        if (this.keyRange === undefined) {
          this.lowestNote = noteNumber < this.lowestNote ? noteNumber : this.lowestNote;
          this.highestNote = noteNumber > this.highestNote ? noteNumber : this.highestNote;
        }

        //console.log(data,typeString(data));

        if (typeString(data) === 'array') {
          // multi-layered
          this.multiLayered = true;
          for (i = 0, maxi = data.length; i < maxi; i++) {
            subdata = data[i];
            parseSampleData(subdata);
            if (this.sampleDataByNoteNumber[noteNumber] === undefined) {
              this.sampleDataByNoteNumber[noteNumber] = [];
            }
            // store the same sample config for every step in this velocity range
            v1 = subdata.v[0];
            v2 = subdata.v[1];
            for (v = v1; v <= v2; v++) {
              this.sampleDataByNoteNumber[noteNumber][v] = sampleConfig;
            }
            this.sampleData.push(sampleConfig);
          }
        } else {
          // single-layered
          parseSampleData(data);
          //console.log('--->', sampleConfig);
          this.sampleDataByNoteNumber[noteNumber] = sampleConfig;
          this.sampleData.push(sampleConfig);
        }
      }
    }

    if (this.keyRange === undefined) {
      //console.log(this.highestNote, this.lowestNote);
      this.numNotes = this.highestNote - this.lowestNote;
      this.keyRange = [this.lowestNote, this.highestNote];
    }


    // if a key range is set for the instrument, the mapping object is generated by parseSampleData() so we need to add
    // the mapping object to the config to make it available for unloading
    this.config.mapping = mapping;

    if (this.singlePitch) {
      // TODO: fix this for multi-layered instruments (low prio)
      for (i = 127; i >= 0; i--) {
        this.sampleData[i] = sampleConfig;
        this.sampleDataByNoteNumber[i] = sampleConfig;
      }
    }

    if (update) {
      this.updateTaskId = 'update_' + this.name + '_' + new Date().getTime();
      //console.log('start update', this.name);
      repetitiveTasks[this.updateTaskId] = function () {
        //console.log('update');
        if (me.autopan) {
          me.update(this.autoPanner.getValue());
        } else {
          me.update();
        }
      };
    }

    // inner function of Instrument.parse();
    function parseSampleData(data) {
      var tmp, n;
      //console.log('find', this.samplePath + '/' + data.n);
      //buffer = findItem(this.samplePath + '/' + data.n, storage.audio);
      //console.log(data);

      if (data.n) {
        // get the buffer by an id
        buffer = audioFolder[data.n];
        //console.log(data.n, buffer);
      } else {
        // get the buffer by a note number or note name if a keyrange is specified
        names = [noteNumber, noteName, noteName.toLowerCase()];
        for (n = 2; n >= 0; n--) {
          buffer = audioFolder[names[n]];
          if (buffer !== undefined) {
            mapping[id] = { n: names[n] };
            break;
          }
        }
      }

      if (buffer === undefined) {
        if (sequencer.debug) {
          console.log('no buffer found for ' + id + ' (' + me.name + ')');
        }
        sampleConfig = false;
        return;
      }

      sampleConfig = {
        noteNumber: noteNumber,
        buffer: buffer,
        bufferId: data.n,
        autopan: me.autopan
      };

      // sample pack sustain
      if (config.sustain === true) {
        sampleConfig.sustain = true;
        update = true;
      }

      // sustain
      if (data.s !== undefined) {
        sampleConfig.sustain_start = data.s[0];
        sampleConfig.sustain_end = data.s[1];
        sampleConfig.sustain = true;
        update = true;
      } else if (config.sustain === true) {
        tmp = samplePack.samplesById[data.n].sustain;
        if (tmp !== undefined) {
          sampleConfig.sustain_start = tmp[0];
          sampleConfig.sustain_end = tmp[1];
          //sampleConfig.sustain = true;
          //console.log(tmp, update, sampleConfig.sustain);
        } else {
          sampleConfig.sustain = false;
        }
        //console.log(data.n, samplePack.samplesById[data.n]);
      }

      // global release
      if (config.release_duration !== undefined) {
        sampleConfig.release_duration = config.release_duration;
        sampleConfig.release_envelope = config.release_envelope || me.releaseEnvelope;
        sampleConfig.release = true;
        update = true;
      }

      // release duration and envelope per sample overrules global release duration and envelope
      if (data.r !== undefined) {
        if (typeString(data.r) === 'array') {
          sampleConfig.release_duration = data.r[0];
          sampleConfig.release_envelope = data.r[1] || me.releaseEnvelope;
        } else if (!isNaN(data.r)) {
          sampleConfig.release_duration = data.r;
          sampleConfig.release_envelope = me.releaseEnvelope;
        }
        sampleConfig.release = true;
        update = true;
        //console.log(data.r, sampleConfig.release_duration, sampleConfig.release_envelope)
      }

      // panning
      if (data.p !== undefined) {
        sampleConfig.panPosition = data.p;
        sampleConfig.panning = true;
      }
      //console.log(data.p, sampleConfig.panning);
      //console.log('ready', sampleConfig);
    }
  };


  Instrument.prototype.getInfoAsHTML = function () {
    var html = '',
      instrumentInfo = '',
      samplepackInfo = '',
      sp = this.samplepack;

    if (this.info !== undefined) {
      instrumentInfo += '<tr><td>info</td><td>' + this.info + '</td></tr>';
    }
    if (this.author !== undefined) {
      instrumentInfo += '<tr><td>author</td><td>' + this.author + '</td></tr>';
    }
    if (this.license !== undefined) {
      instrumentInfo += '<tr><td>license</td><td>' + this.license + '</td></tr>';
    }
    instrumentInfo += '<tr><td>keyrange</td><td>' + this.lowestNote + '(' + sequencer.getFullNoteName(this.lowestNote) + ')';
    instrumentInfo += ' - ' + this.highestNote + '(' + sequencer.getFullNoteName(this.highestNote) + ')</td></tr>';

    if (instrumentInfo !== '') {
      instrumentInfo = '<table><th colspan="2">instrument</th>' + instrumentInfo + '</table>';
      html += instrumentInfo;
    }

    if (sp === undefined) {
      return html;
    }

    if (sp.info !== undefined) {
      samplepackInfo += '<tr><td>info</td><td>' + sp.info + '</td></tr>';
    }
    if (sp.author !== undefined) {
      samplepackInfo += '<tr><td>author</td><td>' + sp.author + '</td></tr>';
    }
    if (sp.license !== undefined) {
      samplepackInfo += '<tr><td>license</td><td>' + sp.license + '</td></tr>';
    }
    if (sp.compression !== undefined) {
      samplepackInfo += '<tr><td>compression</td><td>' + sp.compression + '</td></tr>';
    }
    if (sp.filesize !== undefined) {
      samplepackInfo += '<tr><td>filesize</td><td>' + round(sp.filesize / 1024 / 1024, 2) + ' MiB</td></tr>';
    }

    if (samplepackInfo !== '') {
      samplepackInfo = '<table><th colspan="2">samplepack</th>' + samplepackInfo + '</table>';
      html += samplepackInfo;
    }

    return html;
  };


  Instrument.prototype.getInfo = function () {
    var info = {
      instrument: {},
      samplepack: {}
    };

    if (this.info !== undefined) {
      info.instrument.info = this.info;
    }
    if (this.author !== undefined) {
      info.instrument.author = this.author;
    }
    if (this.license !== undefined) {
      info.instrument.license = this.license;
    }
    if (this.keyrange !== undefined) {
      info.instrument.keyrange = this.keyrange;
    }


    if (this.info !== undefined) {
      info.samplepack.info = this.info;
    }
    if (this.author !== undefined) {
      info.samplepack.author = this.author;
    }
    if (this.license !== undefined) {
      info.samplepack.license = this.license;
    }
    if (this.compression !== undefined) {
      info.samplepack.compression = this.compression;
    }
    if (this.filesize !== undefined) {
      info.samplepack.filesize = round(this.samplepack.filesize / 1024 / 1024, 2);
    }

    return info;
  };


  Instrument.prototype.createSample = function (event) {
    var
      noteNumber = event.noteNumber,
      velocity = event.velocity,
      data = this.sampleDataByNoteNumber[noteNumber],
      type = typeString(data);

    if (type === 'array') {
      data = data[velocity];
      //console.log(velocity, data.bufferId);
    }

    if (data === undefined || data === false) {
      // no buffer data, return a dummy sample
      return {
        start: function () {
          console.warn('no audio data loaded for', noteNumber);
        },
        stop: function () { },
        update: function () { },
        addData: function () { },
        unschedule: function () { }
      };
    }
    //console.log(data);
    data.track = event.track;
    return createSample(data);
  };


  Instrument.prototype.setKeyScalingPanning = function (start, end) {
    //console.log('keyScalingPanning', start, end);
    var i, data, numSamples = this.sampleData.length,
      panStep, currentPan;

    if (start === false) {
      for (i = 0; i < numSamples; i++) {
        data = this.sampleData[i];
        data.panning = false;
      }
    }

    if (isNaN(start) === false && isNaN(end) === false) {
      panStep = (end - start) / this.numNotes;
      currentPan = start;
      for (i = 0; i < numSamples; i++) {
        data = this.sampleData[i];
        data.panning = true;
        data.panPosition = currentPan;
        //console.log(currentPan, panStep, highestNote, lowestNote, data.noteNumber);
        currentPan += panStep;
      }
    }
  };


  Instrument.prototype.setRelease = function (millis, envelope) {
    if (millis === undefined) {
      return;
    }
    this.releaseEnvelope = envelope || this.releaseEnvelope;
    this.keyScalingRelease = undefined;

    var i, data, numSamples = this.sampleData.length;
    for (i = 0; i < numSamples; i++) {
      data = this.sampleData[i];
      data.release = true;
      data.release_duration = millis;
      data.release_envelope = this.releaseEnvelope;
    }
    this.releaseDuration = millis;
  };


  Instrument.prototype.setKeyScalingRelease = function (start, end, envelope) {
    var i, data, numSamples = this.sampleData.length,
      releaseStep, currentRelease;

    this.releaseEnvelope = envelope || this.releaseEnvelope;

    if (isNaN(start) === false && isNaN(end) === false) {
      this.keyScalingRelease = [start, end];
      this.releaseDuration = 0;
      releaseStep = (end - start) / this.numNotes;
      currentRelease = start;
      for (i = 0; i < numSamples; i++) {
        data = this.sampleData[i];
        data.release_duration = currentRelease;
        data.release_envelope = currentRelease;
        //console.log(currentRelease, releaseStep, data.noteNumber);
        currentRelease += releaseStep;
      }
    }
  };


  Instrument.prototype.transpose = function (semitones, cb1, cb2) {
    if (transpose === undefined) {
      console.log('transpose is still experimental');
      return;
    }
    var numSamples = this.sampleData.length;
    function loop(num, samples) {
      var data;
      if (cb2) {
        cb2('transposing sample ' + (num + 1) + ' of ' + numSamples);
      }
      //console.log(num, numSamples);
      if (num < numSamples) {
        data = samples[num];
        setTimeout(function () {
          transpose(data.buffer, semitones, function (transposedBuffer) {
            data.buffer = transposedBuffer;
            loop(++num, samples);
          });
        }, 10);
      } else {
        if (cb1) {
          console.log('ready');
          cb1();
        }
      }
    }
    loop(0, this.sampleData);
  };


  // called when midi events arrive from a midi input, from processEvent or from the scheduler
  Instrument.prototype.processEvent = function (midiEvent) {
    // console.log(midiEvent.type + ' : ' + midiEvent.velocity, midiEvent.time);
    var type = midiEvent.type,
      data1, data2, track, output;

    //seconds = seconds === undefined ? 0 : seconds;
    if (midiEvent.time === undefined) {
      midiEvent.time = 0;
    }

    if (type === 128 || type === 144) {
      if (type === 128) {
        if (this.sustainPedalDown === true) {
          midiEvent.sustainPedalDown = true;
        }
        //console.log(type, midiEvent.noteNumber, midiEvent.ticks, midiEvent.midiNote.id);
        this.stopNote(midiEvent);
      } else {
        //console.log(type, midiEvent.noteNumber, midiEvent.ticks, midiEvent.midiNote.noteOff.ticks, midiEvent.midiNote.id);
        this.playNote(midiEvent);
      }
    } else if (midiEvent.type === 176) {
      //return;
      data1 = midiEvent.data1;
      data2 = midiEvent.data2;
      if (data1 === 64) { // sustain pedal
        //console.log(this.sustainPedalDown, data1, data2)
        if (data2 === 127) {
          this.sustainPedalDown = true;
          //console.log('sustain pedal down', this.track.song.id);
          dispatchEvent(this.track.song, 'sustain_pedal', 'down');
        } else if (data2 === 0) {
          this.sustainPedalDown = false;
          //console.log('sustain pedal up');
          dispatchEvent(this.track.song, 'sustain_pedal', 'up');
          this.stopSustain(midiEvent.time);
        }
      } else if (data1 === 10) { // panning
        // panning is *not* exactly timed -> not possible (yet) with WebAudio
        track = this.track;
        //console.log(data2, remap(data2, 0, 127, -1, 1));
        track.setPanning(remap(data2, 0, 127, -1, 1));
      } else if (data1 === 7) { // volume
        track = this.track;
        output = track.output;
        output.gain.setValueAtTime(data2 / 127, midiEvent.time);
        /*
        //@TODO: this should be done by a plugin
        if(track.volumeChangeMethod === 'linear'){
            output.gain.linearRampToValueAtTime(data2/127, seconds);
        }else if(track.volumeChangeMethod === 'equal_power'){
            volume1 = track.getVolume();
            volume2 = data2/127;
            if(volume1 > volume2){
                values = getEqualPowerCurve(100, 'fadeOut', volume2);
            }else{
                values = getEqualPowerCurve(100, 'fadeIn', volume2);
            }
            now = sequencer.getTime();
            output.gain.setValueCurveAtTime(values, seconds, seconds + 0.05);
        }else{
            output.gain.setValueAtTime(data2/127, seconds);
        }
        */
      }
    }
  };


  Instrument.prototype.stopSustain = function (seconds) {
    var midiNote,
      scheduledSamples = this.scheduledSamples,
      sustainPedalSamples = this.sustainPedalSamples;

    objectForEach(sustainPedalSamples, function (sample) {
      if (sample !== undefined) {
        midiNote = sample.midiNote;
        midiNote.noteOn.sustainPedalDown = undefined;
        midiNote.noteOff.sustainPedalDown = undefined;
        sample.stop(seconds, function (sample) {
          //console.log('stopped sustain pedal up:', sample.id, sample.sourceId);
          scheduledSamples[sample.sourceId] = null;
          delete scheduledSamples[sample.sourceId];
          //delete sustainPedalSamples[sample.sourceId];
        });
      }
    });

    this.sustainPedalSamples = {};
  };


  Instrument.prototype.playNote = function (midiEvent) {
    var
      sample,
      sourceId;

    if (!midiEvent.midiNote) {
      if (sequencer.debug) {
        console.warn('playNote() no midi note');
      }
      return;
    }

    sourceId = midiEvent.midiNote.id;
    sample = this.scheduledSamples[sourceId];
    // console.log('start', sourceId);

    if (sample !== undefined) {
      // console.log('already scheduled', sourceId);
      sample.unschedule(0);
    }

    sample = this.createSample(midiEvent);
    // add some extra attributes to the sample
    sample.addData({
      midiNote: midiEvent.midiNote,
      noteName: midiEvent.midiNote.note.fullName,
      sourceId: sourceId
    });
    this.scheduledSamples[sourceId] = sample;
    sample.start(midiEvent);
  };


  Instrument.prototype.stopNote = function (midiEvent) {
    if (midiEvent.midiNote === undefined) {
      if (sequencer.debug) {
        console.warn('stopNote() no midi note', midiEvent.ticks, midiEvent.noteNumber);
      }
      return;
    }

    var sourceId = midiEvent.midiNote.id,
      sample = this.scheduledSamples[sourceId],
      scheduledSamples = this.scheduledSamples,
      sustainPedalSamples = this.sustainPedalSamples;

    // if(this.song && this.song.bar >= 6 && this.track.name === 'Sonata # 3'){
    //     console.log('stopNote', midiEvent, seconds, sequencer.getTime());
    // }

    //console.log(midiEvent.sustainPedalDown);
    if (midiEvent.sustainPedalDown === true) {
      // while sustain pedal is pressed, bypass note off events
      //console.log('sustain');
      sustainPedalSamples[sourceId] = sample;
      return;
    }

    if (sample === undefined) {
      // if(sequencer.debug){
      //     console.log('no sample scheduled (anymore) for this midiEvent', sourceId, seconds);
      // }
      return;
    }

    sample.stop(midiEvent.time, function () {
      scheduledSamples[sourceId] = null;
      delete scheduledSamples[sourceId];
    });
  };


  Instrument.prototype.hasScheduledSamples = function () {
    return isEmptyObject(this.scheduledSamples);
  };


  Instrument.prototype.reschedule = function (song) {
    var
      min = song.millis,
      max = min + (sequencer.bufferTime * 1000),
      max2 = min + 20,
      scheduledSamples = this.scheduledSamples,
      id, note, sample;

    for (id in scheduledSamples) {
      if (scheduledSamples.hasOwnProperty(id)) {
        sample = scheduledSamples[id]; // the sample
        note = sample.midiNote; // the midi note

        if (note === undefined || note.state === 'removed') {
          sample.unschedule(0, unscheduleCallback);
          delete scheduledSamples[id];
        } else if (
          note.noteOn.millis >= min &&
          note.noteOff.millis < max &&
          sample.noteName === note.fullName
        ) {
          // nothing has changed, skip
          continue;
        } else {
          //console.log('unscheduled', id);
          delete scheduledSamples[id];
          sample.unschedule(null, unscheduleCallback);
        }
      }
    }
    /*
            objectForEach(this.scheduledEvents, function(event, eventId){
                if(event === undefined || event.state === 'removed'){
                    delete sequencer.timedTasks['event_' + eventId];
                    delete this.scheduledEvents[eventId];
                }else if((event.millis >= min && event.millis < max2) === false){
                    delete sequencer.timedTasks['event_' + eventId];
                    delete this.scheduledEvents[eventId];
                }
            });
    */
  };


  function loop(data, i, maxi, events) {
    var arg;
    for (i = 0; i < maxi; i++) {
      arg = data[i];
      if (arg === undefined) {
        continue;
      } else if (arg.className === 'MidiNote') {
        events.push(arg.noteOn);
      } else if (typeString(arg) === 'array') {
        loop(arg, 0, arg.length);
      }
    }
  }


  // stop specified events or notes, used by stopProcessEvent()
  Instrument.prototype.unschedule = function () {
    var args = Array.prototype.slice.call(arguments),
      events = [],
      i, e, id, sample;

    loop(args, 0, args.length, events);

    for (i = events.length - 1; i >= 0; i--) {
      e = events[i];
      if (e.midiNote !== undefined) {
        // note on and note off events
        id = e.midiNote.id;
        sample = this.scheduledSamples[id];
        if (sample !== undefined) {
          sample.unschedule(0, unscheduleCallback);
          delete this.scheduledSamples[id];
        }
      } else if (e.className === 'MidiEvent') {
        // other channel events
        id = e.id;
        delete timedTasks['event_' + id];
        delete this.scheduledEvents[id];
      }
      //console.log(id);
    }
  };


  // stop all events and notes
  Instrument.prototype.allNotesOff = function () {
    var sample, sampleId,
      scheduledSamples = this.scheduledSamples;

    this.stopSustain(0);
    this.sustainPedalDown = false;

    //console.log(scheduledSamples);

    if (scheduledSamples === undefined || isEmptyObject(scheduledSamples) === true) {
      return;
    }

    for (sampleId in scheduledSamples) {
      if (scheduledSamples.hasOwnProperty(sampleId)) {
        //console.log('allNotesOff', sampleId);
        sample = scheduledSamples[sampleId];
        if (sample) {
          sample.unschedule(0, unscheduleCallback);
        }
      }
    }
    this.scheduledSamples = {};

    objectForEach(this.scheduledEvents, function (event, eventId) {
      delete timedTasks['event_' + eventId];
    });
    this.scheduledEvents = {};
  };


  Instrument.prototype.allNotesOffPart = function (partId) {
    var sample, sampleId,
      scheduledSamples = this.scheduledSamples;

    // make this more subtle
    this.stopSustain(0);
    this.sustainPedalDown = false;

    //console.log(scheduledSamples);

    if (scheduledSamples === undefined || isEmptyObject(scheduledSamples) === true) {
      return;
    }

    for (sampleId in scheduledSamples) {
      if (scheduledSamples.hasOwnProperty(sampleId)) {
        //console.log('allNotesOff', sampleId);
        sample = scheduledSamples[sampleId];
        if (sample) {
          sample.unschedule(0, unscheduleCallback);
        }
      }
    }
    this.scheduledSamples = {};

    objectForEach(this.scheduledEvents, function (event, eventId) {
      delete timedTasks['event_' + eventId];
    });
    this.scheduledEvents = {};
  };

  Instrument.prototype.update = function (value) {
    var sampleId, sample;
    //console.log(this.scheduledSamples);
    for (sampleId in this.scheduledSamples) {
      if (this.scheduledSamples.hasOwnProperty(sampleId)) {
        sample = this.scheduledSamples[sampleId];
        if (sample) {
          sample.update(value);
        }
      }
    }
  };

  function createAutoPanner(time) {
    /*
            var osc = context.createOscillator();
            osc.frequency.value = 50;
            osc.type = 0;
            var gain = context.createGain();
            gain.gain.value = 1;
            osc.connect(gain);
            gain.connect(context.destination);
            osc.start();
            console.log(osc);
            return {
                getValue: function(){
                    return osc.frequency.getValueAtTime(time);
                }
            };
    */
    return {
      getValue: function (time) {
        return Math.sin(time * 2 * Math.PI);
      }
    };

  }


  sequencer.createInstrument = function (arg) {
    var type = typeString(arg),
      config,
      instrument;

    //console.log(arg, type, arg.className);

    if (type === 'object') {
      if (arg.className === 'Instrument') {
        instrument = arg;
      } else if (arg.className === 'InstrumentConfig') {
        if (arg.name === 'sinewave') {
          instrument = new SimpleSynth(arg);
        } else {
          instrument = new Instrument(arg);
        }
      }
      return instrument;
    }


    if (type === 'string') {
      //@TODO what happens if we have 2 instruments with the same name?
      config = findItem(arg, storage.instruments);
      //console.log('string', arg, config, storage.instruments);
    }

    if (config == false || config.className !== 'InstrumentConfig') {
      if (debug >= 2) {
        console.info('can not create instrument from', arg);
      }
      return false;
    }


    if (config.name === 'sinewave') {
      instrument = new SimpleSynth(config);
    } else {
      instrument = new Instrument(config);
    }

    return instrument;
  };


  sequencer.protectedScope.addInitMethod(function () {
    var protectedScope = sequencer.protectedScope;

    storage = sequencer.storage;
    createSample = sequencer.createSample;
    createReverb = sequencer.createReverb;
    dispatchEvent = sequencer.protectedScope.songDispatchEvent;

    context = protectedScope.context;
    timedTasks = protectedScope.timedTasks;
    repetitiveTasks = protectedScope.repetitiveTasks;
    objectForEach = protectedScope.objectForEach;
    isEmptyObject = protectedScope.isEmptyObject;
    findItem = protectedScope.findItem;
    storeItem = protectedScope.storeItem;
    typeString = protectedScope.typeString;
    pathToArray = protectedScope.pathToArray;
    transpose = protectedScope.transpose;
    SimpleSynth = protectedScope.createClass(Instrument);

    remap = sequencer.util.remap;
    round = sequencer.util.round;
    getEqualPowerCurve = sequencer.util.getEqualPowerCurve;

    SimpleSynth.prototype.parse = function () {
      var me = this,
        config = this.config;

      //console.log(this.config);
      this.name = 'SineWave';
      this.waveForm = config.wave_form || 'sine';
      this.autopan = config.autopan || false;
      this.folder = config.folder || 'heartbeat';
      this.releaseDuration = config.release_duration || 1500;
      if (this.autopan) {
        this.autoPanner = createAutoPanner();
      }

      repetitiveTasks['update_' + this.name + '_' + new Date().getTime()] = function () {
        if (me.autopan) {
          //console.log('update',me.autoPanner.getValue(context.currentTime), me.autopan);
          //me.update(me.autoPanner.getValue(context.currentTime));
          me.update(Math.sin(context.currentTime * 2 * Math.PI));
        } else {
          me.update();
        }
      };
    };

    SimpleSynth.prototype.createSample = function (event) {
      var data = {
        oscillator: true,
        track: event.track,
        event: event,
        autopan: this.autopan,
        wave_form: this.waveForm,
        release_envelope: 'equal power',
        release_duration: this.releaseDuration
      };
      //console.log(data);
      return createSample(data);
    };

    sequencer.createSimpleSynth = function (config) {
      config = config || {};
      //console.log('creating sinewave');
      return new SimpleSynth(config);
    };
  });
}
