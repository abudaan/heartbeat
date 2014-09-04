/*
    depends on sox, see: http://sox.sourceforge.net/
*/

'use strict';

var
    fs = require('fs'),
    path = require('path'),
    sfz2json = require('./inc/sfz2json'),
    parseSfzFile = require('./inc/parse_sfz').parse,
    args = process.argv,

    runDir,
    tmpDir,
    soxPath = 'sox',
    outputDir,
    assetpack,
    group,
    overwrite,
    recursive,
    separateFiles,
    defaultConfig,
    folders = [],
    sfzFiles = [],
    configFiles = [],
    numSfzFiles,
    numConfigFiles,

    keys = {
        'sfz_file': undefined,
        'assetpack': undefined,
        'overwrite': false,
        'output_folder': undefined,
        'instrument_name': undefined,
        'instrument_folder': '',
        'instrument_file': undefined,
        'instrument_assetpack': undefined,
        'instrument_author': undefined, // author of the midi file (not necessarily the composer)
        'instrument_license': undefined, // copyright, creative commons, etc.
        'instrument_info': undefined, // further info that might be insteresting such as creation date
        'samplepack_name': undefined,
        'samplepack_folder': '',
        'samplepack_file': undefined,
        'samplepack_compression': undefined,
        'samplepack_assetpack': undefined,
        'samplepack_author': undefined, // author of the midi file (not necessarily the composer)
        'samplepack_license': undefined, // copyright, creative commons, etc.
        'samplepack_info': undefined, // further info that might be interesting such as creation date
        'release_duration': 0,
        'release_envelope': 'equal power',
        'key_scaling_release': false,
        'key_scaling_panning': false,
        'sustain': true,
        'compression_type': 'ogg',
        'compression_level': 4,
        'use_compression_type_in_extension': false,
        'use_compression_level_in_extension': false,
        'trim': false,
        'cleanup': true, // -> removed, is always true
        'sox_path': 'sox' // -> moved to command line switches
    };


if(args.length < 2){
    console.error('please provide at least one configuration file');
    process.exit(1);
}


function parseArguments(){
    var i, maxi, a, stat, ext,
        basename;

    for(i = 2, maxi = args.length; i < maxi; i++){
        a = args[i];

        if(a === '-a' || a === '-assetpack'){
            //assetpack = resolve(args[i + 1], true);
            assetpack = args[i + 1];
            //console.log('assetpack', assetpack);
            i++;
            continue;
        }else if(a === '-s' || a === '-separate'){
            separateFiles = true;
            continue;
        }else if(a === '-o' || a === '-output'){
            outputDir = resolve(args[i + 1], true);
            //console.log('outputDir', outputDir);
            i++;
            continue;
        }else if(a === '-c' || a === '-config'){
            defaultConfig = resolve(args[i + 1], true);
            i++;
            continue;
        }else if(a === '-g' || a === '-group'){
            group = true;
            continue;
        }else if(a === '-x' || a === '-overwrite'){
            overwrite = true;
            continue;
        }else if(a === '-r' || a === '-recursive'){
            recursive = true;
            continue;
        }else if(a === '-sox'){
            soxPath = args[i+1];
            i++;
            continue;
        }

        a = resolve(a);
        console.log(a);

        if(a === false){
            console.error('sfz2heartbeat 114', a, 'does not exist!');
            continue;
        }

        stat = fs.statSync(a);

        if(stat.isDirectory()){
            if(a !== false){
                folders.push(a);
            }
        }else{
            ext = path.extname(a);
            if(ext === '.cfg'){
                basename = path.basename(a);
                basename = basename.replace(ext, '');
                configFiles.push({
                    name: basename,
                    path: a
                });
            }else if(ext === '.sfz'){
                basename = path.basename(a);
                basename = basename.replace(ext, '');
                sfzFiles.push({
                    name: basename,
                    path: a
                });
            }
        }
    }

    //console.log(assetpack);
    if(assetpack !== undefined){
        if(outputDir !== undefined){
            assetpack = path.resolve(outputDir, assetpack);
        }else{
            assetpack = path.resolve(assetpack);
        }
        //console.log(assetpack);
    }
}


