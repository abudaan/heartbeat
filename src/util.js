function util() {

    'use strict';

    var
        // import
        context, // defined in open_module.js

        slice = Array.prototype.slice,

        mPow = Math.pow,
        mRound = Math.round,
        mFloor = Math.floor,
        mRandom = Math.random,
        // floor = function(value){
        //  return value | 0;
        // },

        noteLengthNames = {
            1: 'quarter',
            2: 'eighth',
            4: 'sixteenth',
            8: '32th',
            16: '64th'
        },

        foundItem,
        foundFolder;


    function typeString(o) {
        if (typeof o != 'object') {
            return typeof o;
        }

        if (o === null) {
            return 'null';
        }

        //object, array, function, date, regexp, string, number, boolean, error
        var internalClass = Object.prototype.toString.call(o).match(/\[object\s(\w+)\]/)[1];
        return internalClass.toLowerCase();

    }


    function getNiceTime(millis) {
        var h, m, s, ms,
            seconds,
            timeAsString = '';

        seconds = millis / 1000; // → millis to seconds
        h = floor(seconds / (60 * 60));
        m = floor((seconds % (60 * 60)) / 60);
        s = floor(seconds % (60));
        ms = round((seconds - (h * 3600) - (m * 60) - s) * 1000);

        timeAsString += h + ':';
        timeAsString += m < 10 ? '0' + m : m;
        timeAsString += ':';
        timeAsString += s < 10 ? '0' + s : s;
        timeAsString += ':';
        timeAsString += ms === 0 ? '000' : ms < 10 ? '00' + ms : ms < 100 ? '0' + ms : ms;

        //console.log(h, m, s, ms);

        return {
            hour: h,
            minute: m,
            second: s,
            millisecond: ms,
            timeAsString: timeAsString,
            timeAsArray: [h, m, s, ms]
        };
    }


    function clone(obj) {
        var attr, copy;
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        copy = obj.constructor();
        for (attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = clone(obj[attr]);
            }
        }
        return copy;
    }


    function copyObject(obj) {
        var prop, copy = {};
        if (typeString(obj) !== 'object') {
            return {};
        }
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                copy[prop] = obj[prop];
            }
        }
        return copy;
    }


    function copyName(name) {
        var i = name.indexOf('_copy'),
            copy, numCopies;

        if (i === -1) {
            copy = name + '_copy';
        } else {
            numCopies = name.substring(i + 5);
            if (numCopies === '') {
                copy = name + '2';
            } else {
                copy = name.slice(0, -1) + (parseInt(numCopies, 10) + 1);
            }
        }
        return copy;
    }


    function removeFromArray(tobeRemoved, array) {
        var i, j,
            maxi,
            maxj,
            newArray = [],
            remove,
            elementA, elementB;

        if (typeString(tobeRemoved) !== 'array') {
            tobeRemoved = [tobeRemoved];
        }
        maxi = array.length;
        maxj = tobeRemoved.length;

        for (i = 0; i < maxi; i++) {
            elementA = array[i];
            remove = false;
            for (j = 0; j < maxj; j++) {
                elementB = tobeRemoved[j];
                if (elementA === elementB) {
                    remove = true;
                    break;
                }
            }
            if (remove === false) {
                newArray.push(elementA);
            }
        }

        return newArray;
    }


    function removeFromArray2(array, callback) {
        var i, maxi = array.length,
            element,
            newArray = [];

        for (i = 0; i < maxi; i++) {
            element = array[i];
            if (callback(element) === false) {
                newArray.push(element);
            }
        }
        return newArray;
    }


    function round(value, decimals) {
        if (decimals === undefined || decimals <= 0) {
            return mRound(value);
        }
        var p = mPow(10, decimals);
        //console.log(p, decimals)
        return mRound(value * p) / p;
    }


    function floor(value, decimals) {
        if (decimals === undefined || decimals <= 0) {
            return mFloor(value);
        }
        var p = mPow(10, decimals);
        //console.log(p,decimals)
        return mFloor(value * p) / p;
    }


    function isEmptyObject(obj, ignore_keys) {
        //console.log('empty',obj)
        if (obj === undefined) {
            return false;
        }
        var i, isEmpty = true;
        ignore_keys = ignore_keys || '';
        for (i in obj) {
            //console.log(i, ignore_keys.indexOf(i));
            if (obj.hasOwnProperty(i) && ignore_keys.indexOf(i) === -1) {
                isEmpty = false;
                break;
            }
        }
        return isEmpty;
        //return Object.getOwnPropertyNames(obj).length === 0;
    }


    function objectForEach(o, cb) {
        var name,
            obj = o;
        for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                //cb.call(this, obj[name], name);
                cb(obj[name], name);
            }
        }
    }


    function objectToArray(obj) {
        var i, a = [];
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                a.push(obj[i]);
            }
        }
        return a;
    }

    function arrayToObject(arr, property) {
        var i, o = {};
        for (i = arr.length - 1; i >= 0; i--) {
            o[arr[i][property]] = arr[i];
        }
        return o;
    }


    function createClass(parent, constructor) {
        var thisClass;
        // class constructor
        thisClass = function () {
            this.parent = parent;
            if (arguments.length > 0) {
                parent.apply(this, arguments);
                if (constructor !== undefined) {
                    constructor.apply(this, arguments);
                }
            }
        };
        // inheritance
        thisClass.prototype = Object.create(parent.prototype);
        return thisClass;
    }

    function ajax(config) {
        var
            request = new XMLHttpRequest(),
            method = config.method === undefined ? 'GET' : config.method,
            fileSize, promise;

        function executor(resolve, reject) {

            reject = reject || function () { };
            resolve = resolve || function () { };

            request.onload = function () {
                if (request.status !== 200) {
                    reject(request.status);
                    return;
                }

                if (config.responseType === 'json') {
                    fileSize = request.response.length;
                    resolve(JSON.parse(request.response), fileSize);
                } else {
                    resolve(request.response);
                }
            };

            request.onerror = function (e) {
                config.onError(e);
            };

            request.open(method, config.url, true);

            if (config.overrideMimeType) {
                request.overrideMimeType(config.overrideMimeType);
            }

            if (config.responseType) {
                if (config.responseType === 'json') {
                    request.responseType = 'text';
                } else {
                    request.responseType = config.responseType;
                }
            }

            if (method === 'POST') {
                request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            }

            if (config.data) {
                request.send(config.data);
            } else {
                request.send();
            }
        }

        promise = new Promise(executor);
        //console.log(promise);

        if (config.onSuccess !== undefined) {
            promise.then(config.onSuccess, config.onError);
        } else {
            return promise;
        }
    }


    function ajax2(config) {

        var request = new XMLHttpRequest(),
            method = config.method === undefined ? 'GET' : config.method,
            fileSize;

        request.onreadystatechange = function () {
            if (request.request === 404) {
                //console.error(config.url, '404');
                config.onError(404);
            }
        };

        request.onload = function () {
            if (request.status !== 200) {
                //console.error(config.url, request.status);
                config.onError(request.status);
                return;
            }
            // this doesn't work with gzip server compression!
            //fileSize = round(request.getResponseHeader('Content-Length')/1024/1024, 2);
            //console.log(fileSize);
            //console.log(config.url, request.getResponseHeader('Content-Length'));
            //console.log(sequencer.os, request.response);

            //if(sequencer.os === 'ios' && config.responseType === 'json'){
            if (config.responseType === 'json') {
                //fileSize = round(request.response.length/1024/1024, 2);
                fileSize = request.response.length;
                //console.log(config.url, fileSize)
                config.onSuccess(JSON.parse(request.response), fileSize);
                //config.onSuccess(JSON.parse(request.response));
            } else {
                //config.onSuccess(request.response, fileSize);
                config.onSuccess(request.response);
            }
        };

        request.onerror = function (e) {
            //console.error(e);
            config.onError(e);
        };

        /*
                request.onreadystatechange = function() {
                    if (success !== undefined && xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                        success(request.responseText);
                    } else if (error !== undefined ) {
                        error(request);
                    }
                };
        */
        request.open(method, config.url, true);


        if (config.overrideMimeType) {
            request.overrideMimeType(config.overrideMimeType);
        }

        if (config.responseType) {
            //console.log(config.responseType, config.url);
            //request.setRequestHeader('Content-type', 'application/' + config.responseType);

            //if(sequencer.os === 'ios' && config.responseType === 'json'){
            if (config.responseType === 'json') {
                request.responseType = 'text';
            } else {
                request.responseType = config.responseType;
            }

            //request.setRequestHeader('Content-type', config.responseType);
        }

        if (method === 'POST') {
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }

        if (config.data) {
            request.send(config.data);
        } else {
            request.send();
        }
    }

    function loop2(root, id, indent) {
        var i, tmp;
        for (i in root) {
            if (foundFolder !== false) {
                return;
            }
            if (root.hasOwnProperty(i)) {
                tmp = root[i];
                if (tmp !== undefined && tmp.className === 'Folder') {
                    //console.log(indent, i, id);
                    if (i === id) {
                        foundFolder = tmp;
                        return;
                    } else {
                        loop2(tmp, id, indent + '.');
                    }
                }
            }
        }
    }


    function loop3(folder, items, search_subfolders, indent) {
        var i, item;
        for (i in folder) {
            if (folder.hasOwnProperty(i)) {
                if (i === 'id' || i === 'path' || i === 'className') {
                    continue;
                }
                item = folder[i];

                if (item === undefined) {
                    continue;
                }

                //console.log(indent, i, item, item.className);
                if (item.className === 'Folder') {
                    if (search_subfolders === true) {
                        loop3(item, items, search_subfolders, indent + '.');
                    }
                } else {
                    // loaded samples are audio object so they don't have a name, we use the key of the storage for name
                    if (item.name === undefined) {
                        items.push({ name: i, data: item });
                    } else {
                        items.push(item);
                    }
                }
            }
        }
    }


    function findItemsInFolder(path, root, search_subfolders) {
        search_subfolders = search_subfolders === undefined ? true : search_subfolders;
        var folders = pathToArray(path),
            numFolders = folders.length,
            currentFolder, i, folder,
            searchFolder = folders[numFolders - 1],
            items = [];

        if (numFolders === 0) {
            // return all items in root folder (for instance sequencer.storage.midi)
            loop3(root, items, search_subfolders, '.');
        } else {
            currentFolder = root;

            for (i = 0; i < numFolders; i++) {
                folder = folders[i];
                currentFolder = currentFolder[folder];
                if (currentFolder === undefined) {
                    break;
                }
            }
            //console.log(root, currentFolder);
            if (currentFolder) {
                loop3(currentFolder, items, search_subfolders, '.');
            } else {
                // declared on top of this file
                foundFolder = false;
                loop2(root, searchFolder, '.');
                loop3(foundFolder, items, search_subfolders, '.');
            }
        }

        items.sort(function (a, b) {
            var nameA = a.name.toLowerCase(),
                nameB = b.name.toLowerCase();
            if (nameA < nameB) { //sort string ascending
                return -1;
            } else if (nameA > nameB) {
                return 1;
            }
            return 0; //default return value (no sorting)
        });

        return items;
    }


    function loop(obj, id, indent) {
        var i, tmp, type;
        for (i in obj) {
            if (foundItem !== false) {
                return;
            }
            if (obj.hasOwnProperty(i)) {
                tmp = obj[i];
                type = typeString(tmp);
                //console.log(indent, i, id, tmp, type, tmp.className)
                if (i === id) {
                    foundItem = tmp;
                    break;
                }
                //console.log(tmp);
                // tmp can be null if the sample has not been loaded!
                if (tmp !== undefined && tmp.className === 'Folder') {
                    indent = indent + '.';
                    loop(tmp, id, indent);
                }
            }
        }
    }


    function findItem(path, root, exact_match) {
        exact_match = exact_match === undefined ? false : exact_match;
        if (path === undefined || path === '') {
            return root;
        }

        //console.log('findItem', path);
        var i, folder, folders, numFolders, currentFolder, item, itemId;
        folders = pathToArray(path);
        itemId = folders.pop();
        numFolders = folders.length;
        //console.log(folders, itemId);

        if (itemId === '') {
            return root;
        }

        // declared on top of util.js
        foundItem = false;

        if (folders.length > 0) {
            currentFolder = root;

            for (i = 0; i < numFolders; i++) {
                folder = folders[i];
                currentFolder = currentFolder[folder];
                if (currentFolder === undefined) {
                    break;
                }
            }
            //console.log(root, currentFolder);
            if (currentFolder) {
                item = currentFolder[itemId];
            }
        }

        if (item === undefined) {
            if (exact_match === true) {
                item = root[itemId];
            } else {
                loop(root, itemId, '.');
                item = foundItem;
            }
        }
        //console.log(item, itemId, exact_match);
        //console.log('found', root.id, folders, itemId, item);
        if (item === undefined) {
            item = false;
        }
        return item;
    }


    function storeItem(item, path, root) {
        var folder, folders, numFolders, currentFolder, i, pathString = '';
        folders = pathToArray(path);
        numFolders = folders.length;
        currentFolder = root;

        for (i = 0; i < numFolders; i++) {
            folder = folders[i];
            pathString += '/' + folder;
            //console.log(folder);
            if (currentFolder[folder] === undefined) {
                currentFolder[folder] = {
                    path: pathString,
                    className: 'Folder'
                };
            }
            if (i === numFolders - 1) {
                currentFolder[folder] = item;
                break;
            }
            currentFolder = currentFolder[folder];
        }
    }


    // -> classical/mozart/sonatas/early
    function deleteItem(path, root) {
        var item, itemId, i, obj = root;

        // for deleting items you need to specify the complete path, hence the 3rd argument is set to true
        //console.log('deleteItem', path);
        item = findItem(path, root, true);

        /*
            // what was this for, because it doesn't work when deleting samples (as AudioBuffer) from storage.audio:
            item = findItem(path, root);
            console.log(item);
            path = item.folder + '/' + item.name;
            console.log(path);
        */


        if (!item) {
            return false;
        } else if (item.className === 'Folder') {
            // remove files in folder
            for (i in item) {
                if (item.hasOwnProperty(i)) {
                    if (i !== 'className') {
                        delete item[i];
                    }
                }
            }
        }

        path = pathToArray(path);

        while (path.length > 1) {
            i = 0;
            obj = root;

            while (i < path.length - 1) {
                //console.log(path[i],obj);
                obj = obj[path[i++]];
            }
            //console.log(obj);
            itemId = path[i];
            item = obj[itemId];

            if (item.className === 'Folder') {
                if (isEmptyObject(item, 'path className')) {
                    delete obj[itemId];
                    //console.log('deleting empty folder', itemId);
                }
            } else {
                delete obj[itemId];
                //console.log('deleting item', itemId);
            }

            path.pop();
        }

        //console.log(path, path[0] === '', root[path[0]]);

        if (path.length === 1 && path[0] !== '') {
            itemId = path[0];
            item = root[itemId];
            //console.log(path, path.length, itemId);
            if (item.className === 'Folder') {
                if (isEmptyObject(root[itemId], 'path className')) {
                    delete root[itemId];
                    //console.log('deleting empty folder', itemId, '(2)');
                }
            } else {
                delete root[itemId];
                //console.log('deleting item', itemId, '(2)');
            }
        }
        return true;
    }


    function parseSample(id, sample) {
        return new Promise(function (resolve, reject) {
            try {
                context.decodeAudioData(sample,
                    function onSuccess(buffer) {
                        //console.log(id, buffer);
                        resolve({ 'id': id, 'buffer': buffer });
                    },
                    function onError(e) {
                        console.log('error decoding audiodata', id, e);
                        //reject(e); // don't use reject because we don't want the parent promise to reject
                        resolve({ 'id': id, 'buffer': undefined });
                    }
                );
            } catch (e) {
                console.log('error decoding audiodata', id, e);
                //reject(e);
                resolve({ 'id': id, 'buffer': undefined });
            }
        });
    }


    function loadAndParseSample(id, url) {
        return new Promise(function (resolve, reject) {
            ajax({ url: url, responseType: 'arraybuffer' }).then(
                function onFulfilled(data) {
                    parseSample(id, data).then(resolve, reject);
                },
                function onRejected() {
                    resolve({ 'id': id, 'buffer': undefined });
                }
            );
        });
    }


    function parseSamples(mapping) {
        var key, sample,
            promises = [];

        for (key in mapping) {
            if (mapping.hasOwnProperty(key)) {
                sample = mapping[key];
                if (sample.indexOf('http://') === -1) {
                    promises.push(parseSample(key, base64ToBinary(sample)));
                } else {
                    promises.push(loadAndParseSample(key, sample));
                }
            }
        }

        return new Promise(function (resolve, reject) {
            Promise.all(promises).then(
                function onFulfilled(values) {
                    var mapping = {};

                    values.forEach(function (value) {
                        mapping[value.id] = value.buffer;
                    });
                    resolve(mapping);
                },
                function onRejected(e) {
                    reject(e);
                }
            );
        });
    }


    // use xhr.overrideMimeType('text/plain; charset=x-user-defined');
    // all credits: https://github.com/gasman/jasmid
    function toBinaryString(input) {
        /* munge input into a binary string */
        var t, ff, mx, scc, z;
        t = input || '';
        ff = [];
        mx = t.length;
        scc = String.fromCharCode;
        for (z = 0; z < mx; z++) {
            ff[z] = scc(t.charCodeAt(z) & 255);
        }
        return ff.join('');
    }


    function toUint8Array(input) {
        /* munge input into a binary string */
        var t, uint, mx, scc, z;
        t = input || '';
        mx = t.length;
        uint = new Uint8Array(mx);
        scc = String.fromCharCode;
        for (z = 0; z < mx; z++) {
            uint[z] = scc(t.charCodeAt(z) & 255);
        }
        return uint;
    }


    // adapted version of https://github.com/danguer/blog-examples/blob/master/js/base64-binary.js
    function base64ToBinary(input) {
        var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
            bytes, uarray, buffer,
            lkey1, lkey2,
            chr1, chr2, chr3,
            enc1, enc2, enc3, enc4,
            i, j = 0;

        bytes = Math.ceil((3 * input.length) / 4.0);
        buffer = new ArrayBuffer(bytes);
        uarray = new Uint8Array(buffer);

        lkey1 = keyStr.indexOf(input.charAt(input.length - 1));
        lkey2 = keyStr.indexOf(input.charAt(input.length - 1));
        if (lkey1 == 64) bytes--; //padding chars, so skip
        if (lkey2 == 64) bytes--; //padding chars, so skip

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

        for (i = 0; i < bytes; i += 3) {
            //get the 3 octects in 4 ascii chars
            enc1 = keyStr.indexOf(input.charAt(j++));
            enc2 = keyStr.indexOf(input.charAt(j++));
            enc3 = keyStr.indexOf(input.charAt(j++));
            enc4 = keyStr.indexOf(input.charAt(j++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            uarray[i] = chr1;
            if (enc3 != 64) uarray[i + 1] = chr2;
            if (enc4 != 64) uarray[i + 2] = chr3;
        }
        //console.log(buffer);
        return buffer;
    }


    function pathToArray(path) {
        if (path === undefined) {
            return [];
        }
        //console.log('path', path);
        path = path.replace(/undefined/g, '');
        path = path.replace(/\/{2,}/g, '/');
        path = path.replace(/^\//, '');
        path = path.replace(/\/$/, '');
        path = path.split('/');
        return path;
    }


    function parseUrl(url) {
        var filePath = '',
            fileName = url,
            fileExtension = '',
            slash, dot, ext;

        url = url.replace(/\/{2,}/g, '/');
        url = url.replace(/^\//, '');
        url = url.replace(/\/$/, '');

        // check if the url has a path and/or an extension
        slash = url.lastIndexOf('/');
        if (slash !== -1) {
            fileName = url.substring(slash + 1);
            filePath = url.substring(0, slash);
        }

        dot = url.lastIndexOf('.');
        if (dot !== -1) {
            ext = url.substring(dot + 1);
            if (ext.length >= 3 && ext.length <= 4) {
                fileExtension = ext;
                fileName = url.substring(slash + 1, dot);
            }
        }

        return {
            path: filePath,
            name: fileName,
            ext: fileExtension
        };
    }


    // generic load method that calls the load() method of the item to be loaded
    // callback2 is called every time an item is loaded, callback1 is called after all items have been loaded
    function loadLoop(i, numItems, items, callback1, callback2) {
        if (numItems === 0) {
            if (callback1) {
                callback1();
            }
            return;
        }
        var item = items[i];
        item.load(function () {
            //console.log(item.name, 'loaded', i, numItems);
            if (callback2) {
                callback2(arguments);
            }
            i++;
            if (i < numItems) {
                loadLoop(i, numItems, items, callback1, callback2);
            } else {
                if (callback1) {
                    callback1();
                }
            }
        });
    }


    function getArguments(args) {
        var result = [],
            loop, arg;

        args = slice.call(args);

        loop = function (data, i, maxi) {
            for (i = 0; i < maxi; i++) {
                arg = data[i];
                if (typeString(arg) === 'array') {
                    loop(arg, 0, arg.length);
                } else {
                    result.push(arg);
                }
            }
        };

        loop(args, 0, args.length);
        return result;
    }


    function getEqualPowerCurve(numSteps, type, maxValue) {
        var i, value, percent,
            values = new Float32Array(numSteps);
        for (i = 0; i < numSteps; i++) {
            percent = i / numSteps;
            if (type === 'fadeIn') {
                value = Math.cos((1.0 - percent) * 0.5 * Math.PI) * maxValue;
            } else if (type === 'fadeOut') {
                value = Math.cos(percent * 0.5 * Math.PI) * maxValue;
            }
            values[i] = value;
            if (i === numSteps - 1) {
                values[i] = type === 'fadeIn' ? 1 : 0;
            }
        }
        return values;
    }


    function remap(value, oldMin, oldMax, newMin, newMax) {
        var oldRange = oldMax - oldMin,
            newRange = newMax - newMin,
            result;
        result = (((value - oldMin) * newRange) / oldRange) + newMin;
        return result;
    }


    // filters assets with classname "name" from object "obj" and stores them in array "result"
    function filterItemsByClassName(obj, name, result) {
        var i, item, type;

        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                item = obj[i];
                if (item.className === name) {
                    result.push(item);
                } else {
                    type = typeString(item);
                    if (type === 'object') {
                        loop(item, name, result);
                    }
                }
            }
        }
    }

    function createSlider(config) {
        var slider = config.slider,
            message = config.message,
            label = config.label,
            sliderWrapper;
        //mouseDownCalls = [],
        //mouseMoveCalls = [],
        //mouseUpCalls = [];

        if (config.label === undefined) {
            label = slider.parentNode.firstChild;
        }

        if (config.initialSliderValue !== undefined) {
            slider.value = config.initialSliderValue;
        }

        if (config.initialLabelValue !== undefined) {
            label.innerHTML = message.replace('{value}', config.initialLabelValue);
        }

        if (config.min !== undefined) {
            slider.min = config.min;
        }

        if (config.max !== undefined) {
            slider.max = config.max;
        }

        if (config.step !== undefined) {
            slider.step = config.step;
        }


        function onMouseDown(e) {
            var value = slider.valueAsNumber;
            if (config.onMouseDown) {
                config.onMouseDown(value, e);
            }
            if (sliderWrapper.onMouseDown) {
                sliderWrapper.onMouseDown(value, e);
            }
        }

        function onMouseUp(e) {
            var value = slider.valueAsNumber;
            if (config.onMouseUp) {
                config.onMouseUp(value, e);
            }
            if (sliderWrapper.onMouseUp) {
                sliderWrapper.onMouseUp(value, e);
            }
        }

        function onMouseMove(e) {
            var value = slider.valueAsNumber;
            if (config.onMouseMove) {
                config.onMouseMove(value, e);
            }
            if (sliderWrapper.onMouseMove) {
                sliderWrapper.onMouseMove(value, e);
            }
        }

        function onChange(e) {
            var value = slider.valueAsNumber;
            if (config.onChange) {
                config.onChange(value, e);
            }
            if (sliderWrapper.onChange) {
                sliderWrapper.onChange(value, e);
            }
        }

        slider.addEventListener('mousedown', function (e) {
            setTimeout(onMouseDown, 0, e);
            slider.addEventListener('mousemove', onMouseMove, false);
        }, false);


        slider.addEventListener('mouseup', function (e) {
            setTimeout(onMouseUp, 0, e);
            slider.removeEventListener('mousemove', onMouseMove, false);
        }, false);

        slider.addEventListener('change', function (e) {
            //console.log('change');
            onChange(e);
        }, false);

        sliderWrapper = {
            getValue: function () {
                if (config.getValue) {
                    return config.getValue(slider.valueAsNumber);
                } else {
                    return slider.valueAsNumber;
                }
            },
            setValue: function (value) {
                if (config.setValue) {
                    slider.value = config.setValue(value);
                } else {
                    slider.value = value;
                }
            },
            setLabel: function (value) {
                label.innerHTML = message.replace('{value}', value);
            },
            elem: slider,
            element: slider,
        };

        sliderWrapper.set = function (value) {
            setLabel(value);
            setValue(value);
        };

        return sliderWrapper;
    }

    function createSlider2(config) {
        var slider = config.slider,
            message = config.message,
            label = slider.parentNode.firstChild;


        if (config.initialValueSlider) {
            slider.value = config.initialValueSlider;
            label.innerHTML = message.replace('{value}', calculate());
        }


        if (config.initialValueLabel) {
            label.innerHTML = message.replace('{value}', config.initialValueLabel);
            slider.value = calculateFromLabel(config.initialValueLabel);
        }


        function onMouseMove() {
            var value = calculate();
            if (config.onMouseMove !== undefined) {
                config.onMouseMove(slider.valueAsNumber, value);
            }
            label.innerHTML = message.replace('{value}', value);
        }


        function onMouseUp() {
            var value = calculate();
            if (config.onMouseUp !== undefined) {
                config.onMouseUp(slider.valueAsNumber, value);
            }
            label.innerHTML = message.replace('{value}', value);
        }


        function onMouseDown() {
            var value = calculate();
            if (config.onMouseDown !== undefined) {
                config.onMouseDown(slider.valueAsNumber, value);
            }
            label.innerHTML = message.replace('{value}', value);
        }


        function calculate() {
            var value = slider.valueAsNumber;
            if (config.calculate !== undefined) {
                value = config.calculate(value);
            }
            return value;
        }


        function calculateFromLabel(value) {
            if (config.calculateFromLabel !== undefined) {
                value = config.calculateFromLabel(value);
            }
            return value;
        }


        slider.addEventListener('mousedown', function () {
            setTimeout(onMouseDown, 0);
            slider.addEventListener('mousemove', onMouseMove, false);
        }, false);


        slider.addEventListener('mouseup', function () {
            setTimeout(onMouseUp, 0);
            slider.removeEventListener('mousemove', onMouseMove, false);
        }, false);


        return {
            updateSlider: function (value) {
                slider.value = value;
                label.innerHTML = message.replace('{value}', calculate(value));
            },
            updateLabel: function (value) {
                label.innerHTML = message.replace('{value}', value);
                slider.value = calculateFromLabel(value);
            },
            getValue1: function () {
                return slider.valueAsNumber;
            },
            getValue2: function () {
                return calculate(slider.valueAsNumber);
            }
        };
    }


    function getRandom(min, max, round) {
        var r = mRandom() * (max - min) + min;
        if (round === true) {
            return mRound(r);
        } else {
            return r;
        }
    }


    function getRandomNotes(config) {
        var i,
            ticks = 0,
            events = [],
            midiEvent,
            velocity,
            numNotes,
            noteNumber,
            noteLength,
            minVelocity,
            maxVelocity,
            minNoteNumber,
            maxNoteNumber,
            ppq;

        //console.log(config);

        config = config || {};
        ppq = config.ppq || sequencer.defaultPPQ;
        numNotes = config.numNotes || 20;
        noteLength = config.noteLength || ppq / 2; // ticks
        minVelocity = config.minVelocity || 30;
        maxVelocity = config.maxVelocity || 127;
        minNoteNumber = config.minNoteNumber || 60;
        maxNoteNumber = config.maxNoteNumber || 127;

        if (noteLength > ppq) {
            noteLength = ppq;
        }

        //console.log(ppq, numNotes, noteLength, minVelocity, maxVelocity, minNoteNumber, maxNoteNumber);


        for (i = 0; i < numNotes; i++) {
            noteNumber = getRandom(minNoteNumber, maxNoteNumber, true);
            velocity = getRandom(minVelocity, maxVelocity, true);

            //console.log(ticks, noteNumber, velocity);

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
            events.push(midiEvent);
            ticks += noteLength;

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
            events.push(midiEvent);
            ticks += ppq - noteLength;
        }

        return events;
    }


    function convertPPQ() {//oldPPQ, newPPQ, data, ..., ...
        var args = slice.call(arguments),
            oldPPQ = args[0],
            newPPQ = args[1],
            ratio = newPPQ / oldPPQ,
            i, event;

        if (isNaN(oldPPQ) || isNaN(newPPQ)) {
            if (sequencer.debug === 4) {
                console.error('PPQ values must be numbers');
            }
            return;
        }

        function loop(data, i, maxi) {
            var arg, type, track, j, t;
            for (j = i; j < maxi; j++) {
                arg = data[j];
                type = typeString(arg);
                //console.log(type, arg.className);
                if (type === 'array') {
                    convert(arg);
                } else if (type === 'object') {
                    if (arg.className === 'Part' || arg.className === 'Track' || arg.className === 'Song') {
                        convert(arg.events);
                    } else if (arg.className === 'MidiFile') {
                        //console.log(arg.numTracks, arg.tracks[0].events);
                        for (t = arg.numTracks - 1; t >= 0; t--) {
                            track = arg.tracks[t];
                            //console.log(track.needsUpdate);
                            if (track.needsUpdate === true) {
                                track.update();
                                if (track.events) {
                                    convert(track.events);
                                }
                            }
                        }
                    }
                }
            }
        }

        loop(args, 2, args.length);

        function convert(events) {
            for (i = events.length - 1; i >= 0; i--) {
                event = events[i];
                event.ticks = ratio * event.ticks;
                if (event.state !== 'new') {
                    event.state = 'changed';
                }
            }
        }
    }


    function getNoteLengthName(song, value) {
        for (var divider in noteLengthNames) {
            if (noteLengthNames.hasOwnProperty(divider)) {
                //console.log(value, song.ppq/divider);
                if (value === song.ppq / divider) {
                    return noteLengthNames[divider];
                }
            }
        }
        return false;
    }


    function getMicrosecondsFromBPM(bpm) {
        return round(60000000 / bpm);
    }


    function insertLink(s) {
        // @TODO: fix this -> should be md syntax
        var href,
            i = s.indexOf('http://');
        if (i !== -1) {
            href = s.substring(i);
            i = href.indexOf(' ');
            if (i !== -1) {
                href = href.substring(0, i);
            }
        }
        return '<a href="' + href + '"></a>';
    }


    function getWaveformData(buffer, config, callback) {
        var i, maxi,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            pcmRight = buffer.getChannelData(0),
            pcmLeft = buffer.getChannelData(0),
            numSamples = pcmRight.length,
            width, // max width of a canvas on chrome/chromium is 32000
            height = config.height || 100,
            color = config.color || '#71DE71',
            bgcolor = config.bgcolor || '#000',
            density,
            scale = height / 2,
            sampleStep = config.sampleStep || 50,
            height,
            lastWidth,
            numImages,
            currentImage,
            xPos = 0,
            offset = 0,
            urls = [],
            imgElement,
            imgElements = [];

        //console.log(pcmRight.length, pcmLeft.length, config.samples.length);

        if (config.width !== undefined) {
            width = config.width;
            density = width / numSamples;
        } else {
            density = config.density || 1;
            width = 1000;
            lastWidth = (numSamples * config.density) % width;
            numImages = Math.ceil((numSamples * config.density) / width);
            currentImage = 0;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = bgcolor;
        ctx.fillRect(0, 0, width, height);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(0, scale);


        for (i = 0; i < numSamples; i += sampleStep) {
            xPos = (i - offset) * density;
            if (xPos >= width) {
                //console.log(width, height)
                //ctx.closePath();
                ctx.stroke();
                urls.push(canvas.toDataURL('image/png'));
                currentImage++;
                if (currentImage === numImages - 1) {
                    canvas.width = lastWidth;
                } else {
                    canvas.width = width;
                }
                ctx.beginPath();
                ctx.strokeStyle = color;
                offset = i;
                xPos = 0;
                ctx.moveTo(xPos, scale - (pcmRight[i] * scale));
            } else {
                ctx.lineTo(xPos, scale - (pcmRight[i] * scale));
                //console.log(scale - (pcmRight[i] * scale));
            }
        }

        if (xPos < width) {
            //ctx.closePath();
            ctx.stroke();
            urls.push(canvas.toDataURL('image/png'));
        }

        callback(urls);

        /*
        // create html image elements from the data-urls
        for(i = 0, maxi = urls.length; i < maxi; i++){
            imgElement = document.createElement('img');
            imgElement.src = urls[i];
            imgElement.origWidth = imgElement.width;
            imgElement.height = 100;
            imgElements.push(imgElement);
        }

        callback({
            dataURIs: urls,
            imgElements: imgElements
        });
        */
    }


    function encode64(buffer) {
        var binary = '',
            bytes = new Uint8Array(buffer),
            len = bytes.byteLength;

        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    /*\
    |*|
    |*|  Base64 / binary data / UTF-8 strings utilities
    |*|
    |*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
    |*|
    \*/

    /* Array of bytes to base64 string decoding */

    function b64ToUint6(nChr) {

        return nChr > 64 && nChr < 91 ?
            nChr - 65
            : nChr > 96 && nChr < 123 ?
                nChr - 71
                : nChr > 47 && nChr < 58 ?
                    nChr + 4
                    : nChr === 43 ?
                        62
                        : nChr === 47 ?
                            63
                            :
                            0;

    }


    function base64DecToArr(sBase64, nBlocksSize) {

        var
            sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""),
            nInLen = sB64Enc.length,
            nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
            taBytes = new Uint8Array(nOutLen);

        for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
                for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++ , nOutIdx++) {
                    taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
                }
                nUint24 = 0;

            }
        }

        return taBytes;
    }

    /* Base64 string to array encoding */

    function uint6ToB64(nUint6) {

        return nUint6 < 26 ?
            nUint6 + 65
            : nUint6 < 52 ?
                nUint6 + 71
                : nUint6 < 62 ?
                    nUint6 - 4
                    : nUint6 === 62 ?
                        43
                        : nUint6 === 63 ?
                            47
                            :
                            65;

    }

    function base64EncArr(aBytes) {

        var nMod3 = 2, sB64Enc = "";

        for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
            nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
                nUint24 = 0;
            }
        }

        return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

    }

    /* UTF-8 array to DOMString and vice versa */

    function UTF8ArrToStr(aBytes) {

        var sView = "";

        for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
            nPart = aBytes[nIdx];
            sView += String.fromCharCode(
                nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
                    /* (nPart - 252 << 30) may be not so safe in ECMAScript! So...: */
                    (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                    : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
                        (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                        : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
                            (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                            : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
                                (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                                : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
                                    (nPart - 192 << 6) + aBytes[++nIdx] - 128
                                    : /* nPart < 127 ? */ /* one byte */
                                    nPart
            );
        }

        return sView;

    }

    function strToUTF8Arr(sDOMStr) {

        var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

        /* mapping... */

        for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
            nChr = sDOMStr.charCodeAt(nMapIdx);
            nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
        }

        aBytes = new Uint8Array(nArrLen);

        /* transcription... */

        for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
            nChr = sDOMStr.charCodeAt(nChrIdx);
            if (nChr < 128) {
                /* one byte */
                aBytes[nIdx++] = nChr;
            } else if (nChr < 0x800) {
                /* two bytes */
                aBytes[nIdx++] = 192 + (nChr >>> 6);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else if (nChr < 0x10000) {
                /* three bytes */
                aBytes[nIdx++] = 224 + (nChr >>> 12);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else if (nChr < 0x200000) {
                /* four bytes */
                aBytes[nIdx++] = 240 + (nChr >>> 18);
                aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else if (nChr < 0x4000000) {
                /* five bytes */
                aBytes[nIdx++] = 248 + (nChr >>> 24);
                aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else /* if (nChr <= 0x7fffffff) */ {
                /* six bytes */
                aBytes[nIdx++] = 252 + (nChr >>> 30);
                aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            }
        }

        return aBytes;

    }

    sequencer.protectedScope.addInitMethod(function () {
        context = sequencer.protectedScope.context;
    });

    // mozilla tools
    sequencer.util.b64ToUint6 = b64ToUint6;
    sequencer.util.base64DecToArr = base64DecToArr;
    sequencer.util.uint6ToB64 = uint6ToB64;
    sequencer.util.base64EncArr = base64EncArr;
    sequencer.util.UTF8ArrToStr = UTF8ArrToStr;
    sequencer.util.strToUTF8Arr = strToUTF8Arr;
    sequencer.util.ajax = ajax;
    sequencer.util.ajax2 = ajax2;
    sequencer.util.parseSamples = parseSamples;


    //sequencer.findItem = findItem;
    //sequencer.storeItem = storeItem;

    sequencer.util.round = round;
    sequencer.util.floor = floor;
    sequencer.util.remap = remap;
    sequencer.util.getRandom = getRandom;
    sequencer.util.createSlider = createSlider;
    sequencer.util.createSlider2 = createSlider2;
    sequencer.util.getRandomNotes = getRandomNotes;
    sequencer.util.getEqualPowerCurve = getEqualPowerCurve;
    sequencer.util.objectForEach = objectForEach;
    sequencer.util.insertLink = insertLink;
    sequencer.util.encode64 = encode64;

    sequencer.protectedScope.getNoteLengthName = getNoteLengthName;
    sequencer.protectedScope.toBinaryString = toBinaryString;
    sequencer.protectedScope.base64ToBinary = base64ToBinary;
    //sequencer.protectedScope.base64ToBinary = base64DecToArr;
    sequencer.protectedScope.toUint8Array = toUint8Array;
    sequencer.protectedScope.getArguments = getArguments;
    sequencer.protectedScope.pathToArray = pathToArray;
    sequencer.protectedScope.parseUrl = parseUrl;
    sequencer.protectedScope.loadLoop = loadLoop;


    sequencer.protectedScope.findItem = findItem;
    sequencer.protectedScope.storeItem = storeItem;
    sequencer.protectedScope.deleteItem = deleteItem;
    sequencer.protectedScope.toBinaryString = toBinaryString;
    sequencer.protectedScope.ajax = ajax;
    sequencer.protectedScope.copyObject = copyObject;
    sequencer.protectedScope.findItemsInFolder = findItemsInFolder;


    sequencer.convertPPQ = convertPPQ;
    sequencer.getNiceTime = getNiceTime;
    sequencer.protectedScope.isEmptyObject = isEmptyObject;
    sequencer.protectedScope.objectForEach = objectForEach;
    sequencer.protectedScope.objectToArray = objectToArray;
    sequencer.protectedScope.arrayToObject = arrayToObject;
    sequencer.protectedScope.createClass = createClass;

    sequencer.protectedScope.clone = clone;
    sequencer.protectedScope.round = round;
    sequencer.protectedScope.floor = floor;
    sequencer.protectedScope.typeString = typeString;
    sequencer.protectedScope.copyName = copyName;
    sequencer.protectedScope.removeFromArray = removeFromArray;
    sequencer.protectedScope.removeFromArray2 = removeFromArray2;
    sequencer.protectedScope.filterItemsByClassName = filterItemsByClassName;

    sequencer.getMicrosecondsFromBPM = getMicrosecondsFromBPM;
    sequencer.getWaveformData = getWaveformData;
}