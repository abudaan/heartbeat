function assetManager() {

    'use strict';

    // console.log('AssetManager');

    var
        // import
        loadLoop, //defined in util.js
        findItem, //defined in util.js
        storeItem, //defined in util.js
        deleteItem, //defined in util.js
        typeString, //defined in util.js
        getArguments, //defined in util.js
        isEmptyObject, // defined in util.js
        objectForEach, //defined in util.js
        storage, //defined in open_module.js
        updateInstruments, //defined in sequencer.js
        findItemsInFolder, //defined in util.js

        busy = false,
        taskIndex = 0,
        finishedTasks = {},
        taskQueue = [],
        callbacks = [];


    sequencer.removeMidiFile = function (path) {
        var item,
            items = [], i, folder;

        if (path.className === 'MidiFile') {
            item = path;
            path = item.localPath;
        } else {
            item = findItem(path, storage.midi);
        }

        if (item.className === 'MidiFile') {
            items.push(item);
        } else {
            folder = item;
            objectForEach(folder, function (item) {
                if (item.className === 'MidiFile') {
                    items.push(item);
                }
            });
        }

        for (i = items.length - 1; i >= 0; i--) {
            item = items[i];
            deleteItem(item.localPath, storage.midi);
        }
    };


    sequencer.removeInstrument = function (path, unloadSamples) {
        var item, items = [], i, folder, mapping, samplePath;

        if (path.className === 'InstrumentConfig') {
            item = path;
            path = item.localPath;
        } else {
            item = findItem(path, storage.instruments);
        }


        if (item.className === 'InstrumentConfig') {
            items.push(item);
        } else {
            folder = item;
            for (i in folder) {
                if (folder.hasOwnProperty(i)) {
                    item = folder[i];
                    if (item.className === 'InstrumentConfig') {
                        items.push(item);
                    }
                }
            }
        }

        for (i = items.length - 1; i >= 0; i--) {
            item = items[i];
            //console.log(item.mapping);
            mapping = item.mapping;
            samplePath = item.sample_path;

            if (unloadSamples === true) {
                // delete samples
                objectForEach(mapping, function (value) {
                    deleteItem(samplePath + '/' + value.n, storage.audio);
                });
                // delete sample pack
                deleteItem(samplePath, storage.samplepacks);
            }
            // remove instrument from storage
            deleteItem(item.localPath, storage.instruments);
            //return deleteItem(path, storage.instruments);
        }

        // if an instrument has been removed, inform the tracks that used that instrument
        updateInstruments();
    };


    sequencer.removeSamplePack = function (path) {
        var item,
            items = [], i, samples, sample, s, folder;

        if (path.className === 'SamplePack') {
            item = path;
            path = item.localPath;
        } else {
            item = findItem(path, storage.samplepacks);
        }

        if (item.className === 'SamplePack') {
            items.push(item);
        } else {
            folder = item;
            objectForEach(folder, function (item) {
                if (item.className === 'SamplePack') {
                    items.push(item);
                }
            });
        }

        for (i = items.length - 1; i >= 0; i--) {
            item = items[i];
            //console.log(item.localPath);
            samples = item.samples;
            for (s = samples.length - 1; s >= 0; s--) {
                sample = samples[s];
                //console.log('->', sample.folder + '/' + sample.id);
                deleteItem(sample.folder + '/' + sample.id, storage.audio);
            }
            item.reset();
            deleteItem(item.localPath, storage.samplepacks);
        }

        updateInstruments();
        /*
                function loopInstruments(root){
                    var item;
        
                    for(i in root){
                        if(root.hasOwnProperty(i)){
                            if(i === 'id' || i === 'path' || i === 'className'){
                                continue;
                            }
                            item = root[i];
                            if(item.className === 'Folder'){
                                loopInstruments(item);
                            }else{
                                item = findItem(item.folder + '/' + item.name, storage.instruments);
                                console.log(item);
                                if(item.parse){
                                    item.parse();
                                }
                            }
                        }
                    }
                }
        
                loopInstruments(storage.instruments);
        */
    };


    sequencer.removeAssetPack = function (path) {
        var item,
            folder;

        if (path.className === 'AssetPack') {
            item = path;
            path = item.localPath;
        } else {
            item = findItem(path, storage.assetpacks);
        }

        if (item.className === 'AssetPack') {
            item.unload();
        } else {
            folder = item;
            objectForEach(folder, function (item) {
                if (item.className === 'AssetPack') {
                    item.unload();
                }
            });
        }
    };


    sequencer.startTaskQueue = function (cb) {
        //console.log('startTaskQueue', taskQueue.length, busy);
        if (busy === true) {
            return;
        }
        busy = true;
        loadQueueLoop(0, cb);
    };


    sequencer.addTask = function (task, callback, callbackAfterAllTasksAreDone) {
        task.id = 'task' + taskIndex++;
        taskQueue.push(task);
        //console.log('task', task.type, taskQueue.length);
        if (callback !== undefined) {
            if (callbackAfterAllTasksAreDone === true) {
                // call the callback only after all tasks are done
                sequencer.addCallbackAfterTask(callback);
            } else {
                // call the callback right after this task is done
                sequencer.addCallbackAfterTask(callback, [task.id]);
            }
        }
        return task.id;
    };


    sequencer.addCallbackAfterTask = function (callback, taskIds) {
        callbacks.push({
            method: callback,
            taskIds: taskIds
        });
        //console.log('taskIds', taskIds);
    };


    // this method loops over the load cue and performs the individual load method per asset
    function loadQueueLoop(index, onTaskQueueDone) {
        var task, params, scope,
            i, j, callback, taskIds,
            performCallback;

        if (index === taskQueue.length) {
            // call all callbacks that have to be called at the end of the loop queue
            for (i = callbacks.length - 1; i >= 0; i--) {
                callback = callbacks[i];
                if (callback === false) {
                    // this callback has already been called
                    continue;
                }
                //console.log(i, callback.method);
                var m = callback.method;
                //callback = false;
                //console.log(1,callback);
                setTimeout(function () {
                    //console.log(2, m);
                    //callback.method();
                    m();
                }, 0);
            }
            finishedTasks = {};
            taskQueue = [];
            callbacks = [];
            taskIndex = 0;
            busy = false;
            if (onTaskQueueDone) {
                // for internal use only, never used so far
                console.log('onTaskQueueDone');
                onTaskQueueDone();
            }
            //console.log('task queue done', sequencer.storage);
            return;
        }

        task = taskQueue[index];
        scope = task.scope || null;
        params = task.params || [];

        //console.log(index, task.type, taskQueue.length);

        if (typeString(params) !== 'array') {
            params = [params];
        }

        function cbActionLoop(success) {
            //console.log('cbActionLoop', success);
            // set a flag that this task has been done
            finishedTasks[task.id] = true;

            // check which callbacks we can call now
            for (i = callbacks.length - 1; i >= 0; i--) {
                callback = callbacks[i];
                if (callback === false) {
                    // this callback has already been called
                    continue;
                }
                taskIds = callback.taskIds;
                // console.log(i, callback.method, taskIds);
                // some callbacks may only be called after a task, or a number of tasks have been done
                if (taskIds !== undefined) {
                    performCallback = true;
                    for (j = taskIds.length - 1; j >= 0; j--) {
                        // if one of the required tasks has not been done yet, do not perform the callback
                        if (finishedTasks[taskIds[j]] !== true) {
                            performCallback = false;
                        }
                    }
                    //console.log('performCallback', performCallback);
                    if (performCallback) {
                        //callback.method.call(null);
                        //console.log(callback);
                        var m = callback.method;
                        callbacks[i] = false;
                        setTimeout(function () {
                            m(success);
                            //console.log(callbacks);
                        }, 0);
                    }
                }
            }

            //console.log('task done', task.name, index, taskQueue.length);
            index++;

            // if(index === taskQueue.length && taskIds === undefined){

            // }
            loadQueueLoop(index, onTaskQueueDone);
        }

        params.push(cbActionLoop);

        //console.log(index, taskQueue.length, task.method.name, params);
        task.method.apply(scope, params);
    }


    sequencer.getInstrument = function (path, exact_match) {
        return findItem(path, storage.instruments, exact_match);
    };

    sequencer.getMidiFile = function (path, exact_match) {
        return findItem(path, storage.midi, exact_match);
    };

    sequencer.getSamplePack = function (path, exact_match) {
        return findItem(path, storage.samplepacks, exact_match);
    };

    sequencer.getSample = function (path, exact_match) {
        return findItem(path, storage.audio, exact_match);
    };

    sequencer.getAssetPack = function (path, exact_match) {
        return findItem(path, storage.assetpacks, exact_match);
    };

    sequencer.getSamplePacks = function (path, include_subfolders) {
        return findItemsInFolder(path, storage.samplepacks, include_subfolders);
    };

    sequencer.getAssetPacks = function (path, include_subfolders) {
        return findItemsInFolder(path, storage.assetpacks, include_subfolders);
    };

    sequencer.getSamples = function (path, include_subfolders) {
        return findItemsInFolder(path, storage.audio, include_subfolders);
    };

    sequencer.getInstruments = function (path, include_subfolders) {
        return findItemsInFolder(path, storage.instruments, include_subfolders);
    };

    sequencer.getMidiFiles = function (path, include_subfolders) {
        return findItemsInFolder(path, storage.midi, include_subfolders);
    };


    sequencer.protectedScope.addInitMethod(function () {
        storage = sequencer.storage;
        loadLoop = sequencer.protectedScope.loadLoop;
        findItem = sequencer.protectedScope.findItem;
        storeItem = sequencer.protectedScope.storeItem;
        deleteItem = sequencer.protectedScope.deleteItem;
        typeString = sequencer.protectedScope.typeString;
        getArguments = sequencer.protectedScope.getArguments;
        isEmptyObject = sequencer.protectedScope.isEmptyObject;
        objectForEach = sequencer.protectedScope.objectForEach;
        updateInstruments = sequencer.protectedScope.updateInstruments;
        findItemsInFolder = sequencer.protectedScope.findItemsInFolder;
    });

}
