/*
    USAGE:

    you can pass midi files (.mid or .midi), config files (.cfg) and folders

    the order of arguments is not important



    midifile2asset.js file1.mid file2.midi file3.cfg file4.cfg /path/to/files file5.mid -a assetpack.json
        -> all midi and config files are added to new or existing assetpack "assetpack.json"

    midifile2asset.js file1.mid file2.midi file3.cfg file4.cfg /path/to/files file5.mid
        -> all midi and config files are added to new assetpack, the file name of this assetpack is "assetpack_DD-MM-YYYY.json"

    midifile2asset.js file1.mid file2.midi file3.cfg file4.cfg file5.mid -s
        -> all midi assets are added to individual asset files named after the midi file or the name specified in the config file

    midifile2asset.js file1.mid
        -> single asset file is created with the name of the supplied midi file, or the name specified in the config file

    midifile2asset.js file1.mid -f midifile_asset.json
        -> single asset file is created with supplied name (only the first midi or config file is used)

*/

'use strict';

var
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    args = process.argv,

    runDir, // the directory where nodejs is run
    outputDir, // the directory where the generated file(s) will be stored
    overwrite = false, // whether or not to overwrite existing asset pack files

    folders = [],
    midiFiles = [],
    configFiles = [],

    assetpack, // the asset pack file where the midi file(s) will be added to (not mandatory)
    separateFiles, // if true a separate asset file will created for every file in the arguments list
    midiAssetFile, // save the supplied midi or config file to this file
    defaultConfig,

    keys = [
        'author', // author of the midi file (not necessarily the composer)
        'license', // copyright, creative commons, etc.
        'info', // further info that might be insteresting such as creation date
        'output_file', // the midi file asset will be saved to this file
        'assetpack', // the midi file asset will be added to this existing or new assetpack
        'midi_file', // the midi file to be converted
        'name', // the name of the midi file in heartbeat's local storage
        'folder' // the folder in heartbeat's local storage where the midi file will be stored
    ],
    numKeys = keys.length;


if(args.length === 2){
    console.error('please provide at least one midi file, configuration file or path to a folder');
    process.exit(1);
}


