/*
    depends on sox, see: http://sox.sourceforge.net/
*/

'use strict';

var
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    wavereader = require('./read_wave'),

    dryrun = false,
    soxPath,

    elements,
    numElements,

    lowestNote = 128,
    highestNote = 0,
    noteRange,

    groupLovel,
    groupHivel,
    groupRelease,
    groupIndex,

    regionLovel,
    regionHivel,
    regionKey,
    regionLokey,
    regionHikey,
    regionKeyCenter,
    regionTune,

    tmpDir,

    instrument,
    samplepack,

    pitch,
    sampleName,
    sampleExtension,
    convertBitRate,

    hasSustainLoop,
    sustainLoop,
    trimSample,
    trimEnd,
    trimmed,

    keyscalingPanning,
    keyscalingRelease,
    releaseEnvelope,
    releaseDuration,
    limitKeyRange,
    limitLoKey,
    limitHiKey,
    config,

    soxPath,
    samplePath,
    sfzFileDir,
    instrumentName,
    samplePackName,
    compressionType,
    compressionLevel,

    noteNames = {
        'sharp' : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'flat' : ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    };


function parse(sox, sfz, cfg, callback){
    var i, key, element, filesize,
        samplepackFolder,
        diff = false, // if diff is true it means that different groups use different values for ampeg_release
        groups = [];  // here we store all different ampeg_release values (and in future other supported opcodes)

    //console.log('parse szf:', sox, sfz, cfg);

    soxPath = sox;
    config = cfg;
    elements = sfz.elements;
    numElements = elements.length;

    //soxPath = config.sox;
    sfzFileDir = sfz.file_dir;
    tmpDir = config.tmp_dir;

    keyscalingPanning = config.key_scaling_panning !== false;
    keyscalingRelease = config.key_scaling_release !== false;
    limitKeyRange = config.limit_keyrange !== false;
    releaseEnvelope = config.release_envelope;

    instrumentName = config.instrument_name || sfz.file_name;
    samplePackName = config.samplepack_name || sfz.file_name;

    compressionType = config.compression_type;
    compressionLevel = parseFloat(config.compression_level, 10);

    trimSample = config.trim === 'true' || config.trim === true;
    hasSustainLoop = undefined;
    convertBitRate = undefined;


    samplepackFolder = config.samplepack_folder + '/' + samplePackName;
    if(samplepackFolder.indexOf('/') === 0){
        samplepackFolder = samplepackFolder.substring(1);
    }

    instrument = {
        type: 'instrument',
        name: instrumentName,
        folder: config.instrument_folder,
        sample_path: samplepackFolder,
        keyrange: []
    };

    samplepack = {
        type: 'samplepack',
        name: samplePackName,
        folder: config.samplepack_folder,
        compression_type: compressionType,
        compression_level: compressionLevel,
        keyrange: [],
        filesize: 0
    };

    if(sfz.global.sustain !== undefined){
        // only for Groovy instruments!
        instrument.sustain = sfz.global.sustain;
        //console.log('sfz', sustain);
    }else if(config.sustain !== undefined){
        instrument.sustain = config.sustain === 'true';
        //console.log('cfg', sustain);
    }
    //console.log(sfz.file_name, sustain, 'sfz', sfz.global.sustain, 'cfg', config.sustain);


    if(keyscalingRelease !== true){
        if(config.release_duration !== undefined){
            instrument.release_duration = config.release_duration;
        }else if(sfz.global.ampeg_release !== undefined){
            instrument.release_duration = sfz.global.ampeg_release * 1000;
        }else{
            for(i = numElements - 1; i >= 0; i--){
                element = elements[i];
                //console.log(element);
                if(element.type === 'group'){
                    if(element.ampeg_release !== undefined){
                        groups.push({
                            release: element.ampeg_release
                        });
                        //console.log(element.ampeg_release, element.ampeg_release === undefined);
                        if(releaseDuration !== undefined && releaseDuration !== element.ampeg_release){
                            // we can't set a release value for the entire instrument so set diff to true
                            diff = true;
                        }else{
                            releaseDuration = element.ampeg_release;
                        }
                    }
                }
            }
            if(diff !== true){
                releaseDuration *= 1000;
                instrument.release_duration = releaseDuration;
            }else{
                releaseDuration = undefined;
                instrument.groups = groups;
            }
        }
    }else{
        keyscalingRelease = config.key_scaling_release.replace(/\s/, '').split(',');
        instrument.keyscaling_release = keyscalingRelease;
    }

    // if diff is false we can set a release envelope for the entire instrument -> needs rethinking, guess it is always possible to set a global envelope type
    if(diff === false){
        instrument.release_envelope = releaseEnvelope;
    }

    if(keyscalingPanning !== false){
        keyscalingPanning = config.key_scaling_panning.replace(/\s/, '').split(',');
        instrument.keyscaling_panning = keyscalingPanning;
    }

    if(limitKeyRange !== false){
        limitKeyRange = config.limit_keyrange.replace(/\s/, '').split(',');
        limitLoKey = parseInt(limitKeyRange[0], 10);
        limitHiKey = parseInt(limitKeyRange[1], 10);
    }

    // add other keys
    for(i in config){
        if(config.hasOwnProperty(i)){
            if(i.indexOf('instrument_') === 0){
                key = i.replace('instrument_', '');
                if(instrument[key] === undefined){
                    instrument[key] = config[i];
                }
            }else if(i.indexOf('samplepack_') === 0){
                key = i.replace('samplepack_', '');
                if(samplepack[key] === undefined){
                    samplepack[key] = config[i];
                }
            }
        }
    }

    // add mapping as the last key to make the json file better readably
    instrument.mapping = {};
    samplepack.mapping = {};

    groupIndex = -1;

    loopElements(0, function(){

        if(limitKeyRange !== false){
            if(lowestNote < limitLoKey){
                lowestNote = limitLoKey;
            }
            if(highestNote > limitHiKey){
                highestNote = limitHiKey;
            }
        }

        noteRange = highestNote - lowestNote;
        //console.log('lowest', lowestNote, 'highest', highestNote, 'range', noteRange);
        setKeyScalingPanning();
        setKeyScalingRelease();
        instrument.keyrange = [lowestNote, highestNote];
        samplepack.keyrange = [lowestNote, highestNote];
        filesize = JSON.stringify(samplepack).length;
        samplepack.filesize = filesize + filesize.toString().length;
        callback(instrument, samplepack);
    });
}


