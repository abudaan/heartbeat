/*
    controls the playback of the audio events in a track
*/
function audioTrack() {

    'use strict';

    var
        slice = Array.prototype.slice,

        //import
        typeString, // → defined in utils.js
        createAudioRecorder, // → defined in audio_recorder.js

        unscheduleCallback,
        AudioTrack;


    AudioTrack = function (track) {
        this.track = track;
        this.className = 'AudioTrack';
        this.scheduledSamples = {};
        this.recorder = createAudioRecorder(track);
    };


    unscheduleCallback = function (sample) {
        //console.log(sample.id, 'has been unscheduled');
        delete this.scheduledSamples[sample.id];
        sample = null;
    };


    AudioTrack.prototype.setAudioRecordingLatency = function (recordId, value, callback) {
        this.recorder.setAudioRecordingLatency(recordId, value, callback);
    };


    AudioTrack.prototype.processEvent = function (audioEvent) {
        var sample = sequencer.createSample({ buffer: audioEvent.buffer, track: audioEvent.track });
        audioEvent.sample = sample;
        //console.log(audioEvent.sampleOffset, audioEvent.playheadOffset, audioEvent.latencyCompensation);
        audioEvent.offset = audioEvent.sampleOffset + audioEvent.playheadOffset;// + audioEvent.latencyCompensation;
        //audioEvent.time -= audioEvent.latencyCompensation;
        // set playheadOffset to 0 after the event has been scheduled
        audioEvent.playheadOffset = 0;
        //sample.start(audioEvent.time/1000, 127, audioEvent.offsetMillis/1000, audioEvent.durationMillis/1000);

        sample.start(audioEvent);
        //console.log(time, time + audioEvent.durationMillis/1000);
        //sample.stop(time + audioEvent.durationMillis/1000, function(){});

        this.scheduledSamples[sample.id] = sample;
    };

    /*
        AudioTrack.prototype.playEvent = function(audioEvent, seconds){
        };
    */

    AudioTrack.prototype.stopSample = function (audioEvent, seconds) {
        //console.log('stopping', audioEvent.id);
        if (audioEvent.sample === undefined) {
            return;
        }
        audioEvent.sample.stop(seconds, unscheduleCallback.bind(this));
    };


    AudioTrack.prototype.allNotesOff = function () {
        var sampleId, sample,
            scheduledSamples = this.scheduledSamples;

        for (sampleId in scheduledSamples) {
            if (scheduledSamples.hasOwnProperty(sampleId)) {
                //console.log('allNotesOff', sampleId);
                sample = scheduledSamples[sampleId];
                if (sample) {
                    sample.unschedule(0, unscheduleCallback.bind(this));
                }
            }
        }
        this.scheduledSamples = {};
    };


    AudioTrack.prototype.prepareForRecording = function (recordId, callback) {
        if (this.recorder === false) {
            return false;
        }
        this.recorder.prepare(recordId, callback);
    };


    AudioTrack.prototype.stopRecording = function (callback) {
        this.recorder.stop(function (recording) {
            callback(recording);
        });
    };

    sequencer.protectedScope.createAudioTrack = function (track) {
        return new AudioTrack(track);
    };


    sequencer.protectedScope.addInitMethod(function () {
        typeString = sequencer.protectedScope.typeString;
        createAudioRecorder = sequencer.protectedScope.createAudioRecorder;
    });

}
