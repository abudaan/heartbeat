(function(){

    'use strict';

    var initMidi, ready = false, readyCallbacks = [];

    sequencer.protectedScope.callInitMethods(); // → defined in open_module.js
    initMidi = sequencer.protectedScope.initMidi; // defined in midi_system.js
    delete sequencer.protectedScope; //seal


    sequencer.ready = function(cb){
        if(ready === true){
            cb();
        }else{
            readyCallbacks.push(cb);
        }
    };


    sequencer.addInstrument({
        name: 'sinewave',
        folder: 'heartbeat',
        autopan: false,
        attack: 200,
        keyrange: [21,108],
        release_duration: 50
    });


    sequencer.addInstrument({
        name: 'metronome',
        folder: 'heartbeat',
        //release_duration: 250,
        sample_path: 'heartbeat/metronome',
        keyrange: [60,61],
        mapping: {
            '60': {n: 'lowtick'},
            '61': {n: 'hightick'}
        }
    });

    //console.log(sequencer.os, sequencer.browser);

    // safari supports only mp3 and all other browsers support mp3 among others, so although ogg is a better format, mp3 is the best choice here to cover all browsers
    sequencer.addSamplePack({
        name: 'metronome',
        folder: 'heartbeat',
        mapping: {
            'hightick': '//tQxAAACgR/TRSXgAFvIe//HoADsAAACIf14Q80CDFyMVitoKEHHrIWhbUSgTQlj0thODQNBDFAyRKbxAeKx5E1d48iaze970prMN+/fx3cHAQBAEAQB8HwfB/+CBz//6gTB8+8QqgZgACACZpJZbaLhsAArBNB5ohTR0Wz4p+yqbeP5AqQmxICFuNjO8cIQ0249vkk1CQljjj0kwJCUUii2YqGT/2qCpWW+f//9rmY6e/1n9f//+VSA6Do5lsrUpbbbaAAA3EpLY2AAAAE6//7UsQHgAxwn0m4/IABZBCloyNAANTp4HApkSX5yVzWtxxF2J85s9slypC61KouNn15gS2eCbFgrM4syKyGTvxE5nCH7E3lnHb8fhm7duWJuVVZBRSd9ZfYt2caKV8w1k5NbPH+Vw46rpkkUAAAAAEAVIQsmjfBtQOiQOYYBCw8nhSOBIOBslJMljAeOELEWJVSXFHHeOAcRiiz+QEjhSQtQZa1K/GkRYnS2bME1+BQZGs/nQcea/5kYt55//lDIoneukxBTUUzLjk5LjWqqqqq//tSxAcDwAABpBwAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=',
            'lowtick': '//tQxAAACIxNUVSWABGxme23MLACpQAAAABOPzn/CHmgQQsjC4JmwoAGA9WcCQYOTN7r16+85Re+BAQWDgIfE74nB8H/5cHz/g4c9QIOrP//DHggCH/6wfP7ZuFIAglJyRJNuS0BgMaQCKXUbLHHcOfsVatuMrw0VTdSmDIEMdkAiDuDwqoO+EwTj2Q4JRWtbqaeIE7gQmhW01YxRQmvc5KlCBKHfTW/02P3NNUsxOe1vUf/2Ww82GqWcdnQfYtY2s6DP/+taHdnUgEk2m04Df/7UsQFAAuox2X89YAxdJlntaYiEJjkhWy+noTEtxrN6JRSJLapHyuaBis66OtH0knjY9DF4r4ca7PS3R17oc7tu59cydHdLW03v/mGxxNTTfuW1EJGExlbaqmDXLa5HrcVABE80tOmDmrWAAQA1GxnNt3XtMNdi7FHzisCU0Yqvw9LCCYedI2ow+rXAdEAEg5qXyqIkSiOC2QCzFDTdbrutb1uMdZKX9Q4IDLWFWK4mP/qYuv3qkNizgOBGBA8BTuVO//9KmiVipAAFqzJ68C6//tSxAWAC5T7SeegsWFpm6b0/CGQS4ZosBfC3vDvPBrQhKHogTOzYWUXrE2ui4AMDzswNUECcdCDBGH/y8lTFsL7/IXh4sqYtQgcalCWzH//MrImcp3st6l/0c7Ca2SVydf///FPUHUpAAAAI7AIDX0YQV7KaRYXxhXHenFVTVyo8xjUqfJ0nblUPzgNgjFWEYwg63xVjHjGPpX3cxNQbljKbumE1GtHVQ9tUzs02tN7xQ0pc1D5Vx8JRybqmoQr6gSQAAIQIEglFKQuKwOQpQT/+1LECAEMEMsrLTBUwWgY5JWGCpil3Z6JX4eeJaUHlpzyjgUKd6mV8w5EwDAWgR9ZFp0gVJY8nDhOZLkJ5G15/StV3uOXvrXlY0ds8idYZLgohUDJdTqrrl97u2IEHDgFwAoXZqMACNNxUBc1hzjU74QqbjEXij9ua2yJqJqPwUOPBdtqKJznWJ9W5qTDXlCYtk1aXizY5SFqp150hKkyrPxtxa7ZlCXqTJd11rIk3/qzG+3gJDsoDBUYeID//qoAAAOwkl5tjWjkchSKSAnTFf/7UsQIg8i8gPpmBHAAAAA0gAAABEchSFgdjmaHzIHTBgcsrBQwIOhka5sspeoYMDR5YFBAgcfFmaxT+sUbizP6hX/Ff/izf//VTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
        }
    });

    //console.log(initMidi);

    sequencer.addTask({
        type: 'init midi',
        method: initMidi,
        params: []
    }, function(){
        readyCallbacks.forEach(function(cb){
            cb();
        });
        if(sequencer.debug >= 4){
            console.log('sequencer ready');
        }
        ready = true;
    }, true);

    sequencer.startTaskQueue();

}());