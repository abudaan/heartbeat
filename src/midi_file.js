/*
    parse method is based on: https://github.com/gasman/jasmid
    adapted to work with heartbeatjs' type MidiEvent and Track
*/

function midiFile() {

    'use strict';

    var
        // import
        parseUrl, // defined in util.js
        base64ToBinary, // defined in util.js
        typeString, // defined in util.js
        ajax, // defined in util.js
        findItem, // defined in util.js
        storeItem, // defined in util.js
        deleteItem, // defined in util.js
        parseMidiFile, // defined in midi_parse.js
        createTrack, // defined in track.js
        createPart, // defined in part.js
        createMidiEvent, // defined in midi_event.js

        index = 0,
        MidiFile;


    function cleanup(midifile, callback) {
        midifile = undefined;
        if (callback) {
            callback(false);
        }
    }


    function parse(midifile, buffer, callback) {
        //console.time('parse midi');
        var data, i, j, numEvents, part, track, numTracks,
            events, event, ticks, tmpTicks, channel,
            parsed, timeEvents, noteNumber, bpm,
            lastNoteOn, lastNoteOff, ppqFactor,
            type, lastType, lastData1, lastData2,
            numNoteOn, numNoteOff, numOther, noteOns, noteOffs;

        // buffer is ArrayBuffer, so convert it
        buffer = new Uint8Array(buffer);
        data = parseMidiFile(buffer);
        //console.log(data);
        //console.log(data.header.ticksPerBeat);

        // save some memory
        midifile.base64 = '';
        midifile.numTracks = 0;

        i = 0;
        numTracks = data.tracks.length;
        if (sequencer.overrulePPQ === true && isNaN(sequencer.defaultPPQ) === false && sequencer.defaultPPQ > 0) {
            ppqFactor = sequencer.defaultPPQ / data.header.ticksPerBeat;
            midifile.ppq = sequencer.defaultPPQ;
        } else {
            ppqFactor = 1;
            midifile.ppq = data.header.ticksPerBeat;
        }
        timeEvents = [];
        midifile.tracks = [];
        //console.log(ppqFactor, midifile.ppq, sequencer.overrulePPQ, sequencer.defaultPPQ);

        while (i < numTracks) {
            events = data.tracks[i];
            numEvents = events.length;
            ticks = 0;
            tmpTicks = 0;
            channel = -1;
            part = createPart();
            track = createTrack();
            parsed = [];
            j = 0;
            numNoteOn = 0;
            numNoteOff = 0;
            numOther = 0;
            noteOns = {};
            noteOffs = {};

            for (j = 0; j < numEvents; j++) {

                event = events[j];

                tmpTicks += (event.deltaTime * ppqFactor);
                //console.log(event.subtype, event.deltaTime, tmpTicks);

                if (channel === -1 && event.channel !== undefined) {
                    channel = event.channel;
                    track.channel = channel;
                }

                type = event.subtype;

                if (type === 'noteOn') {
                    numNoteOn++;
                } else if (type === 'noteOff') {
                    numNoteOff++;
                } else {
                    numOther++;
                }

                switch (event.subtype) {

                    case 'trackName':
                        track.name = event.text;
                        //console.log('name', track.name, numTracks);
                        break;

                    case 'instrumentName':
                        if (event.text) {
                            track.instrumentName = event.text;
                        }
                        break;

                    case 'noteOn':
                        //track.isUseful = true;
                        /*
                        noteNumber = event.noteNumber;
                        if(tmpTicks === ticks && lastType === type && noteNumber === lastNoteOn){
                            if(sequencer.debug >= 3){
                                console.info('note on events on the same tick', j, tmpTicks, noteNumber, lastNoteOn, numTracks, parsed.length);
                            }
                            //parsed.pop();
                        }
                        lastNoteOn = noteNumber;
                        parsed.push(createMidiEvent(tmpTicks, 0x90, noteNumber, event.velocity));
                        */
                        /*
                        noteNumber = event.noteNumber;
                        if(noteOns[noteNumber] === undefined){
                            noteOns[noteNumber] = [];
                        }
                        noteOns[noteNumber].push(event);
                        */
                        parsed.push(createMidiEvent(tmpTicks, 0x90, event.noteNumber, event.velocity));
                        break;

                    case 'noteOff':
                        //track.isUseful = true;
                        /*
                        noteNumber = event.noteNumber;
                        if(tmpTicks === ticks && lastType === type && noteNumber === lastNoteOff){
                            if(sequencer.debug >= 3){
                                console.info('note off events on the same tick', j, tmpTicks, noteNumber, lastNoteOff, numTracks, parsed.length);
                            }
                            //parsed.pop();
                        }
                        lastNoteOff = noteNumber;
                        parsed.push(createMidiEvent(tmpTicks, 0x80, noteNumber, event.velocity));
                        */
                        /*
                        noteNumber = event.noteNumber;
                        if(noteOffs[noteNumber] === undefined){
                            noteOffs[noteNumber] = [];
                        }
                        noteOns[noteNumber].push(event);
                        */
                        parsed.push(createMidiEvent(tmpTicks, 0x80, event.noteNumber, event.velocity));
                        break;

                    case 'endOfTrack':
                        //console.log(track.name, '0x2F', tmpTicks);
                        //parsed.push(createMidiEvent(tmpTicks,0x2F));
                        break;

                    case 'setTempo':
                        //sometimes 2 tempo events have the same position in ticks
                        //→ we use the last in these cases (same as Cubase)

                        bpm = 60000000 / event.microsecondsPerBeat;
                        //console.log('setTempo',bpm,event.microsecondsPerBeat);

                        if (tmpTicks === ticks && lastType === type) {
                            if (sequencer.debug >= 3) {
                                console.info('tempo events on the same tick', j, tmpTicks, bpm);
                            }
                            timeEvents.pop();
                        }

                        if (midifile.bpm === undefined) {
                            midifile.bpm = bpm;
                            // }else{
                            //     timeEvents.push(createMidiEvent(tmpTicks, 0x51, bpm));
                        }
                        timeEvents.push(createMidiEvent(tmpTicks, 0x51, bpm));
                        break;

                    case 'timeSignature':
                        //see comment above ↑
                        if (tmpTicks === ticks && lastType === type) {
                            if (sequencer.debug >= 3) {
                                console.info('time signature events on the same tick', j, tmpTicks, event.numerator, event.denominator);
                            }
                            timeEvents.pop();
                        }

                        if (midifile.nominator === undefined) {
                            midifile.nominator = event.numerator;
                            midifile.denominator = event.denominator;
                            // }else{
                            //     //console.log('timeSignature', event.numerator, event.denominator, event.metronome, event.thirtyseconds);
                            //     timeEvents.push(createMidiEvent(tmpTicks, 0x58, event.numerator, event.denominator));
                        }
                        timeEvents.push(createMidiEvent(tmpTicks, 0x58, event.numerator, event.denominator));
                        break;


                    case 'controller':
                        //track.isUseful = true;
                        /*
                        if(
                            tmpTicks === ticks &&
                            event.controllerType === lastData1 &&
                            event.value === lastData2 &&
                            lastData1 !== undefined &&
                            lastData2 !== undefined
                        ){
                            if(sequencer.debug >= 3){
                                console.warn('double controller events on the same tick', j, tmpTicks, event.controllerType, event.value);
                            }
                        }else{
                            parsed.push(createMidiEvent(tmpTicks, 0xB0, event.controllerType, event.value));
                        }
                        lastData1 = event.controllerType;
                        lastData2 = event.value;
                        */
                        parsed.push(createMidiEvent(tmpTicks, 0xB0, event.controllerType, event.value));
                        //console.log('controller:', tmpTicks, event.type, event.controllerType, event.value);
                        break;

                    case 'programChange':
                        //track.isUseful = true;
                        parsed.push(createMidiEvent(tmpTicks, 0xC0, event.programNumber));
                        //console.log(event.type,event.controllerType);
                        break;

                    case 'channelAftertouch':
                        parsed.push(createMidiEvent(tmpTicks, 0xD0, event.amount));
                        break;

                    case 'pitchBend':
                        parsed.push(createMidiEvent(tmpTicks, 0xE0, event.value));
                        break;

                    default:
                    //console.log(track.name, event.type);
                }
                lastType = type;
                ticks = tmpTicks;
            }

            //console.log('NOTE ON', numNoteOn, 'NOTE OFF', numNoteOff, 'OTHER', numOther);
            // console.log('PARSED', parsed);
            if (parsed.length > 0) {
                track.addPart(part);
                part.addEvents(parsed);
                midifile.tracks.push(track);
                midifile.numTracks++;
            }
            i++;
        }

        midifile.timeEvents = timeEvents;
        midifile.autoSize = true;
        //console.timeEnd('parse midi');
        midifile.loaded = true;
        callback(midifile);
    }


    function load(midifile, callback) {

        if (midifile.base64 !== undefined) {
            parse(midifile, base64ToBinary(midifile.base64), callback);
            return;
        } else if (midifile.arraybuffer !== undefined) {
            parse(midifile, midifile.arraybuffer, callback);
            return;
        }

        ajax({
            url: midifile.url,
            responseType: midifile.responseType,
            onError: function () {
                cleanup(midifile, callback);
            },
            onSuccess: function (data) {
                if (midifile.responseType === 'json') {
                    // if the json data is corrupt (for instance because of a trailing comma) data will be null
                    if (data === null) {
                        callback(false);
                        return;
                    }

                    if (data.base64 === undefined) {
                        cleanup(midifile, callback);
                        if (sequencer.debug) {
                            console.warn('no base64 data');
                        }
                        return;
                    }

                    if (data.name !== undefined && midifile.name === undefined) {
                        midifile.name = data.name;
                    }

                    if (data.folder !== undefined && midifile.folder === undefined) {
                        midifile.folder = data.folder;
                    }

                    if (midifile.name === undefined) {
                        midifile.name = parseUrl(midifile.url).name;
                    }

                    midifile.localPath = midifile.folder !== undefined ? midifile.folder + '/' + midifile.name : midifile.name;
                    parse(midifile, base64ToBinary(data.base64), callback);
                } else {
                    if (midifile.name === undefined) {
                        midifile.name = parseUrl(midifile.url).name;
                    }
                    midifile.localPath = midifile.folder !== undefined ? midifile.folder + '/' + midifile.name : midifile.name;
                    parse(midifile, data, callback);
                }
            }
        });
    }


    function store(midifile) {
        var occupied = findItem(midifile.localPath, sequencer.storage.midi, true),
            action = midifile.action;

        //console.log(occupied);
        if (occupied && occupied.className === 'MidiFile' && action !== 'overwrite') {
            if (sequencer.debug >= 2) {
                console.warn('there is already a midifile at', midifile.localPath);
                cleanup(midifile);
            }
        } else {
            storeItem(midifile, midifile.localPath, sequencer.storage.midi);
        }
    }


    MidiFile = function (config) {
        this.id = 'MF' + index++ + new Date().getTime();
        this.className = 'MidiFile';

        this.url = config.url;
        this.json = config.json;
        this.base64 = config.base64;
        this.arraybuffer = config.arraybuffer;

        this.name = config.name;
        this.folder = config.folder;

        if (this.url !== undefined) {
            this.responseType = this.url.indexOf('.json') === this.url.lastIndexOf('.') ? 'json' : 'arraybuffer';
        } else {
            if (this.name === undefined && this.folder === undefined) {
                this.name = this.id;
                this.localPath = this.id;
            } else {
                this.localPath = this.folder !== undefined ? this.folder + '/' + this.name : this.name;
            }
        }
    };


    sequencer.addMidiFile = function (config, callback) {
        var type = typeString(config),
            midifile, json, name, folder;

        if (type !== 'object') {
            if (sequencer.debug >= 2) {
                console.warn('can\'t create a MidiFile with this data', config);
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
                        console.warn('can\'t create a MidiFile with this data', config);
                    }
                    return false;
                }
            }
            if (json.base64 === undefined) {
                if (sequencer.debug >= 2) {
                    console.warn('can\'t create a MidiFile with this data', config);
                }
                return false;
            }
            config = {
                base64: json.base64,
                name: name === undefined ? json.name : name,
                folder: folder === undefined ? json.folder : folder
            };
            //console.log('config', name, folder, json.name, json.folder);
        }

        midifile = new MidiFile(config);

        sequencer.addTask({
            type: 'load midifile',
            method: load,
            params: midifile
        }, function () {
            //console.log(midifile);
            store(midifile);
            if (callback) {
                callback(midifile);
            }
        });

        sequencer.startTaskQueue();


        /*
                load(midifile, function(){
                    //console.log(midifile);
                    store(midifile);
                    if(callback){
                        callback(midifile);
                    }
                });
        */
    };


    function MidiFile2(config) {
        var reader = new FileReader();

        function executor(resolve, reject) {

            reader.addEventListener('loadend', function () {
                // reader.result contains the contents of blob as a typed array
                parse({}, reader.result, function (midifile) {
                    resolve(midifile);
                });
            });

            reader.addEventListener('error', function (e) {
                reject(e);
            });

            if (config.blob !== undefined) {
                reader.readAsArrayBuffer(config.blob);
            } else if (config.arraybuffer !== undefined) {
                parse({}, config.arraybuffer, function (midifile) {
                    resolve(midifile);
                });
            } else if (config.base64 !== undefined) {
                parse({}, base64ToBinary(config.base64), function (midifile) {
                    resolve(midifile);
                });
            }
        }

        this._promise = new Promise(executor);
    }


    sequencer.createMidiFile = function (config) {
        var mf = new MidiFile2(config);
        return mf._promise;
    };


    sequencer.protectedScope.addInitMethod(function () {
        ajax = sequencer.protectedScope.ajax;
        findItem = sequencer.protectedScope.findItem;
        storeItem = sequencer.protectedScope.storeItem;
        deleteItem = sequencer.protectedScope.deleteItem;
        parseUrl = sequencer.protectedScope.parseUrl;
        typeString = sequencer.protectedScope.typeString;
        parseMidiFile = sequencer.protectedScope.parseMidiFile;
        base64ToBinary = sequencer.protectedScope.base64ToBinary;
        createPart = sequencer.createPart;
        createTrack = sequencer.createTrack;
        createMidiEvent = sequencer.createMidiEvent;
    });
}