function getFiles(dir){
    //console.log('getFiles in dir', dir);
    var files = fs.readdirSync(dir),
        stat, ext, basename;

    files.forEach(function(p){
        p = path.resolve(dir, p);
        stat = fs.statSync(p);

        if(stat.isDirectory() && recursive === true){
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
            }else if(ext === '.sfz'){
                basename = path.basename(p);
                basename = basename.replace(ext, '');
                sfzFiles.push({
                    name: basename,
                    path: p
                });
            }
        }
    });
}


function parseConfigFile(data){
    var p = path.resolve(data.path),
        lines, config,
        i, key, line, numLines;

    if(p === false){
        console.log('config file does not exist', p);
        return false;
    }

    data = fs.readFileSync(p, 'utf8');
    lines = data.toString().split('\n');
    numLines = lines.length;
    config = {};

    for(i = 0; i < numLines; i++){
        line = lines[i];
        for(key in keys){
            if(keys.hasOwnProperty(key)){
                if(line.indexOf(key + ':') === 0){
                    line = line.replace(key, '');
                    line = line.replace(/:\s*/, '');
                    line = line.replace(/\s$/, '');
                    config[key] = line;
                }
            }
        }
    }

    for(key in keys){
        if(keys.hasOwnProperty(key)){
            if(config[key] === undefined){
                config[key] = keys[key];
            }
        }
    }

    config.overwrite = config.overwrite === 'true';
    config.use_compression_type_in_extension = config.use_compression_type_in_extension === 'true';
    config.use_compression_level_in_extension = config.use_compression_level_in_extension === 'true';

    if(config.use_compression_type_in_extension === true && config.use_compression_level_in_extension === true){
        config.instrument_folder = config.instrument_folder + '/' + config.compression_type + '/' + config.compression_level;
        config.samplepack_folder = config.samplepack_folder + '/' + config.compression_type + '/' + config.compression_level;
    }else if(config.use_compression_type_in_extension === true){
        config.instrument_folder = config.instrument_folder + '/' + config.compression_type;
        config.samplepack_folder = config.samplepack_folder + '/' + config.compression_type;
    }else if(config.use_compression_level_in_extension === true){
        config.instrument_folder = config.instrument_folder + '/' + config.compression_level;
        config.samplepack_folder = config.samplepack_folder + '/' + config.compression_level;
    }


    config.tmp_dir = tmpDir;
    //console.log(config);
    return config;
}


function sfzToJson(sfzFile){
    var json = sfz2json.parse(sfzFile);
    json.file_dir = path.dirname(sfzFile);
    json.file_name = path.basename(sfzFile, '.sfz');
    //console.log('sfzToJson', json);
    return json;
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
    config.tmp_dir = tmpDir;
    //console.log(defaultConfig, config);
    return config;
}


function loopConfigFiles(index, callback){
    var config, sfzFile, name, json;

    if(index === numConfigFiles){
        callback();
    }else{
        name = configFiles[index].name;
        config = parseConfigFile(configFiles[index]);
        //console.log(index, '->', config.sfz_file);

        if(config.sfz_file === undefined){
            console.log('no sfz file specified');
            loopConfigFiles(++index, callback);
        }else{
            sfzFile = path.resolve(config.sfz_file);
            if(fs.existsSync(sfzFile) === false){
                console.log(index, '  -> sfz file does not exist', sfzFile);
                loopConfigFiles(++index, callback);
            }else{
                console.time(index + ' ' + name + '.cfg');
                //console.log(index + ' ' + name + '.cfg');
                json = sfzToJson(sfzFile);
                parseSfzFile(soxPath, json, config, function(instrument, samplepack){
                    saveAssets(instrument, samplepack, config, function(){
                        console.timeEnd(index + ' ' + name + '.cfg');
                        setTimeout(function(){
                            loopConfigFiles(++index, callback);
                        }, 0);
                    });
                });
            }
        }
    }
}


