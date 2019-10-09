function metronome() {

  'use strict';

  var
    //import
    context, //defined in open_module.js
    findItem, //defined in asset_manager.js
    getPosition, //defined in position.js
    objectForEach, //defined in util.js
    createMidiNote, //defined in midi_note.js
    parseEvents, //defined in parse_events.js
    parseMetronomeEvents, //defined in song_update.js

    methodMap = {
      volume: 'setVolume',
      instrument: 'setInstrument',
      noteNumberAccentedTick: 'setNoteNumberAccentedTick',
      noteNumberNonAccentedTick: 'setNoteNumberNonAccentedTick',
      velocityAccentedTick: 'setVelocityAccentedTick',
      velocityNonAccentedTick: 'setVelocityNonAccentedTick',
      noteLengthAccentedTick: 'setNoteLengthAccentedTick',
      noteLengthNonAccentedTick: 'setNoteLengthNonAccentedTick'
    },

    Metronome;


  function checkNumber(value) {
    //console.log(value);
    if (isNaN(value)) {
      if (sequencer.debug) {
        console.log('please provide a number');
      }
      return false;
    }
    if (value < 0 || value > 127) {
      if (sequencer.debug) {
        console.log('please provide a number between 0 and 127');
      }
      return false;
    }
    return value;
  }


  Metronome = function (song) {
    this.song = song;
    this.track = sequencer.createTrack(this.song.id + '_metronome', 'metronome');
    this.part = sequencer.createPart();
    this.track.addPart(this.part);
    this.track.connect(this.song.gainNode);
    this.events = [];
    this.precountEvents = [];
    this.noteNumberAccented = 61;
    this.noteNumberNonAccented = 60;
    this.volume = 1;
    this.velocityNonAccented = 100;
    this.velocityAccented = 100;
    this.noteLengthNonAccented = song.ppq / 4; // sixteenth notes -> don't make this too short if your sample has a long attack!
    this.noteLengthAccented = song.ppq / 4;
    this.track.setInstrument('heartbeat/metronome');
    this.precountDurationInMillis = 0;
    this.bars = 0;
    //this.reset();
  };


  function createEvents(metronome, startBar, endBar, id) {

    var i, j,
      data,
      velocity,
      noteLength,
      noteNumber,
      beatsPerBar,
      ticksPerBeat,
      ticks = 0,
      events = [],
      song = metronome.song,
      noteOn, noteOff, note;

    //console.log(startBar, endBar);

    for (i = startBar; i <= endBar; i++) {
      data = getPosition(song, ['barsbeats', i]);
      beatsPerBar = data.nominator;
      ticksPerBeat = data.ticksPerBeat;

      for (j = 0; j < beatsPerBar; j++) {
        noteNumber = j === 0 ? metronome.noteNumberAccented : metronome.noteNumberNonAccented;
        noteLength = j === 0 ? metronome.noteLengthAccented : metronome.noteLengthNonAccented;
        velocity = j === 0 ? metronome.velocityAccented : metronome.velocityNonAccented;

        noteOn = sequencer.createMidiEvent(ticks, 144, noteNumber, velocity);
        noteOff = sequencer.createMidiEvent(ticks + noteLength, 128, noteNumber, 0);

        if (id === 'precount') {
          noteOn.part = { id: 'precount' };
          noteOn.track = metronome.track;
          noteOff.part = { id: 'precount' };
          noteOff.track = metronome.track;
        }

        note = createMidiNote(noteOn, noteOff);
        events.push(noteOn, noteOff);

        ticks += ticksPerBeat;
      }
    }

    return events;
  }


  Metronome.prototype.init = function (id, startBar, endBar) {
    id = id === undefined ? 'init' : id;
    //console.log('metronome', id, this.song.bars, startBar, endBar);
    if (this.part.numEvents > 0) {
      this.part.removeEvents(this.part.events);
    }
    this.events = createEvents(this, startBar, endBar, id);
    this.numEvents = this.events.length;
    this.part.addEvents(this.events);
    this.bars = this.song.bars;
    parseMetronomeEvents(this.song, this.events);
  };


  Metronome.prototype.update = function (startBar, endBar) {
    //console.time('metronome update')
    if (startBar === 0) {
      startBar = 1;
    }
    //console.log('metronome', this.song.bars, startBar, endBar);
    // for now, just re-init the metronome
    if (startBar !== undefined && endBar !== undefined) {
      this.init('update', startBar, endBar);
    } else {
      this.init('update', 1, this.song.bars);
    }
    //console.timeEnd('metronome update')

    //this.allNotesOff();
    //this.song.scheduler.updateSong();

    // var events = createEvents(this, startBar, endBar, 'update');
    // this.events = this.events.concat(events);
    // parseMetronomeEvents(this.song, this.events);
  };


  Metronome.prototype.updateConfig = function () {
    this.init('configure', 1, this.bars);
    this.allNotesOff();
    this.song.scheduler.updateSong();
  };


  Metronome.prototype.configure = function (config) {
    var me = this;

    objectForEach(config, function (value, key) {
      me[methodMap[key]](value);
      //console.log(key, me[methodMap[key]]);
    });
    this.updateConfig();
  };


  Metronome.prototype.setInstrument = function (instrument) {
    if (instrument.className !== 'Instrument') {
      instrument = sequencer.createInstrument(instrument);
    }
    if (instrument !== false) {
      this.track.setInstrument(instrument);
    } else {
      this.track.setInstrument('heartbeat/metronome');
    }
    this.updateConfig();
  };


  Metronome.prototype.setNoteLengthAccentedTick = function (value) {
    if (isNaN(value)) {
      if (sequencer.debug >= 2) {
        console.warn('please provide a number');
      }
    }
    this.noteLengthAccented = value;
    this.updateConfig();
  };


  Metronome.prototype.setNoteLengthNonAccentedTick = function (value) {
    if (isNaN(value)) {
      if (sequencer.debug >= 2) {
        console.warn('please provide a number');
      }
    }
    this.noteLengthNonAccented = value;
    this.updateConfig();
  };


  Metronome.prototype.setVelocityAccentedTick = function (value) {
    value = checkNumber(value);
    if (value !== false) {
      this.velocityAccented = value;
    } else if (sequencer.debug >= 2) {
      console.warn('please provide a number');
    }
    this.updateConfig();
  };


  Metronome.prototype.setVelocityNonAccentedTick = function (value) {
    value = checkNumber(value);
    if (value !== false) {
      this.velocityNonAccented = value;
    } else if (sequencer.debug >= 2) {
      console.warn('please provide a number');
    }
    this.updateConfig();
  };


  Metronome.prototype.setNoteNumberAccentedTick = function (value) {
    value = checkNumber(value);
    if (value !== false) {
      this.noteNumberAccented = value;
    } else if (sequencer.debug >= 2) {
      console.warn('please provide a number');
    }
    this.updateConfig();
  };


  Metronome.prototype.setNoteNumberNonAccentedTick = function (value) {
    value = checkNumber(value);
    if (value !== false) {
      this.noteNumberNonAccented = value;
    } else if (sequencer.debug >= 2) {
      console.warn('please provide a number');
    }
    this.updateConfig();
  };


  Metronome.prototype.reset = function () {
    this.volume = 1;
    this.track.setInstrument('heartbeat/metronome');

    this.noteNumberAccented = 61;
    this.noteNumberNonAccented = 60;

    this.velocityAccented = 100;
    this.velocityNonAccented = 100;

    this.noteLengthAccented = this.song.ppq / 4;
    this.noteLengthNonAccented = this.song.ppq / 4;
  };


  Metronome.prototype.allNotesOff = function () {
    if (this.track.instrument) {
      this.track.instrument.allNotesOff();
    }
  };


  Metronome.prototype.createPrecountEvents = function (precount) {
    if (precount <= 0) {
      return;
    }
    var endPos = this.song.getPosition('barsbeats', this.song.bar + precount);

    this.index = 0;
    this.millis = 0;
    this.startMillis = this.song.millis;
    this.precountDurationInMillis = endPos.millis - this.startMillis;
    this.precountEvents = createEvents(this, this.song.bar, endPos.bar - 1, 'precount');
    parseEvents(this.song, this.precountEvents);
    //console.log(this.song.bar, endPos.bar, precount, this.precountEvents.length);
    //console.log(this.precountEvents, this.precountDurationInMillis, startTicks, endTicks);
  };


  // called by scheduler.js
  Metronome.prototype.getPrecountEvents = function (maxtime) {
    var events = this.precountEvents,
      maxi = events.length, i, event,
      result = [];

    //console.log(maxtime, maxi, this.index, this.millis);

    for (i = this.index; i < maxi; i++) {
      event = events[i];
      //console.log(event.millis, maxtime, this.millis);
      if (event.millis < maxtime) {
        event.time = this.startTime + event.millis;
        result.push(event);
        this.index++;
      } else {
        break;
      }
    }
    return result;
  };


  Metronome.prototype.setVolume = function (value) {
    this.track.setVolume(value);
  };


  sequencer.protectedScope.createMetronome = function (song) {
    return new Metronome(song);
  };

  sequencer.protectedScope.addInitMethod(function initMetronome() {
    context = sequencer.protectedScope.context;
    findItem = sequencer.protectedScope.findItem;
    getPosition = sequencer.protectedScope.getPosition;
    createMidiNote = sequencer.createMidiNote;
    objectForEach = sequencer.util.objectForEach;
    parseEvents = sequencer.protectedScope.parseEvents;
    parseMetronomeEvents = sequencer.protectedScope.parseMetronomeEvents;
  });
}