
// WORK IN PROGRESS


(function(){

	'use strict';

	var 
		//import
		typeString, // → defined in utils.js
		copyName, // → defined in util.js

		AudioEvent,
		audioEventId = 0;

	/*
		arguments:

		ticks, sample, duration
	*/

	AudioEvent = function(args){
		
		if(!args){
			// bypass for cloning
			return;
		}
		//console.log(args);

		if(args.length === 3 && typeString(args[0]) === 'number' && typeString(args[1]) === 'string' && typeString(args[3]) === 'number'){
			this.ticks = args[0];
			this.sample = args[1];
			this.duration = args[2];
		}else{
			console.log('wrong number of arguments, please consult documentation');
			return;
		}

		this.className =  'AudioEvent';
		this.id = 'event_' + audioEventId++;
	};

	
	AudioEvent.prototype = {
		clone: function(){
			var event = new AudioEvent(),
				property;
			for(property in this){
				if(this.hasOwnProperty(property)){
					if(property === 'id'){
						event.id = copyName(this.id);
					}else if(property !== 'clone'){
						event[property] = this[property];
					}
				}
			}
			return event;
		}	
	};


	sequencer.createAudioEvent = function(){
		var args = Array.prototype.slice.call(arguments),
			className = args[0].className; 
		
		if(className === 'AudioEvent'){
			//return args;
			return args[0].clone();
		}
		return new AudioEvent(args);
	};


	sequencer.protectedScope.addInitMethod(function(){
		typeString = sequencer.protectedScope.typeString;
		copyName = sequencer.protectedScope.copyName;
	});

}());