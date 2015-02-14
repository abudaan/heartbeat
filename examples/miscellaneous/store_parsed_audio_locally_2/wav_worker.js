
'use strict';

var numberOfChannels,
    sampleRate;

// see: https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
// samples is a Float32Array
function encodeWAV(samples){
    var bitsPerSample = 16,
        bytesPerSample = bitsPerSample/8,
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



function writeString(view, offset, string){
    for (var i = 0; i < string.length; i++){
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}


function floatTo16BitPCM(output, offset, input){
    for (var i = 0; i < input.length; i++, offset+=2){
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}


function toInterleavedBuffer(inputL, inputR){
    var length = inputL.length + inputR.length,
        result = new Float32Array(length),
        index = 0,
        inputIndex = 0;

    while(index < length){
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}

self.addEventListener('message', function(e){
    sampleRate = e.data.sample_rate;
    numberOfChannels = e.data.num_channels;

    var samplesLeftChannel = e.data.samples_left_channel,
        samplesRightChannel = e.data.samples_right_channel,
        interLeaved, data;

    if(numberOfChannels === 2){
        interLeaved = toInterleavedBuffer(samplesLeftChannel, samplesRightChannel);
    }else if(numberOfChannels === 1){
        interLeaved = samplesLeftChannel;
    }
    data = {
        id: e.data.id,
        buffer: encodeWAV(interLeaved).buffer
    };
    self.postMessage(data, [data.buffer]);
}, false);
