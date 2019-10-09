function audioRecorderWorker() {

    'use strict';

    function createWorker() {

        var
            data,
            bufferIndexStart,
            bufferIndexEnd,
            planarSamples,
            interleavedSamples,
            numFrames,
            recBuffersLeft,
            recBuffersRight,
            sampleRate,
            numberOfChannels;

        self.onmessage = function (e) {
            switch (e.data.command) {
                case 'init':
                    sampleRate = e.data.sampleRate;
                    numFrames = 0;
                    recBuffersLeft = [];
                    recBuffersRight = [];
                    break;
                case 'record_mono':
                    numberOfChannels = 1;
                    recBuffersLeft.push(e.data.buffer);
                    numFrames += e.data.buffer.length;
                    break;
                case 'record_stereo':
                    numberOfChannels = 2;
                    recBuffersLeft.push(e.data.buffer[0]);
                    recBuffersRight.push(e.data.buffer[1]);
                    numFrames += e.data.buffer[0].length;
                    break;
                case 'get_wavfile':
                    bufferIndexStart = e.data.bufferIndexStart;
                    bufferIndexEnd = e.data.bufferIndexEnd;
                    data = {
                        id: 'new',
                        wavArrayBuffer: getWavFile(),
                        interleavedSamples: interleavedSamples
                    };
                    self.postMessage(data, [data.wavArrayBuffer, data.interleavedSamples.buffer]);
                    /*
                    // funny: this is something different
                    data = {
                        id: 'new',
                        wavArrayBuffer: getWavFile(),
                        interleavedSamples: interleavedSamples.buffer
                    };
                    self.postMessage(data, [data.wavArrayBuffer, data.interleavedSamples]);
                    */
                    break;
                case 'get_wavfile2':
                    bufferIndexStart = e.data.bufferIndexStart;
                    bufferIndexEnd = e.data.bufferIndexEnd;
                    data = getWavFile2();
                    data.id = 'new';
                    self.postMessage(data, [data.planarSamples, data.interleavedSamples, data.wavArrayBuffer]);
                    break;
                case 'update_wavfile':
                    bufferIndexStart = e.data.bufferIndexStart;
                    bufferIndexEnd = e.data.bufferIndexEnd;
                    //interleavedSamples = new Float32Array(e.data.samples);
                    interleavedSamples = e.data.samples;
                    data = {
                        id: 'update',
                        wavArrayBuffer: updateWavFile()
                    };
                    self.postMessage(data, [data.wavArrayBuffer]);
                    break;
            }
        };


        function getWavFile() {
            var dataview, i, index = 0, result;

            if (numberOfChannels === 1) {
                interleavedSamples = mergeBuffers(recBuffersLeft, numFrames);
            } else if (numberOfChannels === 2) {
                interleavedSamples = toInterleavedBuffer(
                    mergeBuffers(recBuffersLeft, numFrames),
                    mergeBuffers(recBuffersRight, numFrames)
                );
            }

            //console.log('1:' + interleavedSamples.length);
            if (bufferIndexEnd > 0 || bufferIndexStart > 0) {
                if (bufferIndexEnd === -1) {
                    bufferIndexEnd = interleavedSamples.length;
                }

                result = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);

                for (i = bufferIndexStart; i < bufferIndexEnd; i++) {
                    result[index++] = interleavedSamples[i];
                }
                interleavedSamples = result;
            }
            //console.log('2:' + interleavedSamples.length);

            dataview = encodeWAV(interleavedSamples);
            return dataview.buffer;
        }


        function updateWavFile() {
            var dataview, i, result, index = 0;
            //console.log(bufferIndexStart + ':' + interleavedSamples);

            if (bufferIndexEnd === -1) {
                bufferIndexEnd = interleavedSamples.length;
            }
            result = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);
            for (i = bufferIndexStart; i < bufferIndexEnd; i++) {
                result[index++] = interleavedSamples[i];
            }
            dataview = encodeWAV(result);
            return dataview.buffer;
        }


        function mergeBuffers(recBuffers, numFrames) {
            var result = new Float32Array(numFrames);
            var offset = 0;
            for (var i = 0, maxi = recBuffers.length; i < maxi; i++) {
                result.set(recBuffers[i], offset);
                offset += recBuffers[i].length;
            }
            return result;
        }


        function toInterleavedBuffer(inputL, inputR) {
            var length = inputL.length + inputR.length,
                result = new Float32Array(length),
                index = 0,
                inputIndex = 0;

            while (index < length) {
                result[index++] = inputL[inputIndex];
                result[index++] = inputR[inputIndex];
                inputIndex++;
            }
            return result;
        }


        function toPlanarBuffer(inputL, inputR) {
            var length = inputL.length,
                result = new Float32Array(length * 2),
                index = 0,
                inputIndex = 0;

            while (index < length) {
                result[index++] = inputL[inputIndex++];
            }

            index = 0;
            while (index < length) {
                result[index++] = inputR[inputIndex++];
            }
            return result;
        }


        function floatTo16BitPCM(output, offset, input) {
            for (var i = 0; i < input.length; i++ , offset += 2) {
                var s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        }


        function writeString(view, offset, string) {
            for (var i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }


        // see: https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
        // samples is a Float32Array
        function encodeWAV(samples) {
            var bitsPerSample = 16,
                bytesPerSample = bitsPerSample / 8,
                buffer = new ArrayBuffer(44 + samples.length * bytesPerSample),
                view = new DataView(buffer);

            /* RIFF identifier */
            writeString(view, 0, 'RIFF');
            /* RIFF chunk length */
            view.setUint32(4, 36 + samples.length * bytesPerSample, true);
            /* RIFF type */
            writeString(view, 8, 'WAVE');
            /* format chunk identifier */
            writeString(view, 12, 'fmt ');
            /* format chunk length */
            view.setUint32(16, 16, true);
            /* sample format (raw) */
            view.setUint16(20, 1, true);
            /* channel count */
            view.setUint16(22, numberOfChannels, true);
            /* sample rate */
            view.setUint32(24, sampleRate, true);
            /* byte rate (sample rate * block align) */
            view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
            /* block align (channel count * bytes per sample) */
            view.setUint16(32, numberOfChannels * bytesPerSample, true);
            /* bits per sample */
            view.setUint16(34, bitsPerSample, true);
            /* data chunk identifier */
            writeString(view, 36, 'data');
            /* data chunk length */
            view.setUint32(40, samples.length * bytesPerSample, true);

            floatTo16BitPCM(view, 44, samples);

            return view;
        }


        function getWavFile2() {
            var dataview, i, index = 0,
                resultLeft, resultRight,
                mergedBuffersLeft, mergedBuffersRight;

            if (numberOfChannels === 1) {
                mergedBuffersLeft = mergeBuffers(recBuffersLeft, numFrames);
            } else if (numberOfChannels === 2) {
                mergedBuffersLeft = mergeBuffers(recBuffersLeft, numFrames);
                mergedBuffersRight = mergeBuffers(recBuffersRight, numFrames);
            }

            //console.log('1:' + mergedBufferLeft.length);
            if (bufferIndexEnd > 0 || bufferIndexStart > 0) {
                if (bufferIndexEnd === -1) {
                    bufferIndexEnd = mergedBuffersLeft.length;
                }

                resultLeft = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);
                if (numberOfChannels === 2) {
                    resultRight = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);
                }

                for (i = bufferIndexStart; i < bufferIndexEnd; i++) {
                    resultLeft[index] = mergedBuffersLeft[i];
                    if (numberOfChannels === 2) {
                        resultRight = mergedBuffersRight[i];
                    }
                    index++;
                }
            }
            //console.log('2:' + mergedBufferLeft.length);

            if (numberOfChannels === 1) {
                planarSamples = mergedBuffersLeft;
                interleavedSamples = new Float32Array(numFrames);
                //planarSamples.copyWithin(interleavedSamples, 0);
                for (i = 0; i < numFrames; i++) {
                    interleavedSamples[i] = planarSamples[i];
                }
            } else if (numberOfChannels === 2) {
                planarSamples = toPlanarBuffer(mergedBuffersLeft, mergedBuffersRight);
                interleavedSamples = toInterleavedBuffer(mergedBuffersLeft, mergedBuffersRight);
            }

            dataview = encodeWAV(interleavedSamples);

            return {
                planarSamples: planarSamples.buffer,
                interleavedSamples: interleavedSamples.buffer,
                wavArrayBuffer: dataview.buffer
            };
        }

    }

    sequencer.protectedScope.createAudioRecorderWorker = function () {
        var blobURL = URL.createObjectURL(new Blob(['(', createWorker.toString(), ')()'], { type: 'application/javascript' }));
        return new Worker(blobURL);
    };

}