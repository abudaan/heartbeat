
// not in use!

(function(){

    'use strict';

    var
        instrumentId = 0,

        //import
        repetitiveTasks, // → defined in open_module.js
        typeString, // → defined in utils.js
        createSample, // → defined in sample.js
        round, // defined in util.js
        parseSamples, // defined in util.js
        createAutoPanner, // defined in instrument_methods.js
        createSimpleSynth, // defined in simple_synth.js

        Instrument;



    Instrument = function(config){
        //console.log(config);
        this.className = 'Instrument';
        this.id = 'I' + instrumentId + new Date().getTime();
        this.config = config;
        this.scheduledEvents = {};
        this.scheduledSamples = {};
        this.sustainPedalDown = false;
        this.sustainPedalSamples = {};
        this.sampleDataByNoteNumber = {};
        this.sampleData = [];

        this.info = config.info || {};
        if(this.info.samples !== undefined){
            if(this.info.sample.filesize !== undefined){
                this.info.samples.filesize = round(this.samplepack.filesize/1024/1024, 2);
            }
        }
    };


    // called by asset manager when a sample pack or an instrument has been unloaded, see asset_manager.js
    Instrument.prototype.reset = function(){
        // remove all samples
    };


    Instrument.prototype.parse = function(){
        var i, maxi, v, v1, v2, length, octave, note, noteName, noteNumber,
            buffer,
            id,
            data, subdata,
            update,
            sampleConfig,
            config = this.config,
            noteNameMode = config.notename_mode === undefined ? sequencer.noteNameMode : config.notename_mode,
            me = this;

        this.name = config.name || this.id;
        this.autopan = config.autopan || false; // for simple synth
        this.singlePitch = config.single_pitch || false;
        this.keyScalingRelease = config.keyscaling_release;
        this.keyScalingPanning = config.keyscaling_panning;
        this.keyRange = config.keyrange || config.key_range;
        this.mapping = config.mapping;

        if(this.keyRange === undefined){
            this.lowestNote = 128;
            this.highestNote = -1;
        }else{
            this.lowestNote = this.keyRange[0];
            this.highestNote = this.keyRange[1];
            this.numNotes = this.highestNote - this.lowestNote;
        }

        if(config.release_duration !== undefined){
            this.releaseDuration = config.release_duration;
        }else{
            this.releaseDuration = 0;
        }

        this.releaseEnvelope = config.release_envelope || 'equal power';

        if(this.autopan){
            this.autoPanner = createAutoPanner();
        }

        if(this.mapping === undefined){
            this.mapping = {};
            // use ids of samples as mapping -> the ids of the samples have to be note numbers or note names
            for(id in this.samples){
                if(this.samples.hasOwnProperty(id)){
                    this.mapping[id] = {n:id};
                }
            }
        }
        //console.log(this.mapping);

        for(id in this.mapping){
            if(this.mapping.hasOwnProperty(id)){
                data = this.mapping[id];

                if(isNaN(id)){
                    // C3, D#5, Bb0, etc.
                    length = id.length;
                    octave = id.substring(length - 1);
                    note = id.substring(0, length - 1);
                    noteName = id;
                    noteNumber = sequencer.getNoteNumber(note, octave);
                }else{
                    noteName = sequencer.getNoteNameFromNoteNumber(id, noteNameMode);
                    noteName = noteName.join('');
                    noteNumber = id;
                }
                //console.log(id, noteNameMode);

                noteNumber = parseInt(noteNumber, 10);

                // calculate key range
                if(this.keyRange === undefined){
                    this.lowestNote = noteNumber < this.lowestNote ? noteNumber : this.lowestNote;
                    this.highestNote = noteNumber > this.highestNote ? noteNumber : this.highestNote;
                }

                //console.log(data,typeString(data));

                if(typeString(data) === 'string'){
                    // only id of sample is provided
                    buffer = this.samples[data];
                }else if(typeString(data) === 'array'){
                    // multi-layered
                    this.multiLayered = true;
                    for(i = 0, maxi = data.length; i < maxi; i++){
                        subdata = data[i];
                        createSampleConfig(subdata);
                        if(this.sampleDataByNoteNumber[noteNumber] === undefined){
                            this.sampleDataByNoteNumber[noteNumber] = [];
                        }
                        // store the same sample config for every step in this velocity range
                        v1 = subdata.v[0];
                        v2 = subdata.v[1];
                        for(v = v1; v <= v2; v++){
                            this.sampleDataByNoteNumber[noteNumber][v] = sampleConfig;
                        }
                        this.sampleData.push(sampleConfig);
                    }
                }else{
                    // single-layered
                    createSampleConfig(data);
                    //console.log('--->', sampleConfig);
                    this.sampleDataByNoteNumber[noteNumber] = sampleConfig;
                    this.sampleData.push(sampleConfig);
                }
            }
        }

        if(this.keyRange === undefined){
            //console.log(this.highestNote, this.lowestNote);
            this.numNotes = this.highestNote - this.lowestNote;
            this.keyRange = [this.lowestNote, this.highestNote];
        }


        if(this.singlePitch){
            // TODO: fix this for multi-layered instruments (low prio)
            for(i = 127; i >= 0; i--){
                this.sampleData[i] = sampleConfig;
                this.sampleDataByNoteNumber[i] = sampleConfig;
            }
        }

        if(update){
            this.updateTaskId = 'update_' + this.name + '_' + new Date().getTime();
            //console.log('start update', this.name);
            repetitiveTasks[this.updateTaskId] = function(){
                //console.log('update');
                if(me.autopan){
                    me.update(this.autoPanner.getValue());
                }else{
                    me.update();
                }
            };
        }

        // inner function of Instrument.parse();
        function createSampleConfig(data){

            if(data.n){
                // get the buffer by an id
                buffer = me.samples[data.n];
                //console.log(data.n, buffer);
            }


            if(buffer === undefined){
                if(sequencer.debug){
                    console.log('no buffer found for ' + id + ' (' + me.name + ')');
                }
                sampleConfig = false;
                return;
            }

            sampleConfig = {
                noteNumber: noteNumber,
                buffer: buffer,
                autopan: me.autopan
            };

            // sample pack sustain
            if(config.sustain === true){
                sampleConfig.sustain = true;
                update = true;
            }

            // sustain
            if(data.s !== undefined){
                sampleConfig.sustain_start = data.s[0];
                sampleConfig.sustain_end = data.s[1];
                sampleConfig.sustain = true;
                update = true;
            }

            // global release
            if(config.release_duration !== undefined){
                sampleConfig.release_duration = config.release_duration;
                sampleConfig.release_envelope = config.release_envelope || me.releaseEnvelope;
                sampleConfig.release = true;
                update = true;
            }

            // release duration and envelope per sample overrules global release duration and envelope
            if(data.r !== undefined){
                if(typeString(data.r) === 'array'){
                    sampleConfig.release_duration = data.r[0];
                    sampleConfig.release_envelope = data.r[1] || me.releaseEnvelope;
                }else if(!isNaN(data.r)){
                    sampleConfig.release_duration = data.r;
                    sampleConfig.release_envelope = me.releaseEnvelope;
                }
                sampleConfig.release = true;
                update = true;
                //console.log(data.r, sampleConfig.release_duration, sampleConfig.release_envelope)
            }

            // panning
            if(data.p !== undefined){
                sampleConfig.panPosition = data.p;
                sampleConfig.panning = true;
            }
            //console.log(data.p, sampleConfig.panning);
            //console.log('ready', sampleConfig);
        }
    };


    Instrument.prototype.getInfoAsHTML = function(){
        var html = '',
            instrumentHtml = '',
            samplepackHtml = '',
            instrumentInfo = {},
            samplesInfo = {};

        if(this.info !== undefined){
            samplesInfo = this.info.samples;
            instrumentInfo = this.info.instrument;
        }

        if(instrumentInfo.descriptiom !== undefined){
            instrumentHtml += '<tr><td>info</td><td>' + instrumentInfo.description + '</td></tr>';
        }
        if(instrumentInfo.author !== undefined){
            instrumentHtml += '<tr><td>author</td><td>' + instrumentInfo.author + '</td></tr>';
        }
        if(instrumentInfo.license !== undefined){
            instrumentHtml += '<tr><td>license</td><td>' + instrumentInfo.license + '</td></tr>';
        }
        instrumentHtml += '<tr><td>keyrange</td><td>' + this.lowestNote + '(' + sequencer.getFullNoteName(this.lowestNote) + ')';
        instrumentHtml += ' - ' + this.highestNote + '(' + sequencer.getFullNoteName(this.highestNote) + ')</td></tr>';

        if(instrumentHtml !== ''){
            instrumentHtml = '<table><th colspan="2">instrument</th>' +  instrumentHtml + '</table>';
            html += instrumentHtml;
        }

        if(samplesInfo.description !== undefined){
            samplepackHtml += '<tr><td>info</td><td>' + samplesInfo.description + '</td></tr>';
        }
        if(samplesInfo.author !== undefined){
            samplepackHtml += '<tr><td>author</td><td>' + samplesInfo.author + '</td></tr>';
        }
        if(samplesInfo.license !== undefined){
            samplepackHtml += '<tr><td>license</td><td>' + samplesInfo.license + '</td></tr>';
        }
        if(samplesInfo.compression !== undefined){
            samplepackHtml += '<tr><td>compression</td><td>' + samplesInfo.compression + '</td></tr>';
        }
        if(samplesInfo.filesize !== undefined){
            samplepackHtml += '<tr><td>filesize</td><td>' + samplesInfo.filesize + ' MiB</td></tr>';
        }

        if(samplepackHtml !== ''){
            samplepackHtml = '<table><th colspan="2">samplepack</th>' +  samplepackHtml + '</table>';
            html += samplepackHtml;
        }

        return html;
    };


    Instrument.prototype.createSample = function(event){
        var
            noteNumber = event.noteNumber,
            velocity = event.velocity,
            data = this.sampleDataByNoteNumber[noteNumber],
            type = typeString(data);

        if(type === 'array'){
            data = data[velocity];
            //console.log(velocity, data.bufferId);
        }

        if(data === undefined || data === false){
            // no buffer data, return a dummy sample
            return {
                start: function(){
                    console.warn('no audio data loaded for', noteNumber);
                },
                stop: function(){},
                update: function(){},
                addData: function(){},
                unschedule: function(){}
            };
        }
        //console.log(data);
        data.track = event.track;
        return createSample(data);
    };


    sequencer.createInstrument2 = function(config){

        function executor(resolve, reject){
            var instrument;

            if(config.samples === undefined){
                reject('instruments must have samples', config);
            }

            if(config.name === 'sinewave'){
                instrument = createSimpleSynth(config);
            }else{
                instrument = new Instrument(config);
            }

            parseSamples(config.samples).then(
                function onFulfilled(samples){
                    //console.log(samples);
                    // save memory and delete the base64 data
                    config.samples = null;
                    instrument.samples = samples;
                    instrument.parse();
                    resolve(instrument);
                },
                function onRejected(e){
                    reject(e);
                }
            );
        }

        return new Promise(executor);
    };


    sequencer.protectedScope.addInitMethod(function(){
        var protectedScope = sequencer.protectedScope;
        createSample = sequencer.createSample;
        repetitiveTasks = protectedScope.repetitiveTasks;
        typeString = protectedScope.typeString;
        round = sequencer.util.round;
        createSimpleSynth = sequencer.createSimpleSynth;
        parseSamples = sequencer.util.parseSamples;

        // instrument methods
        var methodNames = [
            'createAutoPanner',
            'setKeyScalingPanning',
            'setKeyScalingRelease',
            'setRelease',
            'transposeSamples',
            'processEvent',
            'stopSustain',
            'playNote',
            'stopNote',
            'allNotesOff',
            'allNotesOffPart',
            'update',
            'hasScheduledSamples',
            'reschedule',
            'unschedule'
        ];
        methodNames.forEach(function(name){
            var m = protectedScope[name];
            Instrument.prototype[name] = function(){
                //console.log(args, this);
                m.apply(this, arguments);
            };
        });
    });
}());
