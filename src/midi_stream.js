/* 
	Wrapper for accessing strings through sequential reads 
	
	based on: https://github.com/gasman/jasmid
	adapted to work with ArrayBuffer -> Uint8Array
*/

function midiStream() {

	'use strict';

	var fcc = String.fromCharCode;

	// buffer is Uint8Array
	function createStream(buffer) {
		var position = 0;

		/* read string or any number of bytes */
		function read(length, toString) {
			var result, i;
			toString = toString === undefined ? true : toString;

			if (toString) {
				result = '';
				for (i = 0; i < length; i++ , position++) {
					result += fcc(buffer[position]);
				}
				return result;
			} else {
				result = [];
				for (i = 0; i < length; i++ , position++) {
					result.push(buffer[position]);
				}
				return result;
			}
		}

		/* read a big-endian 32-bit integer */
		function readInt32() {
			var result = (
				(buffer[position] << 24) +
				(buffer[position + 1] << 16) +
				(buffer[position + 2] << 8) +
				buffer[position + 3]
			);
			position += 4;
			return result;
		}

		/* read a big-endian 16-bit integer */
		function readInt16() {
			var result = (
				(buffer[position] << 8) +
				buffer[position + 1]
			);
			position += 2;
			return result;
		}

		/* read an 8-bit integer */
		function readInt8(signed) {
			var result = buffer[position];
			if (signed && result > 127) result -= 256;
			position += 1;
			return result;
		}

		function eof() {
			return position >= buffer.length;
		}

		/* read a MIDI-style variable-length integer
			(big-endian value in groups of 7 bits,
			with top bit set to signify that another byte follows)
		*/
		function readVarInt() {
			var result = 0;
			while (true) {
				var b = readInt8();
				if (b & 0x80) {
					result += (b & 0x7f);
					result <<= 7;
				} else {
					/* b is the last byte */
					return result + b;
				}
			}
		}

		return {
			'eof': eof,
			'read': read,
			'readInt32': readInt32,
			'readInt16': readInt16,
			'readInt8': readInt8,
			'readVarInt': readVarInt
		};
	}

	sequencer.protectedScope.createStream = createStream;

}

