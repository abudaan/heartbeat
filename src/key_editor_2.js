
// not in use!

(function(){

    'use strict';

    var

        //import
        typeString; // defined in util.js

    /*
        config:
            - song

    */
    function createKeyEditor2(config){


    }

    sequencer.createKeyEditor2 = createKeyEditor2;

    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
    });

}());