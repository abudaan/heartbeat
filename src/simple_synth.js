function simpleSynth() {

    'use strict';

    var
        //import
        context, // → defined in open_module.js
        typeString, // → defined in util.js
        repetitiveTasks; // → defined in open_module.js


    function SimpleSynth() {

    }

    SimpleSynth.prototype.parse = function () {
        var me = this,
            config = this.config;

        //console.log(this.config);
        this.name = 'SineWave';
        this.waveForm = config.wave_form || 'sine';
        this.autopan = config.autopan || false;
        this.folder = config.folder || 'heartbeat';
        this.releaseDuration = config.release_duration || 1500;
        if (this.autopan) {
            this.autoPanner = createAutoPanner();
        }

        repetitiveTasks['update_' + this.name + '_' + new Date().getTime()] = function () {
            if (me.autopan) {
                //console.log('update',me.autoPanner.getValue(context.currentTime), me.autopan);
                //me.update(me.autoPanner.getValue(context.currentTime));
                me.update(Math.sin(context.currentTime * 2 * Math.PI));
            } else {
                me.update();
            }
        };
    };

    SimpleSynth.prototype.createSample = function (event) {
        var data = {
            oscillator: true,
            track: event.track,
            event: event,
            autopan: this.autopan,
            wave_form: this.waveForm,
            release_envelope: 'equal power',
            release_duration: this.releaseDuration
        };
        //console.log(data);
        return createSample(data);
    };

    sequencer.createSimpleSynth = function (config) {
        config = config || {};
        //console.log('creating sinewave');
        return new SimpleSynth(config);
    };


    sequencer.protectedScope.addInitMethod(function () {
        typeString = sequencer.protectedScope.typeString;
        context = protectedScope.context;
        repetitiveTasks = protectedScope.repetitiveTasks;
    });

}
