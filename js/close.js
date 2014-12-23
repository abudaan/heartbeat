(function(global){
	
	'use strict';

	scope.protectedScope.callInitMethods(); // → defined in open.js
	
	delete scope.protectedScope; //seal

}(this));