function loopElements(index, callback){
    //console.log(index,numElements);
    if(index === numElements){
        callback();
        return;
    }

    var element = elements[index],
        type = element.type,
        numRegions;

    //console.log(type);

    switch(type){
        case 'control':
            samplePath = sanitizePath(element.default_path);
            loopElements(++index, callback);
            //console.log('samplePath', samplePath, element.default_path);
            break;

        case 'region':
            parseRegion(element, function(){
                loopElements(++index, callback);
            });
            break;

        case 'group':
            if(element.trigger === 'release'){
                // not yet supported by heartbeat
                loopElements(++index, callback);
                break;
            }
            groupIndex++;
            lowestNote = 128;
            highestNote = 0;
            numRegions = element.regions.length;
            groupLovel = element.lovel;
            groupHivel = element.hivel;
            if(releaseDuration === undefined){
                groupRelease = element.ampeg_release;
            }
            //console.log(releaseDuration, groupRelease);
            //console.log(groupLovel, groupHivel);
            if(groupHivel === undefined && groupLovel !== undefined){
                groupLovel = parseInt(groupLovel, 10);
                groupHivel = 127;
            }else if(groupHivel !== undefined && groupLovel === undefined){
                groupLovel = 0;
                groupHivel = parseInt(groupHivel, 10);
            }else if(groupHivel !== undefined && groupLovel !== undefined){
                groupLovel = parseInt(groupLovel, 10);
                groupHivel = parseInt(groupHivel, 10);
            }
            //console.log(numRegions, element.regions);
            loopRegions(0, numRegions, element.regions, function(){
                loopElements(++index, callback);
            });
            break;

        default:
            loopElements(++index, callback);
    }
}


