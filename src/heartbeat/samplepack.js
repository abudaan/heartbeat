function samplePack() {

    'use strict';

    var
        ajax, //defined in util.js
        findItem, //defined in util.js
        storeItem, //defined in util.js
        deleteItem, //defined in util.js
        typeString, //defined in util.js
        parseUrl, //defined in util.js
        base64ToBinary, // defined in util.js
        context, //defined in open_module.js
        storage, //defined in open_module.js

        parseTime,

        folder,
        sampleId,
        index = 0,
        SamplePack;


    function parse(samplepack, config) {
        var i, mapping = config.mapping, url, path, name, ext, slash, dot, data,
            remotePath,
            sampleData,
            extension;

        samplepack.samples = [];
        samplepack.samplesById = {};

        remotePath = config.remote_path;
        remotePath = remotePath === undefined ? false : remotePath;

        //console.log(samplepack.folder, samplepack.name);
        //console.log(samplepack, config);

        for (i in mapping) {
            if (mapping.hasOwnProperty(i)) {
                sampleData = {
                    id: i,
                    folder: samplepack.folder + '/' + samplepack.name,
                };

                //@TODO: this is not correct! A remote_path is not mandatory for a sample pack with urls!
                if (remotePath !== false) {
                    url = mapping[i];
                    if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
                        sampleData.url = url;
                    } else {
                        name = url;
                        // check if the url has a path and/or an extension
                        slash = url.lastIndexOf('/');
                        if (slash !== -1) {
                            name = url.substring(slash + 1);
                        }
                        path = url.substring(0, slash);
                        dot = url.lastIndexOf('.');
                        extension = config.extension;
                        if (dot !== -1) {
                            ext = url.substring(dot + 1);
                            if (ext.length >= 3 && ext.length <= 4) {
                                extension = ext;
                                name = url.substring(slash, dot);
                            }
                        }
                        //console.log('u', url, 'r',remotePath, 'p', path, 'n', name, 'e', extension);
                        url = remotePath + '/' + path + '/' + name + '.' + extension;
                        url = url.replace(/\/{2,}/g, '/');
                        url = url.replace(/^\//, '');
                        url = url.replace(/$\//, '');
                        sampleData.url = url;
                    }
                    //console.log('loading sample from:', sampleData.url);
                } else {
                    data = mapping[i];
                    if (data.d !== undefined) {
                        sampleData.base64 = mapping[i].d;
                        // get the sustain loop start and end
                        if (data.s !== undefined) {
                            sampleData.sustain = data.s;
                        }
                        // get the sample specific release duration and envelope, or reference to group release duration
                        if (data.r !== undefined) {
                            sampleData.release = data.r;
                        }
                    } else {
                        sampleData.base64 = mapping[i];
                    }
                    // store sample data by id so the instrument can easily retreive the loop information per sample
                    samplepack.samplesById[i] = sampleData;
                    //console.log(sampleData)
                }
                samplepack.samples.push(sampleData);
            }
        }
    }


    function loadLoop(pack, callback) {
        //console.log('load sample pack', pack.name);
        loadSamples(pack.samples, function (buffer) {
            //console.log('kheb er een ferig', buffer);
        }, function () {
            pack.loaded = true;
            pack.parseTime = parseTime;
            if (sequencer.debug >= 2) {
                console.info('parsing', pack.name, 'took', parseTime * 1000, 'ms');
            }
            //console.log(pack.localPath, pack.loaded);
            if (callback) {
                callback(true);
            }
        });
    }


    function cleanup(samplepack, callback) {
        samplepack.reset();
        samplepack = undefined;
        callback(false);
    }


    function store(samplepack) {
        var occupied = findItem(samplepack.localPath, sequencer.storage.samplepacks, true),
            action = samplepack.action,
            i, samples, sample;


        //console.log(action, occupied);

        if (occupied && occupied.className === 'SamplePack') {
            if (action === 'overwrite') {
                samples = occupied.samples;
                for (i = samples.length - 1; i >= 0; i--) {
                    sample = samples[i];
                    deleteItem(sample.name + '/' + sample.folder, sequencer.storage.audio);
                }
            } else if (action === 'append') {
                samples = occupied.samples;
                for (i = samples.length - 1; i >= 0; i--) {
                    samplepack.samples.push(samples[i]);
                }
            } else {
                if (sequencer.debug >= 2) {
                    console.warn('there is already a samplepack at', samplepack.localPath);
                }
                return false;
            }
        }

        storeItem(samplepack, samplepack.localPath, sequencer.storage.samplepacks);
        return true;
    }


    function load(pack, callback) {
        // check if sample pack file needs to be loaded first
        if (pack.hasMapping !== true) {
            ajax({
                url: pack.url,
                responseType: 'json',
                onError: function () {
                    cleanup(pack, callback);
                },
                onSuccess: function (data) {
                    // if the json data is corrupt (for instance because of a trailing comma) data will be null
                    if (data === null) {
                        callback(false);
                        return;
                    }

                    if (data.mapping === undefined) {
                        if (sequencer.debug >= 2) {
                            console.warn('can\'t create a SamplePack with this data', data);
                        }
                        cleanup(pack, callback);
                        return;
                    }
                    if (data.name !== undefined && pack.name === undefined) {
                        pack.name = data.name;
                    }

                    if (data.folder !== undefined && pack.folder === undefined) {
                        pack.folder = data.folder;
                    }

                    if (pack.name === undefined) {
                        pack.name = parseUrl(pack.url).name;
                    }

                    pack.action = data.action;
                    pack.localPath = pack.folder !== undefined ? pack.folder + '/' + pack.name : pack.name;

                    if (store(pack) === true) {
                        parse(pack, data);
                        loadLoop(pack, callback);
                    } else {
                        callback(false);
                    }
                }
            });
        } else {
            if (store(pack) === true) {
                loadLoop(pack, callback);
            } else {
                //console.log(callback);
                callback(false);
            }
        }
    }



    // private
    function loadSamples(samples, callback1, callback2) {
        var i = 0,
            numSamples = samples.length,
            sample = samples[i];

        function loaded(buffer) {
            //console.log('store item', folder + '/' + sampleId);
            // sample.buffer = buffer;
            // storeItem(sample, folder + '/' + sampleId, storage.audio);
            storeItem(buffer, folder + '/' + sampleId, storage.audio);
            if (callback1) {
                callback1(buffer);
            }
            i++;
            if (i < numSamples) {
                sample = samples[i];
                loadSample(sample, loaded);
            } else {
                callback2();
            }
        }
        loadSample(sample, loaded);
    }


    // private
    function loadSample(data, callback) {
        var sample,
            url = data.url,
            base64 = data.base64;

        sampleId = data.id;
        folder = data.folder;
        sample = findItem(folder + '/' + sampleId, storage.audio, true);

        //console.log('load sample', sample, folder, sampleId, callback.name);
        //console.log(url);

        if (sample !== false) {
            // sample has already been loaded
            callback(sample);
        } else if (base64) {
            // sample is stored as base64 data
            //console.log(data.id, sample)
            //sample = atob(base64);
            //console.log(base64.substring(0,10));
            if (base64 !== 'TWAAAP') {
                sample = base64ToBinary(base64);
                parseAudioData(sample, callback);
            } else {
                callback(sample);
            }
            data.base64 = '';
        } else if (url) {
            // sample needs to be loaded from the server
            ajax({
                url: url,
                responseType: 'arraybuffer',
                onError: function () {
                    callback();
                },
                onSuccess: function (buffer) {
                    //console.log(sampleId, buffer);
                    parseAudioData(buffer, callback);
                }
            });
        } else {
            console.error('could not load sample', folder + '/' + sampleId);
            //callback();
        }
    }

    // private
    function parseAudioData(audiodata, callback) {
        //console.log(audiodata, typeString(audiodata), audiodata.byteLength, ArrayBuffer.isView(audiodata));
        var ts = sequencer.getTime();
        //console.log(ts);
        if (audiodata !== null) {
            try {
                context.decodeAudioData(audiodata, function (buffer) {
                    //console.log(buffer);
                    parseTime += (sequencer.getTime() - ts);
                    callback(buffer);
                }, function (e) {
                    console.log('error decoding audiodata', sampleId, e);
                    callback();
                });
            } catch (e) {
                console.log(sampleId, e);
                callback();
            }
        }
    }


    SamplePack = function (config) {
        this.id = 'SP' + index++ + new Date().getTime();
        this.className = 'SamplePack';

        this.loaded = false;
        this.loadTime = 0;
        this.parseTime = parseTime = 0;

        this.url = config.url;
        this.name = config.name;
        this.folder = config.folder;

        this.info = config.info || config.samplepack_info;
        this.author = config.author || config.samplepack_author;
        this.license = config.license || config.samplepack_license;
        this.compression = config.compression || config.samplepack_compression;
        if (this.compression === undefined) {
            if (config.compression_type !== undefined) {
                this.compression = config.compression_type + ' ' + config.compression_level;
            }
        }
        this.pack = config.pack;
        this.filesize = config.filesize;

        if (this.filesize === undefined && this.pack !== undefined) {
            this.filesize = this.pack.filesize;
            //console.log(this.filesize);
        }


        if (config.mapping) {
            if (this.name === undefined && this.folder === undefined) {
                this.name = this.id;
                this.localPath = this.id;
            } else {
                this.localPath = this.folder !== undefined ? this.folder + '/' + this.name : this.name;
            }
            // set hasMapping to "true" so we know that we don't have to load json data from the server
            this.hasMapping = true;
            this.action = config.action;
            parse(this, config);
        } else if (config.url) {
            this.url = config.url;
            //console.log(this.url);
        }
    };


    SamplePack.prototype.reset = function () {
        this.samples = [];
    };


    sequencer.addSamplePack = function (config, callback, callbackAfterAllTasksAreDone) {
        var type = typeString(config),
            samplepack, json, name, folder;

        callbackAfterAllTasksAreDone = callbackAfterAllTasksAreDone === undefined ? false : callbackAfterAllTasksAreDone;

        //console.log(config);

        if (type !== 'object') {
            if (sequencer.debug >= 2) {
                console.warn('can\'t create a SamplePack with this data', config);
            }
            return false;
        }

        if (config.json) {
            json = config.json;
            name = config.name;
            folder = config.folder;
            if (typeString(json) === 'string') {
                try {
                    json = JSON.parse(json);
                } catch (e) {
                    if (sequencer.debug >= 2) {
                        console.warn('can\'t create a SamplePack with this data', config);
                    }
                    return false;
                }
            }
            if (json.mapping === undefined) {
                if (sequencer.debug >= 2) {
                    console.warn('can\'t create a SamplePack with this data', config);
                }
                return false;
            }
            config = {
                mapping: json.mapping,
                name: name === undefined ? json.name : name,
                folder: folder === undefined ? json.folder : folder
            };
            //console.log('config', name, folder, json.name, json.folder);
        }


        samplepack = new SamplePack(config);
        //console.log(samplepack.filesize);

        sequencer.addTask({
            type: 'load sample pack',
            method: load,
            params: samplepack
        }, function (value) {
            //console.log(samplepack, value);
            if (callback) {
                if (value === false) {
                    samplepack = null;
                    callback(null);
                } else {
                    callback(samplepack);
                }
            }
        }, callbackAfterAllTasksAreDone);

        sequencer.startTaskQueue();

        /*
                load(samplepack, function(){
                    //console.log(samplepack);
                    store(samplepack);
                    if(callback){
                        callback(samplepack);
                    }
                });
        */
    };

    sequencer.protectedScope.addInitMethod(function () {
        storage = sequencer.storage;
        ajax = sequencer.protectedScope.ajax;
        context = sequencer.protectedScope.context;
        findItem = sequencer.protectedScope.findItem;
        parseUrl = sequencer.protectedScope.parseUrl;
        storeItem = sequencer.protectedScope.storeItem;
        deleteItem = sequencer.protectedScope.deleteItem;
        typeString = sequencer.protectedScope.typeString;
        base64ToBinary = sequencer.protectedScope.base64ToBinary;
    });

}