window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        mRound = Math.round,
        createSlider = sequencer.util.createSlider,

        song,
        track,
        instrument,
        instrumentUrl,
        instrumentName,
        instrumentFolder,

        compressionType,
        compressionLevel,

        minRelease = 0,
        maxRelease = 40000,

        divMessage = document.getElementById('message'),
        dropdownmenus = document.getElementById('dropdownmenus'),
        divReleaseInfo = document.getElementById('current_release_info'),

        basePath = '/heartbeat/assets/',

        sliderKeyScalingPanningLowestNote,
        sliderKeyScalingPanningHighestNote,
        sliderKeyScalingReleaseLowestNote,
        sliderKeyScalingReleaseHighestNote,
        sliderReverb,
        sliderRelease;



    // disable ui until load is done
    enableUI(false);


    // we have to wait for the sequencer because we want to know which audio types are supported
    sequencer.ready(function(){
        compressionType = sequencer.ogg === true ? 'ogg' : 'mp3';
        compressionLevel = sequencer.ogg === true ? 4 : 128;
        load()
    });


    // load a json file that contains all groovy instruments so we can populate the dropdown menu
    function load(){
        var request = new XMLHttpRequest(),
            url = sequencer.ogg === true ? basePath + 'ir/VS8F.ogg.4.json' : basePath + 'ir/VS8F.mp3.128.json';

        request.onload = function(){
            if(request.status !== 200){
                return;
            }
            // load an assetpack that contains a lot of IR samples, they will be stored in sequencer/storage/audio/impulse_response/
            sequencer.addAssetPack({
                    url: url
                },
                function(){
                    init(JSON.parse(request.response));
                }
            );
        };

        request.open('GET', 'instruments.json', true);
        // we can't use reponse type json because iOS doesn't support it
        request.responseType = 'text';
        request.send();
    }


    function init(instruments){
        var selectInstrument, option, name,
            selectImpulseResponse, samples, reverb;

        // clear loading message
        divMessage.innerHTML = '';

        // create the convolution reverb; the parameter '100-Reverb' is the name of the audio file that is used as impulse response
        reverb = sequencer.createReverb('100-Reverb');

        track = sequencer.createTrack();
        // set monitor to true to route the incoming midi events to the track
        track.monitor = true;
        // connect all midi inputs to the track
        track.setMidiInput('all');
        track.addEffect(reverb);

        song = sequencer.createSong({
            tracks: track
        });


        // create a dropdown menu with all instruments
        selectInstrument = document.createElement('select');
        option = document.createElement('option');
        option.innerHTML = 'select an instrument';
        selectInstrument.add(option);

        for(name in instruments){
            if(instruments.hasOwnProperty(name)){
                option = document.createElement('option');
                option.innerHTML = name;
                selectInstrument.add(option);
            }
        }
        dropdownmenus.appendChild(selectInstrument);


        // load selected instrument only if it hasn't been loaded before
        selectInstrument.addEventListener('change', function(){
            var name = selectInstrument.options[selectInstrument.selectedIndex].value,
                tmp = instruments[name];
            if(tmp !== undefined){
                instrumentUrl = tmp.url;
                instrumentName = name;
                instrumentFolder = tmp.folder;
                loadInstrument();
            }
        }, false);


        // create a dropdown menu that lets you select a IR sample from the available loaded samples
        selectImpulseResponse = document.createElement('select');
        option = document.createElement('option');
        option.innerHTML = 'select an IR sample';
        selectImpulseResponse.add(option);

        samples = sequencer.getSamples('heartbeat/impulse_response');
        samples.forEach(function(sample, i){
            option = document.createElement('option');
            if(i === 0){
                option.setAttribute('selected', true);
            }
            option.innerHTML = sample.name;
            selectImpulseResponse.add(option);
        });
        dropdownmenus.appendChild(selectImpulseResponse);


        selectImpulseResponse.addEventListener('change', function(){
            var sample = samples[selectImpulseResponse.selectedIndex - 1];
            // update the IR sample that the reverb uses
            reverb.node.buffer = sample.data;
        });


        (function(){
            sliderReverb = createSlider({
                slider: document.getElementById('reverb'),
                message: 'reverb: {value}%',
                onMouseMove: handle,
                onMouseDown: handle
            });

            function handle(value){
                sliderReverb.setLabel(mRound(value * 100));
                reverb.setAmount(value);
            }

            sliderReverb.set = function(value){
                this.setValue(value);
            };
        }());


        (function(){
            sliderRelease = createSlider({
                slider: document.getElementById('release'),
                min: minRelease,
                max: maxRelease,
                step: 1,
                message: 'release: {value} millis',
                onMouseMove: handle,
                onMouseDown: function(value){
                    divReleaseInfo.innerHTML = 'release set by release slider';
                    handle(value);
                }
            });

            function handle(value){
                sliderRelease.setLabel(value);
                track.instrument.setRelease(value);
            }

            sliderRelease.set = function(value){
                this.setValue(value);
                this.setLabel(value);
            };
        }());


        (function(){
            sliderKeyScalingReleaseLowestNote = createSlider({
                slider: document.getElementById('ks_release_lowest'),
                message: 'value for lowest note: {value} ms',
                onMouseMove: handle,
                onMouseDown: function(value){
                    divReleaseInfo.innerHTML = 'release set by keyscaling release sliders';
                    handle(value);
                }
            });

            function handle(value){
                // set the release keyscaling by supplying both the value for the lowest note and the highest note
                sliderKeyScalingReleaseLowestNote.setLabel(value);
                track.instrument.setKeyScalingRelease(value, sliderKeyScalingReleaseHighestNote.getValue());
            }

            sliderKeyScalingReleaseLowestNote.set = function(value){
                this.setLabel(value);
                this.setValue(value);
            };
        }());


        (function(){
            sliderKeyScalingReleaseHighestNote = createSlider({
                slider: document.getElementById('ks_release_highest'),
                message: 'value for highest note: {value} ms',
                onMouseMove: handle,
                onMouseDown: function(value){
                    divReleaseInfo.innerHTML = 'release set by keyscaling release sliders';
                    handle(value);
                }
            });

            function handle(value){
                // set the release keyscaling by supplying both the value for the lowest note and the highest note
                sliderKeyScalingReleaseHighestNote.setLabel(value);
                track.instrument.setKeyScalingRelease(sliderKeyScalingReleaseLowestNote.getValue(), value);
            }

            sliderKeyScalingReleaseHighestNote.set = function(value){
                this.setLabel(value);
                this.setValue(value);
            };
        }());


        (function(){
            sliderKeyScalingPanningLowestNote = createSlider({
                slider: document.getElementById('ks_panning_lowest'),
                message: 'value for lowest note: {value}',
                onMouseMove: handle,
                onMouseDown: handle
            });

            function handle(value){
                // set the panning keyscaling by supplying both the value for the lowest note and the highest note
                sliderKeyScalingPanningLowestNote.setLabel(value);
                track.instrument.setKeyScalingPanning(value, sliderKeyScalingPanningHighestNote.getValue());
            }

            sliderKeyScalingPanningLowestNote.set = function(value){
                this.setLabel(value);
                this.setValue(value);
            };
        }());


        (function(){
            sliderKeyScalingPanningHighestNote = createSlider({
                slider: document.getElementById('ks_panning_highest'),
                message: 'value for highest note: {value}',
                onMouseMove: handle,
                onMouseDown: handle
            });

            function handle(value){
                // set the panning keyscaling by supplying both the value for the lowest note and the highest note
                sliderKeyScalingPanningHighestNote.setLabel(value);
                track.instrument.setKeyScalingPanning(sliderKeyScalingPanningLowestNote.getValue(), value);
            }

            sliderKeyScalingPanningHighestNote.set = function(value){
                this.setLabel(value);
                this.setValue(value);
            };
        }());


        // listen for any type of control change and pitch bend event as well to adjust the reverb
        track.addMidiEventListener('pitch bend', 'control change', function(e){
            // remap range 0 - 127 to range 0 - 1
            var value = sequencer.util.remap(e.data2, 0, 127, 0, 1);
            sliderReverb.set(value);
            //console.log(e.data1);
        });

        enableUI(true);
    }


    function loadInstrument(){
        if(instrumentName === undefined){
            return;
        }

        var path = ['heartbeat', instrumentFolder, compressionType, compressionLevel, instrumentName].join('/'),
            file = basePath + instrumentFolder + '/' + instrumentUrl + '.' + compressionType + '.' + compressionLevel + '.json';

        //console.log(path);
        //console.log(file);
        //console.log(sequencer.storage);

        if(sequencer.getInstrument(path, true)){
            console.log(path, 'already loaded');
            instrument = sequencer.createInstrument(path);
            track.setInstrument(instrument);
            setSliders();
            showInstrumentInfo(instrument);
        }else{
            enableUI(false);
            divMessage.innerHTML = 'loading ' + instrumentName + ' (' + compressionType + ' ' + compressionLevel + ')';
            sequencer.addAssetPack({url: file}, function(assetpack){
                if(assetpack === false){
                    divMessage.innerHTML = 'could not load instrument ' + instrumentName + ' (' + compressionType + ' ' + compressionLevel + ')';
                    instrumentName = undefined;
                    enableUI(true);
                    return;
                }
                instrument = sequencer.createInstrument(path);
                track.setInstrument(instrument);
                setSliders();
                showInstrumentInfo(instrument);
                enableUI(true);
            });
        }
    }


    function setSliders(){
        var keyScalingRelease,
            keyScalingPanning;

        keyScalingRelease = track.instrument.keyScalingRelease;

        if(keyScalingRelease !== undefined){
            sliderRelease.set(0);
            sliderKeyScalingReleaseLowestNote.set(keyScalingRelease[0]);
            sliderKeyScalingReleaseHighestNote.set(keyScalingRelease[1]);
            divReleaseInfo.innerHTML = 'release set by keyscaling release sliders';
        }else{
            sliderRelease.set(instrument.releaseDuration);
            sliderKeyScalingReleaseLowestNote.set(0);
            sliderKeyScalingReleaseHighestNote.set(0);
            divReleaseInfo.innerHTML = 'release set by release slider';
        }

        keyScalingPanning = track.instrument.keyScalingPanning;

        if(keyScalingPanning !== undefined){
            sliderKeyScalingPanningLowestNote.set(keyScalingPanning[0]);
            sliderKeyScalingPanningHighestNote.set(keyScalingPanning[1]);
        }else{
            sliderKeyScalingPanningLowestNote.set(0);
            sliderKeyScalingPanningHighestNote.set(0);
        }

        sliderReverb.set(0);
    }


    /*
        Show some information about the instrument, you can set/edit this information in the json file
        when you create/generate the instrument or afterwards.
    */
    function showInstrumentInfo(instrument){
        divMessage.innerHTML = instrument.getInfoAsHTML();
    }


    function enableUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }
};