function sanitizePath(p){
    var sep = path.sep;
    //console.log(sep, p, p.indexOf('/'), p.indexOf('\\'));

    // sfz file has linux/osx-style separator and tool is run on windows
    if(p.indexOf('/') !== -1 && sep === '\\'){
        p = p.replace(/\//g, '\\');
    }

    // sfz file has windows-style separator and tool is run on linux/osx
    else if(p.indexOf('\\') !== -1 && sep === '/'){
        p = p.replace(/\\/g, '/');
    }

    return p;
}


function loopRegions(index, max, regions, callback){
    // console.log('    ', index, max);
    if(index === max){
        callback();
        return;
    }

    parseRegion(regions[index], function(){
        loopRegions(++index, max, regions, callback);
    });
}


function parseRegion(region, callback){
    var p,
        sample = sanitizePath(region.sample);

    //console.log('parseRegion', region.sample);

    regionKey = convertNameToNumber(region.key);
    regionLokey = convertNameToNumber(region.lokey);
    regionHikey = convertNameToNumber(region.hikey);
    regionKeyCenter = convertNameToNumber(region.pitch_keycenter);
    regionLovel = region.lovel;
    regionHivel = region.hivel;
    regionTune = region.tune;

    if(regionLokey !== undefined && regionHikey !== undefined){
        regionLokey = parseInt(regionLokey, 10);
        regionHikey = parseInt(regionHikey, 10);
        if(regionKeyCenter === undefined){
            regionKeyCenter = 60;
        }else{
            regionKeyCenter = parseInt(regionKeyCenter, 10);
        }
    }else if(regionLokey === undefined && regionHikey !== undefined){
        if(regionKeyCenter === regionHikey){
            regionLokey = regionHikey;
        }
        regionLokey = parseInt(regionLokey, 10);
        regionHikey = parseInt(regionHikey, 10);
        regionKeyCenter = parseInt(regionKeyCenter, 10);
    }else if(regionLokey !== undefined && regionHikey === undefined){
        if(regionKeyCenter === regionLokey){
            regionHikey = regionLokey;
        }
        regionLokey = parseInt(regionLokey, 10);
        regionHikey = parseInt(regionHikey, 10);
        regionKeyCenter = parseInt(regionKeyCenter, 10);
    }else if(regionKey !== undefined){
        regionKey = parseInt(regionKey, 10);
    }


    if(regionLokey === undefined && regionHikey === undefined && regionKey === undefined){
        regionLokey = 0;
        regionHikey = 127;
        if(regionKeyCenter === undefined){
            regionKeyCenter = 60;
        }else{
            regionKeyCenter = parseInt(regionKeyCenter, 10);
        }
    }


    if(regionHivel === undefined && regionLovel !== undefined){
        regionLovel = parseInt(regionLovel, 10);
        regionHivel = 127;
    }else if(regionHivel !== undefined && regionLovel === undefined){
        regionLovel = 0;
        regionHivel = parseInt(regionHivel, 10);
    }else if(regionHivel !== undefined && regionLovel !== undefined){
        regionLovel = parseInt(regionLovel, 10);
        regionHivel = parseInt(regionHivel, 10);
    }
    //console.log(regionLovel, regionHivel);

    //console.log('samplePath', samplePath);
    if(samplePath !== undefined){
        // check if a path is set by a <control> tag
        p = path.resolve(samplePath, sample);
        //console.log(1, p);
    }
    if(fs.existsSync(p) === false){
        // check if it is an absolute path
        p = path.resolve(sample);
        //console.log(2, p);
    }
    if(fs.existsSync(p) === false){
        // check if it is a relative path
        p = path.resolve(sfzFileDir, sample);
        //console.log(3, p);
    }
    if(fs.existsSync(p) === false){
        console.log('sample does not exist', sample);
        callback(false);
        return;
    }

    sample = p;
    sampleExtension = path.extname(sample);
    sampleName = path.basename(sample, sampleExtension);
    sampleExtension = sampleExtension.substring(1);
    //console.log(sampleName, sampleExtension);

    //console.log(regionKeyCenter, regionHikey, regionLokey);

    if(regionHikey === regionLokey){
        regionKeyCenter = undefined;
    }

    if(regionTune !== undefined){
        regionTune = parseInt(regionTune, 10);
        if(regionLokey === undefined){
            regionLokey = regionKey;
        }
        if(regionKeyCenter === undefined){
            regionKeyCenter = regionLokey;
        }
        if(regionHikey === undefined){
            regionHikey = regionKeyCenter;
        }
    }


    if(regionKeyCenter !== undefined){
        getSustainLoop(sample);
        if(hasSustainLoop !== false){
            console.warn(sampleName, 'sustain loops get corrupted when the sample is transposed!');
        }

        pitch = regionLokey;
        lowestNote = pitch < lowestNote ? pitch : lowestNote;
        highestNote = pitch > highestNote ? pitch : highestNote;

        transposeLoop(sample, function(){
            callback();
        });
    }else{
        getSustainLoop(sample);
        trimmed = false;

        pitch = regionKey || regionLokey;
        lowestNote = pitch < lowestNote ? pitch : lowestNote;
        highestNote = pitch > highestNote ? pitch : highestNote;

        if(pitch < limitLoKey || pitch > limitHiKey){
            callback();
            return;
        }
        //console.log(pitch, groupLovel, groupHivel);
        processSample(sample, 0, function(result){
            if(result !== false){
                addToSamplePack(sampleName, result);
                addToInstrument(sampleName);
            }
            callback();
        });
    }
}


function addToSamplePack(id, base64){

    if(hasSustainLoop === false && groupRelease === undefined){
        //samplepack.mapping[id] = base64.substring(0,10);
        samplepack.mapping[id] = base64;
        return;
    }


    samplepack.mapping[id] = {
        //d: base64.substring(0,10),
        d: base64
    };

    if(hasSustainLoop !== false){
        samplepack.mapping[id].s = sustainLoop;
    }

    if(groupRelease !== undefined){
        samplepack.mapping[id].g = groupIndex;
        // quick fix:
        instrument.release_duration = groupRelease;
    }

    //console.log(id, samplepack.mapping[id], groupRelease);
}


function addToInstrument(id){
    var map = {
        n: id
    };

    if(regionHivel !== undefined || groupHivel !== undefined){
        if(instrument.mapping[pitch] === undefined){
            instrument.mapping[pitch] = [];
        }
        //console.log('group', groupLovel, groupHivel);
        //console.log('region', regionLovel, regionHivel);

        // region hivel and lovel overrule group hivel and lovel
        if(regionHivel !== undefined){
            if((regionLovel === 0 && regionHivel === 127) === false){
                map.v = [regionLovel, regionHivel];
                instrument.mapping[pitch].push(map);
                return;
            }
        }else if(groupHivel !== undefined){
            if((groupLovel === 0 && groupHivel === 127) === false){
                map.v = [groupLovel, groupHivel];
                instrument.mapping[pitch].push(map);
                return;
            }
        }
    }
    instrument.mapping[pitch] = map;
}


function getSustainLoop(sample){
    // this means that if the instrument has sustain set to false, the script won't look for
    // sustain loops in the samples, saves time but I'm not sure if this is okay.
    if(instrument.sustain === false){
        /*
        if(hasSustainLoop === undefined){
            console.log(wavereader.getSustainLoop(sample));
        }
        */
        hasSustainLoop = false;
        return;
    }

    if(hasSustainLoop === false){
        return;
    }

    else if(hasSustainLoop === undefined){
        sustainLoop = wavereader.getSustainLoop(sample);
        hasSustainLoop = sustainLoop !== false;
        if(trimSample === true && hasSustainLoop === true){
            // trim the sample from 0 to the end of the sustain loop
            trimEnd = sustainLoop[1]/1000;
        }
    }

    else if(hasSustainLoop === true){
        trimEnd = undefined;
        sustainLoop = wavereader.getSustainLoop(sample);
        if(trimSample === true){
            trimEnd = sustainLoop[1]/1000;
        }
    }
}


function transposeLoop(sample, callback){
    //console.log('   transpose', pitch);
    if(pitch > regionHikey){
        callback();
        return;
    }

    var cents = (pitch - regionKeyCenter) * 100,
        id;

    if(regionTune !== undefined){
        cents += regionTune;
        //console.log(cents, regionTune);
    }

    trimmed = false;

    processSample(sample, cents, function(result){
        if(result !== false){
            id = sampleName + '_' + pitch;
            addToSamplePack(id, result);
            addToInstrument(id);
        }
        pitch++;
        transposeLoop(sample, callback);
    });
}


function processSample(sample, cents, callback){

    if(dryrun === true){
        callback('TWAAAP');
        return;
    }

    var cmd, tmpFile, data, base64;

    if(convertBitRate === undefined){
        cmd = soxPath + ' --i -B \'' + sample + '\'';
        //console.log(cmd);
        runSox(cmd, function(result, output, error){
            if(error !== undefined){
                console.error('error getting sample info', error, output);
                callback(false);
            }else{
                //console.log(output);
                convertBitRate = output;
                processSample(sample, 0, callback);
            }
        });
    }

    else if(cents !== 0){
        tmpFile = path.resolve(tmpDir, 'tmp.' + sampleExtension);
        cmd = soxPath + ' \'' + sample + '\' \'' + tmpFile + '\' pitch -q ' + cents;
        //console.log('transpose:', cmd);
        runSox(cmd, function(result, output, error){
            if(error !== undefined){
                console.error('error transposing sample', error, output);
                if(fs.existsSync(tmpFile) !== false){
                    fs.unlinkSync(tmpFile);
                }
                callback(false);
            }else{
                processSample(tmpFile, 0, callback);
            }
        });
    }

    else if(trimEnd !== undefined && trimmed === false){
        tmpFile = path.resolve(tmpDir, 'tmp.' + sampleExtension);
        cmd = soxPath + ' \'' + sample + '\' \'' + tmpFile + '\' trim 0 ' + trimEnd;
        //console.log('trim:', cmd);
        runSox(cmd, function(result, output, error){
            trimmed = true;
            if(error !== undefined){
                console.error('error trimming sample', error, output);
                if(fs.existsSync(tmpFile) !== false){
                    fs.unlinkSync(tmpFile);
                }
                callback(false);
            }else{
                processSample(tmpFile, 0, callback);
            }
        });
    }

    //else if(sampleExtension !== compressionType){
    else if(compressionLevel !== undefined){
        tmpFile = path.resolve(tmpDir, 'tmp.' + compressionType);
        cmd = soxPath + ' \'' + sample + '\' -C ' + compressionLevel + ' \'' + tmpFile + '\'';
        //console.log('compress:', cmd);
        runSox(cmd, function(result, output, error){
            if(error !== undefined){
                console.error('error compressing sample', error, output);
                if(fs.existsSync(tmpFile) !== false){
                    fs.unlinkSync(tmpFile);
                }
                callback(false);
            }else{
                data = fs.readFileSync(tmpFile);
                base64 = data.toString('base64');
                data = undefined;
                fs.unlinkSync(tmpFile);
                callback(base64);
            }
        });
    }

    else{
        data = fs.readFileSync(sample);
        base64 = data.toString('base64');
        data = undefined;
        callback(base64);
    }
}


function runSox(cmd, callback){
    exec(cmd, function (error, stdout, stderr) {
        //console.log('SOX', error);
        //console.log(stdout);
        //console.log(stderr);
        if(!error){
            callback(true, stdout);
        }else{
            callback(error, stdout, stderr);
        }
    });
}


function setKeyScalingPanning(){
    if(keyscalingPanning === false){
        return;
    }

    var panStep = (keyscalingPanning[1] - keyscalingPanning[0]) / noteRange,
        currentPan = parseFloat(keyscalingPanning[0]),
        i, data;

    //console.log(panStep, currentPan);

    for(i = lowestNote; i <= highestNote; i++){
        data = instrument.mapping[i];
        if(typeString(data) === 'array'){
            data.forEach(function(m){
                m.p = currentPan;
            });
        }else{
            data.p = currentPan;
        }
        currentPan += panStep;
    }
}


function setKeyScalingRelease(){
    if(keyscalingRelease === false){
        return;
    }

    var releaseStep = (keyscalingRelease[1] - keyscalingRelease[0]) / noteRange,
        currentRelease = parseFloat(keyscalingRelease[0]),
        i, data;

    //console.log('setKeyScalingRelease', keyscalingRelease, releaseStep, currentRelease, instrument.mapping);

    for(i = lowestNote; i <= highestNote; i++){
        data = instrument.mapping[i];
        if(typeString(data) === 'array'){
            data.forEach(function(m){
                //console.log(m, currentRelease);
                //m.r = [currentRelease, releaseEnvelope];
                m.r = currentRelease;
            });
        }else{
            //data.r = [currentRelease, releaseEnvelope];
            data.r = currentRelease;
            //console.log(data.r, currentRelease);
        }
        currentRelease += releaseStep;
    }
}


function convertNameToNumber(name){
    if(name === undefined){
        return name;
    }

    if(isNaN(name) === false){
        return name;
    }


    var key, index, i, maxi, number, mode,
        length = name.length,
        octave = name.substring(length - 1);

    name = name.toUpperCase().substring(0, length - 1);
    //console.log(name, octave);

    for(key in noteNames) {
        if(noteNames.hasOwnProperty(key)){
            mode = noteNames[key];
            //console.log(key);
            for(i = 0, maxi = mode.length; i < maxi; i = i + 1) {
                //console.log(mode[i],name,i);
                if(mode[i] === name) {
                    index = i;
                    break;
                }
            }
        }
    }

    if(index === -1) {
        return false;
    }

    //number = (index + 12) + (octave * 12) + 12; // → in Cubase central C = C3 instead of C4
    number = (index + 12) + (octave * 12);// → midi standard + scientific naming, see: http://en.wikipedia.org/wiki/Middle_C and http://en.wikipedia.org/wiki/Scientific_pitch_notation
    //console.log(name, '->', number);
    return number;
}


function typeString(o){
    if(typeof o != 'object'){
        return typeof o;
    }

    if(o === null){
        return 'null';
    }

    //object, array, function, date, regexp, string, number, boolean, error
    var internalClass = Object.prototype.toString.call(o).match(/\[object\s(\w+)\]/)[1];
    return internalClass.toLowerCase();
}


module.exports = {
    parse: parse
};