/*
    USAGE:

    You can pass folders and config files (.cfg extension) to the script. You can pass as many arguments as you like in any order.

    Folders will be scanned for config files and audio files.

    All folders that contain audio files will be converted to a samplepack.

    By default the script looks for wav, flac, ogg and mp3 files, but all audio formats that are supported by your sox installation are supported
    by this script as well.


    With the -format switch you can set the audio format(s) that the script will look for. Multiple formats have to be separated by a comma:

    -format ma4, aiff, mp4


    With the -a or -assetpack switch you can pass an assetpack file; all samplepacks will be added to this assetpack.

    /path/to/samples/ samplepack.cfg -a assetpack.json


    With the -f or -file switch you can pass the name of the file where you want to save a samplepack to. This only works if you add a single
    folder of config file, if you add more than one folder or config file, only the first one found will be converted and saved.


    With the -o or -output switch you can set the folder where the resulting files will be saved.


    If you don't supply an assetpack either by using the -a switch or by providing an assetpack in the config file, all samplepacks will be
    added to a new assetpack, the file name of this assetpack is "assetpack_DD-MM-YYYY.json"

    With the -s or -separate switch you force the script to create separate single samplepack files for every generated samplepack.


    folder2samplepack.js /path/to/samples1/ /path/to/samples2/ /path/to/config_files
        -> samplepacks are generated from the folders and config files that are found in the supplied paths and added to a new assetpack,
            the file name of this assetpack is "assetpack_DD-MM-YYYY.json"

    folder2samplepack.js /path/to/samples1/ -file my_samplepack.json
        -> the first folder found that contains audio files gets converted to a samplepack and stored to the file "my_samplepack.json"

    folder2samplepack.js file1.mid
        -> single asset file is created with the name of the supplied midi file, or the name specified in the config file

    folder2samplepack.js file1.mid -file midifile_asset.json
        -> single asset file is created with supplied name

*/

'use strict';

var
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    args = process.argv,
    getSustainLoop= require('./inc/read_wave').getSustainLoop,

    runDir, // the directory where nodejs is run
    tmpDir, // tmp folder for sox
    outputDir, // the directory where the scripts saves its outputs

    extensions,
    compressionType,
    defaultConfig,

    dryrun = false,

    configFiles = [],
    folders = [],
    samplepack, // the samplepack that is currently being generated

    assetpack, // the asset pack file where the midi file(s) will be added to (not mandatory)
    separateFiles, // if true a separate asset file will created for every file in the arguments list
    samplePackFile, // save the supplied midi or config file to this file

    keys = {
        'author': undefined, // author of the midi file (not necessarily the composer)
        'license': undefined, // copyright, creative commons, etc.
        'compression': undefined, // info about the used compression type and level, e.g. mp3 128kbps
        'info': undefined, // further info that might be insteresting such as creation date
        'output_file': undefined, // the generated samplepack will be saved to this file as samplepack
        'assetpack': undefined, // the generated samplepack will be added to this existing or new assetpack
        'extensions': '.wav .ogg .mp3 .flac', // only look for samples with these extensions (dots can be omitted)
        'compression_type': '.ogg', // samples will be converted before adding them as base64 data to the assetpack
        'compression_level': 4, // compression leven of the chosen target extension
        'input_folder': undefined, // the folder where to look for the samples
        'output_folder': undefined, // the folder where the generated samplepacks get stored
        'name': undefined, // the name of the samplepack in heartbeat's local storage
        'folder': undefined, // the folder in heartbeat's local storage where the samplepack will be stored
        'cleanup': true,
        'sox_path': 'sox'
    };


if(args.length === 2){
    console.error('please provide at least one configuration file or path to a folder');
    process.exit(1);
}


