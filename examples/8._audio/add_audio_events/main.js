window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        createSlider = sequencer.util.createSlider,
        slice = Array.prototype.slice,

        snapValue,
        userInteraction = false,

        btnStop = document.getElementById('stop'),
        btnPlay = document.getElementById('play'),
        btnLoop = document.getElementById('loop'),
        selectSnap = document.getElementById('snap'),
        btnMetronome = document.getElementById('metronome'),
        sliderPlayhead,
        sliderLeftLocator,
        sliderRightLocator,
        samplePackUrl = '../../../assets/looperman/kaynine/loops';


    enableUI(false);

    // load sample pack, the sample pack contains a drum loop @ 120 bpm
    sequencer.ready(function(){
        samplePackUrl = sequencer.ogg === false ? samplePackUrl + '.mp3.json' : samplePackUrl + '.ogg.json';
        sequencer.addSamplePack({url: samplePackUrl}, init);
    });


    function init(){
        var track, part, song, event, events = [];

        track = sequencer.createTrack();
        part = sequencer.createPart();

        // create audio event at ticks 0
        event = sequencer.createAudioEvent({
            ticks: 0,
            velocity: 70,
            sampleOffsetTicks: 0,
            sampleOffsetMillis: 0,
            path: 'looperman/kaynine/electro-drum-120'
        });
        events.push(event);

        // create audio event at 4 bars; the duration of the loop is 4 bars
        event = sequencer.createAudioEvent({
            ticks: 960 * 16, // 4 x 4 x ppq
            velocity: 70,
            sampleOffsetTicks: 0,
            path: '/looperman/kaynine/electro-drum-120',
            /*
                with durationTicks you can easily trim the length of an audio event,
                in this case we set the length to the length of the sample which is
                the same as omitting this key altogether
            */
            durationTicks: 960 * 16
        });
        events.push(event);

        part.addEvents(events);
        track.addPart(part);

        // set the song to match the bpm of the sample
        song = sequencer.createSong({
            bpm: 120,
            useMetronome: true,
            tracks: track,
            loop: true,
            bars: 8 // 2 audio events containing loops of 4 bars
        });

        btnPlay.addEventListener('click', function(){
            if(song.playing){
                song.pause();
            }else{
                song.play();
            }
            btnPlay.value = song.playing === true ? 'pause' : 'play';
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
            snapValue = song.ppq/selectSnap.options[selectSnap.selectedIndex].value;
            var step = snapValue/song.durationTicks;
            sliderLeftLocator.element.step = step;
            sliderRightLocator.element.step = step;
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
                position = song.getPosition('percentage', value, snapValue);
                song.setLeftLocator('ticks', position.ticks);
                sliderLeftLocator.setLabel(position.barsAsString);
                checkLocators();
            }

            sliderLeftLocator.set = function(){
                position = song.getPosition(slice.call(arguments));
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
                position = song.getPosition('percentage', value, snapValue);
                song.setRightLocator('ticks', position.ticks);
                sliderRightLocator.setLabel(position.barsAsString);
                checkLocators();
            }

            sliderRightLocator.set = function(){
                position = song.getPosition(slice.call(arguments));
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

        sliderLeftLocator.set('barsbeats', 1,1,1,0);
        sliderRightLocator.set('barsbeats', 9,1,1,0);

        function checkLocators(){
            sliderLeftLocator.elem.className = song.illegalLoop ? 'illegal' : 'legal';
            sliderRightLocator.elem.className = song.illegalLoop ? 'illegal' : 'legal';
        }


        (function render(){
            if(userInteraction === false){
                sliderPlayhead.setValue(song.percentage);
                sliderPlayhead.setLabel(song.barsAsString);
            }
            window.requestAnimationFrame(render);
        }());

        selectSnap.selectedIndex = 0;
        event = document.createEvent('HTMLEvents');
        event.initEvent('change', false, false);
        selectSnap.dispatchEvent(event);
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
};