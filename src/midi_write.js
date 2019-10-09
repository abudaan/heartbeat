//http://www.deluge.co/?q=midi-tempo-bpm
// This code is based on https://github.com/sergi/jsmidi

function midiWrite() {

    'use strict';

    var
        AP = Array.prototype,
        PPQ = sequencer.defaultPPQ,
        HDR_CHUNKID = [
            'M'.charCodeAt(0),
            'T'.charCodeAt(0),
            'h'.charCodeAt(0),
            'd'.charCodeAt(0)
        ],
        HDR_CHUNK_SIZE = [0x0, 0x0, 0x0, 0x6], // Header size for SMF
        // HDR_TYPE0 = [0x0, 0x0], // Midi Type 0 id
        HDR_TYPE1 = [0x0, 0x1], // Midi Type 1 id
        //HDR_PPQ = [0x01, 0xE0], // Defaults to 480 ticks per beat
        //HDR_PPQ = [0x00, 0x80], // Defaults to 128 ticks per beat
        HDR_PPQ = str2Bytes(PPQ.toString(16), 2),

        TRK_CHUNKID = [
            'M'.charCodeAt(0),
            'T'.charCodeAt(0),
            'r'.charCodeAt(0),
            'k'.charCodeAt(0)
        ],

        // Meta event codes
        META_SEQUENCE = 0x00,
        META_TEXT = 0x01,
        META_COPYRIGHT = 0x02,
        META_TRACK_NAME = 0x03,
        META_INSTRUMENT = 0x04,
        META_LYRIC = 0x05,
        META_MARKER = 0x06,
        META_CUE_POINT = 0x07,
        META_CHANNEL_PREFIX = 0x20,
        META_END_OF_TRACK = 0x2f,
        META_TEMPO = 0x51,
        META_SMPTE = 0x54,
        META_TIME_SIG = 0x58,
        META_KEY_SIG = 0x59,
        META_SEQ_EVENT = 0x7f;


    function write(song) {
        var byteArray = [].concat(HDR_CHUNKID, HDR_CHUNK_SIZE, HDR_TYPE1),
            tracks = song.tracks,
            numTracks = song.tracks.length + 1,
            i, maxi, track, midiFile, destination, b64,
            arrayBuffer, dataView, uintArray;


        byteArray = byteArray.concat(str2Bytes(numTracks.toString(16), 2), HDR_PPQ);
        //console.log(byteArray);
        byteArray = byteArray.concat(trackToBytes(song.timeEvents, song.durationTicks, 'tempo'));
        //console.log(song.durationMillis);

        for (i = 0, maxi = tracks.length; i < maxi; i++) {
            track = tracks[i];
            byteArray = byteArray.concat(trackToBytes(track.events, song.durationTicks, track.name, track.instrumentId));
        }

        //b64 = btoa(codes2Str(byteArray));
        //window.location.assign("data:audio/midi;base64," + b64);
        //console.log(b64);// send to server

        maxi = byteArray.length;
        arrayBuffer = new ArrayBuffer(maxi);
        uintArray = new Uint8Array(arrayBuffer);
        for (i = 0; i < maxi; i++) {
            uintArray[i] = byteArray[i];
        }
        midiFile = new Blob([uintArray], { type: 'application/x-midi', endings: 'transparent' });
        saveAs(midiFile, song.name);
        //window.location.assign(window.URL.createObjectURL(midiFile));
    }


    function trackToBytes(events, lastEventTicks, trackName, instrumentName) {
        var lengthBytes,
            i, maxi, event, status,
            trackLength, // number of bytes in track chunk
            ticks = 0,
            delta = 0,
            trackBytes = [];

        if (trackName) {
            trackBytes.push(0x00);
            trackBytes.push(0xFF);
            trackBytes.push(0x03);
            trackBytes = trackBytes.concat(convertToVLQ(trackName.length));
            trackBytes = trackBytes.concat(stringToNumArray(trackName));
        }

        if (instrumentName) {
            trackBytes.push(0x00);
            trackBytes.push(0xFF);
            trackBytes.push(0x04);
            trackBytes = trackBytes.concat(convertToVLQ(instrumentName.length));
            trackBytes = trackBytes.concat(stringToNumArray(instrumentName));
        }

        for (i = 0, maxi = events.length; i < maxi; i++) {
            event = events[i];
            delta = event.ticks - ticks;
            delta = convertToVLQ(delta);
            //console.log(delta);
            trackBytes = trackBytes.concat(delta);
            //trackBytes.push.apply(trackBytes, delta);
            if (event.type === 0x80 || event.type === 0x90) { // note off, note on
                //status = parseInt(event.type.toString(16) + event.channel.toString(16), 16);
                status = event.type + event.channel;
                trackBytes.push(status);
                trackBytes.push(event.noteNumber);
                trackBytes.push(event.velocity);
            } else if (event.type === 0x51) { // tempo
                trackBytes.push(0xFF);
                trackBytes.push(0x51);
                trackBytes.push(0x03);// length
                //trackBytes = trackBytes.concat(convertToVLQ(3));// length
                var microSeconds = Math.round(60000000 / event.bpm);
                trackBytes = trackBytes.concat(str2Bytes(microSeconds.toString(16), 3));
            } else if (event.type === 0x58) { // time signature
                var denom = event.denominator;
                if (denom === 2) {
                    denom = 0x01;
                } else if (denom === 4) {
                    denom = 0x02;
                } else if (denom === 8) {
                    denom = 0x03;
                } else if (denom === 16) {
                    denom = 0x04;
                } else if (denom === 32) {
                    denom = 0x05;
                }
                trackBytes.push(0xFF);
                trackBytes.push(0x58);
                trackBytes.push(0x04);// length
                //trackBytes = trackBytes.concat(convertToVLQ(4));// length
                trackBytes.push(event.nominator);
                trackBytes.push(denom);
                trackBytes.push(PPQ / event.nominator);
                trackBytes.push(0x08); // 32nd notes per crotchet
                //console.log(trackName, event.nominator, event.denominator, denom, PPQ/event.nominator);
            }
            // set the new ticks reference
            //console.log(status, event.ticks, ticks);
            ticks = event.ticks;
        }
        delta = lastEventTicks - ticks;
        //console.log('d', delta, 't', ticks, 'l', lastEventTicks);
        delta = convertToVLQ(delta);
        //console.log(trackName, ticks, delta);
        trackBytes = trackBytes.concat(delta);
        trackBytes.push(0xFF);
        trackBytes.push(0x2F);
        trackBytes.push(0x00);
        //console.log(trackName, trackBytes);
        trackLength = trackBytes.length;
        lengthBytes = str2Bytes(trackLength.toString(16), 4);
        return [].concat(TRK_CHUNKID, lengthBytes, trackBytes);
    }


    // Helper functions

    /*
     * Converts an array of bytes to a string of hexadecimal characters. Prepares
     * it to be converted into a base64 string.
     *
     * @param byteArray {Array} array of bytes that will be converted to a string
     * @returns hexadecimal string
     */

    function codes2Str(byteArray) {
        return String.fromCharCode.apply(null, byteArray);
    }

    /*
     * Converts a String of hexadecimal values to an array of bytes. It can also
     * add remaining '0' nibbles in order to have enough bytes in the array as the
     * |finalBytes| parameter.
     *
     * @param str {String} string of hexadecimal values e.g. '097B8A'
     * @param finalBytes {Integer} Optional. The desired number of bytes that the returned array should contain
     * @returns array of nibbles.
     */

    function str2Bytes(str, finalBytes) {
        if (finalBytes) {
            while ((str.length / 2) < finalBytes) {
                str = '0' + str;
            }
        }

        var bytes = [];
        for (var i = str.length - 1; i >= 0; i = i - 2) {
            var chars = i === 0 ? str[i] : str[i - 1] + str[i];
            bytes.unshift(parseInt(chars, 16));
        }

        return bytes;
    }


    /**
     * Translates number of ticks to MIDI timestamp format, returning an array of
     * bytes with the time values. Midi has a very particular time to express time,
     * take a good look at the spec before ever touching this function.
     *
     * @param ticks {Integer} Number of ticks to be translated
     * @returns Array of bytes that form the MIDI time value
     */
    function convertToVLQ(ticks) {
        var buffer = ticks & 0x7F;

        while (ticks = ticks >> 7) {
            buffer <<= 8;
            buffer |= ((ticks & 0x7F) | 0x80);
        }

        var bList = [];
        while (true) {
            bList.push(buffer & 0xff);

            if (buffer & 0x80) {
                buffer >>= 8;
            } else {
                break;
            }
        }

        //console.log(ticks, bList);
        return bList;
    }


    /*
     * Converts a string into an array of ASCII char codes for every character of
     * the string.
     *
     * @param str {String} String to be converted
     * @returns array with the charcode values of the string
     */
    function stringToNumArray(str) {
        return AP.map.call(str, function (char) {
            return char.charCodeAt(0);
        });
    }


    sequencer.protectedScope.saveToMidiFile = write;
    sequencer.saveSongAsMidiFile = write;

}