function parseArguments(){
    var i, maxi, a, stat, ext,
        basename, dirname;

    for(i = 2, maxi = args.length; i < maxi; i++){
        a = args[i];

        if(a === '-a' || a === '-assetpack'){
            assetpack = args[i + 1];
            i++;
            continue;
        }else if(a === '-s' || a === '-separate'){
            separateFiles = true;
            continue;
        }else if(a === '-f' || a === '-file'){
            samplePackFile = args[i + 1];
            //samplePackFile = path.resolve(args[i + 1]);
            i++;
            continue;
        }else if(a === '-o' || a === '-output'){
            outputDir = resolve(args[i + 1]);
            i++;
            continue;
        }else if(a === '-c' || a === '-config'){
            defaultConfig = resolve(args[i + 1], true);
            i++;
            continue;
        }else if(a === '-format'){
            extensions = args[i + 1];
            extensions = extensions.replace(/\./, '');
            extensions = extensions.split(',');
            extensions.forEach(function(e){
                e = '.' + e;
            });
            extensions = extensions.join(' ');
            i++;
            continue;
        }else if(a === '-targetformat'){
            compressionType = args[i + 1];
            i++;
            continue;
        }

        a = resolve(a);

        if(a === false){
            console.error(a, 'does not exist!');
            continue;
        }


        stat = fs.statSync(a);

        if(stat.isDirectory()){
            dirname = a.split(path.sep);
            dirname = dirname[dirname.length - 1];
            folders.push({
                name: dirname,
                path: a
            });
        }else{
            ext = path.extname(a);
            if(ext === '.cfg'){
                basename = path.basename(a);
                basename = basename.replace(ext, '');
                configFiles.push({
                    name: basename,
                    path: a
                });
            }
        }
    }

    if(assetpack !== undefined){
        if(outputDir !== undefined){
            assetpack = path.resolve(outputDir, assetpack);
        }else{
            assetpack = path.resolve(assetpack);
        }
        //console.log(assetpack);
    }

    if(samplePackFile !== undefined){
        if(outputDir !== undefined){
            samplePackFile = path.resolve(outputDir, samplePackFile);
        }else{
            samplePackFile = path.resolve(samplePackFile);
        }
    }
}


function getFiles(dir){
    var files = fs.readdirSync(dir),
        stat, ext, basename, dirname;

    files.forEach(function(p){
        p = path.resolve(dir, p);
        stat = fs.statSync(p);

        if(stat.isDirectory()){
            dirname = p.split(path.sep);
            dirname = dirname[dirname.length - 1];
            folders.push({
                name: dirname,
                path: p
            });
            getFiles(p);
        }else{
            ext = path.extname(p);
            if(ext === '.cfg'){
                basename = path.basename(p);
                basename = basename.replace(ext, '');
                configFiles.push({
                    name: basename,
                    path: p
                });
            }
        }
    });
}


function getDefaultConfig(){
    var key, config;

    if(defaultConfig !== undefined){
        if(fs.existsSync(defaultConfig) === false){
            console.log('default config', defaultConfig, 'not found');
            config = {};
        }else{
            config = parseConfigFile({path: defaultConfig});
        }
    }else{
        config = {};
    }

    for(key in keys){
        if(keys.hasOwnProperty(key)){
            if(config[key] === undefined){
                config[key] = keys[key];
            }
        }
    }

    if(compressionType !== undefined){
        config.compression_type = compressionType;
    }

    if(extensions !== undefined){
        config.extensions = extensions;
    }
    //console.log(defaultConfig, config);
    return config;
}


function parseFolders(index, max, callback){
    var config, data;
    if(index < max){
        data = folders[index];
        config = defaultConfig;
        config.name = data.name;
        config.path = data.path;
        getSamplesInFolder(config, function(samplepack){
            // if a name for a sample pack file is specified, only the first found folder has to be converted
            if(samplePackFile !== undefined && samplepack !== undefined){
                callback();
                return;
            }
            index++;
            parseFolders(index, max, callback);
        });
    }else{
        callback();
    }
}


function convertSample(sample, data, callback){
    var base64,
        tmpFile, cmd,
        compressionType = data.compression_type || compressionType,
        compressionLevel = data.compression_level;

    if(compressionType.indexOf('.') !== 0){
        compressionType = '.' + compressionType;
    }

    if(compressionType === undefined){
        if(dryrun === true){
            base64 = fs.readFileSync(sample).toString('base64').substring(0, 10);
        }else{
            base64 = fs.readFileSync(sample).toString('base64');
        }
        callback(base64);
        return;
    }

    if(compressionLevel === undefined){
        if(compressionType === '.ogg'){
            compressionLevel = 4;
        }else if(compressionType === '.mp3'){
            compressionLevel = 128;
        }else{
            console.error('no compression level specified');
            callback(false);
        }
    }

    tmpFile = path.resolve(tmpDir, 'tmp' + compressionType);
    cmd = 'sox \'' + sample + '\' -C ' + compressionLevel + ' \'' + tmpFile + '\'';
    //console.log('compress:', cmd);
    runSox(cmd, function(result, error){
        if(error !== undefined){
            console.error('error converting sample', error);
            //fs.unlinkSync(tmpFile);
            callback(false);
        }else{
            if(dryrun === true){
                base64 = fs.readFileSync(tmpFile).toString('base64').substring(0, 10);
            }else{
                base64 = fs.readFileSync(tmpFile).toString('base64');
            }
            fs.unlinkSync(tmpFile);
            callback(base64);
        }
    });
}


