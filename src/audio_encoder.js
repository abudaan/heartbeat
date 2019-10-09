function audioEncoder() {

    'use strict';

    var
        self,
        importScripts,
        Lame,

        // import
        encode64, // defined in util.js
        base64EncArr, // defined in util.js
        context, // defined in open_module.js

        oggEncoder,
        mp3Encoder;


    function encodeAudio(audioBuffer, type, bitrate, callback) {

        if (type === 'mp3') {

            var interleavedSamples = getInterleavedSamples(audioBuffer);

            bitrate = bitrate || sequencer.bitrate_mp3_encoding; //kbps

            if (mp3Encoder === undefined) {
                mp3Encoder = createWorker();
                mp3Encoder.onmessage = function (e) {
                    if (e.data.cmd === 'data') {
                        //console.log(e);
                        callback({
                            blob: new Blob([new Uint8Array(e.data.buf)], { type: 'audio/mp3' }),
                            base64: base64EncArr(e.data.buf),
                            dataUrl: 'data:audio/mp3;base64,' + encode64(e.data.buf)
                        });
                    }
                };
            }

            mp3Encoder.postMessage({
                cmd: 'init',
                config: {
                    mode: 3,
                    channels: 1,
                    samplerate: context.sampleRate,
                    bitrate: bitrate
                }
            });

            mp3Encoder.postMessage({
                cmd: 'encode',
                buf: interleavedSamples
            });

            mp3Encoder.postMessage({
                cmd: 'finish'
            });

        } else if (type === 'ogg') {

            if (sequencer.debug >= sequencer.WARN) {
                console.warn('support for ogg is not yet implemented');
            }
            callback(false);

        } else {

            if (sequencer.debug >= sequencer.WARN) {
                console.warn('unsupported type', type);
            }
            callback(false);
        }
    }


    function getInterleavedSamples(audioBuffer) {
        if (audioBuffer.numberOfChannels === 1) {
            return audioBuffer.getChannelData(0);
        }

        if (audioBuffer.numberOfChannels === 2) {
            var left = audioBuffer.getChannelData(0),
                right = audioBuffer.getChannelData(1),
                numFrames = left.length,
                interleaved = new Float32Array(numFrames),
                i, index = 0;

            for (i = 0; i < numFrames; i++) {
                interleaved[index++] = left[i];
                interleaved[index++] = right[i];
            }
            return interleaved;
        }
    }


    function cleanUp() {
        if (mp3Encoder !== undefined) {
            mp3Encoder.terminate();
        }
        if (oggEncoder !== undefined) {
            oggEncoder.terminate();
        }
    }


    // credits: https://nusofthq.com/blog/recording-mp3-using-only-html5-and-javascript-recordmp3-js/
    function encoder() {
        /*
            credits:
                https://github.com/akrennmair/libmp3lame-js/
                https://github.com/kobigurk/libmp3lame-js
        */
        importScripts('https://raw.githubusercontent.com/kobigurk/libmp3lame-js/master/dist/libmp3lame.min.js');
        //importScripts('/heartbeat/src/kobigurk/libmp3lame.min.js');

        var mp3codec,
            mp3data;

        self.onmessage = function (e) {
            switch (e.data.cmd) {
                case 'init':
                    if (!e.data.config) {
                        e.data.config = {};
                    }
                    mp3codec = Lame.init();

                    Lame.set_mode(mp3codec, e.data.config.mode || Lame.JOINT_STEREO);
                    Lame.set_num_channels(mp3codec, e.data.config.channels || 2);
                    Lame.set_num_samples(mp3codec, e.data.config.samples || -1);
                    Lame.set_in_samplerate(mp3codec, e.data.config.samplerate || 44100);
                    Lame.set_out_samplerate(mp3codec, e.data.config.samplerate || 44100);
                    Lame.set_bitrate(mp3codec, e.data.config.bitrate || 128);

                    Lame.init_params(mp3codec);
                    /*
                    console.log('Version :'+ Lame.get_version() + ' / ' +
                        'Mode: ' + Lame.get_mode(mp3codec) + ' / ' +
                        'Samples: ' + Lame.get_num_samples(mp3codec)  + ' / '  +
                        'Channels: ' + Lame.get_num_channels(mp3codec)  + ' / ' +
                        'Input Samplate: ' + Lame.get_in_samplerate(mp3codec) + ' / ' +
                        'Output Samplate: ' + Lame.get_in_samplerate(mp3codec) + ' / ' +
                        'Bitlate :' + Lame.get_bitrate(mp3codec) + ' / ' +
                        'VBR :' + Lame.get_VBR(mp3codec));
                    */
                    break;
                case 'encode':
                    //console.log('encode');
                    mp3data = Lame.encode_buffer_ieee_float(mp3codec, e.data.buf, e.data.buf);
                    self.postMessage({ cmd: 'data', buf: mp3data.data });
                    break;
                case 'finish':
                    //console.log('finish');
                    mp3data = Lame.encode_flush(mp3codec);
                    self.postMessage({ cmd: 'end', buf: mp3data.data });
                    Lame.close(mp3codec);
                    mp3codec = null;
                    break;
            }
        };
    }


    function createWorker() {
        var blob = new Blob(['(', encoder.toString(), ')()'], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
    }

    sequencer.encodeAudio = encodeAudio;
    sequencer.protectedScope.cleanupAudioEncoder = cleanUp;

    sequencer.protectedScope.addInitMethod(function () {
        encode64 = sequencer.util.encode64;
        base64EncArr = sequencer.util.base64EncArr;
        context = sequencer.protectedScope.context;
    });

}




/*
    //not needed anymore because we use AudioBuffer for input

    function parseWav(wav) {
        function readInt(i, bytes) {
            var ret = 0,
                shft = 0;

            while (bytes) {
                ret += wav[i] << shft;
                shft += 8;
                i++;
                bytes--;
            }
            return ret;
        }
        if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
        if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
        return {
            sampleRate: readInt(24, 4),
            bitsPerSample: readInt(34, 2),
            samples: wav.subarray(44)
        };
    }


    function convertUint8ArrayToFloat32Array(u8a){
        var f32Buffer = new Float32Array(u8a.length);
        for (var i = 0; i < u8a.length; i++) {
            var value = u8a[i<<1] + (u8a[(i<<1)+1]<<8);
            if (value >= 0x8000) value |= ~0x7FFF;
            f32Buffer[i] = value / 0x8000;
        }
        return f32Buffer;
    }
*/
