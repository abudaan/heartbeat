/*
    USAGE:

*/

'use strict';

var
    fs = require('fs'),
    path = require('path'),
    args = process.argv,

    runDir, // the directory where nodejs is run

    assets = [], // asset file to be added to the assetpack
    folders = [], // folder to look for assets that will be added to the assetpack
    assetpack; // the assetpack file where all found assets will be added to


if(args.length === 2){
    console.error('please provide at least one asset file');
    process.exit(1);
}


function parseArguments(){
    var i, maxi, a, stat, ext;

    for(i = 2, maxi = args.length; i < maxi; i++){
        a = args[i];

        if(a === '-a' || a === '-assetpack'){
            assetpack = path.resolve(args[i+1]);
            i++;
        }else{
            a = resolve(a);
        }

        if(a === false){
            console.error(a, 'does not exist!');
            continue;
        }

        stat = fs.statSync(a);

        if(stat.isDirectory()){
            folders.push(a);
        }else{
            ext = path.extname(a);
            if(ext === '.json'){
                assets.push(a);
            }
        }
    }
}


function getFiles(dir){
    var files = fs.readdirSync(dir),
        stat, ext;

    files.forEach(function(p){
        p = path.resolve(dir, p);
        stat = fs.statSync(p);

        if(stat.isDirectory()){
            getFiles(p);
        }else{
            ext = path.extname(p);
            if(ext === '.json'){
                assets.push(p);
            }
        }
    });
}


function addToAssetPack(){
    var date, d, n, m, json;

    if(assetpack === undefined){
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
        assetpack = path.resolve(runDir, 'assetpack_' + n + '.json');
        json = {};
    }

    // create new json file if the file doesn't exist
    else if(fs.existsSync(assetpack) === false){
        json = {};
    }

    // add to existing json file
    else{
        json = fs.readFileSync(assetpack);
        try{
            json = JSON.parse(json);
        }catch(e){
            console.log(e);
        }
    }

    addToJSON(json);
    fs.writeFileSync(assetpack, JSON.stringify(json));
}


function addToJSON(json){
    var
        i, maxi, file, asset, type;

    for(i = 0, maxi = assets.length; i < maxi; i++){
        file = assets[i];
        asset = fs.readFileSync(file);
        try{
            asset = JSON.parse(asset);
        }catch(e){
            console.log(e, file);
            continue;
        }

        type = asset.type;

        if(type !== undefined){
            console.log(type, file);
        }

        switch(type){
            case undefined:
                // check if it is an assetpack
                if(asset.midifiles !== undefined || asset.samplepacks !== undefined || asset.instruments !== undefined){
                    mergeAssetPack(json, asset, file);
                }else{
                    console.log('can not add', file);
                }
                break;

            case 'midifile':
                if(json.midifiles === undefined){
                    json.midifiles = [];
                }
                json.midifiles.push(asset);
                break;

            case 'instrument':
                if(json.instruments === undefined){
                    json.instruments = [];
                }
                json.instruments.push(asset);
                break;

            case 'samplepack':
                if(json.samplepacks === undefined){
                    json.samplepacks = [];
                }
                json.samplepacks.push(asset);
                break;
        }
    }
}


function mergeAssetPack(json, assetpack, file){
    console.log('assetpack', file);

    if(assetpack.midifiles !== undefined){
        if(json.midifiles === undefined){
            json.midifiles = [];
        }
        assetpack.instruments.forEach(function(asset){
            json.midifiles.push(asset);
        });
    }

    if(assetpack.instruments !== undefined){
        if(json.instruments === undefined){
            json.instruments = [];
        }
        assetpack.instruments.forEach(function(asset){
            json.instruments.push(asset);
        });
    }

    if(assetpack.samplepacks !== undefined){
        if(json.samplepacks === undefined){
            json.samplepacks = [];
        }
        assetpack.samplepacks.forEach(function(asset){
            json.samplepacks.push(asset);
        });
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


(function init(){
    console.time('assets2assetpack');

    parseArguments();

    if(runDir === undefined){
        runDir = process.cwd();
    }

    folders.forEach(function(p){
        getFiles(p);
    });

    addToAssetPack();

    //console.log(assets);
    console.timeEnd('assets2assetpack');
    process.exit(0);

}());