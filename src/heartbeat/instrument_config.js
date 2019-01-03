function instrumentConfig() {

    'use strict';

    var
        ajax, // defined in utils.js
        parseUrl, // defined in utils.js
        findItem, // defined in utils.js
        storeItem, // defined in utils.js
        typeString, // defined in utils.js
        objectForEach, // defined in utils.js

        index = 0,

        InstrumentConfig;


    InstrumentConfig = function (config) {
        this.id = 'IC' + index++ + new Date().getTime();
        this.className = 'InstrumentConfig';
        var instrument = this;
        objectForEach(config, function (val, key) {
            instrument[key] = val;
        });
        //console.log(instrument);
    };


    function cleanup(instrument, callback) {
        instrument = undefined;
        if (callback) {
            callback(false);
        }
    }


    function store(instrument) {
        var occupied = findItem(instrument.localPath, sequencer.storage.instruments, true),
            action = instrument.action;

        //console.log(instrument.localPath, occupied);
        if (occupied && occupied.className === 'InstrumentConfig' && action !== 'overwrite') {
            if (sequencer.debug >= 2) {
                console.warn('there is already an Instrument at', instrument.localPath);
                cleanup(instrument);
            }
        } else {
            storeItem(instrument, instrument.localPath, sequencer.storage.instruments);
        }
    }


    function load(instrument, callback) {

        if (instrument.url === undefined) {
            instrument.localPath = instrument.folder !== undefined ? instrument.folder + '/' + instrument.name : instrument.name;
            callback();
            return;
        }


        ajax({
            url: instrument.url,
            responseType: 'json',
            onError: function () {
                cleanup(instrument, callback);
            },
            onSuccess: function (data) {
                // if the json data is corrupt (for instance because of a trailing comma) data will be null
                if (data === null) {
                    callback(false);
                    return;
                }

                //console.log(data);
                if (data.name !== undefined && instrument.name === undefined) {
                    instrument.name = data.name;
                }

                if (data.folder !== undefined && instrument.folder === undefined) {
                    instrument.folder = data.folder;
                }

                if (instrument.name === undefined) {
                    instrument.name = parseUrl(instrument.url).name;
                }

                instrument.localPath = instrument.folder !== undefined ? instrument.folder + '/' + instrument.name : instrument.name;
                objectForEach(data, function (val, key) {
                    if (key !== 'name' && key !== 'folder') {
                        instrument[key] = val;
                    }
                });
                callback();
            }
        });
    }


    sequencer.addInstrument = function (config, callback, callbackAfterAllTasksAreDone) {
        var type = typeString(config),
            instrument, json, name, folder;


        if (type !== 'object') {
            if (sequencer.debug >= 2) {
                console.warn('can\'t add an Instrument with this data', config);
            }
            return false;
        }

        //console.log(config);

        if (config.json) {
            json = config.json;
            name = config.name;
            folder = config.folder;
            if (typeString(json) === 'string') {
                try {
                    json = JSON.parse(json);
                } catch (e) {
                    if (sequencer.debug >= 2) {
                        console.warn('can\'t add an Instrument with this data', config);
                    }
                    return false;
                }
            }
            if (json.mapping === undefined) {
                if (sequencer.debug >= 2) {
                    console.warn('can\'t add an Instrument with this data', config);
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


        instrument = new InstrumentConfig(config);

        sequencer.addTask({
            type: 'load instrument config',
            method: load,
            params: instrument
        }, function (value) {
            //console.log(instrument, callback);
            store(instrument);
            if (callback) {
                //console.log('callback', callback.name)
                callback(instrument);
            }
        }, callbackAfterAllTasksAreDone);

        sequencer.startTaskQueue();

        /*
        load(instrument, function(){
            console.log(instrument);
            store(instrument);
            if(callback){
                callback(instrument);
            }
        });
        */
    };


    sequencer.protectedScope.addInitMethod(function () {
        ajax = sequencer.protectedScope.ajax;
        findItem = sequencer.protectedScope.findItem;
        parseUrl = sequencer.protectedScope.parseUrl;
        storeItem = sequencer.protectedScope.storeItem;
        typeString = sequencer.protectedScope.typeString;
        objectForEach = sequencer.protectedScope.objectForEach;
    });

}
