
// not in use!

(function(){

    'use strict';

    var
        //import
        typeString, // → defined in util.js
        remap, // → defined in util.js
        timedTasks, // → defined in open_module.js
        createReverb, // → defined in effects.js
        objectForEach, // → defined in util.js
        isEmptyObject, // → defined in util.js
        transpose, // → defined in transpose.js
        getEqualPowerCurve, // → defined in util.js
        dispatchEvent, // → defined in song.js


        setKeyScalingPanning,
        setKeyScalingRelease,
        setRelease,
        transposeSamples,
        processEvent,
        stopSustain,
        playNote,
        stopNote,
        allNotesOff,
        allNotesOffPart,
        update,
        hasScheduledSamples,
        reschedule,
        unschedule;



    setKeyScalingPanning = function(start, end){
        //console.log('keyScalingPanning', start, end);
        var i, data, numSamples = this.sampleData.length,
            panStep, currentPan;

        if(start === false){
            for(i = 0; i < numSamples; i++){
                data = this.sampleData[i];
                data.panning = false;
            }
        }

        if(isNaN(start) === false && isNaN(end) === false){
            panStep = (end - start)/this.numNotes;
            currentPan = start;
            for(i = 0; i < numSamples; i++){
                data = this.sampleData[i];
                data.panning = true;
                data.panPosition = currentPan;
                //console.log(currentPan, panStep, highestNote, lowestNote, data.noteNumber);
                currentPan += panStep;
            }
        }
    };



    setRelease = function(millis, envelope){
        if(millis === undefined){
            return;
        }
        this.releaseEnvelope = envelope || this.releaseEnvelope;
        this.keyScalingRelease = undefined;

        var i, data, numSamples = this.sampleData.length;
        for(i = 0; i < numSamples; i++){
            data = this.sampleData[i];
            data.release = true;
            data.release_duration = millis;
            data.release_envelope = this.releaseEnvelope;
        }
        this.releaseDuration = millis;
    };



    setKeyScalingRelease = function(start, end, envelope){
        var i, data, numSamples = this.sampleData.length,
            releaseStep, currentRelease;

        this.releaseEnvelope = envelope || this.releaseEnvelope;

        if(isNaN(start) === false && isNaN(end) === false){
            this.keyScalingRelease = [start, end];
            this.releaseDuration = 0;
            releaseStep = (end - start)/this.numNotes;
            currentRelease = start;
            for(i = 0; i < numSamples; i++){
                data = this.sampleData[i];
                data.release_duration = currentRelease;
                data.release_envelope = currentRelease;
                //console.log(currentRelease, releaseStep, data.noteNumber);
                currentRelease += releaseStep;
            }
        }
    };



    transposeSamples = function(semitones, cb1, cb2){
        if(transpose === undefined){
            console.log('transpose is still experimental');
            return;
        }
        var numSamples = this.sampleData.length;
        function loop(num, samples){
            var data;
            if(cb2){
                cb2('transposing sample ' + (num + 1) +  ' of ' + numSamples);
            }
            //console.log(num, numSamples);
            if(num < numSamples){
                data = samples[num];
                setTimeout(function(){
                    transpose(data.buffer, semitones, function(transposedBuffer){
                        data.buffer = transposedBuffer;
                        loop(++num, samples);
                    });
                }, 10);
            }else{
                if(cb1){
                    console.log('ready');
                    cb1();
                }
            }
        }
        loop(0, this.sampleData);
    };



    // called when midi events arrive from a midi input, from processEvent or from the scheduler
    processEvent = function(midiEvent){
        //console.log(midiEvent.type, midiEvent.velocity);
        var type = midiEvent.type,
            data1, data2, track, output;

        //seconds = seconds === undefined ? 0 : seconds;
        if(midiEvent.time === undefined){
            midiEvent.time = 0;
        }

        if(type === 128 || type === 144){
            if(type === 128){
                if(this.sustainPedalDown === true){
                    midiEvent.sustainPedalDown = true;
                }
                this.stopNote(midiEvent);
            }else{
                this.playNote(midiEvent);
            }
        }else if(type === 176){
            //return;
            data1 = midiEvent.data1;
            data2 = midiEvent.data2;
            if(data1 === 64){ // sustain pedal
                //console.log(this.sustainPedalDown, data1, data2)
                if(data2 === 127){
                    this.sustainPedalDown = true;
                    //console.log('sustain pedal down',this.track.song.id);
                    dispatchEvent(this.track.song, 'sustain_pedal', 'down');
                }else if(data2 === 0){
                    this.sustainPedalDown = false;
                    //console.log('sustain pedal up');
                    dispatchEvent(this.track.song, 'sustain_pedal', 'up');
                    this.stopSustain(midiEvent.time);
                }
            }else if(data1 === 10){ // panning
                // panning is *not* exactly timed -> not possible (yet) with WebAudio
                track = this.track;
                //console.log(data2, remap(data2, 0, 127, -1, 1));
                track.setPanning(remap(data2, 0, 127, -1, 1));
            }else if(data1 === 7){ // volume
                track = this.track;
                output = track.output;
                output.gain.setValueAtTime(data2/127, midiEvent.time);
                /*
                //@TODO: this should be done by a plugin
                if(track.volumeChangeMethod === 'linear'){
                    output.gain.linearRampToValueAtTime(data2/127, seconds);
                }else if(track.volumeChangeMethod === 'equal_power'){
                    volume1 = track.getVolume();
                    volume2 = data2/127;
                    if(volume1 > volume2){
                        values = getEqualPowerCurve(100, 'fadeOut', volume2);
                    }else{
                        values = getEqualPowerCurve(100, 'fadeIn', volume2);
                    }
                    now = sequencer.getTime();
                    output.gain.setValueCurveAtTime(values, seconds, seconds + 0.05);
                }else{
                    output.gain.setValueAtTime(data2/127, seconds);
                }
                */
            }
        }
    };



    stopSustain = function(seconds){
        var midiNote,
            scheduledSamples = this.scheduledSamples,
            sustainPedalSamples = this.sustainPedalSamples;

        objectForEach(sustainPedalSamples, function(sample){
            if(sample !== undefined){
                midiNote = sample.midiNote;
                midiNote.noteOn.sustainPedalDown = undefined;
                midiNote.noteOff.sustainPedalDown = undefined;
                sample.stop(seconds, function(sample){
                    //console.log('stopped sustain pedal up:', sample.id, sample.sourceId);
                    scheduledSamples[sample.sourceId] = null;
                    delete scheduledSamples[sample.sourceId];
                    //delete sustainPedalSamples[sample.sourceId];
                });
            }
        });

        this.sustainPedalSamples = {};
    };



    playNote = function(midiEvent){
        var
            sample,
            sourceId;

        if(!midiEvent.midiNote){
            if(sequencer.debug){
                console.warn('playNote() no midi note');
            }
            return;
        }

        sourceId = midiEvent.midiNote.id;
        sample = this.scheduledSamples[sourceId];
        //console.log('start', sourceId);

        if(sample !== undefined){
            //console.log('already scheduled', sourceId);
            sample.unschedule(0);
        }

        sample = this.createSample(midiEvent);
        // add some extra attributes to the sample
        sample.addData({
            midiNote: midiEvent.midiNote,
            noteName: midiEvent.midiNote.note.fullName,
            sourceId: sourceId
        });
        this.scheduledSamples[sourceId] = sample;
        sample.start(midiEvent);
    };



    stopNote = function(midiEvent){
        if(midiEvent.midiNote === undefined){
            if(sequencer.debug){
                console.warn('stopNote() no midi note');
            }
            return;
        }

        var sourceId = midiEvent.midiNote.id,
            sample = this.scheduledSamples[sourceId],
            scheduledSamples = this.scheduledSamples,
            sustainPedalSamples = this.sustainPedalSamples;

        // if(this.song && this.song.bar >= 6 && this.track.name === 'Sonata # 3'){
        //     console.log('stopNote', midiEvent, seconds, sequencer.getTime());
        // }

        //console.log(midiEvent.sustainPedalDown);
        if(midiEvent.sustainPedalDown === true){
            // while sustain pedal is pressed, bypass note off events
            //console.log('sustain');
            sustainPedalSamples[sourceId] = sample;
            return;
        }

        if(sample === undefined){
            // if(sequencer.debug){
            //     console.log('no sample scheduled (anymore) for this midiEvent', sourceId, seconds);
            // }
            return;
        }

        sample.stop(midiEvent.time, function(){
            scheduledSamples[sourceId] = null;
            delete scheduledSamples[sourceId];
        });
    };



    hasScheduledSamples = function(){
        return isEmptyObject(this.scheduledSamples);
    };



    function unscheduleCallback(sample){
        //console.log(sample.id, 'has been unscheduled');
        sample = null;
    }


    reschedule = function(song){
        var
            min = song.millis,
            max = min + (sequencer.bufferTime * 1000),
            //max2 = min + 20,
            scheduledSamples = this.scheduledSamples,
            id, note, sample;

        for(id in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(id)){
                sample = scheduledSamples[id]; // the sample
                note = sample.midiNote; // the midi note

                if(note === undefined || note.state === 'removed'){
                    sample.unschedule(0, unscheduleCallback);
                    delete scheduledSamples[id];
                }else if(
                        note.noteOn.millis >= min &&
                        note.noteOff.millis < max &&
                        sample.noteName === note.fullName
                    ){
                    // nothing has changed, skip
                    continue;
                }else{
                    //console.log('unscheduled', id);
                    delete scheduledSamples[id];
                    sample.unschedule(null, unscheduleCallback);
                }
            }
        }
/*
        objectForEach(this.scheduledEvents, function(event, eventId){
            if(event === undefined || event.state === 'removed'){
                delete sequencer.timedTasks['event_' + eventId];
                delete this.scheduledEvents[eventId];
            }else if((event.millis >= min && event.millis < max2) === false){
                delete sequencer.timedTasks['event_' + eventId];
                delete this.scheduledEvents[eventId];
            }
        });
*/
    };


    function loop(data, i, maxi, events){
        var arg;
        for(i = 0; i < maxi; i++){
            arg = data[i];
            if(arg === undefined){
                continue;
            }else if(arg.className === 'MidiNote'){
                events.push(arg.noteOn);
            }else if(typeString(arg) === 'array'){
                loop(arg, 0, arg.length);
            }
        }
    }



    // stop specified events or notes, used by stopProcessEvent()
    unschedule = function(){
        var args = Array.prototype.slice.call(arguments),
            events = [],
            i, e, id, sample;

        loop(args, 0, args.length, events);

        for(i = events.length - 1; i >= 0; i--){
            e = events[i];
            if(e.midiNote !== undefined){
                // note on and note off events
                id = e.midiNote.id;
                sample = this.scheduledSamples[id];
                if(sample !== undefined){
                    sample.unschedule(0, unscheduleCallback);
                    delete this.scheduledSamples[id];
                }
            }else if(e.className === 'MidiEvent'){
                // other channel events
                id = e.id;
                delete timedTasks['event_' + id];
                delete this.scheduledEvents[id];
            }
            //console.log(id);
        }
    };



    // stop all events and notes
    allNotesOff = function(){
        var sample, sampleId,
            scheduledSamples = this.scheduledSamples;

        this.stopSustain(0);
        this.sustainPedalDown = false;

        //console.log(scheduledSamples);

        if(scheduledSamples === undefined || isEmptyObject(scheduledSamples) === true){
            return;
        }

        for(sampleId in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(sampleId)){
                //console.log('allNotesOff', sampleId);
                sample = scheduledSamples[sampleId];
                if(sample){
                    sample.unschedule(0, unscheduleCallback);
                }
            }
        }
        this.scheduledSamples = {};

        objectForEach(this.scheduledEvents, function(event, eventId){
            delete timedTasks['event_' + eventId];
        });
        this.scheduledEvents = {};
    };



    allNotesOffPart = function(partId){
        var sample, sampleId,
            scheduledSamples = this.scheduledSamples;

        // make this more subtle
        this.stopSustain(0);
        this.sustainPedalDown = false;

        //console.log(scheduledSamples);

        if(scheduledSamples === undefined || isEmptyObject(scheduledSamples) === true){
            return;
        }

        for(sampleId in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(sampleId)){
                //console.log('allNotesOff', sampleId);
                sample = scheduledSamples[sampleId];
                if(sample){
                    sample.unschedule(0, unscheduleCallback);
                }
            }
        }
        this.scheduledSamples = {};

        objectForEach(this.scheduledEvents, function(event, eventId){
            delete timedTasks['event_' + eventId];
        });
        this.scheduledEvents = {};
    };



    update = function(value){
        var sampleId, sample;
        //console.log(this.scheduledSamples);
        for(sampleId in this.scheduledSamples){
            if(this.scheduledSamples.hasOwnProperty(sampleId)){
                sample = this.scheduledSamples[sampleId];
                if(sample){
                    sample.update(value);
                }
            }
        }
    };



    function createAutoPanner(time){
/*
        var osc = context.createOscillator();
        osc.frequency.value = 50;
        osc.type = 0;
        var gain = context.createGain();
        gain.gain.value = 1;
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start();
        console.log(osc);
        return {
            getValue: function(){
                return osc.frequency.getValueAtTime(time);
            }
        };
*/
        return {
            getValue: function(time){
                return Math.sin(time * 2*Math.PI);
            }
        };
    }

    sequencer.protectedScope.createAutoPanner = createAutoPanner;
    sequencer.protectedScope.setKeyScalingPanning = setKeyScalingPanning;
    sequencer.protectedScope.setKeyScalingRelease = setKeyScalingRelease;
    sequencer.protectedScope.setRelease = setRelease;
    sequencer.protectedScope.transposeSamples = transposeSamples;
    sequencer.protectedScope.processEvent = processEvent;
    sequencer.protectedScope.stopSustain = stopSustain;
    sequencer.protectedScope.playNote = playNote;
    sequencer.protectedScope.stopNote = stopNote;
    sequencer.protectedScope.allNotesOff = allNotesOff;
    sequencer.protectedScope.allNotesOffPart = allNotesOffPart;
    sequencer.protectedScope.update = update;
    sequencer.protectedScope.hasScheduledSamples = hasScheduledSamples;
    sequencer.protectedScope.reschedule = reschedule;
    sequencer.protectedScope.unschedule = unschedule;


    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
        timedTasks = sequencer.protectedScope.timedTasks;
        createReverb = sequencer.createReverb;
        objectForEach = sequencer.protectedScope.objectForEach;
        isEmptyObject = sequencer.protectedScope.isEmptyObject;
        transpose = sequencer.protectedScope.transpose;
        getEqualPowerCurve = sequencer.util.getEqualPowerCurve;
        remap = sequencer.util.remap;
        dispatchEvent = sequencer.protectedScope.songDispatchEvent;
    });

}());