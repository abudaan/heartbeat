window.onload = function() {

	'use strict';

	var prettify = document.createElement('script');
	prettify.src = '../js/prettify.js';
	prettify.onload = function() {

		var elements = document.querySelectorAll('pre, code');
		for(var i = 0; i < elements.length; i ++) {
			var e = elements[ i ];
			e.className = 'prettyprint';
		}
		prettyPrint();
	}
	document.head.appendChild(prettify);
};
