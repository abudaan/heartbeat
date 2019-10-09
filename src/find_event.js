function findEvent() {

	'use strict';

	var
		//import
		createNote, // → defined in note.js
		typeString, // → defined in util.js
		createMidiNote, // → defined in midi_note.js
		midiEventNumberByName, // → defined in midi_event_names.js

		//local
		patterns,
		operators,

		properties = {
			'barsbeats': ['bar', 'beat', 'sixteenth', 'tick'],
			'time': ['hour', 'minute', 'second', 'millisecond']
		},

		logicalOperators = 'OR AND NOT XOR',
		logicalOperatorsRegex = new RegExp(' ' + logicalOperators.replace(/\s+/g, ' | ') + ' '),// → replaces logical operator by a white space

		supportedProperties = {
			bar: 1,
			beat: 1,
			sixteenth: 1,
			tick: 1,
			ticks: 1,
			barsbeats: 1,
			musical_time: 1,

			hour: 1,
			minute: 1,
			second: 1,
			millisecond: 1,
			millis: 1,
			time: 1,
			linear_time: 1,

			id: 1,
			type: 1,
			data1: 1,
			data2: 1,
			velocity: 1, // only if midi event is note on or note off
			noteNumber: 1, // idem
			frequency: 1, // idem
			noteName: 1 // idem
		},


		//public
		findEvent,
		findNote,

		//private
		getEvents,
		checkValue,
		createPattern,
		checkOperators,
		checkCondition,
		checkCondition2,
		inverseOperator,
		removeMutualEvents,
		removeDoubleEvents,
		performSearch;

	/*

		(bar > 3 AND beat = 2 OR velocity = 60) => ((bar > 3 && beat === 2) || velocity === 60)

		(beat = 2 OR velocity = 60 AND bar > 3) => ((beat === 2 || velocity === 60) && bar > 3)

		(beat == 2 XOR velocity == 60) -> all events that are on beat 2 and all events that have on velocity 60, but not the event that match both

		step 1: get all events that match beat == 2
		step 2: add all events that match velocity == 60
		step 3: remove all events that match both beat == 2 AND velocity == 60
	*/


	findEvent = function () {
		//console.time('find events');
		var args = Array.prototype.slice.call(arguments),
			i, maxi,
			//j, maxj,
			//k, maxk,
			searchString, tmp,
			operator, pattern,
			prevPattern, prevOperator,
			patternIndex, operatorIndex,
			events, results,
			lastResult,
			subResult1,
			subResult2;


		//console.log(args[0])
		events = getEvents(args[0]);
		results = [];

		if (events.length === 0) {
			console.warn('findEvent: no events');
			return results;
		}

		if (typeString(args[1]) !== 'string') {
			console.error('please provide a search string like for instance findEvent(\'beat = 2 AND velocity > 60 < 100\');');
			return results;
		}

		searchString = args[1];

		//get the operators
		tmp = searchString.split(' ');
		maxi = tmp.length;
		operators = [];

		for (i = 0; i < maxi; i++) {
			operator = tmp[i];
			if (logicalOperatorsRegex.test(' ' + operator + ' ')) {
				operators.push(operator);
			}
		}

		//get the patterns
		tmp = searchString.split(logicalOperatorsRegex);
		maxi = tmp.length;
		patterns = [];

		for (i = 0; i < maxi; i++) {
			createPattern(tmp[i].split(' '));
		}

		//start loop over events
		maxi = patterns.length;
		patternIndex = 0;
		operatorIndex = -1;

		for (i = 0; i < maxi; i++) {

			pattern = patterns[patternIndex++];
			operator = operators[operatorIndex++];
			//console.log(operator,pattern,patternIndex,results.length);


			if (operator === 'AND') {
				// perform search on the results of the former search
				results = performSearch(results, pattern);

			} else if (operator === 'NOT') {
				// perform search on the results of the former search
				results = performSearch(results, pattern, true);

			} else if (operator === 'XOR') {
				/*
								//filter events from the previous results
								if(prevOperator === 'OR' || prevOperator === 'XOR'){
				
									subResult1 = performSearch(results,pattern,true);
									subResult1 = performSearch(subResult1,prevPattern,true);
				
								}else{
									//filter results of the left part of the XOR expression by inversing the right part of the expression
									subResult1 = performSearch(results,pattern,true);
								}
				
								//filter events from all events (OR and XOR always operate on all events)
								subResult2 = performSearch(events,pattern);
								subResult2 = performSearch(subResult2,prevPattern,true);
				
								//combine the 2 result sets
								results = subResult1.concat(subResult2);//subResult1.concat(subResult1,subResult2);
				*/
				//NEW APPROACH
				//get from all events the events that match the pattern
				subResult1 = performSearch(events, pattern);
				//and then remove all events that match both all previous patterns and the current pattern
				results = removeMutualEvents(results, subResult1);

			} else {

				lastResult = performSearch(events, pattern);
				results = results.concat(lastResult);

			}

			prevPattern = pattern;
			prevOperator = operator;
		}

		//console.log(patterns,operators);
		//console.log(results.length);
		//console.timeEnd('find events');
		return removeDoubleEvents(results);
	};


	removeMutualEvents = function (resultSet1, resultSet2) {
		var i, maxi = resultSet1.length,
			j, maxj = resultSet2.length,
			event, eventId, addEvent,
			result = [];

		for (i = 0; i < maxi; i++) {

			addEvent = true;

			event = resultSet1[i];
			eventId = event.id;

			for (j = 0; j < maxj; j++) {

				if (resultSet2[j].id === eventId) {
					addEvent = false;
					break;
				}
			}

			if (addEvent) {
				result.push(event);
			}
		}

		for (j = 0; j < maxj; j++) {

			addEvent = true;

			event = resultSet2[j];
			eventId = event.id;

			for (i = 0; i < maxi; i++) {

				if (resultSet1[i].id === eventId) {
					addEvent = false;
					break;
				}
			}

			if (addEvent) {
				result.push(event);
			}
		}

		return result;
	};


	removeDoubleEvents = function (events) {
		var i, maxi = events.length,
			event, eventId, lastId,
			result = [];

		events.sort(function (a, b) {
			return a.eventNumber - b.eventNumber;
		});

		for (i = 0; i < maxi; i++) {
			event = events[i];
			eventId = event.id;
			if (eventId !== lastId) {
				result.push(event);
			}
			lastId = eventId;
		}
		return result;
	};


	performSearch = function (events, pattern, inverse) {
		var
			searchResult = [],
			property = pattern.property,
			operator1 = pattern.operator1,
			operator2 = pattern.operator2,
			value1 = pattern.value1,
			value2 = pattern.value2,
			numEvents = events.length, event, i,
			condition = false;

		inverse = inverse || false;

		if (inverse) {
			operator1 = inverseOperator(operator1);
			operator2 = inverseOperator(operator2);
		}


		for (i = 0; i < numEvents; i++) {

			event = events[i];
			condition = checkCondition(property, event[property], operator1, value1, operator2, value2);

			if (condition) {
				searchResult.push(event);
			}
		}

		return searchResult;
	};


	checkCondition = function (property, propValue, operator1, value1, operator2, value2) {
		var result = false,
			isString = false;


		if (propValue === undefined) {
			return result;
		}


		switch (property) {

			case 'noteName':
				if (operator1 === '=') {
					//this situation occurs if you search for the first letter(s) of an note name, e.g C matches C#, C##, Cb and Cbb
					if (value1.length === 3 && propValue.length === 4) {
						result = propValue.indexOf(value1) === 0;
					} else if (value1.length === 4 && propValue.length === 5) {
						result = propValue.indexOf(value1) === 0;
					}
					return result;
				}
				break;

			case 'type':
				if (typeString(value1) !== 'number' && isNaN(value1)) {
					value1 = midiEventNumberByName(value1);
				}
				break;

			case 'bar':
			case 'beat':
			case 'sixteenth':
				//propValue += 1;
				break;
		}


		if (typeString(propValue) === 'string') {

			if (typeString(value1) !== 'string') {
				value1 = '\'' + value1 + '\'';
			}
			if (value2 && typeString(value2) !== 'string') {
				value2 = '\'' + value2 + '\'';
			}
			isString = true;

		} else if (typeString(propValue) === 'number') {

			if (typeString(value1) !== 'number') {
				value1 = parseInt(value1);//don't use a radix because values can be both decimal and hexadecimal!
			}
			if (value2 && typeString(value2) !== 'number') {
				value2 = parseInt(value2);
			}
		}


		switch (operator1) {

			case '=':
			case '==':
			case '===':
				result = propValue === value1;
				break;


			case '*=':
				result = propValue.indexOf(value1) !== -1;
				break;

			case '^=':
				result = propValue.indexOf(value1) === 0;
				break;

			case '$=':
				result = propValue.indexOf(value1) === (propValue.length - value1.length);
				break;

			case '%=':
				if (isString) {
					result = false;
				} else {
					result = propValue % value1 === 0;
				}
				break;


			case '!*=':
				result = !(propValue.indexOf(value1) !== -1);
				break;

			case '!^=':
				result = !(propValue.indexOf(value1) === 0);
				break;

			case '!$=':
				result = !(propValue.indexOf(value1) === (propValue.length - value1.length));
				break;

			case '!%=':
				if (isString) {
					result = true;
				} else {
					result = !(propValue % value1 === 0);
				}
				break;


			case '!=':
			case '!==':
				if (isString) {
					result = propValue.indexOf(value1) === -1;
				} else {
					result = propValue !== value1;
				}
				break;

			case '>':
				if (operator2) {
					result = checkCondition2(propValue, operator1, value1, operator2, value2);
				} else {
					result = propValue > value1;
				}
				break;

			case '>=':
				if (operator2) {
					result = checkCondition2(propValue, operator1, value1, operator2, value2);
				} else {
					result = propValue >= value1;
				}
				break;

			case '<':
				if (operator2) {
					result = checkCondition2(propValue, operator1, value1, operator2, value2);
				} else {
					result = propValue < value1;
				}
				break;

			case '<=':
				if (operator2) {
					result = checkCondition2(propValue, operator1, value1, operator2, value2);
				} else {
					result = propValue <= value1;
				}
				break;

			default:
				console.warn('eval is evil!');
			//result = eval(propValue + operator + value1);

		}

		//console.log(isString,property,propValue,operator,value1,result);

		return result;
	};


	checkCondition2 = function (propValue, operator1, value1, operator2, value2) {

		var result = false;

		switch (operator1) {

			case '>':

				switch (operator2) {
					case '<':
						result = propValue > value1 && propValue < value2;
						break;
					case '<=':
						result = propValue > value1 && propValue <= value2;
						break;

				}
				break;

			case '>=':

				switch (operator2) {
					case '<':
						result = propValue >= value1 && propValue < value2;
						break;
					case '<=':
						result = propValue >= value1 && propValue <= value2;
						break;

				}
				break;

			case '<':

				switch (operator2) {
					case '>':
						result = propValue < value1 || propValue > value2;
						break;
					case '>=':
						result = propValue < value1 || propValue >= value2;
						break;

				}
				break;

			case '<=':

				switch (operator2) {
					case '>':
						result = propValue <= value1 || propValue > value2;
						break;
					case '>=':
						result = propValue <= value1 || propValue >= value2;
						break;

				}
				break;
		}

		return result;
	};


	getEvents = function (obj) {
		var i, numTracks, tracks, events = [];

		if (typeString(obj) === 'array') {
			events = obj;
		} else if (obj.className === undefined) {
			console.warn(obj);
		} else if (obj.className === 'Track' || obj.className === 'Part') {
			events = obj.events;

		} else if (obj.className === 'Song') {
			/*
						tracks = obj.tracks;
						numTracks = obj.numTracks;
						for(i = 0; i < numTracks; i++){
							events = events.concat(tracks[i].events);
						}
						events = events.concat(obj.timeEvents);
			*/
			events = obj.eventsMidiTime;
		}
		//console.log(obj.className,events.length);
		return events;
	};


	createPattern = function (args) {
		var pattern = {
			property: args[0],
			operator1: args[1],
			value1: args[2],
			operator2: args[3],
			value2: args[4]
		},
			property = args[0],
			operator1 = args[1],
			value1 = args[2],
			operator2 = args[3],
			value2 = args[4],
			i;

		if (supportedProperties[property] !== 1) {
			console.error(property, 'is not a supported property');
			return false;
		}


		pattern = checkOperators(pattern);


		if (property === 'barsbeats' || property === 'time') {
			value1 = checkValue(value1, property);
			//console.log(value1);
			for (i = 0; i < 4; i++) {
				pattern = {};
				pattern.property = properties[property][i];
				pattern.operator1 = operator1;
				pattern.value1 = value1[i];
				patterns.push(pattern);
				operators.push('AND');
			}
			operators.pop();

			if (value2) {
				value2 = checkValue(value2, property);
				for (i = 0; i < 4; i++) {
					pattern = {};
					pattern.property = properties[property][i];
					pattern.operator2 = operator2;
					pattern.value2 = value2[i];
					patterns.push(pattern);
					operators.push('AND');
				}
				operators.pop();
			}
		} else {
			patterns.push(pattern);
		}
	};


	checkValue = function (value, type) {
		//if the value is provided in array notation strip the brackets
		value = value.replace(/(\[|\])/g, '');

		if (typeString(value) !== 'array') {
			if (type === 'barsbeats') {
				if (value.indexOf(',') === -1) {
					value = [value, 1, 1, 0];
				} else {
					value = value.split(',');
				}
			} else if (type === 'time') {
				if (value.indexOf(',') === -1) {
					value = [0, value, 0, 0];
				} else {
					value = value.split(',');
				}
			}
		}

		switch (value.length) {
			case 1:
				if (type === 'barsbeats') {
					value.push(1, 1, 0);
				} else if (type === 'time') {
					value.push(0, 0, 0);
				}
				break;

			case 2:
				if (type === 'barsbeats') {
					value.push(1, 0);
				} else if (type === 'time') {
					value.push(0, 0);
				}
				break;

			case 3:
				value.push(0);
				break;
		}

		return value;
	};


	checkOperators = function (pattern) {

		var operator1 = pattern.operator1,
			operator2 = pattern.operator2,
			check = function (operator) {
				if (operator === '<' || operator === '>' || operator === '<=' || operator === '>=') {
					return true;
				}
				return false;
			},
			check2 = function (operator) {
				if (operator === '=' || operator === '==' || operator === '===') {
					return true;
				}
				return false;
			};


		if (pattern.property === 'noteName' && (check(operator1) || check2(operator1))) {
			pattern.property = 'noteNumber';
			pattern.value1 = createNote(pattern.value1).number;
		}

		if (pattern.property === 'noteName' && (check(operator2) || check2(operator2))) {
			pattern.property = 'noteNumber';
			pattern.value2 = createNote(pattern.value2).number;
		}

		// second operator is wrong, remove it
		if (check(operator1) && !check(operator2)) {
			delete pattern.operator2;
			delete pattern.value2;
		}

		return pattern;
	};


	inverseOperator = function (operator) {
		var inversedOperator;

		switch (operator) {
			case '=':
			case '==':
			case '===':
				inversedOperator = '!==';
				break;

			case '!=':
			case '!==':
				inversedOperator = '===';
				break;

			case '<':
				inversedOperator = '>=';
				break;

			case '>':
				inversedOperator = '<=';
				break;

			case '<=':
				inversedOperator = '>';
				break;

			case '>=':
				inversedOperator = '<';
				break;

			case '*=':
			case '^=':
			case '&=':
			case '%=':
				inversedOperator = '!' + operator;
				break;

			default:
				inversedOperator = operator;

		}

		return inversedOperator;
	};


	findNote = function () {
		var results = findEvent.apply(this, arguments),
			numEvents = results.length,
			i, event,
			noteOnEvent, noteOnEvents = {},
			tmp, resultsFiltered = [];

		// loop over all events and filter the note on events that have a matching note off event
		for (i = 0; i < numEvents; i++) {
			event = results[i];

			if (event.type === sequencer.NOTE_ON) {

				if (noteOnEvents[event.noteNumber] === undefined) {
					noteOnEvents[event.noteNumber] = [];
				}
				noteOnEvents[event.noteNumber].push(event);

			} else if (event.type === sequencer.NOTE_OFF) {

				tmp = noteOnEvents[event.noteNumber];
				if (tmp) {
					noteOnEvent = tmp.shift();
					resultsFiltered.push(createMidiNote(noteOnEvent, event));
					//resultsFiltered.push(noteOnEvent);
					//resultsFiltered.push(event);
				}
				if (tmp.length === 0) {
					delete noteOnEvents[event.noteNumber];
				}
			}
		}

		// put the events back into the right order
		resultsFiltered.sort(function (a, b) {
			return a.sortIndex - b.sortIndex;
		});

		return resultsFiltered;
	};

	sequencer.findEvent = findEvent;
	sequencer.findNote = findNote;
	//sequencer.removeMutualEvents = removeMutualEvents;
	sequencer.protectedScope.getEvents = getEvents;

	sequencer.protectedScope.addInitMethod(function () {
		createNote = sequencer.createNote;
		typeString = sequencer.protectedScope.typeString;
		createMidiNote = sequencer.createMidiNote;
		midiEventNumberByName = sequencer.midiEventNumberByName;
	});

}