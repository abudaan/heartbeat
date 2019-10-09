function songGrid() {

	/*

	[[ gridPositionFromSong(seqPosition,width,height) ]]
	
	gridCoordinateFromPosition(position,width,height)

	[[ gridPositionFromNote(notePitch,width,height) ]]

	gridCoordinateFromNote(note,width,height)
	gridCoordinateFromNote(pitch,width,height) -> basically a y-position
	gridCoordinateFromNote(event,width,height) -> specific event
	

	[[ songPositionFromGrid(x,y,width,height) ]]

	positionFromGridCoordinate(x,y,width,height)

	noteFromGridCoordinate(x,y,width,height) -> returns same as positionFromGridCoordinate

	setSequenceLength(totalBars)
	
	song.setGrid(height, width, pitchMin, pitchMax)


	implemented:

	setGridPitchRange(min,max)

	gridToSong([song],x,y,width,height)

	songToGrid(event) -> x and y
	songToGrid(position,note) -> x and y
	
	songToGrid(position,width,height) -> x, y = 0
	
	songToGrid(note,width,height) -> y, x = 0
	songToGrid(pitch)

	songToGrid(event,width,height)
	songToGrid('x',position,width,height)
	songToGrid('y',note,width,height)
	songToGrid('x','y',position,note,width,height)


	*/

	'use strict';

	var
		//import
		getPosition, // → defined in get_position.js
		floor, // → defined in util.js
		round, // → defined in util.js
		typeString, // → defined in util.js

		//public
		songToGrid, // catch all -> may be remove this
		positionToGrid,
		eventToGrid,
		noteToGrid,

		gridToSong, // catch all -> may be remove this
		positionToSong;


	positionToSong = function (song, x, y, width, height) {
		var ticks, note, position, coordinate;
		//console.log(song.millis,x,y,width,height);

		if (song === undefined) {
			console.error('please provide a song');
			return;
		}

		if (x === undefined || y === undefined) {
			console.error('please provide a coordinate');
			return;
		}

		if (width === undefined || height === undefined) {
			console.error('please provide width and height');
			return;
		}

		ticks = floor((x / width) * song.ticks);
		//note = 127 - floor((y/height) * 128);
		note = song.highestNote - floor((y / height) * song.pitchRange);
		//note = song.highestNote - round((y/height) * song.numNotes);

		position = getPosition(song, ['ticks', ticks]);
		note = sequencer.createNote(note);

		//console.log(position,note);

		return {
			position: position,
			note: note
		};
	};

	//[song],x,y,width,height
	sequencer.positionToSong = sequencer.coordinatesToPosition = sequencer.gridToSong = function () {
		var args = Array.prototype.slice.call(arguments),
			numArgs = args.length,
			arg0 = args[0];

		//todo: add error messages here
		if (numArgs === 4 && arg0.className !== 'Song') {
			return positionToSong(sequencer.getSong(), arg0, args[1], args[2], args[3]);
		}
		return positionToSong(arg0, args[1], args[2], args[3], args[4]);
	};


	sequencer.songToGrid = function () {
		var args = Array.prototype.slice.call(arguments),
			numArgs = args.length,
			arg0 = args[0],
			arg1 = args[1];

		switch (numArgs) {
			case 3:
				eventToGrid(arg0, arg1, args[2]);//event,width,height
				break;
			case 4:
				if (arg0 === 'x') {
					positionToGrid(arg1, args[2], args[3]);//[position], width, height
				} else if (arg0 === 'y') {
					noteToGrid(arg1, args[2], args[3]);//note, width, height
				}
				break;
			case 6:
				break;
			default:
				console.error('wrong number of arguments');

		}

	};


	eventToGrid = function (event, width, height, song) {
		if (song === undefined) {
			song = sequencer.getSong();
		}

		if (event.type !== sequencer.NOTE_ON && event.type !== sequencer.NOTE_OFF) {
			console.error('please provide a NOTE_ON or a NOTE_OFF event');
			return null;
		}

		var x = (event.millis / song.durationMillis) * width,
			y,
			note = sequencer.createNote(event.noteNumber);
		//position = sequencer.createPosition('ticks', event.ticks);

		return {
			x: positionToGrid(['ticks', event.ticks], width, song),
			y: noteToGrid(note, height, song)
		};
	};


	positionToGrid = function (position, width, song) {
		if (song === undefined) {
			song = sequencer.getSong();
		}

		if (typeString(position) === 'array' || position.type !== 'ticks') {
			position = getPosition(song, position);
		}
		//console.log(position)
		var x = floor(position.ticks / song.quantizeTicks) * song.quantizeTicks;
		//console.log(x, song.ticks, position.data, song.quantizeTicks);
		x = x / song.ticks;
		x = x * width;

		//return round(x);
		return x;
	};


	noteToGrid = function (note, height, song) {
		if (song === undefined) {
			song = sequencer.getSong();
		}

		var noteNumber = note.number,
			y;

		if (noteNumber < song.lowestNote || noteNumber > song.highestNote) {
			console.error('note is out of range of the pitch range of this song');
			return null;
		}

		y = (noteNumber - song.highestNote) / song.pitchRange;
		y = y < 0 ? -y : y;
		y = y * height;
		//return round(y);
		return y;
	};

	// should this be added to sequencer publically? -> no, add to song
	/*
		sequencer.positionToGrid = positionToGrid;
		sequencer.eventToGrid = eventToGrid;
		sequencer.noteToGrid = noteToGrid;
	*/
	sequencer.protectedScope.addInitMethod(function () {
		getPosition = sequencer.protectedScope.getPosition;
		floor = sequencer.protectedScope.floor;
		round = sequencer.protectedScope.round;
		typeString = sequencer.protectedScope.typeString;
	});
}