function loopSfzFiles(index, callback){
    var sfzFile, name, json;

    if(index === numSfzFiles){
        callback();
    }else{
        sfzFile = sfzFiles[index];
        name = sfzFile.name;
        json = sfzToJson(sfzFile.path);
        console.time(index + ' ' + name + '.sfz');
        parseSfzFile(soxPath, json, defaultConfig, function(instrument, samplepack){
            saveAssets(instrument, samplepack, defaultConfig, function(){
                console.timeEnd(index + ' ' + name + '.sfz');
                console.log(samplepack.filesize);
                setTimeout(function(){
                    loopSfzFiles(++index, callback);
                }, 0);
            });
        });
    }
}


function saveAssets(instrument, samplepack, config, callback){
    var json, p, name, ap,
        instrumentSaved = false,
        samplepackSaved = false;

    if(config.instrument_file !== undefined){
        p = path.resolve(config.instrument_file);
        fs.writeFileSync(p, JSON.stringify(instrument));
        instrumentSaved = true;
    }

    if(config.samplepack_file !== undefined){
        p = path.resolve(config.samplepack_file);
        p = addCompressionToExtension(p, config);
        fs.writeFileSync(p, JSON.stringify(samplepack));
        samplepackSaved = true;
    }

    if(instrumentSaved === true && samplepackSaved === true){
        callback();
        return;
    }

    if(config.assetpack !== undefined || (config.instrument_assetpack !== undefined && config.instrument_assetpack === config.samplepack_assetpack)){
        if(instrumentSaved === false && samplepackSaved === false){
            ap = config.assetpack || config.instrument_assetpack;
            p = path.resolve(ap);
            addToAssetPack(p, [instrument, samplepack], config);
            samplepackSaved = true;
            instrumentSaved = true;
            callback();
            return;
        }
    }

    if(config.instrument_assetpack !== undefined && instrumentSaved === false){
        p = path.resolve(config.instrument_assetpack);
        addToAssetPack(p, [instrument], config);
        instrumentSaved = true;
    }

    if(config.samplepack_assetpack !== undefined && samplepackSaved === false){
        p = path.resolve(config.instrument_assetpack);
        addToAssetPack(p, [samplepack], config);
        samplepackSaved = true;
    }

    if(instrumentSaved === true && samplepackSaved === true){
        callback();
        return;
    }

    if(separateFiles === true && instrumentSaved === false){
        if(outputDir){
            p = path.resolve(outputDir, instrument.name + '.json');
        }else{
            p = path.resolve(runDir, instrument.name + '.json');
        }
        p = addCompressionToExtension(p, config);
        fs.writeFileSync(p, JSON.stringify(instrument));
        instrumentSaved = true;
    }

    if(separateFiles === true && samplepackSaved === false){
        if(samplepack.name === instrument.name){
            name = samplepack.name + '_samples';
        }else{
            name = samplepack.name;
        }
        if(outputDir !== undefined){
            p = path.resolve(outputDir, name + '.json');
        }else{
            p = path.resolve(runDir, name + '.json');
        }
        p = addCompressionToExtension(p, config);
        fs.writeFileSync(p, JSON.stringify(samplepack));
        samplepackSaved = true;
    }

    if(instrumentSaved === true && samplepackSaved === true){
        callback();
        return;
    }

    if(group === true){
        json = {
            instruments: [instrument],
            samplepacks: [samplepack]
        };
        if(outputDir !== undefined){
            p = path.resolve(outputDir, instrument.name + '.json');
        }else{
            p = path.resolve(runDir, instrument.name + '.json');
        }
        p = addCompressionToExtension(p, config);
        fs.writeFileSync(p, JSON.stringify(json));

        samplepackSaved = true;
        instrumentSaved = true;
        callback();
        return;
    }
    addToAssetPack(assetpack, [instrument, samplepack], config);
}


