window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        mRound = Math.round,

        minRelease = 0,
        maxRelease = 5000,
        releaseRange = maxRelease - minRelease,
        path = '../../../assets',

        sliderRelease = document.getElementById('release');



    sliderRelease.name = 'release';
    sliderRelease.label = sliderRelease.parentNode.firstChild;
    enableUI(false);

    // add asset pack, this pack contains a piano
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);


    function init(){
        var track, song, instrument, release;

        track = sequencer.createTrack();
        track.setInstrument('piano');
        // set monitor to true to route the incoming midi events to the track
        track.monitor = true;
        track.setMidiInput('all');

        // get the current release of the instrument and set the slider to this value
        instrument = track.instrument;
        release = instrument.releaseDuration;
        sliderRelease.value = (release - minRelease)/releaseRange;
        sliderRelease.label.innerHTML = sliderRelease.name + ': ' + release + ' millis';

        song = sequencer.createSong({
            tracks: track
        });

        sliderRelease.addEventListener('mousedown', function(){
            sliderRelease.addEventListener('mousemove', handleSliderMove, false);
        }, false);

        sliderRelease.addEventListener('mouseup', function(){
            sliderRelease.removeEventListener('mousemove', handleSliderMove, false);
            instrument.setRelease(mRound(minRelease + (sliderRelease.valueAsNumber * releaseRange)));
        }, false);

        enableUI(true);
    }


    function enableUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }


    function handleSliderMove(e){
        var slider = e.target;
        slider.label.innerHTML = slider.name + ': ' + mRound(minRelease + (sliderRelease.valueAsNumber * releaseRange)) + ' millis';
    }
};