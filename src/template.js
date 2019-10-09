(function(){

    'use strict';

    var
        //import
        typeString, // → defined in util.js

    function something(){

    }

    sequencer.something = something;

    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
    });

}());