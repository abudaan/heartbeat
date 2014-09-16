(function(){

    'use strict';

    var
        // satisfy jslint
        //alert = window.alert,
        console = window.console,

        protectedScope,
        initMethods = [],

        context,
        gainNode,
        compressor,
        src,
        sampleIndex = 0,
        compressorParams = ['threshold', 'knee', 'ratio', 'reduction', 'attack', 'release'],

        ua = navigator.userAgent,
        os,
        browser,
        legacy = false;


    if(ua.match(/(iPad|iPhone|iPod)/g)){
        os = 'ios';
    }else if(ua.indexOf('Android') !== -1){
        os = 'android';
    }else if(ua.indexOf('Linux') !== -1){
        os = 'linux';
    }else if(ua.indexOf('Macintosh') !== -1){
        os = 'osx';
    }else if(ua.indexOf('Windows') !== -1){
        os = 'windows';
    }

    if(ua.indexOf('Chrome') !== -1){
        // chrome, chromium and canary
        browser = 'chrome';

        if(ua.indexOf('OPR') !== -1){
            browser = 'opera';
        }

        /*
        //console.log(new Audio().canPlayType('audio/mp3'));
        if(new Audio().canPlayType('audio/mp3') !== 'probably'){
            // chromium does not support mp3
            browser = 'chromium';
        }
        */
    }else if(ua.indexOf('Safari') !== -1){
        browser = 'safari';
    }else if(ua.indexOf('Firefox') !== -1){
        browser = 'firefox';
    }

    if(os === 'ios'){
        if(ua.indexOf('CriOS') !== -1){
            browser = 'chrome';
        }
    }

    //console.log(os, browser, '---', ua);


    if(window.AudioContext){
        context = new window.AudioContext();
        if(context.createGainNode === undefined){
            context.createGainNode = context.createGain;
        }
    }else if(window.webkitAudioContext){
        context = new window.webkitAudioContext();
    }else if(window.oAudioContext){
        context = new window.oAudioContext();
    }else if(window.msAudioContext){
        context = new window.msAudioContext();
    }else{
        //alert('Your browser does not support AudioContext!\n\nPlease use one of these browsers:\n\n- Chromium (Linux | Windows)\n- Firefox (OSX | Windows)\n- Chrome (Linux | Android | OSX | Windows)\n- Canary (OSX | Windows)\n- Safari (iOS 6.0+ | OSX)\n\nIf you use Chrome or Chromium, heartbeat uses the WebMIDI api');
        window.sequencer = {
            browser: browser,
            os: os
        };
        alert('heartbeat requires the Web Audio API which is not yet implemented in ' + browser + '; please use another browser');
        window.sequencer.ready = function(cb){
            cb();
        }
        return;
    }

    src = context.createBufferSource();
    if(src.start === undefined){
        legacy = true;
    }


    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
    window.Blob = window.Blob || window.webkitBlob || window.mozBlob;

    //console.log('iOS', os, context, window.Blob, window.requestAnimationFrame);

    compressor = context.createDynamicsCompressor();
    compressor.connect(context.destination);
    //console.log(compressor);
    gainNode = context.createGainNode();
    //gainNode.connect(compressor);
    gainNode.connect(context.destination);
    gainNode.gain.value = 1;


    protectedScope = {

        context: context,
        //destination: context.destination,
        masterGainNode: gainNode,
        masterCompressor: compressor,

        useDelta: false,

        timedTasks: {},
        scheduledTasks: {},
        repetitiveTasks: {},

        getSampleId: function(){
            return 'S' + sampleIndex++ + new Date().getTime();
        },

        addInitMethod: function(method){
            initMethods.push(method);
        },

        callInitMethods: function(){
            var i, maxi = initMethods.length;
            for(i = 0; i < maxi; i++){
                initMethods[i]();
            }
        }
/*
        log: function(msg){
            if(sequencer.debug >= 1){
                console.log(msg);
            }
        },
        info: function(msg){
            if(sequencer.debug >= 2){
                console.info(msg);
            }
        },
        error: function(msg){
            if(sequencer.debug >= 3){
                console.error(msg);
            }
        },
*/
/*
        addConstants: function(data){
            var newSequencer = {};
            Object.getOwnPropertyNames(data).forEach(function(val, idx, array) {
                print(val + " -> " + data[val]);
            });
        };
*/
    };



    window.sequencer = {

        protectedScope: protectedScope,
        ui: {},
        ua: ua,
        os: os,
        browser: browser,
        legacy: legacy,
        webmidi: false,
        webaudio: true,
        util: {},
        debug: 4, // 0 = off, 1 = error, 2 = warn, 3 = info, 4 = log
        defaultInstrument: 'sinewave',
        pitch: 440,
        bufferTime: 350/1000, //seconds
        autoAdjustBufferTime: false,
        noteNameMode: 'sharp',
        minimalSongLength: 60000, //millis
        pauseOnBlur: false,
        restartOnFocus: true,
        defaultPPQ: 960,
        overrulePPQ: true,
        precision: 3, // means float with precision 3, e.g. 10.437

        midiInputs: [],
        midiOutputs: [],
/*
        logger: {
            clear: function(){console.log('create a logger first with sequencer.createLogger()');},
            print: function(){console.log('create a logger first with sequencer.createLogger()');}
        },
*/
        storage: {
            midi: {
                id: 'midi'
            },
            audio: {
                id: 'audio'
            },
            instruments: {
                id: 'instruments'
            },
            samplepacks: {
                id: 'samplepacks'
            },
            assetpacks: {
                id: 'assetpacks'
            }
        },
/*
        createLogger: function(){
            var divLog = document.createElement('div'),
                clear, print;

            divLog.style.position = 'absolute';
            divLog.style.zIndex = 100;
            divLog.style.fontFamily = 'monospace';
            divLog.style.fontSize = '11px';
            divLog.style.color = '#00ff00';
            divLog.style.padding = '2px';
            divLog.style.width = '500px';
            divLog.style.backgroundColor = '#000000';
            document.body.appendChild(divLog);

            clear = function(){
                divLog.innerHTML = '';
            };

            print = function(msg, append){
                append = append === undefined ? false : append;
                if(append){
                    divLog.innerHTML += msg + '<br/>';
                }else{
                    divLog.innerHTML = msg + '<br/>';
                }
            };

            this.logger.clear = clear;
            this.logger.print = print;
        },
*/
        getTime: function(){
            return context.currentTime;
        },

        setMasterVolume: function(value){
            value = value < 0 ? 0 : value > 1 ? 1 : value;
            gainNode.gain.value = value;
        },

        getMasterVolume: function(){
            return gainNode.gain.value;
        },

        getCompressionReduction: function(){
            //console.log(compressor);
            return compressor.reduction.value;
        },

        enableMasterCompressor: function(flag){
            if(flag){
                gainNode.disconnect(0);
                gainNode.connect(compressor);
                compressor.disconnect(0);
                compressor.connect(context.destination);
            }else{
                compressor.disconnect(0);
                gainNode.disconnect(0);
                gainNode.connect(context.destination);
            }
        },

        configureMasterCompressor: function(cfg){
            /*
                readonly attribute AudioParam threshold; // in Decibels
                readonly attribute AudioParam knee; // in Decibels
                readonly attribute AudioParam ratio; // unit-less
                readonly attribute AudioParam reduction; // in Decibels
                readonly attribute AudioParam attack; // in Seconds
                readonly attribute AudioParam release; // in Seconds
            */
            var i, param;
            for(i = compressorParams.length; i >= 0; i--){
                param = compressorParams[i];
                if(cfg[param] !== undefined){
                    compressor[param].value = cfg[param];
                }
            }
        }

    };

    //Object.defineProperty(window.sequencer, 'timedTasks', {value: {}});
    //Object.defineProperty(window.sequencer, 'scheduledTasks', {value: {}});
    //Object.defineProperty(window.sequencer, 'repetitiveTasks', {value: {}});

    //Object.defineProperty(window.sequencer, 'midiInputs', {value: []});
    //Object.defineProperty(window.sequencer, 'midiOutputs', {value: []});


}());