//function addToAssetPack(file, assets, callback){
function addToAssetPack(file, assets, config){
    var date, d, n, m,
        json, asset,
        i, maxi = assets.length;

    overwrite = config.overwrite === true ? true : overwrite === true ? true : false;

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
    if(fs.existsSync(file) === false || overwrite === true){
        json = {
            instruments: [],
            samplepacks: []
        };
        for(i = 0; i < maxi; i++){
            asset = assets[i];
            if(asset.type === 'samplepack'){
                json.samplepacks.push(asset);
            }else if(asset.type === 'instrument'){
                json.instruments.push(asset);
            }
        }
        // fs.writeFile(file, JSON.stringify(json), function(){
        //     callback();
        // });
        file = addCompressionToExtension(file, config);
        fs.writeFileSync(file, JSON.stringify(json));
        return;
    }

    // add to existing json file
    //console.log('reading json');
    json = fs.readFileSync(file);
    try{
        //console.log('parsing json');
        json = JSON.parse(json);
        for(i = 0; i < maxi; i++){
            asset = assets[i];
            if(asset.type === 'samplepack'){
                if(json.samplepacks === undefined){
                    json.samplepacks = [];
                }
                json.samplepacks.push(asset);
            }else if(asset.type === 'instrument'){
                if(json.instruments === undefined){
                    json.instruments = [];
                }
                json.instruments.push(asset);

            }
        }
        // fs.writeFile(file, JSON.stringify(json), function(){
        //     json = undefined;
        //     asset = undefined;
        //     callback();
        // });
        file = addCompressionToExtension(file, config);
        fs.writeFileSync(file, JSON.stringify(json));
        json = undefined;
        asset = undefined;
    }catch(e){
        console.log(e);
    }
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


function addCompressionToExtension(p, config){
    var ext = path.extname(p),
        basename = path.basename(p, ext),
        dirname = path.dirname(p),
        newPath;

    //console.log(p);

    if(config.use_compression_type_in_extension === true && config.use_compression_level_in_extension === true){
        newPath = dirname + '/' + basename + '.' + config.compression_type + '.' + config.compression_level + ext;
    }else if(config.use_compression_type_in_extension === true){
        newPath = dirname + '/' + basename + '.' + config.compression_type + ext;
    }else if(config.use_compression_level_in_extension === true){
        newPath = dirname + '/' + basename + '.' + config.compression_level + ext;
    }else{
        newPath = p;
    }

    //console.log(newPath);
    return newPath;
}


function init(){
    console.time('sfz2heartbeat');
    //console.log(args.length);
    if(runDir === undefined){
        runDir = process.cwd();//path.dirname(args[1]);
    }else{
        if(fs.existsSync(runDir) === false){
            fs.mkdirSync(runDir);
        }
    }
    console.log(runDir);
    parseArguments();

    // get all the .sfz and .cfg files in the supplied folders
    if(folders.length > 0){
        console.log('searching for .sfz and .cfg files...');
        folders.forEach(function(f){
            getFiles(f);
        });
    }

    tmpDir = path.resolve(runDir, 'heartbeat_tmp');
    fs.mkdir(tmpDir, function(e){
        if(!e || (e && e.code === 'EEXIST')){
            //start();
        } else {
            console.log('can\'t create tmp folder here', e);
            process.exit(1);
        }
    });

    //console.log('folders', folders);
    //console.log('config', configFiles);
    //console.log('sfz', sfzFiles);
    //return;

    defaultConfig = getDefaultConfig();
    //console.log(defaultConfig);

    numSfzFiles = sfzFiles.length;
    numConfigFiles = configFiles.length;

    console.log('sfz files:', numSfzFiles);
    console.log('cfg files', numConfigFiles);

    loopConfigFiles(0, function(){
        loopSfzFiles(0, function(){
            console.timeEnd('sfz2heartbeat');
            // remove tmp folder
            try{
                fs.rmdirSync(tmpDir);
            }catch(e){}
            process.exit(0);
        });
    });
}

init();
