'use strict';

var
    fs = require('fs'),

    tags = [
        '<global>',
        '<control>',
        '<effect>',
        '<group>',
        '<region>'
    ],
    numTags = tags.length;


function parse(lines){
    var line, i,
        numLines = lines.length,
        json = {
            global: {},
            elements: []
        },
        elements = [],
        global = {},
        effect,
        control,
        group,
        region;

    for(i = 0; i < numLines; i++) {
        line = lines[i];
        //console.log('line', line);
        if(line.indexOf('looped') !== -1){ // not part of the official SFZ specification!
            global.sustain = true;
            break;
        }
    }

    for(i = 0; i < numLines; i++) {
        line = lines[i];
        //console.log(line);

        if(line.indexOf('//') === 0){
            continue;
        }


        if(line.indexOf('<global>') !== -1){
            // read all global parameters
            while(i < numLines){
                getParams(line, global);
                line = lines[++i];
                if(hasTag(line) === true){
                    i--;
                    break;
                }
            }
        }


        else if(line.indexOf('<control>') !== -1){
            control = {type: 'control'};
            elements.push(control);

            // read all parameters of this control
            while(i < numLines){
                getParams(line, control);
                line = lines[++i];
                if(hasTag(line) === true){
                    i--;
                    break;
                }
            }
        }


        else if(line.indexOf('<effect>') !== -1){
            effect = {type: 'effect'};
            elements.push(effect);

            // read all parameters of this effect
            while(i < numLines){
                getParams(line, effect);
                line = lines[++i];
                if(hasTag(line) === true){
                    i--;
                    break;
                }
            }
        }


        else if(line.indexOf('<group>') !== -1){
            //console.log(line);
            group = {type: 'group'};
            elements.push(group);

            // read all parameters of this group
            while(i < numLines){
                getParams(line, group);
                line = lines[++i];
                if(hasTag(line) === true){
                    break;
                }
            }

            group.regions = [];

            // read all regions of this group (read until the next tag appears)
            while(i < numLines){
                if(hasOtherTag(line, '<region>')){
                    // we break out of the if('<group>'') statement so deduct 1 from i because the main for loop increments i already
                    i--;
                    break;
                }
                if(line.indexOf('<region>') !== -1){
                    region = {type: 'region'};
                    group.regions.push(region);
                }
                getParams(line, region);
                line = lines[++i];
            }
        }


        // capture regions that do not belong to a group
        else if(line.indexOf('<region>') !== -1){
            while(i < numLines){
                if(line.indexOf('<region>') !== -1){
                    region = {type: 'region'};
                    elements.push(region);
                }
                getParams(line, region);
                line = lines[++i];
                if(line === undefined){
                    //console.log(i, numLines);
                    break;
                }
                if(hasOtherTag(line, '<region>')){
                    i--;
                    break;
                }
            }
        }
    }

    json.global = global;
    json.elements = elements;

    //console.log(json.elements);

    fs.writeFileSync('testoop.json', JSON.stringify(json));

    return json;
}


function hasTag(line){
    var i, tag;
    for(i = 0; i < numTags; i++){
        tag = tags[i];
        if(line.indexOf(tag) !== -1){
            return true;
        }
    }
}


function hasOtherTag(line, excludeTag){
    var i, tag;
    for(i = 0; i < numTags; i++){
        tag = tags[i];
        if(tag === excludeTag){
            continue;
        }
        if(line.indexOf(tag) !== -1){
            return true;
        }
    }
}


function getParams(line, obj){
    var numChars,
        c, char,
        param = '',
        value = '',
        readParam = true,
        readValue = false,
        debug = false,
        lastSpace;

    line = line.replace(/<global>[\s]+/, '');
    line = line.replace(/<control>[\s]+/, '');
    line = line.replace(/<effect>[\s]+/, '');
    line = line.replace(/<group>[\s]+/, '');
    line = line.replace(/<region>[\s]+/, '');
    line = line.replace(/[\s]{2,}/, ' ');
    //line = line.replace(os.EOL, '');
    line = line.replace(/\r/g, '');
    line = line.replace(/\n/g, '');
    numChars = line.length;

    if(numChars === 0){
        return;
    }

    if(debug === true) console.log(line);

    for(c = 0; c < numChars; c++){
        char = line[c];
        //console.log(char);
        if(char === '='){
            if(readParam === true){
                readValue = true;
                readParam = false;
                // skip the =  character
                char = line[++c];

            }else if(readValue === true){
                lastSpace = value.lastIndexOf(' ');
                obj[param] = value.substring(0, lastSpace);
                if(debug === true) console.log(1, param, ':', obj[param]);

                // next param
                param = value.substring(lastSpace + 1);
                // skip the = character
                char = line[++c];
                value = '';
                readValue = true;
                readParam = false;
            }
        }

        if(readParam){
            param += char;
        }
        if(readValue){
            value += char;
        }
    }

    if(param !== ''){
        obj[param] = value;
        if(debug === true) console.log(2, param, ':', value);
    }

    if(debug === true) console.log('---');
}


module.exports = {
    parse: function(file){
        var data = fs.readFileSync(file);
        data = data.toString().split('\n');
        return parse(data);
    }
};

