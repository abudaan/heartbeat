(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //import
        ajax, // → defined in util.js
        typeString, // → defined in util.js
        getNoteNumber, // → defined in note.js

        nsResolver;


    function load(url, cb, returnAsXML){
        if(url === undefined || cb === undefined){
            if(sequencer.debug >= sequencer.WARN){
                console.warn('please provide an url and a callback method');
            }
        }

        ajax({
            url: url + '?' + new Date().getTime(),
            method: 'GET',
            onError: function(){
                cb(false);
            },
            onSuccess: function(response){
                if(returnAsXML === true){
                    cb(response);
                }else{
                    cb(parse(response));
                }
            },
            responseType: 'xml'
        });
    }


    function parse(xml){
        var parser = new DOMParser(),
            xmlDoc = parser.parseFromString(xml, 'application/xml'),
            type = xmlDoc.firstChild.nextSibling.nodeName;

        //console.log('type', type);

        nsResolver = xmlDoc.createNSResolver(xmlDoc.ownerDocument === null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);

        if(type === 'score-partwise'){
            return parsePartWise(xmlDoc);
        }else if(type === 'score-timewise'){
            return parseTimeWise(xmlDoc);
        }else{
            console.log('unknown type', type);
            return false;
        }
    }


    function parsePartWise(xmlDoc){
        var partIterator = xmlDoc.evaluate('//score-part', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null),
            partNode,
            measureIterator,
            measureNode,
            noteIterator,
            noteNode,
            tracks = [],
            timeEvents = [],
            events,
            song, track, part,
            name, id, tmp1, tmp2,
            step, alter, octave, noteType, noteDuration, noteName, noteNumber, velocity,
            rest, chord, tie,
            divisions, numerator, denominator,
            ppq = sequencer.defaultPPQ,
            ticks;

        while((partNode = partIterator.iterateNext()) !== null) {
            // get id and name of the part
            id = xmlDoc.evaluate('@id', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            name = xmlDoc.evaluate('part-name', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            velocity = xmlDoc.evaluate('midi-instrument/volume', partNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
            velocity = parseInt((velocity/100) * 127);

            ticks = 0;
            track = sequencer.createTrack(name);
            part = sequencer.createPart();
            track.addPart(part);
            tracks.push(track);
            events = [];

            //console.log(id, name, velocity);

            // get all measures
            measureIterator = xmlDoc.evaluate('//part[@id="' + id + '"]/measure', partNode, nsResolver, XPathResult.ANY_TYPE, null);
            while((measureNode = measureIterator.iterateNext()) !== null) {

                tmp1 = xmlDoc.evaluate('attributes/divisions', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                if(!isNaN(tmp1)){
                    divisions = tmp1;
                }

                tmp1 = xmlDoc.evaluate('attributes/time/beats', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                tmp2 = xmlDoc.evaluate('attributes/time/beat-type', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                if(!isNaN(tmp1)){
                    numerator = tmp1;
                    denominator = tmp2;
                    timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, numerator, denominator));
                }
                //console.log(divisions, numerator, denominator);

                // get all notes and backups
                //noteIterator = xmlDoc.evaluate('note', measureNode, nsResolver, XPathResult.ANY_TYPE, null);
                noteIterator = xmlDoc.evaluate('*[self::note or self::backup]', measureNode, nsResolver, XPathResult.ANY_TYPE, null);
                while((noteNode = noteIterator.iterateNext()) !== null){
                    //console.log(noteNode);

                    tie = xmlDoc.evaluate('tie', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    rest = xmlDoc.evaluate('rest', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    chord = xmlDoc.evaluate('chord', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                    if(rest !== null){
                        //console.log(rest);
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        ticks += (noteDuration/divisions) * ppq;

                    }else if(noteNode.nodeName === 'note'){

                        step = xmlDoc.evaluate('pitch/step', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        alter = xmlDoc.evaluate('pitch/alter', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        octave = xmlDoc.evaluate('pitch/octave', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        noteType = xmlDoc.evaluate('type', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        noteName = step;

                        if(step !== ''){
                            if(!isNaN(alter)){
                                switch(alter){
                                    case -2:
                                        noteName += 'bb';
                                        break;
                                    case -1:
                                        noteName += 'b';
                                        break;
                                    case 1:
                                        noteName += '#';
                                        break;
                                    case 2:
                                        noteName += '##';
                                        break;
                                }
                            }
                            noteNumber = getNoteNumber(noteName, octave);
                            events.push(sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity));
                            ticks += (noteDuration/divisions) * ppq;
                            events.push(sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0));
                            if(chord !== null){
                                ticks -= (noteDuration/divisions) * ppq;
                            }
                            //console.log(noteNumber, ticks);
                        }

                    }else if(noteNode.nodeName === 'backup'){
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        ticks -= (noteDuration/divisions) * ppq;
                        //console.log(noteDuration, divisions);
                    }
                    //console.log(ticks);
                }
            }
            part.addEvents(events);
        }

        song = sequencer.createSong({
            bpm: 110,
            tracks: tracks,
            timeEvents: timeEvents,
            useMetronome: false
        });

        return song;
    }


    function parseTimeWise(xmlDoc){
        return xmlDoc;
    }

    sequencer.loadMusicXML = load;
    sequencer.parseMusicXML = parse;

    sequencer.protectedScope.addInitMethod(function(){
        ajax = sequencer.protectedScope.ajax;
        typeString = sequencer.protectedScope.typeString;
        getNoteNumber = sequencer.getNoteNumber;
    });

}());