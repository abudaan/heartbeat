'use strict';

var
    fs = require('fs'),
    totalBytes;


function readChunk(fd, position, size, type){
    if ((position + size) > totalBytes) {
        size = (size - position);
    }
    var buffer = new Buffer(size);
    fs.readSync(fd, buffer, 0, size, position);

    switch(type){
        case 'string':
            return buffer.toString('utf8', 0, size);
            break;
        case 'number':
            if(size === 2){
                return buffer.readUInt16LE(0, size);
            }else if(size === 4){
                return buffer.readUInt32LE(0, size);
            }
            break;
        case 'buffer':
            return buffer;
    }
}


function getSustainLoop(fd){
    var id, length,
        sampleRate, loop = [],
        bytesRead = 12;

    while (bytesRead < totalBytes) {

        id = readChunk(fd, bytesRead, 4, 'string');
        bytesRead += 4;
        length = readChunk(fd, bytesRead, 4, 'number');
        //console.log(id, length);

        if(id === 'fmt '){
            //4 length
            //2 compression code
            //2 number of channels
            bytesRead += 8;
            sampleRate = readChunk(fd, bytesRead, 4, 'number');
            //4 sample rate
            //4 average bytes per second
            //2 block align
            //2 significant bits per sample
            bytesRead += 12;

            if(length === 18){
                //2 Extra format bytes
                bytesRead += 2;
            }

            if(length === 40){
                //2 wValidBitsPerSample
                //4 dwChannelMask
                //16 SubFormat
                bytesRead += 22;
            }
        }else if(id === 'smpl'){
            //4 length
            //4 Manufacturer
            //4 Product
            //4 Sample Period
            //4 MIDI Unity Note
            //4 MIDI Pitch Fraction
            //4 SMPTE Format
            //4 SMPTE Offset
            //4 Num Sample Loops
            //4 Sampler Data
            //4 Cue Point ID
            //4 Type
            bytesRead += 48;

            //loop start
            loop.push((readChunk(fd, bytesRead, 4, 'number')/sampleRate) * 1000);
            bytesRead += 4;

            //loop end
            loop.push((readChunk(fd, bytesRead, 4, 'number')/sampleRate) * 1000);
            bytesRead += 4;

            // we're done here!
            //console.log(bytesRead, totalBytes);
            bytesRead = totalBytes;

            //4 Fraction
            //4 Play Count
            bytesRead += 8;
        }else{
            //4 length
            bytesRead += length + 4;
        }
    }

    if(loop.length === 0){
        loop = false;
    }else if(loop[0] === 0 && loop[1] === 0){
        loop = false;
    }

    return loop;
}


function openFileSync(file){
    var fd = fs.openSync(file, 'r'),
        stat = fs.statSync(file),
        loop;

    //console.log(fd);

    if(fd === undefined){
        console.log(fd);
        return false;
    }

    if(readChunk(fd, 0, 4, 'string') !== 'RIFF'){
        return false;
    }

    totalBytes = stat.size;

    loop = getSustainLoop(fd);
    fs.close(fd);
    return loop;
}


module.exports = {
    getSustainLoop: function(file){
        return openFileSync(file);
    }
};