function processSample(sample, data, callback){
    var ext, basename, loop, i,
        pathToFolder = data.path;
        extensions = data.extensions;

    ext = path.extname(sample);
    //console.log(ext, sample);

    if(ext !== '' && extensions.indexOf(ext) !== -1){
        //console.log(ext, p, path.resolve(pathToFolder, p));
        //console.log(ext, extensions, extensions.indexOf(ext));
        basename = path.basename(sample);
        basename = basename.replace(ext, '');
        sample = path.resolve(pathToFolder, sample);
        //console.log(samplepack);
        if(samplepack === undefined){
            //console.log(data);
            loop = false;
            if(ext === '.wav'){
                loop = getSustainLoop(sample);
            }
            //console.log(loop, ext);

            samplepack = {};
            for(i in data){
                if(data.hasOwnProperty(i)){
                    samplepack[i] = data[i];
                }
            }
/*
            if(data.folder !== undefined){
                samplepack = {
                    name: data.name,
                    folder: data.folder,
                    type: 'samplepack',
                    mapping: {}
                };
            }else{
                samplepack = {
                    name: data.name,
                    type: 'samplepack',
                    mapping: {}
                };
            }
*/
            data.loop = loop !== false;
        }

        convertSample(sample, data, function(base64){
            if(data.loop === false){
                samplepack.mapping[basename] = base64;
            }else{
                loop = getSustainLoop(sample);
                if(loop === false){
                    samplepack.mapping[basename] = base64;
                }else{
                    samplepack.mapping[basename] = {
                        s: loop,
                        d: base64
                    };
                }
            }
            //console.log(samplepack);
            callback();
        });
    }else{
        //console.log('skipping', sample);
        callback();
    }
}


function loopProcessSample(index, max, samples, data, callback){
    //console.log(index, max)
    if(index < max){
        processSample(samples[index], data, function(){
            index++;
            loopProcessSample(index, max, samples, data, callback);
        });
    }else{
        callback();
    }
}


function getSamplesInFolder(data, callback){
    var files = fs.readdirSync(data.path);

    samplepack = undefined;

    //console.log(data.path, files.length)
    console.time(data.name);
    loopProcessSample(0, files.length, files, data, function(){
        //console.log(samplepack);
        if(samplepack !== undefined){
            if(samplePackFile !== undefined){
                saveSamplePack(samplePackFile, samplepack);
            }else if(separateFiles || data.output_file !== undefined){
                saveSamplePack(data.file, samplepack);
            }else{
                addToAssetPack(data.assetpack, samplepack);
            }
            console.timeEnd(data.name);
        }
        callback(samplepack);
    });
}


function parseConfigFile(data){
    var file, config, lines, line, i, maxi, key;

    //console.log('parseConfigFile', data);

    file = fs.readFileSync(data.path);
    config = {};

    lines = file.toString().split('\n');
    for(i = 0, maxi = lines.length; i < maxi; i++){
        line = lines[i];
        for(key in keys){
            if(keys.hasOwnProperty(key)){
                if(line.indexOf(key) === 0){
                    config[key] = line.substring(line.indexOf(':') + 1).replace(/^\s/, '');
                    //console.log(key, config[key]);
                }
            }
        }
    }

    // if an output dir is specified, try to save the assetpack there
    if(config.assetpack !== undefined && outputDir !== undefined){
        config.assetpack = path.resolve(outputDir, config.assetpack);
    }
    //console.log(config.assetpack, outputDir);

    // set missing keys to default values
    for(key in keys){
        if(keys.hasOwnProperty(key)){
            if(config[key] === undefined){
                config[key] = keys[key];
            }
        }
    }

    return config;
}


