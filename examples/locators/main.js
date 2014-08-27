window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        createSlider = sequencer.util.createSlider,
        AP = Array.prototype,

        song,
        snapValue = 16, //64th notes
        userInteraction = false,

        btnStop = document.getElementById('stop'),
        btnPlay = document.getElementById('play'),
        btnLoop = document.getElementById('loop'),
        selectSnap = document.getElementById('snap'),
        btnMetronome = document.getElementById('metronome'),
        sliderPlayhead,
        sliderLeftLocator,
        sliderRightLocator,
        path = '../../assets';


    enableUI(false);

    // load asset pack, this pack contains a piano and a midi file called "Sonata Facile"
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);


    function init(){
        var midiFile;

        // get the midi file from sequencer.storage
        midiFile = sequencer.getMidiFile('Sonata Facile');

        midiFile.useMetronome = true;
        song = sequencer.createSong(midiFile);

        // set all tracks of the song to use 'piano'
        song.tracks.forEach(function(track){
            //console.log(track);
            track.setInstrument('piano');
        });


        btnPlay.addEventListener('click', function(){
            if(song.playing === true){
                song.pause();
                this.value = 'pause';
            }else{
                song.play();
                this.value = 'play';
            }
        }, false);


        btnStop.addEventListener('click', function(){
            song.stop();
            btnPlay.value = 'play';
        }, false);


        btnLoop.addEventListener('click', function(){
            /*
                You can pass "true" and "false" to song.setLoop()

                If you don't pass a value it will toggle the loop state of the song.

                Note that turning the loop on doesn't mean that the song will actually loop; the left and right
                locators have to be set and the left locator should be placed before the right locator.
            */
            song.setLoop();
            this.value = song.loop ? 'turn loop off' : 'turn loop on';

        }, false);


        btnMetronome.addEventListener('click', function(){
            song.useMetronome = !song.useMetronome;
            this.value = song.useMetronome ? 'turn metronome off' : 'turn metronome on';
        }, false);


        selectSnap.addEventListener('change', function(){
            snapValue = selectSnap.options[selectSnap.selectedIndex].value;
            //console.log(snapValue);
        }, false);


        (function(){
            var position;
            sliderLeftLocator = createSlider({
                slider: document.getElementById('left_locator'),
                message: 'song bar: {value}',
                onMouseDown: handle,
                onMouseMove: handle
            });

            function handle(value){
                /*
                    Get the position data based on a percentage, the third argument is the snap value, i.e. the number of
                    ticks to round off to, this value can be set with the dropdown.

                    ppq is the number of ticks per quarter so for instance a snapValue of 4 means: round off to the nearest sixteenth note.
                */
                position = song.getPosition('percentage', value, song.ppq/snapValue);
                song.setLeftLocator('ticks', position.ticks);
                sliderLeftLocator.setLabel(position.barsAsString);
                checkLocators();
            }

            sliderLeftLocator.set = function(){
                position = song.getPosition(AP.slice.call(arguments));
                this.setValue(position.percentage);
                this.setLabel(position.barsAsString);
                song.setLeftLocator('ticks', position.ticks);
                checkLocators();
            };
        }());


        (function(){
            var position;
            sliderRightLocator = createSlider({
                slider: document.getElementById('right_locator'),
                message: 'song bar: {value}',
                onMouseDown: handle,
                onMouseMove: handle
            });

            function handle(value){
                position = song.getPosition('percentage', value, song.ppq/snapValue);
                song.setRightLocator('ticks', position.ticks);
                sliderRightLocator.setLabel(position.barsAsString);
                checkLocators();
            }

            sliderRightLocator.set = function(){
                position = song.getPosition(AP.slice.call(arguments));
                this.setValue(position.percentage);
                this.setLabel(position.barsAsString);
                song.setRightLocator('ticks', position.ticks);
                checkLocators();
            };
        }());


        (function(){
            sliderPlayhead = createSlider({
                slider: document.getElementById('playhead'),
                message: 'song bar: {value}',
                onMouseDown: handle,
                onMouseMove: handle,
                //onChange: handle,
                onMouseUp: function(){
                    userInteraction = false;
                }
            });

            function handle(value, e){
                var position = song.getPosition('percentage', value);
                song.setPlayhead('millis', position.millis);
                sliderPlayhead.setLabel(position.barsAsString);
                if(e.type === 'mousedown'){
                    userInteraction = true;
                }
            }
        }());

        sliderLeftLocator.set('barsbeats', 2,1,1,0);
        sliderRightLocator.set('barsbeats', 5,1,1,0);

        render();
        enableUI(true);
    }


    function checkLocators(){
        sliderLeftLocator.elem.className = song.illegalLoop ? 'illegal' : 'legal';
        sliderRightLocator.elem.className = song.illegalLoop ? 'illegal' : 'legal';
    }


    function render(){
        if(userInteraction === false){
            sliderPlayhead.setValue(song.percentage);
            sliderPlayhead.setLabel(song.barsAsString);
        }
        window.requestAnimationFrame(render);
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