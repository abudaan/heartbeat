import { typeString } from './util';
import { sequencer } from './open_module';

const pow = Math.pow;
const noteNames = {
  'sharp': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  'flat': ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
  'enharmonic-sharp': ['B#', 'C#', 'C##', 'D#', 'D##', 'E#', 'F#', 'F##', 'G#', 'G##', 'A#', 'A##'],
  'enharmonic-flat': ['Dbb', 'Db', 'Ebb', 'Eb', 'Fb', 'Gbb', 'Gb', 'Abb', 'Ab', 'Bbb', 'Bb', 'Cb']
};

/*
    arguments
    - noteNumber: 60
    - noteName: 'C#4'
    - name and octave: 'C#', 4


    note {
        name: 'C',
        octave: 1,
        fullName: 'C1',
        frequency: 234.16,
        number: 60
    }
*/
const createNote = function () {
  var args = Array.prototype.slice.call(arguments);
  const numArgs = args.length;
  let data;
  let warn: boolean | string = false;
  let error: boolean | string = false;
  let octave,
    noteName,
    noteNumber,
    noteNameMode,
    frequency,
    arg0 = args[0],
    arg1 = args[1],
    arg2 = args[2];


  // arg: note number
  if (numArgs === 1 && !isNaN(arg0)) {
    if (arg0 < 0 || arg0 > 127) {
      error = 'please provide a note number >= 0 and <= 127', arg0;
    } else {
      noteNumber = arg0;
      data = getNoteName(noteNumber);
      noteName = data[0];
      octave = data[1];
    }

    // arguments: full note name
  } else if (numArgs === 1 && typeString(arg0) === 'string') {
    data = checkNoteName(arg0);
    if (data === '') {
      error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
    } else {
      noteName = data[0];
      octave = data[1];
      noteNumber = getNoteNumber(noteName, octave);
      if (!noteNumber) {
        error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
      } else if (noteNumber < 0 || noteNumber > 127) {
        error = 'please provide a note between C0 and G10';
      }
    }

    // arguments: note name, octave
  } else if (numArgs === 2 && typeString(arg0) === 'string' && !isNaN(arg1)) {
    data = checkNoteName(arg0, arg1);
    if (data === '') {
      error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb';
    } else {
      noteName = data[0];
      octave = data[1];
      noteNumber = getNoteNumber(noteName, octave);
      if (!noteNumber) {
        error = noteName + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb';
      } else if (noteNumber < 0 || noteNumber > 127) {
        error = 'please provide a note between C0 and G10';
      }
    }

    // arguments: full note name, note name mode
  } else if (numArgs === 2 && typeString(arg0) === 'string' && typeString(arg1) === 'string') {
    data = checkNoteName(arg0);
    if (data === '') {
      error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
    } else {
      noteNameMode = checkNoteMode(arg1);
      if (!noteNameMode) {
        noteNameMode = sequencer.noteNameMode;
        warn = arg1 + ' is not a valid note name mode, using ' + noteNameMode;
      }
      noteName = data[0];
      octave = data[1];
      noteNumber = getNoteNumber(noteName, octave);
      if (!noteNumber) {
        error = noteName + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
      } else if (noteNumber < 0 || noteNumber > 127) {
        error = 'please provide a note between C0 and G10';
      }
      noteName = getNoteName(noteNumber, noteNameMode)[0];
    }


    // arguments: note number, note name mode
  } else if (numArgs === 2 && typeString(arg0) === 'number' && typeString(arg1) === 'string') {
    if (arg0 < 0 || arg0 > 127) {
      error = 'please provide a note number >= 0 and <= 127', arg0;
    } else {
      noteNameMode = checkNoteMode(arg1);
      if (!noteNameMode) {
        noteNameMode = sequencer.noteNameMode;
        warn = arg1 + ' is not a valid note name mode, using ' + noteNameMode;
      }
      noteNumber = arg0;
      data = getNoteName(noteNumber, noteNameMode);
      noteName = data[0];
      octave = data[1];
      noteName = getNoteName(noteNumber, noteNameMode)[0];
    }


    // arguments: note name, octave, note name mode
  } else if (numArgs === 3 && typeString(arg0) === 'string' && !isNaN(arg1) && typeString(arg2) === 'string') {
    data = checkNoteName(arg0, arg1);
    if (!data) {
      error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
    } else {
      noteNameMode = checkNoteMode(arg2);
      if (!noteNameMode) {
        noteNameMode = sequencer.noteNameMode;
        warn = arg2 + ' is not a valid note name mode, using ' + noteNameMode;
      }
      noteName = data[0];
      octave = data[1];
      noteNumber = getNoteNumber(noteName, octave);
      if (!noteNumber) {
        error = noteName + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
      } else if (noteNumber < 0 || noteNumber > 127) {
        error = 'please provide a note between C0 and G10';
      }
      noteName = getNoteName(noteNumber, noteNameMode)[0];
    }
  } else {
    error = 'wrong arguments, please consult documentation';
  }

  if (error) {
    console.error(error);
    return false;
  }

  if (warn) {
    console.warn(warn);
  }

  frequency = getFrequency(noteNumber);
  //console.log(noteName,octave,noteNumber,frequency);

  return {
    name: noteName,
    octave: octave,
    fullName: noteName + octave,
    number: noteNumber,
    frequency: frequency,
    blackKey: isBlackKey(noteNumber)
  };

};


