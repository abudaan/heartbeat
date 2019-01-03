function midiEventNames() {

    /**
        @public
    */
    'use strict';

    /**
        @var
    */
    var
        lowerCaseToNumber = {
            'note off': 0x80,
            'note on': 0x90,
            'poly pressure': 0xA0,
            'control change': 0xB0,
            'program change': 0xC0,
            'channel pressure': 0xD0,
            'pitch bend': 0xE0,
            'tempo': 0x51,
            'time signature': 0x58,
            'end of track': 0x2F
        },

        upperCaseToNumber = {
            'NOTE_OFF': 0x80,
            'NOTE_ON': 0x90,
            'POLY_PRESSURE': 0xA0,
            'CONTROL_CHANGE': 0xB0,
            'PROGRAM_CHANGE': 0xC0,
            'CHANNEL_PRESSURE': 0xD0,
            'PITCH_BEND': 0xE0,
            'TEMPO': 0x51,
            'TIME_SIGNATURE': 0x58,
            'END_OF_TRACK': 0x2F
        },

        numberToLowerCase = {
            0x80: 'note off',
            0x90: 'note on',
            0xA0: 'poly pressure',
            0xB0: 'control change',
            0xC0: 'program change',
            0xD0: 'channel pressure',
            0xE0: 'pitch bend',
            0x51: 'tempo',
            0x58: 'time signature',
            0x2F: 'end of track'
        },

        numberToUpperCase = {
            0x80: 'NOTE_OFF',
            0x90: 'NOTE_ON',
            0xA0: 'POLY_PRESSURE',
            0xB0: 'CONTROL_CHANGE',
            0xC0: 'PROGRAM_CHANGE',
            0xD0: 'CHANNEL_PRESSURE',
            0xE0: 'PITCH_BEND',
            0x51: 'TEMPO',
            0x58: 'TIME_SIGNATURE',
            0x2F: 'END_OF_TRACK'
        };


    function numberByName(name) {
        var no = false

        name = name.replace(/_/g, ' ');
        no = lowerCaseToNumber[name] || false;

        if (no !== false) {
            return no;
        }

        // try upper
        name = name.replace(/\s/g, '_');
        no = upperCaseToNumber[name] || false;

        if (no === false && sequencer.debug === true) {
            console.warn(name, 'is not a valid (or supported) midi event name, please consult documentation');
        }
        return no;
    }


    function nameByNumber(no, upperOrLower) {
        var name = false;
        upperOrLower = upperOrLower || 'upper'; // return uppercase names by default
        //upperOrLower = upperOrLower || no.indexOf('_') !== -1 ? 'upper' : 'lower';

        if (upperOrLower === 'lower') {
            name = numberToLowerCase[no] || false;
            if (name === false && sequencer.debug === true) {
                console.warn(no, 'is not a valid (or supported) midi event number, please consult documentation');
            }
            return name;
        }

        name = numberToUpperCase[no] || false;
        if (name === false && sequencer.debug === true) {
            console.warn(no, 'is not a valid (or supported) midi event number, please consult documentation');
        }
        return name;
    }


    function checkEventType(type) {
        if (isNaN(type)) {
            return numberByName(type);
        }
        return nameByNumber(type);
    }


    //heartbeat
    /**
        @memberof sequencer
        @instance
    */
    Object.defineProperty(sequencer, 'DUMMY_EVENT', { value: 0x0 }); //0
    Object.defineProperty(sequencer, 'MIDI_NOTE', { value: 0x70 }); //112
    //standard MIDI
    Object.defineProperty(sequencer, 'NOTE_OFF', { value: 0x80 }); //128
    Object.defineProperty(sequencer, 'NOTE_ON', { value: 0x90 }); //144
    Object.defineProperty(sequencer, 'POLY_PRESSURE', { value: 0xA0 }); //160
    Object.defineProperty(sequencer, 'CONTROL_CHANGE', { value: 0xB0 }); //176
    Object.defineProperty(sequencer, 'PROGRAM_CHANGE', { value: 0xC0 }); //192
    Object.defineProperty(sequencer, 'CHANNEL_PRESSURE', { value: 0xD0 }); //208
    Object.defineProperty(sequencer, 'PITCH_BEND', { value: 0xE0 }); //224
    Object.defineProperty(sequencer, 'SYSTEM_EXCLUSIVE', { value: 0xF0 }); //240
    Object.defineProperty(sequencer, 'MIDI_TIMECODE', { value: 241 });
    Object.defineProperty(sequencer, 'SONG_POSITION', { value: 242 });
    Object.defineProperty(sequencer, 'SONG_SELECT', { value: 243 });
    Object.defineProperty(sequencer, 'TUNE_REQUEST', { value: 246 });
    Object.defineProperty(sequencer, 'EOX', { value: 247 });
    Object.defineProperty(sequencer, 'TIMING_CLOCK', { value: 248 });
    Object.defineProperty(sequencer, 'START', { value: 250 });
    Object.defineProperty(sequencer, 'CONTINUE', { value: 251 });
    Object.defineProperty(sequencer, 'STOP', { value: 252 });
    Object.defineProperty(sequencer, 'ACTIVE_SENSING', { value: 254 });
    Object.defineProperty(sequencer, 'SYSTEM_RESET', { value: 255 });

    Object.defineProperty(sequencer, 'TEMPO', { value: 0x51 });
    Object.defineProperty(sequencer, 'TIME_SIGNATURE', { value: 0x58 });
    Object.defineProperty(sequencer, 'END_OF_TRACK', { value: 0x2F });

    // public
    /**
        @memberof sequencer
        @instance
        @function checkEventType
    */
    sequencer.checkEventType = checkEventType;
    sequencer.midiEventNameByNumber = nameByNumber;
    sequencer.midiEventNumberByName = numberByName;

}