function parseConfigFiles(index, max, callback){
    var config, cf, p;

    if(index < max){
        cf = configFiles[index];
        config = parseConfigFile(cf);

        if(config.samples_folder !== undefined){

            p = resolve(config.samples_folder);
            //console.log(config);

            if(p !== false){
                // if there is no name specified in the cfg file, use the name of the cfg file
                if(config.name === undefined){
                    config.name = cf.name;
                }
                if(config.extensions === undefined){
                    config.extensions = extensions;
                }

                config.path = p;
                getSamplesInFolder(config, function(){
                    index++;
                    setTimeout(function(){
                        parseConfigFiles(index, max, callback);
                    }, 0);
                });

            }else{
                console.log(config.samples_folder, 'does not exist');
            }
        }
    }else{
        callback();
    }
}


function addToAssetPack(file, samplepack){
    var date, d, n, m, json;

    if(file === undefined){
        if(assetpack !== undefined){
            file = assetpack;
        }else{
            date = new Date();
            d = date.getDate();
            if(d < 10){
                d = '0' + d;
            }
            m = date.getMonth() + 1;
            if(m < 10){
                m = '0' + m;
            }
            n = d + '-' + m + '-' + date.getFullYear();
            if(outputDir !== undefined){
                file = path.resolve(outputDir, 'assetpack_' + n + '.json');
            }else{
                file = path.resolve(runDir, 'assetpack_' + n + '.json');
            }
        }
    }

    // create new json file if the file doesn't exist
    if(fs.existsSync(file) === false){
        json = {
            samplepacks: [samplepack]
        };
        fs.writeFileSync(file, JSON.stringify(json));
        return;
    }

    // add to existing json file
    json = fs.readFileSync(file);
    try{
        json = JSON.parse(json);
        if(json.samplepacks === undefined){
            json.samplepacks = [];
        }
        // add the sample pack to the existing asset pack
        json.samplepacks.push(samplepack);
        fs.writeFileSync(file, JSON.stringify(json));
        return;

    }catch(e){
        console.log(e);
    }
}


function saveSamplePack(file, samplepack){
    var p;
    if(file !== undefined){
        p = path.resolve(file);
        fs.writeFileSync(p, JSON.stringify(samplepack));
    }else{
        if(outputDir !== undefined){
            p = path.resolve(outputDir, samplepack.name + '.json');
        }else{
            p = path.resolve(runDir, samplepack.name + '.json');
        }
        fs.writeFileSync(p, JSON.stringify(samplepack));
    }
}


function resolve(file, showMessage){
    //console.log(file, runDir);
    if(typeof file !== 'string'){
        return false;
    }
    var p = path.resolve(file);
    if(fs.existsSync(p) === false){
        p = path.resolve(runDir, file);
    }
    if(fs.existsSync(p) === false){
        if(showMessage === true){
            console.error(file, 'could not be resolved');
        }
        p = false;
    }
    return p;
}


function runSox(cmd, callback){
    exec(cmd, function (error, stdout, stderr) {
        //console.log('SOX', error);
        //console.log(stdout);
        //console.log(stderr);
        if(!error){
            callback(true);
        }else{
            callback(error, stderr);
        }
    });
}


function init(){
    console.time('folder2samplepack');
    //console.log(args.length);
    parseArguments();

    if(runDir === undefined){
        runDir = process.cwd();//path.dirname(args[1]);
    }else{
        if(fs.existsSync(runDir) === false){
            fs.mkdirSync(runDir);
        }
    }
    //console.log(runDir);

    tmpDir = path.resolve(runDir, 'heartbeat_tmp');
    fs.mkdir(tmpDir, function(e){
        if(!e || (e && e.code === 'EEXIST')){
            //start();
        } else {
            console.log('can\'t create tmp folder here', e);
            process.exit(1);
        }
    });

    defaultConfig = getDefaultConfig();

    folders.forEach(function(p){
        getFiles(p.path);
    });

    //console.log(configFiles);
    //console.log(folders);
    //console.log('configFiles', configFiles.length);
    //console.log('folders', folders.length);

    parseFolders(0, folders.length, function(){
        parseConfigFiles(0, configFiles.length, function(){
            console.timeEnd('folder2samplepack');
            // remove tmp folder
            try{
                fs.rmdirSync(tmpDir);
            }catch(e){}
            process.exit(0);
        });
    });
}

init();