const getNoteName = function (number, mode) {
  mode = mode || sequencer.noteNameMode;
  //console.log(mode);
  //var octave = Math.floor((number / 12) - 2), // → in Cubase central C = C3 instead of C4
  var octave = Math.floor((number / 12) - 1),
    noteName = noteNames[mode][number % 12];
  return [noteName, octave];
};


const getNoteNumber = function (name: string, octave: number): number {
  let index: number;
  let mode: string[];

  for (let key in noteNames) {
    if (noteNames.hasOwnProperty(key)) {
      mode = noteNames[key];
      //console.log(key);
      for (let i = 0, maxi = mode.length; i < maxi; i = i + 1) {
        //console.log(mode[i],name,i);
        if (mode[i] === name) {
          index = i;
          break;
        }
      }
    }
  }

  if (index === -1) {
    return -1;
  }

  //number = (index + 12) + (octave * 12) + 12; // → in Cubase central C = C3 instead of C4
  let number = (index + 12) + (octave * 12);// → midi standard + scientific naming, see: http://en.wikipedia.org/wiki/Middle_C and http://en.wikipedia.org/wiki/Scientific_pitch_notation
  return number;
};


const getFrequency = function (number) {
  return sequencer.pitch * pow(2, (number - 69) / 12); // midi standard, see: http://en.wikipedia.org/wiki/MIDI_Tuning_Standard
};


function getPitch(hertz) {
  //fm  =  2(m−69)/12(440 Hz).
}


const checkNoteName = function () {
  var
    args = Array.prototype.slice.call(arguments),
    numArgs = args.length,
    arg0 = args[0],
    arg1 = args[1],
    length, i, char,
    name,
    octave;


  if (numArgs === 1 && typeString(arg0) === 'string') {

    length = arg0.length;
    name = '';
    octave = '';

    for (i = 0; i < length; i++) {
      char = arg0[i];
      if (isNaN(char) && char !== '-') {
        name += char;
      } else {
        octave += char;
      }
    }

    if (octave === '') {
      octave = 0;
    }

  } else if (numArgs === 2 && typeString(arg0) === 'string' && !isNaN(arg1)) {

    name = arg0;
    octave = arg1;

  } else {
    return false;
  }

  octave = parseInt(octave, 10);
  name = name.substring(0, 1).toUpperCase() + name.substring(1);

  //console.log(name,'|',octave);
  return [name, octave];
};


const checkNoteMode = function (mode: string): string {
  var result = '';
  switch (mode) {
    case 'sharp':
    case 'flat':
    case 'enharmonic-sharp':
    case 'enharmonic-flat':
      result = mode;
      break;
  }
  return result;
};


const isBlackKey = function (noteNumber: number): boolean {
  let black: boolean;

  switch (true) {
    case noteNumber % 12 === 1://C#
    case noteNumber % 12 === 3://D#
    case noteNumber % 12 === 6://F#
    case noteNumber % 12 === 8://G#
    case noteNumber % 12 === 10://A#
      black = true;
      break;
    default:
      black = false;
  }

  return black;
};


const seq_getNoteNumber = function () {
  var note = createNote.apply(this, arguments);
  if (note) {
    return note.number;
  }
  return false;
};

const seq_getNoteName = function () {
  var note = createNote.apply(this, arguments);
  if (note) {
    return note.name;
  }
  return false;
};


const seq_getNoteNameFromNoteNumber = function (number, mode) {
  return getNoteName(number, mode);
};


const seq_getNoteOctave = function () {
  var note = createNote.apply(this, arguments);
  if (note) {
    return note.octave;
  }
  return false;
};


const seq_getFullNoteName = function () {
  var note = createNote.apply(this, arguments);
  if (note) {
    return note.fullName;
  }
  return false;
};


const seq_getFrequency = function () {
  var note = createNote.apply(this, arguments);
  if (note) {
    return note.frequency;
  }
  return false;
};

const seq_isBlackKey = function () {
  var note = createNote.apply(this, arguments);
  if (note) {
    return note.blackKey;
  }
  return false;
};

/*
    sequencer.SHARP = 'sharp';
    sequencer.FLAT = 'flat';
    sequencer.ENHARMONIC_SHARP = 'enharmonic-sharp';
    sequencer.ENHARMONIC_FLAT = 'enharmonic-flat';
*/

Object.defineProperty(sequencer, 'SHARP', { value: 'sharp' });
Object.defineProperty(sequencer, 'FLAT', { value: 'flat' });
Object.defineProperty(sequencer, 'ENHARMONIC_SHARP', { value: 'enharmonic-sharp' });
Object.defineProperty(sequencer, 'ENHARMONIC_FLAT', { value: 'enharmonic-flat' });


export {
  createNote,
  seq_getNoteNumber as getNoteNumber,
  seq_getNoteName as getNoteName,
  seq_getNoteNameFromNoteNumber as seq_getNoteNumber,
  seq_getNoteOctave as getNoteOctave,
  seq_getFullNoteName as getFullNoteName,
  seq_getFrequency as getFrequency,
  seq_isBlackKey as isBlackKey,
}