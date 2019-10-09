/*
    based on: https://github.com/gasman/jasmid
    adapted to work with heartbeatjs' type MidiEvent and Track
*/

function midiParse() {

    'use strict';

    var
        lastEventTypeByte,
        trackName,
        instrumentName,

        //import
        createStream; // defined in midi_stream.js


    function readChunk(stream) {
        var id = stream.read(4, true);
        var length = stream.readInt32();
        //console.log(length);
        return {
            'id': id,
            'length': length,
            'data': stream.read(length, false)
        };
    }


    function readEvent(stream) {
        var event = {};
        //var lastEventTypeByte; // for running status
        event.deltaTime = stream.readVarInt();
        var eventTypeByte = stream.readInt8();
        var length;
        //console.log(eventTypeByte, eventTypeByte & 0x80, 146 & 0x0f);
        if ((eventTypeByte & 0xf0) == 0xf0) {
            /* system / meta event */
            if (eventTypeByte == 0xff) {
                /* meta event */
                event.type = 'meta';
                var subtypeByte = stream.readInt8();
                length = stream.readVarInt();
                switch (subtypeByte) {
                    case 0x00:
                        event.subtype = 'sequenceNumber';
                        if (length !== 2) throw 'Expected length for sequenceNumber event is 2, got ' + length;
                        event.number = stream.readInt16();
                        return event;
                    case 0x01:
                        event.subtype = 'text';
                        event.text = stream.read(length);
                        return event;
                    case 0x02:
                        event.subtype = 'copyrightNotice';
                        event.text = stream.read(length);
                        return event;
                    case 0x03:
                        event.subtype = 'trackName';
                        event.text = stream.read(length);
                        trackName = event.text;
                        return event;
                    case 0x04:
                        event.subtype = 'instrumentName';
                        event.text = stream.read(length);
                        instrumentName = event.text;
                        return event;
                    case 0x05:
                        event.subtype = 'lyrics';
                        event.text = stream.read(length);
                        return event;
                    case 0x06:
                        event.subtype = 'marker';
                        event.text = stream.read(length);
                        return event;
                    case 0x07:
                        event.subtype = 'cuePoint';
                        event.text = stream.read(length);
                        return event;
                    case 0x20:
                        event.subtype = 'midiChannelPrefix';
                        if (length !== 1) throw 'Expected length for midiChannelPrefix event is 1, got ' + length;
                        event.channel = stream.readInt8();
                        return event;
                    case 0x2f:
                        event.subtype = 'endOfTrack';
                        if (length !== 0) throw 'Expected length for endOfTrack event is 0, got ' + length;
                        return event;
                    case 0x51:
                        event.subtype = 'setTempo';
                        if (length !== 3) throw 'Expected length for setTempo event is 3, got ' + length;
                        event.microsecondsPerBeat = (
                            (stream.readInt8() << 16) +
                            (stream.readInt8() << 8) +
                            stream.readInt8()
                        );
                        return event;
                    case 0x54:
                        event.subtype = 'smpteOffset';
                        if (length !== 5) throw 'Expected length for smpteOffset event is 5, got ' + length;
                        var hourByte = stream.readInt8();
                        event.frameRate = {
                            0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
                        }[hourByte & 0x60];
                        event.hour = hourByte & 0x1f;
                        event.min = stream.readInt8();
                        event.sec = stream.readInt8();
                        event.frame = stream.readInt8();
                        event.subframe = stream.readInt8();
                        return event;
                    case 0x58:
                        event.subtype = 'timeSignature';
                        if (length !== 4) throw 'Expected length for timeSignature event is 4, got ' + length;
                        event.numerator = stream.readInt8();
                        event.denominator = Math.pow(2, stream.readInt8());
                        event.metronome = stream.readInt8();
                        event.thirtyseconds = stream.readInt8();
                        return event;
                    case 0x59:
                        event.subtype = 'keySignature';
                        if (length !== 2) throw 'Expected length for keySignature event is 2, got ' + length;
                        event.key = stream.readInt8(true);
                        event.scale = stream.readInt8();
                        return event;
                    case 0x7f:
                        event.subtype = 'sequencerSpecific';
                        event.data = stream.read(length);
                        return event;
                    default:
                        //if(sequencer.debug >= 2){
                        //    console.warn('Unrecognised meta event subtype: ' + subtypeByte);
                        //}
                        event.subtype = 'unknown';
                        event.data = stream.read(length);
                        return event;
                }
                event.data = stream.read(length);
                return event;
            } else if (eventTypeByte == 0xf0) {
                event.type = 'sysEx';
                length = stream.readVarInt();
                event.data = stream.read(length);
                return event;
            } else if (eventTypeByte == 0xf7) {
                event.type = 'dividedSysEx';
                length = stream.readVarInt();
                event.data = stream.read(length);
                return event;
            } else {
                throw 'Unrecognised MIDI event type byte: ' + eventTypeByte;
            }
        } else {
            /* channel event */
            var param1;
            if ((eventTypeByte & 0x80) === 0) {
                /* running status - reuse lastEventTypeByte as the event type.
                    eventTypeByte is actually the first parameter
                */
                //console.log('running status');
                param1 = eventTypeByte;
                eventTypeByte = lastEventTypeByte;
            } else {
                param1 = stream.readInt8();
                //console.log('last', eventTypeByte);
                lastEventTypeByte = eventTypeByte;
            }
            var eventType = eventTypeByte >> 4;
            event.channel = eventTypeByte & 0x0f;
            event.type = 'channel';
            switch (eventType) {
                case 0x08:
                    event.subtype = 'noteOff';
                    event.noteNumber = param1;
                    event.velocity = stream.readInt8();
                    return event;
                case 0x09:
                    event.noteNumber = param1;
                    event.velocity = stream.readInt8();
                    if (event.velocity === 0) {
                        event.subtype = 'noteOff';
                    } else {
                        event.subtype = 'noteOn';
                        //console.log('noteOn');
                    }
                    return event;
                case 0x0a:
                    event.subtype = 'noteAftertouch';
                    event.noteNumber = param1;
                    event.amount = stream.readInt8();
                    return event;
                case 0x0b:
                    event.subtype = 'controller';
                    event.controllerType = param1;
                    event.value = stream.readInt8();
                    return event;
                case 0x0c:
                    event.subtype = 'programChange';
                    event.programNumber = param1;
                    return event;
                case 0x0d:
                    event.subtype = 'channelAftertouch';
                    event.amount = param1;
                    //if(trackName === 'SH-S1-44-C09 L=SML IN=3'){
                    //    console.log('channel pressure', trackName, param1);
                    //}
                    return event;
                case 0x0e:
                    event.subtype = 'pitchBend';
                    event.value = param1 + (stream.readInt8() << 7);
                    return event;
                default:
                    /*
                    throw 'Unrecognised MIDI event type: ' + eventType;
                    console.log('Unrecognised MIDI event type: ' + eventType);
                    */



                    event.value = stream.readInt8();
                    event.subtype = 'unknown';
                    //console.log(event);
                    /*
                                        event.noteNumber = param1;
                                        event.velocity = stream.readInt8();
                                        event.subtype = 'noteOn';
                                        console.log('weirdo', trackName, param1, event.velocity);
                    */

                    return event;
            }
        }
    }


    function parseStream(stream) {
        var formatType, trackCount, timeDivision, ticksPerBeat,
            tracks = [], i,
            trackNames = [],
            trackChunk, trackStream,
            headerChunk, headerStream;

        headerChunk = readChunk(stream);
        if (headerChunk.id !== 'MThd' || headerChunk.length !== 6) {
            throw 'Bad .mid file - header not found';
        }
        //console.log(headerChunk);

        headerStream = createStream(headerChunk.data);
        formatType = headerStream.readInt16();
        trackCount = headerStream.readInt16();
        timeDivision = headerStream.readInt16();

        if (timeDivision & 0x8000) {
            throw 'Expressing time division in SMTPE frames is not supported yet';
        } else {
            ticksPerBeat = timeDivision;
        }

        var header = {
            'formatType': formatType,
            'trackCount': trackCount,
            'ticksPerBeat': ticksPerBeat
        };

        for (i = 0; i < trackCount; i++) {
            tracks[i] = [];
            trackNames[i] = trackName;
            trackChunk = readChunk(stream);
            if (trackChunk.id !== 'MTrk') {
                throw 'Unexpected chunk - expected MTrk, got ' + trackChunk.id;
            }
            trackStream = createStream(trackChunk.data);
            while (!trackStream.eof()) {
                var event = readEvent(trackStream);
                tracks[i].push(event);
            }
        }

        return {
            'header': header,
            'tracks': tracks,
            'trackNames': trackNames
        };
    }


    /* read a MIDI-style variable-length integer
        (big-endian value in groups of 7 bits,
        with top bit set to signify that another byte follows)
    function readVarInt() {
        var result = 0;
        while (true) {
            var b = readInt8();
            if (b & 0x80) {
                result += (b & 0x7f);
                result <<= 7;
            } else {
                // b is the last byte
                return result + b;
            }
        }
    }
    */


    sequencer.protectedScope.parseMidiFile = function (buffer) {
        return parseStream(createStream(buffer));
        //var dv = new DataView(buffer);
        //return parseStream(dv);
    };


    sequencer.protectedScope.addInitMethod(function () {
        createStream = sequencer.protectedScope.createStream;
    });
}