function parseArguments(){
    var i, maxi, a, stat, ext,
        basename;

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
            midiAssetFile = args[i + 1];
            i++;
            continue;
        }else if(a === '-c' || a === '-config'){
            defaultConfig = resolve(args[i + 1], true);
            i++;
            continue;
        }else if(a === '-o' || a === '-output'){
            outputDir = resolve(args[i + 1]);
            i++;
            continue;
        }else if(a === '-x' || a === '-overwrite'){
            overwrite = true;
            continue;
        }

        a = resolve(a);

        if(a === false){
            console.error(a, 'does not exist!');
            continue;
        }

        stat = fs.statSync(a);

        if(stat.isDirectory()){
            folders.push(a);
        }else{
            ext = path.extname(a);
            if(ext === '.cfg'){
                basename = path.basename(a);
                basename = basename.replace(ext, '');
                configFiles.push({
                    name: basename,
                    path: a
                });
            }else if(ext === '.mid' || ext === '.midi'){
                basename = path.basename(a);
                basename = basename.replace(ext, '');
                midiFiles.push({
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

    if(midiAssetFile !== undefined){
        if(outputDir !== undefined){
            midiAssetFile = path.resolve(outputDir, midiAssetFile);
        }else{
            midiAssetFile = path.resolve(midiAssetFile);
        }
    }
}


function getFiles(dir){
    var files = fs.readdirSync(dir),
        stat, ext, basename;

    files.forEach(function(p){
        p = path.resolve(dir, p);
        stat = fs.statSync(p);

        if(stat.isDirectory()){
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
            }else if(ext === '.mid' || ext === '.midi'){
                basename = path.basename(p);
                basename = basename.replace(ext, '');
                midiFiles.push({
                    name: basename,
                    path: p
                });
            }
        }
    });
}


function saveAsset(config){
    var asset = {
            name: config.name
        };

    if(fs.existsSync(config.midi_file) === false){
        console.log(config.midi_file, 'does not exist');
        return;
    }

    if(config.folder !== undefined){
        asset.folder = config.folder;
    }

    if(config.author !== undefined){
        asset.author = config.author;
    }

    if(config.license !== undefined){
        asset.license = config.license;
    }

    if(config.info !== undefined){
        asset.info = config.info;
    }

    asset.base64 = fs.readFileSync(config.midi_file).toString('base64');

    if(midiAssetFile !== undefined){
        saveMidiFileAsset(midiAssetFile, asset);
        // only the first found config file is saved to midiAssetFile
        process.exit(0);
    }else if(separateFiles || config.output_file !== undefined){
        saveMidiFileAsset(config.output_file, asset);
    }else{
        addToAssetPack(config.assetpack, asset, config.overwrite);
    }
}


function parseMidiFiles(){
    var config = defaultConfig;

    midiFiles.forEach(function(mf){
        config.name = mf.name;
        config.midi_file = path.resolve(mf.path);
        saveAsset(config);
    });
}


function parseConfigFiles(){
    var cf, i, maxi, config;

    for(i = 0; i < maxi; i++){
        //console.log('cf:', cf.path);
        cf = configFiles[i];
        config = parseConfigFile(cf);
        if(config.name === undefined){
            config.name = cf.name;
        }
        saveAsset(config);
    }
}


function parseConfigFile(data){
    var config, file,
        lines, line,
        l, maxl,
        j, key;

    file = fs.readFileSync(data.path);
    config = {};

    lines = file.toString().split('\n');
    for(l = 0, maxl = lines.length; l < maxl; l++){
        line = lines[l];
        for(j = 0; j < numKeys; j++){
            key = keys[j];
            if(line.indexOf(key) === 0){
                config[key] = line.substring(line.indexOf(':') + 1).replace(/^\s/, '');
            }
        }
    }

    return config;
}


function addToAssetPack(file, midiFileAsset, _overwrite){
    var d, n, m, json;

    overwrite = _overwrite === 'true' ? true : overwrite === true ? true : false;

    if(file === undefined){
        if(assetpack !== undefined){
            file = assetpack;
        }else{
            d = new Date();
            m = d.getMonth() + 1;
            if(m < 10){
                m = '0' + m;
            }
            n = d.getDate() + '-' + m + '-' + d.getFullYear();
            file = path.resolve(runDir, 'assetpack_' + n + '.json');
        }
    }

    //console.log(file);

    // create new json file if the file doesn't exist
    if(fs.existsSync(file) === false || overwrite === true){
        json = {
            midifiles: [midiFileAsset]
        };
        fs.writeFileSync(file, JSON.stringify(json));
        return;
    }

    // add to existing json file
    json = fs.readFileSync(file);
    try{
        json = JSON.parse(json);
        if(json.midifiles === undefined){
            json.midifiles = [];
        }
        // add the sample pack to the existing asset pack
        json.midifiles.push(midiFileAsset);
        fs.writeFileSync(file, JSON.stringify(json));
        return;

    }catch(e){
        console.log(e);
    }
}


function saveMidiFileAsset(file, midiFileAsset){
    var p;
    if(file !== undefined){
        p = path.resolve(file);
        fs.writeFileSync(p, JSON.stringify(midiFileAsset));
    }else{
        p = path.resolve(runDir, midiFileAsset.name + '.json');
        fs.writeFileSync(p, JSON.stringify(midiFileAsset));
    }
}


function getDefaultConfig(){
    var key;

    if(defaultConfig !== undefined){
        if(fs.existsSync(defaultConfig) === false){
            console.log('default config', defaultConfig, 'not found');
            defaultConfig = {};
        }else{
            defaultConfig = parseConfigFile({path: defaultConfig});
        }
    }else{
        defaultConfig = {};
    }

    for(key in keys){
        if(keys.hasOwnProperty(key)){
            if(defaultConfig[key] === undefined){
                defaultConfig[key] = keys[key];
            }
        }
    }
    console.log(defaultConfig);
}


function resolve(file, showMessage){
    //console.log(file, runDir);
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


function init(){
    //console.log(args.length);
    parseArguments();
    runDir = process.cwd();

    folders.forEach(function(p){
        getFiles(p);
    });

    //console.log(folders);
    //console.log(midiFiles);
    //console.log(configFiles);

    getDefaultConfig();
    parseMidiFiles();
    parseConfigFiles();
}

init();