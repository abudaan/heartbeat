/*

heartbeat
(c) 2013 - 2015 abudaan
https://github.com/abudaan/heartbeat/wiki/license


In util.js the method base64ToBinary() is based on Daniel Guerrero's code:

https://github.com/danguer/blog-examples/blob/master/js/base64-binary.js
https://github.com/danguer/blog-examples/blob/master/LICENSE


In util.js the method toBinaryString(), midi_parse.js and midi_stream.js are based on Matt Westcott & Ben Fishman's code:

https://github.com/gasman/jasmid
https://github.com/gasman/jasmid/blob/master/LICENSE


In util.js Mozilla's atob and btoa alternatives are included:
https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_.232_.E2.80.93_rewriting_atob()_and_btoa()_using_TypedArrays_and_UTF-8


The code in midi_write.js is based on Sergi Mansilla's code:

https://github.com/sergi/jsmidi
https://github.com/sergi/jsmidi/blob/master/README.md


Audio recording:
https://github.com/akrennmair/libmp3lame-js
https://github.com/kobigurk/libmp3lame-js
https://github.com/nusofthq/Recordmp3js


If a browser doesn't support WebMIDI, heartbeat will try to fallback to Sema's Jazz plugin:

http://jazz-soft.net/

For this fallback, a slightly adapted version of Chris Wilson's WebMIDIAPIShim is used:

https://github.com/cwilso/WebMIDIAPIShim


*/

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.map');
module.exports = require('../modules/$').core.Map;
},{"../modules/$":17,"../modules/es6.map":25,"../modules/es6.object.to-string":26,"../modules/es6.string.iterator":28,"../modules/web.dom.iterable":30}],2:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.set');
module.exports = require('../modules/$').core.Set;
},{"../modules/$":17,"../modules/es6.object.to-string":26,"../modules/es6.set":27,"../modules/es6.string.iterator":28,"../modules/web.dom.iterable":30}],3:[function(require,module,exports){
require('../modules/es6.symbol');
module.exports = require('../modules/$').core.Symbol;
},{"../modules/$":17,"../modules/es6.symbol":29}],4:[function(require,module,exports){
var $ = require('./$');
function assert(condition, msg1, msg2){
  if(!condition)throw TypeError(msg2 ? msg1 + msg2 : msg1);
}
assert.def = $.assertDefined;
assert.fn = function(it){
  if(!$.isFunction(it))throw TypeError(it + ' is not a function!');
  return it;
};
assert.obj = function(it){
  if(!$.isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
assert.inst = function(it, Constructor, name){
  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
  return it;
};
module.exports = assert;
},{"./$":17}],5:[function(require,module,exports){
var $        = require('./$')
  , TAG      = require('./$.wks')('toStringTag')
  , toString = {}.toString;
function cof(it){
  return toString.call(it).slice(8, -1);
}
cof.classof = function(it){
  var O, T;
  return it == undefined ? it === undefined ? 'Undefined' : 'Null'
    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T : cof(O);
};
cof.set = function(it, tag, stat){
  if(it && !$.has(it = stat ? it : it.prototype, TAG))$.hide(it, TAG, tag);
};
module.exports = cof;
},{"./$":17,"./$.wks":23}],6:[function(require,module,exports){
'use strict';
var $        = require('./$')
  , ctx      = require('./$.ctx')
  , safe     = require('./$.uid').safe
  , assert   = require('./$.assert')
  , forOf    = require('./$.for-of')
  , step     = require('./$.iter').step
  , has      = $.has
  , set      = $.set
  , isObject = $.isObject
  , hide     = $.hide
  , isFrozen = Object.isFrozen || $.core.Object.isFrozen
  , ID       = safe('id')
  , O1       = safe('O1')
  , LAST     = safe('last')
  , FIRST    = safe('first')
  , ITER     = safe('iter')
  , SIZE     = $.DESC ? safe('size') : 'size'
  , id       = 0;

function fastKey(it, create){
  // return primitive with prefix
  if(!isObject(it))return (typeof it == 'string' ? 'S' : 'P') + it;
  // can't set id to frozen object
  if(isFrozen(it))return 'F';
  if(!has(it, ID)){
    // not necessary to add id
    if(!create)return 'E';
    // add missing object id
    hide(it, ID, ++id);
  // return object id with prefix
  } return 'O' + it[ID];
}

function getEntry(that, key){
  // fast case
  var index = fastKey(key), entry;
  if(index != 'F')return that[O1][index];
  // frozen object case
  for(entry = that[FIRST]; entry; entry = entry.n){
    if(entry.k == key)return entry;
  }
}

module.exports = {
  getConstructor: function(NAME, IS_MAP, ADDER){
    function C(){
      var that     = assert.inst(this, C, NAME)
        , iterable = arguments[0];
      set(that, O1, $.create(null));
      set(that, SIZE, 0);
      set(that, LAST, undefined);
      set(that, FIRST, undefined);
      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
    }
    $.mix(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear(){
        for(var that = this, data = that[O1], entry = that[FIRST]; entry; entry = entry.n){
          entry.r = true;
          if(entry.p)entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that[FIRST] = that[LAST] = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function(key){
        var that  = this
          , entry = getEntry(that, key);
        if(entry){
          var next = entry.n
            , prev = entry.p;
          delete that[O1][entry.i];
          entry.r = true;
          if(prev)prev.n = next;
          if(next)next.p = prev;
          if(that[FIRST] == entry)that[FIRST] = next;
          if(that[LAST] == entry)that[LAST] = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /*, that = undefined */){
        var f = ctx(callbackfn, arguments[1], 3)
          , entry;
        while(entry = entry ? entry.n : this[FIRST]){
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while(entry && entry.r)entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key){
        return !!getEntry(this, key);
      }
    });
    if($.DESC)$.setDesc(C.prototype, 'size', {
      get: function(){
        return assert.def(this[SIZE]);
      }
    });
    return C;
  },
  def: function(that, key, value){
    var entry = getEntry(that, key)
      , prev, index;
    // change existing entry
    if(entry){
      entry.v = value;
    // create new entry
    } else {
      that[LAST] = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that[LAST],          // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if(!that[FIRST])that[FIRST] = entry;
      if(prev)prev.n = entry;
      that[SIZE]++;
      // add to index
      if(index != 'F')that[O1][index] = entry;
    } return that;
  },
  getEntry: getEntry,
  // add .keys, .values, .entries, [@@iterator]
  // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
  setIter: function(C, NAME, IS_MAP){
    require('./$.iter-define')(C, NAME, function(iterated, kind){
      set(this, ITER, {o: iterated, k: kind});
    }, function(){
      var iter  = this[ITER]
        , kind  = iter.k
        , entry = iter.l;
      // revert to the last existing entry
      while(entry && entry.r)entry = entry.p;
      // get next entry
      if(!iter.o || !(iter.l = entry = entry ? entry.n : iter.o[FIRST])){
        // or finish the iteration
        iter.o = undefined;
        return step(1);
      }
      // return step by kind
      if(kind == 'keys'  )return step(0, entry.k);
      if(kind == 'values')return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);
  }
};
},{"./$":17,"./$.assert":4,"./$.ctx":8,"./$.for-of":11,"./$.iter":16,"./$.iter-define":14,"./$.uid":21}],7:[function(require,module,exports){
'use strict';
var $     = require('./$')
  , $def  = require('./$.def')
  , BUGGY = require('./$.iter').BUGGY
  , forOf = require('./$.for-of')
  , species = require('./$.species')
  , assertInstance = require('./$.assert').inst;

module.exports = function(NAME, methods, common, IS_MAP, IS_WEAK){
  var Base  = $.g[NAME]
    , C     = Base
    , ADDER = IS_MAP ? 'set' : 'add'
    , proto = C && C.prototype
    , O     = {};
  function fixMethod(KEY, CHAIN){
    var method = proto[KEY];
    if($.FW)proto[KEY] = function(a, b){
      var result = method.call(this, a === 0 ? 0 : a, b);
      return CHAIN ? this : result;
    };
  }
  if(!$.isFunction(C) || !(IS_WEAK || !BUGGY && proto.forEach && proto.entries)){
    // create collection constructor
    C = common.getConstructor(NAME, IS_MAP, ADDER);
    $.mix(C.prototype, methods);
  } else {
    var inst  = new C
      , chain = inst[ADDER](IS_WEAK ? {} : -0, 1)
      , buggyZero;
    // wrap for init collections from iterable
    if(!require('./$.iter-detect')(function(iter){ new C(iter); })){ // eslint-disable-line no-new
      C = function(){
        assertInstance(this, C, NAME);
        var that     = new Base
          , iterable = arguments[0];
        if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      };
      C.prototype = proto;
      if($.FW)proto.constructor = C;
    }
    IS_WEAK || inst.forEach(function(val, key){
      buggyZero = 1 / key === -Infinity;
    });
    // fix converting -0 key to +0
    if(buggyZero){
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    // + fix .add & .set for chaining
    if(buggyZero || chain !== inst)fixMethod(ADDER, true);
  }

  require('./$.cof').set(C, NAME);

  O[NAME] = C;
  $def($def.G + $def.W + $def.F * (C != Base), O);
  species(C);
  species($.core[NAME]); // for wrapper

  if(!IS_WEAK)common.setIter(C, NAME, IS_MAP);

  return C;
};
},{"./$":17,"./$.assert":4,"./$.cof":5,"./$.def":9,"./$.for-of":11,"./$.iter":16,"./$.iter-detect":15,"./$.species":19}],8:[function(require,module,exports){
// Optional / simple context binding
var assertFunction = require('./$.assert').fn;
module.exports = function(fn, that, length){
  assertFunction(fn);
  if(~length && that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  } return function(/* ...args */){
      return fn.apply(that, arguments);
    };
};
},{"./$.assert":4}],9:[function(require,module,exports){
var $          = require('./$')
  , global     = $.g
  , core       = $.core
  , isFunction = $.isFunction;
function ctx(fn, that){
  return function(){
    return fn.apply(that, arguments);
  };
}
global.core = core;
// type bitmap
$def.F = 1;  // forced
$def.G = 2;  // global
$def.S = 4;  // static
$def.P = 8;  // proto
$def.B = 16; // bind
$def.W = 32; // wrap
function $def(type, name, source){
  var key, own, out, exp
    , isGlobal = type & $def.G
    , target   = isGlobal ? global : type & $def.S
        ? global[name] : (global[name] || {}).prototype
    , exports  = isGlobal ? core : core[name] || (core[name] = {});
  if(isGlobal)source = name;
  for(key in source){
    // contains in native
    own = !(type & $def.F) && target && key in target;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    if(type & $def.B && own)exp = ctx(out, global);
    else exp = type & $def.P && isFunction(out) ? ctx(Function.call, out) : out;
    // extend global
    if(target && !own){
      if(isGlobal)target[key] = out;
      else delete target[key] && $.hide(target, key, out);
    }
    // export
    if(exports[key] != out)$.hide(exports, key, exp);
  }
}
module.exports = $def;
},{"./$":17}],10:[function(require,module,exports){
var $ = require('./$');
module.exports = function(it){
  var keys       = $.getKeys(it)
    , getDesc    = $.getDesc
    , getSymbols = $.getSymbols;
  if(getSymbols)$.each.call(getSymbols(it), function(key){
    if(getDesc(it, key).enumerable)keys.push(key);
  });
  return keys;
};
},{"./$":17}],11:[function(require,module,exports){
var ctx  = require('./$.ctx')
  , get  = require('./$.iter').get
  , call = require('./$.iter-call');
module.exports = function(iterable, entries, fn, that){
  var iterator = get(iterable)
    , f        = ctx(fn, that, entries ? 2 : 1)
    , step;
  while(!(step = iterator.next()).done){
    if(call(iterator, f, step.value, entries) === false){
      return call.close(iterator);
    }
  }
};
},{"./$.ctx":8,"./$.iter":16,"./$.iter-call":13}],12:[function(require,module,exports){
module.exports = function($){
  $.FW   = true;
  $.path = $.g;
  return $;
};
},{}],13:[function(require,module,exports){
var assertObject = require('./$.assert').obj;
function close(iterator){
  var ret = iterator['return'];
  if(ret !== undefined)assertObject(ret.call(iterator));
}
function call(iterator, fn, value, entries){
  try {
    return entries ? fn(assertObject(value)[0], value[1]) : fn(value);
  } catch(e){
    close(iterator);
    throw e;
  }
}
call.close = close;
module.exports = call;
},{"./$.assert":4}],14:[function(require,module,exports){
var $def            = require('./$.def')
  , $               = require('./$')
  , cof             = require('./$.cof')
  , $iter           = require('./$.iter')
  , SYMBOL_ITERATOR = require('./$.wks')('iterator')
  , FF_ITERATOR     = '@@iterator'
  , KEYS            = 'keys'
  , VALUES          = 'values'
  , Iterators       = $iter.Iterators;
module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE){
  $iter.create(Constructor, NAME, next);
  function createMethod(kind){
    function $$(that){
      return new Constructor(that, kind);
    }
    switch(kind){
      case KEYS: return function keys(){ return $$(this); };
      case VALUES: return function values(){ return $$(this); };
    } return function entries(){ return $$(this); };
  }
  var TAG      = NAME + ' Iterator'
    , proto    = Base.prototype
    , _native  = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , _default = _native || createMethod(DEFAULT)
    , methods, key;
  // Fix native
  if(_native){
    var IteratorPrototype = $.getProto(_default.call(new Base));
    // Set @@toStringTag to native iterators
    cof.set(IteratorPrototype, TAG, true);
    // FF fix
    if($.FW && $.has(proto, FF_ITERATOR))$iter.set(IteratorPrototype, $.that);
  }
  // Define iterator
  if($.FW)$iter.set(proto, _default);
  // Plug for library
  Iterators[NAME] = _default;
  Iterators[TAG]  = $.that;
  if(DEFAULT){
    methods = {
      keys:    IS_SET            ? _default : createMethod(KEYS),
      values:  DEFAULT == VALUES ? _default : createMethod(VALUES),
      entries: DEFAULT != VALUES ? _default : createMethod('entries')
    };
    if(FORCE)for(key in methods){
      if(!(key in proto))$.hide(proto, key, methods[key]);
    } else $def($def.P + $def.F * $iter.BUGGY, NAME, methods);
  }
};
},{"./$":17,"./$.cof":5,"./$.def":9,"./$.iter":16,"./$.wks":23}],15:[function(require,module,exports){
var SYMBOL_ITERATOR = require('./$.wks')('iterator')
  , SAFE_CLOSING    = false;
try {
  var riter = [7][SYMBOL_ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }
module.exports = function(exec){
  if(!SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[SYMBOL_ITERATOR]();
    iter.next = function(){ safe = true; };
    arr[SYMBOL_ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
},{"./$.wks":23}],16:[function(require,module,exports){
'use strict';
var $                 = require('./$')
  , cof               = require('./$.cof')
  , assertObject      = require('./$.assert').obj
  , SYMBOL_ITERATOR   = require('./$.wks')('iterator')
  , FF_ITERATOR       = '@@iterator'
  , Iterators         = {}
  , IteratorPrototype = {};
// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
setIterator(IteratorPrototype, $.that);
function setIterator(O, value){
  $.hide(O, SYMBOL_ITERATOR, value);
  // Add iterator for FF iterator protocol
  if(FF_ITERATOR in [])$.hide(O, FF_ITERATOR, value);
}

module.exports = {
  // Safari has buggy iterators w/o `next`
  BUGGY: 'keys' in [] && !('next' in [].keys()),
  Iterators: Iterators,
  step: function(done, value){
    return {value: value, done: !!done};
  },
  is: function(it){
    var O      = Object(it)
      , Symbol = $.g.Symbol
      , SYM    = Symbol && Symbol.iterator || FF_ITERATOR;
    return SYM in O || SYMBOL_ITERATOR in O || $.has(Iterators, cof.classof(O));
  },
  get: function(it){
    var Symbol  = $.g.Symbol
      , ext     = it[Symbol && Symbol.iterator || FF_ITERATOR]
      , getIter = ext || it[SYMBOL_ITERATOR] || Iterators[cof.classof(it)];
    return assertObject(getIter.call(it));
  },
  set: setIterator,
  create: function(Constructor, NAME, next, proto){
    Constructor.prototype = $.create(proto || IteratorPrototype, {next: $.desc(1, next)});
    cof.set(Constructor, NAME + ' Iterator');
  }
};
},{"./$":17,"./$.assert":4,"./$.cof":5,"./$.wks":23}],17:[function(require,module,exports){
'use strict';
var global = typeof self != 'undefined' ? self : Function('return this')()
  , core   = {}
  , defineProperty = Object.defineProperty
  , hasOwnProperty = {}.hasOwnProperty
  , ceil  = Math.ceil
  , floor = Math.floor
  , max   = Math.max
  , min   = Math.min;
// The engine works fine with descriptors? Thank's IE8 for his funny defineProperty.
var DESC = !!function(){
  try {
    return defineProperty({}, 'a', {get: function(){ return 2; }}).a == 2;
  } catch(e){ /* empty */ }
}();
var hide = createDefiner(1);
// 7.1.4 ToInteger
function toInteger(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
}
function desc(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
}
function simpleSet(object, key, value){
  object[key] = value;
  return object;
}
function createDefiner(bitmap){
  return DESC ? function(object, key, value){
    return $.setDesc(object, key, desc(bitmap, value));
  } : simpleSet;
}

function isObject(it){
  return it !== null && (typeof it == 'object' || typeof it == 'function');
}
function isFunction(it){
  return typeof it == 'function';
}
function assertDefined(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
}

var $ = module.exports = require('./$.fw')({
  g: global,
  core: core,
  html: global.document && document.documentElement,
  // http://jsperf.com/core-js-isobject
  isObject:   isObject,
  isFunction: isFunction,
  it: function(it){
    return it;
  },
  that: function(){
    return this;
  },
  // 7.1.4 ToInteger
  toInteger: toInteger,
  // 7.1.15 ToLength
  toLength: function(it){
    return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
  },
  toIndex: function(index, length){
    index = toInteger(index);
    return index < 0 ? max(index + length, 0) : min(index, length);
  },
  has: function(it, key){
    return hasOwnProperty.call(it, key);
  },
  create:     Object.create,
  getProto:   Object.getPrototypeOf,
  DESC:       DESC,
  desc:       desc,
  getDesc:    Object.getOwnPropertyDescriptor,
  setDesc:    defineProperty,
  setDescs:   Object.defineProperties,
  getKeys:    Object.keys,
  getNames:   Object.getOwnPropertyNames,
  getSymbols: Object.getOwnPropertySymbols,
  assertDefined: assertDefined,
  // Dummy, fix for not array-like ES3 string in es5 module
  ES5Object: Object,
  toObject: function(it){
    return $.ES5Object(assertDefined(it));
  },
  hide: hide,
  def: createDefiner(0),
  set: global.Symbol ? simpleSet : hide,
  mix: function(target, src){
    for(var key in src)hide(target, key, src[key]);
    return target;
  },
  each: [].forEach
});
/* eslint-disable no-undef */
if(typeof __e != 'undefined')__e = core;
if(typeof __g != 'undefined')__g = global;
},{"./$.fw":12}],18:[function(require,module,exports){
var $ = require('./$');
module.exports = function(object, el){
  var O      = $.toObject(object)
    , keys   = $.getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};
},{"./$":17}],19:[function(require,module,exports){
var $       = require('./$')
  , SPECIES = require('./$.wks')('species');
module.exports = function(C){
  if($.DESC && !(SPECIES in C))$.setDesc(C, SPECIES, {
    configurable: true,
    get: $.that
  });
};
},{"./$":17,"./$.wks":23}],20:[function(require,module,exports){
// true  -> String#at
// false -> String#codePointAt
var $ = require('./$');
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String($.assertDefined(that))
      , i = $.toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l
      || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
        ? TO_STRING ? s.charAt(i) : a
        : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./$":17}],21:[function(require,module,exports){
var sid = 0;
function uid(key){
  return 'Symbol(' + key + ')_' + (++sid + Math.random()).toString(36);
}
uid.safe = require('./$').g.Symbol || uid;
module.exports = uid;
},{"./$":17}],22:[function(require,module,exports){
// 22.1.3.31 Array.prototype[@@unscopables]
var $           = require('./$')
  , UNSCOPABLES = require('./$.wks')('unscopables');
if($.FW && !(UNSCOPABLES in []))$.hide(Array.prototype, UNSCOPABLES, {});
module.exports = function(key){
  if($.FW)[][UNSCOPABLES][key] = true;
};
},{"./$":17,"./$.wks":23}],23:[function(require,module,exports){
var global = require('./$').g
  , store  = {};
module.exports = function(name){
  return store[name] || (store[name] =
    global.Symbol && global.Symbol[name] || require('./$.uid').safe('Symbol.' + name));
};
},{"./$":17,"./$.uid":21}],24:[function(require,module,exports){
var $          = require('./$')
  , setUnscope = require('./$.unscope')
  , ITER       = require('./$.uid').safe('iter')
  , $iter      = require('./$.iter')
  , step       = $iter.step
  , Iterators  = $iter.Iterators;

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
require('./$.iter-define')(Array, 'Array', function(iterated, kind){
  $.set(this, ITER, {o: $.toObject(iterated), i: 0, k: kind});
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var iter  = this[ITER]
    , O     = iter.o
    , kind  = iter.k
    , index = iter.i++;
  if(!O || index >= O.length){
    iter.o = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

setUnscope('keys');
setUnscope('values');
setUnscope('entries');
},{"./$":17,"./$.iter":16,"./$.iter-define":14,"./$.uid":21,"./$.unscope":22}],25:[function(require,module,exports){
'use strict';
var strong = require('./$.collection-strong');

// 23.1 Map Objects
require('./$.collection')('Map', {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key){
    var entry = strong.getEntry(this, key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value){
    return strong.def(this, key === 0 ? 0 : key, value);
  }
}, strong, true);
},{"./$.collection":7,"./$.collection-strong":6}],26:[function(require,module,exports){
'use strict';
// 19.1.3.6 Object.prototype.toString()
var $   = require('./$')
  , cof = require('./$.cof')
  , tmp = {};
tmp[require('./$.wks')('toStringTag')] = 'z';
if($.FW && cof(tmp) != 'z')$.hide(Object.prototype, 'toString', function toString(){
  return '[object ' + cof.classof(this) + ']';
});
},{"./$":17,"./$.cof":5,"./$.wks":23}],27:[function(require,module,exports){
'use strict';
var strong = require('./$.collection-strong');

// 23.2 Set Objects
require('./$.collection')('Set', {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value){
    return strong.def(this, value = value === 0 ? 0 : value, value);
  }
}, strong);
},{"./$.collection":7,"./$.collection-strong":6}],28:[function(require,module,exports){
var set   = require('./$').set
  , $at   = require('./$.string-at')(true)
  , ITER  = require('./$.uid').safe('iter')
  , $iter = require('./$.iter')
  , step  = $iter.step;

// 21.1.3.27 String.prototype[@@iterator]()
require('./$.iter-define')(String, 'String', function(iterated){
  set(this, ITER, {o: String(iterated), i: 0});
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var iter  = this[ITER]
    , O     = iter.o
    , index = iter.i
    , point;
  if(index >= O.length)return step(1);
  point = $at(O, index);
  iter.i += point.length;
  return step(0, point);
});
},{"./$":17,"./$.iter":16,"./$.iter-define":14,"./$.string-at":20,"./$.uid":21}],29:[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var $        = require('./$')
  , setTag   = require('./$.cof').set
  , uid      = require('./$.uid')
  , $def     = require('./$.def')
  , keyOf    = require('./$.keyof')
  , enumKeys = require('./$.enum-keys')
  , assertObject = require('./$.assert').obj
  , has      = $.has
  , $create  = $.create
  , getDesc  = $.getDesc
  , setDesc  = $.setDesc
  , desc     = $.desc
  , getNames = $.getNames
  , toObject = $.toObject
  , $Symbol  = $.g.Symbol
  , setter   = false
  , TAG      = uid('tag')
  , HIDDEN   = uid('hidden')
  , SymbolRegistry = {}
  , AllSymbols = {}
  , useNative = $.isFunction($Symbol);

function wrap(tag){
  var sym = AllSymbols[tag] = $.set($create($Symbol.prototype), TAG, tag);
  $.DESC && setter && setDesc(Object.prototype, tag, {
    configurable: true,
    set: function(value){
      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setDesc(this, tag, desc(1, value));
    }
  });
  return sym;
}

function defineProperty(it, key, D){
  if(D && has(AllSymbols, key)){
    if(!D.enumerable){
      if(!has(it, HIDDEN))setDesc(it, HIDDEN, desc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D.enumerable = false;
    }
  } return setDesc(it, key, D);
}
function defineProperties(it, P){
  assertObject(it);
  var keys = enumKeys(P = toObject(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)defineProperty(it, key = keys[i++], P[key]);
  return it;
}
function create(it, P){
  return P === undefined ? $create(it) : defineProperties($create(it), P);
}
function getOwnPropertyDescriptor(it, key){
  var D = getDesc(it = toObject(it), key);
  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
}
function getOwnPropertyNames(it){
  var names  = getNames(toObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN)result.push(key);
  return result;
}
function getOwnPropertySymbols(it){
  var names  = getNames(toObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
  return result;
}

// 19.4.1.1 Symbol([description])
if(!useNative){
  $Symbol = function Symbol(description){
    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor');
    return wrap(uid(description));
  };
  $.hide($Symbol.prototype, 'toString', function(){
    return this[TAG];
  });

  $.create     = create;
  $.setDesc    = defineProperty;
  $.getDesc    = getOwnPropertyDescriptor;
  $.setDescs   = defineProperties;
  $.getNames   = getOwnPropertyNames;
  $.getSymbols = getOwnPropertySymbols;
}

var symbolStatics = {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    return keyOf(SymbolRegistry, key);
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
};
// 19.4.2.2 Symbol.hasInstance
// 19.4.2.3 Symbol.isConcatSpreadable
// 19.4.2.4 Symbol.iterator
// 19.4.2.6 Symbol.match
// 19.4.2.8 Symbol.replace
// 19.4.2.9 Symbol.search
// 19.4.2.10 Symbol.species
// 19.4.2.11 Symbol.split
// 19.4.2.12 Symbol.toPrimitive
// 19.4.2.13 Symbol.toStringTag
// 19.4.2.14 Symbol.unscopables
$.each.call((
    'hasInstance,isConcatSpreadable,iterator,match,replace,search,' +
    'species,split,toPrimitive,toStringTag,unscopables'
  ).split(','), function(it){
    var sym = require('./$.wks')(it);
    symbolStatics[it] = useNative ? sym : wrap(sym);
  }
);

setter = true;

$def($def.G + $def.W, {Symbol: $Symbol});

$def($def.S, 'Symbol', symbolStatics);

$def($def.S + $def.F * !useNative, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: getOwnPropertySymbols
});

// 19.4.3.5 Symbol.prototype[@@toStringTag]
setTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setTag($.g.JSON, 'JSON', true);
},{"./$":17,"./$.assert":4,"./$.cof":5,"./$.def":9,"./$.enum-keys":10,"./$.keyof":18,"./$.uid":21,"./$.wks":23}],30:[function(require,module,exports){
require('./es6.array.iterator');
var $           = require('./$')
  , Iterators   = require('./$.iter').Iterators
  , ITERATOR    = require('./$.wks')('iterator')
  , ArrayValues = Iterators.Array
  , NodeList    = $.g.NodeList;
if($.FW && NodeList && !(ITERATOR in NodeList.prototype)){
  $.hide(NodeList.prototype, ITERATOR, ArrayValues);
}
Iterators.NodeList = ArrayValues;
},{"./$":17,"./$.iter":16,"./$.wks":23,"./es6.array.iterator":24}],31:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.createJazzInstance = createJazzInstance;
exports.getJazzInstance = getJazzInstance;

var _util = require('./util');

/*
  Creates instances of the Jazz plugin if necessary. Initially the MIDIAccess creates one main Jazz instance that is used
  to query all initially connected devices, and to track the devices that are being connected or disconnected at runtime.

  For every MIDIInput and MIDIOutput that is created, MIDIAccess queries the getJazzInstance() method for a Jazz instance
  that still have an available input or output. Because Jazz only allows one input and one output per instance, we
  need to create new instances if more than one MIDI input or output device gets connected.

  Note that an existing Jazz instance doesn't get deleted when both its input and output device are disconnected; instead it
  will be reused if a new device gets connected.
*/

'use strict';

/*
  The require statements are only needed for Internet Explorer. They have to be put here;
  if you put them at the top entry point (shim.js) it doesn't work (weird quirck in IE?).

  Note that you can remove the require statements if you don't need (or want) to support Internet Explorer:
  that will shrink the filesize of the WebMIDIAPIShim to about 50%.
*/
require('babelify/node_modules/babel-core/node_modules/core-js/es6/map');
require('babelify/node_modules/babel-core/node_modules/core-js/es6/set');
require('babelify/node_modules/babel-core/node_modules/core-js/es6/symbol');

var jazzPluginInitTime = 100; // milliseconds

var jazzInstanceNumber = 0;
var jazzInstances = new Map();

function createJazzInstance(callback) {

  var id = 'jazz_' + jazzInstanceNumber++ + '' + Date.now();
  var instance = undefined;
  var objRef = undefined,
      activeX = undefined;

  if (_util.getDevice().nodejs === true) {
    objRef = new jazzMidi.MIDI();
  } else {
    var o1 = document.createElement('object');
    o1.id = id + 'ie';
    o1.classid = 'CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90';
    activeX = o1;

    var o2 = document.createElement('object');
    o2.id = id;
    o2.type = 'audio/x-jazz';
    o1.appendChild(o2);
    objRef = o2;

    var e = document.createElement('p');
    e.appendChild(document.createTextNode('This page requires the '));

    var a = document.createElement('a');
    a.appendChild(document.createTextNode('Jazz plugin'));
    a.href = 'http://jazz-soft.net/';

    e.appendChild(a);
    e.appendChild(document.createTextNode('.'));
    o2.appendChild(e);

    var insertionPoint = document.getElementById('MIDIPlugin');
    if (!insertionPoint) {
      // Create hidden element
      insertionPoint = document.createElement('div');
      insertionPoint.id = 'MIDIPlugin';
      insertionPoint.style.position = 'absolute';
      insertionPoint.style.visibility = 'hidden';
      insertionPoint.style.left = '-9999px';
      insertionPoint.style.top = '-9999px';
      document.body.appendChild(insertionPoint);
    }
    insertionPoint.appendChild(o1);
  }

  setTimeout(function () {
    if (objRef.isJazz === true) {
      instance = objRef;
    } else if (activeX.isJazz === true) {
      instance = activeX;
    }
    if (instance !== undefined) {
      instance._perfTimeZero = performance.now();
      jazzInstances.set(id, instance);
    }
    callback(instance);
  }, jazzPluginInitTime);
}

function getJazzInstance(type, callback) {
  var instance = null;
  var key = type === 'input' ? 'inputInUse' : 'outputInUse';

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = jazzInstances.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var inst = _step.value;

      if (inst[key] !== true) {
        instance = inst;
        break;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  if (instance === null) {
    createJazzInstance(callback);
  } else {
    callback(instance);
  }
}

},{"./util":38,"babelify/node_modules/babel-core/node_modules/core-js/es6/map":1,"babelify/node_modules/babel-core/node_modules/core-js/es6/set":2,"babelify/node_modules/babel-core/node_modules/core-js/es6/symbol":3}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.createMIDIAccess = createMIDIAccess;

// when a device gets connected/disconnected both the port and MIDIAccess dispatch a MIDIConnectionEvent
// therefor we call the ports dispatchEvent function here as well
exports.dispatchEvent = dispatchEvent;
exports.closeAllMIDIInputs = closeAllMIDIInputs;

// check if we have already created a unique id for this device, if so: reuse it, if not: create a new id and store it
exports.getMIDIDeviceId = getMIDIDeviceId;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _jazz_instance = require('./jazz_instance');

var _midi_input = require('./midi_input');

var _midi_output = require('./midi_output');

var _midiconnection_event = require('./midiconnection_event');

var _util = require('./util');

/*
  Creates a MIDIAccess instance:
  - Creates MIDIInput and MIDIOutput instances for the initially connected MIDI devices.
  - Keeps track of newly connected devices and creates the necessary instances of MIDIInput and MIDIOutput.
  - Keeps track of disconnected devices and removes them from the inputs and/or outputs map.
  - Creates a unique id for every device and stores these ids by the name of the device:
    so when a device gets disconnected and reconnected again, it will still have the same id. This
    is in line with the behaviour of the native MIDIAccess object.

*/

'use strict';

var midiAccess = undefined;
var jazzInstance = undefined;
var midiInputs = new Map();
var midiOutputs = new Map();
var midiInputIds = new Map();
var midiOutputIds = new Map();
var listeners = new Set();

var MIDIAccess = (function () {
  function MIDIAccess(midiInputs, midiOutputs) {
    _classCallCheck(this, MIDIAccess);

    this.sysexEnabled = true;
    this.inputs = midiInputs;
    this.outputs = midiOutputs;
  }

  _createClass(MIDIAccess, [{
    key: 'addEventListener',
    value: function addEventListener(type, listener, useCapture) {
      if (type !== 'statechange') {
        return;
      }
      if (listeners.has(listener) === false) {
        listeners.add(listener);
      }
    }
  }, {
    key: 'removeEventListener',
    value: function removeEventListener(type, listener, useCapture) {
      if (type !== 'statechange') {
        return;
      }
      if (listeners.has(listener) === true) {
        listeners['delete'](listener);
      }
    }
  }]);

  return MIDIAccess;
})();

function createMIDIAccess() {

  return new Promise(function executor(resolve, reject) {

    if (midiAccess !== undefined) {
      resolve(midiAccess);
      return;
    }

    if (_util.getDevice().browser === 'ie9') {
      reject({ message: 'WebMIDIAPIShim supports Internet Explorer 10 and above.' });
      return;
    }

    _jazz_instance.createJazzInstance(function (instance) {
      if (instance === undefined) {
        reject({ message: 'No access to MIDI devices: browser does not support the WebMIDI API and the Jazz plugin is not installed.' });
        return;
      }

      jazzInstance = instance;

      createMIDIPorts(function () {
        setupListeners();
        midiAccess = new MIDIAccess(midiInputs, midiOutputs);
        resolve(midiAccess);
      });
    });
  });
}

// create MIDIInput and MIDIOutput instances for all initially connected MIDI devices
function createMIDIPorts(callback) {
  var inputs = jazzInstance.MidiInList();
  var outputs = jazzInstance.MidiOutList();
  var numInputs = inputs.length;
  var numOutputs = outputs.length;

  loopCreateMIDIPort(0, numInputs, 'input', inputs, function () {
    loopCreateMIDIPort(0, numOutputs, 'output', outputs, callback);
  });
}

function loopCreateMIDIPort(index, max, type, list, callback) {
  if (index < max) {
    var _name = list[index++];
    createMIDIPort(type, _name, function () {
      loopCreateMIDIPort(index, max, type, list, callback);
    });
  } else {
    callback();
  }
}

function createMIDIPort(type, name, callback) {
  _jazz_instance.getJazzInstance(type, function (instance) {
    var port = undefined;
    var info = [name, '', ''];
    if (type === 'input') {
      if (instance.Support('MidiInInfo')) {
        info = instance.MidiInInfo(name);
      }
      port = new _midi_input.MIDIInput(info, instance);
      midiInputs.set(port.id, port);
    } else if (type === 'output') {
      if (instance.Support('MidiOutInfo')) {
        info = instance.MidiOutInfo(name);
      }
      port = new _midi_output.MIDIOutput(info, instance);
      midiOutputs.set(port.id, port);
    }
    callback(port);
  });
}

// lookup function: Jazz gives us the name of the connected/disconnected MIDI devices but we have stored them by id
function getPortByName(ports, name) {
  var port = undefined;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = ports.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      port = _step.value;

      if (port.name === name) {
        break;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return port;
}

// keep track of connected/disconnected MIDI devices
function setupListeners() {
  jazzInstance.OnDisconnectMidiIn(function (name) {
    var port = getPortByName(midiInputs, name);
    if (port !== undefined) {
      port.state = 'disconnected';
      port.close();
      port._jazzInstance.inputInUse = false;
      midiInputs['delete'](port.id);
      dispatchEvent(port);
    }
  });

  jazzInstance.OnDisconnectMidiOut(function (name) {
    var port = getPortByName(midiOutputs, name);
    if (port !== undefined) {
      port.state = 'disconnected';
      port.close();
      port._jazzInstance.outputInUse = false;
      midiOutputs['delete'](port.id);
      dispatchEvent(port);
    }
  });

  jazzInstance.OnConnectMidiIn(function (name) {
    createMIDIPort('input', name, function (port) {
      dispatchEvent(port);
    });
  });

  jazzInstance.OnConnectMidiOut(function (name) {
    createMIDIPort('output', name, function (port) {
      dispatchEvent(port);
    });
  });
}
function dispatchEvent(port) {
  port.dispatchEvent(new _midiconnection_event.MIDIConnectionEvent(port, port));

  var evt = new _midiconnection_event.MIDIConnectionEvent(midiAccess, port);

  if (typeof midiAccess.onstatechange === 'function') {
    midiAccess.onstatechange(evt);
  }
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = listeners[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var listener = _step2.value;

      listener(evt);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}

function closeAllMIDIInputs() {
  midiInputs.forEach(function (input) {
    //input.close();
    input._jazzInstance.MidiInClose();
  });
}

function getMIDIDeviceId(name, type) {
  var id = undefined;
  if (type === 'input') {
    id = midiInputIds.get(name);
    if (id === undefined) {
      id = _util.generateUUID();
      midiInputIds.set(name, id);
    }
  } else if (type === 'output') {
    id = midiOutputIds.get(name);
    if (id === undefined) {
      id = _util.generateUUID();
      midiOutputIds.set(name, id);
    }
  }
  return id;
}

},{"./jazz_instance":32,"./midi_input":34,"./midi_output":35,"./midiconnection_event":36,"./util":38}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('./util');

var _midimessage_event = require('./midimessage_event');

var _midiconnection_event = require('./midiconnection_event');

var _midi_access = require('./midi_access');

/*
  MIDIInput is a wrapper around an input of a Jazz instance
*/

'use strict';

var midiProc = undefined;
var nodejs = _util.getDevice().nodejs;

var MIDIInput = (function () {
  function MIDIInput(info, instance) {
    _classCallCheck(this, MIDIInput);

    this.id = _midi_access.getMIDIDeviceId(info[0], 'input');
    this.name = info[0];
    this.manufacturer = info[1];
    this.version = info[2];
    this.type = 'input';
    this.state = 'connected';
    this.connection = 'pending';

    this.onstatechange = null;
    this._onmidimessage = null;
    // because we need to implicitly open the device when an onmidimessage handler gets added
    // we define a setter that opens the device if the set value is a function
    Object.defineProperty(this, 'onmidimessage', {
      set: function set(value) {
        this._onmidimessage = value;
        if (typeof value === 'function') {
          this.open();
        }
      }
    });

    this._listeners = new Map().set('midimessage', new Set()).set('statechange', new Set());
    this._inLongSysexMessage = false;
    this._sysexBuffer = new Uint8Array();

    this._jazzInstance = instance;
    this._jazzInstance.inputInUse = true;

    // on Linux opening and closing Jazz instances causes the plugin to crash a lot so we open
    // the device here and don't close it when close() is called, see below
    if (_util.getDevice().platform === 'linux') {
      this._jazzInstance.MidiInOpen(this.name, midiProc.bind(this));
    }
  }

  _createClass(MIDIInput, [{
    key: 'addEventListener',
    value: function addEventListener(type, listener, useCapture) {
      var listeners = this._listeners.get(type);
      if (listeners === undefined) {
        return;
      }

      if (listeners.has(listener) === false) {
        listeners.add(listener);
      }
    }
  }, {
    key: 'removeEventListener',
    value: function removeEventListener(type, listener, useCapture) {
      var listeners = this._listeners.get(type);
      if (listeners === undefined) {
        return;
      }

      if (listeners.has(listener) === false) {
        listeners['delete'](listener);
      }
    }
  }, {
    key: 'dispatchEvent',
    value: function dispatchEvent(evt) {
      var listeners = this._listeners.get(evt.type);
      listeners.forEach(function (listener) {
        listener(evt);
      });

      if (evt.type === 'midimessage') {
        if (this._onmidimessage !== null) {
          this._onmidimessage(evt);
        }
      } else if (evt.type === 'statechange') {
        if (this.onstatechange !== null) {
          this.onstatechange(evt);
        }
      }
    }
  }, {
    key: 'open',
    value: function open() {
      if (this.connection === 'open') {
        return;
      }
      if (_util.getDevice().platform !== 'linux') {
        this._jazzInstance.MidiInOpen(this.name, midiProc.bind(this));
      }
      this.connection = 'open';
      _midi_access.dispatchEvent(this); // dispatch MIDIConnectionEvent via MIDIAccess
    }
  }, {
    key: 'close',
    value: function close() {
      if (this.connection === 'closed') {
        return;
      }
      if (_util.getDevice().platform !== 'linux') {
        this._jazzInstance.MidiInClose();
      }
      this.connection = 'closed';
      _midi_access.dispatchEvent(this); // dispatch MIDIConnectionEvent via MIDIAccess
      this._onmidimessage = null;
      this.onstatechange = null;
      this._listeners.get('midimessage').clear();
      this._listeners.get('statechange').clear();
    }
  }, {
    key: '_appendToSysexBuffer',
    value: function _appendToSysexBuffer(data) {
      var oldLength = this._sysexBuffer.length;
      var tmpBuffer = new Uint8Array(oldLength + data.length);
      tmpBuffer.set(this._sysexBuffer);
      tmpBuffer.set(data, oldLength);
      this._sysexBuffer = tmpBuffer;
    }
  }, {
    key: '_bufferLongSysex',
    value: function _bufferLongSysex(data, initialOffset) {
      var j = initialOffset;
      while (j < data.length) {
        if (data[j] == 247) {
          // end of sysex!
          j++;
          this._appendToSysexBuffer(data.slice(initialOffset, j));
          return j;
        }
        j++;
      }
      // didn't reach the end; just tack it on.
      this._appendToSysexBuffer(data.slice(initialOffset, j));
      this._inLongSysexMessage = true;
      return j;
    }
  }]);

  return MIDIInput;
})();

exports.MIDIInput = MIDIInput;

midiProc = function (timestamp, data) {
  var length = 0;
  var i = undefined;
  var isSysexMessage = false;

  // Jazz sometimes passes us multiple messages at once, so we need to parse them out and pass them one at a time.

  for (i = 0; i < data.length; i += length) {
    var isValidMessage = true;
    if (this._inLongSysexMessage) {
      i = this._bufferLongSysex(data, i);
      if (data[i - 1] != 247) {
        // ran off the end without hitting the end of the sysex message
        return;
      }
      isSysexMessage = true;
    } else {
      isSysexMessage = false;
      switch (data[i] & 240) {
        case 0:
          // Chew up spurious 0x00 bytes.  Fixes a Windows problem.
          length = 1;
          isValidMessage = false;
          break;

        case 128: // note off
        case 144: // note on
        case 160: // polyphonic aftertouch
        case 176: // control change
        case 224:
          // channel mode
          length = 3;
          break;

        case 192: // program change
        case 208:
          // channel aftertouch
          length = 2;
          break;

        case 240:
          switch (data[i]) {
            case 240:
              // letiable-length sysex.
              i = this._bufferLongSysex(data, i);
              if (data[i - 1] != 247) {
                // ran off the end without hitting the end of the sysex message
                return;
              }
              isSysexMessage = true;
              break;

            case 241: // MTC quarter frame
            case 243:
              // song select
              length = 2;
              break;

            case 242:
              // song position pointer
              length = 3;
              break;

            default:
              length = 1;
              break;
          }
          break;
      }
    }
    if (!isValidMessage) {
      continue;
    }

    var evt = {};
    evt.receivedTime = parseFloat(timestamp.toString()) + this._jazzInstance._perfTimeZero;

    if (isSysexMessage || this._inLongSysexMessage) {
      evt.data = new Uint8Array(this._sysexBuffer);
      this._sysexBuffer = new Uint8Array(0);
      this._inLongSysexMessage = false;
    } else {
      evt.data = new Uint8Array(data.slice(i, length + i));
    }

    if (nodejs) {
      if (this._onmidimessage) {
        this._onmidimessage(evt);
      }
    } else {
      var e = new _midimessage_event.MIDIMessageEvent(this, evt.data, evt.receivedTime);
      this.dispatchEvent(e);
    }
  }
};

},{"./midi_access":33,"./midiconnection_event":36,"./midimessage_event":37,"./util":38}],35:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('./util');

var _midi_access = require('./midi_access');

/*
  MIDIOutput is a wrapper around an output of a Jazz instance
*/

'use strict';

var MIDIOutput = (function () {
  function MIDIOutput(info, instance) {
    _classCallCheck(this, MIDIOutput);

    this.id = _midi_access.getMIDIDeviceId(info[0], 'output');
    this.name = info[0];
    this.manufacturer = info[1];
    this.version = info[2];
    this.type = 'output';
    this.state = 'connected';
    this.connection = 'pending';
    this.onmidimessage = null;
    this.onstatechange = null;

    this._listeners = new Set();
    this._inLongSysexMessage = false;
    this._sysexBuffer = new Uint8Array();

    this._jazzInstance = instance;
    this._jazzInstance.outputInUse = true;
    if (_util.getDevice().platform === 'linux') {
      this._jazzInstance.MidiOutOpen(this.name);
    }
  }

  _createClass(MIDIOutput, [{
    key: 'open',
    value: function open() {
      if (this.connection === 'open') {
        return;
      }
      if (_util.getDevice().platform !== 'linux') {
        this._jazzInstance.MidiOutOpen(this.name);
      }
      this.connection = 'open';
      _midi_access.dispatchEvent(this); // dispatch MIDIConnectionEvent via MIDIAccess
    }
  }, {
    key: 'close',
    value: function close() {
      if (this.connection === 'closed') {
        return;
      }
      if (_util.getDevice().platform !== 'linux') {
        this._jazzInstance.MidiOutClose();
      }
      this.connection = 'closed';
      _midi_access.dispatchEvent(this); // dispatch MIDIConnectionEvent via MIDIAccess
      this.onstatechange = null;
      this._listeners.clear();
    }
  }, {
    key: 'send',
    value: function send(data, timestamp) {
      var _this = this;

      var delayBeforeSend = 0;

      if (data.length === 0) {
        return false;
      }

      if (timestamp) {
        delayBeforeSend = Math.floor(timestamp - performance.now());
      }

      if (timestamp && delayBeforeSend > 1) {
        setTimeout(function () {
          _this._jazzInstance.MidiOutLong(data);
        }, delayBeforeSend);
      } else {
        this._jazzInstance.MidiOutLong(data);
      }
      return true;
    }
  }, {
    key: 'clear',
    value: function clear() {}
  }, {
    key: 'addEventListener',
    value: function addEventListener(type, listener, useCapture) {
      if (type !== 'statechange') {
        return;
      }

      if (this._listeners.has(listener) === false) {
        this._listeners.add(listener);
      }
    }
  }, {
    key: 'removeEventListener',
    value: function removeEventListener(type, listener, useCapture) {
      if (type !== 'statechange') {
        return;
      }

      if (this._listeners.has(listener) === false) {
        this._listeners['delete'](listener);
      }
    }
  }, {
    key: 'dispatchEvent',
    value: function dispatchEvent(evt) {
      this._listeners.forEach(function (listener) {
        listener(evt);
      });

      if (this.onstatechange !== null) {
        this.onstatechange(evt);
      }
    }
  }]);

  return MIDIOutput;
})();

exports.MIDIOutput = MIDIOutput;

// to be implemented

},{"./midi_access":33,"./util":38}],36:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use strict';

var MIDIConnectionEvent = function MIDIConnectionEvent(midiAccess, port) {
  _classCallCheck(this, MIDIConnectionEvent);

  this.bubbles = false;
  this.cancelBubble = false;
  this.cancelable = false;
  this.currentTarget = midiAccess;
  this.defaultPrevented = false;
  this.eventPhase = 0;
  this.path = [];
  this.port = port;
  this.returnValue = true;
  this.srcElement = midiAccess;
  this.target = midiAccess;
  this.timeStamp = Date.now();
  this.type = 'statechange';
};

exports.MIDIConnectionEvent = MIDIConnectionEvent;

},{}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use strict';

var MIDIMessageEvent = function MIDIMessageEvent(port, data, receivedTime) {
  _classCallCheck(this, MIDIMessageEvent);

  this.bubbles = false;
  this.cancelBubble = false;
  this.cancelable = false;
  this.currentTarget = port;
  this.data = data;
  this.defaultPrevented = false;
  this.eventPhase = 0;
  this.path = [];
  this.receivedTime = receivedTime;
  this.returnValue = true;
  this.srcElement = port;
  this.target = port;
  this.timeStamp = Date.now();
  this.type = 'midimessage';
};

exports.MIDIMessageEvent = MIDIMessageEvent;

},{}],38:[function(require,module,exports){
(function (process,global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

// check on what type of device we are running, note that in this context a device is a computer not a MIDI device
exports.getDevice = getDevice;
exports.polyfillPerformance = polyfillPerformance;
exports.generateUUID = generateUUID;

// a very simple implementation of a Promise for Internet Explorer and Nodejs
exports.polyfillPromise = polyfillPromise;
exports.polyfill = polyfill;
/*
  A collection of handy util methods
*/

'use strict';

var device = undefined;
function getDevice() {

  if (device !== undefined) {
    return device;
  }

  var platform = 'undetected',
      browser = 'undetected',
      nodejs = false;

  if (navigator.nodejs) {
    platform = process.platform;
    device = {
      platform: platform,
      nodejs: true,
      mobile: platform === 'ios' || platform === 'android'
    };
    return device;
  }

  var ua = navigator.userAgent;

  if (ua.match(/(iPad|iPhone|iPod)/g)) {
    platform = 'ios';
  } else if (ua.indexOf('Android') !== -1) {
    platform = 'android';
  } else if (ua.indexOf('Linux') !== -1) {
    platform = 'linux';
  } else if (ua.indexOf('Macintosh') !== -1) {
    platform = 'osx';
  } else if (ua.indexOf('Windows') !== -1) {
    platform = 'windows';
  }

  if (ua.indexOf('Chrome') !== -1) {
    // chrome, chromium and canary
    browser = 'chrome';

    if (ua.indexOf('OPR') !== -1) {
      browser = 'opera';
    } else if (ua.indexOf('Chromium') !== -1) {
      browser = 'chromium';
    }
  } else if (ua.indexOf('Safari') !== -1) {
    browser = 'safari';
  } else if (ua.indexOf('Firefox') !== -1) {
    browser = 'firefox';
  } else if (ua.indexOf('Trident') !== -1) {
    browser = 'ie';
    if (ua.indexOf('MSIE 9') !== -1) {
      browser = 'ie9';
    }
  }

  if (platform === 'ios') {
    if (ua.indexOf('CriOS') !== -1) {
      browser = 'chrome';
    }
  }

  device = {
    platform: platform,
    browser: browser,
    mobile: platform === 'ios' || platform === 'android',
    nodejs: false
  };
  return device;
}

function polyfillPerformance() {
  if (performance === undefined) {
    performance = {};
  }
  Date.now = Date.now || function () {
    return new Date().getTime();
  };

  if (performance.now === undefined) {
    (function () {
      var nowOffset = Date.now();
      if (performance.timing !== undefined && performance.timing.navigationStart !== undefined) {
        nowOffset = performance.timing.navigationStart;
      }
      performance.now = function now() {
        return Date.now() - nowOffset;
      };
    })();
  }
}

function generateUUID() {
  var d = new Date().getTime();
  var uuid = new Array(64).join('x');; //'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  uuid = uuid.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : r & 3 | 8).toString(16).toUpperCase();
  });
  return uuid;
}

function polyfillPromise(scope) {
  if (typeof scope.Promise !== 'function') {

    scope.Promise = function (executor) {
      this.executor = executor;
    };

    scope.Promise.prototype.then = function (accept, reject) {
      if (typeof accept !== 'function') {
        accept = function () {};
      }
      if (typeof reject !== 'function') {
        reject = function () {};
      }
      this.executor(accept, reject);
    };
  }
}

function polyfill() {
  var device = getDevice();
  if (device.browser === 'ie') {
    polyfillPromise(window);
  } else if (device.nodejs === true) {
    polyfillPromise(global);
  }
  polyfillPerformance();
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":31}],39:[function(require,module,exports){
'use strict';

var _midi_access = require('./midi_access');

var _util = require('./util');

/*
  Top entry point
*/

'use strict';

var midiAccess = undefined;

(function () {
  if (!navigator.requestMIDIAccess) {
    _util.polyfill();
    navigator.requestMIDIAccess = function () {
      // singleton-ish, no need to create multiple instances of MIDIAccess
      if (midiAccess === undefined) {
        midiAccess = _midi_access.createMIDIAccess();
      }
      return midiAccess;
    };
    if (_util.getDevice().nodejs === true) {
      navigator.close = function () {
        // Need to close MIDI input ports, otherwise Node.js will wait for MIDI input forever.
        _midi_access.closeAllMIDIInputs();
      };
    }
  }
})();

},{"./midi_access":33,"./util":38}]},{},[39])


//# sourceMappingURL=WebMIDIAPI.js.map
/*
 *	FileSaver.js
 *  A saveAs() FileSaver implementation.
 *  2014-01-24
 *
 *  By Eli Grey, http://eligrey.com
 *  License: X11/MIT
 *    See LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs
  // IE 10+ (native saveAs)
  || (typeof navigator !== "undefined" &&
      navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
  // Everyone else
  || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof navigator !== "undefined" &&
	    /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, URL = view.URL || view.webkitURL || view
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = !view.externalHost && "download" in save_link
		, click = function(node) {
			var event = doc.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, view, 0, 0, 0, 0, 0
				, false, false, false, false, 0, null
			);
			node.dispatchEvent(event);
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		, deletion_queue = []
		, process_deletion_queue = function() {
			var i = deletion_queue.length;
			while (i--) {
				var file = deletion_queue[i];
				if (typeof file === "string") { // file is an object URL
					URL.revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			}
			deletion_queue.length = 0; // clear queue
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, FileSaver = function(blob, name) {
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, get_object_url = function() {
					var object_url = get_URL().createObjectURL(blob);
					deletion_queue.push(object_url);
					return object_url;
				}
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_object_url(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
						window.open(object_url, "_blank");
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_object_url(blob);
				// FF for Android has a nasty garbage collection mechanism
				// that turns all objects that are not pure javascript into 'deadObject'
				// this means `doc` and `save_link` are unusable and need to be recreated
				// `view` is usable though:
				doc = view.document;
				save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a");
				save_link.href = object_url;
				save_link.download = name;
				var event = doc.createEvent("MouseEvents");
				event.initMouseEvent(
					"click", true, false, view, 0, 0, 0, 0, 0
					, false, false, false, false, 0, null
				);
				save_link.dispatchEvent(event);
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									deletion_queue.push(file);
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name) {
			return new FileSaver(blob, name);
		}
	;
	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	view.addEventListener("unload", process_deletion_queue, false);
	saveAs.unload = function() {
		process_deletion_queue();
		view.removeEventListener("unload", process_deletion_queue, false);
	};
	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module !== null) {
  module.exports = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
  define([], function() {
    return saveAs;
  });
}
(function(){

    'use strict';

    var
        // satisfy jslint
        alert = window.alert,
        console = window.console,

        protectedScope,
        initMethods = [],

        webaudioUnlocked = true,
        src,
        context,
        gainNode,
        compressor,
        sampleIndex = 0,
        compressorParams = ['threshold', 'knee', 'ratio', 'reduction', 'attack', 'release'],

        ua = navigator.userAgent,
        os,
        browser,
        legacy = false;


    if(ua.match(/(iPad|iPhone|iPod)/g)){
        os = 'ios';
        webaudioUnlocked = false;
    }else if(ua.indexOf('Android') !== -1){
        os = 'android';
    }else if(ua.indexOf('Linux') !== -1){
        os = 'linux';
    }else if(ua.indexOf('Macintosh') !== -1){
        os = 'osx';
    }else if(ua.indexOf('Windows') !== -1){
        os = 'windows';
    }

    if(ua.indexOf('Chrome') !== -1){
        // chrome, chromium and canary
        browser = 'chrome';

        if(ua.indexOf('OPR') !== -1){
            browser = 'opera';
        }else if(ua.indexOf('Chromium') !== -1){
            browser = 'chromium';
        }

        /*
        //console.log(new Audio().canPlayType('audio/mp3'));
        if(new Audio().canPlayType('audio/mp3') !== 'probably'){
            // chromium does not support mp3
            browser = 'chromium';
        }
        */
    }else if(ua.indexOf('Safari') !== -1){
        browser = 'safari';
    }else if(ua.indexOf('Firefox') !== -1){
        browser = 'firefox';
    }else if(ua.indexOf('Trident') !== -1){
        browser = 'Internet Explorer';
    }

    if(os === 'ios'){
        if(ua.indexOf('CriOS') !== -1){
            browser = 'chrome';
        }
    }

    //console.log(os, browser, '---', ua);

    if(window.AudioContext){
        context = new window.AudioContext();
        if(context.createGainNode === undefined){
            context.createGainNode = context.createGain;
        }
    }else if(window.webkitAudioContext){
        context = new window.webkitAudioContext();
    }else if(window.oAudioContext){
        context = new window.oAudioContext();
    }else if(window.msAudioContext){
        context = new window.msAudioContext();
    }else{
        //alert('Your browser does not support AudioContext!\n\nPlease use one of these browsers:\n\n- Chromium (Linux | Windows)\n- Firefox (OSX | Windows)\n- Chrome (Linux | Android | OSX | Windows)\n- Canary (OSX | Windows)\n- Safari (iOS 6.0+ | OSX)\n\nIf you use Chrome or Chromium, heartbeat uses the WebMIDI api');
        window.sequencer = {
            browser: browser,
            os: os
        };
        alert('The WebAudio API hasn\'t been implemented in ' + browser + ', please use any other browser');
        window.sequencer.ready = function(cb){
            cb();
        };
        return;
    }

    // check for older implementations of WebAudio
    src = context.createBufferSource();
    if(src.start === undefined){
        legacy = true;
    }


/*
    var audioTest = new Audio();
    //wav = audioTest.canPlayType('audio/wav');// === '' ? false : true;
    canplayOgg = audioTest.canPlayType('audio/ogg');// === '' ? false : true;
    canplayMp3 = audioTest.canPlayType('audio/mpeg');// === '' ? false : true;
    console.log('wav', audioTest.canPlayType('audio/wav'), 'ogg', canplayOgg, 'mp3', canplayMp3);
    audioTest = null;
*/


    navigator.getUserMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
    );


    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
    window.Blob = window.Blob || window.webkitBlob || window.mozBlob;

    //console.log('iOS', os, context, window.Blob, window.requestAnimationFrame);

    compressor = context.createDynamicsCompressor();
    compressor.connect(context.destination);
    //console.log(compressor);
    gainNode = context.createGainNode();
    //gainNode.connect(compressor);
    gainNode.connect(context.destination);
    gainNode.gain.value = 1;


    protectedScope = {

        context: context,
        //destination: context.destination,
        masterGainNode: gainNode,
        masterCompressor: compressor,

        useDelta: false,

        timedTasks: {},
        scheduledTasks: {},
        repetitiveTasks: {},

        getSampleId: function(){
            return 'S' + sampleIndex++ + new Date().getTime();
        },

        addInitMethod: function(method){
            initMethods.push(method);
        },

        callInitMethods: function(){
            var i, maxi = initMethods.length;
            for(i = 0; i < maxi; i++){
                initMethods[i]();
            }
        }
/*
        log: function(msg){
            if(sequencer.debug >= 1){
                console.log(msg);
            }
        },
        info: function(msg){
            if(sequencer.debug >= 2){
                console.info(msg);
            }
        },
        error: function(msg){
            if(sequencer.debug >= 3){
                console.error(msg);
            }
        },
*/
/*
        addConstants: function(data){
            var newSequencer = {};
            Object.getOwnPropertyNames(data).forEach(function(val, idx, array) {
                print(val + " -> " + data[val]);
            });
        };
*/
    };



    /**
        @namespace sequencer
    */
    window.sequencer = {
        name: 'qambi',
        protectedScope: protectedScope,
        ui: {},
        ua: ua,
        /**
            The operating system
            @alias sequencer#os
        */
        os: os,
        /**
            The name of thebrowser in lowercase, e.g. firefox, opera, safari, chromium, etc.
            @alias sequencer#browser
        */
        browser: browser,
        /**
            Return true if the browser uses an older version of the WebAudio API, source.noteOn() and source.noteOff instead of source.start() and source.stop()
            @alias sequencer#legacy
        */
        legacy: false,
        midi: false,
        webmidi: false,
        webaudio: true,
        jazz: false,
        ogg: false,
        mp3: false,
        record_audio: navigator.getUserMedia !== undefined,
        bitrate_mp3_encoding: 128,
        util: {},
        debug: 4, // 0 = off, 1 = error, 2 = warn, 3 = info, 4 = log
        defaultInstrument: 'sinewave',
        pitch: 440,
        bufferTime: 350/1000, //seconds
        autoAdjustBufferTime: false,
        noteNameMode: 'sharp',
        minimalSongLength: 60000, //millis
        pauseOnBlur: false,
        restartOnFocus: true,
        defaultPPQ: 960,
        overrulePPQ: true,
        precision: 3, // means float with precision 3, e.g. 10.437

        midiInputs: {},
        midiOutputs: {},
/*
        logger: {
            clear: function(){console.log('create a logger first with sequencer.createLogger()');},
            print: function(){console.log('create a logger first with sequencer.createLogger()');}
        },
*/
        storage: {
            midi: {
                id: 'midi'
            },
            audio: {
                id: 'audio',
                recordings: {}
            },
            instruments: {
                id: 'instruments'
            },
            samplepacks: {
                id: 'samplepacks'
            },
            assetpacks: {
                id: 'assetpacks'
            }
        },
/*
        createLogger: function(){
            var divLog = document.createElement('div'),
                clear, print;

            divLog.style.position = 'absolute';
            divLog.style.zIndex = 100;
            divLog.style.fontFamily = 'monospace';
            divLog.style.fontSize = '11px';
            divLog.style.color = '#00ff00';
            divLog.style.padding = '2px';
            divLog.style.width = '500px';
            divLog.style.backgroundColor = '#000000';
            document.body.appendChild(divLog);

            clear = function(){
                divLog.innerHTML = '';
            };

            print = function(msg, append){
                append = append === undefined ? false : append;
                if(append){
                    divLog.innerHTML += msg + '<br/>';
                }else{
                    divLog.innerHTML = msg + '<br/>';
                }
            };

            this.logger.clear = clear;
            this.logger.print = print;
        },
*/
        getAudioContext: function(){
            return context;
        },

        getTime: function(){
            return context.currentTime;
        },

        setMasterVolume: function(value){
            value = value < 0 ? 0 : value > 1 ? 1 : value;
            gainNode.gain.value = value;
        },

        getMasterVolume: function(){
            return gainNode.gain.value;
        },

        getCompressionReduction: function(){
            //console.log(compressor);
            return compressor.reduction.value;
        },

        enableMasterCompressor: function(flag){
            if(flag){
                gainNode.disconnect(0);
                gainNode.connect(compressor);
                compressor.disconnect(0);
                compressor.connect(context.destination);
            }else{
                compressor.disconnect(0);
                gainNode.disconnect(0);
                gainNode.connect(context.destination);
            }
        },

        configureMasterCompressor: function(cfg){
            /*
                readonly attribute AudioParam threshold; // in Decibels
                readonly attribute AudioParam knee; // in Decibels
                readonly attribute AudioParam ratio; // unit-less
                readonly attribute AudioParam reduction; // in Decibels
                readonly attribute AudioParam attack; // in Seconds
                readonly attribute AudioParam release; // in Seconds
            */
            var i, param;
            for(i = compressorParams.length; i >= 0; i--){
                param = compressorParams[i];
                if(cfg[param] !== undefined){
                    compressor[param].value = cfg[param];
                }
            }
        },

        unlockWebAudio: function(){
            if(webaudioUnlocked === true){
                //console.log('already unlocked');
                return;
            }
            var src = context.createOscillator(),
                gainNode = context.createGainNode();
            gainNode.gain.value = 0;
            src.connect(gainNode);
            gainNode.connect(context.destination);
            if(src.noteOn !== undefined){
                src.start = src.noteOn;
                src.stop = src.noteOff;
            }
            src.start(0);
            src.stop(0.001);
            webaudioUnlocked = true;
        }


    };

    // debug levels
    Object.defineProperty(sequencer, 'ERROR', {value: 1});
    Object.defineProperty(sequencer, 'WARN', {value: 2});
    Object.defineProperty(sequencer, 'INFO', {value: 3});
    Object.defineProperty(sequencer, 'LOG', {value: 4});

    //Object.defineProperty(window.sequencer, 'timedTasks', {value: {}});
    //Object.defineProperty(window.sequencer, 'scheduledTasks', {value: {}});
    //Object.defineProperty(window.sequencer, 'repetitiveTasks', {value: {}});

    //Object.defineProperty(window.sequencer, 'midiInputs', {value: []});
    //Object.defineProperty(window.sequencer, 'midiOutputs', {value: []});


}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        // import
        loadLoop, //defined in util.js
        findItem, //defined in util.js
        storeItem, //defined in util.js
        deleteItem, //defined in util.js
        typeString, //defined in util.js
        getArguments, //defined in util.js
        isEmptyObject, // defined in util.js
        objectForEach, //defined in util.js
        storage, //defined in open_module.js
        updateInstruments, //defined in sequencer.js
        findItemsInFolder, //defined in util.js

        busy = false,
        taskIndex = 0,
        finishedTasks = {},
        taskQueue = [],
        callbacks = [];


    sequencer.removeMidiFile = function(path){
        var item,
            items = [], i, folder;

        if(path.className === 'MidiFile'){
            item = path;
            path = item.localPath;
        }else{
            item = findItem(path, storage.midi);
        }

        if(item.className === 'MidiFile'){
            items.push(item);
        }else{
            folder = item;
            objectForEach(folder, function(item){
                if(item.className === 'MidiFile'){
                    items.push(item);
                }
            });
        }

        for(i = items.length - 1; i >= 0; i--){
            item = items[i];
            deleteItem(item.localPath, storage.midi);
        }
    };


    sequencer.removeInstrument = function(path, unloadSamples){
        var item, items = [], i, folder, mapping, samplePath;

        if(path.className === 'InstrumentConfig'){
            item = path;
            path = item.localPath;
        }else{
            item = findItem(path, storage.instruments);
        }


        if(item.className === 'InstrumentConfig'){
            items.push(item);
        }else{
            folder = item;
            for(i in folder){
                if(folder.hasOwnProperty(i)){
                    item = folder[i];
                    if(item.className === 'InstrumentConfig'){
                        items.push(item);
                    }
                }
            }
        }

        for(i = items.length - 1; i >= 0; i--){
            item = items[i];
            //console.log(item.mapping);
            mapping = item.mapping;
            samplePath = item.sample_path;

            if(unloadSamples === true){
                // delete samples
                objectForEach(mapping, function(value){
                    deleteItem(samplePath + '/' + value.n, storage.audio);
                });
                // delete sample pack
                deleteItem(samplePath, storage.samplepacks);
            }
            // remove instrument from storage
            deleteItem(item.localPath, storage.instruments);
            //return deleteItem(path, storage.instruments);
        }

        // if an instrument has been removed, inform the tracks that used that instrument
        updateInstruments();
    };


    sequencer.removeSamplePack = function(path){
        var item,
            items = [], i, samples, sample, s, folder;

        if(path.className === 'SamplePack'){
            item = path;
            path = item.localPath;
        }else{
            item = findItem(path, storage.samplepacks);
        }

        if(item.className === 'SamplePack'){
            items.push(item);
        }else{
            folder = item;
            objectForEach(folder, function(item){
                if(item.className === 'SamplePack'){
                    items.push(item);
                }
            });
        }

        for(i = items.length - 1; i >= 0; i--){
            item = items[i];
            //console.log(item.localPath);
            samples = item.samples;
            for(s = samples.length - 1; s >= 0; s--){
                sample = samples[s];
                //console.log('->', sample.folder + '/' + sample.id);
                deleteItem(sample.folder + '/' + sample.id, storage.audio);
            }
            item.reset();
            deleteItem(item.localPath, storage.samplepacks);
        }

        updateInstruments();
/*
        function loopInstruments(root){
            var item;

            for(i in root){
                if(root.hasOwnProperty(i)){
                    if(i === 'id' || i === 'path' || i === 'className'){
                        continue;
                    }
                    item = root[i];
                    if(item.className === 'Folder'){
                        loopInstruments(item);
                    }else{
                        item = findItem(item.folder + '/' + item.name, storage.instruments);
                        console.log(item);
                        if(item.parse){
                            item.parse();
                        }
                    }
                }
            }
        }

        loopInstruments(storage.instruments);
*/
    };


    sequencer.removeAssetPack = function(path){
        var item,
            folder;

        if(path.className === 'AssetPack'){
            item = path;
            path = item.localPath;
        }else{
            item = findItem(path, storage.assetpacks);
        }

        if(item.className === 'AssetPack'){
            item.unload();
        }else{
            folder = item;
            objectForEach(folder, function(item){
                if(item.className === 'AssetPack'){
                    item.unload();
                }
            });
        }
    };


    sequencer.startTaskQueue = function(cb){
        //console.log('startTaskQueue', taskQueue.length, busy);
        if(busy === true){
            return;
        }
        busy = true;
        loadQueueLoop(0, cb);
    };


    sequencer.addTask = function(task, callback, callbackAfterAllTasksAreDone){
        task.id = 'task' + taskIndex++;
        taskQueue.push(task);
        //console.log('task', task.type, taskQueue.length);
        if(callback !== undefined){
            if(callbackAfterAllTasksAreDone === true){
                // call the callback only after all tasks are done
                sequencer.addCallbackAfterTask(callback);
            }else{
                // call the callback right after this task is done
                sequencer.addCallbackAfterTask(callback, [task.id]);
            }
        }
        return task.id;
    };


    sequencer.addCallbackAfterTask = function(callback, taskIds){
        callbacks.push({
           method: callback,
           taskIds: taskIds
        });
        //console.log('taskIds', taskIds);
    };


    // this method loops over the load cue and performs the individual load method per asset
    function loadQueueLoop(index, onTaskQueueDone){
        var task, params, scope,
            i, j, callback, taskIds,
            performCallback;

        if(index === taskQueue.length){
            // call all callbacks that have to be called at the end of the loop queue
            for(i = callbacks.length - 1; i >= 0; i--){
                callback = callbacks[i];
                if(callback === false){
                    // this callback has already been called
                    continue;
                }
                //console.log(i, callback.method);
                var m = callback.method;
                //callback = false;
                //console.log(1,callback);
                setTimeout(function(){
                    //console.log(2, m);
                    //callback.method();
                    m();
                }, 0);
            }
            finishedTasks = {};
            taskQueue = [];
            callbacks = [];
            taskIndex = 0;
            busy = false;
            if(onTaskQueueDone){
                // for internal use only, never used so far
                console.log('onTaskQueueDone');
                onTaskQueueDone();
            }
            //console.log('task queue done', sequencer.storage);
            return;
        }

        task = taskQueue[index];
        scope = task.scope || null;
        params = task.params || [];

        //console.log(index, task.type, taskQueue.length);

        if(typeString(params) !== 'array'){
            params = [params];
        }

        function cbActionLoop(success){
            //console.log('cbActionLoop', success);
            // set a flag that this task has been done
            finishedTasks[task.id] = true;

            // check which callbacks we can call now
            for(i = callbacks.length - 1; i >= 0; i--){
                callback = callbacks[i];
                if(callback === false){
                    // this callback has already been called
                    continue;
                }
                taskIds = callback.taskIds;
                // console.log(i, callback.method, taskIds);
                // some callbacks may only be called after a task, or a number of tasks have been done
                if(taskIds !== undefined){
                    performCallback = true;
                    for(j = taskIds.length - 1; j >= 0; j--){
                        // if one of the required tasks has not been done yet, do not perform the callback
                        if(finishedTasks[taskIds[j]] !== true){
                            performCallback = false;
                        }
                    }
                    //console.log('performCallback', performCallback);
                    if(performCallback){
                        //callback.method.call(null);
                        //console.log(callback);
                        var m = callback.method;
                        callbacks[i] = false;
                        setTimeout(function(){
                            m(success);
                            //console.log(callbacks);
                        }, 0);
                    }
                }
            }

            //console.log('task done', task.name, index, taskQueue.length);
            index++;

            // if(index === taskQueue.length && taskIds === undefined){

            // }
            loadQueueLoop(index, onTaskQueueDone);
        }

        params.push(cbActionLoop);

        //console.log(index, taskQueue.length, task.method.name, params);
        task.method.apply(scope, params);
    }


    sequencer.getInstrument = function(path, exact_match){
        return findItem(path, storage.instruments, exact_match);
    };

    sequencer.getMidiFile = function(path, exact_match){
        return findItem(path, storage.midi, exact_match);
    };

    sequencer.getSamplePack = function(path, exact_match){
        return findItem(path, storage.samplepacks, exact_match);
    };

    sequencer.getSample = function(path, exact_match){
        return findItem(path, storage.audio, exact_match);
    };

    sequencer.getAssetPack = function(path, exact_match){
        return findItem(path, storage.assetpacks, exact_match);
    };

    sequencer.getSamplePacks = function(path, include_subfolders){
        return findItemsInFolder(path, storage.samplepacks, include_subfolders);
    };

    sequencer.getAssetPacks = function(path, include_subfolders){
        return findItemsInFolder(path, storage.assetpacks, include_subfolders);
    };

    sequencer.getSamples = function(path, include_subfolders){
        return findItemsInFolder(path, storage.audio, include_subfolders);
    };

    sequencer.getInstruments = function(path, include_subfolders){
        return findItemsInFolder(path, storage.instruments, include_subfolders);
    };

    sequencer.getMidiFiles = function(path, include_subfolders){
        return findItemsInFolder(path, storage.midi, include_subfolders);
    };


    sequencer.protectedScope.addInitMethod(function(){
        storage = sequencer.storage;
        loadLoop = sequencer.protectedScope.loadLoop;
        findItem = sequencer.protectedScope.findItem;
        storeItem = sequencer.protectedScope.storeItem;
        deleteItem = sequencer.protectedScope.deleteItem;
        typeString = sequencer.protectedScope.typeString;
        getArguments = sequencer.protectedScope.getArguments;
        isEmptyObject = sequencer.protectedScope.isEmptyObject;
        objectForEach = sequencer.protectedScope.objectForEach;
        updateInstruments = sequencer.protectedScope.updateInstruments;
        findItemsInFolder = sequencer.protectedScope.findItemsInFolder;
    });

}());(function(){

    'use strict';

    var
         // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        index = 0,
        storage, // defined in open_module.js
        ajax, // defined in utils.js
        round, // defined in utils.js
        parseUrl, // defined in utils.js
        findItem, // defined in utils.js
        storeItem, // defined in utils.js
        deleteItem, // defined in utils.js
        typeString, // defined in utils.js
        objectForEach, // defined in utils.js
        removeMidiFile, // defined in asset_manager.js
        removeAssetPack, // defined in asset_manager.js
        removeInstrument, // defined in asset_manager.js
        removeSamplePack, // defined in asset_manager.js

        AssetPack;

    AssetPack = function(config){
        this.id = 'AP' + index++ + new Date().getTime();
        this.name = this.id;
        this.className = 'AssetPack';
        this.loaded = false;
        this.midifiles = config.midifiles || [];
        this.samplepacks = config.samplepacks || [];
        this.instruments = config.instruments || [];
        this.url = config.url;
        var pack = this;
        objectForEach(config, function(val, key){
            pack[key] = val;
        });
    };


    function cleanup(assetpack, callback){
        assetpack = null;
        //console.log(callback.name);
        callback(false);
    }


    function store(assetpack){
        var occupied = findItem(assetpack.localPath, sequencer.storage.assetpacks, true),
            action = assetpack.action;

        //console.log('occ', occupied);
        if(occupied && occupied.className === 'AssetPack' && action !== 'overwrite'){
            if(sequencer.debug >= 2){
                console.warn('there is already an AssetPack at', assetpack.localPath);
            }
            return true;
        }else{
            storeItem(assetpack, assetpack.localPath, sequencer.storage.assetpacks);
            return false;
        }
    }


    function load(pack, callback){
        if(pack.url !== undefined){
            ajax({
                url: pack.url,
                responseType: 'json',
                onError: function(e){
                    //console.log('onError', e);
                    cleanup(pack, callback);
                },
                onSuccess: function(data, fileSize){
                    // if the json data is corrupt (for instance because of a trailing comma) data will be null
                    if(data === null){
                        callback(false);
                        return;
                    }

                    pack.loaded = true;

                    if(data.name !== undefined && pack.name === undefined){
                        pack.name = data.name;
                    }

                    if(data.folder !== undefined && pack.folder === undefined){
                        pack.folder = data.folder;
                    }

                    if(pack.name === undefined){
                        pack.name = parseUrl(pack.url).name;
                    }

                    pack.localPath = pack.folder !== undefined ? pack.folder + '/' + pack.name : pack.name;
                    pack.filesize = fileSize;
                    //pack.fileSize = round(data.length/1024/1024, 2);
                    //console.log(pack.filesize);

                    if(data.instruments){
                        pack.instruments = pack.instruments.concat(data.instruments);
                    }
                    if(data.samplepacks){
                        pack.samplepacks = pack.samplepacks.concat(data.samplepacks);
                    }
                    if(data.midifiles){
                        pack.midifiles = pack.midifiles.concat(data.midifiles);
                    }

                    loadLoop(pack, callback);
                }
            });
        }else{
            pack.localPath = pack.folder !== undefined ? pack.folder + '/' + pack.name : pack.name;
            loadLoop(pack, callback);
        }
    }


    function loadLoop(assetpack, callback){
        var i, assets, asset,
            loaded = store(assetpack),
            localPath = assetpack.localPath;


        if(loaded === true){
            assetpack = findItem(localPath, sequencer.storage.assetpacks, true);
            callback(assetpack);
            return;
        }

        if(assetpack.url !== undefined){
            var packs = sequencer.storage.assetpacks,
                tmp, p, double = null;

            for(p in packs){
                tmp = packs[p];
                if(tmp.className !== 'AssetPack'){
                    continue;
                }
                //console.log('loop', p, assetpack.id);
                if(tmp.id !== assetpack.id && tmp.url === assetpack.url){
                    double = tmp;
                    break;
                }
            }
            if(double !== null){
                //console.log(double.id, assetpack.id);
                localPath = assetpack.localPath;
                removeAssetPack(localPath);

                assetpack = null;
                assetpack = findItem(double.localPath, sequencer.storage.assetpacks, true);
                //console.log(assetpack.id, double.id);
                callback(assetpack);
                return;
            }
        }


        assets = assetpack.midifiles;
        for(i = assets.length - 1; i >= 0; i--){
            //console.log('midifile', assets[i]);
            asset = assets[i];
            asset.pack = assetpack;
            sequencer.addMidiFile(asset);
        }

        assets = assetpack.instruments;
        for(i = assets.length - 1; i >= 0; i--){
            //console.log('instrument', assets[i]);
            asset = assets[i];
            asset.pack = assetpack;
            sequencer.addInstrument(asset);
        }

        assets = assetpack.samplepacks;
        for(i = assets.length - 1; i >= 0; i--){
            //console.log('samplepack', assets[i], pack);
            asset = assets[i];
            asset.pack = assetpack;
            //console.log(asset.folder, pack.fileSize);
            sequencer.addSamplePack(asset);
        }

        callback(assetpack);
    }


    AssetPack.prototype.unload = function(){
        var i, assets, asset;

        assets = this.midifiles;
        for(i = assets.length - 1; i >= 0; i--){
            asset = assets[i];
            removeMidiFile(asset.folder + '/' + asset.name);
        }

        assets = this.instruments;
        for(i = assets.length - 1; i >= 0; i--){
            asset = assets[i];
            removeInstrument(asset.folder + '/' + asset.name);
        }

        assets = this.samplepacks;
        for(i = assets.length - 1; i >= 0; i--){
            asset = assets[i];
            removeSamplePack(asset.folder + '/' + asset.name);
        }

        deleteItem(this.localPath, storage.assetpacks);
    };


    sequencer.addAssetPack = function(config, callback){
        var type = typeString(config),
            assetpack, json, name, folder;

        if(type !== 'object'){
            if(sequencer.debug >= 2){
                console.warn('can\'t create an AssetPack with this data', config);
            }
            return false;
        }

        if(callback === undefined){
            callback = function(){};
        }

        if(config.json){
            json = config.json;
            name = config.name;
            folder = config.folder;
            if(typeString(json) === 'string'){
                try{
                    json = JSON.parse(json);
                }catch(e){
                    if(sequencer.debug >= 2){
                        console.warn('can\'t create an AssetPack with this data', config);
                    }
                    return false;
                }
            }
            if(json.instruments === undefined && json.midifiles === undefined && json.samplepacks === undefined){
                if(sequencer.debug >= 2){
                    console.warn('can\'t create an AssetPack with this data', config);
                }
                return false;
            }
            config = {
                midifiles: json.midifiles,
                instruments: json.instruments,
                samplepacks: json.samplepacks,
                name: name === undefined ? json.name : name,
                folder: folder === undefined ? json.folder : folder
            };
            //console.log('config', name, folder, json.name, json.folder);
        }


        //assetpack = new AssetPack(config);
        //console.log(assetpack.id);

        sequencer.addTask({
            type: 'load asset pack',
            method: load,
            params: new AssetPack(config)
        }, function(assetpack){
            config = null;
            //console.log(assetpack.id);
            callback(assetpack);
            //console.log('assetpack', assetpack);
        }, true);

        sequencer.startTaskQueue();
/*
        sequencer.addTask({
            method: load,
            params: assetpack
        }, function(){
            console.log('loaded', assetpack);
            store(assetpack);
            if(callback){
                callback(assetpack);
            }
        });
*/
    };


    sequencer.protectedScope.addInitMethod(function(){

        ajax = sequencer.protectedScope.ajax;
        round = sequencer.protectedScope.round;
        parseUrl = sequencer.protectedScope.parseUrl;
        findItem = sequencer.protectedScope.findItem;
        storeItem = sequencer.protectedScope.storeItem;
        deleteItem = sequencer.protectedScope.deleteItem;
        typeString = sequencer.protectedScope.typeString;
        objectForEach = sequencer.protectedScope.objectForEach;

        storage = sequencer.storage;
        removeMidiFile = sequencer.removeMidiFile;
        removeInstrument = sequencer.removeInstrument;
        removeSamplePack = sequencer.removeSamplePack;
        removeAssetPack = sequencer.removeAssetPack;
    });


}());(function(){

    'use strict';

    var
        sequencer = window.sequencer,
        console = window.console,
        self,
        importScripts,
        Lame,

        // import
        encode64, // defined in util.js
        base64EncArr, // defined in util.js
        context, // defined in open_module.js

        oggEncoder,
        mp3Encoder;


    function encodeAudio(audioBuffer, type, bitrate, callback){

        if(type === 'mp3'){

            var interleavedSamples = getInterleavedSamples(audioBuffer);

            bitrate = bitrate || sequencer.bitrate_mp3_encoding; //kbps

            if(mp3Encoder === undefined){
                mp3Encoder = createWorker();
                mp3Encoder.onmessage = function(e){
                    if(e.data.cmd === 'data'){
                        //console.log(e);
                        callback({
                            blob: new Blob([new Uint8Array(e.data.buf)], {type: 'audio/mp3'}),
                            base64: base64EncArr(e.data.buf),
                            dataUrl: 'data:audio/mp3;base64,' + encode64(e.data.buf)
                        });
                    }
                };
            }

            mp3Encoder.postMessage({
                cmd: 'init',
                config: {
                    mode: 3,
                    channels: 1,
                    samplerate: context.sampleRate,
                    bitrate: bitrate
                }
            });

            mp3Encoder.postMessage({
                cmd: 'encode',
                buf: interleavedSamples
            });

            mp3Encoder.postMessage({
                cmd: 'finish'
            });

        }else if(type === 'ogg'){

            if(sequencer.debug >= sequencer.WARN){
                console.warn('support for ogg is not yet implemented');
            }
            callback(false);

        }else{

            if(sequencer.debug >= sequencer.WARN){
                console.warn('unsupported type', type);
            }
            callback(false);
        }
    }


    function getInterleavedSamples(audioBuffer){
        if(audioBuffer.numberOfChannels === 1){
            return audioBuffer.getChannelData(0);
        }

        if(audioBuffer.numberOfChannels === 2){
            var left = audioBuffer.getChannelData(0),
                right = audioBuffer.getChannelData(1),
                numFrames = left.length,
                interleaved = new Float32Array(numFrames),
                i, index = 0;

            for(i = 0; i < numFrames; i++){
                interleaved[index++] = left[i];
                interleaved[index++] = right[i];
            }
            return interleaved;
        }
    }


    function cleanUp(){
        if(mp3Encoder !== undefined){
            mp3Encoder.terminate();
        }
        if(oggEncoder !== undefined){
            oggEncoder.terminate();
        }
    }


    // credits: https://nusofthq.com/blog/recording-mp3-using-only-html5-and-javascript-recordmp3-js/
    function encoder(){
        /*
            credits:
                https://github.com/akrennmair/libmp3lame-js/
                https://github.com/kobigurk/libmp3lame-js
        */
        importScripts('https://raw.githubusercontent.com/kobigurk/libmp3lame-js/master/dist/libmp3lame.min.js');
        //importScripts('/heartbeat/src/kobigurk/libmp3lame.min.js');

        var mp3codec,
            mp3data;

        self.onmessage = function(e) {
            switch (e.data.cmd) {
                case 'init':
                    if (!e.data.config) {
                        e.data.config = {};
                    }
                    mp3codec = Lame.init();

                    Lame.set_mode(mp3codec, e.data.config.mode || Lame.JOINT_STEREO);
                    Lame.set_num_channels(mp3codec, e.data.config.channels || 2);
                    Lame.set_num_samples(mp3codec, e.data.config.samples || -1);
                    Lame.set_in_samplerate(mp3codec, e.data.config.samplerate || 44100);
                    Lame.set_out_samplerate(mp3codec, e.data.config.samplerate || 44100);
                    Lame.set_bitrate(mp3codec, e.data.config.bitrate || 128);

                    Lame.init_params(mp3codec);
                    /*
                    console.log('Version :'+ Lame.get_version() + ' / ' +
                        'Mode: ' + Lame.get_mode(mp3codec) + ' / ' +
                        'Samples: ' + Lame.get_num_samples(mp3codec)  + ' / '  +
                        'Channels: ' + Lame.get_num_channels(mp3codec)  + ' / ' +
                        'Input Samplate: ' + Lame.get_in_samplerate(mp3codec) + ' / ' +
                        'Output Samplate: ' + Lame.get_in_samplerate(mp3codec) + ' / ' +
                        'Bitlate :' + Lame.get_bitrate(mp3codec) + ' / ' +
                        'VBR :' + Lame.get_VBR(mp3codec));
                    */
                    break;
                case 'encode':
                    //console.log('encode');
                    mp3data = Lame.encode_buffer_ieee_float(mp3codec, e.data.buf, e.data.buf);
                    self.postMessage({cmd: 'data', buf: mp3data.data});
                    break;
                case 'finish':
                    //console.log('finish');
                    mp3data = Lame.encode_flush(mp3codec);
                    self.postMessage({cmd: 'end', buf: mp3data.data});
                    Lame.close(mp3codec);
                    mp3codec = null;
                    break;
            }
        };
    }


    function createWorker(){
        var blob = new Blob(['(', encoder.toString() ,')()'], {type: 'application/javascript'});
        return new Worker(URL.createObjectURL(blob));
    }

    sequencer.encodeAudio = encodeAudio;
    sequencer.protectedScope.cleanupAudioEncoder = cleanUp;

    sequencer.protectedScope.addInitMethod(function(){
        encode64 = sequencer.util.encode64;
        base64EncArr = sequencer.util.base64EncArr;
        context = sequencer.protectedScope.context;
    });

}());




/*
    //not needed anymore because we use AudioBuffer for input

    function parseWav(wav) {
        function readInt(i, bytes) {
            var ret = 0,
                shft = 0;

            while (bytes) {
                ret += wav[i] << shft;
                shft += 8;
                i++;
                bytes--;
            }
            return ret;
        }
        if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
        if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
        return {
            sampleRate: readInt(24, 4),
            bitsPerSample: readInt(34, 2),
            samples: wav.subarray(44)
        };
    }


    function convertUint8ArrayToFloat32Array(u8a){
        var f32Buffer = new Float32Array(u8a.length);
        for (var i = 0; i < u8a.length; i++) {
            var value = u8a[i<<1] + (u8a[(i<<1)+1]<<8);
            if (value >= 0x8000) value |= ~0x7FFF;
            f32Buffer[i] = value / 0x8000;
        }
        return f32Buffer;
    }
*/
(function(){

    'use strict';

    var
        console = window.console,
        sequencer = window.sequencer,
        slice = Array.prototype.slice,


        //import
        typeString, // → defined in utils.js

        AudioEvent,
        audioEventId = 0;


    AudioEvent = function(config){

        if(config === undefined){
            // bypass for cloning
            return;
        }

        // use ticks like in MidiEvent
        if(config.ticks === undefined){
            this.ticks = 0;
        }else{
            this.ticks = config.ticks;
        }


        // provide either buffer (AudioBuffer) or path to a sample in the sequencer.storage object
        this.buffer = config.buffer;
        this.sampleId = config.sampleId;
        this.path = config.path;

        if(this.buffer === undefined && this.path === undefined){
            if(sequencer.debug >= sequencer.WARN){
                console.warn('please provide an AudioBuffer or a path to a sample in the sequencer.storage object');
            }
            return;
        }

        if(this.buffer !== undefined && typeString(this.buffer) !== 'audiobuffer'){
            if(sequencer.debug >= sequencer.WARN){
                console.warn('buffer has to be an AudioBuffer');
            }
            return;
        }

        if(this.path !== undefined){
            if(typeString(this.path) !== 'string'){
                if(sequencer.debug >= sequencer.WARN){
                    console.warn('path has to be a String');
                }
                return;
            }else{

                this.sampleId = this.path;
                this.sampleId = this.sampleId.replace(/^\//, '');
                this.sampleId = this.sampleId.replace(/\/$/, '');
                this.sampleId = this.sampleId.split('/');
                this.sampleId = this.sampleId[this.sampleId.length - 1];

                this.buffer = sequencer.getSample(this.path);
                if(this.buffer === false){
                    if(sequencer.debug >= sequencer.WARN){
                        console.warn('no sample found at', this.path);
                    }
                    return;
                }
                this.buffer = sequencer.getSample(this.path);
                //console.log(this.sampleId, this.path, this.buffer);
                //console.log(this.buffer);
            }
        }

        // set either durationTicks of durationMillis, or both if they represent the same value
        this.durationTicks = config.durationTicks;
        this.durationMillis = config.durationMillis;

        //console.log(this.durationTicks, this.durationMillis);

        if(this.durationTicks === undefined && this.durationMillis === undefined){
            this.duration = this.buffer.duration;
            this.durationMillis = this.duration * 1000;
        }
        //console.log(this.durationMillis, this.duration, this.buffer);

        this.muted = false;

        if(config.velocity === undefined){
            this.velocity = 127;
        }else{
            this.velocity = config.velocity;
        }

        // start of audio, also the quantize point, value in ticks or millis
        this.sampleOffsetTicks = config.sampleOffsetTicks;
        this.sampleOffsetMillis = config.sampleOffsetMillis;

        if(this.sampleOffsetMillis === undefined && this.sampleOffsetTicks === undefined){
            this.sampleOffsetTicks = 0;
            this.sampleOffsetMillis = 0;
            this.sampleOffset = 0;
        }else if(this.sampleOffsetMillis !== undefined){
            this.sampleOffset = this.sampleOffsetMillis/1000;
        }

        this.latencyCompensation = config.latencyCompensation;
        if(this.latencyCompensation === undefined){
            this.latencyCompensation = 0;
        }

        // if the playhead starts somewhere in the sample, this value will be set by the scheduler
        this.playheadOffset = 0;

        this.className =  'AudioEvent';
        this.time =  0;
        this.type =  'audio';
        this.id = 'A' + audioEventId + new Date().getTime();
    };


    AudioEvent.prototype.update = function(){
        var pos;
        if(this.duration === undefined){
            pos = this.song.getPosition('ticks', this.ticks + this.durationTicks);
            this.durationMillis = pos.millis - this.millis;
            this.duration = this.durationMillis/1000;
            //console.log(pos, this.durationMillis);
        }else if(this.durationTicks === undefined){
            pos = this.song.getPosition('millis', this.millis + this.durationMillis);
            this.durationTicks = pos.ticks - this.ticks;
        }

        if(this.sampleOffset === undefined){
            pos = this.song.getPosition('ticks', this.ticks + this.sampleOffsetTicks);
            //console.log(pos.barsAsString);
            this.sampleOffsetMillis = pos.millis - this.millis;
            this.sampleOffset = this.sampleOffsetMillis/1000;
            //console.log(this.sampleOffsetMillis);
        }else if(this.sampleOffsetTicks === undefined){
            pos = this.song.getPosition('millis', this.millis + this.sampleOffsetMillis);
            this.sampleOffsetTicks = pos.ticks - this.ticks;
        }

        this.endTicks = this.ticks + this.durationTicks;
        this.endMillis = this.millis + this.durationMillis;
    };



    AudioEvent.prototype.stopSample = function(seconds){
        this.track.audio.stopSample(this, seconds);
    };


    AudioEvent.prototype.setSampleOffset = function(type, value){
        if(type === 'millis'){
            this.sampleOffsetMillis = value;
            this.sampleOffset = value/1000;
            this.durationTicks = undefined;
            if(this.song !== undefined){
                this.update();
            }
        }else if(type === 'ticks'){
            this.sampleOffsetTicks = value;
            this.sampleOffset = undefined;
            this.sampleOffsetMillis = undefined;
            if(this.song !== undefined){
                this.update();
            }
        }else{
            if(sequencer.debug >= sequencer.WARN){
                console.warn('you have to provide a type "ticks" or "millis" and a value');
            }
        }
    };


    AudioEvent.prototype.setDuration = function(type, value){
        if(type === 'millis'){
            this.durationMillis = value;
            this.duration = value/1000;
            this.durationTicks = undefined;
            if(this.song !== undefined){
                this.update();
            }
        }else if(type === 'ticks'){
            this.durationTicks = value;
            this.duration = undefined;
            this.durationMillis = undefined;
            if(this.song !== undefined){
                this.update();
            }
        }else{
            if(sequencer.debug >= sequencer.WARN){
                console.warn('you have to provide a type "ticks" or "millis" and a value');
            }
        }
    };


    AudioEvent.prototype.clone = AudioEvent.prototype.copy = function(){
        var event = new AudioEvent(),
            property;

        for(property in this){
            if(this.hasOwnProperty(property)){
                //console.log(property);
                if(property !== 'id' && property !== 'eventNumber'){
                    event[property] = this[property];
                }
                event.song = undefined;
                event.track = undefined;
                event.trackId = undefined;
                event.part = undefined;
                event.partId = undefined;
            }
        }
        return event;
    };


    // same as MidiEvent, could be inherited from generic Event
    AudioEvent.prototype.reset = function(fromPart, fromTrack, fromSong){

        fromPart = fromPart === undefined ? true : false;
        fromTrack = fromTrack === undefined ? true : false;
        fromSong = fromSong === undefined ? true : false;

        if(fromPart){
            this.part = undefined;
            this.partId = undefined;
        }
        if(fromTrack){
            this.track = undefined;
            this.trackId = undefined;
            this.channel = 0;
        }
        if(fromSong){
            this.song = undefined;
        }
    };



    // same as MidiEvent, could be inherited from generic Event
    AudioEvent.prototype.move = function(ticks){
        if(isNaN(ticks)){
            if(sequencer.debug >= 1){
                console.error('please provide a number');
            }
            return;
        }
        this.ticks += parseInt(ticks, 10);
        if(this.song !== undefined){
            this.update();
        }
        if(this.state !== 'new'){
            this.state = 'changed';
        }
        if(this.part !== undefined){
            this.part.needsUpdate = true;
        }
    };


    // same as MidiEvent, could be inherited from generic Event
    AudioEvent.prototype.moveTo = function(){
        var position = slice.call(arguments);
        //console.log(position);

        if(position[0] === 'ticks' && isNaN(position[1]) === false){
            this.ticks = parseInt(position[1], 10);
        }else if(this.song === undefined){
            if(sequencer.debug >= 1){
                console.error('The audio event has not been added to a song yet; you can only move to ticks values');
            }
        }else{
            position = this.song.getPosition(position);
            if(position === false){
                if(sequencer.debug >= 1){
                    console.error('wrong position data');
                }
            }else{
                this.ticks = position.ticks;
            }
        }

        if(this.song !== undefined){
            this.update();
        }
        if(this.state !== 'new'){
            this.state = 'changed';
        }
        if(this.part !== undefined){
            this.part.needsUpdate = true;
        }
    };


    sequencer.createAudioEvent = function(config){
        if(config.className === 'AudioEvent'){
            return config.clone();
        }
        return new AudioEvent(config);
    };


    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
    });

}());(function(){

    'use strict';

    var
        sequencer = window.sequencer,
        console = window.console,

        // import
        context, // defined in open_module.js
        encode64, // defined in util.js
        dispatchEvent, // defined in song_event_listener.js
        createWorker, // defined in audio_recorder_worker.js
        getWaveformData, //defined in util.js

        microphoneAccessGranted = null,
        localMediaStream,

        bufferSize = 8192,
        millisPerSample,
        bufferMillis,

        waveformConfig = {
            height: 200,
            width: 800,
            //density: 0.0001,
            sampleStep: 1,
            color: '#71DE71',
            bgcolor: '#000'
        };


    function AudioRecorder(track){
        this.track = track;
        this.song = track.song;
        this.audioEvents = {};
        this.callback = null; // callback after wav audio file of the recording has been created or updated
        this.worker = createWorker();
        this.waveformConfig = track.waveformConfig || waveformConfig;

        var scope = this;
        this.worker.onmessage = function(e){
            //createAudioBuffer(scope, e.data.wavArrayBuffer, e.data.interleavedSamples, e.data.planarSamples, e.data.id);
            encodeAudioBuffer(scope, e.data.wavArrayBuffer, e.data.interleavedSamples, e.data.id);
        };
    }


    function createAudioBuffer(scope, wavArrayBuffer, interleavedSamples, planarSamples, type){
        var
            i,
            frameCount = planarSamples.length,
            base64 = encode64(wavArrayBuffer),
            audioBuffer = context.createBuffer(1, frameCount, context.sampleRate),
            samples = audioBuffer.getChannelData(0),
            recording = {
                id: scope.recordId,
                audioBuffer: null,
                wavArrayBuffer: wavArrayBuffer,
                wav: {
                    blob: new Blob([new Uint8Array(wavArrayBuffer)], {type: 'audio/wav'}),
                    base64: base64,
                    dataUrl: 'data:audio/wav;base64,' + base64
                },
                waveform: {}
            };

        for(i = 0; i < frameCount; i++) {
             samples[i] = planarSamples[i];
        }
        recording.audioBuffer = audioBuffer;

        // keep a copy of the original samples for non-destructive editing
        if(type === 'new'){
            recording.planarSamples = planarSamples;
            recording.interleavedSamples = interleavedSamples;
        }else{
            recording.planarSamples = sequencer.storage.audio.recordings[scope.recordId].planarSamples;
            recording.interleavedSamples = sequencer.storage.audio.recordings[scope.recordId].interleavedSamples;
        }

        sequencer.storage.audio.recordings[scope.recordId] = recording;
        //console.log('create took', window.performance.now() - scope.timestamp);

        if(scope.callback !== null){
            scope.callback(recording);
            scope.callback = null;
        }
    }


    function encodeAudioBuffer(scope, wavArrayBuffer, interleavedSamples, type){
        //console.log(wavArrayBuffer, interleavedSamples, type);
        context.decodeAudioData(wavArrayBuffer, function(audioBuffer){
            var
                base64 = encode64(wavArrayBuffer),
                recording = {
                    id: scope.recordId,
                    audioBuffer: audioBuffer,
                    wavArrayBuffer: wavArrayBuffer,
                    wav: {
                        blob: new Blob([new Uint8Array(wavArrayBuffer)], {type: 'audio/wav'}),
                        base64: base64,
                        dataUrl: 'data:audio/wav;base64,' + base64
                    },
                    waveform: {}
                };

            // keep a copy of the original samples for non-destructive editing
            if(type === 'new'){
                recording.interleavedSamples = interleavedSamples;
            }else{
                recording.interleavedSamples = sequencer.storage.audio.recordings[scope.recordId].interleavedSamples;
            }

            // create waveform images
            getWaveformData(
                audioBuffer,
                scope.waveformConfig,
                //callback
                function(data){
                    recording.waveform = {dataUrls: data};
                    sequencer.storage.audio.recordings[scope.recordId] = recording;
                    //console.log('encode took', window.performance.now() - scope.timestamp);
                    if(scope.callback !== null){
                        scope.callback(recording);
                        scope.callback = null;
                    }
                }
            );

        }, function(){
            if(sequencer.debug >= sequencer.WARN){
                console.warn('no valid audiodata');
            }
        });
    }


    function record(callback){

        navigator.getUserMedia({audio: true},

            // successCallback
            function(stream) {
                microphoneAccessGranted = true;
                // localMediaStream is type of MediaStream that comes from microphone
                localMediaStream = stream;
                //console.log(localMediaStream.getAudioTracks());
                //console.log(localMediaStream.getVideoTracks());
                callback();
            },

            // errorCallback
            function(error) {
                if(sequencer.debug >= sequencer.WARN){
                    console.log(error);
                }
                microphoneAccessGranted = false;
                callback();
            }
        );
    }


    // this triggers the little popup in the browser where the user has to grant access to her microphone
    AudioRecorder.prototype.prepare = function(recordId, callback){
        var scope = this;

        this.recordId = recordId;

        if(microphoneAccessGranted === null){
            record(function(){
                callback(microphoneAccessGranted);
                if(localMediaStream !== undefined){
                    //scope.localMediaStream = localMediaStream.clone(); -> not implemented yet
                    scope.start();
                }
            });
        }else{
            callback(microphoneAccessGranted);
            if(localMediaStream !== undefined){
                //this.localMediaStream = localMediaStream.clone(); -> not implemented yet
                this.start();
            }
        }
    };


    AudioRecorder.prototype.start = function(){
        var scope = this,
            song = this.track.song;

        scope.worker.postMessage({
            command: 'init',
            sampleRate: context.sampleRate
        });

        this.scriptProcessor = context.createScriptProcessor(bufferSize, 1, 1);

        this.scriptProcessor.onaudioprocess = function(e){

            if(e.inputBuffer.numberOfChannels === 1){

                scope.worker.postMessage({
                    command: 'record_mono',
                    buffer: e.inputBuffer.getChannelData(0)
                });


            }else{

                scope.worker.postMessage({
                    command: 'record_stereo',
                    buffer:[
                        e.inputBuffer.getChannelData(0),
                        e.inputBuffer.getChannelData(1)
                    ]
                });
            }

            if(song.recording === false && song.precounting === false){
                scope.createAudio();
            }
        };

        this.sourceNode = context.createMediaStreamSource(localMediaStream);
        this.sourceNode.connect(this.scriptProcessor);
        this.scriptProcessor.connect(context.destination);
    };


    AudioRecorder.prototype.stop = function(callback){
        this.stopRecordingTimestamp = context.currentTime * 1000;
        this.timestamp = window.performance.now();
        if(this.sourceNode === undefined){
            callback();
            return;
        }
        this.callback = callback;
    };


    // create wav audio file after recording has stopped
    AudioRecorder.prototype.createAudio = function(){
        this.sourceNode.disconnect(this.scriptProcessor);
        this.scriptProcessor.disconnect(context.destination);
        this.scriptProcessor.onaudioprocess = null;
        this.sourceNode = null;
        this.scriptProcessors = null;

        // remove precount bars and latency
        var bufferIndexStart = parseInt((this.song.metronome.precountDurationInMillis + this.song.audioRecordingLatency)/millisPerSample),
            bufferIndexEnd = -1;

        this.worker.postMessage({
            command: 'get_wavfile',
            //command: 'get_wavfile2', // use this if you want to create the audio buffer instead of decoding it
            bufferIndexStart: bufferIndexStart,
            bufferIndexEnd: bufferIndexEnd
        });
    };


    // adjust latency for specific recording -> all audio events that use this audio data will be updated!
    // if you don't want that, please use AudioEvent.sampleOffset to adjust the starting point of the audio data
    AudioRecorder.prototype.setAudioRecordingLatency = function(recordId, value, callback){
        var bufferIndexStart = parseInt(value/millisPerSample),
            bufferIndexEnd = -1;

        this.callback = callback;
        this.worker.postMessage({
            command: 'update_wavfile',
            samples: sequencer.storage.audio.recordings[recordId].interleavedSamples,
            bufferIndexStart: bufferIndexStart,
            bufferIndexEnd: bufferIndexEnd
        });
    };


    AudioRecorder.prototype.cleanup = function(){
        if(localMediaStream === undefined){
            this.worker.terminate();
            return;
        }
        //this.localMediaStream.stop();
        this.scriptProcessor.disconnect();
        this.scriptProcessor.onaudioprocess = null;
        this.sourceNode.disconnect();
        this.scriptProcessor = null;
        this.sourceNode = null;
        this.worker.terminate();
    };


    sequencer.protectedScope.createAudioRecorder = function(track){
        if(sequencer.record_audio === false){
            return false;
        }
        return new AudioRecorder(track);
    };


    sequencer.protectedScope.addInitMethod(function(){
        encode64 = sequencer.util.encode64;
        context = sequencer.protectedScope.context;
        getWaveformData = sequencer.getWaveformData;
        createWorker = sequencer.protectedScope.createAudioRecorderWorker;
        millisPerSample = (1/context.sampleRate) * 1000;
        dispatchEvent = sequencer.protectedScope.songDispatchEvent;
        bufferMillis = bufferSize * millisPerSample;
    });

}());


/*
    // real-time waveform rendering, not implemented
    AudioRecorder.prototype.drawCanvas = function(amplitudeArray, column){
        var minValue = 9999999;
        var maxValue = 0;
        var canvasHeight = 100;
        var canvasWidth = 1000;

        for (var i = 0; i < amplitudeArray.length; i++) {
            var value = amplitudeArray[i] / 256;
            if(value > maxValue) {
                maxValue = value;
            } else if(value < minValue) {
                minValue = value;
            }
        }

        var y_lo = canvasHeight - (canvasHeight * minValue) - 1;
        var y_hi = canvasHeight - (canvasHeight * maxValue) - 1;

        this.context2d.fillStyle = '#ffffff';
        this.context2d.fillRect(column, y_lo, 1, y_hi - y_lo);
    };
*/



/*
            getWaveformImageUrlFromBuffer(
                audioBuffer,

                {
                    height: 200,
                    //density: 0.0001,
                    width: 800,
                    sampleStep: 1,
                    // density: 0.5,
                    color: '#71DE71',
                    bgcolor: '#000',
                    samples: samples
                },

                //callback
                function(urls){
                    var image, images = [],
                        i, maxi = urls.length;

                    // create html image instances from the data-urls
                    for(i = 0; i < maxi; i++){
                        image = document.createElement('img');
                        image.src = urls[i];
                        image.origWidth = image.width;
                        image.height = 100;
                        images.push(image);
                    }

                    recording.waveform.images = images;
                    recording.waveform.dataUrls = urls;

                    sequencer.storage.audio.recordings[scope.recordId] = recording;
                    console.log('took', window.performance.now() - scope.timestamp);
                    if(scope.callback !== null){
                        scope.callback(recording);
                        scope.callback = null;
                    }
                }
            );
*/
(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console;


    function createWorker(){

        var
            data,
            bufferIndexStart,
            bufferIndexEnd,
            planarSamples,
            interleavedSamples,
            numFrames,
            recBuffersLeft,
            recBuffersRight,
            sampleRate,
            numberOfChannels;

        self.onmessage = function(e){
            switch(e.data.command){
                case 'init':
                    sampleRate = e.data.sampleRate;
                    numFrames = 0;
                    recBuffersLeft = [];
                    recBuffersRight = [];
                    break;
                case 'record_mono':
                    numberOfChannels = 1;
                    recBuffersLeft.push(e.data.buffer);
                    numFrames += e.data.buffer.length;
                    break;
                case 'record_stereo':
                    numberOfChannels = 2;
                    recBuffersLeft.push(e.data.buffer[0]);
                    recBuffersRight.push(e.data.buffer[1]);
                    numFrames += e.data.buffer[0].length;
                    break;
                case 'get_wavfile':
                    bufferIndexStart = e.data.bufferIndexStart;
                    bufferIndexEnd = e.data.bufferIndexEnd;
                    data = {
                        id: 'new',
                        wavArrayBuffer: getWavFile(),
                        interleavedSamples: interleavedSamples
                    };
                    self.postMessage(data, [data.wavArrayBuffer, data.interleavedSamples.buffer]);
                    /*
                    // funny: this is something different
                    data = {
                        id: 'new',
                        wavArrayBuffer: getWavFile(),
                        interleavedSamples: interleavedSamples.buffer
                    };
                    self.postMessage(data, [data.wavArrayBuffer, data.interleavedSamples]);
                    */
                    break;
                case 'get_wavfile2':
                    bufferIndexStart = e.data.bufferIndexStart;
                    bufferIndexEnd = e.data.bufferIndexEnd;
                    data = getWavFile2();
                    data.id = 'new';
                    self.postMessage(data, [data.planarSamples, data.interleavedSamples, data.wavArrayBuffer]);
                    break;
                case 'update_wavfile':
                    bufferIndexStart = e.data.bufferIndexStart;
                    bufferIndexEnd = e.data.bufferIndexEnd;
                    //interleavedSamples = new Float32Array(e.data.samples);
                    interleavedSamples = e.data.samples;
                    data = {
                        id: 'update',
                        wavArrayBuffer: updateWavFile()
                    };
                    self.postMessage(data, [data.wavArrayBuffer]);
                    break;
            }
        };


        function getWavFile(){
            var dataview, i, index = 0, result;

            if(numberOfChannels === 1){
                interleavedSamples = mergeBuffers(recBuffersLeft, numFrames);
            }else if(numberOfChannels === 2){
                interleavedSamples = toInterleavedBuffer(
                    mergeBuffers(recBuffersLeft, numFrames),
                    mergeBuffers(recBuffersRight, numFrames)
                );
            }

            //console.log('1:' + interleavedSamples.length);
            if(bufferIndexEnd > 0 || bufferIndexStart > 0){
                if(bufferIndexEnd === -1){
                    bufferIndexEnd = interleavedSamples.length;
                }

                result = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);

                for(i = bufferIndexStart; i < bufferIndexEnd; i++){
                    result[index++] = interleavedSamples[i];
                }
                interleavedSamples = result;
            }
            //console.log('2:' + interleavedSamples.length);

            dataview = encodeWAV(interleavedSamples);
            return dataview.buffer;
        }


        function updateWavFile(){
            var dataview, i, result, index = 0;
            //console.log(bufferIndexStart + ':' + interleavedSamples);

            if(bufferIndexEnd === -1){
                bufferIndexEnd = interleavedSamples.length;
            }
            result = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);
            for(i = bufferIndexStart; i < bufferIndexEnd; i++){
                result[index++] = interleavedSamples[i];
            }
            dataview = encodeWAV(result);
            return dataview.buffer;
        }


        function mergeBuffers(recBuffers, numFrames){
            var result = new Float32Array(numFrames);
            var offset = 0;
            for (var i = 0, maxi = recBuffers.length; i < maxi; i++){
                result.set(recBuffers[i], offset);
                offset += recBuffers[i].length;
            }
            return result;
        }


        function toInterleavedBuffer(inputL, inputR){
            var length = inputL.length + inputR.length,
                result = new Float32Array(length),
                index = 0,
                inputIndex = 0;

            while(index < length){
                result[index++] = inputL[inputIndex];
                result[index++] = inputR[inputIndex];
                inputIndex++;
            }
            return result;
        }


        function toPlanarBuffer(inputL, inputR){
            var length = inputL.length,
                result = new Float32Array(length * 2),
                index = 0,
                inputIndex = 0;

            while(index < length){
                result[index++] = inputL[inputIndex++];
            }

            index = 0;
            while(index < length){
                result[index++] = inputR[inputIndex++];
            }
            return result;
        }


        function floatTo16BitPCM(output, offset, input){
            for (var i = 0; i < input.length; i++, offset+=2){
                var s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        }


        function writeString(view, offset, string){
            for (var i = 0; i < string.length; i++){
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }


        // see: https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
        // samples is a Float32Array
        function encodeWAV(samples){
            var bitsPerSample = 16,
                bytesPerSample = bitsPerSample/8,
                buffer = new ArrayBuffer(44 + samples.length * bytesPerSample),
                view = new DataView(buffer);

            /* RIFF identifier */
            writeString(view, 0, 'RIFF');
            /* RIFF chunk length */
            view.setUint32(4, 36 + samples.length * bytesPerSample, true);
            /* RIFF type */
            writeString(view, 8, 'WAVE');
            /* format chunk identifier */
            writeString(view, 12, 'fmt ');
            /* format chunk length */
            view.setUint32(16, 16, true);
            /* sample format (raw) */
            view.setUint16(20, 1, true);
            /* channel count */
            view.setUint16(22, numberOfChannels, true);
            /* sample rate */
            view.setUint32(24, sampleRate, true);
            /* byte rate (sample rate * block align) */
            view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
            /* block align (channel count * bytes per sample) */
            view.setUint16(32, numberOfChannels * bytesPerSample, true);
            /* bits per sample */
            view.setUint16(34, bitsPerSample, true);
            /* data chunk identifier */
            writeString(view, 36, 'data');
            /* data chunk length */
            view.setUint32(40, samples.length * bytesPerSample, true);

            floatTo16BitPCM(view, 44, samples);

            return view;
        }


        function getWavFile2(){
            var dataview, i, index = 0,
                resultLeft, resultRight,
                mergedBuffersLeft, mergedBuffersRight;

            if(numberOfChannels === 1){
                mergedBuffersLeft = mergeBuffers(recBuffersLeft, numFrames);
            }else if(numberOfChannels === 2){
                mergedBuffersLeft = mergeBuffers(recBuffersLeft, numFrames);
                mergedBuffersRight = mergeBuffers(recBuffersRight, numFrames);
            }

            //console.log('1:' + mergedBufferLeft.length);
            if(bufferIndexEnd > 0 || bufferIndexStart > 0){
                if(bufferIndexEnd === -1){
                    bufferIndexEnd = mergedBuffersLeft.length;
                }

                resultLeft = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);
                if(numberOfChannels === 2){
                    resultRight = new Float32Array(bufferIndexEnd - bufferIndexStart + 1);
                }

                for(i = bufferIndexStart; i < bufferIndexEnd; i++){
                    resultLeft[index] = mergedBuffersLeft[i];
                    if(numberOfChannels === 2){
                        resultRight = mergedBuffersRight[i];
                    }
                    index++;
                }
            }
            //console.log('2:' + mergedBufferLeft.length);

            if(numberOfChannels === 1){
                planarSamples = mergedBuffersLeft;
                interleavedSamples = new Float32Array(numFrames);
                //planarSamples.copyWithin(interleavedSamples, 0);
                for(i = 0; i < numFrames; i++){
                    interleavedSamples[i] = planarSamples[i];
                }
            }else if(numberOfChannels === 2){
                planarSamples = toPlanarBuffer(mergedBuffersLeft, mergedBuffersRight);
                interleavedSamples = toInterleavedBuffer(mergedBuffersLeft, mergedBuffersRight);
            }

            dataview = encodeWAV(interleavedSamples);

            return {
                planarSamples: planarSamples.buffer,
                interleavedSamples: interleavedSamples.buffer,
                wavArrayBuffer: dataview.buffer
            };
        }

    }


    sequencer.protectedScope.createAudioRecorderWorker = function(){
        var blobURL = URL.createObjectURL(new Blob(['(', createWorker.toString(), ')()'], {type: 'application/javascript'}));
        return new Worker(blobURL);
    };

}());/*
    controls the playback of the audio events in a track
*/
(function(){

    'use strict';

    var
        console = window.console,
        sequencer = window.sequencer,
        slice = Array.prototype.slice,

        //import
        typeString, // → defined in utils.js
        createAudioRecorder, // → defined in audio_recorder.js

        unscheduleCallback,
        AudioTrack;


    AudioTrack = function(track){
        this.track = track;
        this.className = 'AudioTrack';
        this.scheduledSamples = {};
        this.recorder = createAudioRecorder(track);
    };


    unscheduleCallback = function(sample){
        //console.log(sample.id, 'has been unscheduled');
        delete this.scheduledSamples[sample.id];
        sample = null;
    };


    AudioTrack.prototype.setAudioRecordingLatency = function(recordId, value, callback){
        this.recorder.setAudioRecordingLatency(recordId, value, callback);
    };


    AudioTrack.prototype.processEvent = function(audioEvent){
        var sample = sequencer.createSample({buffer: audioEvent.buffer, track: audioEvent.track});
        audioEvent.sample = sample;
        //console.log(audioEvent.sampleOffset, audioEvent.playheadOffset, audioEvent.latencyCompensation);
        audioEvent.offset = audioEvent.sampleOffset + audioEvent.playheadOffset;// + audioEvent.latencyCompensation;
        //audioEvent.time -= audioEvent.latencyCompensation;
        // set playheadOffset to 0 after the event has been scheduled
        audioEvent.playheadOffset = 0;
        //sample.start(audioEvent.time/1000, 127, audioEvent.offsetMillis/1000, audioEvent.durationMillis/1000);

        sample.start(audioEvent);
        //console.log(time, time + audioEvent.durationMillis/1000);
        //sample.stop(time + audioEvent.durationMillis/1000, function(){});

        this.scheduledSamples[sample.id] = sample;
    };

/*
    AudioTrack.prototype.playEvent = function(audioEvent, seconds){
    };
*/

    AudioTrack.prototype.stopSample = function(audioEvent, seconds){
        //console.log('stopping', audioEvent.id);
        if(audioEvent.sample === undefined){
            return;
        }
        audioEvent.sample.stop(seconds, unscheduleCallback.bind(this));
    };


    AudioTrack.prototype.allNotesOff = function(){
        var sampleId, sample,
            scheduledSamples = this.scheduledSamples;

        for(sampleId in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(sampleId)){
                //console.log('allNotesOff', sampleId);
                sample = scheduledSamples[sampleId];
                if(sample){
                    sample.unschedule(0, unscheduleCallback.bind(this));
                }
            }
        }
        this.scheduledSamples = {};
    };


    AudioTrack.prototype.prepareForRecording = function(recordId, callback){
        if(this.recorder === false){
            return false;
        }
        this.recorder.prepare(recordId, callback);
    };


    AudioTrack.prototype.stopRecording = function(callback){
        this.recorder.stop(function(recording){
            callback(recording);
        });
    };

    sequencer.protectedScope.createAudioTrack = function(track){
        return new AudioTrack(track);
    };


    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
        createAudioRecorder = sequencer.protectedScope.createAudioRecorder;
    });

}());
// Sample.source -> gain (midiEvent.velocity) ->
// Track.input -> [FX input ~~ FX output] -> Track.panner (Track.setPanning())-> Track.output (Track.setVolume())
// Song.gain (Song.setVolume()) ->
// Sequencer.gain (sequencer.setMasterVolume()) -> Sequencer.compressor -> context.destiny

(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        id = 0,
        context,

        zeroValue = 0.00000000000000001,

        createClass, // defined in util.js
        getSample, // defined in instrument_manager.js

        Reverb,
        Panner,
        Panner2,
        Delay,
        BiQuadFilter,
        Compressor;


    function Effect(config){
        this.id = 'FX' + id++ + '' + new Date().getTime();
        this.type = config.type;
        this.buffer = config.buffer;
        this.config = config;

        this.bypass = false;
        this.amount = 0;//0.5;

        this.output = context.createGainNode();
        this.wetGain = context.createGainNode();
        this.dryGain = context.createGainNode();
        this.output.gain.value = 1;
        this.wetGain.gain.value = this.amount;
        this.dryGain.gain.value = 1 - this.amount;
    }


    Effect.prototype.setInput = function(input){
        // input.connect(this.node);
        // return;

        // dry channel
        input.connect(this.dryGain);
        this.dryGain.connect(this.output);

        // wet channel
        input.connect(this.node);
        this.node.connect(this.wetGain);
        this.wetGain.connect(this.output);
    };

/*
    Effect.prototype.setOutput = function(output){
        this.output.disconnect(0);
        this.output.connect(output);
    };
*/

    Effect.prototype.setAmount = function(value){
        /*
        this.amount = value < 0 ? 0 : value > 1 ? 1 : value;
        var gain1 = Math.cos(this.amount * 0.5 * Math.PI),
            gain2 = Math.cos((1.0 - this.amount) * 0.5 * Math.PI);
        this.gainNode.gain.value = gain2 * this.ratio;
        */

        this.amount = value < 0 ? 0 : value > 1 ? 1 : value;
        this.wetGain.gain.value = this.amount;
        this.dryGain.gain.value = 1 - this.amount;
        //console.log('wet',this.wetGain.gain.value,'dry',this.dryGain.gain.value);
    };


    Effect.prototype.copy = function(){
        switch(this.type){
            case 'reverb':
                return new Reverb(this.config);
            case 'panner':
                return new Panner(this.config);
            case 'panner2':
                return new Panner2(this.config);
            case 'delay':
                return new Delay(this.config);
            case 'compressor':
                return new Compressor(this.config);
        }
    };


    sequencer.createReverb = function(id){
        var buffer = getSample(id);
        if(buffer === false){
            console.warn('no reverb with id', id, 'loaded');
            return false;
        }
        var config = {
            type: 'reverb',
            buffer: buffer
        };
        return new Reverb(config);
    };


    sequencer.createPanner = function(config){
        config = config || {};
        config.type = 'panner';
        return new Panner(config);
    };


    sequencer.createPanner2 = function(config){
        config = config || {};
        config.type = 'panner2';
        return new Panner2(config);
    };


    sequencer.createDelay = function(config){
        config = config || {};
        config.type = 'delay';
        return new Delay(config);
    };


    sequencer.createCompressor = function(config){
        config = config || {};
        config.type = 'compressor';
        return new Compressor(config);
    };


    sequencer.createBiQuadFilter = function(config){
        config = config || {};
        config.type = 'biquadfilter';
        return new BiQuadFilter(config);
    };


    sequencer.protectedScope.addInitMethod(function(){
        context = sequencer.protectedScope.context;
        createClass = sequencer.protectedScope.createClass;
        getSample = sequencer.getSample;

        Reverb = createClass(Effect, function(config){
            this.node = context.createConvolver();
            this.node.buffer = config.buffer;
            //console.log(this.node.buffer);
        });

        Panner = createClass(Effect, function(config){
            this.node = context.createPanner();
            this.node.panningModel = 'equalpower';
            this.node.setPosition(zeroValue, zeroValue, zeroValue);
        });

        Panner2 = createClass(Effect, function(config){
            this.node = context.createPanner();
            this.node.panningModel = 'HRTF';
            this.node.setPosition(zeroValue, zeroValue, zeroValue);
        });

        Delay = createClass(Effect, function(config){
            this.node = context.createDelay();
            this.node.delayTime.value = 0.3;
        });

        Compressor = createClass(Effect, function(config){
            this.node = context.createDynamicsCompressor();
        });


        BiQuadFilter = createClass(Effect, function(config){
            this.node = context.createBiquadFilter();
            this.node.type = 0;
            this.node.Q.value = 4;
            this.node.frequency.value = 1600;
        });

        /*
        Panner.prototype.setPosition = function(x, y, z){
            var multiplier = 5;
            console.log(x * multiplier);
            this.node.setPosition(x * multiplier, y * multiplier, z * multiplier);
        };
        */

        Panner.prototype.setPosition = function(value){
            var x = value,
                y = 0,
                z = 1 - Math.abs(x);

            x = x === 0 ? zeroValue : x;
            y = y === 0 ? zeroValue : y;
            z = z === 0 ? zeroValue : z;
            this.node.setPosition(x, y, z);
            //console.log(1,x,y,z);
        };

        Panner2.prototype.setPosition = function(value){
            var xDeg = parseInt(value),
                zDeg = xDeg + 90,
                x, y, z;
            if (zDeg > 90) {
                zDeg = 180 - zDeg;
            }
            x = Math.sin(xDeg * (Math.PI / 180));
            y = 0;
            z = Math.sin(zDeg * (Math.PI / 180));
            x = x === 0 ? zeroValue : x;
            y = y === 0 ? zeroValue : y;
            z = z === 0 ? zeroValue : z;
            this.node.setPosition(x, y, z);
            //console.log(2,x,y,z);
        };

        Delay.prototype.setTime = function(value){
            this.node.delayTime.value = value;
        };

    });
}());


/*

        // only reverb is currently supported, filter out reverb
        if(this.numEffects > 0){
            for(i in this.effects){
                if(this.effects.hasOwnProperty(i)){
                   effect = this.effects[i];
                   if(this.reverb === undefined && effect.type === 'reverb'){
                        this.reverb = effect;
                        break;
                   }
                }
            }
            this.source.connect(this.reverb.node);
            this.reverb.node.disconnect(0);
            this.reverb.node.connect(this.wetGain);
            this.wetGain.gain.value = this.reverb.amount;
            this.dryGain.gain.value = (1 - this.reverb.amount);
        }else{
            this.dryGain.gain.value = 1;
        }


*/



/*

    operators:

    - max
    - min
    - avg
    - all


    eventStats.get('noteNumber max');
    eventStats.get('noteNumber min');
    eventStats.get('noteNumber avg');

    eventStats.get('data2 max type = PITCH_BEND');
    eventStats.get('data2 min');
    eventStats.get('data2 avg');

    eventStats.get('velocity avg bar = 3');

    eventStats.get('velocity max musical_time > 1,1,1,0 < 8,1,1,0');


    return {
        min: min,
        max: max,
        avg: avg
    };


    implementation:

    song.getStats(searchString);
    track.getStats(searchString);
    sequencer.getStats(events, searchString);


*/

(function(){

    'use strict';

    var
        //import
        createNote = sequencer.createNote, // → defined in note.js
        findEvent = sequencer.findEvent, // → defined in find_event.js
        round = sequencer.protectedScope.round, // → defined in util.js
        getEvents = sequencer.protectedScope.getEvents, // → defined in find_event.js
        typeString = sequencer.protectedScope.typeString, // → defined in util.js

        supportedOperators = 'max min avg all',
        supportedProperties = 'data1 data2 velocity noteNumber noteName frequency',

        //public
        getStats;


    /**
        @memberof sequencer
        @instance
        @param {array} events
        @param {string} searchString
        @description Get statistics of an array of events, see [documentation]{@link http://heartbeatjs.org/docs/statistics}
    */
    getStats = function(){
        var args = Array.prototype.slice.call(arguments),
            numArgs = args.length,
            property,
            operator,
            events,
            searchPattern,
            patternLength,
            i,maxi,event,propValue,
            minNoteName,
            maxNoteName,
            min = 128,//Number.MAX_VALUE,
            max = -1,
            sum = 0,
            avg = 0,
            useNoteName = false;


        events = getEvents(args[0]);

        if(events.length === 0){
            //console.warn('getStats: no events');
            return -1;
        }

        searchPattern = args[1];

        if(typeString(searchPattern) !== 'string'){
            console.error('please provide a search string like for instance get(\'velocity max bar >= 1 < 8\')');
            return -1;
        }

        if(numArgs > 2){
            console.warn('ignoring invalid arguments, please consult documentation');
        }

        searchPattern = searchPattern.split(' ');
        patternLength = searchPattern.length;

        property = searchPattern[0];
        operator = searchPattern[1];

        if(supportedProperties.indexOf(property) === -1){
            console.error('you can\'t use \'min\', \'max\' or \'avg\'', 'on the property', property);
            return -1;
        }

        if(supportedOperators.indexOf(operator) === -1){
            console.error(operator, 'is not a valid operator');
            return -1;
        }


        if(patternLength > 2){

            //if(patternLength !== 5 && !(patternLength >= 7)){
            if(patternLength === 6){
                console.warn('ignoring cruft found in search string, please consult documentation');
            }

            searchPattern.shift(); // remove property
            searchPattern.shift(); // remove operator

            //filter events
            events = findEvent(events, searchPattern.join(' '));
        }

        //console.log(events);

        if(property === 'noteName'){
            property = 'noteNumber';
            useNoteName = true;
        }

        for(i = 0, maxi = events.length; i < maxi; i++){
            event = events[i];
            propValue = event[property];

            if(propValue > max){
                //console.log('max', propValue, max);
                max = propValue;
                maxNoteName = event.noteName;
            }
            if(propValue < min){
                //console.log('min', propValue, min);
                min = propValue;
                minNoteName = event.noteName;
            }

            if(propValue !== undefined){
                sum += propValue;
            }
        }

        avg = sum/maxi;

        if(useNoteName){
            avg = round(avg);
            avg = createNote(avg).name;
            min = minNoteName;
            max = maxNoteName;
        }

        if(operator === 'max'){
            return max;
        }

        if(operator === 'min'){
            return min;
        }

        if(operator === 'avg'){
            return avg;
        }

        if(operator === 'all'){
            return {
                min:min,
                max:max,
                avg:avg
            };
        }
    };


    sequencer.getStats = getStats;

    sequencer.protectedScope.addInitMethod(function(){
        createNote = sequencer.createNote;
        findEvent = sequencer.findEvent;
        round = sequencer.protectedScope.round;
        getEvents = sequencer.protectedScope.getEvents;
        typeString = sequencer.protectedScope.typeString;
    });

}());(function(){

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
			'barsbeats': ['bar','beat','sixteenth','tick'],
			'time': ['hour','minute','second','millisecond']
		},

		logicalOperators = 'OR AND NOT XOR',
		logicalOperatorsRegex = new RegExp(' ' + logicalOperators.replace(/\s+/g,' | ') + ' '),// → replaces logical operator by a white space

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


	findEvent = function(){
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

		if(events.length === 0){
			console.warn('findEvent: no events');
			return results;
		}

		if(typeString(args[1]) !== 'string'){
			console.error('please provide a search string like for instance findEvent(\'beat = 2 AND velocity > 60 < 100\');');
			return results;
		}

		searchString = args[1];

		//get the operators
		tmp = searchString.split(' ');
		maxi = tmp.length;
		operators = [];

		for(i = 0; i < maxi; i++){
			operator = tmp[i];
			if(logicalOperatorsRegex.test(' ' + operator + ' ')){
				operators.push(operator);
			}
		}

		//get the patterns
		tmp = searchString.split(logicalOperatorsRegex);
		maxi = tmp.length;
		patterns = [];

		for(i = 0; i < maxi; i++){
			createPattern(tmp[i].split(' '));
		}

		//start loop over events
		maxi = patterns.length;
		patternIndex = 0;
		operatorIndex = -1;

		for(i = 0; i < maxi; i++){

			pattern = patterns[patternIndex++];
			operator = operators[operatorIndex++];
			//console.log(operator,pattern,patternIndex,results.length);


			if(operator === 'AND'){
				// perform search on the results of the former search
				results = performSearch(results,pattern);

			}else if(operator === 'NOT'){
				// perform search on the results of the former search
				results = performSearch(results,pattern,true);

			}else if(operator === 'XOR'){
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
				subResult1 = performSearch(events,pattern);
				//and then remove all events that match both all previous patterns and the current pattern
				results = removeMutualEvents(results,subResult1);

			}else{

				lastResult = performSearch(events,pattern);
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


	removeMutualEvents = function(resultSet1,resultSet2){
		var i,maxi = resultSet1.length,
			j,maxj = resultSet2.length,
			event,eventId,addEvent,
			result = [];

		for(i = 0; i < maxi; i++){

			addEvent = true;

			event = resultSet1[i];
			eventId = event.id;

			for(j = 0; j < maxj; j++){

				if(resultSet2[j].id === eventId){
					addEvent = false;
					break;
				}
			}

			if(addEvent){
				result.push(event);
			}
		}

		for(j = 0; j < maxj; j++){

			addEvent = true;

			event = resultSet2[j];
			eventId = event.id;

			for(i = 0; i < maxi; i++){

				if(resultSet1[i].id === eventId){
					addEvent = false;
					break;
				}
			}

			if(addEvent){
				result.push(event);
			}
		}

		return result;
	};


	removeDoubleEvents = function(events){
		var i,maxi = events.length,
			event,eventId,lastId,
			result = [];

		events.sort(function(a,b){
			return a.eventNumber - b.eventNumber;
		});

		for(i = 0; i < maxi; i++){
			event = events[i];
			eventId = event.id;
			if(eventId !== lastId){
				result.push(event);
			}
			lastId = eventId;
		}
		return result;
	};


	performSearch = function(events,pattern,inverse){
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

		if(inverse){
			operator1 = inverseOperator(operator1);
			operator2 = inverseOperator(operator2);
		}


		for(i = 0; i < numEvents; i++){

			event = events[i];
			condition = checkCondition(property, event[property], operator1, value1, operator2, value2);

			if(condition){
				searchResult.push(event);
			}
		}

		return searchResult;
	};


	checkCondition = function(property,propValue,operator1,value1,operator2,value2){
		var result = false,
			isString = false;


		if(propValue === undefined){
			return result;
		}


		switch(property){

			case 'noteName':
				if(operator1 === '='){
					//this situation occurs if you search for the first letter(s) of an note name, e.g C matches C#, C##, Cb and Cbb
					if(value1.length === 3 && propValue.length === 4){
						result = propValue.indexOf(value1) === 0;
					}else if(value1.length === 4 && propValue.length === 5){
						result = propValue.indexOf(value1) === 0;
					}
					return result;
				}
				break;

			case 'type':
				if(typeString(value1) !== 'number' && isNaN(value1)){
					value1 = midiEventNumberByName(value1);
				}
				break;

			case 'bar':
			case 'beat':
			case 'sixteenth':
				//propValue += 1;
				break;
		}


		if(typeString(propValue) === 'string'){

			if(typeString(value1) !== 'string'){
				value1 = '\'' + value1 + '\'';
			}
			if(value2 && typeString(value2) !== 'string'){
				value2 = '\'' + value2 + '\'';
			}
			isString = true;

		}else if(typeString(propValue) === 'number'){

			if(typeString(value1) !== 'number'){
				value1 = parseInt(value1);//don't use a radix because values can be both decimal and hexadecimal!
			}
			if(value2 && typeString(value2) !== 'number'){
				value2 = parseInt(value2);
			}
		}


		switch(operator1){

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
				if(isString){
					result = false;
				}else{
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
				if(isString){
					result = true;
				}else{
					result = !(propValue % value1 === 0);
				}
				break;


			case '!=':
			case '!==':
				if(isString){
					result = propValue.indexOf(value1) === -1;
				}else{
					result = propValue !== value1;
				}
				break;

			case '>':
				if(operator2){
					result = checkCondition2(propValue,operator1,value1,operator2,value2);
				}else{
					result = propValue > value1;
				}
				break;

			case '>=':
				if(operator2){
					result = checkCondition2(propValue,operator1,value1,operator2,value2);
				}else{
					result = propValue >= value1;
				}
				break;

			case '<':
				if(operator2){
					result = checkCondition2(propValue,operator1,value1,operator2,value2);
				}else{
					result = propValue < value1;
				}
				break;

			case '<=':
				if(operator2){
					result = checkCondition2(propValue,operator1,value1,operator2,value2);
				}else{
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


	checkCondition2 = function(propValue,operator1,value1,operator2,value2){

		var result = false;

		switch(operator1){

			case '>':

				switch(operator2){
					case '<':
						result = propValue > value1 && propValue < value2;
						break;
					case '<=':
						result = propValue > value1 && propValue <= value2;
						break;

				}
				break;

			case '>=':

				switch(operator2){
					case '<':
						result = propValue >= value1 && propValue < value2;
						break;
					case '<=':
						result = propValue >= value1 && propValue <= value2;
						break;

				}
				break;

			case '<':

				switch(operator2){
					case '>':
						result = propValue < value1 || propValue > value2;
						break;
					case '>=':
						result = propValue < value1 || propValue >= value2;
						break;

				}
				break;

			case '<=':

				switch(operator2){
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


	getEvents = function(obj){
		var i, numTracks, tracks, events = [];

		if(typeString(obj) === 'array'){
			events = obj;
		}else if(obj.className === undefined){
			console.warn(obj);
		}else if(obj.className === 'Track' || obj.className === 'Part'){
			events = obj.events;

		}else if(obj.className === 'Song'){
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


	createPattern = function(args){
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

		if(supportedProperties[property] !== 1){
			console.error(property, 'is not a supported property');
			return false;
		}


		pattern = checkOperators(pattern);


		if(property === 'barsbeats' || property === 'time'){
			value1 = checkValue(value1,property);
			//console.log(value1);
			for(i = 0; i < 4; i++){
				pattern = {};
				pattern.property = properties[property][i];
				pattern.operator1 = operator1;
				pattern.value1 = value1[i];
				patterns.push(pattern);
				operators.push('AND');
			}
			operators.pop();

			if(value2){
				value2 = checkValue(value2,property);
				for(i = 0; i < 4; i++){
					pattern = {};
					pattern.property = properties[property][i];
					pattern.operator2 = operator2;
					pattern.value2 = value2[i];
					patterns.push(pattern);
					operators.push('AND');
				}
				operators.pop();
			}
		}else{
			patterns.push(pattern);
		}
	};


	checkValue = function(value,type){
		//if the value is provided in array notation strip the brackets
		value = value.replace(/(\[|\])/g,'');

		if(typeString(value) !== 'array'){
			if(type === 'barsbeats'){
				if(value.indexOf(',') === -1){
					value = [value,1,1,0];
				}else{
					value = value.split(',');
				}
			}else if(type === 'time'){
				if(value.indexOf(',') === -1){
					value = [0,value,0,0];
				}else{
					value = value.split(',');
				}
			}
		}

		switch(value.length){
			case 1:
				if(type === 'barsbeats'){
					value.push(1,1,0);
				}else if(type === 'time'){
					value.push(0,0,0);
				}
				break;

			case 2:
				if(type === 'barsbeats'){
					value.push(1,0);
				}else if(type === 'time'){
					value.push(0,0);
				}
				break;

			case 3:
				value.push(0);
				break;
		}

		return value;
	};


	checkOperators = function(pattern){

		var operator1 = pattern.operator1,
			operator2 = pattern.operator2,
			check = function(operator){
				if(operator === '<' || operator === '>' || operator === '<=' || operator === '>='){
					return true;
				}
				return false;
			},
			check2 = function(operator){
				if(operator === '=' || operator === '==' || operator === '==='){
					return true;
				}
				return false;
			};


		if(pattern.property === 'noteName' && (check(operator1) || check2(operator1))){
			pattern.property = 'noteNumber';
			pattern.value1 = createNote(pattern.value1).number;
		}

		if(pattern.property === 'noteName' && (check(operator2) || check2(operator2))){
			pattern.property = 'noteNumber';
			pattern.value2 = createNote(pattern.value2).number;
		}

		// second operator is wrong, remove it
		if(check(operator1) && !check(operator2)){
			delete pattern.operator2;
			delete pattern.value2;
		}

		return pattern;
	};


	inverseOperator = function(operator){
		var inversedOperator;

		switch(operator){
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


	findNote = function(){
		var results = findEvent.apply(this,arguments),
			numEvents = results.length,
			i, event,
			noteOnEvent, noteOnEvents = {},
			tmp, resultsFiltered = [];

		// loop over all events and filter the note on events that have a matching note off event
		for(i = 0; i < numEvents; i++){
			event = results[i];

			if(event.type === sequencer.NOTE_ON){

				if(noteOnEvents[event.noteNumber] === undefined){
					noteOnEvents[event.noteNumber] = [];
				}
				noteOnEvents[event.noteNumber].push(event);

			}else if(event.type === sequencer.NOTE_OFF){

				tmp = noteOnEvents[event.noteNumber];
				if(tmp){
					noteOnEvent = tmp.shift();
					resultsFiltered.push(createMidiNote(noteOnEvent,event));
					//resultsFiltered.push(noteOnEvent);
					//resultsFiltered.push(event);
				}
				if(tmp.length === 0){
					delete noteOnEvents[event.noteNumber];
				}
			}
		}

		// put the events back into the right order
		resultsFiltered.sort(function(a,b){
			return a.sortIndex - b.sortIndex;
		});

		return resultsFiltered;
	};

	sequencer.findEvent = findEvent;
	sequencer.findNote = findNote;
	//sequencer.removeMutualEvents = removeMutualEvents;
	sequencer.protectedScope.getEvents = getEvents;

	sequencer.protectedScope.addInitMethod(function(){
		createNote = sequencer.createNote;
		typeString = sequencer.protectedScope.typeString;
		createMidiNote = sequencer.createMidiNote;
		midiEventNumberByName = sequencer.midiEventNumberByName;
	});

}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        debug = sequencer.debug,

        //import
        context, // → defined in open_module.js
        storage, // → defined in open_module.js
        timedTasks, // → defined in open_module.js
        repetitiveTasks, // → defined in open_module.js
        findItem, // → defined in utils.js
        storeItem, // → defined in utils.js
        typeString, // → defined in utils.js
        pathToArray, // → defined in utils.js
        //createClass, // → defined in utils.js
        isEmptyObject, // → defined in utils.js
        objectForEach, // → defined in utils.js
        createSample, // → defined in sample.js
        createReverb, // → defined in effects.js
        dispatchEvent, // → defined in song.js
        remap, // defined in util.js
        round, // defined in util.js
        getEqualPowerCurve, // defined in util.js
        transpose, // defined in transpose.js

        Instrument,
        SimpleSynth;


    function unscheduleCallback(sample){
        //console.log(sample.id, 'has been unscheduled');
        sample = null;
    }


    Instrument = function(config){
        //console.log(config);
        this.className = 'Instrument';
        this.config = config;
        this.scheduledEvents = {};
        this.scheduledSamples = {};
        this.sustainPedalDown = false;
        this.sustainPedalSamples = {};
        this.sampleDataByNoteNumber = {};
        this.sampleData = [];

        this.info = config.info || config.instrument_info;
        this.author = config.author || config.instrument_author;
        this.license = config.license || config.instrument_license;
        this.pack = config.pack;

        this.parse();
    };


    // called by asset manager when a sample pack or an instrument has been unloaded, see asset_manager.js
    Instrument.prototype.reset = function(){
        var instrument = sequencer.getInstrument(this.config.localPath),
            samplepack = sequencer.getSamplePack(this.config.sample_path);

        if(samplepack === false || instrument === false){
            this.scheduledEvents = {};
            this.scheduledSamples = {};
            this.sustainPedalSamples = {};
            this.sampleDataByNoteNumber = {};
            this.sampleData = [];
            if(this.update){
                delete repetitiveTasks[this.updateTaskId];
            }
            // if the instrument has been unloaded, set the track to the default instrument
            if(instrument === false){
                this.track.setInstrument();
            }
        }
    };


    Instrument.prototype.parse = function(){
        var i, maxi, v, v1, v2, length, octave, note, noteName, noteNumber,
            pathArray,
            buffer, names,
            id, data, subdata,
            update,
            sample,
            sampleConfig,
            samplePack,
            audioFolder,
            config = this.config,
            noteNameMode = config.notename_mode === undefined ? sequencer.noteNameMode : config.notename_mode,
            mapping = config.mapping,
            me = this;

        if(config.name === undefined){
            console.error('instruments must have a name', config);
            return false;
        }

        if(mapping === undefined){
            console.error('instruments must have a mapping to samples', config);
            return false;
        }

        this.name = config.name;
        this.folder = config.folder || '';
        this.autopan = config.autopan || false; // for simple synth
        this.singlePitch = config.single_pitch || false;
        this.samplePath = config.sample_path || this.name;
        this.keyScalingRelease = config.keyscaling_release;
        this.keyScalingPanning = config.keyscaling_panning;
        this.keyRange = config.keyrange || config.key_range;
        //console.log(this.keyRange, config);
        pathArray = this.samplePath.split('/');

        //console.log(this.keyScalingRelease, config);

        samplePack = storage.samplepacks;
        for(i = 0, maxi = pathArray.length; i < maxi; i++){
            if(samplePack === undefined){
                if(sequencer.debug){
                    console.log('sample pack not found', pathArray.join('/'));
                }
                return;
            }
            samplePack = samplePack[pathArray[i]];
        }
        //console.log(samplePack.name);

        audioFolder = storage.audio;
        try{
            for(i = 0, maxi = pathArray.length; i < maxi; i++){
                audioFolder = audioFolder[pathArray[i]];
            }
        }catch(e){
            if(sequencer.debug){
                console.log('sample pack "' + pathArray[i] + '" is not loaded');
            }
            //sampleConfig = false;
            return;
        }

        if(audioFolder === undefined){
            if(sequencer.debug){
                console.log('sample pack not found', pathArray.join('/'));
            }
            //sampleConfig = false;
            return;
        }


        if(typeString(mapping) === 'array'){
            this.keyRange = mapping;
            mapping = {};
            for(i = this.keyRange[0]; i <= this.keyRange[1]; i++){
                mapping[i] = '';
            }
        }

        if(this.keyRange === undefined){
            this.lowestNote = 128;
            this.highestNote = -1;
        }else{
            this.lowestNote = this.keyRange[0];
            this.highestNote = this.keyRange[1];
            this.numNotes = this.highestNote - this.lowestNote;
        }


        if(config.release_duration !== undefined){
            this.releaseDuration = config.release_duration;
        }else{
            this.releaseDuration = 0;
        }

        this.releaseEnvelope = config.release_envelope || 'equal power';


        if(this.autopan){
            this.autoPanner = createAutoPanner();
        }

        this.samplepack = samplePack;
        //console.log(samplePack);

        for(id in mapping){
            if(mapping.hasOwnProperty(id)){
                data = mapping[id];

                if(isNaN(id)){
                    // C3, D#5, Bb0, etc.
                    length = id.length;
                    octave = id.substring(length - 1);
                    note = id.substring(0, length - 1);
                    noteName = id;
                    noteNumber = sequencer.getNoteNumber(note, octave);
                }else{
                    noteName = sequencer.getNoteNameFromNoteNumber(id, noteNameMode);
                    noteName = noteName.join('');
                    noteNumber = id;
                }
                //console.log(id, noteNameMode);

                noteNumber = parseInt(noteNumber, 10);

                if(this.keyRange === undefined){
                    this.lowestNote = noteNumber < this.lowestNote ? noteNumber : this.lowestNote;
                    this.highestNote = noteNumber > this.highestNote ? noteNumber : this.highestNote;
                }

                //console.log(data,typeString(data));

                if(typeString(data) === 'array'){
                    // multi-layered
                    this.multiLayered = true;
                    for(i = 0, maxi = data.length; i < maxi; i++){
                        subdata = data[i];
                        parseSampleData(subdata);
                        if(this.sampleDataByNoteNumber[noteNumber] === undefined){
                            this.sampleDataByNoteNumber[noteNumber] = [];
                        }
                        // store the same sample config for every step in this velocity range
                        v1 = subdata.v[0];
                        v2 = subdata.v[1];
                        for(v = v1; v <= v2; v++){
                            this.sampleDataByNoteNumber[noteNumber][v] = sampleConfig;
                        }
                        this.sampleData.push(sampleConfig);
                    }
                }else{
                    // single-layered
                    parseSampleData(data);
                    //console.log('--->', sampleConfig);
                    this.sampleDataByNoteNumber[noteNumber] = sampleConfig;
                    this.sampleData.push(sampleConfig);
                }
            }
        }

        if(this.keyRange === undefined){
            //console.log(this.highestNote, this.lowestNote);
            this.numNotes = this.highestNote - this.lowestNote;
            this.keyRange = [this.lowestNote, this.highestNote];
        }


        // if a key range is set for the instrument, the mapping object is generated by parseSampleData() so we need to add
        // the mapping object to the config to make it available for unloading
        this.config.mapping = mapping;

        if(this.singlePitch){
            // TODO: fix this for multi-layered instruments (low prio)
            for(i = 127; i >= 0; i--){
                this.sampleData[i] = sampleConfig;
                this.sampleDataByNoteNumber[i] = sampleConfig;
            }
        }

        if(update){
            this.updateTaskId = 'update_' + this.name + '_' + new Date().getTime();
            //console.log('start update', this.name);
            repetitiveTasks[this.updateTaskId] = function(){
                //console.log('update');
                if(me.autopan){
                    me.update(this.autoPanner.getValue());
                }else{
                    me.update();
                }
            };
        }

        // inner function of Instrument.parse();
        function parseSampleData(data){
            var tmp, n;
            //console.log('find', this.samplePath + '/' + data.n);
            //buffer = findItem(this.samplePath + '/' + data.n, storage.audio);
            //console.log(data);

            if(data.n){
                // get the buffer by an id
                buffer = audioFolder[data.n];
                //console.log(data.n, buffer);
            }else{
                // get the buffer by a note number or note name if a keyrange is specified
                names = [noteNumber, noteName, noteName.toLowerCase()];
                for(n = 2; n >= 0; n--){
                    buffer = audioFolder[names[n]];
                    if(buffer !== undefined){
                        mapping[id] = {n: names[n]};
                        break;
                    }
                }
            }

            if(buffer === undefined){
                if(sequencer.debug){
                    console.log('no buffer found for ' + id + ' (' + me.name + ')');
                }
                sampleConfig = false;
                return;
            }

            sampleConfig = {
                noteNumber: noteNumber,
                buffer: buffer,
                bufferId: data.n,
                autopan: me.autopan
            };

            // sample pack sustain
            if(config.sustain === true){
                sampleConfig.sustain = true;
                update = true;
            }

            // sustain
            if(data.s !== undefined){
                sampleConfig.sustain_start = data.s[0];
                sampleConfig.sustain_end = data.s[1];
                sampleConfig.sustain = true;
                update = true;
            }else if(config.sustain === true){
                tmp = samplePack.samplesById[data.n].sustain;
                if(tmp !== undefined){
                    sampleConfig.sustain_start = tmp[0];
                    sampleConfig.sustain_end = tmp[1];
                    //sampleConfig.sustain = true;
                    //console.log(tmp, update, sampleConfig.sustain);
                }else{
                    sampleConfig.sustain = false;
                }
                //console.log(data.n, samplePack.samplesById[data.n]);
            }

            // global release
            if(config.release_duration !== undefined){
                sampleConfig.release_duration = config.release_duration;
                sampleConfig.release_envelope = config.release_envelope || me.releaseEnvelope;
                sampleConfig.release = true;
                update = true;
            }

            // release duration and envelope per sample overrules global release duration and envelope
            if(data.r !== undefined){
                if(typeString(data.r) === 'array'){
                    sampleConfig.release_duration = data.r[0];
                    sampleConfig.release_envelope = data.r[1] || me.releaseEnvelope;
                }else if(!isNaN(data.r)){
                    sampleConfig.release_duration = data.r;
                    sampleConfig.release_envelope = me.releaseEnvelope;
                }
                sampleConfig.release = true;
                update = true;
                //console.log(data.r, sampleConfig.release_duration, sampleConfig.release_envelope)
            }

            // panning
            if(data.p !== undefined){
                sampleConfig.panPosition = data.p;
                sampleConfig.panning = true;
            }
            //console.log(data.p, sampleConfig.panning);
            //console.log('ready', sampleConfig);
        }
    };


    Instrument.prototype.getInfoAsHTML = function(){
        var html = '',
            instrumentInfo = '',
            samplepackInfo = '',
            sp = this.samplepack;

        if(this.info !== undefined){
            instrumentInfo += '<tr><td>info</td><td>' + this.info + '</td></tr>';
        }
        if(this.author !== undefined){
            instrumentInfo += '<tr><td>author</td><td>' + this.author + '</td></tr>';
        }
        if(this.license !== undefined){
            instrumentInfo += '<tr><td>license</td><td>' + this.license + '</td></tr>';
        }
        instrumentInfo += '<tr><td>keyrange</td><td>' + this.lowestNote + '(' + sequencer.getFullNoteName(this.lowestNote) + ')';
        instrumentInfo += ' - ' + this.highestNote + '(' + sequencer.getFullNoteName(this.highestNote) + ')</td></tr>';

        if(instrumentInfo !== ''){
            instrumentInfo = '<table><th colspan="2">instrument</th>' +  instrumentInfo + '</table>';
            html += instrumentInfo;
        }

        if(sp === undefined){
            return html;
        }

        if(sp.info !== undefined){
            samplepackInfo += '<tr><td>info</td><td>' + sp.info + '</td></tr>';
        }
        if(sp.author !== undefined){
            samplepackInfo += '<tr><td>author</td><td>' + sp.author + '</td></tr>';
        }
        if(sp.license !== undefined){
            samplepackInfo += '<tr><td>license</td><td>' + sp.license + '</td></tr>';
        }
        if(sp.compression !== undefined){
            samplepackInfo += '<tr><td>compression</td><td>' + sp.compression + '</td></tr>';
        }
        if(sp.filesize !== undefined){
            samplepackInfo += '<tr><td>filesize</td><td>' + round(sp.filesize/1024/1024, 2) + ' MiB</td></tr>';
        }

        if(samplepackInfo !== ''){
            samplepackInfo = '<table><th colspan="2">samplepack</th>' +  samplepackInfo + '</table>';
            html += samplepackInfo;
        }

        return html;
    };


    Instrument.prototype.getInfo = function(){
        var info = {
            instrument: {},
            samplepack: {}
        };

        if(this.info !== undefined){
            info.instrument.info = this.info;
        }
        if(this.author !== undefined){
            info.instrument.author = this.author;
        }
        if(this.license !== undefined){
            info.instrument.license = this.license;
        }
        if(this.keyrange !== undefined){
            info.instrument.keyrange = this.keyrange;
        }


        if(this.info !== undefined){
            info.samplepack.info = this.info;
        }
        if(this.author !== undefined){
            info.samplepack.author = this.author;
        }
        if(this.license !== undefined){
            info.samplepack.license = this.license;
        }
        if(this.compression !== undefined){
            info.samplepack.compression = this.compression;
        }
        if(this.filesize !== undefined){
            info.samplepack.filesize = round(this.samplepack.filesize/1024/1024, 2);
        }

        return info;
    };


    Instrument.prototype.createSample = function(event){
        var
            noteNumber = event.noteNumber,
            velocity = event.velocity,
            data = this.sampleDataByNoteNumber[noteNumber],
            type = typeString(data);

        if(type === 'array'){
            data = data[velocity];
            //console.log(velocity, data.bufferId);
        }

        if(data === undefined || data === false){
            // no buffer data, return a dummy sample
            return {
                start: function(){
                    console.warn('no audio data loaded for', noteNumber);
                },
                stop: function(){},
                update: function(){},
                addData: function(){},
                unschedule: function(){}
            };
        }
        //console.log(data);
        data.track = event.track;
        return createSample(data);
    };


    Instrument.prototype.setKeyScalingPanning = function(start, end){
        //console.log('keyScalingPanning', start, end);
        var i, data, numSamples = this.sampleData.length,
            panStep, currentPan;

        if(start === false){
            for(i = 0; i < numSamples; i++){
                data = this.sampleData[i];
                data.panning = false;
            }
        }

        if(isNaN(start) === false && isNaN(end) === false){
            panStep = (end - start)/this.numNotes;
            currentPan = start;
            for(i = 0; i < numSamples; i++){
                data = this.sampleData[i];
                data.panning = true;
                data.panPosition = currentPan;
                //console.log(currentPan, panStep, highestNote, lowestNote, data.noteNumber);
                currentPan += panStep;
            }
        }
    };


    Instrument.prototype.setRelease = function(millis, envelope){
        if(millis === undefined){
            return;
        }
        this.releaseEnvelope = envelope || this.releaseEnvelope;
        this.keyScalingRelease = undefined;

        var i, data, numSamples = this.sampleData.length;
        for(i = 0; i < numSamples; i++){
            data = this.sampleData[i];
            data.release = true;
            data.release_duration = millis;
            data.release_envelope = this.releaseEnvelope;
        }
        this.releaseDuration = millis;
    };


    Instrument.prototype.setKeyScalingRelease = function(start, end, envelope){
        var i, data, numSamples = this.sampleData.length,
            releaseStep, currentRelease;

        this.releaseEnvelope = envelope || this.releaseEnvelope;

        if(isNaN(start) === false && isNaN(end) === false){
            this.keyScalingRelease = [start, end];
            this.releaseDuration = 0;
            releaseStep = (end - start)/this.numNotes;
            currentRelease = start;
            for(i = 0; i < numSamples; i++){
                data = this.sampleData[i];
                data.release_duration = currentRelease;
                data.release_envelope = currentRelease;
                //console.log(currentRelease, releaseStep, data.noteNumber);
                currentRelease += releaseStep;
            }
        }
    };


    Instrument.prototype.transpose = function(semitones, cb1, cb2){
        if(transpose === undefined){
            console.log('transpose is still experimental');
            return;
        }
        var numSamples = this.sampleData.length;
        function loop(num, samples){
            var data;
            if(cb2){
                cb2('transposing sample ' + (num + 1) +  ' of ' + numSamples);
            }
            //console.log(num, numSamples);
            if(num < numSamples){
                data = samples[num];
                setTimeout(function(){
                    transpose(data.buffer, semitones, function(transposedBuffer){
                        data.buffer = transposedBuffer;
                        loop(++num, samples);
                    });
                }, 10);
            }else{
                if(cb1){
                    console.log('ready');
                    cb1();
                }
            }
        }
        loop(0, this.sampleData);
    };


    // called when midi events arrive from a midi input, from processEvent or from the scheduler
    Instrument.prototype.processEvent = function(midiEvent){
        //console.log(midiEvent.type + ' : ' + midiEvent.velocity);
        var type = midiEvent.type,
            data1, data2, track, output;

        //seconds = seconds === undefined ? 0 : seconds;
        if(midiEvent.time === undefined){
            midiEvent.time = 0;
        }

        if(type === 128 || type === 144){
            if(type === 128){
                if(this.sustainPedalDown === true){
                    midiEvent.sustainPedalDown = true;
                }
                //console.log(type, midiEvent.noteNumber, midiEvent.ticks, midiEvent.midiNote.id);
                this.stopNote(midiEvent);
            }else{
                //console.log(type, midiEvent.noteNumber, midiEvent.ticks, midiEvent.midiNote.noteOff.ticks, midiEvent.midiNote.id);
                this.playNote(midiEvent);
            }
        }else if(midiEvent.type === 176){
            //return;
            data1 = midiEvent.data1;
            data2 = midiEvent.data2;
            if(data1 === 64){ // sustain pedal
                //console.log(this.sustainPedalDown, data1, data2)
                if(data2 === 127){
                    this.sustainPedalDown = true;
                    //console.log('sustain pedal down', this.track.song.id);
                    dispatchEvent(this.track.song, 'sustain_pedal', 'down');
                }else if(data2 === 0){
                    this.sustainPedalDown = false;
                    //console.log('sustain pedal up');
                    dispatchEvent(this.track.song, 'sustain_pedal', 'up');
                    this.stopSustain(midiEvent.time);
                }
            }else if(data1 === 10){ // panning
                // panning is *not* exactly timed -> not possible (yet) with WebAudio
                track = this.track;
                //console.log(data2, remap(data2, 0, 127, -1, 1));
                track.setPanning(remap(data2, 0, 127, -1, 1));
            }else if(data1 === 7){ // volume
                track = this.track;
                output = track.output;
                output.gain.setValueAtTime(data2/127, midiEvent.time);
                /*
                //@TODO: this should be done by a plugin
                if(track.volumeChangeMethod === 'linear'){
                    output.gain.linearRampToValueAtTime(data2/127, seconds);
                }else if(track.volumeChangeMethod === 'equal_power'){
                    volume1 = track.getVolume();
                    volume2 = data2/127;
                    if(volume1 > volume2){
                        values = getEqualPowerCurve(100, 'fadeOut', volume2);
                    }else{
                        values = getEqualPowerCurve(100, 'fadeIn', volume2);
                    }
                    now = sequencer.getTime();
                    output.gain.setValueCurveAtTime(values, seconds, seconds + 0.05);
                }else{
                    output.gain.setValueAtTime(data2/127, seconds);
                }
                */
            }
        }
    };


    Instrument.prototype.stopSustain = function(seconds){
        var midiNote,
            scheduledSamples = this.scheduledSamples,
            sustainPedalSamples = this.sustainPedalSamples;

        objectForEach(sustainPedalSamples, function(sample){
            if(sample !== undefined){
                midiNote = sample.midiNote;
                midiNote.noteOn.sustainPedalDown = undefined;
                midiNote.noteOff.sustainPedalDown = undefined;
                sample.stop(seconds, function(sample){
                    //console.log('stopped sustain pedal up:', sample.id, sample.sourceId);
                    scheduledSamples[sample.sourceId] = null;
                    delete scheduledSamples[sample.sourceId];
                    //delete sustainPedalSamples[sample.sourceId];
                });
            }
        });

        this.sustainPedalSamples = {};
    };


    Instrument.prototype.playNote = function(midiEvent){
        var
            sample,
            sourceId;

        if(!midiEvent.midiNote){
            if(sequencer.debug){
                console.warn('playNote() no midi note');
            }
            return;
        }

        sourceId = midiEvent.midiNote.id;
        sample = this.scheduledSamples[sourceId];
        //console.log('start', sourceId);

        if(sample !== undefined){
            //console.log('already scheduled', sourceId);
            sample.unschedule(0);
        }

        sample = this.createSample(midiEvent);
        // add some extra attributes to the sample
        sample.addData({
            midiNote: midiEvent.midiNote,
            noteName: midiEvent.midiNote.note.fullName,
            sourceId: sourceId
        });
        this.scheduledSamples[sourceId] = sample;
        sample.start(midiEvent);
    };


    Instrument.prototype.stopNote = function(midiEvent){
        if(midiEvent.midiNote === undefined){
            if(sequencer.debug){
                console.warn('stopNote() no midi note', midiEvent.ticks, midiEvent.noteNumber);
            }
            return;
        }

        var sourceId = midiEvent.midiNote.id,
            sample = this.scheduledSamples[sourceId],
            scheduledSamples = this.scheduledSamples,
            sustainPedalSamples = this.sustainPedalSamples;

        // if(this.song && this.song.bar >= 6 && this.track.name === 'Sonata # 3'){
        //     console.log('stopNote', midiEvent, seconds, sequencer.getTime());
        // }

        //console.log(midiEvent.sustainPedalDown);
        if(midiEvent.sustainPedalDown === true){
            // while sustain pedal is pressed, bypass note off events
            //console.log('sustain');
            sustainPedalSamples[sourceId] = sample;
            return;
        }

        if(sample === undefined){
            // if(sequencer.debug){
            //     console.log('no sample scheduled (anymore) for this midiEvent', sourceId, seconds);
            // }
            return;
        }

        sample.stop(midiEvent.time, function(){
            scheduledSamples[sourceId] = null;
            delete scheduledSamples[sourceId];
        });
    };


    Instrument.prototype.hasScheduledSamples = function(){
        return isEmptyObject(this.scheduledSamples);
    };


    Instrument.prototype.reschedule = function(song){
        var
            min = song.millis,
            max = min + (sequencer.bufferTime * 1000),
            max2 = min + 20,
            scheduledSamples = this.scheduledSamples,
            id, note, sample;

        for(id in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(id)){
                sample = scheduledSamples[id]; // the sample
                note = sample.midiNote; // the midi note

                if(note === undefined || note.state === 'removed'){
                    sample.unschedule(0, unscheduleCallback);
                    delete scheduledSamples[id];
                }else if(
                        note.noteOn.millis >= min &&
                        note.noteOff.millis < max &&
                        sample.noteName === note.fullName
                    ){
                    // nothing has changed, skip
                    continue;
                }else{
                    //console.log('unscheduled', id);
                    delete scheduledSamples[id];
                    sample.unschedule(null, unscheduleCallback);
                }
            }
        }
/*
        objectForEach(this.scheduledEvents, function(event, eventId){
            if(event === undefined || event.state === 'removed'){
                delete sequencer.timedTasks['event_' + eventId];
                delete this.scheduledEvents[eventId];
            }else if((event.millis >= min && event.millis < max2) === false){
                delete sequencer.timedTasks['event_' + eventId];
                delete this.scheduledEvents[eventId];
            }
        });
*/
    };


    function loop(data, i, maxi, events){
        var arg;
        for(i = 0; i < maxi; i++){
            arg = data[i];
            if(arg === undefined){
                continue;
            }else if(arg.className === 'MidiNote'){
                events.push(arg.noteOn);
            }else if(typeString(arg) === 'array'){
                loop(arg, 0, arg.length);
            }
        }
    }


    // stop specified events or notes, used by stopProcessEvent()
    Instrument.prototype.unschedule = function(){
        var args = Array.prototype.slice.call(arguments),
            events = [],
            i, e, id, sample;

        loop(args, 0, args.length, events);

        for(i = events.length - 1; i >= 0; i--){
            e = events[i];
            if(e.midiNote !== undefined){
                // note on and note off events
                id = e.midiNote.id;
                sample = this.scheduledSamples[id];
                if(sample !== undefined){
                    sample.unschedule(0, unscheduleCallback);
                    delete this.scheduledSamples[id];
                }
            }else if(e.className === 'MidiEvent'){
                // other channel events
                id = e.id;
                delete timedTasks['event_' + id];
                delete this.scheduledEvents[id];
            }
            //console.log(id);
        }
    };


    // stop all events and notes
    Instrument.prototype.allNotesOff = function(){
        var sample, sampleId,
            scheduledSamples = this.scheduledSamples;

        this.stopSustain(0);
        this.sustainPedalDown = false;

        //console.log(scheduledSamples);

        if(scheduledSamples === undefined || isEmptyObject(scheduledSamples) === true){
            return;
        }

        for(sampleId in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(sampleId)){
                //console.log('allNotesOff', sampleId);
                sample = scheduledSamples[sampleId];
                if(sample){
                    sample.unschedule(0, unscheduleCallback);
                }
            }
        }
        this.scheduledSamples = {};

        objectForEach(this.scheduledEvents, function(event, eventId){
            delete timedTasks['event_' + eventId];
        });
        this.scheduledEvents = {};
    };


    Instrument.prototype.allNotesOffPart = function(partId){
        var sample, sampleId,
            scheduledSamples = this.scheduledSamples;

        // make this more subtle
        this.stopSustain(0);
        this.sustainPedalDown = false;

        //console.log(scheduledSamples);

        if(scheduledSamples === undefined || isEmptyObject(scheduledSamples) === true){
            return;
        }

        for(sampleId in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(sampleId)){
                //console.log('allNotesOff', sampleId);
                sample = scheduledSamples[sampleId];
                if(sample){
                    sample.unschedule(0, unscheduleCallback);
                }
            }
        }
        this.scheduledSamples = {};

        objectForEach(this.scheduledEvents, function(event, eventId){
            delete timedTasks['event_' + eventId];
        });
        this.scheduledEvents = {};
    };

    Instrument.prototype.update = function(value){
        var sampleId, sample;
        //console.log(this.scheduledSamples);
        for(sampleId in this.scheduledSamples){
            if(this.scheduledSamples.hasOwnProperty(sampleId)){
                sample = this.scheduledSamples[sampleId];
                if(sample){
                    sample.update(value);
                }
            }
        }
    };

    function createAutoPanner(time){
/*
        var osc = context.createOscillator();
        osc.frequency.value = 50;
        osc.type = 0;
        var gain = context.createGain();
        gain.gain.value = 1;
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start();
        console.log(osc);
        return {
            getValue: function(){
                return osc.frequency.getValueAtTime(time);
            }
        };
*/
        return {
            getValue: function(time){
                return Math.sin(time * 2*Math.PI);
            }
        };

    }


    sequencer.createInstrument = function(arg){
        var type = typeString(arg),
            config,
            instrument;

        //console.log(arg, type, arg.className);

        if(type === 'object'){
            if(arg.className === 'Instrument'){
                instrument = arg;
            }else if(arg.className === 'InstrumentConfig'){
                if(arg.name === 'sinewave'){
                    instrument = new SimpleSynth(arg);
                }else{
                    instrument = new Instrument(arg);
                }
            }
            return instrument;
        }


        if(type === 'string'){
            //@TODO what happens if we have 2 instruments with the same name?
            config = findItem(arg, storage.instruments);
            //console.log('string', arg, config, storage.instruments);
        }

        if(config === false || config.className !== 'InstrumentConfig'){
            if(debug >= 2){
                console.info('can not create instrument from', arg);
            }
            return false;
        }


        if(config.name === 'sinewave'){
            instrument = new SimpleSynth(config);
        }else{
            instrument = new Instrument(config);
        }

        return instrument;
    };


    sequencer.protectedScope.addInitMethod(function(){
        var protectedScope = sequencer.protectedScope;

        storage = sequencer.storage;
        createSample = sequencer.createSample;
        createReverb = sequencer.createReverb;
        dispatchEvent = sequencer.protectedScope.songDispatchEvent;

        context = protectedScope.context;
        timedTasks = protectedScope.timedTasks;
        repetitiveTasks = protectedScope.repetitiveTasks;
        objectForEach = protectedScope.objectForEach;
        isEmptyObject = protectedScope.isEmptyObject;
        findItem = protectedScope.findItem;
        storeItem = protectedScope.storeItem;
        typeString = protectedScope.typeString;
        pathToArray = protectedScope.pathToArray;
        transpose = protectedScope.transpose;
        SimpleSynth = protectedScope.createClass(Instrument);

        remap = sequencer.util.remap;
        round = sequencer.util.round;
        getEqualPowerCurve = sequencer.util.getEqualPowerCurve;

        SimpleSynth.prototype.parse = function(){
            var me = this,
                config = this.config;

            //console.log(this.config);
            this.name = 'SineWave';
            this.waveForm = config.wave_form || 'sine';
            this.autopan = config.autopan || false;
            this.folder = config.folder || 'heartbeat';
            this.releaseDuration = config.release_duration || 1500;
            if(this.autopan){
                this.autoPanner = createAutoPanner();
            }

            repetitiveTasks['update_' + this.name + '_' + new Date().getTime()] = function(){
                if(me.autopan){
                    //console.log('update',me.autoPanner.getValue(context.currentTime), me.autopan);
                    //me.update(me.autoPanner.getValue(context.currentTime));
                    me.update(Math.sin(context.currentTime * 2*Math.PI));
                }else{
                    me.update();
                }
            };
        };

        SimpleSynth.prototype.createSample = function(event){
            var data = {
                    oscillator: true,
                    track: event.track,
                    event: event,
                    autopan: this.autopan,
                    wave_form: this.waveForm,
                    release_envelope: 'equal power',
                    release_duration: this.releaseDuration
                };
            //console.log(data);
            return createSample(data);
        };

        sequencer.createSimpleSynth = function(config){
            config = config || {};
            //console.log('creating sinewave');
            return new SimpleSynth(config);
        };
    });
}());
(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        debug = sequencer.debug,

        instrumentId = 0,

        //import
        repetitiveTasks, // → defined in open_module.js
        typeString, // → defined in utils.js
        createSample, // → defined in sample.js
        round, // defined in util.js
        parseSamples, // defined in util.js
        createAutoPanner, // defined in instrument_methods.js
        createSimpleSynth, // defined in simple_synth.js

        Instrument;



    Instrument = function(config){
        //console.log(config);
        this.className = 'Instrument';
        this.id = 'I' + instrumentId + new Date().getTime();
        this.config = config;
        this.scheduledEvents = {};
        this.scheduledSamples = {};
        this.sustainPedalDown = false;
        this.sustainPedalSamples = {};
        this.sampleDataByNoteNumber = {};
        this.sampleData = [];

        this.info = config.info || {};
        if(this.info.samples !== undefined){
            if(this.info.sample.filesize !== undefined){
                this.info.samples.filesize = round(this.samplepack.filesize/1024/1024, 2);
            }
        }
    };


    // called by asset manager when a sample pack or an instrument has been unloaded, see asset_manager.js
    Instrument.prototype.reset = function(){
        // remove all samples
    };


    Instrument.prototype.parse = function(){
        var i, maxi, v, v1, v2, length, octave, note, noteName, noteNumber,
            buffer,
            id,
            data, subdata,
            update,
            sampleConfig,
            config = this.config,
            noteNameMode = config.notename_mode === undefined ? sequencer.noteNameMode : config.notename_mode,
            me = this;

        this.name = config.name || this.id;
        this.autopan = config.autopan || false; // for simple synth
        this.singlePitch = config.single_pitch || false;
        this.keyScalingRelease = config.keyscaling_release;
        this.keyScalingPanning = config.keyscaling_panning;
        this.keyRange = config.keyrange || config.key_range;
        this.mapping = config.mapping;

        if(this.keyRange === undefined){
            this.lowestNote = 128;
            this.highestNote = -1;
        }else{
            this.lowestNote = this.keyRange[0];
            this.highestNote = this.keyRange[1];
            this.numNotes = this.highestNote - this.lowestNote;
        }

        if(config.release_duration !== undefined){
            this.releaseDuration = config.release_duration;
        }else{
            this.releaseDuration = 0;
        }

        this.releaseEnvelope = config.release_envelope || 'equal power';

        if(this.autopan){
            this.autoPanner = createAutoPanner();
        }

        if(this.mapping === undefined){
            this.mapping = {};
            // use ids of samples as mapping -> the ids of the samples have to be note numbers or note names
            for(id in this.samples){
                if(this.samples.hasOwnProperty(id)){
                    this.mapping[id] = {n:id};
                }
            }
        }
        //console.log(this.mapping);

        for(id in this.mapping){
            if(this.mapping.hasOwnProperty(id)){
                data = this.mapping[id];

                if(isNaN(id)){
                    // C3, D#5, Bb0, etc.
                    length = id.length;
                    octave = id.substring(length - 1);
                    note = id.substring(0, length - 1);
                    noteName = id;
                    noteNumber = sequencer.getNoteNumber(note, octave);
                }else{
                    noteName = sequencer.getNoteNameFromNoteNumber(id, noteNameMode);
                    noteName = noteName.join('');
                    noteNumber = id;
                }
                //console.log(id, noteNameMode);

                noteNumber = parseInt(noteNumber, 10);

                // calculate key range
                if(this.keyRange === undefined){
                    this.lowestNote = noteNumber < this.lowestNote ? noteNumber : this.lowestNote;
                    this.highestNote = noteNumber > this.highestNote ? noteNumber : this.highestNote;
                }

                //console.log(data,typeString(data));

                if(typeString(data) === 'string'){
                    // only id of sample is provided
                    buffer = this.samples[data];
                }else if(typeString(data) === 'array'){
                    // multi-layered
                    this.multiLayered = true;
                    for(i = 0, maxi = data.length; i < maxi; i++){
                        subdata = data[i];
                        createSampleConfig(subdata);
                        if(this.sampleDataByNoteNumber[noteNumber] === undefined){
                            this.sampleDataByNoteNumber[noteNumber] = [];
                        }
                        // store the same sample config for every step in this velocity range
                        v1 = subdata.v[0];
                        v2 = subdata.v[1];
                        for(v = v1; v <= v2; v++){
                            this.sampleDataByNoteNumber[noteNumber][v] = sampleConfig;
                        }
                        this.sampleData.push(sampleConfig);
                    }
                }else{
                    // single-layered
                    createSampleConfig(data);
                    //console.log('--->', sampleConfig);
                    this.sampleDataByNoteNumber[noteNumber] = sampleConfig;
                    this.sampleData.push(sampleConfig);
                }
            }
        }

        if(this.keyRange === undefined){
            //console.log(this.highestNote, this.lowestNote);
            this.numNotes = this.highestNote - this.lowestNote;
            this.keyRange = [this.lowestNote, this.highestNote];
        }


        if(this.singlePitch){
            // TODO: fix this for multi-layered instruments (low prio)
            for(i = 127; i >= 0; i--){
                this.sampleData[i] = sampleConfig;
                this.sampleDataByNoteNumber[i] = sampleConfig;
            }
        }

        if(update){
            this.updateTaskId = 'update_' + this.name + '_' + new Date().getTime();
            //console.log('start update', this.name);
            repetitiveTasks[this.updateTaskId] = function(){
                //console.log('update');
                if(me.autopan){
                    me.update(this.autoPanner.getValue());
                }else{
                    me.update();
                }
            };
        }

        // inner function of Instrument.parse();
        function createSampleConfig(data){

            if(data.n){
                // get the buffer by an id
                buffer = me.samples[data.n];
                //console.log(data.n, buffer);
            }


            if(buffer === undefined){
                if(sequencer.debug){
                    console.log('no buffer found for ' + id + ' (' + me.name + ')');
                }
                sampleConfig = false;
                return;
            }

            sampleConfig = {
                noteNumber: noteNumber,
                buffer: buffer,
                autopan: me.autopan
            };

            // sample pack sustain
            if(config.sustain === true){
                sampleConfig.sustain = true;
                update = true;
            }

            // sustain
            if(data.s !== undefined){
                sampleConfig.sustain_start = data.s[0];
                sampleConfig.sustain_end = data.s[1];
                sampleConfig.sustain = true;
                update = true;
            }

            // global release
            if(config.release_duration !== undefined){
                sampleConfig.release_duration = config.release_duration;
                sampleConfig.release_envelope = config.release_envelope || me.releaseEnvelope;
                sampleConfig.release = true;
                update = true;
            }

            // release duration and envelope per sample overrules global release duration and envelope
            if(data.r !== undefined){
                if(typeString(data.r) === 'array'){
                    sampleConfig.release_duration = data.r[0];
                    sampleConfig.release_envelope = data.r[1] || me.releaseEnvelope;
                }else if(!isNaN(data.r)){
                    sampleConfig.release_duration = data.r;
                    sampleConfig.release_envelope = me.releaseEnvelope;
                }
                sampleConfig.release = true;
                update = true;
                //console.log(data.r, sampleConfig.release_duration, sampleConfig.release_envelope)
            }

            // panning
            if(data.p !== undefined){
                sampleConfig.panPosition = data.p;
                sampleConfig.panning = true;
            }
            //console.log(data.p, sampleConfig.panning);
            //console.log('ready', sampleConfig);
        }
    };


    Instrument.prototype.getInfoAsHTML = function(){
        var html = '',
            instrumentHtml = '',
            samplepackHtml = '',
            instrumentInfo = {},
            samplesInfo = {};

        if(this.info !== undefined){
            samplesInfo = this.info.samples;
            instrumentInfo = this.info.instrument;
        }

        if(instrumentInfo.descriptiom !== undefined){
            instrumentHtml += '<tr><td>info</td><td>' + instrumentInfo.description + '</td></tr>';
        }
        if(instrumentInfo.author !== undefined){
            instrumentHtml += '<tr><td>author</td><td>' + instrumentInfo.author + '</td></tr>';
        }
        if(instrumentInfo.license !== undefined){
            instrumentHtml += '<tr><td>license</td><td>' + instrumentInfo.license + '</td></tr>';
        }
        instrumentHtml += '<tr><td>keyrange</td><td>' + this.lowestNote + '(' + sequencer.getFullNoteName(this.lowestNote) + ')';
        instrumentHtml += ' - ' + this.highestNote + '(' + sequencer.getFullNoteName(this.highestNote) + ')</td></tr>';

        if(instrumentHtml !== ''){
            instrumentHtml = '<table><th colspan="2">instrument</th>' +  instrumentHtml + '</table>';
            html += instrumentHtml;
        }

        if(samplesInfo.description !== undefined){
            samplepackHtml += '<tr><td>info</td><td>' + samplesInfo.description + '</td></tr>';
        }
        if(samplesInfo.author !== undefined){
            samplepackHtml += '<tr><td>author</td><td>' + samplesInfo.author + '</td></tr>';
        }
        if(samplesInfo.license !== undefined){
            samplepackHtml += '<tr><td>license</td><td>' + samplesInfo.license + '</td></tr>';
        }
        if(samplesInfo.compression !== undefined){
            samplepackHtml += '<tr><td>compression</td><td>' + samplesInfo.compression + '</td></tr>';
        }
        if(samplesInfo.filesize !== undefined){
            samplepackHtml += '<tr><td>filesize</td><td>' + samplesInfo.filesize + ' MiB</td></tr>';
        }

        if(samplepackHtml !== ''){
            samplepackHtml = '<table><th colspan="2">samplepack</th>' +  samplepackHtml + '</table>';
            html += samplepackHtml;
        }

        return html;
    };


    Instrument.prototype.createSample = function(event){
        var
            noteNumber = event.noteNumber,
            velocity = event.velocity,
            data = this.sampleDataByNoteNumber[noteNumber],
            type = typeString(data);

        if(type === 'array'){
            data = data[velocity];
            //console.log(velocity, data.bufferId);
        }

        if(data === undefined || data === false){
            // no buffer data, return a dummy sample
            return {
                start: function(){
                    console.warn('no audio data loaded for', noteNumber);
                },
                stop: function(){},
                update: function(){},
                addData: function(){},
                unschedule: function(){}
            };
        }
        //console.log(data);
        data.track = event.track;
        return createSample(data);
    };


    sequencer.createInstrument2 = function(config){

        function executor(resolve, reject){
            var instrument;

            if(config.samples === undefined){
                reject('instruments must have samples', config);
            }

            if(config.name === 'sinewave'){
                instrument = createSimpleSynth(config);
            }else{
                instrument = new Instrument(config);
            }

            parseSamples(config.samples).then(
                function onFulfilled(samples){
                    //console.log(samples);
                    // save memory and delete the base64 data
                    config.samples = null;
                    instrument.samples = samples;
                    instrument.parse();
                    resolve(instrument);
                },
                function onRejected(e){
                    reject(e);
                }
            );
        }

        return new Promise(executor);
    };


    sequencer.protectedScope.addInitMethod(function(){
        var protectedScope = sequencer.protectedScope;
        createSample = sequencer.createSample;
        repetitiveTasks = protectedScope.repetitiveTasks;
        typeString = protectedScope.typeString;
        round = sequencer.util.round;
        createSimpleSynth = sequencer.createSimpleSynth;
        parseSamples = sequencer.util.parseSamples;

        // instrument methods
        var methodNames = [
            'createAutoPanner',
            'setKeyScalingPanning',
            'setKeyScalingRelease',
            'setRelease',
            'transposeSamples',
            'processEvent',
            'stopSustain',
            'playNote',
            'stopNote',
            'allNotesOff',
            'allNotesOffPart',
            'update',
            'hasScheduledSamples',
            'reschedule',
            'unschedule'
        ];
        methodNames.forEach(function(name){
            var m = protectedScope[name];
            Instrument.prototype[name] = function(){
                //console.log(args, this);
                m.apply(this, arguments);
            };
        });
    });
}());
(function(){

    'use strict';

    var
         // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        ajax, // defined in utils.js
        parseUrl, // defined in utils.js
        findItem, // defined in utils.js
        storeItem, // defined in utils.js
        typeString, // defined in utils.js
        objectForEach, // defined in utils.js

        index = 0,

        InstrumentConfig;


    InstrumentConfig = function(config){
        this.id = 'IC' + index++ + new Date().getTime();
        this.className = 'InstrumentConfig';
        var instrument = this;
        objectForEach(config, function(val, key){
            instrument[key] = val;
        });
        //console.log(instrument);
    };


    function cleanup(instrument, callback){
        instrument = undefined;
        if(callback){
            callback(false);
        }
    }


    function store(instrument){
        var occupied = findItem(instrument.localPath, sequencer.storage.instruments, true),
            action = instrument.action;

        //console.log(instrument.localPath, occupied);
        if(occupied && occupied.className === 'InstrumentConfig' && action !== 'overwrite'){
            if(sequencer.debug >= 2){
                console.warn('there is already an Instrument at', instrument.localPath);
                cleanup(instrument);
            }
        }else{
            storeItem(instrument, instrument.localPath, sequencer.storage.instruments);
        }
    }


    function load(instrument, callback){

        if(instrument.url === undefined){
            instrument.localPath = instrument.folder !== undefined ? instrument.folder + '/' + instrument.name : instrument.name;
            callback();
            return;
        }


        ajax({
            url: instrument.url,
            responseType: 'json',
            onError: function(){
                cleanup(instrument, callback);
            },
            onSuccess: function(data){
                // if the json data is corrupt (for instance because of a trailing comma) data will be null
                if(data === null){
                    callback(false);
                    return;
                }

                //console.log(data);
                if(data.name !== undefined && instrument.name === undefined){
                    instrument.name = data.name;
                }

                if(data.folder !== undefined && instrument.folder === undefined){
                    instrument.folder = data.folder;
                }

                if(instrument.name === undefined){
                    instrument.name = parseUrl(instrument.url).name;
                }

                instrument.localPath = instrument.folder !== undefined ? instrument.folder + '/' + instrument.name : instrument.name;
                objectForEach(data, function(val, key){
                    if(key !== 'name' && key !== 'folder'){
                        instrument[key] = val;
                    }
                });
                callback();
            }
        });
    }


    sequencer.addInstrument = function(config, callback, callbackAfterAllTasksAreDone){
        var type = typeString(config),
            instrument, json, name, folder;


        if(type !== 'object'){
            if(sequencer.debug >= 2){
                console.warn('can\'t add an Instrument with this data', config);
            }
            return false;
        }

        //console.log(config);

        if(config.json){
            json = config.json;
            name = config.name;
            folder = config.folder;
            if(typeString(json) === 'string'){
                try{
                    json = JSON.parse(json);
                }catch(e){
                    if(sequencer.debug >= 2){
                        console.warn('can\'t add an Instrument with this data', config);
                    }
                    return false;
                }
            }
            if(json.mapping === undefined){
                if(sequencer.debug >= 2){
                    console.warn('can\'t add an Instrument with this data', config);
                }
                return false;
            }
            config = {
                mapping: json.mapping,
                name: name === undefined ? json.name : name,
                folder: folder === undefined ? json.folder : folder
            };
            //console.log('config', name, folder, json.name, json.folder);
        }


        instrument = new InstrumentConfig(config);

        sequencer.addTask({
            type: 'load instrument config',
            method: load,
            params: instrument
        }, function(value){
            //console.log(instrument, callback);
            store(instrument);
            if(callback){
                //console.log('callback', callback.name)
                callback(instrument);
            }
        }, callbackAfterAllTasksAreDone);

        sequencer.startTaskQueue();

        /*
        load(instrument, function(){
            console.log(instrument);
            store(instrument);
            if(callback){
                callback(instrument);
            }
        });
        */
    };


    sequencer.protectedScope.addInitMethod(function(){
        ajax = sequencer.protectedScope.ajax;
        findItem = sequencer.protectedScope.findItem;
        parseUrl = sequencer.protectedScope.parseUrl;
        storeItem = sequencer.protectedScope.storeItem;
        typeString = sequencer.protectedScope.typeString;
        objectForEach = sequencer.protectedScope.objectForEach;
    });

}());
(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //import
        typeString, // → defined in util.js
        remap, // → defined in util.js
        timedTasks, // → defined in open_module.js
        createReverb, // → defined in effects.js
        objectForEach, // → defined in util.js
        isEmptyObject, // → defined in util.js
        transpose, // → defined in transpose.js
        getEqualPowerCurve, // → defined in util.js
        dispatchEvent, // → defined in song.js


        setKeyScalingPanning,
        setKeyScalingRelease,
        setRelease,
        transposeSamples,
        processEvent,
        stopSustain,
        playNote,
        stopNote,
        allNotesOff,
        allNotesOffPart,
        update,
        hasScheduledSamples,
        reschedule,
        unschedule;



    setKeyScalingPanning = function(start, end){
        //console.log('keyScalingPanning', start, end);
        var i, data, numSamples = this.sampleData.length,
            panStep, currentPan;

        if(start === false){
            for(i = 0; i < numSamples; i++){
                data = this.sampleData[i];
                data.panning = false;
            }
        }

        if(isNaN(start) === false && isNaN(end) === false){
            panStep = (end - start)/this.numNotes;
            currentPan = start;
            for(i = 0; i < numSamples; i++){
                data = this.sampleData[i];
                data.panning = true;
                data.panPosition = currentPan;
                //console.log(currentPan, panStep, highestNote, lowestNote, data.noteNumber);
                currentPan += panStep;
            }
        }
    };



    setRelease = function(millis, envelope){
        if(millis === undefined){
            return;
        }
        this.releaseEnvelope = envelope || this.releaseEnvelope;
        this.keyScalingRelease = undefined;

        var i, data, numSamples = this.sampleData.length;
        for(i = 0; i < numSamples; i++){
            data = this.sampleData[i];
            data.release = true;
            data.release_duration = millis;
            data.release_envelope = this.releaseEnvelope;
        }
        this.releaseDuration = millis;
    };



    setKeyScalingRelease = function(start, end, envelope){
        var i, data, numSamples = this.sampleData.length,
            releaseStep, currentRelease;

        this.releaseEnvelope = envelope || this.releaseEnvelope;

        if(isNaN(start) === false && isNaN(end) === false){
            this.keyScalingRelease = [start, end];
            this.releaseDuration = 0;
            releaseStep = (end - start)/this.numNotes;
            currentRelease = start;
            for(i = 0; i < numSamples; i++){
                data = this.sampleData[i];
                data.release_duration = currentRelease;
                data.release_envelope = currentRelease;
                //console.log(currentRelease, releaseStep, data.noteNumber);
                currentRelease += releaseStep;
            }
        }
    };



    transposeSamples = function(semitones, cb1, cb2){
        if(transpose === undefined){
            console.log('transpose is still experimental');
            return;
        }
        var numSamples = this.sampleData.length;
        function loop(num, samples){
            var data;
            if(cb2){
                cb2('transposing sample ' + (num + 1) +  ' of ' + numSamples);
            }
            //console.log(num, numSamples);
            if(num < numSamples){
                data = samples[num];
                setTimeout(function(){
                    transpose(data.buffer, semitones, function(transposedBuffer){
                        data.buffer = transposedBuffer;
                        loop(++num, samples);
                    });
                }, 10);
            }else{
                if(cb1){
                    console.log('ready');
                    cb1();
                }
            }
        }
        loop(0, this.sampleData);
    };



    // called when midi events arrive from a midi input, from processEvent or from the scheduler
    processEvent = function(midiEvent){
        //console.log(midiEvent.type, midiEvent.velocity);
        var type = midiEvent.type,
            data1, data2, track, output;

        //seconds = seconds === undefined ? 0 : seconds;
        if(midiEvent.time === undefined){
            midiEvent.time = 0;
        }

        if(type === 128 || type === 144){
            if(type === 128){
                if(this.sustainPedalDown === true){
                    midiEvent.sustainPedalDown = true;
                }
                this.stopNote(midiEvent);
            }else{
                this.playNote(midiEvent);
            }
        }else if(type === 176){
            //return;
            data1 = midiEvent.data1;
            data2 = midiEvent.data2;
            if(data1 === 64){ // sustain pedal
                //console.log(this.sustainPedalDown, data1, data2)
                if(data2 === 127){
                    this.sustainPedalDown = true;
                    //console.log('sustain pedal down',this.track.song.id);
                    dispatchEvent(this.track.song, 'sustain_pedal', 'down');
                }else if(data2 === 0){
                    this.sustainPedalDown = false;
                    //console.log('sustain pedal up');
                    dispatchEvent(this.track.song, 'sustain_pedal', 'up');
                    this.stopSustain(midiEvent.time);
                }
            }else if(data1 === 10){ // panning
                // panning is *not* exactly timed -> not possible (yet) with WebAudio
                track = this.track;
                //console.log(data2, remap(data2, 0, 127, -1, 1));
                track.setPanning(remap(data2, 0, 127, -1, 1));
            }else if(data1 === 7){ // volume
                track = this.track;
                output = track.output;
                output.gain.setValueAtTime(data2/127, midiEvent.time);
                /*
                //@TODO: this should be done by a plugin
                if(track.volumeChangeMethod === 'linear'){
                    output.gain.linearRampToValueAtTime(data2/127, seconds);
                }else if(track.volumeChangeMethod === 'equal_power'){
                    volume1 = track.getVolume();
                    volume2 = data2/127;
                    if(volume1 > volume2){
                        values = getEqualPowerCurve(100, 'fadeOut', volume2);
                    }else{
                        values = getEqualPowerCurve(100, 'fadeIn', volume2);
                    }
                    now = sequencer.getTime();
                    output.gain.setValueCurveAtTime(values, seconds, seconds + 0.05);
                }else{
                    output.gain.setValueAtTime(data2/127, seconds);
                }
                */
            }
        }
    };



    stopSustain = function(seconds){
        var midiNote,
            scheduledSamples = this.scheduledSamples,
            sustainPedalSamples = this.sustainPedalSamples;

        objectForEach(sustainPedalSamples, function(sample){
            if(sample !== undefined){
                midiNote = sample.midiNote;
                midiNote.noteOn.sustainPedalDown = undefined;
                midiNote.noteOff.sustainPedalDown = undefined;
                sample.stop(seconds, function(sample){
                    //console.log('stopped sustain pedal up:', sample.id, sample.sourceId);
                    scheduledSamples[sample.sourceId] = null;
                    delete scheduledSamples[sample.sourceId];
                    //delete sustainPedalSamples[sample.sourceId];
                });
            }
        });

        this.sustainPedalSamples = {};
    };



    playNote = function(midiEvent){
        var
            sample,
            sourceId;

        if(!midiEvent.midiNote){
            if(sequencer.debug){
                console.warn('playNote() no midi note');
            }
            return;
        }

        sourceId = midiEvent.midiNote.id;
        sample = this.scheduledSamples[sourceId];
        //console.log('start', sourceId);

        if(sample !== undefined){
            //console.log('already scheduled', sourceId);
            sample.unschedule(0);
        }

        sample = this.createSample(midiEvent);
        // add some extra attributes to the sample
        sample.addData({
            midiNote: midiEvent.midiNote,
            noteName: midiEvent.midiNote.note.fullName,
            sourceId: sourceId
        });
        this.scheduledSamples[sourceId] = sample;
        sample.start(midiEvent);
    };



    stopNote = function(midiEvent){
        if(midiEvent.midiNote === undefined){
            if(sequencer.debug){
                console.warn('stopNote() no midi note');
            }
            return;
        }

        var sourceId = midiEvent.midiNote.id,
            sample = this.scheduledSamples[sourceId],
            scheduledSamples = this.scheduledSamples,
            sustainPedalSamples = this.sustainPedalSamples;

        // if(this.song && this.song.bar >= 6 && this.track.name === 'Sonata # 3'){
        //     console.log('stopNote', midiEvent, seconds, sequencer.getTime());
        // }

        //console.log(midiEvent.sustainPedalDown);
        if(midiEvent.sustainPedalDown === true){
            // while sustain pedal is pressed, bypass note off events
            //console.log('sustain');
            sustainPedalSamples[sourceId] = sample;
            return;
        }

        if(sample === undefined){
            // if(sequencer.debug){
            //     console.log('no sample scheduled (anymore) for this midiEvent', sourceId, seconds);
            // }
            return;
        }

        sample.stop(midiEvent.time, function(){
            scheduledSamples[sourceId] = null;
            delete scheduledSamples[sourceId];
        });
    };



    hasScheduledSamples = function(){
        return isEmptyObject(this.scheduledSamples);
    };



    function unscheduleCallback(sample){
        //console.log(sample.id, 'has been unscheduled');
        sample = null;
    }


    reschedule = function(song){
        var
            min = song.millis,
            max = min + (sequencer.bufferTime * 1000),
            //max2 = min + 20,
            scheduledSamples = this.scheduledSamples,
            id, note, sample;

        for(id in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(id)){
                sample = scheduledSamples[id]; // the sample
                note = sample.midiNote; // the midi note

                if(note === undefined || note.state === 'removed'){
                    sample.unschedule(0, unscheduleCallback);
                    delete scheduledSamples[id];
                }else if(
                        note.noteOn.millis >= min &&
                        note.noteOff.millis < max &&
                        sample.noteName === note.fullName
                    ){
                    // nothing has changed, skip
                    continue;
                }else{
                    //console.log('unscheduled', id);
                    delete scheduledSamples[id];
                    sample.unschedule(null, unscheduleCallback);
                }
            }
        }
/*
        objectForEach(this.scheduledEvents, function(event, eventId){
            if(event === undefined || event.state === 'removed'){
                delete sequencer.timedTasks['event_' + eventId];
                delete this.scheduledEvents[eventId];
            }else if((event.millis >= min && event.millis < max2) === false){
                delete sequencer.timedTasks['event_' + eventId];
                delete this.scheduledEvents[eventId];
            }
        });
*/
    };


    function loop(data, i, maxi, events){
        var arg;
        for(i = 0; i < maxi; i++){
            arg = data[i];
            if(arg === undefined){
                continue;
            }else if(arg.className === 'MidiNote'){
                events.push(arg.noteOn);
            }else if(typeString(arg) === 'array'){
                loop(arg, 0, arg.length);
            }
        }
    }



    // stop specified events or notes, used by stopProcessEvent()
    unschedule = function(){
        var args = Array.prototype.slice.call(arguments),
            events = [],
            i, e, id, sample;

        loop(args, 0, args.length, events);

        for(i = events.length - 1; i >= 0; i--){
            e = events[i];
            if(e.midiNote !== undefined){
                // note on and note off events
                id = e.midiNote.id;
                sample = this.scheduledSamples[id];
                if(sample !== undefined){
                    sample.unschedule(0, unscheduleCallback);
                    delete this.scheduledSamples[id];
                }
            }else if(e.className === 'MidiEvent'){
                // other channel events
                id = e.id;
                delete timedTasks['event_' + id];
                delete this.scheduledEvents[id];
            }
            //console.log(id);
        }
    };



    // stop all events and notes
    allNotesOff = function(){
        var sample, sampleId,
            scheduledSamples = this.scheduledSamples;

        this.stopSustain(0);
        this.sustainPedalDown = false;

        //console.log(scheduledSamples);

        if(scheduledSamples === undefined || isEmptyObject(scheduledSamples) === true){
            return;
        }

        for(sampleId in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(sampleId)){
                //console.log('allNotesOff', sampleId);
                sample = scheduledSamples[sampleId];
                if(sample){
                    sample.unschedule(0, unscheduleCallback);
                }
            }
        }
        this.scheduledSamples = {};

        objectForEach(this.scheduledEvents, function(event, eventId){
            delete timedTasks['event_' + eventId];
        });
        this.scheduledEvents = {};
    };



    allNotesOffPart = function(partId){
        var sample, sampleId,
            scheduledSamples = this.scheduledSamples;

        // make this more subtle
        this.stopSustain(0);
        this.sustainPedalDown = false;

        //console.log(scheduledSamples);

        if(scheduledSamples === undefined || isEmptyObject(scheduledSamples) === true){
            return;
        }

        for(sampleId in scheduledSamples){
            if(scheduledSamples.hasOwnProperty(sampleId)){
                //console.log('allNotesOff', sampleId);
                sample = scheduledSamples[sampleId];
                if(sample){
                    sample.unschedule(0, unscheduleCallback);
                }
            }
        }
        this.scheduledSamples = {};

        objectForEach(this.scheduledEvents, function(event, eventId){
            delete timedTasks['event_' + eventId];
        });
        this.scheduledEvents = {};
    };



    update = function(value){
        var sampleId, sample;
        //console.log(this.scheduledSamples);
        for(sampleId in this.scheduledSamples){
            if(this.scheduledSamples.hasOwnProperty(sampleId)){
                sample = this.scheduledSamples[sampleId];
                if(sample){
                    sample.update(value);
                }
            }
        }
    };



    function createAutoPanner(time){
/*
        var osc = context.createOscillator();
        osc.frequency.value = 50;
        osc.type = 0;
        var gain = context.createGain();
        gain.gain.value = 1;
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start();
        console.log(osc);
        return {
            getValue: function(){
                return osc.frequency.getValueAtTime(time);
            }
        };
*/
        return {
            getValue: function(time){
                return Math.sin(time * 2*Math.PI);
            }
        };
    }

    sequencer.protectedScope.createAutoPanner = createAutoPanner;
    sequencer.protectedScope.setKeyScalingPanning = setKeyScalingPanning;
    sequencer.protectedScope.setKeyScalingRelease = setKeyScalingRelease;
    sequencer.protectedScope.setRelease = setRelease;
    sequencer.protectedScope.transposeSamples = transposeSamples;
    sequencer.protectedScope.processEvent = processEvent;
    sequencer.protectedScope.stopSustain = stopSustain;
    sequencer.protectedScope.playNote = playNote;
    sequencer.protectedScope.stopNote = stopNote;
    sequencer.protectedScope.allNotesOff = allNotesOff;
    sequencer.protectedScope.allNotesOffPart = allNotesOffPart;
    sequencer.protectedScope.update = update;
    sequencer.protectedScope.hasScheduledSamples = hasScheduledSamples;
    sequencer.protectedScope.reschedule = reschedule;
    sequencer.protectedScope.unschedule = unschedule;


    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
        timedTasks = sequencer.protectedScope.timedTasks;
        createReverb = sequencer.createReverb;
        objectForEach = sequencer.protectedScope.objectForEach;
        isEmptyObject = sequencer.protectedScope.isEmptyObject;
        transpose = sequencer.protectedScope.transpose;
        getEqualPowerCurve = sequencer.util.getEqualPowerCurve;
        remap = sequencer.util.remap;
        dispatchEvent = sequencer.protectedScope.songDispatchEvent;
    });

}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        requestAnimationFrame = window.requestAnimationFrame,

        //private
        KeyEditor,

        updateDataKeys = 'newEvents newNotes newParts changedEvents changedNotes changedParts removedEvents removedNotes removedParts'.split(' '),

        // default values
        tickWidth = 0.1,
        pitchHeight = 10,
        barsPerPage = 4,
        snapValueX = 0, // means snaps is off -> ticks value do not get rounded
        //snapValueX = 1, // means snaps to all ticks
        snapValueY = 'chromatic',
        eventWidth = 2,

        ceil = Math.ceil,

        //import
        createIteratorFactory,
        getPosition,
        createPlayhead,
        getScaffoldingBars,
        typeString,
        objectToArray,
        arrayToObject,
        debug,
        round,
        floor,
        createNote,

        //public
        //getLines,
        //xToTicks,
        //yToPitch,

        //private
        setPageData,
        checkNextPage,
        checkScrollPosition,
        dispatchEvent,
        handleKeys;



    KeyEditor = function(song, config){
        this.song = song;
        this.song.keyEditor = this;
        this.playhead = createPlayhead(this.song, 'barsbeats ticks millis', 'keyeditor');

        this.numBars = song.bars;
        this.newNumBars = this.numBars;
        this.eventListeners = {};
        this.interrupt = false;

        this.iteratorFactory = createIteratorFactory(this.song, this);
        this.verticalLine = this.iteratorFactory.createVerticalLineIterator(this);
        this.horizontalLine = this.iteratorFactory.createHorizontalLineIterator(this);
        this.eventIterator = this.iteratorFactory.createEventIterator(this);
        this.noteIterator = this.iteratorFactory.createNoteIterator(this);
        this.partIterator = this.iteratorFactory.createPartIterator(this);


        this.exactFitVertical = config.exactFitVertical || false;
        this.exactFitHorizontal = config.exactFitHorizontal || false;

        this.activeEvents = [];
        this.activeNotes = [];
        this.activeParts = [];

        this.newEvents = [];
        this.newNotes = [];
        this.newParts = [];

        this.changedEvents = [];
        this.changedNotes = [];
        this.changedParts = [];

        this.removedEvents = [];
        this.removedNotes = [];
        this.removedParts = [];

        this.recordedNotesObj = {};
        this.recordedEventsObj = {};

        this.snapshot = {
            activeEvents: this.activeEvents,
            activeNotes: this.activeNotes,
            activeParts: this.activeParts,

            newEvents: this.newEvents,
            newNotes: this.newNotes,
            newParts: this.newParts,

            changedEvents: this.changedEvents,
            changedNotes: this.changedNotes,
            changedParts: this.changedParts,

            removedEvents: this.removedEvents,
            removedNotes: this.removedNotes,
            removedParts: this.removedParts
        };


        if(config.paginate){
            this.paginate = true;
            this.pageNo = 0;
            this.barsPerPage = config.barsPerPage;
            this.pageWidth = config.pageWidth;
            this.pageHeight = config.pageHeight;
            this.width = this.pageWidth;
            this.lowestNote = config.lowestNote || song.lowestNote;
            this.highestNote = config.highestNote || song.highestNote;
            this.pitchRange = this.highestNote - this.lowestNote;
            if(this.exactFitVertical){
                this.pitchHeight = this.height/this.pitchRange;
                this.height = this.pageHeight;
            }else{
                this.pitchHeight = config.pitchHeight || pitchHeight;
                this.height = this.pitchHeight * this.pitchRange;
            }
            //this.startBar = 0;//make this configurable
            setPageData(this, 0);
            checkNextPage(this);

        }else{

            this.setStartPosition(config.startPosition || 1);
            this.setEndPosition(config.endPosition || song.bars + 1);
            this.numTicks = this.endTicks - this.startTicks;

            if(config.width){
                this.width = config.width;
                this.tickWidth = this.width/this.numTicks;
            }else if(config.tickWidth){
                this.tickWidth = config.tickWidth;
                this.width = this.numTicks * this.tickWidth;
                this.exactFitHorizontal = false;
            }else if(config.barsPerPage && config.viewportWidth){
                //@TODO: add support for time measurement changes
                this.barsPerPage = config.barsPerPage;
                this.viewportWidth = config.viewportWidth;
                this.tickWidth = this.viewportWidth/(this.startPosition.ticksPerBar * this.barsPerPage);
                this.width = this.numTicks * this.tickWidth;
                this.scrollX = 0;
                this.scrollPosition = 0;
                this.viewportTicks = this.viewportWidth / this.tickWidth;
                this.maxScrollPosition = ceil(this.width/this.viewportWidth);
                this.scrollLimit = this.viewportWidth/this.tickWidth;
                checkScrollPosition(this);
                this.exactFitHorizontal = false;
            }else if(config.viewportWidth){
                this.viewportWidth = this.width = config.viewportWidth;
                this.tickWidth = this.viewportWidth/this.numTicks;
                this.exactFitHorizontal = true;
            }else{
                this.tickWidth = tickWidth;
                this.width = this.numTicks * this.tickWidth;
                this.exactFitHorizontal = false;
            }


            this.lowestNote = config.lowestNote || song.lowestNote;
            this.highestNote = config.highestNote || song.highestNote;
            this.pitchRange = config.pitchRange || this.highestNote - this.lowestNote + 1;
            //console.log(this.pitchRange);

            if(config.height){
                this.height = config.height;
                this.pitchHeight = this.height/this.pitchRange;
            }else if(config.pitchHeight){
                this.pitchHeight = config.pitchHeight;
                this.height = this.pitchRange * this.pitchHeight;
                this.exactFitVertical = false;
            }else if(config.viewportHeight){
                this.viewportHeight = this.height = config.viewportHeight;
                this.pitchHeight = this.viewportHeight/this.pitchRange;
                this.exactFitVertical = true;
            }else{
                this.pitchHeight = pitchHeight;
                this.height = this.pitchRange * this.pitchHeight;
                this.exactFitVertical = false;
            }

            // this.verticalLine.setStartPosition(this.startPosition);
            // this.verticalLine.setEndPosition(this.endPosition);
            //this.verticalLine.reset(this.startPosition, this.endPosition);
            //this.horizontalLine.reset();
            //this.eventIterator.reset();
            //this.noteIterator.reset();
            //this.partIterator.reset();
            //console.log(this.tickWidth,this.pitchHeight);
        }

        this.scrollX = 0;
        this.scrollY = 0;
        this.currentPage = 1;
        this.numPages = ceil(this.width/this.viewportWidth);

        this.snapValueX = config.snapX === undefined ? snapValueX : config.snapX;
        this.snapValueY = config.snapY === undefined ? snapValueY : config.snapY;
        this.setSnapX(this.snapValueX);
        this.setSnapY(this.snapValueY);

        //console.log(this.maxScrollPosition);
    };


    KeyEditor.prototype.setBarsPerPage = function(bbp){
        this.interrupt = true;

        var tmp = round(this.scrollX/(this.viewportWidth/this.barsPerPage));
        this.barsPerPage = bbp;
        this.tickWidth = this.viewportWidth/(this.startPosition.ticksPerBar * this.barsPerPage);
        this.viewportTicks = this.viewportWidth / this.tickWidth;
        this.width = this.numTicks * this.tickWidth;
        this.verticalLine.reset();
        this.horizontalLine.reset();
        this.eventIterator.reset();
        this.partIterator.reset();
        this.scrollLimit = this.viewportWidth/this.tickWidth;
        this.maxScrollPosition = ceil(this.width/this.viewportWidth);
        this.snapWidth = this.tickWidth * this.snapTicks;

        this.numPages = ceil(this.numBars/this.barsPerPage);
        this.currentPage = floor(this.song.ticks / (this.barsPerPage * this.song.ticksPerBar)) + 1;

        dispatchEvent(this, 'scale', {});

        if(this.song.playing){
            this.scrollPosition = floor(this.song.ticks/this.viewportTicks);
        }else{
            //console.log(tmp,this.scrollPosition);
            this.scrollPosition = ((this.viewportWidth/this.barsPerPage) * tmp)/this.viewportWidth;
            dispatchEvent(this, 'scroll', {x:(this.scrollPosition * this.viewportWidth)});
        }
        this.interrupt = false;
    };


    KeyEditor.prototype.setViewport = function(w, h){
        var draw = false;

        if(this.barsPerPage && w !== this.viewportWidth){
            //@TODO: add support for time measurement changes
            this.viewportWidth = w;
            this.tickWidth = this.viewportWidth/(this.startPosition.ticksPerBar * this.barsPerPage);
            this.viewportTicks = this.viewportWidth / this.tickWidth;
            this.width = this.numTicks * this.tickWidth;
            draw = true;
        }else if(this.exactFitHorizontal === true && w !== this.width){
            this.viewportWidth = this.width = w;
            this.tickWidth = this.width/this.numTicks;
            draw = true;
        }

        if(this.exactFitVertical === true && h !== this.height){
            this.viewportHeight = this.height = h;
            this.pitchHeight = this.height/this.pitchRange;
            draw = true;
        }

        if(draw){
            this.verticalLine.reset();
            this.horizontalLine.reset();
            this.eventIterator.reset();
            this.noteIterator.reset();
            this.partIterator.reset();

            dispatchEvent(this, 'draw', {});
        }
    };


    KeyEditor.prototype.updateSong = function(data){
        this.iteratorFactory.updateSong();

        var key, i = 0, j, k, arr, tmp;

        for(i = updateDataKeys.length - 1; i >= 0; i--){
            key = updateDataKeys[i];
            switch(key){
                case 'newNotes':
                case 'changedNotes':
                    arr = data[key];
                    for(j = arr.length - 1; j >= 0; j--){
                        tmp = arr[j];
                        tmp.bbox = this.getNoteRect(tmp);
                    }
                    break;

                case 'newParts':
                case 'changedParts':
                    arr = data[key];
                    for(j = arr.length - 1; j >= 0; j--){
                        tmp = arr[j];
                        tmp.bbox = this.getPartRect(tmp);
                    }
                    break;
            }
        }

/*
        this.newNumBars = data.numBars;
        // delete numBars otherwise the for loop below doesn't work anymore
        delete data.numBars;

        for(key in data){
            if(data.hasOwnProperty(key)){
                arr = data[key];
                for(j = arr.length - 1; j >= 0; j--){
                    tmp = arr[j];
                    k = floor(i/3);
                    //console.log(i,k);
                    switch(k){
                        case 0: // event arrays
                            //console.log(k,i);
                            //tmp.bbox = getEventRect(tmp);
                            // arr[j] = {
                            //     event: tmp
                            // }
                            break;
                        case 1: // note arrays
                            //console.log(k,i);
                            if(tmp.bbox)
                            console.log(1,tmp.bbox.x)
                            tmp.bbox = this.getNoteRect(tmp);
                            console.log(2,tmp.bbox.x)
                            // arr[j] = {
                            //     note: tmp,
                            //     bbox: this.getNoteRect(tmp)
                            // }
                            break;
                        case 2: // part arrays
                            //console.log(k,i);
                            //console.log(tmp);
                            tmp.bbox = this.getPartRect(tmp);
                            // arr[j] = {
                            //     part: tmp,
                            //     bbox: this.getPartRect(tmp)
                            // }
                            break;
                    }
                }
                i++;
            }
        }
*/
        this.newNumBars = data.numBars;

        this.newEvents = this.newEvents.concat(data.newEvents);
        this.changedEvents = this.changedEvents.concat(data.changedEvents);
        this.removedEvents = this.removedEvents.concat(data.removedEvents);
        this.removedEventsObj = arrayToObject(this.removedEvents, 'id');

        this.newNotes = this.newNotes.concat(data.newNotes);
        this.changedNotes = this.changedNotes.concat(data.changedNotes);
        this.removedNotes = this.removedNotes.concat(data.removedNotes);
        this.removedNotesObj = arrayToObject(this.removedNotes, 'id');

        this.newParts = this.newParts.concat(data.newParts);
        this.changedParts = this.changedParts.concat(data.changedParts);
        this.removedParts = this.removedParts.concat(data.removedParts);
        this.removedPartsObj = arrayToObject(this.removedParts, 'id');
    };


    KeyEditor.prototype.setStartPosition = function(pos){
        if(typeString(pos) !== 'array'){
            pos = ['barsandbeats', pos, 1, 1, 0];
        }

        this.startPosition = getPosition(this.song, pos);
        this.startTicks = this.startPosition.ticks;
        this.startMillis = this.startPosition.millis;
        //console.log('start',pos,this.startTicks);
    };


    KeyEditor.prototype.setEndPosition = function(pos){
        if(typeString(pos) !== 'array'){
            pos = ['barsandbeats', pos, 1, 1, 0];
        }

        this.endPosition = getPosition(this.song, pos);
        this.endTicks = this.endPosition.ticks;
        this.endMillis = this.endPosition.millis;
        //console.log('end',pos,this.endTicks,this.endPosition);
    };


    KeyEditor.prototype.addEventListener = function(id, cb){
        var ids = id.split(' '),
            tmp,
            editor = this,
            eventId;

        ids.forEach(function(id){

            tmp = editor.eventListeners[id];

            if(tmp === undefined){
                editor.eventListeners[id] = [];
                tmp = editor.eventListeners[id];
            }

            eventId = id + '-' + tmp.length;
            tmp.push(cb);
        });
    };


    KeyEditor.prototype.nextPage = function(){
        setPageData(this, this.startBar + this.barsPerPage);
        dispatchEvent(this, 'pagechange', {pageNo: this.pageNo, lastPage: this.lastPage});
    };


    KeyEditor.prototype.prevPage = function(){
        setPageData(this, this.startBar - this.barsPerPage);
        dispatchEvent(this, 'pagechange', {pageNo: this.pageNo, lastPage: this.lastPage});
    };


    KeyEditor.prototype.gotoPage = function(n){
        console.warn('ooops, not implemented yet!');
        return;
        n = n - 1;
        if(n < 0 || n > this.lastPage){
            return;
        }
        this.pageNo = n;
        dispatchEvent(this, 'pagechange', {pageNo: this.pageNo, lastPage: this.lastPage});
        setPageData(this, this.pageNo);
    };


    KeyEditor.prototype.scroll = function(action){

        //this.scrollPosition = floor(this.scrollX/this.viewportWidth);
        var x,
            tmp = round(this.scrollX/(this.viewportWidth/this.barsPerPage));

        this.scrollPosition = ((this.viewportWidth/this.barsPerPage) * tmp)/this.viewportWidth;

        switch(action){
            case '>':
                this.scrollPosition += 1;
                this.scrollPosition = this.scrollPosition > this.maxScrollPosition ? this.maxScrollPosition : this.scrollPosition;
                break;
            case '>>':
                this.scrollPosition = this.maxScrollPosition;
                break;
            case '<':
                this.scrollPosition -= 1;
                this.scrollPosition = this.scrollPosition < 0 ? 0 : this.scrollPosition;
                break;
            case '<<':
                this.scrollPosition = 0;
                break;
            default:
                if(isNaN(action)){
                    return;
                }
                this.scrollPosition = parseInt(action);
        }

        x = this.scrollPosition * this.viewportWidth;
        this.scrollLimit = (x + this.viewportWidth)/this.tickWidth;
        this.currentPage = ceil(x/this.viewportWidth) + 1;
        if(this.currentPage === 0){
            this.currentPage = 1;
        }else if(this.currentPage > this.maxScrollPosition){
            this.currentPage = this.maxScrollPosition;
        }
        //console.log('bar',(this.scrollPosition * this.barsPerPage),'scroll',this.scrollPosition);
        dispatchEvent(this, 'scroll', {x:x});
    };


    KeyEditor.prototype.updateScroll = function(scrollX, scrollY){
        this.scrollX = scrollX;
        this.scrollY = scrollY;
        this.scrollLimit = (scrollX + this.viewportWidth)/this.tickWidth;
    };


    KeyEditor.prototype.getEventRect = function(event){
        //console.log(note.number);
        var
            x = this.ticksToX(event.ticks - this.startTicks, false),
            y = this.pitchToY(event.number),
            w = eventWidth * this.tickWidth,
            h = this.pitchHeight;

        return{
            x: x,
            y: y,
            width: w,
            height: h,
            top: y,
            left: x,
            bottom: y + h,
            right: x + w
        };
    };


    KeyEditor.prototype.getNoteRect = function(note){
        //console.log(note.number);
        var
            x = this.ticksToX(note.ticks - this.startTicks, false),//(note.ticks - this.startTicks) * this.tickWidth,
            y = this.pitchToY(note.number),
            w = note.durationTicks * this.tickWidth,
            h = this.pitchHeight,
            start, end, diff;

        if(note.endless){
            w = (this.song.ticks - note.noteOn.ticks) * this.tickWidth;
        }

///*
        if(this.paginate){

            start = note.ticks;
            end = note.noteOff.ticks;

            if(start < this.startTicks){
                diff = this.startTicks - start;
                start = start + diff - this.startTicks;
                x = start * this.tickWidth;

                end = end > this.endTicks ? this.endTicks : end;
                w = (end - this.startTicks) * this.tickWidth;
            }else{
                return false;
            }
        }

//*/

        return{
            x: x,
            y: y,
            width: w,
            height: h,
            top: y,
            left: x,
            bottom: y + h,
            right: x + w
        };
    };


    KeyEditor.prototype.getPartRect = function(part){
        var stats = part.getStats('noteNumber all'),
            //firstEvent = part.events[0],
            //lastEvent = part.events[part.events.length - 1],
            bbox = {
                // left: (firstEvent.ticks - this.startTicks) * this.tickWidth,
                // right: (lastEvent.ticks - this.startTicks) * this.tickWidth,
                // top: this.height - ((stats.max - this.lowestNote + 1) * this.pitchHeight),
                // bottom: this.height - ((stats.min - this.lowestNote + 1) * this.pitchHeight) + this.pitchHeight,
                top: this.pitchToY(stats.max),// - this.pitchHeight,
                bottom: this.pitchToY(stats.min) + this.pitchHeight,
                left: this.ticksToX(part.start.ticks - this.startTicks, false),
                right: this.ticksToX(part.end.ticks - this.startTicks, false),
                //left: this.ticksToX(part.events[0].ticks, false),
                //right: this.ticksToX(part.events[part.events.length - 1].ticks, false)
            };

        //console.log(stats.min, stats.max);

        bbox.x = bbox.left;
        bbox.y = bbox.top;
        bbox.width = bbox.right - bbox.left;
        bbox.height = bbox.bottom - bbox.top;

        part.bbox = bbox;
        part.stats = stats;
        //console.log(part.id,stats,bbox);
        return bbox;
    };


    KeyEditor.prototype.getBBox = function(arg){
        var type, data;
        if(typeString(arg) === 'string'){
            switch(arg.substring(0,1)){
                case 'E':
                    type = 'event';
                    if(event.type === 144 && event.endEvent !== undefined){
                        data = this.song.findEvent('id = ' + arg);
                    }else{
                        console.error('argument not supported, please check documentation');
                        return;
                    }
                    break;
                case 'P':
                    type = 'part';
                    data = this.song.getPart(arg);
                    break;
                case 'T':
                    type = 'track';
                    break;
                default:
                    console.error('argument not supported, please check documentation');
                    return;
            }
        }else{
            switch(arg.className){
                case 'AudioEvent':
                    type = 'audio';
                    break;
                case 'MidiEvent':
                    type = 'event';
                    break;
                case 'Part':
                    type = 'part';
                    break;
                case 'Track':
                    type = 'track';
                    break;
                default:
                    console.error('argument not supported, please check documentation');
                    return;
            }
        }

        if(data === undefined){
            console.error(arg, 'could not be found');
            return;
        }

        switch(type){
            case 'event':
                return this.getNoteRect(data);
                //break;
            case 'part':
                return this.getPartRect(data);
                //break;
        }
    };


    KeyEditor.prototype.startMoveNote = function(note, x, y){
        if(note.className !== 'MidiNote'){
            if(sequencer.debug >= sequencer.WARN){
                console.warn(note, 'is not a MidiNote');
            }
            return;
        }
        //sequencer.unscheduleEvent(note);
        this.selectedNote = note;
        this.gripX = x - this.selectedNote.bbox.x;
    };


    KeyEditor.prototype.stopMoveNote = function(){
        this.selectedNote = undefined;
    };


    KeyEditor.prototype.moveNote = function(x, y){
        if(this.selectedNote === undefined){
            return;
        }

        var
            newPitch = this.yToPitch(y).number,
            oldPitch = this.selectedNote.pitch,
            newTicks = this.xToTicks(x - this.gripX),
            oldTicks = this.selectedNote.ticks,
            part = this.selectedNote.part,
            update = false;

        //console.log(newTicks, oldTicks, this.gripX, x);

        if(newPitch !== oldPitch){
            part.transposeNote(this.selectedNote, newPitch - oldPitch);
            update = true;
        }

        if(newTicks !== oldTicks){
            part.moveNote(this.selectedNote, newTicks - oldTicks);
            update = true;
        }

        if(update === true){
            this.song.update();
        }
    };


    KeyEditor.prototype.startMovePart = function(part, x, y){
        if(part.className !== 'Part'){
            if(sequencer.debug >= sequencer.WARN){
                console.warn(part, 'is not a Part');
            }
            return;
        }
        this.selectedPart = part;
        this.selectedPart.pitch = this.yToPitch(y).number;
        this.gripX = x - this.selectedPart.bbox.x;
    };


    KeyEditor.prototype.stopMovePart = function(){
        this.selectedPart = undefined;
    };


    KeyEditor.prototype.movePart = function(x, y){
        if(this.selectedPart === undefined){
            return;
        }

        var
            newPitch = this.yToPitch(y).number,
            oldPitch = this.selectedPart.pitch,
            newTicks = this.xToTicks(x - this.gripX),
            oldTicks = this.selectedPart.ticks,
            update = false;

        if(newPitch !== oldPitch){
            this.selectedPart.track.transposePart(this.selectedPart, newPitch - oldPitch);
            this.selectedPart.pitch = newPitch;
            update = true;
        }


        if(newTicks !== oldTicks){
            this.selectedPart.track.movePart(this.selectedPart, newTicks - oldTicks);
            update = true;
        }

        if(update === true){
            this.song.update();
        }
    };


    KeyEditor.prototype.getTicksAt = KeyEditor.prototype.xToTicks = function(x, snap){
        var ticks = ((x + this.scrollX)/this.width) * this.numTicks;
        //console.log(this.scrollX,this.width,this.numTicks,ticks);
        if(snap !== false && this.snapTicks !== 0){
            //ticks = floor(ticks/this.snapTicks) * this.snapTicks;
            ticks = round(ticks/this.snapTicks) * this.snapTicks;
        }
        //console.log(ticks, this.snapTicks);
        return ticks;
    };


    KeyEditor.prototype.getPitchAt = KeyEditor.prototype.yToPitch = function(y){
        //var note = this.highestNote - floor(((y + this.scrollY)/this.height) * this.pitchRange);
        var note = this.highestNote - round(((y + this.scrollY)/this.height) * this.pitchRange);
        note = createNote(note);
        return note;
    };


    KeyEditor.prototype.getXAt = KeyEditor.prototype.ticksToX = function(ticks, snap){
        // var p = ticks/this.numTicks,
        //     x = (p * this.width) - this.scrollX;
        var x = (ticks - this.startTicks) * this.tickWidth;
        if(snap !== false && this.snapWidth !== 0){
            //x = (floor(x/this.snapWidth) * this.snapWidth);
            x = (round(x/this.snapWidth) * this.snapWidth);
        }
        return x;
    };


    KeyEditor.prototype.getYAt = KeyEditor.prototype.pitchToY = function(noteNumber){
        var y = this.height - ((noteNumber - this.lowestNote + 1) * this.pitchHeight);
        return y;
    };


    KeyEditor.prototype.getPositionAt = function(x){
        var ticks = this.getTicksAt(x);
        // console.time('get position')
        // var position = getPosition(this.song,['ticks',ticks]);
        // console.timeEnd('get position')
        // return position;
        //console.time('get position')
        this.playhead.set('ticks', ticks, false);
        //console.timeEnd('get position')
        return this.playhead.get();
    };


    KeyEditor.prototype.getPlayheadX = function(compensateForScroll){
        var x = ((this.song.ticks/this.song.durationTicks) * this.width);
        //var x = ((this.song.millis/this.song.durationMillis) * this.width);
        //var x = (this.song.percentage * this.width);
        x = compensateForScroll === true ? x - this.scrollX : x;
        return x;
    };


   KeyEditor.prototype.setPlayheadToX = function(x){
        var ticks = this.xToTicks(x, false);
        this.song.setPlayhead('ticks', ticks);
    };

    KeyEditor.prototype.getPlayheadPosition = function(compensateForScroll){
        //return (sequencer.percentage * this.width);// - this.scrollX;
        //return ((sequencer.millis/song.durationMillis) * this.width);// - this.scrollX;
        //var x = ((this.song.millis/this.song.durationMillis) * this.width);
        // change to ticks to make tempo changes visible by a faster moving playhead
        var x = ((this.song.ticks/this.song.durationTicks) * this.width);
        x = compensateForScroll === true ? x - this.scrollX : x;
        return x;
    };


    KeyEditor.prototype.setPlayheadPosition = function(type, value){
        //console.log(this.scrollX,value, this.scrollX + value);
        var ticks;
        switch(type){
            case 'x':
                ticks = this.xToTicks(value, false);
                break;
            case 'ticks':
                ticks = value;
                break;
            case 'millis':
                ticks = this.playhead.set('millis', value).ticks;
                break;
            case 'barsbeats':
            case 'barsandbeats':
                ticks = getPosition(this.song, ['barsbeats', value]).ticks;
                break;
        }
        this.song.setPlayhead('ticks', ticks);
    };


    KeyEditor.prototype.getEventAt = function(x, y){
        var position = this.getSongPosition(x),
            pitch = this.getPitchAt(y);
    };


    KeyEditor.prototype.getEventsInRect = function(x, y, w, h){
        var startPos = this.getSongPosition(x),
            endPos = this.getSongPosition(x + w),
            startPitch = this.getPitchAt(y + h),
            endPitch = this.getPitchAt(y);

    };


    KeyEditor.prototype.getNoteAt = function(x, y){
        var position = this.getSongPosition(x),
            pitch = this.getPitchAt(y);
    };


    KeyEditor.prototype.getNotesInRect = function(x, y, w, h){
        var startPos = this.getSongPosition(x),
            endPos = this.getSongPosition(x + w),
            startPitch = this.getPitchAt(y + h),
            endPitch = this.getPitchAt(y);
    };


    // takes x,y and returns snapped x,y
    KeyEditor.prototype.snap = function(x, y){
        return{
            x: this.snapX(x),
            y: this.snapY(y)
        };
    };


    // takes x returns snapped x
    KeyEditor.prototype.snapX = function(x){
        //return floor((x + this.scrollX)/this.snapWidth) * this.snapWidth;
        return round((x + this.scrollX)/this.snapWidth) * this.snapWidth;

    };


    // takes y returns snapped y
    KeyEditor.prototype.snapY = function(y){
        //return floor((y + this.scrollY)/this.snapHeight) * this.snapHeight;
        return round((y + this.scrollY)/this.snapHeight) * this.snapHeight;
    };


    KeyEditor.prototype.setSnapX = function(snapX){
        if(snapX === undefined){
            return;
        }
        //console.log('in', snapX);
        // 4 -> 1, 8 -> 0.5 16 -> 0.25
        var beatLength = 4/this.song.denominator;

        if(snapX === 'off'){
            this.snapTicks = 0;
        }else if(snapX === 'tick'){
            this.snapTicks = 1;
        }else if(snapX === 'beat'){
            // TODO: dependent on current time signature!
            this.snapTicks = this.song.ppq * beatLength;
        }else if(snapX === 'bar'){
            // TODO: dependent on current time signature!
            this.snapTicks = (this.song.ppq * this.song.nominator) * beatLength;
        }else if(isNaN(snapX) && snapX.indexOf('ticks') !== -1){
            this.snapTicks = snapX.replace(/ticks/,'');
            if(isNaN(this.snapTicks)){
                this.snapTicks = this.song.ppq/4;// sixteenth note
            }else{
                this.snapTicks = parseInt(this.snapTicks);
            }
        }else{
            if(isNaN(snapX) || snapX === 0){
                // by default snap is off
                snapX = 0;
                this.snapTicks = 0;
            }else{
                snapX = parseInt(snapX);
                this.snapTicks = (4/snapX) * this.song.ppq;
            }
        }

        //console.log(snapX,this.snapTicks, beatLength);
        this.snapValueX = snapX;
        this.snapWidth = this.tickWidth * this.snapTicks;
    };


    KeyEditor.prototype.setSnapY = function(snapY){
        if(snapY === undefined){
            return;
        }
        this.snapValueY = snapY;
        //todo: add other scales then chromatic
        this.snapHeight = this.pitchHeight;
    };


    KeyEditor.prototype.removeNote = function(note){
        //note.part.removeNote(note);
        //console.log(note.id);
        note.part.removeEvents(note.noteOn, note.noteOff);
        this.song.update();
    };


    KeyEditor.prototype.removePart = function(part){
        part.track.removePart(part);
        this.song.update();
    };


    KeyEditor.prototype.prepareForRecording = function(){
        this.recordedEventsObj = {};
        this.recordedNotesObj = {};
    };


    KeyEditor.prototype.getSnapshot = function(){

        var activeEventsObj,
            activeNotesObj,
            activePartsObj,

            recordedNotesSong,
            //recordingNotesSong,
            recordedEventsSong,

            nonActiveEvents = [],
            nonActiveNotes = [],
            nonActiveParts = [],

            prevActiveEvents = [].concat(this.activeEvents),
            prevActiveNotes = [].concat(this.activeNotes),
            prevActiveParts = [].concat(this.activeParts),

            recordedEvents = [],
            recordedNotes = [],
            recordingNotes = [],

            //prevRemovedNotes = [].concat(this.removedNotes),

            s, e, n, p, i, j, tmp, length,
            startBar, endBar;

        this.activeEvents = [];
        this.activeNotes = [];
        this.activeParts = [];

        this.activeStateChangedEvents = [];
        this.activeStateChangedNotes = [];
        this.activeStateChangedParts = [];

        //if(this.song.bars > this.numBars){
        if(this.newNumBars !== this.numBars){
            startBar = this.numBars;
            endBar = this.song.lastBar + 1;
            //console.log(startBar,endBar)
            //this.verticalLine.setStartPosition(getPosition(song, ['barsbeats', startBar, 1, 1, 0]));
            //this.verticalLine.setEndPosition(getPosition(song, ['barsbeats', endBar, 1, 1, 0]));
            this.endPosition = getPosition(this.song, ['barsbeats', endBar, 1, 1, 0, true]);
            this.verticalLine.reset(getPosition(this.song, ['barsbeats', startBar, 1, 1, 0, true]), this.endPosition);
            this.numBars = this.song.bars;

            //console.log(this.song.lastBar, this.endPosition.barsAsString);

            this.endTicks = this.endPosition.ticks;
            this.numTicks = this.song.durationTicks;
            this.width = this.numTicks * this.tickWidth;
            //console.log('new width', this.width, this.numTicks, this.tickWidth);
            //console.log('song has gotten longer boy!', this.song.bars, this.newNumBars, this.numBars, this.width);
            this.maxScrollPosition = ceil(this.width/this.viewportWidth);
            //this.numPages = ceil(this.width/this.viewportWidth);
            this.numPages = ceil(this.numBars/this.barsPerPage);
        }



        activeEventsObj = this.song.activeEvents;
        for(i in activeEventsObj){
            if(activeEventsObj.hasOwnProperty(i)){
                tmp = activeEventsObj[i];
                this.activeEvents.push(tmp);
                if(tmp.active !== true){
                    tmp.active = true;
                    this.activeStateChangedEvents.push(tmp);
                }
            }
        }

        activeNotesObj = this.song.activeNotes;
        for(i in activeNotesObj){
            if(activeNotesObj.hasOwnProperty(i)){
                tmp = activeNotesObj[i];
                this.activeNotes.push(tmp);
                //console.log(tmp, tmp.active);
                if(tmp.active !== true){
                    tmp.active = true;
                    this.activeStateChangedNotes.push(tmp);
                }
            }
        }

        activePartsObj = this.song.activeParts;
        for(i in activePartsObj){
            if(activePartsObj.hasOwnProperty(i)){
                tmp = activePartsObj[i];
                this.activeParts.push(tmp);
                if(tmp.active !== true){
                    tmp.active = true;
                    this.activeStateChangedParts.push(tmp);
                }
            }
        }

        // fixing issue #4
        recordedEventsSong = this.song.recordedEvents;
        if(recordedEventsSong){
            length = recordedEventsSong.length;
            for(i = 0; i < length; i++){
                tmp = recordedEventsSong[i];
                if(this.recordedEventsObj[tmp.id] === undefined){
                    tmp.bbox = this.getEventRect(tmp);
                    recordedEvents.push(tmp);
                    this.recordedEventsObj[tmp.id] = tmp;
                }
            }
        }

        // fixing issue #4
        recordedNotesSong = this.song.recordedNotes;
        if(recordedNotesSong){
            length = recordedNotesSong.length;
            for(i = 0; i < length; i++){
                tmp = recordedNotesSong[i];
                if(this.recordedNotesObj[tmp.id] === undefined){
                    this.recordedNotesObj[tmp.id] = tmp;
                    tmp.bbox = this.getNoteRect(tmp);
                    recordedNotes.push(tmp);
                    //console.log('recordedNotes', tmp);
                }else if(tmp.endless === true){
                    tmp.bbox = this.getNoteRect(tmp);
                    recordingNotes.push(tmp);
                    //console.log('endless1', tmp);
                }else if(tmp.endless === false){
                    tmp.bbox = this.getNoteRect(tmp);
                    recordingNotes.push(tmp);
                    //console.log('endless2', tmp);
                    tmp.endless = undefined;
                }
                //console.log(tmp.bbox.width);
            }
        }
/*
        recordingNotesObj = this.song.recordingNotes;
        for(i in recordingNotesObj){
            if(recordingNotesObj.hasOwnProperty(i)){
                tmp = recordingNotesObj[i];
                tmp.bbox = this.getNoteRect(tmp);
                recordingNotes.push(tmp);
            }
        }
*/

        for(i = prevActiveEvents.length - 1; i >= 0; i--){
            tmp = prevActiveEvents[i];
            if(tmp === undefined){
                console.warn('event is undefined');
                continue;
            }
            if(activeEventsObj[tmp.id] === undefined){
                nonActiveEvents.push(tmp);
                if(tmp.active !== false){
                    tmp.active = false;
                    this.activeStateChangedEvents.push(tmp);
                }
            }
        }

        for(i = prevActiveNotes.length - 1; i >= 0; i--){
            tmp = prevActiveNotes[i];
            if(tmp === undefined){
                console.warn('note is undefined');
                continue;
            }
            if(activeNotesObj[tmp.id] === undefined){
                nonActiveNotes.push(tmp);
                if(tmp.active !== false){
                    tmp.active = false;
                    this.activeStateChangedNotes.push(tmp);
                }
            }
        }

        for(i = prevActiveParts.length - 1; i >= 0; i--){
            tmp = prevActiveParts[i];
            if(tmp === undefined){
                console.warn('part is undefined');
                continue;
            }
            if(activePartsObj[tmp.id] === undefined){
                nonActiveParts.push(tmp);
                if(tmp.active !== false){
                    tmp.active = false;
                    this.activeStateChangedParts.push(tmp);
                }
            }
        }

        if(this.song.playing){
//            this.currentPage = floor(sequencer.ticks / this.viewportTicks) + 1;
            this.currentPage = floor(this.song.ticks / (this.barsPerPage * this.song.ticksPerBar)) + 1;
        }

/*

        tmp = this.song.parts;
        n = false;
        // check for empty parts and remove them -> @TODO: this should be done in track and/or part!
        for(i = tmp.length - 1; i >= 0; i--){
            p = tmp[i];
            console.log(p.keepWhenEmpty);
            if(p.keepWhenEmpty === true){
                continue;
            }
            if(p.events.length === 0){
                //console.log('empty part!');
                p.track.removePart(p);
                n = true;
            }
        }
        if(n){
            this.song.update();
        }
*/

        s = {

            events: {
                active: this.activeEvents,
                inActive: this.nonActiveEvents,
                recorded: recordedEvents,
                new: this.newEvents,
                changed: this.changedEvents,
                removed: this.removedEvents,
                stateChanged: this.activeStateChangedEvents
            },

            notes: {
                active: this.activeNotes,
                inActive: nonActiveNotes,
                recorded: recordedNotes,
                recording: recordingNotes,
                new: this.newNotes,
                changed: this.changedNotes,
                removed: this.removedNotes,
                stateChanged: this.activeStateChangedNotes
            },

            parts: {
                active: this.activeParts,
                inActive: nonActiveParts,
                new: this.newParts,
                changed: this.changedParts,
                removed: this.removedParts,
                stateChanged: this.activeStateChangedParts

            },


            hasNewBars: startBar !== endBar,
            newWidth: this.width,

            pageNo: this.currentPage,
            lastPage: this.numPages
            //newWidth: song.durationTicks * this.tickWidth

            // hasNewBars: function(){
            //     if(startBar === endBar){
            //         return false;
            //     }
            // }
        };

        this.newEvents = [];
        this.changedEvents = [];
        this.removedEvents = [];

        this.newNotes = [];
        this.changedNotes = [];
        this.removedNotes = [];

        this.newParts = [];
        this.changedParts = [];
        this.removedParts = [];

/*
        tmp = this.song.parts;
        n = false;

        // check for empty parts and remove them -> @TODO: this should be done in track and/or part!
        for(i = tmp.length - 1; i >= 0; i--){
            p = tmp[i];
            if(p.keepWhenEmpty === true){
                continue;
            }
            if(p.events.length === 0){
                //console.log('empty part!');
                p.track.removePart(p);
                n = true;
            }
        }
        if(n){
            this.song.update();
        }
*/

        return s;
    };


    // flipping pages

    setPageData = function(editor, startBar){
        //editor.pageNo = no;
        editor.numTicks = 0;

        editor.startBar = startBar > 0 ? startBar : 0;
        editor.startBar = editor.startBar > editor.numBars - editor.barsPerPage ? editor.numBars - editor.barsPerPage : editor.startBar;
        editor.endBar = startBar + editor.barsPerPage;
        editor.endBar = editor.endBar > editor.numBars ? editor.numBars : editor.endBar;
        editor.endBar = editor.endBar < editor.barsPerPage ? editor.barsPerPage : editor.endBar;

        console.log(startBar,editor.startBar,editor.endBar,editor.numBars,editor.numBars - editor.barsPerPage);
        var i;

        for(i = editor.startBar; i < editor.endBar; i++){
            editor.numTicks += editor.bars[i].ticksPerBar;
        }
        editor.tickWidth = editor.pageWidth/editor.numTicks;

        editor.startPosition = editor.bars[editor.startBar];
        editor.endPosition = editor.bars[editor.endBar];
        editor.startTicks = editor.startPosition.ticks;
        editor.endTicks = editor.endPosition.ticks;

        editor.verticalLine.reset();
        editor.horizontalLine.reset();
        editor.eventIterator.reset();
        //console.log('nextPage',editor.startPosition,editor.endPosition);
    };


    checkNextPage = function(editor){
        if(editor.song.playing() && editor.song.ticks >= editor.endTicks){
            //console.log('nextpage');
            editor.nextPage();
            //dispatchEvent(this, 'pagechange', {pageNo: this.pageNo, lastPage: this.lastPage});
        }
        requestAnimationFrame(function(){
            checkNextPage(editor);
        });
    };


    checkScrollPosition = function(editor){
        //console.log(editor.song.ticks,editor.scrollLimit,interrupt);
        if(editor.song.playing && editor.interrupt === false){
            if(editor.song.ticks >= editor.scrollLimit){
                dispatchEvent(editor, 'scroll', {x: editor.scrollX + editor.viewportWidth});
                editor.scrollLimit += (editor.viewportWidth/editor.tickWidth);
                //editor.currentPage++;
            }else{
                var x = (floor(editor.song.ticks/editor.viewportTicks) * editor.viewportTicks) * editor.tickWidth;
                if(editor.scrollX !== x){
                    dispatchEvent(editor, 'scroll', {x:x});
                }
            }
        }
        requestAnimationFrame(function(){
            checkScrollPosition(editor);
        });
    };


    dispatchEvent = function(editor, id, data){
        //console.log(id,eventListeners);
        editor.eventListeners[id].forEach(function(cb){
            cb(data);
        });
    };


    handleKeys = function(editor){
        var p = editor.selectedPart,
            n = editor.selectedNote;

        if(p !== undefined){
            p.track.removePart(p);
            this.song.update();
        }else if(n !== undefined){
            n.part.removeNote(n);
            this.song.update();
        }
    };


    sequencer.createKeyEditor = function(song, config){
        return  new KeyEditor(song, config);
    };


    sequencer.protectedScope.addInitMethod(function(){
        getPosition = sequencer.protectedScope.getPosition;
        createPlayhead = sequencer.protectedScope.createPlayhead;
        createNote = sequencer.createNote;
        debug = sequencer.debug;
        floor = sequencer.protectedScope.floor;
        round = sequencer.protectedScope.round;
        typeString = sequencer.protectedScope.typeString;
        objectToArray = sequencer.protectedScope.objectToArray;
        arrayToObject = sequencer.protectedScope.arrayToObject;
        getScaffoldingBars = sequencer.protectedScope.getScaffoldingBars;
        createIteratorFactory = sequencer.protectedScope.createKeyEditorIteratorFactory;
    });

}());
(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

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

}());(function(){

    'use strict';

    var
        sequencer = window.sequencer,

        minWidthSixteenth = 0.042,
        minWidthBeat = 0.02,
/*
        events,
        numEvents,
        notes,
        numNotes,
        parts,
        numParts,

        song,
        editor,
        position,
*/
        // import
        createPlayhead, // defined in playhead.js
        createNote; // defined in note.js

        //public
/*
        create,
        updateSong,
        createVerticalLineIterator,
        createHorizontalLineIterator,
        createEventIterator,
        createNoteIterator,
        createPartIterator;
*/

    function Factory(song, editor){
        this.song = song;
        this.editor = editor;
        //console.log(this.editor);
        //this.position = createPlayhead(this.song, 'barsbeats ticks millis', 'iterators');
        this.position = createPlayhead(this.song, 'all', 'iterators');
        this.updateSong();
    }

/*
    create = function(s, e){
        song = s;
        editor = e;
        updateSong();
        position = createPlayhead(song, 'barsbeats ticks millis', 'iterators');
        return {
            updateSong: updateSong,
            createVerticalLineIterator: createVerticalLineIterator,
            createHorizontalLineIterator: createHorizontalLineIterator,
            createEventIterator: createEventIterator,
            createNoteIterator: createNoteIterator,
            createPartIterator: createPartIterator
        };
    };
*/

    Factory.prototype.updateSong = function(){
        this.events = this.song.events;
        this.numEvents = this.events.length;
        this.notes = this.song.notes;
        this.numNotes = this.notes.length;
        this.parts = this.song.parts;
        this.numParts = this.parts.length;
        this.position.updateSong();
    };


    Factory.prototype.createVerticalLineIterator = function(){
        var supportedTypes = 'bar beat sixteenth',
            lineType,
            numTicks = {},
            tickWidth,
            offset,
            type,
            ticks,
            endTicks,
            bar,
            beat,
            sixteenth,
            nominator,
            numSixteenth,
            startPosition,
            endPosition,
            editor = this.editor,
            position = this.position,
            // widthBar,
            // widthBeat,
            // widthSixteenth,
            data, next, hasNext, reset, getData, setType;
            //setStartPosition, setEndPosition;


        getData = function(){
            //console.log('ticks',ticks);
            data = position.update('ticks', ticks);
            numTicks.bar = data.ticksPerBar;
            numTicks.beat = data.ticksPerBeat;
            numTicks.sixteenth = data.ticksPerSixteenth;
            nominator = data.nominator;
            numSixteenth = data.numSixteenth;
            //console.log(numTicks,nominator,numSixteenth);
            //console.log(ticks, data);
        };

        next = function(t){
            if(t){
                type = t;
                if(tickWidth < minWidthBeat){
                    type = 'bar';
                }else if(tickWidth < minWidthSixteenth){
                    type = 'beat';
                }
            }

            switch(type){
                case 'sixteenth':
                    lineType = 'sixteenth';
                    sixteenth++;
                    if(sixteenth > numSixteenth){
                        lineType = 'beat';
                        sixteenth = 1;
                        beat++;
                        if(beat > nominator){
                            lineType = 'bar';
                            beat = 1;
                            bar++;
                        }
                    }
                    break;
                case 'beat':
                    lineType = 'beat';
                    sixteenth = 1;
                    beat++;
                    if(beat > nominator){
                        lineType = 'bar';
                        beat = 1;
                        bar++;
                    }
                    break;
                case 'bar':
                    lineType = 'bar';
                    sixteenth = 1;
                    beat = 1;
                    bar++;
                    break;
            }
            ticks += numTicks[type];
            getData();
            if(ticks > endTicks){
                return false;
            }
            //console.log(bar,beat,sixteenth);
            return {
                x: (ticks * tickWidth) - offset,
                bar: bar,
                beat: beat,
                sixteenth: sixteenth,
                // widthBar: widthBar,
                // widthBeat: widthBeat,
                // widthSixteenth: widthSixteenth,
                type: lineType,
                position: data
            };
        };

        hasNext = function(t){
            var diffTicks = endTicks - ticks,
                result = false;

            if(t){
                type = t;
                if(tickWidth < minWidthBeat){
                    type = 'bar';
                }else if(tickWidth < minWidthSixteenth){
                    type = 'beat';
                }
            }

            switch(type){
                case 'bar':
                    result = diffTicks >= numTicks[type];
                    break;
                case 'beat':
                    result = diffTicks >= numTicks[type];
                    break;
                case 'sixteenth':
                    result = diffTicks >= numTicks[type];
                    break;
            }
            //console.log(ticks,endTicks,diffTicks);
            return result;
        };

        reset = function(start, end){
            startPosition = start || editor.startPosition;
            endPosition = end || editor.endPosition;
            ticks = startPosition.ticks;
            bar = startPosition.bar;
            beat = startPosition.beat;
            sixteenth = startPosition.sixteenth;
            //console.log(startPosition.barsAsString);
            //console.log(endPosition.barsAsString);
            //console.log(ticks,bar,beat,sixteenth);
            endTicks = endPosition.ticks;
            tickWidth = editor.tickWidth;
            offset = 0;//ticks * this.editor.tickWidth;
            position.set('ticks', ticks);
            //console.log(tickWidth,offset);
            if(tickWidth < minWidthBeat){
                type = 'bar';
            }else if(tickWidth < minWidthSixteenth){
                type = 'beat';
            }
            getData();
            // widthBar = numTicks.bar * this.editor.tickWidth;
            // widthBeat = numTicks.beat * this.editor.tickWidth;
            // widthSixteenth = numTicks.sixteenth * this.editor.tickWidth;
        };
/*
        setStartPosition = function(position){
            startPosition = position;
        };

        setEndPosition = function(position){
            endPosition = position;
        };
*/
        setType = function(t){
            type = t;
            if(tickWidth < minWidthBeat){
                type = 'bar';
            }else if(tickWidth < minWidthSixteenth){
                type = 'beat';
            }
        };

        //console.log('ver');
        return{
            next: next,
            reset: reset,
            hasNext: hasNext,
            setType: setType
            //setStartPosition: setStartPosition,
            //setEndPosition: setEndPosition,
        };
    };


    Factory.prototype.createHorizontalLineIterator = function(){
        var index,
            pitch,
            range,
            pitchHeight,
            data = {},
            editor = this.editor,
            next, hasNext, reset;

        next = function(type){
            data = {
                note: createNote(pitch),
                y: (index * pitchHeight)
            };
            pitch--;
            index++;
            return data;
        };

        hasNext = function(type){
            var result = false;
            switch(type){
                case 'chromatic':
                    result = index < range;
                    break;
            }
            return result;
        };

        reset = function(){
            index = 0;
            pitch = editor.highestNote;
            range = editor.pitchRange;
            pitchHeight = editor.pitchHeight;
            //console.log('reset',pitch,range,pitchHeight);
        };

        //console.log('hor');
        return{
            next: next,
            reset: reset,
            hasNext: hasNext
        };
    };


    Factory.prototype.createEventIterator = function(){
        var startTicks,
            endTicks,
            hasNextCalled,
            index,
            nextEvent,
            editor = this.editor,
            position = this.position,
            events = this.events,
            numEvents = this.numEvents,
            types = '',
            next, hasNext, reset, setTypes;

        hasNext = function(t){
            types = t || types;
            hasNextCalled = true;
            index++;
            if(index === numEvents){
                return false;
            }

            nextEvent = events[index];
            if(types === ''){
                return nextEvent.ticks <= endTicks;
            }
            return false;
        };

        next = function(t){
            types = t || types;
            if(!hasNextCalled){
                hasNext(types);
            }
            hasNextCalled = false;
            return nextEvent;
        };

        reset = function(){
            var event;
            startTicks = editor.startTicks;
            endTicks = editor.endTicks;
            hasNextCalled = false;
            if(editor.paginate === true && sequencer.isPlaying() === true){
                return;
            }
            /*
            for(index = 0; index < numEvents; index++){
                event = events[index];
                if(event.ticks >= startTicks){
                    break;
                }
            }
            index--;
            */
            index = position.get().eventIndex - 2;
            //console.log(events);
            //console.log('ke',sequencer.isPlaying(),index,sequencer.eventIndex);
        };

        setTypes = function(){
            var args = Array.prototype.slice.call(arguments);
            args.forEach(function(type){
                types += type + ' ';
            });
        };

        return{
            next: next,
            reset: reset,
            hasNext: hasNext,
            setTypes: setTypes
        };
    };


    Factory.prototype.createNoteIterator = function(){
        var startTicks,
            endTicks,
            hasNextCalled,
            index,
            newNote,
            nextNote,
            editor = this.editor,
            song = this.song,
            notes = this.notes,
            numNotes = this.numNotes,
            types = '',
            next, hasNext, reset, setTypes;

        hasNext = function(t){
            types = t || types;
            hasNextCalled = true;
            index++;
            if(index === this.numNotes){
                return false;
            }

            newNote = false;

            for(;index < numNotes; index++){
                nextNote = notes[index];
                //console.log(nextNote);

                if(nextNote.ticks >= endTicks){
                    //console.log('skip',nextNote.ticks);
                    break;
                }

                if(editor.paginate){
                    // show note that has started on previous page
                    if(nextNote.ticks < startTicks && nextNote.noteOff.ticks > startTicks){
                        newNote = true;
                    }else if(nextNote.ticks < endTicks){
                        newNote = true;
                    }
                    if(newNote){
                        break;
                    }
                }else{
                    newNote = nextNote.ticks <= endTicks;
                    //console.log(newNote, nextNote.ticks, nextNote.noteOff.ticks, startTicks, endTicks);
                    if(newNote){
                        break;
                    }
                }

                //console.log(types.indexOf(nextEvent.type) !== -1,types,nextEvent.type,nextEvent.ticks,endTicks);
            }
            //console.log(index,nextEvent.ticks,endTicks,newEvent);
            return newNote;
        };

        next = function(t){
            types = t || types;
            if(!hasNextCalled){
                hasNext(types);
            }
            hasNextCalled = false;
            //return nextEvent;
            nextNote.bbox = editor.getNoteRect(nextNote);
            return nextNote;
        };

        reset = function(){
            var note;
            startTicks = editor.startTicks;
            endTicks = editor.endTicks;
            notes = song.notes;
            numNotes = song.numNotes;
            //console.log(startTicks, endTicks);
            hasNextCalled = false;
            if(editor.paginate === true && sequencer.isPlaying() === true){
                return;
            }

            for(index = 0; index < numNotes; index++){
                note = notes[index];
                //console.log(note, note.ticks, startTicks);
                if(note.ticks >= startTicks){
                    break;
                }
            }
            index--;
        };

        return{
            next: next,
            reset: reset,
            hasNext: hasNext
        };
    };


    Factory.prototype.createPartIterator = function(){
        var index,
            max,
            part,
            data = {},
            editor = this.editor,
            song = this.song,
            parts = this.parts,
            next, hasNext, reset;

        next = function(type){
            part = parts[index++];
            part.bbox = editor.getPartRect(part);
            return part;
        };

        hasNext = function(type){
            return index < max;
        };

        reset = function(){
            parts = song.parts;
            max = song.numParts;
            index = 0;
        };

        return{
            next: next,
            reset: reset,
            hasNext: hasNext
        };
    };


    sequencer.protectedScope.createKeyEditorIteratorFactory = function(song, editor){
        return new Factory(song, editor);
    };


    sequencer.protectedScope.addInitMethod(function(){
        createNote = sequencer.createNote;
        createPlayhead = sequencer.protectedScope.createPlayhead;
    });

}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //import
        context, //defined in open_module.js
        findItem, //defined in asset_manager.js
        getPosition, //defined in position.js
        objectForEach, //defined in util.js
        createMidiNote, //defined in midi_note.js
        parseEvents, //defined in parse_events.js
        parseMetronomeEvents, //defined in song_update.js

        methodMap = {
            volume: 'setVolume',
            instrument: 'setInstrument',
            noteNumberAccentedTick: 'setNoteNumberAccentedTick',
            noteNumberNonAccentedTick: 'setNoteNumberNonAccentedTick',
            velocityAccentedTick: 'setVelocityAccentedTick',
            velocityNonAccentedTick: 'setVelocityNonAccentedTick',
            noteLengthAccentedTick: 'setNoteLengthAccentedTick',
            noteLengthNonAccentedTick: 'setNoteLengthNonAccentedTick'
        },

        Metronome;


    function checkNumber(value){
        //console.log(value);
        if(isNaN(value)){
            if(sequencer.debug){
                console.log('please provide a number');
            }
            return false;
        }
        if(value < 0 || value > 127){
            if(sequencer.debug){
                console.log('please provide a number between 0 and 127');
            }
            return false;
        }
        return value;
    }


    Metronome = function(song){
        this.song = song;
        this.track = sequencer.createTrack(this.song.id + '_metronome', 'metronome');
        this.part = sequencer.createPart();
        this.track.addPart(this.part);
        this.track.connect(this.song.gainNode);
        this.events = [];
        this.precountEvents = [];
        this.noteNumberAccented = 61;
        this.noteNumberNonAccented = 60;
        this.volume = 1;
        this.velocityNonAccented = 100;
        this.velocityAccented = 100;
        this.noteLengthNonAccented = song.ppq/4; // sixteenth notes -> don't make this too short if your sample has a long attack!
        this.noteLengthAccented = song.ppq/4;
        this.track.setInstrument('heartbeat/metronome');
        this.precountDurationInMillis = 0;
        this.bars = 0;
        //this.reset();
    };


    function createEvents(metronome, startBar, endBar, id){

        var i, j,
            data,
            velocity,
            noteLength,
            noteNumber,
            beatsPerBar,
            ticksPerBeat,
            ticks = 0,
            events = [],
            song = metronome.song,
            noteOn, noteOff, note;

        //console.log(startBar, endBar);

        for(i = startBar; i <= endBar; i++){
            data = getPosition(song, ['barsbeats', i]);
            beatsPerBar = data.nominator;
            ticksPerBeat = data.ticksPerBeat;

            for(j = 0; j < beatsPerBar; j++){
                noteNumber = j === 0 ? metronome.noteNumberAccented : metronome.noteNumberNonAccented;
                noteLength = j === 0 ? metronome.noteLengthAccented : metronome.noteLengthNonAccented;
                velocity = j === 0 ? metronome.velocityAccented : metronome.velocityNonAccented;

                noteOn = sequencer.createMidiEvent(ticks, 144, noteNumber, velocity);
                noteOff = sequencer.createMidiEvent(ticks + noteLength, 128, noteNumber, 0);

                if(id === 'precount'){
                    noteOn.part = {id: 'precount'};
                    noteOn.track = metronome.track;
                    noteOff.part = {id: 'precount'};
                    noteOff.track = metronome.track;
                }

                note = createMidiNote(noteOn, noteOff);
                events.push(noteOn, noteOff);

                ticks += ticksPerBeat;
            }
        }

        return events;
    }


    Metronome.prototype.init = function(id, startBar, endBar){
        id = id === undefined ? 'init' : id;
        //console.log('metronome', id, this.song.bars, startBar, endBar);
        if(this.part.numEvents > 0){
            this.part.removeEvents(this.part.events);
        }
        this.events = createEvents(this, startBar, endBar, id);
        this.numEvents = this.events.length;
        this.part.addEvents(this.events);
        this.bars = this.song.bars;
        parseMetronomeEvents(this.song, this.events);
    };


    Metronome.prototype.update = function(startBar, endBar){
        if(startBar === 0){
            startBar = 1;
        }
        //console.log('metronome', this.song.bars, startBar, endBar);
        // for now, just re-init the metronome
        if(startBar !== undefined && endBar !== undefined){
            this.init('update', startBar, endBar);
        }else{
            this.init('update', 1, this.song.bars);
        }

        //this.allNotesOff();
        //this.song.scheduler.updateSong();

        // var events = createEvents(this, startBar, endBar, 'update');
        // this.events = this.events.concat(events);
        // parseMetronomeEvents(this.song, this.events);
    };


    Metronome.prototype.updateConfig = function(){
        this.init('configure', 1, this.bars);
        this.allNotesOff();
        this.song.scheduler.updateSong();
    };


    Metronome.prototype.configure = function(config){
        var me = this;

        objectForEach(config, function(value, key){
            me[methodMap[key]](value);
            //console.log(key, me[methodMap[key]]);
        });
        this.updateConfig();
    };


    Metronome.prototype.setInstrument = function(instrument){
        if(instrument.className !== 'Instrument'){
            instrument = sequencer.createInstrument(instrument);
        }
        if(instrument !== false){
            this.track.setInstrument(instrument);
        }else{
            this.track.setInstrument('heartbeat/metronome');
        }
        this.updateConfig();
    };


    Metronome.prototype.setNoteLengthAccentedTick = function(value){
        if(isNaN(value)){
            if(sequencer.debug >= 2){
                console.warn('please provide a number');
            }
        }
        this.noteLengthAccented = value;
        this.updateConfig();
    };


    Metronome.prototype.setNoteLengthNonAccentedTick = function(value){
        if(isNaN(value)){
            if(sequencer.debug >= 2){
                console.warn('please provide a number');
            }
        }
        this.noteLengthNonAccented = value;
        this.updateConfig();
    };


    Metronome.prototype.setVelocityAccentedTick = function(value){
        value = checkNumber(value);
        if(value !== false){
            this.velocityAccented = value;
        }else if(sequencer.debug >= 2){
            console.warn('please provide a number');
        }
        this.updateConfig();
    };


    Metronome.prototype.setVelocityNonAccentedTick = function(value){
        value = checkNumber(value);
        if(value !== false){
            this.velocityNonAccented = value;
        }else if(sequencer.debug >= 2){
            console.warn('please provide a number');
        }
        this.updateConfig();
    };


    Metronome.prototype.setNoteNumberAccentedTick = function(value){
        value = checkNumber(value);
        if(value !== false){
            this.noteNumberAccented = value;
        }else if(sequencer.debug >= 2){
            console.warn('please provide a number');
        }
        this.updateConfig();
    };


    Metronome.prototype.setNoteNumberNonAccentedTick = function(value){
        value = checkNumber(value);
        if(value !== false){
            this.noteNumberNonAccented = value;
        }else if(sequencer.debug >= 2){
            console.warn('please provide a number');
        }
        this.updateConfig();
    };


    Metronome.prototype.reset = function(){
        this.volume = 1;
        this.track.setInstrument('heartbeat/metronome');

        this.noteNumberAccented = 61;
        this.noteNumberNonAccented = 60;

        this.velocityAccented = 100;
        this.velocityNonAccented = 100;

        this.noteLengthAccented = this.song.ppq/4;
        this.noteLengthNonAccented = this.song.ppq/4;
    };


    Metronome.prototype.allNotesOff = function(){
        if(this.track.instrument){
            this.track.instrument.allNotesOff();
        }
    };


    Metronome.prototype.createPrecountEvents = function(precount){
        if(precount <= 0){
            return;
        }
        var endPos = this.song.getPosition('barsbeats', this.song.bar + precount);

        this.index = 0;
        this.millis = 0;
        this.startMillis = this.song.millis;
        this.precountDurationInMillis = endPos.millis - this.startMillis;
        this.precountEvents = createEvents(this, this.song.bar, endPos.bar - 1, 'precount');
        parseEvents(this.song, this.precountEvents);
        //console.log(this.song.bar, endPos.bar, precount, this.precountEvents.length);
        //console.log(this.precountEvents, this.precountDurationInMillis, startTicks, endTicks);
    };


    // called by scheduler.js
    Metronome.prototype.getPrecountEvents = function(maxtime){
        var events = this.precountEvents,
            maxi = events.length, i, event,
            result = [];

        //console.log(maxtime, maxi, this.index, this.millis);

        for(i = this.index; i < maxi; i++){
            event = events[i];
            //console.log(event.millis, maxtime, this.millis);
            if(event.millis < maxtime){
                event.time = this.startTime + event.millis;
                result.push(event);
                this.index++;
            }else{
                break;
            }
        }
        return result;
    };


    Metronome.prototype.setVolume = function(value){
        this.track.setVolume(value);
    };


    sequencer.protectedScope.createMetronome = function(song){
        return new Metronome(song);
    };

    sequencer.protectedScope.addInitMethod(function initMetronome(){
        context = sequencer.protectedScope.context;
        findItem = sequencer.protectedScope.findItem;
        getPosition = sequencer.protectedScope.getPosition;
        createMidiNote = sequencer.createMidiNote;
        objectForEach = sequencer.util.objectForEach;
        parseEvents = sequencer.protectedScope.parseEvents;
        parseMetronomeEvents = sequencer.protectedScope.parseMetronomeEvents;
    });
}());(function(){

    /**
        @public
        @class MidiEvent
        @param time {int} the time that the event is scheduled
        @param type {int} type of MidiEvent, e.g. NOTE_ON, NOTE_OFF or, 144, 128, etc.
        @param data1 {int} if type is 144 or 128: note number
        @param [data2] {int} if type is 144 or 128: velocity


        @example
        // plays the central c at velocity 100
        var event = sequencer.createMidiEvent(120, sequencer.NOTE_ON, 60, 100);

        // pass arguments as array
        var event = sequencer.createMidiEvent([120, sequencer.NOTE_ON, 60, 100]);

        // if you pass a MidiEvent instance a copy/clone will be returned
        var copy = sequencer.createMidiEvent(event);
    */


    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        slice = Array.prototype.slice,

        //import
        createNote, // → defined in note.js
        typeString, // → defined in utils.js

        MidiEvent,
        midiEventId = 0;


    /*
       arguments:
       - [ticks, type, data1, data2]
       - ticks, type, data1, data2

       data1 and data2 are optional but must be numbers if provided
    */
    MidiEvent = function(args){
        var data, note;

        this.className =  'MidiEvent';
        this.id = 'M' + midiEventId + new Date().getTime();
        this.eventNumber = midiEventId;
        this.channel = 'any';
        this.time = 0;
        //this.offset = 0;
        //console.log(midiEventId, this.type, this.id);
        this.muted = false;
        //console.log(midiEventId, this.type);
        midiEventId++;

        if(!args){
            // bypass for cloning
            return;
        }

        //console.log('create', args);

        if(typeString(args[0]) === 'midimessageevent'){
            console.log('midimessageevent');
            return;
            //data = [0].concat(args[0].data);
        }else if(typeString(args[0]) === 'array'){
            data = args[0];
        }else if(typeString(args[0]) === 'number' && typeString(args[1]) === 'number'){
            data = [args[0],args[1]];
            if(args.length >= 3 && typeString(args[2]) === 'number'){
                data.push(args[2]);
            }
            if(args.length === 4 && typeString(args[3]) === 'number'){
                data.push(args[3]);
            }
            if(args.length === 5 && typeString(args[4]) === 'number'){
                data.push(args[4]);//channel
            }
        }else{
            if(sequencer.debug >= 1){
                console.error('wrong number of arguments, please consult documentation');
            }
            return false;
        }
        //console.log(data);

        this.ticks = data[0];
        this.status = data[1];
        this.type = (this.status >> 4) * 16;
        //console.log(this.type, this.status);
        if(this.type >= 0x80){
            //the higher 4 bits of the status byte is the command
            this.command = this.type;
            //the lower 4 bits of the status byte is the channel number
            this.channel = (this.status & 0xF) + 1; // from zero-based to 1-based
        }else{
            this.type = this.status;
            this.channel = data[4] || 'any';
        }

        //this.sortIndex = parseInt(this.type, 10) + parseInt(this.ticks, 10); // note off events come before note on events
        this.sortIndex = this.type + this.ticks; // note off events come before note on events
        //console.log(this.sortIndex);

        //console.log(this.status, this.type, this.channel);

        switch(this.type){
            case 0x0:
                break;
            case 0x80:
                this.data1 = data[2];
                note = createNote(this.data1);
                this.note = note;
                this.noteName = note.fullName;
                this.noteNumber = note.number;
                this.octave = note.octave;
                this.frequency = note.frequency;
                this.data2 = 0;//data[3];
                this.velocity = this.data2;
                break;
            case 0x90:
                this.data1 = data[2];//note number
                this.data2 = data[3];//velocity
                if(this.data2 === 0){
                    //if velocity is 0, this is a NOTE OFF event
                    this.type = 0x80;
                }
                note = createNote(this.data1);
                this.note = note;
                this.noteName = note.fullName;
                this.noteNumber = note.number;
                this.octave = note.octave;
                this.frequency = note.frequency;
                this.velocity = this.data2;
                //console.log(data[2], this.note);
                break;
            case 0x51:
                this.bpm = data[2];
                break;
            case 0x58:
                this.nominator = data[2];
                this.denominator = data[3];
                break;
            case 0xB0:// control change
                this.data1 = data[2];
                this.data2 = data[3];
                this.controllerType = data[2];
                this.controllerValue = data[3];
                break;
            case 0xC0:// program change
                this.data1 = data[2];
                this.programNumber = data[2];
                break;
            case 0xD0:// channel pressure
                this.data1 = data[2];
                this.data2 = data[3];
                break;
            case 0xE0:// pitch bend
                this.data1 = data[2];
                this.data2 = data[3];
                //console.log('pitch bend');
                break;
            case 0x2F:
                break;
            default:
                console.warn('not a recognized type of midi event!');
        }
    };

    /**
        Creates a copy of the MidiEvent
        @memberof MidiEvent
        @function clone
        @instance
    */
    MidiEvent.prototype.clone = MidiEvent.prototype.copy = function(){
        var event = new MidiEvent(),
            property;

        for(property in this){
            if(this.hasOwnProperty(property)){
                //console.log(property);
                if(property !== 'id' && property !== 'eventNumber' && property !== 'midiNote'){
                    event[property] = this[property];
                }
                event.song = undefined;
                event.track = undefined;
                event.trackId = undefined;
                event.part = undefined;
                event.partId = undefined;
            }
        }
        return event;
    };


    /**
    *  Transposes the MidiEvent by the provided number of semitones
    *  @param {int} semi
    */
    MidiEvent.prototype.transpose = function(semi){
        if(this.type !== 0x80 && this.type !== 0x90){
            if(sequencer.debug >= 1){
                console.error('you can only transpose note on and note off events');
            }
            return;
        }

        //console.log('transpose', semi);
        if(typeString(semi) === 'array'){
            var type = semi[0];
            if(type === 'hertz'){
                //convert hertz to semi
            }else if(type === 'semi' || type === 'semitone'){
                semi = semi[1];
            }
        }else if(isNaN(semi) === true){
            if(sequencer.debug >= 1){
                console.error('please provide a number');
            }
            return;
        }

        var tmp = this.data1 + parseInt(semi, 10);
        if(tmp < 0){
            tmp = 0;
        }else if(tmp > 127){
            tmp = 127;
        }
        this.data1 = tmp;
        var note = createNote(this.data1);
        this.note = note;
        this.noteName = note.fullName;
        this.noteNumber = note.number;
        this.octave = note.octave;
        this.frequency = note.frequency;

        if(this.midiNote !== undefined){
            this.midiNote.pitch = this.data1;
        }

        if(this.state !== 'new'){
            this.state = 'changed';
        }
        if(this.part !== undefined){
            this.part.needsUpdate = true;
        }
    };


    MidiEvent.prototype.setPitch = function(pitch){
        if(this.type !== 0x80 && this.type !== 0x90){
            if(sequencer.debug >= 1){
                console.error('you can only set the pitch of note on and note off events');
            }
            return;
        }
        if(typeString(pitch) === 'array'){
            var type = pitch[0];
            if(type === 'hertz'){
                //convert hertz to pitch
            }else if(type === 'semi' || type === 'semitone'){
                pitch = pitch[1];
            }
        }else if(isNaN(pitch) === true){
            if(sequencer.debug >= 1){
                console.error('please provide a number');
            }
            return;
        }

        this.data1 = parseInt(pitch,10);
        var note = createNote(this.data1);
        this.note = note;
        this.noteName = note.fullName;
        this.noteNumber = note.number;
        this.octave = note.octave;
        this.frequency = note.frequency;

        if(this.midiNote !== undefined){
            this.midiNote.pitch = this.data1;
        }
        if(this.state !== 'new'){
            this.state = 'changed';
        }
        if(this.part !== undefined){
            this.part.needsUpdate = true;
        }
    };


    MidiEvent.prototype.move = function(ticks){
        if(isNaN(ticks)){
            if(sequencer.debug >= 1){
                console.error('please provide a number');
            }
            return;
        }
        this.ticks += parseInt(ticks, 10);
        if(this.state !== 'new'){
            this.state = 'changed';
        }
        if(this.part !== undefined){
            this.part.needsUpdate = true;
        }
    };


    MidiEvent.prototype.moveTo = function(){
        var position = slice.call(arguments);
        //console.log(position);

        if(position[0] === 'ticks' && isNaN(position[1]) === false){
            this.ticks = parseInt(position[1], 10);
        }else if(this.song === undefined){
            if(sequencer.debug >= 1){
                console.error('The midi event has not been added to a song yet; you can only move to ticks values');
            }
        }else{
            position = this.song.getPosition(position);
            if(position === false){
                if(sequencer.debug >= 1){
                    console.error('wrong position data');
                }
            }else{
                this.ticks = position.ticks;
            }
        }

        if(this.state !== 'new'){
            this.state = 'changed';
        }
        if(this.part !== undefined){
            this.part.needsUpdate = true;
        }
    };


    MidiEvent.prototype.reset = function(fromPart, fromTrack, fromSong){

        fromPart = fromPart === undefined ? true : false;
        fromTrack = fromTrack === undefined ? true : false;
        fromSong = fromSong === undefined ? true : false;

        if(fromPart){
            this.part = undefined;
            this.partId = undefined;
        }
        if(fromTrack){
            this.track = undefined;
            this.trackId = undefined;
            this.channel = 0;
        }
        if(fromSong){
            this.song = undefined;
        }
    };


    // implemented because of the common interface of midi and audio events
    MidiEvent.prototype.update = function(){
    };


    /**@exports sequencer*/
    sequencer.createMidiEvent = function(){
        /**
            @function createMidiEvent
            @param time {int}
            @param type {int}
            @param data1 {int}
            @param data2 {int}
        */
        var args = slice.call(arguments),
            className = args[0].className;

        if(className === 'MidiEvent'){
            return args[0].copy();
        }
        return new MidiEvent(args);
    };


    sequencer.protectedScope.addInitMethod(function(){
        createNote = sequencer.createNote;
        typeString = sequencer.protectedScope.typeString;
    });

}());(function(){

    /**
        @public
    */
    'use strict';

    /**
        @var
    */
    var
        lowerCaseToNumber = {
            'note off': 0x80,
            'note on': 0x90,
            'poly pressure': 0xA0,
            'control change': 0xB0,
            'program change': 0xC0,
            'channel pressure': 0xD0,
            'pitch bend': 0xE0,
            'tempo': 0x51,
            'time signature': 0x58,
            'end of track': 0x2F
        },

        upperCaseToNumber = {
            'NOTE_OFF': 0x80,
            'NOTE_ON': 0x90,
            'POLY_PRESSURE': 0xA0,
            'CONTROL_CHANGE': 0xB0,
            'PROGRAM_CHANGE': 0xC0,
            'CHANNEL_PRESSURE': 0xD0,
            'PITCH_BEND': 0xE0,
            'TEMPO': 0x51,
            'TIME_SIGNATURE': 0x58,
            'END_OF_TRACK': 0x2F
        },

        numberToLowerCase = {
            0x80: 'note off',
            0x90: 'note on',
            0xA0: 'poly pressure',
            0xB0: 'control change',
            0xC0: 'program change',
            0xD0: 'channel pressure',
            0xE0: 'pitch bend',
            0x51: 'tempo',
            0x58: 'time signature',
            0x2F: 'end of track'
        },

        numberToUpperCase = {
            0x80: 'NOTE_OFF',
            0x90: 'NOTE_ON',
            0xA0: 'POLY_PRESSURE',
            0xB0: 'CONTROL_CHANGE',
            0xC0: 'PROGRAM_CHANGE',
            0xD0: 'CHANNEL_PRESSURE',
            0xE0: 'PITCH_BEND',
            0x51: 'TEMPO',
            0x58: 'TIME_SIGNATURE',
            0x2F: 'END_OF_TRACK'
        };


    function numberByName(name){
        var no = false

        name = name.replace(/_/g, ' ');
        no = lowerCaseToNumber[name] || false;

        if(no !== false){
            return no;
        }

        // try upper
        name = name.replace(/\s/g, '_');
        no = upperCaseToNumber[name] || false;

        if(no === false && sequencer.debug === true){
            console.warn(name, 'is not a valid (or supported) midi event name, please consult documentation');
        }
        return no;
    }


    function nameByNumber(no, upperOrLower){
        var name = false;
        upperOrLower = upperOrLower || 'upper'; // return uppercase names by default
        //upperOrLower = upperOrLower || no.indexOf('_') !== -1 ? 'upper' : 'lower';

        if(upperOrLower === 'lower'){
            name = numberToLowerCase[no] || false;
            if(name === false && sequencer.debug === true){
                console.warn(no, 'is not a valid (or supported) midi event number, please consult documentation');
            }
            return name;
        }

        name = numberToUpperCase[no] || false;
        if(name === false && sequencer.debug === true){
            console.warn(no, 'is not a valid (or supported) midi event number, please consult documentation');
        }
        return name;
    }


    function checkEventType(type){
        if(isNaN(type)){
            return numberByName(type);
        }
        return nameByNumber(type);
    }


    //heartbeat
    /**
        @memberof sequencer
        @instance
    */
    Object.defineProperty(sequencer, 'DUMMY_EVENT', {value: 0x0}); //0
    Object.defineProperty(sequencer, 'MIDI_NOTE', {value: 0x70}); //112
    //standard MIDI
    Object.defineProperty(sequencer, 'NOTE_OFF', {value: 0x80}); //128
    Object.defineProperty(sequencer, 'NOTE_ON', {value: 0x90}); //144
    Object.defineProperty(sequencer, 'POLY_PRESSURE', {value: 0xA0}); //160
    Object.defineProperty(sequencer, 'CONTROL_CHANGE', {value: 0xB0}); //176
    Object.defineProperty(sequencer, 'PROGRAM_CHANGE', {value: 0xC0}); //192
    Object.defineProperty(sequencer, 'CHANNEL_PRESSURE', {value: 0xD0}); //208
    Object.defineProperty(sequencer, 'PITCH_BEND', {value: 0xE0}); //224
    Object.defineProperty(sequencer, 'SYSTEM_EXCLUSIVE', {value: 0xF0}); //240
    Object.defineProperty(sequencer, 'MIDI_TIMECODE', {value: 241});
    Object.defineProperty(sequencer, 'SONG_POSITION', {value: 242});
    Object.defineProperty(sequencer, 'SONG_SELECT', {value: 243});
    Object.defineProperty(sequencer, 'TUNE_REQUEST', {value: 246});
    Object.defineProperty(sequencer, 'EOX', {value: 247});
    Object.defineProperty(sequencer, 'TIMING_CLOCK', {value: 248});
    Object.defineProperty(sequencer, 'START', {value: 250});
    Object.defineProperty(sequencer, 'CONTINUE', {value: 251});
    Object.defineProperty(sequencer, 'STOP', {value: 252});
    Object.defineProperty(sequencer, 'ACTIVE_SENSING', {value: 254});
    Object.defineProperty(sequencer, 'SYSTEM_RESET', {value: 255});

    Object.defineProperty(sequencer, 'TEMPO', {value: 0x51});
    Object.defineProperty(sequencer, 'TIME_SIGNATURE', {value: 0x58});
    Object.defineProperty(sequencer, 'END_OF_TRACK', {value: 0x2F});

    // public
    /**
        @memberof sequencer
        @instance
        @function checkEventType
    */
    sequencer.checkEventType = checkEventType;
    sequencer.midiEventNameByNumber = nameByNumber;
    sequencer.midiEventNumberByName = numberByName;

}());/*
    parse method is based on: https://github.com/gasman/jasmid
    adapted to work with heartbeatjs' type MidiEvent and Track
*/

(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        // import
        parseUrl, // defined in util.js
        base64ToBinary, // defined in util.js
        typeString, // defined in util.js
        ajax, // defined in util.js
        findItem, // defined in util.js
        storeItem, // defined in util.js
        deleteItem, // defined in util.js
        parseMidiFile, // defined in midi_parse.js
        createTrack, // defined in track.js
        createPart, // defined in part.js
        createMidiEvent, // defined in midi_event.js

        index = 0,
        MidiFile;


    function cleanup(midifile, callback){
        midifile = undefined;
        if(callback){
            callback(false);
        }
    }


    function parse(midifile, buffer, callback){
        //console.time('parse midi');
        var data, i, j, numEvents, part, track, numTracks,
            events, event, ticks, tmpTicks, channel,
            parsed, timeEvents, noteNumber, bpm,
            lastNoteOn, lastNoteOff, ppqFactor,
            type, lastType, lastData1, lastData2,
            numNoteOn, numNoteOff, numOther, noteOns, noteOffs;

        // buffer is ArrayBuffer, so convert it
        buffer = new Uint8Array(buffer);
        data = parseMidiFile(buffer);
        //console.log(data);
        //console.log(data.header.ticksPerBeat);

        // save some memory
        midifile.base64 = '';
        midifile.numTracks = 0;

        i = 0;
        numTracks = data.tracks.length;
        if(sequencer.overrulePPQ === true && isNaN(sequencer.defaultPPQ) === false && sequencer.defaultPPQ > 0){
            ppqFactor = sequencer.defaultPPQ/data.header.ticksPerBeat;
            midifile.ppq = sequencer.defaultPPQ;
        }else{
            ppqFactor = 1;
            midifile.ppq = data.header.ticksPerBeat;
        }
        timeEvents = [];
        midifile.tracks = [];
        //console.log(ppqFactor, midifile.ppq, sequencer.overrulePPQ, sequencer.defaultPPQ);

        while(i < numTracks){
            events = data.tracks[i];
            numEvents = events.length;
            ticks = 0;
            tmpTicks = 0;
            channel = -1;
            part = createPart();
            track = createTrack();
            parsed = [];
            j = 0;
            numNoteOn = 0;
            numNoteOff = 0;
            numOther = 0;
            noteOns = {};
            noteOffs = {};

            for(j = 0; j < numEvents; j++){

                event = events[j];

                tmpTicks += (event.deltaTime * ppqFactor);
                //console.log(event.subtype, event.deltaTime, tmpTicks);

                if(channel === -1 && event.channel !== undefined){
                    channel = event.channel;
                    track.channel = channel;
                }

                type = event.subtype;

                if(type === 'noteOn'){
                    numNoteOn++;
                }else if(type === 'noteOff'){
                    numNoteOff++;
                }else{
                    numOther++;
                }

                switch(event.subtype){

                    case 'trackName':
                        track.name = event.text;
                        //console.log('name', track.name, numTracks);
                        break;

                    case 'instrumentName':
                        if(event.text){
                            track.instrumentName = event.text;
                        }
                        break;

                    case 'noteOn':
                        //track.isUseful = true;
                        /*
                        noteNumber = event.noteNumber;
                        if(tmpTicks === ticks && lastType === type && noteNumber === lastNoteOn){
                            if(sequencer.debug >= 3){
                                console.info('note on events on the same tick', j, tmpTicks, noteNumber, lastNoteOn, numTracks, parsed.length);
                            }
                            //parsed.pop();
                        }
                        lastNoteOn = noteNumber;
                        parsed.push(createMidiEvent(tmpTicks, 0x90, noteNumber, event.velocity));
                        */
                        /*
                        noteNumber = event.noteNumber;
                        if(noteOns[noteNumber] === undefined){
                            noteOns[noteNumber] = [];
                        }
                        noteOns[noteNumber].push(event);
                        */
                        parsed.push(createMidiEvent(tmpTicks, 0x90, event.noteNumber, event.velocity));
                        break;

                    case 'noteOff':
                        //track.isUseful = true;
                        /*
                        noteNumber = event.noteNumber;
                        if(tmpTicks === ticks && lastType === type && noteNumber === lastNoteOff){
                            if(sequencer.debug >= 3){
                                console.info('note off events on the same tick', j, tmpTicks, noteNumber, lastNoteOff, numTracks, parsed.length);
                            }
                            //parsed.pop();
                        }
                        lastNoteOff = noteNumber;
                        parsed.push(createMidiEvent(tmpTicks, 0x80, noteNumber, event.velocity));
                        */
                        /*
                        noteNumber = event.noteNumber;
                        if(noteOffs[noteNumber] === undefined){
                            noteOffs[noteNumber] = [];
                        }
                        noteOns[noteNumber].push(event);
                        */
                        parsed.push(createMidiEvent(tmpTicks, 0x80, event.noteNumber, event.velocity));
                        break;

                    case 'endOfTrack':
                        //console.log(track.name, '0x2F', tmpTicks);
                        //parsed.push(createMidiEvent(tmpTicks,0x2F));
                        break;

                    case 'setTempo':
                        //sometimes 2 tempo events have the same position in ticks
                        //→ we use the last in these cases (same as Cubase)

                        bpm = 60000000/event.microsecondsPerBeat;
                        //console.log('setTempo',bpm,event.microsecondsPerBeat);

                        if(tmpTicks === ticks && lastType === type){
                            if(sequencer.debug >= 3){
                                console.info('tempo events on the same tick', j, tmpTicks, bpm);
                            }
                            timeEvents.pop();
                        }

                        if(midifile.bpm === undefined){
                            midifile.bpm = bpm;
                        // }else{
                        //     timeEvents.push(createMidiEvent(tmpTicks, 0x51, bpm));
                        }
                        timeEvents.push(createMidiEvent(tmpTicks, 0x51, bpm));
                        break;

                    case 'timeSignature':
                        //see comment above ↑
                        if(tmpTicks === ticks && lastType === type){
                            if(sequencer.debug >= 3){
                                console.info('time signature events on the same tick', j, tmpTicks, event.numerator, event.denominator);
                            }
                            timeEvents.pop();
                        }

                        if(midifile.nominator === undefined){
                            midifile.nominator = event.numerator;
                            midifile.denominator = event.denominator;
                        // }else{
                        //     //console.log('timeSignature', event.numerator, event.denominator, event.metronome, event.thirtyseconds);
                        //     timeEvents.push(createMidiEvent(tmpTicks, 0x58, event.numerator, event.denominator));
                        }
                        timeEvents.push(createMidiEvent(tmpTicks, 0x58, event.numerator, event.denominator));
                        break;


                    case 'controller':
                        //track.isUseful = true;
                        /*
                        if(
                            tmpTicks === ticks &&
                            event.controllerType === lastData1 &&
                            event.value === lastData2 &&
                            lastData1 !== undefined &&
                            lastData2 !== undefined
                        ){
                            if(sequencer.debug >= 3){
                                console.warn('double controller events on the same tick', j, tmpTicks, event.controllerType, event.value);
                            }
                        }else{
                            parsed.push(createMidiEvent(tmpTicks, 0xB0, event.controllerType, event.value));
                        }
                        lastData1 = event.controllerType;
                        lastData2 = event.value;
                        */
                        parsed.push(createMidiEvent(tmpTicks, 0xB0, event.controllerType, event.value));
                        //console.log('controller:', tmpTicks, event.type, event.controllerType, event.value);
                        break;

                    case 'programChange':
                        //track.isUseful = true;
                        parsed.push(createMidiEvent(tmpTicks, 0xC0, event.programNumber));
                        //console.log(event.type,event.controllerType);
                        break;

                    case 'channelAftertouch':
                        parsed.push(createMidiEvent(tmpTicks, 0xD0, event.amount));
                        break;

                    case 'pitchBend':
                        parsed.push(createMidiEvent(tmpTicks, 0xE0, event.value));
                        break;

                    default:
                        //console.log(track.name, event.type);
                }
                lastType = type;
                ticks = tmpTicks;
            }

            //console.log('NOTE ON', numNoteOn, 'NOTE OFF', numNoteOff, 'OTHER', numOther);
            if(parsed.length > 0){
                track.addPart(part);
                part.addEvents(parsed);
                midifile.tracks.push(track);
                midifile.numTracks++;
            }
            i++;
        }

        midifile.timeEvents = timeEvents;
        midifile.autoSize = true;
        //console.timeEnd('parse midi');
        midifile.loaded = true;
        callback(midifile);
    }


    function load(midifile, callback){

        if(midifile.base64 !== undefined){
            parse(midifile, base64ToBinary(midifile.base64), callback);
            return;
        }else if(midifile.arraybuffer !== undefined){
            parse(midifile, midifile.arraybuffer, callback);
            return;
        }

        ajax({
            url: midifile.url,
            responseType: midifile.responseType,
            onError: function(){
                cleanup(midifile, callback);
            },
            onSuccess: function(data){
                if(midifile.responseType === 'json'){
                    // if the json data is corrupt (for instance because of a trailing comma) data will be null
                    if(data === null){
                        callback(false);
                        return;
                    }

                    if(data.base64 === undefined){
                        cleanup(midifile, callback);
                        if(sequencer.debug){
                            console.warn('no base64 data');
                        }
                        return;
                    }

                    if(data.name !== undefined && midifile.name === undefined){
                        midifile.name = data.name;
                    }

                    if(data.folder !== undefined && midifile.folder === undefined){
                        midifile.folder = data.folder;
                    }

                    if(midifile.name === undefined){
                        midifile.name = parseUrl(midifile.url).name;
                    }

                    midifile.localPath = midifile.folder !== undefined ? midifile.folder + '/' + midifile.name : midifile.name;
                    parse(midifile, base64ToBinary(data.base64), callback);
                }else{
                    if(midifile.name === undefined){
                        midifile.name = parseUrl(midifile.url).name;
                    }
                    midifile.localPath = midifile.folder !== undefined ? midifile.folder + '/' + midifile.name : midifile.name;
                    parse(midifile, data, callback);
                }
            }
        });
    }


    function store(midifile){
        var occupied = findItem(midifile.localPath, sequencer.storage.midi, true),
            action = midifile.action;

        //console.log(occupied);
        if(occupied && occupied.className === 'MidiFile' && action !== 'overwrite'){
            if(sequencer.debug >= 2){
                console.warn('there is already a midifile at', midifile.localPath);
                cleanup(midifile);
            }
        }else{
            storeItem(midifile, midifile.localPath, sequencer.storage.midi);
        }
    }


    MidiFile = function(config){
        this.id = 'MF' + index++ + new Date().getTime();
        this.className = 'MidiFile';

        this.url = config.url;
        this.json = config.json;
        this.base64 = config.base64;
        this.arraybuffer = config.arraybuffer;

        this.name = config.name;
        this.folder = config.folder;

        if(this.url !== undefined){
            this.responseType = this.url.indexOf('.json') === this.url.lastIndexOf('.') ? 'json' : 'arraybuffer';
        }else{
            if(this.name === undefined && this.folder === undefined){
                this.name = this.id;
                this.localPath = this.id;
            }else{
                this.localPath = this.folder !== undefined ? this.folder + '/' + this.name : this.name;
            }
        }
    };


    sequencer.addMidiFile = function(config, callback){
        var type = typeString(config),
            midifile, json, name, folder;

        if(type !== 'object'){
            if(sequencer.debug >= 2){
                console.warn('can\'t create a MidiFile with this data', config);
            }
            return false;
        }

        if(config.json){
            json = config.json;
            name = config.name;
            folder = config.folder;
            if(typeString(json) === 'string'){
                try{
                    json = JSON.parse(json);
                }catch(e){
                    if(sequencer.debug >= 2){
                        console.warn('can\'t create a MidiFile with this data', config);
                    }
                    return false;
                }
            }
            if(json.base64 === undefined){
                if(sequencer.debug >= 2){
                    console.warn('can\'t create a MidiFile with this data', config);
                }
                return false;
            }
            config = {
                base64: json.base64,
                name: name === undefined ? json.name : name,
                folder: folder === undefined ? json.folder : folder
            };
            //console.log('config', name, folder, json.name, json.folder);
        }

        midifile = new MidiFile(config);

        sequencer.addTask({
            type: 'load midifile',
            method: load,
            params: midifile
        }, function(){
            //console.log(midifile);
            store(midifile);
            if(callback){
                callback(midifile);
            }
        });

        sequencer.startTaskQueue();


/*
        load(midifile, function(){
            //console.log(midifile);
            store(midifile);
            if(callback){
                callback(midifile);
            }
        });
*/
    };


    function MidiFile2(config){
        var reader = new FileReader();

        function executor(resolve, reject){

            reader.addEventListener('loadend', function() {
                // reader.result contains the contents of blob as a typed array
                parse({}, reader.result, function(midifile){
                    resolve(midifile);
                });
            });

            reader.addEventListener('error', function(e) {
               reject(e);
            });

            if(config.blob !== undefined){
                reader.readAsArrayBuffer(config.blob);
            }else if(config.arraybuffer !== undefined){
                parse({}, config.arraybuffer, function(midifile){
                    resolve(midifile);
                });
            }else if(config.base64 !== undefined){
                parse({}, base64ToBinary(config.base64), function(midifile){
                    resolve(midifile);
                });
            }
        }

        this._promise = new Promise(executor);
    }


    sequencer.createMidiFile = function(config){
        var mf = new MidiFile2(config);
        return mf._promise;
    };


    sequencer.protectedScope.addInitMethod(function(){
        ajax = sequencer.protectedScope.ajax;
        findItem = sequencer.protectedScope.findItem;
        storeItem = sequencer.protectedScope.storeItem;
        deleteItem = sequencer.protectedScope.deleteItem;
        parseUrl = sequencer.protectedScope.parseUrl;
        typeString = sequencer.protectedScope.typeString;
        parseMidiFile = sequencer.protectedScope.parseMidiFile;
        base64ToBinary = sequencer.protectedScope.base64ToBinary;
        createPart = sequencer.createPart;
        createTrack = sequencer.createTrack;
        createMidiEvent = sequencer.createMidiEvent;
    });

}());(function(){

    'use strict';

    var
        MidiNote,

        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //public
        createMidiEvent,

        //protected
        typeString,

        midiNoteId = 0;

    /*
        @params: noteOn event, noteOff event
        @params: start ticks, end ticks, note number, velocity

    */

    MidiNote = function(args){
        var numArgs = args.length,
            on,off,startTicks,endTicks,noteNumber,velocity;

        //console.log(args);

        if(numArgs === 1){
            on = args[0];
            if(on === undefined){
                console.error('please provide at least a note on event');
                return;
            }
            this.noteOn = on;
        } else if(numArgs === 2){
            on = args[0];
            off = args[1];
            if(on === undefined){
                console.error('please provide at least a note on event');
                return;
            }
            if(on.className === 'MidiEvent' && off & off.className === 'MidiEvent'){
                if(on.ticks >= off.ticks){
                    console.error('MidiNote has wrong duration');
                    return;
                }
                this.noteOn = on;
                this.noteOff = off;
            }
        }else if(numArgs === 4){
            startTicks = args[0];
            endTicks = args[1];
            noteNumber = args[2];
            velocity = args[3];
            if(startTicks && endTicks && startTicks >= endTicks){
                console.error('MidiNote has wrong duration');
                return;
            }
            if(noteNumber < 0 || noteNumber > 127){
                console.error('MidiNote has wrong note number');
                return;
            }
            if(velocity < 0 || velocity > 127){
                console.error('MidiNote has wrong velocity');
                return;
            }
            on = createMidiEvent(startTicks, sequencer.NOTE_ON, noteNumber, velocity);
            if(off){
                off = createMidiEvent(endTicks, sequencer.NOTE_OFF, noteNumber, 0);
            }
        }else{
            console.error('wrong number of arguments, please consult documentation');
            return;
        }

        on.midiNote = this;
        this.noteOn = on;

        if(off === undefined){
            this.endless = true;
        }else{
            off.midiNote = this;
            this.endless = false;
            this.noteOff = off;
            this.durationTicks = off.ticks - on.ticks;
            this.durationMillis = off.millis - on.millis;
        }


        this.note = on.note;
        this.number = on.noteNumber;
        this.ticks = on.ticks;
        this.pitch = on.data1;
        this.velocity = on.velocity;
        this.id = 'N' + midiNoteId + new Date().getTime();
        this.name = on.noteName;
        this.className = 'MidiNote';
        this.type = sequencer.MIDI_NOTE;
        midiNoteId++;
    };


    MidiNote.prototype.addNoteOff = function(off){
        if(this.noteOff !== undefined){
            console.log(off.ticks, off.noteNumber, this.id, 'override note off event');
            this.noteOff.midiNote = undefined;
        }
        var on = this.noteOn;
        off.midiNote = this;
        this.endless = false;
        this.noteOff = off;
        this.durationTicks = off.ticks - on.ticks;
        this.durationMillis = off.millis - on.millis;
        this.endless = false;
    };

/*
    MidiNote.prototype.setDuration = function(duration_in_ticks){
        if(duration_in_ticks <= 0){
            console.error('duration of a MidiNote has to be greater then 0');
            return;
        }
        this.noteOff.ticks = this.noteOn.ticks + duration_in_ticks;
        this.durationTicks = this.noteOff.ticks - this.noteOn.ticks;
        //this.durationMillis = this.noteOff.millis - this.noteOn.millis;
        if(this.part){
            this.part.needsUpdate = true;
        }
    };
*/
/*
    MidiNote.prototype.setEnd = function(ticks){
        this.noteOff.ticks = ticks;
        if(this.part){
            this.part.needsUpdate = true;
        }
    };


    MidiNote.prototype.setStart = function(ticks){
        this.noteOn.ticks = ticks;
        if(this.part){
            this.part.needsUpdate = true;
        }
    };


    MidiNote.prototype.setVelocity = function(velocity){
        if(velocity < 0 || velocity > 127){
            return;
        }
        this.velocity = this.noteOn.data1 = this.noteOn.velocity = velocity;
    };

*/
    MidiNote.prototype.setPitch = function(pitch){
        if(pitch < 0 || pitch > 127){
            return;
        }
        this.noteOn.setPitch(pitch);
        if(this.endless === false){
            this.noteOff.setPitch(pitch);
        }
        this.number = this.noteOn.noteNumber;
        this.name = this.noteOn.noteName;
        this.pitch = pitch;
    };


    MidiNote.prototype.mute = function(flag){
        if(flag !== undefined){
            this.mute = flag;
        }else{
            this.mute = !this.mute;
        }
    };

    sequencer.protectedScope.addInitMethod(function(){
        createMidiEvent = sequencer.createMidiEvent;
        typeString = sequencer.protectedScope.typeString;
    });


    sequencer.createMidiNote = function(){
        return new MidiNote(Array.prototype.slice.call(arguments));
    };

}());/*
    based on: https://github.com/gasman/jasmid
    adapted to work with heartbeatjs' type MidiEvent and Track
*/

(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        lastEventTypeByte,
        trackName,

        //import
        createStream; // defined in midi_stream.js


    function readChunk(stream) {
        var id = stream.read(4, true);
        var length = stream.readInt32();
        //console.log(length);
        return {
            'id': id,
            'length': length,
            'data': stream.read(length, false)
        };
    }


    function readEvent(stream) {
        var event = {};
        //var lastEventTypeByte; // for running status
        event.deltaTime = stream.readVarInt();
        var eventTypeByte = stream.readInt8();
        var length;
        //console.log(eventTypeByte, eventTypeByte & 0x80, 146 & 0x0f);
        if ((eventTypeByte & 0xf0) == 0xf0) {
            /* system / meta event */
            if (eventTypeByte == 0xff) {
                /* meta event */
                event.type = 'meta';
                var subtypeByte = stream.readInt8();
                length = stream.readVarInt();
                switch(subtypeByte) {
                    case 0x00:
                        event.subtype = 'sequenceNumber';
                        if (length !== 2) throw 'Expected length for sequenceNumber event is 2, got ' + length;
                        event.number = stream.readInt16();
                        return event;
                    case 0x01:
                        event.subtype = 'text';
                        event.text = stream.read(length);
                        return event;
                    case 0x02:
                        event.subtype = 'copyrightNotice';
                        event.text = stream.read(length);
                        return event;
                    case 0x03:
                        event.subtype = 'trackName';
                        event.text = stream.read(length);
                        trackName = event.text;
                        return event;
                    case 0x04:
                        event.subtype = 'instrumentName';
                        event.text = stream.read(length);
                        return event;
                    case 0x05:
                        event.subtype = 'lyrics';
                        event.text = stream.read(length);
                        return event;
                    case 0x06:
                        event.subtype = 'marker';
                        event.text = stream.read(length);
                        return event;
                    case 0x07:
                        event.subtype = 'cuePoint';
                        event.text = stream.read(length);
                        return event;
                    case 0x20:
                        event.subtype = 'midiChannelPrefix';
                        if (length !== 1) throw 'Expected length for midiChannelPrefix event is 1, got ' + length;
                        event.channel = stream.readInt8();
                        return event;
                    case 0x2f:
                        event.subtype = 'endOfTrack';
                        if (length !== 0) throw 'Expected length for endOfTrack event is 0, got ' + length;
                        return event;
                    case 0x51:
                        event.subtype = 'setTempo';
                        if (length !== 3) throw 'Expected length for setTempo event is 3, got ' + length;
                        event.microsecondsPerBeat = (
                            (stream.readInt8() << 16) +
                            (stream.readInt8() << 8) +
                            stream.readInt8()
                        );
                        return event;
                    case 0x54:
                        event.subtype = 'smpteOffset';
                        if (length !== 5) throw 'Expected length for smpteOffset event is 5, got ' + length;
                        var hourByte = stream.readInt8();
                        event.frameRate = {
                            0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
                        }[hourByte & 0x60];
                        event.hour = hourByte & 0x1f;
                        event.min = stream.readInt8();
                        event.sec = stream.readInt8();
                        event.frame = stream.readInt8();
                        event.subframe = stream.readInt8();
                        return event;
                    case 0x58:
                        event.subtype = 'timeSignature';
                        if (length !== 4) throw 'Expected length for timeSignature event is 4, got ' + length;
                        event.numerator = stream.readInt8();
                        event.denominator = Math.pow(2, stream.readInt8());
                        event.metronome = stream.readInt8();
                        event.thirtyseconds = stream.readInt8();
                        return event;
                    case 0x59:
                        event.subtype = 'keySignature';
                        if (length !== 2) throw 'Expected length for keySignature event is 2, got ' + length;
                        event.key = stream.readInt8(true);
                        event.scale = stream.readInt8();
                        return event;
                    case 0x7f:
                        event.subtype = 'sequencerSpecific';
                        event.data = stream.read(length);
                        return event;
                    default:
                        //if(sequencer.debug >= 2){
                        //    console.warn('Unrecognised meta event subtype: ' + subtypeByte);
                        //}
                        event.subtype = 'unknown';
                        event.data = stream.read(length);
                        return event;
                }
                event.data = stream.read(length);
                return event;
            } else if (eventTypeByte == 0xf0) {
                event.type = 'sysEx';
                length = stream.readVarInt();
                event.data = stream.read(length);
                return event;
            } else if (eventTypeByte == 0xf7) {
                event.type = 'dividedSysEx';
                length = stream.readVarInt();
                event.data = stream.read(length);
                return event;
            } else {
                throw 'Unrecognised MIDI event type byte: ' + eventTypeByte;
            }
        } else {
            /* channel event */
            var param1;
            if ((eventTypeByte & 0x80) === 0) {
                /* running status - reuse lastEventTypeByte as the event type.
                    eventTypeByte is actually the first parameter
                */
                //console.log('running status');
                param1 = eventTypeByte;
                eventTypeByte = lastEventTypeByte;
            } else {
                param1 = stream.readInt8();
                //console.log('last', eventTypeByte);
                lastEventTypeByte = eventTypeByte;
            }
            var eventType = eventTypeByte >> 4;
            event.channel = eventTypeByte & 0x0f;
            event.type = 'channel';
            switch (eventType) {
                case 0x08:
                    event.subtype = 'noteOff';
                    event.noteNumber = param1;
                    event.velocity = stream.readInt8();
                    return event;
                case 0x09:
                    event.noteNumber = param1;
                    event.velocity = stream.readInt8();
                    if (event.velocity === 0) {
                        event.subtype = 'noteOff';
                    } else {
                        event.subtype = 'noteOn';
                        //console.log('noteOn');
                    }
                    return event;
                case 0x0a:
                    event.subtype = 'noteAftertouch';
                    event.noteNumber = param1;
                    event.amount = stream.readInt8();
                    return event;
                case 0x0b:
                    event.subtype = 'controller';
                    event.controllerType = param1;
                    event.value = stream.readInt8();
                    return event;
                case 0x0c:
                    event.subtype = 'programChange';
                    event.programNumber = param1;
                    return event;
                case 0x0d:
                    event.subtype = 'channelAftertouch';
                    event.amount = param1;
                    //if(trackName === 'SH-S1-44-C09 L=SML IN=3'){
                    //    console.log('channel pressure', trackName, param1);
                    //}
                    return event;
                case 0x0e:
                    event.subtype = 'pitchBend';
                    event.value = param1 + (stream.readInt8() << 7);
                    return event;
                default:
                    /*
                    throw 'Unrecognised MIDI event type: ' + eventType;
                    console.log('Unrecognised MIDI event type: ' + eventType);
                    */



                    event.value = stream.readInt8();
                    event.subtype = 'unknown';
                    //console.log(event);
/*
                    event.noteNumber = param1;
                    event.velocity = stream.readInt8();
                    event.subtype = 'noteOn';
                    console.log('weirdo', trackName, param1, event.velocity);
*/

                    return event;
            }
        }
    }


    function parseStream(stream) {
        var formatType, trackCount, timeDivision, ticksPerBeat,
            tracks = [], i,
            trackChunk, trackStream,
            headerChunk, headerStream;

        headerChunk = readChunk(stream);
        if (headerChunk.id !== 'MThd' || headerChunk.length !== 6) {
            throw 'Bad .mid file - header not found';
        }
        //console.log(headerChunk);

        headerStream = createStream(headerChunk.data);
        formatType = headerStream.readInt16();
        trackCount = headerStream.readInt16();
        timeDivision = headerStream.readInt16();

        if (timeDivision & 0x8000) {
            throw 'Expressing time division in SMTPE frames is not supported yet';
        } else {
            ticksPerBeat = timeDivision;
        }

        var header = {
            'formatType': formatType,
            'trackCount': trackCount,
            'ticksPerBeat': ticksPerBeat
        };

        for (i = 0; i < trackCount; i++) {
            tracks[i] = [];
            trackChunk = readChunk(stream);
            if (trackChunk.id !== 'MTrk') {
                throw 'Unexpected chunk - expected MTrk, got '+ trackChunk.id;
            }
            trackStream = createStream(trackChunk.data);
            while (!trackStream.eof()) {
                var event = readEvent(trackStream);
                tracks[i].push(event);
            }
        }

        return {
            'header': header,
            'tracks': tracks
        };
    }


    /* read a MIDI-style variable-length integer
        (big-endian value in groups of 7 bits,
        with top bit set to signify that another byte follows)
    function readVarInt() {
        var result = 0;
        while (true) {
            var b = readInt8();
            if (b & 0x80) {
                result += (b & 0x7f);
                result <<= 7;
            } else {
                // b is the last byte
                return result + b;
            }
        }
    }
    */


    sequencer.protectedScope.parseMidiFile = function(buffer){
        return parseStream(createStream(buffer));
        //var dv = new DataView(buffer);
        //return parseStream(dv);
    };


    sequencer.protectedScope.addInitMethod(function(){
        createStream = sequencer.protectedScope.createStream;
    });
}());

/* 
	Wrapper for accessing strings through sequential reads 
	
	based on: https://github.com/gasman/jasmid
	adapted to work with ArrayBuffer -> Uint8Array
*/

(function(){

	'use strict';

	var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
		
		fcc = String.fromCharCode;
	

	// buffer is Uint8Array
	function createStream(buffer) {
		var position = 0;

		/* read string or any number of bytes */
		function read(length, toString) {
			var result, i;
			toString = toString === undefined ? true : toString;

			if(toString){
				result = '';
				for(i = 0; i < length; i++, position++){
					result += fcc(buffer[position]);
				}			
				return result;
			}else{
				result = [];
				for(i = 0; i < length; i++, position++){
					result.push(buffer[position]);
				}						
				return result;
			}
		}
		
		/* read a big-endian 32-bit integer */
		function readInt32() {
			var result = (
				(buffer[position] << 24) +
				(buffer[position + 1] << 16) +
				(buffer[position + 2] << 8) + 
				buffer[position + 3]
			);
			position += 4;
			return result;
		}

		/* read a big-endian 16-bit integer */
		function readInt16() {
			var result = (
				(buffer[position] << 8) + 
				buffer[position + 1]
			);
			position += 2;
			return result;
		}
		
		/* read an 8-bit integer */
		function readInt8(signed) {
			var result = buffer[position];
			if (signed && result > 127) result -= 256;
			position += 1;
			return result;
		}
		
		function eof() {
			return position >= buffer.length;
		}
		
		/* read a MIDI-style variable-length integer
			(big-endian value in groups of 7 bits,
			with top bit set to signify that another byte follows)
		*/
		function readVarInt() {
			var result = 0;
			while (true) {
				var b = readInt8();
				if (b & 0x80) {
					result += (b & 0x7f);
					result <<= 7;
				} else {
					/* b is the last byte */
					return result + b;
				}
			}
		}
		
		return {
			'eof': eof,
			'read': read,
			'readInt32': readInt32,
			'readInt16': readInt16,
			'readInt8': readInt8,
			'readVarInt': readVarInt
		};
	}

	sequencer.protectedScope.createStream = createStream;
	
}());

(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        context, // defined in open_module.js
        typeString, // defined in util.js
        objectForEach, // defined in util.js
        createMidiNote, // defined in midi_note.js
        createMidiEvent, // defined in midi_event.js

        slice = Array.prototype.slice,

        songMidiEventListener,

        midiAccess,
        midiInputsOrder,
        midiOutputsOrder,
        midiInitialized = false,
        midiEventListenerId = 0;


    function initMidi(cb){

        //console.log(midiInitialized, navigator.requestMIDIAccess);

        if(midiInitialized === true){
            cb();
            return;
        }

        midiInitialized = true;

        if(navigator.requestMIDIAccess !== undefined){
            navigator.requestMIDIAccess().then(
                // on success
                function midiAccessOnSuccess(midi){
                    if(midi._jazzInstances !== undefined){
                        sequencer.jazz = midi._jazzInstances[0]._Jazz.version;
                        sequencer.midi = true;
                    }else{
                        sequencer.webmidi = true;
                        sequencer.midi = true;
                    }
                    midiAccess = midi;
                    midiAccess.onstatechange = getDevices;
                    getDevices();
                    //console.log(midi, sequencer.midi, sequencer.webmidi, sequencer.jazz);

                    cb();
                },
                // on error
                function midiAccessOnError(e){
                    console.log('MIDI could not be initialized:', e);
                    cb();
                }
            );
        // browsers without WebMIDI API
        }else{
            if(sequencer.browser === 'chrome'){
                console.log('Web MIDI API not enabled');
            }else{
                console.log('Web MIDI API not supported');
            }
            cb();
        }
    }


    function getDevices(e){
        //console.log('getDevices', e);
        var inputs, outputs;
        midiInputsOrder = [];
        midiOutputsOrder = [];

        inputs = midiAccess.inputs;

        inputs.forEach(function(input){
            midiInputsOrder.push({name: input.name, id: input.id});
            sequencer.midiInputs[input.id] = input;
        });

        midiInputsOrder.sort(function(a, b){
            var nameA = a.name.toLowerCase(),
                nameB = b.name.toLowerCase();
            if(nameA < nameB){ //sort string ascending
                return -1;
            }else if (nameA > nameB){
                return 1;
            }
            return 0; //default return value (no sorting)
        });

        sequencer.numMidiInputs = midiInputsOrder.length;


        outputs = midiAccess.outputs;

        outputs.forEach(function(output){
            midiOutputsOrder.push({name: output.name, id: output.id});
            sequencer.midiOutputs[output.id] = output;
        });


        midiOutputsOrder.sort(function(a, b){
            var nameA = a.name.toLowerCase(),
                nameB = b.name.toLowerCase();
            if(nameA < nameB){ //sort string ascending
                return -1;
            }else if (nameA > nameB){
                return 1;
            }
            return 0; //default return value (no sorting)
        });

        sequencer.numMidiOutputs = midiOutputsOrder.length;
    }


    function initMidiSong(song){
        songMidiEventListener = function(e){
            //console.log(e);
            handleMidiMessageSong(e, song, this);
        };

        // by default a song listens to all available midi-in ports
        objectForEach(sequencer.midiInputs, function(port){
            //port.addEventListener('midimessage', songMidiEventListener, false);
            port.onmidimessage = songMidiEventListener;
            song.midiInputs[port.id] = port;
            //console.log(port);
        });
        //console.log(sequencer.midiInputs);

        objectForEach(sequencer.midiOutputs, function(port){
            song.midiOutputs[port.id] = port;
        });

        song.numMidiInputs = sequencer.numMidiInputs;
        song.numMidiOutputs = sequencer.numMidiOutputs;
    }


    function setMidiInputSong(id, flag, song){
        var input = sequencer.midiInputs[id],
            tracks = song.tracks,
            maxi = song.numTracks - 1,
            i, track;

        flag = flag === undefined ? true : flag;

        if(input === undefined){
            if(sequencer.debug === true){
                console.log('no midi input with id', id,'found');
            }
            return;
        }

        if(flag === false){
            delete song.midiInputs[id];
            //input.removeEventListener('midimessage', songMidiEventListener, false);
            input.onmidimessage = null;
            song.numMidiInputs--;
        }else if(input !== undefined){
            song.midiInputs[id] = input;
            //input.addEventListener('midimessage', songMidiEventListener, false);
            input.onmidimessage = songMidiEventListener;
            song.numMidiInputs++;
        }

        for(i = maxi; i >= 0; i--){
            track = tracks[i];
            track.setMidiInput(id, flag);
            // if(flag === false){
            //     delete track.midiInputs[id];
            // }
        }
    }

    function setMidiOutputSong(id, flag, song){
        var output = sequencer.midiOutputs[id],
            tracks = song.tracks,
            maxi = song.numTracks - 1,
            i, track, time;

        flag = flag === undefined ? true : flag;

        if(output === undefined){
            if(sequencer.debug === true){
                console.log('no midi output with id', id,'found');
            }
            return;
        }

        if(flag === false){
            delete song.midiOutputs[id];
            song.numMidiOutputs--;
            time = song.scheduler.lastEventTime + 100;
            output.send([0xB0, 0x7B, 0x00], time); // stop all notes
            output.send([0xB0, 0x79, 0x00], time); // reset all controllers
        }else if(output !== undefined){
            song.midiOutputs[id] = output;
            song.numMidiOutputs++;
        }

        for(i = maxi; i >= 0; i--){
            track = tracks[i];
            track.setMidiOutput(id, flag);
            // if(flag === false){
            //     delete track.midiOutputs[id];
            // }
        }
    }

    function handleMidiMessageSong(midiMessageEvent, song, input){
        var data = midiMessageEvent.data,
            i, track,
            tracks = song.tracks,
            numTracks = song.numTracks,
            midiEvent,
            listeners;

        //console.log(midiMessageEvent.data);
        midiEvent = createMidiEvent(song.ticks, data[0], data[1], data[2]);

        for(i = 0; i < numTracks; i++){
            track = tracks[i];
            //console.log(track.midiInputs, input);
            /*
            if(midiEvent.channel === track.channel || track.channel === 0 || track.channel === 'any'){
                handleMidiMessageTrack(midiEvent, track);
            }
            */
            // like in Cubase, midi events from all devices, sent on any midi channel are forwarded to all tracks
            // set track.monitor to false if you don't want to receive midi events on a certain track
            // note that track.monitor is by default set to false and that track.monitor is automatically set to true
            // if you are recording on that track
            //console.log(track.monitor, track.id, input.id);
            if(track.monitor === true && track.midiInputs[input.id] !== undefined){
                handleMidiMessageTrack(midiEvent, track, input);
            }
        }

        listeners = song.midiEventListeners[midiEvent.type];
        if(listeners === undefined){
            return;
        }

        objectForEach(listeners, function(listener){
            listener(midiEvent, input);
        });
    }


    //function handleMidiMessageTrack(midiMessageEvent, track, input){
    function handleMidiMessageTrack(midiEvent, track, input){
        var song = track.song,
            note, listeners, channel;
            //data = midiMessageEvent.data,
            //midiEvent = createMidiEvent(song.ticks, data[0], data[1], data[2]);

        //midiEvent.source = midiMessageEvent.srcElement.name;
        //console.log(midiMessageEvent)
        //console.log('---->', midiEvent.type);

        // add the exact time of this event so we can calculate its ticks position
        midiEvent.recordMillis = context.currentTime * 1000; // millis
        midiEvent.state = 'recorded';

        if(midiEvent.type === 144){
            note = createMidiNote(midiEvent);
            track.recordingNotes[midiEvent.data1] = note;
            //track.song.recordingNotes[note.id] = note;
        }else if(midiEvent.type === 128){
            note = track.recordingNotes[midiEvent.data1];
            // check if the note exists: if the user plays notes on her keyboard before the midi system has
            // been fully initialized, it can happen that the first incoming midi event is a NOTE OFF event
            if(note === undefined){
                return;
            }
            note.addNoteOff(midiEvent);
            delete track.recordingNotes[midiEvent.data1];
            //delete track.song.recordingNotes[note.id];
        }

        //console.log(song.preroll, song.recording, track.recordEnabled);

        if((song.prerolling || song.recording) && track.recordEnabled === 'midi'){
            if(midiEvent.type === 144){
                track.song.recordedNotes.push(note);
            }
            track.recordPart.addEvent(midiEvent);
            // song.recordedEvents is used in the key editor
            track.song.recordedEvents.push(midiEvent);
        }else if(track.enableRetrospectiveRecording){
            track.retrospectiveRecording.push(midiEvent);
        }

        // call all midi event listeners
        listeners = track.midiEventListeners[midiEvent.type];
        if(listeners !== undefined){
            objectForEach(listeners, function(listener){
                listener(midiEvent, input);
            });
        }

        channel = track.channel;
        if(channel === 'any' || channel === undefined || isNaN(channel) === true){
            channel = 0;
        }

        objectForEach(track.midiOutputs, function(output){
            //console.log('midi out', output, midiEvent.type);
            if(midiEvent.type === 128 || midiEvent.type === 144 || midiEvent.type === 176){
                //console.log(midiEvent.type, midiEvent.data1, midiEvent.data2);
                output.send([midiEvent.type, midiEvent.data1, midiEvent.data2]);
            // }else if(midiEvent.type === 192){
            //     output.send([midiEvent.type + channel, midiEvent.data1]);
            }
            //output.send([midiEvent.status + channel, midiEvent.data1, midiEvent.data2]);
        });

        // @TODO: maybe a track should be able to send its event to both a midi-out port and an internal heartbeat song?
        //console.log(track.routeToMidiOut);
        if(track.routeToMidiOut === false){
            midiEvent.track = track;
            track.instrument.processEvent(midiEvent);
        }
    }


    function addMidiEventListener(args, obj){ // obj can be a track or a song
        args = slice.call(args);

        var id = midiEventListenerId++,
            types = {},
            ids = [],
            listener,
            loop;


        // should I inline this?
        loop = function(args, i, maxi){
            for(i = 0; i < maxi; i++){
                var arg = args[i],
                    type = typeString(arg);
                //console.log(type);
                if(type === 'array'){
                    loop(arg, 0, arg.length);
                }else if(type === 'function'){
                    listener = arg;
                }else if(isNaN(arg) === false){
                    arg = parseInt(arg, 10);
                    if(sequencer.checkEventType(arg) !== false){
                        types[arg] = arg;
                    }
                }else if(type === 'string'){
                    if(sequencer.checkEventType(arg) !== false){
                        arg = sequencer.midiEventNumberByName(arg);
                        types[arg] = arg;
                    }
                }
            }
        };

        loop(args, 0, args.length);
        //console.log('types', types, 'listener', listener);

        objectForEach(types, function(type){
            //console.log(type);
            if(obj.midiEventListeners[type] === undefined){
                obj.midiEventListeners[type] = {};
            }
            obj.midiEventListeners[type][id] = listener;
            ids.push(type + '_' + id);
        });

        //console.log(obj.midiEventListeners);
        return ids.length === 1 ? ids[0] : ids;
    }


    function removeMidiEventListener(id, obj){
        var type;
        id = id.split('_');
        type = id[0];
        id = id[1];
        delete obj.midiEventListeners[type][id];
    }


    function removeMidiEventListeners(){

    }


    function getMidiPortsAsDropdown(config, obj){
        var select = document.createElement('select'),
            option, ports,
            type = config.type,
            id = config.id || type,
            div = config.div,
            firstOption = config.firstOption;

        if(type !== 'input' && type !== 'output'){
            console.log('please set type to "input" or "output"');
            return;
        }

        if(firstOption === undefined){
            firstOption = type === 'input' ? 'choose MIDI in' : 'choose MIDI out';
        }

        select.id = id;
        ports = type === 'input' ? obj.midiInputs : obj.midiOutputs;

        if(firstOption !== false){
            option = document.createElement('option');
            option.value = -1;
            option.innerHTML = firstOption;
            select.appendChild(option);
        }

        objectForEach(ports, function(port){
            option = document.createElement('option');
            option.value = port.id;
            option.innerHTML = port.name;
            select.appendChild(option);
        });

        if(div){
            div.appendChild(select);
        }
        return select;
    }


    sequencer.getMidiPortsAsDropdown = function(){
        getMidiPortsAsDropdown(sequencer);
    };


    sequencer.getMidiInputsAsDropdown = function(config){
        config = config || {
            type: 'input'
        };
        return getMidiPortsAsDropdown(config, sequencer);
    };


    sequencer.getMidiOutputsAsDropdown = function(config){
        config = config || {
            type: 'output'
        };
        return getMidiPortsAsDropdown(config, sequencer);
    };


    function getMidiInputs(cb, obj){
        var i, maxi;
        if(obj === sequencer){
            for(i = 0, maxi = midiInputsOrder.length; i < maxi; i++){
                cb(obj.midiInputs[midiInputsOrder[i].id], i);
            }
        }else{
            objectForEach(obj.midiInputs, function(port){
                cb(port, i);
            });
        }
    }


    function getMidiOutputs(cb, obj){
        var i, maxi;
        if(obj === sequencer){
            for(i = 0, maxi = midiOutputsOrder.length; i < maxi; i++){
                cb(obj.midiOutputs[midiOutputsOrder[i].id], i);
            }
        }else{
            objectForEach(obj.midiOutputs, function(port, i){
                cb(port, i);
            });
        }
    }


    sequencer.getMidiInputs = function(cb){
        getMidiInputs(cb, sequencer);
    };


    sequencer.getMidiOutputs = function(cb){
        getMidiOutputs(cb, sequencer);
    };


    sequencer.protectedScope.addInitMethod(function(){
        context = sequencer.protectedScope.context;
        createMidiNote = sequencer.createMidiNote;
        createMidiEvent = sequencer.createMidiEvent;
        typeString = sequencer.protectedScope.typeString;
        objectForEach = sequencer.protectedScope.objectForEach;
    });


    // close_module.js
    sequencer.protectedScope.initMidi = initMidi;

    // song.js
    sequencer.protectedScope.initMidiSong = initMidiSong;
    sequencer.protectedScope.getMidiInputs = getMidiInputs;
    sequencer.protectedScope.getMidiOutputs = getMidiOutputs;
    sequencer.protectedScope.setMidiInputSong = setMidiInputSong;
    sequencer.protectedScope.setMidiOutputSong = setMidiOutputSong;
    sequencer.protectedScope.addMidiEventListener = addMidiEventListener;
    sequencer.protectedScope.getMidiPortsAsDropdown = getMidiPortsAsDropdown;
    sequencer.protectedScope.removeMidiEventListener = removeMidiEventListener;
    sequencer.protectedScope.removeMidiEventListeners = removeMidiEventListeners;

}());




/*
    function handleMidiMessageTrack(e, track){
        var data = e.data,
            midiEvent,
            song = track.song,
            note, listeners;

        //console.log(track.recordPart);
        if(song){
            midiEvent = sequencer.createMidiEvent(song.ticks, data[0], data[1], data[2]);
            //console.log(midiEvent);
            if(midiEvent.type === 144){
                note = createMidiNote(midiEvent);
                track.recordingNotes[midiEvent.data1] = note;
                //track.song.recordingNotes[note.id] = note;
            }else if(midiEvent.type === 128){
                note = track.recordingNotes[midiEvent.data1];
                note.addNoteOff(midiEvent);
                delete track.recordingNotes[midiEvent.data1];
                //delete track.song.recordingNotes[note.id];
            }
            if(song.recording && song.playing && track.recordEnabled){
                if(midiEvent.type === 144){
                    track.song.recordedNotes.push(note);
                }
                track.recordPart.addEvent(midiEvent);
                track.song.recordedEvents.push(midiEvent);
            }else if(track.enableRetrospectiveRecording){
                track.retrospectiveRecording.push(midiEvent);
            }

            // call all midi event listeners
            listeners = track.midiEventListeners[midiEvent.type];
            if(listeners !== undefined){
                objectForEach(listeners, function(listener, id){
                    listener(midiEvent);
                });
            }
        }else{
            console.error('unexpected situation!');
            // does this ever happen?
            midiEvent = sequencer.createMidiEvent(0, data[0], data[1], data[2]);
            midiEvent.millis = song.recordTimestamp - sequencer.getTime();
            if(track.enableRetrospectiveRecording){
                track.retrospectiveRecording.push(midiEvent);
            }
            //@TODO: add parser for retrospective recording: convert millis to ticks
        }

        if(track.midiOutput !== undefined){
            track.midiOutput.send([data[0], data[1], data[2]]);
        }else{
            midiEvent.track = track;
            track.instrument.processEvent(midiEvent);
        }
    }
*///http://www.deluge.co/?q=midi-tempo-bpm
// This code is based on https://github.com/sergi/jsmidi

(function() {

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        AP = Array.prototype,
        PPQ = sequencer.defaultPPQ,
        HDR_CHUNKID = [
            'M'.charCodeAt(0),
            'T'.charCodeAt(0),
            'h'.charCodeAt(0),
            'd'.charCodeAt(0)
        ],
        HDR_CHUNK_SIZE = [0x0, 0x0, 0x0, 0x6], // Header size for SMF
        HDR_TYPE0 = [0x0, 0x0], // Midi Type 0 id
        HDR_TYPE1 = [0x0, 0x1], // Midi Type 1 id
        //HDR_PPQ = [0x01, 0xE0], // Defaults to 480 ticks per beat
        //HDR_PPQ = [0x00, 0x80], // Defaults to 128 ticks per beat
        HDR_PPQ = str2Bytes(PPQ.toString(16), 2),

        TRK_CHUNKID = [
            'M'.charCodeAt(0),
            'T'.charCodeAt(0),
            'r'.charCodeAt(0),
            'k'.charCodeAt(0)
        ],

        // Meta event codes
        META_SEQUENCE = 0x00,
        META_TEXT = 0x01,
        META_COPYRIGHT = 0x02,
        META_TRACK_NAME = 0x03,
        META_INSTRUMENT = 0x04,
        META_LYRIC = 0x05,
        META_MARKER = 0x06,
        META_CUE_POINT = 0x07,
        META_CHANNEL_PREFIX = 0x20,
        META_END_OF_TRACK = 0x2f,
        META_TEMPO = 0x51,
        META_SMPTE = 0x54,
        META_TIME_SIG = 0x58,
        META_KEY_SIG = 0x59,
        META_SEQ_EVENT = 0x7f;


    function write(song) {
        var byteArray = [].concat(HDR_CHUNKID, HDR_CHUNK_SIZE, HDR_TYPE1),
            tracks = song.tracks,
            numTracks = song.tracks.length + 1,
            i, maxi, track, midiFile, destination, b64,
            arrayBuffer, dataView, uintArray;


        byteArray = byteArray.concat(str2Bytes(numTracks.toString(16), 2), HDR_PPQ);
        //console.log(byteArray);
        byteArray = byteArray.concat(trackToBytes(song.timeEvents, song.durationTicks, 'tempo'));
        //console.log(song.durationMillis);

        for(i = 0, maxi = tracks.length; i < maxi; i++){
            track = tracks[i];
            byteArray = byteArray.concat(trackToBytes(track.events, song.durationTicks, track.name, track.instrumentId));
        }

        //b64 = btoa(codes2Str(byteArray));
        //window.location.assign("data:audio/midi;base64," + b64);
        //console.log(b64);// send to server

        maxi = byteArray.length;
        arrayBuffer = new ArrayBuffer(maxi);
        uintArray = new Uint8Array(arrayBuffer);
        for(i = 0; i < maxi; i++){
            uintArray[i] = byteArray[i];
        }
        midiFile = new Blob([uintArray], {type: 'application/x-midi', endings: 'transparent'});
        saveAs(midiFile, song.name);
        //window.location.assign(window.URL.createObjectURL(midiFile));
    }


    function trackToBytes(events, lastEventTicks, trackName, instrumentName){
        var lengthBytes,
            i, maxi, event, status,
            trackLength, // number of bytes in track chunk
            ticks = 0,
            delta = 0,
            trackBytes = [];

        if(trackName){
            trackBytes.push(0x00);
            trackBytes.push(0xFF);
            trackBytes.push(0x03);
            trackBytes = trackBytes.concat(convertToVLQ(trackName.length));
            trackBytes = trackBytes.concat(stringToNumArray(trackName));
        }

        if(instrumentName){
            trackBytes.push(0x00);
            trackBytes.push(0xFF);
            trackBytes.push(0x04);
            trackBytes = trackBytes.concat(convertToVLQ(instrumentName.length));
            trackBytes = trackBytes.concat(stringToNumArray(instrumentName));
        }

        for(i = 0, maxi = events.length; i < maxi; i++){
            event = events[i];
            delta = event.ticks - ticks;
            delta = convertToVLQ(delta);
            //console.log(delta);
            trackBytes = trackBytes.concat(delta);
            //trackBytes.push.apply(trackBytes, delta);
            if(event.type === 0x80 || event.type === 0x90){ // note off, note on
                //status = parseInt(event.type.toString(16) + event.channel.toString(16), 16);
                status = event.type + event.channel;
                trackBytes.push(status);
                trackBytes.push(event.noteNumber);
                trackBytes.push(event.velocity);
            }else if(event.type === 0x51){ // tempo
                trackBytes.push(0xFF);
                trackBytes.push(0x51);
                trackBytes.push(0x03);// length
                //trackBytes = trackBytes.concat(convertToVLQ(3));// length
                var microSeconds = Math.round(60000000/event.bpm);
                trackBytes = trackBytes.concat(str2Bytes(microSeconds.toString(16), 3));
            }else if(event.type === 0x58){ // time signature
                var denom = event.denominator;
                if(denom === 2){
                    denom = 0x01;
                }else if(denom === 4){
                    denom = 0x02;
                }else if(denom === 8){
                    denom = 0x03;
                }else if(denom === 16){
                    denom = 0x04;
                }else if(denom === 32){
                    denom = 0x05;
                }
                trackBytes.push(0xFF);
                trackBytes.push(0x58);
                trackBytes.push(0x04);// length
                //trackBytes = trackBytes.concat(convertToVLQ(4));// length
                trackBytes.push(event.nominator);
                trackBytes.push(denom);
                trackBytes.push(PPQ/event.nominator);
                trackBytes.push(0x08); // 32nd notes per crotchet
                //console.log(trackName, event.nominator, event.denominator, denom, PPQ/event.nominator);
            }
            // set the new ticks reference
            //console.log(status, event.ticks, ticks);
            ticks = event.ticks;
        }
        delta = lastEventTicks - ticks;
        //console.log('d', delta, 't', ticks, 'l', lastEventTicks);
        delta = convertToVLQ(delta);
        //console.log(trackName, ticks, delta);
        trackBytes = trackBytes.concat(delta);
        trackBytes.push(0xFF);
        trackBytes.push(0x2F);
        trackBytes.push(0x00);
        //console.log(trackName, trackBytes);
        trackLength = trackBytes.length;
        lengthBytes = str2Bytes(trackLength.toString(16), 4);
        return [].concat(TRK_CHUNKID, lengthBytes, trackBytes);
    }


    // Helper functions

    /*
     * Converts an array of bytes to a string of hexadecimal characters. Prepares
     * it to be converted into a base64 string.
     *
     * @param byteArray {Array} array of bytes that will be converted to a string
     * @returns hexadecimal string
     */

    function codes2Str(byteArray) {
        return String.fromCharCode.apply(null, byteArray);
    }

    /*
     * Converts a String of hexadecimal values to an array of bytes. It can also
     * add remaining '0' nibbles in order to have enough bytes in the array as the
     * |finalBytes| parameter.
     *
     * @param str {String} string of hexadecimal values e.g. '097B8A'
     * @param finalBytes {Integer} Optional. The desired number of bytes that the returned array should contain
     * @returns array of nibbles.
     */

    function str2Bytes(str, finalBytes) {
        if (finalBytes) {
            while ((str.length / 2) < finalBytes) {
                str = '0' + str;
            }
        }

        var bytes = [];
        for (var i = str.length - 1; i >= 0; i = i - 2) {
            var chars = i === 0 ? str[i] : str[i - 1] + str[i];
            bytes.unshift(parseInt(chars, 16));
        }

        return bytes;
    }


    /**
     * Translates number of ticks to MIDI timestamp format, returning an array of
     * bytes with the time values. Midi has a very particular time to express time,
     * take a good look at the spec before ever touching this function.
     *
     * @param ticks {Integer} Number of ticks to be translated
     * @returns Array of bytes that form the MIDI time value
     */
    function convertToVLQ(ticks) {
        var buffer = ticks & 0x7F;

        while (ticks = ticks >> 7) {
            buffer <<= 8;
            buffer |= ((ticks & 0x7F) | 0x80);
        }

        var bList = [];
        while (true) {
            bList.push(buffer & 0xff);

            if (buffer & 0x80) {
                buffer >>= 8;
            } else {
                break;
            }
        }

        //console.log(ticks, bList);
        return bList;
    }


    /*
     * Converts a string into an array of ASCII char codes for every character of
     * the string.
     *
     * @param str {String} String to be converted
     * @returns array with the charcode values of the string
     */
    function stringToNumArray(str) {
        return AP.map.call(str, function(char) {
            return char.charCodeAt(0);
        });
    }


    sequencer.protectedScope.saveToMidiFile = write;
    sequencer.saveSongAsMidiFile = write;

}());
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

                measureNumber = xmlDoc.evaluate('@number', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;

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
                noteIterator = xmlDoc.evaluate('*[self::note or self::backup or self::forward]', measureNode, nsResolver, XPathResult.ANY_TYPE, null);
                while((noteNode = noteIterator.iterateNext()) !== null){
                    //console.log(noteNode);

                    tieStart = false;
                    tieStop = false;
                    tieIterator = xmlDoc.evaluate('tie', noteNode, nsResolver, XPathResult.ANY_TYPE, null);
                    while((tieNode = tieIterator.iterateNext()) !== null){
                        tmp1 = xmlDoc.evaluate('@type', tieNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        //console.log(tmp1);
                        if(tmp1 === 'start'){
                            tieStart = true;
                        }else if(tmp1 === 'stop'){
                            tieStop = true;
                        }
                        //tieStart = xmlDoc.evaluate('@type="start"', tieNode, nsResolver, XPathResult.BOOLEAN_TYPE, null).booleanValue;
                        //tieStop = xmlDoc.evaluate('@type="stop"', tieNode, nsResolver, XPathResult.BOOLEAN_TYPE, null).booleanValue;
                        //console.log(tieStart, tieStop);
                    }

                    rest = xmlDoc.evaluate('rest', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    chord = xmlDoc.evaluate('chord', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                    if(rest !== null){
                        //console.log(rest);
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        ticks += (noteDuration/divisions) * ppq;

                    }else if(noteNode.nodeName === 'note'){

                        step = xmlDoc.evaluate('pitch/step', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        alter = xmlDoc.evaluate('pitch/alter', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        voice = xmlDoc.evaluate('voice', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
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
                            noteOn = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
                            ticks += (noteDuration/divisions) * ppq;
                            noteOff = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
                            if(chord !== null){
                                ticks -= (noteDuration/divisions) * ppq;
                            }

                            //console.log('tie', tieStart, tieStop);

                            if(tieStart === false && tieStop === false){
                                // no ties
                                events.push(noteOn, noteOff);
                                //console.log('no ties', measureNumber, voice, noteNumber, tiedNotes);
                            }else if(tieStart === true && tieStop === false){
                                // start of tie
                                tiedNotes[voice + '-' + noteNumber] = noteOff;
                                events.push(noteOn, noteOff);
                                //console.log('start', measureNumber, voice, noteNumber, tiedNotes);
                            }else if(tieStart === true && tieStop === true){
                                // tied to yet another note
                                tiedNotes[voice + '-' + noteNumber].ticks += (noteDuration/divisions) * ppq;
                                //console.log('thru', measureNumber, voice, noteNumber, tiedNotes);
                            }else if(tieStart === false && tieStop === true){
                                // end of tie
                                tiedNotes[voice + '-' + noteNumber].ticks += (noteDuration/divisions) * ppq;
                                delete tiedNotes[voice + '-' + noteNumber];
                                //console.log('end', measureNumber, voice, noteNumber, tiedNotes);
                            }
                            //console.log(noteNumber, ticks);
                        }

                    }else if(noteNode.nodeName === 'backup'){
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        ticks -= (noteDuration/divisions) * ppq;
                        //console.log(noteDuration, divisions);
                    }else if(noteNode.nodeName === 'forward'){
                        noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
                        ticks += (noteDuration/divisions) * ppq;
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

}());(function(){

    'use strict';

    var
        //import
        typeString, // → defined in util.js

        //local
        noteNames,
        getNoteNumber,
        getNoteName,
        checkNoteName,
        getFrequency,
        createNote,
        isNoteMode,
        isBlackKey,
        pow = Math.pow;

    noteNames = {
        'sharp' : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        'flat' : ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
        'enharmonic-sharp' : ['B#', 'C#', 'C##', 'D#', 'D##', 'E#', 'F#', 'F##', 'G#', 'G##', 'A#', 'A##'],
        'enharmonic-flat' : ['Dbb', 'Db', 'Ebb', 'Eb', 'Fb', 'Gbb', 'Gb', 'Abb', 'Ab', 'Bbb', 'Bb', 'Cb']
    };


    /*
        arguments
        - noteNumber: 60
        - noteName: 'C#4'
        - name and octave: 'C#', 4


        note {
            name: 'C',
            octave: 1,
            fullName: 'C1',
            frequency: 234.16,
            number: 60
        }
    */
    createNote = function(){
        var args = Array.prototype.slice.call(arguments),
            numArgs = args.length,
            data,
            warn = false,
            error = false,
            octave,
            noteName,
            noteNumber,
            noteNameMode,
            frequency,
            arg0 = args[0],
            arg1 = args[1],
            arg2 = args[2];


        // arg: note number
        if(numArgs === 1 && !isNaN(arg0)){
            if(arg0 < 0 || arg0 > 127){
                error = 'please provide a note number >= 0 and <= 127', arg0;
            }else{
                noteNumber = arg0;
                data = getNoteName(noteNumber);
                noteName = data[0];
                octave = data[1];
            }

        // arguments: full note name
        }else if(numArgs === 1 && typeString(arg0) === 'string'){
            data = checkNoteName(arg0);
            if(!data){
                error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
            }else{
                noteName = data[0];
                octave = data[1];
                noteNumber = getNoteNumber(noteName,octave);
                if(!noteNumber){
                    error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
                }else if(noteNumber < 0 || noteNumber > 127){
                    error = 'please provide a note between C0 and G10';
                }
            }

        // arguments: note name, octave
        }else if(numArgs === 2 && typeString(arg0) === 'string' && !isNaN(arg1)){
            data = checkNoteName(arg0,arg1);
            if(!data){
                error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb';
            }else{
                noteName = data[0];
                octave = data[1];
                noteNumber = getNoteNumber(noteName,octave);
                if(!noteNumber){
                    error = noteName + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb';
                }else if(noteNumber < 0 || noteNumber > 127){
                    error = 'please provide a note between C0 and G10';
                }
            }

        // arguments: full note name, note name mode
        }else if(numArgs === 2 && typeString(arg0) === 'string' && typeString(arg1) === 'string'){
            data = checkNoteName(arg0);
            if(!data){
                error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
            }else{
                noteNameMode = isNoteMode(arg1);
                if(!noteNameMode){
                    noteNameMode = sequencer.noteNameMode;
                    warn = arg1 + ' is not a valid note name mode, using ' + noteNameMode;
                }
                noteName = data[0];
                octave = data[1];
                noteNumber = getNoteNumber(noteName,octave);
                if(!noteNumber){
                    error = noteName + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
                }else if(noteNumber < 0 || noteNumber > 127){
                    error = 'please provide a note between C0 and G10';
                }
                noteName = getNoteName(noteNumber,noteNameMode)[0];
            }


        // arguments: note number, note name mode
        }else if(numArgs === 2 && typeString(arg0) === 'number' && typeString(arg1) === 'string'){
            if(arg0 < 0 || arg0 > 127){
                error = 'please provide a note number >= 0 and <= 127', arg0;
            }else{
                noteNameMode = isNoteMode(arg1);
                if(!noteNameMode){
                    noteNameMode = sequencer.noteNameMode;
                    warn = arg1 + ' is not a valid note name mode, using ' + noteNameMode;
                }
                noteNumber = arg0;
                data = getNoteName(noteNumber, noteNameMode);
                noteName = data[0];
                octave = data[1];
                noteName = getNoteName(noteNumber,noteNameMode)[0];
            }


        // arguments: note name, octave, note name mode
        }else if(numArgs === 3 && typeString(arg0) === 'string' && !isNaN(arg1) && typeString(arg2) === 'string'){
            data = checkNoteName(arg0,arg1);
            if(!data){
                error = arg0 + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
            }else{
                noteNameMode = isNoteMode(arg2);
                if(!noteNameMode){
                    noteNameMode = sequencer.noteNameMode;
                    warn = arg2 + ' is not a valid note name mode, using ' + noteNameMode;
                }
                noteName = data[0];
                octave = data[1];
                noteNumber = getNoteNumber(noteName,octave);
                if(!noteNumber){
                    error = noteName + ' is not a valid note name, please use letters A - G and if necessary an accidental like #, ##, b or bb, followed by a number for the octave';
                }else if(noteNumber < 0 || noteNumber > 127){
                    error = 'please provide a note between C0 and G10';
                }
                noteName = getNoteName(noteNumber,noteNameMode)[0];
            }
        }else{
            error = 'wrong arguments, please consult documentation';
        }

        if(error){
            console.error(error);
            return false;
        }

        if(warn){
            console.warn(warn);
        }

        frequency = getFrequency(noteNumber);
        //console.log(noteName,octave,noteNumber,frequency);

        return {
            name: noteName,
            octave: octave,
            fullName: noteName + octave,
            number: noteNumber,
            frequency: frequency,
            blackKey: isBlackKey(noteNumber)
        };

    };


    getNoteName = function(number, mode) {
        mode = mode || sequencer.noteNameMode;
        //console.log(mode);
        //var octave = Math.floor((number / 12) - 2), // → in Cubase central C = C3 instead of C4
        var octave = Math.floor((number / 12) - 1),
            noteName = noteNames[mode][number % 12];
        return [noteName,octave];
    };


    getNoteNumber = function(name, octave, mode) {
        var key,index,i,maxi,number;
        //mode = mode || sequencer.noteNameMode;

        //if(mode){}

        for(key in noteNames) {
            if(noteNames.hasOwnProperty(key)){
                mode = noteNames[key];
                //console.log(key);
                for(i = 0, maxi = mode.length; i < maxi; i = i + 1) {
                    //console.log(mode[i],name,i);
                    if(mode[i] === name) {
                        index = i;
                        break;
                    }
                }
            }
        }

        if(index === -1) {
            return false;
        }

        //number = (index + 12) + (octave * 12) + 12; // → in Cubase central C = C3 instead of C4
        number = (index + 12) + (octave * 12);// → midi standard + scientific naming, see: http://en.wikipedia.org/wiki/Middle_C and http://en.wikipedia.org/wiki/Scientific_pitch_notation
        return number;
    };


    getFrequency = function(number){
        return sequencer.pitch * pow(2,(number - 69)/12); // midi standard, see: http://en.wikipedia.org/wiki/MIDI_Tuning_Standard
    };


    function getPitch(hertz){
        //fm  =  2(m−69)/12(440 Hz).
    }


    checkNoteName = function(){
        var
            args = Array.prototype.slice.call(arguments),
            numArgs = args.length,
            arg0 = args[0],
            arg1 = args[1],
            length,i,char,
            name,
            octave;


        if(numArgs === 1 && typeString(arg0) === 'string'){

            length = arg0.length;
            name = '';
            octave = '';

            for(i = 0; i < length; i++){
                char = arg0[i];
                if(isNaN(char) && char !== '-'){
                    name += char;
                }else{
                    octave += char;
                }
            }

            if(octave === ''){
                octave = 0;
            }

        }else if(numArgs === 2 && typeString(arg0) === 'string' && !isNaN(arg1)){

            name = arg0;
            octave = arg1;

        }else{
            return false;
        }

        octave = parseInt(octave,10);
        name = name.substring(0,1).toUpperCase() + name.substring(1);

        //console.log(name,'|',octave);
        return [name, octave];
    };


    isNoteMode = function(mode){
        var result = false;
        switch(mode){
            case 'sharp':
            case 'flat':
            case 'enharmonic-sharp':
            case 'enharmonic-flat':
                result = mode;
                break;
        }
        return result;
    };


    isBlackKey = function(noteNumber){
        var black;

        switch(true){
            case noteNumber % 12 === 1://C#
            case noteNumber % 12 === 3://D#
            case noteNumber % 12 === 6://F#
            case noteNumber % 12 === 8://G#
            case noteNumber % 12 === 10://A#
                black = true;
                break;
            default:
                black = false;
        }

        return black;
    };

///*
    sequencer.getNoteNumber = function(){
        var note = createNote.apply(this,arguments);
        if(note){
            return note.number;
        }
        return false;
    };


    sequencer.getNoteName = function(){
        var note = createNote.apply(this, arguments);
        if(note){
            return note.name;
        }
        return false;
    };

    sequencer.getNoteNameFromNoteNumber = function(number, mode){
        return getNoteName(number, mode);
    };


    sequencer.getNoteOctave = function(){
        var note = createNote.apply(this,arguments);
        if(note){
            return note.octave;
        }
        return false;
    };


    sequencer.getFullNoteName = function(){
        var note = createNote.apply(this,arguments);
        if(note){
            return note.fullName;
        }
        return false;
    };


    sequencer.getFrequency = function(){
        var note = createNote.apply(this,arguments);
        if(note){
            return note.frequency;
        }
        return false;
    };

//*/
    sequencer.isBlackKey = function(){
        var note = createNote.apply(this,arguments);
        if(note){
            return note.blackKey;
        }
        return false;
    };

/*
    sequencer.SHARP = 'sharp';
    sequencer.FLAT = 'flat';
    sequencer.ENHARMONIC_SHARP = 'enharmonic-sharp';
    sequencer.ENHARMONIC_FLAT = 'enharmonic-flat';
*/

    Object.defineProperty(sequencer, 'SHARP', {value: 'sharp'});
    Object.defineProperty(sequencer, 'FLAT', {value: 'flat'});
    Object.defineProperty(sequencer, 'ENHARMONIC_SHARP', {value: 'enharmonic-sharp'});
    Object.defineProperty(sequencer, 'ENHARMONIC_FLAT', {value: 'enharmonic-flat'});

    sequencer.createNote = createNote;

    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
    });

}());    (function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        round = Math.round,

        precision = Math.pow(10, sequencer.precision),

        //local
        factor,
        nominator,
        denominator,

        bar,
        beat,
        sixteenth,
        tick,

        ticksPerBar,
        ticksPerBeat,
        ticksPerSixteenth,
        numSixteenth,
        millisPerTick,
        secondsPerTick,

        millis,

        bpm;

    // public
    function parse(song, events){

        var event,
            numEvents,
            startEvent = 0,
            lastEventTick = 0,
            diffTicks,
            i;

        numEvents = events.length;
        //console.log('parseEvents', numEvents);
        events.sort(function(a, b){
            return a.sortIndex - b.sortIndex;
        });

        getDataFromEvent(song.timeEvents[0]);

        for(i = startEvent; i < numEvents; i++){

            event = events[i];
            //console.log(i, event);
            diffTicks = event.ticks - lastEventTick;
            tick += diffTicks;

            while(tick >= ticksPerSixteenth){
                sixteenth++;
                tick -= ticksPerSixteenth;
                while(sixteenth > numSixteenth){
                    sixteenth -= numSixteenth;
                    beat++;
                    while(beat > nominator){
                        beat -= nominator;
                        bar++;
                    }
                }
            }


            switch(event.type){

                case 0x51:
                    bpm = event.bpm;
                    millis = event.millis;
                    millisPerTick = event.millisPerTick;
                    secondsPerTick = event.secondsPerTick;
                    //console.log(millisPerTick,event.millisPerTick);
                    //console.log(event);
                    break;

                case 0x58:
                    factor = event.factor;
                    nominator = event.nominator;
                    denominator = event.denominator;
                    numSixteenth = event.numSixteenth;
                    ticksPerBar = event.ticksPerBar;
                    ticksPerBeat = event.ticksPerBeat;
                    ticksPerSixteenth = event.ticksPerSixteenth;
                    millis = event.millis;
                    //console.log(nominator,numSixteenth,ticksPerSixteenth);
                    //console.log(event);
                    break;

                default:
                    millis = millis + (diffTicks * millisPerTick);
                    updateEvent(event);
            }

            lastEventTick = event.ticks;
        }
        song.lastEventTmp = event;
    }


    function getDataFromEvent(event){

        bpm = event.bpm;
        factor = event.factor;
        nominator = event.nominator;
        denominator = event.denominator;

        ticksPerBar = event.ticksPerBar;
        ticksPerBeat = event.ticksPerBeat;
        ticksPerSixteenth = event.ticksPerSixteenth;

        numSixteenth = event.numSixteenth;

        millisPerTick = event.millisPerTick;
        secondsPerTick = event.secondsPerTick;

        millis = event.millis;

        bar = event.bar;
        beat = event.beat;
        sixteenth = event.sixteenth;
        tick = event.tick;
    }


    function updateEvent(event){
        var timeData, tickAsString;

        timeData = sequencer.getNiceTime(millis);

        event.bpm = bpm;
        event.factor = factor;
        event.nominator = nominator;
        event.denominator = denominator;

        event.ticksPerBar = ticksPerBar;
        event.ticksPerBeat = ticksPerBeat;
        event.ticksPerSixteenth = ticksPerSixteenth;

        event.numSixteenth = numSixteenth;

        event.millisPerTick = millisPerTick;
        event.secondsPerTick = secondsPerTick;

        event.millis = round(millis * precision)/precision;
        //event.millis = millis;
        //event.seconds = millis/1000;

        event.hour = timeData.hour;
        event.minute = timeData.minute;
        event.second = timeData.second;
        event.millisecond = timeData.millisecond;
        event.timeAsString = timeData.timeAsString;
        event.timeAsArray = timeData.timeAsArray;

        event.bar = bar;
        event.beat = beat;
        event.sixteenth = sixteenth;
        event.tick = tick;
        tickAsString = tick === 0 ? '000' : tick < 10 ? '00' + tick : tick < 100 ? '0' + tick : tick;
        event.barsAsString = bar + ':' + beat + ':' + sixteenth + ':' + tickAsString;
        event.barsAsArray = [bar, beat, sixteenth, tick];

        event.state = 'clean';
        event.update();

        //console.log(event.nominator, event.ticks);
    }



    sequencer.protectedScope.parseEvents = parse;

    sequencer.protectedScope.addInitMethod(function(){
    });

}());
(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //import
        createMidiEvent, // → defined in midi_event.js

        //local
        ppq,
        bpm,
        factor,
        nominator,
        denominator,
        playbackSpeed,

        bar,
        beat,
        sixteenth,
        tick,
        ticks,
        millis,

        millisPerTick,
        secondsPerTick,

        ticksPerBeat,
        ticksPerBar,
        ticksPerSixteenth,
        numSixteenth,

        timeEvents,
        numTimeEvents,
        index;


    function setTickDuration(){
        secondsPerTick = (1/playbackSpeed * 60)/bpm/ppq;
        millisPerTick = secondsPerTick * 1000;
        //console.log(millisPerTick, bpm, ppq, playbackSpeed, (ppq * millisPerTick));
        //console.log(ppq);
    }


    function setTicksPerBeat(){
        factor = (4/denominator);
        numSixteenth = factor * 4;
        ticksPerBeat = ppq * factor;
        ticksPerBar = ticksPerBeat * nominator;
        ticksPerSixteenth = ppq/4;
        //console.log(denominator, factor, numSixteenth, ticksPerBeat, ticksPerBar, ticksPerSixteenth);
    }


    function parse(song){
        //console.time('parse time events ' + song.name);
        var diffTicks,
            event,
            type,
            i = 0;

        if(song === undefined){
            timeEvents = [];
            console.log('reset', timeEvents);
            return;
        }

        reset(song);

        //console.log('parse time events', numTimeEvents);
        setTickDuration();
        setTicksPerBeat();

        timeEvents.sort(function(a,b){
            return a.ticks - b.ticks;
        });

        for(i = 0; i < numTimeEvents; i++){

            event = timeEvents[i];
            event.song = song;
            diffTicks = event.ticks - ticks;
            tick += diffTicks;
            ticks = event.ticks;
            type = event.type;
            //console.log(diffTicks, millisPerTick);
            millis += diffTicks * millisPerTick;

            while(tick >= ticksPerSixteenth){
                sixteenth++;
                tick -= ticksPerSixteenth;
                while(sixteenth > numSixteenth){
                    sixteenth -= numSixteenth;
                    beat++;
                    while(beat > nominator){
                        beat -= nominator;
                        bar++;
                    }
                }
            }

            switch(type){

                case 0x51:
                    bpm = event.bpm;
                    setTickDuration();
                    break;

                case 0x58:
                    nominator = event.nominator;
                    denominator = event.denominator;
                    setTicksPerBeat();
                    break;

                default:
                    continue;
            }

            //time data of time event is valid from (and included) the position of the time event
            updateEvent(event);
            //console.log(event.barsAsString);
        }

        song.lastEventTmp = event;
        //console.log(event);
        //console.log(timeEvents);
    }


    function reset(song){
        playbackSpeed = song.playbackSpeed;
        timeEvents = song.timeEvents;
        numTimeEvents = timeEvents.length;
        ppq = song.ppq;
        bpm = song.bpm;
        nominator = song.nominator;
        denominator = song.denominator;

        //console.log('reset', timeEvents, numTimeEvents, bpm, ppq, nominator, denominator);
        //console.log('reset', numTimeEvents, bpm, ppq, nominator, denominator);

        index = 0;

        bar = 1;//0
        beat = 1;//0
        sixteenth = 1;//0
        tick = 0;
        ticks = 0;
        millis = 0;
    }


    function updateEvent(event){

        //console.log(event, bpm, millisPerTick, ticks, millis);

        event.bpm = bpm;
        event.nominator = nominator;
        event.denominator = denominator;

        event.ticksPerBar = ticksPerBar;
        event.ticksPerBeat = ticksPerBeat;
        event.ticksPerSixteenth = ticksPerSixteenth;

        event.factor = factor;
        event.numSixteenth = numSixteenth;
        event.secondsPerTick = secondsPerTick;
        event.millisPerTick = millisPerTick;


        event.ticks = ticks;

        event.millis = millis;
        event.seconds = millis/1000;


        event.bar = bar;
        event.beat = beat;
        event.sixteenth = sixteenth;
        event.tick = tick;
        //event.barsAsString = (bar + 1) + ':' + (beat + 1) + ':' + (sixteenth + 1) + ':' + tick;
        var tickAsString = tick === 0 ? '000' : tick < 10 ? '00' + tick : tick < 100 ? '0' + tick : tick;
        event.barsAsString = bar + ':' + beat + ':' + sixteenth + ':' + tickAsString;
        event.barsAsArray = [bar, beat, sixteenth, tick];


        var timeData = sequencer.getNiceTime(millis);

        event.hour = timeData.hour;
        event.minute = timeData.minute;
        event.second = timeData.second;
        event.millisecond = timeData.millisecond;
        event.timeAsString = timeData.timeAsString;
        event.timeAsArray = timeData.timeAsArray;
    }


    sequencer.protectedScope.parseTimeEvents = parse;

    sequencer.protectedScope.addInitMethod(function(){
        createMidiEvent = sequencer.createMidiEvent;
    });

}());


/*
    scaffoldingTicks = function(song){
        var end = song.ticks,
            interval = 480,
            range = 0,
            event,
            events,
            numEvents,
            diffTicks,
            diffMillis;

        song.eventRanges.ticks = {};
        reset();

        while(range <= end){
            events = getNextTimeEvents('ticks',range);
            numEvents = events.length;

            if(numEvents === 0){
                //add at least one event in this range
                event = createMidiEvent(0,sequencer.DUMMY_EVENT);
                //calculate position
                diffTicks = range - ticks;
                tick += diffTicks;
                diffMillis = diffTicks * millisPerTick;
                millis += diffMillis;

                while(tick >= ticksPerSixteenth){
                    sixteenth++;
                    tick -= ticksPerSixteenth;
                    while(sixteenth >= numSixteenth){
                        sixteenth -= numSixteenth;
                        beat++;
                        while(beat >= nominator){
                            beat -= nominator;
                            bar++;
                        }
                    }
                }
                ticks = range;
                updateEvent(event);
                events.push(event);
            }else{
                getDataFromEvent(events[numEvents - 1]);
            }
            song.eventRanges.ticks[range] = events;
            //console.log(bar+1,beat+1,sixteenth+1,tick+1);
            range += interval;
        }
    };


    scaffoldingMillis = function(song){
        var end = song.durationMillis,
            interval = 500,
            events,
            numEvents,
            event,
            range = 0,
            diffTicks;

        song.eventRanges.millis = {};
        reset();

        while(range <= end){
            events = getNextTimeEvents('millis',range);
            numEvents = events.length;
            if(numEvents === 0){
                //add at least one event in this range
                event = createMidiEvent(range,sequencer.DUMMY_EVENT);
                //calculate position data
                diffTicks = (range - millis)/millisPerTick;
                tick += diffTicks;
                ticks += diffTicks;

                while(tick >= ticksPerSixteenth){
                    sixteenth++;
                    tick -= ticksPerSixteenth;
                    tick = tick;
                    while(sixteenth >= numSixteenth){
                        sixteenth -= numSixteenth;
                        beat++;
                        while(beat >= nominator){
                            beat -= nominator;
                            bar++;
                        }
                    }
                }
                millis = range;
                updateEvent(event);
                events.push(event);
            }else{
                getDataFromEvent(events[numEvents - 1]);
            }
            song.eventRanges.millis[range] = events;
            //console.log(bar+1,beat+1,sixteenth+1,tick+1);
            range += interval;
        }
    };


    scaffoldingBars = function(){
        var song = sequencer.song,
            end = song.durationTicks,
            range = 0,
            bars = [],
            event,
            events,
            numEvents,
            diffTicks,
            diffMillis;

        index = 0;
        getDataFromEvent(song.timeEvents[0]);

        while(range <= end){
            events = getNextTimeEvents('ticks',ticksPerBar);
            numEvents = events.length;
            if(numEvents > 0){
                getDataFromEvent(events[numEvents - 1]);
            }
            event = createMidiEvent(0,sequencer.DUMMY_EVENT);

            //calculate position of newly created event
            diffTicks = range - ticks;
            tick += diffTicks;
            diffMillis = diffTicks * millisPerTick;
            millis += diffMillis;

            while(tick >= ticksPerSixteenth){
                sixteenth++;
                tick -= ticksPerSixteenth;
                while(sixteenth >= numSixteenth){
                    sixteenth -= numSixteenth;
                    beat++;
                    while(beat >= nominator){
                        beat -= nominator;
                        bar++;
                    }
                }
            }

            ticks = range;
            updateEvent(event);
            bars.push(event);
            range += ticksPerBar;
        }
        return bars;
    };



    sequencer.protectedScope.createScaffolding = function(song){
        reset(song);
        scaffoldingTicks(song);
        scaffoldingMillis(song);
        console.log(song.eventRanges);
    };

    sequencer.protectedScope.getScaffoldingBars = scaffoldingBars;


*/(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //import
        createMidiNote, // → defined in midi_note.js
        createMidiEvent, // → defined in midi_event.js
        copyName, // → defined in utils.js
        typeString, // → defined in utils.js

        findEvent, // → defined in find_event.js
        findNote, // → defined in find_event.js
        getStats, // → defined in event_statistics.js

        //private
        getEvent,
        addEvents,
        moveEvents,
        removeEvents,
        transposeEvents,
        getEventsAndConfig,

        reverseByPitch,
        reverseByTicks,

        partId = 0,

        //public/protected
        Part;


    Part = function(name){
        this.className = 'Part';
        this.id = 'P' + partId++ + '' + new Date().getTime();
        this.partIndex = partId;
        this.name = name || this.id;

        this.events = [];
        this.eventsById = {};
        this.numEvents = 0;

        this.notes = [];
        this.notesById = {};
        this.numNotes = 0;

        this.dirtyEvents = {};
        this.dirtyNotes = {};

        this.song = undefined;
        this.autoSize = 'right'; // 'right' or 'both'

        this.ticks = 0;
        this.millis = 0;
        this.start = {
            ticks: this.ticks,
            millis: this.millis
        };
        this.end = {
            ticks: 0,
            millis: 0
        };
        this.duration = {
            ticks: 0,
            millis: 0
        };
        this.startPosition = undefined;
        this.endPosition = undefined;

        //this.fixedPitch = false;
        this.needsUpdate = false;
        this.state = 'clean';
        this.mute = false;
        this.solo = false;
        this.keepWhenEmpty = true; // if set to false, the parts gets deleted automatically if it contains no events
    };

    getEventsAndConfig = function(args, part){

        args = Array.prototype.slice.call(args);

        var
            j = 0,
            i = 0,
            maxi,
            e,
            arg,
            arg0 = args[0],
            events = [],
            config = [];

        //console.log(args, arg0);

        if(typeString(arg0) === 'array'){

            for(i = arg0.length - 1; i >= 0; i--){
                arg = arg0[i];
                e = getEvent(arg, part);
                if(e){
                    events.push(e);
                }
            }
            j = events.length === 0 ? 0 : 1;
        }

        maxi = args.length;
        for(i = j; i < maxi; i++){
            arg = args[i];
            e = getEvent(arg, part);
            if(e){
                events.push(e);
            }else{
                config.push(arg);
            }
        }

        if(events.length === 0){
            //console.error('Please provide one or more events, event ids, event indices, or an array of events, events ids, event indices');
            if(sequencer.debug){
                console.warn('no events added', part.name);
            }
            return false;
        }

        if(config.length === 1 && typeString(config[0]) === 'array'){
            config = config[0];
        }

        //console.log(events, config);

        return {
            events: events,
            config: config
        };
    };



    getEvent = function(data, part){
        var event = false;
        if(!data){
            event = false;
        }else if(data.className === 'MidiEvent' || data.className === 'AudioEvent'){
            // new event
            event = data;
        }else if(typeString(data) === 'array' && data.length === 4){
            // new event as array
            event = createMidiEvent(data);
        }else if(typeString(data) === 'string'){
            // get by id
            event = part.eventsById[data];
        }else if(isNaN(data) === false){
            // get by index
            event = part.events[data];
        }
        return event;
    };



    addEvents = function(args, part, relative){
        if(args === false){
            return;
        }
        var i,e,
            newEvents = args.events,
            ticks = part.ticks,
            maxi = newEvents.length,
            track = part.track,
            eventsById = part.eventsById;

        //console.log(newEvents);

        //for(i = newEvents.length - 1; i >=0; i--){
        for(i = 0; i < maxi; i++){

            e = newEvents[i];

            if(e.type === sequencer.END_OF_TRACK || (e.className !== 'MidiEvent' && e.className !== 'AudioEvent')){
                continue;
            }
            if(e.className === 'AudioEvent' && part.hasAudioEvents !== true){
                part.hasAudioEvents = true;
            }

            if(e.part !== undefined){
                //console.warn('this event has already been added to part', e.part.id, ', adding a copy to', part.id);
                e = e.clone();
            }

            e.part = part;
            e.partId = part.id;

            if(relative){
                ticks += e.ticks;
                e.ticks = ticks;
            }

            e.track = track;
            e.trackId = track ? track.id : undefined;

            e.song = undefined;
            if(track !== undefined){
                e.song = track.song;
            }

            if(e.state !== 'recorded'){
                e.state = 'new';
            }
            eventsById[e.id] = e;
        }

        if(part.state !== 'new'){
            part.state = 'changed';
        }
        part.needsUpdate = true;
    };


    transposeEvents = function(args, part){
        //if(args === false || part.fixedPitch === true){
        if(args === false){
            return;
        }
        var i, e,
            events = args.events,
            semi = args.config[0];

        //console.log(semi, args);

        for(i = events.length - 1; i >= 0; i--){
            e = events[i];
            e.transpose(semi);
        /*
            // moved to midi_event.js
            if(e.state !== 'new'){
                e.state = 'changed';
            }
        */
            //console.log(e.state);
        }
        //part.needsUpdate = true; -> moved to midi_event.js
        if(part.state !== 'new' && part.track !== undefined){
            part.state = 'changed';
            part.track.needsUpdate = true;
        }
    };


    moveEvents = function(args, part){
        if(args === false){
            return;
        }
        var i, e, newTicks,
            events = args.events,
            ticks = args.config[0];
        //console.log('moveEvents', events, ticks, events.length);
        if(isNaN(ticks)){
            console.warn('Part.moveEvent(s) -> please provide a number');
            return;
        }

        for(i = events.length - 1; i >= 0; i--){
            e = events[i];
            newTicks = e.ticks + ticks;

            if(newTicks < 0){
                newTicks = 0;
            }
            e.ticks = newTicks;

            if(e.state !== 'new'){
                e.state = 'changed';
            }
        }
        part.needsUpdate = true;
        if(part.state !== 'new' && part.track){
            part.state = 'changed';
            part.track.needsUpdate = true;
        }
    };


    removeEvents = function(tobeRemoved, part){
        var i, event,
            removed = [];

        //console.log('removeEvents', tobeRemoved);

        for(i = tobeRemoved.length - 1; i >= 0; i--){
            event = getEvent(tobeRemoved[i], part);
            if(event === false){
                continue;
            }
            //console.log('removing event', e);
            if(event.part !== part){
                console.warn('can\'t remove: this event belongs to part', event.part.id);
                continue;
            }
            event.state = 'removed';
            event.reset();
            removed.push(event);
        }
        if(part.track !== undefined){
            part.track.needsUpdate = true;
        }
        part.needsUpdate = true;
        return removed;
    };


    reverseByPitch = function(part){
        var notes = part.notes,
            min = part.lowestNote,
            max = part.highestNote,
            on, off,
            i, note;

        for(i = notes.length - 1; i >= 0; i--){
            note = notes[i];
            note.setPitch(min + (max - note.number));
            on = note.noteOn;
            off = note.noteOff;
            on.state = 'changed';
            off.state = 'changed';
            note.state = 'changed';
        }
        part.needsUpdate = true;
        if(part.state !== 'new' && part.track){
            part.state = 'changed';
            part.track.needsUpdate = true;
        }
    };


    reverseByTicks = function(part, durationTicks){
        var notes = part.notes,
            note, on, off, onTicks, offTicks, i;

        durationTicks = durationTicks || part.duration.ticks;

        for(i = notes.length - 1; i >= 0; i--){
            note = notes[i];
            on = note.noteOn;
            off = note.noteOff;

            onTicks = durationTicks - off.ticks;
            offTicks = durationTicks - on.ticks;

            on.ticks = onTicks;
            off.ticks = offTicks;
            note.ticks = onTicks;
            //console.log('on', onTicks, 'off', offTicks, note.noteOn.ticks, note.noteOff.ticks);
            on.state = 'changed';
            off.state = 'changed';
            note.state = 'changed';
        }
        part.needsUpdate = true;
        if(part.state !== 'new' && part.track){
            part.state = 'changed';
            part.track.needsUpdate = true;
        }
    };


    Part.prototype.addEvent = Part.prototype.addEvents = function(){//events
        //console.log(arguments);
        var args = getEventsAndConfig(arguments, this);
        //console.log(args.events, args.config);
        addEvents(args, this, false);
    };


    Part.prototype.addEventsRelative = function(){//events
        var args = getEventsAndConfig(arguments, this);
        addEvents(args, this, true);
    };


    Part.prototype.removeEvent = Part.prototype.removeEvents = function(){//events
        var args = getEventsAndConfig(arguments, this);
        if(args === false){
            return false;
        }
        return removeEvents(args.events, this);
    };


    Part.prototype.moveEvent = Part.prototype.moveEvents = function(){//events, ticks
        var args = getEventsAndConfig(arguments, this);
        moveEvents(args, this);
    };


    Part.prototype.moveNote = function(note, ticks){
        moveEvents({events:[note.noteOn, note.noteOff], config:[ticks]}, this);
    };


    Part.prototype.transposeEvents = function(){//events, semi
        var args = getEventsAndConfig(arguments, this);
        transposeEvents(args, this);
    };


    Part.prototype.transposeAllEvents = function(semi){
        //console.log('transposeAllEvents', semi);
        transposeEvents({events:this.events, config:[semi]}, this);
    };


    Part.prototype.transposeNote = function(note, semi){
        //console.log('transposeNote', semi);
        transposeEvents({events:[note.noteOn, note.noteOff], config:[semi]}, this);
    };
/*
    Part.prototype.setNotePitch = function(note, pitch){
        note.setPitch(pitch);
    };
*/

    Part.prototype.reverseByTicks = function(duration){
        if(this.needsUpdate){
            this.update();
        }
        reverseByTicks(this, duration);
    };


    Part.prototype.reverseByPitch = function(){
        if(this.needsUpdate){
            this.update();
        }
        reverseByPitch(this);
    };


    Part.prototype.findEvents = function(pattern){
        return findEvent(this, pattern);
    };


    Part.prototype.findNotes = function(pattern){
        return findNote(this, pattern);
    };


    Part.prototype.getStats = function(pattern){
        return getStats(this, pattern);
    };


    Part.prototype.getIndex = function(){
        var parts, part, i;

        if(this.track){
            parts = this.track.parts;

            for(i = this.track.numParts - 1; i >= 0; i--){
                part = parts[i];
                if(part.id === this.id){
                    return i;
                }
            }
        }
        return -1;
    };


    Part.prototype.copy = function(){
        var part = new Part(copyName(this.name)),
            partTicks = this.ticks,
            eventsById = this.eventsById,
            copies = [],
            copy, id, event;
            //console.log('Part.copy', events);

        part.song = undefined;
        part.track = undefined;
        part.trackId = undefined;

        for(id in eventsById){
            if(eventsById.hasOwnProperty(id)){
                event = eventsById[id];
                copy = event.copy();
                //console.log(copy.ticks, partTicks);
                copy.ticks = copy.ticks - partTicks;
                copies.push(copy);
            }
        }
        part.addEvents(copies);
        return part;
    };

    Part.prototype.setSolo = function(flag){
        if(flag === undefined){
            flag = !this.solo;
        }
        this.mute = false;
        this.solo = flag;
        // stop all sounds here
        this.allNotesOff();
        if(this.track){
            this.track.setPartSolo(this, flag);
        }
        //console.log(this.solo, this.mute);
    };


    Part.prototype.allNotesOff = function(){
        if(this.track === undefined){
            return;
        }
        this.track.instrument.allNotesOffPart(this.id);
    };


    // called by Track if a part gets removed from a track
    Part.prototype.reset = function(fromTrack, fromSong){
        var eventsById = this.eventsById,
            id, event;

        if(fromSong){
            this.song = undefined;
        }
        if(fromTrack){
            this.track = undefined;
        }
        this.trackId = undefined;
        this.start.millis = undefined;
        this.end.millis = undefined;

        for(id in eventsById){
            if(eventsById.hasOwnProperty(id)){
                event = eventsById[id];
                event.ticks -= this.ticks;
                event.reset(false, fromTrack, fromSong);
                //event.state = 'removed';
            }
        }
        this.ticks = 0;
        this.needsUpdate = true;
    };


    Part.prototype.update = function(){
        //console.log('part update');

        var i, maxi, j, maxj, id, event, noteNumber, note, onEvents, onEvent,
            firstEvent, lastEvent, stats,
            noteOnEvents = [],
            notes = [],
            numNotes = 0,
            part = this,
            partId = this.id,
            track = this.track,
            trackId = this.track ? this.track.id : undefined;

        // if(!trackId){
        //     console.log(this, 'does not belong to a track anymore');
        // }

        //console.log('Part.update()', this.state, this.eventsById);

        this.events = [];

        for(id in this.eventsById){
            if(this.eventsById.hasOwnProperty(id)){
                event = this.eventsById[id];
                //console.log(event);
                if(event.state !== 'clean'){
                    //console.log(event.state);
                    this.dirtyEvents[event.id] = event;
                }

                if(event.state !== 'removed'){
                    this.events.push(event);
                }
            }
        }

        this.events.sort(function(a, b){
            return a.sortIndex - b.sortIndex;
        });


        for(i = 0, maxi = this.notes.length; i < maxi; i++){
            note = this.notes[i];
            //console.log(note.noteOn.state);
            if(note.noteOn.state === 'removed' || (note.noteOff !== undefined && note.noteOff.state === 'removed')){
                note.state = 'removed';
                this.dirtyNotes[note.id] = note;
                delete this.notesById[note.id];
            }else if(note.noteOn.state === 'changed' || (note.noteOff !== undefined && note.noteOff.state === 'changed')){
                note.state = 'changed';
                this.dirtyNotes[note.id] = note;
            }
        }

        //console.log('part', this.events.length);

        for(i = 0, maxi = this.events.length; i < maxi; i++){
            event = this.events[i];
            noteNumber = event.noteNumber;

            if(event.type === sequencer.NOTE_ON){
                if(event.midiNote === undefined){

                    /*
                    if(noteOnEvents[noteNumber] === undefined){
                        noteOnEvents[noteNumber] = [];
                    }
                    noteOnEvents[noteNumber].push(event);
                    */


                    //console.log(i, 'NOTE_ON', event.eventNumber, noteNumber, noteOnEvents[noteNumber]);
                    note = createMidiNote(event);
                    note.part = part;
                    note.partId = partId;
                    note.track = track;
                    note.trackId = trackId;
                    note.state = 'new';
                    this.notesById[note.id] = note;
                    this.dirtyNotes[note.id] = note;
                    if(notes[noteNumber] === undefined){
                        notes[noteNumber] = [];
                    }
                    notes[noteNumber].push(note);
                    //console.log('create note:', note.id, 'for:', noteNumber, 'ticks:', event.ticks);
                }
            }else if(event.type === sequencer.NOTE_OFF){
                //console.log(event.midiNote);
                if(event.midiNote === undefined){
                    if(notes[noteNumber] === undefined){
                        //console.log('no note!', noteNumber);
                        continue;
                    }

                    var l = notes[noteNumber].length - 1;
                    note = notes[noteNumber][l];
                    if(note.noteOff !== undefined && note.durationTicks > 0){
                        //console.log('has already a note off event!', noteNumber, note.durationTicks, note.noteOff.ticks, event.ticks);
                        continue;
                    }
/*
                    // get the lastly added note
                    var l = notes[noteNumber].length - 1;
                    var t = 0;
                    note = null;

                    while(t <= l){
                        note = notes[noteNumber][t];
                        if(note.noteOff === undefined){
                            break;
                        }
                        t++
                    }
*/
                    if(note === null){
                        continue;
                    }

                    //console.log('add note off to note:', note.id, 'for:', noteNumber, 'ticks:', event.ticks, 'num note on:', l, 'index:', t);
                    if(note.noteOn === undefined){
                        //console.log('no NOTE ON');
                        continue;
                    }
                    if(note.state !== 'new'){
                        note.state = 'changed';
                    }
                    this.dirtyNotes[note.id] = note;
                    note.addNoteOff(event);


                    /*
                    onEvents = noteOnEvents[noteNumber];
                    if(onEvents){
                        onEvent = onEvents.shift();
                        //console.log(note.midiNote);
                        if(onEvent && onEvent.midiNote){
                            note = onEvent.midiNote;
                            if(note.state !== 'new'){
                                note.state = 'changed';
                            }
                            this.dirtyNotes[note.id] = note;
                            if(event.ticks - note.noteOn.ticks === 0){
                                console.log(note.noteOn.ticks, event.ticks);
                                note.adjusted = true;
                                //event.ticks += 120;
                            }
                            note.addNoteOff(event);
                            //console.log(i, 'NOTE_OFF', event.midiNote);
                        }
                    }else{
                        maxj = this.notes.length;
                        for(j = maxj - 1; j >= 0; j--){
                            note = this.notes[j];
                            if(note.number === event.noteNumber){
                                note.state = 'changed';
                                note.addNoteOff(event);
                                this.dirtyNotes[note.id] = note;
                                //console.log(note.id);
                                break;
                            }
                        }
                    }
                    */

                }else if(this.notesById[event.midiNote.id] === undefined){
                    //console.log('not here');
                    // note is recorded and has already a duration
                    note = event.midiNote;
                    //console.log('recorded notes', note.id);
                    //note.state = 'new';
                    note.part = part;
                    note.partId = partId;
                    note.track = track;
                    note.trackId = trackId;
                    //this.dirtyNotes[note.id] = note;
                    this.notesById[note.id] = note;
                }else{
                    //console.log('certainly not here');
                }
            }
        }

        this.notes = [];
        notes = null;
        for(id in this.notesById){
            if(this.notesById.hasOwnProperty(id)){
                note = this.notesById[id];
                this.notes.push(note);
            }
        }

        this.notes.sort(function(a, b){
            return a.ticks - b.ticks;
        });

        this.numEvents = this.events.length;
        this.numNotes = this.notes.length;

        //console.log(this.numEvents, this.numNotes);

        firstEvent = this.events[0];
        lastEvent = this.events[this.numEvents - 1];

        //console.log(firstEvent.ticks, lastEvent.ticks);

        if(firstEvent){
            if(firstEvent.ticks < this.ticks){
                this.autoSize = 'both';
            }

            switch(this.autoSize){
                case 'right':
                    this.start.ticks = this.ticks;
                    this.end.ticks = lastEvent.ticks;
                    this.duration.ticks = lastEvent.ticks - this.start.ticks;
                    break;
                case 'both':
                    this.start.ticks = firstEvent.ticks;
                    this.end.ticks = lastEvent.ticks;
                    this.duration.ticks = lastEvent.ticks - firstEvent.ticks;
                    break;
            }
        }else{
            // fixing issue #6
            this.start.ticks = this.ticks;
            this.end.ticks = this.ticks + 100; // give the part a minimal duration of 100 ticks
            this.duration.ticks = 100;
        }

        stats = this.getStats('noteNumber all');
        this.lowestNote = stats.min;
        this.highestNote = stats.max;

        this.ticks = this.start.ticks;

        if(this.state === 'clean'){
            //@TODO: check if this is the preferred way of doing it after all, add: part.track.needsUpdate = true;
            //console.log('part sets its own status in update() -> this shouldn\'t happen');
            this.state = 'changed';
        }

        this.needsUpdate = false;
    };

    sequencer.createPart = function(){
        return new Part();
    };


    sequencer.protectedScope.addInitMethod(function(){

        createMidiNote = sequencer.createMidiNote;
        createMidiEvent = sequencer.createMidiEvent;

        copyName = sequencer.protectedScope.copyName;
        typeString = sequencer.protectedScope.typeString;

        findEvent = sequencer.findEvent;
        findNote = sequencer.findNote;
        getStats = sequencer.getStats;
    });

}());(function(){

    'use strict';
    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        instanceId = 0,
        range = 10,

        debug,

        Playhead,

        //import
        getPosition2, // → defined in position.js
        objectForEach; // → defined in util.js


    Playhead = function(song, type, name, data){
        this.id = 'POS' + instanceId++ + '' + new Date().getTime();
        //console.log(name);
        this.song = song;
        this.type = type || '';
        this.name = name || this.id;
        this.data = data || {};
        this.lastEvent = undefined;

        this.activeParts = [];
        this.activeNotes = [];
        this.activeEvents = [];
    };


    Playhead.prototype.set = function(u, v){
        //console.log(this.name, 'set', u, v);
        this.unit = u;
        this.currentValue = v;
        this.eventIndex = 0;
        this.noteIndex = 0;
        this.partIndex = 0;
        this.calculate();
        return this.data;
    };


    Playhead.prototype.get = function(){
        return this.data;
    };


    Playhead.prototype.update = function(u, diff){
        //console.log(this.name, 'update', u, diff);
        if(diff === 0){
            return this.data;
        }
        this.unit = u;
        this.currentValue += diff;
        this.calculate();
        return this.data;
    };


    Playhead.prototype.updateSong = function(){
        this.events = this.song.eventsMidiTime;
        this.numEvents = this.events.length;
        this.notes = this.song.notes;
        this.numNotes = this.song.numNotes;
        this.parts = this.song.parts;
        this.numParts = this.song.numParts;

        this.set('millis', this.song.millis || 0);
    };


    Playhead.prototype.setType = function(t){
        this.type = t;
        this.set(this.unit, this.currentValue);
        //console.log(type,activeParts);
    };


    Playhead.prototype.addType = function(t){
        this.type += ' ' + t;
        this.set(this.unit, this.currentValue);
        //console.log(type,activeParts);
    };


    Playhead.prototype.removeType = function(t){
        var arr = this.type.split(' ');
        this.type = '';
        arr.forEach(function(type){
            if(type !== t){
                this.type += t + ' ';
            }
        });
        this.type.trim();
        this.set(this.currentValue);
        //console.log(type,activeParts);
    };


    Playhead.prototype.calculate = function(){
        var
            i,
            event,
            note,
            part,
            position,
            newParts = [],
            stillActiveNotes = [],
            stillActiveEvents = [],
            collectedParts = [],
            collectedNotes = [],
            collectedEvents = [];

        for(i = this.eventIndex; i < this.numEvents; i++){
            event = this.events[i];
            //console.log(event);
            //event.mute = event.mute || event.part.mute || event.track.mute;
            if(event[this.unit] <= this.currentValue){
                //console.log(event[this.unit], this.currentValue, event.type)
                //if(event.mute === false && event.type !== sequencer.MIDI_NOTE && event.type !== sequencer.DUMMY_EVENT){
                if(event.type !== sequencer.MIDI_NOTE && event.type !== sequencer.DUMMY_EVENT){
                    //console.log(event.mute, event.part.mute, event.track.mute);
                    collectedEvents.push(event);
                }
                this.lastEvent = event;
                this.eventIndex++;
            }else{
                break;
            }
        }

        // if a song has no events yet, use the first time event as reference
        if(this.lastEvent === undefined){
            this.lastEvent = this.song.timeEvents[0];
        }

        position = getPosition2(this.song, this.unit, this.currentValue, 'all', this.lastEvent);
        this.data.eventIndex = this.eventIndex;
        this.data.millis = position.millis;
        this.data.ticks = position.ticks;

        //console.log('millis:', position.millis, 'ticks:', position.ticks, this.unit, ':', this.currentValue);
        // if(this.name === 'iterators'){
        //     console.log('nominator:', position.nominator, 'ticks:', position.ticks, this.unit, ':', this.currentValue);
        // }

        if(this.type.indexOf('all') !== -1){
            var data = this.data;
            objectForEach(position, function(value, key){
                data[key] = value;
            });
        }else if(this.type.indexOf('barsbeats') !== -1){
            this.data.bar = position.bar;
            this.data.beat = position.beat;
            this.data.sixteenth = position.sixteenth;
            this.data.tick = position.tick;
            this.data.barsAsString = position.barsAsString;

            this.data.ticksPerBar = position.ticksPerBar;
            this.data.ticksPerBeat = position.ticksPerBeat;
            this.data.ticksPerSixteenth = position.ticksPerSixteenth;
            this.data.numSixteenth = position.numSixteenth;
        }else if(this.type.indexOf('time') !== -1){
            this.data.hour = position.hour;
            this.data.minute = position.minute;
            this.data.second = position.second;
            this.data.millisecond = position.millisecond;
            this.data.timeAsString = position.timeAsString;
        }else if(this.type.indexOf('percentage') !== -1){
            this.data.percentage = position.percentage;
        }

        if(this.type.indexOf('events') !== -1 || this.type.indexOf('all') !== -1){

            this.collectedEvents = collectedEvents;

            for(i = this.activeEvents.length - 1; i >= 0; i--){
                event = this.activeEvents[i];

                // skip the tempo and time signature events
                if(event.type === 0x51 || event.type === 0x58){
                    continue;
                }
                //event.mute = event.mute || event.part.mute || event.track.mute;
                /*
                if(event.mute === true){
                    //console.log('skipping muted event', event.id);
                    continue;
                }
                */
                if(event.state.indexOf('removed') === 0 || this.song.eventsById[event.id] === undefined){
                    //console.log('skipping removed event', event.id);
                    continue;
                }

                if(event[this.unit] <= this.currentValue && event[this.unit] > this.currentValue - range){
                    stillActiveEvents.push(event);
                }
            }

            this.activeEvents = [].concat(stillActiveEvents);

            // find and add new active events
            for(i = collectedEvents.length - 1; i >= 0; i--){
                event = collectedEvents[i];
                //console.log(event.mute);
                if(event[this.unit] > this.currentValue - range){
                    this.activeEvents.push(event);
                }
            }

            this.song.activeEvents = {};

            for(i = this.activeEvents.length - 1; i >= 0; i--){
                event = this.activeEvents[i];
                //console.log('active', event);
                this.song.activeEvents[event.id] = event;
            }
        }


        if(this.type.indexOf('notes') !== -1 || this.type.indexOf('all') !== -1){

            // get all events between the noteIndex and the current playhead position
            for(i = this.noteIndex; i < this.numNotes; i++){
                note = this.notes[i];
                if(note.noteOn[this.unit] <= this.currentValue){
                    //note.mute = note.noteOn.mute || note.noteOff.mute;
                    //if(note.mute === false){
                        collectedNotes.push(note);
                    //}
                    this.noteIndex++;
                }else{
                    break;
                }
            }


            // filter notes that are no longer active
            for(i = this.activeNotes.length - 1; i >= 0; i--){
                note = this.activeNotes[i];
                //note.mute = note.noteOn.mute || note.noteOff.mute;
                //if(note.mute){
                //    continue;
                //}
                if(note.noteOn.state.indexOf('removed') === 0 || this.song.notesById[note.id] === undefined){
                    //console.log('skipping removed note', note.id);
                    continue;
                }

                if(note.noteOff === undefined){
                    if(sequencer.debug){
                        console.warn('note with id', note.id, 'has no noteOff event', note.noteOn.track.name);
                    }
                    continue;
                }

                if(note.noteOn[this.unit] <= this.currentValue && note.noteOff[this.unit] > this.currentValue){
                    //note.active = true;
                    stillActiveNotes.push(note);
                }else{
                    //note.active = false;

                    //@TODO: do something here to unschedule notes
                }
            }


            // add the still active notes back to the active notes array
            this.activeNotes = [].concat(stillActiveNotes);


            // find and add new active notes
            for(i = collectedNotes.length - 1; i >= 0; i--){
                note = collectedNotes[i];

                if(note.noteOff === undefined){
                    if(sequencer.debug){
                        console.warn('note with id', note.id, 'has no noteOff event', note.noteOn.track.name);
                    }
                    continue;
                }

                if(note.noteOff[this.unit] > this.currentValue){
                    this.activeNotes.push(note);
                    //note.active = true;
                }else{
                    //note.active = false;
                }
            }

            this.song.activeNotes = {};

            for(i = this.activeNotes.length - 1; i >= 0; i--){
                note = this.activeNotes[i];
                //console.log('active', note);
                this.song.activeNotes[note.id] = note;
            }
        }



        // get active parts
        if(this.type.indexOf('parts') !== -1 || this.type.indexOf('all') !== -1){


            for(i = this.partIndex; i < this.numParts; i++){
                part = this.parts[i];
                //console.log(part, this.unit, this.currentValue);
                if(part.start[this.unit] <= this.currentValue){// && part.end[this.unit] > this.currentValue){
                    //part.mute = part.mute || part.track.mute;
                    //if(part.mute === false){
                        collectedParts.push(part);
                    //}
                    this.partIndex++;
                }else{
                    break;
                }
            }

            // filter existing active parts
            for(i = this.activeParts.length - 1; i >= 0; i--){
                part = this.activeParts[i];
                //part.mute = part.mute || part.track.mute;
                //if(part.mute){
                //    continue;
                //}
                if(part.start[this.unit] <= this.currentValue && part.end[this.unit] > this.currentValue){
                    newParts.push(part);
                }
            }

            this.activeParts = [].concat(newParts);

            for(i = collectedParts.length - 1; i >= 0; i--){
                part = collectedParts[i];
                if(part.end[this.unit] > this.currentValue){
                    this.activeParts.push(part);
                }
            }

            this.song.activeParts = {};
            for(i = this.activeParts.length - 1; i >= 0; i--){
                part = this.activeParts[i];
                //console.log('active part', part);
                this.song.activeParts[part.id] = part;
            }
        }

        if(this.busy === true){
            this.busy = false;
        }
    };


    sequencer.protectedScope.createPlayhead = function(song, type, name, data){
        return new Playhead(song, type, name, data);
    };


    sequencer.protectedScope.addInitMethod(function(){
        getPosition2 = sequencer.protectedScope.getPosition2;
        objectForEach = sequencer.protectedScope.objectForEach;
        debug = sequencer.debug;
    });

}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //import
        round, // → defined in util.js
        floor, // → defined in util.js
        typeString, // → defined in util.js

        supportedTypes = 'barsandbeats barsbeats time millis ticks perc percentage',
        supportedReturnTypes = 'barsandbeats barsbeats time millis ticks all',

        //local
        bpm,
        nominator,
        denominator,

        ticksPerBeat,
        ticksPerBar,
        ticksPerSixteenth,

        millisPerTick,
        secondsPerTick,
        numSixteenth,

        ticks,
        millis,
        diffTicks,
        diffMillis,

        bar,
        beat,
        sixteenth,
        tick,

        type,
        index,
        returnType = 'all',
        beyondEndOfSong = true,

        //public (song)
        millisToTicks,
        ticksToMillis,
        barsToMillis,
        barsToTicks,
        ticksToBars,
        millisToBars,

        //private
        checkBarsAndBeats,
        getDataFromEvent,
        getPositionData,
        calculateBarsAndBeats,

        //protected
        getPosition,
        checkPosition,
        fromMillis,
        fromTicks,
        fromBars;


    function getTimeEvent(song, unit, target){
        // finds the time event that comes the closest before the target position
        var timeEvents = song.timeEvents,
            i, event;

        for(i = timeEvents.length - 1; i >= 0; i--){
            event = timeEvents[i];
            if(event[unit] <= target){
                index = i;
                return event;
            }
        }
    }


    millisToTicks = function(song, targetMillis, beos){
        beyondEndOfSong = beos === undefined ? true : false;
        fromMillis(song, targetMillis);
        //return round(ticks);
        return ticks;
    };


    ticksToMillis = function(song, targetTicks, beos){
        beyondEndOfSong = beos === undefined ? true : false;
        fromTicks(song, targetTicks);
        return millis;
    };


    barsToMillis = function(song, position, beos){ // beos = beyondEndOfSong
        position = ['barsbeats'].concat(position);
        getPosition(song, position, 'millis', beos);
        return millis;
    };


    barsToTicks = function(song, position, beos){ // beos = beyondEndOfSong
        position = ['barsbeats'].concat(position);
        getPosition(song, position, 'ticks', beos);
        //return round(ticks);
        return ticks;
    };


    ticksToBars = function(song, ticks, beos){
        beyondEndOfSong = beos === undefined ? true : false;
        fromTicks(song, ticks);
        calculateBarsAndBeats();
        returnType = 'barsandbeats';
        return getPositionData();
    };


    millisToBars = function(song, millis, beos){
        beyondEndOfSong = beos === undefined ? true : false;
        fromMillis(song, millis);
        calculateBarsAndBeats();
        returnType = 'barsandbeats';
        return getPositionData();
    };


    fromMillis = function(song, targetMillis, event){
        var lastEvent = song.lastEvent;

        if(beyondEndOfSong === false){
            if(targetMillis > lastEvent.millis){
                targetMillis = lastEvent.millis;
            }
        }

        if(event === undefined){
            event = getTimeEvent(song, 'millis', targetMillis);
        }
        getDataFromEvent(event);

        // if the event is not exactly at target millis, calculate the diff
        if(event.millis === targetMillis){
            diffMillis = 0;
            diffTicks = 0;
        }else{
            diffMillis = targetMillis - event.millis;
            diffTicks = diffMillis/millisPerTick;
        }

        millis += diffMillis;
        ticks += diffTicks;

        return ticks;
    };


    fromTicks = function(song, targetTicks, event){
        var lastEvent = song.lastEvent;

        if(beyondEndOfSong === false){
            if(targetTicks > lastEvent.ticks){
                targetTicks = lastEvent.ticks;
            }
        }

        if(event === undefined){
            event = getTimeEvent(song, 'ticks', targetTicks);
        }
        getDataFromEvent(event);

        // if the event is not exactly at target ticks, calculate the diff
        if(event.ticks === targetTicks){
            diffTicks = 0;
            diffMillis = 0;
        }else{
            diffTicks = targetTicks - ticks;
            diffMillis = diffTicks * millisPerTick;
        }

        ticks += diffTicks;
        millis += diffMillis;

        return millis;
    };


    fromBars = function(song, targetBar, targetBeat, targetSixteenth, targetTick, event){
        //console.time('fromBars');
        var i = 0,
            diffBars,
            diffBeats,
            diffSixteenth,
            diffTick,
            lastEvent = song.lastEvent;

        if(beyondEndOfSong === false){
            if(targetBar > lastEvent.bar){
                targetBar = lastEvent.bar;
            }
        }

        targetBar = checkBarsAndBeats(targetBar);
        targetBeat = checkBarsAndBeats(targetBeat);
        targetSixteenth = checkBarsAndBeats(targetSixteenth);
        targetTick = checkBarsAndBeats(targetTick,true);

        if(event === undefined){
            event = getTimeEvent(song, 'bar', targetBar);
        }
        getDataFromEvent(event);

        //correct wrong position data, for instance: '3,3,2,788' becomes '3,4,4,068' in a 4/4 measure at PPQ 480
        while(targetTick >= ticksPerSixteenth){
            targetSixteenth++;
            targetTick -= ticksPerSixteenth;
        }

        while(targetSixteenth > numSixteenth){
            targetBeat++;
            targetSixteenth -= numSixteenth;
        }

        while(targetBeat > nominator){
            targetBar++;
            targetBeat -= nominator;
        }

        event = getTimeEvent(song, 'bar', targetBar, index);
        for(i = index; i >= 0; i--){
            event = song.timeEvents[i];
            if(event.bar <= targetBar){
                getDataFromEvent(event);
                break;
            }
        }

        // get the differences
        diffTick = targetTick - tick;
        diffSixteenth = targetSixteenth - sixteenth;
        diffBeats = targetBeat - beat;
        diffBars = targetBar - bar; //bar is always less then or equal to targetBar, so diffBars is always >= 0

        //console.log('diff',diffBars,diffBeats,diffSixteenth,diffTick);
        //console.log('millis',millis,ticksPerBar,ticksPerBeat,ticksPerSixteenth,millisPerTick);

        // convert differences to milliseconds and ticks
        diffMillis = (diffBars * ticksPerBar) * millisPerTick;
        diffMillis += (diffBeats * ticksPerBeat) * millisPerTick;
        diffMillis += (diffSixteenth * ticksPerSixteenth) * millisPerTick;
        diffMillis += diffTick * millisPerTick;
        diffTicks = diffMillis/millisPerTick;
        //console.log(diffBars, ticksPerBar, millisPerTick, diffMillis, diffTicks);

        // set all current position data
        bar = targetBar;
        beat = targetBeat;
        sixteenth = targetSixteenth;
        tick = targetTick;
        //console.log(tick, targetTick)

        millis += diffMillis;
        //console.log(targetBar, targetBeat, targetSixteenth, targetTick, ' -> ', millis);
        ticks += diffTicks;

        //console.timeEnd('fromBars');
    };


    calculateBarsAndBeats = function(){
        // spread the difference in tick over bars, beats and sixteenth
        var tmp = round(diffTicks);
        while(tmp >= ticksPerSixteenth){
            sixteenth++;
            tmp -= ticksPerSixteenth;
            while(sixteenth > numSixteenth){
                sixteenth -= numSixteenth;
                beat++;
                while(beat > nominator){
                    beat -= nominator;
                    bar++;
                }
            }
        }
        tick = round(tmp);
    };


    getDataFromEvent = function(event){

        bpm = event.bpm;
        nominator = event.nominator;
        denominator = event.denominator;

        ticksPerBar = event.ticksPerBar;
        ticksPerBeat = event.ticksPerBeat;
        ticksPerSixteenth = event.ticksPerSixteenth;
        numSixteenth = event.numSixteenth;
        millisPerTick = event.millisPerTick;
        secondsPerTick = event.secondsPerTick;

        bar = event.bar;
        beat = event.beat;
        sixteenth = event.sixteenth;
        tick = event.tick;

        ticks = event.ticks;
        millis = event.millis;

        //console.log(bpm, event.type);
        //console.log('ticks', ticks, 'millis', millis, 'bar', bar);
    };


    getPositionData = function(song){
        var timeData,
            tickAsString,
            positionData = {};

        switch(returnType){

            case 'millis':
                //positionData.millis = millis;
                positionData.millis = round(millis * 1000)/1000;
                positionData.millisRounded = round(millis);
                break;

            case 'ticks':
                //positionData.ticks = ticks;
                positionData.ticks = round(ticks);
                //positionData.ticksUnrounded = ticks;
                break;

            case 'barsbeats':
            case 'barsandbeats':
                positionData.bar = bar;
                positionData.beat = beat;
                positionData.sixteenth = sixteenth;
                positionData.tick = tick;
                tickAsString = tick === 0 ? '000' : tick < 10 ? '00' + tick : tick < 100 ? '0' + tick : tick;
                //positionData.barsAsString = (bar + 1) + ':' + (beat + 1) + ':' + (sixteenth + 1) + ':' + tickAsString;
                positionData.barsAsString = bar + ':' + beat + ':' + sixteenth + ':' + tickAsString;
                break;

            case 'time':
                timeData = sequencer.getNiceTime(millis);
                positionData.hour = timeData.hour;
                positionData.minute = timeData.minute;
                positionData.second = timeData.second;
                positionData.millisecond = timeData.millisecond;
                positionData.timeAsString = timeData.timeAsString;
                break;

            case 'all':
                // millis
                //positionData.millis = millis;
                positionData.millis = round(millis * 1000)/1000;
                positionData.millisRounded = round(millis);

                // ticks
                //positionData.ticks = ticks;
                positionData.ticks = round(ticks);
                //positionData.ticksUnrounded = ticks;

                // barsbeats
                positionData.bar = bar;
                positionData.beat = beat;
                positionData.sixteenth = sixteenth;
                positionData.tick = tick;
                tickAsString = tick === 0 ? '000' : tick < 10 ? '00' + tick : tick < 100 ? '0' + tick : tick;
                //positionData.barsAsString = (bar + 1) + ':' + (beat + 1) + ':' + (sixteenth + 1) + ':' + tickAsString;
                positionData.barsAsString = bar + ':' + beat + ':' + sixteenth + ':' + tickAsString;

                // time
                timeData = sequencer.getNiceTime(millis);
                positionData.hour = timeData.hour;
                positionData.minute = timeData.minute;
                positionData.second = timeData.second;
                positionData.millisecond = timeData.millisecond;
                positionData.timeAsString = timeData.timeAsString;

                // extra data
                positionData.bpm = round(bpm * song.playbackSpeed, 3);
                positionData.nominator = nominator;
                positionData.denominator = denominator;

                positionData.ticksPerBar = ticksPerBar;
                positionData.ticksPerBeat = ticksPerBeat;
                positionData.ticksPerSixteenth = ticksPerSixteenth;

                positionData.numSixteenth = numSixteenth;
                positionData.millisPerTick = millisPerTick;
                positionData.secondsPerTick = secondsPerTick;

                // use ticks to make tempo changes visible by a faster moving playhead
                positionData.percentage = ticks / song.durationTicks;
                //positionData.percentage = millis / song.durationMillis;
                break;
        }

        return positionData;
    };


    checkBarsAndBeats = function(value, isTick){
        value = isNaN(value) ? isTick ? 0 : 1 : value;
        value = round(value);
        //value = value > maxValue ? maxValue : value;
        if(isTick){
            value = value < 0 ? 0 : value;
        }else{
            value = value < 1 ? 1 : value;
        }
        return value;
    };


    //@param: 'millis', 1000, [true]
    //@param: 'ticks', 1000, [true]
    //@param: 'barsandbeats', 1, ['all', true]
    //@param: 'barsandbeats', 60, 4, 3, 120, ['all', true]
    //@param: 'barsandbeats', 60, 4, 3, 120, [true, 'all']

    checkPosition = function(args){
        returnType = 'all';
        beyondEndOfSong = true;
        //console.log('----> checkPosition:', args);

        if(typeString(args) === 'array'){
            var
                numArgs = args.length,
                position,
                i, a, positionLength;

            type = args[0];

            // support for [['millis', 3000]]
            if(typeString(args[0]) === 'array'){
                //console.warn('this shouldn\'t happen!');
                args = args[0];
                type = args[0];
                numArgs = args.length;
            }

            position = [type];

            //console.log('check position', args, numArgs);

            //console.log('arg', 0, '->', type);

            if(supportedTypes.indexOf(type) !== -1){
                for(i = 1; i < numArgs; i++){
                    a = args[i];
                    //console.log('arg', i, '->', a);
                    if(a === true || a === false){
                        beyondEndOfSong = a;
                    }else if(isNaN(a)){
                        if(supportedReturnTypes.indexOf(a) !== -1){
                            returnType = a;
                        }else{
                            return false;
                        }
                    }else {
                        position.push(a);
                    }
                }
                //check number of arguments -> either 1 number or 4 numbers in position, e.g. ['barsbeats', 1] or ['barsbeats', 1, 1, 1, 0],
                // or ['perc', 0.56, numberOfTicksToSnapTo]
                positionLength = position.length;
                if(positionLength !== 2 && positionLength !== 3 && positionLength !== 5){
                    return false;
                }
                //console.log(position, returnType, beyondEndOfSong);
                //console.log('------------------------------------')
                return position;
            }
        }
        return false;
    };

    function getPosition2(song, unit, target, type, event){
        if(unit === 'millis'){
            fromMillis(song, target, event);
        }else if(unit === 'ticks'){
            fromTicks(song, target, event);
        }
        if(type === 'all'){
            calculateBarsAndBeats();
        }
        return getPositionData(song);
    }

    getPosition = function(song, args){
        //console.log('getPosition', args);

        var position = checkPosition(args),
            millis, tmp, snap;

        if(position === false){
            console.error('wrong position data');
            return false;
        }

        switch(type){

            case 'barsbeats':
            case 'barsandbeats':
                fromBars(song, position[1], position[2], position[3], position[4]);
                return getPositionData(song);

            case 'time':
                // calculate millis out of time array: hours, minutes, seconds, millis
                millis = 0;
                tmp = position[1] || 0;
                millis += tmp * 60 * 60 * 1000; //hours
                tmp = position[2] || 0;
                millis += tmp * 60 * 1000; //minutes
                tmp = position[3] || 0;
                millis += tmp * 1000; //seconds
                tmp = position[4] || 0;
                millis += tmp; //milliseconds

                fromMillis(song, millis);
                calculateBarsAndBeats();
                return getPositionData(song);

            case 'millis':
                fromMillis(song, position[1]);
                calculateBarsAndBeats();
                return getPositionData(song);

            case 'ticks':
                fromTicks(song, position[1]);
                calculateBarsAndBeats();
                return getPositionData(song);

            case 'perc':
            case 'percentage':
                snap = position[2];

                //millis = position[1] * song.durationMillis;
                //fromMillis(song, millis);
                //console.log(millis);

                ticks = position[1] * song.durationTicks;
                if(snap !== undefined){
                    ticks = floor(ticks/snap) * snap;
                    //fromTicks(song, ticks);
                    //console.log(ticks);
                }
                fromTicks(song, ticks);
                calculateBarsAndBeats();
                tmp = getPositionData(song);
                //console.log('diff', position[1] - tmp.percentage);
                return tmp;
        }
        return false;
    };


    sequencer.protectedScope.getPosition = getPosition;
    sequencer.protectedScope.getPosition2 = getPosition2;
    sequencer.protectedScope.checkPosition = checkPosition;

    sequencer.protectedScope.millisToTicks = millisToTicks;
    sequencer.protectedScope.ticksToMillis = ticksToMillis;
    sequencer.protectedScope.ticksToBars = ticksToBars;
    sequencer.protectedScope.millisToBars = millisToBars;
    sequencer.protectedScope.barsToTicks = barsToTicks;
    sequencer.protectedScope.barsToMillis = barsToMillis;

    sequencer.protectedScope.addInitMethod(function(){
        round = sequencer.protectedScope.round;
        floor = sequencer.protectedScope.floor;
        typeString = sequencer.protectedScope.typeString;
    });
}());
(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //import
        context, // defined in open_module.js
        timedTasks, // defined in open_module.js
        legacy, // defined in open_module.js
        typeString, // defined in util.js
        getSampleId, // defined in open_module.js
        createPanner, // defined in effects.js
        getEqualPowerCurve, // defined in util.js

        //private
        stopSample,
        fadeOut,

        SampleSynth,
        SampleRelease,
        SampleSustainRelease,
        SampleReleasePanning,
        SampleSustainReleasePanning,


    Sample = function(config){
        this.id = getSampleId();
        this.output = context.createGainNode();
        this.output.connect(config.track.input);
        this.buffer = config.buffer;
        if(this.buffer){
            this.duration = this.buffer.duration;
        }
        this.noteNumber = config.noteNumber;
        this.stopCallback = function(){};
        this.track = config.track;
        //console.log(this.buffer, this.noteNumber)
    };


    stopSample = function(sample, time){
        sample.source.onended = function(){
            sample.stopCallback(sample);
        };
        time = time || 0;
        try{
            sample.source.stop(time);
        }catch(e){
            console.log(e);
        }
    };


    fadeOut = function(sample){
        var now = context.currentTime,
            values,
            i, maxi;

        //console.log(sample.releaseEnvelope);
        switch(sample.releaseEnvelope){

            case 'linear':
                sample.output.gain.linearRampToValueAtTime(sample.volume, now);
                sample.output.gain.linearRampToValueAtTime(0, now + sample.releaseDuration);
                break;

            case 'equal power':
                values = getEqualPowerCurve(100, 'fadeOut', sample.volume);
                sample.output.gain.setValueCurveAtTime(values, now, sample.releaseDuration);
                break;

            case 'array':
                maxi = sample.releaseEnvelopeArray.length;
                values = new Float32Array(maxi);
                for(i = 0; i < maxi; i++){
                    values[i] = sample.releaseEnvelopeArray[i] * sample.volume;
                }
                sample.output.gain.setValueCurveAtTime(values, now, sample.releaseDuration);
                break;
        }
    };


    Sample.prototype.addData = function(obj){
        this.sourceId = obj.sourceId;
        this.noteName = obj.noteName;
        this.midiNote = obj.midiNote;
    };

    Sample.prototype.createSource = function(){
        // overrule to do or add other stuff
        this.source = context.createBufferSource();
        this.source.buffer = this.buffer;
    };

    Sample.prototype.route = function(){
        // overrule to do or add other stuff
        this.source.connect(this.output);
    };


    // called on a NOTE ON event
    Sample.prototype.start = function(event){
        //console.log('NOTE ON', event.velocity, legacy);
        if(this.source !== undefined){
            console.error('this should never happen');
            return;
        }

        this.volume = event.velocity/127;
        this.output.gain.value = this.volume;

        this.createSource();
        this.phase = 'decay'; // -> naming of phases is not completely correct, we skip attack
        this.route();

        if(legacy === true){
            this.source.start = this.source.noteOn;
            this.source.stop = this.source.noteOff;
        }

        try{
            // if(event.offset !== undefined){
            //     console.log(event.offset);
            // }
            this.source.start(event.time, event.offset || 0, event.duration || this.duration);
            //alert(event.offset + ':' + event.duration);
            //this.source.start(event.time, 0, 0);
            //this.source.start(event.time);
            //console.log('start', event.time, event.offset, event.duration, sequencer.getTime());
            //console.log('start', time, sequencer.getTime());
        }catch(e){
            console.warn(e);
        }
    };


    // called on a NOTE OFF event
    Sample.prototype.stop = function(seconds, cb){
        //console.log('NOTE OFF', cb);
        //console.log('NOTE OFF', this.source);
        //console.log('NOTE OFF', this.release);
        if(this.source === undefined){
            if(sequencer.debug){
                console.log('Sample.stop() source is undefined');
            }
            return;
        }

        // this happens when midi events are sent live from a midi device
        if(seconds === 0 || seconds === undefined){
            //console.log('seconds is undefined!');
            seconds = sequencer.getTime();
        }
        this.stopCallback = cb || function(){};

        if(this.release){
            this.source.loop = false;
            this.startReleasePhase = seconds;
            this.stopTime = seconds + this.releaseDuration;
            //console.log(this.stopTime, seconds, this.releaseDuration);
        }else{
            stopSample(this, seconds);
        }
    };


    Sample.prototype.unschedule = function(when, cb){
        var now = context.currentTime,
            sample = this,
            fadeOut = when === null ? 100 : when;//milliseconds

        this.source.onended = undefined;
        this.output.gain.cancelScheduledValues(now);
        //console.log(this.volume, now);
        //this.output.gain.linearRampToValueAtTime(this.volume, now);

        try{
            this.output.gain.linearRampToValueAtTime(0, now + fadeOut/1000); // fade out in seconds

            timedTasks['unschedule_' + this.id] = {
                time: now + fadeOut/1000,
                execute: function(){
                    if(!sample){
                        console.log('sample is gone');
                        return;
                    }
                    if(sample.panner){
                        sample.panner.node.disconnect(0);
                    }
                    if(sample.source !== undefined){
                        sample.source.disconnect(0);
                        sample.source = undefined;
                    }
                    if(cb){
                        cb(sample);
                    }
                }
            };
        }catch(e){
            // firefox gives sometimes an error "SyntaxError: An invalid or illegal string was specified"
            console.log(e);
        }

    };


    // called every frame
    Sample.prototype.update = function(value){
        var doLog = this.track.name === 'Sonata # 3' && this.track.song.bar >= 6 && this.track.song.bar <= 10;
        //var doLog = true;
        //console.log('update', this.phase);
        if(this.autopan){
            this.panner.setPosition(value);
        }

        if(this.startReleasePhase !== undefined && context.currentTime >= this.startReleasePhase && this.phase === 'decay'){
            if(doLog === true){
                console.log(this.phase, '-> release', this.releaseDuration);
            }
            this.phase = 'release';
            fadeOut(this);
        }else if(this.stopTime !== undefined && context.currentTime >= this.stopTime && this.phase === 'release'){
            if(doLog === true){
                console.log(this.phase, '-> stopped', this.stopTime, context.currentTime);
            }
            this.phase = 'stopped';
            stopSample(this);
        }
    };


    sequencer.createSample = function(config){
        var debug = false;
        //return new Sample(config);
        //console.log(config.release_duration);
        if(debug)console.log(config);

        if(config.oscillator){
            if(debug)console.log('synth');
            return new SampleSynth(config);

        }else if(config.sustain && config.release && config.panning){
            if(debug)console.log('sustain, release, panning');
            return new SampleSustainReleasePanning(config);

        }else if(config.release && config.panning){
            if(debug)console.log('release, panning');
            return new SampleReleasePanning(config);

        }else if(config.release && config.sustain){
            if(debug)console.log('release, sustain');
            return new SampleSustainRelease(config);

        }else if(config.release){
            if(debug)console.log('release');
            return new SampleRelease(config);

        }else{
            if(debug)console.log('simple');
            return new Sample(config);
        }
    };


    sequencer.protectedScope.addInitMethod(function(){
        var createClass = sequencer.protectedScope.createClass;

        context = sequencer.protectedScope.context;
        timedTasks = sequencer.protectedScope.timedTasks;
        getEqualPowerCurve = sequencer.util.getEqualPowerCurve;
        legacy = sequencer.legacy;
        getSampleId = sequencer.protectedScope.getSampleId;
        typeString = sequencer.protectedScope.typeString;
        createPanner = sequencer.createPanner;


        SampleRelease = createClass(Sample, function(config){
            this.release = true;

            this.releaseDuration = config.release_duration/1000;
            this.releaseEnvelope = config.release_envelope;
            //console.log(this.releaseDuration, this.releaseEnvelope);
        });


        SampleSustainRelease = createClass(Sample, function(config){
            this.release = true;

            this.sustainStart = config.sustain_start/1000;
            this.sustainEnd = config.sustain_end/1000;
            this.releaseDuration = config.release_duration/1000;
            this.releaseEnvelope = config.release_envelope;
            if(this.releaseEnvelope === undefined){
                this.releaseEnvelope = 'equal power';
            }else if(typeString(this.releaseEnvelope) === 'array'){
                this.releaseEnvelopeArray = config.release_envelope_array;
                this.releaseEnvelope = 'array';
            }
        });

        SampleSustainRelease.prototype.route = function(){
            this.source.loop = true;
            this.source.loopStart = this.sustainStart;
            this.source.loopEnd = this.sustainEnd;
            this.source.connect(this.output);
            //console.log(this.sustainStart, this.sustainEnd);
        };


        SampleReleasePanning = createClass(Sample, function(config){
            this.release = true;

            this.releaseDuration = config.release_duration/1000;
            this.releaseEnvelope = config.release_envelope;
            if(this.releaseEnvelope === undefined){
                this.releaseEnvelope = 'equal power';
            }else if(typeString(this.releaseEnvelope) === 'array'){
                this.releaseEnvelopeArray = config.release_envelope_array;
                this.releaseEnvelope = 'array';
            }
            this.panPosition = config.panPosition;
        });


        SampleReleasePanning.prototype.route = function(){
            //console.log(this.panning);
            this.panner = createPanner();
            this.panner.setPosition(this.panPosition || 0);
            this.source.connect(this.panner.node);
            this.panner.node.connect(this.output);
        };

        SampleSustainReleasePanning = createClass(Sample, function(config){
            this.release = true;

            this.sustainStart = config.sustain_start/1000;
            this.sustainEnd = config.sustain_end/1000;
            this.releaseDuration = config.release_duration/1000;
            this.releaseEnvelope = config.release_envelope;
            if(this.releaseEnvelope === undefined){
                this.releaseEnvelope = 'equal power';
            }else if(typeString(this.releaseEnvelope) === 'array'){
                this.releaseEnvelopeArray = config.release_envelope_array;
                this.releaseEnvelope = 'array';
            }
            this.panPosition = config.panPosition;
        });


        SampleSustainReleasePanning.prototype.route = function(){
            this.source.loop = true;
            this.source.loopStart = this.sustainStart;
            this.source.loopEnd = this.sustainEnd;

            this.panner = createPanner();
            this.panner.setPosition(this.panPosition || 0);
            this.source.connect(this.panner.node);
            this.panner.node.connect(this.output);
        };


        SampleSynth = createClass(Sample, function(config){
            this.release = true;
            this.panPosition = 0;
            this.autopan = config.autopan || false;
            this.frequency = config.event.frequency;
            this.waveForm = config.wave_form || 0;
            this.releaseDuration = config.release_duration/1000 || 1.5;
            this.releaseEnvelope = config.release_envelope || 'equal power';
            //console.log(config);
        });

        SampleSynth.prototype.createSource = function(){
            this.source = context.createOscillator();
            this.source.type = this.waveForm;
            this.source.frequency.value = this.frequency;
        };

        SampleSynth.prototype.route = function(){
            //create some headroom for multi-timbrality
            this.volume *= 0.3;
            this.output.gain.value = this.volume;

            if(this.autopan){
                this.panner = createPanner();
                this.panner.setPosition(0);
                this.source.connect(this.panner.node);
                this.panner.node.connect(this.output);
            }else{
                //alert(this.source + ':' + this.output.gain.value);
                this.source.connect(this.output);
            }
        };
/*
        SampleSynth.prototype.createSource = function(){
            this.autoPanner = context.createOscillator();
            this.autoPanner.type = 0;
            this.autoPanner.frequency.value = 50;


            var tmp = context.createScriptProcessor(256,1,1);
            tmp.onaudioprocess = function(e){
                console.log(e.inputBuffer.getChannelData(0)[0]);
            };
            this.autoPanner.connect(tmp);
            tmp.connect(context.destination);

            this.source = context.createOscillator();
            this.source.type = this.waveForm;
            this.source.frequency.value = this.frequency;
        };

        SampleSynth.prototype.route = function(){
            this.panner = createPanner();
            this.panner.setPosition(0);
            this.source.connect(this.panner.node);
            this.panner.node.connect(this.output);
            this.autoPanner.start();

            //create some headroom for multi-timbrality
            this.volume *= 0.3;
            this.output.gain.value = this.volume;
        };
*/
    });
}());
(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        ajax, //defined in util.js
        findItem, //defined in util.js
        storeItem, //defined in util.js
        deleteItem, //defined in util.js
        typeString, //defined in util.js
        parseUrl, //defined in util.js
        base64ToBinary, // defined in util.js
        context, //defined in open_module.js
        storage, //defined in open_module.js

        parseTime,

        folder,
        sampleId,
        index = 0,
        SamplePack;


    function parse(samplepack, config){
        var i, mapping = config.mapping, url, path, name, ext, slash, dot, data,
            remotePath,
            sampleData,
            extension;

        samplepack.samples = [];
        samplepack.samplesById = {};

        remotePath = config.remote_path;
        remotePath = remotePath === undefined ? false : remotePath;

        //console.log(samplepack.folder, samplepack.name);
        //console.log(samplepack, config);

        for(i in mapping){
            if(mapping.hasOwnProperty(i)){
                sampleData = {
                    id: i,
                    folder: samplepack.folder + '/' + samplepack.name,
                };

                //@TODO: this is not correct! A remote_path is not mandatory for a sample pack with urls!
                if(remotePath !== false){
                    url = mapping[i];
                    if(url.indexOf('http://') === 0 || url.indexOf('https://') === 0){
                        sampleData.url = url;
                    }else{
                        name = url;
                        // check if the url has a path and/or an extension
                        slash = url.lastIndexOf('/');
                        if(slash !== -1){
                            name = url.substring(slash + 1);
                        }
                        path = url.substring(0, slash);
                        dot = url.lastIndexOf('.');
                        extension = config.extension;
                        if(dot !== -1){
                            ext = url.substring(dot + 1);
                            if(ext.length >= 3 && ext.length <= 4){
                                extension = ext;
                                name = url.substring(slash, dot);
                            }
                        }
                        //console.log('u', url, 'r',remotePath, 'p', path, 'n', name, 'e', extension);
                        url = remotePath + '/' + path + '/' + name + '.' + extension;
                        url = url.replace(/\/{2,}/g,'/');
                        url = url.replace(/^\//,'');
                        url = url.replace(/$\//,'');
                        sampleData.url = url;
                    }
                    //console.log('loading sample from:', sampleData.url);
                }else{
                    data = mapping[i];
                    if(data.d !== undefined){
                        sampleData.base64 = mapping[i].d;
                        // get the sustain loop start and end
                        if(data.s !== undefined){
                            sampleData.sustain = data.s;
                        }
                        // get the sample specific release duration and envelope, or reference to group release duration
                        if(data.r !== undefined){
                            sampleData.release = data.r;
                        }
                    }else{
                        sampleData.base64 = mapping[i];
                    }
                    // store sample data by id so the instrument can easily retreive the loop information per sample
                    samplepack.samplesById[i] = sampleData;
                    //console.log(sampleData)
                }
                samplepack.samples.push(sampleData);
            }
        }
    }


    function loadLoop(pack, callback){
        //console.log('load sample pack', pack.name);
        loadSamples(pack.samples, function(buffer){
            //console.log('kheb er een ferig', buffer);
        }, function(){
            pack.loaded = true;
            pack.parseTime = parseTime;
            if(sequencer.debug >= 2){
                console.info('parsing', pack.name, 'took', parseTime * 1000, 'ms');
            }
            //console.log(pack.localPath, pack.loaded);
            if(callback){
                callback(true);
            }
        });
    }


    function cleanup(samplepack, callback){
        samplepack.reset();
        samplepack = undefined;
        callback(false);
    }


    function store(samplepack){
        var occupied = findItem(samplepack.localPath, sequencer.storage.samplepacks, true),
            action = samplepack.action,
            i, samples, sample;


        //console.log(action, occupied);

        if(occupied && occupied.className === 'SamplePack'){
            if(action === 'overwrite'){
                samples = occupied.samples;
                for(i = samples.length - 1; i >= 0; i--){
                    sample = samples[i];
                    deleteItem(sample.name + '/' + sample.folder, sequencer.storage.audio);
                }
            }else if(action === 'append'){
                samples = occupied.samples;
                for(i = samples.length - 1; i >= 0; i--){
                    samplepack.samples.push(samples[i]);
                }
            }else{
                if(sequencer.debug >= 2){
                    console.warn('there is already a samplepack at', samplepack.localPath);
                }
                return false;
            }
        }

        storeItem(samplepack, samplepack.localPath, sequencer.storage.samplepacks);
        return true;
    }


    function load(pack, callback){
        // check if sample pack file needs to be loaded first
        if(pack.hasMapping !== true){
            ajax({
                url: pack.url,
                responseType: 'json',
                onError: function(){
                    cleanup(pack, callback);
                },
                onSuccess: function(data){
                    // if the json data is corrupt (for instance because of a trailing comma) data will be null
                    if(data === null){
                        callback(false);
                        return;
                    }

                    if(data.mapping === undefined){
                        if(sequencer.debug >= 2){
                            console.warn('can\'t create a SamplePack with this data', data);
                        }
                        cleanup(pack, callback);
                        return;
                    }
                    if(data.name !== undefined && pack.name === undefined){
                        pack.name = data.name;
                    }

                    if(data.folder !== undefined && pack.folder === undefined){
                        pack.folder = data.folder;
                    }

                    if(pack.name === undefined){
                        pack.name = parseUrl(pack.url).name;
                    }

                    pack.action = data.action;
                    pack.localPath = pack.folder !== undefined ? pack.folder + '/' + pack.name : pack.name;

                    if(store(pack) === true){
                        parse(pack, data);
                        loadLoop(pack, callback);
                    }else{
                        callback(false);
                    }
                }
            });
        }else{
            if(store(pack) === true){
                loadLoop(pack, callback);
            }else{
                //console.log(callback);
                callback(false);
            }
        }
    }



    // private
    function loadSamples(samples, callback1, callback2){
        var i = 0,
            numSamples = samples.length,
            sample = samples[i];

        function loaded(buffer){
            //console.log('store item', folder + '/' + sampleId);
            // sample.buffer = buffer;
            // storeItem(sample, folder + '/' + sampleId, storage.audio);
            storeItem(buffer, folder + '/' + sampleId, storage.audio);
            if(callback1){
                callback1(buffer);
            }
            i++;
            if(i < numSamples){
                sample = samples[i];
                loadSample(sample, loaded);
            }else{
                callback2();
            }
        }
        loadSample(sample, loaded);
    }


    // private
    function loadSample(data, callback){
        var sample,
            url = data.url,
            base64 = data.base64;

        sampleId = data.id;
        folder = data.folder;
        sample = findItem(folder + '/' + sampleId, storage.audio, true);

        //console.log('load sample', sample, folder, sampleId, callback.name);
        //console.log(url);

        if(sample !== false){
            // sample has already been loaded
            callback(sample);
        }else if(base64){
            // sample is stored as base64 data
            //console.log(data.id, sample)
            //sample = atob(base64);
            //console.log(base64.substring(0,10));
            if(base64 !== 'TWAAAP'){
                sample = base64ToBinary(base64);
                parseAudioData(sample, callback);
            }else{
                callback(sample);
            }
            data.base64 = '';
        }else if(url){
            // sample needs to be loaded from the server
            ajax({
                url: url,
                responseType: 'arraybuffer',
                onError: function(){
                    callback();
                },
                onSuccess: function(buffer){
                    //console.log(sampleId, buffer);
                    parseAudioData(buffer, callback);
                }
            });
        }else{
            console.error('could not load sample', folder + '/' + sampleId);
            //callback();
        }
    }

    // private
    function parseAudioData(audiodata, callback){
        //console.log(audiodata, typeString(audiodata), audiodata.byteLength, ArrayBuffer.isView(audiodata));
        var ts = sequencer.getTime();
        //console.log(ts);
        if(audiodata !== null){
            try{
                context.decodeAudioData(audiodata, function(buffer){
                    //console.log(buffer);
                    parseTime += (sequencer.getTime() - ts);
                    callback(buffer);
                }, function(e){
                    console.log('error decoding audiodata', sampleId, e);
                    callback();
                });
            }catch(e){
                console.log(sampleId, e);
                callback();
            }
        }
    }


    SamplePack = function(config){
        this.id = 'SP' + index++ + new Date().getTime();
        this.className = 'SamplePack';

        this.loaded = false;
        this.loadTime = 0;
        this.parseTime = parseTime = 0;

        this.url = config.url;
        this.name = config.name;
        this.folder = config.folder;

        this.info = config.info || config.samplepack_info;
        this.author = config.author || config.samplepack_author;
        this.license = config.license || config.samplepack_license;
        this.compression = config.compression || config.samplepack_compression;
        if(this.compression === undefined){
            if(config.compression_type !== undefined){
                this.compression = config.compression_type + ' ' + config.compression_level;
            }
        }
        this.pack = config.pack;
        this.filesize = config.filesize;

        if(this.filesize === undefined && this.pack !== undefined){
            this.filesize = this.pack.filesize;
            //console.log(this.filesize);
        }


        if(config.mapping){
            if(this.name === undefined && this.folder === undefined){
                this.name = this.id;
                this.localPath = this.id;
            }else{
                this.localPath = this.folder !== undefined ? this.folder + '/' + this.name : this.name;
            }
            // set hasMapping to "true" so we know that we don't have to load json data from the server
            this.hasMapping = true;
            this.action = config.action;
            parse(this, config);
        }else if(config.url){
            this.url = config.url;
            //console.log(this.url);
        }
    };


    SamplePack.prototype.reset = function(){
        this.samples = [];
    };


    sequencer.addSamplePack = function(config, callback, callbackAfterAllTasksAreDone){
        var type = typeString(config),
            samplepack, json, name, folder;

        callbackAfterAllTasksAreDone = callbackAfterAllTasksAreDone === undefined ? false : callbackAfterAllTasksAreDone;

        //console.log(config);

        if(type !== 'object'){
            if(sequencer.debug >= 2){
                console.warn('can\'t create a SamplePack with this data', config);
            }
            return false;
        }

        if(config.json){
            json = config.json;
            name = config.name;
            folder = config.folder;
            if(typeString(json) === 'string'){
                try{
                    json = JSON.parse(json);
                }catch(e){
                    if(sequencer.debug >= 2){
                        console.warn('can\'t create a SamplePack with this data', config);
                    }
                    return false;
                }
            }
            if(json.mapping === undefined){
                if(sequencer.debug >= 2){
                    console.warn('can\'t create a SamplePack with this data', config);
                }
                return false;
            }
            config = {
                mapping: json.mapping,
                name: name === undefined ? json.name : name,
                folder: folder === undefined ? json.folder : folder
            };
            //console.log('config', name, folder, json.name, json.folder);
        }


        samplepack = new SamplePack(config);
        //console.log(samplepack.filesize);

        sequencer.addTask({
            type: 'load sample pack',
            method: load,
            params: samplepack
        }, function(value){
            //console.log(samplepack, value);
            if(callback){
                if(value === false){
                    samplepack = null;
                    callback(null);
                }else{
                    callback(samplepack);
                }
            }
        }, callbackAfterAllTasksAreDone);

        sequencer.startTaskQueue();

/*
        load(samplepack, function(){
            //console.log(samplepack);
            store(samplepack);
            if(callback){
                callback(samplepack);
            }
        });
*/
    };

    sequencer.protectedScope.addInitMethod(function(){
        storage = sequencer.storage;
        ajax = sequencer.protectedScope.ajax;
        context = sequencer.protectedScope.context;
        findItem = sequencer.protectedScope.findItem;
        parseUrl = sequencer.protectedScope.parseUrl;
        storeItem = sequencer.protectedScope.storeItem;
        deleteItem = sequencer.protectedScope.deleteItem;
        typeString = sequencer.protectedScope.typeString;
        base64ToBinary = sequencer.protectedScope.base64ToBinary;
    });

}());    (function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        typeString, // defined in util.js
        objectForEach, // defined in util.js

        // the amount of time in millis that events are scheduled ahead relative to the current playhead position, defined in open_module.js
        //bufferTime = sequencer.bufferTime * 1000,

        Scheduler;


    Scheduler = function(song){
        this.song = song;
        this.looped = false;
        this.notes = {};
        this.audioEvents = {};
    };


    Scheduler.prototype.updateSong = function(){
        this.events = this.song.eventsMidiAudioMetronome;
        this.numEvents = this.events.length;
        this.index = 0;
        this.maxtime = 0;
        this.notes = {};
        this.audioEvents = this.song.audioEvents;
        this.numAudioEvents = this.audioEvents.length;
        this.scheduledAudioEvents = {};
        this.looped = false;
        this.setIndex(this.song.millis);
        //console.log('Scheduler.setIndex', this.index, this.numEvents);
    };


    Scheduler.prototype.setIndex = function(millis){
        var i;
        for(i = 0; i < this.numEvents; i++){
            if(this.events[i].millis >= millis){
                this.index = i;
                break;
            }
        }
        //console.log(millis);
        this.beyondLoop = false;
        if(millis > this.song.loopEnd){
            this.beyondLoop = true;
        }

        this.scheduledAudioEvents = {};
    };

    /*
        A dangling audio event start before, and ends after the current position of the playhead. We have to calculate the difference between
        the start of the sample (event.millis) and the position of the playhead (song.millis). This value is the playheadOffset, and the sample
        starts the number of seconds of the playheadOffset into the sample.

        Also the audio event is scheduled the number of milliseconds of the playhead later to keep it in sync with the rest of the song.

        The playheadOffset is applied to the audio sample in audio_track.js
    */
    Scheduler.prototype.getDanglingAudioEvents = function(millis, events){
        var i, event, num = 0;

        for(i = 0; i < this.numAudioEvents; i++){
            event = this.audioEvents[i];
            if(event.millis < millis && event.endMillis > millis){
                event.playheadOffset = (millis - event.millis);
                event.time = this.startTime + event.millis - this.songStartMillis + event.playheadOffset;
                event.playheadOffset /= 1000;
                this.scheduledAudioEvents[event.id] = event;
                //console.log('getDanglingAudioEvents', event.id);
                events.push(event);
                num++;
            }else{
                event.playheadOffset = 0;
            }
            //console.log('playheadOffset', event.playheadOffset);
        }
        //console.log('getDanglingAudioEvents', num);
        return events;
    };


    Scheduler.prototype.getEvents = function(){
        var i, event, events = [], note, noteOn, noteOff, endMillis, endTicks, diff, buffertime, audioEvent;

        buffertime = sequencer.bufferTime * 1000;
        if(this.song.doLoop === true && this.song.loopDuration < buffertime){
            this.maxtime = this.songMillis + this.song.loopDuration - 1;
            //console.log(maxtime, this.song.loopDuration);
        }

        if(this.song.doLoop === true){

            if(this.maxtime >= this.song.loopEnd && this.beyondLoop === false){
            //if(this.maxtime >= this.song.loopEnd && this.prevMaxtime < this.song.loopEnd){
            //if(this.maxtime >= this.song.loopEnd && this.song.jump !== true){

                diff = this.maxtime - this.song.loopEnd;
                this.maxtime = this.song.loopStart + diff;

                //console.log(maxtime, this.song.loopEnd, diff);
                if(this.looped === false){
                    //console.log(this.song.millis, maxtime, diff);
                    this.looped = true;
                    //console.log('LOOP', this.song.loopEnd, this.maxtime);
                    for(i = this.index; i < this.numEvents; i++){
                        event = this.events[i];
                        if(event.millis < this.song.loopEnd){
                            //console.log('  ', event.track.name, maxtime, this.index, this.numEvents);
                            event.time = this.startTime + event.millis - this.songStartMillis;
                            events.push(event);
                            this.index++;
                        }else{
                            break;
                        }
                    }

                    // stop overflowing notes-> move the note off event to the position of the right locator (end of the loop)
                    endTicks = this.song.loopEndTicks - 1;
                    endMillis = this.song.getPosition('ticks', endTicks).millis;
                    for(i in this.notes){
                        if(this.notes.hasOwnProperty(i)){
                            note = this.notes[i];
                            noteOn = note.noteOn;
                            noteOff = note.noteOff;
                            if(noteOff.millis <= this.song.loopEnd){
                                continue;
                            }
                            event = sequencer.createMidiEvent(endTicks, 128, noteOn.data1, 0);
                            event.millis = endMillis;
                            event.part = noteOn.part;
                            event.track = noteOn.track;
                            event.midiNote = noteOn.midiNote;
                            event.time = this.startTime + event.millis - this.songStartMillis;
                            events.push(event);
                        }
                    }
                    // stop overflowing audio samples
                    for(i in this.scheduledAudioEvents){
                        if(this.scheduledAudioEvents.hasOwnProperty(i)){
                            audioEvent = this.scheduledAudioEvents[i];
                            if(audioEvent.endMillis > this.song.loopEnd){
                                audioEvent.stopSample(this.song.loopEnd/1000);
                                delete this.scheduledAudioEvents[i];
                                //console.log('stopping audio event', i);
                            }
                        }
                    }
                    this.notes = {};
                    this.setIndex(this.song.loopStart);
                    this.song.startTime += this.song.loopDuration;
                    this.startTime = this.song.startTime;
                    // get the audio events that start before song.loopStart
                    this.getDanglingAudioEvents(this.song.loopStart, events);
                }
            }else{
                this.looped = false;
            }
        }

        if(this.firstRun === true){
            this.getDanglingAudioEvents(this.song.millis, events);
            this.firstRun = false;
        }

        for(i = this.index; i < this.numEvents; i++){
            event = this.events[i];

            if(event.millis < this.maxtime){
                // if(this.song.bar >= 6 && event.track.name === 'Sonata # 3'){
                //     console.log('  song:', this.song.millis, 'event:', event.millis, ('(' + event.type + ')'), 'max:', maxtime, 'id:', event.midiNote.id);
                // }
                event.time = this.startTime + event.millis - this.songStartMillis;

                if(event.type === 144 || event.type === 128){
                    if(event.midiNote !== undefined && event.midiNote.noteOff !== undefined){
                        if(event.type === 144){
                            this.notes[event.midiNote.id] = event.midiNote;
                        }else if(event.type === 128){
                            delete this.notes[event.midiNote.id];
                        }
                        events.push(event);
                    }
                }else if(event.type === 'audio'){
                    if(this.scheduledAudioEvents[event.id] !== undefined){
                        // @TODO: delete the entry in this.scheduledAudioEvents after the sample has finished
                        // -> this happens when you move the playhead outside a loop if doLoop is true
                        //console.log('this shouldn\'t happen!');
                        //continue;
                        audioEvent = this.scheduledAudioEvents[event.id];
                        if(audioEvent.sample !== undefined && audioEvent.sample.source !== undefined){
                            audioEvent.stopSample(0);
                        // }else{
                        //     continue;
                        }
                    }
                    this.scheduledAudioEvents[event.id] = event;
                    //console.log('scheduling', event.id);
                    // the scheduling time has to be compensated with the playheadOffset (in millis)
                    event.time = event.time + (event.playheadOffset * 1000);
                    events.push(event);
                }else{
                    // controller events
                    events.push(event);
                }
                this.index++;
            }else{
                break;
            }
        }

        return events;
    };


    Scheduler.prototype.update = function(){
        var i,
            event,
            numEvents,
            events,
            track,
            channel;

        this.prevMaxtime = this.maxtime;

        if(this.song.precounting === true){
            this.songMillis = this.song.metronome.millis;
            this.maxtime = this.songMillis + (sequencer.bufferTime * 1000);
            events = [].concat(this.song.metronome.getPrecountEvents(this.maxtime));

            if(this.maxtime > this.song.metronome.endMillis){
                // start scheduling events of the song -> add the first events of the song
                this.songMillis = 0;//this.song.millis;
                this.maxtime = this.song.millis + (sequencer.bufferTime * 1000);
                this.startTime = this.song.startTime;
                this.startTime2 = this.song.startTime2;
                this.songStartMillis = this.song.startMillis;
                events = this.getEvents();
            }
        }else{
            this.songMillis = this.song.millis;
            this.maxtime = this.songMillis + (sequencer.bufferTime * 1000);
            this.startTime = this.song.startTime;
            this.startTime2 = this.song.startTime2;
            this.songStartMillis = this.song.startMillis;
            events = this.getEvents();
        }

        numEvents = events.length;

        //for(i = events.length - 1; i >= 0; i--){
        for(i = 0; i < numEvents; i++){
            event = events[i];
            track = event.track;
            //console.log(track);
            if(
                track === undefined ||
                event.mute === true ||
                event.part.mute === true ||
                event.track.mute === true ||
                (event.track.type === 'metronome' && this.song.useMetronome === false)
                )
            {
                continue;
            }

            if(event.type === 'audio'){
                event.time /= 1000;
                track.audio.processEvent(event);
            }else{

                if(track.routeToMidiOut === false){
                    // if(event.type === 144){
                    //     console.log(event.time/1000, sequencer.getTime(), event.time/1000 - sequencer.getTime());
                    // }
                    event.time /= 1000;
                    //console.log('scheduled', event.type, event.time, event.midiNote.id);
                    //console.log(track.instrument.processEvent);
                    track.instrument.processEvent(event);
                }else{
                    channel = track.channel;
                    if(channel === 'any' || channel === undefined || isNaN(channel) === true){
                        channel = 0;
                    }
                    objectForEach(track.midiOutputs, function(midiOutput){
                        if(event.type === 128 || event.type === 144 || event.type === 176){
                            //midiOutput.send([event.type, event.data1, event.data2], event.time + sequencer.midiOutLatency);
                            midiOutput.send([event.type + channel, event.data1, event.data2], event.time);
                        }else if(event.type === 192 || event.type === 224){
                            midiOutput.send([event.type + channel, event.data1], event.time);
                        }
                    });
                    // needed for Song.resetExternalMidiDevices()
                    this.lastEventTime = event.time;
                }
            }
        }
   };


    function loop(data, i, maxi, events){
        var arg;
        for(i = 0; i < maxi; i++){
            arg = data[i];
            if(arg === undefined){
                continue;
            }else if(arg.className === 'MidiEvent'){
                events.push(arg);
            }else if(arg.className === 'MidiNote'){
                events.push(arg.noteOn);
            }else if(typeString(arg) === 'array'){
                loop(arg, 0, arg.length);
            }
        }
    }


    Scheduler.prototype.unschedule = function(){
        var args = Array.prototype.slice.call(arguments),
            events = [],
            i, e, track, instrument;

        loop(args, 0, args.length, events);

        for(i = events.length - 1; i >= 0; i--){
            e = events[i];
            track = e.track;
            instrument = track.instrument;
            if(instrument){
                instrument.unscheduleEvent(e);
            }
        }
    };


    Scheduler.prototype.reschedule = function(){
        var i, track,
            numTracks = this.song.numTracks,
            tracks = this.song.tracks;

        for(i = 0; i < numTracks; i++){
            track = tracks[i];
            track.instrument.reschedule(this.song);
        }
    };

    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
        objectForEach = sequencer.protectedScope.objectForEach;
    });


    sequencer.protectedScope.createScheduler = function(song) {
        return new Scheduler(song);
    };

}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        slice = Array.prototype.slice,

        //import
        typeString, // defined in util.js
        isEmptyObject, // defined in util.js
        objectToArray, // defined in util.js
        objectForEach, // defined in util.js
        createMidiEvent, // defined in midi_event.js
        context, // defined in open_module.js
        timedTasks, // defined in open_module.js
        scheduledTasks, // defined in open_module.js
        repetitiveTasks, // defined in open_module.js
        masterGainNode, // defined in open_module.js
        parseTimeEvents, // defined in parse_time_events.js

        r = 0,

        heartbeat, // the heartbeat of the sequencer
        lastTimeStamp,

        processEventTracks = {},
        events, // the events that are currently been processed

        pausedSongs = [],
        activeSongs = {},
        snapshots = {};


    function addSong(song){
        activeSongs[song.id] = song;
    }


    sequencer.getSongs = function(){
        return activeSongs;
    };


    function removeProperties(obj){
        var i;
        for(i in obj){
            if(obj.hasOwnProperty(i)){
                //console.log(i);
                obj[i] = null;
            }
        }
    }

    sequencer.deleteSong = function(song){
        if(song === undefined || song === null || song.className !== 'Song'){
            return;
        }

        // clean up
        song.stop();
        song.disconnect(masterGainNode);
        //parseTimeEvents();

        // remove reference
        delete activeSongs[song.id];

        var i, track,
            j, part,
            k, note, event;

        //console.log(allEvents.length, song.events.length, metronome.events.length);
///*
        for(i = song.eventsMidiAudioMetronome.length - 1; i >= 0; i--){
            event = song.eventsMidiAudioMetronome[i];
            removeProperties(event);
        }

        for(i = song.timeEvents.length - 1; i >= 0; i--){
            event = song.timeEvents[i];
            //removeProperties(event);
        }
//*/

        for(i = song.numTracks - 1; i >= 0; i--){

            track = song.tracks[i];

            if(track.audio !== undefined){
                track.audio.recorder.cleanup();
            }

            for(j = track.numParts - 1; j >= 0; j--){
                part = track.parts[j];

                for(k = part.numNotes - 1; k >= 0; k--){
                    note = part.notes[k];
                    removeProperties(note);
                }

                // for(k = part.numEvents - 1; k >= 0; k--){
                //     event = part.events[k];
                //     removeProperties(event);
                // }

                removeProperties(part);
                part = null;
            }
            removeProperties(track);
            track = null;
        }
        removeProperties(song);
        song = null;
        return null;
    };


    sequencer.getSnapshot = function(song, id){

        if(song === undefined){
            console.error('song is undefined');
            return;
        }

        id = id || song.id;

        var snapshot = snapshots[id],
            activeEvents = song.activeEvents,
            activeNotes = song.activeNotes,
            activeParts = song.activeParts,
            nonActiveEvents = [],
            nonActiveNotes = [],
            nonActiveParts = [],
            prevActiveEvents,
            prevActiveNotes,
            prevActiveParts,
            e, n, p, i;

        if(snapshot !== undefined){
            prevActiveEvents = snapshot.activeEvents;
            prevActiveNotes = snapshot.activeNotes;
            prevActiveParts = snapshot.activeParts;

            for(i = prevActiveEvents.length - 1; i >= 0; i--){
                e = prevActiveEvents[i];
                if(activeEvents[e.id] === undefined){
                    if(song.eventsLib[e.id] !== undefined){
                        nonActiveEvents.push(e);
                    }
                }
            }

            for(i = prevActiveNotes.length - 1; i >= 0; i--){
                n = prevActiveNotes[i];
                if(activeNotes[n.id] === undefined){
                    if(song.notesLib[n.id] !== undefined){
                        nonActiveNotes.push(n);
                    }
                }
            }

            for(i = prevActiveParts.length - 1; i >= 0; i--){
                p = prevActiveParts[i];
                if(activeParts[p.id] === undefined){
                    nonActiveParts.push(p);
                }
            }
        }

        snapshot = {
            activeEvents: objectToArray(activeEvents),
            activeNotes: objectToArray(activeNotes),
            activeParts: objectToArray(activeParts),
            nonActiveEvents: nonActiveEvents,
            nonActiveNotes: nonActiveNotes,
            nonActiveParts: nonActiveParts
        };

        snapshots[id] = snapshot;

        return snapshot;
    };


    heartbeat = function(timestamp) {
        var i, diff, task, now = sequencer.getTime();

        // if(isEmptyObject(timedTasks) === false){
        //     console.log(timedTasks);
        // }

        // for instance: the callback of sample.unschedule;
        for(i in timedTasks){
            if(timedTasks.hasOwnProperty(i)){
                task = timedTasks[i];
                if(task.time >= now){
                    task.execute();
                    task = null;
                    delete timedTasks[i];
                }
            }
        }


        // for instance: song.update();
        for(i in scheduledTasks){
            if(scheduledTasks.hasOwnProperty(i)){
                scheduledTasks[i]();
            }
        }

        // for instance: song.pulse();
        for(i in repetitiveTasks){
            if(repetitiveTasks.hasOwnProperty(i)){
                repetitiveTasks[i]();
            }
        }

        // skip the first 10 frames because they tend to have weird intervals
        if(r >= 10){
            diff = (timestamp - lastTimeStamp)/1000;
            sequencer.diff = diff;
            // if(r < 40){
            //     console.log(diff);
            //     r++;
            // }
            if(diff > sequencer.bufferTime && sequencer.autoAdjustBufferTime === true){
                if(sequencer.debug){
                    console.log('adjusted buffertime:' + sequencer.bufferTime + ' -> ' +  diff);
                }
                sequencer.bufferTime = diff;
            }
        }else{
            r++;
        }
        lastTimeStamp = timestamp;
        scheduledTasks = {};

        //setTimeout(heartbeat, 100);
        window.requestAnimationFrame(heartbeat);
    };


    sequencer.processEvent = sequencer.processEvents = function(){
        var args = slice.call(arguments),
            loop, arg, i, maxi, time, contextTime, event,
            bpm = 60,
            midiEvent, type,
            instrument, part, track,
            secondsPerTick;

        events = [];

        loop = function(data, i, maxi){
            for(i = 0; i < maxi; i++){
                arg = data[i];
                type = typeString(arg);
                if(arg === undefined){
                    //console.log(i, arg);
                    continue;
                }else if(type === 'midimessageevent'){
                    data = arg.data;
                    midiEvent = createMidiEvent(0, data[0], data[1], data[2]);
                    events.push(midiEvent);
                }else if(arg.className === 'MidiEvent'){
                    events.push(arg);
                }else if(type === 'array'){
                    loop(arg, 0, arg.length);
                }else if(type === 'string'){
                    instrument = arg;
                }else if(isNaN(arg) === false){
                    bpm = arg;
                }
            }
        };

        loop(args, 0, args.length);

        part = sequencer.createPart();
        track = sequencer.createTrack();
        track.setInstrument(instrument);

        if(processEventTracks[track.instrumentId] === undefined){
            processEventTracks[track.instrumentId] = track;
            track.addPart(part);
            track.connect(context.destination);
        }else{
            track = processEventTracks[track.instrumentId];
            part = track.parts[0];
        }

        part.addEvents(events);
        track.update();

        maxi = events.length;
        contextTime = sequencer.getTime();
        secondsPerTick = 60/bpm/sequencer.defaultPPQ;
        for(i = 0; i < maxi; i++){
            event = events[i];
            event.time = contextTime + (event.ticks * secondsPerTick) + (2/1000);//ms -> sec, add 2 ms prebuffer time
            //time = contextTime + (event.ticks * secondsPerTick) + (2/1000);//ms -> sec, add 2 ms prebuffer time
            //console.log(event.ticks, time, contextTime);
            //track.instrument.processEvent(event, time);
            track.instrument.processEvent(event);
        }
    };


    sequencer.stopProcessEvent = sequencer.stopProcessEvents = function(){
        objectForEach(processEventTracks, function(track){
            track.instrument.allNotesOff();
            track = undefined;
        });
        processEventTracks = {};
    };


    sequencer.play = function(){
        var args = slice.call(arguments),
            events = [],
            parts = [],
            tracks = [],
            songs = [],
            timeEvents = [],
            i, arg, loop, store = false,
            song, track, part, bpm, nominator, denominator, instrument;

        //console.log('sequencer.play()', args);

        loop = function(data, i, maxi, indentation){
            for(i = 0; i < maxi; i++){
                arg = data[i];
                if(arg === undefined){
                    //console.log(indentation, i, arg);
                    continue;
                }else if(typeString(arg) === 'string'){
                    instrument = arg;
                }else if(arg.className === 'Song'){
                    if(bpm === undefined){
                        bpm = arg.bpm;
                        nominator = arg.nominator;
                        denominator = arg.denominator;
                    }
                    songs.push(arg);
                }else if(arg.className === 'Track'){
                    if(bpm === undefined){
                        song = arg.song;
                        if(song !== undefined){
                            bpm = song.bpm;
                            nominator = song.nominator;
                            denominator = song.denominator;
                        }
                    }
                    tracks.push(arg);
                }else if(arg.className === 'Part'){
                    if(bpm === undefined){
                        song = arg.song;
                        if(song !== undefined){
                            bpm = song.bpm;
                            nominator = song.nominator;
                            denominator = song.denominator;
                        }
                    }
                    parts.push(arg);
                }else if(arg.className === 'MidiEvent' || arg.className === 'AudioEvent'){
                    if(bpm === undefined){
                        part = arg.part;
                        if(part !== undefined){
                            song = part.song;
                            if(song !== undefined){
                                bpm = song.bpm;
                                nominator = song.nominator;
                                denominator = song.denominator;
                            }
                        }
                    }
                    if(arg.type === 0x51 || arg.type === 0x58){
                        timeEvents.push(arg);
                    }else{
                        events.push(arg);
                    }
                }else if(typeString(arg) === 'array'){
                    //console.log('recursive loop')
                    loop(arg, 0, arg.length, '    ');
                }else if(arg === true || arg === false){
                    store = arg;
                }else if(arg.indexOf('S') === 0){
                    // play song by id, not sure if this is useful
                    song = activeSongs[arg];
                    if(song){
                        song.play();
                    }
                }
            }
        };

        loop(args, 0, args.length, '  ');

        for(i = songs.length - 1; i >= 0; i--){
            song = songs[i];
            //console.log(song.numEvents);
            tracks = tracks.concat(song.tracks);
            //parts = parts.concat(song.parts);
            //events = events.concat(song.events);
            timeEvents = timeEvents.concat(song.timeEvents);
        }

        if(parts.length > 0){
            track = sequencer.createTrack();
            track.instrument = instrument;
            track.addParts(parts);
            tracks.push(track);
        }

        if(events.length > 0){
            track = sequencer.createTrack();
            track.instrument = instrument;
            part = sequencer.createPart();
            part.addEvents(events);
            track.addPart(part);
            tracks.push(track);
        }


        //console.log(songs.length, tracks.length, parts.length, events.length, bpm, nominator, denominator);

        song = sequencer.createSong({
            bpm: bpm || 120,
            nominator: nominator || 4,
            denominator: denominator || 4,
            timeEvents: timeEvents,
            tracks: tracks
        });

        addSong(song);
        song.play();
        return song;
    };


/*
    animationFrame = function(cb) {
        animationFrameRequests.push(cb);

        if (animationFrameTimer !== undefined) {
            return animationFrameTimer;
        }

        animationFrameTimer = setTimeout(function() {
            while (animationFrameRequests.length > 0) {
                animationFrameRequests.shift()();
            }
            animationFrameTimer = undefined;
        }, animationFrameInterval);

        return animationFrameTimer;
    };
*/


    sequencer.setAnimationFrameType = function(type, interval) {
        type = type || 'default';
        type = type.toLowerCase();
        interval = interval || 15;
        switch (type) {
            case 'settimeout':
                /*
                animationFrameInterval = interval || animationFrameInterval;
                animationFrameRequests = [];
                window.requestAnimationFrame = animationFrame;
                */
                // quick and dirty
                window.requestAnimationFrame = function(cb) {
                    setTimeout(cb, interval);
                };
                break;
            default:
                /*
                clearTimeout(animationFrameTimer);
                */
                window.requestAnimationFrame = window.webkitRequestAnimationFrame || window.requestAnimationFrame;
        }
    };


    // used by asset_manager.js if an instrument or a sample pack has been unloaded
    sequencer.protectedScope.updateInstruments = function(){
        var i, j, tracks, track, song;

        for(i in activeSongs){
            if(activeSongs.hasOwnProperty(i)){
                song = activeSongs[i];
                tracks = song.tracks;
                for(j = tracks.length - 1; j >= 0; j--){
                    track = tracks[j];
                    //console.log(track.id);
                    track.instrument.reset();
                }
            }
        }
    };


    sequencer.allNotesOff = function(){
        objectForEach(activeSongs, function(song){
            song.allNotesOff();
        });
    };


    window.onblur = function(){
        if(sequencer.pauseOnBlur === false){
            return;
        }
        //console.log('blur', sequencer.getTime() * 1000);
        sequencer.allNotesOff();
        pausedSongs = [];
        objectForEach(activeSongs, function(song){
            if(song.playing === true){
                if(sequencer.debug){
                    console.log('pause song', song.id);
                }
                pausedSongs.push(song);
                song.pause();
                //song.stop();
            }
        });
    };


    window.onfocus = function(){
        if(sequencer.pauseOnBlur === false){
            return;
        }
        //console.log('focus', sequencer.getTime() * 1000);
        var song, millis, i, maxi = pausedSongs.length;
        for(i = 0; i < maxi; i++){
            song = pausedSongs[i];
            millis = song.millis;
            song.stop();
            song.setPlayhead('millis', millis);
            if(sequencer.restartOnFocus){
                song.play();
            }
        }
        pausedSongs = [];
    };


    sequencer.protectedScope.addSong = addSong;

    sequencer.protectedScope.addInitMethod(function() {
        objectToArray = sequencer.protectedScope.objectToArray;
        isEmptyObject = sequencer.protectedScope.isEmptyObject;
        isEmptyObject = sequencer.protectedScope.isEmptyObject;
        objectForEach = sequencer.protectedScope.objectForEach;
        timedTasks = sequencer.protectedScope.timedTasks;
        scheduledTasks = sequencer.protectedScope.scheduledTasks;
        repetitiveTasks = sequencer.protectedScope.repetitiveTasks;
        typeString = sequencer.protectedScope.typeString;
        context = sequencer.protectedScope.context;
        createMidiEvent = sequencer.createMidiEvent;
        masterGainNode = sequencer.protectedScope.masterGainNode;
        parseTimeEvents = sequencer.protectedScope.parseTimeEvents;
        heartbeat();
    });

}());




/*
    // removed for clarity

    sequencer.play = function(song){
        song = checkSong(song);
        if(song === false){
            console.error('no song loaded or specified');
            return;
        }
        song.play();
    };


    sequencer.pause = function(song){
        song = checkSong(song);
        if(song === false){
            console.error('no song loaded or specified');
            return;
        }
        song.pause();
    };


    sequencer.stop = function(song){
        song = checkSong(song);
        if(song === false){
            console.error('no song loaded or specified');
            return;
        }
        song.stop();
    };


    sequencer.addEventListener = function(){
        if(sequencer.song === undefined){
            console.error('no song in sequencer');
            return;
        }
        return sequencer.song.addEventListener.apply(sequencer.song, arguments);
    };


    sequencer.removeEventListener = function(){
        if(sequencer.song === undefined){
            console.error('no song in sequencer');
            return;
        }
        return sequencer.song.removeEventListener.apply(sequencer.song, arguments);
    };


    checkSong = function(song){
        if(song){
            return song.className === 'Song' ? song : false;
        }else if(sequencer.song){
            return sequencer.song.className === 'Song' ? sequencer.song : false;
        }else{
            return false;
        }
    };



*/


/*
    sequencer.playEvents = function(){
        var args = slice.call(arguments),
            i, arg, loop, bpm, nominator, denominator,
            part, song, events = [];

        loop = function(data){
            for(i = data.length - 1; i >= 0; i--){
                arg = data[i];
                if(typeString(arg) === 'array'){
                    loop(arg);
                }else if(arg.className === 'MidiEvent' || arg.className === 'AudioEvent'){
                    if(bpm === undefined){
                        part = arg.part;
                        if(part !== undefined){
                            song = part.song
                            if(song !== undefined){
                                bpm = song.bpm;
                                nominator = song.nominator;
                                denominator = song.denominator;
                            }
                        }
                    }
                    events.push(arg);
                }
            }
        };

        loop(args);

        //console.log(events, bpm, nominator, denominator);

        song = sequencer.createSong({
            bpm: bpm || 120,
            nominator: nominator || 4,
            denominator: denominator || 4,
            events: events
        });

        songs[song.id] = song;
        //console.log(song.durationMillis);
        //console.log(songs);

        song.addEventListener('end', function(){
            console.log('end', this.id);
            //delete songs[this.id];
            //console.log(songs);
        });
        song.play();
        return song.id;
    };
*/

/*
    // moved to song

    sequencer.midiIn = function(){// events, [song|track|part]

    };


    sequencer.midiOut = function(){// channel

    };


    sequencer.midiThru = function(){// channel

    };

*/
(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        slice = Array.prototype.slice,

        //import
        createMidiEvent, // → defined in midi_event.js
        createPlayhead, // → defined in playhead.js
        createFollowEvent, // → defined in song_follow_event.js
        createScheduler, // → defined in scheduler.js
        createMetronome, // → defined in metronome.js
        followEvent, // → defined in follow_event_song.js
        masterGainNode, // -> defined in open_module.js
        context, // -> defined in open_module.js
        timedTasks, // -> defined in open_module.js
        repetitiveTasks, // -> defined in open_module.js
        initMidi, // defined in midi_system.js
        addMidiEventListener, // defined in midi_system.js
        removeMidiEventListener, // defined in midi_system.js
        setMidiInput, // defined in midi_system.js
        setMidiOutput, // defined in midi_system.js
        getMidiInputs, // defined in midi_system.js
        getMidiOutputs, // defined in midi_system.js
        getMidiPortsAsDropdown, // defined in midi_system.js

        getPosition, // → defined in position.js
        millisToTicks, // → defined in position.js
        ticksToMillis, // → defined in position.js
        ticksToBars, // → defined in position.js
        millisToBars, // → defined in position.js
        barsToTicks, // → defined in position.js
        barsToMillis, // → defined in position.js

        addEventListener, // → defined in song_event_listener.js
        removeEventListener, // → defined in song_event_listener.js
        dispatchEvent, // → defined in song_event_listener.js

        update, // → defined in song_update.js
        checkDuration, // → defined in song_update.js
        addMetronomeEvents, // → defined in song_update.js

        gridToSong, // → defined in song_grid.js
        noteToGrid, // → defined in song_grid.js
        eventToGrid, // → defined in song_grid.js
        positionToGrid, // → defined in song_grid.js

        //createTrack, // → defined in track.js
        typeString, // → defined in util.js
        removeFromArray, // → defined in util.js
        removeFromArray2, // → defined in util.js
        getNoteLengthName, // → defined in util.js
        getStats, // → defined in event_statistics.js
        findEvent, // → defined in find_event.js
        findNote, // → defined in find_event.js

        objectForEach, // → defined in util.js
        addSong, // → defined in sequencer.js

        //private
        _removeTracks,
        pulse,
        getArguments,
        getTrack,
        addTracks,
        getPart,
        getParts,
        getTimeEvents,
        setRecordingStatus,
        _getRecordingPerTrack,

        songIndex = 0,

        //protected
        createGrid,

        //public
        Song;

    Song = function(config){
        //Object.defineProperty(this,'tracks',{value: []});
        //Object.defineProperty(this, 'events', {value: 'val'});

        config = config || {};

        this.id = 'S' + songIndex++ + '' + new Date().getTime();
        this.name = config.name || this.id;
        this.className = 'Song';
        addSong(this);

        this.midiInputs = {};
        this.midiOutputs = {};
        initMidi(this);

        this.bpm = config.bpm || 120;
        this.ppq = config.ppq || sequencer.defaultPPQ;
        this.bars = config.bars || 30; //default song duration is 30 bars @ 120 bpm is 1 minute
        this.lastBar = this.bars;
        this.lowestNote = config.lowestNote || 0;
        this.highestNote = config.highestNote || 127;
        this.pitchRange = this.highestNote - this.lowestNote + 1;
        this.nominator = config.nominator || 4;
        this.denominator = config.denominator || 4;
        this.factor = 4/this.denominator;
        this.ticksPerBeat = this.ppq * this.factor;
        this.ticksPerBar = this.ticksPerBeat * this.nominator;
        this.millisPerTick = (60000/this.bpm/this.ppq);
        this.quantizeValue = config.quantizeValue || '8';
        this.fixedLengthValue = config.fixedLengthValue || false;
        this.positionType = config.positionType || 'all';
        this.useMetronome = config.useMetronome;
        this.autoSize = config.autoSize === undefined ? true : config.autoSize === true;
        this.playbackSpeed = 1;
        this.defaultInstrument = config.defaultInstrument || sequencer.defaultInstrument;
        this.recordId = -1;
        this.autoQuantize = false;
        this.loop = config.loop || false;
        this.doLoop = false;
        this.illegalLoop = true;
        this.loopStart = 0;
        this.loopEnd = 0;
        this.loopDuration = 0;
        this.audioRecordingLatency = 0;

        //console.log('PPQ song', this.ppq)

        if(this.useMetronome !== true && this.useMetronome !== false){
            this.useMetronome = false;
        }
        //console.log(this.useMetronome);

        this.grid = undefined;

        if(config.timeEvents && config.timeEvents.length > 0){
            this.timeEvents = [].concat(config.timeEvents);

            this.tempoEvent = getTimeEvents(sequencer.TEMPO, this)[0];
            this.timeSignatureEvent = getTimeEvents(sequencer.TIME_SIGNATURE, this)[0];

            if(this.tempoEvent === undefined){
                this.tempoEvent = createMidiEvent(0, sequencer.TEMPO, this.bpm);
                this.timeEvents.unshift(this.tempoEvent);
            }else{
                this.bpm = this.tempoEvent.bpm;
            }
            if(this.timeSignatureEvent === undefined){
                this.timeSignatureEvent = createMidiEvent(0, sequencer.TIME_SIGNATURE, this.nominator, this.denominator);
                this.timeEvents.unshift(this.timeSignatureEvent);
            }else{
                this.nominator = this.timeSignatureEvent.nominator;
                this.denominator = this.timeSignatureEvent.denominator;
            }
            //console.log(1, this.nominator, this.denominator, this.bpm);
        }else{
            // there has to be a tempo and time signature event at ticks 0, otherwise the position can't be calculated, and moreover, it is dictated by the MIDI standard
            this.tempoEvent = createMidiEvent(0, sequencer.TEMPO, this.bpm);
            this.timeSignatureEvent = createMidiEvent(0, sequencer.TIME_SIGNATURE, this.nominator, this.denominator);
            this.timeEvents = [
                this.tempoEvent,
                this.timeSignatureEvent
            ];
        }

        // TODO: A value for bpm, nominator and denominator in the config overrules the time events specified in the config -> maybe this should be the other way round

        // if a value for bpm is set in the config, and this value is different from the bpm value of the first
        // tempo event, all tempo events will be updated to the bpm value in the config.
        if(config.timeEvents !== undefined && config.bpm !== undefined){
            if(this.bpm !== config.bpm){
                this.setTempo(config.bpm, false);
            }
        }

        // if a value for nominator and/or denominator is set in the config, and this/these value(s) is/are different from the values
        // of the first time signature event, all time signature events will be updated to the values in the config.
        // @TODO: maybe only the first time signature event should be updated?
        if(config.timeEvents !== undefined && (config.nominator !== undefined || config.denominator !== undefined)){
            if(this.nominator !== config.nominator || this.denominator !== config.denominator){
                this.setTimeSignature(config.nominator || this.nominator, config.denominator || this.denominator, false);
            }
        }

        //console.log(2, this.nominator, this.denominator, this.bpm);

        this.tracks = [];
        this.parts = [];
        this.notes = [];
        this.events = [];//.concat(this.timeEvents);
        this.allEvents = []; // all events plus metronome ticks

        this.tracksById = {};
        this.tracksByName = {};
        this.partsById = {};
        this.notesById = {};
        this.eventsById = {};

        this.activeEvents = null;
        this.activeNotes = null;
        this.activeParts = null;

        this.recordedNotes = [];
        this.recordedEvents = [];
        this.recordingNotes = {}; // notes that don't have their note off events yet

        this.numTracks = 0;
        this.numParts = 0;
        this.numNotes = 0;
        this.numEvents = 0;
        this.instruments = [];

        this.playing = false;
        this.paused = false;
        this.stopped = true;
        this.recording = false;
        this.prerolling = false;
        this.precounting = false;
        this.preroll = true;
        this.precount = 0;
        this.listeners = {};

        this.playhead = createPlayhead(this, this.positionType, this.id, this);//, this.position);
        this.playheadRecording = createPlayhead(this, 'all', this.id + '_recording');
        this.scheduler = createScheduler(this);
        this.followEvent = createFollowEvent(this);

        this.volume = 1;
        this.gainNode = context.createGainNode();
        this.gainNode.gain.value = this.volume;
        this.metronome = createMetronome(this, dispatchEvent);
        this.connect();


        if(config.className === 'MidiFile' && config.loaded === false){
            if(sequencer.debug){
                console.warn('midifile', config.name, 'has not yet been loaded!');
            }
        }

        //if(config.tracks && config.tracks.length > 0){
        if(config.tracks){
            this.addTracks(config.tracks);
        }

        if(config.parts){
            this.addParts(config.parts);
        }

        if(config.events){
            this.addEvents(config.events);
        }

        if(config.events || config.parts || config.tracks){
            //console.log(config.events, config.parts, config.tracks)
            // the length of the song will be determined by the events, parts and/or tracks that are added to the song
            if(config.bars === undefined){
                this.lastBar = 0;
            }
            this.lastEvent = createMidiEvent([this.lastBar, sequencer.END_OF_TRACK]);
        }else{
            this.lastEvent = createMidiEvent([this.bars * this.ticksPerBar, sequencer.END_OF_TRACK]);
        }
        //console.log('update');
        this.update(true);

        this.numTimeEvents = this.timeEvents.length;
        this.playhead.set('ticks', 0);
        this.midiEventListeners = {};
        //console.log(this.timeEvents);
    };


    getPart = function(data, song){
        var part = false;
        if(data === undefined){
            part = false;
        }else if(part.className === 'Part'){
            part = data;
        }else if(typeString(data) === 'string'){
            part = song.partsById[data];
        }else if(isNaN(data) === false){
            part = song.parts[data];
        }
        return part;
    };


    getTrack = function(data, song){
        var track = false;
        //console.log(data);
        if(data === undefined){
            track = false;
        }else if(data.className === 'Track'){
            track = data;
        }else if(typeString(data) === 'string'){
            track = song.tracksById[data];
            if(track === undefined){
                track = song.tracksByName[data];
                // objectForEach(song.tracksById, function(t){
                //     if(t.name === data){
                //         track = t;
                //     }
                // });
            }
        }else if(isNaN(data) === false){
            track = song.tracks[data];
        }

        if(track === undefined){
            track = false;
        }
        return track;
    };


    addTracks = function(newTracks, song){
        //console.log('addTracks');
        var tracksById = song.tracksById,
            tracksByName = song.tracksByName,
            addedIds = [],
            i, part, track;

        for(i = newTracks.length - 1; i >= 0; i--){
            track = getTrack(newTracks[i]);
            if(track === false){
                continue;
            }
            //console.log(track.song);
            if(track.song !== undefined && track.song !== null){
                track = track.copy();
            }
            track.song = song;
            track.instrument.song = song;
            track.quantizeValue = song.quantizeValue;
            track.connect(song.gainNode);
/*
            // -> not possible because of the endless midi feedback loop with IAC virtual midi ports on OSX
            //console.log(song.midiInputs);
            objectForEach(song.midiInputs, function(port){
                //console.log(port.id);
                track.setMidiInput(port.id, true);
            });
*/

            track.state = 'new';
            track.needsUpdate = true;
            tracksById[track.id] = track;
            tracksByName[track.name] = track;
            addedIds.push(track.id);

            objectForEach(track.partsById, function(part){
                part.state = 'new';
            });
/*
            for(j in track.partsById){
                if(track.partsById.hasOwnProperty(j)){
                    //console.log('addTracks, part', part);
                    part = track.partsById[j];
                    //part.song = song;
                    part.state = 'new';
                }
            }
*/
        }
        return addedIds;
    };


    _removeTracks = function(tobeRemoved){
        var i, track, removed = [];

        for(i = tobeRemoved.length - 1; i >= 0; i--){
            track = getTrack(tobeRemoved[i]);
            if(track === false){
                continue;
            }
            //console.log(track);
            if(track.song !== undefined && track.song !== this){
                console.warn('can\'t remove: this track belongs to song', track.song.id);
                continue;
            }
            track.state = 'removed';
            track.disconnect(this.gainNode);
            track.reset();
            delete this.tracksById[track.id];
            delete this.tracksByName[track.name];
            removed.push(track);
        }
        return removed;
    };

/*
    getParts = function(args, song){
        var part, i,
            result = [];
        for(i = args.length - 1; i >= 0; i--){
            part = getPart(args[i], song);
            if(part){
                result.push(part);
            }
        }
        return result;
    };
*/

    getParts = function(args){
        var part, i,
            result = [];
        for(i = args.length - 1; i >= 0; i--){
            part = getPart(args[i], this);
            if(part){
                result.push(part);
            }
        }
        return result;
    };


    function getEvents(args, song){
        var result = [];

        args = slice.call(args);
        //console.log(args);

        function loop(data, i, maxi){
            var arg, type, event;

            for(i = 0; i < maxi; i++){
                arg = data[i];
                type = typeString(arg);

                if(type === 'array'){
                    loop(arg, 0, arg.length);
                }

                else if(type === 'string'){
                    event = song.eventsById[arg];
                    if(event !== undefined){
                        result.push(arg);
                    }
                }

                else if(arg.className === 'MidiEvent'){
                    result.push(arg);
                }
            }
        }

        loop(args, 0, args.length);
        return result;
    }


    getTimeEvents = function(type, song){
        var events = [];
        song.timeEvents.forEach(function(event){
            if(event.type === type){
                events.push(event);
            }
        });
        return events;
    };


    pulse = function(song){
        var
            //now = window.performance.now(),
            now = sequencer.getTime() * 1000,
            diff = now - song.timeStamp,
            millis = song.millis + diff;

        song.diff = diff;
        //console.log(diff);
        //console.log(now, song.recordTimestamp, song.eventsMidiAudioMetronome[0].time);

        song.timeStamp = now;

        if(song.precounting === true){
            song.metronome.millis += diff;
            song.scheduler.update(diff);
            // now return otherwise the position of the song gets updated
            return;
        }

        // is this comment still valid?
        // put followEvent and scheduler before playhead.update(), otherwise followEvent will miss the first event (scheduler could come after playhead.update)
        song.prevMillis = song.millis;
        //song.playhead.update('millis', diff);
        // song.followEvent.update();
        // song.scheduler.update();
        //console.log(song.millis, diff, song.loopEnd);
        //console.log(song.doLoop, song.scheduler.looped, song.millis > song.loopEnd);
        //console.log(song.scheduler.prevMaxtime, song.loopEnd);
        if(song.doLoop && song.scheduler.looped && millis >= song.loopEnd){// && song.jump !== true){
            //console.log(song.prevMillis, song.millis);
            //song.scheduler.looped = false;
            song.followEvent.resetAllListeners();
            song.playhead.set('millis', song.loopStart + (millis - song.loopEnd));
            song.followEvent.update();
            //console.log('-->', song.millis);
            song.scheduler.update();
            dispatchEvent(song, 'loop');
            //song.startTime += (song.loopEnd - song.loopStart);
        }else if(millis >= song.durationMillis){
            song.playhead.update('millis', song.durationMillis - song.millis);
            song.followEvent.update();
            song.pause();
            song.endOfSong = true;
            dispatchEvent(song, 'end');
        }else{
            song.playhead.update('millis', diff);
            song.followEvent.update();
            song.scheduler.update();
        }

        song.jump = false;

        //console.log(now, sequencer.getTime());
        //console.log(song.barsAsString);
        //console.log('pulse', song.playhead.barsAsString, song.playhead.millis);
        //console.log(song.millis);
    };


    Song.prototype.remove = function() {
        console.warn('Song.remove() is deprecated, please use sequencer.deleteSong()');
        sequencer.deleteSong(this);
    };


    Song.prototype.play = function() {
        sequencer.unlockWebAudio();
        var song, playstart;

        //console.log(this.playing);
        if(this.playing){
            this.pause();
            return;
        }
        // tell the scheduler to schedule the audio events that start before the current position of the playhead
        this.scheduler.firstRun = true;

        // only loop when the loop is legal and this.loop is set to true
        this.doLoop = (this.illegalLoop === false && this.loop === true);
        //console.log('play', this.doLoop, this.illegalLoop, this.loop);
        // or should I move to loopStart here if loop is enabled?
        if(this.endOfSong){
            this.followEvent.resetAllListeners();
            this.playhead.set('millis', 0);
            this.scheduler.setIndex(0);
        }
        // timeStamp is used for calculating the diff in time of every consecutive frame
        this.timeStamp = sequencer.getTime() * 1000;
        this.startTime = this.timeStamp;
        try{
            this.startTime2 = window.performance.now();
            //this.startTime2 = undefined;
        }catch(e){
            if(sequencer.debug){
                console.log('window.performance.now() not supported');
            }
        }

        if(this.precounting){
            this.metronome.startTime = this.startTime;
            this.metronome.startTime2 = this.startTime2;
            this.startTime += this.metronome.precountDurationInMillis;
            this.startTime2 += this.metronome.precountDurationInMillis;

            //console.log(this.metronome.startTime, this.recordTimestamp);

            song = this;
            playstart = this.startTime/1000;

            //console.log(this.startTime, playstart, this.recordTimestamp/1000 - playstart);

            repetitiveTasks.playAfterPrecount = function(){
                if(sequencer.getTime() >= playstart){
                    song.precounting = false;
                    song.prerolling = false;
                    song.recording = true;
                    song.playing = true;
                    dispatchEvent(song, 'record_start');
                    dispatchEvent(song, 'play');
                    //console.log('playAfterPrecount', sequencer.getTime(), playstart, song.metronome.precountDurationInMillis);
                    repetitiveTasks.playAfterPrecount = undefined;
                    delete repetitiveTasks.playAfterPrecount;
                }
            };
        }
        // this value will be deducted from the millis value of the event as soon as the event get scheduled
        this.startMillis = this.millis;
        //console.log(this.startMillis);

        // make first call right after setting a time stamp to avoid delay
        //pulse(this);
        song = this;
        repetitiveTasks[this.id] = function(){
            pulse(song);
        };

        this.paused = false;
        this.stopped = false;
        this.endOfSong = false;
        if(this.precounting !== true){
            this.playing = true;
            dispatchEvent(this, 'play');
        }
    };


    Song.prototype.pause = function() {
        if(this.recording === true || this.precounting === true){
            this.stop();
            return;
        }
        if(this.stopped || this.paused) {
            this.play();
            return;
        }
        delete repetitiveTasks[this.id];
        this.allNotesOff();
        this.playing = false;
        this.paused = true;
        dispatchEvent(this, 'pause');
    };


    Song.prototype.stop = function() {
        if(this.stopped){
            // is this necessary?
            this.followEvent.resetAllListeners();
            this.playhead.set('millis', 0);
            this.scheduler.setIndex(0);
            return;
        }
        if(this.recording === true || this.precounting === true){
            this.stopRecording();
        }
        delete repetitiveTasks[this.id];
        // remove unschedule callback of all samples
        objectForEach(timedTasks, function(task, id){
            //console.log(id);
            if(id.indexOf('unschedule_') === 0 || id.indexOf('event_') === 0){
                task = null;
                delete timedTasks[id];
            }
        });
        this.allNotesOff();

        this.playing = false;
        this.paused = false;
        this.stopped = true;
        this.endOfSong = false;

        this.followEvent.resetAllListeners();
        this.playhead.set('millis', 0);
        this.scheduler.setIndex(0);
        dispatchEvent(this, 'stop');
    };


    Song.prototype.adjustLatencyForAllRecordings = function(value){
        // @todo: add callback here!
        this.audioRecordingLatency = value;
        this.tracks.forEach(function(track){
            track.setAudioRecordingLatency(value);
        });
    };


    Song.prototype.setAudioRecordingLatency = function(recordId, value, callback){
        var i, event, sampleId;

        for(i = this.audioEvents.length - 1; i >= 0; i--){
            event = this.audioEvents[i];
            sampleId = event.sampleId;
            if(sampleId === undefined){
                continue;
            }
            if(recordId === sampleId){
                break;
            }
        }
        //console.log(recordId, value, callback);
        event.track.setAudioRecordingLatency(recordId, value, callback);
    };


    Song.prototype.startRecording = Song.prototype.record = function(precount){
        //console.log(this.recording, this.precounting, precount);
        if(this.recording === true || this.precounting === true){
            this.stop();
            return;
        }

        var userFeedback = false,
            audioRecording = false,
            i, track, self = this;

        this.metronome.precountDurationInMillis = 0;

        // allow to start a recording while playing
        if(this.playing){
            this.precount = 0;
            this.recordStartMillis = this.millis;
        }else{
            if(precount === undefined){
                this.precount = 0;
                this.recordStartMillis = this.millis;
            }else{
                // a recording with a precount always starts at the beginning of a bar
                this.setPlayhead('barsbeats', this.bar);
                this.metronome.createPrecountEvents(precount);
                this.precount = precount;
                this.recordStartMillis = this.millis - this.metronome.precountDurationInMillis;
                //console.log(this.metronome.precountDurationInMillis);
            }
/*
            if(this.preroll === true){
                // TODO: improve this -> leave it, preroll is always on unless the user sets it to false
                //this.preroll = (this.bar - this.precount) > 0;
            }
*/
        }
        //console.log('preroll', this.preroll);
        //console.log('precount', this.precount);
        //console.log('precountDurationInMillis', this.metronome.precountDurationInMillis);
        //console.log('recordStartMillis', this.recordStartMillis);


        this.recordTimestampTicks = this.ticks;
        this.recordId = 'REC' + new Date().getTime();
        this.recordedNotes = [];
        this.recordedEvents = [];
        this.recordingNotes = {};
        this.recordingAudio = false;

        if(this.keyEditor !== undefined){
            this.keyEditor.prepareForRecording(this.recordId);
        }

        for(i = this.numTracks - 1; i >= 0; i--){
            track = this.tracks[i];
            if(track.recordEnabled === 'audio'){
                this.recordingAudio = true;
            }
            //console.log(track.name, track.index);
            if(track.recordEnabled === 'audio'){
                audioRecording = true;
                track.prepareForRecording(this.recordId, function(){
                    if(userFeedback === false){
                        userFeedback = true;
                        setRecordingStatus.call(self);
                    }
                });
            }else{
                track.prepareForRecording(this.recordId);
            }
        }

        if(audioRecording === false){
            setRecordingStatus.call(this);
        }

        return this.recordId;
    };


    setRecordingStatus = function(){

        this.recordTimestamp = context.currentTime * 1000; // millis

        if(this.playing === false){
            if(this.precount > 0){
                // recording with precount always starts at the beginning of a bar
                //this.setPlayhead('barsbeats', this.bar);
                this.precounting = true;
                this.prerolling = this.preroll;
                if(this.prerolling){
                    dispatchEvent(this, 'record_preroll');
                }else{
                    dispatchEvent(this, 'record_precount');
                }
            }else{
                this.recording = true;
                dispatchEvent(this, 'record_start');
            }
            this.play();
        }else{
            this.recording = true;
            this.precounting = false;
            dispatchEvent(this, 'record_start');
        }
    };


    _getRecordingPerTrack = function(index, recordingHistory, callback){
        var track, scope = this;

        if(index < this.numTracks){
            track = this.tracks[index];
            track.stopRecording(this.recordId, function(events){
                if(events !== undefined){
                    recordingHistory[track.name] = events;
                }
                index++;
                _getRecordingPerTrack.call(scope, index, recordingHistory, callback);
            });
        }else{
            callback(recordingHistory);
        }
    };


    Song.prototype.stopRecording = function(){
        if(this.recording === false){
            return;
        }
        this.recording = false;
        this.prerolling = false;
        this.precounting = false;

        //repetitiveTasks.playAfterPrecount = undefined;
        delete repetitiveTasks.playAfterPrecount;
        var scope = this;

        _getRecordingPerTrack.call(this, 0, {}, function(history){
            scope.update();
            dispatchEvent(scope, 'recorded_events', history);
        });

        // perform update immediately for midi recordings
        this.update();

        dispatchEvent(this, 'record_stop');

        return this.recordId;
    };


    Song.prototype.undoRecording = function(history){
        var i, tracksByName;

        if(history === undefined){
            for(i = this.numTracks - 1; i >= 0; i--){
                this.tracks[i].undoRecording(this.recordId);
            }
        }else{
            tracksByName = this.tracksByName;
            objectForEach(history, function(events, name){
                var track = tracksByName[name];
                track.undoRecording(events);
            });
        }
        //this.update();
    };


    Song.prototype.getAudioRecordingData = function(recordId){
        var i, event, sampleId;

        for(i = this.audioEvents.length - 1; i >= 0; i--){
            event = this.audioEvents[i];
            sampleId = event.sampleId;
            if(sampleId === undefined){
                continue;
            }
            if(recordId === sampleId){
                break;
            }
        }
        if(event === undefined){
            return false;
        }
        return event.track.getAudioRecordingData(recordId);
    };


    // non-mandatory arguments: quantize value, history object
    Song.prototype.quantize = function(){
        var i, track, arg, type,
        args = slice.call(arguments),
        numArgs = args.length,
        value,
        historyObject = {};

        //console.log(arguments);

        for(i = 0; i < numArgs; i++){
            arg = args[i];
            type = typeString(arg);
            //console.log(arg, type);
            if(type === 'string' || type === 'number'){
                // overrule the quantize values of all tracks in this song, but the song's quantizeValue doesn't change
                value = arg;
            }else if(type === 'object'){
                historyObject = arg;
            }
        }

        //console.log(value, historyObject)
        for(i = this.numTracks - 1; i >= 0; i--){
            track = this.tracks[i];
            // if no value is specified, use the value of the track
            if(value === undefined){
                value = track.quantizeValue;
            }
            sequencer.quantize(track.events, value, this.ppq, historyObject);
        }

        return historyObject;
        //this.update();
    };


    Song.prototype.undoQuantize = function(history){
        if(history === undefined){
            if(sequencer.debug >= 2){
                console.warn('please pass a quantize history object');
            }
            return;
        }

        var i, track;
        for(i = this.numTracks - 1; i >= 0; i--){
            track = this.tracks[i];
            track.undoQuantize(history);
        }
    };


    Song.prototype.quantizeRecording = function(value){
        var i, track;
        for(i = this.numTracks - 1; i >= 0; i--){
            track = this.tracks[i];
            if(track.recordId === this.recordId){
                track.quantizeRecording(value);
            }
        }
        //this.update();
    };


    // left: song position >= left locator
    Song.prototype.setLeftLocator = function(){
        //var pos = getPosition(this, [].concat(type, value));
        //this.leftLocator = AP.slice.call(arguments);
        var pos = getPosition(this, slice.call(arguments));
        if(pos !== undefined){
            this.loopStartPosition = pos;
            this.loopStart = pos.millis;
            this.loopStartTicks = pos.ticks;
        }
        this.illegalLoop = this.loopStart >= this.loopEnd;
        this.doLoop = (this.illegalLoop === false && this.loop === true);
        this.loopDuration = this.illegalLoop === true ? 0 : this.loopEnd - this.loopStart;
        // if(this.doLoop === false && this.loop === true){
        //     dispatchEvent('loop_off', this);
        // }
        //console.log('left', this.doLoop, this.illegalLoop, this.loop);
        //console.log(pos.millis, pos.millis, pos.ticks);
        //console.log('l', this.loopStartPosition, pos);
    };


    // right: song position < right locator
    Song.prototype.setRightLocator = function(){//(value){
        //var pos = getPosition(this, [].concat(type, value));
        //this.rightLocator = AP.slice.call(arguments);
        var pos = getPosition(this, slice.call(arguments)),
            previousState = this.illegalLoop;
        //var pos = getPosition(this, value);
        if(pos !== undefined){
            this.loopEndPosition = pos;
            this.loopEnd = pos.millis;
            this.loopEndTicks = pos.ticks;
        }
        //console.log(this.loopEnd);
        this.illegalLoop = this.loopEnd <= this.loopStart;
        this.doLoop = (this.illegalLoop === false && this.loop === true);
        this.loopDuration = this.illegalLoop === true ? 0 : this.loopEnd - this.loopStart;
        // if(previousState !== false && this.loop === true){
        //     dispatchEvent('loop_off', this);
        // }
        //console.log('right', this.doLoop, this.illegalLoop, this.loop);
        //console.log(pos.millis, pos.millis, pos.ticks);
        //console.log('r', this.loopEndPosition);
    };


    Song.prototype.setLoop = function(flag){
        if(flag === undefined){
            this.loop = !this.loop;
        }else if(flag === true || flag === false){
            this.loop = flag;
        }else{
            if(sequencer.debug >= 1){
                console.error('pass "true", "false" or no value');
            }
            return;
        }
        this.doLoop = (this.illegalLoop === false && this.loop === true);
    };


    Song.prototype.setPlayhead = function(){
        //console.log('setPlayhead');
        this.jump = true;
        this.scheduler.looped = false;
        this.scheduler.firstRun = true;
        this.timeStamp = sequencer.getTime() * 1000;
        this.startTime = this.timeStamp;
        try{
            this.startTime2 = window.performance.now();
            //this.startTime2 = undefined;
        }catch(e){
            if(sequencer.debug){
                console.log('window.performance.now() not supported');
            }
        }

        if(this.playing){
            this.allNotesOff();
        }

        //console.log(slice.call(arguments));
        var pos = getPosition(this, slice.call(arguments)),
            millis = pos.millis;
        this.startMillis = millis;
        this.playhead.set('millis', millis);
        this.scheduler.setIndex(millis);
        //console.log(pos.bar, this.bar);
        //console.log(this.playhead.activeEvents);
    };


    Song.prototype.addEventListener = function(){
        return addEventListener.apply(this, arguments);
    };


    Song.prototype.removeEventListener = function(){
        removeEventListener.apply(this, arguments);
    };


    Song.prototype.addEvent = Song.prototype.addEvents = function(){
        var track, part;

        track = this.tracks[0];
        if(track === undefined){
            track = sequencer.createTrack();
            this.addTrack(track);
        }
        // we need to find the first part on the track, so update the track if necessary
        if(track.needsUpdate){
            track.update();
        }

        part = track.parts[0];
        if(part === undefined){
            part = sequencer.createPart();
            track.addPart(part);
        }
        part.addEvents.apply(part, arguments);
        //console.log(part.needsUpdate);
        return this;
    };


    Song.prototype.addPart = Song.prototype.addParts = function(){
        var track = this.tracks[0];
        if(track === undefined){
            //console.log('-> create track for parts')
            track = sequencer.createTrack();
            this.addTrack(track);
        }
        //console.log(arguments);
        track.addParts.apply(track, arguments);
        return this;
    };


    Song.prototype.addTrack = function(){
        var args = getArguments(arguments),
            arg0 = args[0],
            numArgs = args.length;

        if(typeString(arg0) === 'array' || numArgs > 1){
            console.warn('please use addTracks() if you want to get more that one tracks');
            args = [arg0];
        }
        return addTracks(args, this)[0];
    };


    Song.prototype.addTracks = function(){
        //console.log(arguments, getArguments(arguments));
        return addTracks(getArguments(arguments), this);
    };


    Song.prototype.getTrack = function(arg){
        return getTrack(arg, this);
    };


    Song.prototype.getTracks = function(){
        var args = getArguments(arguments),
            track, i,
            result = [];
        for(i = args.length - 1; i >= 0; i--){
            track = getTrack(args[i], this);
            if(track){
                result.push(track);
            }
        }
        return result;
    };


    Song.prototype.getPart = function(){
        var args = getArguments(arguments);
        if(args.length > 1){
            console.warn('please use getParts() if you want to get more that one part');
        }
        //@TODO: check if a call is faster
        //return getParts(args, this)[0];
        return getParts.call(this, args)[0];
    };


    Song.prototype.getParts = function(){
        var args = getArguments(arguments);
        //return getParts(args, this);
        return getParts.call(this, args);
    };


    Song.prototype.removeTrack = function(){
        var args = getArguments(arguments);
        //var args = getArguments.apply(null, arguments);
        if(args.length > 1){
            console.warn('please use removeTracks() if you want to remove more that one tracks');
        }
        //return _removeTracks(args, this)[0];
        return _removeTracks.call(this, args)[0];
    };


    Song.prototype.removeTracks = function(){
        return _removeTracks.call(this, getArguments(arguments));
    };


    Song.prototype.setPlaybackSpeed = function(speed) {
        if (speed < 0.01 || speed > 100) {
            console.error('playback speed has to be > 0.01 and < 100');
            return;
        }
        var ticks = this.ticks,
            startLoop, endLoop, newPos;

        this.playbackSpeed = speed;
        //console.log('setPlaybackSpeed -> update()');
        this.update(true);

        // get the new position of the locators after the update
        if(this.loopStartTicks !== undefined){
            startLoop = this.getPosition('ticks', this.loopStartTicks);
            this.loopStart = startLoop.millis;
            this.loopStartTicks = startLoop.ticks;
        }
        if(this.loopEndTicks !== undefined){
            endLoop = this.getPosition('ticks', this.loopEndTicks);
            this.loopEnd = endLoop.millis;
            this.loopEndTicks = endLoop.ticks;
        }

        // get the new position of the playhead after the update
        newPos = this.getPosition('ticks', ticks);
        this.setPlayhead('ticks', newPos.ticks);
    };


    Song.prototype.gridToSong = function(x, y, width, height){
        return gridToSong(this,x,y,width,height);
    };


    Song.prototype.noteToGrid = function(note,height){
        return noteToGrid(note, height, this);
    };


    Song.prototype.eventToGrid = function(event, width, height){
        return eventToGrid(event, width, height, this);
    };


    Song.prototype.positionToGrid = function(position, width){
        return positionToGrid(position, width, this);
    };


    Song.prototype.getPosition = function(){
        //console.log(slice.call(arguments));
        return getPosition(this, slice.call(arguments));
    };


    Song.prototype.ticksToMillis = function(ticks, beyondEndOfSong){
        return ticksToMillis(this, ticks, beyondEndOfSong);
    };


    Song.prototype.millisToTicks = function(millis, beyondEndOfSong){
        return millisToTicks(this, millis, beyondEndOfSong);
    };


    Song.prototype.ticksToBars = function(ticks, beyondEndOfSong){
        return ticksToBars(this, ticks, beyondEndOfSong);
    };


    Song.prototype.millisToBars = function(millis, beyondEndOfSong){
        return millisToBars(this, millis, beyondEndOfSong);
    };


    Song.prototype.barsToTicks = function(){
        return barsToTicks(this, slice.call(arguments));
    };


    Song.prototype.barsToMillis = function(){
        return barsToMillis(this, slice.call(arguments));
    };


    Song.prototype.findEvent = Song.prototype.findEvents = function(pattern){
        return findEvent(this, pattern);
    };


    Song.prototype.findNote = Song.prototype.findNotes = function(pattern){
        return findNote(this, pattern);
    };


    Song.prototype.getStats = function(pattern){
        return getStats(this, pattern);
    };


    Song.prototype.createGrid = function(config){
        if(this.grid === undefined){
            this.grid = createGrid(this, config);
        }else{
            this.grid.update(config);
        }
        return this.grid;
    };


    Song.prototype.update = function(updateTimeEvents){
        //console.log('Song.update()');
        update(this, updateTimeEvents);
    };


    Song.prototype.updateGrid = function(config){
        this.grid.update(config);
        return this.grid;
    };


    Song.prototype.updateTempoEvent = function(event, bpm){
        if(event.type !== sequencer.TEMPO){
            if(sequencer.debug >= 4){
                console.error('this is not a tempo event');
            }
            return;
        }
        if(event.song !== this){
            if(sequencer.debug >= 4){
                console.error('this event has not been added to this song yet');
            }
            return;
        }
        var ticks = this.ticks,
            percentage = this.percentage;
        event.bpm = bpm;
        this.update(true);
        this.updatePlayheadAndLocators(ticks);
    };


    Song.prototype.updateTimeSignatureEvent = function(event, nominator, denominator){
        if(event.type !== sequencer.TIME_SIGNATURE){
            if(sequencer.debug >= 4){
                console.error('this is not a time signature event');
            }
            return;
        }
        if(event.song !== this){
            if(sequencer.debug >= 4){
                console.error('this event has not been added to this song yet');
            }
            return;
        }
        var ticks = this.ticks,
            percentage = this.percentage;
        event.nominator = nominator || event.nominator;
        event.denominator = denominator || event.denominator;
        this.update(true);
        this.updatePlayheadAndLocators(ticks);
    };


    Song.prototype.getTempoEvents = function(){
        return getTimeEvents(sequencer.TEMPO, this);
    };


    Song.prototype.getTimeSignatureEvents = function(){
        return getTimeEvents(sequencer.TIME_SIGNATURE, this);
    };


    Song.prototype.updatePlayheadAndLocators = function(ticks){
        var newStartPos,
            newEndPos,
            startPos = this.loopStartPosition,
            endPos = this.loopEndPosition,
            newPos;

        // get the new position of the locators after the update
        if(startPos !== undefined){
            /*
            newStartPos = this.getPosition('barsbeats', startPos.bar, startPos.beat, startPos.sixteenth, startPos.tick);
            if(newStartPos.ticks > this.durationTicks || newStartPos.bar > this.bars + 1){
                newStartPos = this.getPosition('barsbeats', 1, 1, 1, 0);
                console.log('start', newStartPos.barsAsString);
            }
            */
            newStartPos = this.getPosition('ticks', startPos.ticks);
            this.loopStart = newStartPos.millis;
            this.loopStartTicks = newStartPos.ticks;
            this.loopStartPosition = newStartPos;
        }
        if(endPos !== undefined){
            /*
            newEndPos = this.getPosition('barsbeats', endPos.bar, endPos.beat, endPos.sixteenth, endPos.tick);
            if(newEndPos.ticks > this.durationTicks || newEndPos.bar > this.bars + 1){
                newEndPos = this.getPosition('barsbeats', this.bars, 1, 1, 0);
                console.log('end', newEndPos.barsAsString);
            }
            */
            //console.log('right locator', endPos.barsAsString, endPos.ticks);
            newEndPos = this.getPosition('ticks', endPos.ticks);
            if(newEndPos.ticks > this.durationTicks){
                //console.log('right locator beyond end of song');
                newEndPos = this.getPosition('ticks', this.bars);
            }
            this.loopEnd = newEndPos.millis;
            this.loopEndTicks = newEndPos.ticks;
            this.loopEndPosition = newEndPos;
            //console.log('right locator', newEndPos.barsAsString, newEndPos.ticks);
        }
        //console.log('l', this.loopStartPosition, 'r', this.loopEndPosition);

        // get the new position of the playhead after the update
/*
        newPos = this.getPosition('ticks', ticks);
        if(newPos.ticks > this.durationTicks || newPos.bar > this.bars + 1){
            newPos = this.getPosition('barsbeats', 1, 1, 1, 0);
            //console.log('playhead', newPos.barsAsString);
        }
*/
        newPos = this.getPosition('ticks', ticks);
        if(this.doLoop && newPos.ticks > this.durationTicks){
            //console.log('playhead beyond end of song');
            this.setPlayhead('ticks', 0);
        }else{
            this.setPlayhead('ticks', newPos.ticks);
        }


        this.loopDuration = this.illegalLoop === true ? 0 : this.loopEnd - this.loopStart;
/*
        console.log(percentage);
        newPos = this.getPosition('percentage', percentage);
        this.setPlayhead('ticks', newPos.ticks);
*/
    };


    Song.prototype.setTempo = function(bpm, update){
        var timeEvents = getTimeEvents(sequencer.TEMPO, this),
            i, event,
            ticks = this.ticks,
            percentage = this.percentage,
            ratio = bpm/timeEvents[0].bpm;

        for(i = timeEvents.length - 1; i >= 0; i--){
            event = timeEvents[i];
            event.bpm = ratio * event.bpm;
        }
        this.bpm = bpm;

        if(update === false){
            return;
        }
        //console.log('setTempo -> update()');
        this.update(true);
        this.updatePlayheadAndLocators(ticks);
    };


    Song.prototype.setTimeSignature = function(nominator, denominator, update){
        var timeEvents = getTimeEvents(sequencer.TIME_SIGNATURE, this),
            i, event,
            percentage = this.percentage,
            ticks = this.ticks;

        for(i = timeEvents.length - 1; i >= 0; i--){
            event = timeEvents[i];
            event.nominator = nominator;
            event.denominator = denominator;
        }
        this.nominator = nominator;
        this.denominator = denominator;

        if(update === false){
            return;
        }

        //console.log('setTimeSignature -> update()');
        this.update(true);
        this.updatePlayheadAndLocators(ticks);
    };


    Song.prototype.resetTempo = function(bpm){
        var firstTempoEvent = getTimeEvents(sequencer.TEMPO, this)[0],
            timeEvents = this.timeEvents;

        firstTempoEvent.bpm = bpm;

        timeEvents = removeFromArray2(timeEvents, function(event){
            if(event.type === 0x51){
                return true;
            }
            return false;
        });

        this.numTimeEvents = timeEvents.length;
        this.update(true);
    };


    Song.prototype.resetTimeSignature = function(nominator, denominator){
        var firstTimeSignatureEvent = getTimeEvents(sequencer.TIME_SIGNATURE, this)[0],
            timeEvents = this.timeEvents,
            ticks = this.ticks;

        firstTimeSignatureEvent.nominator = nominator;
        firstTimeSignatureEvent.denominator = denominator;

        timeEvents = removeFromArray2(timeEvents, function(event){
            if(event.type === 0x58){
                return true;
            }
            return false;
        });

        this.numTimeEvents = timeEvents.length;
        this.update(true);
        this.updatePlayheadAndLocators(ticks);
    };


    Song.prototype.addTimeEvent = Song.prototype.addTimeEvents = function(){
        var events = getArguments(arguments),
            ticks = this.ticks,
            i, event, position;

        //console.log(events);

        for(i = events.length - 1; i >= 0; i--){
            event = events[i];
            if(event.className === 'MidiEvent'){
                if(event.type === sequencer.TEMPO){
                    this.timeEvents.push(event);
                }else if(event.type === sequencer.TIME_SIGNATURE){
                    /*
                        A time signature event can only be positioned at the beginning of a bar,
                        so we look for the nearest bar and put the event there.
                    */
                    position = this.getPosition('ticks', event.ticks);
                    if(position.beat > position.nominator/2){
                        position = this.getPosition('barsbeats', position.bar + 1);
                    }else{
                        position = this.getPosition('barsbeats', position.bar);
                    }
                    event.ticks = position.ticks;
                    this.timeEvents.push(event);
                }
            }
        }
        this.numTimeEvents = this.timeEvents.length;
        this.update(true);
        //console.log('addTimeEvents', this.timeEvents);
        this.updatePlayheadAndLocators(ticks);
    };

/*
    Song.prototype.addTimeEvent = function(){
        var events = getArguments(arguments),
            arg0 = events[0],
            numArgs = events.length;

        if(typeString(arg0) === 'array' || numArgs > 1){
            console.warn('please use addTimeEvents() if you want to add more that one time event');
            events = [arg0];
        }
        addTimeEvents(events, this);
    };
*/

    Song.prototype.removeTimeEvent = Song.prototype.removeTimeEvents = function(){
        var tmp = getArguments(arguments),
            i, maxi = tmp.length,
            event,
            ticks = this.ticks,
            events = [];

        for(i = 0; i < maxi; i++){
            event = tmp[i];
            if(event !== this.tempoEvent && event !== this.timeSignatureEvent){
                events.push(event);
            }
        }
        //console.log(events);

        this.timeEvents = removeFromArray(events, this.timeEvents);
        this.numTimeEvents = this.timeEvents.length;
        this.update(true);
        this.updatePlayheadAndLocators(ticks);
    };


    Song.prototype.removeDoubleTimeEvents = function(){
        var events = [],
            i, event, ticks, type,
            eventsByTicks = {
                '81': {},
                '88': {},
            };

        //console.log('before', this.timeEvents);

        for(i = this.timeEvents.length - 1; i >= 0; i--){
            event = this.timeEvents[i];
            if(eventsByTicks[event.type][event.ticks] !== undefined){
                continue;
            }

            type = event.type;
            ticks = event.ticks;
            eventsByTicks[type][ticks] = event;

            if(ticks === 0){
                if(type === 0x51){
                    this.tempoEvent = event;
                }else if(type === 0x58){
                    this.timeSignatureEvent = event;
                }
            }
        }

        objectForEach(eventsByTicks['81'], function(event){
            events.push(event);
        });

        objectForEach(eventsByTicks['88'], function(event){
            events.push(event);
        });

        this.timeEvents = events;
        this.update(true);

        //console.log('after', this.timeEvents);
        //this.timeEvents.forEach(function(event){
        //    console.log(event.barsAsString, event.bpm, event.nominator, event.denominator);
        //});
        //console.log('tempo', this.tempoEvent.bpm, this.tempoEvent.nominator, this.tempoEvent.denominator, this.tempoEvent.barsAsString);
        //console.log('time signature', this.timeSignatureEvent.bpm, this.timeSignatureEvent.nominator, this.timeSignatureEvent.denominator, this.timeSignatureEvent.barsAsString);
    };


    Song.prototype.setPitchRange = function(min, max){
        var me = this;
        me.lowestNote = min;
        me.highestNote = max;
        me.numNotes = me.pitchRange = me.highestNote - me.lowestNote + 1;
    };


    Song.prototype.trim = function(){
        checkDuration(this, true);
    };


    Song.prototype.setDurationInBars = function(bars){
        var me = this,
            removedEvents = me.findEvent('bar > ' + bars),
            removedParts = [],
            changedTracks = [],
            changedParts = [],
            dirtyTracks = {},
            dirtyParts = {};

        //console.log(removedEvents);

        removedEvents.forEach(function(event){
            var trackId = event.trackId,
                partId = event.partId;

            if(dirtyTracks[trackId] === undefined){
                dirtyTracks[trackId] = [];
            }
            dirtyTracks[trackId].push(event);

            if(dirtyParts[partId] === undefined){
                dirtyParts[partId] = event.part;
                //console.log(me.getPart(partId));
            }
        });

        objectForEach(dirtyTracks, function(events, trackId){
            var track = me.getTrack(trackId);
            //console.log(track.name)
            track.removeEvents(events);
            changedTracks.push(track);
        });

        objectForEach(dirtyParts, function(part, partId){
            if(part.events.length === 0){
                //console.log(partId, 'has no events');
                part.track.removePart(part);
                removedParts.push(part);
            }else{
                changedParts.push(part);
            }
        });

        me.bars = bars;
        me.lastBar = bars;

        // user needs to call song.update() after setDurationInBars()!
        //checkDuration(this);

        //console.log(this.ticks);

        return {
            removedEvents: removedEvents,
            removedParts: removedParts,
            changedTracks: changedTracks,
            changedParts: changedParts
        };
    };


    Song.prototype.addEffect = function(){
    };


    Song.prototype.removeEffect = function(){
    };


    Song.prototype.setVolume = function(){ // value, Track, Track, Track, etc. in any order
        var args = slice.call(arguments),
            numArgs = args.length,
            tracks = [],
            value, i;

        function loop(data, i, maxi){
            for(i = 0; i < maxi; i++){
                var arg = data[i],
                    type = typeString(arg);

                if(type === 'array'){
                    loop(arg, 0, arg.length);
                }else if(type === 'number'){
                    value = arg;
                }else if(arg.className === 'Track'){
                    tracks.push(arg);
                }
            }
        }

        if(numArgs === 1){
            value = args[0];
            if(isNaN(value)){
                console.warn('please pass a number');
                return;
            }
            this.volume = value < 0 ? 0 : value > 1 ? 1 : value;
            this.gainNode.gain.value = this.volume;
        }else{
            loop(args, 0, numArgs);
            for(i = tracks.length - 1; i >= 0; i--){
                tracks[i].setVolume(value);
            }
        }
    };


    Song.prototype.getVolume = function(){
        return this.gainNode.gain.value;
    };


    Song.prototype.connect = function(){
        this.gainNode.connect(masterGainNode);
        //this.gainNode.connect(context.destination);
    };


    Song.prototype.disconnect = function(){
        this.gainNode.disconnect(masterGainNode);
        //this.gainNode.disconnect(context.destination);
    };

/*
    Song.prototype.cleanUp = function(){
        // add other references that need to be removed
        this.disconnect(masterGainNode);
        //this.disconnect(context.destination);
    };
*/

    Song.prototype.getMidiInputs = function(cb){
        getMidiInputs(cb, this);
    };


    Song.prototype.getMidiOutputs = function(cb){
        getMidiOutputs(cb, this);
    };


    Song.prototype.setTrackSolo = function(soloTrack, flag){
        var i, track;
        for(i = this.numTracks - 1; i >=0 ; i--){
            track = this.tracks[i];
            if(flag === true){
                track.mute = track === soloTrack ? !flag : flag;
            }else if(flag === false){
                track.mute = false;
            }
            track.solo = track === soloTrack ? flag : false;
        }
    };


    Song.prototype.muteAllTracks = function(flag){
        var i, track;
        for(i = this.numTracks - 1; i >=0 ; i--){
            track = this.tracks[i];
            track.mute = flag;
        }
    };


    Song.prototype.setMetronomeVolume = function(value){
        this.metronome.setVolume(value);
    };

    Song.prototype.configureMetronome = function(config){
        //console.log(config)
        this.metronome.configure(config);
    };

    Song.prototype.resetMetronome = function(){
        this.metronome.reset();
    };


    Song.prototype.setPrecount = function(value){
        this.precount = value;
    };


    Song.prototype.allNotesOff = function(){
        //console.log('song.allNotesOff');
        /*
        var i;
        for(i in this.tracks){
            if(this.tracks.hasOwnProperty(i)){
                this.tracks[i].instrument.allNotesOff();
            }
        }
        */
        objectForEach(this.tracks, function(track){
            track.allNotesOff();
            // track.audio.allNotesOff();
            // track.instrument.allNotesOff();
        });
        this.metronome.allNotesOff();
        this.resetExternalMidiDevices();
    };


    Song.prototype.resetExternalMidiDevices = function(){
        //var time = this.millis + (sequencer.bufferTime * 1000); // this doesn't work, why? -> because the scheduler uses a different time
        var time = this.scheduler.lastEventTime + 100;
        if(isNaN(time)){
            time  = 100;
        }
        //console.log('allNotesOff', this.millis, this.scheduler.lastEventTime, time);
        objectForEach(this.midiOutputs, function(output){
            //console.log(output);
            output.send([0xB0, 0x7B, 0x00], time); // stop all notes
            output.send([0xB0, 0x79, 0x00], time); // reset all controllers
            //output.send([176, 123, 0], sequencer.getTime());
        });
    };


    Song.prototype.addMidiEventListener = function(){
        return addMidiEventListener(arguments, this);
    };


    Song.prototype.removeMidiEventListener = function(id){
        removeMidiEventListener(id, this);
    };


    Song.prototype.removeMidiEventListeners = function(){
        removeMidiEventListener(arguments, this);
    };


    Song.prototype.getMidiInputsAsDropdown = function(config){
        config = config || {
            type: 'input'
        };
        return getMidiPortsAsDropdown(config, this);
    };


    Song.prototype.getMidiOutputsAsDropdown = function(config){
        config = config || {
            type: 'output'
        };
        return getMidiPortsAsDropdown(config, this);
    };

    Song.prototype.setMidiInput = function(id, flag){
        setMidiInput(id, flag, this);
    };


    Song.prototype.setMidiOutput = function(id, flag){
        setMidiOutput(id, flag, this);
    };


    Song.prototype.getNoteLengthName = function(ticks){
        return getNoteLengthName(this, ticks);

/*
        var args = slice(arguments);
        if(args.length > 0){
            pos = getPosition.apply(this, args);
        }
*/
    };

    //sequencer.Song = Song;

    sequencer.createSong = function(config){
        return new Song(config);
    };


    sequencer.protectedScope.addInitMethod(function(){
        context = sequencer.protectedScope.context;
        timedTasks = sequencer.protectedScope.timedTasks;
        repetitiveTasks = sequencer.protectedScope.repetitiveTasks;
        masterGainNode = sequencer.protectedScope.masterGainNode;

        createMidiEvent = sequencer.createMidiEvent;
        createGrid = sequencer.protectedScope.createGrid;

        initMidi = sequencer.protectedScope.initMidiSong;
        setMidiInput = sequencer.protectedScope.setMidiInputSong;
        setMidiOutput = sequencer.protectedScope.setMidiOutputSong;
        getMidiInputs = sequencer.protectedScope.getMidiInputs;
        getMidiOutputs = sequencer.protectedScope.getMidiOutputs;
        addMidiEventListener = sequencer.protectedScope.addMidiEventListener;
        getMidiPortsAsDropdown = sequencer.protectedScope.getMidiPortsAsDropdown;
        removeMidiEventListener = sequencer.protectedScope.removeMidiEventListener;

        getPosition = sequencer.protectedScope.getPosition;
        millisToTicks = sequencer.protectedScope.millisToTicks;
        ticksToMillis = sequencer.protectedScope.ticksToMillis;
        ticksToBars = sequencer.protectedScope.ticksToBars;
        millisToBars = sequencer.protectedScope.millisToBars;
        barsToTicks = sequencer.protectedScope.barsToTicks;
        barsToMillis = sequencer.protectedScope.barsToMillis;

        typeString = sequencer.protectedScope.typeString;
        removeFromArray = sequencer.protectedScope.removeFromArray;
        removeFromArray2 = sequencer.protectedScope.removeFromArray2;
        findEvent = sequencer.findEvent;
        findNote = sequencer.findNote;
        getStats = sequencer.getStats;

        gridToSong = sequencer.gridToSong;
        noteToGrid = sequencer.noteToGrid;
        eventToGrid = sequencer.eventToGrid;
        positionToGrid = sequencer.positionToGrid;

        getArguments = sequencer.protectedScope.getArguments;
        objectForEach = sequencer.protectedScope.objectForEach;
        getNoteLengthName = sequencer.protectedScope.getNoteLengthName;

        update = sequencer.protectedScope.update;
        checkDuration = sequencer.protectedScope.checkDuration;
        addMetronomeEvents = sequencer.protectedScope.addMetronomeEvents;

        followEvent = sequencer.protectedScope.followEvent;
        createPlayhead = sequencer.protectedScope.createPlayhead;
        createScheduler = sequencer.protectedScope.createScheduler;
        createFollowEvent = sequencer.protectedScope.createFollowEvent;
        createMetronome = sequencer.protectedScope.createMetronome;

        addEventListener = sequencer.protectedScope.songAddEventListener;
        removeEventListener = sequencer.protectedScope.songRemoveEventListener;
        dispatchEvent = sequencer.protectedScope.songDispatchEvent;
        addSong = sequencer.protectedScope.addSong;
    });

}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        slice = Array.prototype.slice,

        // import
        typeString, // defined in util.js
        listenerIndex = 0,

        addEventListener,
        removeEventListener,
        dispatchEvent;


    dispatchEvent = function() {
        var i, tmp, listener,
            args = slice.call(arguments),
            numArgs = args.length,
            song = args[0],
            type = args[1],
            params = [];

        //console.log(arguments, args);

        // if there are arguments specified, put them before the argument song
        if(numArgs > 2){
            i = 2;
            while(i < numArgs){
                params.push(args[i]);
                i++;
            }
        }
        params.push(song);

        tmp = song.listeners[type];
        if(tmp === undefined || tmp.length === undefined){
            return;
        }

        for (i = tmp.length - 1; i >= 0; i--) {
            listener = tmp[i];
            listener.callback.apply(null, params);
        }
    };


    //@param: type, callback
    //@param: type, data, callback
    addEventListener = function(){
        var args = slice.call(arguments),
            listenerId,
            type = args[0];

        switch (type) {
            case 'play':
            case 'stop':
            case 'pause':
            case 'end':
            case 'record_start':
            case 'record_stop':
            case 'record_precount':
            case 'record_preroll':
            case 'recorded_events':
            case 'latency_adjusted':
            case 'loop_off':
            case 'loop_on':
            case 'loop': // the playhead jumps from the loop end position to the loop start position
            case 'sustain_pedal':
                if (this.listeners[type] === undefined) {
                    this.listeners[type] = [];
                }
                listenerId = type + '_' + listenerIndex++;
                this.listeners[type].push({
                    id: listenerId,
                    callback: args[1]
                });
                //console.log(type, listenerId);
                return listenerId;
            case 'note':
            case 'event':
            case 'position':
                //console.log(type, args[1], args[2]);
                return this.followEvent.addEventListener(type, args[1], args[2]);
           default:
                console.log(type, 'is not a supported event');
        }
    };


    removeEventListener = function(){
        var args = slice.call(arguments),
            tmp,
            arg0 = args[0],
            callback = args[1],
            type,id,
            filteredListeners = [],
            i, listener;

        if(arg0.indexOf('_') !== -1){
            tmp = arg0.split('_');
            type = tmp[0];
            id = arg0;
        }else{
            type = arg0;
        }

        // an array of listener ids is provided so this is not a transport event -> send to FollowEvent
        if(typeString(type) === 'array'){
            return this.followEvent.removeEventListener(args);
        }


        switch (type) {
            case 'play':
            case 'stop':
            case 'pause':
            case 'end':
            case 'record_start':
            case 'record_stop':
            case 'record_precount':
            case 'record_preroll':
            case 'recorded_events':
            case 'latency_adjusted':
            case 'loop_off':
            case 'loop_on':
            case 'loop': // the playhead jumps from the loop end position to the loop start position
            case 'sustain_pedal':
                tmp = this.listeners[type];
                for(i = tmp.length - 1; i >= 0; i--){
                    listener = tmp[i];
                    // remove by id
                    if(id !== undefined){
                        if(listener.id !== id){
                            filteredListeners.push(listener);
                        }
                    // remove by callback
                    }else if(callback !== undefined && listener.callback !== callback){
                        filteredListeners.push(listener);
                    }
                }
                this.listeners[type] = [].concat(filteredListeners);
                break;
            case 'note':
            case 'event':
            case 'position':
                return this.followEvent.removeEventListener(args);
            default:
                console.error('unsupported event');
        }
    };


    sequencer.protectedScope.songAddEventListener = addEventListener;
    sequencer.protectedScope.songRemoveEventListener = removeEventListener;
    sequencer.protectedScope.songDispatchEvent = dispatchEvent;

    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
    });

}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        //import
        findEvent, // → defined in find_position.js
        typeString, // → defined in util.js
        getPosition, // → defined in get_position.js
        midiEventNameByNumber, // → defined in midi_event_names.js
        midiEventNumberByName, // → defined in midi_event_names.js

        listenerIndex = 0, // global id that increases per created eventlistener

        supportedTimeEvents = {

            //bars and beats
            bar: 1,
            beat: 1,
            sixteenth: 1,
            tick: 0, // the granularity of requestAnimationFrame is too coarse for tick values
            ticks: 1, // from start of song
            barsbeats: 1, // as number (will be interpreted as bar) or as array of numbers: [bar,beat,sixteenth,tick]
            barsandbeats: 1, // same as above

            //time
            hour: 1,
            minute: 1,
            second: 1,
            millisecond: 0, // the granularity of requestAnimationFrame is too coarse for millisecond values
            millis: 1, // from start of song
            time: 1 // as number (will be interpreted as second) or as array of numbers: [hour,minute,second,millisecond]
        },

        supportedOperators = '= == === > >= < <= != !== %=', //'= == === > >= < <= != !== *= ^= ~= $=',
        //supportedOperatorsRegex = new RegExp(' ' + supportedOperators.replace(/\s+/g,' | ').replace(/\*/,'\\*') + ' '),
        supportedOperatorsRegex = new RegExp(' ' + supportedOperators.replace(/\s+/g,' | ') + ' '),


        //private
        getEvents,
        checkOperatorConflict,

        //private class, only accessible in Song
        FollowEvent;


    FollowEvent = function(song){
        this.song = song;

        this.allListenersById = {};
        this.allListenersByType = {};
        this.searchPatterns = [];

        this.eventListenersBySearchstring = {};
        this.positionListenersBySearchstring = {};

        this.allListenersByType = {
            'event': {
                // all events that are registered as event, keys are the event ids, values are array with listener ids
                'instance': {},
                // all events that are registered after a search action, for instance: addEventListener('event', 'velocity > 50', callback)
                'searchstring': {}
            },
            'position': {
                // millis, ticks, time, barsbeats
                'ticks': [],
                // every bar, beat, sixteenth, hour, minute, second
                'repetitive': {},
                // on single conditional values of bar, beat, sixteenth, hour, minute, second, e.g. bar > 3, bar %= 2, bar === 3
                'conditional_simple': {},
                // on conditional values of bar, beat, sixteenth, hour, minute, second, e.g. bar > 3 < 10
                'conditional_complex': {}
            }
        };
    };


    FollowEvent.prototype.updateSong = function(){

        //adjust all event listeners based on registered events and events found by a searchstring

        var i, j, e, eventId, events, tmp, data,
            listenerIds = [], listeners,
            listener, listenerId;

        listeners = this.allListenersByType.event.instance;
        // loop over event ids
        for(eventId in listeners){
            if(listeners.hasOwnProperty(eventId)){
                // check if event has been removed
                if(this.song.eventsById[eventId] === undefined){
                    // get all listeners that are registered to this event and delete them
                    listenerIds = listeners[eventId];
                    for(i = listenerIds.length - 1; i >= 0; i--){
                        listenerId = listenerIds[i];
                        delete this.allListenersById[listenerId];
                    }
                    //delete listeners[eventId];
                    delete this.allListenersByType.event.instance[eventId];
                }
            }
        }

        //console.log(listeners);

        // remove all listeners that are currently bound to found events
        listeners = this.allListenersByType.event.searchstring;
        listenerIds = [];
        for(eventId in listeners){
            // step 1: collect all ids of listeners
            if(listeners.hasOwnProperty(eventId)){
                listenerIds = listenerIds.concat(listeners[eventId]);
            }
        }
        // step 2: delete the listeners
        for(i = listenerIds.length - 1; i >= 0; i--){
            delete this.allListenersById[listenerIds[i]];
        }

        // all event listeners have been removed, now create a new object and run search string on updated song
        this.allListenersByType.event.searchstring = {};
        tmp = this.allListenersByType.event.searchstring;

//@TODO: this can't possibly work!! -> but it actually does..

        for(i = this.searchPatterns.length - 1; i >= 0; i--){
            data = this.searchPatterns[i];
            events = findEvent(this.song, data.searchstring);
            //console.log(data, events);

            //add listeners for both note on and note off and ignore the other event types
            if(tmp.type === 'note'){
                events = findEvent(events, 'type = NOTE_ON OR type = NOTE_OFF');
            }

            for(j = events.length - 1; j >= 0; j--){
                e = events[j];

                listenerId = 'event_' + listenerIndex++;
                listener = {
                    id: listenerId,
                    event: e,
                    type: data.type,
                    subtype: data.subtype,
                    callback: data.callback
                };

                this.allListenersById[listenerId] = listener;

                if(tmp[e.id] === undefined){
                    tmp[e.id] = [];
                }
                tmp[e.id].push(listenerId);
                //listenerIds.push(listenerId);
            }
        }

        //console.log(allListenersByType.event.searchstring);
        //console.log(allListenersByType.event.instance);
        //console.log(allListenersById);
    };


    FollowEvent.prototype.update = function(){
        var
            i,
            position = this.song,
            ticks = position.ticks,
            events = [],
            numEvents,
            event;

        //events = this.song.playhead.activeEvents;
        events = this.song.playhead.collectedEvents;
//      events = this.song.playhead.changedEvents; -> do something with a snapshot here
        numEvents = events.length;
/*
        if(numEvents !== undefined && numEvents > 0){
            console.log(numEvents, position.barsAsString, this.bar, this.beat);
        }
*/
        //call event listeners registered to specific midi events
        for(i = 0; i < numEvents; i++){
            event = events[i];
            //console.log(event.ticks);
            this.callEventListeners(event.id, event);
        }

        this.callListenersPositionTicks(ticks);

        if(position.bar !== this.bar){
            this.bar = position.bar;
            this.callListenersPositionRepetitive('bar');
            this.callListenersPositionConditionalSimple('bar', this.bar);
            this.callListenersPositionConditionalComplex('bar', this.bar);
        }

        if(position.beat !== this.beat){
            this.beat = position.beat;
            this.callListenersPositionRepetitive('beat');
            this.callListenersPositionConditionalSimple('beat', this.beat);
            this.callListenersPositionConditionalComplex('beat', this.beat);
        }

        if(position.sixteenth !== this.sixteenth){
            this.sixteenth = position.sixteenth;
            this.callListenersPositionRepetitive('sixteenth');
            this.callListenersPositionConditionalSimple('sixteenth', this.sixteenth);
            this.callListenersPositionConditionalComplex('sixteenth', this.sixteenth);
        }

        if(position.hour !== this.hour){
            this.hour = position.hour;
            this.callListenersPositionRepetitive('hour');
            this.callListenersPositionConditionalSimple('hour', this.hour);
            this.callListenersPositionConditionalComplex('hour', this.hour);
        }

        if(position.minute !== this.minute){
            this.minute = position.minute;
            this.callListenersPositionRepetitive('minute');
            this.callListenersPositionConditionalSimple('minute', this.minute);
            this.callListenersPositionConditionalComplex('minute', this.minute);
        }

        if(position.second !== this.second){
            this.second = position.second;
            this.callListenersPositionRepetitive('second');
            this.callListenersPositionConditionalSimple('second', this.second);
            this.callListenersPositionConditionalComplex('second', this.second);
        }
    };


    // call callbacks that are bound to a specific event
    FollowEvent.prototype.callEventListeners = function(eventId, event){
        var i, id, tmp,
            listener,
            listenerIds = [];

        tmp = this.allListenersByType.event.instance;
        if(tmp[eventId]){
            listenerIds = listenerIds.concat(tmp[eventId]);
        }

        tmp = this.allListenersByType.event.searchstring;
        if(tmp[eventId]){
            listenerIds = listenerIds.concat(tmp[eventId]);
        }

        if(listenerIds.length > 0){
            //console.log(listenerIds, event.id, event.ticks);
        }

        for(i = listenerIds.length - 1; i >= 0; i--){
            id = listenerIds[i];
            listener = this.allListenersById[id];
            if(listener.called !== true){
                listener.called = true;
                listener.callback(event);
                //console.log('called', event.id)
            }
        }
    };


    // for instance: addEventListener('position', 'bar') -> call callback every bar
    FollowEvent.prototype.callListenersPositionRepetitive = function(positionType){
        var listener,
            listenerIds = this.allListenersByType.position.repetitive[positionType],
            me = this;

        if(listenerIds){
            listenerIds.forEach(function(id){
                listener = me.allListenersById[id];
                listener.callback(listener.searchstring);
            });
        }
    };


    // can be repetitive or fire once:
    // addEventListener('position', 'beat === 2') -> call callback every second beat
    // addEventListener('position', 'bar === 2') -> call callback at start of bar 2
    FollowEvent.prototype.callListenersPositionConditionalSimple = function(positionType, value){
        var listener,
            data,
            operator,
            call = false,
            listenerIds = this.allListenersByType.position.conditional_simple[positionType],
            me = this;

        //console.log(positionType, listenerIds);

        if(listenerIds){
            listenerIds.forEach(function(id){
                // -> check condition
                listener = me.allListenersById[id];
                data = listener.data;
                operator = listener.operator;

                switch(operator){
                    case '>':
                        call = value > data;
                        break;
                    case '<':
                        call = value < data;
                        break;
                    case '%=':
                        //call = (value + 1) % (data + 1) === 0;
                        call = value % data === 0;
                        break;
                    case '!=':
                    case '!==':
                        call = value !== data;
                        break;
                    case '===':
                        call = value === data;
                        break;
                }

                if(call === true){
                    listener.callback(listener.searchstring);
                }
            });
        }
    };


    // for instance: addEventListener('position', 'bar > 2 < 7') -> call callback every bar from bar 3 to 6
    FollowEvent.prototype.callListenersPositionConditionalComplex = function(positionType, value){
        var listener,
            value1,
            value2,
            operator1,
            operator2,
            listenerIds = this.allListenersByType.position.conditional_complex[positionType],
            me = this;

        if(listenerIds){
            listenerIds.forEach(function(id){
                // -> check condition(s)
                listener = me.allListenersById[id];
                value1 = listener.value1;
                value2 = listener.value2;
                operator1 = listener.operator1;
                operator2 = listener.operator2;
                if(operator1 === '<'){
                    if(value < value1 || value > value2){
                        listener.callback(listener.searchstring);
                    }
                }else if(operator1 === '>'){
                    //console.log(value1,value2,value,operator1,operator2);
                    if(value > value1 && value < value2){
                        listener.callback(listener.searchstring);
                    }
                }
            });
        }
    };


    FollowEvent.prototype.callListenersPositionTicks = function(ticks){
        var tmp = this.allListenersByType.position.ticks,
            i, maxi = tmp.length,
            listener;

        for(i = 0; i < maxi; i++){
            listener = this.allListenersById[tmp[i]];
            //console.log(listener,ticks);
            if(ticks >= listener.ticks && ! listener.called){
                listener.callback(listener.searchstring);
                listener.called = true;
            }
        }
    };


    /*
        event types: event, note or position

        event → when the playhead passes the event

        note → both on the note on and the note off event, the events array may be an array of notes or an array of events

        position
            'bar' -> every bar
            'bar = 3' -> start of bar 3
            'bar > 3 < 7' -> every bar after bar 3 and before bar 7

            'beat' -> every beat
            'beat = 3' -> start of beat 3
            'beat > 3' -> every beat after beat 3

            etc.


        addEventListener('event',eventsArray,callback)
        addEventListener('event',findEvent(eventsArray,'type = NOTE_ON'),callback)

        addEventListener('note',eventsArray,callback)
        addEventListener('note',findEvent(eventsArray,'velocity = 90'),callback)

        addEventListener('event','bar > 5', callback)
        addEventListener('note','id = 45654544345',callback)

        addEventListener('position','bar',callback)
        addEventListener('position','bar > 5 < 17',callback)
        addEventListener('position','beat',callback)

        addEventListener('position','second',callback)
        addEventListener('position','second > 5',callback)

        addEventListener('position','barsbeats = 1,2,0,0',callback)


    */

    FollowEvent.prototype.addEventListener = function(type, data, callback){
        var i, events, event, storeArray, tmp, subtype,
            listener, listenerId, listenerIds = [],
            dataType = typeString(data);

        //console.log(type,data,callback);
        //console.log(dataType, data);

        if(typeString(callback) !== 'function'){
            console.error(callback, 'is not a function; please provide a function for callback');
            return -1;
        }


        if(type === 'position'){
            listenerId = this.addPositionEventListener(data, callback);
            //console.log(allListenersByType, allListenersById);
            return listenerId;
        }


        if(dataType === 'string'){
            events = findEvent(this.song, data);
            // store the search string so we can run it again after the song has changed
            this.searchPatterns.push({
                searchstring: data,
                callback: callback,
                type: 'event',
                subtype: 'searchstring'
            });
            //console.log(data, events);

            if(events.length === 0){
                return -1;
            }
            subtype = 'searchstring';
            storeArray = this.allListenersByType.event.searchstring;
            this.eventListenersBySearchstring[data] = tmp = [];
        }else{
            events = getEvents(type, data);
            if(events === -1){
                return -1;
            }
            subtype = 'instance';
            storeArray = this.allListenersByType.event.instance;
        }


        //add listeners for both note on and note off and ignore the other event types
        if(type === 'note'){
            events = findEvent(events, 'type = NOTE_ON OR type = NOTE_OFF');
        }

        for(i = events.length - 1; i >= 0; i--){
            event = events[i];
            listenerId = 'event_' + listenerIndex++;
            listener = {
                id: listenerId,
                event: event,
                type: type,
                subtype: subtype,
                callback: callback
            };

            //allListeners.push(listener);
            this.allListenersById[listenerId] = listener;

            if(storeArray[event.id] === undefined){
                storeArray[event.id] = [];
            }
            storeArray[event.id].push(listenerId);
            listenerIds.push(listenerId);

            if(subtype === 'searchstring'){
                tmp.push(listenerId);
            }
        }
        //console.log(this.allListenersById, this.allListenersByType);

        if(subtype === 'searchstring' || dataType === 'array' || type === 'note'){
            return listenerIds;
        }else{
            //console.log('num listeners:', listenerIds.length);
            return listenerIds[0];
        }
    };


    /*

        'bar'; -> repetitive
        'bar == 3'; -> fire once
        'bar < 3 > 5'; -> conditionally repetitive
        'bar = 3 AND beat > 1' -> not supported here! (doesn't make sense, use events or position instead)

        - check if has valid operators
        - some types need an operator -> filter
        - check values that the operator has to act upon
        - split into repetitive and one-shot listeners

    */
    FollowEvent.prototype.addPositionEventListener = function(data, callback){
        var tmp,
            listenerId, listener,
            millis,
            searchString = data.split(/[\s+]/g),
            len = searchString.length,
            type = searchString[0],
            operator1 = searchString[1],
            value1 = searchString[2],
            operator2 = searchString[3],
            value2 = searchString[4],
            value1Type = typeString(value1);
            //hasOperator = supportedOperatorsRegex.test(data);

        //console.log(data, searchString, len);
        //console.log(type, value1, operator1, value2, operator2);

        if(len !== 1 && len !== 3 && len !== 5){
            console.error('invalid search string, please consult documentation');
            return false;
        }
/*
        //split position data into an array -> is now done in find_event.js -> not anymore ;)
        if(value1 && value1.indexOf(',') !== -1){
            value1 = value1.split(',');
        }

        if(value2 && value2.indexOf(',') !== -1){
            value2 = value2.split(',');
        }
*/

        if(supportedTimeEvents[type] !== 1){
            console.error(type,'is not a supported event id, please consult documentation');
            return -1;
        }

        if(operator1 === '=' || operator1 === '=='){
            operator1 = '===';
        }


        // check values per type

        switch(type){
            // these type can only fire once
            case 'barsbeats':
            case 'barsandbeats':
            case 'time':
            //case 'musical_time':
            //case 'linear_time':
            case 'ticks':
            case 'millis':
                if(operator1 === undefined || operator1 !== '==='){
                    console.error(type,'can only be used conditionally with the operators \'===\', \'==\' or \'=\'');
                    return -1;
                }
                // if(isNaN(value1) && typeString(value1) !== 'array'){
                //  console.error('please provide a number or an array of numbers');
                //  return -1;
                // }
                if(operator2){
                    console.warn('this position event type can only be used with a single condition, ignoring second condition');
                }
                break;

            // these type fire repeatedly or once
            case 'bar': // -> fired once if used with === operator
            case 'beat':
            case 'sixteenth':
            //case 'tick':
            case 'hour': // -> fired once if used with === operator
            case 'minute':
            case 'second':
            //case 'millisecond':

                if(value1 && isNaN(value1)){
                    console.error('please provide a number');
                    return -1;
                }
                if(value2 && isNaN(value2)){
                    console.error('please provide a number');
                    return -1;
                }
                break;
        }


        // check operators

        if(operator1 && supportedOperators.indexOf(operator1) === -1){
            console.error(operator1,'is not a supported operator, please use any of',supportedOperators);
            return -1;
        }

        if(operator1 && value1 === undefined){
            console.error('operator without value');
            return;
        }

        if(operator2 && supportedOperators.indexOf(operator1) === -1){
            console.error(operator2,'is not a supported operator, please use any of',supportedOperators);
            return -1;
        }

        if(operator2 && value2 === undefined){
            console.error('operator without value');
            return;
        }

        if(operator1 && operator2 && checkOperatorConflict(operator1, operator2) === false){
            console.error('you can\'t use ' + operator1 + ' together with ' + operator2);
            return -1;
        }


        // check callback

        if(typeString(callback) !== 'function'){
            console.error(callback, 'is not a function; please provide a function for callback');
            return -1;
        }


        // simplify searchstring and adjust values

        switch(type){

            // event types that fire repeatedly or once

            case 'bar':
            case 'beat':
            case 'sixteenth':
                // make zero based
                value1 = value1 - 0;
                value2 = value2 - 0;
            //case 'tick':
            case 'hour':
            case 'minute':
            case 'second':
            //case 'millisecond':
                // make zero based
                value1 = value1 - 0;
                value2 = value2 - 0;

                // convert <= to < and >= to > to make it easier
                if(operator1){
                    if(operator1 === '<='){
                        value1++;
                        operator1 = '<';
                    }else if(operator1 === '>='){
                        value1--;
                        operator1 = '>';
                    }
                }

                if(operator2){
                    if(operator2 === '<='){
                        value2++;
                        operator2 = '<';
                    }else if(operator2 === '>='){
                        value2--;
                        operator2 = '>';
                    }
                }

                break;


            // event types that fire only once, these get all converted to type 'ticks'

            case 'ticks':
                // we already have the position value in ticks
                value1 = value1 - 0;
                break;


            case 'barsbeats':
            case 'barsandbeats':
            //case 'musical_time':

                // convert position value to ticks
                if(!isNaN(value1)){
                    // only a single number is provided, we consider it to be the bar number
                    value1 = getPosition(this.song, ['barsbeats', value1, 1, 1, 0]).ticks;
                }else if(value1Type === 'string'){
                    // a full barsandbeats array is provided: bar, beat, sixteenth, ticks
                    value1 = value1.replace(/[\[\]\s]/g, '');
                    value1 = value1.split(',');
                    value1 = getPosition(this.song, ['barsbeats', value1[0], value1[1] || 1, value1[2] || 1, value1[3] || 0]).ticks;
/*
                }else if(value1Type === 'array'){
                    // a full barsandbeats array is provided: bar, beat, sixteenth, ticks
                    value1 = getPosition(this.song, ['barsbeats', value1[0], value1[1], value1[2], value1[3]]).ticks;
*/
                }else{
                    console.error('please provide a number or an array of numbers');
                }
                type = 'ticks';
                break;


            case 'millis':
                // convert position value to ticks
                value1 = getPosition(this.song, ['millis', value1]).ticks;
                type = 'ticks';
                break;


            case 'time':
            //case 'linear_time':
                // convert position value to ticks
                if(!isNaN(value1)){
                    // a single number is provided, we treat this as the value for minutes
                    millis = value1 * 60 * 1000; //seconds
                    value1 = getPosition(this.song, ['millis', millis]).ticks;
                }else if(value1Type === 'string'){
                    // a full barsandbeats array is provided: bar, beat, sixteenth, ticks
                    value1 = value1.replace(/[\[\]\s]/g, '');
                    console.log(value1);
                    value1 = value1.split(',');
                    if(value1.length === 1){
                        millis = value1[0] * 60 * 1000;
                        value1 = getPosition(this.song, ['millis', millis]).ticks;
                    }else{
                        value1 = getPosition(this.song, ['time', value1[0], value1[1], value1[2], value1[3]]).ticks;
                    }
/*
                }else if(value1Type === 'array'){
                    // a full time array is provided: hours, minutes, seconds, millis
                    value1 = getPosition(this.song, ['time', value1[0], value1[1], value1[2], value1[3]]).ticks;
*/
                }else{
                    console.error('please provide a number or an array of numbers');
                }
                console.log(value1);
                type = 'ticks';
                break;
        }


        listenerId = 'position_' + listenerIndex++;

        //console.log(value1,value2);

        if(type === 'ticks'){
            //console.log(value1,listenerId)

            listener = {
                id: listenerId,
                callback: callback,
                type: 'position',
                subtype: 'ticks',
                ticks: value1,
                searchstring: data
            };

            this.allListenersByType.position.ticks.push(listenerId);

        }else if(!operator1 && !operator2){
            // every bar, beat, sixteenth, hour, minute, second
            listener = {
                id: listenerId,
                callback: callback,
                type: 'position',
                subtype: 'repetitive',
                position_type: type,
                searchstring: data
            };

            tmp = this.allListenersByType.position.repetitive;
            if(tmp[type] === undefined){
                tmp[type] = [];
            }
            tmp[type].push(listenerId);

        }else if(operator1 && !operator2){
            // every time a bar, beat, sixteenth, hour, minute, second meets a certain simple condition, can be both repetitive and fire once
            listener = {
                id: listenerId,
                callback: callback,
                type: 'position',
                subtype: 'conditional_simple',
                position_type: type,
                data: value1,
                operator: operator1,
                searchstring: data
            };

            tmp = this.allListenersByType.position.conditional_simple;
            if(tmp[type] === undefined){
                tmp[type] = [];
            }
            tmp[type].push(listenerId);

        }else if(operator1 && operator2){
            // every time a bar, beat, sixteenth, hour, minute, second meets a certain complex condition
            listener = {
                id: listenerId,
                callback: callback,
                type: 'position',
                subtype: 'conditional_complex',
                position_type: type,
                value1: value1,
                value2: value2,
                operator1: operator1,
                operator2: operator2,
                searchstring: data
            };

            tmp = this.allListenersByType.position.conditional_complex;
            if(tmp[type] === undefined){
                tmp[type] = [];
            }
            tmp[type].push(listenerId);

        }

        this.allListenersById[listenerId] = listener;
        this.positionListenersBySearchstring[data] = listenerId;
        return listenerId;
    };

    // @param type, data, callback
    // @param id
    FollowEvent.prototype.removeEventListener = function(args){
        var
            //args = Array.prototype.slice.call(arguments),
            arg0,
            numArgs,
            type, subtype, data, callback, id, ids, tmp,
            listener, listenerId,
            event, eventId, eventIds,
            i, j, k, removeMe,
            listenerIds,
            filteredListenerIds = [],
            removedListenerIds = [],
            dataType;

        //console.log(args);
        //args = Array.prototype.slice.call(args[0]);
        arg0 = args[0];
        numArgs = args.length;

        if(numArgs === 1){
            if(typeString(arg0) === 'array'){
                ids = arg0;
            }else{
                ids = [arg0];
            }
            //console.log(ids);

            for(i = ids.length - 1; i >= 0; i--){
                id = ids[i];
                //console.log(id);
                if(this.allListenersById[id] !== undefined){
                    listener = this.allListenersById[id];
                    type = listener.type;
                    subtype = listener.subtype;

                    if(type === 'position'){
                        // reference to an array of all the listeners bound to this event type
                        listenerIds = this.allListenersByType[type][subtype][listener.position_type];
                        // loop over listeners and filter the one that has to be removed
                        for(j = listenerIds.length - 1; j >= 0; j--){
                            listenerId = listenerIds[j];
                            if(listenerId !== id){
                                filteredListenerIds.push(listenerId);
                            }
                        }
                        // add the filtered array back
                        this.allListenersByType[listener.type][listener.subtype][listener.position_type] = [].concat(filteredListenerIds);
                        delete this.allListenersById[id];

                    }else if(type === 'event' || type === 'note'){
                        event = listener.event;
                        eventId = event.id;
                        listenerIds = this.allListenersByType.event[subtype][eventId];
                        for(j = listenerIds.length - 1; j >= 0; j--){
                            listenerId = listenerIds[j];
                            listener = this.allListenersById[listenerId];
                            if(listenerId !== id){
                                filteredListenerIds.push(listenerId);
                                break;
                            }
                        }
                        // add the filtered array back per event
                        this.allListenersByType.event[subtype][eventId] = [].concat(filteredListenerIds);
                        delete this.allListenersById[id];

                        //@TODO: we have to add allListenersByType.notes
/*
                        if(type === 'note'){
                            console.log(event);
                            if(event.type === sequencer.NOTE_ON){
                                eventId = event.midiNote.noteOff.id;
                                tmp = allListenersByType.event[subtype][eventId];
                                listenerIds = listenerIds.concat(tmp);
                            }else if(event.type === sequencer.NOTE_OFF){
                                eventId = event.midiNote.noteOn.id;
                                tmp = allListenersByType.event[subtype][eventId];
                                listenerIds = listenerIds.concat(tmp);
                            }

                            for(j = listenerIds.length - 1; j >= 0; j--){
                                listenerId = listenerIds[j];
                                listener = allListenersById[listenerId];
                                if(listenerId !== id){
                                    filteredListenerIds.push(listenerId);
                                    break;
                                }
                            }
                            // add the filtered array back per event
                            allListenersByType.event[subtype][eventId] = [].concat(filteredListenerIds);
                            delete allListenersById[id];
                        }
*/
                    }

                    //console.log(this.allListenersById,this.allListenersByType);

                }else{
                    console.warn('no event listener found with id', id);
                }
            }

        }else if(numArgs === 2 || numArgs === 3){

            type = args[0];
            data = args[1];
            callback = args[2];
            dataType = typeString(data);

            //console.log(type, data, callback, dataType);

            switch(type){
                case 'position':
                    if(dataType === 'string'){
                        // get the id of the listener by the searchstring
                        id = this.positionListenersBySearchstring[data];
                        // get the listener by id
                        listener = this.allListenersById[id];
                        // reference to an array of all the listeners bound to this event type
                        listenerIds = this.allListenersByType[listener.type][listener.subtype][listener.position_type];
                        // loop over listeners and filter the one that has to be removed
                        for(i = listenerIds.length - 1; i >= 0; i--){
                            listenerId = listenerIds[i];
                            if(listenerId !== id){
                                filteredListenerIds.push(listenerId);
                            }
                        }
                        // add the filtered array back
                        this.allListenersByType[listener.type][listener.subtype][listener.position_type] = [].concat(filteredListenerIds);
                        delete this.allListenersById[id];
                        delete this.positionListenersBySearchstring[data];
                        //console.log(allListenersById, allListenersByType, positionListenersBySearchstring);
                    }
                    break;

                case 'event':
                case 'note':

                    if(dataType === 'string'){
                        // get all listener ids that are connected to this searchstring
                        listenerIds = this.eventListenersBySearchstring[data];
                        for(i = listenerIds.length - 1; i >= 0; i--){
                            // collect all ids of listeners that need to be removed
                            removedListenerIds.push(listenerIds[i]);
                        }

                        // loop over all searchstring listeners and filter the ones that have to be removed
                        eventIds = this.allListenersByType.event.searchstring;
                        for(eventId in eventIds){
                            if(eventIds.hasOwnProperty(eventId)){
                                listenerIds = eventIds[eventId];
                                filteredListenerIds = [];
                                for(i = listenerIds.length - 1; i >= 0; i--){
                                    listenerId = listenerIds[i];
                                    removeMe = false;
                                    for(j = removedListenerIds.length - 1; j >= 0; j--){
                                        //console.log(listenerId, removedListenerIds[j], callback);
                                        if(listenerId === removedListenerIds[j]){
                                            removeMe = true;
                                            /*
                                            if(callback === undefined){
                                                removeMe = true;
                                            }else{
                                                removeMe = allListenersById[listenerId].callback === callback
                                            }
                                            */
                                            break;
                                        }
                                    }
                                    if(removeMe === false){
                                        filteredListenerIds.push(listenerId);
                                    }else{
                                        // remove the listeners from the id library
                                        delete this.allListenersById[listenerIds[i]];
                                    }
                                }
                                // add the filtered array back
                                this.allListenersByType.event.searchstring[eventId] = [].concat(filteredListenerIds);
                            }
                        }
                        // delete the searchstring listeners array
                        delete this.eventListenersBySearchstring[data];
                        //console.log(allListenersById,eventListenersBySearchstring,allListenersByType);

                    }else if(dataType === 'object'){
                        if(data.className !== 'MidiEvent' && data.className !== 'MidiNote'){
                            console.error('please provide a midi event or a midi note');
                            return;
                        }
                        if(data.className === 'MidiNote'){
                            id = data.noteOn.id;
                        }else if(data.className === 'MidiEvent'){
                            id = data.id;
                        }
                        if(this.allListenersByType.event.instance[id] !== undefined){
                            type = 'instance';
                            listenerIds = this.allListenersByType.event.instance[id];
                        }else if(this.allListenersByType.event.searchstring[id] !== undefined){
                            type = 'searchstring';
                            listenerIds = this.allListenersByType.event.searchstring[id];
                        }
                        if(listenerIds === undefined){
                            console.warn('no event listener bound to event with id', id);
                            return;
                        }
                        if(data.className === 'MidiNote'){
                            ids = this.allListenersByType.event[type][data.noteOff.id];
                            listenerIds = listenerIds.concat(ids);
                        }
                        //console.log(listenerIds);
                        for(i = listenerIds.length - 1; i >= 0; i--){
                            listenerId = listenerIds[i];
                            listener = this.allListenersById[listenerId];
                            if(callback && listener.callback !== callback){
                                filteredListenerIds.push(listener.id);
                            }else{
                                delete this.allListenersById[listener.id];
                            }
                            this.allListenersByType.event[type][listener.event.id] = [].concat(filteredListenerIds);
                        }
                        //console.log(allListenersById,allListenersByType);
                    }
                    break;
            }
        }
    };


    // set the 'called' key of every listener to false, this is necessary if the playhead is moved (by a loop of by the user)
    FollowEvent.prototype.resetAllListeners = function(){
        var listeners = this.allListenersById, key, listener;

        for(key in listeners){
            if(listeners.hasOwnProperty(key)){
                listener = listeners[key];
                listener.called = false;
                //console.log(listener);
            }
        }
    };


    getEvents = function(type, data){

        var dataType = typeString(data),
            events = [], i, e;

        if(dataType !== 'array' && data !== undefined && data.className !== 'MidiEvent' && data.className !== 'MidiNote'){
            console.error(data, ' is not valid data for event type \'event\', please consult documentation');
            return -1;
        }

        if(dataType === 'array'){
            for(i = data.length - 1; i >= 0; i--){
                e = data[i];
                if(type === 'event' && e.className !== 'MidiEvent' && e.className !== 'AudioEvent'){
                    console.warn('skipping', e, 'because it is not a MidiEvent nor an AudioEvent');
                    continue;
                }else if(type === 'note' && e.className !== 'MidiNote'){
                    console.warn('skipping', e, 'because it is not a MidiNote');
                    continue;
                }
                events.push(e);
            }
        }else{
            if(type === 'event'){
                if(data.className !== 'MidiEvent' && data.className !== 'AudioEvent'){
                    console.error(data, ' is not a MidiEvent nor an AudioEvent');
                    return -1;
                }else{
                    events = [data];
                }
            }else if(type === 'note'){
                if(data.className !== 'MidiNote'){
                    console.error(data, ' is not a MidiNote');
                    return -1;
                }else{
                    events = [data.noteOn, data.noteOff];
                }
            }
        }

        return events;
    };


    checkOperatorConflict = function(operator1, operator2){

        switch(operator1){
            case '=':
            case '==':
            case '===':
                return false;
        }

        switch(operator2){
            case '=':
            case '==':
            case '===':
                return false;
        }

        return true;
    };


    sequencer.protectedScope.createFollowEvent = function(song){
        return new FollowEvent(song);
    };


    sequencer.protectedScope.addInitMethod(function(){
        typeString = sequencer.protectedScope.typeString;
        getPosition = sequencer.protectedScope.getPosition;
        midiEventNumberByName = sequencer.midiEventNumberByName;
        midiEventNameByNumber = sequencer.midiEventNameByNumber;
        findEvent = sequencer.findEvent;
    });
}());(function(){

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


	positionToSong = function(song,x,y,width,height){
		var ticks,note,position,coordinate;
		//console.log(song.millis,x,y,width,height);

		if(song === undefined){
			console.error('please provide a song');
			return;
		}

		if(x === undefined || y === undefined){
			console.error('please provide a coordinate');
			return;
		}

		if(width === undefined || height === undefined){
			console.error('please provide width and height');
			return;
		}

		ticks = floor((x/width) * song.ticks);
		//note = 127 - floor((y/height) * 128);
		note = song.highestNote - floor((y/height) * song.pitchRange);
		//note = song.highestNote - round((y/height) * song.numNotes);
		
		position = getPosition(song,['ticks',ticks]);
		note = sequencer.createNote(note);

		//console.log(position,note);

		return{
			position: position,
			note: note
		};
	};

	//[song],x,y,width,height
	sequencer.positionToSong = sequencer.coordinatesToPosition = sequencer.gridToSong = function(){
		var args = Array.prototype.slice.call(arguments),
			numArgs = args.length,
			arg0 = args[0];

		//todo: add error messages here
		if(numArgs === 4 && arg0.className !== 'Song'){
			return positionToSong(sequencer.getSong(), arg0, args[1], args[2], args[3]);
		}
		return positionToSong(arg0, args[1], args[2], args[3], args[4]);
	};


	sequencer.songToGrid = function(){
		var args = Array.prototype.slice.call(arguments),
			numArgs = args.length,
			arg0 = args[0],
			arg1 = args[1];

		switch(numArgs){
			case 3:
				eventToGrid(arg0,arg1,args[2]);//event,width,height
				break;
			case 4:
				if(arg0 === 'x'){
					positionToGrid(arg1,args[2],args[3]);//[position], width, height
				}else if(arg0 === 'y'){
					noteToGrid(arg1,args[2],args[3]);//note, width, height
				}
				break;
			case 6:
				break;
			default:
				console.error('wrong number of arguments');

		}

	};

	
	eventToGrid = function(event, width, height, song){
		if(song === undefined){
			song = sequencer.getSong();
		}

		if(event.type !== sequencer.NOTE_ON && event.type !== sequencer.NOTE_OFF){
			console.error('please provide a NOTE_ON or a NOTE_OFF event');
			return null;
		}

		var x = (event.millis/song.durationMillis) * width,
			y,
			note = sequencer.createNote(event.noteNumber);
			//position = sequencer.createPosition('ticks', event.ticks);

		return {
			x: positionToGrid(['ticks', event.ticks],width,song),
			y: noteToGrid(note,height,song)
		};
	};
	
	
	positionToGrid = function(position, width, song){
		if(song === undefined){
			song = sequencer.getSong();
		}

		if(typeString(position) === 'array' || position.type !== 'ticks'){
			position = getPosition(song, position);
		}
		//console.log(position)
		var x = floor(position.ticks/song.quantizeTicks) * song.quantizeTicks;
		//console.log(x, song.ticks, position.data, song.quantizeTicks);
			x = x / song.ticks;
			x = x * width;
		
		//return round(x);
		return x;
	};
	
	
	noteToGrid = function(note, height, song){
		if(song === undefined){
			song = sequencer.getSong();
		}

		var noteNumber = note.number,
			y;

		if(noteNumber < song.lowestNote || noteNumber > song.highestNote){
			console.error('note is out of range of the pitch range of this song');
			return null;
		}

		y = (noteNumber - song.highestNote)/song.pitchRange;
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
	sequencer.protectedScope.addInitMethod(function(){
		getPosition = sequencer.protectedScope.getPosition; 
		floor = sequencer.protectedScope.floor; 
		round = sequencer.protectedScope.round; 
		typeString = sequencer.protectedScope.typeString;
	});

}());


(function(){

    'use strict';

    var
    // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        // import
        getPosition, // -> defined in position.js
        parseTimeEvents, // -> defined in parse_time_events.js
        parseEvents, // -> defined in parse_events.js
        getInstrument, // -> defined in instrument_manager.js
        scheduledTasks, // -> defined in open_module.js

        update,
        update2;


    update = function(song, updateTimeEvents){

        if(sequencer.playing === true){
            scheduledTasks.updateSong = function(){
                update2(song, updateTimeEvents);
            };
            return;
        }
        //console.log('not here while playing');
        update2(song, updateTimeEvents);
    };


    update2 = function(song, updateTimeEvents){
        //console.log('update song');
        //console.time('update song');
        var
            i, id1, id2, id3, tmp,
            track,
            part,
            event,
            note,

            dirtyEvents,
            dirtyNotes,

            newEvents = [],
            changedEvents = [],
            removedEvents = [],
            recordedEvents = [],

            newNotes = [],
            changedNotes = [],
            removedNotes = [],

            newParts = [],
            changedParts = [],
            removedParts = [],

            newTracks = [],
            changedTracks = [],
            removedTracks = [],

            eventsMidiAudioMetronome = [],
            eventsMidiTime = [],
            events = [],
            midiEvents = [],
            audioEvents = [],
            notes = [],
            parts = [],
            tracks = [],

            eventsById = {},
            notesById = {},
            partsById = {};


        if(updateTimeEvents === true){
            //console.log('update time events');
            parseTimeEvents(song);
        }


        for(id1 in song.tracksById){

            if(song.tracksById.hasOwnProperty(id1)){

                track = song.tracksById[id1];

                //console.log('song update', track.needsUpdate);

                if(track.needsUpdate === true){
                    track.update();
                }


                for(id2 in track.partsById){
                    if(track.partsById.hasOwnProperty(id2)){

                        part = track.partsById[id2];
                        //console.log(part.id, part.needsUpdate, part.dirtyEvents);

                        if(part.needsUpdate === true){
                            //console.log('song update calls part.update()');
                            part.update();
                        }

                        //console.log(part);

                        dirtyEvents = part.dirtyEvents;

                        for(id3 in dirtyEvents){
                            if(dirtyEvents.hasOwnProperty(id3)){
                                event = dirtyEvents[id3];
                                switch(event.state){
                                    case 'new':
                                        newEvents.push(event);
                                        break;
                                    case 'recorded':
                                        recordedEvents.push(event);
                                        break;
                                    case 'changed':
                                        changedEvents.push(event);
                                        break;
                                    case 'removed':
                                        removedEvents.push(event);
                                        delete part.eventsById[id3];
                                        break;
                                }
                            }
                        }


                        dirtyNotes = part.dirtyNotes;

                        for(id3 in dirtyNotes){
                            if(dirtyNotes.hasOwnProperty(id3)){
                                note = dirtyNotes[id3];
                                //console.log(note.state);
                                switch(note.state){
                                    case 'new':
                                        newNotes.push(note);
                                        break;
                                    case 'changed':
                                        changedNotes.push(note);
                                        break;
                                    case 'removed':
                                        removedNotes.push(note);
                                        delete part.notesById[id3];
                                        break;
                                }
                            }
                        }

                        part.dirtyEvents = {};
                        part.dirtyNotes = {};
                        /*
                        if(part.state === 'new' && part.track !== track){
                            part.state = 'removed';
                        }
                        console.log(part.state, part.track);
                        */
                        if(part.state !== 'removed'){
                            notes = notes.concat(part.notes);
                            events = events.concat(part.events);
                        } else {
                            removedNotes = removedNotes.concat(part.notes);
                            removedEvents = removedEvents.concat(part.events);
                        }


                        switch(part.state){
                            case 'new':
                                newParts.push(part);
                                partsById[part.id] = part;
                                break;
                            case 'changed':
                                //console.log(part.id);
                                changedParts.push(part);
                                partsById[part.id] = part;
                                break;
                            case 'removed':
                                removedParts.push(part);
                                delete track.partsById[part.id];
                                break;
                        }
                    }
                }

                //events = events.concat(track.events);
                //notes = notes.concat(track.notes);
                parts = parts.concat(track.parts);


                switch(track.state){
                    case 'clean':
                        track.index = tracks.length;
                        tracks.push(track);
                        break;
                    case 'new':
                        newTracks.push(track);
                        track.state = 'clean';
                        track.index = tracks.length;
                        tracks.push(track);
                        break;
                    case 'changed':
                        changedTracks.push(track);
                        track.state = 'clean';
                        track.index = tracks.length;
                        tracks.push(track);
                        break;
                    case 'removed':
                        removedTracks.push(track);
                        delete song.tracksById[track.id];
                        break;
                }
            }
        }


        for(i = removedEvents.length - 1; i >=0; i--){
            event = removedEvents[i];
            event.state = 'clean';
        }

        for(i = removedNotes.length - 1; i >=0; i--){
            note = removedNotes[i];
            note.state = 'clean';
        }

        for(i = removedParts.length - 1; i >=0; i--){
            part = removedParts[i];
            part.state = 'clean';
        }


        // calculate the ticks position of the recorded events
        if(recordedEvents.length > 0){
            parseRecordedEvents(song, recordedEvents);
        }

        events.sort(function(a, b){
            return a.sortIndex - b.sortIndex;
        });

        notes.sort(function(a, b){
            return a.ticks - b.ticks;
        });

        parts.sort(function(a, b){
            return a.ticks - b.ticks;
        });

        for(i = events.length - 1; i >= 0; i--){
            event = events[i];
            eventsById[event.id] = event;
            if(event.type === 'audio'){
                audioEvents.push(event);
            }else{
                midiEvents.push(event);
            }
        }

        for(i = notes.length - 1; i >= 0; i--){
            note = notes[i];
            notesById[note.id] = note;
        }


        if(updateTimeEvents === false){

            //console.log(newEvents);
            //console.log(tmp.length, events.length, newEvents.length, changedEvents.length, song.timeEvents.length, song.metronome.events.length);

            tmp = song.timeEvents.concat(newEvents, changedEvents);
            parseEvents(song, tmp);

            tmp = [].concat(newNotes, changedNotes);
            parseMidiNotes(song, tmp);

            tmp = [].concat(newParts, changedParts);
            parseParts(song, tmp);
        } else {
            // if time events have changed we need to update everything!
            tmp = song.timeEvents.concat(events);
            parseEvents(song, tmp);
            parseMidiNotes(song, notes);
            parseParts(song, parts);
        }

/*
        console.log('  Song.update()');
        console.log('new tracks', newTracks.length);
        console.log('new parts', newParts.length);
        console.log('new events', newEvents.length);
        console.log('changed tracks', changedTracks.length);
        console.log('changed parts', changedParts.length);
        console.log('changed events', changedEvents.length);
        console.log('removed tracks', removedTracks.length);
        console.log('removed parts', removedParts.length);
        console.log('removed events', removedEvents.length);
        console.log('all events', events.length);
        console.log('all parts', parts.length);
        console.log('all tracks', tracks.length);
        console.log('time events', song.timeEvents.length);
        console.log('--------');
*/
/*
        if(changedEvents.length > 0){
            console.log('changed events', changedEvents.length);
            console.log('changed notes', changedNotes.length);
        }
*/


        checkDuration(song);


        // check if we need to generate new metronome events, metronome.update() calls parseMetronomeEvents()
        if(song.metronome.bars !== song.bars){
            //song.metronome.update(song.metronome.bars, song.bars);
            song.metronome.update();
        }else if(updateTimeEvents === true){
            song.metronome.update();
        }

        eventsMidiAudioMetronome = [].concat(midiEvents, audioEvents, song.metronome.events);
        eventsMidiAudioMetronome.sort(function(a, b){
            return a.sortIndex - b.sortIndex;
        });

        eventsMidiTime = [].concat(events, song.timeEvents);
        eventsMidiTime.sort(function(a, b){
            return a.sortIndex - b.sortIndex;
        });

        song.eventsMidiAudioMetronome = eventsMidiAudioMetronome; // all midi, audio and metronome events
        song.eventsMidiTime = eventsMidiTime; // all midi events plus time events
        song.events = events; // all events excluding tempo and time signature events and metronome ticks
        song.midiEvents = midiEvents; // all midi events excluding metronome events
        song.audioEvents = audioEvents;
        song.notes = notes;
        song.parts = parts;
        song.tracks = tracks;

        song.numEvents = events.length;
        song.numNotes = notes.length;
        song.numParts = parts.length;
        song.numTracks = tracks.length;

        song.eventsById = eventsById;
        song.notesById = notesById;
        song.partsById = partsById;

        song.newEvents = newEvents;
        song.changedEvents = changedEvents;
        song.removedEvents = removedEvents;

        song.newNotes = newNotes;
        song.changedNotes = changedNotes;
        song.removedNotes = removedNotes;

        song.newParts = newParts;
        song.changedParts = changedParts;
        song.removedParts = removedParts;


        // update all dependent objects

        song.playhead.updateSong();
        song.playheadRecording.updateSong();
        song.scheduler.updateSong();
        song.scheduler.reschedule();
        song.followEvent.updateSong();

        if(song.grid !== undefined){
            song.grid.update();
        }

        if(song.keyEditor !== undefined){
            song.keyEditor.updateSong({
                numBars: song.bars,
                newEvents: newEvents,
                changedEvents: changedEvents,
                removedEvents: removedEvents,
                newNotes: newNotes,
                changedNotes: changedNotes,
                removedNotes: removedNotes,
                newParts: newParts,
                changedParts: changedParts,
                removedParts: removedParts
            });
        }
    };


    function checkDuration(song, trim){
        var lastEvent = song.lastEventTmp,
            position, key;

        //console.log('checkDuration', lastEvent.barsAsString,lastEvent.bar,song.lastBar);
        //console.log(lastEvent);
        //console.log(song.autoSize);

        if(song.autoSize === false){
            // don't allow the song to grow
            song.lastBar = song.bars;
        }else if(trim){
            // remove bars that don't contain any events(called via song.trim())
            song.lastBar = lastEvent.bar;
        }else{
            // grow if needed
            song.lastBar = Math.max(song.lastBar, lastEvent.bar);
        }

        song.bars = parseInt(song.lastBar);
        position = getPosition(song, ['barsandbeats',
            song.bars,
            lastEvent.nominator,
            lastEvent.numSixteenth,
            lastEvent.ticksPerSixteenth,
            true
        ]);

        //console.log(song.bars, lastEvent.nominator, lastEvent.numSixteenth, lastEvent.ticksPerSixteenth);

        song.durationTicks = position.ticks;
        song.durationMillis = position.millis;
        //console.log(song.bars, '->', position.barsAsString, song.durationMillis, song.durationTicks);

        // update song.lastEvent
        for(key in position){
            if(position.hasOwnProperty(key)){
                //console.log(key, position[key])
                song.lastEvent[key] = position[key];
            }
        }
        //console.log(song.name, song.durationTicks, song.durationMillis, song.bars);
    }


    function parseMetronomeEvents(song, events){
        //console.log('parseMetronomeEvents', events.length);
        var tmp = events.concat(song.timeEvents);
        parseEvents(song, tmp);

        events = events.concat(song.events);
        events.sort(function(a, b){
            return a.sortIndex - b.sortIndex;
        });
        //console.log(1,song.allEvents.length);
        song.eventsMidiAudioMetronome = [].concat(events);
        //console.log(2,song.allEvents.length);
        //console.log(song.allEvents);

        // song.playhead.updateSong();
        // song.scheduler.updateSong();
        // song.scheduler.reschedule();
        // song.followEvent.updateSong();
    }


    function parseParts(song, parts){
        var i, part;

        //console.log(' → parse parts', parts.length);

        for(i = parts.length - 1; i >= 0; i--){
            part = parts[i];
            //part.update();
            //part.track.update();
            part.startPosition = song.getPosition('ticks', part.start.ticks);
            part.endPosition = song.getPosition('ticks', part.end.ticks);
            part.start.millis = part.startPosition.millis;
            part.end.millis = part.endPosition.millis;
            part.duration.millis = part.end.millis - part.start.millis;
            part.state = 'clean';
            //console.log('s', part.start.ticks, 'e', part.end.ticks);
            //console.log('s', part.startPosition.barsAsString, 'e', part.endPosition.barsAsString);
        }
    }


    function parseMidiNotes(song, notes){
        var i, note;

        //console.log(' → parseMidiNotes', notes.length);

        for(i = notes.length - 1; i >= 0; i--){
            note = notes[i];
            //console.log(note);
            if(note.endless === true){
                note.durationTicks = sequencer.ticks - note.noteOn.ticks;
                note.durationMillis = sequencer.millis - note.noteOn.millis;
            } else {
                note.durationTicks = note.noteOff.ticks - note.noteOn.ticks;
                note.durationMillis = note.noteOff.millis - note.noteOn.millis;
            }
            note.ticks = note.noteOn.ticks;
            note.millis = note.noteOn.millis;
            note.number = note.noteOn.noteNumber;
            note.state = 'clean';
        }
    }


    function parseRecordedEvents(song, events){
        var i, timeData,
            position, event,
            time,
            timestamp = song.recordTimestamp,
            startMillis = song.recordStartMillis,
            totalTime = startMillis,
            maxi = events.length,
            playhead = song.playheadRecording;

        //if(startMillis < 0){
        //    playhead.set('millis', 0);
        //}else{
        playhead.set('millis', startMillis);
        //}
        //console.log(song, events, timestamp);
        //console.log('parseRecordedEvents', timestamp, startMillis);

        for(i = 0; i < maxi; i++){
            event = events[i];

            time = (event.recordMillis - timestamp) + startMillis;
            position = playhead.update('millis', time - totalTime); // update by supplying the diff in millis
            totalTime = time;

            timeData = sequencer.getNiceTime(position.millis);

            //console.log(event.ticks, position.ticks);
            //console.log(event.recordMillis, event.recordMillis - timestamp);

            event.ticks = position.ticks;

            event.bpm = position.bpm;
            event.factor = position.factor;
            event.nominator = position.nominator;
            event.denominator = position.denominator;

            event.ticksPerBar = position.ticksPerBar;
            event.ticksPerBeat = position.ticksPerBeat;
            event.ticksPerSixteenth = position.ticksPerSixteenth;

            event.numSixteenth = position.numSixteenth;

            event.millisPerTick = position.millisPerTick;
            event.secondsPerTick = position.secondsPerTick;

            event.millis = position.millis;
            event.seconds = position.millis / 1000;

            event.hour = timeData.hour;
            event.minute = timeData.minute;
            event.second = timeData.second;
            event.millisecond = timeData.millisecond;
            event.timeAsString = timeData.timeAsString;
            event.timeAsArray = timeData.timeAsArray;

            event.bar = position.bar;
            event.beat = position.beat;
            event.sixteenth = position.sixteenth;
            event.tick = position.tick;
            event.barsAsString = position.bar + ':' + position.beat + ':' + position.sixteenth + ':' + position.tick;
            event.barsAsArray = [position.bar, position.beat, position.sixteenth, position.tick];

            event.state = 'clean';
        }

        song.recordStartMillis = undefined;
        song.recordTimestamp = undefined;
    }


    // not in use!
    function sortEvents(events){
        var maxi = events.length,
            i, event, lastTick = -100000,
            buffer,
            newOrder = [];

        for(i = 0; i < maxi; i++){
            event = events[i];
            if(buffer === undefined){
                buffer = [];
            }
            buffer.push(event);
            if(event.ticks !== lastTick){
                if(buffer.length > 1){
                    // console.log('unsorted', buffer.length);
                    // buffer.forEach(function(e){
                    //     console.log(e.ticks, e.type, e.data1, e.data2);
                    // });

                    buffer.sort(function(a, b){

                        // question is: comes a after b

                        if(b.type === 144 && a.type === 128){
                            // note off before note on
                            return false;


                        } else if(b.type === 144 && a.type === 176 && a.data1 === 64 && a.data2 === 127){
                            // sustain pedal down before note on
                            return false;


                        } else if(b.type === 176 && b.data1 === 64 && b.data2 === 127 && a.type === 128){
                            // note off before sustain pedal down
                            return false;


                        } else if(b.type === 128 && a.type === 176 && a.data1 === 64 && a.data2 === 0){
                            // sustain pedal up before note off -> for better performance, the note off event doesn't get added to the sustainPedalSamples array
                            return false;

                        } else if(b.type === 144 && a.type === 176 && a.data1 === 64 && a.data2 === 0){
                            // sustain pedal up before note on
                            return false;


                        } else if(a.type === 176 && a.data1 === 64 && a.data2 === 0 && b.type === 176 && b.data1 === 64 && b.data2 === 127){
                            // sustain pedal up should come before sustain pedal up
                            return false;

                        } else {
                            return true;
                        }
                    });
                    // console.log('sorted');
                    // buffer.forEach(function(e){
                    //     console.log(e.ticks, e.type, e.data1, e.data2);
                    // });
                    // console.log('---');
                    newOrder = newOrder.concat(buffer);
                    buffer = undefined;
                } else {
                    newOrder.push(buffer[0]);
                }
            }
            lastTick = event.ticks;
        }
    }


    sequencer.protectedScope.update = update;
    sequencer.protectedScope.checkDuration = checkDuration;
    sequencer.protectedScope.parseMetronomeEvents = parseMetronomeEvents;

    sequencer.protectedScope.addInitMethod(function(){
        getPosition = sequencer.protectedScope.getPosition;
        parseEvents = sequencer.protectedScope.parseEvents;
        parseTimeEvents = sequencer.protectedScope.parseTimeEvents;
        getInstrument = sequencer.protectedScope.getInstrument;
        scheduledTasks = sequencer.protectedScope.scheduledTasks;
    });

}());
/*
    Events are always added to a Part before they are added to the track, in other words: a Track is a Part container, a Part is an Event container.

    The events array in a Track contains only references to the Events in the Parts.

    Tracks and Parts cannot contain tempo or time signature events, however, if you export Parts or Tracks as midi file you can choose to add the tempo track
    of the song to a Track or a Part. If you export a Part to a Track, it will be converted to a Track containing that Part.

*/

(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        debug = sequencer.debug,

        slice = Array.prototype.slice,

        //import
        createPart, // → defined in part.js
        typeString, // → defined in utils.js
        copyName, // → defined in utils.js
        findItem, // → defined in utils.js
        objectForEach, // → defined in utils.js
        checkPosition, // → defined in get_position.js
        createMidiEvent, // → defined in midi_event.js
        createMidiNote, // → defined in midi_note.js
        context, // -> defined in open_module.js
        createInstrument, // defined in instrument.js
        createAudioTrack, // defined in audio_track.js
        createPanner, // defined in channel_effects.js
        addMidiEventListener, // defined in midi_system.js
        removeMidiEventListener, // defined in midi_system.js
        encodeAudio, // defined in audio_encoder.js


        findEvent, // → defined in find_event.js
        findNote, // → defined in find_event.js
        getStats, // → defined in event_statistics.js

        trackId = 0,

        //public
        Track;


    Track = function(name, type, song){
        this.className = 'Track';
        this.id = 'T' + trackId++ + '' + new Date().getTime();
        //console.log('creating track', this.id, name);
        this.type = type || 'instrument';
        this.name = name || this.id;
        this.song = song;
        this.instrumentName = '';
        this.events = [];
        this.eventsById = {};
        this.notes = [];
        this.notesById = {};
        this.parts = [];
        this.partsById = {};
        this.numParts = 0;
        this.numEvents = 0;
        this.needsUpdate = false;

        //@TODO: create a plugin that gives a pulsating volume effect
        //this.volumeChangeMethod = 'equal_power'; // 'direct', equal_power' or 'linear'

        /* routing */
        this.effects = {};
        this.numEffects = 0;
        this.volume = 1;

        this.input = context.createGainNode();
        this.input.gain.value = 1;

        this.output = context.createGainNode();
        this.output.gain.value = this.volume;

///*
        this.panner = createPanner();
        // input to panner
        this.input.connect(this.panner.node);
        // panner to output, and output to song.gain as soon as the track gets added to a song
        this.panner.node.connect(this.output);
//*/

/*
        this.panner = context.createPanner();
        this.panner.panningModel = 'equalpower';
        this.panner.setPosition(0, 0, 0);

        this.input.connect(this.panner);
        this.panner.connect(this.output);
*/

        this.lastEffect = this.input;

        this.midiInputs = {};
        this.midiOutputs = {};
        this.routeToMidiOut = false;
        this.midiEventListeners = {};
        this.monitor = false;
        this.recordEnabled = false;

        this.mute = false;
        this.solo = false;
        this.channel = 'any'; // note that this is the output channel, i.e. the events of this track are routed to the set channel
        this.quantizeValue = 0;
        this.fixedLengthValue = 0;
        this.autoQuantize = false;
        this.retrospectiveRecording = [];
        this.recordingNotes = {};
        this.enableRetrospectiveRecording = false;
        if(type !== 'metronome'){
            //console.log(this.instrumentName, this.id);
            this.setInstrument(this.instrumentName);
        }
        //this.audio = createAudioTrack(this);
    };


    function getPart(data, track){
        var part = false;
        if(!data){
            part = false;
        }else if(data.className === 'Part'){
            part = data;
        }else if(typeString(data) === 'string'){
            part = track.partsById[data];
        }else if(isNaN(data) === false){
            part = track.parts[data];
        }
        return part;
    }


    function getEvent(data, track){
        var event = false;
        if(!data){
            event = false;
        }else if(data.className === 'MidiEvent' || data.className === 'AudioEvent'){
            event = data;
        }else if(typeString(data) === 'array' && data.length === 4){
            // new event as array
            event = createMidiEvent(data);
        }else if(typeString(data) === 'string'){
            // get event by id
            event = track.eventsById[data];
        }else if(isNaN(data) === false){
            // get event by index
            event = track.events[data];
        }
        return event;
    }


    function getPartsAndConfig(args, track){
        args = Array.prototype.slice.call(args);
        var
            j = 0,
            i = 0,
            maxi,
            part,
            arg,
            arg0 = args[0],
            parts = [],
            config = [];

        //console.log(args, track);
        //console.log(args);
        //console.log(arg0);

        if(typeString(arg0) === 'array'){

            for(i = arg0.length - 1; i >= 0; i--){
                arg = arg0[i];
                part = getPart(arg, track);
                if(part){
                    parts.push(part);
                }
            }
            j = parts.length === 0 ? 0 : 1;
        }

        maxi = args.length;
        for(i = j; i < maxi; i++){
            arg = args[i];
            part = getPart(arg, track);
            if(part){
                parts.push(part);
            }else{
                config.push(arg);
            }
        }

        if(parts.length === 0){
            //console.error('Please provide one or more parts, or an array of parts');
            console.warn('no parts added');
            return false;
        }
/*
        if(config.length === 1 && typeString(config[0]) === 'array'){
            config = config[0];
        }
*/
        return {
            parts: parts,
            config: config
        };
    }


    function getEventsAndConfig(args, track){
        args = Array.prototype.slice.call(args);

        var
            j = 0,
            i = 0,
            maxi,
            event,
            arg,
            arg0 = args[0],
            events = [],
            config = [];


        if(typeString(arg0) === 'array'){

            for(i = arg0.length - 1; i >= 0; i--){
                arg = arg0[i];
                //@TODO: this can be dangerous!
                //console.log(arg);
                event = getEvent(arg, track);
                //console.log(event);
                if(event){
                    events.push(event);
                }
            }
            //j = events.length === 0 ? 0 : 1;
            j = 1;
        }

        maxi = args.length;
        for(i = j; i < maxi; i++){
            arg = args[i];
            event = getEvent(arg, track);
            if(event){
                events.push(event);
            }else{
                config.push(arg);
            }
        }

        if(events.length === 0){
            if(debug >= 2){
                console.info('Please provide one or more events, or an array of events');
            }
        }

        if(config.length === 1 && typeString(config[0]) === 'array'){
            config = config[0];
        }

        //console.log(events);
        //console.log(config);

        return {
            events: events,
            config: config
        };
    }


    function getTicksAtPosition(position, song){
        var type, ticks;

        position = checkPosition(position);

        if(position === false){
            //console.warn('wrong position data');
            return false;
        }

        type = position[0];

        if(song === undefined && type !== 'ticks'){
            console.error('Track has not been added to a song yet, you can only use tick values');
            return false;
        }

        switch(type){
            case 'ticks':
                ticks = position[1];
                break;
            case 'millis':
                ticks = song.millisToTicks(position[1]);
                break;
            case 'barsbeats':
            case 'barsandbeats':
            case 'time':
                position = song.getPosition(position, 'ticks');
                ticks = position.ticks;
                break;
        }
        //return parseInt(ticks, 10);
        return ticks;
    }


    function addParts(args, track){
        if(args === false){
            return;
        }
        var i, j, e, part, eventsById, ticks, move,
            song = track.song,
            parts = args.parts,
            maxi = parts.length,
            partsById = track.partsById;


        //for(i = parts.length - 1; i >= 0; i--){
        for(i = 0; i < maxi; i++){
            part = getPart(parts[i]);

            if(part === false){
                console.error(part, 'is not a part');
                continue;
            }
            if(part.track !== undefined){
                //console.warn('this part has already been added to track', part.track.id, ', adding a copy');
                part = part.copy();
            }
            if(part.hasAudioEvents && track.audio === undefined){
                track.audio = createAudioTrack(track);
            }

            //console.log(part.id, part.trackId);

            part.song = song;
            part.track = track;
            part.trackId = track.id;

            eventsById = part.eventsById;
            ticks = part.ticks;
            move = ticks !== 0;

            //console.log(part.id, move, eventsById);

            for(j in eventsById){
                if(eventsById.hasOwnProperty(j)){
                    e = eventsById[j];
                    //console.log(e, track, track.id);
                    e.track = track;
                    e.channel = track.channel;
                    e.trackId = track.id;
                    if(move){
                        e.ticks += ticks;
                    }
                    e.state = 'new';
                }
            }

            part.state = 'new';

            //if(move){
                part.needsUpdate = true;
            //}

            partsById[part.id] = part;
        }

        track.needsUpdate = true;
    }


    function moveParts(args, track){
        if(args === false){
            return;
        }
        var newTicks, part,
            parts = args.parts,
            ticks = args.config[0],
            diffTicks = ticks, i;

        //console.log('moveParts',parts);

        for(i = parts.length - 1; i >= 0; i--){
            part = parts[i];
            newTicks = part.ticks + ticks;

            //console.log(newTicks, ticks, part.ticks);

            if(newTicks < 0){
                newTicks = 0;
                diffTicks = -part.ticks;
            }

            part.ticks = newTicks;
            //console.log(part.events, diffTicks);
            part.moveEvents(part.events, diffTicks);
            if(part.state !== 'new'){
                part.state = 'changed';
            }
            //console.log('Track.moveParts()', part.state);
        }
        track.needsUpdate = true;
    }


    function movePartsTo(args, track){
        if(args === false){
            return;
        }

        var i, part, ticks, diffTicks,
            song = track.song,
            parts = args.parts,
            positions = args.config;

        for(i = parts.length - 1; i >= 0; i--){
            part = parts[i];
            ticks = getTicksAtPosition(positions[i], song);
            // /console.log(ticks, positions[i]);

            if(ticks === false){
                console.warn('wrong position data, skipping part', part.id);
                continue;
            }

            diffTicks = ticks - part.ticks;
            //console.log(part.ticks, ticks, diffTicks);
            part.ticks = ticks;
            part.moveAllEvents(diffTicks);
            //console.log('Track.movePartsTo()', part.state);
            if(part.state !== 'new'){
                part.state = 'changed';
            }
        }

        track.needsUpdate = true;
    }


    function removeParts(args, track){
        if(args === false){
            return [];
        }
        var i, part,
            removed = [],
            tobeRemoved = args.parts;

        if(tobeRemoved === undefined){
            console.log('weird situation, check this when it happens');
            return [];
        }

        for(i = tobeRemoved.length - 1; i >= 0; i--){
            part = tobeRemoved[i];
            //console.log('removing part', part, 'from track', track.id);
            if(part.track !== undefined && part.track !== track){
                console.warn('can\'t remove: this part belongs to track', part.track.id);
                continue;
            }

            removed.push(part);
            part.state = 'removed';
            part.reset(true, true);
        }
        track.needsUpdate = true;
        return removed;
    }


    function removeEvents(args, track){
        if(args === false){
            return;
        }

        var i, part, partId, event, eventsPerPart = {},
            removed = [],
            tobeRemoved = args;//.events;


        for(i = tobeRemoved.length - 1; i >= 0; i--){
            event = tobeRemoved[i];
            if(event.track !== undefined && event.track !== track){
                console.warn('can\'t remove: this event belongs to track', event.track.id);
                continue;
            }
            partId = event.partId;
            if(eventsPerPart[partId] === undefined){
                eventsPerPart[partId] = [];
            }
            eventsPerPart[partId].push(event);
            removed.push(event);
        }

        for(partId in eventsPerPart){
            if(eventsPerPart.hasOwnProperty(partId)){
                part = track.partsById[partId];
                part.removeEvents(eventsPerPart[partId]);
            }
        }

        track.needsUpdate = true;
        return removed;
    }


/*
    getInput = function(){
        var args = Array.prototype.slice.call(arguments),
            loop, arg,
            type, events = [];

        loop = function(data, i, maxi){
            var midiData;
            for(i = 0; i < maxi; i++){
                arg = data[i];
                type = typeString(arg);
                if(arg === undefined){
                    continue;
                }else if(type === 'midimessageevent'){
                    midiData = arg.data;
                    events.push(createMidiEvent(0, midiData[0], midiData[1], midiData[2]));
                }else if(arg.className === 'MidiEvent'){
                    events.push(arg);
                }else if(type === 'array'){
                    loop(arg, 0, arg.length);
                }
            }
        };

        loop(args, 0, args.length);
        return events;
    };
*/

    Track.prototype.addPart = Track.prototype.addParts = function(){//newParts
        //console.log('addPart',arguments);
        var args = getPartsAndConfig(arguments, this);
        addParts(args, this);
    };


    //addPartsAt(part1,part2,'ticks',480,1920); -> no
    //addPartsAt([part1,part2],'ticks',[480,1920]); -> no
    //addPartsAt([part1,part2],['ticks',480,1920]); -> no

    //addPartsAt([part1, part2], [['ticks',480], ['ticks',1920]]); -> yes
    //addPartsAt(part1, part2, ['ticks',480], ['ticks',1920]); -> yes
    //addPartsAt(part1, part2, [['ticks',480], ['ticks',1920]]); -> yes
    //addPartsAt([part1, part2], ['ticks',480], ['ticks',1920]); -> yes

    Track.prototype.addPartAt = Track.prototype.addPartsAt = function(){
        var args = getPartsAndConfig(arguments, this),
            config,
            parts,
            i, part, ticks;

        if(args === false){
            return;
        }

        parts = args.parts;
        config = args.config;

        if(config === undefined){
            console.error('please provide position data');
            return false;
        }

        //console.log('addPartsAt', args.parts, args.config);

        for(i = parts.length - 1; i >= 0; i--){
            part = parts[i];
            if(config[0] === 'ticks'){
                ticks = config[1];
            }else{
                ticks = getTicksAtPosition(config[i], this.song);
            }
            //console.log('addPartsAt',this.id, part.track, part.id, ticks, config[i]);
            //console.log(part.ticks, ticks);
            if(ticks === false){
                continue;
            }
            part.ticks += ticks;
        }

        addParts(args, this);
    };

/*
    Track.prototype.addPartAt = function(part, position){
        var ticks = getTicksAtPosition(position);
        part = getPart(part, this);

        if(ticks === false){
            console.error('please provide a valid position');
            return false;
        }

        if(part === false){
            console.error('please provide a valid part');
            return false;
        }

        part.ticks += ticks;
        //console.log(ticks);
        addParts({parts:[part], config:[]}, this);
    };
*/

    Track.prototype.movePart = Track.prototype.moveParts = function(){//parts, ticks
        var args = getPartsAndConfig(arguments, this);
        moveParts(args, this);
    };


    Track.prototype.movePartTo = Track.prototype.movePartsTo = function(){//selectedParts, position
        console.log('movePartTo', arguments);
        var args = getPartsAndConfig(arguments, this);
        movePartsTo(args, this);
    };


    Track.prototype.moveAllParts = function(ticks){
        this.moveParts({parts: this.parts, config:[ticks]});
    };


    Track.prototype.copyPart = Track.prototype.copyParts = function(){
        var args = getPartsAndConfig(arguments, this),
            selectedParts,
            copiedParts = [];

        if(args === false){
            return;
        }

        if(selectedParts.length === 0){
            console.error('no parts');
            return;
        }
        selectedParts = args.parts;

        selectedParts.forEach(function(part){
            copiedParts.push(part.copy());
        });

        return copiedParts.length === 1 ? copiedParts[0] : copiedParts;
    };


    Track.prototype.removePart = function(){
        var args = getPartsAndConfig(arguments, this),
            removed = removeParts(args, this);
        return removed.length === 1 ? removed[0] : removed;
    };


    Track.prototype.removeParts = function(){
        var args = getPartsAndConfig(arguments, this);
        return removeParts(args, this);
    };


    Track.prototype.getPart = function(arg){
        return getPart(arg);
    };


    Track.prototype.getParts = function(){
        var args = Array.prototype.slice.call(arguments),
            arg,
            result = [],
            loop;

        loop = function(data, i){
            arg = data[i];
            if(typeString(arg) === 'array'){
                loop(arg, 0);
            }else{
                result.push(getPart(arg));
            }
        };

        loop(args, 0);
        return result;
    };


    Track.prototype.getPartAt = Track.prototype.getPartsAt = function(position){
        var ticks = getTicksAtPosition(position, this.song),
            parts = this.parts,
            selectedParts = [];

        if(ticks === false){
            console.error('please provide position as array, for instance: [\'barsandbeats\',5,1,2,0]');
            return;
        }

        parts.forEach(function(part){
            if(part.ticks === ticks){
                selectedParts.push(part);
            }
        });

        return selectedParts;
    };


    Track.prototype.getPartFromTo = Track.prototype.getPartsFromTo = function(from, to){
        var parts = this.parts,
            selectedParts = [],
            fromTicks = getTicksAtPosition(from, this.song),
            toTicks = getTicksAtPosition(to, this.song);

        if(fromTicks === false){
            console.error('invalid position data for from position');
            return;
        }

        if(toTicks === false){
            console.error('invalid position data for from position');
            return;
        }

        parts.forEach(function(part){
            if(fromTicks >= part.start.ticks && fromTicks <= part.end.ticks || toTicks >= part.start.ticks && toTicks <= part.end.ticks){
                selectedParts.push(part);
            }
        });

        return selectedParts;
    };


    Track.prototype.getPartBetween = Track.prototype.getPartBetween = function(from, to){
        var parts = this.parts,
            selectedParts = [],
            fromTicks = getTicksAtPosition(from, this.song),
            toTicks = getTicksAtPosition(toTicks, this.song);

        if(fromTicks === false || toTicks === false){
            console.error('please provide position as array, for instance: [\'barsandbeats\',5,1,2,0]');
            return;
        }

        parts.forEach(function(part){
            if(part.start.ticks >= fromTicks && part.end.ticks <= toTicks){
                selectedParts.push(part);
            }
        });

        return selectedParts;
    };


    Track.prototype.copy = function(){
        var track = new Track(copyName(this.name)),
            part, i, effect,
            parts = this.parts,
            copiedParts = [];

        track.song = null;
        track.instrumentId = this.instrumentId;
        track.numEffects = this.numEffects;
        if(this.numEffects > 0){
            track.effects = {};
            for(i in this.effects){
                if(this.effects.hasOwnProperty(i)){
                    effect = this.effects[i];
                    track.effects[effect.id] = effect.copy();
                }
            }
        }

        for(i = parts.length - 1; i >= 0; i--){
            part = parts[i];
            copiedParts.push(part.copy());
        }
        //console.log(parts.length);
        track.addParts(copiedParts);
        return track;
    };


    Track.prototype.removeEvent = Track.prototype.removeEvents = function(){//events
        var args = getEventsAndConfig(arguments, this);
        removeEvents(args.events, this);
    };


    Track.prototype.removeEventsFromTo = function(from, to){
        console.warn('removeEventsFromTo() is temporarily disabled');
        //removeEventsFromTo(from, to, this);
    };


    Track.prototype.removeEventAt = Track.prototype.removeEventsAt = function(position){
        console.warn('removeEventAt() is temporarily disabled');
        //removeEventsAt(position, this);
    };


    Track.prototype.removeAllEvents = function(){
        removeEvents(this.events, this);
    };


    Track.prototype.transposePart = function(part, semi){
        var stats = part.getStats('noteNumber all'),
            min = 0, max = 127, semi2;
        //console.log('transposePart', semi);
        if(this.song){
            min = this.song.lowestNote;
            max = this.song.highestNote;
        }
        //console.log(stats.min, min, stats.max, max);
        if(stats.min + semi < min){
            semi2 = min - stats.min;
            return;
        }else if(stats.max + semi > max){
            semi2 = max = stats.max;
            return;
        }
        //console.log(semi, semi2);
        part.transposeAllEvents(semi);
    };

    // Track.prototype.addEvents = function(){
    //     var part = sequencer.createPart();
    //     part.addEvents(arguments);
    //     this.addPart(part);
    // };

    // move events
/*
    Track.prototype.moveEvent = Track.prototype.moveEvents = function(){//events, ticks
        var args = getEventsAndConfig(arguments);
        moveEvents(args.config[0], args.events, this);
    };


    Track.prototype.moveEventTo = Track.prototype.moveEventsTo = function(){//events, position
        var args = getEventsAndConfig(arguments);
        moveEventsTo(args.config[0], args.events, this);
    };


    Track.prototype.moveAllEvents = function(ticks){
        moveEvents(ticks, this.events, this);
    };


    Track.prototype.moveAllEventsTo = function(position){
        moveEventsTo(position, this.events, this);
    };


    // copy events

    Track.prototype.copyEvent = Track.prototype.copyEvents = function(){//events
        var args = getEventsAndConfig(arguments);
        return copyEvents(args.events);
    };


    Track.prototype.copyAllEvents = function(){
        return copyEvents(this.events);
    };


    Track.prototype.copyEventTo = Track.prototype.copyEventsTo = function(){//events, position
        var args = getEventsAndConfig(arguments);
        copyEventsTo(args.config[0], args.events, this);
    };


    Track.prototype.copyAllEventsTo = function(position){
        copyEventsTo(position, this.events, this);
    };


    // repeat events

    Track.prototype.repeatEvent = Track.prototype.repeatEvents = function(){//events, config
        var args = getEventsAndConfig(arguments);
        repeatEvents(args.config[0], args.events, this);
    };


    // transpose events

    Track.prototype.transposeEvent = Track.prototype.transposeEvents = function(){//events, semi
        var args = getEventsAndConfig(arguments);
        transposeEvents(args.config[0], args.events);
    };


    Track.prototype.transpose = Track.prototype.transposeAllEvents = function(semi){
        transposeEvents(semi, this.events);
    };
*/

    Track.prototype.reset = function(){
        var id, part;
        this.song = null;
        // fixing issue #5
        if(this.audio){
            this.audio.setSong(null);
        }
        for(id in this.partsById){
            if(this.partsById.hasOwnProperty(id)){
                part = this.partsById[id];
                // don't reset from track, reset from song only
                part.reset(false, true);
                //part.state = 'removed';
            }
        }
        this.needsUpdate = true;
    };


    // find event utils

    Track.prototype.findEvent = function(pattern){
        return findEvent(this, pattern);
    };


    Track.prototype.findNote = function(pattern){
        return findNote(this, pattern);
    };


    Track.prototype.getStats = function(pattern){
        return getStats(this, pattern);
    };


    Track.prototype.update = function(){
        //console.log('track update');
        //@TODO: do we need events and notes in a track?

        this.parts = [];
        this.notes = [];
        this.events = [];

        var i, id, part, event, events, note;
        for(id in this.partsById){
            if(this.partsById.hasOwnProperty(id)){
                part = this.partsById[id];

                if(part.needsUpdate === true){
                    //console.log(part);
                    part.update();
                }

                //console.log(part.events.length, part.keepWhenEmpty);

                if(part.events.length === 0 && part.keepWhenEmpty === false){
                    this.removePart(part);
                }

                if(part.state === 'new' && this.song !== undefined){
                    events = part.events;
                    for(i = events.length - 1; i >= 0; i--){
                        event = events[i];
                        event.song = this.song;
                    }
                }

                if(part.state !== 'removed'){
                    this.parts.push(part);
                    this.notes = this.notes.concat(part.notes);
                    this.events = this.events.concat(part.events);
                }
            }
        }

        this.parts.sort(function(a,b){
            return a.ticks - b.ticks;
        });

        this.notes.sort(function(a,b){
            return a.ticks - b.ticks;
        });

        this.events.sort(function(a,b){
            return a.sortIndex - b.sortIndex;
        });


        this.numEvents = this.events.length;
        this.numNotes = this.notes.length;
        this.numParts = this.parts.length;

        for(i = this.numEvents - 1; i >= 0; i--){
            event = this.events[i];
            this.eventsById[event.id] = event;
        }

        for(i = this.numNotes - 1; i >= 0; i--){
            note = this.notes[i];
            this.notesById[note.id] = note;
        }

        this.needsUpdate = false;
    };


    Track.prototype.getIndex = function(){
        var index = -1,
            tracks = this.song.tracks,
            numTracks = tracks.length,
            track, i;

        if(numTracks > 0){

            for(i = 0; i < numTracks; i++){
                track = tracks[i];
                if(track.id === this.id){
                    index = i;
                    break;
                }
            }
        }
        return index;
    };


    /*

        Track:
         input
         panner
         output


         input
         fx
         panner
         output


         input
         fx
         fx2
         panner
         output

    */

    Track.prototype.addEffect = function(effect, position){
        if(!effect){
            return;
        }
        // //effect.setInput(this.input);
/*
        //this.input.connect(effect.node);
        this.input.disconnect(0);
        try{
            this.input.disconnect(1);
        }catch(e){
            console.log(e);
        }
        effect.setInput(this.input);
        effect.node.connect(this.panner.node);

//CONNNECT
return;
*/

        //console.log(effect);

        this.effects[effect.id] = effect;
        this.numEffects++;

        if(this.lastEffect !== undefined){
            // disconnect output from panner
           this.lastEffect.disconnect(0);
            // try{
            //     this.input.disconnect(1);
            // }catch(e){
            //     console.log(e);
            // }
            // connect output to input of new effect
            effect.setInput(this.lastEffect);
        }
        // connect new effect to panner
        effect.output.connect(this.panner.node);

        // remember the last effect in case we want to add another effect
        this.lastEffect = effect.output;


/*
        if(position !== undefined && isNaN(position) === false){
            this.setEffectPosition(position);
        }else{
            effect.position = this.numEffects;
        }
        this.numEffects++;
*/
    };


    Track.prototype.removeEffect = function(effect){
        if(effect === false){
            return;
        }
        delete this.effects[effect.id];
        this.numEffects--;
    };


    Track.prototype.setEffectPosition = function(effect, position){
        var i, fx, maxi = this.numEffects - 1;

        if(position < 0 || position > maxi){
            return;
        }

        effect.position = position;
        for(i = 0; i < maxi - 1; i++){
            fx = this.effects[i];
            if(fx.position >= position && fx !== effect){
                fx.position += 1;
            }
        }
    };


    Track.prototype.setSolo = function(flag){
        if(flag === undefined){
            flag = !this.solo;
        }
        this.mute = false;
        this.solo = flag;
        if(this.song){
            this.song.setTrackSolo(this, flag);
        }
    };


    Track.prototype.setPartSolo = function(soloPart, flag){
        var i, part;
        for(i = this.numParts - 1; i >=0 ; i--){
            part = this.parts[i];
            if(flag === true){
                part.mute = part === soloPart ? !flag : flag;
            }else if(flag === false){
                part.mute = false;
            }
            part.solo = part === soloPart ? flag : false;
            //console.log(soloPart.id, soloPart.mute, part.id, part.mute);
        }
    };


    Track.prototype.setVolume = function(value){
        if(isNaN(value)){
            if(sequencer.debug >= 1){
                console.error('please pass a number');
            }
        }else if(value < 0 || value > 1){
            if(sequencer.debug >= 1){
                console.error('please pass a float between 0 and 1');
            }
        }else{
            this.volume = value;
            //console.log(value);
            //this.output.gain.value = this.volume; //-> this doesn't work which is weird
            this.input.gain.value = this.volume; // this does work
        }
    };


    Track.prototype.getVolume = function(){
        return this.volume;
    };

    Track.prototype.setPanning = function(value){
        this.panner.setPosition(value);
    };


    Track.prototype.connect = function(node){
        //this.panner.node.connect(node);
        this.output.connect(node);
    };


    Track.prototype.disconnect = function(node){
        //this.panner.node.disconnect(node);
        this.output.disconnect(0);
    };


    function getDefaultInstrumentConfig(track){
        var config;
        if(track.song !== undefined && track.song.defaultInstrument !== undefined ){
            config = findItem(track.song.defaultInstrument, sequencer.storage.instruments);
            //console.log('default instrument song', track.song.defaultInstrument);
        }
        if(config === false || config === undefined){
            config = findItem(sequencer.defaultInstrument, sequencer.storage.instruments);
            //console.log('default instrument sequencer', sequencer.defaultInstrument, config);
            //console.log(sequencer.storage.instruments.heartbeat.sinewave);
        }
        return config;
    }


    Track.prototype.setInstrument = function(arg){
        //console.log('Track.setInstrument()', arg.name, this.name);
        if(arg === '' || arg === undefined || arg === false){
            arg = getDefaultInstrumentConfig(this);
            //console.log('default', arg);
        }
        var instrument = createInstrument(arg);

        //console.log(instrument);

        if(instrument === false){
            instrument = createInstrument(getDefaultInstrumentConfig(this));
        }

/*
        var instrument;

        if(arg === '' || arg === undefined || arg === false){
            getDefaultInstrumentConfig(this);
        }else{
            instrument = createInstrument(arg);
        }

*/
        instrument.track = this;
        // stop possible scheduled notes by the previous instrument
        if(this.instrument){
            this.instrument.allNotesOff();
        }
        this.instrument = instrument;
        this.instrumentId = instrument.name;
        if(this.song){
            this.instrument.song = this.song;
        }
    };


    Track.prototype.setMidiInput = function(id, flag){
        var input, i,
            midiInputs = this.midiInputs,
            availableInputs;

        //console.log(id, flag, this.song.midiInputs[id]);

        flag = flag === undefined ? true : flag;

        if(id === 'all'){
            availableInputs = this.song !== undefined ? this.song.midiInputs : sequencer.midiInputs;
            objectForEach(availableInputs, function(value, key){
                if(flag === true){
                    midiInputs[key] = value;
                }else{
                    delete midiInputs[key];
                }
            });
            //console.log(sequencer.midiInputs, this.midiInputs, midiInputs);
            return;
        }

        input = this.song.midiInputs[id];
        //console.log(input, id);
        if(input === undefined){
            return;
        }
        //this.midiInputs[id] = flag === true ? input : false;
        if(flag){
            this.midiInputs[id] = input;
        }else{
            delete this.midiInputs[id];
        }
    };


    Track.prototype.setMidiOutput = function(id, flag){
        // a track can, unlike Cubase, send its events to more than one midi output
        flag = flag === undefined ? true : flag;

        //console.log(id, flag, this.song.midiOutputs);

        var output = this.song.midiOutputs[id],
            me = this;

        if(output === undefined){
            return;
        }


        // stop the internal instrument if a midi output has been chosen -> particulary necessary while the song is playing
        if(flag === true){
            this.instrument.allNotesOff();
        }

        //this.midiOutputs[id] = flag === true ? output : false;
        if(flag){
            this.midiOutputs[id] = output;
        }else{
            delete this.midiOutputs[id];
        }

        this.routeToMidiOut = false;

        //console.log(this.midiOutputs[id]);
        objectForEach(this.midiOutputs, function(value, key){
            //console.log(value, key);
            if(value !== false){
                me.routeToMidiOut = true;
            }
        });
        //console.log(output, id, this.routeToMidiOut);
    };


    Track.prototype.prepareForRecording = function(recordId, callback){
        //console.log('prepare', this.recordEnabled, recordId);
        if(this.recordEnabled !== 'midi' && this.recordEnabled !== 'audio'){
            return;
        }
        this.recordPart = sequencer.createPart();
        this.addPart(this.recordPart);
        //console.log(this.recordPart.needsUpdate);
        this.recordingNotes = {};
        this.recordId = recordId;

        if(this.recordEnabled === 'audio'){
            if(this.audio === undefined){
                this.audio = createAudioTrack(this);
            }
            this.audio.prepareForRecording(recordId, callback);
        }
        //console.log(this.recordEnabled);
    };


    Track.prototype.stopRecording = function(recordId, callback){
        //console.log(recordId, this.recordId);
        if(this.recordId !== recordId){
            return;
        }

        this.recordingNotes = {};
        if(this.autoQuantize || this.song.autoQuantize){
            if(debug >= 1){
                console.log('performing auto quantize');
            }
            this.quantizeRecording();
        }

        if(this.recordEnabled === 'midi'){
            this.recordPart.update();
            callback(this.recordPart.events);
        }else if(this.recordEnabled === 'audio'){
            var scope = this;
            this.audio.stopRecording(function(recording){

                var event = sequencer.createAudioEvent({
                    ticks: scope.song.recordTimestampTicks,
                    buffer: recording.audioBuffer,
                    sampleId: recording.id,
                });

                scope.recordPart.addEvent(event);
                scope.recordPart.update();
                callback([event]);
            });
        }
    };

/*
    Track.prototype.undoRecording = function(recordId){
        if(this.recordId !== recordId){
            return;
        }
        this.removePart(this.recordPart);
    };
*/

    Track.prototype.undoRecording = function(data){
        var type = typeString(data);
        if(type === 'string'){
            if(this.recordId === data){
                this.removePart(this.recordPart);
            }
        }else if(type === 'array'){
            //console.log(data);
            this.removeEvents(data);
        }
    };


    Track.prototype.setWaveformConfig = function(config){
        this.waveformConfig = config;
        if(this.audio !== undefined){
            this.audio.recorder.waveformConfig = config;
        }
    };


    Track.prototype.getAudioRecordingData = function(recordId){
        if(this.audio === undefined){
            return;
        }
        if(recordId === undefined){
            if(sequencer.debug >= sequencer.WARN){
                console.warn('please provide a recording id');
            }
            return false;
        }
        return sequencer.storage.audio.recordings[recordId];
    };


    Track.prototype.encodeAudioRecording = function(recordId, type, bitrate, callback){
        if(this.audio === undefined){
            return;
        }
        if(recordId === undefined){
            if(sequencer.debug >= sequencer.WARN){
                console.warn('please provide a recording id');
            }
            if(callback){
                callback(false);
            }
            return;
        }

        var recording = sequencer.storage.audio.recordings[recordId];
        encodeAudio(recording.audioBuffer, type, bitrate, function(mp3Data){
            recording.mp3 = mp3Data;
            callback(recording);
        });
    };


    Track.prototype.setAudioRecordingLatency = function(recordId, value, callback){
        if(this.audio !== undefined){
            //console.log(recordId, sequencer.storage.audio.recordings);
            this.audio.setAudioRecordingLatency(recordId, value, function(recording){
                // update all audio events in this song that use this recording

                var i, event, sampleId,
                    audioEvents = this.song.audioEvents;

                for(i = audioEvents.length - 1; i >= 0; i--){
                    event = audioEvents[i];
                    sampleId = event.sampleId;
                    if(sampleId === undefined){
                        continue;
                    }
                    if(recordId === sampleId){
                        event.buffer = recording.audioBuffer;
                    }
                }

                if(callback !== undefined){
                    callback();
                }
            });
        }
    };


    Track.prototype.quantizeRecording = function(value){
        value = value || this.quantizeValue;
        return sequencer.quantize(this.recordPart.events, value, this.song.ppq);
    };


    // non-mandatory arguments: quantize value, history object
    Track.prototype.quantize = function(){
        var i, arg, type,
        args = slice.call(arguments),
        numArgs = args.length,
        value,
        historyObject = {};

        //console.log(arguments);

        for(i = 0; i < numArgs; i++){
            arg = args[i];
            type = typeString(arg);
            //console.log(arg, type);
            if(type === 'string' || type === 'number'){
                // overrule the quantize value of this track with this value
                value = arg;
            }else if(type === 'object'){
                historyObject = arg;
            }
        }

        // no value passed as arguments, use the quantize value of this track
        if(value === undefined){
            value = this.quantizeValue;
        }

        //console.log(value, history);
        return sequencer.quantize(this.events, value, this.song.ppq, history); // sequencer.quantize is defined in quantize_fixed-length.js
    };


    Track.prototype.undoQuantize = function(history){
        if(history === undefined){
            if(sequencer.debug >= 2){
                console.warn('please pass a quantize history object');
            }
            return;
        }

        var events = history.tracks[this.id].quantizedEvents,
            numEvents = events.length,
            i, event;

        for(i = 0; i < numEvents; i++){
            event = events[i];
            event.ticks = history.events[event.id].ticks;
            //console.log(event.ticks, event.type);
        }
    };


    Track.prototype.addMidiEventListener = function(){
        return addMidiEventListener(arguments, this);
    };


    Track.prototype.removeMidiEventListener = function(id){
        removeMidiEventListener(id, this);
    };


    Track.prototype.allNotesOff = function(id){
        if(this.audio){
            this.audio.allNotesOff();
        }
        if(this.instrument){
            this.instrument.allNotesOff();
        }
    };

/*
    Track.prototype.addReverb = function(id, amount){
        var reverb = sequencer.getReverb(id);
        if(reverb !== false){
            reverb = sequencer.createEffect('reverb', reverb);
            reverb.amount = amount < 0 ? 0 : amount > 1 ? 1 : 0.5;
            this.effects.push(reverb);
        }
    };


    Track.prototype.setReverb = function(id, amount){
    };


    Track.prototype.removeReverb = function(id, amount){
    };
*/

    sequencer.protectedScope.Track = Track;

    sequencer.createTrack = function(name,type,song){
        return new Track(name,type,song);
    };

    sequencer.protectedScope.addInitMethod(function(){
        // get the protected scope with all added methods
        var protectedScope = sequencer.protectedScope;

        getStats = sequencer.getStats;
        findEvent = sequencer.findEvent;
        findNote = sequencer.findNote;
        createPart = sequencer.createPart;
        createMidiEvent = sequencer.createMidiEvent;
        createMidiNote = sequencer.createMidiNote;
        createInstrument = sequencer.createInstrument;
        createPanner = sequencer.createPanner;
        encodeAudio = sequencer.encodeAudio;

        context = protectedScope.context;
        findItem = protectedScope.findItem;
        addMidiEventListener = protectedScope.addMidiEventListener;
        removeMidiEventListener = protectedScope.removeMidiEventListener;
        createAudioTrack = sequencer.protectedScope.createAudioTrack;
        checkPosition = protectedScope.checkPosition;
        objectForEach = protectedScope.objectForEach;
        typeString = protectedScope.typeString;
        copyName = protectedScope.copyName;
    });

}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        // import
        context, // defined in open_module.js

        slice = Array.prototype.slice,

        mPow = Math.pow,
        mRound = Math.round,
        mFloor = Math.floor,
        mRandom = Math.random,
        // floor = function(value){
        //  return value | 0;
        // },

        noteLengthNames = {
            1: 'quarter',
            2: 'eighth',
            4: 'sixteenth',
            8: '32th',
            16: '64th'
        },

        foundItem,
        foundFolder;


    function typeString(o){
        if(typeof o != 'object'){
            return typeof o;
        }

        if(o === null){
            return 'null';
        }

        //object, array, function, date, regexp, string, number, boolean, error
        var internalClass = Object.prototype.toString.call(o).match(/\[object\s(\w+)\]/)[1];
        return internalClass.toLowerCase();

    }


    function getNiceTime(millis){
        var h,m,s,ms,
            seconds,
            timeAsString = '';

        seconds = millis/1000; // → millis to seconds
        h = floor(seconds / (60 * 60));
        m = floor((seconds % (60 * 60)) / 60);
        s = floor(seconds % (60));
        ms = round((seconds - (h * 3600) - (m * 60) - s) * 1000);

        timeAsString += h + ':';
        timeAsString += m < 10 ? '0' + m : m;
        timeAsString += ':';
        timeAsString += s < 10 ? '0' + s : s;
        timeAsString += ':';
        timeAsString += ms === 0 ? '000' : ms < 10 ? '00' + ms : ms < 100 ? '0' + ms : ms;

        //console.log(h, m, s, ms);

        return {
            hour:h,
            minute:m,
            second:s,
            millisecond:ms,
            timeAsString:timeAsString,
            timeAsArray:[h,m,s,ms]
        };
    }


    function clone(obj) {
        var attr, copy;
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        copy = obj.constructor();
        for (attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = clone(obj[attr]);
            }
        }
        return copy;
    }


    function copyObject(obj){
        var prop, copy = {};
        if(typeString(obj) !== 'object'){
            return {};
        }
        for(prop in obj){
            if(obj.hasOwnProperty(prop)){
                copy[prop] = obj[prop];
            }
        }
        return copy;
    }


    function copyName(name){
        var i = name.indexOf('_copy'),
            copy,numCopies;

        if(i === -1){
            copy = name + '_copy';
        }else{
            numCopies = name.substring(i+5);
            if(numCopies === ''){
                copy = name + '2';
            }else{
                copy = name.slice(0,-1) + (parseInt(numCopies,10) + 1);
            }
        }
        return copy;
    }


    function removeFromArray(tobeRemoved, array){
        var i, j,
            maxi,
            maxj,
            newArray = [],
            remove,
            elementA, elementB;

        if(typeString(tobeRemoved) !== 'array'){
            tobeRemoved = [tobeRemoved];
        }
        maxi = array.length;
        maxj = tobeRemoved.length;

        for(i = 0; i < maxi; i++){
            elementA = array[i];
            remove = false;
            for(j = 0; j < maxj; j++){
                elementB = tobeRemoved[j];
                if(elementA === elementB){
                    remove = true;
                    break;
                }
            }
            if(remove === false){
                newArray.push(elementA);
            }
        }

        return newArray;
    }


    function removeFromArray2(array, callback){
        var i, maxi = array.length,
            element,
            newArray = [];

        for(i = 0; i < maxi; i++){
            element = array[i];
            if(callback(element) === false){
                newArray.push(element);
            }
        }
        return newArray;
    }


    function round(value, decimals){
        if(decimals === undefined || decimals <= 0){
            return mRound(value);
        }
        var p = mPow(10, decimals);
        //console.log(p, decimals)
        return mRound(value * p)/p;
    }


    function floor(value, decimals){
        if(decimals === undefined || decimals <= 0){
            return mFloor(value);
        }
        var p = mPow(10,decimals);
        //console.log(p,decimals)
        return mFloor(value * p)/p;
    }


    function isEmptyObject(obj, ignore_keys) {
        //console.log('empty',obj)
        if(obj === undefined){
            return false;
        }
        var i, isEmpty = true;
        ignore_keys = ignore_keys || '';
        for(i in obj){
            //console.log(i, ignore_keys.indexOf(i));
            if(obj.hasOwnProperty(i) && ignore_keys.indexOf(i) === -1){
                isEmpty = false;
                break;
            }
        }
        return isEmpty;
        //return Object.getOwnPropertyNames(obj).length === 0;
    }


    function objectForEach(o, cb) {
        var name,
            obj = o;
        for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                //cb.call(this, obj[name], name);
                cb(obj[name], name);
            }
        }
    }


    function objectToArray(obj){
        var i, a = [];
        for(i in obj) {
            if(obj.hasOwnProperty(i)) {
                a.push(obj[i]);
            }
        }
        return a;
    }

    function arrayToObject(arr, property){
        var i, o = {};
        for(i = arr.length - 1; i >= 0; i--){
            o[arr[i][property]] = arr[i];
        }
        return o;
    }


    function createClass(parent, constructor) {
        var thisClass;
        // class constructor
        thisClass = function() {
            this.parent = parent;
            if (arguments.length > 0) {
                parent.apply(this, arguments);
                if (constructor !== undefined) {
                    constructor.apply(this, arguments);
                }
            }
        };
        // inheritance
        thisClass.prototype = Object.create(parent.prototype);
        return thisClass;
    }

    function ajax(config){
        var
            request = new XMLHttpRequest(),
            method = config.method === undefined ? 'GET' : config.method,
            fileSize, promise;

        function executor(resolve, reject){

            reject = reject || function(){};
            resolve = resolve || function(){};

            request.onload = function(){
                if(request.status !== 200){
                    reject(request.status);
                    return;
                }

                if(config.responseType === 'json'){
                    fileSize = request.response.length;
                    resolve(JSON.parse(request.response), fileSize);
                }else{
                    resolve(request.response);
                }
            };

            request.onerror = function(e){
                config.onError(e);
            };

            request.open(method, config.url, true);

            if(config.overrideMimeType){
                request.overrideMimeType(config.overrideMimeType);
            }

            if(config.responseType){
                if(config.responseType === 'json'){
                    request.responseType = 'text';
                }else{
                    request.responseType = config.responseType;
                }
            }

            if(method === 'POST') {
                request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            }

            if(config.data){
                request.send(config.data);
            }else{
                request.send();
            }
        }

        promise = new Promise(executor);
        //console.log(promise);

        if(config.onSuccess !== undefined){
            promise.then(config.onSuccess, config.onError);
        }else{
            return promise;
        }
    }


    function ajax2(config) {

        var request = new XMLHttpRequest(),
            method = config.method === undefined ? 'GET' : config.method,
            fileSize;

        request.onreadystatechange = function() {
            if(request.request === 404){
                //console.error(config.url, '404');
                config.onError(404);
            }
        };

        request.onload = function(){
            if(request.status !== 200){
                //console.error(config.url, request.status);
                config.onError(request.status);
                return;
            }
            // this doesn't work with gzip server compression!
            //fileSize = round(request.getResponseHeader('Content-Length')/1024/1024, 2);
            //console.log(fileSize);
            //console.log(config.url, request.getResponseHeader('Content-Length'));
            //console.log(sequencer.os, request.response);

            //if(sequencer.os === 'ios' && config.responseType === 'json'){
            if(config.responseType === 'json'){
                //fileSize = round(request.response.length/1024/1024, 2);
                fileSize = request.response.length;
                //console.log(config.url, fileSize)
                config.onSuccess(JSON.parse(request.response), fileSize);
                //config.onSuccess(JSON.parse(request.response));
            }else{
                //config.onSuccess(request.response, fileSize);
                config.onSuccess(request.response);
            }
        };

        request.onerror = function(e){
            //console.error(e);
            config.onError(e);
        };

/*
        request.onreadystatechange = function() {
            if (success !== undefined && xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                success(request.responseText);
            } else if (error !== undefined ) {
                error(request);
            }
        };
*/
        request.open(method, config.url, true);


        if(config.overrideMimeType){
            request.overrideMimeType(config.overrideMimeType);
        }

        if(config.responseType){
            //console.log(config.responseType, config.url);
            //request.setRequestHeader('Content-type', 'application/' + config.responseType);

            //if(sequencer.os === 'ios' && config.responseType === 'json'){
            if(config.responseType === 'json'){
                request.responseType = 'text';
            }else{
                request.responseType = config.responseType;
            }

            //request.setRequestHeader('Content-type', config.responseType);
        }

        if(method === 'POST') {
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }

        if(config.data){
            request.send(config.data);
        }else{
            request.send();
        }
    }

    function loop2(root, id, indent){
        var i, tmp;
        for(i in root){
            if(foundFolder !== false){
                return;
            }
            if(root.hasOwnProperty(i)){
                tmp = root[i];
                if(tmp !== undefined && tmp.className === 'Folder'){
                    //console.log(indent, i, id);
                    if(i === id){
                        foundFolder = tmp;
                        return;
                    }else{
                        loop2(tmp, id, indent + '.');
                    }
                }
            }
        }
    }


    function loop3(folder, items, search_subfolders, indent){
        var i, item;
        for(i in folder){
            if(folder.hasOwnProperty(i)){
                if(i === 'id' || i === 'path' || i === 'className'){
                    continue;
                }
                item = folder[i];

                if(item === undefined){
                    continue;
                }

                //console.log(indent, i, item, item.className);
                if(item.className === 'Folder'){
                    if(search_subfolders === true){
                        loop3(item, items, search_subfolders, indent + '.');
                    }
                }else{
                    // loaded samples are audio object so they don't have a name, we use the key of the storage for name
                    if(item.name === undefined){
                        items.push({name:i, data: item});
                    }else{
                        items.push(item);
                    }
                }
            }
        }
    }


    function findItemsInFolder(path, root, search_subfolders){
        search_subfolders = search_subfolders === undefined ? true : search_subfolders;
        var folders = pathToArray(path),
            numFolders = folders.length,
            currentFolder, i, folder,
            searchFolder = folders[numFolders - 1],
            items = [];

        if(numFolders === 0){
            // return all items in root folder (for instance sequencer.storage.midi)
            loop3(root, items, search_subfolders, '.');
        }else{
            currentFolder = root;

            for(i = 0; i < numFolders; i++){
                folder = folders[i];
                currentFolder = currentFolder[folder];
                if(currentFolder === undefined){
                    break;
                }
            }
            //console.log(root, currentFolder);
            if(currentFolder){
                loop3(currentFolder, items, search_subfolders, '.');
            }else{
                // declared on top of this file
                foundFolder = false;
                loop2(root, searchFolder, '.');
                loop3(foundFolder, items, search_subfolders, '.');
            }
        }

        items.sort(function(a, b){
            var nameA = a.name.toLowerCase(),
                nameB = b.name.toLowerCase();
            if(nameA < nameB){ //sort string ascending
                return -1;
            }else if (nameA > nameB){
                return 1;
            }
            return 0; //default return value (no sorting)
        });

        return items;
    }


    function loop(obj, id, indent){
        var i, tmp, type;
        for(i in obj){
            if(foundItem !== false){
                return;
            }
            if(obj.hasOwnProperty(i)){
                tmp = obj[i];
                type = typeString(tmp);
                //console.log(indent, i, id, tmp, type, tmp.className)
                if(i === id){
                    foundItem = tmp;
                    break;
                }
                //console.log(tmp);
                // tmp can be null if the sample has not been loaded!
                if(tmp !== undefined && tmp.className === 'Folder'){
                    indent = indent + '.';
                    loop(tmp, id, indent);
                }
            }
        }
    }


    function findItem(path, root, exact_match){
        exact_match = exact_match === undefined ? false : exact_match;
        if(path === undefined || path === ''){
            return root;
        }

        //console.log('findItem', path);
        var i, folder, folders, numFolders, currentFolder, item, itemId;
        folders = pathToArray(path);
        itemId = folders.pop();
        numFolders = folders.length;
        //console.log(folders, itemId);

        if(itemId === ''){
            return root;
        }

        // declared on top of util.js
        foundItem = false;

        if(folders.length > 0){
            currentFolder = root;

            for(i = 0; i < numFolders; i++){
                folder = folders[i];
                currentFolder = currentFolder[folder];
                if(currentFolder === undefined){
                    break;
                }
            }
            //console.log(root, currentFolder);
            if(currentFolder){
                item = currentFolder[itemId];
            }
        }

        if(item === undefined){
            if(exact_match === true){
                item = root[itemId];
            }else{
                loop(root, itemId, '.');
                item = foundItem;
            }
        }
        //console.log(item, itemId, exact_match);
        //console.log('found', root.id, folders, itemId, item);
        if(item === undefined){
            item = false;
        }
        return item;
    }


    function storeItem(item, path, root){
        var folder, folders, numFolders, currentFolder, i, pathString = '';
        folders = pathToArray(path);
        numFolders = folders.length;
        currentFolder = root;

        for(i = 0; i < numFolders; i++){
            folder = folders[i];
            pathString += '/' + folder;
            //console.log(folder);
            if(currentFolder[folder] === undefined){
                currentFolder[folder] = {
                    path: pathString,
                    className: 'Folder'
                };
            }
            if(i === numFolders - 1){
                currentFolder[folder] = item;
                break;
            }
            currentFolder = currentFolder[folder];
        }
    }


    // -> classical/mozart/sonatas/early
    function deleteItem(path, root){
        var item, itemId, i, obj = root;

        // for deleting items you need to specify the complete path, hence the 3rd argument is set to true
        //console.log('deleteItem', path);
        item = findItem(path, root, true);

        /*
            // what was this for, because it doesn't work when deleting samples (as AudioBuffer) from storage.audio:
            item = findItem(path, root);
            console.log(item);
            path = item.folder + '/' + item.name;
            console.log(path);
        */


        if(!item){
            return false;
        }else if(item.className === 'Folder'){
            // remove files in folder
            for(i in item){
                if(item.hasOwnProperty(i)){
                    if(i !== 'className'){
                        delete item[i];
                    }
                }
            }
        }

        path = pathToArray(path);

        while(path.length > 1){
            i = 0;
            obj = root;

            while(i < path.length - 1){
                //console.log(path[i],obj);
                obj = obj[path[i++]];
            }
            //console.log(obj);
            itemId = path[i];
            item = obj[itemId];

            if(item.className === 'Folder'){
                if(isEmptyObject(item, 'path className')){
                    delete obj[itemId];
                    //console.log('deleting empty folder', itemId);
                }
            }else{
                delete obj[itemId];
                //console.log('deleting item', itemId);
            }

            path.pop();
        }

        //console.log(path, path[0] === '', root[path[0]]);

        if(path.length === 1 && path[0] !== ''){
            itemId = path[0];
            item = root[itemId];
            //console.log(path, path.length, itemId);
            if(item.className === 'Folder'){
                if(isEmptyObject(root[itemId], 'path className')){
                    delete root[itemId];
                    //console.log('deleting empty folder', itemId, '(2)');
                }
            }else{
                delete root[itemId];
                //console.log('deleting item', itemId, '(2)');
            }
        }
        return true;
    }


    function parseSample(id, sample){
        return new Promise(function(resolve, reject){
            try{
                context.decodeAudioData(sample,
                    function onSuccess(buffer){
                        //console.log(id, buffer);
                        resolve({'id': id, 'buffer': buffer});
                    },
                    function onError(e){
                        console.log('error decoding audiodata', id, e);
                        //reject(e); // don't use reject because we don't want the parent promise to reject
                        resolve({'id': id, 'buffer': undefined});
                    }
                );
            }catch(e){
                console.log('error decoding audiodata', id, e);
                //reject(e);
                resolve({'id': id, 'buffer': undefined});
            }
        });
    }


    function loadAndParseSample(id, url){
        return new Promise(function(resolve, reject){
            ajax({url: url, responseType: 'arraybuffer'}).then(
                function onFulfilled(data){
                    parseSample(id, data).then(resolve, reject);
                },
                function onRejected(){
                    resolve({'id': id, 'buffer': undefined});
                }
            );
        });
    }


    function parseSamples(mapping){
        var key, sample,
            promises = [];

        for(key in mapping){
            if(mapping.hasOwnProperty(key)){
                sample = mapping[key];
                if(sample.indexOf('http://') === -1){
                    promises.push(parseSample(key, base64ToBinary(sample)));
                }else{
                    promises.push(loadAndParseSample(key, sample));
                }
            }
        }

        return new Promise(function(resolve, reject){
            Promise.all(promises).then(
                function onFulfilled(values){
                    var mapping = {};

                    values.forEach(function(value){
                        mapping[value.id] = value.buffer;
                    });
                    resolve(mapping);
                },
                function onRejected(e){
                    reject(e);
                }
            );
        });
    }


    // use xhr.overrideMimeType('text/plain; charset=x-user-defined');
    // all credits: https://github.com/gasman/jasmid
    function toBinaryString(input){
        /* munge input into a binary string */
        var t,ff,mx,scc,z;
        t = input || '' ;
        ff = [];
        mx = t.length;
        scc= String.fromCharCode;
        for (z = 0; z < mx; z++) {
            ff[z] = scc(t.charCodeAt(z) & 255);
        }
        return ff.join('');
    }


    function toUint8Array(input){
        /* munge input into a binary string */
        var t,uint,mx,scc,z;
        t = input || '' ;
        mx = t.length;
        uint = new Uint8Array(mx);
        scc= String.fromCharCode;
        for (z = 0; z < mx; z++) {
            uint[z] = scc(t.charCodeAt(z) & 255);
        }
        return uint;
    }


    // adapted version of https://github.com/danguer/blog-examples/blob/master/js/base64-binary.js
    function base64ToBinary(input){
        var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
            bytes, uarray, buffer,
            lkey1, lkey2,
            chr1, chr2, chr3,
            enc1, enc2, enc3, enc4,
            i, j = 0;

        bytes = Math.ceil((3 * input.length) / 4.0);
        buffer = new ArrayBuffer(bytes);
        uarray = new Uint8Array(buffer);

        lkey1 = keyStr.indexOf(input.charAt(input.length-1));
        lkey2 = keyStr.indexOf(input.charAt(input.length-1));
        if (lkey1 == 64) bytes--; //padding chars, so skip
        if (lkey2 == 64) bytes--; //padding chars, so skip

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

        for(i = 0; i < bytes; i += 3) {
            //get the 3 octects in 4 ascii chars
            enc1 = keyStr.indexOf(input.charAt(j++));
            enc2 = keyStr.indexOf(input.charAt(j++));
            enc3 = keyStr.indexOf(input.charAt(j++));
            enc4 = keyStr.indexOf(input.charAt(j++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            uarray[i] = chr1;
            if (enc3 != 64) uarray[i+1] = chr2;
            if (enc4 != 64) uarray[i+2] = chr3;
        }
        //console.log(buffer);
        return buffer;
    }


    function pathToArray(path){
        if(path === undefined){
            return [];
        }
        //console.log('path', path);
        path = path.replace(/undefined/g,'');
        path = path.replace(/\/{2,}/g,'/');
        path = path.replace(/^\//,'');
        path = path.replace(/\/$/,'');
        path = path.split('/');
        return path;
    }


    function parseUrl(url){
        var filePath = '',
            fileName = url,
            fileExtension = '',
            slash, dot, ext;

        url = url.replace(/\/{2,}/g,'/');
        url = url.replace(/^\//,'');
        url = url.replace(/\/$/,'');

        // check if the url has a path and/or an extension
        slash = url.lastIndexOf('/');
        if(slash !== -1){
            fileName = url.substring(slash + 1);
            filePath = url.substring(0, slash);
        }

        dot = url.lastIndexOf('.');
        if(dot !== -1){
            ext = url.substring(dot + 1);
            if(ext.length >= 3 && ext.length <= 4){
                fileExtension = ext;
                fileName = url.substring(slash + 1, dot);
            }
        }

        return {
            path: filePath,
            name: fileName,
            ext: fileExtension
        };
    }


    // generic load method that calls the load() method of the item to be loaded
    // callback2 is called every time an item is loaded, callback1 is called after all items have been loaded
    function loadLoop(i, numItems, items, callback1, callback2){
        if(numItems === 0){
            if(callback1){
                callback1();
            }
            return;
        }
        var item = items[i];
        item.load(function(){
            //console.log(item.name, 'loaded', i, numItems);
            if(callback2){
                callback2(arguments);
            }
            i++;
            if(i < numItems){
                loadLoop(i, numItems, items, callback1, callback2);
            }else{
                if(callback1){
                    callback1();
                }
            }
        });
    }


    function getArguments(args){
        var result = [],
            loop, arg;

        args = slice.call(args);

        loop = function(data, i, maxi){
            for(i = 0; i < maxi; i++){
                arg = data[i];
                if(typeString(arg) === 'array'){
                    loop(arg, 0, arg.length);
                }else{
                    result.push(arg);
                }
            }
        };

        loop(args, 0, args.length);
        return result;
    }


    function getEqualPowerCurve(numSteps, type, maxValue) {
        var i, value, percent,
            values = new Float32Array(numSteps);
        for(i = 0; i < numSteps; i++){
            percent = i/numSteps;
            if(type === 'fadeIn'){
                value = Math.cos((1.0 - percent) * 0.5 * Math.PI) * maxValue;
            }else if(type === 'fadeOut'){
                value = Math.cos(percent * 0.5 * Math.PI) * maxValue;
            }
            values[i] = value;
            if(i === numSteps - 1){
                values[i] = type === 'fadeIn' ? 1 : 0;
            }
        }
        return values;
    }


    function remap(value, oldMin, oldMax, newMin, newMax){
        var oldRange = oldMax - oldMin,
            newRange = newMax - newMin,
            result;
        result = (((value - oldMin) * newRange) / oldRange) + newMin;
        return result;
    }


    // filters assets with classname "name" from object "obj" and stores them in array "result"
    function filterItemsByClassName(obj, name, result){
        var i, item, type;

        for(i in obj){
            if(obj.hasOwnProperty(i)){
                item = obj[i];
                if(item.className === name){
                    result.push(item);
                }else{
                    type = typeString(item);
                    if(type === 'object'){
                        loop(item, name, result);
                    }
                }
            }
        }
    }

    function createSlider(config){
        var slider = config.slider,
            message = config.message,
            label = config.label,
            sliderWrapper;
            //mouseDownCalls = [],
            //mouseMoveCalls = [],
            //mouseUpCalls = [];

        if(config.label === undefined){
            label = slider.parentNode.firstChild;
        }

        if(config.initialSliderValue !== undefined){
            slider.value = config.initialSliderValue;
        }

        if(config.initialLabelValue !== undefined){
            label.innerHTML = message.replace('{value}', config.initialLabelValue);
        }

        if(config.min !== undefined){
            slider.min = config.min;
        }

        if(config.max !== undefined){
            slider.max = config.max;
        }

        if(config.step !== undefined){
            slider.step = config.step;
        }


        function onMouseDown(e){
            var value = slider.valueAsNumber;
            if(config.onMouseDown){
                config.onMouseDown(value, e);
            }
            if(sliderWrapper.onMouseDown){
                sliderWrapper.onMouseDown(value, e);
            }
        }

        function onMouseUp(e){
            var value = slider.valueAsNumber;
            if(config.onMouseUp){
                config.onMouseUp(value, e);
            }
            if(sliderWrapper.onMouseUp){
                sliderWrapper.onMouseUp(value, e);
            }
        }

        function onMouseMove(e){
            var value = slider.valueAsNumber;
            if(config.onMouseMove){
                config.onMouseMove(value, e);
            }
            if(sliderWrapper.onMouseMove){
                sliderWrapper.onMouseMove(value, e);
            }
        }

        function onChange(e){
            var value = slider.valueAsNumber;
            if(config.onChange){
                config.onChange(value, e);
            }
            if(sliderWrapper.onChange){
                sliderWrapper.onChange(value, e);
            }
        }

        slider.addEventListener('mousedown', function(e){
            setTimeout(onMouseDown, 0, e);
            slider.addEventListener('mousemove', onMouseMove, false);
        }, false);


        slider.addEventListener('mouseup', function(e){
            setTimeout(onMouseUp, 0, e);
            slider.removeEventListener('mousemove', onMouseMove, false);
        }, false);

        slider.addEventListener('change', function(e){
            //console.log('change');
            onChange(e);
        }, false);

        sliderWrapper = {
            getValue: function(){
                if(config.getValue){
                    return config.getValue(slider.valueAsNumber);
                }else{
                    return slider.valueAsNumber;
                }
            },
            setValue: function(value){
                if(config.setValue){
                    slider.value = config.setValue(value);
                }else{
                    slider.value = value;
                }
            },
            setLabel: function(value){
                label.innerHTML = message.replace('{value}', value);
            },
            elem: slider,
            element: slider,
        };

        sliderWrapper.set = function(value){
            setLabel(value);
            setValue(value);
        };

        return sliderWrapper;
    }

    function createSlider2(config){
        var slider = config.slider,
            message = config.message,
            label = slider.parentNode.firstChild;


        if(config.initialValueSlider){
            slider.value = config.initialValueSlider;
            label.innerHTML = message.replace('{value}', calculate());
        }


        if(config.initialValueLabel){
            label.innerHTML = message.replace('{value}', config.initialValueLabel);
            slider.value = calculateFromLabel(config.initialValueLabel);
        }


        function onMouseMove(){
            var value = calculate();
            if(config.onMouseMove !== undefined){
                config.onMouseMove(slider.valueAsNumber, value);
            }
            label.innerHTML = message.replace('{value}', value);
        }


        function onMouseUp(){
            var value = calculate();
            if(config.onMouseUp !== undefined){
                config.onMouseUp(slider.valueAsNumber, value);
            }
            label.innerHTML = message.replace('{value}', value);
        }


        function onMouseDown(){
            var value = calculate();
            if(config.onMouseDown !== undefined){
                config.onMouseDown(slider.valueAsNumber, value);
            }
            label.innerHTML = message.replace('{value}', value);
        }


        function calculate(){
            var value = slider.valueAsNumber;
            if(config.calculate !== undefined){
                value = config.calculate(value);
            }
            return value;
        }


        function calculateFromLabel(value){
            if(config.calculateFromLabel !== undefined){
                value = config.calculateFromLabel(value);
            }
            return value;
        }


        slider.addEventListener('mousedown', function(){
            setTimeout(onMouseDown, 0);
            slider.addEventListener('mousemove', onMouseMove, false);
        }, false);


        slider.addEventListener('mouseup', function(){
            setTimeout(onMouseUp, 0);
            slider.removeEventListener('mousemove', onMouseMove, false);
        }, false);


        return {
            updateSlider: function(value){
                slider.value = value;
                label.innerHTML = message.replace('{value}', calculate(value));
            },
            updateLabel: function(value){
                label.innerHTML = message.replace('{value}', value);
                slider.value = calculateFromLabel(value);
            },
            getValue1: function(){
                return slider.valueAsNumber;
            },
            getValue2: function(){
                return calculate(slider.valueAsNumber);
            }
        };
    }


    function getRandom(min, max, round){
        var r = mRandom() * (max - min) + min;
        if(round === true){
            return mRound(r);
        }else{
            return r;
        }
    }


    function getRandomNotes(config){
        var i,
            ticks = 0,
            events = [],
            midiEvent,
            velocity,
            numNotes,
            noteNumber,
            noteLength,
            minVelocity,
            maxVelocity,
            minNoteNumber,
            maxNoteNumber,
            ppq;

        //console.log(config);

        config = config || {};
        ppq = config.ppq || sequencer.defaultPPQ;
        numNotes = config.numNotes || 20;
        noteLength = config.noteLength || ppq/2; // ticks
        minVelocity = config.minVelocity || 30;
        maxVelocity = config.maxVelocity || 127;
        minNoteNumber = config.minNoteNumber || 60;
        maxNoteNumber = config.maxNoteNumber || 127;

        if(noteLength > ppq){
            noteLength = ppq;
        }

        //console.log(ppq, numNotes, noteLength, minVelocity, maxVelocity, minNoteNumber, maxNoteNumber);


        for(i = 0; i < numNotes; i++){
            noteNumber = getRandom(minNoteNumber, maxNoteNumber, true);
            velocity = getRandom(minVelocity, maxVelocity, true);

            //console.log(ticks, noteNumber, velocity);

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, noteNumber, velocity);
            events.push(midiEvent);
            ticks += noteLength;

            midiEvent = sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, noteNumber, 0);
            events.push(midiEvent);
            ticks += ppq - noteLength;
        }

        return events;
    }


    function convertPPQ(){//oldPPQ, newPPQ, data, ..., ...
        var args = slice.call(arguments),
            oldPPQ = args[0],
            newPPQ = args[1],
            ratio = newPPQ/oldPPQ,
            i, event;

        if(isNaN(oldPPQ) || isNaN(newPPQ)){
            if(sequencer.debug === 4){
                console.error('PPQ values must be numbers');
            }
            return;
        }

        function loop(data, i, maxi){
            var arg, type, track, j, t;
            for(j = i; j < maxi; j++){
                arg = data[j];
                type = typeString(arg);
                //console.log(type, arg.className);
                if(type === 'array'){
                    convert(arg);
                }else if(type === 'object'){
                    if(arg.className === 'Part' || arg.className === 'Track' || arg.className === 'Song'){
                        convert(arg.events);
                    }else if(arg.className === 'MidiFile'){
                        //console.log(arg.numTracks, arg.tracks[0].events);
                        for(t = arg.numTracks - 1; t >= 0; t--){
                            track = arg.tracks[t];
                            //console.log(track.needsUpdate);
                            if(track.needsUpdate === true){
                                track.update();
                                if(track.events){
                                    convert(track.events);
                                }
                            }
                        }
                    }
                }
            }
        }

        loop(args, 2, args.length);

        function convert(events){
            for(i = events.length - 1; i >= 0; i--){
                event = events[i];
                event.ticks = ratio * event.ticks;
                if(event.state !== 'new'){
                    event.state = 'changed';
                }
            }
        }
    }


    function getNoteLengthName(song, value){
        for(var divider in noteLengthNames){
            if(noteLengthNames.hasOwnProperty(divider)){
                //console.log(value, song.ppq/divider);
                if(value === song.ppq/divider){
                    return noteLengthNames[divider];
                }
            }
        }
        return false;
    }


    function getMicrosecondsFromBPM(bpm){
        return round(60000000/bpm);
    }


    function insertLink(s){
        // @TODO: fix this -> should be md syntax
        var href,
            i = s.indexOf('http://');
        if(i !== -1){
            href = s.substring(i);
            i = href.indexOf(' ');
            if(i !== -1){
                href = href.substring(0, i);
            }
        }
        return '<a href="' + href + '"></a>';
    }


    function getWaveformData(buffer, config, callback){
        var i, maxi,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            pcmRight = buffer.getChannelData(0),
            pcmLeft = buffer.getChannelData(0),
            numSamples = pcmRight.length,
            width, // max width of a canvas on chrome/chromium is 32000
            height = config.height || 100,
            color = config.color || '#71DE71',
            bgcolor = config.bgcolor || '#000',
            density,
            scale = height / 2,
            sampleStep = config.sampleStep || 50,
            height,
            lastWidth,
            numImages,
            currentImage,
            xPos = 0,
            offset = 0,
            urls = [],
            imgElement,
            imgElements = [];

        //console.log(pcmRight.length, pcmLeft.length, config.samples.length);

        if(config.width !== undefined){
            width = config.width;
            density = width / numSamples;
        }else {
            density = config.density || 1;
            width = 1000;
            lastWidth = (numSamples * config.density) % width;
            numImages = Math.ceil((numSamples * config.density)/width);
            currentImage = 0;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = bgcolor;
        ctx.fillRect(0, 0, width, height);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(0, scale);


        for(i = 0; i < numSamples; i += sampleStep){
            xPos = (i - offset) * density;
            if(xPos >= width){
                //console.log(width, height)
                //ctx.closePath();
                ctx.stroke();
                urls.push(canvas.toDataURL('image/png'));
                currentImage++;
                if(currentImage === numImages - 1){
                    canvas.width = lastWidth;
                }else{
                    canvas.width = width;
                }
                ctx.beginPath();
                ctx.strokeStyle = color;
                offset = i;
                xPos = 0;
                ctx.moveTo(xPos, scale - (pcmRight[i] * scale));
            }else{
                ctx.lineTo(xPos, scale - (pcmRight[i] * scale));
                //console.log(scale - (pcmRight[i] * scale));
            }
        }

        if(xPos < width){
            //ctx.closePath();
            ctx.stroke();
            urls.push(canvas.toDataURL('image/png'));
        }

        callback(urls);

        /*
        // create html image elements from the data-urls
        for(i = 0, maxi = urls.length; i < maxi; i++){
            imgElement = document.createElement('img');
            imgElement.src = urls[i];
            imgElement.origWidth = imgElement.width;
            imgElement.height = 100;
            imgElements.push(imgElement);
        }

        callback({
            dataURIs: urls,
            imgElements: imgElements
        });
        */
    }


    function encode64(buffer) {
        var binary = '',
            bytes = new Uint8Array(buffer),
            len = bytes.byteLength;

        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    /*\
    |*|
    |*|  Base64 / binary data / UTF-8 strings utilities
    |*|
    |*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
    |*|
    \*/

    /* Array of bytes to base64 string decoding */

    function b64ToUint6 (nChr) {

      return nChr > 64 && nChr < 91 ?
          nChr - 65
        : nChr > 96 && nChr < 123 ?
          nChr - 71
        : nChr > 47 && nChr < 58 ?
          nChr + 4
        : nChr === 43 ?
          62
        : nChr === 47 ?
          63
        :
          0;

    }


    function base64DecToArr (sBase64, nBlocksSize) {

      var
        sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""),
        nInLen = sB64Enc.length,
        nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
        taBytes = new Uint8Array(nOutLen);

      for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
          for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
            taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
          }
          nUint24 = 0;

        }
      }

      return taBytes;
    }

    /* Base64 string to array encoding */

    function uint6ToB64 (nUint6) {

      return nUint6 < 26 ?
          nUint6 + 65
        : nUint6 < 52 ?
          nUint6 + 71
        : nUint6 < 62 ?
          nUint6 - 4
        : nUint6 === 62 ?
          43
        : nUint6 === 63 ?
          47
        :
          65;

    }

    function base64EncArr (aBytes) {

      var nMod3 = 2, sB64Enc = "";

      for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
        nMod3 = nIdx % 3;
        if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
        nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
        if (nMod3 === 2 || aBytes.length - nIdx === 1) {
          sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
          nUint24 = 0;
        }
      }

      return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

    }

    /* UTF-8 array to DOMString and vice versa */

    function UTF8ArrToStr (aBytes) {

      var sView = "";

      for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
        nPart = aBytes[nIdx];
        sView += String.fromCharCode(
          nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
            /* (nPart - 252 << 30) may be not so safe in ECMAScript! So...: */
            (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
            (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
            (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
            (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
            (nPart - 192 << 6) + aBytes[++nIdx] - 128
          : /* nPart < 127 ? */ /* one byte */
            nPart
        );
      }

      return sView;

    }

    function strToUTF8Arr (sDOMStr) {

      var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

      /* mapping... */

      for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
        nChr = sDOMStr.charCodeAt(nMapIdx);
        nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
      }

      aBytes = new Uint8Array(nArrLen);

      /* transcription... */

      for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
        nChr = sDOMStr.charCodeAt(nChrIdx);
        if (nChr < 128) {
          /* one byte */
          aBytes[nIdx++] = nChr;
        } else if (nChr < 0x800) {
          /* two bytes */
          aBytes[nIdx++] = 192 + (nChr >>> 6);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x10000) {
          /* three bytes */
          aBytes[nIdx++] = 224 + (nChr >>> 12);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x200000) {
          /* four bytes */
          aBytes[nIdx++] = 240 + (nChr >>> 18);
          aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x4000000) {
          /* five bytes */
          aBytes[nIdx++] = 248 + (nChr >>> 24);
          aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else /* if (nChr <= 0x7fffffff) */ {
          /* six bytes */
          aBytes[nIdx++] = 252 + (nChr >>> 30);
          aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        }
      }

      return aBytes;

    }

    sequencer.protectedScope.addInitMethod(function(){
        context = sequencer.protectedScope.context;
    });

    // mozilla tools
    sequencer.util.b64ToUint6 = b64ToUint6;
    sequencer.util.base64DecToArr = base64DecToArr;
    sequencer.util.uint6ToB64 = uint6ToB64;
    sequencer.util.base64EncArr = base64EncArr;
    sequencer.util.UTF8ArrToStr = UTF8ArrToStr;
    sequencer.util.strToUTF8Arr = strToUTF8Arr;
    sequencer.util.ajax = ajax;
    sequencer.util.ajax2 = ajax2;
    sequencer.util.parseSamples = parseSamples;


    //sequencer.findItem = findItem;
    //sequencer.storeItem = storeItem;

    sequencer.util.round = round;
    sequencer.util.floor = floor;
    sequencer.util.remap = remap;
    sequencer.util.getRandom = getRandom;
    sequencer.util.createSlider = createSlider;
    sequencer.util.createSlider2 = createSlider2;
    sequencer.util.getRandomNotes = getRandomNotes;
    sequencer.util.getEqualPowerCurve = getEqualPowerCurve;
    sequencer.util.objectForEach = objectForEach;
    sequencer.util.insertLink = insertLink;
    sequencer.util.encode64 = encode64;

    sequencer.protectedScope.getNoteLengthName = getNoteLengthName;
    sequencer.protectedScope.toBinaryString = toBinaryString;
    sequencer.protectedScope.base64ToBinary = base64ToBinary;
    //sequencer.protectedScope.base64ToBinary = base64DecToArr;
    sequencer.protectedScope.toUint8Array = toUint8Array;
    sequencer.protectedScope.getArguments = getArguments;
    sequencer.protectedScope.pathToArray = pathToArray;
    sequencer.protectedScope.parseUrl = parseUrl;
    sequencer.protectedScope.loadLoop = loadLoop;


    sequencer.protectedScope.findItem = findItem;
    sequencer.protectedScope.storeItem = storeItem;
    sequencer.protectedScope.deleteItem = deleteItem;
    sequencer.protectedScope.toBinaryString = toBinaryString;
    sequencer.protectedScope.ajax = ajax;
    sequencer.protectedScope.copyObject = copyObject;
    sequencer.protectedScope.findItemsInFolder = findItemsInFolder;


    sequencer.convertPPQ = convertPPQ;
    sequencer.getNiceTime = getNiceTime;
    sequencer.protectedScope.isEmptyObject = isEmptyObject;
    sequencer.protectedScope.objectForEach = objectForEach;
    sequencer.protectedScope.objectToArray = objectToArray;
    sequencer.protectedScope.arrayToObject = arrayToObject;
    sequencer.protectedScope.createClass = createClass;

    sequencer.protectedScope.clone = clone;
    sequencer.protectedScope.round = round;
    sequencer.protectedScope.floor = floor;
    sequencer.protectedScope.typeString = typeString;
    sequencer.protectedScope.copyName = copyName;
    sequencer.protectedScope.removeFromArray = removeFromArray;
    sequencer.protectedScope.removeFromArray2 = removeFromArray2;
    sequencer.protectedScope.filterItemsByClassName = filterItemsByClassName;

    sequencer.getMicrosecondsFromBPM = getMicrosecondsFromBPM;
    sequencer.getWaveformData = getWaveformData;
}());(function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        copyObject, // defined in util.js

        floor = Math.floor,
        round = Math.round,

    	noteFractions =
    	{
	        '1': 1 * 4, // whole note
	        '1.': 1.5 * 4,
	        '1..': 1.75 * 4,
	        '1...': 1.875 * 4,
	        '1T': 2/3 * 4,

	        '2': 1 * 2, // half note
	        '2.': 1.5 * 2,
	        '2..': 1.75 * 2,
	        '2...': 1.875 * 2,
	        '2T': 2/3 * 2,

	        '4': 1 * 1, // quarter note (beat)
	        '4.': 1.5 * 1,
	        '4..': 1.75 * 1,
	        '4...': 1.875 * 1,
	        '4T': 2/3 * 1,

	        '8': 1 * 1/2, // eighth note
	        '8.': 1.5 * 1/2,
	        '8..': 1.75 * 1/2,
	        '8...': 1.875 * 1/2,
	        '8T':  2/3 * 1/2,

	        '16': 1 * 1/4, // sixteenth note
	        '16.': 1.5 * 1/4,
	        '16..': 1.75 * 1/4,
	        '16...': 1.875 * 1/4,
	        '16T': 2/3 * 1/4,

	        '32': 1 * 1/8,
	        '32.': 1.5 * 1/8,
	        '32..': 1.75 * 1/8,
	        '32...': 1.875 * 1/8,
	        '32T': 2/3 * 1/8,

	        '64': 1 * 1/16,
	        '64.': 1.5 * 1/16,
	        '64..': 1.75 * 1/16,
	        '64...': 1.875 * 1/16,
	        '64T': 2/3 * 1/16,

	        '128': 1 * 1/32,
	        '128.': 1.5 * 1/32,
	        '128..': 1.75 * 1/32,
	        '128...': 1.875 * 1/32,
	        '128T': 2/3 * 1/32
	    };




    function quantize(events, value, ppq, history){
        var track;

        value = '' + value;
        value = value.toUpperCase();
        ppq = ppq || sequencer.defaultPPQ;
        //console.log('quantize', value);
        if(value === 0){// pass by
            return {};
        }
        var i, event, ticks, quantized, diff, quantizeTicks,
           quantizeHistory = history || {};

        if(quantizeHistory.events === undefined){
            quantizeHistory.events = {};
        }

        if(quantizeHistory.tracks === undefined){
            quantizeHistory.tracks = {};
        }

        //console.log(events, value, ppq, history);

        if(value.indexOf('TICKS') !== -1){
            quantizeTicks = parseInt(value.replace(/TICKS/,''), 10);
        }else{
            quantizeTicks = noteFractions[value] * ppq;
        }

        //console.log('quantize', quantizeTicks);

        if(quantizeTicks === undefined){
            if(sequencer.debug){
                console.warn('invalid quantize value');
            }
            return;
        }

        for(i = events.length - 1; i >= 0; i--){
            event = events[i];

            quantizeHistory.events[event.id] = {
                event: event,
                ticks: event.ticks
            };

            if(event.type !== 128){
                ticks = event.ticks;
                quantized = round(ticks/quantizeTicks) * quantizeTicks;
                //console.log(ticks, quantized, '[', ppq, ']');
                diff = quantized - ticks;
                event.ticks = quantized;
                event.state = 'changed';
                event.part.needsUpdate = true;
                event.track.needsUpdate = true;

                // add quantize history per track as well
                track = event.track;
                if(quantizeHistory.tracks[track.id] === undefined){
                    quantizeHistory.tracks[track.id] = {
                        track: track,
                        quantizedEvents: []
                    };
                }
                quantizeHistory.tracks[track.id].quantizedEvents.push(event);

                // quantize the note off event
                if(event.midiNote !== undefined){
                    event.midiNote.noteOff.ticks += diff;
                    event.midiNote.noteOff.state = 'changed';
                    event.midiNote.state = 'changed';
                    quantizeHistory.tracks[track.id].quantizedEvents.push(event.midiNote.noteOff);
                }
            }
        }

        return quantizeHistory;//copyObject(quantizeHistory);
    }


    function fixedLength(events, value, ppq, history){
        var fixedLengthHistory = history || {};

    }


    sequencer.protectedScope.addInitMethod(function(){
        copyObject = sequencer.protectedScope.copyObject;
    });

    sequencer.quantize = quantize;
    sequencer.fixedLength = fixedLength;

}());


(function(){

    'use strict';

    var
        sequencer = window.sequencer,
        context,
        initMidi,
        base64ToBinary,
        ready = false,
        readyCallbacks = [],
        emptyOgg = 'T2dnUwACAAAAAAAAAABdxd4XAAAAADaS0jQBHgF2b3JiaXMAAAAAAUSsAAAAAAAAgLsAAAAAAAC4AU9nZ1MAAAAAAAAAAAAAXcXeFwEAAAAaXK+QDz3/////////////////MgN2b3JiaXMtAAAAWGlwaC5PcmcgbGliVm9yYmlzIEkgMjAxMDExMDEgKFNjaGF1ZmVudWdnZXQpAAAAAAEFdm9yYmlzH0JDVgEAAAEAGGNUKUaZUtJKiRlzlDFGmWKSSomlhBZCSJ1zFFOpOdeca6y5tSCEEBpTUCkFmVKOUmkZY5ApBZlSEEtJJXQSOiedYxBbScHWmGuLQbYchA2aUkwpxJRSikIIGVOMKcWUUkpCByV0DjrmHFOOSihBuJxzq7WWlmOLqXSSSuckZExCSCmFkkoHpVNOQkg1ltZSKR1zUlJqQegghBBCtiCEDYLQkFUAAAEAwEAQGrIKAFAAABCKoRiKAoSGrAIAMgAABKAojuIojiM5kmNJFhAasgoAAAIAEAAAwHAUSZEUybEkS9IsS9NEUVV91TZVVfZ1Xdd1Xdd1IDRkFQAAAQBASKeZpRogwgxkGAgNWQUAIAAAAEYowhADQkNWAQAAAQAAYig5iCa05nxzjoNmOWgqxeZ0cCLV5kluKubmnHPOOSebc8Y455xzinJmMWgmtOaccxKDZiloJrTmnHOexOZBa6q05pxzxjmng3FGGOecc5q05kFqNtbmnHMWtKY5ai7F5pxzIuXmSW0u1eacc84555xzzjnnnHOqF6dzcE4455xzovbmWm5CF+eccz4Zp3tzQjjnnHPOOeecc84555xzgtCQVQAAEAAAQRg2hnGnIEifo4EYRYhpyKQH3aPDJGgMcgqpR6OjkVLqIJRUxkkpnSA0ZBUAAAgAACGEFFJIIYUUUkghhRRSiCGGGGLIKaecggoqqaSiijLKLLPMMssss8wy67CzzjrsMMQQQwyttBJLTbXVWGOtueecaw7SWmmttdZKKaWUUkopCA1ZBQCAAAAQCBlkkEFGIYUUUoghppxyyimooAJCQ1YBAIAAAAIAAAA8yXNER3RER3RER3RER3REx3M8R5RESZRESbRMy9RMTxVV1ZVdW9Zl3fZtYRd23fd13/d149eFYVmWZVmWZVmWZVmWZVmWZVmC0JBVAAAIAACAEEIIIYUUUkghpRhjzDHnoJNQQiA0ZBUAAAgAIAAAAMBRHMVxJEdyJMmSLEmTNEuzPM3TPE30RFEUTdNURVd0Rd20RdmUTdd0Tdl0VVm1XVm2bdnWbV+Wbd/3fd/3fd/3fd/3fd/3dR0IDVkFAEgAAOhIjqRIiqRIjuM4kiQBoSGrAAAZAAABACiKoziO40iSJEmWpEme5VmiZmqmZ3qqqAKhIasAAEAAAAEAAAAAACia4imm4imi4jmiI0qiZVqipmquKJuy67qu67qu67qu67qu67qu67qu67qu67qu67qu67qu67qu67ouEBqyCgCQAADQkRzJkRxJkRRJkRzJAUJDVgEAMgAAAgBwDMeQFMmxLEvTPM3TPE30RE/0TE8VXdEFQkNWAQCAAAACAAAAAAAwJMNSLEdzNEmUVEu1VE21VEsVVU9VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU1TdM0TSA0ZCUAAAQAwGKNweUgISUl5d4QwhCTnjEmIbVeIQSRkt4xBhWDnjKiDHLeQuMQgx4IDVkRAEQBAADGIMcQc8g5R6mTEjnnqHSUGuccpY5SZynFmGLNKJXYUqyNc45SR62jlGIsLXaUUo2pxgIAAAIcAAACLIRCQ1YEAFEAAIQxSCmkFGKMOaecQ4wp55hzhjHmHHOOOeegdFIq55x0TkrEGHOOOaecc1I6J5VzTkonoQAAgAAHAIAAC6HQkBUBQJwAgEGSPE/yNFGUNE8URVN0XVE0XdfyPNX0TFNVPdFUVVNVbdlUVVmWPM80PdNUVc80VdVUVVk2VVWWRVXVbdN1ddt0Vd2Wbdv3XVsWdlFVbd1UXds3Vdf2Xdn2fVnWdWPyPFX1TNN1PdN0ZdV1bVt1XV33TFOWTdeVZdN1bduVZV13Zdn3NdN0XdNVZdl0Xdl2ZVe3XVn2fdN1hd+VZV9XZVkYdl33hVvXleV0Xd1XZVc3Vln2fVvXheHWdWGZPE9VPdN0Xc80XVd1XV9XXdfWNdOUZdN1bdlUXVl2Zdn3XVfWdc80Zdl0Xds2XVeWXVn2fVeWdd10XV9XZVn4VVf2dVnXleHWbeE3Xdf3VVn2hVeWdeHWdWG5dV0YPlX1fVN2heF0Zd/Xhd9Zbl04ltF1fWGVbeFYZVk5fuFYlt33lWV0XV9YbdkYVlkWhl/4neX2feN4dV0Zbt3nzLrvDMfvpPvK09VtY5l93VlmX3eO4Rg6v/Djqaqvm64rDKcsC7/t68az+76yjK7r+6osC78q28Kx677z/L6wLKPs+sJqy8Kw2rYx3L5uLL9wHMtr68ox675RtnV8X3gKw/N0dV15Zl3H9nV040c4fsoAAIABBwCAABPKQKEhKwKAOAEAjySJomRZoihZliiKpui6omi6rqRppqlpnmlammeapmmqsimarixpmmlanmaamqeZpmiarmuapqyKpinLpmrKsmmasuy6sm27rmzbomnKsmmasmyapiy7sqvbruzquqRZpql5nmlqnmeapmrKsmmarqt5nmp6nmiqniiqqmqqqq2qqixbnmeamuippieKqmqqpq2aqirLpqrasmmqtmyqqm27quz6sm3rummqsm2qpi2bqmrbruzqsizbui9pmmlqnmeamueZpmmasmyaqitbnqeaniiqquaJpmqqqiybpqrKlueZqieKquqJnmuaqirLpmraqmmatmyqqi2bpirLrm37vuvKsm6qqmybqmrrpmrKsmzLvu/Kqu6KpinLpqrasmmqsi3bsu/Lsqz7omnKsmmqsm2qqi7Lsm0bs2z7umiasm2qpi2bqirbsi37uizbuu/Krm+rqqzrsi37uu76rnDrujC8smz7qqz6uivbum/rMtv2fUTTlGVTNW3bVFVZdmXZ9mXb9n3RNG1bVVVbNk3VtmVZ9n1Ztm1hNE3ZNlVV1k3VtG1Zlm1htmXhdmXZt2Vb9nXXlXVf133j12Xd5rqy7cuyrfuqq/q27vvCcOuu8AoAABhwAAAIMKEMFBqyEgCIAgAAjGGMMQiNUs45B6FRyjnnIGTOQQghlcw5CCGUkjkHoZSUMucglJJSCKGUlFoLIZSUUmsFAAAUOAAABNigKbE4QKEhKwGAVAAAg+NYlueZomrasmNJnieKqqmqtu1IlueJommqqm1bnieKpqmqruvrmueJommqquvqumiapqmqruu6ui6aoqmqquu6sq6bpqqqriu7suzrpqqqquvKriz7wqq6rivLsm3rwrCqruvKsmzbtm/cuq7rvu/7wpGt67ou/MIxDEcBAOAJDgBABTasjnBSNBZYaMhKACADAIAwBiGDEEIGIYSQUkohpZQSAAAw4AAAEGBCGSg0ZEUAECcAABhDKaSUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJIKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKqaSUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKZVSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUgoAkIpwAJB6MKEMFBqyEgBIBQAAjFFKKcacgxAx5hhj0EkoKWLMOcYclJJS5RyEEFJpLbfKOQghpNRSbZlzUlqLMeYYM+ekpBRbzTmHUlKLseaaa+6ktFZrrjXnWlqrNdecc825tBZrrjnXnHPLMdecc8455xhzzjnnnHPOBQDgNDgAgB7YsDrCSdFYYKEhKwGAVAAAAhmlGHPOOegQUow55xyEECKFGHPOOQghVIw55xx0EEKoGHPMOQghhJA55xyEEEIIIXMOOugghBBCBx2EEEIIoZTOQQghhBBKKCGEEEIIIYQQOgghhBBCCCGEEEIIIYRSSgghhBBCCaGUUAAAYIEDAECADasjnBSNBRYashIAAAIAgByWoFLOhEGOQY8NQcpRMw1CTDnRmWJOajMVU5A5EJ10EhlqQdleMgsAAIAgACDABBAYICj4QgiIMQAAQYjMEAmFVbDAoAwaHOYBwANEhEQAkJigSLu4gC4DXNDFXQdCCEIQglgcQAEJODjhhife8IQbnKBTVOogAAAAAAAMAOABAOCgACIimquwuMDI0Njg6PAIAAAAAAAWAPgAADg+gIiI5iosLjAyNDY4OjwCAAAAAAAAAACAgIAAAAAAAEAAAACAgE9nZ1MABAEAAAAAAAAAXcXeFwIAAABq2npxAgEBAAo=',
        emptyMp3 = '//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';


    sequencer.protectedScope.callInitMethods(); // defined in open_module.js
    context = sequencer.protectedScope.context; // defined in open_module.js
    initMidi = sequencer.protectedScope.initMidi; // defined in midi_system.js
    base64ToBinary = sequencer.protectedScope.base64ToBinary; // defined in util.js
    delete sequencer.protectedScope; //seal


    sequencer.ready = function(cb){
        if(ready === true){
            cb();
        }else{
            readyCallbacks.push(cb);
        }
    };


    sequencer.addInstrument({
        name: 'sinewave',
        folder: 'heartbeat',
        autopan: false,
        attack: 200,
        keyrange: [21,108],
        release_duration: 50
    });


    sequencer.addInstrument({
        name: 'metronome',
        folder: 'heartbeat',
        //release_duration: 250,
        sample_path: 'heartbeat/metronome',
        keyrange: [60,61],
        mapping: {
            '60': {n: 'lowtick'},
            '61': {n: 'hightick'}
        }
    });

    //console.log(sequencer.os, sequencer.browser);

    // safari supports only mp3 and all other browsers support mp3 among others, so although ogg is a better format, mp3 is the best choice here to cover all browsers
    // -> but we use wav for the metronome tick to get rid of the padding at the start of a mp3 file
    sequencer.addSamplePack({
        name: 'metronome',
        folder: 'heartbeat',
        mapping: {
            'hightick': 'UklGRkQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSAFAACx/xf/dADOACwBsP3p+6H+zAGoBOkCCwBX/EH5OvxlA4kJ2wcSArT9E/ut+HT2evUx98n6OAF5CCUMwQvfCOsJxAx0DSIMEAq9BiAB3vhz7mLkT9sR133YxN2s5QLv0vrUBnwRnxuQJeEsSDCiMd8yFS8aKFIhohUsCKj64u625OraA9HuyPnElcP+wxvJWtW25637VQ0jHPgnBTDDM1o0CzKLK+8hzhgFDOz8Se4J47DYVtG0z5fQq9LB12rfA+j99roHAhelIyMwIjdTOuU8mjwIOGoxhCb5E53/j+3k3/fTY8pTw4y/Tr+ew8DMvdsk8RcHRRkSKO4yGTkHPkU/rzzyNcgsrR94Dp/5r+Zs17zOncoDxhfE38WLyn/TeOMi9r0IRxlRKIQzyTlOPKo9yjmWMcokDRLc/Y7rudtdzu/D2L1Iu+27JcG3yYrVLujl+3UOZx1UK5Q0qzmNPDk8ZjeeMPojzhH+/jLtPd5m0hHLHsYIw5TEMMnA0jvj8fSOBiwXASZgMzM8dUBGQbI+rzjpKkIZygZT9QflcdaRyqXCz7+VwUPH784r3K7s+v0KDu8bvyeLMb43NjrhOIo0dSvQHi0PnP6i7ovg3NTxy4/Gf8X8yH/QBtvX55P2Ygb0FcUjsy4LNmI5ejiXM38r7iC8FJwHPvok7dDgQdaJzlTKIsoFzsrVkuA87d/6qAi7FQ0h9ClKMLEz3TOrMBcqYSD8E9AFd/dS6kTf6dbU0XnQv9IH2MXfZ+ln9DEAFwwdFy8giib6KawqeChgI/UbHBOTCZj/vvXe7InlFuDN3P3b0d1F4gzpifG2+u4D7Qw1FfwbnCD+IlgjWyHLHPMVog2mBL37qvP+7NvnYuTv4rvjfubN6k3wpPZ0/WkEOwtiEUsWcxm+Gl4aOhhiFDAPIwmbAtn7TPVy77zqcefr5YHmHull7enyfPmcAHgHew1REr8Vhhd/F+AV1RJ0DikJWQNc/ZP3efKd7hvs2ur46rHs5u8e9N/48/0hA/8HFgwuD04RSBIREqsQOg7mCssGMAJW/Xn4G/TK8Lbuzu0I7qTvnPJy9sX6bP84BLYIbAwdD84QYxG7EOcODAxwCFMEAQC9+7P3SvTX8XHw+u9R8KTxIvSo9+X7VQCUBJ0IMwziDj4QLhAGD9UMrgnTBZcBRv1v+Xv2UfS+8tfx+vES87z0+vb3+Zf9ZgEQBSEIUArWC8kM2QyzC5EJEAdvBHgBXP5n++r4Avd89Wj07fMw9D31Jvfp+Uj9xQD9A8QG5QhXClELrAsvC9wJ7gd6BWIC3v6O+7T4PPZN9EHzWvNf9Pz1Fvit+qL9rQCHAwEG/weCCZUKFwvDCnIJcAcQBWcCaf8Z/CD55vaB9dD0wPSP9UL3m/k7/Mz+JwEyAw8FzAY7CBsJaQk5CWkI2gatBCICYf+j/Fr6vfiV9872sfZP91z4p/lR+3H9zf89AroEFAfjCP0Jcwo8CjAJdQdgBSEDkgDQ/Vj7ZfnR95T28fUd9v32Vvg2+nb8+/6xAWoE4AbDCP4JpAqbCqQJ0weEBfgCTACT/R37M/m+9672IPY69gb3afhW+tT8qf+MAj0FggcuCScKXAriCcMIEAfyBJYCFwCP/Rz7A/l793z2F/Zn9mH37fjd+i39yf9pAt0EFAfRCNkJGAqrCZYIvgZPBJ8B6P4//M350vdz9q/1lfUq9mz3RPmi+3H+bgFVBOQG3wgHCkwK0Am7CCAHCgWmAjAA',
            'lowtick': 'UklGRlQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAFAAB0/5v+U/4T/3gA0wFTAuUB+f8d/nT90f1q/ub+tf46/mb/8wFQA9gC7wCd/mr+FAGRA3cE6wJf/h36evmv+8v/NwRHBZUC2/60+//5EvuZ/aX/bgFOAp8Azvzh9wfzLPF68zT4y/2BAygIfQwaEjYY0x31Irwl8SOWHVESOgPh9NfpReFt22nYHddD2BXcZeDa5InqgPDx9nP+6gS4CBYLnw0zES0WXxv4HkcgLh/1G+EX1RNpD4wKigXH/6r5/fNu7lTpj+Zu5hHoXOtL71byr/Qp91L64v6OBO4JoQ5zEskU+hU1FiQVeRP7EWgP4Qr0BIT+tPid9C3y1vCh8FDxJvK28vvyy/LA8pLzU/XP95v6xvw4/uD/RAK2BSkKcg6BEScTZBMeEqkPTQxjCKEEVwFi/nv7h/hp9aDyAvHP8MfxLvM+9PX0uPW19g/4Lfr7/C4AKgNaBXQGywb0BhIHWQfWB1oIzAjtCF8IHwdtBakDVwKLAeYA8v9w/kj81/nQ94v29/XX9bz1bPUY9Uz1Z/aH+Hr7yP4MAi4F+wcfCnYLNgyfDPsMSw0sDUAMfgrcB5IEMwFb/iX8T/pT+O/1X/Mf8cbvrO+18MLyvfVP+Rf9wgAoBCEHpwnIC5EN4Q5AD3wO1Ay0CpsIvwbvBNcCbQAr/nX8Ofsf+vb4mvda9rj1z/WX9pL3a/hH+ZX6R/wn/vP/eQESA/AE+wYDCcwKFAyPDCkMFQuSCe4HVQbSBHQDCwI8ANL9JPuY+HX28vTq82PzdPMV9Az1MfZ49zD5gftx/sQBBQXLB8cJ/gqpCw8MigwWDXENXQ2rDDUL7QgDBswCdv8S/K74WPVk8hXwou4P7mvu1+9T8pz1Uvli/ZoBwgWRCcsMPg/CEEQR4RDADwoO9wusCVMH4ARSApn/ufzd+Wj3bvX78xzzx/L68qzz1vSD9qX4Gfvd/c0AhwO/BWwHmghvCQEKVQonClsJCwiIBh0F0gOgAm0BOwAx/03+XP0g/Lb6cPmX+F/4vfh++TH6s/os+7/7cvwL/Zz9XP5O/3IA3AF9AzsF9gaUCAAKHgueCzcL9wntB3sF4wIzAI396fp1+Gv2IvWn9N30p/Xi9m74G/ru+9P9k/8aAYEC1AMTBSIG0wYuB1gHkgcACGEISAhTBzEFWAKt/5L92fuU+vX50fmf+SP5i/gb+Bf4mviv+Sr7kvyb/Uj+r/4X/8r/+gCiAo0EUAaRBzwISwjqB3IHGQfCBv8FpgTMApQAKf67+5n5/vfn9jz2yPVn9SL1RPXq9SP3Dvmr+6f+sQGKBAcH+whOCh0Laws3C28KLAmDB5AFfQNoAVP/Zv3e+7P6sfnL+Cv4vPeM95b37feV+Jn51Poq/LL9mv+YAVYD3gQuBmcHSAikCIEI7Af+BuEFngQXA1sBv/9v/pf9MP3W/Fj8q/sR+6H6U/o3+mP6y/pN+/f7xvye/WH+Jf9mAD4CQAQJBisHtgf6Bw0I8QdsB1sGywT4AggBCP/o/KX6mPg19572jfaz9uf2S/cM+E35E/tW/af/5wH1A8AFKgfkB/AHgwfxBlAGgQVIBMMCJwGs/43+vP0i/Zr8Lfzl+9H76fvi+9f75fsf/In8BP10/ej9cf4O/7f/dAAcAaUBEgKMAhgDpAMEBCEEDwTfA3IDxQL8ASoBUwCG/87+J/6h/Rr9pPxk/Gb8oPwJ/XH9w/39/UD+qP41/9D/WwDeAGsBAgKdAhEDQQNAA0sDbwOVA5YDVwPOAhgCVAGRAA=='
        }
    });

    //console.log(initMidi);


    function testType(base64, type, callback){
        try{
            context.decodeAudioData(base64ToBinary(base64), function(){
                window.sequencer[type] = true;
                callback();
            }, function(){
                callback();
            });
        }catch(e){
            //console.log(e);
            callback();
        }
    }

    sequencer.addTask({
        type: 'test mp3',
        method: function(cb){
            testType(emptyMp3, 'mp3', cb);
        },
        params: []
    });

    sequencer.addTask({
        type: 'test ogg',
        method: function(cb){
            testType(emptyOgg, 'ogg', cb);
        },
        params: []
    });
/*
    , function(){
        console.log('another callback');
    }, true);
*/
/*
    sequencer.addTask({
        type: 'delay',
        method: function(cb){
            setTimeout(cb, 3000);
        },
        params: []
    });
*/
    sequencer.addTask({
        type: 'init midi',
        method: initMidi,
        params: []
    }, function(){
        readyCallbacks.forEach(function(cb){
            cb();
        });
        if(sequencer.debug >= 4){
            var msg = 'sequencer ready, support for:';
            if(sequencer.ogg === true){
                msg +=  ' ogg';
            }
            if(sequencer.mp3 === true){
                msg +=  ' mp3';
            }
            console.log(msg);
        }
        ready = true;
    }, false); // @TODO: check this true | false

    //sequencer.startTaskQueue();

}());