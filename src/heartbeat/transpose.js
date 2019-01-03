function transpose() {

    'use strict';

    var
        // satisfy jslint
        Pitchshift = window.Pitchshift,

        context,
        fftFrameSize = 2048,
        shifter;

    function init() {
        if (window.Pitchshift) {
            shifter = new Pitchshift(fftFrameSize, context.sampleRate, 'FFT');
        }
    }


    function transpose(inputBuffer, semitones, cb) {
        if (shifter === undefined) {
            console.log('include Kiev II');
            return;
        }
        if (semitones === 0) {
            if (cb) {
                //console.log(inputBuffer, semitones)
                cb(inputBuffer);
                return;
            }
        }

        var numChannels = inputBuffer.numberOfChannels,
            c, input, length, output, outputs = [], shiftValue, i,
            outputBuffer;

        //console.log(inputBuffer);

        for (c = 0; c < numChannels; c++) {
            input = inputBuffer.getChannelData(c);
            length = input.length;
            output = new Float32Array(length);
            shiftValue = Math.pow(1.0595, semitones);
            //shiftValue = 1.01;
            shifter.process(shiftValue, input.length, 4, input);
            //shifter.process(shiftValue, input.length, 8, input);
            for (i = 0; i < length; i++) {
                output[i] = shifter.outdata[i];
            }
            outputs[c] = output;
        }

        outputBuffer = context.createBuffer(
            numChannels,
            length,
            inputBuffer.sampleRate
        );

        for (c = 0; c < numChannels; c++) {
            outputBuffer.getChannelData(c).set(outputs[c]);
        }

        cb(outputBuffer);
    }

    sequencer.protectedScope.transpose = transpose;

    sequencer.protectedScope.addInitMethod(function () {
        context = sequencer.protectedScope.context;
        init();
    });

}