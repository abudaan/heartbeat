function musicXMLParser() {

    'use strict';

    var
        //import
        ajax, // → defined in util.js
        typeString, // → defined in util.js
        getNoteNumber, // → defined in note.js

        nsResolver;


    function load(url, cb, returnAsXML) {
        if (url === undefined || cb === undefined) {
            if (sequencer.debug >= sequencer.WARN) {
                console.warn('please provide an url and a callback method');
            }
        }

        ajax({
            url: url + '?' + new Date().getTime(),
            method: 'GET',
            onError: function () {
                cb(false);
            },
            onSuccess: function (response) {
                if (returnAsXML === true) {
                    cb(response);
                } else {
                    cb(parse(response));
                }
            },
            responseType: 'xml'
        });
    }


    function parse(xml) {
        var parser = new DOMParser(),
            xmlDoc = parser.parseFromString(xml, 'application/xml'),
            type = xmlDoc.firstChild.nextSibling.nodeName;

        //console.log('type', type);

        nsResolver = xmlDoc.createNSResolver(xmlDoc.ownerDocument === null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);

        if (type === 'score-partwise') {
            return parsePartWise(xmlDoc);
        } else if (type === 'score-timewise') {
            return parseTimeWise(xmlDoc);
        } else {
            console.log('unknown type', type);
            return false;
        }
    }


    function parsePartWise(xmlDoc) {
        var partIterator = xmlDoc.evaluate('//score-part', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null),
            partNode,
            measureIterator,
            measureNode,
            noteIterator,
            noteNode,
            measureNumber,
            tracks = [],
            timeEvents = [],
            tiedNotes = {},
            tieStart,
            tieStop,
            tieIterator, tieNode,
            events,
            song, track, part, noteOn, noteOff,
            name, id, tmp1, tmp2,
            step, alter, octave, voice, noteType, noteDuration, noteName, noteNumber, velocity,
            rest, chord,
            divisions, numerator, denominator,
            ppq = sequencer.defaultPPQ,
            ticks;

        while ((partNode = partIterator.iterateNext()) !== null) {
            // get id and name of the part
            id = xmlDoc.evaluate('@id', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            name = xmlDoc.evaluate('part-name', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            velocity = xmlDoc.evaluate('midi-instrument/volume', partNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
            velocity = parseInt((velocity / 100) * 127);

            ticks = 0;
            track = sequencer.createTrack(name);
            part = sequencer.createPart();
            track.addPart(part);
            tracks.push(track);
            events = [];

            //console.log(id, name, velocity);

            // get all measures
            measureIterator = xmlDoc.evaluate('//part[@id="' + id + '"]/measure', partNode, nsResolver, XPathResult.ANY_TYPE, null);
            while ((measureNode = measureIterator.iterateNext()) !== null) {

                measureNumber = xmlDoc.evaluate('@number', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;

                tmp1 = xmlDoc.evaluate('attributes/divisions', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                if (!isNaN(tmp1)) {
                    divisions = tmp1;
                }

                tmp1 = xmlDoc.evaluate('attributes/time/beats', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                tmp2 = xmlDoc.evaluate('attributes/time/beat-type', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                if (!isNaN(tmp1)) {
                    numerator = tmp1;
                    denominator = tmp2;
                    timeEvents.push(sequencer.createMidiEvent(ticks, sequencer.TIME_SIGNATURE, numerator, denominator));
                }
                //console.log(divisions, numerator, denominator);

                // get all notes and backups
                //noteIterator = xmlDoc.evaluate('note', measureNode, nsResolver, XPathResult.ANY_TYPE, null);
                noteIterator = xmlDoc.evaluate('*[self::note or self::backup or self::forward]', measureNode, nsResolver, XPathResult.ANY_TYPE, null);
                while ((noteNode = noteIterator.iterateNext()) !== null) {
                    //console.log(noteNode);

                    tieStart = false;
                    tieStop = false;
                    tieIterator = xmlDoc.evaluate('tie', noteNode, nsResolver, XPathResult.ANY_TYPE, null);
                    while ((tieNode = tieIterator.iterateNext()) !== null) {
                        tmp1 = xmlDoc.evaluate('@type', tieNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        //console.log(tmp1);
                        if (tmp1 === 'start') {
                            tieStart = true;
                        } else if (tmp1 === 'stop') {
                            tieStop = true;
                        }
                        //tieStart = xmlDoc.evaluate('@type="start"', tieNode, nsResolver, XPathResult.BOOLEAN_TYPE, null).booleanValue;
                        //tieStop = xmlDoc.evaluate('@type="stop"', tieNode, nsResolver, XPathResult.BOOLEAN_TYPE, null).booleanValue;
                        //console.log(tieStart, tieStop);
                    }

                    rest = xmlDoc.evaluate('rest', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    chord = xmlDoc.evaluate('chord', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                    if (rest !== null) {
                        //console.log(rest);
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        ticks += (noteDuration / divisions) * ppq;

                    } else if (noteNode.nodeName === 'note') {

                        step = xmlDoc.evaluate('pitch/step', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        alter = xmlDoc.evaluate('pitch/alter', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        voice = xmlDoc.evaluate('voice', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        octave = xmlDoc.evaluate('pitch/octave', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        noteType = xmlDoc.evaluate('type', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        noteName = step;

                        if (step !== '') {
                            if (!isNaN(alter)) {
                                switch (alter) {
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
                            noteOn = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
                            ticks += (noteDuration / divisions) * ppq;
                            noteOff = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
                            if (chord !== null) {
                                ticks -= (noteDuration / divisions) * ppq;
                            }

                            //console.log('tie', tieStart, tieStop);

                            if (tieStart === false && tieStop === false) {
                                // no ties
                                events.push(noteOn, noteOff);
                                //console.log('no ties', measureNumber, voice, noteNumber, tiedNotes);
                            } else if (tieStart === true && tieStop === false) {
                                // start of tie
                                tiedNotes[voice + '-' + noteNumber] = noteOff;
                                events.push(noteOn, noteOff);
                                //console.log('start', measureNumber, voice, noteNumber, tiedNotes);
                            } else if (tieStart === true && tieStop === true) {
                                // tied to yet another note
                                tiedNotes[voice + '-' + noteNumber].ticks += (noteDuration / divisions) * ppq;
                                //console.log('thru', measureNumber, voice, noteNumber, tiedNotes);
                            } else if (tieStart === false && tieStop === true) {
                                // end of tie
                                tiedNotes[voice + '-' + noteNumber].ticks += (noteDuration / divisions) * ppq;
                                delete tiedNotes[voice + '-' + noteNumber];
                                //console.log('end', measureNumber, voice, noteNumber, tiedNotes);
                            }
                            //console.log(noteNumber, ticks);
                        }

                    } else if (noteNode.nodeName === 'backup') {
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        ticks -= (noteDuration / divisions) * ppq;
                        //console.log(noteDuration, divisions);
                    } else if (noteNode.nodeName === 'forward') {
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        ticks += (noteDuration / divisions) * ppq;
                        //console.log(noteDuration, divisions);
                    }
                    //console.log(ticks);
                }
            }
            part.addEvents(events);
            //console.log(tiedNotes);
        }

        song = sequencer.createSong({
            bpm: 110,
            tracks: tracks[0],
            timeEvents: timeEvents,
            useMetronome: false
        });

        return song;
    }


    function parseTimeWise(xmlDoc) {
        return xmlDoc;
    }

    sequencer.loadMusicXML = load;
    sequencer.parseMusicXML = parse;

    sequencer.protectedScope.addInitMethod(function () {
        ajax = sequencer.protectedScope.ajax;
        typeString = sequencer.protectedScope.typeString;
        getNoteNumber = sequencer.getNoteNumber;
    });

}
