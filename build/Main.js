webpackJsonp([0],[
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 *  Tone.js
 *  @author Yotam Mann
 *  @license http://opensource.org/licenses/MIT MIT License
 *  @copyright 2014-2017 Yotam Mann
 */
!(__WEBPACK_AMD_DEFINE_RESULT__ = function(){

	"use strict";

	///////////////////////////////////////////////////////////////////////////
	//	TONE
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  @class  Tone is the base class of all other classes.
	 *  @constructor
	 *  @param {Tone.Context} context The audio context
	 */
	var Tone = function(){
		// this._context = Tone.defaultArg(context, Tone.context);
	};

	/**
	 *  @memberOf Tone#
	 *  @returns {string} returns the name of the class as a string
	 */
	Tone.prototype.toString = function(){
		for (var className in Tone){
			var isLetter = className[0].match(/^[A-Z]$/);
			var sameConstructor =  Tone[className] === this.constructor;
			if (Tone.isFunction(Tone[className]) && isLetter && sameConstructor){
				return className;
			}
		}
		return "Tone";
	};

	/**
	 *  @memberOf Tone#
	 *  disconnect and dispose
	 *  @returns {Tone} this
	 */
	Tone.prototype.dispose = function(){
		if (!Tone.isUndef(this.input)){
			if (this.input instanceof AudioNode){
				this.input.disconnect();
			} 
			this.input = null;
		}
		if (!Tone.isUndef(this.output)){
			if (this.output instanceof AudioNode){
				this.output.disconnect();
			} 
			this.output = null;
		}
		return this;
	};

	///////////////////////////////////////////////////////////////////////////
	//	GET/SET
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Set the parameters at once. Either pass in an
	 *  object mapping parameters to values, or to set a
	 *  single parameter, by passing in a string and value.
	 *  The last argument is an optional ramp time which 
	 *  will ramp any signal values to their destination value
	 *  over the duration of the rampTime.
	 *  @param {Object|string} params
	 *  @param {number=} value
	 *  @param {Time=} rampTime
	 *  @returns {Tone} this
	 *  @memberOf Tone#
	 *  @example
	 * //set values using an object
	 * filter.set({
	 * 	"frequency" : 300,
	 * 	"type" : highpass
	 * });
	 *  @example
	 * filter.set("type", "highpass");
	 *  @example
	 * //ramp to the value 220 over 3 seconds. 
	 * oscillator.set({
	 * 	"frequency" : 220
	 * }, 3);
	 */
	Tone.prototype.set = function(params, value, rampTime){
		if (Tone.isObject(params)){
			rampTime = value;
		} else if (Tone.isString(params)){
			var tmpObj = {};
			tmpObj[params] = value;
			params = tmpObj;
		}

		paramLoop:
		for (var attr in params){
			value = params[attr];
			var parent = this;
			if (attr.indexOf(".") !== -1){
				var attrSplit = attr.split(".");
				for (var i = 0; i < attrSplit.length - 1; i++){
					parent = parent[attrSplit[i]];
					if (parent instanceof Tone) {
						attrSplit.splice(0,i+1);
						var innerParam = attrSplit.join(".");
						parent.set(innerParam, value);
						continue paramLoop;
					}
				}
				attr = attrSplit[attrSplit.length - 1];
			}
			var param = parent[attr];
			if (Tone.isUndef(param)){
				continue;
			}
			if ((Tone.Signal && param instanceof Tone.Signal) || 
					(Tone.Param && param instanceof Tone.Param)){
				if (param.value !== value){
					if (Tone.isUndef(rampTime)){
						param.value = value;
					} else {
						param.rampTo(value, rampTime);
					}
				}
			} else if (param instanceof AudioParam){
				if (param.value !== value){
					param.value = value;
				}				
			} else if (param instanceof Tone){
				param.set(value);
			} else if (param !== value){
				parent[attr] = value;
			}
		}
		return this;
	};

	/**
	 *  Get the object's attributes. Given no arguments get
	 *  will return all available object properties and their corresponding
	 *  values. Pass in a single attribute to retrieve or an array
	 *  of attributes. The attribute strings can also include a "."
	 *  to access deeper properties.
	 *  @memberOf Tone#
	 *  @example
	 * osc.get();
	 * //returns {"type" : "sine", "frequency" : 440, ...etc}
	 *  @example
	 * osc.get("type");
	 * //returns { "type" : "sine"}
	 * @example
	 * //use dot notation to access deep properties
	 * synth.get(["envelope.attack", "envelope.release"]);
	 * //returns {"envelope" : {"attack" : 0.2, "release" : 0.4}}
	 *  @param {Array=|string|undefined} params the parameters to get, otherwise will return 
	 *  					                  all available.
	 *  @returns {Object}
	 */
	Tone.prototype.get = function(params){
		if (Tone.isUndef(params)){
			params = this._collectDefaults(this.constructor);
		} else if (Tone.isString(params)){
			params = [params];
		} 
		var ret = {};
		for (var i = 0; i < params.length; i++){
			var attr = params[i];
			var parent = this;
			var subRet = ret;
			if (attr.indexOf(".") !== -1){
				var attrSplit = attr.split(".");
				for (var j = 0; j < attrSplit.length - 1; j++){
					var subAttr = attrSplit[j];
					subRet[subAttr] = subRet[subAttr] || {};
					subRet = subRet[subAttr];
					parent = parent[subAttr];
				}
				attr = attrSplit[attrSplit.length - 1];
			}
			var param = parent[attr];
			if (Tone.isObject(params[attr])){
				subRet[attr] = param.get();
			} else if (Tone.Signal && param instanceof Tone.Signal){
				subRet[attr] = param.value;
			} else if (Tone.Param && param instanceof Tone.Param){
				subRet[attr] = param.value;
			} else if (param instanceof AudioParam){
				subRet[attr] = param.value;
			} else if (param instanceof Tone){
				subRet[attr] = param.get();
			} else if (!Tone.isFunction(param) && !Tone.isUndef(param)){
				subRet[attr] = param;
			} 
		}
		return ret;
	};

	/**
	 *  collect all of the default attributes in one
	 *  @private
	 *  @param {function} constr the constructor to find the defaults from
	 *  @return {Array} all of the attributes which belong to the class
	 */
	Tone.prototype._collectDefaults = function(constr){
		var ret = [];
		if (!Tone.isUndef(constr.defaults)){
			ret = Object.keys(constr.defaults);
		}
		if (!Tone.isUndef(constr._super)){
			var superDefs = this._collectDefaults(constr._super);
			//filter out repeats
			for (var i = 0; i < superDefs.length; i++){
				if (ret.indexOf(superDefs[i]) === -1){
					ret.push(superDefs[i]);
				}
			}
		}
		return ret;
	};

	///////////////////////////////////////////////////////////////////////////
	//	DEFAULTS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  @memberOf Tone
	 *  @param  {Array}  values  The arguments array
	 *  @param  {Array}  keys    The names of the arguments
	 *  @param {Function} constr The class constructor
	 *  @return  {Object}  An object composed of the  defaults between the class' defaults
	 *                        and the passed in arguments.
	 */
	Tone.defaults = function(values, keys, constr){
		var options = {};
		if (values.length === 1 && Tone.isObject(values[0])){
			options = values[0];
		} else {
			for (var i = 0; i < keys.length; i++){
				options[keys[i]] = values[i];
			}
		}
		if (!Tone.isUndef(constr.defaults)){
			return Tone.defaultArg(options, constr.defaults);
		} else {
			return options;
		}
	};

	/**
	 *  If the `given` parameter is undefined, use the `fallback`. 
	 *  If both `given` and `fallback` are object literals, it will
	 *  return a deep copy which includes all of the parameters from both 
	 *  objects. If a parameter is undefined in given, it will return
	 *  the fallback property. 
	 *  <br><br>
	 *  WARNING: if object is self referential, it will go into an an 
	 *  infinite recursive loop.
	 *  @memberOf Tone
	 *  @param  {*} given    
	 *  @param  {*} fallback 
	 *  @return {*}          
	 */
	Tone.defaultArg = function(given, fallback){
		if (Tone.isObject(given) && Tone.isObject(fallback)){
			var ret = {};
			//make a deep copy of the given object
			for (var givenProp in given) {
				ret[givenProp] = Tone.defaultArg(fallback[givenProp], given[givenProp]);
			}
			for (var fallbackProp in fallback) {
				ret[fallbackProp] = Tone.defaultArg(given[fallbackProp], fallback[fallbackProp]);
			}
			return ret;
		} else {
			return Tone.isUndef(given) ? fallback : given;
		}
	};

	///////////////////////////////////////////////////////////////////////////
	//	CONNECTIONS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  connect the output of a ToneNode to an AudioParam, AudioNode, or ToneNode
	 *  @param  {Tone | AudioParam | AudioNode} unit 
	 *  @param {number} [outputNum=0] optionally which output to connect from
	 *  @param {number} [inputNum=0] optionally which input to connect to
	 *  @returns {Tone} this
	 *  @memberOf Tone#
	 */
	Tone.prototype.connect = function(unit, outputNum, inputNum){
		if (Tone.isArray(this.output)){
			outputNum = Tone.defaultArg(outputNum, 0);
			this.output[outputNum].connect(unit, 0, inputNum);
		} else {
			this.output.connect(unit, outputNum, inputNum);
		}
		return this;
	};

	/**
	 *  disconnect the output
	 *  @param {Number|AudioNode} output Either the output index to disconnect
	 *                                   if the output is an array, or the
	 *                                   node to disconnect from.
	 *  @returns {Tone} this
	 *  @memberOf Tone#
	 */
	Tone.prototype.disconnect = function(destination, outputNum, inputNum){
		if (Tone.isArray(this.output)){
			if (Tone.isNumber(destination)){
				this.output[destination].disconnect();
			} else {
				outputNum = Tone.defaultArg(outputNum, 0);
				this.output[outputNum].disconnect(destination, 0, inputNum);
			}
		} else {
			this.output.disconnect.apply(this.output, arguments);
		}
	};

	/**
	 *  Connect the output of this node to the rest of the nodes in series.
	 *  @example
	 *  //connect a node to an effect, panVol and then to the master output
	 *  node.chain(effect, panVol, Tone.Master);
	 *  @param {...AudioParam|Tone|AudioNode} nodes
	 *  @returns {Tone} this
	 *  @memberOf Tone#
	 */
	Tone.prototype.chain = function(){
		var currentUnit = this;
		for (var i = 0; i < arguments.length; i++){
			var toUnit = arguments[i];
			currentUnit.connect(toUnit);
			currentUnit = toUnit;
		}
		return this;
	};

	/**
	 *  connect the output of this node to the rest of the nodes in parallel.
	 *  @param {...AudioParam|Tone|AudioNode} nodes
	 *  @returns {Tone} this
	 *  @memberOf Tone#
	 */
	Tone.prototype.fan = function(){
		for (var i = 0; i < arguments.length; i++){
			this.connect(arguments[i]);
		}
		return this;
	};

	/**
	 *  connect together all of the arguments in series
	 *  @param {...AudioParam|Tone|AudioNode} nodes
	 *  @returns {Tone}
	 *  @memberOf Tone
	 *  @static
	 */
	Tone.connectSeries = function(){
		var currentUnit = arguments[0];
		for (var i = 1; i < arguments.length; i++){
			var toUnit = arguments[i];
			currentUnit.connect(toUnit);
			currentUnit = toUnit;
		}
		return Tone;
	};

	if (window.AudioNode){
		//give native nodes chain and fan methods
		AudioNode.prototype.chain = Tone.prototype.chain;
		AudioNode.prototype.fan = Tone.prototype.fan;
	}


	///////////////////////////////////////////////////////////////////////////
	// TYPE CHECKING
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  test if the arg is undefined
	 *  @param {*} arg the argument to test
	 *  @returns {boolean} true if the arg is undefined
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.isUndef = function(val){
		return typeof val === "undefined";
	};

	/**
	 *  test if the arg is a function
	 *  @param {*} arg the argument to test
	 *  @returns {boolean} true if the arg is a function
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.isFunction = function(val){
		return typeof val === "function";
	};

	/**
	 *  Test if the argument is a number.
	 *  @param {*} arg the argument to test
	 *  @returns {boolean} true if the arg is a number
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.isNumber = function(arg){
		return (typeof arg === "number");
	};

	/**
	 *  Test if the given argument is an object literal (i.e. `{}`);
	 *  @param {*} arg the argument to test
	 *  @returns {boolean} true if the arg is an object literal.
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.isObject = function(arg){
		return (Object.prototype.toString.call(arg) === "[object Object]" && arg.constructor === Object);
	};

	/**
	 *  Test if the argument is a boolean.
	 *  @param {*} arg the argument to test
	 *  @returns {boolean} true if the arg is a boolean
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.isBoolean = function(arg){
		return (typeof arg === "boolean");
	};

	/**
	 *  Test if the argument is an Array
	 *  @param {*} arg the argument to test
	 *  @returns {boolean} true if the arg is an array
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.isArray = function(arg){
		return (Array.isArray(arg));
	};

	/**
	 *  Test if the argument is a string.
	 *  @param {*} arg the argument to test
	 *  @returns {boolean} true if the arg is a string
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.isString = function(arg){
		return (typeof arg === "string");
	};

	/**
	 *  Test if the argument is in the form of a note in scientific pitch notation.
	 *  e.g. "C4"
	 *  @param {*} arg the argument to test
	 *  @returns {boolean} true if the arg is a string
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.isNote = function(arg){
		return Tone.isString(arg) && /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i.test(arg);
	};

 	/**
	 *  An empty function.
	 *  @static
	 */
	Tone.noOp = function(){};

	/**
	 *  Make the property not writable. Internal use only. 
	 *  @private
	 *  @param  {string}  property  the property to make not writable
	 */
	Tone.prototype._readOnly = function(property){
		if (Array.isArray(property)){
			for (var i = 0; i < property.length; i++){
				this._readOnly(property[i]);
			}
		} else {
			Object.defineProperty(this, property, { 
				writable: false,
				enumerable : true,
			});
		}
	};

	/**
	 *  Make an attribute writeable. Interal use only. 
	 *  @private
	 *  @param  {string}  property  the property to make writable
	 */
	Tone.prototype._writable = function(property){
		if (Array.isArray(property)){
			for (var i = 0; i < property.length; i++){
				this._writable(property[i]);
			}
		} else {
			Object.defineProperty(this, property, { 
				writable: true,
			});
		}
	};

	/**
	 * Possible play states. 
	 * @enum {string}
	 */
	Tone.State = {
		Started : "started",
		Stopped : "stopped",
		Paused : "paused",
 	};

	///////////////////////////////////////////////////////////////////////////
	// CONVERSIONS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Equal power gain scale. Good for cross-fading.
	 *  @param  {NormalRange} percent (0-1)
	 *  @return {Number}         output gain (0-1)
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.equalPowerScale = function(percent){
		var piFactor = 0.5 * Math.PI;
		return Math.sin(percent * piFactor);
	};

	/**
	 *  Convert decibels into gain.
	 *  @param  {Decibels} db
	 *  @return {Number} 
	 *  @static 
	 *  @memberOf Tone 
	 */
	Tone.dbToGain = function(db) {
		return Math.pow(2, db / 6);
	};

	/**
	 *  Convert gain to decibels.
	 *  @param  {Number} gain (0-1)
	 *  @return {Decibels}   
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.gainToDb = function(gain) {
		return  20 * (Math.log(gain) / Math.LN10);
	};

	/**
	 *  Convert an interval (in semitones) to a frequency ratio.
	 *  @param  {Interval} interval the number of semitones above the base note
	 *  @return {number}          the frequency ratio
	 *  @static
	 *  @memberOf Tone
	 *  @example
	 * tone.intervalToFrequencyRatio(0); // 1
	 * tone.intervalToFrequencyRatio(12); // 2
	 * tone.intervalToFrequencyRatio(-12); // 0.5
	 */
	Tone.intervalToFrequencyRatio = function(interval){
		return Math.pow(2,(interval/12));
	};

	///////////////////////////////////////////////////////////////////////////
	//	TIMING
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Return the current time of the AudioContext clock.
	 *  @return {Number} the currentTime from the AudioContext
	 *  @memberOf Tone#
	 */
	Tone.prototype.now = function(){
		return Tone.context.now();
	};

	/**
	 *  Return the current time of the AudioContext clock.
	 *  @return {Number} the currentTime from the AudioContext
	 *  @static
	 *  @memberOf Tone
	 */
	Tone.now = function(){
		return Tone.context.now();
	};

	///////////////////////////////////////////////////////////////////////////
	//	INHERITANCE
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  have a child inherit all of Tone's (or a parent's) prototype
	 *  to inherit the parent's properties, make sure to call 
	 *  Parent.call(this) in the child's constructor
	 *
	 *  based on closure library's inherit function
	 *
	 *  @memberOf Tone
	 *  @static
	 *  @param  {function} 	child  
	 *  @param  {function=} parent (optional) parent to inherit from
	 *                             if no parent is supplied, the child
	 *                             will inherit from Tone
	 */
	Tone.extend = function(child, parent){
		if (Tone.isUndef(parent)){
			parent = Tone;
		}
		function TempConstructor(){}
		TempConstructor.prototype = parent.prototype;
		child.prototype = new TempConstructor();
		/** @override */
		child.prototype.constructor = child;
		child._super = parent;
	};

	///////////////////////////////////////////////////////////////////////////
	//	CONTEXT
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  The private audio context shared by all Tone Nodes. 
	 *  @private
	 *  @type {Tone.Context|undefined}
	 */
	var audioContext;

	/**
	 *  A static pointer to the audio context accessible as Tone.context. 
	 *  @type {Tone.Context}
	 *  @name context
	 *  @memberOf Tone
	 */
	Object.defineProperty(Tone, "context", {
		get : function(){
			return audioContext;
		},
		set : function(context){
			if (Tone.Context && context instanceof Tone.Context){
				audioContext = context;
			} else {
				audioContext = new Tone.Context(context);
			}
			//initialize the new audio context
			Tone.Context.emit("init", audioContext);
		}
	});

	/**
	 *  The AudioContext
	 *  @type {Tone.Context}
	 *  @name context
	 *  @memberOf Tone#
	 *  @readOnly
	 */
	Object.defineProperty(Tone.prototype, "context", {
		get : function(){
			return Tone.context;
		}
	});

	/**
	 *  Tone automatically creates a context on init, but if you are working
	 *  with other libraries which also create an AudioContext, it can be
	 *  useful to set your own. If you are going to set your own context, 
	 *  be sure to do it at the start of your code, before creating any objects.
	 *  @static
	 *  @param {AudioContext} ctx The new audio context to set
	 */
	Tone.setContext = function(ctx){
		Tone.context = ctx;
	};

	///////////////////////////////////////////////////////////////////////////
	//	ATTRIBUTES
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  The number of inputs feeding into the AudioNode. 
	 *  For source nodes, this will be 0.
	 *  @memberOf Tone#
	 *  @type {Number}
	 *  @name numberOfInputs
	 *  @readOnly
	 */
	Object.defineProperty(Tone.prototype, "numberOfInputs", {
		get : function(){
			if (this.input){
				if (Tone.isArray(this.input)){
					return this.input.length;
				} else {
					return 1;
				}
			} else {
				return 0;
			}
		}
	});

	/**
	 *  The number of outputs coming out of the AudioNode. 
	 *  @memberOf Tone#
	 *  @type {Number}
	 *  @name numberOfOutputs
	 *  @readOnly
	 */
	Object.defineProperty(Tone.prototype, "numberOfOutputs", {
		get : function(){
			if (this.output){
				if (Tone.isArray(this.output)){
					return this.output.length;
				} else {
					return 1;
				}
			} else {
				return 0;
			}
		}
	});

	/**
	 *  The number of seconds of 1 processing block (128 samples)
	 *  @type {Number}
	 *  @name blockTime
	 *  @memberOf Tone
	 *  @static
	 *  @readOnly
	 */
	Object.defineProperty(Tone.prototype, "blockTime", {
		get : function(){
			return 128 / this.context.sampleRate;
		}
	});

	/**
	 *  The duration in seconds of one sample.
	 *  @type {Number}
	 *  @name sampleTime
	 *  @memberOf Tone
	 *  @static
	 *  @readOnly
	 */
	Object.defineProperty(Tone.prototype, "sampleTime", {
		get : function(){
			return 1 / this.context.sampleRate;
		}
	});

	/**
	 *  Whether or not all the technologies that Tone.js relies on are supported by the current browser. 
	 *  @type {Boolean}
	 *  @name supported
	 *  @memberOf Tone
	 *  @readOnly
	 *  @static
	 */
	Object.defineProperty(Tone, "supported", {
		get : function(){
			var hasAudioContext = window.hasOwnProperty("AudioContext") || window.hasOwnProperty("webkitAudioContext");
			var hasPromises = window.hasOwnProperty("Promise");
			var hasWorkers = window.hasOwnProperty("Worker");
			return hasAudioContext && hasPromises && hasWorkers;
		}
	});

	/**
	 * The version number
	 * @type {String}
	 * @static
	 */
	Tone.version = "r11-dev";

	// allow optional silencing of this log
	if (!window.TONE_SILENCE_VERSION_LOGGING) {
		console.log("%c * Tone.js " + Tone.version + " * ", "background: #000; color: #fff");
	}

	return Tone;
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 1 */,
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(9), __webpack_require__(8), __webpack_require__(41), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  A signal is an audio-rate value. Tone.Signal is a core component of the library.
	 *          Unlike a number, Signals can be scheduled with sample-level accuracy. Tone.Signal
	 *          has all of the methods available to native Web Audio 
	 *          [AudioParam](http://webaudio.github.io/web-audio-api/#the-audioparam-interface)
	 *          as well as additional conveniences. Read more about working with signals 
	 *          [here](https://github.com/Tonejs/Tone.js/wiki/Signals).
	 *
	 *  @constructor
	 *  @extends {Tone.Param}
	 *  @param {Number|AudioParam} [value] Initial value of the signal. If an AudioParam
	 *                                     is passed in, that parameter will be wrapped
	 *                                     and controlled by the Signal. 
	 *  @param {string} [units=Number] unit The units the signal is in. 
	 *  @example
	 * var signal = new Tone.Signal(10);
	 */
	Tone.Signal = function(){

		var options = Tone.defaults(arguments, ["value", "units"], Tone.Signal);
		var gainNode = Tone.context.createGain();
		options.param = gainNode.gain;
		Tone.Param.call(this, options);

		/**
		 * The node where the constant signal value is scaled.
		 * @type {GainNode}
		 * @private
		 */
		this.output = gainNode;

		/**
		 * The node where the value is set.
		 * @type {Tone.Param}
		 * @private
		 */
		this.input = this._param = this.output.gain;

		//connect the const output to the node output
		this.context.getConstant(1).chain(this.output);
	};

	Tone.extend(Tone.Signal, Tone.Param);

	/**
	 *  The default values
	 *  @type  {Object}
	 *  @static
	 *  @const
	 */
	Tone.Signal.defaults = {
		"value" : 0,
		"units" : Tone.Type.Default,
		"convert" : true,
	};

	/**
	 *  When signals connect to other signals or AudioParams, 
	 *  they take over the output value of that signal or AudioParam. 
	 *  For all other nodes, the behavior is the same as a default <code>connect</code>. 
	 *
	 *  @override
	 *  @param {AudioParam|AudioNode|Tone.Signal|Tone} node 
	 *  @param {number} [outputNumber=0] The output number to connect from.
	 *  @param {number} [inputNumber=0] The input number to connect to.
	 *  @returns {Tone.SignalBase} this
	 *  @method
	 */
	Tone.Signal.prototype.connect = Tone.SignalBase.prototype.connect;

	/**
	 *  dispose and disconnect
	 *  @returns {Tone.Signal} this
	 */
	Tone.Signal.prototype.dispose = function(){
		Tone.Param.prototype.dispose.call(this);
		return this;
	};

	return Tone.Signal;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(41), __webpack_require__(8)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	"use strict";

	/**
	 *  createGain shim
	 *  @private
	 */
	if (window.GainNode && !AudioContext.prototype.createGain){
		AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
	}

	/**
	 *  @class A thin wrapper around the Native Web Audio GainNode.
	 *         The GainNode is a basic building block of the Web Audio
	 *         API and is useful for routing audio and adjusting gains. 
	 *  @extends {Tone}
	 *  @param  {Number=}  gain  The initial gain of the GainNode
	 *  @param {Tone.Type=} units The units of the gain parameter. 
	 */
	Tone.Gain = function(){

		var options = Tone.defaults(arguments, ["gain", "units"], Tone.Gain);
		Tone.call(this);

		/**
		 *  The GainNode
		 *  @type  {GainNode}
		 *  @private
		 */
		this.input = this.output = this._gainNode = this.context.createGain();

		/**
		 *  The gain parameter of the gain node.
		 *  @type {Tone.Param}
		 *  @signal
		 */
		this.gain = new Tone.Param({
			"param" : this._gainNode.gain, 
			"units" : options.units,
			"value" : options.gain,
			"convert" : options.convert
		});
		this._readOnly("gain");
	};

	Tone.extend(Tone.Gain);

	/**
	 *  The defaults
	 *  @const
	 *  @type  {Object}
	 */
	Tone.Gain.defaults = {
		"gain" : 1,
		"convert" : true,
	};

	/**
	 *  Clean up.
	 *  @return  {Tone.Gain}  this
	 */
	Tone.Gain.prototype.dispose = function(){
		Tone.Param.prototype.dispose.call(this);
		this._gainNode.disconnect();
		this._gainNode = null;
		this._writable("gain");
		this.gain.dispose();
		this.gain = null;
	};

	/**
	 *  Create input and outputs for this object.
	 *  @param  {Number}  input   The number of inputs
	 *  @param  {Number=}  outputs  The number of outputs
	 *  @return  {Tone}  this
	 *  @private
	 */
	Tone.prototype.createInsOuts = function(inputs, outputs){

		if (inputs === 1){
			this.input = new Tone.Gain();
		} else if (inputs > 1){
			this.input = new Array(inputs);
		}

		if (outputs === 1){
			this.output = new Tone.Gain();
		} else if (outputs > 1){
			this.output = new Array(outputs);
		}
	};

	///////////////////////////////////////////////////////////////////////////

	return Tone.Gain;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.trackConfig = exports.supported = exports.useVoiceOver = exports.trackRadius = exports.title = exports.tubeColor = exports.sceneColor = exports.radius = exports.circleHeight = exports.unitsPerSecond = undefined;
exports.getTrackData = getTrackData;

var _Tone = __webpack_require__(0);

var _Tone2 = _interopRequireDefault(_Tone);

var _Detector = __webpack_require__(105);

var _Detector2 = _interopRequireDefault(_Detector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var unitsPerSecond = exports.unitsPerSecond = 7;
var circleHeight = exports.circleHeight = 0;
var radius = exports.radius = 1.1;
var sceneColor = exports.sceneColor = "#faa";
var tubeColor = exports.tubeColor = "#ffffff";
var title = exports.title = "Inside Music";
var trackRadius = exports.trackRadius = 2;
var useVoiceOver = exports.useVoiceOver = true;
var supported = exports.supported = true; //Detector.webgl && Tone.supported
var trackConfig = exports.trackConfig = [{
  artist: "Phoenix",
  track: "Ti Amo",
  folder: "phoenix",
  intro: "phoenix",
  segments: 6,
  duration: 208,
  // duration : 5,
  trackNames: ["bass", "piano", "sax", "trumpet"],
  names: ["bass", "piano", "sax", "trumpet"],
  soundRings: {
    startColor: "#f7002d",
    endColor: "#00edaa",
    shape: "triangle",
    size: 8
  },
  floor: {
    color: "#253934" //#263330'
  }
}];

function getTrackData(artist) {
  var index = trackConfig.findIndex(function (t) {
    return t.artist === artist;
  });
  return trackConfig[index];
}

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(15), __webpack_require__(8)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  AudioBuffer.copyToChannel polyfill
	 *  @private
	 */
	if (window.AudioBuffer && !AudioBuffer.prototype.copyToChannel){
		AudioBuffer.prototype.copyToChannel = function(src, chanNum, start){
			var channel = this.getChannelData(chanNum);
			start = start || 0;
			for (var i = 0; i < channel.length; i++){
				channel[i+start] = src[i];
			}
		};
		AudioBuffer.prototype.copyFromChannel = function(dest, chanNum, start){
			var channel = this.getChannelData(chanNum);
			start = start || 0;
			for (var i = 0; i < dest.length; i++){
				dest[i] = channel[i+start];
			}
		};
	}

	/**
	 *  @class  Buffer loading and storage. Tone.Buffer is used internally by all 
	 *          classes that make requests for audio files such as Tone.Player,
	 *          Tone.Sampler and Tone.Convolver.
	 *          
	 *          Aside from load callbacks from individual buffers, Tone.Buffer 
	 *  		provides events which keep track of the loading progress 
	 *  		of _all_ of the buffers. These are Tone.Buffer.on("load" / "progress" / "error")
	 *
	 *  @constructor 
	 *  @extends {Tone}
	 *  @param {AudioBuffer|String} url The url to load, or the audio buffer to set. 
	 *  @param {Function=} onload A callback which is invoked after the buffer is loaded. 
	 *                            It's recommended to use `Tone.Buffer.on('load', callback)` instead 
	 *                            since it will give you a callback when _all_ buffers are loaded.
	 *  @param {Function=} onerror The callback to invoke if there is an error
	 *  @example
	 * var buffer = new Tone.Buffer("path/to/sound.mp3", function(){
	 * 	//the buffer is now available.
	 * 	var buff = buffer.get();
	 * });
	 *  @example
	 * //can load provide fallback extension types if the first type is not supported.
	 * var buffer = new Tone.Buffer("path/to/sound.[mp3|ogg|wav]");
	 */
	Tone.Buffer = function(){

		var options = Tone.defaults(arguments, ["url", "onload", "onerror"], Tone.Buffer);
		Tone.call(this);

		/**
		 *  stores the loaded AudioBuffer
		 *  @type {AudioBuffer}
		 *  @private
		 */
		this._buffer = null;

		/**
		 *  indicates if the buffer should be reversed or not
		 *  @type {Boolean}
		 *  @private
		 */
		this._reversed = options.reverse;

		/**
		 *  The XHR
		 *  @type  {XMLHttpRequest}
		 *  @private
		 */
		this._xhr = null;

		if (options.url instanceof AudioBuffer || options.url instanceof Tone.Buffer){
			this.set(options.url);
			// invoke the onload callback
			if (options.onload){
				options.onload(this);
			}
		} else if (Tone.isString(options.url)){
			this.load(options.url, options.onload, options.onerror);
		}
	};

	Tone.extend(Tone.Buffer);

	/**
	 *  the default parameters
	 *  @type {Object}
	 */
	Tone.Buffer.defaults = {
		"url" : undefined,
		"reverse" : false
	};

	/**
	 *  Pass in an AudioBuffer or Tone.Buffer to set the value
	 *  of this buffer.
	 *  @param {AudioBuffer|Tone.Buffer} buffer the buffer
	 *  @returns {Tone.Buffer} this
	 */
	Tone.Buffer.prototype.set = function(buffer){
		if (buffer instanceof Tone.Buffer){
			this._buffer = buffer.get();
		} else {
			this._buffer = buffer;
		}
		return this;
	};

	/**
	 *  @return {AudioBuffer} The audio buffer stored in the object.
	 */
	Tone.Buffer.prototype.get = function(){
		return this._buffer;
	};

	/**
	 *  Makes an xhr reqest for the selected url then decodes
	 *  the file as an audio buffer. Invokes
	 *  the callback once the audio buffer loads.
	 *  @param {String} url The url of the buffer to load.
	 *                      filetype support depends on the
	 *                      browser.
	 *  @returns {Promise} returns a Promise which resolves with the Tone.Buffer
	 */
	Tone.Buffer.prototype.load = function(url, onload, onerror){

		var promise = new Promise(function(load, error){

			this._xhr = Tone.Buffer.load(url, 

				//success
				function(buff){
					this._xhr = null;
					this.set(buff);
					load(this);
					if (onload){
						onload(this);
					}
				}.bind(this), 

				//error
				function(err){
					this._xhr = null;
					error(err);
					if (onerror){
						onerror(err);
					}
				}.bind(this));

		}.bind(this));

		return promise;
	};

	/**
	 *  dispose and disconnect
	 *  @returns {Tone.Buffer} this
	 */
	Tone.Buffer.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._buffer = null;
		if (this._xhr){
			Tone.Buffer._removeFromDownloadQueue(this._xhr);
			this._xhr.abort();
			this._xhr = null;
		}
		return this;
	};

	/**
	 * If the buffer is loaded or not
	 * @memberOf Tone.Buffer#
	 * @type {Boolean}
	 * @name loaded
	 * @readOnly
	 */
	Object.defineProperty(Tone.Buffer.prototype, "loaded", {
		get : function(){
			return this.length > 0;
		},
	});

	/**
	 * The duration of the buffer. 
	 * @memberOf Tone.Buffer#
	 * @type {Number}
	 * @name duration
	 * @readOnly
	 */
	Object.defineProperty(Tone.Buffer.prototype, "duration", {
		get : function(){
			if (this._buffer){
				return this._buffer.duration;
			} else {
				return 0;
			}
		},
	});

	/**
	 * The length of the buffer in samples
	 * @memberOf Tone.Buffer#
	 * @type {Number}
	 * @name length
	 * @readOnly
	 */
	Object.defineProperty(Tone.Buffer.prototype, "length", {
		get : function(){
			if (this._buffer){
				return this._buffer.length;
			} else {
				return 0;
			}
		},
	});

	/**
	 * The number of discrete audio channels. Returns 0 if no buffer
	 * is loaded.
	 * @memberOf Tone.Buffer#
	 * @type {Number}
	 * @name numberOfChannels
	 * @readOnly
	 */
	Object.defineProperty(Tone.Buffer.prototype, "numberOfChannels", {
		get : function(){
			if (this._buffer){
				return this._buffer.numberOfChannels;
			} else {
				return 0;
			}
		},
	});

	/**
	 *  Set the audio buffer from the array. To create a multichannel AudioBuffer,
	 *  pass in a multidimensional array. 
	 *  @param {Float32Array} array The array to fill the audio buffer
	 *  @return {Tone.Buffer} this
	 */
	Tone.Buffer.prototype.fromArray = function(array){
		var isMultidimensional = array[0].length > 0;
		var channels = isMultidimensional ? array.length : 1;
		var len = isMultidimensional ? array[0].length : array.length;
		var buffer = this.context.createBuffer(channels, len, this.context.sampleRate);
		if (!isMultidimensional && channels === 1){
			array = [array];
		}
		for (var c = 0; c < channels; c++){
			buffer.copyToChannel(array[c], c);
		}
		this._buffer = buffer;
		return this;
	};

	/**
	 * 	Sums muliple channels into 1 channel
	 *  @param {Number=} channel Optionally only copy a single channel from the array.
	 *  @return {Array}
	 */
	Tone.Buffer.prototype.toMono = function(chanNum){
		if (Tone.isNumber(chanNum)){
			this.fromArray(this.toArray(chanNum));
		} else {
			var outputArray = new Float32Array(this.length);
			var numChannels = this.numberOfChannels;
			for (var channel = 0; channel < numChannels; channel++){
				var channelArray = this.toArray(channel);
				for (var i = 0; i < channelArray.length; i++){
					outputArray[i] += channelArray[i];
				}
			}
			//divide by the number of channels
			outputArray = outputArray.map(function(sample){
				return sample / numChannels;
			});
			this.fromArray(outputArray);
		}
		return this;
	};

	/**
	 * 	Get the buffer as an array. Single channel buffers will return a 1-dimensional 
	 * 	Float32Array, and multichannel buffers will return multidimensional arrays.
	 *  @param {Number=} channel Optionally only copy a single channel from the array.
	 *  @return {Array}
	 */
	Tone.Buffer.prototype.toArray = function(channel){
		if (Tone.isNumber(channel)){
			return this.getChannelData(channel);
		} else if (this.numberOfChannels === 1){
			return this.toArray(0);
		} else {
			var ret = [];
			for (var c = 0; c < this.numberOfChannels; c++){
				ret[c] = this.getChannelData(c);
			}
			return ret;
		}
	};

	/**
	 *  Returns the Float32Array representing the PCM audio data for the specific channel.
	 *  @param  {Number}  channel  The channel number to return
	 *  @return  {Float32Array}  The audio as a TypedArray
	 */
	Tone.Buffer.prototype.getChannelData = function(channel){
		return this._buffer.getChannelData(channel);
	};

	/**
	 *  Cut a subsection of the array and return a buffer of the
	 *  subsection. Does not modify the original buffer
	 *  @param {Time} start The time to start the slice
	 *  @param {Time=} end The end time to slice. If none is given
	 *                     will default to the end of the buffer
	 *  @return {Tone.Buffer} this
	 */
	Tone.Buffer.prototype.slice = function(start, end){
		end = Tone.defaultArg(end, this.duration);
		var startSamples = Math.floor(this.context.sampleRate * this.toSeconds(start));
		var endSamples = Math.floor(this.context.sampleRate * this.toSeconds(end));
		var replacement = [];
		for (var i = 0; i < this.numberOfChannels; i++){
			replacement[i] = this.toArray(i).slice(startSamples, endSamples);
		}
		var retBuffer = new Tone.Buffer().fromArray(replacement);
		return retBuffer;
	};

	/**
	 *  Reverse the buffer.
	 *  @private
	 *  @return {Tone.Buffer} this
	 */
	Tone.Buffer.prototype._reverse = function(){
		if (this.loaded){
			for (var i = 0; i < this.numberOfChannels; i++){
				Array.prototype.reverse.call(this.getChannelData(i));
			}
		}
		return this;
	};

	/**
	 * Reverse the buffer.
	 * @memberOf Tone.Buffer#
	 * @type {Boolean}
	 * @name reverse
	 */
	Object.defineProperty(Tone.Buffer.prototype, "reverse", {
		get : function(){
			return this._reversed;
		},
		set : function(rev){
			if (this._reversed !== rev){
				this._reversed = rev;
				this._reverse();
			}
		},
	});

	///////////////////////////////////////////////////////////////////////////
	// STATIC METHODS
	///////////////////////////////////////////////////////////////////////////

	//statically inherits Emitter methods
	Tone.Emitter.mixin(Tone.Buffer);
	 
	/**
	 *  the static queue for all of the xhr requests
	 *  @type {Array}
	 *  @private
	 */
	Tone.Buffer._downloadQueue = [];

	/**
	 *  A path which is prefixed before every url.
	 *  @type  {String}
	 *  @static
	 */
	Tone.Buffer.baseUrl = "";

	/**
	 *  Create a Tone.Buffer from the array. To create a multichannel AudioBuffer,
	 *  pass in a multidimensional array. 
	 *  @param {Float32Array} array The array to fill the audio buffer
	 *  @return {Tone.Buffer} A Tone.Buffer created from the array
	 */
	Tone.Buffer.fromArray = function(array){
		return (new Tone.Buffer()).fromArray(array);
	};

	/**
	 * Remove an xhr request from the download queue
	 * @private
	 */
	Tone.Buffer._removeFromDownloadQueue = function(request){
		var index = Tone.Buffer._downloadQueue.indexOf(request);
		if (index !== -1){
			Tone.Buffer._downloadQueue.splice(index, 1);
		}
	};

	/**
	 *  Loads a url using XMLHttpRequest.
	 *  @param {String} url
	 *  @param {Function} onload
	 *  @param {Function} onerror
	 *  @param {Function} onprogress
	 *  @return {XMLHttpRequest}
	 */
	Tone.Buffer.load = function(url, onload, onerror){
		//default
		onload = Tone.defaultArg(onload, Tone.noOp);

		// test if the url contains multiple extensions
		var matches = url.match(/\[(.+\|?)+\]$/);
		if (matches){
			var extensions = matches[1].split("|");
			var extension = extensions[0];
			for (var i = 0; i < extensions.length; i++){
				if (Tone.Buffer.supportsType(extensions[i])){
					extension = extensions[i];
					break;
				}
			}
			url = url.replace(matches[0], extension);
		}

		function onError(e){
			Tone.Buffer._removeFromDownloadQueue(request);
			Tone.Buffer.emit("error", e);
			if (onerror){
				onerror(e);
			} else {
				throw e;
			}
		}

		function onProgress(){
			//calculate the progress
			var totalProgress = 0;
			for (var i = 0; i < Tone.Buffer._downloadQueue.length; i++){
				totalProgress += Tone.Buffer._downloadQueue[i].progress;
			}
			Tone.Buffer.emit("progress", totalProgress / Tone.Buffer._downloadQueue.length);
		}

		var request = new XMLHttpRequest();
		request.open("GET", Tone.Buffer.baseUrl + url, true);
		request.responseType = "arraybuffer";
		//start out as 0
		request.progress = 0;

		Tone.Buffer._downloadQueue.push(request);

		request.addEventListener("load", function(){

			if (request.status === 200){
				Tone.context.decodeAudioData(request.response, function(buff) {

					request.progress = 1;
					onProgress();
					onload(buff);

					Tone.Buffer._removeFromDownloadQueue(request);
					if (Tone.Buffer._downloadQueue.length === 0){
						//emit the event at the end
						Tone.Buffer.emit("load");
					}
				}, function(){
					Tone.Buffer._removeFromDownloadQueue(request);
					onError("Tone.Buffer: could not decode audio data: "+url);
				});
			} else {
				onError("Tone.Buffer: could not locate file: "+url);
			}
		});
		request.addEventListener("error", onError);

		request.addEventListener("progress", function(event){
			if (event.lengthComputable){
				//only go to 95%, the last 5% is when the audio is decoded
				request.progress = (event.loaded / event.total) * 0.95;
				onProgress();
			}
		});

		request.send();

		return request;
	};

	/**
	 *  Stop all of the downloads in progress
	 *  @return {Tone.Buffer}
	 *  @static
	 */
	Tone.Buffer.cancelDownloads = function(){
		Tone.Buffer._downloadQueue.slice().forEach(function(request){
			Tone.Buffer._removeFromDownloadQueue(request);
			request.abort();
		});
		return Tone.Buffer;
	};

	/**
	 *  Checks a url's extension to see if the current browser can play that file type.
	 *  @param {String} url The url/extension to test
	 *  @return {Boolean} If the file extension can be played
	 *  @static
	 *  @example
	 * Tone.Buffer.supportsType("wav"); //returns true
	 * Tone.Buffer.supportsType("path/to/file.wav"); //returns true
	 */
	Tone.Buffer.supportsType = function(url){
		var extension = url.split(".");
		extension = extension[extension.length - 1];
		var response = document.createElement("audio").canPlayType("audio/"+extension);
		return response !== "";
	};

	/**
	 *  Returns a Promise which resolves when all of the buffers have loaded
	 *  @return {Promise}
	 */
	Tone.loaded = function(){
		var onload, onerror;
		function removeEvents(){
			//remove the events when it's resolved
			Tone.Buffer.off("load", onload);
			Tone.Buffer.off("error", onerror);
		}
		return new Promise(function(success, fail){
			onload = function(){
				success();
			};
			onerror = function(){
				fail();
			};
			//add the event listeners
			Tone.Buffer.on("load", onload);
			Tone.Buffer.on("error", onerror);
		}).then(removeEvents).catch(function(e){
			removeEvents();
			throw new Error(e);
		});
	};

	return Tone.Buffer;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(118), __webpack_require__(8), __webpack_require__(17), 
	__webpack_require__(15), __webpack_require__(3), __webpack_require__(119)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  Transport for timing musical events.
	 *          Supports tempo curves and time changes. Unlike browser-based timing (setInterval, requestAnimationFrame)
	 *          Tone.Transport timing events pass in the exact time of the scheduled event
	 *          in the argument of the callback function. Pass that time value to the object
	 *          you're scheduling. <br><br>
	 *          A single transport is created for you when the library is initialized. 
	 *          <br><br>
	 *          The transport emits the events: "start", "stop", "pause", and "loop" which are
	 *          called with the time of that event as the argument. 
	 *
	 *  @extends {Tone.Emitter}
	 *  @singleton
	 *  @example
	 * //repeated event every 8th note
	 * Tone.Transport.scheduleRepeat(function(time){
	 * 	//do something with the time
	 * }, "8n");
	 *  @example
	 * //schedule an event on the 16th measure
	 * Tone.Transport.schedule(function(time){
	 * 	//do something with the time
	 * }, "16:0:0");
	 */
	Tone.Transport = function(){

		Tone.Emitter.call(this);

		///////////////////////////////////////////////////////////////////////
		//	LOOPING
		//////////////////////////////////////////////////////////////////////

		/** 
		 * 	If the transport loops or not.
		 *  @type {boolean}
		 */
		this.loop = false;

		/** 
		 * 	The loop start position in ticks
		 *  @type {Ticks}
		 *  @private
		 */
		this._loopStart = 0;

		/** 
		 * 	The loop end position in ticks
		 *  @type {Ticks}
		 *  @private
		 */
		this._loopEnd = 0;

		///////////////////////////////////////////////////////////////////////
		//	CLOCK/TEMPO
		//////////////////////////////////////////////////////////////////////

		/**
		 *  Pulses per quarter is the number of ticks per quarter note.
		 *  @private
		 *  @type  {Number}
		 */
		this._ppq = TransportConstructor.defaults.PPQ;

		/**
		 *  watches the main oscillator for timing ticks
		 *  initially starts at 120bpm
		 *  @private
		 *  @type {Tone.Clock}
		 */
		this._clock = new Tone.Clock({
			"callback" : this._processTick.bind(this), 
			"frequency" : 0,
		});

		this._bindClockEvents();

		/**
		 *  The Beats Per Minute of the Transport. 
		 *  @type {BPM}
		 *  @signal
		 *  @example
		 * Tone.Transport.bpm.value = 80;
		 * //ramp the bpm to 120 over 10 seconds
		 * Tone.Transport.bpm.rampTo(120, 10);
		 */
		this.bpm = this._clock.frequency;
		this.bpm._toUnits = this._toUnits.bind(this);
		this.bpm._fromUnits = this._fromUnits.bind(this);
		this.bpm.units = Tone.Type.BPM;
		this.bpm.value = TransportConstructor.defaults.bpm;
		this._readOnly("bpm");

		/**
		 *  The time signature, or more accurately the numerator
		 *  of the time signature over a denominator of 4. 
		 *  @type {Number}
		 *  @private
		 */
		this._timeSignature = TransportConstructor.defaults.timeSignature;

		///////////////////////////////////////////////////////////////////////
		//	TIMELINE EVENTS
		//////////////////////////////////////////////////////////////////////

		/**
		 *  All the events in an object to keep track by ID
		 *  @type {Object}
		 *  @private
		 */
		this._scheduledEvents = {};

		/**
		 *  The event ID counter
		 *  @type {Number}
		 *  @private
		 */
		this._eventID = 0;

		/**
		 * 	The scheduled events.
		 *  @type {Tone.Timeline}
		 *  @private
		 */
		this._timeline = new Tone.Timeline();

		/**
		 *  Repeated events
		 *  @type {Array}
		 *  @private
		 */
		this._repeatedEvents = new Tone.IntervalTimeline();

		/**
		 *  Events that occur once
		 *  @type {Array}
		 *  @private
		 */
		this._onceEvents = new Tone.Timeline();

		/** 
		 *  All of the synced Signals
		 *  @private 
		 *  @type {Array}
		 */
		this._syncedSignals = [];

		///////////////////////////////////////////////////////////////////////
		//	SWING
		//////////////////////////////////////////////////////////////////////

		/**
		 *  The subdivision of the swing
		 *  @type  {Ticks}
		 *  @private
		 */
		this._swingTicks = TransportConstructor.defaults.PPQ / 2; //8n

		/**
		 *  The swing amount
		 *  @type {NormalRange}
		 *  @private
		 */
		this._swingAmount = 0;

	};

	Tone.extend(Tone.Transport, Tone.Emitter);

	/**
	 *  the defaults
	 *  @type {Object}
	 *  @const
	 *  @static
	 */
	Tone.Transport.defaults = {
		"bpm" : 120,
		"swing" : 0,
		"swingSubdivision" : "8n",
		"timeSignature" : 4,
		"loopStart" : 0,
		"loopEnd" : "4m",
		"PPQ" : 192
	};

	///////////////////////////////////////////////////////////////////////////////
	//	TICKS
	///////////////////////////////////////////////////////////////////////////////

	/**
	 *  called on every tick
	 *  @param   {number} tickTime clock relative tick time
	 *  @private
	 */
	Tone.Transport.prototype._processTick = function(tickTime){
		var ticks = this._clock.ticks;
		//handle swing
		if (this._swingAmount > 0 && 
			ticks % this._ppq !== 0 && //not on a downbeat
			ticks % (this._swingTicks * 2) !== 0){
			//add some swing
			var progress = (ticks % (this._swingTicks * 2)) / (this._swingTicks * 2);
			var amount = Math.sin((progress) * Math.PI) * this._swingAmount;
			tickTime += Tone.Time(this._swingTicks * 2/3, "i") * amount;
		} 
		//do the loop test
		if (this.loop){
			if (ticks >= this._loopEnd){
				this.emit("loopEnd", tickTime);
				this._clock.ticks = this._loopStart;
				ticks = this._loopStart;
				this.emit("loopStart", tickTime, this.seconds);
				this.emit("loop", tickTime);
			}
		}
		//process the single occurrence events
		this._onceEvents.forEachBefore(ticks, function(event){
			event.callback(tickTime);
			//remove the event
			delete this._scheduledEvents[event.id.toString()];
		}.bind(this));
		//and clear the single occurrence timeline
		this._onceEvents.cancelBefore(ticks);
		//fire the next tick events if their time has come
		this._timeline.forEachAtTime(ticks, function(event){
			event.callback(tickTime);
		});
		//process the repeated events
		this._repeatedEvents.forEachAtTime(ticks, function(event){
			if ((ticks - event.time) % event.interval === 0){
				event.callback(tickTime);
			}
		});
	};

	///////////////////////////////////////////////////////////////////////////////
	//	SCHEDULABLE EVENTS
	///////////////////////////////////////////////////////////////////////////////

	/**
	 *  Schedule an event along the timeline.
	 *  @param {Function} callback The callback to be invoked at the time.
	 *  @param {TransportTime}  time The time to invoke the callback at.
	 *  @return {Number} The id of the event which can be used for canceling the event. 
	 *  @example
	 * //trigger the callback when the Transport reaches the desired time
	 * Tone.Transport.schedule(function(time){
	 * 	envelope.triggerAttack(time);
	 * }, "128i");
	 */
	Tone.Transport.prototype.schedule = function(callback, time){
		var event = {
			"time" : this.toTicks(time),
			"callback" : callback
		};
		var id = this._eventID++;
		this._scheduledEvents[id.toString()] = {
			"event" : event,
			"timeline" : this._timeline
		};
		this._timeline.add(event);
		return id;
	};

	/**
	 *  Schedule a repeated event along the timeline. The event will fire
	 *  at the `interval` starting at the `startTime` and for the specified
	 *  `duration`. 
	 *  @param  {Function}  callback   The callback to invoke.
	 *  @param  {Time}    interval   The duration between successive
	 *                               callbacks.
	 *  @param  {TimelinePosition=}    startTime  When along the timeline the events should
	 *                               start being invoked.
	 *  @param {Time} [duration=Infinity] How long the event should repeat. 
	 *  @return  {Number}    The ID of the scheduled event. Use this to cancel
	 *                           the event. 
	 *  @example
	 * //a callback invoked every eighth note after the first measure
	 * Tone.Transport.scheduleRepeat(callback, "8n", "1m");
	 */
	Tone.Transport.prototype.scheduleRepeat = function(callback, interval, startTime, duration){
		if (interval <= 0){
			throw new Error("Tone.Transport: repeat events must have an interval larger than 0");
		}
		var event = {
			"time" : this.toTicks(startTime),
			"duration" : this.toTicks(Tone.defaultArg(duration, Infinity)),
			"interval" : this.toTicks(interval),
			"callback" : callback
		};
		var id = this._eventID++;
		this._scheduledEvents[id.toString()] = {
			"event" : event,
			"timeline" : this._repeatedEvents
		};
		this._repeatedEvents.add(event);
		return id;
	};

	/**
	 *  Schedule an event that will be removed after it is invoked. 
	 *  Note that if the given time is less than the current transport time, 
	 *  the event will be invoked immediately. 
	 *  @param {Function} callback The callback to invoke once.
	 *  @param {TransportTime} time The time the callback should be invoked.
	 *  @returns {Number} The ID of the scheduled event. 
	 */
	Tone.Transport.prototype.scheduleOnce = function(callback, time){
		var id = this._eventID++;
		var event = {
			"time" : this.toTicks(time),
			"callback" : callback,
			"id" : id
		};
		this._scheduledEvents[id.toString()] = {
			"event" : event,
			"timeline" : this._onceEvents
		};
		this._onceEvents.add(event);
		return id;
	};

	/**
	 *  Clear the passed in event id from the timeline
	 *  @param {Number} eventId The id of the event.
	 *  @returns {Tone.Transport} this
	 */
	Tone.Transport.prototype.clear = function(eventId){
		if (this._scheduledEvents.hasOwnProperty(eventId)){
			var item = this._scheduledEvents[eventId.toString()];
			item.timeline.remove(item.event);
			delete this._scheduledEvents[eventId.toString()];
		}
		return this;
	};

	/**
	 *  Remove scheduled events from the timeline after
	 *  the given time. Repeated events will be removed
	 *  if their startTime is after the given time
	 *  @param {TransportTime} [after=0] Clear all events after
	 *                          this time. 
	 *  @returns {Tone.Transport} this
	 */
	Tone.Transport.prototype.cancel = function(after){
		after = Tone.defaultArg(after, 0);
		after = this.toTicks(after);
		this._timeline.cancel(after);
		this._onceEvents.cancel(after);
		this._repeatedEvents.cancel(after);
		return this;
	};

	///////////////////////////////////////////////////////////////////////////////
	//	START/STOP/PAUSE
	///////////////////////////////////////////////////////////////////////////////

	/**
	 *  Bind start/stop/pause events from the clock and emit them.
	 *  @private
	 */
	Tone.Transport.prototype._bindClockEvents = function(){
		this._clock.on("start", function(time, offset){
			offset = Tone.Time(this._clock.ticks, "i").toSeconds();
			this.emit("start", time, offset);
		}.bind(this));

		this._clock.on("stop", function(time){
			this.emit("stop", time);
		}.bind(this));

		this._clock.on("pause", function(time){
			this.emit("pause", time);
		}.bind(this));
	};

	/**
	 *  Returns the playback state of the source, either "started", "stopped", or "paused"
	 *  @type {Tone.State}
	 *  @readOnly
	 *  @memberOf Tone.Transport#
	 *  @name state
	 */
	Object.defineProperty(Tone.Transport.prototype, "state", {
		get : function(){
			return this._clock.getStateAtTime(this.now());
		}
	});

	/**
	 *  Start the transport and all sources synced to the transport.
	 *  @param  {Time} [time=now] The time when the transport should start.
	 *  @param  {TransportTime=} offset The timeline offset to start the transport.
	 *  @returns {Tone.Transport} this
	 *  @example
	 * //start the transport in one second starting at beginning of the 5th measure. 
	 * Tone.Transport.start("+1", "4:0:0");
	 */
	Tone.Transport.prototype.start = function(time, offset){
		//start the clock
		if (!Tone.isUndef(offset)){
			offset = this.toTicks(offset);
		}
		this._clock.start(time, offset);
		return this;
	};

	/**
	 *  Stop the transport and all sources synced to the transport.
	 *  @param  {Time} [time=now] The time when the transport should stop. 
	 *  @returns {Tone.Transport} this
	 *  @example
	 * Tone.Transport.stop();
	 */
	Tone.Transport.prototype.stop = function(time){
		this._clock.stop(time);
		return this;
	};

	/**
	 *  Pause the transport and all sources synced to the transport.
	 *  @param  {Time} [time=now]
	 *  @returns {Tone.Transport} this
	 */
	Tone.Transport.prototype.pause = function(time){
		this._clock.pause(time);
		return this;
	};

	/**
	 * Toggle the current state of the transport. If it is
	 * started, it will stop it, otherwise it will start the Transport.
	 * @param  {Time=} time The time of the event
	 * @return {Tone.Transport}      this
	 */
	Tone.Transport.prototype.toggle = function(time){
		time = this.toSeconds(time);
		if (this._clock.getStateAtTime(time) !== Tone.State.Started){
			this.start(time);
		} else {
			this.stop(time);
		}
		return this;
	};

	///////////////////////////////////////////////////////////////////////////////
	//	SETTERS/GETTERS
	///////////////////////////////////////////////////////////////////////////////

	/**
	 *  The time signature as just the numerator over 4. 
	 *  For example 4/4 would be just 4 and 6/8 would be 3.
	 *  @memberOf Tone.Transport#
	 *  @type {Number|Array}
	 *  @name timeSignature
	 *  @example
	 * //common time
	 * Tone.Transport.timeSignature = 4;
	 * // 7/8
	 * Tone.Transport.timeSignature = [7, 8];
	 * //this will be reduced to a single number
	 * Tone.Transport.timeSignature; //returns 3.5
	 */
	Object.defineProperty(Tone.Transport.prototype, "timeSignature", {
		get : function(){
			return this._timeSignature;
		},
		set : function(timeSig){
			if (Tone.isArray(timeSig)){
				timeSig = (timeSig[0] / timeSig[1]) * 4;
			}
			this._timeSignature = timeSig;
		}
	});


	/**
	 * When the Tone.Transport.loop = true, this is the starting position of the loop.
	 * @memberOf Tone.Transport#
	 * @type {TransportTime}
	 * @name loopStart
	 */
	Object.defineProperty(Tone.Transport.prototype, "loopStart", {
		get : function(){
			return Tone.TransportTime(this._loopStart, "i").toSeconds();
		},
		set : function(startPosition){
			this._loopStart = this.toTicks(startPosition);
		}
	});

	/**
	 * When the Tone.Transport.loop = true, this is the ending position of the loop.
	 * @memberOf Tone.Transport#
	 * @type {TransportTime}
	 * @name loopEnd
	 */
	Object.defineProperty(Tone.Transport.prototype, "loopEnd", {
		get : function(){
			return Tone.TransportTime(this._loopEnd, "i").toSeconds();
		},
		set : function(endPosition){
			this._loopEnd = this.toTicks(endPosition);
		}
	});

	/**
	 *  Set the loop start and stop at the same time. 
	 *  @param {TransportTime} startPosition 
	 *  @param {TransportTime} endPosition   
	 *  @returns {Tone.Transport} this
	 *  @example
	 * //loop over the first measure
	 * Tone.Transport.setLoopPoints(0, "1m");
	 * Tone.Transport.loop = true;
	 */
	Tone.Transport.prototype.setLoopPoints = function(startPosition, endPosition){
		this.loopStart = startPosition;
		this.loopEnd = endPosition;
		return this;
	};

	/**
	 *  The swing value. Between 0-1 where 1 equal to 
	 *  the note + half the subdivision.
	 *  @memberOf Tone.Transport#
	 *  @type {NormalRange}
	 *  @name swing
	 */
	Object.defineProperty(Tone.Transport.prototype, "swing", {
		get : function(){
			return this._swingAmount;
		},
		set : function(amount){
			//scale the values to a normal range
			this._swingAmount = amount;
		}
	});

	/**
	 *  Set the subdivision which the swing will be applied to. 
	 *  The default value is an 8th note. Value must be less 
	 *  than a quarter note.
	 *  
	 *  @memberOf Tone.Transport#
	 *  @type {Time}
	 *  @name swingSubdivision
	 */
	Object.defineProperty(Tone.Transport.prototype, "swingSubdivision", {
		get : function(){
			return Tone.Time(this._swingTicks, "i").toNotation();
		},
		set : function(subdivision){
			this._swingTicks = this.toTicks(subdivision);
		}
	});

	/**
	 *  The Transport's position in Bars:Beats:Sixteenths.
	 *  Setting the value will jump to that position right away. 
	 *  @memberOf Tone.Transport#
	 *  @type {BarsBeatsSixteenths}
	 *  @name position
	 */
	Object.defineProperty(Tone.Transport.prototype, "position", {
		get : function(){
			return Tone.TransportTime(this.ticks, "i").toBarsBeatsSixteenths();
		},
		set : function(progress){
			var ticks = this.toTicks(progress);
			this.ticks = ticks;
		}
	});

	/**
	 *  The Transport's position in seconds
	 *  Setting the value will jump to that position right away. 
	 *  @memberOf Tone.Transport#
	 *  @type {Seconds}
	 *  @name seconds
	 */
	Object.defineProperty(Tone.Transport.prototype, "seconds", {
		get : function(){
			return Tone.TransportTime(this.ticks, "i").toSeconds();
		},
		set : function(progress){
			var ticks = this.toTicks(progress);
			this.ticks = ticks;
		}
	});

	/**
	 *  The Transport's loop position as a normalized value. Always
	 *  returns 0 if the transport if loop is not true. 
	 *  @memberOf Tone.Transport#
	 *  @name progress
	 *  @type {NormalRange}
	 */
	Object.defineProperty(Tone.Transport.prototype, "progress", {
		get : function(){
			if (this.loop){
				return (this.ticks - this._loopStart) / (this._loopEnd - this._loopStart);
			} else {
				return 0;
			}
		}
	});

	/**
	 *  The transports current tick position.
	 *  
	 *  @memberOf Tone.Transport#
	 *  @type {Ticks}
	 *  @name ticks
	 */
	Object.defineProperty(Tone.Transport.prototype, "ticks", {
		get : function(){
			return this._clock.ticks;
		},
		set : function(t){
			if (this._clock.ticks !== t){
				var now = this.now();
				//stop everything synced to the transport
				if (this.state === Tone.State.Started){
					this.emit("stop", now);
					this._clock.ticks = t;
					//restart it with the new time
					this.emit("start", now, this.seconds);
				} else {
					this._clock.ticks = t;
				}
			}
		}
	});

	/**
	 *  Pulses Per Quarter note. This is the smallest resolution
	 *  the Transport timing supports. This should be set once
	 *  on initialization and not set again. Changing this value 
	 *  after other objects have been created can cause problems. 
	 *  
	 *  @memberOf Tone.Transport#
	 *  @type {Number}
	 *  @name PPQ
	 */
	Object.defineProperty(Tone.Transport.prototype, "PPQ", {
		get : function(){
			return this._ppq;
		},
		set : function(ppq){
			var bpm = this.bpm.value;
			this._ppq = ppq;
			this.bpm.value = bpm;
		}
	});

	/**
	 *  Convert from BPM to frequency (factoring in PPQ)
	 *  @param  {BPM}  bpm The BPM value to convert to frequency
	 *  @return  {Frequency}  The BPM as a frequency with PPQ factored in.
	 *  @private
	 */
	Tone.Transport.prototype._fromUnits = function(bpm){
		return 1 / (60 / bpm / this.PPQ);
	};

	/**
	 *  Convert from frequency (with PPQ) into BPM
	 *  @param  {Frequency}  freq The clocks frequency to convert to BPM
	 *  @return  {BPM}  The frequency value as BPM.
	 *  @private
	 */
	Tone.Transport.prototype._toUnits = function(freq){
		return (freq / this.PPQ) * 60;
	};

	///////////////////////////////////////////////////////////////////////////////
	//	SYNCING
	///////////////////////////////////////////////////////////////////////////////

	/**
	 *  Returns the time aligned to the next subdivision
	 *  of the Transport. If the Transport is not started,
	 *  it will return 0.
	 *  Note: this will not work precisely during tempo ramps.
	 *  @param  {Time}  subdivision  The subdivision to quantize to
	 *  @return  {Number}  The context time of the next subdivision.
	 *  @example
	 * Tone.Transport.start(); //the transport must be started
	 * Tone.Transport.nextSubdivision("4n");
	 */
	Tone.Transport.prototype.nextSubdivision = function(subdivision){
		subdivision = this.toSeconds(subdivision);
		//if the transport's not started, return 0
		var now;
		if (this.state === Tone.State.Started){
			now = this._clock._nextTick;
		} else {
			return 0;
		}
		var transportPos = Tone.Time(this.ticks, "i");
		var remainingTime = subdivision - (transportPos % subdivision);
		if (remainingTime === 0){
			remainingTime = subdivision;
		}
		return now + remainingTime;
	};

	/**
	 *  Attaches the signal to the tempo control signal so that 
	 *  any changes in the tempo will change the signal in the same
	 *  ratio. 
	 *  
	 *  @param  {Tone.Signal} signal 
	 *  @param {number=} ratio Optionally pass in the ratio between
	 *                         the two signals. Otherwise it will be computed
	 *                         based on their current values. 
	 *  @returns {Tone.Transport} this
	 */
	Tone.Transport.prototype.syncSignal = function(signal, ratio){
		if (!ratio){
			//get the sync ratio
			if (signal._param.value !== 0){
				ratio = signal._param.value / this.bpm._param.value;
			} else {
				ratio = 0;
			}
		}
		var ratioSignal = new Tone.Gain(ratio);
		this.bpm.chain(ratioSignal, signal._param);
		this._syncedSignals.push({
			"ratio" : ratioSignal,
			"signal" : signal,
			"initial" : signal._param.value
		});
		signal._param.value = 0;
		return this;
	};

	/**
	 *  Unsyncs a previously synced signal from the transport's control. 
	 *  See Tone.Transport.syncSignal.
	 *  @param  {Tone.Signal} signal 
	 *  @returns {Tone.Transport} this
	 */
	Tone.Transport.prototype.unsyncSignal = function(signal){
		for (var i = this._syncedSignals.length - 1; i >= 0; i--){
			var syncedSignal = this._syncedSignals[i];
			if (syncedSignal.signal === signal){
				syncedSignal.ratio.dispose();
				syncedSignal.signal._param.value = syncedSignal.initial;
				this._syncedSignals.splice(i, 1);
			}
		}
		return this;
	};

	/**
	 *  Clean up. 
	 *  @returns {Tone.Transport} this
	 *  @private
	 */
	Tone.Transport.prototype.dispose = function(){
		Tone.Emitter.prototype.dispose.call(this);
		this._clock.dispose();
		this._clock = null;
		this._writable("bpm");
		this.bpm = null;
		this._timeline.dispose();
		this._timeline = null;
		this._onceEvents.dispose();
		this._onceEvents = null;
		this._repeatedEvents.dispose();
		this._repeatedEvents = null;
		return this;
	};

	///////////////////////////////////////////////////////////////////////////////
	//	INITIALIZATION
	///////////////////////////////////////////////////////////////////////////////

	var TransportConstructor = Tone.Transport;
	Tone.Transport = new TransportConstructor();

	Tone.Context.on("init", function(context){
		if (context.Transport instanceof TransportConstructor){
			Tone.Transport = context.Transport;
		} else {
			Tone.Transport = new TransportConstructor();
		}
		//store the Transport on the context so it can be retrieved later
		context.Transport = Tone.Transport;
	});

	Tone.Context.on("close", function(context){
		if (context.Transport instanceof TransportConstructor){
			context.Transport.dispose();
		}
	});

	return Tone.Transport;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getParameterByName = getParameterByName;
exports.getViewerType = getViewerType;
/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * does the `value` exist within the given `object`
 * @type {Function}
 * @param {Object|Array} object
 * @param {*} value
 * @returns {boolean}
 */
var valueExists = exports.valueExists = function valueExists(object, value) {
    return !!Object.keys(object).filter(function (key) {
        return object[key] === value;
    }).length;
};

/**
 * return all of the values as an array
 * @type {Function}
 * @param {Object|Array} object
 * @returns {Array}
 */
var values = exports.values = function values(object) {
    return Object.keys(object).map(function (key) {
        return object[key];
    });
};

/**
 * is the users experience on a mobile device
 * @type {Function}
 * @returns {boolean}
 */
var isMobile = exports.isMobile = function isMobile() {
    return document.querySelector('a-scene').isMobile;
};

/**
 * determine if the device is a tablet based on its screen ratio
 * if its not close to 16:9 it wont be suitable for a headset
 * @returns {boolean}
 */
var isTablet = exports.isTablet = function isTablet() {
    return Math.max(window.screen.width, window.screen.height) / Math.min(window.screen.width, window.screen.height) < 1.35 && !/(Oculus|Gear)/.test(navigator.userAgent);
};

/**
 * has the experience been entered into 360 mode
 */
var is360 = exports.is360 = function is360() {
    return document.querySelector('a-scene').classList.contains('is360');
};

/**
 * what is the displayName of the current VR headset?
 * null, if none
 * @returns {String}
 */
var getHeadset = exports.getHeadset = function getHeadset() {
    var h = document.querySelector('[headset]');
    return h && h.getAttribute('headset');
};

/**
 * is the available headset daydream?
 * @returns {boolean}
 */
var isDaydream = exports.isDaydream = function isDaydream() {
    return getHeadset() && getHeadset().toLowerCase().indexOf('daydream') >= 0;
};

/**
 * empty an array without creating a new one (for GC purposes)
 * @param arr
 * @returns {*}
 */
var empty = exports.empty = function empty(arr) {
    while (arr.length) {
        arr.splice(0, 1);
    }
    return arr;
};

/** pluck a property out of every element in an array
 * @param arr
 * @param prop
 */
var pluck = exports.pluck = function pluck(arr, prop) {
    var target = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    arr.forEach(function (v) {
        target.push(v[prop]);
    });
    return target;
};

/**
 * Is there different contents in the two arrays?
 * @param a
 * @param b
 * @returns {boolean}
 */
var diff = exports.diff = function diff(a, b) {
    if (a.length !== b.length) {
        return true;
    }

    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return true;
        }
    }

    return false;
};

function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getViewerType(callback) {

    navigator.getVRDisplays().then(function (displays) {
        if (displays.length > 0 && displays[0].isPresenting) {
            if (displays[0].stageParameters === null) {
                callback('3dof');
            } else {
                callback('6dof');
            }
        } else {
            callback('viewer');
        }
    }).catch(function () {
        callback('viewer');
    });
}

// redefine createElement
Document.prototype.createElementWithAttributes = function createElement(name, attrs) {

    // create the element
    var element = Document.prototype.createElement.call(this, String(name));

    // for each attribute
    for (var attr in attrs) {
        // assign the attribute, prefixing capital letters with dashes 
        element.setAttribute(attr.replace(/[A-Z]/g, '-$&'), attrs[attr]);
    }

    // return the element
    return element;
};

//nodelist polyfill
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, argument) {
        argument = argument || window;
        for (var i = 0; i < this.length; i++) {
            callback.call(argument, this[i], i, this);
        }
    };
}

var clamp = exports.clamp = function clamp(val, minVal, maxVal) {
    return Math.min(maxVal, Math.max(val, minVal));
};

var stringToHex = exports.stringToHex = function stringToHex(str) {
    return Number('0x' + str.slice(1, str.length));
};

var take = exports.take = function take(num, fn) {
    var results = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    for (var i = 0; i < num; i++) {
        results[i] = fn(i, num);
    }

    return results;
};

var lerp = exports.lerp = function lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t;
};

/**
 * return a random value between `min` and `max`,
 * if no params provided, range is between -1 and 1,
 * if only one param provided, the range is between `value * -1` and that `value`
 * @param {Number} [min]
 * @param {Number} [max]
 * @returns {Number}
 */
var rand = exports.rand = function rand(min, max) {
    if (typeof max === 'undefined') {
        if (typeof min === 'undefined') {
            min = -1;
            max = 1;
        }
        max = min;
        min = min * -1;
    }

    return Math.random() * (max - min) + min;
};

var randVector3 = exports.randVector3 = function randVector3(min, max) {
    return new THREE.Vector3(rand(min, max), rand(min, max), rand(min, max));
};

var map = exports.map = function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(49), __webpack_require__(131), __webpack_require__(132), __webpack_require__(23)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {	

	///////////////////////////////////////////////////////////////////////////
	//	TYPES
	///////////////////////////////////////////////////////////////////////////

	/**
	 * Units which a value can take on.
	 * @enum {String}
	 */
	Tone.Type = {
		/** 
		 *  Default units
		 *  @typedef {Default}
		 */
		Default : "number",
		/**
		 *  Time can be described in a number of ways. Read more [Time](https://github.com/Tonejs/Tone.js/wiki/Time).
		 *
		 *  * Numbers, which will be taken literally as the time (in seconds).
		 *  * Notation, ("4n", "8t") describes time in BPM and time signature relative values.
		 *  * TransportTime, ("4:3:2") will also provide tempo and time signature relative times 
		 *  in the form BARS:QUARTERS:SIXTEENTHS.
		 *  * Frequency, ("8hz") is converted to the length of the cycle in seconds.
		 *  * Now-Relative, ("+1") prefix any of the above with "+" and it will be interpreted as 
		 *  "the current time plus whatever expression follows".
		 *  * Expressions, ("3:0 + 2 - (1m / 7)") any of the above can also be combined 
		 *  into a mathematical expression which will be evaluated to compute the desired time.
		 *  * No Argument, for methods which accept time, no argument will be interpreted as 
		 *  "now" (i.e. the currentTime).
		 *  
		 *  @typedef {Time}
		 */
		Time : "time",
		/**
		 *  Frequency can be described similar to time, except ultimately the
		 *  values are converted to frequency instead of seconds. A number
		 *  is taken literally as the value in hertz. Additionally any of the 
		 *  Time encodings can be used. Note names in the form
		 *  of NOTE OCTAVE (i.e. C4) are also accepted and converted to their
		 *  frequency value. 
		 *  @typedef {Frequency}
		 */
		Frequency : "frequency",
		/**
		 *  TransportTime describes a position along the Transport's timeline. It is
		 *  similar to Time in that it uses all the same encodings, but TransportTime specifically
		 *  pertains to the Transport's timeline, which is startable, stoppable, loopable, and seekable. 
		 *  [Read more](https://github.com/Tonejs/Tone.js/wiki/TransportTime)
		 *  @typedef {TransportTime}
		 */
		TransportTime : "transportTime",
		/** 
		 *  Ticks are the basic subunit of the Transport. They are
		 *  the smallest unit of time that the Transport supports.
		 *  @typedef {Ticks}
		 */
		Ticks : "ticks",
		/** 
		 *  Normal values are within the range [0, 1].
		 *  @typedef {NormalRange}
		 */
		NormalRange : "normalRange",
		/** 
		 *  AudioRange values are between [-1, 1].
		 *  @typedef {AudioRange}
		 */
		AudioRange : "audioRange",
		/** 
		 *  Decibels are a logarithmic unit of measurement which is useful for volume
		 *  because of the logarithmic way that we perceive loudness. 0 decibels 
		 *  means no change in volume. -10db is approximately half as loud and 10db 
		 *  is twice is loud. 
		 *  @typedef {Decibels}
		 */
		Decibels : "db",
		/** 
		 *  Half-step note increments, i.e. 12 is an octave above the root. and 1 is a half-step up.
		 *  @typedef {Interval}
		 */
		Interval : "interval",
		/** 
		 *  Beats per minute. 
		 *  @typedef {BPM}
		 */
		BPM : "bpm",
		/** 
		 *  The value must be greater than or equal to 0.
		 *  @typedef {Positive}
		 */
		Positive : "positive",
		/** 
		 *  A cent is a hundredth of a semitone. 
		 *  @typedef {Cents}
		 */
		Cents : "cents",
		/** 
		 *  Angle between 0 and 360. 
		 *  @typedef {Degrees}
		 */
		Degrees : "degrees",
		/** 
		 *  A number representing a midi note.
		 *  @typedef {MIDI}
		 */
		MIDI : "midi",
		/** 
		 *  A colon-separated representation of time in the form of
		 *  Bars:Beats:Sixteenths. 
		 *  @typedef {BarsBeatsSixteenths}
		 */
		BarsBeatsSixteenths : "barsBeatsSixteenths",
		/** 
		 *  Sampling is the reduction of a continuous signal to a discrete signal.
		 *  Audio is typically sampled 44100 times per second. 
		 *  @typedef {Samples}
		 */
		Samples : "samples",
		/** 
		 *  Hertz are a frequency representation defined as one cycle per second.
		 *  @typedef {Hertz}
		 */
		Hertz : "hertz",
		/** 
		 *  A frequency represented by a letter name, 
		 *  accidental and octave. This system is known as
		 *  [Scientific Pitch Notation](https://en.wikipedia.org/wiki/Scientific_pitch_notation).
		 *  @typedef {Note}
		 */
		Note : "note",
		/** 
		 *  One millisecond is a thousandth of a second. 
		 *  @typedef {Milliseconds}
		 */
		Milliseconds : "milliseconds",
		/** 
		 *  Seconds are the time unit of the AudioContext. In the end, 
		 *  all values need to be evaluated to seconds. 
		 *  @typedef {Seconds}
		 */
		Seconds : "seconds",
		/** 
		 *  A string representing a duration relative to a measure. 
		 *  * "4n" = quarter note
		 *  * "2m" = two measures
		 *  * "8t" = eighth-note triplet
		 *  @typedef {Notation}
		 */
		Notation : "notation",
	};

	///////////////////////////////////////////////////////////////////////////
	// AUGMENT TONE's PROTOTYPE
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Convert Time into seconds.
	 *  
	 *  Unlike the method which it overrides, this takes into account 
	 *  transporttime and musical notation.
	 *
	 *  Time : 1.40
	 *  Notation: 4n or 1m or 2t
	 *  Now Relative: +3n
	 *  Math: 3n+16n or even complicated expressions ((3n*2)/6 + 1)
	 *
	 *  @param  {Time} time 
	 *  @return {Seconds} 
	 */
	Tone.prototype.toSeconds = function(time){
		if (Tone.isNumber(time)){
			return time;
		} else if (Tone.isUndef(time)){
			return this.now();			
		} else if (Tone.isString(time)){
			return (new Tone.Time(time)).toSeconds();
		} else if (time instanceof Tone.TimeBase){
			return time.toSeconds();
		}
	};

	/**
	 *  Convert a frequency representation into a number.
	 *  @param  {Frequency} freq 
	 *  @return {Hertz}      the frequency in hertz
	 */
	Tone.prototype.toFrequency = function(freq){
		if (Tone.isNumber(freq)){
			return freq;
		} else if (Tone.isString(freq) || Tone.isUndef(freq)){
			return (new Tone.Frequency(freq)).valueOf();
		} else if (freq instanceof Tone.TimeBase){
			return freq.toFrequency();
		}
	};

	/**
	 *  Convert a time representation into ticks.
	 *  @param  {Time} time
	 *  @return {Ticks}  the time in ticks
	 */
	Tone.prototype.toTicks = function(time){
		if (Tone.isNumber(time) || Tone.isString(time)){
			return (new Tone.TransportTime(time)).toTicks();
		} else if (Tone.isUndef(time)){
			return Tone.Transport.ticks;			
		} else if (time instanceof Tone.TimeBase){
			return time.toTicks();
		}
	};

	return Tone;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(46)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Wraps the native Web Audio API 
	 *         [WaveShaperNode](http://webaudio.github.io/web-audio-api/#the-waveshapernode-interface).
	 *
	 *  @extends {Tone.SignalBase}
	 *  @constructor
	 *  @param {function|Array|Number} mapping The function used to define the values. 
	 *                                    The mapping function should take two arguments: 
	 *                                    the first is the value at the current position 
	 *                                    and the second is the array position. 
	 *                                    If the argument is an array, that array will be
	 *                                    set as the wave shaping function. The input
	 *                                    signal is an AudioRange [-1, 1] value and the output
	 *                                    signal can take on any numerical values. 
	 *                                    
	 *  @param {Number} [bufferLen=1024] The length of the WaveShaperNode buffer.
	 *  @example
	 * var timesTwo = new Tone.WaveShaper(function(val){
	 * 	return val * 2;
	 * }, 2048);
	 *  @example
	 * //a waveshaper can also be constructed with an array of values
	 * var invert = new Tone.WaveShaper([1, -1]);
	 */
	Tone.WaveShaper = function(mapping, bufferLen){

		Tone.SignalBase.call(this);

		/**
		 *  the waveshaper
		 *  @type {WaveShaperNode}
		 *  @private
		 */
		this._shaper = this.input = this.output = this.context.createWaveShaper();

		/**
		 *  the waveshapers curve
		 *  @type {Float32Array}
		 *  @private
		 */
		this._curve = null;

		if (Array.isArray(mapping)){
			this.curve = mapping;
		} else if (isFinite(mapping) || Tone.isUndef(mapping)){
			this._curve = new Float32Array(Tone.defaultArg(mapping, 1024));
		} else if (Tone.isFunction(mapping)){
			this._curve = new Float32Array(Tone.defaultArg(bufferLen, 1024));
			this.setMap(mapping);
		} 
	};

	Tone.extend(Tone.WaveShaper, Tone.SignalBase);

	/**
	 *  Uses a mapping function to set the value of the curve. 
	 *  @param {function} mapping The function used to define the values. 
	 *                            The mapping function take two arguments: 
	 *                            the first is the value at the current position 
	 *                            which goes from -1 to 1 over the number of elements
	 *                            in the curve array. The second argument is the array position. 
	 *  @returns {Tone.WaveShaper} this
	 *  @example
	 * //map the input signal from [-1, 1] to [0, 10]
	 * shaper.setMap(function(val, index){
	 * 	return (val + 1) * 5;
	 * })
	 */
	Tone.WaveShaper.prototype.setMap = function(mapping){
		for (var i = 0, len = this._curve.length; i < len; i++){
			var normalized = (i / (len - 1)) * 2 - 1;
			this._curve[i] = mapping(normalized, i);
		}
		this._shaper.curve = this._curve;
		return this;
	};

	/**
	 * The array to set as the waveshaper curve. For linear curves
	 * array length does not make much difference, but for complex curves
	 * longer arrays will provide smoother interpolation. 
	 * @memberOf Tone.WaveShaper#
	 * @type {Array}
	 * @name curve
	 */
	Object.defineProperty(Tone.WaveShaper.prototype, "curve", {
		get : function(){
			return this._shaper.curve;
		},
		set : function(mapping){
			this._curve = new Float32Array(mapping);
			this._shaper.curve = this._curve;
		}
	});

	/**
	 * Specifies what type of oversampling (if any) should be used when 
	 * applying the shaping curve. Can either be "none", "2x" or "4x". 
	 * @memberOf Tone.WaveShaper#
	 * @type {string}
	 * @name oversample
	 */
	Object.defineProperty(Tone.WaveShaper.prototype, "oversample", {
		get : function(){
			return this._shaper.oversample;
		},
		set : function(oversampling){
			if (["none", "2x", "4x"].indexOf(oversampling) !== -1){
				this._shaper.oversample = oversampling;
			} else {
				throw new RangeError("Tone.WaveShaper: oversampling must be either 'none', '2x', or '4x'");
			}
		}
	});

	/**
	 *  Clean up.
	 *  @returns {Tone.WaveShaper} this
	 */
	Tone.WaveShaper.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._shaper.disconnect();
		this._shaper = null;
		this._curve = null;
		return this;
	};

	return Tone.WaveShaper;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	"use strict";

	/**
	 *  @class Tone.Emitter gives classes which extend it
	 *         the ability to listen for and emit events. 
	 *         Inspiration and reference from Jerome Etienne's [MicroEvent](https://github.com/jeromeetienne/microevent.js).
	 *         MIT (c) 2011 Jerome Etienne.
	 *         
	 *  @extends {Tone}
	 */
	Tone.Emitter = function(){
		Tone.call(this);
		/**
		 *  Contains all of the events.
		 *  @private
		 *  @type  {Object}
		 */
		this._events = {};
	};

	Tone.extend(Tone.Emitter);

	/**
	 *  Bind a callback to a specific event.
	 *  @param  {String}    event     The name of the event to listen for.
	 *  @param  {Function}  callback  The callback to invoke when the
	 *                                event is emitted
	 *  @return  {Tone.Emitter}    this
	 */
	Tone.Emitter.prototype.on = function(event, callback){
		//split the event
		var events = event.split(/\W+/);
		for (var i = 0; i < events.length; i++){
			var eventName = events[i];
			if (!this._events.hasOwnProperty(eventName)){
				this._events[eventName] = [];
			}
			this._events[eventName].push(callback);
		}
		return this;
	};

	/**
	 *  Remove the event listener.
	 *  @param  {String}    event     The event to stop listening to.
	 *  @param  {Function=}  callback  The callback which was bound to 
	 *                                the event with Tone.Emitter.on.
	 *                                If no callback is given, all callbacks
	 *                                events are removed.
	 *  @return  {Tone.Emitter}    this
	 */
	Tone.Emitter.prototype.off = function(event, callback){
		var events = event.split(/\W+/);
		for (var ev = 0; ev < events.length; ev++){
			event = events[ev];
			if (this._events.hasOwnProperty(event)){
				if (Tone.isUndef(callback)){
					this._events[event] = [];
				} else {
					var eventList = this._events[event];
					for (var i = 0; i < eventList.length; i++){
						if (eventList[i] === callback){
							eventList.splice(i, 1);
						}
					}
				}
			}
		}
		return this;
	};

	/**
	 *  Invoke all of the callbacks bound to the event
	 *  with any arguments passed in. 
	 *  @param  {String}  event  The name of the event.
	 *  @param {*} args... The arguments to pass to the functions listening.
	 *  @return  {Tone.Emitter}  this
	 */
	Tone.Emitter.prototype.emit = function(event){
		if (this._events){
			var args = Array.apply(null, arguments).slice(1);
			if (this._events.hasOwnProperty(event)){
				var eventList = this._events[event];
				for (var i = 0, len = eventList.length; i < len; i++){
					eventList[i].apply(this, args);
				}
			}
		}
		return this;
	};

	/**
	 *  Add Emitter functions (on/off/emit) to the object
	 *  @param  {Object|Function}  object  The object or class to extend.
	 *  @returns {Tone.Emitter}
	 */
	Tone.Emitter.mixin = function(object){
		var functions = ["on", "off", "emit"];
		object._events = {};
		for (var i = 0; i < functions.length; i++){
			var func = functions[i];
			var emitterFunc = Tone.Emitter.prototype[func];
			object[func] = emitterFunc;
		}
		return Tone.Emitter;
	};

	/**
	 *  Clean up
	 *  @return  {Tone.Emitter}  this
	 */
	Tone.Emitter.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._events = null;
		return this;
	};

	return Tone.Emitter;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(22), __webpack_require__(23)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";
	
	/**
	 *  @class  A single master output which is connected to the
	 *          AudioDestinationNode (aka your speakers). 
	 *          It provides useful conveniences such as the ability 
	 *          to set the volume and mute the entire application. 
	 *          It also gives you the ability to apply master effects to your application. 
	 *          <br><br>
	 *          Like Tone.Transport, A single Tone.Master is created
	 *          on initialization and you do not need to explicitly construct one.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @singleton
	 *  @example
	 * //the audio will go from the oscillator to the speakers
	 * oscillator.connect(Tone.Master);
	 * //a convenience for connecting to the master output is also provided:
	 * oscillator.toMaster();
	 * //the above two examples are equivalent.
	 */
	Tone.Master = function(){
		
		Tone.call(this);
		this.createInsOuts(1, 0);

		/**
		 *  The private volume node
		 *  @type  {Tone.Volume}
		 *  @private
		 */
		this._volume = this.output = new Tone.Volume();

		/**
		 * The volume of the master output.
		 * @type {Decibels}
		 * @signal
		 */
		this.volume = this._volume.volume;
		
		this._readOnly("volume");
		//connections
		this.input.chain(this.output, this.context.destination);
	};

	Tone.extend(Tone.Master);

	/**
	 *  @type {Object}
	 *  @const
	 */
	Tone.Master.defaults = {
		"volume" : 0,
		"mute" : false
	};

	/**
	 * Mute the output. 
	 * @memberOf Tone.Master#
	 * @type {boolean}
	 * @name mute
	 * @example
	 * //mute the output
	 * Tone.Master.mute = true;
	 */
	Object.defineProperty(Tone.Master.prototype, "mute", {
		get : function(){
			return this._volume.mute;
		}, 
		set : function(mute){
			this._volume.mute = mute;
		}
	});

	/**
	 *  Add a master effects chain. NOTE: this will disconnect any nodes which were previously 
	 *  chained in the master effects chain. 
	 *  @param {AudioNode|Tone} args... All arguments will be connected in a row
	 *                                  and the Master will be routed through it.
	 *  @return  {Tone.Master}  this
	 *  @example
	 * //some overall compression to keep the levels in check
	 * var masterCompressor = new Tone.Compressor({
	 * 	"threshold" : -6,
	 * 	"ratio" : 3,
	 * 	"attack" : 0.5,
	 * 	"release" : 0.1
	 * });
	 * //give a little boost to the lows
	 * var lowBump = new Tone.Filter(200, "lowshelf");
	 * //route everything through the filter 
	 * //and compressor before going to the speakers
	 * Tone.Master.chain(lowBump, masterCompressor);
	 */
	Tone.Master.prototype.chain = function(){
		this.input.disconnect();
		this.input.chain.apply(this.input, arguments);
		arguments[arguments.length - 1].connect(this.output);
	};

	/**
	 *  Clean up
	 *  @return  {Tone.Master}  this
	 */
	Tone.Master.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._writable("volume");
		this._volume.dispose();
		this._volume = null;
		this.volume = null;
	};

	///////////////////////////////////////////////////////////////////////////
	//	AUGMENT TONE's PROTOTYPE
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Connect 'this' to the master output. Shorthand for this.connect(Tone.Master)
	 *  @returns {Tone} this
	 *  @example
	 * //connect an oscillator to the master output
	 * var osc = new Tone.Oscillator().toMaster();
	 */
	Tone.prototype.toMaster = function(){
		this.connect(Tone.Master);
		return this;
	};

	if (window.AudioNode){
		// Also augment AudioNode's prototype to include toMaster as a convenience
		AudioNode.prototype.toMaster = function(){
			this.connect(Tone.Master);
			return this;
		};
	}

	/**
	 *  initialize the module and listen for new audio contexts
	 */
	var MasterConstructor = Tone.Master;
	Tone.Master = new MasterConstructor();

	Tone.Context.on("init", function(context){
		// if it already exists, just restore it
		if (context.Master instanceof MasterConstructor){
			Tone.Master = context.Master;
		} else {
			Tone.Master = new MasterConstructor();
		}
		context.Master = Tone.Master;
	});

	Tone.Context.on("close", function(context){
		if (context.Master instanceof MasterConstructor){
			context.Master.dispose();
		}
	});

	return Tone.Master;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	"use strict";

	/**
	 *  @class A Timeline class for scheduling and maintaining state
	 *         along a timeline. All events must have a "time" property. 
	 *         Internally, events are stored in time order for fast 
	 *         retrieval.
	 *  @extends {Tone}
	 *  @param {Positive} [memory=Infinity] The number of previous events that are retained.
	 */
	Tone.Timeline = function(){

		var options = Tone.defaults(arguments, ["memory"], Tone.Timeline);
		Tone.call(this);

		/**
		 *  The array of scheduled timeline events
		 *  @type  {Array}
		 *  @private
		 */
		this._timeline = [];

		/**
		 *  An array of items to remove from the list. 
		 *  @type {Array}
		 *  @private
		 */
		this._toRemove = [];

		/**
		 *  Flag if the timeline is mid iteration
		 *  @private
		 *  @type {Boolean}
		 */
		this._iterating = false;

		/**
		 *  The memory of the timeline, i.e.
		 *  how many events in the past it will retain
		 *  @type {Positive}
		 */
		this.memory = options.memory;
	};

	Tone.extend(Tone.Timeline);

	/**
	 *  the default parameters
	 *  @static
	 *  @const
	 */
	Tone.Timeline.defaults = {
		"memory" : Infinity
	};

	/**
	 *  The number of items in the timeline.
	 *  @type {Number}
	 *  @memberOf Tone.Timeline#
	 *  @name length
	 *  @readOnly
	 */
	Object.defineProperty(Tone.Timeline.prototype, "length", {
		get : function(){
			return this._timeline.length;
		}
	});

	/**
	 *  Insert an event object onto the timeline. Events must have a "time" attribute.
	 *  @param  {Object}  event  The event object to insert into the 
	 *                           timeline. 
	 *  @returns {Tone.Timeline} this
	 */
	Tone.Timeline.prototype.add = function(event){
		//the event needs to have a time attribute
		if (Tone.isUndef(event.time)){
			throw new Error("Tone.Timeline: events must have a time attribute");
		}
		if (this._timeline.length){
			var index = this._search(event.time);
			this._timeline.splice(index + 1, 0, event);
		} else {
			this._timeline.push(event);			
		}
		//if the length is more than the memory, remove the previous ones
		if (this.length > this.memory){
			var diff = this.length - this.memory;
			this._timeline.splice(0, diff);
		}
		return this;
	};

	/**
	 *  Remove an event from the timeline.
	 *  @param  {Object}  event  The event object to remove from the list.
	 *  @returns {Tone.Timeline} this
	 */
	Tone.Timeline.prototype.remove = function(event){
		if (this._iterating){
			this._toRemove.push(event);
		} else {
			var index = this._timeline.indexOf(event);
			if (index !== -1){
				this._timeline.splice(index, 1);
			}
		}
		return this;
	};

	/**
	 *  Get the nearest event whose time is less than or equal to the given time.
	 *  @param  {Number}  time  The time to query.
	 *  @param  {String}  comparitor Which value in the object to compare
	 *  @returns {Object} The event object set after that time.
	 */
	Tone.Timeline.prototype.get = function(time, comparitor){
		comparitor = Tone.defaultArg(comparitor, "time");
		var index = this._search(time, comparitor);
		if (index !== -1){
			return this._timeline[index];
		} else {
			return null;
		}
	};

	/**
	 *  Return the first event in the timeline without removing it
	 *  @returns {Object} The first event object
	 */
	Tone.Timeline.prototype.peek = function(){
		return this._timeline[0];
	};

	/**
	 *  Return the first event in the timeline and remove it
	 *  @returns {Object} The first event object
	 */
	Tone.Timeline.prototype.shift = function(){
		return this._timeline.shift();
	};

	/**
	 *  Get the event which is scheduled after the given time.
	 *  @param  {Number}  time  The time to query.
	 *  @param  {String}  comparitor Which value in the object to compare
	 *  @returns {Object} The event object after the given time
	 */
	Tone.Timeline.prototype.getAfter = function(time, comparitor){
		comparitor = Tone.defaultArg(comparitor, "time");
		var index = this._search(time, comparitor);
		if (index + 1 < this._timeline.length){
			return this._timeline[index + 1];
		} else {
			return null;
		}
	};

	/**
	 *  Get the event before the event at the given time.
	 *  @param  {Number}  time  The time to query.
	 *  @param  {String}  comparitor Which value in the object to compare
	 *  @returns {Object} The event object before the given time
	 */
	Tone.Timeline.prototype.getBefore = function(time, comparitor){
		comparitor = Tone.defaultArg(comparitor, "time");
		var len = this._timeline.length;
		//if it's after the last item, return the last item
		if (len > 0 && this._timeline[len - 1][comparitor] < time){
			return this._timeline[len - 1];
		}
		var index = this._search(time, comparitor);
		if (index - 1 >= 0){
			return this._timeline[index - 1];
		} else {
			return null;
		}
	};

	/**
	 *  Cancel events after the given time
	 *  @param  {Number}  time  The time to query.
	 *  @returns {Tone.Timeline} this
	 */
	Tone.Timeline.prototype.cancel = function(after){
		if (this._timeline.length > 1){
			var index = this._search(after);
			if (index >= 0){
				if (this._timeline[index].time === after){
					//get the first item with that time
					for (var i = index; i >= 0; i--){
						if (this._timeline[i].time === after){
							index = i;
						} else {
							break;
						}
					}
					this._timeline = this._timeline.slice(0, index);
				} else {
					this._timeline = this._timeline.slice(0, index + 1);
				}
			} else {
				this._timeline = [];
			}
		} else if (this._timeline.length === 1){
			//the first item's time
			if (this._timeline[0].time >= after){
				this._timeline = [];
			}
		}
		return this;
	};

	/**
	 *  Cancel events before or equal to the given time.
	 *  @param  {Number}  time  The time to cancel before.
	 *  @returns {Tone.Timeline} this
	 */
	Tone.Timeline.prototype.cancelBefore = function(time){
		if (this._timeline.length){
			var index = this._search(time);
			if (index >= 0){
				this._timeline = this._timeline.slice(index + 1);
			}
		}
		return this;
	};

	/**
	 * Returns the previous event if there is one. null otherwise
	 * @param  {Object} event The event to find the previous one of
	 * @return {Object}       The event right before the given event
	 */
	Tone.Timeline.prototype.previousEvent = function(event){
		var index = this._timeline.indexOf(event);
		if (index > 0){
			return this._timeline[index-1];
		} else {
			return null;
		}
	};

	/**
	 *  Does a binary serach on the timeline array and returns the 
	 *  nearest event index whose time is after or equal to the given time.
	 *  If a time is searched before the first index in the timeline, -1 is returned.
	 *  If the time is after the end, the index of the last item is returned.
	 *  @param  {Number}  time  
	 *  @param  {String}  comparitor Which value in the object to compare
	 *  @return  {Number} the index in the timeline array 
	 *  @private
	 */
	Tone.Timeline.prototype._search = function(time, comparitor){
		comparitor = Tone.defaultArg(comparitor, "time");
		var beginning = 0;
		var len = this._timeline.length;
		var end = len;
		if (len > 0 && this._timeline[len - 1][comparitor] <= time){
			return len - 1;
		}
		while (beginning < end){
			// calculate the midpoint for roughly equal partition
			var midPoint = Math.floor(beginning + (end - beginning) / 2);
			var event = this._timeline[midPoint];
			var nextEvent = this._timeline[midPoint + 1];
			if (event[comparitor] === time){
				//choose the last one that has the same time
				for (var i = midPoint; i < this._timeline.length; i++){
					var testEvent = this._timeline[i];
					if (testEvent[comparitor] === time){
						midPoint = i;
					}
				}
				return midPoint;
			} else if (event[comparitor] < time && nextEvent[comparitor] > time){
				return midPoint;
			} else if (event[comparitor] > time){
				//search lower
				end = midPoint;
			} else {
				//search upper
				beginning = midPoint + 1;
			} 
		}
		return -1;
	};

	/**
	 *  Internal iterator. Applies extra safety checks for 
	 *  removing items from the array. 
	 *  @param  {Function}  callback 
	 *  @param  {Number=}    lowerBound     
	 *  @param  {Number=}    upperBound    
	 *  @private
	 */
	Tone.Timeline.prototype._iterate = function(callback, lowerBound, upperBound){
		this._iterating = true;
		lowerBound = Tone.defaultArg(lowerBound, 0);
		upperBound = Tone.defaultArg(upperBound, this._timeline.length - 1);
		for (var i = lowerBound; i <= upperBound; i++){
			callback.call(this, this._timeline[i]);
		}
		this._iterating = false;
		if (this._toRemove.length > 0){
			for (var j = 0; j < this._toRemove.length; j++){
				var index = this._timeline.indexOf(this._toRemove[j]);
				if (index !== -1){
					this._timeline.splice(index, 1);
				}
			}
			this._toRemove = [];
		}
	};

	/**
	 *  Iterate over everything in the array
	 *  @param  {Function}  callback The callback to invoke with every item
	 *  @returns {Tone.Timeline} this
	 */
	Tone.Timeline.prototype.forEach = function(callback){
		this._iterate(callback);
		return this;
	};

	/**
	 *  Iterate over everything in the array at or before the given time.
	 *  @param  {Number}  time The time to check if items are before
	 *  @param  {Function}  callback The callback to invoke with every item
	 *  @returns {Tone.Timeline} this
	 */
	Tone.Timeline.prototype.forEachBefore = function(time, callback){
		//iterate over the items in reverse so that removing an item doesn't break things
		var upperBound = this._search(time);
		if (upperBound !== -1){
			this._iterate(callback, 0, upperBound);
		}
		return this;
	};

	/**
	 *  Iterate over everything in the array after the given time.
	 *  @param  {Number}  time The time to check if items are before
	 *  @param  {Function}  callback The callback to invoke with every item
	 *  @returns {Tone.Timeline} this
	 */
	Tone.Timeline.prototype.forEachAfter = function(time, callback){
		//iterate over the items in reverse so that removing an item doesn't break things
		var lowerBound = this._search(time);
		this._iterate(callback, lowerBound + 1);
		return this;
	};

	/**
	 *  Iterate over everything in the array at or after the given time. Similar to 
	 *  forEachAfter, but includes the item(s) at the given time.
	 *  @param  {Number}  time The time to check if items are before
	 *  @param  {Function}  callback The callback to invoke with every item
	 *  @returns {Tone.Timeline} this
	 */
	Tone.Timeline.prototype.forEachFrom = function(time, callback){
		//iterate over the items in reverse so that removing an item doesn't break things
		var lowerBound = this._search(time);
		//work backwards until the event time is less than time
		while (lowerBound >= 0 && this._timeline[lowerBound].time >= time){
			lowerBound--;
		}
		this._iterate(callback, lowerBound + 1);
		return this;
	};

	/**
	 *  Iterate over everything in the array at the given time
	 *  @param  {Number}  time The time to check if items are before
	 *  @param  {Function}  callback The callback to invoke with every item
	 *  @returns {Tone.Timeline} this
	 */
	Tone.Timeline.prototype.forEachAtTime = function(time, callback){
		//iterate over the items in reverse so that removing an item doesn't break things
		var upperBound = this._search(time);
		if (upperBound !== -1){
			this._iterate(function(event){
				if (event.time === time){
					callback.call(this, event);
				} 
			}, 0, upperBound);
		}
		return this;
	};

	/**
	 *  Clean up.
	 *  @return  {Tone.Timeline}  this
	 */
	Tone.Timeline.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._timeline = null;
		this._toRemove = null;
		return this;
	};

	return Tone.Timeline;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(2), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  Multiply two incoming signals. Or, if a number is given in the constructor, 
	 *          multiplies the incoming signal by that value. 
	 *
	 *  @constructor
	 *  @extends {Tone.Signal}
	 *  @param {number=} value Constant value to multiple. If no value is provided,
	 *                         it will return the product of the first and second inputs
	 *  @example
	 * var mult = new Tone.Multiply();
	 * var sigA = new Tone.Signal(3);
	 * var sigB = new Tone.Signal(4);
	 * sigA.connect(mult, 0, 0);
	 * sigB.connect(mult, 0, 1);
	 * //output of mult is 12.
	 *  @example
	 * var mult = new Tone.Multiply(10);
	 * var sig = new Tone.Signal(2).connect(mult);
	 * //the output of mult is 20. 
	 */
	Tone.Multiply = function(value){

		Tone.Signal.call(this);
		this.createInsOuts(2, 0);

		/**
		 *  the input node is the same as the output node
		 *  it is also the GainNode which handles the scaling of incoming signal
		 *  
		 *  @type {GainNode}
		 *  @private
		 */
		this._mult = this.input[0] = this.output = new Tone.Gain();

		/**
		 *  the scaling parameter
		 *  @type {AudioParam}
		 *  @private
		 */
		this._param = this.input[1] = this.output.gain;
		
		this._param.value = Tone.defaultArg(value, 0);
	};

	Tone.extend(Tone.Multiply, Tone.Signal);

	/**
	 *  clean up
	 *  @returns {Tone.Multiply} this
	 */
	Tone.Multiply.prototype.dispose = function(){
		Tone.Signal.prototype.dispose.call(this);
		this._mult.dispose();
		this._mult = null;
		this._param = null;
		return this;
	}; 

	return Tone.Multiply;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

var EventEmitter          = __webpack_require__(14).EventEmitter,
    inherits              = __webpack_require__(89),
    raf                   = __webpack_require__(94),
    methods;


//the same as off window unless polyfilled or in node
var defaultRAFObject = {
    requestAnimationFrame: raf,
    cancelAnimationFrame: raf.cancel
};

function returnTrue(){ return true; }

//manage FPS if < 60, else return true;
function makeThrottle(fps){
    var delay = 1000/fps;
    var lastTime = Date.now();


    if( fps<=0 || fps === Infinity ){
        return returnTrue;
    }

    //if an fps throttle has been set then we'll assume
    //it natively runs at 60fps,
    var half = Math.ceil(1000 / 60) / 2;

    return function(){
        //if a custom fps is requested
        var now = Date.now();
        //is this frame within 8.5ms of the target?
        //if so then next frame is gonna be too late
        if(now - lastTime < delay - half){
            return false;
        }
        lastTime = now;
        return true;
    };
}


/**
 * Animitter provides event-based loops for the browser and node,
 * using `requestAnimationFrame`
 * @param {Object} [opts]
 * @param {Number} [opts.fps=Infinity] the framerate requested, defaults to as fast as it can (60fps on window)
 * @param {Number} [opts.delay=0] milliseconds delay between invoking `start` and initializing the loop
 * @param {Object} [opts.requestAnimationFrameObject=global] the object on which to find `requestAnimationFrame` and `cancelAnimationFrame` methods
 * @param {Boolean} [opts.fixedDelta=false] if true, timestamps will pretend to be executed at fixed intervals always
 * @constructor
 */
function Animitter( opts ){
    opts = opts || {};

    this.__delay = opts.delay || 0;

    /** @expose */
    this.fixedDelta = !!opts.fixedDelta;

    /** @expose */
    this.frameCount = 0;
    /** @expose */
    this.deltaTime = 0;
    /** @expose */
    this.elapsedTime = 0;

    /** @private */
    this.__running = false;
    /** @private */
    this.__completed = false;

    this.setFPS(opts.fps || Infinity);
    this.setRequestAnimationFrameObject(opts.requestAnimationFrameObject || defaultRAFObject);
}

inherits(Animitter, EventEmitter);

function onStart(scope){
    var now = Date.now();
    var rAFID;
    //dont let a second animation start on the same object
    //use *.on('update',fn)* instead
    if(scope.__running){
        return scope;
    }

    exports.running += 1;
    scope.__running = true;
    scope.__lastTime = now;
    scope.deltaTime = 0;

    //emit **start** once at the beginning
    scope.emit('start', scope.deltaTime, 0, scope.frameCount);

    var lastRAFObject = scope.requestAnimationFrameObject;

    var drawFrame = function(){
        if(lastRAFObject !== scope.requestAnimationFrameObject){
            //if the requestAnimationFrameObject switched in-between,
            //then re-request with the new one to ensure proper update execution context
            //i.e. VRDisplay#submitFrame() may only be requested through VRDisplay#requestAnimationFrame(drawFrame)
            lastRAFObject = scope.requestAnimationFrameObject;
            scope.requestAnimationFrameObject.requestAnimationFrame(drawFrame);
            return;
        }
        if(scope.__isReadyForUpdate()){
            scope.update();
        }
        if(scope.__running){
            rAFID = scope.requestAnimationFrameObject.requestAnimationFrame(drawFrame);
        } else {
            scope.requestAnimationFrameObject.cancelAnimationFrame(rAFID);
        }
    };

    scope.requestAnimationFrameObject.requestAnimationFrame(drawFrame);

    return scope;
}

methods = {
    //EventEmitter Aliases
    off     : EventEmitter.prototype.removeListener,
    trigger : EventEmitter.prototype.emit,

    /**
     * stops the animation and marks it as completed
     * @emit Animitter#complete
     * @returns {Animitter}
     */
    complete: function(){
        this.stop();
        this.__completed = true;
        this.emit('complete', this.frameCount, this.deltaTime);
        return this;
    },

    /**
     * stops the animation and removes all listeners
     * @emit Animitter#stop
     * @returns {Animitter}
     */
    dispose: function(){
        this.stop();
        this.removeAllListeners();
        return this;
    },

    /**
     * get milliseconds between the last 2 updates
     *
     * @return {Number}
     */
    getDeltaTime: function(){
        return this.deltaTime;
    },

    /**
     * get the total milliseconds that the animation has ran.
     * This is the cumlative value of the deltaTime between frames
     *
     * @return {Number}
     */
    getElapsedTime: function(){
        return this.elapsedTime;
    },

    /**
     * get the instances frames per second as calculated by the last delta
     *
     * @return {Number}
     */
    getFPS: function(){
        return this.deltaTime > 0 ? 1000 / this.deltaTime : 0;
        if(this.deltaTime){
            return 1000 / this.deltaTime;
        }
    },

    /**
     * get the explicit FPS limit set via `Animitter#setFPS(fps)` or
     * via the initial `options.fps` property
     *
     * @returns {Number} either as set or Infinity
     */
    getFPSLimit: function(){
        return this.__fps;
    },

    /**
     * get the number of frames that have occurred
     *
     * @return {Number}
     */
    getFrameCount: function(){
        return this.frameCount;
    },


    /**
     * get the object providing `requestAnimationFrame`
     * and `cancelAnimationFrame` methods
     * @return {Object}
     */
    getRequestAnimationFrameObject: function(){
        return this.requestAnimationFrameObject;
    },

    /**
     * is the animation loop active
     *
     * @return {boolean}
     */
    isRunning: function(){
        return this.__running;
    },

    /**
     * is the animation marked as completed
     *
     * @return {boolean}
     */
    isCompleted: function(){
        return this.__completed;
    },

    /**
     * reset the animation loop, marks as incomplete,
     * leaves listeners intact
     *
     * @emit Animitter#reset
     * @return {Animitter}
     */
    reset: function(){
        this.stop();
        this.__completed = false;
        this.__lastTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.frameCount = 0;

        this.emit('reset', 0, 0, this.frameCount);
        return this;
    },

    /**
     * set the framerate for the animation loop
     *
     * @param {Number} fps
     * @return {Animitter}
     */
    setFPS: function(fps){
        this.__fps = fps;
        this.__isReadyForUpdate = makeThrottle(fps);
        return this;
    },

    /**
     * set the object that will provide `requestAnimationFrame`
     * and `cancelAnimationFrame` methods to this instance
     * @param {Object} object
     * @return {Animitter}
     */
    setRequestAnimationFrameObject: function(object){
        if(typeof object.requestAnimationFrame !== 'function' || typeof object.cancelAnimationFrame !== 'function'){
            throw new Error("Invalid object provide to `setRequestAnimationFrameObject`");
        }
        this.requestAnimationFrameObject = object;
        return this;
    },

    /**
     * start an animation loop
     * @emit Animitter#start
     * @return {Animitter}
     */
    start: function(){
        var self = this;
        if(this.__delay){
            setTimeout(function(){
                onStart(self);
            }, this.__delay);
        } else {
            onStart(this);
        }
        return this;
    },

    /**
     * stops the animation loop, does not mark as completed
     *
     * @emit Animitter#stop
     * @return {Animitter}
     */
    stop: function(){
        if( this.__running ){
            this.__running = false;
            exports.running -= 1;
            this.emit('stop', this.deltaTime, this.elapsedTime, this.frameCount);
        }
        return this;
    },

    /**
     * update the animation loop once
     *
     * @emit Animitter#update
     * @return {Animitter}
     */
    update: function(){
        this.frameCount++;
        /** @private */
        var now = Date.now();
        this.__lastTime = this.__lastTime || now;
        this.deltaTime = (this.fixedDelta || exports.globalFixedDelta) ? 1000/Math.min(60, this.__fps) : now - this.__lastTime;
        this.elapsedTime += this.deltaTime;
        this.__lastTime = now;

        this.emit('update', this.deltaTime, this.elapsedTime, this.frameCount);
        return this;
    }
};



for(var method in methods){
    Animitter.prototype[method] = methods[method];
}


/**
 * create an animitter instance,
 * @param {Object} [options]
 * @param {Function} fn( deltaTime:Number, elapsedTime:Number, frameCount:Number )
 * @returns {Animitter}
 */
function createAnimitter(options, fn){

    if( arguments.length === 1 && typeof options === 'function'){
        fn = options;
        options = {};
    }

    var _instance = new Animitter( options );

    if( fn ){
        _instance.on('update', fn);
    }

    return _instance;
}

module.exports = exports = createAnimitter;

/**
 * create an animitter instance,
 * where the scope is bound in all functions
 * @param {Object} [options]
 * @param {Function} fn( deltaTime:Number, elapsedTime:Number, frameCount:Number )
 * @returns {Animitter}
 */
exports.bound = function(options, fn){

    var loop = createAnimitter(options, fn),
        functionKeys = functions(Animitter.prototype),
        hasBind = !!Function.prototype.bind,
        fnKey;

    for(var i=0; i<functionKeys.length; i++){
        fnKey = functionKeys[i];
        loop[fnKey] = hasBind ? loop[fnKey].bind(loop) : bind(loop[fnKey], loop);
    }

    return loop;
};


exports.Animitter = Animitter;

/**
 * if true, all `Animitter` instances will behave as if `options.fixedDelta = true`
 */
exports.globalFixedDelta = false;

//helpful to inherit from when using bundled
exports.EventEmitter = EventEmitter;
//keep a global counter of all loops running, helpful to watch in dev tools
exports.running = 0;

function bind(fn, scope){
    if(typeof fn.bind === 'function'){
        return fn.bind(scope);
    }
    return function(){
        return fn.apply(scope, arguments);
    };
}

function functions(obj){
    var keys = Object.keys(obj);
    var arr = [];
    for(var i=0; i<keys.length; i++){
        if(typeof obj[keys[i]] === 'function'){
            arr.push(keys[i]);
        }
    }
    return arr;
}



//polyfill Date.now for real-old browsers
Date.now = Date.now || function now() {
    return new Date().getTime();
};


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.GA = GA;

var _domready = __webpack_require__(13);

var _domready2 = _interopRequireDefault(_domready);

var _Config = __webpack_require__(4);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function GA(category, action, label, value) {
	if (window.googleAnalytics) {
		if (typeof value !== 'undefined') {
			window.googleAnalytics('send', 'event', category, action, label, value);
		} else {
			window.googleAnalytics('send', 'event', category, action, label);
		}
	}
}

(0, _domready2.default)(function () {
	var scene = document.querySelector('a-scene');

	var currentArtist = null;
	var songCounter = 0;
	var songEndCounter = 0;

	//listen for some events
	scene.addEventListener('menu-selection', function (e) {
		currentArtist = e.detail.artist.split(' ').join('-');
		songCounter++;
		GA(currentArtist, 'select', 'order-selected-' + songCounter);
	});

	// song events
	scene.addEventListener('song-end', function (e) {
		songEndCounter++;
		GA(currentArtist, 'end', 'complete-plays-' + songEndCounter);
	});

	scene.addEventListener('sphere-click', function (e) {
		GA(currentArtist, e.detail.active ? 'stem-on' : 'stem-off', 'position-' + e.detail.index);
	});
});

/***/ }),
/* 21 */
/***/ (function(module, exports) {

module.exports = "/**\r\n * Copyright 2017 Google Inc.\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the 'License');\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *     http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an 'AS IS' BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n\r\nvarying vec2 vUv;\r\nvoid main(){\r\n\tvUv = uv;\r\n\tvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\r\n\tgl_Position = projectionMatrix * mvPosition;\r\n}\r\n"

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(2), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Tone.Volume is a simple volume node, useful for creating a volume fader. 
	 *
	 *  @extends {Tone}
	 *  @constructor
	 *  @param {Decibels} [volume=0] the initial volume
	 *  @example
	 * var vol = new Tone.Volume(-12);
	 * instrument.chain(vol, Tone.Master);
	 */
	Tone.Volume = function(){

		var options = Tone.defaults(arguments, ["volume"], Tone.Volume);
		Tone.call(this);

		/**
		 * the output node
		 * @type {GainNode}
		 * @private
		 */
		this.output = this.input = new Tone.Gain(options.volume, Tone.Type.Decibels);

		/**
		 * The unmuted volume
		 * @type {Decibels}
		 * @private
		 */
		this._unmutedVolume = options.volume;

		/**
		 *  The volume control in decibels. 
		 *  @type {Decibels}
		 *  @signal
		 */
		this.volume = this.output.gain;

		this._readOnly("volume");

		//set the mute initially
		this.mute = options.mute;
	};

	Tone.extend(Tone.Volume);

	/**
	 *  Defaults
	 *  @type  {Object}
	 *  @const
	 *  @static
	 */
	Tone.Volume.defaults = {
		"volume" : 0,
		"mute" : false
	};

	/**
	 * Mute the output. 
	 * @memberOf Tone.Volume#
	 * @type {boolean}
	 * @name mute
	 * @example
	 * //mute the output
	 * volume.mute = true;
	 */
	Object.defineProperty(Tone.Volume.prototype, "mute", {
		get : function(){
			return this.volume.value === -Infinity;
		}, 
		set : function(mute){
			if (!this.mute && mute){
				this._unmutedVolume = this.volume.value;
				//maybe it should ramp here?
				this.volume.value = -Infinity;
			} else if (this.mute && !mute){
				this.volume.value = this._unmutedVolume;
			}
		}
	});

	/**
	 *  clean up
	 *  @returns {Tone.Volume} this
	 */
	Tone.Volume.prototype.dispose = function(){
		this.input.dispose();
		Tone.prototype.dispose.call(this);
		this._writable("volume");
		this.volume.dispose();
		this.volume = null;
		return this;
	};

	return Tone.Volume;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(15), __webpack_require__(17)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	/**
	 *  shim
	 *  @private
	 */
	if (!window.hasOwnProperty("AudioContext") && window.hasOwnProperty("webkitAudioContext")){
		window.AudioContext = window.webkitAudioContext;
	}

	/**
	 *  @class Wrapper around the native AudioContext.
	 *  @extends {Tone.Emitter}
	 *  @param {AudioContext=} context optionally pass in a context
	 */
	Tone.Context = function(){

		Tone.Emitter.call(this);

		var options = Tone.defaults(arguments, ["context"], Tone.Context);

		if (!options.context){
			options.context = new window.AudioContext();
		}
		this._context = options.context;
		// extend all of the methods
		for (var prop in this._context){
			this._defineProperty(this._context, prop);
		}

		/**
		 *  The default latency hint
		 *  @type  {String}
		 *  @private
		 */
		this._latencyHint = options.latencyHint;

		/**
		 *  An object containing all of the constants AudioBufferSourceNodes
		 *  @type  {Object}
		 *  @private
		 */
		this._constants = {};

		///////////////////////////////////////////////////////////////////////
		// WORKER
		///////////////////////////////////////////////////////////////////////

		/**
		 *  The amount of time events are scheduled
		 *  into the future
		 *  @type  {Number}
		 *  @private
		 */
		this.lookAhead = options.lookAhead;

		/**
		 *  A reference to the actual computed update interval
		 *  @type  {Number}
		 *  @private
		 */
		this._computedUpdateInterval = 0;

		/**
		 *  A reliable callback method
		 *  @private
		 *  @type  {Ticker}
		 */
		this._ticker = new Ticker(this.emit.bind(this, "tick"), options.clockSource, options.updateInterval);

		///////////////////////////////////////////////////////////////////////
		// TIMEOUTS
		///////////////////////////////////////////////////////////////////////

		/**
		 *  All of the setTimeout events.
		 *  @type  {Tone.Timeline}
		 *  @private
		 */
		this._timeouts = new Tone.Timeline();

		/**
		 *  The timeout id counter
		 *  @private
		 *  @type {Number}
		 */
		this._timeoutIds = 0;

		this.on("tick", this._timeoutLoop.bind(this));

	};

	Tone.extend(Tone.Context, Tone.Emitter);
	Tone.Emitter.mixin(Tone.Context);

	/**
	 * defaults
	 * @static
	 * @type {Object}
	 */
	Tone.Context.defaults = {
		"clockSource" : "worker",
		"latencyHint" : "interactive",
		"lookAhead" : 0.1,
		"updateInterval" : 0.03
	};

	/**
	 *  Define a property on this Tone.Context. 
	 *  This is used to extend the native AudioContext
	 *  @param  {AudioContext}  context
	 *  @param  {String}  prop 
	 *  @private
	 */
	Tone.Context.prototype._defineProperty = function(context, prop){
		if (Tone.isUndef(this[prop])){
			Object.defineProperty(this, prop, {
				get : function(){
					if (typeof context[prop] === "function"){
						return context[prop].bind(context);
					} else {
						return context[prop];
					}
				},
				set : function(val){
					context[prop] = val;
				}
			});
		}
	};

	/**
	 *  The current audio context time
	 *  @return  {Number}
	 */
	Tone.Context.prototype.now = function(){
		return this._context.currentTime + this.lookAhead;
	};

	/**
	 *  Generate a looped buffer at some constant value.
	 *  @param  {Number}  val
	 *  @return  {BufferSourceNode}
	 */
	Tone.Context.prototype.getConstant = function(val){
		if (this._constants[val]){
			return this._constants[val];
		} else {
			var buffer = this._context.createBuffer(1, 128, this._context.sampleRate);
			var arr = buffer.getChannelData(0);
			for (var i = 0; i < arr.length; i++){
				arr[i] = val;
			}
			var constant = this._context.createBufferSource();
			constant.channelCount = 1;
			constant.channelCountMode = "explicit";
			constant.buffer = buffer;
			constant.loop = true;
			constant.start(0);
			this._constants[val] = constant;
			return constant;
		}
	};

	/**
	 *  The private loop which keeps track of the context scheduled timeouts
	 *  Is invoked from the clock source
	 *  @private
	 */
	Tone.Context.prototype._timeoutLoop = function(){
		var now = this.now();
		while(this._timeouts && this._timeouts.length && this._timeouts.peek().time <= now){
			this._timeouts.shift().callback();
		}
	};

	/**
	 *  A setTimeout which is gaurenteed by the clock source. 
	 *  Also runs in the offline context.
	 *  @param  {Function}  fn       The callback to invoke
	 *  @param  {Seconds}    timeout  The timeout in seconds
	 *  @returns {Number} ID to use when invoking Tone.Context.clearTimeout
	 */
	Tone.Context.prototype.setTimeout = function(fn, timeout){
		this._timeoutIds++;
		var now = this.now();
		this._timeouts.add({
			callback : fn, 
			time : now + timeout,
			id : this._timeoutIds
		});
		return this._timeoutIds;
	};

	/**
	 *  Clears a previously scheduled timeout with Tone.context.setTimeout
	 *  @param  {Number}  id  The ID returned from setTimeout
	 *  @return  {Tone.Context}  this
	 */
	Tone.Context.prototype.clearTimeout = function(id){
		this._timeouts.forEach(function(event){
			if (event.id === id){
				this.remove(event);
			}
		});
		return this;
	};

	/**
	 *  How often the Web Worker callback is invoked.
	 *  This number corresponds to how responsive the scheduling
	 *  can be. Context.updateInterval + Context.lookAhead gives you the
	 *  total latency between scheduling an event and hearing it.
	 *  @type {Number}
	 *  @memberOf Tone.Context#
	 *  @name updateInterval
	 */
	Object.defineProperty(Tone.Context.prototype, "updateInterval", {
		get : function(){
			return this._ticker.updateInterval;
		},
		set : function(interval){
			this._ticker.updateInterval = interval;
		}
	});

	/**
	 *  What the source of the clock is, either "worker" (Web Worker [default]), 
	 *  "timeout" (setTimeout), or "offline" (none). 
	 *  @type {String}
	 *  @memberOf Tone.Context#
	 *  @name clockSource
	 */
	Object.defineProperty(Tone.Context.prototype, "clockSource", {
		get : function(){
			return this._ticker.type;
		},
		set : function(type){
			this._ticker.type = type;
		}
	});

	/**
	 *  The type of playback, which affects tradeoffs between audio 
	 *  output latency and responsiveness. 
	 *  
	 *  In addition to setting the value in seconds, the latencyHint also
	 *  accepts the strings "interactive" (prioritizes low latency), 
	 *  "playback" (prioritizes sustained playback), "balanced" (balances
	 *  latency and performance), and "fastest" (lowest latency, might glitch more often). 
	 *  @type {String|Seconds}
	 *  @memberOf Tone.Context#
	 *  @name latencyHint
	 *  @example
	 * //set the lookAhead to 0.3 seconds
	 * Tone.context.latencyHint = 0.3;
	 */
	Object.defineProperty(Tone.Context.prototype, "latencyHint", {
		get : function(){
			return this._latencyHint;
		},
		set : function(hint){
			var lookAhead = hint;
			this._latencyHint = hint;
			if (Tone.isString(hint)){
				switch(hint){
					case "interactive" :
						lookAhead = 0.1;
						this._context.latencyHint = hint;
						break;
					case "playback" :
						lookAhead = 0.8;
						this._context.latencyHint = hint;
						break;
					case "balanced" :
						lookAhead = 0.25;
						this._context.latencyHint = hint;
						break;
					case "fastest" :
						this._context.latencyHint = "interactive";
						lookAhead = 0.01;
						break;
				}
			}
			this.lookAhead = lookAhead;
			this.updateInterval = lookAhead/3;
		}
	});

	/**
	 *  Clean up
	 *  @returns {Tone.Context} this
	 */
	Tone.Context.prototype.dispose = function(){
		Tone.Context.emit("close", this);
		Tone.Emitter.prototype.dispose.call(this);
		this._ticker.dispose();
		this._ticker = null;
		this._timeouts.dispose();
		this._timeouts = null;
		for(var con in this._constants){
			this._constants[con].disconnect();
		}
		this._constants = null;
		this.close();
		return this;
	};

	/**
	 * @class A class which provides a reliable callback using either
	 *        a Web Worker, or if that isn't supported, falls back to setTimeout.
	 * @private
	 */
	var Ticker = function(callback, type, updateInterval){

		/**
		 * Either "worker" or "timeout"
		 * @type {String}
		 * @private
		 */
		this._type = type;

		/**
		 * The update interval of the worker
		 * @private
		 * @type {Number}
		 */
		this._updateInterval = updateInterval;

		/**
		 * The callback to invoke at regular intervals
		 * @type {Function}
		 * @private
		 */
		this._callback = Tone.defaultArg(callback, Tone.noOp);

		//create the clock source for the first time
		this._createClock();
	};

	/**
	 * The possible ticker types
	 * @private
	 * @type {Object}
	 */
	Ticker.Type = {
		Worker : "worker",
		Timeout : "timeout",
		Offline : "offline"
	};

	/**
	 *  Generate a web worker
	 *  @return  {WebWorker}
	 *  @private
	 */
	Ticker.prototype._createWorker = function(){

		//URL Shim
		window.URL = window.URL || window.webkitURL;

		var blob = new Blob([
			//the initial timeout time
			"var timeoutTime = "+(this._updateInterval * 1000).toFixed(1)+";" +
			//onmessage callback
			"self.onmessage = function(msg){" +
			"	timeoutTime = parseInt(msg.data);" + 
			"};" + 
			//the tick function which posts a message
			//and schedules a new tick
			"function tick(){" +
			"	setTimeout(tick, timeoutTime);" +
			"	self.postMessage('tick');" +
			"}" +
			//call tick initially
			"tick();"
		]);
		var blobUrl = URL.createObjectURL(blob);
		var worker = new Worker(blobUrl);

		worker.onmessage = this._callback.bind(this);

		this._worker = worker;
	};

	/**
	 * Create a timeout loop
	 * @private
	 */
	Ticker.prototype._createTimeout = function(){
		this._timeout = setTimeout(function(){
			this._createTimeout();
			this._callback();
		}.bind(this), this._updateInterval * 1000);
	};

	/**
	 * Create the clock source.
	 * @private
	 */
	Ticker.prototype._createClock = function(){
		if (this._type === Ticker.Type.Worker){
			try {
				this._createWorker();
			} catch(e) {
				// workers not supported, fallback to timeout
				this._type = Ticker.Type.Timeout;
				this._createClock();
			}
		} else if (this._type === Ticker.Type.Timeout){
			this._createTimeout();
		}
	};

	/**
	 * @memberOf Ticker#
	 * @type {Number}
	 * @name updateInterval
	 * @private
	 */
	Object.defineProperty(Ticker.prototype, "updateInterval", {
		get : function(){
			return this._updateInterval;
		},
		set : function(interval){
			this._updateInterval = Math.max(interval, 128/44100);
			if (this._type === Ticker.Type.Worker){
				this._worker.postMessage(Math.max(interval * 1000, 1));
			}
		}
	});

	/**
	 * The type of the ticker, either a worker or a timeout
	 * @memberOf Ticker#
	 * @type {Number}
	 * @name type
	 * @private
	 */
	Object.defineProperty(Ticker.prototype, "type", {
		get : function(){
			return this._type;
		},
		set : function(type){
			this._disposeClock();
			this._type = type;
			this._createClock();
		}
	});

	/**
	 * Clean up the current clock source
	 * @private
	 */
	Ticker.prototype._disposeClock = function(){
		if (this._timeout){
			clearTimeout(this._timeout);
			this._timeout = null;
		}
		if (this._worker){
			this._worker.terminate();
			this._worker.onmessage = null;
			this._worker = null;
		}	
	};

	/**
	 * Clean up
	 * @private
	 */
	Ticker.prototype.dispose = function(){
		this._disposeClock();
		this._callback = null;
	};

	/**
	 *  Shim all connect/disconnect and some deprecated methods which are still in
	 *  some older implementations.
	 *  @private
	 */
	function shimConnect(){

		var nativeConnect = AudioNode.prototype.connect;
		var nativeDisconnect = AudioNode.prototype.disconnect;

		//replace the old connect method
		function toneConnect(B, outNum, inNum){
			if (B.input){
				inNum = Tone.defaultArg(inNum, 0);
				if (Tone.isArray(B.input)){
					this.connect(B.input[inNum]);
				} else {
					this.connect(B.input, outNum, inNum);
				}
			} else {
				try {
					if (B instanceof AudioNode){
						nativeConnect.call(this, B, outNum, inNum);
					} else {
						nativeConnect.call(this, B, outNum);
					}
				} catch (e) {
					throw new Error("error connecting to node: "+B+"\n"+e);
				}
			}
		}

		//replace the old disconnect method
		function toneDisconnect(B, outNum, inNum){
			if (B && B.input && Tone.isArray(B.input)){
				inNum = Tone.defaultArg(inNum, 0);
				this.disconnect(B.input[inNum], outNum, 0);
			} else if (B && B.input){
				this.disconnect(B.input, outNum, inNum);
			} else {
				try {
					nativeDisconnect.apply(this, arguments);
				} catch (e) {
					throw new Error("error disconnecting node: "+B+"\n"+e);
				}
			}
		}

		if (AudioNode.prototype.connect !== toneConnect){
			AudioNode.prototype.connect = toneConnect;
			AudioNode.prototype.disconnect = toneDisconnect;
		}
	}

	// set the audio context initially
	if (Tone.supported){
		shimConnect();
		Tone.context = new Tone.Context();
	} else {
		console.warn("This browser does not support Tone.js");
	}

	return Tone.Context;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(9), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class AudioToGain converts an input in AudioRange [-1,1] to NormalRange [0,1]. 
	 *         See Tone.GainToAudio.
	 *
	 *  @extends {Tone.SignalBase}
	 *  @constructor
	 *  @example
	 *  var a2g = new Tone.AudioToGain();
	 */
	Tone.AudioToGain = function(){

		Tone.SignalBase.call(this);
		/**
		 *  @type {WaveShaperNode}
		 *  @private
		 */
		this._norm = this.input = this.output = new Tone.WaveShaper(function(x){
			return (x + 1) / 2;
		});
	};

	Tone.extend(Tone.AudioToGain, Tone.SignalBase);

	/**
	 *  clean up
	 *  @returns {Tone.AudioToGain} this
	 */
	Tone.AudioToGain.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._norm.dispose();
		this._norm = null;
		return this;
	};

	return Tone.AudioToGain;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(43), __webpack_require__(45), __webpack_require__(2), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Subtract the signal connected to <code>input[1]</code> from the signal connected 
	 *         to <code>input[0]</code>. If an argument is provided in the constructor, the 
	 *         signals <code>.value</code> will be subtracted from the incoming signal.
	 *
	 *  @extends {Tone.Signal}
	 *  @constructor
	 *  @param {number=} value The value to subtract from the incoming signal. If the value
	 *                         is omitted, it will subtract the second signal from the first.
	 *  @example
	 * var sub = new Tone.Subtract(1);
	 * var sig = new Tone.Signal(4).connect(sub);
	 * //the output of sub is 3. 
	 *  @example
	 * var sub = new Tone.Subtract();
	 * var sigA = new Tone.Signal(10);
	 * var sigB = new Tone.Signal(2.5);
	 * sigA.connect(sub, 0, 0);
	 * sigB.connect(sub, 0, 1);
	 * //output of sub is 7.5
	 */
	Tone.Subtract = function(value){

		Tone.Signal.call(this);
		this.createInsOuts(2, 0);

		/**
		 *  the summing node
		 *  @type {GainNode}
		 *  @private
		 */
		this._sum = this.input[0] = this.output = new Tone.Gain();

		/**
		 *  negate the input of the second input before connecting it
		 *  to the summing node.
		 *  @type {Tone.Negate}
		 *  @private
		 */
		this._neg = new Tone.Negate();

		/**
		 *  the node where the value is set
		 *  @private
		 *  @type {Tone.Signal}
		 */
		this._param = this.input[1] = new Tone.Signal(value);

		this._param.chain(this._neg, this._sum);
	};

	Tone.extend(Tone.Subtract, Tone.Signal);

	/**
	 *  Clean up.
	 *  @returns {Tone.SignalBase} this
	 */
	Tone.Subtract.prototype.dispose = function(){
		Tone.Signal.prototype.dispose.call(this);
		this._neg.dispose();
		this._neg = null;
		this._sum.disconnect();
		this._sum = null;
		return this;
	};

	return Tone.Subtract;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(5), __webpack_require__(48), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	/**
	 *  BufferSource polyfill
	 */
	if (window.AudioBufferSourceNode && !AudioBufferSourceNode.prototype.start){
		AudioBufferSourceNode.prototype.start = AudioBufferSourceNode.prototype.noteGrainOn;
		AudioBufferSourceNode.prototype.stop = AudioBufferSourceNode.prototype.noteOff;
	}

	/**
	 *  @class Wrapper around the native BufferSourceNode.
	 *  @extends {Tone}
	 *  @param  {AudioBuffer|Tone.Buffer}  buffer   The buffer to play
	 *  @param  {Function}  onload  The callback to invoke when the 
	 *                               buffer is done playing.
	 */
	Tone.BufferSource = function(){

		var options = Tone.defaults(arguments, ["buffer", "onload"], Tone.BufferSource);
		Tone.call(this);

		/**
		 *  The callback to invoke after the 
		 *  buffer source is done playing. 
		 *  @type  {Function}
		 */
		this.onended = options.onended;

		/**
		 *  The time that the buffer was started.
		 *  @type  {Number}
		 *  @private
		 */
		this._startTime = -1;

		/**
		 *  The time that the buffer is scheduled to stop.
		 *  @type  {Number}
		 *  @private
		 */
		this._stopTime = -1;

		/**
		 *  The gain node which envelopes the BufferSource
		 *  @type  {Tone.Gain}
		 *  @private
		 */
		this._gainNode = this.output = new Tone.Gain();

		/**
		 *  The buffer source
		 *  @type  {AudioBufferSourceNode}
		 *  @private
		 */
		this._source = this.context.createBufferSource();
		this._source.connect(this._gainNode);

		/**
		 * The private buffer instance
		 * @type {Tone.Buffer}
		 * @private
		 */
		this._buffer = new Tone.Buffer(options.buffer, options.onload);
	
		/**
		 *  The playbackRate of the buffer
		 *  @type {Positive}
		 *  @signal
		 */
		this.playbackRate = new Tone.Param(this._source.playbackRate, Tone.Type.Positive);

		/**
		 *  The fadeIn time of the amplitude envelope.
		 *  @type {Time}
		 */
		this.fadeIn = options.fadeIn;

		/**
		 *  The fadeOut time of the amplitude envelope.
		 *  @type {Time}
		 */
		this.fadeOut = options.fadeOut;

		/**
		 *  The value that the buffer ramps to
		 *  @type {Gain}
		 *  @private
		 */
		this._gain = 1;

		/**
		 * The onended timeout
		 * @type {Number}
		 * @private
		 */
		this._onendedTimeout = -1;

		this.loop = options.loop;
		this.loopStart = options.loopStart;
		this.loopEnd = options.loopEnd;
		this.playbackRate.value = options.playbackRate;
	};

	Tone.extend(Tone.BufferSource);

	/**
	 *  The defaults
	 *  @const
	 *  @type  {Object}
	 */
	Tone.BufferSource.defaults = {
		"onended" : Tone.noOp,
		"onload" : Tone.noOp,
		"loop" : false,
		"loopStart" : 0,
		"loopEnd" : 0,
		"fadeIn" : 0,
		"fadeOut" : 0,
		"playbackRate" : 1
	};

	/**
	 *  Returns the playback state of the source, either "started" or "stopped".
	 *  @type {Tone.State}
	 *  @readOnly
	 *  @memberOf Tone.BufferSource#
	 *  @name state
	 */
	Object.defineProperty(Tone.BufferSource.prototype, "state", {
		get : function(){
			var now = this.now();
			if (this._startTime !== -1 && now >= this._startTime && now < this._stopTime){
				return Tone.State.Started;
			} else {
				return Tone.State.Stopped;
			}
		}
	});

	/**
	 *  Start the buffer
	 *  @param  {Time} [startTime=now] When the player should start.
	 *  @param  {Time} [offset=0] The offset from the beginning of the sample
	 *                                 to start at. 
	 *  @param  {Time=} duration How long the sample should play. If no duration
	 *                                is given, it will default to the full length 
	 *                                of the sample (minus any offset)
	 *  @param  {Gain}  [gain=1]  The gain to play the buffer back at.
	 *  @param  {Time=}  fadeInTime  The optional fadeIn ramp time.
	 *  @return  {Tone.BufferSource}  this
	 */
	Tone.BufferSource.prototype.start = function(time, offset, duration, gain, fadeInTime){
		if (this._startTime !== -1){
			throw new Error("Tone.BufferSource can only be started once.");
		}

		if (this.buffer.loaded){
			time = this.toSeconds(time);
			//if it's a loop the default offset is the loopstart point
			if (this.loop){
				offset = Tone.defaultArg(offset, this.loopStart);
			} else {
				//otherwise the default offset is 0
				offset = Tone.defaultArg(offset, 0);
			}
			offset = this.toSeconds(offset);
			//the values in seconds
			time = this.toSeconds(time);

			gain = Tone.defaultArg(gain, 1);
			this._gain = gain;

			//the fadeIn time
			if (Tone.isUndef(fadeInTime)){
				fadeInTime = this.toSeconds(this.fadeIn);
			} else {
				fadeInTime = this.toSeconds(fadeInTime);
			}

			if (fadeInTime > 0){
				this._gainNode.gain.setValueAtTime(0, time);
				this._gainNode.gain.linearRampToValueAtTime(this._gain, time + fadeInTime);
			} else {
				this._gainNode.gain.setValueAtTime(gain, time);
			}

			this._startTime = time + fadeInTime;

			var computedDur = Tone.defaultArg(duration, this.buffer.duration - offset);
			computedDur = this.toSeconds(computedDur);
			computedDur = Math.max(computedDur, 0);

			if (!this.loop || (this.loop && !Tone.isUndef(duration))){
				//clip the duration when not looping
				if (!this.loop){
					computedDur = Math.min(computedDur, this.buffer.duration - offset);
				}
				this.stop(time + computedDur + fadeInTime, this.fadeOut);
			}

			//start the buffer source
			if (this.loop){
				//modify the offset if it's greater than the loop time
				var loopEnd = this.loopEnd || this.buffer.duration;
				var loopStart = this.loopStart;
				var loopDuration = loopEnd - loopStart;
				//move the offset back
				if (offset > loopEnd){
					offset = ((offset - loopStart) % loopDuration) + loopStart;
				}
			}
			this._source.buffer = this.buffer.get();
			this._source.loopEnd = this.loopEnd || this.buffer.duration;
			this._source.start(time, offset);
		} else {
			throw new Error("Tone.BufferSource: buffer is either not set or not loaded.");
		}

		return this;
	};

	/**
	 *  Stop the buffer. Optionally add a ramp time to fade the 
	 *  buffer out. 
	 *  @param  {Time=}  time         The time the buffer should stop.
	 *  @param  {Time=}  fadeOutTime  How long the gain should fade out for
	 *  @return  {Tone.BufferSource}  this
	 */
	Tone.BufferSource.prototype.stop = function(time, fadeOutTime){
		if (this.buffer.loaded){

			time = this.toSeconds(time);
			
			//the fadeOut time
			if (Tone.isUndef(fadeOutTime)){
				fadeOutTime = this.toSeconds(this.fadeOut);
			} else {
				fadeOutTime = this.toSeconds(fadeOutTime);
			}			

			//only stop if the last stop was scheduled later
			if (this._stopTime === -1 || this._stopTime > time){
				this._stopTime = time;				

				//cancel the end curve
				this._gainNode.gain.cancelScheduledValues(this._startTime + this.sampleTime);
				time = Math.max(this._startTime, time);

				//set a new one
				if (fadeOutTime > 0){
					var startFade = Math.max(this._startTime, time - fadeOutTime);
					this._gainNode.gain.setValueAtTime(this._gain, startFade);
					this._gainNode.gain.linearRampToValueAtTime(0, time);
				} else {
					this._gainNode.gain.setValueAtTime(0, time);
				}

				Tone.context.clearTimeout(this._onendedTimeout);
				this._onendedTimeout = Tone.context.setTimeout(this._onended.bind(this), this._stopTime - this.now());
			}
		} else {
			throw new Error("Tone.BufferSource: buffer is either not set or not loaded.");
		}

		return this;
	};

	/**
	 *  Internal callback when the buffer is ended. 
	 *  Invokes `onended` and disposes the node.
	 *  @private
	 */
	Tone.BufferSource.prototype._onended = function(){
		this.onended(this);
	};

	/**
	 * If loop is true, the loop will start at this position. 
	 * @memberOf Tone.BufferSource#
	 * @type {Time}
	 * @name loopStart
	 */
	Object.defineProperty(Tone.BufferSource.prototype, "loopStart", {
		get : function(){
			return this._source.loopStart;
		}, 
		set : function(loopStart){
			this._source.loopStart = this.toSeconds(loopStart);
		}
	});

	/**
	 * If loop is true, the loop will end at this position.
	 * @memberOf Tone.BufferSource#
	 * @type {Time}
	 * @name loopEnd
	 */
	Object.defineProperty(Tone.BufferSource.prototype, "loopEnd", {
		get : function(){
			return this._source.loopEnd;
		}, 
		set : function(loopEnd){
			this._source.loopEnd = this.toSeconds(loopEnd);
		}
	});

	/**
	 * The audio buffer belonging to the player. 
	 * @memberOf Tone.BufferSource#
	 * @type {Tone.Buffer}
	 * @name buffer
	 */
	Object.defineProperty(Tone.BufferSource.prototype, "buffer", {
		get : function(){
			return this._buffer;
		}, 
		set : function(buffer){
			this._buffer.set(buffer);
		}
	});

	/**
	 * If the buffer should loop once it's over. 
	 * @memberOf Tone.BufferSource#
	 * @type {Boolean}
	 * @name loop
	 */
	Object.defineProperty(Tone.BufferSource.prototype, "loop", {
		get : function(){
			return this._source.loop;
		}, 
		set : function(loop){
			this._source.loop = loop;
		}
	});

	/**
	 *  Clean up.
	 *  @return  {Tone.BufferSource}  this
	 */
	Tone.BufferSource.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this.onended = null;
		this._source.disconnect();
		this._source = null;
		this._gainNode.dispose();
		this._gainNode = null;
		this._buffer.dispose();
		this._buffer = null;
		this._startTime = -1;
		this.playbackRate = null;
		Tone.context.clearTimeout(this._onendedTimeout);
		return this;
	};

	return Tone.BufferSource;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

var _eventMap = __webpack_require__(35);

var _eventMap2 = _interopRequireDefault(_eventMap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * mouse-cursor component
 * allows you to use your mouse to select menu items
 */
/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

AFRAME.registerComponent('mouse-cursor', {
    init: function init() {
        var _this = this;

        // let touchmoved = false
        this.mousePosition = new THREE.Vector2();
        this.camera = document.querySelector('a-scene').camera;
        // update the position of the mouse
        this.__vector = new THREE.Vector3();

        this.__removeListeners = (0, _eventMap2.default)({
            'mousemove': function mousemove(e) {
                _this.mousePosition.x = e.clientX;
                _this.mousePosition.y = e.clientY;
            },
            'touchmove': function touchmove(e) {
                if (e.touches) {
                    // touchmoved = true
                    var touch = e.touches[0];
                    _this.mousePosition.x = touch.clientX;
                    _this.mousePosition.y = touch.clientY;
                }
            },
            'touchstart': function touchstart(e) {
                if (e.touches) {
                    // touchmoved = false
                    var touch = e.touches[0];
                    _this.mousePosition.x = touch.clientX;
                    _this.mousePosition.y = touch.clientY;
                    _this.el.emit('touch-start');
                }
                _this.tick();
            },
            'touchend': function touchend(e) {
                _this.el.emit('touch-end');
            }
        });

        this.onContextMenu = this.onContextMenu.bind(this);
        window.addEventListener('contextmenu', this.onContextMenu);
    },
    onContextMenu: function onContextMenu(e) {
        //stop the context menu
        e.preventDefault();
        e.stopPropagation();
        return false;
    },
    remove: function remove() {
        this.__removeListeners();
        window.removeEventListener('contextmenu', this.onContextMenu);
    },
    tick: function tick() {
        this.__vector.set(this.mousePosition.x / window.innerWidth * 2 - 1, -(this.mousePosition.y / window.innerHeight) * 2 + 1, 0.5);

        this.__vector.unproject(this.camera);

        var cameraPosition = this.camera.getWorldPosition();
        var dir = this.__vector.sub(cameraPosition).normalize();

        var distance = 0.1;

        var pos = cameraPosition.clone().add(dir.multiplyScalar(distance));

        //this.el.object3D.position.set(pos.x, pos.y, pos.z)
        this.el.setAttribute('position', pos.x + ' ' + pos.y + ' ' + pos.z);
    }
});

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.RingPoints = exports.geometryPool = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Helpers = __webpack_require__(7);

var _rings = __webpack_require__(99);

var _rings2 = _interopRequireDefault(_rings);

var _rings3 = __webpack_require__(98);

var _rings4 = _interopRequireDefault(_rings3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* global THREE */
/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * RingPointMaterial
 * Links up the custom vertex and fragment shaders for a single circle of points
 * @extends THREE.RawShaderMaterial
 * @param {Object} [options]
 * @param {Number} [options.resolution=128]
 * @param {THREE.Color} [options.color=(1,1,1)]
 * @param {Number} [options.opacity=1.0]
 * @param {Number} [options.size=1.0]
 * @param {Number} [options.blending=THREE.NormalBlending]
 * @param {String} [options.shape='circle']
 * @param {Number} [options.radius=1.0]
 */
var RingPointMaterial = function (_THREE$RawShaderMater) {
	_inherits(RingPointMaterial, _THREE$RawShaderMater);

	function RingPointMaterial() {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, RingPointMaterial);

		options.resolution = options.resolution || 128;
		options.color = options.color || new THREE.Color(1, 1, 1);
		options.opacity = typeof options.opacity !== 'undefined' ? options.opacity : 1.0;
		options.size = options.size || 1.0;
		options.blending = options.blending || THREE.NormalBlending;
		options.shape = options.shape || 'circle';
		options.radius = options.radius || 1.0;

		var waveform = new Float32Array(options.resolution);
		for (var i = 0; i < options.resolution; i++) {
			waveform[i] = 0;
		}
		return _possibleConstructorReturn(this, (RingPointMaterial.__proto__ || Object.getPrototypeOf(RingPointMaterial)).call(this, {
			fog: true,
			blending: options.blending,
			defines: {
				'WAVEFORM_RESOLUTION': options.resolution
			},
			vertexShader: _rings2.default,
			fragmentShader: _rings4.default,
			// depthWrite: false,
			//depthTest: false,
			transparent: true, //options.opacity === 1 ? false : true,
			uniforms: {
				shape: {
					type: 't',
					value: new THREE.TextureLoader().load('images/textures/' + options.shape + '.png')
				},
				radius: {
					type: 'f',
					value: options.radius
				},
				size: {
					type: 'f',
					value: options.size
				},
				color: {
					type: 'c',
					value: options.color
				},
				opacity: {
					type: 'f',
					value: options.opacity
				},
				waveform: {
					type: 'fv1',
					value: waveform
				},
				amplitude: {
					type: 'f',
					value: 1.0
				},
				fogNear: {
					type: 'f',
					value: 0
				},
				fogFar: {
					type: 'f',
					value: 0
				},
				fogColor: {
					type: 'c',
					value: new THREE.Color()
				}
			}
		}));
	}

	return RingPointMaterial;
}(THREE.RawShaderMaterial);

;

/**
 * RingBufferGeometry
 * The geometry for a single circle of points
 * includes `reference` attribute for vertex shader to associate
 * an individual point to its waveform data.
 * @extends THREE.BufferGeometry
 * @param {Number} [resolution=128]
 */

var RingBufferGeometry = function (_THREE$BufferGeometry) {
	_inherits(RingBufferGeometry, _THREE$BufferGeometry);

	function RingBufferGeometry() {
		var resolution = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;

		_classCallCheck(this, RingBufferGeometry);

		// console.log(`new geometry ${resolution}`)

		var _this2 = _possibleConstructorReturn(this, (RingBufferGeometry.__proto__ || Object.getPrototypeOf(RingBufferGeometry)).call(this, new THREE.BufferGeometry()));

		_this2.resolution = resolution;

		//position attribute, needs to be there,
		//but its calculated in the vertex shader
		var positions = new Float32Array(resolution * 3);

		// for(let i=0; i<resolution; i++){

		//     const angle = (i+1)/resolution * Math.PI * 2;
		//     const x = Math.cos(angle);
		//     const y = 0;
		//     const z = Math.sin(angle);


		//     positions[i * 3] = x;
		//     positions[i * 3 +1] = y;
		//     positions[i * 3 +2] = z;

		// }


		var posAttribute = new THREE.BufferAttribute(positions, 3);
		_this2.addAttribute('position', posAttribute);

		//index attribute, each point gets an index for reference on the waveform uniform
		var reference = new Float32Array(resolution);
		for (var i = 0; i < resolution; i++) {
			reference[i] = i / resolution;
		}

		var referenceAttribute = new THREE.BufferAttribute(reference, 1);
		_this2.addAttribute('reference', referenceAttribute);

		//since the positions are set in shader,
		//we need a custom boundingSphere to a void erroneous culling
		_this2.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0.52);
		return _this2;
	}

	return RingBufferGeometry;
}(THREE.BufferGeometry);

/**
 * geometryPool
 * re-use the same geometry for multiple objects with the same parameters
 * @type {{get, clear}}
 */


var geometryPool = exports.geometryPool = function () {
	var pool = {};

	function get(resolution) {
		//only make one geometry for any series of same parameters
		var key = '' + resolution;
		pool[key] = pool[key] || [];
		while (pool[key].length < 2) {
			pool[key].push(new RingBufferGeometry(1, resolution));
		}
		return pool[key][1];
	}

	function clear() {
		pool = {};
	}

	return { get: get, clear: clear };
}();

/**
 * RingPoints
 * the `Object3D` for a single circle of particles
 * @extends THREE.Points
 * @see RingPointMaterial
 * @param {Object} [options] check `RingPointMaterial` for properties
 */

var RingPoints = exports.RingPoints = function (_THREE$Points) {
	_inherits(RingPoints, _THREE$Points);

	function RingPoints() {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, RingPoints);

		if (typeof options.useCache === 'undefined') {
			options.useCache = true;
		}

		if (typeof options.useCache !== 'undefined') {
			delete options.useCache;
		}

		var geom = new RingBufferGeometry(options.resolution); //geometryPool.get(options.resolution);

		var _this3 = _possibleConstructorReturn(this, (RingPoints.__proto__ || Object.getPrototypeOf(RingPoints)).call(this, geom, new RingPointMaterial(options)));

		_this3.renderOrder = 2;

		_this3.__goalProperties = {
			radius: _this3.material.uniforms.radius.value,
			opacity: _this3.material.uniforms.opacity.value
		};
		return _this3;
	}

	_createClass(RingPoints, [{
		key: 'transitionStep',
		value: function transitionStep(t) {
			for (var prop in this.__goalProperties) {
				var uni = this.material.uniforms[prop];
				uni.value = (0, _Helpers.lerp)(0, this.__goalProperties[prop], t);
			}
		}
	}]);

	return RingPoints;
}(THREE.Points);

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

var _Helpers = __webpack_require__(7);

var _Buffer = __webpack_require__(5);

var _Buffer2 = _interopRequireDefault(_Buffer);

__webpack_require__(29);

var _Transport = __webpack_require__(6);

var _Transport2 = _interopRequireDefault(_Transport);

var _basic = __webpack_require__(21);

var _basic2 = _interopRequireDefault(_basic);

var _sphere = __webpack_require__(100);

var _sphere2 = _interopRequireDefault(_sphere);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

AFRAME.registerComponent('material-sphere', {

	schema: {
		opacity: {
			type: 'number',
			default: 1
		},
		tintColor: {
			type: 'string',
			default: '#ff0000'
		}
	},

	init: function init() {
		var data = this.data;

		this.material = new THREE.ShaderMaterial({
			fog: true,
			vertexShader: _basic2.default,
			fragmentShader: _sphere2.default,
			//transparent: true,
			uniforms: {
				enabled: {
					type: '1i',
					value: 0
				},
				opacity: {
					type: 'f',
					value: data.opacity
				},
				tintColor: {
					type: 'c',
					value: new THREE.Color((0, _Helpers.stringToHex)(data.tintColor))
				},
				mixRate: {
					type: 'f',
					value: 0
				},
				fogNear: {
					type: 'f',
					value: 0
				},
				fogFar: {
					type: 'f',
					value: 0
				},
				fogColor: {
					type: 'c',
					value: new THREE.Color()
				}
			}
		});

		var mesh = this.el.getObject3D('mesh');
		if (mesh) {
			mesh.renderOrder = 1;
			mesh.material = this.material;
		}
	},
	update: function update() {
		var data = this.data;
		this.material.uniforms.opacity.value = data.opacity;
		this.material.uniforms.tintColor.value.setHex((0, _Helpers.stringToHex)(data.tintColor));
	}
});

AFRAME.registerComponent('sphere', {

	schema: {
		name: {
			type: 'string'
		},
		tintColor: {
			type: 'string'
		}
	},

	init: function init() {
		var _this = this;

		this._activeColor = 'white';
		this._inactiveColor = 'rgb(30, 30, 30)';

		var trackIndicator = document.createElementWithAttributes('a-entity', {
			scale: '0.15 0.15 0.15'
		});
		this.el.appendChild(trackIndicator);

		var sphereEl = this.sphereEl = document.createElement('a-sphere');
		sphereEl.setAttribute('material-sphere', 'opacity: 0.8; tintColor: #0000ff'); //`transparent : true; color: ${this._inactiveColor}; opacity: 0.8; shader : flat`)
		sphereEl.setAttribute('position', '0 0.5 0');
		sphereEl.setAttribute('look-at', '[camera]');
		trackIndicator.appendChild(sphereEl);

		// the highlight ring
		var ring = document.createElement('a-ring');
		ring.setAttribute('color', 'white');
		ring.setAttribute('material', 'side: double; shader: flat;');
		ring.setAttribute('radius-inner', '1');
		ring.setAttribute('radius-outer', '1.1');
		ring.setAttribute('segments-theta', 64);
		ring.setAttribute('visible', false);
		ring.setAttribute('look-at', '[camera]');
		sphereEl.appendChild(ring);

		//make the ring appear on hover
		this.el.addEventListener('mouseenter', function () {
			if (_this.el.getAttribute('pointer-events')) {
				ring.setAttribute('visible', true);
			}
		});
		this.el.addEventListener('mouseleave', function () {
			if (_this.el.getAttribute('pointer-events')) {
				ring.setAttribute('visible', false);
			}
		});

		//add the sphere to the element
		sphereEl.classList.add('selectable');

		this._addText(trackIndicator);
		this._addEvents(sphereEl);
	},
	tick: function tick() {
		// get the player amplitude
		var amp = this.el.components.player.getAmplitude();
		// let height = amp*9 + 1
		// height = Math.log10(height)
		this.sphereEl.setAttribute('position', '0 ' + (amp - 0.5) + ' 0');
		var smoothAmp = this.el.components['sound-rings'].amplitude;
		this.sphereEl.components['material-sphere'].material.uniforms.mixRate.value = smoothAmp * 2.5;
	},
	_addText: function _addText(sphereEl) {
		var textEntity = this.text = document.createElementWithAttributes('a-text', {
			value: '',
			position: '0 2 0',
			side: 'double',
			align: 'center',
			'wrap-count': 12,
			width: 4,
			color: 'white',
			rotation: '0 180 0',
			opacity: 0,
			transparent: true,
			animate: 'attribute : opacity; time : 500;'
		});
		sphereEl.appendChild(textEntity);

		//fade in the text when it's off the floor
		/*this.el.addEventListener('floor-off', () => {
  	textEntity.setAttribute('opacity', 1)
  })
  		this.el.addEventListener('floor-on', () => {
  	textEntity.setAttribute('opacity', 0)
  })*/

		var fadeInAnimation = document.createElementWithAttributes('a-animation', {
			'attribute': 'opacity',
			'begin': 'floor-on',
			'dur': '700',
			'to': 0
		});
		var fadeOutAnimation = document.createElementWithAttributes('a-animation', {
			'attribute': 'opacity',
			'begin': 'floor-off',
			'dur': '700',
			'to': 1
		});

		textEntity.appendChild(fadeInAnimation);
		textEntity.appendChild(fadeOutAnimation);
	},
	_addEvents: function _addEvents(sphereEl) {
		var _this2 = this;

		var lastClick = 0;

		//active state
		sphereEl.addEventListener('click', function () {
			//toggle activation
			if (_this2.el.getAttribute('pointer-events')) {
				//debounce
				if (Date.now() - lastClick > 500) {
					lastClick = Date.now();
				} else {
					return;
				}
				if (_Transport2.default.state !== 'started') {
					return;
				}
				if (!_this2.el.getAttribute('active')) {
					_this2.el.setAttribute('active', 'true');
				} else {
					_this2.el.setAttribute('active', 'false');
				}
				_this2.el.sceneEl.emit('sphere-click', {
					index: _this2.el.getAttribute('track-index').index,
					active: _this2.el.getAttribute('active')
				});
			}
		});

		//forward events to the sphere class
		this.el.addEventListener('componentchanged', function (e) {
			if (e.detail.name === 'active') {
				sphereEl.emit(e.detail.newData ? 'activate' : 'deactivate');
				sphereEl.components['material-sphere'].material.uniforms.enabled.value = e.detail.newData ? 1 : 0;
			}
		});

		//when it is active/inactive
		var activateAnim = document.createElementWithAttributes('a-animation', {
			'attribute': 'material.color',
			'begin': 'activate',
			'dur': '300',
			'to': this._activeColor
		});
		sphereEl.appendChild(activateAnim);
		var deactivateAnim = document.createElementWithAttributes('a-animation', {
			'attribute': 'material.color',
			'begin': 'deactivate',
			'dur': '300',
			'to': this._inactiveColor
		});
		sphereEl.appendChild(deactivateAnim);
	},
	update: function update() {
		this.text.setAttribute('value', this.data.name.toUpperCase());
		this.sphereEl.setAttribute('material-sphere', 'opacity: 0.8; tintColor: ' + this.data.tintColor);
	}
});

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

var _Buffer = __webpack_require__(5);

var _Buffer2 = _interopRequireDefault(_Buffer);

var _tinycolor = __webpack_require__(114);

var _tinycolor2 = _interopRequireDefault(_tinycolor);

var _Voice = __webpack_require__(75);

var _Config = __webpack_require__(4);

var _Transport = __webpack_require__(6);

var _Transport2 = _interopRequireDefault(_Transport);

__webpack_require__(27);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

AFRAME.registerComponent('loading', {

	schema: {
		loader: {
			default: false,
			type: 'boolean'
		},
		voiceOver: {
			default: false,
			type: 'boolean'
		}
	},

	init: function init() {
		var _this = this;

		if (!_Config.supported) {
			return;
		}

		this.voice = new _Voice.Voice();

		this.el.sceneEl.addEventListener('enter-360', function () {
			_this.voice.intro();
		});

		this.el.sceneEl.addEventListener('enter-vr', function () {
			_this.voice.intro(3);
		});

		this.first = false;

		this.el.sceneEl.addEventListener('menu-selection', function (e) {
			_this.voice.song(e.detail);
			//record as the first menu selection
			_this.first = true;
		});

		this.el.sceneEl.addEventListener('audio-loaded', function () {
			_this.el.setAttribute('loading', 'loader', false);
		});

		this.el.sceneEl.addEventListener('buffering', function () {
			_this.el.setAttribute('loading', 'loader', true);
		});

		this.el.sceneEl.addEventListener('buffering-end', function () {
			_this.el.setAttribute('loading', 'loader', false);
		});

		this.voice.on('ended', function () {
			_this.el.setAttribute('loading', 'voiceOver', false);
		});

		this.el.sceneEl.addEventListener('song-end', function () {
			var playButton = document.querySelector('#playButton');
			playButton.setAttribute('playbutton', 'playing:false; visible: false');
			//infoButton.setAttribute('infobutton', 'visible: false')
			_this.voice.pickAnother();
		});

		this.el.sceneEl.addEventListener('end-vr', function () {
			_this.voice.stop();
		});
	},
	update: function update() {

		var loadingRing = document.querySelector('#loadingRing');
		var playButton = document.querySelector('#playButton');
		var menu = document.querySelector('#menu');
		//const infoButton = document.querySelector('#infoButton')

		//loading
		if (this.data.loader || this.data.voiceOver) {
			loadingRing.setAttribute('visible', true);
			// loadingRing.setAttribute('scale', '0.5 0.5 0.5')
			// loadingRing.emit('appear')
			//set it to stop playing
			playButton.setAttribute('playbutton', 'playing:false; visible: false');
			//infoButton.setAttribute('infobutton', 'playing:false; visible: false')
			//done loading
		} else if (!this.data.loader && !this.data.voiceOver && this.first) {
			loadingRing.setAttribute('visible', false);
			// loadingRing.setAttribute('scale', '0 0 0')
			// loadingRing.emit('disappear')
			// set it to start playing
			playButton.setAttribute('playbutton', 'playing:true; visible: true');
			this.el.sceneEl.emit('song-start');
			//infoButton.setAttribute('infobutton', 'visible: true')
		}
	}
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SplashScene = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright 2017 Google Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Licensed under the Apache License, Version 2.0 (the 'License');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * distributed under the License is distributed on an 'AS IS' BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _Helpers = __webpack_require__(7);

var _rings = __webpack_require__(31);

var ring = _interopRequireWildcard(_rings);

var _Buffer = __webpack_require__(5);

var _Buffer2 = _interopRequireDefault(_Buffer);

var _animitter = __webpack_require__(19);

var _animitter2 = _interopRequireDefault(_animitter);

var _eventMap = __webpack_require__(35);

var _eventMap2 = _interopRequireDefault(_eventMap);

var _expoInOut = __webpack_require__(86);

var _expoInOut2 = _interopRequireDefault(_expoInOut);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

__webpack_require__(106);
__webpack_require__(107);
__webpack_require__(108);
__webpack_require__(109);
__webpack_require__(110);
__webpack_require__(112);
__webpack_require__(111);

//song_exploder_intro.[mp3|ogg]', buffer =>
//returns a Promise which resolves with an array
var getBuffer = function getBuffer() {
    return new Promise(function (resolve) {
        _Buffer2.default.load('./audio/perfume_genius/MBIRA-0.[mp3|ogg]', function (buffer) {
            return resolve(buffer.getChannelData(0));
        });
    });
};

var SplashScene = exports.SplashScene = function () {
    function SplashScene(canvas) {
        var _this = this;

        _classCallCheck(this, SplashScene);

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.001, 10000);
        camera.position.set(0, -10, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        var renderer = new THREE.WebGLRenderer({ canvas: canvas });
        renderer.setClearColor(0x00, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);

        ring.geometryPool.clear();

        var rings = (0, _Helpers.take)(96, function (i, len) {
            return new ring.RingPoints({
                radius: i * 0.05 + 0.5,
                resolution: 120,
                color: new THREE.Color(0x00ff00).setHSL(i / len, 1, 0.75),
                opacity: Math.min(1, (0, _Helpers.map)(len - i, len, 1, 4.0, 0.3)),
                //opacity: 1.0,
                size: 38.0,
                transparent: true
                //blending: THREE.AdditiveBlending
            });
        });

        rings.forEach(function (r) {
            return r.rotateX(-Math.PI / 2.5);
        });
        window.rings = rings;

        var waveforms = rings.map(function (r) {
            return new Float32Array(128);
        });

        var copyAndGetAverage = function copyAndGetAverage(source, target, start, length) {
            var avg = 0;
            for (var i = 0; i < length; i++) {
                //target[i] = Math.random();
                target[i] = source[start + i];
                avg += target[i];
            }

            return avg / length;
        };

        var avg = 0;

        this.loop = (0, _animitter2.default)(function (delta, elapsed, frameCount) {
            var wf = waveforms.pop();

            var nextAvg = copyAndGetAverage(channelData, wf, (channelDataOffset += 128) % channelData.length, 128);

            if (!isNaN(nextAvg)) {
                avg = Math.max(avg, avg + (nextAvg - avg) * 0.3);
            }

            //scale the strength based on the num pixels in the window
            var screenSize = (0, _Helpers.clamp)(window.innerWidth * window.innerHeight / 1764000, 0.5, 3);
            bloomPass.strength = (0, _Helpers.map)(avg, -1, 1, 0.5, 1.0) * screenSize;

            waveforms.unshift(wf);

            rings.forEach(function (ring, i) {
                ring.material.uniforms.waveform.value = waveforms[i];
            });
            renderer.render(scene, camera);
            //composer.render();
        });

        this.loop.on('update', function transitionRings(delta, elapsed) {
            var t = (0, _Helpers.clamp)((elapsed - 500) / 8000, 0, 1);

            for (var i = 0; i < rings.length; i++) {
                rings[i].transitionStep((0, _expoInOut2.default)(t));
            }

            if (t >= 1.0) {
                this.removeListener('update', transitionRings);
            }
        });

        this.__removeListeners = function (self) {
            var goal = rings[0].rotation.x;
            var lastY = 0;

            var rotationRange = {
                start: rings[0].rotation.x,
                min: rings[0].rotation.x - Math.PI / 12,
                max: rings[0].rotation.x + Math.PI / 12
            };

            var getY = function getY(e) {
                return e.touches && e.touches.length ? e.touches[0].clientY : e.clientY;
            };

            var onDrag = function onDrag(e) {
                var y = getY(e);
                //const delta = y - (lastY||y);
                //goal = clamp(goal + (delta / window.innerHeight), rotationRange.min, rotationRange.max)
                goal = (0, _Helpers.map)(y, 0, window.innerHeight, rotationRange.min, rotationRange.max);
                lastY = y;
            };

            //make the tilting effect very subtle at the beginning
            var ramp = function ramp(elapsed, duration) {
                var minOut = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
                var maxOut = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.005;
                return (0, _Helpers.clamp)((0, _Helpers.map)(elapsed, 0, duration, minOut, maxOut), minOut, maxOut);
            };

            _this.loop.on('update', function (delta, elapsed) {
                var diff = (goal - rings[0].rotation.x) * ramp(elapsed, 10000);
                rings.forEach(function (r) {
                    return r.rotation.x += diff;
                });
            });

            /*return eventMap({
             'touchstart canvas': (e)=> e.preventDefault(),
             'touchmove': onDrag,
             'mousemove': onDrag
             })*/
        }(this);

        var channelDataOffset = 0;
        var channelData = [];
        getBuffer().then(function (cd) {
            channelData = cd;
            waveforms.forEach(function (wf, i) {
                return copyAndGetAverage(channelData, wf, channelDataOffset = 128 * i, 128);
            });
        });

        var composer = new THREE.EffectComposer(renderer);

        composer.setSize(window.innerWidth, window.innerHeight);

        var renderScene = new THREE.RenderPass(scene, camera);
        composer.addPass(renderScene);
        var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, //strength
        0.8, //radius
        0.4 //threshold
        );

        composer.addPass(bloomPass);
        var copyShader = new THREE.ShaderPass(THREE.CopyShader);
        copyShader.renderToScreen = true;
        composer.addPass(copyShader);
        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        window.bloom = bloomPass;

        window.addEventListener('resize', function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
            bloomPass.resolution.set(window.innerWidth, window.innerHeight);
        });

        //rings.forEach(r=> r.rotateY(Math.PI * 0.5))
        rings.forEach(function (r) {
            return scene.add(r);
        });
        rings.forEach(function (r) {
            return r.material.uniforms.amplitude.value = 1.2;
        });
        rings.forEach(function (r) {
            return r.transitionStep(0);
        });
    }

    _createClass(SplashScene, [{
        key: 'start',
        value: function start() {
            this.loop.start();
            return this;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.loop.stop();
            return this;
        }
    }, {
        key: 'close',
        value: function close() {
            //do teardown stuff in here
            this.stop();
            this.loop.reset();
            //this.__removeListeners();
        }
    }]);

    return SplashScene;
}();

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

var delegate = __webpack_require__(85);
var isDom = __webpack_require__(90);

/**
 * provide a map of listeners to add or remove
 *
 * @example
 * listenerMap(el, {
 *  'click .startBtn': onStartButtonClick,
 *  'click .modal .close': function(event){ el.removeChild(event.target); },
 *  'mouseover .btn1, .btn2': onButtonOver,
 *  'mouseout .btn1, .btn2': onButtonOut
 *  });
 */

module.exports = add;

/**
 * add a map of listeners to a dom element
 * @param {HTMLElement} [dom] optionally provide a dom node for root, defaults to document
 * @param {Object} mappings an object mapping events and selectors to functions
 * @param {Boolean} [useCapture] optionally choose useCapture for all listeners
 * @return {Function} for removing all listeners
 */
function add(dom, mappings, useCapture){
    if( !isDom(dom) ){
        //allow for dom to be optional
        useCapture = mappings;
        mappings = dom;
        dom = document;
    }

    mappings = generateMap(mappings);

    var delegations = mappings.map(function(item){
        return delegate(dom, item.selector, item.eventType, item.listener, useCapture);
    });

    return function removeDelegates(){
        delegations.forEach(function(dele){
            dele.destroy();
        });
    };
}


/**
 * parse the key and values of the event map and separate
 * them between eventType, selector and listener
 * @param {Object}
 * @return Array<{selector, eventType, listener}>
 */
function generateMap(map){

    var eventType,
        spaceIndex,
        selector,
        listener,
        result = [];

    for(var prop in map){

        spaceIndex = prop.indexOf(' ');

        listener = map[prop];
        eventType = (spaceIndex < 0) ? prop : prop.slice(0, spaceIndex);
        selector = (spaceIndex < 0) ? '*' : prop.slice(spaceIndex+1);

        result.push({
                selector: selector,
                eventType: eventType,
                listener: listener
        });
    }

    return result;

}



/***/ }),
/* 36 */,
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	"use strict";

	/**
	 *  AnalyserNode.getFloatTimeDomainData polyfill
	 *  @private
	 */
	if (window.AnalyserNode && !AnalyserNode.prototype.getFloatTimeDomainData){
		//referenced https://github.com/mohayonao/get-float-time-domain-data 
		AnalyserNode.prototype.getFloatTimeDomainData = function(array){
			var uint8 = new Uint8Array(array.length);
			this.getByteTimeDomainData(uint8);
			for (var i = 0; i < uint8.length; i++){
				array[i] = (uint8[i] - 128) / 128;
			}
		};
	}


	/**
	 *  @class  Wrapper around the native Web Audio's 
	 *          [AnalyserNode](http://webaudio.github.io/web-audio-api/#idl-def-AnalyserNode).
	 *          Extracts FFT or Waveform data from the incoming signal.
	 *  @extends {Tone}
	 *  @param {String=} type The return type of the analysis, either "fft", or "waveform". 
	 *  @param {Number=} size The size of the FFT. Value must be a power of 
	 *                       two in the range 32 to 32768.
	 */
	Tone.Analyser = function(){

		var options = Tone.defaults(arguments, ["type", "size"], Tone.Analyser);
		Tone.call(this);

		/**
		 *  The analyser node.
		 *  @private
		 *  @type {AnalyserNode}
		 */
		this._analyser = this.input = this.output = this.context.createAnalyser();

		/**
		 *  The analysis type
		 *  @type {String}
		 *  @private
		 */
		this._type = options.type;

		/**
		 *  The buffer that the FFT data is written to
		 *  @type {TypedArray}
		 *  @private
		 */
		this._buffer = null;

		//set the values initially
		this.size = options.size;
		this.type = options.type;
	};

	Tone.extend(Tone.Analyser);

	/**
	 *  The default values.
	 *  @type {Object}
	 *  @const
	 */
	Tone.Analyser.defaults = {
		"size" : 1024,
		"type" : "fft",
		"smoothing" : 0.8
	};

	/**
	 *  Possible return types of Tone.Analyser.analyse()
	 *  @enum {String}
	 */
	Tone.Analyser.Type = {
		Waveform : "waveform",
		FFT : "fft"
	};

	/**
	 *  Run the analysis given the current settings and return the 
	 *  result as a TypedArray. 
	 *  @returns {TypedArray}
	 */
	Tone.Analyser.prototype.analyse = function(){
		if (this._type === Tone.Analyser.Type.FFT){
			this._analyser.getFloatFrequencyData(this._buffer);
		} else if (this._type === Tone.Analyser.Type.Waveform){
			this._analyser.getFloatTimeDomainData(this._buffer);
		}
		return this._buffer;
	};

	/**
	 *  The size of analysis. This must be a power of two in the range 32 to 32768.
	 *  @memberOf Tone.Analyser#
	 *  @type {Number}
	 *  @name size
	 */
	Object.defineProperty(Tone.Analyser.prototype, "size", {
		get : function(){
			return this._analyser.frequencyBinCount;
		},
		set : function(size){
			this._analyser.fftSize = size * 2;
			this._buffer = new Float32Array(size);
		}
	});

	/**
	 *  The analysis function returned by Tone.Analyser.analyse(), either "fft" or "waveform". 
	 *  @memberOf Tone.Analyser#
	 *  @type {String}
	 *  @name type
	 */
	Object.defineProperty(Tone.Analyser.prototype, "type", {
		get : function(){
			return this._type;
		},
		set : function(type){
			if (type !== Tone.Analyser.Type.Waveform && type !== Tone.Analyser.Type.FFT){
				throw new TypeError("Tone.Analyser: invalid type: "+type);
			}
			this._type = type;
		}
	});

	/**
	 *  0 represents no time averaging with the last analysis frame.
	 *  @memberOf Tone.Analyser#
	 *  @type {NormalRange}
	 *  @name smoothing
	 */
	Object.defineProperty(Tone.Analyser.prototype, "smoothing", {
		get : function(){
			return this._analyser.smoothingTimeConstant;
		},
		set : function(val){
			this._analyser.smoothingTimeConstant = val;
		}
	});

	/**
	 *  Clean up.
	 *  @return  {Tone.Analyser}  this
	 */
	Tone.Analyser.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._analyser.disconnect();
		this._analyser = null;
		this._buffer = null;
	};

	return Tone.Analyser;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(2), __webpack_require__(123), 
	__webpack_require__(122), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 * @class  Tone.Crossfade provides equal power fading between two inputs. 
	 *         More on crossfading technique [here](https://en.wikipedia.org/wiki/Fade_(audio_engineering)#Crossfading).
	 *
	 * @constructor
	 * @extends {Tone}
	 * @param {NormalRange} [initialFade=0.5]
	 * @example
	 * var crossFade = new Tone.CrossFade(0.5);
	 * //connect effect A to crossfade from
	 * //effect output 0 to crossfade input 0
	 * effectA.connect(crossFade, 0, 0);
	 * //connect effect B to crossfade from
	 * //effect output 0 to crossfade input 1
	 * effectB.connect(crossFade, 0, 1);
	 * crossFade.fade.value = 0;
	 * // ^ only effectA is output
	 * crossFade.fade.value = 1;
	 * // ^ only effectB is output
	 * crossFade.fade.value = 0.5;
	 * // ^ the two signals are mixed equally. 
	 */		
	Tone.CrossFade = function(initialFade){

		Tone.call(this);
		this.createInsOuts(2, 1);

		/**
		 *  Alias for <code>input[0]</code>. 
		 *  @type {Tone.Gain}
		 */
		this.a = this.input[0] = new Tone.Gain();

		/**
		 *  Alias for <code>input[1]</code>. 
		 *  @type {Tone.Gain}
		 */
		this.b = this.input[1] = new Tone.Gain();

		/**
		 * 	The mix between the two inputs. A fade value of 0
		 * 	will output 100% <code>input[0]</code> and 
		 * 	a value of 1 will output 100% <code>input[1]</code>. 
		 *  @type {NormalRange}
		 *  @signal
		 */
		this.fade = new Tone.Signal(Tone.defaultArg(initialFade, 0.5), Tone.Type.NormalRange);

		/**
		 *  equal power gain cross fade
		 *  @private
		 *  @type {Tone.EqualPowerGain}
		 */
		this._equalPowerA = new Tone.EqualPowerGain();

		/**
		 *  equal power gain cross fade
		 *  @private
		 *  @type {Tone.EqualPowerGain}
		 */
		this._equalPowerB = new Tone.EqualPowerGain();
		
		/**
		 *  invert the incoming signal
		 *  @private
		 *  @type {Tone}
		 */
		this._invert = new Tone.Expr("1 - $0");

		//connections
		this.a.connect(this.output);
		this.b.connect(this.output);
		this.fade.chain(this._equalPowerB, this.b.gain);
		this.fade.chain(this._invert, this._equalPowerA, this.a.gain);
		this._readOnly("fade");
	};

	Tone.extend(Tone.CrossFade);

	/**
	 *  clean up
	 *  @returns {Tone.CrossFade} this
	 */
	Tone.CrossFade.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._writable("fade");
		this._equalPowerA.dispose();
		this._equalPowerA = null;
		this._equalPowerB.dispose();
		this._equalPowerB = null;
		this.fade.dispose();
		this.fade = null;
		this._invert.dispose();
		this._invert = null;
		this.a.dispose();
		this.a = null;
		this.b.dispose();
		this.b = null;
		return this;
	};

	return Tone.CrossFade;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  Tone.Merge brings two signals into the left and right 
	 *          channels of a single stereo channel.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @example
	 * var merge = new Tone.Merge().toMaster();
	 * //routing a sine tone in the left channel
	 * //and noise in the right channel
	 * var osc = new Tone.Oscillator().connect(merge.left);
	 * var noise = new Tone.Noise().connect(merge.right);
	 * //starting our oscillators
	 * noise.start();
	 * osc.start();
	 */
	Tone.Merge = function(){

		Tone.call(this);
		this.createInsOuts(2, 0);

		/**
		 *  The left input channel.
		 *  Alias for <code>input[0]</code>
		 *  @type {GainNode}
		 */
		this.left = this.input[0] = new Tone.Gain();

		/**
		 *  The right input channel.
		 *  Alias for <code>input[1]</code>.
		 *  @type {GainNode}
		 */
		this.right = this.input[1] = new Tone.Gain();

		/**
		 *  the merger node for the two channels
		 *  @type {ChannelMergerNode}
		 *  @private
		 */
		this._merger = this.output = this.context.createChannelMerger(2);

		//connections
		this.left.connect(this._merger, 0, 0);
		this.right.connect(this._merger, 0, 1);

		this.left.channelCount = 1;
		this.right.channelCount = 1;
		this.left.channelCountMode = "explicit";
		this.right.channelCountMode = "explicit";
	};

	Tone.extend(Tone.Merge);

	/**
	 *  Clean up.
	 *  @returns {Tone.Merge} this
	 */
	Tone.Merge.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this.left.dispose();
		this.left = null;
		this.right.dispose();
		this.right = null;
		this._merger.disconnect();
		this._merger = null;
		return this;
	}; 

	return Tone.Merge;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *	@class  Tone.Split splits an incoming signal into left and right channels.
	 *	
	 *  @constructor
	 *  @extends {Tone}
	 *  @example
	 * var split = new Tone.Split();
	 * stereoSignal.connect(split);
	 */
	Tone.Split = function(){

		Tone.call(this);
		this.createInsOuts(0, 2);

		/** 
		 *  @type {ChannelSplitterNode}
		 *  @private
		 */
		this._splitter = this.input = this.context.createChannelSplitter(2);
		this._splitter.channelCount = 2;
		this._splitter.channelCountMode = "explicit";

		/** 
		 *  Left channel output. 
		 *  Alias for <code>output[0]</code>
		 *  @type {Tone.Gain}
		 */
		this.left = this.output[0] = new Tone.Gain();

		/**
		 *  Right channel output.
		 *  Alias for <code>output[1]</code>
		 *  @type {Tone.Gain}
		 */
		this.right = this.output[1] = new Tone.Gain();
		
		//connections
		this._splitter.connect(this.left, 0, 0);
		this._splitter.connect(this.right, 1, 0);
	};

	Tone.extend(Tone.Split);

	/**
	 *  Clean up. 
	 *  @returns {Tone.Split} this
	 */
	Tone.Split.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._splitter.disconnect();
		this.left.dispose();
		this.left = null;
		this.right.dispose();
		this.right = null;
		this._splitter = null;
		return this;
	}; 

	return Tone.Split;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(8)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Tone.Param wraps the native Web Audio's AudioParam to provide
	 *         additional unit conversion functionality. It also
	 *         serves as a base-class for classes which have a single,
	 *         automatable parameter. 
	 *  @extends {Tone}
	 *  @param  {AudioParam}  param  The parameter to wrap.
	 *  @param  {Tone.Type} units The units of the audio param.
	 *  @param  {Boolean} convert If the param should be converted.
	 */
	Tone.Param = function(){

		var options = Tone.defaults(arguments, ["param", "units", "convert"], Tone.Param);
		Tone.call(this);

		/**
		 *  The native parameter to control
		 *  @type  {AudioParam}
		 *  @private
		 */
		this._param = this.input = options.param;

		/**
		 *  The units of the parameter
		 *  @type {Tone.Type}
		 */
		this.units = options.units;

		/**
		 *  If the value should be converted or not
		 *  @type {Boolean}
		 */
		this.convert = options.convert;

		/**
		 *  True if the signal value is being overridden by 
		 *  a connected signal.
		 *  @readOnly
		 *  @type  {boolean}
		 *  @private
		 */
		this.overridden = false;

		/**
		 *  If there is an LFO, this is where it is held.
		 *  @type  {Tone.LFO}
		 *  @private
		 */
		this._lfo = null;

		if (Tone.isObject(options.lfo)){
			this.value = options.lfo;
		} else if (!Tone.isUndef(options.value)){
			this.value = options.value;
		}
	};

	Tone.extend(Tone.Param);
	
	/**
	 *  Defaults
	 *  @type  {Object}
	 *  @const
	 */
	Tone.Param.defaults = {
		"units" : Tone.Type.Default,
		"convert" : true,
		"param" : undefined
	};

	/**
	 * The current value of the parameter. 
	 * @memberOf Tone.Param#
	 * @type {Number}
	 * @name value
	 */
	Object.defineProperty(Tone.Param.prototype, "value", {
		get : function(){
			return this._toUnits(this._param.value);
		},
		set : function(value){
			if (Tone.isObject(value)){
				//throw an error if the LFO needs to be included
				if (Tone.isUndef(Tone.LFO)){
					throw new Error("Include 'Tone.LFO' to use an LFO as a Param value.");
				}
				//remove the old one
				if (this._lfo){
					this._lfo.dispose();
				}
				this._lfo = new Tone.LFO(value).start();
				this._lfo.connect(this.input);
			} else {
				var convertedVal = this._fromUnits(value);
				this._param.cancelScheduledValues(0);
				this._param.value = convertedVal;
			}
		}
	});

	/**
	 *  Convert the given value from the type specified by Tone.Param.units
	 *  into the destination value (such as Gain or Frequency).
	 *  @private
	 *  @param  {*} val the value to convert
	 *  @return {number}     the number which the value should be set to
	 */
	Tone.Param.prototype._fromUnits = function(val){
		if (this.convert || Tone.isUndef(this.convert)){
			switch(this.units){
				case Tone.Type.Time: 
					return this.toSeconds(val);
				case Tone.Type.Frequency: 
					return this.toFrequency(val);
				case Tone.Type.Decibels: 
					return Tone.dbToGain(val);
				case Tone.Type.NormalRange: 
					return Math.min(Math.max(val, 0), 1);
				case Tone.Type.AudioRange: 
					return Math.min(Math.max(val, -1), 1);
				case Tone.Type.Positive: 
					return Math.max(val, 0);
				default:
					return val;
			}
		} else {
			return val;
		}
	};

	/**
	 * Convert the parameters value into the units specified by Tone.Param.units.
	 * @private
	 * @param  {number} val the value to convert
	 * @return {number}
	 */
	Tone.Param.prototype._toUnits = function(val){
		if (this.convert || Tone.isUndef(this.convert)){
			switch(this.units){
				case Tone.Type.Decibels: 
					return Tone.gainToDb(val);
				default:
					return val;
			}
		} else {
			return val;
		}
	};

	/**
	 *  the minimum output value
	 *  @type {Number}
	 *  @private
	 */
	Tone.Param.prototype._minOutput = 0.00001;

	/**
	 *  Schedules a parameter value change at the given time.
	 *  @param {*}	value The value to set the signal.
	 *  @param {Time}  time The time when the change should occur.
	 *  @returns {Tone.Param} this
	 *  @example
	 * //set the frequency to "G4" in exactly 1 second from now. 
	 * freq.setValueAtTime("G4", "+1");
	 */
	Tone.Param.prototype.setValueAtTime = function(value, time){
		this._param.setValueAtTime(this._fromUnits(value), this.toSeconds(time));
		return this;
	};

	/**
	 *  Creates a schedule point with the current value at the current time.
	 *  This is useful for creating an automation anchor point in order to 
	 *  schedule changes from the current value. 
	 *
	 *  @param {number=} now (Optionally) pass the now value in. 
	 *  @returns {Tone.Param} this
	 */
	Tone.Param.prototype.setRampPoint = function(now){
		now = Tone.defaultArg(now, this.now());
		var currentVal = this._param.value;
		// exponentialRampToValueAt cannot ever ramp from or to 0
		// More info: https://bugzilla.mozilla.org/show_bug.cgi?id=1125600#c2
		if (currentVal === 0){
			currentVal = this._minOutput;
		}
		this._param.setValueAtTime(currentVal, now);
		return this;
	};

	/**
	 *  Schedules a linear continuous change in parameter value from the 
	 *  previous scheduled parameter value to the given value.
	 *  
	 *  @param  {number} value   
	 *  @param  {Time} endTime 
	 *  @returns {Tone.Param} this
	 */
	Tone.Param.prototype.linearRampToValueAtTime = function(value, endTime){
		value = this._fromUnits(value);
		this._param.linearRampToValueAtTime(value, this.toSeconds(endTime));
		return this;
	};

	/**
	 *  Schedules an exponential continuous change in parameter value from 
	 *  the previous scheduled parameter value to the given value.
	 *  
	 *  @param  {number} value   
	 *  @param  {Time} endTime 
	 *  @returns {Tone.Param} this
	 */
	Tone.Param.prototype.exponentialRampToValueAtTime = function(value, endTime){
		value = this._fromUnits(value);
		value = Math.max(this._minOutput, value);
		this._param.exponentialRampToValueAtTime(value, this.toSeconds(endTime));
		return this;
	};

	/**
	 *  Schedules an exponential continuous change in parameter value from 
	 *  the current time and current value to the given value over the 
	 *  duration of the rampTime.
	 *  
	 *  @param  {number} value   The value to ramp to.
	 *  @param  {Time} rampTime the time that it takes the 
	 *                               value to ramp from it's current value
	 *  @param {Time}	[startTime=now] 	When the ramp should start. 
	 *  @returns {Tone.Param} this
	 *  @example
	 * //exponentially ramp to the value 2 over 4 seconds. 
	 * signal.exponentialRampToValue(2, 4);
	 */
	Tone.Param.prototype.exponentialRampToValue = function(value, rampTime, startTime){
		startTime = this.toSeconds(startTime);
		this.setRampPoint(startTime);
		this.exponentialRampToValueAtTime(value, startTime + this.toSeconds(rampTime));
		return this;
	};

	/**
	 *  Schedules an linear continuous change in parameter value from 
	 *  the current time and current value to the given value over the 
	 *  duration of the rampTime.
	 *  
	 *  @param  {number} value   The value to ramp to.
	 *  @param  {Time} rampTime the time that it takes the 
	 *                               value to ramp from it's current value
	 *  @param {Time}	[startTime=now] 	When the ramp should start. 
	 *  @returns {Tone.Param} this
	 *  @example
	 * //linearly ramp to the value 4 over 3 seconds. 
	 * signal.linearRampToValue(4, 3);
	 */
	Tone.Param.prototype.linearRampToValue = function(value, rampTime, startTime){
		startTime = this.toSeconds(startTime);
		this.setRampPoint(startTime);
		this.linearRampToValueAtTime(value, startTime + this.toSeconds(rampTime));
		return this;
	};

	/**
	 *  Start exponentially approaching the target value at the given time with
	 *  a rate having the given time constant.
	 *  @param {number} value        
	 *  @param {Time} startTime    
	 *  @param {number} timeConstant 
	 *  @returns {Tone.Param} this 
	 */
	Tone.Param.prototype.setTargetAtTime = function(value, startTime, timeConstant){
		value = this._fromUnits(value);
		// The value will never be able to approach without timeConstant > 0.
		// http://www.w3.org/TR/webaudio/#dfn-setTargetAtTime, where the equation
		// is described. 0 results in a division by 0.
		value = Math.max(this._minOutput, value);
		timeConstant = Math.max(this._minOutput, timeConstant);
		this._param.setTargetAtTime(value, this.toSeconds(startTime), timeConstant);
		return this;
	};

	/**
	 *  Sets an array of arbitrary parameter values starting at the given time
	 *  for the given duration.
	 *  	
	 *  @param {Array} values    
	 *  @param {Time} startTime 
	 *  @param {Time} duration  
	 *  @returns {Tone.Param} this
	 */
	Tone.Param.prototype.setValueCurveAtTime = function(values, startTime, duration){
		for (var i = 0; i < values.length; i++){
			values[i] = this._fromUnits(values[i]);
		}
		this._param.setValueCurveAtTime(values, this.toSeconds(startTime), this.toSeconds(duration));
		return this;
	};

	/**
	 *  Cancels all scheduled parameter changes with times greater than or 
	 *  equal to startTime.
	 *  
	 *  @param  {Time} startTime
	 *  @returns {Tone.Param} this
	 */
	Tone.Param.prototype.cancelScheduledValues = function(startTime){
		this._param.cancelScheduledValues(this.toSeconds(startTime));
		return this;
	};

	/**
	 *  Ramps to the given value over the duration of the rampTime. 
	 *  Automatically selects the best ramp type (exponential or linear)
	 *  depending on the `units` of the signal
	 *  
	 *  @param  {number} value   
	 *  @param  {Time} rampTime 	The time that it takes the 
	 *                              value to ramp from it's current value
	 *  @param {Time}	[startTime=now] 	When the ramp should start. 
	 *  @returns {Tone.Param} this
	 *  @example
	 * //ramp to the value either linearly or exponentially 
	 * //depending on the "units" value of the signal
	 * signal.rampTo(0, 10);
	 *  @example
	 * //schedule it to ramp starting at a specific time
	 * signal.rampTo(0, 10, 5)
	 */
	Tone.Param.prototype.rampTo = function(value, rampTime, startTime){
		rampTime = Tone.defaultArg(rampTime, 0);
		if (this.units === Tone.Type.Frequency || this.units === Tone.Type.BPM || this.units === Tone.Type.Decibels){
			this.exponentialRampToValue(value, rampTime, startTime);
		} else {
			this.linearRampToValue(value, rampTime, startTime);
		}
		return this;
	};

	/**
	 *  The LFO created by the signal instance. If none
	 *  was created, this is null.
	 *  @type {Tone.LFO}
	 *  @readOnly
	 *  @memberOf Tone.Param#
	 *  @name lfo
	 */
	Object.defineProperty(Tone.Param.prototype, "lfo", {
		get : function(){
			return this._lfo;
		}
	});

	/**
	 *  Clean up
	 *  @returns {Tone.Param} this
	 */
	Tone.Param.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._param = null;
		if (this._lfo){
			this._lfo.dispose();
			this._lfo = null;
		}
		return this;
	};

	return Tone.Param;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(17), __webpack_require__(8)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	"use strict";

	/**
	 *  @class  A Timeline State. Provides the methods: <code>setStateAtTime("state", time)</code>
	 *          and <code>getValueAtTime(time)</code>.
	 *
	 *  @extends {Tone.Timeline}
	 *  @param {String} initial The initial state of the TimelineState. 
	 *                          Defaults to <code>undefined</code>
	 */
	Tone.TimelineState = function(initial){

		Tone.Timeline.call(this);

		/**
		 *  The initial state
		 *  @private
		 *  @type {String}
		 */
		this._initial = initial;
	};

	Tone.extend(Tone.TimelineState, Tone.Timeline);

	/**
	 *  Returns the scheduled state scheduled before or at
	 *  the given time.
	 *  @param  {Number}  time  The time to query.
	 *  @return  {String}  The name of the state input in setStateAtTime.
	 */
	Tone.TimelineState.prototype.getValueAtTime = function(time){
		var event = this.get(time);
		if (event !== null){
			return event.state;
		} else {
			return this._initial;
		}
	};

	/**
	 *  Add a state to the timeline.
	 *  @param  {String}  state The name of the state to set.
	 *  @param  {Number}  time  The time to query.
	 *  @returns {Tone.TimelineState} this
	 */
	Tone.TimelineState.prototype.setStateAtTime = function(state, time){
		this.add({
			"state" : state,
			"time" : time
		});
		return this;
	};

	return Tone.TimelineState;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(2), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Add a signal and a number or two signals. When no value is
	 *         passed into the constructor, Tone.Add will sum <code>input[0]</code>
	 *         and <code>input[1]</code>. If a value is passed into the constructor, 
	 *         the it will be added to the input.
	 *  
	 *  @constructor
	 *  @extends {Tone.Signal}
	 *  @param {number=} value If no value is provided, Tone.Add will sum the first
	 *                         and second inputs. 
	 *  @example
	 * var signal = new Tone.Signal(2);
	 * var add = new Tone.Add(2);
	 * signal.connect(add);
	 * //the output of add equals 4
	 *  @example
	 * //if constructed with no arguments
	 * //it will add the first and second inputs
	 * var add = new Tone.Add();
	 * var sig0 = new Tone.Signal(3).connect(add, 0, 0);
	 * var sig1 = new Tone.Signal(4).connect(add, 0, 1);
	 * //the output of add equals 7. 
	 */
	Tone.Add = function(value){

		Tone.Signal.call(this);
		this.createInsOuts(2, 0);

		/**
		 *  the summing node
		 *  @type {GainNode}
		 *  @private
		 */
		this._sum = this.input[0] = this.input[1] = this.output = new Tone.Gain();

		/**
		 *  @private
		 *  @type {Tone.Signal}
		 */
		this._param = this.input[1] = new Tone.Signal(value);

		this._param.connect(this._sum);
	};

	Tone.extend(Tone.Add, Tone.Signal);
	
	/**
	 *  Clean up.
	 *  @returns {Tone.Add} this
	 */
	Tone.Add.prototype.dispose = function(){
		Tone.Signal.prototype.dispose.call(this);
		this._sum.dispose();
		this._sum = null;
		return this;
	}; 

	return Tone.Add;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(2), __webpack_require__(18), __webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  GreaterThanZero outputs 1 when the input is strictly greater than zero
	 *  
	 *  @constructor
	 *  @extends {Tone.SignalBase}
	 *  @example
	 * var gt0 = new Tone.GreaterThanZero();
	 * var sig = new Tone.Signal(0.01).connect(gt0);
	 * //the output of gt0 is 1. 
	 * sig.value = 0;
	 * //the output of gt0 is 0. 
	 */
	Tone.GreaterThanZero = function(){
		
		Tone.SignalBase.call(this);
		
		/**
		 *  @type {Tone.WaveShaper}
		 *  @private
		 */
		this._thresh = this.output = new Tone.WaveShaper(function(val){
			if (val <= 0){
				return 0;
			} else {
				return 1;
			}
		}, 127);

		/**
		 *  scale the first thresholded signal by a large value.
		 *  this will help with values which are very close to 0
		 *  @type {Tone.Multiply}
		 *  @private
		 */
		this._scale = this.input = new Tone.Multiply(10000);

		//connections
		this._scale.connect(this._thresh);
	};

	Tone.extend(Tone.GreaterThanZero, Tone.SignalBase);

	/**
	 *  dispose method
	 *  @returns {Tone.GreaterThanZero} this
	 */
	Tone.GreaterThanZero.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._scale.dispose();
		this._scale = null;
		this._thresh.dispose();
		this._thresh = null;
		return this;
	};

	return Tone.GreaterThanZero;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(18), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Negate the incoming signal. i.e. an input signal of 10 will output -10
	 *
	 *  @constructor
	 *  @extends {Tone.SignalBase}
	 *  @example
	 * var neg = new Tone.Negate();
	 * var sig = new Tone.Signal(-2).connect(neg);
	 * //output of neg is positive 2. 
	 */
	Tone.Negate = function(){

		Tone.SignalBase.call(this);
		/**
		 *  negation is done by multiplying by -1
		 *  @type {Tone.Multiply}
		 *  @private
		 */
		this._multiply = this.input = this.output = new Tone.Multiply(-1);
	};

	Tone.extend(Tone.Negate, Tone.SignalBase);

	/**
	 *  clean up
	 *  @returns {Tone.Negate} this
	 */
	Tone.Negate.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._multiply.dispose();
		this._multiply = null;
		return this;
	}; 

	return Tone.Negate;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  Base class for all Signals. Used Internally. 
	 *
	 *  @constructor
	 *  @extends {Tone}
	 */
	Tone.SignalBase = function(){
		Tone.call(this);
	};

	Tone.extend(Tone.SignalBase);

	/**
	 *  When signals connect to other signals or AudioParams, 
	 *  they take over the output value of that signal or AudioParam. 
	 *  For all other nodes, the behavior is the same as a default <code>connect</code>. 
	 *
	 *  @override
	 *  @param {AudioParam|AudioNode|Tone.Signal|Tone} node 
	 *  @param {number} [outputNumber=0] The output number to connect from.
	 *  @param {number} [inputNumber=0] The input number to connect to.
	 *  @returns {Tone.SignalBase} this
	 */
	Tone.SignalBase.prototype.connect = function(node, outputNumber, inputNumber){
		//zero it out so that the signal can have full control
		if ((Tone.Signal && Tone.Signal === node.constructor) || 
				(Tone.Param && Tone.Param === node.constructor) || 
				(Tone.TimelineSignal && Tone.TimelineSignal === node.constructor)){
			//cancel changes
			node._param.cancelScheduledValues(0);
			//reset the value
			node._param.value = 0;
			//mark the value as overridden
			node.overridden = true;
		} else if (node instanceof AudioParam){
			node.cancelScheduledValues(0);
			node.value = 0;
		} 
		Tone.prototype.connect.call(this, node, outputNumber, inputNumber);
		return this;
	};

	return Tone.SignalBase;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	/**
	 *  @class Tone.Zero outputs 0's at audio-rate. The reason this has to be
	 *         it's own class is that many browsers optimize out Tone.Signal
	 *         with a value of 0 and will not process nodes further down the graph. 
	 *  @extends {Tone.SignalBase}
	 */
	Tone.Zero = function(){

		Tone.SignalBase.call(this);

		/**
		 *  The gain node
		 *  @type  {Tone.Gain}
		 *  @private
		 */
		this._gain = this.input = this.output = new Tone.Gain();

		this.context.getConstant(0).connect(this._gain);
	};

	Tone.extend(Tone.Zero, Tone.SignalBase);

	/**
	 *  clean up
	 *  @return  {Tone.Zero}  this
	 */
	Tone.Zero.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._gain.dispose();
		this._gain = null;
		return this;
	};

	return Tone.Zero;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(6), __webpack_require__(22), __webpack_require__(16),
	__webpack_require__(8), __webpack_require__(42), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";
	
	/**
	 *  @class  Base class for sources. Sources have start/stop methods
	 *          and the ability to be synced to the 
	 *          start/stop of Tone.Transport. 
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @example
	 * //Multiple state change events can be chained together,
	 * //but must be set in the correct order and with ascending times
	 * 
	 * // OK
	 * state.start().stop("+0.2");
	 * // AND
	 * state.start().stop("+0.2").start("+0.4").stop("+0.7")
	 *
	 * // BAD
	 * state.stop("+0.2").start();
	 * // OR
	 * state.start("+0.3").stop("+0.2");
	 * 
	 */	
	Tone.Source = function(options){

		Tone.call(this);
		options = Tone.defaultArg(options, Tone.Source.defaults);

		/**
		 *  The output volume node
		 *  @type  {Tone.Volume}
		 *  @private
		 */
		this._volume = this.output = new Tone.Volume(options.volume);

		/**
		 * The volume of the output in decibels.
		 * @type {Decibels}
		 * @signal
		 * @example
		 * source.volume.value = -6;
		 */
		this.volume = this._volume.volume;
		this._readOnly("volume");

		/**
		 * 	Keep track of the scheduled state.
		 *  @type {Tone.TimelineState}
		 *  @private
		 */
		this._state = new Tone.TimelineState(Tone.State.Stopped);
		this._state.memory = 10;

		/**
		 *  The synced `start` callback function from the transport
		 *  @type {Function}
		 *  @private
		 */
		this._synced = false;

		/**
		 *  Keep track of all of the scheduled event ids
		 *  @type  {Array}
		 *  @private
		 */
		this._scheduled = [];

		//make the output explicitly stereo
		this._volume.output.output.channelCount = 2;
		this._volume.output.output.channelCountMode = "explicit";
		//mute initially
		this.mute = options.mute;
	};

	Tone.extend(Tone.Source);

	/**
	 *  The default parameters
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Tone.Source.defaults = {
		"volume" : 0,
		"mute" : false
	};

	/**
	 *  Returns the playback state of the source, either "started" or "stopped".
	 *  @type {Tone.State}
	 *  @readOnly
	 *  @memberOf Tone.Source#
	 *  @name state
	 */
	Object.defineProperty(Tone.Source.prototype, "state", {
		get : function(){
			if (this._synced){
				if (Tone.Transport.state === Tone.State.Started){
					return this._state.getValueAtTime(Tone.Transport.seconds);
				} else {
					return Tone.State.Stopped;
				}
			} else {
				return this._state.getValueAtTime(this.now());
			}
		}
	});

	/**
	 * Mute the output. 
	 * @memberOf Tone.Source#
	 * @type {boolean}
	 * @name mute
	 * @example
	 * //mute the output
	 * source.mute = true;
	 */
	Object.defineProperty(Tone.Source.prototype, "mute", {
		get : function(){
			return this._volume.mute;
		}, 
		set : function(mute){
			this._volume.mute = mute;
		}
	});

	//overwrite these functions
	Tone.Source.prototype._start = Tone.noOp;
	Tone.Source.prototype._stop = Tone.noOp;

	/**
	 *  Start the source at the specified time. If no time is given, 
	 *  start the source now.
	 *  @param  {Time} [time=now] When the source should be started.
	 *  @returns {Tone.Source} this
	 *  @example
	 * source.start("+0.5"); //starts the source 0.5 seconds from now
	 */
	Tone.Source.prototype.start = function(time, offset, duration){
		if (Tone.isUndef(time) && this._synced){
			time = Tone.Transport.seconds;
		} else {
			time = this.toSeconds(time);
		}	
		//if it's started, stop it and restart it
		if (!this.retrigger && this._state.getValueAtTime(time) === Tone.State.Started){
			this.stop(time);
		}
		this._state.setStateAtTime(Tone.State.Started, time);
		if (this._synced){
			// add the offset time to the event
			var event = this._state.get(time);
			event.offset = Tone.defaultArg(offset, 0);
			event.duration = duration;
			var sched = Tone.Transport.schedule(function(t){
				this._start(t, offset, duration);
			}.bind(this), time);
			this._scheduled.push(sched);
		} else {
			this._start.apply(this, arguments);
		}
		return this;
	};

	/**
	 *  Stop the source at the specified time. If no time is given, 
	 *  stop the source now.
	 *  @param  {Time} [time=now] When the source should be stopped. 
	 *  @returns {Tone.Source} this
	 *  @example
	 * source.stop(); // stops the source immediately
	 */
	Tone.Source.prototype.stop = function(time){
		if (Tone.isUndef(time) && this._synced){
			time = Tone.Transport.seconds;
		} else {
			time = this.toSeconds(time);
		}
		this._state.cancel(time);
		this._state.setStateAtTime(Tone.State.Stopped, time);
		if (!this._synced){
			this._stop.apply(this, arguments);
		} else {
			var sched = Tone.Transport.schedule(this._stop.bind(this), time);
			this._scheduled.push(sched);
		}	
		return this;
	};
	
	/**
	 *  Sync the source to the Transport so that all subsequent
	 *  calls to `start` and `stop` are synced to the TransportTime
	 *  instead of the AudioContext time. 
	 *
	 *  @returns {Tone.Source} this
	 *  @example
	 * //sync the source so that it plays between 0 and 0.3 on the Transport's timeline
	 * source.sync().start(0).stop(0.3);
	 * //start the transport.
	 * Tone.Transport.start();
	 *
	 *  @example
	 * //start the transport with an offset and the sync'ed sources
	 * //will start in the correct position
	 * source.sync().start(0.1);
	 * //the source will be invoked with an offset of 0.4
	 * Tone.Transport.start("+0.5", 0.5);
	 */
	Tone.Source.prototype.sync = function(){
		this._synced = true;
		this._syncedStart = function(time, offset){
			if (offset > 0){
				// get the playback state at that time
				var stateEvent = this._state.get(offset);
				// listen for start events which may occur in the middle of the sync'ed time
				if (stateEvent && stateEvent.state === Tone.State.Started && stateEvent.time !== offset){
					// get the offset
					var startOffset = offset - this.toSeconds(stateEvent.time);
					var duration;
					if (stateEvent.duration){
						duration = this.toSeconds(stateEvent.duration) - startOffset;	
					}
					this._start(time, this.toSeconds(stateEvent.offset) + startOffset, duration);
				}
			}
		}.bind(this);
		this._syncedStop = function(time){
			if (this._state.getValueAtTime(Tone.Transport.seconds) === Tone.State.Started){
				this._stop(time);
			}
		}.bind(this);
		Tone.Transport.on("start loopStart", this._syncedStart);
		Tone.Transport.on("stop pause loopEnd", this._syncedStop);
		return this;
	};

	/**
	 *  Unsync the source to the Transport. See Tone.Source.sync
	 *  @returns {Tone.Source} this
	 */
	Tone.Source.prototype.unsync = function(){
		if (this._synced){
			Tone.Transport.off("stop pause loopEnd", this._syncedStop);
			Tone.Transport.off("start loopStart", this._syncedStart);
		}
		this._synced = false;
		// clear all of the scheduled ids
		for (var i = 0; i < this._scheduled.length; i++){
			var id = this._scheduled[i];
			Tone.Transport.clear(id);
		}
		this._scheduled = [];
		this._state.cancel(0);
		return this;
	};

	/**
	 *	Clean up.
	 *  @return {Tone.Source} this
	 */
	Tone.Source.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this.unsync();
		this._scheduled = null;
		this._writable("volume");
		this._volume.dispose();
		this._volume = null;
		this.volume = null;
		this._state.dispose();
		this._state = null;
	};

	return Tone.Source;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(50)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	/**
	 *  @class Tone.Time is a primitive type for encoding Time values. 
	 *         Eventually all time values are evaluated to seconds
	 *         using the `eval` method. Tone.Time can be constructed
	 *         with or without the `new` keyword. Tone.Time can be passed
	 *         into the parameter of any method which takes time as an argument. 
	 *  @constructor
	 *  @extends {Tone.TimeBase}
	 *  @param  {String|Number}  val    The time value.
	 *  @param  {String=}  units  The units of the value.
	 *  @example
	 * var t = Tone.Time("4n");//encodes a quarter note
	 * t.mult(4); // multiply that value by 4
	 * t.toNotation(); //returns "1m"
	 */
	Tone.Time = function(val, units){
		if (this instanceof Tone.Time){

			/**
			 *  If the current clock time should
			 *  be added to the output
			 *  @type  {Boolean}
			 *  @private
			 */
			this._plusNow = false;
			
			Tone.TimeBase.call(this, val, units);

		} else {
			return new Tone.Time(val, units);
		}
	};

	Tone.extend(Tone.Time, Tone.TimeBase);

	//clone the expressions so that 
	//we can add more without modifying the original
	Tone.Time.prototype._unaryExpressions = Object.create(Tone.TimeBase.prototype._unaryExpressions);

	/*
	 *  Adds an additional unary expression
	 *  which quantizes values to the next subdivision
	 *  @type {Object}
	 *  @private
	 */
	Tone.Time.prototype._unaryExpressions.quantize = {
		regexp : /^@/,
		method : function(rh){
			return Tone.Transport.nextSubdivision(rh());
		}
	};

	/*
	 *  Adds an additional unary expression
	 *  which adds the current clock time.
	 *  @type {Object}
	 *  @private
	 */
	Tone.Time.prototype._unaryExpressions.now = {
		regexp : /^\+/,
		method : function(lh){
			this._plusNow = true;
			return lh();
		}
	};

	/**
	 *  Quantize the time by the given subdivision. Optionally add a
	 *  percentage which will move the time value towards the ideal
	 *  quantized value by that percentage. 
	 *  @param  {Number|Time}  val    The subdivision to quantize to
	 *  @param  {NormalRange}  [percent=1]  Move the time value
	 *                                   towards the quantized value by
	 *                                   a percentage.
	 *  @return  {Tone.Time}  this
	 *  @example
	 * Tone.Time(21).quantize(2) //returns 22
	 * Tone.Time(0.6).quantize("4n", 0.5) //returns 0.55
	 */
	Tone.Time.prototype.quantize = function(subdiv, percent){
		percent = Tone.defaultArg(percent, 1);
		this._expr = function(expr, subdivision, percent){
			expr = expr();
			subdivision = subdivision.toSeconds();
			var multiple = Math.round(expr / subdivision);
			var ideal = multiple * subdivision;
			var diff = ideal - expr;
			return expr + diff * percent;
		}.bind(this, this._expr, new this.constructor(subdiv), percent);
		return this;
	};

	/**
	 *  Adds the clock time to the time expression at the 
	 *  moment of evaluation. 
	 *  @return  {Tone.Time}  this
	 */
	Tone.Time.prototype.addNow = function(){
		this._plusNow = true;
		return this;
	};

	/**
	 *  Override the default value return when no arguments are passed in.
	 *  The default value is 'now'
	 *  @override
	 *  @private
	 */
	Tone.Time.prototype._defaultExpr = function(){
		this._plusNow = true;
		return this._noOp;
	};

	/**
	 *  Copies the value of time to this Time
	 *  @param {Tone.Time} time
	 *  @return  {Time}
	 */
	Tone.Time.prototype.copy = function(time){
		Tone.TimeBase.prototype.copy.call(this, time);
		this._plusNow = time._plusNow;
		return this;
	};

	//CONVERSIONS//////////////////////////////////////////////////////////////

	/**
	 *  Convert a Time to Notation. Values will be thresholded to the nearest 128th note. 
	 *  @return {Notation} 
	 *  @example
	 * //if the Transport is at 120bpm:
	 * Tone.Time(2).toNotation();//returns "1m"
	 */
	Tone.Time.prototype.toNotation = function(){
		var time = this.toSeconds();
		var testNotations = ["1m", "2n", "4n", "8n", "16n", "32n", "64n", "128n"];
		var retNotation = this._toNotationHelper(time, testNotations);
		//try the same thing but with tripelets
		var testTripletNotations = ["1m", "2n", "2t", "4n", "4t", "8n", "8t", "16n", "16t", "32n", "32t", "64n", "64t", "128n"];
		var retTripletNotation = this._toNotationHelper(time, testTripletNotations);
		//choose the simpler expression of the two
		if (retTripletNotation.split("+").length < retNotation.split("+").length){
			return retTripletNotation;
		} else {
			return retNotation;
		}
	};

	/**
	 *  Helper method for Tone.toNotation
	 *  @param {Number} units 
	 *  @param {Array} testNotations
	 *  @return {String}
	 *  @private
	 */
	Tone.Time.prototype._toNotationHelper = function(units, testNotations){
		//the threshold is the last value in the array
		var threshold = this._notationToUnits(testNotations[testNotations.length - 1]);
		var retNotation = "";
		for (var i = 0; i < testNotations.length; i++){
			var notationTime = this._notationToUnits(testNotations[i]);
			//account for floating point errors (i.e. round up if the value is 0.999999)
			var multiple = units / notationTime;
			var floatingPointError = 0.000001;
			if (1 - multiple % 1 < floatingPointError){
				multiple += floatingPointError;
			}
			multiple = Math.floor(multiple);
			if (multiple > 0){
				if (multiple === 1){
					retNotation += testNotations[i];
				} else {
					retNotation += multiple.toString() + "*" + testNotations[i];
				}
				units -= multiple * notationTime;
				if (units < threshold){
					break;
				} else {
					retNotation += " + ";
				}
			}
		}
		if (retNotation === ""){
			retNotation = "0";
		}
		return retNotation;
	};

	/**
	 *  Convert a notation value to the current units
	 *  @param  {Notation}  notation 
	 *  @return  {Number} 
	 *  @private
	 */
	Tone.Time.prototype._notationToUnits = function(notation){
		var primaryExprs = this._primaryExpressions;
		var notationExprs = [primaryExprs.n, primaryExprs.t, primaryExprs.m];
		for (var i = 0; i < notationExprs.length; i++){
			var expr = notationExprs[i];
			var match = notation.match(expr.regexp);
			if (match){
				return expr.method.call(this, match[1]);
			}
		}
	};

	/**
	 *  Return the time encoded as Bars:Beats:Sixteenths.
	 *  @return  {BarsBeatsSixteenths}
	 */
	Tone.Time.prototype.toBarsBeatsSixteenths = function(){
		var quarterTime = this._beatsToUnits(1);
		var quarters = this.toSeconds() / quarterTime;
		var measures = Math.floor(quarters / this._timeSignature());
		var sixteenths = (quarters % 1) * 4;
		quarters = Math.floor(quarters) % this._timeSignature();
		sixteenths = sixteenths.toString();
		if (sixteenths.length > 3){
			sixteenths = parseFloat(sixteenths).toFixed(3);
		}
		var progress = [measures, quarters, sixteenths];
		return progress.join(":");
	};

	/**
	 *  Return the time in ticks.
	 *  @return  {Ticks}
	 */
	Tone.Time.prototype.toTicks = function(){
		var quarterTime = this._beatsToUnits(1);
		var quarters = this.valueOf() / quarterTime;
		return Math.floor(quarters * Tone.Transport.PPQ);
	};

	/**
	 *  Return the time in samples
	 *  @return  {Samples}  
	 */
	Tone.Time.prototype.toSamples = function(){
		return this.toSeconds() * this.context.sampleRate;
	};

	/**
	 *  Return the time as a frequency value
	 *  @return  {Frequency} 
	 *  @example
	 * Tone.Time(2).toFrequency(); //0.5
	 */
	Tone.Time.prototype.toFrequency = function(){
		return 1/this.toSeconds();
	};

	/**
	 *  Return the time in seconds.
	 *  @return  {Seconds} 
	 */
	Tone.Time.prototype.toSeconds = function(){
		return this.valueOf();
	};

	/**
	 *  Return the time in milliseconds.
	 *  @return  {Milliseconds} 
	 */
	Tone.Time.prototype.toMilliseconds = function(){
		return this.toSeconds() * 1000;
	};

	/**
	 *  Return the time in seconds.
	 *  @return  {Seconds} 
	 */
	Tone.Time.prototype.valueOf = function(){
		var val = this._expr();
		return val + (this._plusNow?this.now():0);
	};

	return Tone.Time;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	/**
	 *  @class Tone.TimeBase is a flexible encoding of time
	 *         which can be evaluated to and from a string.
	 *         Parsing code modified from https://code.google.com/p/tapdigit/
	 *         Copyright 2011 2012 Ariya Hidayat, New BSD License
	 *  @extends {Tone}
	 *  @param  {Time}  val    The time value as a number or string
	 *  @param  {String=}  units  Unit values
	 *  @example
	 * Tone.TimeBase(4, "n")
	 * Tone.TimeBase(2, "t")
	 * Tone.TimeBase("2t").add("1m")
	 * Tone.TimeBase("2t + 1m");
	 */
	Tone.TimeBase = function(val, units){

		//allows it to be constructed with or without 'new'
		if (this instanceof Tone.TimeBase) {

			/**
			 *  Any expressions parsed from the Time
			 *  @type  {Array}
			 *  @private
			 */
			this._expr = this._noOp;

			if (val instanceof Tone.TimeBase){
				this.copy(val);
			} else if (!Tone.isUndef(units) || Tone.isNumber(val)){
				//default units
				units = Tone.defaultArg(units, this._defaultUnits);
				var method = this._primaryExpressions[units].method;
				this._expr = method.bind(this, val);
			} else if (Tone.isString(val)){
				this.set(val);
			} else if (Tone.isUndef(val)){
				//default expression
				this._expr = this._defaultExpr();
			}
		} else {

			return new Tone.TimeBase(val, units);
		}
	};

	Tone.extend(Tone.TimeBase);

	/**
	 *  Repalce the current time value with the value
	 *  given by the expression string.
	 *  @param  {String}  exprString
	 *  @return {Tone.TimeBase} this
	 */
	Tone.TimeBase.prototype.set = function(exprString){
		this._expr = this._parseExprString(exprString);
		return this;
	};

	/**
	 *  Return a clone of the TimeBase object.
	 *  @return  {Tone.TimeBase} The new cloned Tone.TimeBase
	 */
	Tone.TimeBase.prototype.clone = function(){
		var instance = new this.constructor();
		instance.copy(this);
		return instance;
	};

	/**
	 *  Copies the value of time to this Time
	 *  @param {Tone.TimeBase} time
	 *  @return  {TimeBase}
	 */
	Tone.TimeBase.prototype.copy = function(time){
		var val = time._expr();
		return this.set(val);
	};

	///////////////////////////////////////////////////////////////////////////
	//	ABSTRACT SYNTAX TREE PARSER
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  All the primary expressions.
	 *  @private
	 *  @type  {Object}
	 */
	Tone.TimeBase.prototype._primaryExpressions = {
		"n" : {
			regexp : /^(\d+)n/i,
			method : function(value){
				value = parseInt(value);
				if (value === 1){
					return this._beatsToUnits(this._timeSignature());
				} else {
					return this._beatsToUnits(4 / value);
				}
			}
		},
		"t" : {
			regexp : /^(\d+)t/i,
			method : function(value){
				value = parseInt(value);
				return this._beatsToUnits(8 / (parseInt(value) * 3));
			}
		},
		"m" : {
			regexp : /^(\d+)m/i,
			method : function(value){
				return this._beatsToUnits(parseInt(value) * this._timeSignature());
			}
		},
		"i" : {
			regexp : /^(\d+)i/i,
			method : function(value){
				return this._ticksToUnits(parseInt(value));
			}
		},
		"hz" : {
			regexp : /^(\d+(?:\.\d+)?)hz/i,
			method : function(value){
				return this._frequencyToUnits(parseFloat(value));
			}
		},
		"tr" : {
			regexp : /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?/,
			method : function(m, q, s){
				var total = 0;
				if (m && m !== "0"){
					total += this._beatsToUnits(this._timeSignature() * parseFloat(m));
				}
				if (q && q !== "0"){
					total += this._beatsToUnits(parseFloat(q));
				}
				if (s && s !== "0"){
					total += this._beatsToUnits(parseFloat(s) / 4);
				}
				return total;
			}
		},
		"s" : {
			regexp : /^(\d+(?:\.\d+)?s)/,
			method : function(value){
				return this._secondsToUnits(parseFloat(value));
			}
		},
		"samples" : {
			regexp : /^(\d+)samples/,
			method : function(value){
				return parseInt(value) / this.context.sampleRate;
			}
		},
		"default" : {
			regexp : /^(\d+(?:\.\d+)?)/,
			method : function(value){
				return this._primaryExpressions[this._defaultUnits].method.call(this, value);
			}
		}
	};

	/**
	 *  All the binary expressions that TimeBase can accept.
	 *  @private
	 *  @type  {Object}
	 */
	Tone.TimeBase.prototype._binaryExpressions = {
		"+" : {
			regexp : /^\+/,
			precedence : 2,
			method : function(lh, rh){
				return lh() + rh();
			}
		},
		"-" : {
			regexp : /^\-/,
			precedence : 2,
			method : function(lh, rh){
				return lh() - rh();
			}
		},
		"*" : {
			regexp : /^\*/,
			precedence : 1,
			method : function(lh, rh){
				return lh() * rh();
			}
		},
		"/" : {
			regexp : /^\//,
			precedence : 1,
			method : function(lh, rh){
				return lh() / rh();
			}
		}
	};

	/**
	 *  All the unary expressions.
	 *  @private
	 *  @type  {Object}
	 */
	Tone.TimeBase.prototype._unaryExpressions = {
		"neg" : {
			regexp : /^\-/,
			method : function(lh){
				return -lh();
			}
		}
	};

	/**
	 *  Syntactic glue which holds expressions together
	 *  @private
	 *  @type  {Object}
	 */
	Tone.TimeBase.prototype._syntaxGlue = {
		"(" : {
			regexp : /^\(/
		},
		")" : {
			regexp : /^\)/
		}
	};

	/**
	 *  tokenize the expression based on the Expressions object
	 *  @param   {string} expr 
	 *  @return  {Object}      returns two methods on the tokenized list, next and peek
	 *  @private
	 */
	Tone.TimeBase.prototype._tokenize = function(expr){
		var position = -1;
		var tokens = [];

		while(expr.length > 0){
			expr = expr.trim();
			var token = getNextToken(expr, this);
			tokens.push(token);
			expr = expr.substr(token.value.length);
		}

		function getNextToken(expr, context){
			var expressions = ["_binaryExpressions", "_unaryExpressions", "_primaryExpressions", "_syntaxGlue"];
			for (var i = 0; i < expressions.length; i++){
				var group = context[expressions[i]];
				for (var opName in group){
					var op = group[opName];
					var reg = op.regexp;
					var match = expr.match(reg);
					if (match !== null){
						return {
							method : op.method,
							precedence : op.precedence,
							regexp : op.regexp,
							value : match[0],
						};
					}
				}
			}
			throw new SyntaxError("Tone.TimeBase: Unexpected token "+expr);
		}

		return {
			next : function(){
				return tokens[++position];
			},
			peek : function(){
				return tokens[position + 1];
			}
		};
	};

	/**
	 *  Given a token, find the value within the groupName
	 *  @param {Object} token
	 *  @param {String} groupName
	 *  @param {Number} precedence
	 *  @private
	 */
	Tone.TimeBase.prototype._matchGroup = function(token, group, prec) {
		var ret = false;
		if (!Tone.isUndef(token)){
			for (var opName in group){
				var op = group[opName];
				if (op.regexp.test(token.value)){
					if (!Tone.isUndef(prec)){
						if(op.precedence === prec){	
							return op;
						}
					} else {
						return op;
					}
				}
			}
		}
		return ret;
	};

	/**
	 *  Match a binary expression given the token and the precedence
	 *  @param {Lexer} lexer
	 *  @param {Number} precedence
	 *  @private
	 */
	Tone.TimeBase.prototype._parseBinary = function(lexer, precedence){
		if (Tone.isUndef(precedence)){
			precedence = 2;
		}
		var expr;
		if (precedence < 0){
			expr = this._parseUnary(lexer);
		} else {
			expr = this._parseBinary(lexer, precedence - 1);
		}
		var token = lexer.peek();
		while (token && this._matchGroup(token, this._binaryExpressions, precedence)){
			token = lexer.next();
			expr = token.method.bind(this, expr, this._parseBinary(lexer, precedence - 1));
			token = lexer.peek();
		}
		return expr;
	};

	/**
	 *  Match a unary expression.
	 *  @param {Lexer} lexer
	 *  @private
	 */
	Tone.TimeBase.prototype._parseUnary = function(lexer){
		var token, expr;
		token = lexer.peek();
		var op = this._matchGroup(token, this._unaryExpressions);
		if (op) {
			token = lexer.next();
			expr = this._parseUnary(lexer);
			return op.method.bind(this, expr);
		}
		return this._parsePrimary(lexer);
	};

	/**
	 *  Match a primary expression (a value).
	 *  @param {Lexer} lexer
	 *  @private
	 */
	Tone.TimeBase.prototype._parsePrimary = function(lexer){
		var token, expr;
		token = lexer.peek();
		if (Tone.isUndef(token)) {
			throw new SyntaxError("Tone.TimeBase: Unexpected end of expression");
		}
		if (this._matchGroup(token, this._primaryExpressions)) {
			token = lexer.next();
			var matching = token.value.match(token.regexp);
			return token.method.bind(this, matching[1], matching[2], matching[3]);
		}
		if (token && token.value === "("){
			lexer.next();
			expr = this._parseBinary(lexer);
			token = lexer.next();
			if (!(token && token.value === ")")) {
				throw new SyntaxError("Expected )");
			}
			return expr;
		}
		throw new SyntaxError("Tone.TimeBase: Cannot process token " + token.value);
	};

	/**
	 *  Recursively parse the string expression into a syntax tree.
	 *  @param   {string} expr 
	 *  @return  {Function} the bound method to be evaluated later
	 *  @private
	 */
	Tone.TimeBase.prototype._parseExprString = function(exprString){
		if (!Tone.isString(exprString)){
			exprString = exprString.toString();
		}
		var lexer = this._tokenize(exprString);
		var tree = this._parseBinary(lexer);
		return tree;
	};

	///////////////////////////////////////////////////////////////////////////
	//	DEFAULTS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  The initial expression value
	 *  @return  {Number}  The initial value 0
	 *  @private
	 */
	Tone.TimeBase.prototype._noOp = function(){
		return 0;
	};

	/**
	 *  The default expression value if no arguments are given
	 *  @private
	 */
	Tone.TimeBase.prototype._defaultExpr = function(){
		return this._noOp;
	};

	/**
	 *  The default units if none are given.
	 *  @private
	 */
	Tone.TimeBase.prototype._defaultUnits = "s";

	///////////////////////////////////////////////////////////////////////////
	//	UNIT CONVERSIONS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Returns the value of a frequency in the current units
	 *  @param {Frequency} freq
	 *  @return  {Number}
	 *  @private
	 */
	Tone.TimeBase.prototype._frequencyToUnits = function(freq){
		return 1/freq;
	};

	/**
	 *  Return the value of the beats in the current units
	 *  @param {Number} beats
	 *  @return  {Number}
	 *  @private
	 */
	Tone.TimeBase.prototype._beatsToUnits = function(beats){
		return (60 / Tone.Transport.bpm.value) * beats;
	};

	/**
	 *  Returns the value of a second in the current units
	 *  @param {Seconds} seconds
	 *  @return  {Number}
	 *  @private
	 */
	Tone.TimeBase.prototype._secondsToUnits = function(seconds){
		return seconds;
	};

	/**
	 *  Returns the value of a tick in the current time units
	 *  @param {Ticks} ticks
	 *  @return  {Number}
	 *  @private
	 */
	Tone.TimeBase.prototype._ticksToUnits = function(ticks){
		return ticks * (this._beatsToUnits(1) / Tone.Transport.PPQ);
	};

	/**
	 *  Return the time signature.
	 *  @return  {Number}
	 *  @private
	 */
	Tone.TimeBase.prototype._timeSignature = function(){
		return Tone.Transport.timeSignature;
	};

	///////////////////////////////////////////////////////////////////////////
	//	EXPRESSIONS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Push an expression onto the expression list
	 *  @param  {Time}  val
	 *  @param  {String}  type
	 *  @param  {String}  units
	 *  @return  {Tone.TimeBase} 
	 *  @private
	 */
	Tone.TimeBase.prototype._pushExpr = function(val, name, units){
		//create the expression
		if (!(val instanceof Tone.TimeBase)){
			val = new this.constructor(val, units);
		}
		this._expr = this._binaryExpressions[name].method.bind(this, this._expr, val._expr);
		return this;
	};

	/**
	 *  Add to the current value.
	 *  @param  {Time}  val    The value to add
	 *  @param  {String=}  units  Optional units to use with the value.
	 *  @return  {Tone.TimeBase}  this
	 *  @example
	 * Tone.TimeBase("2m").add("1m"); //"3m"
	 */
	Tone.TimeBase.prototype.add = function(val, units){
		return this._pushExpr(val, "+", units);
	};

	/**
	 *  Subtract the value from the current time.
	 *  @param  {Time}  val    The value to subtract
	 *  @param  {String=}  units  Optional units to use with the value.
	 *  @return  {Tone.TimeBase}  this
	 *  @example
	 * Tone.TimeBase("2m").sub("1m"); //"1m"
	 */
	Tone.TimeBase.prototype.sub = function(val, units){
		return this._pushExpr(val, "-", units);
	};

	/**
	 *  Multiply the current value by the given time.
	 *  @param  {Time}  val    The value to multiply
	 *  @param  {String=}  units  Optional units to use with the value.
	 *  @return  {Tone.TimeBase}  this
	 *  @example
	 * Tone.TimeBase("2m").mult("2"); //"4m"
	 */
	Tone.TimeBase.prototype.mult = function(val, units){
		return this._pushExpr(val, "*", units);
	};

	/**
	 *  Divide the current value by the given time.
	 *  @param  {Time}  val    The value to divide by
	 *  @param  {String=}  units  Optional units to use with the value.
	 *  @return  {Tone.TimeBase}  this
	 *  @example
	 * Tone.TimeBase("2m").div(2); //"1m"
	 */
	Tone.TimeBase.prototype.div = function(val, units){
		return this._pushExpr(val, "/", units);
	};

	/**
	 *  Evaluate the time value. Returns the time
	 *  in seconds.
	 *  @return  {Seconds} 
	 */
	Tone.TimeBase.prototype.valueOf = function(){
		return this._expr();
	};

	/**
	 *  Clean up
	 *  @return {Tone.TimeBase} this
	 */
	Tone.TimeBase.prototype.dispose = function(){
		this._expr = null;
	};

	return Tone.TimeBase;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * Copyright 2017 Google Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * Licensed under the Apache License, Version 2.0 (the 'License');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * distributed under the License is distributed on an 'AS IS' BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */

exports.default = initASceneController;

__webpack_require__(67);

__webpack_require__(68);

__webpack_require__(61);

__webpack_require__(63);

__webpack_require__(62);

__webpack_require__(70);

__webpack_require__(56);

__webpack_require__(60);

__webpack_require__(33);

__webpack_require__(58);

var _Transport = __webpack_require__(6);

var _Transport2 = _interopRequireDefault(_Transport);

var _Config = __webpack_require__(4);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function initASceneController() {
	var _map = ['a-entity[menu]', 'a-scene', 'a-entity[tracks]'].map(function (q) {
		return document.querySelector(q);
	}),
	    _map2 = _slicedToArray(_map, 3),
	    menuEl = _map2[0],
	    sceneEl = _map2[1],
	    tracksEl = _map2[2];

	sceneEl.addEventListener('enter-360', function () {
		document.querySelector('a-scene').classList.add('is360');
	});

	// sceneEl.addEventListener('enter-360', cFact.start360.bind(cFact));
	// sceneEl.addEventListener('enter-vr',  cFact.startVR.bind(cFact));

	menuEl.addEventListener('select', function (e) {
		console.log('starting', e.detail.artist);

		tracksEl.setAttribute('tracks', {
			artist: e.detail.artist
		});

		//update all of the waveforms
		document.querySelectorAll('a-entity[track]').forEach(function (t) {
			return t.setAttribute('waveform', e.detail.waveform);
		});

		// set the sky also
		document.querySelector('a-sky').setAttribute('bg-color', e.detail.color);

		// set the scene to loading
		sceneEl.setAttribute('loading', 'loader', true);
		//start the voice over
		sceneEl.setAttribute('loading', 'voiceOver', true);
	});
}

/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initSplash;

var _events = __webpack_require__(14);

var _events2 = _interopRequireDefault(_events);

__webpack_require__(104);

var _Config = __webpack_require__(4);

__webpack_require__(1);

__webpack_require__(34);

var _Buffer = __webpack_require__(5);

var _Buffer2 = _interopRequireDefault(_Buffer);

var _Tone = __webpack_require__(0);

var _Tone2 = _interopRequireDefault(_Tone);

var _Scene = __webpack_require__(34);

var _startaudiocontext = __webpack_require__(101);

var _startaudiocontext2 = _interopRequireDefault(_startaudiocontext);

var _webvrUi = __webpack_require__(137);

var webvrui = _interopRequireWildcard(_webvrUi);

var _ExitButton = __webpack_require__(64);

var _InsertHeadset = __webpack_require__(65);

var _Master = __webpack_require__(16);

var _Master2 = _interopRequireDefault(_Master);

var _GA = __webpack_require__(20);

var _Helpers = __webpack_require__(7);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var audioBufferLoaded = new Promise(function (resolve) {
  return _Buffer2.default.on('load', resolve);
});

/**
 * A View that manages the loading Splash Screen Scene and the users
 * ability to enter the experience.
 * @param {HTMLElement} container
 */
/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function initSplash() {
  var container = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.body;

  //the AFrame scene
  var aScene = container.querySelector('a-scene');
  var splash = container.querySelector('#splash');
  //this link is for when VR is available but user might want 360 instead
  var tryItIn360 = document.getElementById('try-it-in-360');
  //holds the buttons
  var enterVRContainer = splash.querySelector('#enter-vr-container');
  //the splash threejs scene
  var splashScene = new _Scene.SplashScene(splash.querySelector('canvas'));

  var aSceneLoaded = new Promise(function (resolve) {
    return aScene.addEventListener('loaded', resolve);
  });

  // create the webvr-ui Button
  var enterVRButton = new webvrui.EnterVRButton(null, {
    color: '#ffffff',
    corners: 'square',
    onRequestStateChange: function onRequestStateChange(state) {
      // if(state === webvrui.State.PRESENTING){
      // 	enterVRButton.setTitle('WAITING');
      // }
      return true;
    },
    textEnterVRTitle: 'loading'.toUpperCase()
  });

  enterVRButton.domElement.addEventListener('click', function () {
    return enterVRButton.setTitle('WAITING');
  }, true);

  //create the Enter 360 Button that is full-size and replaces Enter VR
  function createEnter360Button() {
    enterVRContainer.innerHTML = '';
    var enter360 = document.createElement('button');
    enter360.classList.add('webvr-ui-button');
    enter360.style.color = 'white';
    enter360.innerHTML = '<div class="webvr-ui-title" style="padding: 0;">LOADING</div>';
    enterVRContainer.appendChild(enter360);
    enter360.addEventListener('click', onEnter360);
    tryItIn360.style.display = 'none';
    (0, _GA.GA)("vr-display", "none");
    return enter360;
  }

  // this can happen by "Enter 360" or "Try it in 360"
  function onEnter360() {
    splash.classList.remove('visible');
    splashScene.close();
    aScene.play();
    aScene.emit('enter-360');
    (0, _GA.GA)('ui', 'enter', '360');
  }

  if ((0, _Helpers.isTablet)()) {
    createEnter360Button();
  }

  enterVRButton.on('ready', function () {
    var display = enterVRButton.manager.defaultDisplay;
    if (display) {
      (0, _GA.GA)("vr-display", display.displayName);
      aScene.setAttribute('headset', display.displayName);
    }
    enterVRButton.domElement.style.marginBottom = '10px';
    if (!(0, _Helpers.isTablet)()) {
      enterVRContainer.insertBefore(enterVRButton.domElement, enterVRContainer.firstChild);
    }
    tryItIn360.style.display = 'inline-block';
  });

  enterVRButton.on('enter', function () {
    splash.classList.remove('visible');
    splashScene.close();
    aScene.play();
    aScene.enterVR();
    (0, _GA.GA)('ui', 'enter', 'vr');
  });

  enterVRButton.on('exit', function () {
    aScene.exitVR();
    aScene.pause();
    splash.classList.add('visible');
    splashScene.start();
  });

  enterVRButton.on('error', function () {
    if (enterVRButton.state === webvrui.State.ERROR_NO_PRESENTABLE_DISPLAYS || enterVRButton.state === webvrui.State.ERROR_BROWSER_NOT_SUPPORTED) {
      createEnter360Button();
    }
  });

  //start the audio context on click
  (0, _startaudiocontext2.default)(_Tone2.default.context, [enterVRContainer]);
  splashScene.start();

  window.splashScene = splashScene;

  aSceneLoaded
  //load the scene, say "loading"
  .then(function () {
    //now that we have a renderer, make sure webvr-ui gets the canvas
    enterVRButton.sourceCanvas = aScene.renderer.domElement;
    //dont run the aScene in the background
    aScene.pause();
    //add the loaded events
    tryItIn360.addEventListener('click', onEnter360);
  })
  //load audio for entry
  .then(audioBufferLoaded)
  //change text to "Enter **"
  .then(function () {
    //audio and everything is loaded now
    enterVRContainer.classList.add('ready');
    var always = function always() {
      //if WebVR is available and its not polyfill on a tablet
      if (enterVRButton.state === webvrui.State.READY_TO_PRESENT && !((0, _Helpers.isMobile)() && (0, _Helpers.isTablet)())) {
        enterVRButton.setTitle('Enter VR'.toUpperCase());
      } else if ((0, _Helpers.isTablet)() || (enterVRButton.state || '').indexOf('error') >= 0) {
        document.querySelector('.webvr-ui-title').innerHTML = '<img src="./images/360_icon.svg"><span>ENTER 360</span>';
        document.querySelector('.webvr-ui-title').classList.add('mode360');
      }
    };
    return enterVRButton.getVRDisplay().then(always, always);
  }).catch(console.error.bind(console));

  new _ExitButton.ExitButton();
  new _InsertHeadset.InsertHeadset();
  aboutPage();

  return splash;
}

/**
 * Bind the about page elements to showing / hiding the page
 * @param {HTMLElement} about the about page root element, defaults to #about
 */
function aboutPage() {
  var about = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.querySelector('#about');

  //open the about page
  var openAbout = splash.querySelector('#openAbout');
  var closeAbout = splash.querySelector('#closeAbout');

  openAbout.addEventListener('click', function () {
    about.classList.add('visible');
    (0, _GA.GA)('ui', 'open', 'about');
  });

  closeAbout.addEventListener('click', function () {
    about.classList.remove('visible');
    (0, _GA.GA)('ui', 'close', 'about');
  });

  return about;
}

/***/ }),
/* 53 */,
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(82);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(11)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./main.scss", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./main.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 55 */,
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

AFRAME.registerComponent('animate', {

	schema: {
		attribute: {
			type: 'string'
		},
		time: {
			type: 'int',
			default: 1000
		},
		easing: {
			type: 'string',
			default: 'Linear.None'
		}
	},

	init: function init() {
		var _this = this;

		this.tween = null;

		this.el.addEventListener('componentchanged', function (e) {
			if (!_this.tween && e.detail.name === _this.data.attribute) {
				_this.startAnimation(e.detail.oldData, e.detail.newData);
			}
		});
	},
	startAnimation: function startAnimation(prevData, targetData) {
		var _this2 = this;

		var attribute = this.data.attribute;

		var el = this.el;

		var easingProps = this.data.easing.split('.');
		var easing = TWEEN.Easing[easingProps[0]][easingProps[1]];

		this.tween = new TWEEN.Tween(prevData).to(targetData, this.data.time).onUpdate(function () {
			el.setAttribute(attribute, this);
		}).onComplete(function () {
			_this2.tween = null;
		}).easing(easing).start();

		this.el.setAttribute(attribute, prevData);
	}
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

/**
 * retical component
 * visually renders the retical circle,
 * this component should be applied to the camera so that it stays in the same position always
 */
AFRAME.registerComponent('retical', {
  init: function init() {
    // add a retical
    this.el.setAttribute('geometry', 'primitive:ring; radius-inner: 1; radius-outer: 1.5');
    this.el.setAttribute('material', 'color: white; transparent: true; opacity: 0.6; shader: flat');
    this.el.setAttribute('scale', '0.02 0.02 0.02');
    this.el.setAttribute('position', '0 0 -0.9');
  }
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.findControllers = exports.types = undefined;

var _components;

var _animitter = __webpack_require__(19);

var _animitter2 = _interopRequireDefault(_animitter);

var _Helpers = __webpack_require__(7);

var _Cursor = __webpack_require__(30);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * Copyright 2017 Google Inc.
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Licensed under the Apache License, Version 2.0 (the 'License');
                                                                                                                                                                                                                   * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                   * You may obtain a copy of the License at
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                   * distributed under the License is distributed on an 'AS IS' BASIS,
                                                                                                                                                                                                                   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                   * See the License for the specific language governing permissions and
                                                                                                                                                                                                                   * limitations under the License.
                                                                                                                                                                                                                   */

/**
 * all of the different possible types of controls
 */
var types = exports.types = {
	CURSOR: "cursor-controller",
	DAYDREAM: "Daydream Controller",
	//if its not the controller version (just touchpad), use retical
	GEAR: "Gear VR Controller",
	RETICAL: "retical-controller",
	VIVE: "OpenVR Gamepad",
	OCULUS_TOUCH_LEFT: "Oculus Touch (Left)",
	OCULUS_TOUCH_RIGHT: "Oculus Touch (Right)"
};

/**
 * the component names to mount for each controller type
 */
var components = (_components = {}, _defineProperty(_components, types.CURSOR, 'mouse-controller'), _defineProperty(_components, types.DAYDREAM, 'custom-geavr-controller'), _defineProperty(_components, types.GEAR, 'custom-gearvr-controller'), _defineProperty(_components, types.RETICAL, 'retical-controller'), _defineProperty(_components, types.VIVE, 'custom-six-dof-controller'), _defineProperty(_components, types.OCULUS_TOUCH_LEFT, 'custom-six-dof-controller'), _defineProperty(_components, types.OCULUS_TOUCH_RIGHT, 'custom-six-dof-controller'), _components);

var findControllers = exports.findControllers = function findControllers() {
	var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

	//empty if not emptied
	while (target.length) {
		target.splice(0, 1);
	}

	if (!navigator.getGamepads) {
		return target;
	}

	var gps = navigator.getGamepads();
	var controllerValues = (0, _Helpers.values)(types);

	for (var i = 0; i < gps.length; i++) {
		if (gps[i] === null || !gps[i].id) {
			continue;
		}

		var id = gps[i].id;

		for (var j = 0; j < controllerValues.length; j++) {
			if (id === controllerValues[j]) {
				var key = Object.keys(types)[j];

				target.push({
					key: key,
					type: types[key],
					index: i
				});
			}
		}
	}

	return target;
};

/**
 * mouse-controller component
 */
AFRAME.registerComponent('mouse-controller', {

	init: function init() {
		var _this = this;

		var mouseCursor = document.createElement('a-entity');
		mouseCursor.setAttribute('mouse-cursor', true);
		document.querySelector('a-scene').appendChild(mouseCursor);
		//this.el.appendChild(mouseCursor);

		//const entity = document.createElement('a-entity')
		//document.querySelector('a-scene').appendChild(entity)
		setTimeout(function () {
			_this.el.setAttribute('ray-intersection-emitter', '\n                updatePositions: true;\n                front: [mouse-cursor];\n                back: [camera];\n                touch:' + (0, _Helpers.isMobile)() + ';\n            ');
		}, 10);
	}

});

/**
 * retical-controller component
 * adds the retical component to the camera and manages its intersection detection
 */
AFRAME.registerComponent('retical-controller', {

	init: function init() {
		var _this2 = this;

		this.id = types.RETICAL;

		var retical = document.createElement('a-entity');
		retical.id = 'retical';
		retical.setAttribute('retical', true);

		this.reticalEl = retical;

		this.cameraEl = document.querySelector('[camera]');
		this.cameraEl.appendChild(retical);

		setTimeout(function () {
			_this2.el.setAttribute('ray-intersection-emitter', 'front: [retical]; back: [camera]; touch:false; updatePositions: true;');
		}, 100);
	},

	remove: function remove() {
		this.cameraEl.removeChild(this.reticalEl);
		this.el.removeAttribute('ray-intersection-emitter');
	}

});

/**
 * custom-gearvr-controller
 * applies to the gearvr touch controller, it combines
 * A-Frame's internal gearvr-controls component and our
 * ray-controls + ray-intersection-emitter components
 */
AFRAME.registerComponent('custom-gearvr-controller', {

	schema: {
		controller: {
			type: 'string',
			default: 'gearvr'
		}
	},

	init: function init() {
		var _this3 = this;

		this.__emitControllerClick = this.__emitControllerClick.bind(this);
		this.id = types.GEAR;

		this.el.setAttribute(this.data.controller + '-controls', { hand: 'right' });
		this.el.addEventListener('triggerdown', this.__emitControllerClick);
		this.el.addEventListener('trackpaddown', this.__emitControllerClick);

		this.el.setAttribute('id', 'righthand');
		this.el.setAttribute('ray-controls', 'use: true; hand: right;');
		setTimeout(function () {
			_this3.el.setAttribute('ray-intersection-emitter', 'front: .tracked-ray-front-right; back: #righthand;');
		}, 100);
	},

	remove: function remove() {
		this.el.removeAttribute(this.data.controller + '-controls');
		this.el.removeEventListener('triggerdown', this.__emitControllerClick);
		this.el.removeEventListener('trackpaddown', this.__emitControllerClick);
		this.el.setAttribute('ray-controls', 'use: false;');
		this.el.removeAttribute('ray-intersection-emitter');
	},

	__emitControllerClick: function __emitControllerClick() {
		this.el.emit('controller-click');
	}
});

/**
 * custom-six-dof-controller component
 * applies to both Vive and Oculus Touch controllers,
 * it will create entities within the parent node for each available controller
 */
AFRAME.registerComponent('custom-six-dof-controller', {

	schema: {
		numberOfControllers: {
			type: 'number',
			default: 1
		}
	},

	init: function init() {
		this.controllerEntities = [];

		for (var i = 0; i < this.data.numberOfControllers.length; i++) {
			this.createController(i);
		}
	},

	update: function update() {
		if (this.data.numberOfControllers > this.controllerEntities.length) {
			for (var i = this.el.children.length; i < this.data.numberOfControllers; i++) {
				this.createController(i);
			}
		} else {
			this.controllerEntities.forEach(function (entity) {
				return entity.parentElement && entity.parentElement.removeChild(entity);
			});
			this.controllerEntities = [];
		}
	},

	createController: function createController(index) {
		var _this4 = this;

		var hand = index === 0 ? 'left' : 'right';

		var id = hand + 'hand';

		this.el.innerHTML += '\n\t\t\t<a-entity\n\t\t\t\tid="' + id + '"\n\t\t\t\tauto-detect-controllers="hand:' + hand + '"\n\t\t\t\tray-controls="use: true; hand: ' + hand + ';"\n\t\t\t\tcursor-component\n\t\t\t></a-entity>\n\t\t';

		// a brief pause is necessary while it gets into the dom tree
		setTimeout(function () {
			var entity = _this4.el.querySelector('#' + id);
			if (!entity) {
				throw new Error("HAND DOESNT EXIST EVEN THOUGH JUST CREATED");
			}
			entity.setAttribute('ray-intersection-emitter', {
				front: '.tracked-ray-front-' + hand,
				back: '#' + id
			});
			_this4.controllerEntities.push(entity);
		}, 10);
	},

	remove: function remove() {
		this.controllerEntities.forEach(function (entity) {
			if (entity.parentElement) {
				entity.parentElement.removeChild(entity);
			}
		});
	}

});

var tmpA = [];
var tmpB = [];
var shouldGetRetical = function shouldGetRetical(found) {
	return found.length === 0 && (0, _Helpers.isMobile)() && !(0, _Helpers.is360)() && !(0, _Helpers.isDaydream)();
};

var shouldGetCursor = function shouldGetCursor(found) {
	return found.length === 0 && (0, _Helpers.is360)();
};

AFRAME.registerComponent('controls', {

	init: function init() {

		this.updateControls = this.updateControls.bind(this);

		//create two instances of arrays to avoid excess garbage collection
		this.ping = [];
		this.pong = [];

		//check frequently to see if controls have changed
		this.scheduler = (0, _animitter2.default)({ fps: 2 });
		this.scheduler.on('update', this.updateControls);
		this.scheduler.start();
	},

	updateControls: function updateControls() {
		var _this5 = this;

		findControllers(this.pong);
		//if the controllers have changed or if whether in 360 or not has changed
		//since we are running this often, we are re-using arrays here, we call `empty()` to remove items
		//and fill the same array with the plucked values
		var changed = (0, _Helpers.diff)((0, _Helpers.pluck)(this.ping, 'type', (0, _Helpers.empty)(tmpA)), (0, _Helpers.pluck)(this.pong, 'type', (0, _Helpers.empty)(tmpB))) || this.el.hasAttribute(components[types.RETICAL]) !== shouldGetRetical(this.pong);

		if (changed) {
			console.log('controls changed ' + (0, _Helpers.pluck)(this.pong, 'type'));
			//if there werent any controllers, but now there are, remove retical
			if (!this.ping.length) {
				if (this.el.hasAttribute(components[types.RETICAL])) {
					this.el.removeAttribute(components[types.RETICAL]);
				}
				if (this.el.hasAttribute(components[types.CURSOR])) {
					this.el.removeAttribute(components[types.CURSOR]);
				}
			}
			this.ping.forEach(function (controller) {
				return _this5.el.removeAttribute(components[controller.type]);
			});
		}

		//if it didnt change, there are no controllers, and retical is not already added
		if (shouldGetRetical(this.pong)) {
			this.el.setAttribute(components[types.RETICAL], true);
			return;
		} else if (shouldGetCursor(this.pong)) {
			this.el.setAttribute(components[types.CURSOR], true);
			return;
		}

		if (!changed || !this.pong.length) {
			return;
		}

		//see if its a vive
		if (this.pong[0].type === types.VIVE) {
			this.el.setAttribute(components[types.VIVE], 'numberOfControllers: ' + this.pong.length);
			this.resetPingPong();
			return;
		}

		//see if its Oculus
		for (var i = 0; i < this.pong.length; i++) {
			var controller = this.pong[i];
			if (controller.type.indexOf("Oculus Touch") >= 0) {
				this.el.setAttribute(components[types.OCULUS], 'numberOfControllers: 2');
				this.resetPingPong();
				return;
			}
		}

		for (var _i = 0; _i < this.pong.length; _i++) {
			var _controller = this.pong[_i];
			if (_controller.type === types.GEAR) {
				if (this.el.hasAttribute(components[types.RETICAL])) {
					this.el.removeAttribute(components[types.RETICAL]);
				}
				this.el.setAttribute('custom-gearvr-controller', true);
				this.resetPingPong();
				return;
			}
		}

		for (var _i2 = 0; _i2 < this.pong.length; _i2++) {
			var _controller2 = this.pong[_i2];
			if (_controller2.type === types.DAYDREAM) {
				if (this.el.hasAttribute(components[types.RETICAL])) {
					this.el.removeAttribute(components[types.RETICAL]);
				}
				this.el.setAttribute('custom-gearvr-controller', 'controller: daydream');
				this.resetPingPong();
				return;
			}
		}
		this.resetPingPong();
	},

	/**
  * reset the controller arrays to freshly check for changes next time
  */
	resetPingPong: function resetPingPong() {
		this.ping = this.pong;
		this.pong = [];
	},


	update: function update() {},

	remove: function remove() {
		this.scheduler.dispose();
	}

});

/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

/**
 * ray-controls component
 * applies to a single 3 DOF or 6 DOF controller
 * it renders the cylinder protruding from the controller
 */
AFRAME.registerComponent('ray-controls', {

	schema: {
		hand: {
			type: 'string',
			default: 'right'
		},
		use: {
			type: 'boolean',
			default: false
		}
	},

	init: function init() {
		var _this = this;

		var len = 1;

		var frontEl = document.createElementWithAttributes('a-entity', {
			position: '0 0 -0.05',
			'class': 'tracked-ray-front-' + this.data.hand
		});

		var cylinder = document.createElementWithAttributes('a-cylinder', {
			material: 'color: white; transparent: true; opacity: 0.2',
			radius: '0.001',
			scale: '1 ' + len + ' 1',
			position: '0 0 -' + len / 2,
			rotation: '-90 0 0'
		});

		this.frontEl = frontEl;

		this.el.appendChild(frontEl);
		frontEl.appendChild(cylinder);

		this.el.addEventListener('triggerdown', function () {
			_this.el.emit('controller-click');
		});

		this.el.addEventListener('intersection-start', function (e) {
			cylinder.setAttribute('material', 'shader: flat; opacity: 0.8');
			var dist = e.detail.object3D.getWorldPosition().distanceTo(frontEl.object3D.getWorldPosition());
			// adjust the length of the cylinder to the distance between the elements
			cylinder.setAttribute('position', '0 0 -' + dist / 2);
			cylinder.setAttribute('scale', '1 ' + dist + ' 1');
		});

		this.el.addEventListener('intersection-end', function () {
			cylinder.setAttribute('material', 'opacity', 0.2);
			cylinder.setAttribute('position', '0 0 -' + len / 2);
			cylinder.setAttribute('scale', '1 ' + len + ' 1');
		});
	},
	update: function update() {
		this.frontEl.setAttribute('class', 'tracked-ray-front-' + this.data.hand);
		this.el.setAttribute('visible', this.data.use);
	}
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

__webpack_require__(30);

__webpack_require__(57);

__webpack_require__(59);

__webpack_require__(28);

/**
 * ray-intersection-emitter component,
 * casts a ray based on what elements are provided as `front` and `back`
 * and emits events based on intersecting with elements
 *
 * @event `'intersection-start'`
 * @event `'intersection-end'`
 */
AFRAME.registerComponent('ray-intersection-emitter', {

	dependencies: ['raycaster'],

	schema: {
		front: {
			type: 'string'
		},
		back: {
			type: 'string'
		},
		updatePositions: {
			type: 'boolean',
			default: false
		},
		touch: {
			type: 'boolean',
			default: false
		}
	},

	init: function init() {
		var _this = this;

		// bind All
		['onClick', 'onRaycasterIntersection', 'onRaycasterIntersectionCleared', 'onTouchEnd', 'onTouchStart', 'onTouchClick'].forEach(function (fnStr) {
			return _this[fnStr] = _this[fnStr].bind(_this);
		});

		this.el.setAttribute('cursor', 'fuse : false');
		this.el.setAttribute('raycaster', 'far: 5; objects: .selectable; interval: 60');

		this.el.addEventListener('raycaster-intersection', this.onRaycasterIntersection);
		this.el.addEventListener('raycaster-intersection-cleared', this.onRaycasterIntersectionCleared);
	},


	/**
  * when an intersection has occurred
  * @param {CustomEvent} event
  */
	onRaycasterIntersection: function onRaycasterIntersection(event) {
		//`back` is the resolved Group / Object3D specified as `data.back` attribute
		if (this.back) {
			var intersected = this.el.components.raycaster.intersectedEls[0];
			document.querySelector(this.data.back).emit('intersection-start', intersected);
		}
	},


	/**
  * when an intersection has cleared
  * @param {CustomEvent} event
  */
	onRaycasterIntersectionCleared: function onRaycasterIntersectionCleared(event) {
		if (this.back) {
			document.querySelector(this.data.back).emit('intersection-end');
		}
	},
	onClick: function onClick() {
		var intersected = this.el.components.raycaster.intersectedEls[0];
		if (intersected) {
			intersected.emit('click');
		}
	},
	onTouchEnd: function onTouchEnd() {
		if (this.data.touch) {
			this.el.setAttribute('raycaster', 'far', 0);
		}
	},
	onTouchClick: function onTouchClick() {
		if (this.data.touch) {
			this.onClick();
		}
	},
	onTouchStart: function onTouchStart() {
		if (this.data.touch) {
			this.el.setAttribute('raycaster', 'far', 5);
		}
	},
	update: function update() {
		//get the front and back components
		if (this.data.front) {
			this.frontEl = document.querySelector(this.data.front);
			this.front = this.frontEl.object3D;

			this.frontEl.addEventListener('touch-end', this.onTouchEnd);
			this.frontEl.addEventListener('touch-click', this.onTouchClick);
			this.frontEl.addEventListener('touch-start', this.onTouchStart);
		}

		if (this.data.back) {
			this.back = document.querySelector(this.data.back).object3D;

			document.querySelector(this.data.back).addEventListener('controller-click', this.onClick);
		}

		if (this.data.touch) {
			this.el.setAttribute('raycaster', 'far', 0);
		}
	},
	tick: function tick() {
		// set the position of the back item
		if (this.data.updatePositions && this.back && this.front) {
			var frontPosition = this.front.getWorldPosition();
			var backPosition = this.back.getWorldPosition();
			this.el.object3D.position.copy(frontPosition);
			this.el.object3D.lookAt(backPosition);
		}
	}
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _basic = __webpack_require__(21);

var _basic2 = _interopRequireDefault(_basic);

var _floor = __webpack_require__(97);

var _floor2 = _interopRequireDefault(_floor);

var _Helpers = __webpack_require__(7);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * shader-floor component
 * the floor of the scene that appears to reflect the activity of the orbs and rings
 */
AFRAME.registerComponent('shader-floor', {

  schema: {
    color: {
      default: '#333333',
      type: 'string'
    }
  },

  init: function init() {
    var color = new THREE.Color((0, _Helpers.stringToHex)(this.data.color));
    var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10), new THREE.ShaderMaterial({
      fog: true,
      vertexShader: _basic2.default,
      fragmentShader: _floor2.default,
      uniforms: {
        u_startColor: {
          type: 'c',
          value: new THREE.Color(0xff0000)
        },
        u_endColor: {
          type: 'c',
          value: new THREE.Color(0x00ff00)
        },
        u_diffuseColor: {
          type: 'c',
          value: color
        },
        u_num: {
          type: 'f',
          value: 0
        },
        u_active: {
          type: 'iv',
          value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        u_time: {
          type: 'f',
          value: 1
        },
        u_amplitudes: {
          type: 'fv',
          value: [0, 0, 0, 0, 0, 0]
        },
        u_fade: {
          type: 'f',
          value: 0.4
        },
        u_normalMap: {
          type: 't',
          value: new THREE.TextureLoader().load('images/textures/saad/NormalMap_4.jpg')
        },
        u_specularMap: {
          type: 't',
          value: new THREE.TextureLoader().load('images/textures/floor-specular-1.jpg')
        },
        fogNear: {
          type: 'f',
          value: 0
        },
        fogFar: {
          type: 'f',
          value: 0
        },
        fogColor: {
          type: 'c',
          value: new THREE.Color()
        }
      }
    }));

    mesh.rotateX(-Math.PI / 2);
    this.mesh = mesh;
    this.el.object3D.add(mesh);

    this.soundRings = [];

    this.onTrackComponentChanged = this.onTrackComponentChanged.bind(this);
  },
  update: function update() {

    this.mesh.material.uniforms.u_diffuseColor.value.set((0, _Helpers.stringToHex)(this.data.color));
  },
  onTrackComponentChanged: function onTrackComponentChanged(e) {
    var _this = this;

    Array.from(document.querySelectorAll('a-entity[track-index]')).forEach(function (track, i) {
      if (i == 0) {
        _this.mesh.material.uniforms.u_startColor.value = track.components['sound-rings'].startColor;
        _this.mesh.material.uniforms.u_endColor.value = track.components['sound-rings'].endColor;
      }
      _this.mesh.material.uniforms.u_active.value[i] = track.getAttribute('active') ? 1 : 0;
    });
  },
  tick: function tick(elapsed, delta) {
    var _this2 = this;

    if (!this.soundRings.length) {
      this.soundRings = Array.from(document.querySelectorAll('a-entity[sound-rings]'));
      this.mesh.material.uniforms.u_num.value = this.soundRings.length;

      Array.from(document.querySelectorAll('a-entity[track-index]')).forEach(function (track) {
        track.addEventListener('componentchanged', _this2.onTrackComponentChanged);
      });
      return;
    }

    this.mesh.material.uniforms.u_amplitudes.value = this.soundRings.map(function (t) {
      return Number(t.getAttribute('amplitude'));
    });
    this.mesh.material.uniforms.u_time.value = elapsed / 1000;
  }
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _basic = __webpack_require__(21);

var _basic2 = _interopRequireDefault(_basic);

var _atmosphere = __webpack_require__(96);

var _atmosphere2 = _interopRequireDefault(_atmosphere);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2017 Google Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the 'License');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an 'AS IS' BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var AtmosphereMaterial = function (_THREE$ShaderMaterial) {
	_inherits(AtmosphereMaterial, _THREE$ShaderMaterial);

	function AtmosphereMaterial() {
		_classCallCheck(this, AtmosphereMaterial);

		var _this = _possibleConstructorReturn(this, (AtmosphereMaterial.__proto__ || Object.getPrototypeOf(AtmosphereMaterial)).call(this, {
			fog: true,
			vertexShader: _basic2.default,
			fragmentShader: _atmosphere2.default,
			uniforms: {
				u_time: {
					type: 'f',
					value: 0
				},
				fogNear: {
					type: 'f',
					value: 0
				},
				fogFar: {
					type: 'f',
					value: 0
				},
				fogColor: {
					type: 'c',
					value: new THREE.Color()
				}
			},
			transparent: true
		}));

		_this.side = THREE.BackSide;

		return _this;
	}

	return AtmosphereMaterial;
}(THREE.ShaderMaterial);

AFRAME.registerComponent('atmosphere', {
	init: function init() {

		this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 36), new AtmosphereMaterial());

		this.el.object3D.add(this.mesh);
	},
	tick: function tick(elapsed) {
		this.mesh.material.uniforms.u_time.value = elapsed / 1000;
	}
});

/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _Helpers = __webpack_require__(7);

var _rings = __webpack_require__(31);

var ring = _interopRequireWildcard(_rings);

var _animitter = __webpack_require__(19);

var _animitter2 = _interopRequireDefault(_animitter);

var _expoIn = __webpack_require__(87);

var _expoIn2 = _interopRequireDefault(_expoIn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var setRings = function setRings(numRings, pointsPerRing, size, shape, sC, eC) {
	var radius = function radius(i, len) {
		return (0, _Helpers.map)(i, 0, len - 1, 0.18, 0.6666);
	};
	size = size * ((0, _Helpers.isMobile)() ? 0.1 : window.devicePixelRatio || 1);
	size = (0, _Helpers.isDaydream)() ? 0.1 : size;

	// const headset = getHeadset();
	//
	// size = headset && headset.toLowerCase().indexOf('daydream') >= 0 ? size / 2 : size;

	var ringPoint = function ringPoint(i, len) {
		return new ring.RingPoints({
			radius: radius(i, len),
			resolution: pointsPerRing,
			color: sC.clone().lerp(eC, i / len),
			opacity: Math.min(1, (0, _Helpers.map)(len - (i + 1), len, 1, 4.0, 0.3)),
			size: (0, _Helpers.lerp)(size, size * 10, i / (len - 1)),
			blending: THREE.AdditiveBlending,
			shape: shape
		});
	};

	return (0, _Helpers.take)(numRings, ringPoint);
};

/**
 * sound-rings component
 * makes up all of the rings of particles around one orb
 */
/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

window.AFRAME.registerComponent('sound-rings', {

	schema: {
		startColor: {
			default: '#ff0000',
			type: 'string'
		},
		endColor: {
			default: '#0000ff',
			type: 'string'
		},
		shape: {
			default: 'circle',
			type: 'string'
		},
		size: {
			default: 5.0,
			type: 'number'
		}
	},

	init: function init() {
		var _this = this;

		ring.geometryPool.clear();
		var sHex = (0, _Helpers.stringToHex)(this.data.startColor);
		var eHex = (0, _Helpers.stringToHex)(this.data.endColor);

		this.startColor = new THREE.Color(sHex);
		this.endColor = new THREE.Color(eHex);

		this.numRings = (0, _Helpers.isMobile)() ? 25 : 40;
		this.pointsPerRing = (0, _Helpers.isMobile)() ? 64 : 128; //256;

		this.rings = setRings(this.numRings, this.pointsPerRing, 4.5, //this.data.size,
		'circle', //this.data.shape,
		this.startColor, this.endColor);
		this.rings.forEach(function (r) {
			return r.position.set(0, -0.25, 0);
		});

		this.__cacheProperties();

		//this.rings.forEach(r=> r.material.uniforms.opacity.value = 0);

		this.rings.forEach(function (r) {
			return _this.el.object3D.add(r);
		});
		this.waveformData = (0, _Helpers.take)(this.numRings, function (i) {
			return new Float32Array(_this.pointsPerRing);
		});

		this.amplitude = 0;

		this.onTrackComponentChanged = this.onTrackComponentChanged.bind(this);
		this.el.addEventListener('componentchanged', this.onTrackComponentChanged);

		this.loop = (0, _animitter2.default)();
		this.__transition();
	},
	__cacheProperties: function __cacheProperties() {
		//using this so we can fade them off and on based on active state of track
		this.__originalOpacities = this.rings.map(function (r) {
			return r.material.uniforms.opacity.value;
		});
		this.__originalRadii = this.rings.map(function (r) {
			return r.material.uniforms.radius.value;
		});
	},
	__transition: function __transition() {
		var _this2 = this;

		var isActive = !!this.el.getAttribute('active');

		var ease = isActive ? _expoIn2.default : _expoIn2.default;

		this.loop.reset().removeAllListeners().on('update', function (delta, elapsed) {

			_this2.rings.forEach(function (r, i, arr) {
				//const offset = isActive ? (arr.length - 1 - i) * 5 : i * 50;
				var offset = isActive ? i * 5 : i * 10;
				var duration = isActive ? 50 : 500;
				var t = (0, _Helpers.clamp)(ease(elapsed / (duration + offset)), 0, 1);
				var startOp = _this2.__originalOpacities[i];
				var startRad = _this2.__originalRadii[i];
				r.material.uniforms.radius.value = (0, _Helpers.map)(t, 0, 1, isActive ? 0 : startRad, isActive ? startRad : 0);
				r.material.uniforms.opacity.value = (0, _Helpers.map)(t, 0, 1, isActive ? 0 : startOp, isActive ? startOp : 0);
				var isLast = i === arr.length - 1; //(isActive && i === 0) || (!isActive && i == arr.length -1);
				if (isLast && t >= 1) {
					_this2.loop.stop();
				}
			});
		}).start();
	},
	onTrackComponentChanged: function onTrackComponentChanged(e) {
		if (e.detail.name !== 'active') {
			return;
		}
		this.__transition();
	},
	update: function update() {
		var _this3 = this;

		this.startColor.setHex((0, _Helpers.stringToHex)(this.data.startColor));
		this.endColor.setHex((0, _Helpers.stringToHex)(this.data.endColor));

		var texture = new THREE.TextureLoader().load('images/textures/' + this.data.shape + '.png');

		this.rings.forEach(function (ring, i, arr) {
			ring.material.uniforms.size.value = _this3.data.size * (window.devicePixelRatio || 1);
			ring.material.uniforms.color.value = _this3.startColor.clone().lerp(_this3.endColor, i / arr.length);
			ring.material.uniforms.shape.value = texture;
		});
	},
	tick: function tick() {
		var _this4 = this;

		var player = this.el.components.player;


		var nextAmp = player.getAmplitude();
		this.amplitude = Math.max(nextAmp, this.amplitude + (nextAmp - this.amplitude) * 0.1);

		this.el.setAttribute('amplitude', this.amplitude);

		//pop out the last Float32Array and re-fill it with new data
		var wf = this.waveformData.pop();
		this.el.components.player.getWaveform(wf);
		//put it back in at the beginning
		this.waveformData.unshift(wf);

		this.rings.forEach(function (r, i) {
			r.material.uniforms.waveform.value = _this4.waveformData[i];
			r.material.uniforms.amplitude.value = _this4.amplitude;
		});
	}
});

/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.ExitButton = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright 2017 Google Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Licensed under the Apache License, Version 2.0 (the 'License');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * distributed under the License is distributed on an 'AS IS' BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

__webpack_require__(102);

var _GA = __webpack_require__(20);

var _Helpers = __webpack_require__(7);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ExitButton = exports.ExitButton = function () {
	function ExitButton() {
		var _this = this;

		_classCallCheck(this, ExitButton);

		var element = this.element = document.querySelector('#exitButton');

		element.addEventListener('click', function () {
			(0, _GA.GA)('ui', 'click', 'exit');
			window.location.reload();
		});

		var scene = document.querySelector('a-scene');
		scene.addEventListener('enter-360', function () {
			return _this.show();
		});
		scene.addEventListener('enter-vr', function () {
			return _this.show();
		});
		scene.addEventListener('exit-vr', function () {
			return _this.hide();
		});
	}

	_createClass(ExitButton, [{
		key: 'show',
		value: function show() {
			var _this2 = this;

			setTimeout(function () {
				if (!(0, _Helpers.isMobile)() || (0, _Helpers.isMobile)() && (0, _Helpers.is360)()) {
					_this2.element.classList.add('visible');
				}
			}, 10);
		}
	}, {
		key: 'hide',
		value: function hide() {
			window.location.reload();
			this.element.classList.remove('visible');
		}
	}]);

	return ExitButton;
}();

/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InsertHeadset = undefined;

__webpack_require__(103);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * Copyright 2017 Google Inc.
                                                                                                                                                           *
                                                                                                                                                           * Licensed under the Apache License, Version 2.0 (the 'License');
                                                                                                                                                           * you may not use this file except in compliance with the License.
                                                                                                                                                           * You may obtain a copy of the License at
                                                                                                                                                           *
                                                                                                                                                           *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                           *
                                                                                                                                                           * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                           * distributed under the License is distributed on an 'AS IS' BASIS,
                                                                                                                                                           * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                           * See the License for the specific language governing permissions and
                                                                                                                                                           * limitations under the License.
                                                                                                                                                           */

var InsertHeadset = exports.InsertHeadset = function InsertHeadset() {
  var _this = this;

  _classCallCheck(this, InsertHeadset);

  var element = this.element = document.querySelector('#insertHeadset');

  element.addEventListener('click', function () {
    _this.emit('click');
    _this.hide();
  });

  var scene = document.querySelector('a-scene');
  scene.addEventListener('enter-vr', function () {
    if (scene.isMobile) {
      element.classList.add('visible');
    }
  });
};

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

AFRAME.registerComponent('menu-item', {

	schema: {
		artist: {
			type: 'string'
		},
		track: {
			type: 'string'
		},
		color: {
			type: 'color'
		},
		image: {
			default: 'pink',
			type: 'string'
		},
		selected: {
			default: false,
			type: 'boolean'
		}
	},

	init: function init() {
		var _this = this;

		this.darkGray = 'rgb(30, 30, 30)';
		this.selectedColor = 'rgb(60, 60, 60)';
		this.lightGray = 'rgb(80, 80, 80)';

		var opacity = 1;

		this.el.setAttribute('material', 'side: double; transparent:true; opacity: 0.5');
		var width = this._width = 800;
		var height = this._height = 600;

		// scale it
		var scaling = 0.95;
		this.el.setAttribute('scale', scaling + ' ' + scaling * height / width + ' ' + scaling);

		//text
		var text = document.createElement('a-text');
		text.setAttribute('value', this.data.artist.toUpperCase());
		text.setAttribute('align', 'center');
		text.setAttribute('material', 'shader: flat');
		text.setAttribute('color', 'white');
		text.setAttribute('wrap-count', 20);
		text.setAttribute('width', 1);
		text.setAttribute('side', 'double');
		text.setAttribute('scale', '1 ' + width / height + ' 1');
		text.setAttribute('position', '0 0.08 0');
		this.el.appendChild(text);

		var subText = document.createElement('a-text');
		subText.setAttribute('value', this.data.track.toUpperCase());
		subText.setAttribute('align', 'center');
		subText.setAttribute('material', 'shader: flat');
		subText.setAttribute('color', 'white');
		subText.setAttribute('wrap-count', 26);
		subText.setAttribute('width', 1);
		subText.setAttribute('side', 'double');
		subText.setAttribute('scale', '1 ' + width / height + ' 1');
		subText.setAttribute('position', '0 -0.1 0');
		this.el.appendChild(subText);

		//border
		var bgElement = this.bgElement = document.createElement('a-plane');
		this.el.appendChild(bgElement);

		bgElement.setAttribute('material', 'shader: flat; color: ' + this.darkGray + '; side: double; transparent: true; opacity: 0.5');
		bgElement.classList.add('selectable');

		//mouse events
		this.el.addEventListener('mouseenter', function () {
			bgElement.setAttribute('material', 'color', _this.lightGray);
			// bgElement.setAttribute('material', 'opacity', 1)
		});
		this.el.addEventListener('mouseleave', function () {
			if (_this.data.selected) {
				bgElement.setAttribute('material', 'color', _this.selectedColor);
			} else {
				bgElement.setAttribute('material', 'color', _this.darkGray);
			}
		});

		//unselect the item when the song is over
		this.el.sceneEl.addEventListener('song-end', function () {
			_this.el.setAttribute('menu-item', 'selected', false);
		});
	},
	_makeBorder: function _makeBorder(entered) {
		var context = this._context;
		var width = this._width;
		var height = this._height;
		var borderWidth = entered ? 20 : 10;
		context.lineWidth = borderWidth;
		context.clearRect(0, 0, width, width);
		var yOffset = (width - height) / 2;
		var padding = 6;
		var halfBorder = borderWidth / 2;
		context.strokeRect(padding + halfBorder, 0 + padding + halfBorder, width - padding * 2 - halfBorder * 2, height - padding * 2 - halfBorder * 2);
	},
	update: function update() {
		this.bgElement.setAttribute('material', 'color', this.data.selected ? this.selectedColor : this.darkGray);
	}
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

var _Config = __webpack_require__(4);

__webpack_require__(66);

AFRAME.registerComponent('menu', {

	schema: {
		shrink: {
			type: 'boolean',
			default: false
		}
	},

	init: function init() {
		var _this = this;

		if (!_Config.supported) {
			return;
		}

		this.el.id = 'menu';

		this._itemWidth = 200;
		this._itemHeight = 200;

		var currentSelection = null;

		var lastClick = Date.now();

		_Config.trackConfig.forEach(function (track, i) {
			var plane = document.createElement('a-entity');
			plane.setAttribute('menu-item', {
				artist: track.artist,
				track: track.track,
				color: track.color,
				image: track.image
			});
			_this.el.appendChild(plane);

			var rotated = i !== 1 && i !== 4;
			var moveForward = 0.07;

			if (i < 3) {
				//top row
				plane.setAttribute('position', i - 1 + ' 0 ' + (rotated ? moveForward : 0));
			} else {
				//bottom row
				plane.setAttribute('position', i - 4 + ' -0.76 ' + (rotated ? moveForward : 0));
			}

			var angle = 8;
			if (i === 0 || i === 3) {
				plane.setAttribute('rotation', '0 ' + angle + ' 0');
			} else if (i === 2 || i === 5) {
				plane.setAttribute('rotation', '0 ' + -angle + ' 0');
			}

			//unselect the previous track
			plane.addEventListener('click', function () {

				if (Date.now() - lastClick > 500) {
					lastClick = Date.now();
				} else {
					return;
				}

				_this.el.setAttribute('menu', 'shrink', true);

				if (!plane.getAttribute('menu-item').selected) {
					var trackClone = {};
					Object.assign(trackClone, track);
					_this.el.emit('select', trackClone);
					_this.el.sceneEl.emit('menu-selection', trackClone);
					if (currentSelection) {
						currentSelection.setAttribute('menu-item', 'selected', false);
					}
					plane.setAttribute('menu-item', 'selected', true);
					currentSelection = plane;
				}
			});
		});

		this.el.sceneEl.addEventListener('song-end', function () {
			_this.el.setAttribute('menu', 'shrink', false);
		});
	},
	update: function update() {
		if (this.data.shrink) {
			this.el.emit('shrink');
		} else {
			this.el.emit('grow');
		}
	}
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

var _Transport = __webpack_require__(6);

var _Transport2 = _interopRequireDefault(_Transport);

var _Buffer = __webpack_require__(5);

var _Buffer2 = _interopRequireDefault(_Buffer);

var _Master = __webpack_require__(16);

var _Master2 = _interopRequireDefault(_Master);

var _GA = __webpack_require__(20);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

AFRAME.registerComponent('playbutton', {

	schema: {
		playing: {
			default: false,
			type: 'boolean'
		},
		visible: {
			type: 'boolean',
			default: false
		}
	},

	init: function init() {
		var _this = this;

		var lastClick = 0;
		this.el.addEventListener('click', function () {
			//debounce
			if (Date.now() - lastClick > 500) {
				lastClick = Date.now();
			} else {
				return;
			}
			var playing = _Transport2.default.state === 'started';
			_this.el.setAttribute('playbutton', 'playing', !playing);
			(0, _GA.GA)('playbutton', 'click', !playing ? 'play' : 'pause');
		});

		this.el.sceneEl.addEventListener('menu-selection', function (e) {
			_Transport2.default.stop();
		});

		/*this.el.sceneEl.addEventListener('end-vr', () => {
  	
  	Transport.stop()
  })*/
	},
	update: function update() {

		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		if (this.data.playing) {
			_Transport2.default.start('+0.25');
			this.el.querySelector('a-plane').setAttribute('src', '#pause_button');
			// this.el.querySelector('a-text').setAttribute('value', 'PAUSE')
		} else {
			_Transport2.default.pause();
			this.el.querySelector('a-plane').setAttribute('src', '#play_button');
			// this.el.querySelector('a-text').setAttribute('value', 'START')
		}

		if (this.data.visible) {
			this.el.setAttribute('scale', '0.15 0.015 0.15');
		} else {
			this.el.setAttribute('scale', '0 0 0');
		}
	}
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

var _Transport = __webpack_require__(6);

var _Transport2 = _interopRequireDefault(_Transport);

__webpack_require__(32);

var _Config = __webpack_require__(4);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// register pointer events and active state and emit custom events from those
/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

AFRAME.registerComponent('pointer-events', {
	schema: {
		type: 'boolean',
		default: false
	},
	init: function init() {
		var _this = this;

		this.el.addEventListener('refresh', function () {
			_this.el.setAttribute('pointer-events', false);
		});

		this.el.sceneEl.addEventListener('audio-loaded', function () {
			if (!_this.el.getAttribute('disabled')) {
				_this.el.setAttribute('pointer-events', true);
			}
		});
	}
});

AFRAME.registerComponent('active', {
	schema: {
		type: 'boolean',
		default: false
	},
	init: function init() {
		var _this2 = this;

		this.el.addEventListener('refresh', function () {
			_this2.el.setAttribute('active', false);
		});

		this.el.sceneEl.addEventListener('song-end', function () {
			_this2.el.setAttribute('active', false);
		});

		this.el.sceneEl.addEventListener('audio-loaded', function () {
			if (!_this2.el.getAttribute('disabled')) {
				_this2.el.setAttribute('active', true);
			}
		});
	}
});

AFRAME.registerComponent('on-floor', {
	schema: {
		type: 'boolean',
		default: true
	},
	init: function init() {
		var _this3 = this;

		this.el.sceneEl.addEventListener('audio-loaded', function () {
			if (!_this3.el.getAttribute('disabled')) {
				_this3.el.setAttribute('on-floor', false);
			}
		});

		this.el.sceneEl.addEventListener('song-end', function () {
			_this3.el.setAttribute('on-floor', true);
		});

		this.el.sceneEl.addEventListener('menu-selection', function () {
			_this3.el.setAttribute('on-floor', true);
		});

		//set it initially
		this.el.setAttribute('position', 'y', 0.3);
	},
	update: function update() {

		var trackIndex = this.el.getAttribute('track-index');
		var offset = Math.PI / 4;
		var segmentAngle = (Math.PI * 2 - offset) / trackIndex.length;
		var angle = segmentAngle * (trackIndex.index + 0.5) + offset / 2;
		var x = _Config.trackRadius * Math.sin(angle);
		var z = _Config.trackRadius * Math.cos(angle);

		var event = this.data ? 'floor-on' : 'floor-off';
		//fade in the text
		if (this.el.querySelector('a-text').emit) {
			this.el.querySelector('a-text').emit(event);
		}
		var el = this.el;
		var y = this.data ? 0.3 : 1.1;
		if (this.tween) {
			this.tween.stop();
		}
		this.tween = new TWEEN.Tween({ y: this.el.object3D.position.y }).to({ y: y }, 1800).onUpdate(function () {
			el.setAttribute('position', x + ' ' + this.y + ' ' + z);
		}).easing(TWEEN.Easing.Quintic.Out).delay(Math.random() * 200).start();

		this.el.setAttribute('pointer-events', !this.data);
	}
});

AFRAME.registerComponent('disabled', {
	schema: {
		type: 'boolean',
		default: false
	},
	init: function init() {
		var _this4 = this;

		this.el.addEventListener('refresh', function () {
			_this4.el.setAttribute('disabled', false);
		});
	},
	update: function update() {
		if (this.data) {
			this.el.setAttribute('on-floor', true);
			this.el.setAttribute('active', false);
			this.el.setAttribute('pointer-events', false);
		}
	}
});

/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

__webpack_require__(32);

__webpack_require__(69);

__webpack_require__(72);

__webpack_require__(73);

var _Config = __webpack_require__(4);

/**
 * tracks component
 * a single component that creates all of the individual players and visuals
 */
/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

AFRAME.registerComponent('tracks', {

	schema: {
		artist: {
			type: 'string'
		}
	},

	init: function init() {
		var _this = this;

		this.el.id = 'tracks';

		// make all of the tracks initially
		var maxTracks = _Config.trackConfig.reduce(function (max, track) {
			return Math.max(max, track.names.length);
		}, 0);

		this.tracks = [];

		for (var i = 0; i < maxTracks; i++) {
			var track = document.createElement('a-entity');
			this.tracks.push(track);
			track.setAttribute('sphere', 'tintColor:#000000');
			track.setAttribute('track-state', '');
			track.setAttribute('pointer-events', false);
			track.setAttribute('active', 'false');
			track.setAttribute('player', '');
			track.setAttribute('track-index', 'index : ' + i + '; length: ' + maxTracks);
			track.setAttribute('on-floor', true);
			track.setAttribute('sound-rings', '');
			this.el.appendChild(track);
		}

		//clear the artist when the song ends
		this.el.sceneEl.addEventListener('song-end', function () {
			return _this.el.setAttribute('tracks', 'artist', '');
		});
	},
	update: function update() {
		var _this2 = this;

		// set them all to -1
		// this.tracks.forEach(t => t.setAttribute('track-index', 'index:-1'))

		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		this.timeout = setTimeout(function () {

			if (_this2.data.artist === '') {
				return;
			}

			var trackData = (0, _Config.getTrackData)(_this2.data.artist);

			var shaderFloorEntity = document.querySelector('a-entity[shader-floor]');
			if (shaderFloorEntity) {
				shaderFloorEntity.setAttribute('shader-floor', 'color: ' + trackData.floor.color);
			}

			for (var i = 0; i < trackData.names.length; i++) {
				var track = _this2.tracks[i];
				track.emit('refresh');
				track.setAttribute('track-index', 'index : ' + i + '; length: ' + trackData.names.length);
				track.setAttribute('player', 'folder:' + trackData.folder + ';name:' + trackData.trackNames[i] + '; segments: ' + trackData.segments);
				track.setAttribute('sphere', 'name: ' + trackData.names[i] + '; tintColor:' + trackData.soundRings.startColor);

				track.setAttribute('sound-rings', '\n\t\t\t\t\tsize:' + trackData.soundRings.size + ';\n\t\t\t\t\tstartColor:' + trackData.soundRings.startColor + ';\n\t\t\t\t\tendColor:' + trackData.soundRings.endColor + ';\n\t\t\t\t');
			}
		}, 500);
	}
});

AFRAME.registerComponent('track-index', {
	schema: {
		index: {
			type: 'int',
			default: -1
		},
		length: {
			type: 'int',
			default: 1
		}
	},
	init: function init() {
		// this.el.setAttribute('animate', 'attribute: scale; time: 300; easing: Quadratic.InOut')
	},
	update: function update() {

		var offset = Math.PI / 4;
		var segmentAngle = (Math.PI * 2 - offset) / this.data.length;
		var angle = segmentAngle * (this.data.index + 0.5) + offset / 2;
		this.el.setAttribute('scale', '1 1 1');
		this.el.setAttribute('rotation', '0 ' + angle * 180 / Math.PI + ' 0');
	}
});

/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _Listener = __webpack_require__(120);

var _Listener2 = _interopRequireDefault(_Listener);

var _Config = __webpack_require__(4);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

AFRAME.registerComponent('listener', {
    tick: function tick() {
        if (!_Config.supported) {
            return;
        }
        var object3d = this.el.object3D;
        object3d.updateMatrixWorld();
        var matrixWorld = object3d.matrixWorld;
        var position = new THREE.Vector3().setFromMatrixPosition(matrixWorld);
        _Listener2.default.setPosition(position.x, position.y, position.z);
        var mOrientation = matrixWorld.clone();
        mOrientation.setPosition({
            x: 0,
            y: 0,
            z: 0
        });
        var vFront = new THREE.Vector3(0, 0, 1);
        vFront.applyMatrix4(mOrientation);
        vFront.normalize();
        var vUp = new THREE.Vector3(0, -1, 0);
        vUp.applyMatrix4(mOrientation);
        vUp.normalize();
        _Listener2.default.setOrientation(vFront.x, vFront.y, vFront.z, vUp.x, vUp.y, vUp.z);
    }
});

/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _StreamingPlayer = __webpack_require__(74);

var _Meter = __webpack_require__(115);

var _Meter2 = _interopRequireDefault(_Meter);

var _Gain = __webpack_require__(3);

var _Gain2 = _interopRequireDefault(_Gain);

var _Analyser = __webpack_require__(37);

var _Analyser2 = _interopRequireDefault(_Analyser);

var _Panner3D = __webpack_require__(116);

var _Panner3D2 = _interopRequireDefault(_Panner3D);

var _Transport = __webpack_require__(6);

var _Transport2 = _interopRequireDefault(_Transport);

__webpack_require__(33);

__webpack_require__(71);

__webpack_require__(1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

AFRAME.registerComponent("player", {
  schema: {
    name: {
      type: "string"
    },
    folder: {
      type: "string"
    },
    segments: {
      type: "int"
    }
  },

  init: function init() {
    var _this = this;

    this.system.players.push(this);

    this._panner = new _Panner3D2.default({
      rolloffFactor: 1.25,
      /*panningModel : this.el.sceneEl.isMobile ? 'equalpower' : 'HRTF'*/
      panningModel: "equalpower"
    }).toMaster();

    this._rms = 0;

    this._amplitudeArray = new Float32Array(64);

    this._boost = new _Gain2.default().connect(this._panner);

    this._level = new _Gain2.default().connect(this._boost);

    this.el.addEventListener("componentchanged", function (e) {
      if (e.detail.name === "active") {
        var vol = e.detail.newData ? 1 : 0;
        _this._level.gain.cancelScheduledValues();
        _this._level.gain.rampTo(vol, 0.1, "+0.01");
      }
    });

    this.el.addEventListener("refresh", function () {
      _this._level.gain.cancelScheduledValues();
      _this._level.gain.value = 1;
    });

    this.el.addEventListener("mouseenter", function () {
      // filter the player
      _this._boost.gain.cancelScheduledValues();
      _this._boost.gain.rampTo(1.5, 0.1, "+0.01");
    });

    this.el.addEventListener("mouseleave", function () {
      // filter the player
      _this._boost.gain.cancelScheduledValues();
      _this._boost.gain.rampTo(1, 0.4, "+0.01");
    });

    this.el.sceneEl.addEventListener("song-end", function () {
      _this.el.setAttribute("player", "name", "");
    });

    this.el.sceneEl.addEventListener("song-start", function () {
      _this._level.gain.cancelScheduledValues();
      _this._level.gain.value = 1;
      console.log("starting", _this._level.gain.value);
    });
  },
  update: function update() {
    var _this2 = this;

    this.el.object3D.updateMatrixWorld();
    var matrixWorld = this.el.object3D.matrixWorld;
    var position = new THREE.Vector3().setFromMatrixPosition(matrixWorld);

    this._panner.setPosition(position.x, position.y, position.z);

    if (this._player) {
      this._player.dispose();
      this._player = null;
    }

    //dispose the old player and load the new one
    if (this.data.name === "null") {
      this.el.setAttribute("disabled", true);
    } else if (this.data.name !== "") {
      this.el.setAttribute("disabled", false);
      this._player = new _StreamingPlayer.StreamingPlayer(this.data.folder, this.data.name, this.data.segments);
      this._player.output.connect(this._level);

      this.el.classList.add("loading");

      this._player.on("loaded", function () {
        return _this2.system.loading();
      });
      this._player.on("buffering", function () {
        return _this2.system.buffering();
      });
      this._player.on("bufferingEnd", function () {
        return _this2.system.bufferingEnd();
      });
    }
  },
  getWaveform: function getWaveform(array) {
    if (this._player) {
      this._player.getWaveform(array);
    }
  },
  getAmplitude: function getAmplitude() {
    // average over the last 64 samples
    var len = 64;
    if (this._player) {
      var smoothing = 0.7;
      if (this.el.getAttribute("active")) {
        this.getWaveform(this._amplitudeArray);
        var samples = this._amplitudeArray;
        var total = 0;
        for (var i = 0; i < samples.length; i++) {
          total += samples[i] * samples[i];
        }
        total = Math.sqrt(total / len);
        if (total > 0.001) {
          total += 0.4;
        }
        var avg = smoothing * this._rms + (1 - smoothing) * total;
        this._rms = Math.max(avg, this._rms * 0.98);
      } else {
        this._rms = 0.95 * this._rms;
      }
      return this._rms;
    } else {
      return 0;
    }
  },
  isLoaded: function isLoaded() {
    return this.el.getAttribute("disabled") || this._player && this._player.loaded;
  },
  isBuffering: function isBuffering() {
    return this._player && this._player.buffering;
  }
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

var _Transport = __webpack_require__(6);

var _Transport2 = _interopRequireDefault(_Transport);

var _Config = __webpack_require__(4);

var _Master = __webpack_require__(16);

var _Master2 = _interopRequireDefault(_Master);

var _visibilityjs = __webpack_require__(134);

var _visibilityjs2 = _interopRequireDefault(_visibilityjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

AFRAME.registerSystem('player', {
	init: function init() {
		var _this = this;

		this.players = [];

		this.scheduleId = 0;

		// set a timeout when the song ends
		this.sceneEl.addEventListener('menu-selection', function (e) {

			_Transport2.default.clear(_this.scheduleId);

			var trackData = (0, _Config.getTrackData)(e.detail.artist);
			var duration = trackData.duration || 10;
			_this.scheduleId = _Transport2.default.schedule(function () {
				_this.sceneEl.emit('song-end');
			}, duration);
		});

		//mute the master when the visibility is hidden
		_visibilityjs2.default.change(function (e, state) {
			_Master2.default.mute = state === 'hidden';
		});
	},
	loading: function loading() {
		var _this2 = this;

		var isLoaded = true;
		this.players.forEach(function (p) {
			return isLoaded = p.isLoaded() && isLoaded;
		});
		if (isLoaded) {
			setTimeout(function () {
				return _this2.sceneEl.emit('audio-loaded');
			}, 500);
		}
	},
	bufferingEnd: function bufferingEnd() {
		var isBuffering = false;
		this.players.forEach(function (p) {
			return isBuffering = p.isBuffering() || isBuffering;
		});
		if (!isBuffering) {
			this.sceneEl.emit('buffering-end');
		}
	},
	buffering: function buffering() {
		this.sceneEl.emit('buffering');
	}
}); /**
     * Copyright 2017 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the 'License');
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an 'AS IS' BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.StreamingPlayer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BufferSource = __webpack_require__(26);

var _BufferSource2 = _interopRequireDefault(_BufferSource);

var _Transport = __webpack_require__(6);

var _Transport2 = _interopRequireDefault(_Transport);

var _Buffer = __webpack_require__(5);

var _Buffer2 = _interopRequireDefault(_Buffer);

var _Tone = __webpack_require__(0);

var _Tone2 = _interopRequireDefault(_Tone);

var _Gain = __webpack_require__(3);

var _Gain2 = _interopRequireDefault(_Gain);

var _events = __webpack_require__(14);

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2017 Google Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the 'License');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an 'AS IS' BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

//each segment is 30 seconds
var SEG_TIME = 30;

var StreamingPlayer = exports.StreamingPlayer = function (_events$EventEmitter) {
	_inherits(StreamingPlayer, _events$EventEmitter);

	function StreamingPlayer(folder, track, segments) {
		_classCallCheck(this, StreamingPlayer);

		var _this = _possibleConstructorReturn(this, (StreamingPlayer.__proto__ || Object.getPrototypeOf(StreamingPlayer)).call(this));

		_this.segment = 0;
		_this.folder = folder;
		_this.track = track;
		_this.totalSegments = segments;

		_this.output = new _Gain2.default();

		_this.playingSource = null;

		_this.id = _Transport2.default.scheduleRepeat(function (time) {
			// remove the previous source
			_this.playSegment(_this.segment, time, 0);
			//load the next one
			_this.segment++;
			_this.loadNext();
		}, 30, 0);

		_this.started = false;

		_this._startMethod = function (time, offset) {
			//it was paused and restated
			if (_this.started) {
				// get the buffer segment
				var seg = Math.floor(offset / SEG_TIME);
				_this.playSegment(seg, time, offset - seg * SEG_TIME);
			}
			_this.started = true;
		};

		_this._pauseMethod = function (time) {
			if (_this.playingSource) {
				_this.playingSource.stop(time, 0.1);
			}
		};

		_this._stopMethod = function (time) {
			// clear all of the buffers
			_this.buffers = [];
		};

		_Transport2.default.on('start', _this._startMethod);
		_Transport2.default.on('pause stop', _this._pauseMethod);
		_Transport2.default.on('stop', _this._stopMethod);

		_this.buffers = [];
		_this.buffering = false;
		_this.loaded = false;

		// load the first buffer and emit 'loaded event on first one'
		var firstBuffer = new _Buffer2.default(_this.trackName(), function () {
			_this.buffers[0] = firstBuffer;
			_this.loaded = true;
			_this.emit('loaded');
		});
		return _this;
	}

	_createClass(StreamingPlayer, [{
		key: 'loadNext',
		value: function loadNext() {
			var _this2 = this;

			if (!this.buffers[this.segment]) {
				var seg = this.segment;
				if (seg <= this.totalSegments) {
					setTimeout(function () {
						var nextBuffer = new _Buffer2.default(_this2.trackName(), function () {
							if (_this2.buffering) {
								_this2.buffering = false;
								_this2.emit('bufferingEnd');
							}
							//remove the previous one
							if (_this2.buffers[seg - 2]) {
								_this2.buffers[seg - 2] = null;
							}
							_this2.buffers[seg] = nextBuffer;
						});
					}, Math.random() * 5000 + 1000);
				}
			}
		}
	}, {
		key: 'playSegment',
		value: function playSegment(seg, time, offset) {
			if (this.buffers[seg]) {
				//make the source 
				var source = new _BufferSource2.default(this.buffers[seg]);
				source.connect(this.output);
				source.start(time, offset);
				this.playingSource = source;
			} else {
				this.emit('buffering');
				this.buffering = true;
			}
		}
	}, {
		key: 'trackName',
		value: function trackName() {
			return './audio/' + this.folder + '/' + this.track + '-' + this.segment + '.[mp3|ogg]';
		}
	}, {
		key: 'getWaveform',
		value: function getWaveform(array) {
			//the current segment
			if (_Transport2.default.seconds === 0) {
				//everything is 0
				//typed-arrays dont have forEach in some old browsers (lookin at you ios9)
				for (var i = 0; i < array.length; i++) {
					array[i] = 0;
				}
			} else {
				var segNum = Math.floor(_Transport2.default.seconds / SEG_TIME);
				var offset = _Transport2.default.seconds - segNum * SEG_TIME;
				var sample = Math.floor(offset * _Transport2.default.context.sampleRate);
				var buffer = this.buffers[segNum];
				if (buffer && sample < buffer.length) {
					buffer.get().copyFromChannel(array, 0, sample);
				}
			}
		}
	}, {
		key: 'dispose',
		value: function dispose() {
			var _this3 = this;

			_Transport2.default.off('start', this._startMethod);
			_Transport2.default.off('pause stop', this._pauseMethod);
			_Transport2.default.off('stop', this._stopMethod);
			_Transport2.default.clear(this.id);
			this.removeAllListeners('buffering');
			this.removeAllListeners('bufferingEnd');
			this.removeAllListeners('loaded');
			setTimeout(function () {
				_this3.output.dispose();
			}, 500);
		}
	}]);

	return StreamingPlayer;
}(_events2.default.EventEmitter);

/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Voice = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = __webpack_require__(14);

var _events2 = _interopRequireDefault(_events);

var _Players = __webpack_require__(130);

var _Players2 = _interopRequireDefault(_Players);

var _Buffer = __webpack_require__(5);

var _Buffer2 = _interopRequireDefault(_Buffer);

var _BufferSource = __webpack_require__(26);

var _BufferSource2 = _interopRequireDefault(_BufferSource);

var _Buffers = __webpack_require__(117);

var _Buffers2 = _interopRequireDefault(_Buffers);

var _Tone = __webpack_require__(0);

var _Tone2 = _interopRequireDefault(_Tone);

var _Config = __webpack_require__(4);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2017 Google Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the 'License');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an 'AS IS' BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var Voice = exports.Voice = function (_events$EventEmitter) {
  _inherits(Voice, _events$EventEmitter);

  function Voice() {
    _classCallCheck(this, Voice);

    var _this = _possibleConstructorReturn(this, (Voice.__proto__ || Object.getPrototypeOf(Voice)).call(this));

    _this._playedLoading = false;

    var voFolder = "./audio/vo";

    _this._players = new _Players2.default().toMaster();
    _this._players.fadeOut = 0.5;
    _this._players.volume.value = -10;

    _Config.trackConfig.forEach(function (track) {
      if (track.intro) {
        _this._players.add(track.artist, voFolder + "/" + track.intro + ".[mp3|ogg]");
      }
    });

    _this._players.add("experience", voFolder + "/intro.[mp3|ogg]");
    _this._players.add("loading", voFolder + "/loading.[mp3|ogg]");

    _this._id = -1;
    return _this;
  }

  _createClass(Voice, [{
    key: "pickAnother",
    value: function pickAnother() {}
  }, {
    key: "intro",
    value: function intro() {
      var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      this.stop();
      this._players.get("experience").start();
    }
  }, {
    key: "song",
    value: function song(track) {
      var _this2 = this;

      this.stop();
      if (this._players.has(track.artist) && _Config.useVoiceOver) {
        this._players.get(track.artist).start("+0.5");
        var duration = this._players.get(track.artist).buffer.duration + 0.5;

        if (!this._playedLoading) {
          this._playedLoading = true;
          this._players.get("loading").start("+" + duration);
          duration += this._players.get("loading").buffer.duration;
        }

        this._id = _Tone2.default.context.setTimeout(function () {
          _this2.emit("ended");
        }, duration);
      } else {
        setTimeout(function () {
          _this2.emit("ended");
        }, 200);
      }
    }

    /**
     * stop the currently playing audio
     */

  }, {
    key: "stop",
    value: function stop() {
      _Tone2.default.context.clearTimeout(this._id);
      this._players.stopAll("+0.5");
    }
  }]);

  return Voice;
}(_events2.default.EventEmitter);

/***/ }),
/* 76 */,
/* 77 */,
/* 78 */,
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(10)();
// imports


// module
exports.push([module.i, "#exitButton {\n  position: fixed;\n  top: 20px;\n  left: 20px;\n  width: 30px;\n  height: 30px;\n  text-align: center;\n  line-height: 30px;\n  font-size: 30px;\n  color: white;\n  display: none;\n  cursor: pointer;\n  background-image: url(" + __webpack_require__(133) + ");\n  background-size: 100% 100%;\n  z-index: 10000000000; }\n  #exitButton.visible {\n    display: block; }\n", ""]);

// exports


/***/ }),
/* 80 */,
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(10)();
// imports


// module
exports.push([module.i, "#insertHeadset {\n  position: fixed;\n  top: 0px;\n  left: 0px;\n  width: 100%;\n  height: 100%;\n  background-color: black;\n  display: none;\n  z-index: 10000000001; }\n  #insertHeadset img {\n    width: auto;\n    height: 300px;\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -50%); }\n  #insertHeadset.visible {\n    display: block; }\n  @media (orientation: landscape) {\n    #insertHeadset {\n      display: none !important; } }\n", ""]);

// exports


/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(10)();
// imports


// module
exports.push([module.i, "html, body {\n  position: absolute;\n  font-family: \"DIN Bold\", sans-serif;\n  top: 0px;\n  left: 0px;\n  width: 100%;\n  height: 100%;\n  margin: 0px;\n  touch-callout: none !important;\n  -webkit-user-select: none;\n     -moz-user-select: none;\n      -ms-user-select: none;\n          user-select: none; }\n  html button#start, body button#start {\n    position: absolute;\n    top: 20px;\n    right: 20px; }\n\na, a:visited, a:active {\n  color: white; }\n", ""]);

// exports


/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(10)();
// imports


// module
exports.push([module.i, "@charset \"UTF-8\";\n#splash {\n  width: 100%;\n  height: 100%;\n  position: absolute;\n  top: 0px;\n  left: 0px;\n  background-color: black;\n  color: white;\n  opacity: 0;\n  transition: opacity 0.2s;\n  display: none; }\n  #splash canvas {\n    position: absolute;\n    top: 0px;\n    left: 0px;\n    width: 100%;\n    height: 100%;\n    opacity: 0.65; }\n  #splash.visible {\n    display: inline;\n    opacity: 1; }\n  #splash #splash-container {\n    width: 90%;\n    max-width: 800px;\n    min-width: 300px;\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -50%);\n    font-family: 'DIN Condensed';\n    text-transform: uppercase;\n    text-align: center; }\n    #splash #splash-container #title {\n      font-size: 110px;\n      margin-bottom: 0px; }\n      @media (max-width: 800px) {\n        #splash #splash-container #title {\n          font-size: 75px; }\n          #splash #splash-container #title:before {\n            top: 25px !important; } }\n      @media (max-height: 420px), (max-width: 500px) {\n        #splash #splash-container #title {\n          font-size: 63px; }\n          #splash #splash-container #title:before {\n            top: 20px !important; } }\n      @media (max-height: 420px) {\n        #splash #splash-container #title {\n          margin-top: 0px; }\n          #splash #splash-container #title:before {\n            top: -5px !important; } }\n      #splash #splash-container #title:before {\n        content: \"SONG EXPLODER PRESENTS\";\n        position: absolute;\n        width: 100%;\n        left: 50%;\n        top: 40px;\n        font-size: 0.3em;\n        transform: translate(-50%, -50%); }\n    #splash #splash-container #featuring {\n      margin-top: 0px;\n      margin-bottom: 0px;\n      font-size: 20px;\n      display: none; }\n      @media (max-width: 800px) {\n        #splash #splash-container #featuring {\n          font-size: 16px; } }\n      @media (max-width: 500px) {\n        #splash #splash-container #featuring {\n          font-size: 10px; } }\n      @media (max-height: 420px) {\n        #splash #splash-container #featuring {\n          display: none; } }\n    #splash #splash-container #bands {\n      margin-top: 15px;\n      width: 100%;\n      max-width: 500px;\n      min-width: 300px;\n      font-size: 26px;\n      display: inline-block;\n      padding: 0px; }\n      @media (max-width: 800px) {\n        #splash #splash-container #bands {\n          font-size: 20px; } }\n      @media (max-width: 500px) {\n        #splash #splash-container #bands {\n          margin-top: 5px;\n          font-size: 16px; } }\n      @media (max-height: 420px) {\n        #splash #splash-container #bands {\n          display: none; } }\n      #splash #splash-container #bands span {\n        display: inline-block; }\n        #splash #splash-container #bands span:after {\n          margin-left: 5px;\n          margin-right: 5px;\n          display: inline;\n          content: '/'; }\n        #splash #splash-container #bands span:last-child:after {\n          content: ''; }\n    #splash #splash-container #remember {\n      text-transform: uppercase; }\n    #splash #splash-container #enter-vr-container {\n      position: relative;\n      display: block;\n      margin-left: auto;\n      margin-right: auto;\n      margin-top: 50px;\n      min-width: 170px;\n      min-height: 46px; }\n      @media (max-width: 800px) {\n        #splash #splash-container #enter-vr-container {\n          margin-top: 30px; } }\n      @media (max-height: 420px) {\n        #splash #splash-container #enter-vr-container {\n          margin-top: 10px; } }\n      #splash #splash-container #enter-vr-container .webvr-ui-button {\n        border-radius: 0px;\n        border: white 4px solid; }\n        #splash #splash-container #enter-vr-container .webvr-ui-button:hover {\n          background-color: rgba(136, 136, 136, 0.5); }\n        #splash #splash-container #enter-vr-container .webvr-ui-button .mode360 {\n          left: 18px; }\n          #splash #splash-container #enter-vr-container .webvr-ui-button .mode360 * {\n            float: left; }\n          #splash #splash-container #enter-vr-container .webvr-ui-button .mode360 img {\n            margin-right: 5px;\n            height: 25px; }\n          #splash #splash-container #enter-vr-container .webvr-ui-button .mode360 span {\n            height: 25px;\n            line-height: 25px; }\n  @media (max-height: 420px), (max-width: 500px) {\n    #splash .aboutButton {\n      top: 20px !important;\n      right: 20px !important; }\n    #splash #headphones {\n      top: 20px !important;\n      left: 20px !important; } }\n  #splash #openAbout:before {\n    content: \"?\"; }\n  #splash #closeAbout:before {\n    font-size: 30px;\n    content: \"\\D7\"; }\n  #splash .aboutButton {\n    position: absolute;\n    z-index: 1;\n    top: 30px;\n    right: 30px;\n    width: 40px;\n    height: 40px;\n    text-align: center;\n    transition: transform 0.2s;\n    cursor: pointer;\n    line-height: 40px; }\n    #splash .aboutButton:hover {\n      transform: scale(1.1); }\n      #splash .aboutButton:hover:active {\n        color: #5dece8; }\n    #splash .aboutButton:before {\n      font-family: sans-serif;\n      font-size: 20px; }\n  #splash #headphones {\n    position: absolute;\n    top: 30px;\n    left: 30px;\n    width: 30px;\n    height: 30px;\n    background-color: white;\n    border-radius: 15px;\n    color: black;\n    overflow: hidden;\n    transition: width 0.2s; }\n    #splash #headphones:hover {\n      width: 180px; }\n    #splash #headphones img {\n      width: auto;\n      display: inline-block;\n      left: 3px;\n      height: 28px;\n      position: absolute; }\n    #splash #headphones #text {\n      width: 140px;\n      height: 100%;\n      display: inline-block;\n      height: 100%;\n      position: absolute;\n      line-height: 30px;\n      left: 32px;\n      font-size: 11px; }\n  #splash #about {\n    position: absolute;\n    top: 0px;\n    left: 0px;\n    width: 100%;\n    height: 100%;\n    overflow-y: auto;\n    overflow-x: hidden;\n    font-weight: normal;\n    font-size: 14px;\n    line-height: 20px;\n    z-index: 1;\n    background-color: black;\n    display: none;\n    font-family: Arial, Helvetica, sans-serif; }\n    #splash #about.visible {\n      display: block; }\n    #splash #about #content {\n      position: relative;\n      width: 70%;\n      max-width: 600px;\n      min-width: 300px;\n      margin: 50px auto 40px auto; }\n      #splash #about #content h2 {\n        line-height: 1em;\n        font-size: 2.3em;\n        text-transform: uppercase;\n        font-family: 'DIN Condensed', sans-serif;\n        margin-top: 40px; }\n      #splash #about #content a {\n        color: #5dece8; }\n      #splash #about #content .bandLink {\n        display: block;\n        margin-top: 10px;\n        margin-bottom: 15px; }\n      #splash #about #content p {\n        margin-top: 20px;\n        margin-bottom: 20px; }\n  #splash #badges {\n    position: absolute;\n    bottom: 20px;\n    left: 20px;\n    height: 50px;\n    width: 500px; }\n    @media (max-width: 800px), (max-height: 420px) {\n      #splash #badges {\n        bottom: 10px;\n        left: 10px;\n        height: 40px; } }\n    @media (max-height: 420px) {\n      #splash #badges {\n        height: 35px; } }\n    @media (max-width: 500px) {\n      #splash #badges {\n        bottom: 50px;\n        width: 300px;\n        left: 50%;\n        transform: translate(-50%, 0); } }\n    #splash #badges .badge {\n      width: auto;\n      height: 100%;\n      display: inline-block; }\n    #splash #badges .keyline {\n      width: 1px;\n      background-color: white;\n      height: 100%;\n      display: inline-block;\n      margin-left: 20px;\n      margin-right: 20px; }\n      @media (max-width: 800px), (max-height: 420px) {\n        #splash #badges .keyline {\n          margin-left: 10px;\n          margin-right: 10px; } }\n    #splash #badges a {\n      width: auto;\n      height: 100%;\n      color: black;\n      background: transparent; }\n  #splash #terms {\n    position: absolute;\n    bottom: 20px;\n    right: 20px;\n    color: white;\n    font-size: 11px;\n    width: 81px; }\n    @media (max-width: 800px), (max-height: 420px) {\n      #splash #terms {\n        bottom: 10px;\n        right: 10px; } }\n    @media (max-width: 500px) {\n      #splash #terms {\n        left: 50%;\n        transform: translate(-50%, 0); } }\n    #splash #terms a {\n      text-decoration: none; }\n      #splash #terms a:hover {\n        text-decoration: underline; }\n", ""]);

// exports


/***/ }),
/* 84 */
/***/ (function(module, exports) {

var DOCUMENT_NODE_TYPE = 9;

/**
 * A polyfill for Element.matches()
 */
if (typeof Element !== 'undefined' && !Element.prototype.matches) {
    var proto = Element.prototype;

    proto.matches = proto.matchesSelector ||
                    proto.mozMatchesSelector ||
                    proto.msMatchesSelector ||
                    proto.oMatchesSelector ||
                    proto.webkitMatchesSelector;
}

/**
 * Finds the closest parent that matches a selector.
 *
 * @param {Element} element
 * @param {String} selector
 * @return {Function}
 */
function closest (element, selector) {
    while (element && element.nodeType !== DOCUMENT_NODE_TYPE) {
        if (typeof element.matches === 'function' &&
            element.matches(selector)) {
          return element;
        }
        element = element.parentNode;
    }
}

module.exports = closest;


/***/ }),
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

var closest = __webpack_require__(84);

/**
 * Delegates event to a selector.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @param {Boolean} useCapture
 * @return {Object}
 */
function _delegate(element, selector, type, callback, useCapture) {
    var listenerFn = listener.apply(this, arguments);

    element.addEventListener(type, listenerFn, useCapture);

    return {
        destroy: function() {
            element.removeEventListener(type, listenerFn, useCapture);
        }
    }
}

/**
 * Delegates event to a selector.
 *
 * @param {Element|String|Array} [elements]
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @param {Boolean} useCapture
 * @return {Object}
 */
function delegate(elements, selector, type, callback, useCapture) {
    // Handle the regular Element usage
    if (typeof elements.addEventListener === 'function') {
        return _delegate.apply(null, arguments);
    }

    // Handle Element-less usage, it defaults to global delegation
    if (typeof type === 'function') {
        // Use `document` as the first parameter, then apply arguments
        // This is a short way to .unshift `arguments` without running into deoptimizations
        return _delegate.bind(null, document).apply(null, arguments);
    }

    // Handle Selector-based usage
    if (typeof elements === 'string') {
        elements = document.querySelectorAll(elements);
    }

    // Handle Array-like based usage
    return Array.prototype.map.call(elements, function (element) {
        return _delegate(element, selector, type, callback, useCapture);
    });
}

/**
 * Finds closest match and invokes callback.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @return {Function}
 */
function listener(element, selector, type, callback) {
    return function(e) {
        e.delegateTarget = closest(e.target, selector);

        if (e.delegateTarget) {
            callback.call(element, e);
        }
    }
}

module.exports = delegate;


/***/ }),
/* 86 */
/***/ (function(module, exports) {

function expoInOut(t) {
  return (t === 0.0 || t === 1.0)
    ? t
    : t < 0.5
      ? +0.5 * Math.pow(2.0, (20.0 * t) - 10.0)
      : -0.5 * Math.pow(2.0, 10.0 - (t * 20.0)) + 1.0
}

module.exports = expoInOut

/***/ }),
/* 87 */
/***/ (function(module, exports) {

function expoIn(t) {
  return t === 0.0 ? t : Math.pow(2.0, 10.0 * (t - 1.0))
}

module.exports = expoIn

/***/ }),
/* 88 */,
/* 89 */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}


/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(91)
var isWindow = __webpack_require__(92)

function isNode (val) {
  if (!isObject(val) || !isWindow(window) || typeof window.Node !== 'function') {
    return false
  }

  return typeof val.nodeType === 'number' &&
    typeof val.nodeName === 'string'
}

module.exports = isNode


/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function isObject(x) {
	return typeof x === 'object' && x !== null;
};


/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (obj) {

  if (obj == null) {
    return false;
  }

  var o = Object(obj);

  return o === o.window;
};


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {// Generated by CoffeeScript 1.12.2
(function() {
  var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - nodeLoadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    moduleLoadTime = getNanoSeconds();
    upTime = process.uptime() * 1e9;
    nodeLoadTime = moduleLoadTime - upTime;
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

//# sourceMappingURL=performance-now.js.map

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(36)))

/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {var now = __webpack_require__(93)
  , root = typeof window === 'undefined' ? global : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = root['request' + suffix]
  , caf = root['cancel' + suffix] || root['cancelRequest' + suffix]

for(var i = 0; !raf && i < vendors.length; i++) {
  raf = root[vendors[i] + 'Request' + suffix]
  caf = root[vendors[i] + 'Cancel' + suffix]
      || root[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(root, fn)
}
module.exports.cancel = function() {
  caf.apply(root, arguments)
}
module.exports.polyfill = function(object) {
  if (!object) {
    object = root;
  }
  object.requestAnimationFrame = raf
  object.cancelAnimationFrame = caf
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(12)))

/***/ }),
/* 95 */,
/* 96 */
/***/ (function(module, exports) {

module.exports = "/**\r\n * Copyright 2017 Google Inc.\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the 'License');\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *     http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an 'AS IS' BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n#define PI 3.14159265359\r\n#define TWO_PI 6.28318530718\r\n#define NUM_OCTAVES 5\r\n#define TILES 75.0\r\n\r\nvarying vec2 vUv;\r\n\r\nuniform float u_time;\r\nuniform float fogNear;\r\nuniform float fogFar;\r\nuniform vec3 fogColor;\r\n\r\n\r\nfloat rand(float n){return fract(sin(n) * 43758.5453123);}\r\n\r\nfloat fnoise(float p){\r\n\tfloat fl = floor(p);\r\n\tfloat fc = fract(p);\r\n    return mix(rand(fl), rand(fl + 1.0), fc);\r\n}\r\n\r\n\r\nfloat fbm(float x) {\r\n    float v = 0.0;\r\n    float a = 0.5;\r\n    float shift = float(100);\r\n    for (int i = 0; i < NUM_OCTAVES; ++i) {\r\n        v += a * fnoise(x);\r\n        x = x * 2.0 + shift;\r\n        a *= 0.5;\r\n    }\r\n    return v;\r\n}\r\n\r\nvoid main(){\r\n\r\n    float noi = mod(vUv.x * TILES, 1.0);\r\n\tfloat noy = mod(vUv.y * TILES, 1.0) - (smoothstep(1.0, 0.17, vUv.y) + smoothstep(0.65, 1.0, vUv.y));\r\n\r\n    noi = step(0.15, noi);\r\n\r\n    float v = noi * noy * 0.12;\r\n\r\n\tvec3 color = vec3(v);\r\n\r\n\t//fog\r\n    //float depth = gl_FragCoord.z / gl_FragCoord.w;\r\n    //float fogF = min(smoothstep(fogNear, fogFar, depth), 1.0);\r\n    //color = mix(color, fogColor, fogF);\r\n\tgl_FragColor = vec4(color,  noi * noy);\r\n}\r\n"

/***/ }),
/* 97 */
/***/ (function(module, exports) {

module.exports = "/**\r\n * Copyright 2017 Google Inc.\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the 'License');\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *     http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an 'AS IS' BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n#define PI 3.14159265359\r\n#define TWO_PI 6.28318530718\r\n#define NUM_OCTAVES 5\r\n\r\n#define BLUE_HSB vec3(190.0/360.0, 90.0/100.0, 96.0/100.0)\r\n#define BLUE_RGB vec3(24.0/255.0, 210.0/255.0, 246.0/255.0)\r\n#define PINK_HSB vec3(312.0/360.0, 1.0, 1.0)\r\n#define PINK_RGB vec3(1.0, 0.0, 205.0/255.0)\r\n\r\nuniform vec3 u_startColor;\r\nuniform vec3 u_endColor;\r\nuniform vec3 u_diffuseColor;\r\nuniform float u_num;\r\nuniform float u_time;\r\nuniform float u_amplitudes[10];\r\nuniform int u_active[10];\r\nuniform float u_fade;\r\nuniform sampler2D u_normalMap;\r\nuniform sampler2D u_specularMap;\r\n\r\nuniform float fogNear;\r\nuniform float fogFar;\r\nuniform vec3 fogColor;\r\n\r\nvarying vec2 vUv;\r\n\r\nfloat rand(float n){return fract(sin(n) * 43758.5453123);}\r\n\r\nfloat fnoise(float p){\r\n\tfloat fl = floor(p);\r\n\tfloat fc = fract(p);\r\n\treturn mix(rand(fl), rand(fl + 1.0), fc);\r\n}\r\n\r\n\r\nfloat fbm(float x) {\r\n\tfloat v = 0.0;\r\n\tfloat a = 0.5;\r\n\tfloat shift = float(100);\r\n\tfor (int i = 0; i < NUM_OCTAVES; ++i) {\r\n\t\tv += a * fnoise(x);\r\n\t\tx = x * 2.0 + shift;\r\n\t\ta *= 0.5;\r\n\t}\r\n\treturn v;\r\n}\r\n\r\nfloat circle( vec2 pos, float r ){\r\n\tvec2 center = vec2(0.0);\r\n\tfloat l = length(pos - center);\r\n\r\n\tl = step(r, l);\r\n\tl = 1.0 - l;\r\n\r\n\treturn l;\r\n}\r\n\r\n\r\nfloat smoothcircle( vec2 pos, float r ){\r\n\tvec2 center = vec2(0.0);\r\n\tfloat l = length(pos - center);\r\n\r\n\tl = smoothstep(0.0, r, l);\r\n\tl = 1.0 - l;\r\n\r\n\treturn l;\r\n}\r\n\r\n\r\nvoid main(){\r\n\r\n\tint N = int(u_num);\r\n\tfloat radius = 0.4;\r\n\r\n\tfloat radialGap = TWO_PI / 8.0;\r\n\tfloat rotationOffset = -TWO_PI / 8.0;\r\n\r\n\tvec2 uv = vUv;\r\n\r\n\tvec2 pos = uv * 2.0 - 1.0;\r\n\tvec4 texel = texture2D(u_normalMap, uv);\r\n\tpos += (texel.gb * 2. - 1.) * 0.05;\r\n\r\n\t//this offset is to matc the spheres positioning above it\r\n\tpos.y -= 0.05;\r\n\r\n\tfloat dist = length(pos);\r\n\tfloat angle = atan(pos.y, pos.x);\r\n\r\n\tfloat blue = 0.0;\r\n\tfloat orb = 0.0;\r\n\r\n\tfloat amplitude = 0.0;\r\n\r\n\tfor(int index=0; index<10; index++){\r\n\t\tif(index >= N){\r\n\t\t\tbreak;\r\n\t\t}\r\n\t\tif(u_active[index] == 0){\r\n\t\t\tcontinue;\r\n\t\t}\r\n\t\tfloat angle = (TWO_PI - radialGap) / 7.0 * float(index);\r\n\t\tangle += rotationOffset;\r\n\r\n\t\tvec2 off = vec2(cos(angle), sin(angle));\r\n\t\toff *= radius;\r\n\r\n\t\tblue += smoothcircle(pos + off, 0.3 * u_amplitudes[index]);\r\n\t\t//blue *= 1.0 - smoothstep(0.1, 0.3, blue);\r\n\t\t//the orb should get slightly smaller with more amplitude cause its raising\r\n\t\tamplitude = u_amplitudes[index];\r\n\t\torb += smoothstep(0.1, 0.8, smoothcircle(pos + off, 0.1 - (amplitude * 0.06)));\r\n\t\tif(orb > 0.0){\r\n\t\t\t//we've already found the one for this frag\r\n\t\t\tbreak;\r\n\t\t}\r\n\t}\r\n\r\n\r\n\tvec3 color = vec3(mix(u_endColor, u_startColor, blue)) * blue;\r\n\t// mix the orb with the start color\r\n\t//color += mix(u_startColor, vec3(1.0), amplitude) * orb * 0.66;\r\n\t//or keep it white\r\n\tcolor += orb * 0.66;\r\n\tcolor *= u_fade;\r\n\tfloat fadeFromCenter = (1.0 - smoothstep(0.0, 0.4, length(pos)));\r\n\tcolor += u_diffuseColor * fadeFromCenter;\r\n\r\n\tcolor *= texel.r;\r\n\t//color += texture2D(u_specularMap, uv).rgb * 0.05;\r\n\r\n\t//fog\r\n    float depth = gl_FragCoord.z / gl_FragCoord.w;\r\n    float fogF = min(smoothstep(fogNear, fogFar, depth), 1.0);\r\n    color = mix(color, fogColor, fogF);\r\n\r\n\t//color += vec3(0.02);\r\n\t//color = mix(color, vec3(0.5, 0.5, 0.5), 1.0 - orb);\r\n\r\n\tgl_FragColor = vec4(color,1.0);\r\n\t//gl_FragColor = vec4(mix(mix(PINK_RGB, BLUE_RGB, blue), vec3(1.0), orb) * blue, 1.0);\r\n}\r\n"

/***/ }),
/* 98 */
/***/ (function(module, exports) {

module.exports = "/**\r\n * Copyright 2017 Google Inc.\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the 'License');\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *     http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an 'AS IS' BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\nprecision mediump float;\r\n\r\nuniform vec3 color;\r\nuniform float opacity;\r\nuniform float amplitude;\r\nuniform sampler2D shape;\r\n\r\nuniform float fogNear;\r\nuniform float fogFar;\r\nuniform vec3 fogColor;\r\n\r\n\r\n//  Function from Iñigo Quiles\r\n//  https://www.shadertoy.com/view/MsS3Wc\r\nvec3 hsb2rgb( in vec3 c ){\r\n\tvec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),\r\n\t\t\t\t\t\t\t6.0)-3.0)-1.0,\r\n\t\t\t\t\t0.0,\r\n\t\t\t\t\t1.0 );\r\n\trgb = rgb*rgb*(3.0-2.0*rgb);\r\n\treturn c.z * mix(vec3(1.0), rgb, c.y);\r\n}\r\n\r\nvec3 rgb2hsb( in vec3 c ){\r\n\tvec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\r\n\tvec4 p = mix(vec4(c.bg, K.wz),\r\n\t\t\t\tvec4(c.gb, K.xy),\r\n\t\t\t\tstep(c.b, c.g));\r\n\tvec4 q = mix(vec4(p.xyw, c.r),\r\n\t\t\t\tvec4(c.r, p.yzx),\r\n\t\t\t\tstep(p.x, c.r));\r\n\tfloat d = q.x - min(q.w, q.y);\r\n\tfloat e = 1.0e-10;\r\n\treturn vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),\r\n\t\t\t\td / (q.x + e),\r\n\t\t\t\tq.x);\r\n}\r\n\r\nvoid main() {\r\n\tvec4 texel = texture2D(shape, gl_PointCoord);\r\n\r\n\tif(texel.r == 0.0){\r\n\t\tdiscard;\r\n\t}\r\n\r\n\tvec3 c = rgb2hsb(color);\r\n\tc.g *= amplitude;\r\n\tc.b *= 0.5 + smoothstep(0.25, 1.0, amplitude);\r\n\r\n\tc = hsb2rgb(c);\r\n\r\n\t//fog\r\n    float depth = gl_FragCoord.z / gl_FragCoord.w;\r\n    float fogF = min(smoothstep(fogNear, fogFar, depth), 1.0);\r\n    //c = mix(c, fogColor, fogF);\r\n\tc *= texel.rgb;\r\n\r\n\t//gl_FragColor = vec4(color, opacity * pow(amplitude, 2.0));\r\n\tgl_FragColor = vec4( c, opacity * texel.a);\r\n\t//gl_FragColor = vec4(1.0);\r\n}\r\n"

/***/ }),
/* 99 */
/***/ (function(module, exports) {

module.exports = "/**\r\n * Copyright 2017 Google Inc.\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the 'License');\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *     http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an 'AS IS' BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\nprecision mediump float;\r\n\r\n#define TWO_PI 6.28318530718\r\n\r\nattribute float reference;\r\n\r\n// this is a raw shader material\r\nuniform mat4 modelViewMatrix;\r\nuniform mat4 projectionMatrix;\r\n\r\nuniform float size;\r\nuniform float waveform[WAVEFORM_RESOLUTION];\r\nuniform float amplitude;\r\nuniform float radius;\r\n\r\nfloat rand(float n){return fract(sin(n) * 43758.5453123);}\r\n\r\nfloat fnoise(float p){\r\n\tfloat fl = floor(p);\r\n\tfloat fc = fract(p);\r\n\treturn mix(rand(fl), rand(fl + 1.0), fc);\r\n}\r\n\r\nvoid main() {\r\n\r\n\tfloat ref = reference * float(WAVEFORM_RESOLUTION);\r\n\r\n\tfloat angle = ((ref+1.)/float(WAVEFORM_RESOLUTION)) * 6.28318530718;\r\n\tvec3 pos = vec3( cos(angle), 0.0, sin(angle) );\r\n\tfloat offset = waveform[int(ref)] * amplitude;\r\n\r\n\tpos *= radius + offset * 0.5 + (amplitude * 0.165); //smoothstep(0.7, 1.0, amplitude)\r\n\r\n\t//pos = position;\r\n\r\n\r\n\tvec4 mvPosition = modelViewMatrix * vec4( pos.x, pos.y + offset, pos.z, 1.0 );\r\n\r\n\r\n\t// Apply Size Attenuation (make smaller when further)\r\n\tgl_PointSize = size * (1.0 / length( mvPosition.xyz ));\r\n\r\n\tgl_Position = projectionMatrix * mvPosition;\r\n\r\n}\r\n"

/***/ }),
/* 100 */
/***/ (function(module, exports) {

module.exports = "/**\r\n * Copyright 2017 Google Inc.\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the 'License');\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *     http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an 'AS IS' BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n#define OFF_COLOR vec3(0.5, 237.0/255.0/2.0, 198.0/255.0/2.0)\r\nuniform float opacity;\r\nuniform vec3 tintColor;\r\nuniform float mixRate;\r\nuniform int enabled;\r\n\r\nuniform float fogNear;\r\nuniform float fogFar;\r\nuniform vec3 fogColor;\r\n\r\nvarying vec2 vUv;\r\n\r\nvoid main(){\r\n\tfloat shadeX = abs(vUv.x * 2. - 1.);\r\n\tfloat shadeY = abs(vUv.y * 2. - 1.);\r\n\tvec4 color = vec4(1.0);\r\n\tif(enabled == 1){\r\n\t\t//gl_FragColor = vec4(tintColor * shadeX * shadeY + 0.66 * mixRate, opacity);\r\n\r\n\t\tcolor = vec4(mix(tintColor, vec3(1.0) * (smoothstep(0.4, 1.0, mixRate) + 0.9), smoothstep(0.0, 0.7 * mixRate, smoothstep(0.0, 0.95, vUv.y))) * (shadeX * shadeY + 0.66), 1.0);\r\n\t\t//color = vec4(mix(vec3(1.0), tintColor * (smoothstep(0.4, 1.0, mixRate) + 0.9), smoothstep(0.0, 0.9 * mixRate, vUv.y)) * (shadeX * shadeY + 0.66), 1.0);\r\n\t} else {\r\n\t\tcolor = vec4(OFF_COLOR * shadeX * shadeY, opacity);\r\n\t}\r\n\r\n\r\n\t//fog\r\n    float depth = gl_FragCoord.z / gl_FragCoord.w;\r\n    float fogF = min(smoothstep(fogNear, fogFar, depth), 1.0);\r\n    color.rgb = mix(color.rgb * 1.1, fogColor, fogF);\r\n\r\n\tgl_FragColor = color;\r\n}\r\n"

/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
 *  StartAudioContext.js
 *  @author Yotam Mann
 *  @license http://opensource.org/licenses/MIT MIT License
 *  @copyright 2016 Yotam Mann
 */
(function (root, factory) {
	if (true) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	 } else if (typeof module === "object" && module.exports) {
        module.exports = factory()
	} else {
		root.StartAudioContext = factory()
  }
}(this, function () {

	//TAP LISTENER/////////////////////////////////////////////////////////////

	/**
	 * @class  Listens for non-dragging tap ends on the given element
	 * @param {Element} element
	 * @internal
	 */
	var TapListener = function(element, context){

		this._dragged = false

		this._element = element

		this._bindedMove = this._moved.bind(this)
		this._bindedEnd = this._ended.bind(this, context)

		element.addEventListener("touchmove", this._bindedMove)
		element.addEventListener("touchend", this._bindedEnd)
		element.addEventListener("mouseup", this._bindedEnd)
	}

	/**
	 * drag move event
	 */
	TapListener.prototype._moved = function(e){
		this._dragged = true
	};

	/**
	 * tap ended listener
	 */
	TapListener.prototype._ended = function(context){
		if (!this._dragged){
			startContext(context)
		}
		this._dragged = false
	};

	/**
	 * remove all the bound events
	 */
	TapListener.prototype.dispose = function(){
		this._element.removeEventListener("touchmove", this._bindedMove)
		this._element.removeEventListener("touchend", this._bindedEnd)
		this._element.removeEventListener("mouseup", this._bindedEnd)
		this._bindedMove = null
		this._bindedEnd = null
		this._element = null
	};

	//END TAP LISTENER/////////////////////////////////////////////////////////

	/**
	 * Plays a silent sound and also invoke the "resume" method
	 * @param {AudioContext} context
	 * @private
	 */
	function startContext(context){
		// this accomplishes the iOS specific requirement
		var buffer = context.createBuffer(1, 1, context.sampleRate)
		var source = context.createBufferSource()
		source.buffer = buffer
		source.connect(context.destination)
		source.start(0)

		// resume the audio context
		if (context.resume){
			context.resume()
		}
	}

	/**
	 * Returns true if the audio context is started
	 * @param  {AudioContext}  context
	 * @return {Boolean}
	 * @private
	 */
	function isStarted(context){
		 return context.state === "running"
	}

	/**
	 * Invokes the callback as soon as the AudioContext
	 * is started
	 * @param  {AudioContext}   context
	 * @param  {Function} callback
	 */
	function onStarted(context, callback){

		function checkLoop(){
			if (isStarted(context)){
				callback()
			} else {
				requestAnimationFrame(checkLoop)
				if (context.resume){
					context.resume()
				}
			}
		}

		if (isStarted(context)){
			callback()
		} else {
			checkLoop()
		}
	}

	/**
	 * Add a tap listener to the audio context
	 * @param  {Array|Element|String|jQuery} element
	 * @param {Array} tapListeners
	 */
	function bindTapListener(element, tapListeners, context){
		if (Array.isArray(element) || (NodeList && element instanceof NodeList)){
			for (var i = 0; i < element.length; i++){
				bindTapListener(element[i], tapListeners, context)
			}
		} else if (typeof element === "string"){
			bindTapListener(document.querySelectorAll(element), tapListeners, context)
		} else if (element.jquery && typeof element.toArray === "function"){
			bindTapListener(element.toArray(), tapListeners, context)
		} else if (Element && element instanceof Element){
			//if it's an element, create a TapListener
			var tap = new TapListener(element, context)
			tapListeners.push(tap)
		} 
	}

	/**
	 * @param {AudioContext} context The AudioContext to start.
	 * @param {Array|String|Element|jQuery} elements For iOS, the list of elements
	 *                                               to bind tap event listeners
	 *                                               which will start the AudioContext.
	 * @param {Function=} callback The callback to invoke when the AudioContext is started.
	 * @return {Promise} The promise is invoked when the AudioContext
	 *                       is started.
	 */
	function StartAudioContext(context, elements, callback){

		//the promise is invoked when the AudioContext is started
		var promise = new Promise(function(success) {
			onStarted(context, success)
		})

		// The TapListeners bound to the elements
		var tapListeners = []

		// add all the tap listeners
		if (elements){
			bindTapListener(elements, tapListeners, context)
		}

		//dispose all these tap listeners when the context is started
		promise.then(function(){
			for (var i = 0; i < tapListeners.length; i++){
				tapListeners[i].dispose()
			}
			tapListeners = null

			if (callback){
				callback()
			}
		})

		return promise
	}

	return StartAudioContext
}))

/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(79);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(11)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./exit.scss", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./exit.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(81);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(11)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./insert_headset.scss", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./insert_headset.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(83);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(11)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./splash.scss", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./splash.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 105 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = {

	canvas: !! window.CanvasRenderingContext2D,
	webgl: ( function () {

		try {

			var canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );

		} catch ( e ) {

			return false;

		}

	} )(),
	workers: !! window.Worker,
	fileapi: window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage: function () {

		var element = document.createElement( 'div' );
		element.id = 'webgl-error-message';
		element.style.fontFamily = 'monospace';
		element.style.fontSize = '13px';
		element.style.fontWeight = 'normal';
		element.style.textAlign = 'center';
		element.style.background = '#fff';
		element.style.color = '#000';
		element.style.padding = '1.5em';
		element.style.width = '400px';
		element.style.margin = '5em auto 0';

		if ( ! this.webgl ) {

			element.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' ) : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' );

		}

		return element;

	},

	addGetWebGLMessage: function ( parameters ) {

		var parent, id, element;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		element = Detector.getWebGLErrorMessage();
		element.id = id;

		parent.appendChild( element );

	}

};

// browserify support
if ( true ) {

	module.exports = Detector;

}


/***/ }),
/* 106 */
/***/ (function(module, exports) {

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.EffectComposer = function ( renderer, renderTarget ) {

	this.renderer = renderer;

	if ( renderTarget === undefined ) {

		var parameters = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false
		};
		var size = renderer.getSize();
		renderTarget = new THREE.WebGLRenderTarget( size.width, size.height, parameters );

	}

	this.renderTarget1 = renderTarget;
	this.renderTarget2 = renderTarget.clone();

	this.writeBuffer = this.renderTarget1;
	this.readBuffer = this.renderTarget2;

	this.passes = [];

	if ( THREE.CopyShader === undefined )
		console.error( "THREE.EffectComposer relies on THREE.CopyShader" );

	this.copyPass = new THREE.ShaderPass( THREE.CopyShader );

};

Object.assign( THREE.EffectComposer.prototype, {

	swapBuffers: function() {

		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;

	},

	addPass: function ( pass ) {

		this.passes.push( pass );

		var size = this.renderer.getSize();
		pass.setSize( size.width, size.height );

	},

	insertPass: function ( pass, index ) {

		this.passes.splice( index, 0, pass );

	},

	render: function ( delta ) {

		var maskActive = false;

		var pass, i, il = this.passes.length;

		for ( i = 0; i < il; i ++ ) {

			pass = this.passes[ i ];

			if ( pass.enabled === false ) continue;

			pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );

			if ( pass.needsSwap ) {

				if ( maskActive ) {

					var context = this.renderer.context;

					context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

					this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );

					context.stencilFunc( context.EQUAL, 1, 0xffffffff );

				}

				this.swapBuffers();

			}

			if ( THREE.MaskPass !== undefined ) {

				if ( pass instanceof THREE.MaskPass ) {

					maskActive = true;

				} else if ( pass instanceof THREE.ClearMaskPass ) {

					maskActive = false;

				}

			}

		}

	},

	reset: function ( renderTarget ) {

		if ( renderTarget === undefined ) {

			var size = this.renderer.getSize();

			renderTarget = this.renderTarget1.clone();
			renderTarget.setSize( size.width, size.height );

		}

		this.renderTarget1.dispose();
		this.renderTarget2.dispose();
		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

	},

	setSize: function ( width, height ) {

		this.renderTarget1.setSize( width, height );
		this.renderTarget2.setSize( width, height );

		for ( var i = 0; i < this.passes.length; i ++ ) {

			this.passes[i].setSize( width, height );

		}

	}

} );


THREE.Pass = function () {

	// if set to true, the pass is processed by the composer
	this.enabled = true;

	// if set to true, the pass indicates to swap read and write buffer after rendering
	this.needsSwap = true;

	// if set to true, the pass clears its buffer before rendering
	this.clear = false;

	// if set to true, the result of the pass is rendered to screen
	this.renderToScreen = false;

};

Object.assign( THREE.Pass.prototype, {

	setSize: function( width, height ) {},

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		console.error( "THREE.Pass: .render() must be implemented in derived pass." );

	}

} );


/***/ }),
/* 107 */
/***/ (function(module, exports) {

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.RenderPass = function ( scene, camera, overrideMaterial, clearColor, clearAlpha ) {

	THREE.Pass.call( this );

	this.scene = scene;
	this.camera = camera;

	this.overrideMaterial = overrideMaterial;

	this.clearColor = clearColor;
	this.clearAlpha = ( clearAlpha !== undefined ) ? clearAlpha : 0;

	this.clear = true;
	this.clearDepth = false;
	this.needsSwap = false;

};

THREE.RenderPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.RenderPass,

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		var oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		this.scene.overrideMaterial = this.overrideMaterial;

		var oldClearColor, oldClearAlpha;

		if ( this.clearColor ) {

			oldClearColor = renderer.getClearColor().getHex();
			oldClearAlpha = renderer.getClearAlpha();

			renderer.setClearColor( this.clearColor, this.clearAlpha );

		}

		if ( this.clearDepth ) {

			renderer.clearDepth();

		}

		renderer.render( this.scene, this.camera, this.renderToScreen ? null : readBuffer, this.clear );

		if ( this.clearColor ) {

			renderer.setClearColor( oldClearColor, oldClearAlpha );

		}

		this.scene.overrideMaterial = null;
		renderer.autoClear = oldAutoClear;
	}

} );


/***/ }),
/* 108 */
/***/ (function(module, exports) {

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.ShaderPass = function ( shader, textureID ) {

	THREE.Pass.call( this );

	this.textureID = ( textureID !== undefined ) ? textureID : "tDiffuse";

	if ( shader instanceof THREE.ShaderMaterial ) {

		this.uniforms = shader.uniforms;

		this.material = shader;

	} else if ( shader ) {

		this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

		this.material = new THREE.ShaderMaterial( {

			defines: shader.defines || {},
			uniforms: this.uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader

		} );

	}

	this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene = new THREE.Scene();

	this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
	this.quad.frustumCulled = false; // Avoid getting clipped
	this.scene.add( this.quad );

};

THREE.ShaderPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.ShaderPass,

	render: function( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		if ( this.uniforms[ this.textureID ] ) {

			this.uniforms[ this.textureID ].value = readBuffer.texture;

		}

		this.quad.material = this.material;

		if ( this.renderToScreen ) {

			renderer.render( this.scene, this.camera );

		} else {

			renderer.render( this.scene, this.camera, writeBuffer, this.clear );

		}

	}

} );


/***/ }),
/* 109 */
/***/ (function(module, exports) {

/**
 * @author spidersharma / http://eduperiment.com/
 Inspired from Unreal Engine::
 https://docs.unrealengine.com/latest/INT/Engine/Rendering/PostProcessEffects/Bloom/
 */

THREE.UnrealBloomPass = function ( resolution, strength, radius, threshold ) {

	THREE.Pass.call( this );

	this.strength = ( strength !== undefined ) ? strength : 1;
	this.radius = radius;
	this.threshold = threshold;
	this.resolution = ( resolution !== undefined ) ? new THREE.Vector2(resolution.x, resolution.y) : new THREE.Vector2(256, 256);

	// render targets
	var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
	this.renderTargetsHorizontal = [];
	this.renderTargetsVertical = [];
	this.nMips = 5;
	var resx = Math.round(this.resolution.x/2);
	var resy = Math.round(this.resolution.y/2);

	this.renderTargetBright = new THREE.WebGLRenderTarget( resx, resy, pars );
	this.renderTargetBright.texture.generateMipmaps = false;

	for( var i=0; i<this.nMips; i++) {

		var renderTarget = new THREE.WebGLRenderTarget( resx, resy, pars );

		renderTarget.texture.generateMipmaps = false;

		this.renderTargetsHorizontal.push(renderTarget);

		var renderTarget = new THREE.WebGLRenderTarget( resx, resy, pars );

		renderTarget.texture.generateMipmaps = false;

		this.renderTargetsVertical.push(renderTarget);

		resx = Math.round(resx/2);

		resy = Math.round(resy/2);
	}

	// luminosity high pass material

	if ( THREE.LuminosityHighPassShader === undefined )
		console.error( "THREE.UnrealBloomPass relies on THREE.LuminosityHighPassShader" );

	var highPassShader = THREE.LuminosityHighPassShader;
	this.highPassUniforms = THREE.UniformsUtils.clone( highPassShader.uniforms );

	this.highPassUniforms[ "luminosityThreshold" ].value = threshold;
	this.highPassUniforms[ "smoothWidth" ].value = 0.01;

	this.materialHighPassFilter = new THREE.ShaderMaterial( {
		uniforms: this.highPassUniforms,
		vertexShader:  highPassShader.vertexShader,
		fragmentShader: highPassShader.fragmentShader,
		defines: {}
	} );

	// Gaussian Blur Materials
	this.separableBlurMaterials = [];
	var kernelSizeArray = [3, 5, 7, 9, 11];
	var resx = Math.round(this.resolution.x/2);
	var resy = Math.round(this.resolution.y/2);

	for( var i=0; i<this.nMips; i++) {

		this.separableBlurMaterials.push(this.getSeperableBlurMaterial(kernelSizeArray[i]));

		this.separableBlurMaterials[i].uniforms[ "texSize" ].value = new THREE.Vector2(resx, resy);

		resx = Math.round(resx/2);

		resy = Math.round(resy/2);
	}

	// Composite material
	this.compositeMaterial = this.getCompositeMaterial(this.nMips);
	this.compositeMaterial.uniforms["blurTexture1"].value = this.renderTargetsVertical[0].texture;
	this.compositeMaterial.uniforms["blurTexture2"].value = this.renderTargetsVertical[1].texture;
	this.compositeMaterial.uniforms["blurTexture3"].value = this.renderTargetsVertical[2].texture;
	this.compositeMaterial.uniforms["blurTexture4"].value = this.renderTargetsVertical[3].texture;
	this.compositeMaterial.uniforms["blurTexture5"].value = this.renderTargetsVertical[4].texture;
	this.compositeMaterial.uniforms["bloomStrength"].value = strength;
	this.compositeMaterial.uniforms["bloomRadius"].value = 0.1;
	this.compositeMaterial.needsUpdate = true;

	var bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
	this.compositeMaterial.uniforms["bloomFactors"].value = bloomFactors;
	this.bloomTintColors = [new THREE.Vector3(1,1,1), new THREE.Vector3(1,1,1), new THREE.Vector3(1,1,1)
												,new THREE.Vector3(1,1,1), new THREE.Vector3(1,1,1)];
	this.compositeMaterial.uniforms["bloomTintColors"].value = this.bloomTintColors;

	// copy material
	if ( THREE.CopyShader === undefined )
		console.error( "THREE.BloomPass relies on THREE.CopyShader" );

	var copyShader = THREE.CopyShader;

	this.copyUniforms = THREE.UniformsUtils.clone( copyShader.uniforms );
	this.copyUniforms[ "opacity" ].value = 1.0;

	this.materialCopy = new THREE.ShaderMaterial( {
		uniforms: this.copyUniforms,
		vertexShader: copyShader.vertexShader,
		fragmentShader: copyShader.fragmentShader,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		depthWrite: false,
		transparent: true
	} );

	this.enabled = true;
	this.needsSwap = false;

	this.oldClearColor = new THREE.Color();
	this.oldClearAlpha = 1;

	this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene  = new THREE.Scene();

	this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
	this.quad.frustumCulled = false; // Avoid getting clipped
	this.scene.add( this.quad );

};

THREE.UnrealBloomPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.UnrealBloomPass,

	dispose: function() {
		for( var i=0; i< this.renderTargetsHorizontal.length(); i++) {
			this.renderTargetsHorizontal[i].dispose();
		}
		for( var i=0; i< this.renderTargetsVertical.length(); i++) {
			this.renderTargetsVertical[i].dispose();
		}
		this.renderTargetBright.dispose();
	},

	setSize: function ( width, height ) {

		var resx = Math.round(width/2);
		var resy = Math.round(height/2);

		this.renderTargetBright.setSize(resx, resy);

		for( var i=0; i<this.nMips; i++) {

			this.renderTargetsHorizontal[i].setSize(resx, resy);
			this.renderTargetsVertical[i].setSize(resx, resy);

			this.separableBlurMaterials[i].uniforms[ "texSize" ].value = new THREE.Vector2(resx, resy);

			resx = Math.round(resx/2);
			resy = Math.round(resy/2);
		}
	},

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		this.oldClearColor.copy( renderer.getClearColor() );
		this.oldClearAlpha = renderer.getClearAlpha();
		var oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		renderer.setClearColor( new THREE.Color( 0, 0, 0 ), 0 );

		if ( maskActive ) renderer.context.disable( renderer.context.STENCIL_TEST );

		// 1. Extract Bright Areas
		this.highPassUniforms[ "tDiffuse" ].value = readBuffer.texture;
		this.highPassUniforms[ "luminosityThreshold" ].value = this.threshold;
		this.quad.material = this.materialHighPassFilter;
		renderer.render( this.scene, this.camera, this.renderTargetBright, true );

		// 2. Blur All the mips progressively
		var inputRenderTarget = this.renderTargetBright;

		for(var i=0; i<this.nMips; i++) {

			this.quad.material = this.separableBlurMaterials[i];

			this.separableBlurMaterials[i].uniforms[ "colorTexture" ].value = inputRenderTarget.texture;

			this.separableBlurMaterials[i].uniforms[ "direction" ].value = THREE.UnrealBloomPass.BlurDirectionX;

			renderer.render( this.scene, this.camera, this.renderTargetsHorizontal[i], true );

			this.separableBlurMaterials[i].uniforms[ "colorTexture" ].value = this.renderTargetsHorizontal[i].texture;

			this.separableBlurMaterials[i].uniforms[ "direction" ].value = THREE.UnrealBloomPass.BlurDirectionY;

			renderer.render( this.scene, this.camera, this.renderTargetsVertical[i], true );

			inputRenderTarget = this.renderTargetsVertical[i];
		}

		// Composite All the mips
		this.quad.material = this.compositeMaterial;
		this.compositeMaterial.uniforms["bloomStrength"].value = this.strength;
		this.compositeMaterial.uniforms["bloomRadius"].value = this.radius;
		this.compositeMaterial.uniforms["bloomTintColors"].value = this.bloomTintColors;
		renderer.render( this.scene, this.camera, this.renderTargetsHorizontal[0], true );

		// Blend it additively over the input texture
		this.quad.material = this.materialCopy;
		this.copyUniforms[ "tDiffuse" ].value = this.renderTargetsHorizontal[0].texture;

		if ( maskActive ) renderer.context.enable( renderer.context.STENCIL_TEST );

		renderer.render( this.scene, this.camera, readBuffer, false );

		renderer.setClearColor( this.oldClearColor, this.oldClearAlpha );
		renderer.autoClear = oldAutoClear;
	},

	getSeperableBlurMaterial: function(kernelRadius) {

		return new THREE.ShaderMaterial( {

			defines: {
				"KERNEL_RADIUS" : kernelRadius,
				"SIGMA" : kernelRadius
			},

			uniforms: {
				"colorTexture": { value: null },
				"texSize": 				{ value: new THREE.Vector2( 0.5, 0.5 ) },
				"direction": 				{ value: new THREE.Vector2( 0.5, 0.5 ) }
			},

			vertexShader:
				"varying vec2 vUv;\n\
				void main() {\n\
					vUv = uv;\n\
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
				}",

			fragmentShader:
				"#include <common>\
				varying vec2 vUv;\n\
				uniform sampler2D colorTexture;\n\
				uniform vec2 texSize;\
				uniform vec2 direction;\
				\
				float gaussianPdf(in float x, in float sigma) {\
					return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;\
				}\
				void main() {\n\
					vec2 invSize = 1.0 / texSize;\
					float fSigma = float(SIGMA);\
					float weightSum = gaussianPdf(0.0, fSigma);\
					vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;\
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {\
						float x = float(i);\
						float w = gaussianPdf(x, fSigma);\
						vec2 uvOffset = direction * invSize * x;\
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;\
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;\
						diffuseSum += (sample1 + sample2) * w;\
						weightSum += 2.0 * w;\
					}\
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);\n\
				}"
		} );
	},

	getCompositeMaterial: function(nMips) {

		return new THREE.ShaderMaterial( {

			defines:{
				"NUM_MIPS" : nMips
			},

			uniforms: {
				"blurTexture1": { value: null },
				"blurTexture2": { value: null },
				"blurTexture3": { value: null },
				"blurTexture4": { value: null },
				"blurTexture5": { value: null },
				"dirtTexture": { value: null },
				"bloomStrength" : { value: 1.0 },
				"bloomFactors" : { value: null },
				"bloomTintColors" : { value: null },
				"bloomRadius" : { value: 0.0 }
			},

			vertexShader:
				"varying vec2 vUv;\n\
				void main() {\n\
					vUv = uv;\n\
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
				}",

			fragmentShader:
				"varying vec2 vUv;\
				uniform sampler2D blurTexture1;\
				uniform sampler2D blurTexture2;\
				uniform sampler2D blurTexture3;\
				uniform sampler2D blurTexture4;\
				uniform sampler2D blurTexture5;\
				uniform sampler2D dirtTexture;\
				uniform float bloomStrength;\
				uniform float bloomRadius;\
				uniform float bloomFactors[NUM_MIPS];\
				uniform vec3 bloomTintColors[NUM_MIPS];\
				\
				float lerpBloomFactor(const in float factor) { \
					float mirrorFactor = 1.2 - factor;\
					return mix(factor, mirrorFactor, bloomRadius);\
				}\
				\
				void main() {\
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) + \
					 							 lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) + \
												 lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) + \
												 lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) + \
												 lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );\
				}"
		} );
	}

} );

THREE.UnrealBloomPass.BlurDirectionX = new THREE.Vector2( 1.0, 0.0 );
THREE.UnrealBloomPass.BlurDirectionY = new THREE.Vector2( 0.0, 1.0 );


/***/ }),
/* 110 */
/***/ (function(module, exports) {

/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Convolution shader
 * ported from o3d sample to WebGL / GLSL
 * http://o3d.googlecode.com/svn/trunk/samples/convolution.html
 */

THREE.ConvolutionShader = {

	defines: {

		"KERNEL_SIZE_FLOAT": "25.0",
		"KERNEL_SIZE_INT": "25"

	},

	uniforms: {

		"tDiffuse":        { value: null },
		"uImageIncrement": { value: new THREE.Vector2( 0.001953125, 0.0 ) },
		"cKernel":         { value: [] }

	},

	vertexShader: [

		"uniform vec2 uImageIncrement;",

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv - ( ( KERNEL_SIZE_FLOAT - 1.0 ) / 2.0 ) * uImageIncrement;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"uniform float cKernel[ KERNEL_SIZE_INT ];",

		"uniform sampler2D tDiffuse;",
		"uniform vec2 uImageIncrement;",

		"varying vec2 vUv;",

		"void main() {",

			"vec2 imageCoord = vUv;",
			"vec4 sum = vec4( 0.0, 0.0, 0.0, 0.0 );",

			"for( int i = 0; i < KERNEL_SIZE_INT; i ++ ) {",

				"sum += texture2D( tDiffuse, imageCoord ) * cKernel[ i ];",
				"imageCoord += uImageIncrement;",

			"}",

			"gl_FragColor = sum;",

		"}"


	].join( "\n" ),

	buildKernel: function ( sigma ) {

		// We lop off the sqrt(2 * pi) * sigma term, since we're going to normalize anyway.

		function gauss( x, sigma ) {

			return Math.exp( - ( x * x ) / ( 2.0 * sigma * sigma ) );

		}

		var i, values, sum, halfWidth, kMaxKernelSize = 25, kernelSize = 2 * Math.ceil( sigma * 3.0 ) + 1;

		if ( kernelSize > kMaxKernelSize ) kernelSize = kMaxKernelSize;
		halfWidth = ( kernelSize - 1 ) * 0.5;

		values = new Array( kernelSize );
		sum = 0.0;
		for ( i = 0; i < kernelSize; ++ i ) {

			values[ i ] = gauss( i - halfWidth, sigma );
			sum += values[ i ];

		}

		// normalize the kernel

		for ( i = 0; i < kernelSize; ++ i ) values[ i ] /= sum;

		return values;

	}

};


/***/ }),
/* 111 */
/***/ (function(module, exports) {

/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Full-screen textured quad shader
 */

THREE.CopyShader = {

	uniforms: {

		"tDiffuse": { value: null },
		"opacity":  { value: 1.0 }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"uniform float opacity;",

		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel = texture2D( tDiffuse, vUv );",
			"gl_FragColor = opacity * texel;",

		"}"

	].join( "\n" )

};


/***/ }),
/* 112 */
/***/ (function(module, exports) {

/**
 * @author bhouston / http://clara.io/
 *
 * Luminosity
 * http://en.wikipedia.org/wiki/Luminosity
 */

THREE.LuminosityHighPassShader = {

  shaderID: "luminosityHighPass",

	uniforms: {

		"tDiffuse": { type: "t", value: null },
		"luminosityThreshold": { type: "f", value: 1.0 },
		"smoothWidth": { type: "f", value: 1.0 },
		"defaultColor": { type: "c", value: new THREE.Color( 0x000000 ) },
		"defaultOpacity":  { type: "f", value: 0.0 }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",

			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform sampler2D tDiffuse;",
		"uniform vec3 defaultColor;",
		"uniform float defaultOpacity;",
		"uniform float luminosityThreshold;",
		"uniform float smoothWidth;",

		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel = texture2D( tDiffuse, vUv );",

			"vec3 luma = vec3( 0.299, 0.587, 0.114 );",

			"float v = dot( texel.xyz, luma );",

			"vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );",

			"float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );",

			"gl_FragColor = mix( outputColor, texel, alpha );",

		"}"

	].join("\n")

};


/***/ }),
/* 113 */,
/* 114 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;// TinyColor v1.4.1
// https://github.com/bgrins/TinyColor
// Brian Grinstead, MIT License

(function(Math) {

var trimLeft = /^\s+/,
    trimRight = /\s+$/,
    tinyCounter = 0,
    mathRound = Math.round,
    mathMin = Math.min,
    mathMax = Math.max,
    mathRandom = Math.random;

function tinycolor (color, opts) {

    color = (color) ? color : '';
    opts = opts || { };

    // If input is already a tinycolor, return itself
    if (color instanceof tinycolor) {
       return color;
    }
    // If we are called as a function, call using new instead
    if (!(this instanceof tinycolor)) {
        return new tinycolor(color, opts);
    }

    var rgb = inputToRGB(color);
    this._originalInput = color,
    this._r = rgb.r,
    this._g = rgb.g,
    this._b = rgb.b,
    this._a = rgb.a,
    this._roundA = mathRound(100*this._a) / 100,
    this._format = opts.format || rgb.format;
    this._gradientType = opts.gradientType;

    // Don't let the range of [0,255] come back in [0,1].
    // Potentially lose a little bit of precision here, but will fix issues where
    // .5 gets interpreted as half of the total, instead of half of 1
    // If it was supposed to be 128, this was already taken care of by `inputToRgb`
    if (this._r < 1) { this._r = mathRound(this._r); }
    if (this._g < 1) { this._g = mathRound(this._g); }
    if (this._b < 1) { this._b = mathRound(this._b); }

    this._ok = rgb.ok;
    this._tc_id = tinyCounter++;
}

tinycolor.prototype = {
    isDark: function() {
        return this.getBrightness() < 128;
    },
    isLight: function() {
        return !this.isDark();
    },
    isValid: function() {
        return this._ok;
    },
    getOriginalInput: function() {
      return this._originalInput;
    },
    getFormat: function() {
        return this._format;
    },
    getAlpha: function() {
        return this._a;
    },
    getBrightness: function() {
        //http://www.w3.org/TR/AERT#color-contrast
        var rgb = this.toRgb();
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    },
    getLuminance: function() {
        //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
        var rgb = this.toRgb();
        var RsRGB, GsRGB, BsRGB, R, G, B;
        RsRGB = rgb.r/255;
        GsRGB = rgb.g/255;
        BsRGB = rgb.b/255;

        if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
        if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
        if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
        return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
    },
    setAlpha: function(value) {
        this._a = boundAlpha(value);
        this._roundA = mathRound(100*this._a) / 100;
        return this;
    },
    toHsv: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
    },
    toHsvString: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
        return (this._a == 1) ?
          "hsv("  + h + ", " + s + "%, " + v + "%)" :
          "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
    },
    toHsl: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
    },
    toHslString: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
        return (this._a == 1) ?
          "hsl("  + h + ", " + s + "%, " + l + "%)" :
          "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
    },
    toHex: function(allow3Char) {
        return rgbToHex(this._r, this._g, this._b, allow3Char);
    },
    toHexString: function(allow3Char) {
        return '#' + this.toHex(allow3Char);
    },
    toHex8: function(allow4Char) {
        return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
    },
    toHex8String: function(allow4Char) {
        return '#' + this.toHex8(allow4Char);
    },
    toRgb: function() {
        return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
    },
    toRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
          "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
    },
    toPercentageRgb: function() {
        return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
    },
    toPercentageRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
          "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
    },
    toName: function() {
        if (this._a === 0) {
            return "transparent";
        }

        if (this._a < 1) {
            return false;
        }

        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
    },
    toFilter: function(secondColor) {
        var hex8String = '#' + rgbaToArgbHex(this._r, this._g, this._b, this._a);
        var secondHex8String = hex8String;
        var gradientType = this._gradientType ? "GradientType = 1, " : "";

        if (secondColor) {
            var s = tinycolor(secondColor);
            secondHex8String = '#' + rgbaToArgbHex(s._r, s._g, s._b, s._a);
        }

        return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
    },
    toString: function(format) {
        var formatSet = !!format;
        format = format || this._format;

        var formattedString = false;
        var hasAlpha = this._a < 1 && this._a >= 0;
        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");

        if (needsAlphaFormat) {
            // Special case for "transparent", all other non-alpha formats
            // will return rgba when there is transparency.
            if (format === "name" && this._a === 0) {
                return this.toName();
            }
            return this.toRgbString();
        }
        if (format === "rgb") {
            formattedString = this.toRgbString();
        }
        if (format === "prgb") {
            formattedString = this.toPercentageRgbString();
        }
        if (format === "hex" || format === "hex6") {
            formattedString = this.toHexString();
        }
        if (format === "hex3") {
            formattedString = this.toHexString(true);
        }
        if (format === "hex4") {
            formattedString = this.toHex8String(true);
        }
        if (format === "hex8") {
            formattedString = this.toHex8String();
        }
        if (format === "name") {
            formattedString = this.toName();
        }
        if (format === "hsl") {
            formattedString = this.toHslString();
        }
        if (format === "hsv") {
            formattedString = this.toHsvString();
        }

        return formattedString || this.toHexString();
    },
    clone: function() {
        return tinycolor(this.toString());
    },

    _applyModification: function(fn, args) {
        var color = fn.apply(null, [this].concat([].slice.call(args)));
        this._r = color._r;
        this._g = color._g;
        this._b = color._b;
        this.setAlpha(color._a);
        return this;
    },
    lighten: function() {
        return this._applyModification(lighten, arguments);
    },
    brighten: function() {
        return this._applyModification(brighten, arguments);
    },
    darken: function() {
        return this._applyModification(darken, arguments);
    },
    desaturate: function() {
        return this._applyModification(desaturate, arguments);
    },
    saturate: function() {
        return this._applyModification(saturate, arguments);
    },
    greyscale: function() {
        return this._applyModification(greyscale, arguments);
    },
    spin: function() {
        return this._applyModification(spin, arguments);
    },

    _applyCombination: function(fn, args) {
        return fn.apply(null, [this].concat([].slice.call(args)));
    },
    analogous: function() {
        return this._applyCombination(analogous, arguments);
    },
    complement: function() {
        return this._applyCombination(complement, arguments);
    },
    monochromatic: function() {
        return this._applyCombination(monochromatic, arguments);
    },
    splitcomplement: function() {
        return this._applyCombination(splitcomplement, arguments);
    },
    triad: function() {
        return this._applyCombination(triad, arguments);
    },
    tetrad: function() {
        return this._applyCombination(tetrad, arguments);
    }
};

// If input is an object, force 1 into "1.0" to handle ratios properly
// String input requires "1.0" as input, so 1 will be treated as 1
tinycolor.fromRatio = function(color, opts) {
    if (typeof color == "object") {
        var newColor = {};
        for (var i in color) {
            if (color.hasOwnProperty(i)) {
                if (i === "a") {
                    newColor[i] = color[i];
                }
                else {
                    newColor[i] = convertToPercentage(color[i]);
                }
            }
        }
        color = newColor;
    }

    return tinycolor(color, opts);
};

// Given a string or object, convert that input to RGB
// Possible string inputs:
//
//     "red"
//     "#f00" or "f00"
//     "#ff0000" or "ff0000"
//     "#ff000000" or "ff000000"
//     "rgb 255 0 0" or "rgb (255, 0, 0)"
//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
//
function inputToRGB(color) {

    var rgb = { r: 0, g: 0, b: 0 };
    var a = 1;
    var s = null;
    var v = null;
    var l = null;
    var ok = false;
    var format = false;

    if (typeof color == "string") {
        color = stringInputToObject(color);
    }

    if (typeof color == "object") {
        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
            rgb = rgbToRgb(color.r, color.g, color.b);
            ok = true;
            format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
            s = convertToPercentage(color.s);
            v = convertToPercentage(color.v);
            rgb = hsvToRgb(color.h, s, v);
            ok = true;
            format = "hsv";
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
            s = convertToPercentage(color.s);
            l = convertToPercentage(color.l);
            rgb = hslToRgb(color.h, s, l);
            ok = true;
            format = "hsl";
        }

        if (color.hasOwnProperty("a")) {
            a = color.a;
        }
    }

    a = boundAlpha(a);

    return {
        ok: ok,
        format: color.format || format,
        r: mathMin(255, mathMax(rgb.r, 0)),
        g: mathMin(255, mathMax(rgb.g, 0)),
        b: mathMin(255, mathMax(rgb.b, 0)),
        a: a
    };
}


// Conversion Functions
// --------------------

// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

// `rgbToRgb`
// Handle bounds / percentage checking to conform to CSS color spec
// <http://www.w3.org/TR/css3-color/>
// *Assumes:* r, g, b in [0, 255] or [0, 1]
// *Returns:* { r, g, b } in [0, 255]
function rgbToRgb(r, g, b){
    return {
        r: bound01(r, 255) * 255,
        g: bound01(g, 255) * 255,
        b: bound01(b, 255) * 255
    };
}

// `rgbToHsl`
// Converts an RGB color value to HSL.
// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
// *Returns:* { h, s, l } in [0,1]
function rgbToHsl(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return { h: h, s: s, l: l };
}

// `hslToRgb`
// Converts an HSL color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
function hslToRgb(h, s, l) {
    var r, g, b;

    h = bound01(h, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);

    function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    if(s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHsv`
// Converts an RGB color value to HSV
// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
// *Returns:* { h, s, v } in [0,1]
function rgbToHsv(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if(max == min) {
        h = 0; // achromatic
    }
    else {
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}

// `hsvToRgb`
// Converts an HSV color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
 function hsvToRgb(h, s, v) {

    h = bound01(h, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);

    var i = Math.floor(h),
        f = h - i,
        p = v * (1 - s),
        q = v * (1 - f * s),
        t = v * (1 - (1 - f) * s),
        mod = i % 6,
        r = [v, q, p, p, t, v][mod],
        g = [t, v, v, q, p, p][mod],
        b = [p, p, t, v, v, q][mod];

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHex`
// Converts an RGB color to hex
// Assumes r, g, and b are contained in the set [0, 255]
// Returns a 3 or 6 character hex
function rgbToHex(r, g, b, allow3Char) {

    var hex = [
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16))
    ];

    // Return a 3 character hex if possible
    if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    }

    return hex.join("");
}

// `rgbaToHex`
// Converts an RGBA color plus alpha transparency to hex
// Assumes r, g, b are contained in the set [0, 255] and
// a in [0, 1]. Returns a 4 or 8 character rgba hex
function rgbaToHex(r, g, b, a, allow4Char) {

    var hex = [
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16)),
        pad2(convertDecimalToHex(a))
    ];

    // Return a 4 character hex if possible
    if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
    }

    return hex.join("");
}

// `rgbaToArgbHex`
// Converts an RGBA color to an ARGB Hex8 string
// Rarely used, but required for "toFilter()"
function rgbaToArgbHex(r, g, b, a) {

    var hex = [
        pad2(convertDecimalToHex(a)),
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16))
    ];

    return hex.join("");
}

// `equals`
// Can be called with any tinycolor input
tinycolor.equals = function (color1, color2) {
    if (!color1 || !color2) { return false; }
    return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
};

tinycolor.random = function() {
    return tinycolor.fromRatio({
        r: mathRandom(),
        g: mathRandom(),
        b: mathRandom()
    });
};


// Modification Functions
// ----------------------
// Thanks to less.js for some of the basics here
// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

function desaturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s -= amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function saturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s += amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function greyscale(color) {
    return tinycolor(color).desaturate(100);
}

function lighten (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l += amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

function brighten(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var rgb = tinycolor(color).toRgb();
    rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
    rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
    rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
    return tinycolor(rgb);
}

function darken (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l -= amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
// Values outside of this range will be wrapped into this range.
function spin(color, amount) {
    var hsl = tinycolor(color).toHsl();
    var hue = (hsl.h + amount) % 360;
    hsl.h = hue < 0 ? 360 + hue : hue;
    return tinycolor(hsl);
}

// Combination Functions
// ---------------------
// Thanks to jQuery xColor for some of the ideas behind these
// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

function complement(color) {
    var hsl = tinycolor(color).toHsl();
    hsl.h = (hsl.h + 180) % 360;
    return tinycolor(hsl);
}

function triad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
    ];
}

function tetrad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
    ];
}

function splitcomplement(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
        tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
    ];
}

function analogous(color, results, slices) {
    results = results || 6;
    slices = slices || 30;

    var hsl = tinycolor(color).toHsl();
    var part = 360 / slices;
    var ret = [tinycolor(color)];

    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
        hsl.h = (hsl.h + part) % 360;
        ret.push(tinycolor(hsl));
    }
    return ret;
}

function monochromatic(color, results) {
    results = results || 6;
    var hsv = tinycolor(color).toHsv();
    var h = hsv.h, s = hsv.s, v = hsv.v;
    var ret = [];
    var modification = 1 / results;

    while (results--) {
        ret.push(tinycolor({ h: h, s: s, v: v}));
        v = (v + modification) % 1;
    }

    return ret;
}

// Utility Functions
// ---------------------

tinycolor.mix = function(color1, color2, amount) {
    amount = (amount === 0) ? 0 : (amount || 50);

    var rgb1 = tinycolor(color1).toRgb();
    var rgb2 = tinycolor(color2).toRgb();

    var p = amount / 100;

    var rgba = {
        r: ((rgb2.r - rgb1.r) * p) + rgb1.r,
        g: ((rgb2.g - rgb1.g) * p) + rgb1.g,
        b: ((rgb2.b - rgb1.b) * p) + rgb1.b,
        a: ((rgb2.a - rgb1.a) * p) + rgb1.a
    };

    return tinycolor(rgba);
};


// Readability Functions
// ---------------------
// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

// `contrast`
// Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
tinycolor.readability = function(color1, color2) {
    var c1 = tinycolor(color1);
    var c2 = tinycolor(color2);
    return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
};

// `isReadable`
// Ensure that foreground and background color combinations meet WCAG2 guidelines.
// The third argument is an optional Object.
//      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
//      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
// If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

// *Example*
//    tinycolor.isReadable("#000", "#111") => false
//    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
tinycolor.isReadable = function(color1, color2, wcag2) {
    var readability = tinycolor.readability(color1, color2);
    var wcag2Parms, out;

    out = false;

    wcag2Parms = validateWCAG2Parms(wcag2);
    switch (wcag2Parms.level + wcag2Parms.size) {
        case "AAsmall":
        case "AAAlarge":
            out = readability >= 4.5;
            break;
        case "AAlarge":
            out = readability >= 3;
            break;
        case "AAAsmall":
            out = readability >= 7;
            break;
    }
    return out;

};

// `mostReadable`
// Given a base color and a list of possible foreground or background
// colors for that base, returns the most readable color.
// Optionally returns Black or White if the most readable color is unreadable.
// *Example*
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
tinycolor.mostReadable = function(baseColor, colorList, args) {
    var bestColor = null;
    var bestScore = 0;
    var readability;
    var includeFallbackColors, level, size ;
    args = args || {};
    includeFallbackColors = args.includeFallbackColors ;
    level = args.level;
    size = args.size;

    for (var i= 0; i < colorList.length ; i++) {
        readability = tinycolor.readability(baseColor, colorList[i]);
        if (readability > bestScore) {
            bestScore = readability;
            bestColor = tinycolor(colorList[i]);
        }
    }

    if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
        return bestColor;
    }
    else {
        args.includeFallbackColors=false;
        return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
    }
};


// Big List of Colors
// ------------------
// <http://www.w3.org/TR/css3-color/#svg-color>
var names = tinycolor.names = {
    aliceblue: "f0f8ff",
    antiquewhite: "faebd7",
    aqua: "0ff",
    aquamarine: "7fffd4",
    azure: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "000",
    blanchedalmond: "ffebcd",
    blue: "00f",
    blueviolet: "8a2be2",
    brown: "a52a2a",
    burlywood: "deb887",
    burntsienna: "ea7e5d",
    cadetblue: "5f9ea0",
    chartreuse: "7fff00",
    chocolate: "d2691e",
    coral: "ff7f50",
    cornflowerblue: "6495ed",
    cornsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "0ff",
    darkblue: "00008b",
    darkcyan: "008b8b",
    darkgoldenrod: "b8860b",
    darkgray: "a9a9a9",
    darkgreen: "006400",
    darkgrey: "a9a9a9",
    darkkhaki: "bdb76b",
    darkmagenta: "8b008b",
    darkolivegreen: "556b2f",
    darkorange: "ff8c00",
    darkorchid: "9932cc",
    darkred: "8b0000",
    darksalmon: "e9967a",
    darkseagreen: "8fbc8f",
    darkslateblue: "483d8b",
    darkslategray: "2f4f4f",
    darkslategrey: "2f4f4f",
    darkturquoise: "00ced1",
    darkviolet: "9400d3",
    deeppink: "ff1493",
    deepskyblue: "00bfff",
    dimgray: "696969",
    dimgrey: "696969",
    dodgerblue: "1e90ff",
    firebrick: "b22222",
    floralwhite: "fffaf0",
    forestgreen: "228b22",
    fuchsia: "f0f",
    gainsboro: "dcdcdc",
    ghostwhite: "f8f8ff",
    gold: "ffd700",
    goldenrod: "daa520",
    gray: "808080",
    green: "008000",
    greenyellow: "adff2f",
    grey: "808080",
    honeydew: "f0fff0",
    hotpink: "ff69b4",
    indianred: "cd5c5c",
    indigo: "4b0082",
    ivory: "fffff0",
    khaki: "f0e68c",
    lavender: "e6e6fa",
    lavenderblush: "fff0f5",
    lawngreen: "7cfc00",
    lemonchiffon: "fffacd",
    lightblue: "add8e6",
    lightcoral: "f08080",
    lightcyan: "e0ffff",
    lightgoldenrodyellow: "fafad2",
    lightgray: "d3d3d3",
    lightgreen: "90ee90",
    lightgrey: "d3d3d3",
    lightpink: "ffb6c1",
    lightsalmon: "ffa07a",
    lightseagreen: "20b2aa",
    lightskyblue: "87cefa",
    lightslategray: "789",
    lightslategrey: "789",
    lightsteelblue: "b0c4de",
    lightyellow: "ffffe0",
    lime: "0f0",
    limegreen: "32cd32",
    linen: "faf0e6",
    magenta: "f0f",
    maroon: "800000",
    mediumaquamarine: "66cdaa",
    mediumblue: "0000cd",
    mediumorchid: "ba55d3",
    mediumpurple: "9370db",
    mediumseagreen: "3cb371",
    mediumslateblue: "7b68ee",
    mediumspringgreen: "00fa9a",
    mediumturquoise: "48d1cc",
    mediumvioletred: "c71585",
    midnightblue: "191970",
    mintcream: "f5fffa",
    mistyrose: "ffe4e1",
    moccasin: "ffe4b5",
    navajowhite: "ffdead",
    navy: "000080",
    oldlace: "fdf5e6",
    olive: "808000",
    olivedrab: "6b8e23",
    orange: "ffa500",
    orangered: "ff4500",
    orchid: "da70d6",
    palegoldenrod: "eee8aa",
    palegreen: "98fb98",
    paleturquoise: "afeeee",
    palevioletred: "db7093",
    papayawhip: "ffefd5",
    peachpuff: "ffdab9",
    peru: "cd853f",
    pink: "ffc0cb",
    plum: "dda0dd",
    powderblue: "b0e0e6",
    purple: "800080",
    rebeccapurple: "663399",
    red: "f00",
    rosybrown: "bc8f8f",
    royalblue: "4169e1",
    saddlebrown: "8b4513",
    salmon: "fa8072",
    sandybrown: "f4a460",
    seagreen: "2e8b57",
    seashell: "fff5ee",
    sienna: "a0522d",
    silver: "c0c0c0",
    skyblue: "87ceeb",
    slateblue: "6a5acd",
    slategray: "708090",
    slategrey: "708090",
    snow: "fffafa",
    springgreen: "00ff7f",
    steelblue: "4682b4",
    tan: "d2b48c",
    teal: "008080",
    thistle: "d8bfd8",
    tomato: "ff6347",
    turquoise: "40e0d0",
    violet: "ee82ee",
    wheat: "f5deb3",
    white: "fff",
    whitesmoke: "f5f5f5",
    yellow: "ff0",
    yellowgreen: "9acd32"
};

// Make it easy to access colors via `hexNames[hex]`
var hexNames = tinycolor.hexNames = flip(names);


// Utilities
// ---------

// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
function flip(o) {
    var flipped = { };
    for (var i in o) {
        if (o.hasOwnProperty(i)) {
            flipped[o[i]] = i;
        }
    }
    return flipped;
}

// Return a valid alpha value [0,1] with all invalid values being set to 1
function boundAlpha(a) {
    a = parseFloat(a);

    if (isNaN(a) || a < 0 || a > 1) {
        a = 1;
    }

    return a;
}

// Take input from [0, n] and return it as [0, 1]
function bound01(n, max) {
    if (isOnePointZero(n)) { n = "100%"; }

    var processPercent = isPercentage(n);
    n = mathMin(max, mathMax(0, parseFloat(n)));

    // Automatically convert percentage into number
    if (processPercent) {
        n = parseInt(n * max, 10) / 100;
    }

    // Handle floating point rounding errors
    if ((Math.abs(n - max) < 0.000001)) {
        return 1;
    }

    // Convert into [0, 1] range if it isn't already
    return (n % max) / parseFloat(max);
}

// Force a number between 0 and 1
function clamp01(val) {
    return mathMin(1, mathMax(0, val));
}

// Parse a base-16 hex value into a base-10 integer
function parseIntFromHex(val) {
    return parseInt(val, 16);
}

// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
function isOnePointZero(n) {
    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
}

// Check to see if string passed in is a percentage
function isPercentage(n) {
    return typeof n === "string" && n.indexOf('%') != -1;
}

// Force a hex value to have 2 characters
function pad2(c) {
    return c.length == 1 ? '0' + c : '' + c;
}

// Replace a decimal with it's percentage value
function convertToPercentage(n) {
    if (n <= 1) {
        n = (n * 100) + "%";
    }

    return n;
}

// Converts a decimal to a hex value
function convertDecimalToHex(d) {
    return Math.round(parseFloat(d) * 255).toString(16);
}
// Converts a hex value to a decimal
function convertHexToDecimal(h) {
    return (parseIntFromHex(h) / 255);
}

var matchers = (function() {

    // <http://www.w3.org/TR/css3-values/#integers>
    var CSS_INTEGER = "[-\\+]?\\d+%?";

    // <http://www.w3.org/TR/css3-values/#number-value>
    var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

    // Actual matching.
    // Parentheses and commas are optional, but not required.
    // Whitespace can take the place of commas or opening paren
    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

    return {
        CSS_UNIT: new RegExp(CSS_UNIT),
        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
    };
})();

// `isValidCSSUnit`
// Take in a single string / number and check to see if it looks like a CSS unit
// (see `matchers` above for definition).
function isValidCSSUnit(color) {
    return !!matchers.CSS_UNIT.exec(color);
}

// `stringInputToObject`
// Permissive string parsing.  Take in a number of formats, and output an object
// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
function stringInputToObject(color) {

    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
    var named = false;
    if (names[color]) {
        color = names[color];
        named = true;
    }
    else if (color == 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0, format: "name" };
    }

    // Try to match string input using regular expressions.
    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
    // Just return an object and let the conversion functions handle that.
    // This way the result will be the same whether the tinycolor is initialized with string or object.
    var match;
    if ((match = matchers.rgb.exec(color))) {
        return { r: match[1], g: match[2], b: match[3] };
    }
    if ((match = matchers.rgba.exec(color))) {
        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    if ((match = matchers.hsl.exec(color))) {
        return { h: match[1], s: match[2], l: match[3] };
    }
    if ((match = matchers.hsla.exec(color))) {
        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    if ((match = matchers.hsv.exec(color))) {
        return { h: match[1], s: match[2], v: match[3] };
    }
    if ((match = matchers.hsva.exec(color))) {
        return { h: match[1], s: match[2], v: match[3], a: match[4] };
    }
    if ((match = matchers.hex8.exec(color))) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            a: convertHexToDecimal(match[4]),
            format: named ? "name" : "hex8"
        };
    }
    if ((match = matchers.hex6.exec(color))) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            format: named ? "name" : "hex"
        };
    }
    if ((match = matchers.hex4.exec(color))) {
        return {
            r: parseIntFromHex(match[1] + '' + match[1]),
            g: parseIntFromHex(match[2] + '' + match[2]),
            b: parseIntFromHex(match[3] + '' + match[3]),
            a: convertHexToDecimal(match[4] + '' + match[4]),
            format: named ? "name" : "hex8"
        };
    }
    if ((match = matchers.hex3.exec(color))) {
        return {
            r: parseIntFromHex(match[1] + '' + match[1]),
            g: parseIntFromHex(match[2] + '' + match[2]),
            b: parseIntFromHex(match[3] + '' + match[3]),
            format: named ? "name" : "hex"
        };
    }

    return false;
}

function validateWCAG2Parms(parms) {
    // return valid WCAG2 parms for isReadable.
    // If input parms are invalid, return {"level":"AA", "size":"small"}
    var level, size;
    parms = parms || {"level":"AA", "size":"small"};
    level = (parms.level || "AA").toUpperCase();
    size = (parms.size || "small").toLowerCase();
    if (level !== "AA" && level !== "AAA") {
        level = "AA";
    }
    if (size !== "small" && size !== "large") {
        size = "small";
    }
    return {"level":level, "size":size};
}

// Node: Export function
if (typeof module !== "undefined" && module.exports) {
    module.exports = tinycolor;
}
// AMD/requirejs: Define the module
else if (true) {
    !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {return tinycolor;}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
}
// Browser: Expose to window
else {
    window.tinycolor = tinycolor;
}

})(Math);


/***/ }),
/* 115 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(37)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  Tone.Meter gets the [RMS](https://en.wikipedia.org/wiki/Root_mean_square)
	 *          of an input signal with some averaging applied. It can also get the raw 
	 *          value of the input signal.
	 *
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {String} type Either "level" or "signal". 
	 *  @param {Number} smoothing The amount of smoothing applied between frames.
	 *  @example
	 * var meter = new Tone.Meter();
	 * var mic = new Tone.UserMedia().open();
	 * //connect mic to the meter
	 * mic.connect(meter);
	 * //the current level of the mic input
	 * var level = meter.value;
	 */
	Tone.Meter = function(){

		var options = Tone.defaults(arguments, ["type", "smoothing"], Tone.Meter);
		Tone.call(this);
		
		/**
		 *  The type of the meter, either "level" or "signal". 
		 *  A "level" meter will return the volume level (rms) of the 
		 *  input signal and a "signal" meter will return
		 *  the signal value of the input. 
		 *  @type  {String}
		 */
		this.type = options.type;

		/**
		 *  The analyser node which computes the levels.
		 *  @private
		 *  @type  {Tone.Analyser}
		 */
		this.input = this.output = this._analyser = new Tone.Analyser("waveform", 512);

		/**
		 *  The amount of carryover between the current and last frame. 
		 *  Only applied meter for "level" type.
		 *  @type  {Number}
		 */
		this.smoothing = options.smoothing;

		/**
		 *  The last computed value
		 *  @type {Number}
		 *  @private
		 */
		this._lastValue = 0;
	};

	Tone.extend(Tone.Meter);

	/**
	 *  @private
	 *  @enum {String}
	 */
	Tone.Meter.Type = {
		Level : "level",
		Signal : "signal"
	};

	/**
	 *  The defaults
	 *  @type {Object}
	 *  @static
	 *  @const
	 */
	Tone.Meter.defaults = {
		"smoothing" : 0.8,
		"type" : Tone.Meter.Type.Level
	};

	/**
	 * The current value of the meter. A value of 1 is
	 * "unity".
	 * @memberOf Tone.Meter#
	 * @type {Number}
	 * @name value
	 * @readOnly
	 */
	Object.defineProperty(Tone.Meter.prototype, "value", {
		get : function(){
			var signal = this._analyser.analyse();
			if (this.type === Tone.Meter.Type.Level){
				//rms
				var sum = 0;
				for (var i = 0; i < signal.length; i++){
					sum += Math.pow(signal[i], 2);
				}
				var rms = Math.sqrt(sum / signal.length);
				//smooth it
				rms = Math.max(rms, this._lastValue * this.smoothing);
				this._lastValue = rms;
				//scale it
				var unity = 0.35;
				var val = rms / unity;
				//scale the output curve
				return Math.sqrt(val);
			} else {
				return signal[0];
			}
		},
	});

	/**
	 *  Clean up.
	 *  @returns {Tone.Meter} this
	 */
	Tone.Meter.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._analyser.dispose();
		this._analyser = null;
		return this;
	};

	return Tone.Meter;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(38), __webpack_require__(39), __webpack_require__(40), 
	__webpack_require__(2), __webpack_require__(24), __webpack_require__(47)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  A spatialized panner node which supports equalpower or HRTF panning.
	 *          Tries to normalize the API across various browsers. See Tone.Listener
	 *  
	 *  @constructor
	 *  @extends {Tone}
	 *  @param {Number} positionX The initial x position.
	 *  @param {Number} positionY The initial y position.
	 *  @param {Number} positionZ The initial z position.
	 */
	Tone.Panner3D = function(){

		var options = Tone.defaults(arguments, ["positionX", "positionY", "positionZ"], Tone.Panner3D);
		Tone.call(this);

		/**
		 *  The panner node
		 *  @type {PannerNode}
		 *  @private
		 */
		this._panner = this.input = this.output = this.context.createPanner();
		//set some values
		this._panner.panningModel = options.panningModel;
		this._panner.maxDistance = options.maxDistance;
		this._panner.distanceModel = options.distanceModel;
		this._panner.coneOuterGain = options.coneOuterGain;
		this._panner.coneOuterAngle = options.coneOuterAngle;
		this._panner.coneInnerAngle = options.coneInnerAngle;
		this._panner.refDistance = options.refDistance;
		this._panner.rolloffFactor = options.rolloffFactor;

		/**
		 *  Holds the current orientation
		 *  @type  {Array}
		 *  @private
		 */
		this._orientation = [options.orientationX, options.orientationY, options.orientationZ];

		/**
		 *  Holds the current position
		 *  @type  {Array}
		 *  @private
		 */
		this._position = [options.positionX, options.positionY, options.positionZ];

		// set the default position/orientation
		this.orientationX = options.orientationX;
		this.orientationY = options.orientationY;
		this.orientationZ = options.orientationZ;
		this.positionX = options.positionX;
		this.positionY = options.positionY;
		this.positionZ = options.positionZ;
	};

	Tone.extend(Tone.Panner3D);

	/**
	 *  Defaults according to the specification
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Tone.Panner3D.defaults = {
		"positionX" : 0,
		"positionY" : 0,
		"positionZ" : 0,
		"orientationX" : 0,
		"orientationY" : 0,
		"orientationZ" : 0,
		"panningModel" : "equalpower",
		"maxDistance" : 10000,
		"distanceModel" : "inverse",
		"coneOuterGain" : 0,
		"coneOuterAngle" : 360,
		"coneInnerAngle" : 360,
		"refDistance" : 1,
		"rolloffFactor" : 1
	};

	/**
	 * The ramp time which is applied to the setTargetAtTime
	 * @type {Number}
	 * @private
	 */
	Tone.Panner3D.prototype._rampTimeConstant = 0.01;

	/**
	 *  Sets the position of the source in 3d space.	
	 *  @param  {Number}  x
	 *  @param  {Number}  y
	 *  @param  {Number}  z
	 *  @return {Tone.Panner3D} this
	 */
	Tone.Panner3D.prototype.setPosition = function(x, y, z){
		if (this._panner.positionX){
			var now = this.now();
			this._panner.positionX.setTargetAtTime(x, now, this._rampTimeConstant);
			this._panner.positionY.setTargetAtTime(y, now, this._rampTimeConstant);
			this._panner.positionZ.setTargetAtTime(z, now, this._rampTimeConstant);
		} else {
			this._panner.setPosition(x, y, z);
		}
		this._position = Array.prototype.slice.call(arguments);
		return this;
	};

	/**
	 *  Sets the orientation of the source in 3d space.	
	 *  @param  {Number}  x
	 *  @param  {Number}  y
	 *  @param  {Number}  z
	 *  @return {Tone.Panner3D} this
	 */
	Tone.Panner3D.prototype.setOrientation = function(x, y, z){
		if (this._panner.orientationX){
			var now = this.now();
			this._panner.orientationX.setTargetAtTime(x, now, this._rampTimeConstant);
			this._panner.orientationY.setTargetAtTime(y, now, this._rampTimeConstant);
			this._panner.orientationZ.setTargetAtTime(z, now, this._rampTimeConstant);
		} else {
			this._panner.setOrientation(x, y, z);
		}
		this._orientation = Array.prototype.slice.call(arguments);
		return this;
	};

	/**
	 *  The x position of the panner object.
	 *  @type {Number}
	 *  @memberOf Tone.Panner3D#
	 *  @name positionX
	 */
	Object.defineProperty(Tone.Panner3D.prototype, "positionX", {
		set : function(pos){
			this._position[0] = pos;
			this.setPosition.apply(this, this._position);
		},
		get : function(){
			return this._position[0];
		}
	});

	/**
	 *  The y position of the panner object.
	 *  @type {Number}
	 *  @memberOf Tone.Panner3D#
	 *  @name positionY
	 */
	Object.defineProperty(Tone.Panner3D.prototype, "positionY", {
		set : function(pos){
			this._position[1] = pos;
			this.setPosition.apply(this, this._position);
		},
		get : function(){
			return this._position[1];
		}
	});

	/**
	 *  The z position of the panner object.
	 *  @type {Number}
	 *  @memberOf Tone.Panner3D#
	 *  @name positionZ
	 */
	Object.defineProperty(Tone.Panner3D.prototype, "positionZ", {
		set : function(pos){
			this._position[2] = pos;
			this.setPosition.apply(this, this._position);
		},
		get : function(){
			return this._position[2];
		}
	});

	/**
	 *  The x orientation of the panner object.
	 *  @type {Number}
	 *  @memberOf Tone.Panner3D#
	 *  @name orientationX
	 */
	Object.defineProperty(Tone.Panner3D.prototype, "orientationX", {
		set : function(pos){
			this._orientation[0] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[0];
		}
	});

	/**
	 *  The y orientation of the panner object.
	 *  @type {Number}
	 *  @memberOf Tone.Panner3D#
	 *  @name orientationY
	 */
	Object.defineProperty(Tone.Panner3D.prototype, "orientationY", {
		set : function(pos){
			this._orientation[1] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[1];
		}
	});

	/**
	 *  The z orientation of the panner object.
	 *  @type {Number}
	 *  @memberOf Tone.Panner3D#
	 *  @name orientationZ
	 */
	Object.defineProperty(Tone.Panner3D.prototype, "orientationZ", {
		set : function(pos){
			this._orientation[2] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[2];
		}
	});

	/**
	 *  Proxy a property on the panner to an exposed public propery
	 *  @param  {String}  prop
	 *  @private
	 */
	Tone.Panner3D._aliasProperty = function(prop){
		Object.defineProperty(Tone.Panner3D.prototype, prop, {
			set : function(val){
				this._panner[prop] = val;
			},
			get : function(){
				return this._panner[prop];
			}
		});
	};

	/**
	 *  The panning model. Either "equalpower" or "HRTF".
	 *  @type {String}
	 *  @memberOf Tone.Panner3D#
	 *  @name panningModel
	 */
	Tone.Panner3D._aliasProperty("panningModel");

	/**
	 *  A reference distance for reducing volume as source move further from the listener
	 *  @type {Number}
	 *  @memberOf Tone.Panner3D#
	 *  @name refDistance
	 */
	Tone.Panner3D._aliasProperty("refDistance");

	/**
	 *  Describes how quickly the volume is reduced as source moves away from listener.
	 *  @type {Number}
	 *  @memberOf Tone.Panner3D#
	 *  @name rolloffFactor
	 */
	Tone.Panner3D._aliasProperty("rolloffFactor");

	/**
	 *  The distance model used by,  "linear", "inverse", or "exponential".
	 *  @type {String}
	 *  @memberOf Tone.Panner3D#
	 *  @name distanceModel
	 */
	Tone.Panner3D._aliasProperty("distanceModel");

	/**
	 *  The angle, in degrees, inside of which there will be no volume reduction
	 *  @type {Degrees}
	 *  @memberOf Tone.Panner3D#
	 *  @name coneInnerAngle
	 */
	Tone.Panner3D._aliasProperty("coneInnerAngle");

	/**
	 *  The angle, in degrees, outside of which the volume will be reduced 
	 *  to a constant value of coneOuterGain
	 *  @type {Degrees}
	 *  @memberOf Tone.Panner3D#
	 *  @name coneOuterAngle
	 */
	Tone.Panner3D._aliasProperty("coneOuterAngle");

	/**
	 *  The gain outside of the coneOuterAngle
	 *  @type {Gain}
	 *  @memberOf Tone.Panner3D#
	 *  @name coneOuterGain
	 */
	Tone.Panner3D._aliasProperty("coneOuterGain");

	/**
	 *  The maximum distance between source and listener, 
	 *  after which the volume will not be reduced any further.
	 *  @type {Positive}
	 *  @memberOf Tone.Panner3D#
	 *  @name maxDistance
	 */
	Tone.Panner3D._aliasProperty("maxDistance");

	/**
	 *  Clean up.
	 *  @returns {Tone.Panner3D} this
	 */
	Tone.Panner3D.prototype.dispose = function(){
		this._panner.disconnect();
		this._panner = null;
		this._orientation = null;
		this._position = null;
		return this;
	};

	return Tone.Panner3D;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(5)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	/**
	 *  @class A data structure for holding multiple buffers.
	 *  
	 *  @param  {Object|Array}    urls      An object literal or array
	 *                                      of urls to load.
	 *  @param  {Function=}  callback  The callback to invoke when
	 *                                 the buffers are loaded. 
	 *  @extends {Tone}
	 *  @example
	 * //load a whole bank of piano samples
	 * var pianoSamples = new Tone.Buffers({
	 * 	"C4" : "path/to/C4.mp3"
	 * 	"C#4" : "path/to/C#4.mp3"
	 * 	"D4" : "path/to/D4.mp3"
	 * 	"D#4" : "path/to/D#4.mp3"
	 * 	...
	 * }, function(){
	 * 	//play one of the samples when they all load
	 * 	player.buffer = pianoSamples.get("C4");
	 * 	player.start();
	 * });
	 * 	@example
	 * //To pass in additional parameters in the second parameter
	 * var buffers = new Tone.Buffers(urls, {
	 * 	"onload" : callback,
	 * 	"baseUrl" : "../path/to/audio/"
	 * })
	 */
	Tone.Buffers = function(urls){

		//remove the urls from the options
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		var options = Tone.defaults(args, ["onload", "baseUrl"], Tone.Buffers);
		Tone.call(this);

		/**
		 *  All of the buffers
		 *  @type  {Object}
		 *  @private
		 */
		this._buffers = {};

		/**
		 *  A path which is prefixed before every url.
		 *  @type  {String}
		 */
		this.baseUrl = options.baseUrl;

		this._loadingCount = 0;
		//add each one
		for (var key in urls){
			this._loadingCount++;
			this.add(key, urls[key], this._bufferLoaded.bind(this, options.onload));
		}
	};

	Tone.extend(Tone.Buffers);

	/**
	 *  Defaults
	 *  @type  {Object}
	 */
	Tone.Buffers.defaults = {
		"onload" : Tone.noOp,
		"baseUrl" : ""
	};

	/**
	 *  True if the buffers object has a buffer by that name.
	 *  @param  {String|Number}  name  The key or index of the 
	 *                                 buffer.
	 *  @return  {Boolean}
	 */
	Tone.Buffers.prototype.has = function(name){
		return this._buffers.hasOwnProperty(name);
	};

	/**
	 *  Get a buffer by name. If an array was loaded, 
	 *  then use the array index.
	 *  @param  {String|Number}  name  The key or index of the 
	 *                                 buffer.
	 *  @return  {Tone.Buffer}
	 */
	Tone.Buffers.prototype.get = function(name){
		if (this.has(name)){
			return this._buffers[name];
		} else {
			throw new Error("Tone.Buffers: no buffer named "+name);
		}
	};

	/**
	 *  A buffer was loaded. decrement the counter.
	 *  @param  {Function}  callback 
	 *  @private
	 */
	Tone.Buffers.prototype._bufferLoaded = function(callback){
		this._loadingCount--;
		if (this._loadingCount === 0 && callback){
			callback(this);
		}
	};

	/**
	 * If the buffers are loaded or not
	 * @memberOf Tone.Buffers#
	 * @type {Boolean}
	 * @name loaded
	 * @readOnly
	 */
	Object.defineProperty(Tone.Buffers.prototype, "loaded", {
		get : function(){
			var isLoaded = true;
			for (var buffName in this._buffers){
				var buff = this.get(buffName);
				isLoaded = isLoaded && buff.loaded;
			}
			return isLoaded;
		}
	});

	/**
	 *  Add a buffer by name and url to the Buffers
	 *  @param  {String}    name      A unique name to give
	 *                                the buffer
	 *  @param  {String|Tone.Buffer|Audiobuffer}  url  Either the url of the bufer, 
	 *                                                 or a buffer which will be added
	 *                                                 with the given name.
	 *  @param  {Function=}  callback  The callback to invoke 
	 *                                 when the url is loaded.
	 */
	Tone.Buffers.prototype.add = function(name, url, callback){
		callback = Tone.defaultArg(callback, Tone.noOp);
		if (url instanceof Tone.Buffer){
			this._buffers[name] = url;
			callback(this);
		} else if (url instanceof AudioBuffer){
			this._buffers[name] = new Tone.Buffer(url);
			callback(this);
		} else if (Tone.isString(url)){
			this._buffers[name] = new Tone.Buffer(this.baseUrl + url, callback);
		}
		return this;
	};

	/**
	 *  Clean up.
	 *  @return  {Tone.Buffers} this
	 */
	Tone.Buffers.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		for (var name in this._buffers){
			this._buffers[name].dispose();
		}
		this._buffers = null;
		return this;
	};

	return Tone.Buffers;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(127), __webpack_require__(42), 
	__webpack_require__(15), __webpack_require__(23)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	"use strict";

	/**
	 *  @class  A sample accurate clock which provides a callback at the given rate. 
	 *          While the callback is not sample-accurate (it is still susceptible to
	 *          loose JS timing), the time passed in as the argument to the callback
	 *          is precise. For most applications, it is better to use Tone.Transport
	 *          instead of the Clock by itself since you can synchronize multiple callbacks.
	 *
	 * 	@constructor
	 *  @extends {Tone.Emitter}
	 * 	@param {function} callback The callback to be invoked with the time of the audio event
	 * 	@param {Frequency} frequency The rate of the callback
	 * 	@example
	 * //the callback will be invoked approximately once a second
	 * //and will print the time exactly once a second apart.
	 * var clock = new Tone.Clock(function(time){
	 * 	console.log(time);
	 * }, 1);
	 */
	Tone.Clock = function(){

		var options = Tone.defaults(arguments, ["callback", "frequency"], Tone.Clock);
		Tone.Emitter.call(this);

		/**
		 *  The callback function to invoke at the scheduled tick.
		 *  @type  {Function}
		 */
		this.callback = options.callback;

		/**
		 *  The next time the callback is scheduled.
		 *  @type {Number}
		 *  @private
		 */
		this._nextTick = 0;

		/**
		 *  The last state of the clock.
		 *  @type  {State}
		 *  @private
		 */
		this._lastState = Tone.State.Stopped;

		/**
		 *  The rate the callback function should be invoked. 
		 *  @type  {BPM}
		 *  @signal
		 */
		this.frequency = new Tone.TickSignal(options.frequency, Tone.Type.Frequency);
		this._readOnly("frequency");

		/**
		 *  The number of times the callback was invoked. Starts counting at 0
		 *  and increments after the callback was invoked. 
		 *  @type {Ticks}
		 *  @readOnly
		 */
		this.ticks = 0;

		/**
		 *  The state timeline
		 *  @type {Tone.TimelineState}
		 *  @private
		 */
		this._state = new Tone.TimelineState(Tone.State.Stopped);

		/**
		 *  The loop function bound to its context. 
		 *  This is necessary to remove the event in the end.
		 *  @type {Function}
		 *  @private
		 */
		this._boundLoop = this._loop.bind(this);

		//bind a callback to the worker thread
    	this.context.on("tick", this._boundLoop);
	};

	Tone.extend(Tone.Clock, Tone.Emitter);

	/**
	 *  The defaults
	 *  @const
	 *  @type  {Object}
	 */
	Tone.Clock.defaults = {
		"callback" : Tone.noOp,
		"frequency" : 1,
	};

	/**
	 *  Returns the playback state of the source, either "started", "stopped" or "paused".
	 *  @type {Tone.State}
	 *  @readOnly
	 *  @memberOf Tone.Clock#
	 *  @name state
	 */
	Object.defineProperty(Tone.Clock.prototype, "state", {
		get : function(){
			return this._state.getValueAtTime(this.now());
		}
	});

	/**
	 *  Start the clock at the given time. Optionally pass in an offset
	 *  of where to start the tick counter from.
	 *  @param  {Time=}  time    The time the clock should start
	 *  @param  {Ticks=}  offset  Where the tick counter starts counting from.
	 *  @return  {Tone.Clock}  this
	 */
	Tone.Clock.prototype.start = function(time, offset){
		time = this.toSeconds(time);
		if (this._state.getValueAtTime(time) !== Tone.State.Started){
			this._state.setStateAtTime(Tone.State.Started, time);
			this._state.get(time).offset = offset;
		}
		return this;	
	};

	/**
	 *  Stop the clock. Stopping the clock resets the tick counter to 0.
	 *  @param {Time} [time=now] The time when the clock should stop.
	 *  @returns {Tone.Clock} this
	 *  @example
	 * clock.stop();
	 */
	Tone.Clock.prototype.stop = function(time){
		time = this.toSeconds(time);
		this._state.cancel(time);
		this._state.setStateAtTime(Tone.State.Stopped, time);
		return this;	
	};


	/**
	 *  Pause the clock. Pausing does not reset the tick counter.
	 *  @param {Time} [time=now] The time when the clock should stop.
	 *  @returns {Tone.Clock} this
	 */
	Tone.Clock.prototype.pause = function(time){
		time = this.toSeconds(time);
		if (this._state.getValueAtTime(time) === Tone.State.Started){
			this._state.setStateAtTime(Tone.State.Paused, time);
		}
		return this;	
	};

	/**
	 *  The scheduling loop.
	 *  @private
	 */
	Tone.Clock.prototype._loop = function(){

		//the end of the update interval
		var endTime = this.now() + this.context.updateInterval;

		//the current event at the time of the loop
		var event = this._state.get(endTime);

		if (event){
			//state change events
			if (event.state !== this._lastState){
				this._lastState = event.state;
				switch(event.state){
					case Tone.State.Started:
						if (!Tone.isUndef(event.offset)){
							this.ticks = event.offset;
						}
						this._nextTick = event.time;
						this.emit("start", event.time, this.ticks);
						break;
					case Tone.State.Stopped:
						this.ticks = 0;
						this.emit("stop", event.time);
						break;
					case Tone.State.Paused:
						this.emit("pause", event.time);
						break;
				}
			}

			//all the tick events
			while(endTime > this._nextTick && this._state){
				var tickTime = this._nextTick;
				if (this.frequency){
					this._nextTick += this.frequency.getDurationOfTicks(1, this._nextTick);
					if (event.state === Tone.State.Started){
						try {
							this.callback(tickTime);
							this.ticks++;
						} catch(e){
							this.ticks++;
							throw e;
						}
					}
				}
			}
		}
	};

	/**
	 *  Returns the scheduled state at the given time.
	 *  @param  {Time}  time  The time to query.
	 *  @return  {String}  The name of the state input in setStateAtTime.
	 *  @example
	 * clock.start("+0.1");
	 * clock.getStateAtTime("+0.1"); //returns "started"
	 */
	Tone.Clock.prototype.getStateAtTime = function(time){
		time = this.toSeconds(time);
		return this._state.getValueAtTime(time);
	};

	/**
	 *  Clean up
	 *  @returns {Tone.Clock} this
	 */
	Tone.Clock.prototype.dispose = function(){
		Tone.Emitter.prototype.dispose.call(this);
		this.context.off("tick", this._boundLoop);
		this._writable("frequency");
		this.frequency.dispose();
		this.frequency = null;
		this._boundLoop = null;
		this._nextTick = Infinity;
		this.callback = null;
		this._state.dispose();
		this._state = null;
	};

	return Tone.Clock;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(8)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	"use strict";

	/**
	 *  @class Similar to Tone.Timeline, but all events represent
	 *         intervals with both "time" and "duration" times. The 
	 *         events are placed in a tree structure optimized
	 *         for querying an intersection point with the timeline
	 *         events. Internally uses an [Interval Tree](https://en.wikipedia.org/wiki/Interval_tree)
	 *         to represent the data.
	 *  @extends {Tone}
	 */
	Tone.IntervalTimeline = function(){

		Tone.call(this);

		/**
		 *  The root node of the inteval tree
		 *  @type  {IntervalNode}
		 *  @private
		 */
		this._root = null;

		/**
		 *  Keep track of the length of the timeline.
		 *  @type  {Number}
		 *  @private
		 */
		this._length = 0;
	};

	Tone.extend(Tone.IntervalTimeline);

	/**
	 *  The event to add to the timeline. All events must 
	 *  have a time and duration value
	 *  @param  {Object}  event  The event to add to the timeline
	 *  @return  {Tone.IntervalTimeline}  this
	 */
	Tone.IntervalTimeline.prototype.add = function(event){
		if (Tone.isUndef(event.time) || Tone.isUndef(event.duration)){
			throw new Error("Tone.IntervalTimeline: events must have time and duration parameters");
		}
		var node = new IntervalNode(event.time, event.time + event.duration, event);
		if (this._root === null){
			this._root = node;
		} else {
			this._root.insert(node);
		}
		this._length++;
		// Restructure tree to be balanced
		while (node !== null) {
			node.updateHeight();
			node.updateMax();
			this._rebalance(node);
			node = node.parent;
		}
		return this;
	};

	/**
	 *  Remove an event from the timeline.
	 *  @param  {Object}  event  The event to remove from the timeline
	 *  @return  {Tone.IntervalTimeline}  this
	 */
	Tone.IntervalTimeline.prototype.remove = function(event){
		if (this._root !== null){
			var results = [];
			this._root.search(event.time, results);
			for (var i = 0; i < results.length; i++){
				var node = results[i];
				if (node.event === event){
					this._removeNode(node);
					this._length--;
					break;
				}
			}
		}
		return this;
	};

	/**
	 *  The number of items in the timeline.
	 *  @type {Number}
	 *  @memberOf Tone.IntervalTimeline#
	 *  @name length
	 *  @readOnly
	 */
	Object.defineProperty(Tone.IntervalTimeline.prototype, "length", {
		get : function(){
			return this._length;
		}
	});

	/**
	 *  Remove events whose time time is after the given time
	 *  @param  {Number}  time  The time to query.
	 *  @returns {Tone.IntervalTimeline} this
	 */
	Tone.IntervalTimeline.prototype.cancel = function(after){
		this.forEachAfter(after, function(event){
			this.remove(event);
		}.bind(this));
		return this;
	};

	/**
	 *  Set the root node as the given node
	 *  @param {IntervalNode} node
	 *  @private
	 */
	Tone.IntervalTimeline.prototype._setRoot = function(node){
		this._root = node;
		if (this._root !== null){
			this._root.parent = null;
		}
	};

	/**
	 *  Replace the references to the node in the node's parent
	 *  with the replacement node.
	 *  @param  {IntervalNode}  node        
	 *  @param  {IntervalNode}  replacement 
	 *  @private
	 */
	Tone.IntervalTimeline.prototype._replaceNodeInParent = function(node, replacement){
		if (node.parent !== null){
			if (node.isLeftChild()){
				node.parent.left = replacement;
			} else {
				node.parent.right = replacement;
			}
			this._rebalance(node.parent);
		} else {
			this._setRoot(replacement);
		}
	};

	/**
	 *  Remove the node from the tree and replace it with 
	 *  a successor which follows the schema.
	 *  @param  {IntervalNode}  node
	 *  @private
	 */
	Tone.IntervalTimeline.prototype._removeNode = function(node){
		if (node.left === null && node.right === null){
			this._replaceNodeInParent(node, null);
		} else if (node.right === null){
			this._replaceNodeInParent(node, node.left);
		} else if (node.left === null){
			this._replaceNodeInParent(node, node.right);
		} else {
			var balance = node.getBalance();
			var replacement, temp;
			if (balance > 0){
				if (node.left.right === null){
					replacement = node.left;
					replacement.right = node.right;
					temp = replacement;
				} else {
					replacement = node.left.right;
					while (replacement.right !== null){
						replacement = replacement.right;
					}
					replacement.parent.right = replacement.left;
					temp = replacement.parent;
					replacement.left = node.left;
					replacement.right = node.right;
				}
			} else {
				if (node.right.left === null){
					replacement = node.right;
					replacement.left = node.left;
					temp = replacement;
				} else {
					replacement = node.right.left;
					while (replacement.left !== null) {
						replacement = replacement.left;
					}
					replacement.parent = replacement.parent;
					replacement.parent.left = replacement.right;
					temp = replacement.parent;
					replacement.left = node.left;
					replacement.right = node.right;
				}
			}
			if (node.parent !== null){
				if (node.isLeftChild()){
					node.parent.left = replacement;
				} else {
					node.parent.right = replacement;
				}
			} else {
				this._setRoot(replacement);
			}
			// this._replaceNodeInParent(node, replacement);
			this._rebalance(temp);
		}
		node.dispose();
	};

	/**
	 *  Rotate the tree to the left
	 *  @param  {IntervalNode}  node
	 *  @private
	 */
	Tone.IntervalTimeline.prototype._rotateLeft = function(node){
		var parent = node.parent;
		var isLeftChild = node.isLeftChild();

		// Make node.right the new root of this sub tree (instead of node)
		var pivotNode = node.right;
		node.right = pivotNode.left;
		pivotNode.left = node;

		if (parent !== null){
			if (isLeftChild){
				parent.left = pivotNode;
			} else{
				parent.right = pivotNode;
			}
		} else{
			this._setRoot(pivotNode);
		}
	};

	/**
	 *  Rotate the tree to the right
	 *  @param  {IntervalNode}  node
	 *  @private
	 */
	Tone.IntervalTimeline.prototype._rotateRight = function(node){
		var parent = node.parent;
		var isLeftChild = node.isLeftChild();
 
		// Make node.left the new root of this sub tree (instead of node)
		var pivotNode = node.left;
		node.left = pivotNode.right;
		pivotNode.right = node;

		if (parent !== null){
			if (isLeftChild){
				parent.left = pivotNode;
			} else{
				parent.right = pivotNode;
			}
		} else{
			this._setRoot(pivotNode);
		}
	};

	/**
	 *  Balance the BST
	 *  @param  {IntervalNode}  node
	 *  @private
	 */
	Tone.IntervalTimeline.prototype._rebalance = function(node){
		var balance = node.getBalance();
		if (balance > 1){
			if (node.left.getBalance() < 0){
				this._rotateLeft(node.left);
			} else {
				this._rotateRight(node);
			}
		} else if (balance < -1) {
			if (node.right.getBalance() > 0){
				this._rotateRight(node.right);
			} else {
				this._rotateLeft(node);
			}
		}
	};

	/**
	 *  Get an event whose time and duration span the give time. Will
	 *  return the match whose "time" value is closest to the given time.
	 *  @param  {Object}  event  The event to add to the timeline
	 *  @return  {Object}  The event which spans the desired time
	 */
	Tone.IntervalTimeline.prototype.get = function(time){
		if (this._root !== null){
			var results = [];
			this._root.search(time, results);
			if (results.length > 0){
				var max = results[0];
				for (var i = 1; i < results.length; i++){
					if (results[i].low > max.low){
						max = results[i];
					}
				}
				return max.event;
			} 
		}
		return null;
	};

	/**
	 *  Iterate over everything in the timeline.
	 *  @param  {Function}  callback The callback to invoke with every item
	 *  @returns {Tone.IntervalTimeline} this
	 */
	Tone.IntervalTimeline.prototype.forEach = function(callback){
		if (this._root !== null){
			var allNodes = [];
			this._root.traverse(function(node){
				allNodes.push(node);
			});
			for (var i = 0; i < allNodes.length; i++){
				var ev = allNodes[i].event;
				if (ev){
					callback(ev);
				}
			}
		}
		return this;
	};

	/**
	 *  Iterate over everything in the array in which the given time
	 *  overlaps with the time and duration time of the event.
	 *  @param  {Number}  time The time to check if items are overlapping
	 *  @param  {Function}  callback The callback to invoke with every item
	 *  @returns {Tone.IntervalTimeline} this
	 */
	Tone.IntervalTimeline.prototype.forEachAtTime = function(time, callback){
		if (this._root !== null){
			var results = [];
			this._root.search(time, results);
			for (var i = results.length - 1; i >= 0; i--){
				var ev = results[i].event;
				if (ev){
					callback(ev);
				}
			}
		}
		return this;
	};

	/**
	 *  Iterate over everything in the array in which the time is greater
	 *  than the given time.
	 *  @param  {Number}  time The time to check if items are before
	 *  @param  {Function}  callback The callback to invoke with every item
	 *  @returns {Tone.IntervalTimeline} this
	 */
	Tone.IntervalTimeline.prototype.forEachAfter = function(time, callback){
		if (this._root !== null){
			var results = [];
			this._root.searchAfter(time, results);
			for (var i = results.length - 1; i >= 0; i--){
				var ev = results[i].event;
				callback(ev);
			}
		}
		return this;
	};

	/**
	 *  Clean up
	 *  @return  {Tone.IntervalTimeline}  this
	 */
	Tone.IntervalTimeline.prototype.dispose = function() {
		var allNodes = [];
		if (this._root !== null){
			this._root.traverse(function(node){
				allNodes.push(node);
			});
		}
		for (var i = 0; i < allNodes.length; i++){
			allNodes[i].dispose();
		}
		allNodes = null;
		this._root = null;
		return this;
	};

	///////////////////////////////////////////////////////////////////////////
	//	INTERVAL NODE HELPER
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Represents a node in the binary search tree, with the addition
	 *  of a "high" value which keeps track of the highest value of
	 *  its children. 
	 *  References: 
	 *  https://brooknovak.wordpress.com/2013/12/07/augmented-interval-tree-in-c/
	 *  http://www.mif.vu.lt/~valdas/ALGORITMAI/LITERATURA/Cormen/Cormen.pdf
	 *  @param {Number} low
	 *  @param {Number} high
	 *  @private
	 */
	var IntervalNode = function(low, high, event){
		//the event container
		this.event = event;
		//the low value
		this.low = low;
		//the high value
		this.high = high;
		//the high value for this and all child nodes
		this.max = this.high;
		//the nodes to the left
		this._left = null;
		//the nodes to the right
		this._right = null;
		//the parent node
		this.parent = null;
		//the number of child nodes
		this.height = 0;
	};

	/** 
	 *  Insert a node into the correct spot in the tree
	 *  @param  {IntervalNode}  node
	 */
	IntervalNode.prototype.insert = function(node) {
		if (node.low <= this.low){
			if (this.left === null){
				this.left = node;
			} else {
				this.left.insert(node);
			}
		} else {
			if (this.right === null){
				this.right = node;
			} else {
				this.right.insert(node);
			}
		}
	};

	/**
	 *  Search the tree for nodes which overlap 
	 *  with the given point
	 *  @param  {Number}  point  The point to query
	 *  @param  {Array}  results  The array to put the results
	 */
	IntervalNode.prototype.search = function(point, results) {
		// If p is to the right of the rightmost point of any interval
		// in this node and all children, there won't be any matches.
		if (point > this.max){
			return;
		}
		// Search left children
		if (this.left !== null){
			this.left.search(point, results);
		}
		// Check this node
		if (this.low <= point && this.high > point){
			results.push(this);
		}
		// If p is to the left of the time of this interval,
		// then it can't be in any child to the right.
		if (this.low > point){
			return;
		}
		// Search right children
		if (this.right !== null){
			this.right.search(point, results);
		}
	};

	/**
	 *  Search the tree for nodes which are less 
	 *  than the given point
	 *  @param  {Number}  point  The point to query
	 *  @param  {Array}  results  The array to put the results
	 */
	IntervalNode.prototype.searchAfter = function(point, results) {
		// Check this node
		if (this.low >= point){
			results.push(this);
			if (this.left !== null){
				this.left.searchAfter(point, results);
			}
		} 
		// search the right side
		if (this.right !== null){
			this.right.searchAfter(point, results);
		}
	};

	/**
	 *  Invoke the callback on this element and both it's branches
	 *  @param  {Function}  callback
	 */
	IntervalNode.prototype.traverse = function(callback){
		callback(this);
		if (this.left !== null){
			this.left.traverse(callback);
		}
		if (this.right !== null){
			this.right.traverse(callback);
		}
	};

	/**
	 *  Update the height of the node
	 */
	IntervalNode.prototype.updateHeight = function(){
		if (this.left !== null && this.right !== null){
			this.height = Math.max(this.left.height, this.right.height) + 1;
		} else if (this.right !== null){
			this.height = this.right.height + 1;
		} else if (this.left !== null){
			this.height = this.left.height + 1;
		} else {
			this.height = 0;
		}
	};

	/**
	 *  Update the height of the node
	 */
	IntervalNode.prototype.updateMax = function(){
		this.max = this.high;
		if (this.left !== null){
			this.max = Math.max(this.max, this.left.max);
		}
		if (this.right !== null){
			this.max = Math.max(this.max, this.right.max);
		}
	};

	/**
	 *  The balance is how the leafs are distributed on the node
	 *  @return  {Number}  Negative numbers are balanced to the right
	 */
	IntervalNode.prototype.getBalance = function() {
		var balance = 0;
		if (this.left !== null && this.right !== null){
			balance = this.left.height - this.right.height;
		} else if (this.left !== null){
			balance = this.left.height + 1;
		} else if (this.right !== null){
			balance = -(this.right.height + 1);
		}
		return balance;
	};

	/**
	 *  @returns {Boolean} true if this node is the left child
	 *  of its parent
	 */
	IntervalNode.prototype.isLeftChild = function() {
		return this.parent !== null && this.parent.left === this;
	};

	/**
	 *  get/set the left node
	 *  @type {IntervalNode}
	 */
	Object.defineProperty(IntervalNode.prototype, "left", {
		get : function(){
			return this._left;
		},
		set : function(node){
			this._left = node;
			if (node !== null){
				node.parent = this;
			}
			this.updateHeight();
			this.updateMax();
		}
	});

	/**
	 *  get/set the right node
	 *  @type {IntervalNode}
	 */
	Object.defineProperty(IntervalNode.prototype, "right", {
		get : function(){
			return this._right;
		},
		set : function(node){
			this._right = node;
			if (node !== null){
				node.parent = this;
			}
			this.updateHeight();
			this.updateMax();
		}
	});

	/**
	 *  null out references.
	 */
	IntervalNode.prototype.dispose = function() {
		this.parent = null;
		this._left = null;
		this._right = null;
		this.event = null;
	};

	///////////////////////////////////////////////////////////////////////////
	//	END INTERVAL NODE HELPER
	///////////////////////////////////////////////////////////////////////////

	return Tone.IntervalTimeline;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(38), __webpack_require__(39), __webpack_require__(40), 
	__webpack_require__(2), __webpack_require__(24), __webpack_require__(47)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  Both Tone.Panner3D and Tone.Listener have a position in 3D space 
	 *          using a right-handed cartesian coordinate system. 
	 *          The units used in the coordinate system are not defined; 
	 *          these coordinates are independent/invariant of any particular 
	 *          units such as meters or feet. Tone.Panner3D objects have an forward 
	 *          vector representing the direction the sound is projecting. Additionally, 
	 *          they have a sound cone representing how directional the sound is. 
	 *          For example, the sound could be omnidirectional, in which case it would 
	 *          be heard anywhere regardless of its forward, or it can be more directional 
	 *          and heard only if it is facing the listener. Tone.Listener objects 
	 *          (representing a person's ears) have an forward and up vector 
	 *          representing in which direction the person is facing. Because both the 
	 *          source stream and the listener can be moving, they both have a velocity 
	 *          vector representing both the speed and direction of movement. Taken together, 
	 *          these two velocities can be used to generate a doppler shift effect which changes the pitch.
	 *          <br><br>
	 *          Note: the position of the Listener will have no effect on nodes not connected to a Tone.Panner3D
	 *  
	 *  @constructor
	 *  @extends {Tone}
	 *  @singleton
	 */
	Tone.Listener = function(){

		Tone.call(this);

		/**
		 *  Holds the current forward orientation
		 *  @type  {Array}
		 *  @private
		 */
		this._orientation = [0, 0, 0, 0, 0, 0];

		/**
		 *  Holds the current position
		 *  @type  {Array}
		 *  @private
		 */
		this._position = [0, 0, 0];

		// set the default position/forward
		this.set(ListenerConstructor.defaults);
	};

	Tone.extend(Tone.Listener);

	/**
	 *  Defaults according to the specification
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Tone.Listener.defaults = {
		"positionX" : 0,
		"positionY" : 0,
		"positionZ" : 0,
		"forwardX" : 0,
		"forwardY" : 0,
		"forwardZ" : 1,
		"upX" : 0,
		"upY" : 1,
		"upZ" : 0
	};

	/**
	 * The ramp time which is applied to the setTargetAtTime
	 * @type {Number}
	 * @private
	 */
	Tone.Listener.prototype._rampTimeConstant = 0.01;

	/**
	 *  Sets the position of the listener in 3d space.	
	 *  @param  {Number}  x
	 *  @param  {Number}  y
	 *  @param  {Number}  z
	 *  @return {Tone.Listener} this
	 */
	Tone.Listener.prototype.setPosition = function(x, y, z){
		if (this.context.listener.positionX){
			var now = this.now();
			this.context.listener.positionX.setTargetAtTime(x, now, this._rampTimeConstant);
			this.context.listener.positionY.setTargetAtTime(y, now, this._rampTimeConstant);
			this.context.listener.positionZ.setTargetAtTime(z, now, this._rampTimeConstant);
		} else {
			this.context.listener.setPosition(x, y, z);
		}
		this._position = Array.prototype.slice.call(arguments);
		return this;
	};

	/**
	 *  Sets the orientation of the listener using two vectors, the forward
	 *  vector (which direction the listener is facing) and the up vector 
	 *  (which the up direction of the listener). An up vector
	 *  of 0, 0, 1 is equivalent to the listener standing up in the Z direction. 
	 *  @param  {Number}  x
	 *  @param  {Number}  y
	 *  @param  {Number}  z
	 *  @param  {Number}  upX
	 *  @param  {Number}  upY
	 *  @param  {Number}  upZ
	 *  @return {Tone.Listener} this
	 */
	Tone.Listener.prototype.setOrientation = function(x, y, z, upX, upY, upZ){
		if (this.context.listener.forwardX){
			var now = this.now();
			this.context.listener.forwardX.setTargetAtTime(x, now, this._rampTimeConstant);
			this.context.listener.forwardY.setTargetAtTime(y, now, this._rampTimeConstant);
			this.context.listener.forwardZ.setTargetAtTime(z, now, this._rampTimeConstant);
			this.context.listener.upX.setTargetAtTime(upX, now, this._rampTimeConstant);
			this.context.listener.upY.setTargetAtTime(upY, now, this._rampTimeConstant);
			this.context.listener.upZ.setTargetAtTime(upZ, now, this._rampTimeConstant);
		} else {
			this.context.listener.setOrientation(x, y, z, upX, upY, upZ);
		}
		this._orientation = Array.prototype.slice.call(arguments);
		return this;
	};

	/**
	 *  The x position of the panner object.
	 *  @type {Number}
	 *  @memberOf Tone.Listener#
	 *  @name positionX
	 */
	Object.defineProperty(Tone.Listener.prototype, "positionX", {
		set : function(pos){
			this._position[0] = pos;
			this.setPosition.apply(this, this._position);
		},
		get : function(){
			return this._position[0];
		}
	});

	/**
	 *  The y position of the panner object.
	 *  @type {Number}
	 *  @memberOf Tone.Listener#
	 *  @name positionY
	 */
	Object.defineProperty(Tone.Listener.prototype, "positionY", {
		set : function(pos){
			this._position[1] = pos;
			this.setPosition.apply(this, this._position);
		},
		get : function(){
			return this._position[1];
		}
	});

	/**
	 *  The z position of the panner object.
	 *  @type {Number}
	 *  @memberOf Tone.Listener#
	 *  @name positionZ
	 */
	Object.defineProperty(Tone.Listener.prototype, "positionZ", {
		set : function(pos){
			this._position[2] = pos;
			this.setPosition.apply(this, this._position);
		},
		get : function(){
			return this._position[2];
		}
	});

	/**
	 *  The x coordinate of the listeners front direction. i.e. 
	 *  which way they are facing.
	 *  @type {Number}
	 *  @memberOf Tone.Listener#
	 *  @name forwardX
	 */
	Object.defineProperty(Tone.Listener.prototype, "forwardX", {
		set : function(pos){
			this._orientation[0] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[0];
		}
	});

	/**
	 *  The y coordinate of the listeners front direction. i.e. 
	 *  which way they are facing.
	 *  @type {Number}
	 *  @memberOf Tone.Listener#
	 *  @name forwardY
	 */
	Object.defineProperty(Tone.Listener.prototype, "forwardY", {
		set : function(pos){
			this._orientation[1] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[1];
		}
	});

	/**
	 *  The z coordinate of the listeners front direction. i.e. 
	 *  which way they are facing.
	 *  @type {Number}
	 *  @memberOf Tone.Listener#
	 *  @name forwardZ
	 */
	Object.defineProperty(Tone.Listener.prototype, "forwardZ", {
		set : function(pos){
			this._orientation[2] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[2];
		}
	});

	/**
	 *  The x coordinate of the listener's up direction. i.e.
	 *  the direction the listener is standing in.
	 *  @type {Number}
	 *  @memberOf Tone.Listener#
	 *  @name upX
	 */
	Object.defineProperty(Tone.Listener.prototype, "upX", {
		set : function(pos){
			this._orientation[3] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[3];
		}
	});

	/**
	 *  The y coordinate of the listener's up direction. i.e.
	 *  the direction the listener is standing in.
	 *  @type {Number}
	 *  @memberOf Tone.Listener#
	 *  @name upY
	 */
	Object.defineProperty(Tone.Listener.prototype, "upY", {
		set : function(pos){
			this._orientation[4] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[4];
		}
	});

	/**
	 *  The z coordinate of the listener's up direction. i.e.
	 *  the direction the listener is standing in.
	 *  @type {Number}
	 *  @memberOf Tone.Listener#
	 *  @name upZ
	 */
	Object.defineProperty(Tone.Listener.prototype, "upZ", {
		set : function(pos){
			this._orientation[5] = pos;
			this.setOrientation.apply(this, this._orientation);
		},
		get : function(){
			return this._orientation[5];
		}
	});

	/**
	 *  Clean up.
	 *  @returns {Tone.Listener} this
	 */
	Tone.Listener.prototype.dispose = function(){
		this._orientation = null;
		this._position = null;
		return this;
	};

	//SINGLETON SETUP
	var ListenerConstructor = Tone.Listener;
	Tone.Listener = new ListenerConstructor();

	Tone.Context.on("init", function(context){
		if (context.Listener instanceof ListenerConstructor){
			//a single listener object
			Tone.Listener = context.Listener;
		} else {
			//make new Listener insides
			Tone.Listener = new ListenerConstructor();
		}
		context.Listener = Tone.Listener;
	});
	//END SINGLETON SETUP

	return Tone.Listener;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(9), __webpack_require__(46)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Return the absolute value of an incoming signal. 
	 *  
	 *  @constructor
	 *  @extends {Tone.SignalBase}
	 *  @example
	 * var signal = new Tone.Signal(-1);
	 * var abs = new Tone.Abs();
	 * signal.connect(abs);
	 * //the output of abs is 1. 
	 */
	Tone.Abs = function(){
		Tone.SignalBase.call(this);
		/**
		 *  @type {Tone.LessThan}
		 *  @private
		 */
		this._abs = this.input = this.output = new Tone.WaveShaper(function(val){
			if (val === 0){
				return 0;
			} else {
				return Math.abs(val);
			}
		}, 127);
	};

	Tone.extend(Tone.Abs, Tone.SignalBase);

	/**
	 *  dispose method
	 *  @returns {Tone.Abs} this
	 */
	Tone.Abs.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._abs.dispose();
		this._abs = null;
		return this;
	}; 

	return Tone.Abs;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 122 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Convert an incoming signal between 0, 1 to an equal power gain scale.
	 *
	 *  @extends {Tone.SignalBase}
	 *  @constructor
	 *  @example
	 * var eqPowGain = new Tone.EqualPowerGain();
	 */
	Tone.EqualPowerGain = function(){

		Tone.SignalBase.call(this);
		/**
		 *  @type {Tone.WaveShaper}
		 *  @private
		 */
		this._eqPower = this.input = this.output = new Tone.WaveShaper(function(val){
			if (Math.abs(val) < 0.001){
				//should output 0 when input is 0
				return 0;
			} else {
				return Tone.equalPowerScale(val);
			}
		}.bind(this), 4096);
	};

	Tone.extend(Tone.EqualPowerGain, Tone.SignalBase);

	/**
	 *  clean up
	 *  @returns {Tone.EqualPowerGain} this
	 */
	Tone.EqualPowerGain.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._eqPower.dispose();
		this._eqPower = null;
		return this;
	};

	return Tone.EqualPowerGain;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 123 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(43), __webpack_require__(25), __webpack_require__(18), 
	__webpack_require__(124), __webpack_require__(44), __webpack_require__(121), __webpack_require__(45), 
	__webpack_require__(125), __webpack_require__(126), __webpack_require__(24)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Evaluate an expression at audio rate. <br><br>
	 *         Parsing code modified from https://code.google.com/p/tapdigit/
	 *         Copyright 2011 2012 Ariya Hidayat, New BSD License
	 *
	 *  @extends {Tone.SignalBase}
	 *  @constructor
	 *  @param {string} expr the expression to generate
	 *  @example
	 * //adds the signals from input[0] and input[1].
	 * var expr = new Tone.Expr("$0 + $1");
	 */
	Tone.Expr = function(){

		Tone.SignalBase.call(this);
		var expr = this._replacements(Array.prototype.slice.call(arguments));
		var inputCount = this._parseInputs(expr);

		/**
		 *  hold onto all of the nodes for disposal
		 *  @type {Array}
		 *  @private
		 */
		this._nodes = [];

		/**
		 *  The inputs. The length is determined by the expression. 
		 *  @type {Array}
		 */
		this.input = new Array(inputCount);

		//create a gain for each input
		for (var i = 0; i < inputCount; i++){
			this.input[i] = this.context.createGain();
		}

		//parse the syntax tree
		var tree = this._parseTree(expr);
		//evaluate the results
		var result;
		try {
			result = this._eval(tree);
		} catch (e){
			this._disposeNodes();
			throw new Error("Tone.Expr: Could evaluate expression: "+expr);
		}

		/**
		 *  The output node is the result of the expression
		 *  @type {Tone}
		 */
		this.output = result;
	};

	Tone.extend(Tone.Expr, Tone.SignalBase);

	//some helpers to cut down the amount of code
	function applyBinary(Constructor, args, self){
		var op = new Constructor();
		self._eval(args[0]).connect(op, 0, 0);
		self._eval(args[1]).connect(op, 0, 1);
		return op;
	}
	function applyUnary(Constructor, args, self){
		var op = new Constructor();
		self._eval(args[0]).connect(op, 0, 0);
		return op;
	}
	function getNumber(arg){
		return arg ? parseFloat(arg) : undefined;
	}
	function literalNumber(arg){
		return arg && arg.args ? parseFloat(arg.args) : undefined;
	}

	/*
	 *  the Expressions that Tone.Expr can parse.
	 *
	 *  each expression belongs to a group and contains a regexp 
	 *  for selecting the operator as well as that operators method
	 *  
	 *  @type {Object}
	 *  @private
	 */
	Tone.Expr._Expressions = {
		//values
		"value" : {
			"signal" : {
				regexp : /^\d+\.\d+|^\d+/,
				method : function(arg){
					var sig = new Tone.Signal(getNumber(arg));
					return sig;
				}
			},
			"input" : {
				regexp : /^\$\d/,
				method : function(arg, self){
					return self.input[getNumber(arg.substr(1))];
				}
			}
		},
		//syntactic glue
		"glue" : {
			"(" : {
				regexp : /^\(/,
			},
			")" : {
				regexp : /^\)/,
			},
			"," : {
				regexp : /^,/,
			}
		},
		//functions
		"func" : {
			"abs" :  {
				regexp : /^abs/,
				method : applyUnary.bind(this, Tone.Abs)
			},
			"mod" : {
				regexp : /^mod/,
				method : function(args, self){
					var modulus = literalNumber(args[1]);
					var op = new Tone.Modulo(modulus);
					self._eval(args[0]).connect(op);
					return op;
				}
			},
			"pow" : {
				regexp : /^pow/,
				method : function(args, self){
					var exp = literalNumber(args[1]);
					var op = new Tone.Pow(exp);
					self._eval(args[0]).connect(op);
					return op;
				}
			},
			"a2g" : {
				regexp : /^a2g/,
				method : function(args, self){
					var op = new Tone.AudioToGain();
					self._eval(args[0]).connect(op);
					return op;
				}
			},
		},
		//binary expressions
		"binary" : {
			"+" : {
				regexp : /^\+/,
				precedence : 1,
				method : applyBinary.bind(this, Tone.Add)
			},
			"-" : {
				regexp : /^\-/,
				precedence : 1,
				method : function(args, self){
					//both unary and binary op
					if (args.length === 1){
						return applyUnary(Tone.Negate, args, self);
					} else {
						return applyBinary(Tone.Subtract, args, self);
					}
				}
			},
			"*" : {
				regexp : /^\*/,
				precedence : 0,
				method : applyBinary.bind(this, Tone.Multiply)
			}
		},
		//unary expressions
		"unary" : {
			"-" : {
				regexp : /^\-/,
				method : applyUnary.bind(this, Tone.Negate)
			},
			"!" : {
				regexp : /^\!/,
				method : applyUnary.bind(this, Tone.NOT)
			},
		},
	};
		
	/**
	 *  @param   {string} expr the expression string
	 *  @return  {number}      the input count
	 *  @private
	 */
	Tone.Expr.prototype._parseInputs = function(expr){
		var inputArray = expr.match(/\$\d/g);
		var inputMax = 0;
		if (inputArray !== null){
			for (var i = 0; i < inputArray.length; i++){
				var inputNum = parseInt(inputArray[i].substr(1)) + 1;
				inputMax = Math.max(inputMax, inputNum);
			}
		}
		return inputMax;
	};

	/**
	 *  @param   {Array} args 	an array of arguments
	 *  @return  {string} the results of the replacements being replaced
	 *  @private
	 */
	Tone.Expr.prototype._replacements = function(args){
		var expr = args.shift();
		for (var i = 0; i < args.length; i++){
			expr = expr.replace(/\%/i, args[i]);
		}
		return expr;
	};

	/**
	 *  tokenize the expression based on the Expressions object
	 *  @param   {string} expr 
	 *  @return  {Object}      returns two methods on the tokenized list, next and peek
	 *  @private
	 */
	Tone.Expr.prototype._tokenize = function(expr){
		var position = -1;
		var tokens = [];

		while(expr.length > 0){
			expr = expr.trim();
			var token =  getNextToken(expr);
			tokens.push(token);
			expr = expr.substr(token.value.length);
		}

		function getNextToken(expr){
			for (var type in Tone.Expr._Expressions){
				var group = Tone.Expr._Expressions[type];
				for (var opName in group){
					var op = group[opName];
					var reg = op.regexp;
					var match = expr.match(reg);
					if (match !== null){
						return {
							type : type,
							value : match[0],
							method : op.method
						};
					}
				}
			}
			throw new SyntaxError("Tone.Expr: Unexpected token "+expr);
		}

		return {
			next : function(){
				return tokens[++position];
			},
			peek : function(){
				return tokens[position + 1];
			}
		};
	};

	/**
	 *  recursively parse the string expression into a syntax tree
	 *  
	 *  @param   {string} expr 
	 *  @return  {Object}
	 *  @private
	 */
	Tone.Expr.prototype._parseTree = function(expr){
		var lexer = this._tokenize(expr);
		var isUndef = Tone.isUndef.bind(this);

		function matchSyntax(token, syn) {
			return !isUndef(token) && 
				token.type === "glue" &&
				token.value === syn;
		}

		function matchGroup(token, groupName, prec) {
			var ret = false;
			var group = Tone.Expr._Expressions[groupName];
			if (!isUndef(token)){
				for (var opName in group){
					var op = group[opName];
					if (op.regexp.test(token.value)){
						if (!isUndef(prec)){
							if(op.precedence === prec){	
								return true;
							}
						} else {
							return true;
						}
					}
				}
			}
			return ret;
		}

		function parseExpression(precedence) {
			if (isUndef(precedence)){
				precedence = 5;
			}
			var expr;
			if (precedence < 0){
				expr = parseUnary();
			} else {
				expr = parseExpression(precedence-1);
			}
			var token = lexer.peek();
			while (matchGroup(token, "binary", precedence)) {
				token = lexer.next();
				expr = {
					operator: token.value,
					method : token.method,
					args : [
						expr,
						parseExpression(precedence-1)
					]
				};
				token = lexer.peek();
			}
			return expr;
		}

		function parseUnary() {
			var token, expr;
			token = lexer.peek();
			if (matchGroup(token, "unary")) {
				token = lexer.next();
				expr = parseUnary();
				return {
					operator: token.value,
					method : token.method,
					args : [expr]
				};
			}
			return parsePrimary();
		}

		function parsePrimary() {
			var token, expr;
			token = lexer.peek();
			if (isUndef(token)) {
				throw new SyntaxError("Tone.Expr: Unexpected termination of expression");
			}
			if (token.type === "func") {
				token = lexer.next();
				return parseFunctionCall(token);
			}
			if (token.type === "value") {
				token = lexer.next();
				return {
					method : token.method,
					args : token.value
				};
			}
			if (matchSyntax(token, "(")) {
				lexer.next();
				expr = parseExpression();
				token = lexer.next();
				if (!matchSyntax(token, ")")) {
					throw new SyntaxError("Expected )");
				}
				return expr;
			}
			throw new SyntaxError("Tone.Expr: Parse error, cannot process token " + token.value);
		}

		function parseFunctionCall(func) {
			var token, args = [];
			token = lexer.next();
			if (!matchSyntax(token, "(")) {
				throw new SyntaxError("Tone.Expr: Expected ( in a function call \"" + func.value + "\"");
			}
			token = lexer.peek();
			if (!matchSyntax(token, ")")) {
				args = parseArgumentList();
			}
			token = lexer.next();
			if (!matchSyntax(token, ")")) {
				throw new SyntaxError("Tone.Expr: Expected ) in a function call \"" + func.value + "\"");
			}
			return {
				method : func.method,
				args : args,
				name : name
			};
		}

		function parseArgumentList() {
			var token, expr, args = [];
			while (true) {
				expr = parseExpression();
				if (isUndef(expr)) {
					// TODO maybe throw exception?
					break;
				}
				args.push(expr);
				token = lexer.peek();
				if (!matchSyntax(token, ",")) {
					break;
				}
				lexer.next();
			}
			return args;
		}

		return parseExpression();
	};

	/**
	 *  recursively evaluate the expression tree
	 *  @param   {Object} tree 
	 *  @return  {AudioNode}      the resulting audio node from the expression
	 *  @private
	 */
	Tone.Expr.prototype._eval = function(tree){
		if (!Tone.isUndef(tree)){
			var node = tree.method(tree.args, this);
			this._nodes.push(node);
			return node;
		} 
	};

	/**
	 *  dispose all the nodes
	 *  @private
	 */
	Tone.Expr.prototype._disposeNodes = function(){
		for (var i = 0; i < this._nodes.length; i++){
			var node = this._nodes[i];
			if (Tone.isFunction(node.dispose)) {
				node.dispose();
			} else if (Tone.isFunction(node.disconnect)) {
				node.disconnect();
			}
			node = null;
			this._nodes[i] = null;
		}
		this._nodes = null;
	};

	/**
	 *  clean up
	 */
	Tone.Expr.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._disposeNodes();
	};

	return Tone.Expr;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 124 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(44), __webpack_require__(25), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class  Output 1 if the signal is greater than the value, otherwise outputs 0.
	 *          can compare two signals or a signal and a number. 
	 *  
	 *  @constructor
	 *  @extends {Tone.Signal}
	 *  @param {number} [value=0] the value to compare to the incoming signal
	 *  @example
	 * var gt = new Tone.GreaterThan(2);
	 * var sig = new Tone.Signal(4).connect(gt);
	 * //output of gt is equal 1. 
	 */
	Tone.GreaterThan = function(value){

		Tone.Signal.call(this);
		this.createInsOuts(2, 0);
		
		/**
		 *  subtract the amount from the incoming signal
		 *  @type {Tone.Subtract}
		 *  @private
		 */
		this._param = this.input[0] = new Tone.Subtract(value);
		this.input[1] = this._param.input[1];

		/**
		 *  compare that amount to zero
		 *  @type {Tone.GreaterThanZero}
		 *  @private
		 */
		this._gtz = this.output = new Tone.GreaterThanZero();

		//connect
		this._param.connect(this._gtz);
	};

	Tone.extend(Tone.GreaterThan, Tone.Signal);

	/**
	 *  dispose method
	 *  @returns {Tone.GreaterThan} this
	 */
	Tone.GreaterThan.prototype.dispose = function(){
		Tone.Signal.prototype.dispose.call(this);
		this._gtz.dispose();
		this._gtz = null;
		return this;
	};

	return Tone.GreaterThan;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 125 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(9), __webpack_require__(18), __webpack_require__(25)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Signal-rate modulo operator. Only works in AudioRange [-1, 1] and for modulus
	 *         values in the NormalRange. 
	 *
	 *  @constructor
	 *  @extends {Tone.SignalBase}
	 *  @param {NormalRange} modulus The modulus to apply.
	 *  @example
	 * var mod = new Tone.Modulo(0.2)
	 * var sig = new Tone.Signal(0.5).connect(mod);
	 * //mod outputs 0.1
	 */
	Tone.Modulo = function(modulus){

		Tone.SignalBase.call(this);
		this.createInsOuts(1, 0);

		/**
		 *  A waveshaper gets the integer multiple of 
		 *  the input signal and the modulus.
		 *  @private
		 *  @type {Tone.WaveShaper}
		 */
		this._shaper = new Tone.WaveShaper(Math.pow(2, 16));

		/**
		 *  the integer multiple is multiplied by the modulus
		 *  @type  {Tone.Multiply}
		 *  @private
		 */
		this._multiply = new Tone.Multiply();

		/**
		 *  and subtracted from the input signal
		 *  @type  {Tone.Subtract}
		 *  @private
		 */
		this._subtract = this.output = new Tone.Subtract();

		/**
		 *  the modulus signal
		 *  @type  {Tone.Signal}
		 *  @private
		 */
		this._modSignal = new Tone.Signal(modulus);

		//connections
		this.input.fan(this._shaper, this._subtract);
		this._modSignal.connect(this._multiply, 0, 0);
		this._shaper.connect(this._multiply, 0, 1);
		this._multiply.connect(this._subtract, 0, 1);
		this._setWaveShaper(modulus);
	};

	Tone.extend(Tone.Modulo, Tone.SignalBase);

	/**
	 *  @param  {number}  mod  the modulus to apply
	 *  @private
	 */
	Tone.Modulo.prototype._setWaveShaper = function(mod){
		this._shaper.setMap(function(val){
			var multiple = Math.floor((val + 0.0001) / mod);
			return multiple;
		});
	};

	/**
	 * The modulus value.
	 * @memberOf Tone.Modulo#
	 * @type {NormalRange}
	 * @name value
	 */
	Object.defineProperty(Tone.Modulo.prototype, "value", {
		get : function(){
			return this._modSignal.value;
		},
		set : function(mod){
			this._modSignal.value = mod;
			this._setWaveShaper(mod);
		}
	});

	/**
	 * clean up
	 *  @returns {Tone.Modulo} this
	 */
	Tone.Modulo.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._shaper.dispose();
		this._shaper = null;
		this._multiply.dispose();
		this._multiply = null;
		this._subtract.dispose();
		this._subtract = null;
		this._modSignal.dispose();
		this._modSignal = null;
		return this;
	};

	return Tone.Modulo;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 126 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(9)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";

	/**
	 *  @class Pow applies an exponent to the incoming signal. The incoming signal
	 *         must be AudioRange.
	 *
	 *  @extends {Tone.SignalBase}
	 *  @constructor
	 *  @param {Positive} exp The exponent to apply to the incoming signal, must be at least 2. 
	 *  @example
	 * var pow = new Tone.Pow(2);
	 * var sig = new Tone.Signal(0.5).connect(pow);
	 * //output of pow is 0.25. 
	 */
	Tone.Pow = function(exp){

		Tone.SignalBase.call(this);
		
		/**
		 * the exponent
		 * @private
		 * @type {number}
		 */
		this._exp = Tone.defaultArg(exp, 1);

		/**
		 *  @type {WaveShaperNode}
		 *  @private
		 */
		this._expScaler = this.input = this.output = new Tone.WaveShaper(this._expFunc(this._exp), 8192);
	};

	Tone.extend(Tone.Pow, Tone.SignalBase);

	/**
	 * The value of the exponent.
	 * @memberOf Tone.Pow#
	 * @type {number}
	 * @name value
	 */
	Object.defineProperty(Tone.Pow.prototype, "value", {
		get : function(){
			return this._exp;
		},
		set : function(exp){
			this._exp = exp;
			this._expScaler.setMap(this._expFunc(this._exp));
		}
	});


	/**
	 *  the function which maps the waveshaper
	 *  @param   {number} exp
	 *  @return {function}
	 *  @private
	 */
	Tone.Pow.prototype._expFunc = function(exp){
		return function(val){
			return Math.pow(Math.abs(val), exp);
		};
	};

	/**
	 *  Clean up.
	 *  @returns {Tone.Pow} this
	 */
	Tone.Pow.prototype.dispose = function(){
		Tone.SignalBase.prototype.dispose.call(this);
		this._expScaler.dispose();
		this._expScaler = null;
		return this;
	};

	return Tone.Pow;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 127 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(128)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	/**
	 * @class Tone.TickSignal extends Tone.TimelineSignal, but adds the capability
	 *        to calculate the number of elapsed ticks. exponential and target curves
	 *        are approximated with multiple linear ramps. 
	 *        
	 *        Thank you Bruno Dias, H. Sofia Pinto, and David M. Matos, for your [WAC paper](https://smartech.gatech.edu/bitstream/handle/1853/54588/WAC2016-49.pdf)
	 *        describing integrating timing functions for tempo calculations. 
	 *
	 * @param {Number} value The initial value of the signal
	 * @extends {Tone.TimelineSignal}
	 */
	Tone.TickSignal = function(value){

		value = Tone.defaultArg(value, 1);

		Tone.TimelineSignal.call(this, {
			"units" : Tone.Type.Ticks,
			"value" : value
		});

		//extend the memory
		this._events.memory = Infinity;
	};

	Tone.extend(Tone.TickSignal, Tone.TimelineSignal);

	/**
	 * Wraps Tone.TimelineSignal methods so that they also
	 * record the ticks.
	 * @param  {Function} method
	 * @return {Function} 
	 * @private
	 */
	function _wrapScheduleMethods(method){
		return function(value, time){
			time = this.toSeconds(time);
			method.apply(this, arguments);
			var event = this._events.get(time);
			var previousEvent = this._events.previousEvent(event);
			var ticksUntilTime = this._getTickUntilEvent(previousEvent, time - this.sampleTime);
			event.ticks = Math.max(ticksUntilTime, 0);
			return this;
		};
	}

	Tone.TickSignal.prototype.setValueAtTime = _wrapScheduleMethods(Tone.TimelineSignal.prototype.setValueAtTime);
	Tone.TickSignal.prototype.linearRampToValueAtTime = _wrapScheduleMethods(Tone.TimelineSignal.prototype.linearRampToValueAtTime);

	/**
	 *  Start exponentially approaching the target value at the given time with
	 *  a rate having the given time constant.
	 *  @param {number} value        
	 *  @param {Time} startTime    
	 *  @param {number} timeConstant 
	 *  @returns {Tone.TickSignal} this 
	 */
	Tone.TickSignal.prototype.setTargetAtTime = function(value, time, constant){
		//aproximate it with multiple linear ramps
		time = this.toSeconds(time);
		this.setRampPoint(time);
		value = this._fromUnits(value);

		//start from previously scheduled value
		var prevEvent = this._events.get(time);
		var segments = 5;
		for (var i = 0; i <= segments; i++){
			var segTime = constant * i + time;
			var rampVal = this._exponentialApproach(prevEvent.time, prevEvent.value, value, constant, segTime);
			this.linearRampToValueAtTime(this._toUnits(rampVal), segTime);
		}
		return this;
	};

	/**
	 *  Schedules an exponential continuous change in parameter value from 
	 *  the previous scheduled parameter value to the given value.
	 *  @param  {number} value   
	 *  @param  {Time} endTime 
	 *  @returns {Tone.TickSignal} this
	 */
	Tone.TickSignal.prototype.exponentialRampToValueAtTime = function(value, time){
		//aproximate it with multiple linear ramps
		time = this.toSeconds(time);
		value = this._fromUnits(value);

		//start from previously scheduled value
		var prevEvent = this._events.get(time);
		if (prevEvent === null){
			prevEvent = {
				"value" : this._initial,
				"time" : 0
			};
		}
		var segments = 5;
		var segmentDur = ((time - prevEvent.time)/segments);
		for (var i = 0; i <= segments; i++){
			var segTime = segmentDur * i + prevEvent.time;
			var rampVal = this._exponentialInterpolate(prevEvent.time, prevEvent.value, time, value, segTime);
			this.linearRampToValueAtTime(this._toUnits(rampVal), segTime);
		}
		return this;
	};

	/**
	 * Returns the tick value at the time. Takes into account
	 * any automation curves scheduled on the signal.
	 * @param  {Time} time The time to get the tick count at
	 * @return {Ticks}      The number of ticks which have elapsed at the time
	 *                          given any automations. 
	 */
	Tone.TickSignal.prototype._getTickUntilEvent = function(event, time){
		if (event === null){
			event = {
				"ticks" : 0,
				"time" : 0
			};
		}
		var val0 = this.getValueAtTime(event.time);
		var val1 = this.getValueAtTime(time);
		return 0.5 * (time - event.time) * (val0 + val1) + event.ticks;
	};

	/**
	 * Returns the tick value at the time. Takes into account
	 * any automation curves scheduled on the signal.
	 * @param  {Time} time The time to get the tick count at
	 * @return {Ticks}      The number of ticks which have elapsed at the time
	 *                          given any automations. 
	 */
	Tone.TickSignal.prototype.getTickAtTime = function(time){
		time = this.toSeconds(time);
		var event = this._events.get(time);
		return this._getTickUntilEvent(event, time);
	};

	/**
	 * Return the elapsed time of the number of ticks from the given time
	 * @param {Ticks} ticks The number of ticks to calculate
	 * @param  {Time} time The time to get the next tick from
	 * @return {Seconds} The duration of the number of ticks from the given time in seconds
	 */
	Tone.TickSignal.prototype.getDurationOfTicks = function(ticks, time){
		time = this.toSeconds(time);
		var currentTick = this.getTickAtTime(time);
		return this.getTimeOfTick(currentTick + ticks) - time;
	};

	/**
	 * Given a tick, returns the time that tick occurs at. 
	 * @param  {Ticks} tick
	 * @return {Time}      The time that the tick occurs. 
	 */
	Tone.TickSignal.prototype.getTimeOfTick = function(tick){
		var before = this._events.get(tick, "ticks");
		var after = this._events.getAfter(tick, "ticks");
		if (before && before.ticks === tick){
			return before.time;
		} else if (before && after && 
			after.type === Tone.TimelineSignal.Type.Linear && 
			before.value !== after.value){
			var val0 = this.getValueAtTime(before.time);
			var val1 = this.getValueAtTime(after.time);
			var delta = (val1 - val0) / (after.time - before.time);
			var k = Math.sqrt(Math.pow(val0, 2) - 2 * delta * (before.ticks - tick));
			var sol1 = (-val0 + k) / delta;
			var sol2 = (-val0 - k) / delta;
			return (sol1 > 0 ? sol1 : sol2) + before.time;
		} else if (before){
			if (before.value === 0){
				return Infinity;
			} else {
				return before.time + (tick - before.ticks) / before.value;
			}
		} else {
			return tick / this._initial;
		}
	};

	return Tone.TickSignal;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 128 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(2), __webpack_require__(17)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	"use strict";

	/**
	 *  @class A signal which adds the method getValueAtTime. 
	 *         Code and inspiration from https://github.com/jsantell/web-audio-automation-timeline
	 *  @extends {Tone.Signal}
	 *  @param {Number=} value The initial value of the signal
	 *  @param {String=} units The conversion units of the signal.
	 */
	Tone.TimelineSignal = function(){

		var options = Tone.defaults(arguments, ["value", "units"], Tone.Signal);
		Tone.Signal.call(this, options);
		
		/**
		 *  The scheduled events
		 *  @type {Tone.Timeline}
		 *  @private
		 */
		this._events = new Tone.Timeline(10);

		/**
		 *  The initial scheduled value
		 *  @type {Number}
		 *  @private
		 */
		this._initial = this._fromUnits(this._param.value);
		this.value = options.value;

		//delete the input node so that nothing can overwrite the signal value
		delete this.input;
	};

	Tone.extend(Tone.TimelineSignal, Tone.Signal);

	/**
	 *  The event types of a schedulable signal.
	 *  @enum {String}
	 *  @private
	 */
	Tone.TimelineSignal.Type = {
		Linear : "linear",
		Exponential : "exponential",
		Target : "target",
		Curve : "curve",
		Set : "set"
	};

	/**
	 * The current value of the signal. 
	 * @memberOf Tone.TimelineSignal#
	 * @type {Number}
	 * @name value
	 */
	Object.defineProperty(Tone.TimelineSignal.prototype, "value", {
		get : function(){
			var now = this.now();
			var val = this.getValueAtTime(now);
			return this._toUnits(val);
		},
		set : function(value){
			if (this._events){
				var convertedVal = this._fromUnits(value);
				this._initial = convertedVal;
				this.cancelScheduledValues();
				this._param.value = convertedVal;
			}
		}
	});

	///////////////////////////////////////////////////////////////////////////
	//	SCHEDULING
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Schedules a parameter value change at the given time.
	 *  @param {*}	value The value to set the signal.
	 *  @param {Time}  time The time when the change should occur.
	 *  @returns {Tone.TimelineSignal} this
	 *  @example
	 * //set the frequency to "G4" in exactly 1 second from now. 
	 * freq.setValueAtTime("G4", "+1");
	 */
	Tone.TimelineSignal.prototype.setValueAtTime = function (value, startTime) {
		value = this._fromUnits(value);
		startTime = this.toSeconds(startTime);
		this._events.add({
			"type" : Tone.TimelineSignal.Type.Set,
			"value" : value,
			"time" : startTime
		});
		//invoke the original event
		this._param.setValueAtTime(value, startTime);
		return this;
	};

	/**
	 *  Schedules a linear continuous change in parameter value from the 
	 *  previous scheduled parameter value to the given value.
	 *  
	 *  @param  {number} value   
	 *  @param  {Time} endTime 
	 *  @returns {Tone.TimelineSignal} this
	 */
	Tone.TimelineSignal.prototype.linearRampToValueAtTime = function (value, endTime) {
		value = this._fromUnits(value);
		endTime = this.toSeconds(endTime);
		this._events.add({
			"type" : Tone.TimelineSignal.Type.Linear,
			"value" : value,
			"time" : endTime
		});
		this._param.linearRampToValueAtTime(value, endTime);
		return this;
	};

	/**
	 *  Schedules an exponential continuous change in parameter value from 
	 *  the previous scheduled parameter value to the given value.
	 *  
	 *  @param  {number} value   
	 *  @param  {Time} endTime 
	 *  @returns {Tone.TimelineSignal} this
	 */
	Tone.TimelineSignal.prototype.exponentialRampToValueAtTime = function (value, endTime) {
		//get the previous event and make sure it's not starting from 0
		endTime = this.toSeconds(endTime);
		var beforeEvent = this._searchBefore(endTime);
		if (beforeEvent && beforeEvent.value === 0){
			//reschedule that event
			this.setValueAtTime(this._minOutput, beforeEvent.time);
		}
		value = this._fromUnits(value);
		var setValue = Math.max(value, this._minOutput);
		this._events.add({
			"type" : Tone.TimelineSignal.Type.Exponential,
			"value" : setValue,
			"time" : endTime
		});
		//if the ramped to value is 0, make it go to the min output, and then set to 0.
		if (value < this._minOutput){
			this._param.exponentialRampToValueAtTime(this._minOutput, endTime - this.sampleTime);
			this.setValueAtTime(0, endTime);
		} else {
			this._param.exponentialRampToValueAtTime(value, endTime);
		}
		return this;
	};

	/**
	 *  Start exponentially approaching the target value at the given time with
	 *  a rate having the given time constant.
	 *  @param {number} value        
	 *  @param {Time} startTime    
	 *  @param {number} timeConstant 
	 *  @returns {Tone.TimelineSignal} this 
	 */
	Tone.TimelineSignal.prototype.setTargetAtTime = function (value, startTime, timeConstant) {
		value = this._fromUnits(value);
		value = Math.max(this._minOutput, value);
		timeConstant = Math.max(this._minOutput, timeConstant);
		startTime = this.toSeconds(startTime);
		this._events.add({
			"type" : Tone.TimelineSignal.Type.Target,
			"value" : value,
			"time" : startTime,
			"constant" : timeConstant
		});
		this._param.setTargetAtTime(value, startTime, timeConstant);
		return this;
	};

	/**
	 *  Set an array of arbitrary values starting at the given time for the given duration.
	 *  @param {Float32Array} values        
	 *  @param {Time} startTime    
	 *  @param {Time} duration
	 *  @param {NormalRange} [scaling=1] If the values in the curve should be scaled by some value
	 *  @returns {Tone.TimelineSignal} this 
	 */
	Tone.TimelineSignal.prototype.setValueCurveAtTime = function (values, startTime, duration, scaling) {
		scaling = Tone.defaultArg(scaling, 1);
		//copy the array
		var floats = new Array(values.length);
		for (var i = 0; i < floats.length; i++){
			floats[i] = this._fromUnits(values[i]) * scaling;
		}
		startTime = this.toSeconds(startTime);
		duration = this.toSeconds(duration);
		this._events.add({
			"type" : Tone.TimelineSignal.Type.Curve,
			"value" : floats,
			"time" : startTime,
			"duration" : duration
		});
		//set the first value
		this._param.setValueAtTime(floats[0], startTime);
		//schedule a lienar ramp for each of the segments
		for (var j = 1; j < floats.length; j++){
			var segmentTime = startTime + (j / (floats.length - 1) * duration);
			this._param.linearRampToValueAtTime(floats[j], segmentTime);
		}
		return this;
	};

	/**
	 *  Cancels all scheduled parameter changes with times greater than or 
	 *  equal to startTime.
	 *  
	 *  @param  {Time} startTime
	 *  @returns {Tone.TimelineSignal} this
	 */
	Tone.TimelineSignal.prototype.cancelScheduledValues = function (after) {
		after = this.toSeconds(after);
		this._events.cancel(after);
		this._param.cancelScheduledValues(after);
		return this;
	};

	/**
	 *  Sets the computed value at the given time. This provides
	 *  a point from which a linear or exponential curve
	 *  can be scheduled after. Will cancel events after 
	 *  the given time and shorten the currently scheduled
	 *  linear or exponential ramp so that it ends at `time` .
	 *  This is to avoid discontinuities and clicks in envelopes. 
	 *  @param {Time} time When to set the ramp point
	 *  @returns {Tone.TimelineSignal} this
	 */
	Tone.TimelineSignal.prototype.setRampPoint = function (time) {
		time = this.toSeconds(time);
		//get the value at the given time
		var val = this._toUnits(this.getValueAtTime(time));
		//if there is an event at the given time
		//and that even is not a "set"
		var before = this._searchBefore(time);
		if (before && before.time === time){
			//remove everything after
			this.cancelScheduledValues(time + this.sampleTime);
		} else if (before && 
				   before.type === Tone.TimelineSignal.Type.Curve &&
				   before.time + before.duration > time){
			//if the curve is still playing
			//cancel the curve
			this.cancelScheduledValues(time);
			this.linearRampToValueAtTime(val, time);
		} else {
			//reschedule the next event to end at the given time
			var after = this._searchAfter(time);
			if (after){
				//cancel the next event(s)
				this.cancelScheduledValues(time);
				if (after.type === Tone.TimelineSignal.Type.Linear){
					this.linearRampToValueAtTime(val, time);
				} else if (after.type === Tone.TimelineSignal.Type.Exponential){
					this.exponentialRampToValueAtTime(val, time);
				}
			}
			this.setValueAtTime(val, time);
		}
		return this;
	};

	/**
	 *  Do a linear ramp to the given value between the start and finish times.
	 *  @param {Number} value The value to ramp to.
	 *  @param {Time} start The beginning anchor point to do the linear ramp
	 *  @param {Time} finish The ending anchor point by which the value of
	 *                       the signal will equal the given value.
	 *  @returns {Tone.TimelineSignal} this
	 */
	Tone.TimelineSignal.prototype.linearRampToValueBetween = function (value, start, finish) {
		this.setRampPoint(start);
		this.linearRampToValueAtTime(value, finish);
		return this;
	};

	/**
	 *  Do a exponential ramp to the given value between the start and finish times.
	 *  @param {Number} value The value to ramp to.
	 *  @param {Time} start The beginning anchor point to do the exponential ramp
	 *  @param {Time} finish The ending anchor point by which the value of
	 *                       the signal will equal the given value.
	 *  @returns {Tone.TimelineSignal} this
	 */
	Tone.TimelineSignal.prototype.exponentialRampToValueBetween = function (value, start, finish) {
		this.setRampPoint(start);
		this.exponentialRampToValueAtTime(value, finish);
		return this;
	};

	///////////////////////////////////////////////////////////////////////////
	//	GETTING SCHEDULED VALUES
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Returns the value before or equal to the given time
	 *  @param  {Number}  time  The time to query
	 *  @return  {Object}  The event at or before the given time.
	 *  @private
	 */
	Tone.TimelineSignal.prototype._searchBefore = function(time){
		return this._events.get(time);
	};

	/**
	 *  The event after the given time
	 *  @param  {Number}  time  The time to query.
	 *  @return  {Object}  The next event after the given time
	 *  @private
	 */
	Tone.TimelineSignal.prototype._searchAfter = function(time){
		return this._events.getAfter(time);
	};

	/**
	 *  Get the scheduled value at the given time. This will
	 *  return the unconverted (raw) value.
	 *  @param  {Number}  time  The time in seconds.
	 *  @return  {Number}  The scheduled value at the given time.
	 */
	Tone.TimelineSignal.prototype.getValueAtTime = function(time){
		time = this.toSeconds(time);
		var after = this._searchAfter(time);
		var before = this._searchBefore(time);
		var value = this._initial;
		//if it was set by
		if (before === null){
			value = this._initial;
		} else if (before.type === Tone.TimelineSignal.Type.Target){
			var previous = this._events.getBefore(before.time);
			var previouVal;
			if (previous === null){
				previouVal = this._initial;
			} else {
				previouVal = previous.value;
			}
			value = this._exponentialApproach(before.time, previouVal, before.value, before.constant, time);
		} else if (before.type === Tone.TimelineSignal.Type.Curve){
			value = this._curveInterpolate(before.time, before.value, before.duration, time);
		} else if (after === null){
			value = before.value;
		} else if (after.type === Tone.TimelineSignal.Type.Linear){
			value = this._linearInterpolate(before.time, before.value, after.time, after.value, time);
		} else if (after.type === Tone.TimelineSignal.Type.Exponential){
			value = this._exponentialInterpolate(before.time, before.value, after.time, after.value, time);
		} else {
			value = before.value;
		}
		return value;
	};

	/**
	 *  When signals connect to other signals or AudioParams, 
	 *  they take over the output value of that signal or AudioParam. 
	 *  For all other nodes, the behavior is the same as a default <code>connect</code>. 
	 *
	 *  @override
	 *  @param {AudioParam|AudioNode|Tone.Signal|Tone} node 
	 *  @param {number} [outputNumber=0] The output number to connect from.
	 *  @param {number} [inputNumber=0] The input number to connect to.
	 *  @returns {Tone.TimelineSignal} this
	 *  @method
	 */
	Tone.TimelineSignal.prototype.connect = Tone.SignalBase.prototype.connect;


	///////////////////////////////////////////////////////////////////////////
	//	AUTOMATION CURVE CALCULATIONS
	//	MIT License, copyright (c) 2014 Jordan Santell
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Calculates the the value along the curve produced by setTargetAtTime
	 *  @private
	 */
	Tone.TimelineSignal.prototype._exponentialApproach = function (t0, v0, v1, timeConstant, t) {
		return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
	};

	/**
	 *  Calculates the the value along the curve produced by linearRampToValueAtTime
	 *  @private
	 */
	Tone.TimelineSignal.prototype._linearInterpolate = function (t0, v0, t1, v1, t) {
		return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
	};

	/**
	 *  Calculates the the value along the curve produced by exponentialRampToValueAtTime
	 *  @private
	 */
	Tone.TimelineSignal.prototype._exponentialInterpolate = function (t0, v0, t1, v1, t) {
		v0 = Math.max(this._minOutput, v0);
		return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
	};

	/**
	 *  Calculates the the value along the curve produced by setValueCurveAtTime
	 *  @private
	 */
	Tone.TimelineSignal.prototype._curveInterpolate = function (start, curve, duration, time) {
		var len = curve.length;
		// If time is after duration, return the last curve value
		if (time >= start + duration) {
			return curve[len - 1];
		} else if (time <= start){
			return curve[0];
		} else {
			var progress = (time - start) / duration;
			var lowerIndex = Math.floor((len - 1) * progress);
			var upperIndex = Math.ceil((len - 1) * progress);
			var lowerVal = curve[lowerIndex];
			var upperVal = curve[upperIndex];
			if (upperIndex === lowerIndex){
				return lowerVal;
			} else {
				return this._linearInterpolate(lowerIndex, lowerVal, upperIndex, upperVal, progress * (len - 1));
			}
		}
	};

	/**
	 *  Clean up.
	 *  @return {Tone.TimelineSignal} this
	 */
	Tone.TimelineSignal.prototype.dispose = function(){
		Tone.Signal.prototype.dispose.call(this);
		this._events.dispose();
		this._events = null;
	};

	return Tone.TimelineSignal;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 129 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(5), __webpack_require__(48), __webpack_require__(26)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";
	
	/**
	 *  @class  Tone.Player is an audio file player with start, loop, and stop functions.
	 *  
	 *  @constructor
	 *  @extends {Tone.Source} 
	 *  @param {string|AudioBuffer} url Either the AudioBuffer or the url from
	 *                                  which to load the AudioBuffer
	 *  @param {function=} onload The function to invoke when the buffer is loaded. 
	 *                            Recommended to use Tone.Buffer.on('load') instead.
	 *  @example
	 * var player = new Tone.Player("./path/to/sample.mp3").toMaster();
	 * //play as soon as the buffer is loaded
	 * player.autostart = true;
	 */
	Tone.Player = function(url){

		var options;
		if (url instanceof Tone.Buffer){
			url = url.get();
			options = Tone.Player.defaults;
		} else {
			options = Tone.defaults(arguments, ["url", "onload"], Tone.Player);
		}		
		Tone.Source.call(this, options);

		/**
		 *  @private
		 *  @type {AudioBufferSourceNode}
		 */
		this._source = null;

		/**
		 *  If the file should play as soon
		 *  as the buffer is loaded. 
		 *  @type {boolean}
		 *  @example
		 * //will play as soon as it's loaded
		 * var player = new Tone.Player({
		 * 	"url" : "./path/to/sample.mp3",
		 * 	"autostart" : true,
		 * }).toMaster();
		 */
		this.autostart = options.autostart;
		
		/**
		 *  the buffer
		 *  @private
		 *  @type {Tone.Buffer}
		 */
		this._buffer = new Tone.Buffer({
			"url" : options.url, 
			"onload" : this._onload.bind(this, options.onload),
			"reverse" : options.reverse
		});
		if (url instanceof AudioBuffer){
			this._buffer.set(url);
		}

		/**
		 *  if the buffer should loop once it's over
		 *  @type {boolean}
		 *  @private
		 */
		this._loop = options.loop;

		/**
		 *  if 'loop' is true, the loop will start at this position
		 *  @type {Time}
		 *  @private
		 */
		this._loopStart = options.loopStart;

		/**
		 *  if 'loop' is true, the loop will end at this position
		 *  @type {Time}
		 *  @private
		 */
		this._loopEnd = options.loopEnd;

		/**
		 *  the playback rate
		 *  @private
		 *  @type {number}
		 */
		this._playbackRate = options.playbackRate;

		/**
		 *  Enabling retrigger will allow a player to be restarted
		 *  before the the previous 'start' is done playing. Otherwise, 
		 *  successive calls to Tone.Player.start will only start
		 *  the sample if it had played all the way through. 
		 *  @type {boolean}
		 */
		this.retrigger = options.retrigger;

		/**
		 *  The fadeIn time of the amplitude envelope.
		 *  @type {Time}
		 */
		this.fadeIn = options.fadeIn;

		/**
		 *  The fadeOut time of the amplitude envelope.
		 *  @type {Time}
		 */
		this.fadeOut = options.fadeOut;
	};

	Tone.extend(Tone.Player, Tone.Source);
	
	/**
	 *  the default parameters
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Tone.Player.defaults = {
		"onload" : Tone.noOp,
		"playbackRate" : 1,
		"loop" : false,
		"autostart" : false,
		"loopStart" : 0,
		"loopEnd" : 0,
		"retrigger" : false,
		"reverse" : false,
		"fadeIn" : 0,
		"fadeOut" : 0
	};

	/**
	 *  Load the audio file as an audio buffer.
	 *  Decodes the audio asynchronously and invokes
	 *  the callback once the audio buffer loads. 
	 *  Note: this does not need to be called if a url
	 *  was passed in to the constructor. Only use this
	 *  if you want to manually load a new url. 
	 * @param {string} url The url of the buffer to load.
	 *                     Filetype support depends on the
	 *                     browser.
	 *  @param  {function=} callback The function to invoke once
	 *                               the sample is loaded.
	 *  @returns {Promise}
	 */
	Tone.Player.prototype.load = function(url, callback){
		return this._buffer.load(url, this._onload.bind(this, callback));
	};

	/**
	 * Internal callback when the buffer is loaded.
	 * @private
	 */
	Tone.Player.prototype._onload = function(callback){
		callback = Tone.defaultArg(callback, Tone.noOp);
		callback(this);
		if (this.autostart){
			this.start();
		}
	};

	/**
	 *  Play the buffer at the given startTime. Optionally add an offset
	 *  and/or duration which will play the buffer from a position
	 *  within the buffer for the given duration. 
	 *  
	 *  @param  {Time} [startTime=now] When the player should start.
	 *  @param  {Time} [offset=0] The offset from the beginning of the sample
	 *                                 to start at. 
	 *  @param  {Time=} duration How long the sample should play. If no duration
	 *                                is given, it will default to the full length 
	 *                                of the sample (minus any offset)
	 *  @returns {Tone.Player} this
	 *  @memberOf Tone.Player#
	 *  @method start
	 *  @name start
	 */

	/**
	 *  Internal start method
	 *  @private
	 */
	Tone.Player.prototype._start = function(startTime, offset, duration){
		//if it's a loop the default offset is the loopstart point
		if (this._loop){
			offset = Tone.defaultArg(offset, this._loopStart);
		} else {
			//otherwise the default offset is 0
			offset = Tone.defaultArg(offset, 0);
		}

		//compute the values in seconds
		offset = this.toSeconds(offset);
		duration = Tone.defaultArg(duration, Math.max(this._buffer.duration - offset, 0));
		duration = this.toSeconds(duration);
		startTime = this.toSeconds(startTime);

		// //make the source
		this._source = new Tone.BufferSource({
			"buffer" : this._buffer,
			"loop" : this._loop,
			"loopStart" : this._loopStart,
			"loopEnd" : this._loopEnd,
			"playbackRate" : this._playbackRate,
			"fadeIn" : this.fadeIn,
			"fadeOut" : this.fadeOut,
		}).connect(this.output);

		//set the looping properties
		if (!this._loop && !this._synced){
			//if it's not looping, set the state change at the end of the sample
			this._state.setStateAtTime(Tone.State.Stopped, startTime + duration);
		}

		//start it
		if (this._loop){
			this._source.start(startTime, offset);
		} else {
			this._source.start(startTime, offset, duration);
		}
		return this;
	};

	/**
	 *  Stop playback.
	 *  @private
	 *  @param  {Time} [time=now]
	 *  @returns {Tone.Player} this
	 */
	Tone.Player.prototype._stop = function(time){
		if (this._source){
			this._source.stop(this.toSeconds(time));
		}
		return this;
	};


	/**
	 *  Seek to a specific time in the player's buffer. If the 
	 *  source is no longer playing at that time, it will stop.
	 *  If you seek to a time that 
	 *  @param {Time} offset The time to seek to.
	 *  @param {Time=} time The time for the seek event to occur.
	 *  @return {Tone.Player} this
	 *  @example
	 * source.start(0.2);
	 * source.stop(0.4);
	 */
	Tone.Player.prototype.seek = function(offset, time){
		time = this.toSeconds(time);
		if (this._state.getValueAtTime(time) === Tone.State.Started){
			offset = this.toSeconds(offset);
			// if it's currently playing, stop it
			this._stop(time);
			//restart it at the given time
			this._start(time, offset);
		}
		return this;
	};

	/**
	 *  Set the loop start and end. Will only loop if loop is 
	 *  set to true. 
	 *  @param {Time} loopStart The loop end time
	 *  @param {Time} loopEnd The loop end time
	 *  @returns {Tone.Player} this
	 *  @example
	 * //loop 0.1 seconds of the file. 
	 * player.setLoopPoints(0.2, 0.3);
	 * player.loop = true;
	 */
	Tone.Player.prototype.setLoopPoints = function(loopStart, loopEnd){
		this.loopStart = loopStart;
		this.loopEnd = loopEnd;
		return this;
	};

	/**
	 * If loop is true, the loop will start at this position. 
	 * @memberOf Tone.Player#
	 * @type {Time}
	 * @name loopStart
	 */
	Object.defineProperty(Tone.Player.prototype, "loopStart", {
		get : function(){
			return this._loopStart;
		}, 
		set : function(loopStart){
			this._loopStart = loopStart;
			if (this._source){
				this._source.loopStart = this.toSeconds(loopStart);
			}
		}
	});

	/**
	 * If loop is true, the loop will end at this position.
	 * @memberOf Tone.Player#
	 * @type {Time}
	 * @name loopEnd
	 */
	Object.defineProperty(Tone.Player.prototype, "loopEnd", {
		get : function(){
			return this._loopEnd;
		}, 
		set : function(loopEnd){
			this._loopEnd = loopEnd;
			if (this._source){
				this._source.loopEnd = this.toSeconds(loopEnd);
			}
		}
	});

	/**
	 * The audio buffer belonging to the player. 
	 * @memberOf Tone.Player#
	 * @type {Tone.Buffer}
	 * @name buffer
	 */
	Object.defineProperty(Tone.Player.prototype, "buffer", {
		get : function(){
			return this._buffer;
		}, 
		set : function(buffer){
			this._buffer.set(buffer);
		}
	});

	/**
	 * If the buffer should loop once it's over. 
	 * @memberOf Tone.Player#
	 * @type {boolean}
	 * @name loop
	 */
	Object.defineProperty(Tone.Player.prototype, "loop", {
		get : function(){
			return this._loop;
		}, 
		set : function(loop){
			this._loop = loop;
			if (this._source){
				this._source.loop = loop;
			}
		}
	});

	/**
	 * The playback speed. 1 is normal speed. This is not a signal because
	 * Safari and iOS currently don't support playbackRate as a signal.
	 * @memberOf Tone.Player#
	 * @type {number}
	 * @name playbackRate
	 */
	Object.defineProperty(Tone.Player.prototype, "playbackRate", {
		get : function(){
			return this._playbackRate;
		}, 
		set : function(rate){
			this._playbackRate = rate;
			if (this._source) {
				this._source.playbackRate.value = rate;
			}
		}
	});

	/**
	 * The direction the buffer should play in
	 * @memberOf Tone.Player#
	 * @type {boolean}
	 * @name reverse
	 */
	Object.defineProperty(Tone.Player.prototype, "reverse", {
		get : function(){
			return this._buffer.reverse;
		}, 
		set : function(rev){
			this._buffer.reverse = rev;
		}
	});

	/**
	 * If all the buffer is loaded
	 * @memberOf Tone.Player#
	 * @type {Boolean}
	 * @name loaded
	 * @readOnly
	 */
	Object.defineProperty(Tone.Player.prototype, "loaded", {
		get : function(){
			return this._buffer.loaded;
		}
	});

	/**
	 *  Dispose and disconnect.
	 *  @return {Tone.Player} this
	 */
	Tone.Player.prototype.dispose = function(){
		Tone.Source.prototype.dispose.call(this);
		if (this._source !== null){
			this._source.disconnect();
			this._source = null;
		}
		this._buffer.dispose();
		this._buffer = null;
		return this;
	};

	return Tone.Player;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 130 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(129), __webpack_require__(22)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Tone){

	"use strict";
	
	/**
	 *  @class  Tone.Players combines multiple [Tone.Player](Player) objects. 
	 *  
	 *  @constructor
	 *  @extends {Tone} 
	 *  @param {Object} urls An object mapping a name to a url.
	 *  @param {function=} onload The function to invoke when the buffer is loaded. 
	 */
	Tone.Players = function(urls){

		var args = Array.prototype.slice.call(arguments);
		args.shift();
		var options = Tone.defaults(args, ["onload"], Tone.Players);
		Tone.call(this);

		/**
		 *  The output volume node
		 *  @type  {Tone.Volume}
		 *  @private
		 */
		this._volume = this.output = new Tone.Volume(options.volume);

		/**
		 * The volume of the output in decibels.
		 * @type {Decibels}
		 * @signal
		 * @example
		 * source.volume.value = -6;
		 */
		this.volume = this._volume.volume;
		this._readOnly("volume");

		//make the output explicitly stereo
		this._volume.output.output.channelCount = 2;
		this._volume.output.output.channelCountMode = "explicit";
		//mute initially
		this.mute = options.mute;

		/**
		 * The container of all of the players
		 * @type {Object}
		 * @private
		 */
		this._players = {};

		/**
		 * The loading count
		 * @type {Number}
		 * @private
		 */
		this._loadingCount = 0;

		/**
		 * private holder of the fadeIn time
		 * @type {Time}
		 * @private
		 */
		this._fadeIn = options.fadeIn;

		/**
		 * private holder of the fadeOut time
		 * @type {Time}
		 * @private
		 */
		this._fadeOut = options.fadeOut;

		//add all of the players
		for (var name in urls){
			this._loadingCount++;
			this.add(name, urls[name], this._bufferLoaded.bind(this, options.onload));
		}
	};

	Tone.extend(Tone.Players);

	/**
	 * The default values
	 * @type {Object}
	 */
	Tone.Players.defaults = {
		"volume" : 0,
		"mute" : false,
		"onload" : Tone.noOp,
		"fadeIn" : 0,
		"fadeOut" : 0
	};

	/**
	 *  A buffer was loaded. decrement the counter.
	 *  @param  {Function}  callback 
	 *  @private
	 */
	Tone.Players.prototype._bufferLoaded = function(callback){
		this._loadingCount--;
		if (this._loadingCount === 0 && callback){
			callback(this);
		}
	};

	/**
	 * Mute the output. 
	 * @memberOf Tone.Source#
	 * @type {boolean}
	 * @name mute
	 * @example
	 * //mute the output
	 * source.mute = true;
	 */
	Object.defineProperty(Tone.Players.prototype, "mute", {
		get : function(){
			return this._volume.mute;
		}, 
		set : function(mute){
			this._volume.mute = mute;
		}
	});

	/**
	 * The fadeIn time of the amplitude envelope.
	 * @memberOf Tone.Source#
	 * @type {Time}
	 * @name fadeIn
	 */
	Object.defineProperty(Tone.Players.prototype, "fadeIn", {
		get : function(){
			return this._fadeIn;
		}, 
		set : function(fadeIn){
			this._fadeIn = fadeIn;
			this._forEach(function(player){
				player.fadeIn = fadeIn;
			});
		}
	});

	/**
	 * The fadeOut time of the amplitude envelope.
	 * @memberOf Tone.Source#
	 * @type {Time}
	 * @name fadeOut
	 */
	Object.defineProperty(Tone.Players.prototype, "fadeOut", {
		get : function(){
			return this._fadeOut;
		}, 
		set : function(fadeOut){
			this._fadeOut = fadeOut;
			this._forEach(function(player){
				player.fadeOut = fadeOut;
			});
		}
	});

	/**
	 * The state of the players object. Returns "started" if any of the players are playing.
	 * @memberOf Tone.Players#
	 * @type {String}
	 * @name state
	 * @readOnly
	 */
	Object.defineProperty(Tone.Players.prototype, "state", {
		get : function(){
			var playing = false;
			this._forEach(function(player){
				playing = playing || player.state === Tone.State.Started;
			});
			return playing ? Tone.State.Started : Tone.State.Stopped;
		}
	});

	/**
	 *  True if the buffers object has a buffer by that name.
	 *  @param  {String|Number}  name  The key or index of the 
	 *                                 buffer.
	 *  @return  {Boolean}
	 */
	Tone.Players.prototype.has = function(name){
		return this._players.hasOwnProperty(name);
	};

	/**
	 *  Get a player by name. 
	 *  @param  {String}  name  The players name as defined in 
	 *                          the constructor object or `add` method. 
	 *  @return  {Tone.Player}
	 */
	Tone.Players.prototype.get = function(name){
		if (this.has(name)){
			return this._players[name];
		} else {
			throw new Error("Tone.Players: no player named "+name);
		}
	};

	/**
	 * Iterate over all of the players
	 * @param  {Function} callback
	 * @return {Tone.Players}            this
	 * @private
	 */
	Tone.Players.prototype._forEach = function(callback){
		for (var playerName in this._players){
			callback(this._players[playerName], playerName);
		}
		return this;
	};

	/**
	 * If all the buffers are loaded or not
	 * @memberOf Tone.Players#
	 * @type {Boolean}
	 * @name loaded
	 * @readOnly
	 */
	Object.defineProperty(Tone.Players.prototype, "loaded", {
		get : function(){
			var isLoaded = true;
			this._forEach(function(player){
				isLoaded = isLoaded && player.loaded;
			});
			return isLoaded;
		}
	});

	/**
	 *  Add a player by name and url to the Players
	 *  @param  {String}    name      A unique name to give the player
	 *  @param  {String|Tone.Buffer|Audiobuffer}  url  Either the url of the bufer, 
	 *                                                 or a buffer which will be added
	 *                                                 with the given name.
	 *  @param  {Function=}  callback  The callback to invoke 
	 *                                 when the url is loaded.
	 */
	Tone.Players.prototype.add = function(name, url, callback){
		this._players[name] = new Tone.Player(url, callback).connect(this.output);
		this._players[name].fadeIn = this._fadeIn;
		this._players[name].fadeOut = this._fadeOut;
		return this;
	};

	/**
	 * Stop all of the players at the given time
	 * @param {Time} time The time to stop all of the players.
	 * @return {Tone.Players} this
	 */
	Tone.Players.prototype.stopAll = function(time){
		this._forEach(function(player){
			player.stop(time);
		});
	};

	/**
	 *  Dispose and disconnect.
	 *  @return {Tone.Players} this
	 */
	Tone.Players.prototype.dispose = function(){
		Tone.prototype.dispose.call(this);
		this._volume.dispose();
		this._volume = null;
		this._writable("volume");
		this.volume = null;
		this.output = null;
		this._forEach(function(player){
			player.dispose();
		});
		this._players = null;
		return this;
	};

	return Tone.Players;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 131 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(50)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	/**
	 *  @class Tone.Frequency is a primitive type for encoding Frequency values. 
	 *         Eventually all time values are evaluated to hertz
	 *         using the `eval` method. 
	 *  @constructor
	 *  @extends {Tone.TimeBase}
	 *  @param  {String|Number}  val    The time value.
	 *  @param  {String=}  units  The units of the value.
	 *  @example
	 * Tone.Frequency("C3") // 261
	 * Tone.Frequency(38, "midi") //
	 * Tone.Frequency("C3").transpose(4);
	 */
	Tone.Frequency = function(val, units){
		if (this instanceof Tone.Frequency){
			
			Tone.TimeBase.call(this, val, units);

		} else {
			return new Tone.Frequency(val, units);
		}
	};

	Tone.extend(Tone.Frequency, Tone.TimeBase);

	///////////////////////////////////////////////////////////////////////////
	//	AUGMENT BASE EXPRESSIONS
	///////////////////////////////////////////////////////////////////////////

	//clone the expressions so that 
	//we can add more without modifying the original
	Tone.Frequency.prototype._primaryExpressions = Object.create(Tone.TimeBase.prototype._primaryExpressions);

	/*
	 *  midi type primary expression
	 *  @type {Object}
	 *  @private
	 */
	Tone.Frequency.prototype._primaryExpressions.midi = {
		regexp : /^(\d+(?:\.\d+)?midi)/,
		method : function(value){
			return this.midiToFrequency(value);
		}	
	};

	/*
	 *  note type primary expression
	 *  @type {Object}
	 *  @private
	 */
	Tone.Frequency.prototype._primaryExpressions.note = {
		regexp : /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i,
		method : function(pitch, octave){
			var index = noteToScaleIndex[pitch.toLowerCase()];
			var noteNumber = index + (parseInt(octave) + 1) * 12;
			return this.midiToFrequency(noteNumber);
		}	
	};

	/*
	 *  BeatsBarsSixteenths type primary expression
	 *  @type {Object}
	 *  @private
	 */
	Tone.Frequency.prototype._primaryExpressions.tr = {
			regexp : /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?/,
			method : function(m, q, s){
			var total = 1;
			if (m && m !== "0"){
				total *= this._beatsToUnits(this._timeSignature() * parseFloat(m));
			}
			if (q && q !== "0"){
				total *= this._beatsToUnits(parseFloat(q));
			}
			if (s && s !== "0"){
				total *= this._beatsToUnits(parseFloat(s) / 4);
			}
			return total;
		}
	};

	///////////////////////////////////////////////////////////////////////////
	//	EXPRESSIONS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Transposes the frequency by the given number of semitones.
	 *  @param  {Interval}  interval
	 *  @return  {Tone.Frequency} this
	 *  @example
	 * Tone.Frequency("A4").transpose(3); //"C5"
	 */
	Tone.Frequency.prototype.transpose = function(interval){
		this._expr = function(expr, interval){
			var val = expr();
			return val * Tone.intervalToFrequencyRatio(interval);
		}.bind(this, this._expr, interval);
		return this;
	};

	/**
	 *  Takes an array of semitone intervals and returns
	 *  an array of frequencies transposed by those intervals.
	 *  @param  {Array}  intervals
	 *  @return  {Tone.Frequency} this
	 *  @example
	 * Tone.Frequency("A4").harmonize([0, 3, 7]); //["A4", "C5", "E5"]
	 */
	Tone.Frequency.prototype.harmonize = function(intervals){
		this._expr = function(expr, intervals){
			var val = expr();
			var ret = [];
			for (var i = 0; i < intervals.length; i++){
				ret[i] = val * Tone.intervalToFrequencyRatio(intervals[i]);
			}
			return ret;
		}.bind(this, this._expr, intervals);
		return this;
	};

	///////////////////////////////////////////////////////////////////////////
	//	UNIT CONVERSIONS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Return the value of the frequency as a MIDI note
	 *  @return  {MIDI}
	 *  @example
	 * Tone.Frequency("C4").toMidi(); //60
	 */
	Tone.Frequency.prototype.toMidi = function(){
		return this.frequencyToMidi(this.valueOf());
	};

	/**
	 *  Return the value of the frequency in Scientific Pitch Notation
	 *  @return  {Note}
	 *  @example
	 * Tone.Frequency(69, "midi").toNote(); //"A4"
	 */
	Tone.Frequency.prototype.toNote = function(){
		var freq = this.valueOf();
		var log = Math.log(freq / Tone.Frequency.A4) / Math.LN2;
		var noteNumber = Math.round(12 * log) + 57;
		var octave = Math.floor(noteNumber/12);
		if(octave < 0){
			noteNumber += -12 * octave;
		}
		var noteName = scaleIndexToNote[noteNumber % 12];
		return noteName + octave.toString();
	};

	/**
	 *  Return the duration of one cycle in seconds.
	 *  @return  {Seconds}
	 */
	Tone.Frequency.prototype.toSeconds = function(){
		return 1 / this.valueOf();
	};

	/**
	 *  Return the value in Hertz
	 *  @return  {Frequency}
	 */
	Tone.Frequency.prototype.toFrequency = function(){
		return this.valueOf();
	};

	/**
	 *  Return the duration of one cycle in ticks
	 *  @return  {Ticks}
	 */
	Tone.Frequency.prototype.toTicks = function(){
		var quarterTime = this._beatsToUnits(1);
		var quarters = this.valueOf() / quarterTime;
		return Math.floor(quarters * Tone.Transport.PPQ);
	};

	///////////////////////////////////////////////////////////////////////////
	//	UNIT CONVERSIONS HELPERS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Returns the value of a frequency in the current units
	 *  @param {Frequency} freq
	 *  @return  {Number}
	 *  @private
	 */
	Tone.Frequency.prototype._frequencyToUnits = function(freq){
		return freq;
	};

	/**
	 *  Returns the value of a tick in the current time units
	 *  @param {Ticks} ticks
	 *  @return  {Number}
	 *  @private
	 */
	Tone.Frequency.prototype._ticksToUnits = function(ticks){
		return 1 / ((ticks * 60) / (Tone.Transport.bpm.value * Tone.Transport.PPQ));
	};

	/**
	 *  Return the value of the beats in the current units
	 *  @param {Number} beats
	 *  @return  {Number}
	 *  @private
	 */
	Tone.Frequency.prototype._beatsToUnits = function(beats){
		return 1 / Tone.TimeBase.prototype._beatsToUnits.call(this, beats);
	};

	/**
	 *  Returns the value of a second in the current units
	 *  @param {Seconds} seconds
	 *  @return  {Number}
	 *  @private
	 */
	Tone.Frequency.prototype._secondsToUnits = function(seconds){
		return 1 / seconds;
	};

	/**
	 *  The default units if none are given.
	 *  @private
	 */
	Tone.Frequency.prototype._defaultUnits = "hz";

	///////////////////////////////////////////////////////////////////////////
	//	FREQUENCY CONVERSIONS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Note to scale index
	 *  @type  {Object}
	 */
	var noteToScaleIndex = {
		"cbb" : -2, "cb" : -1, "c" : 0,  "c#" : 1,  "cx" : 2, 
		"dbb" : 0,  "db" : 1,  "d" : 2,  "d#" : 3,  "dx" : 4,
		"ebb" : 2,  "eb" : 3,  "e" : 4,  "e#" : 5,  "ex" : 6, 
		"fbb" : 3,  "fb" : 4,  "f" : 5,  "f#" : 6,  "fx" : 7,
		"gbb" : 5,  "gb" : 6,  "g" : 7,  "g#" : 8,  "gx" : 9,
		"abb" : 7,  "ab" : 8,  "a" : 9,  "a#" : 10, "ax" : 11,
		"bbb" : 9,  "bb" : 10, "b" : 11, "b#" : 12, "bx" : 13,
	};

	/**
	 *  scale index to note (sharps)
	 *  @type  {Array}
	 */
	var scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

	/**
	 *  The [concert pitch](https://en.wikipedia.org/wiki/Concert_pitch)
	 *  A4's values in Hertz. 
	 *  @type {Frequency}
	 *  @static
	 */
	Tone.Frequency.A4 = 440;

	/**
	 *  Convert a MIDI note to frequency value. 
	 *  @param  {MIDI} midi The midi number to convert.
	 *  @return {Frequency} the corresponding frequency value
	 *  @example
	 * tone.midiToFrequency(69); // returns 440
	 */
	Tone.Frequency.prototype.midiToFrequency = function(midi){
		return Tone.Frequency.A4 * Math.pow(2, (midi - 69) / 12);
	};

	/**
	 *  Convert a frequency value to a MIDI note.
	 *  @param {Frequency} frequency The value to frequency value to convert.
	 *  @returns  {MIDI}
	 *  @example
	 * tone.midiToFrequency(440); // returns 69
	 */
	Tone.Frequency.prototype.frequencyToMidi = function(frequency){
		return 69 + 12 * Math.log(frequency / Tone.Frequency.A4) / Math.LN2;
	};

	return Tone.Frequency;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 132 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(49)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Tone) {

	/**
	 *  @class Tone.TransportTime is a the time along the Transport's
	 *         timeline. It is similar to Tone.Time, but instead of evaluating
	 *         against the AudioContext's clock, it is evaluated against
	 *         the Transport's position. See [TransportTime wiki](https://github.com/Tonejs/Tone.js/wiki/TransportTime).
	 *  @constructor
	 *  @param  {Time}  val    The time value as a number or string
	 *  @param  {String=}  units  Unit values
	 *  @extends {Tone.Time}
	 */
	Tone.TransportTime = function(val, units){
		if (this instanceof Tone.TransportTime){
			
			Tone.Time.call(this, val, units);

		} else {
			return new Tone.TransportTime(val, units);
		}
	};

	Tone.extend(Tone.TransportTime, Tone.Time);

	//clone the expressions so that 
	//we can add more without modifying the original
	Tone.TransportTime.prototype._unaryExpressions = Object.create(Tone.Time.prototype._unaryExpressions);

	/**
	 *  Adds an additional unary expression
	 *  which quantizes values to the next subdivision
	 *  @type {Object}
	 *  @private
	 */
	Tone.TransportTime.prototype._unaryExpressions.quantize = {
		regexp : /^@/,
		method : function(rh){
			var subdivision = this._secondsToTicks(rh());
			var multiple = Math.ceil(Tone.Transport.ticks / subdivision);
			return this._ticksToUnits(multiple * subdivision);
		}
	};

	/**
	 *  Convert seconds into ticks
	 *  @param {Seconds} seconds
	 *  @return  {Ticks}
	 *  @private
	 */
	Tone.TransportTime.prototype._secondsToTicks = function(seconds){
		var quarterTime = this._beatsToUnits(1);
		var quarters = seconds / quarterTime;
		return Math.round(quarters * Tone.Transport.PPQ);
	};

	/**
	 *  Evaluate the time expression. Returns values in ticks
	 *  @return {Ticks}
	 */
	Tone.TransportTime.prototype.valueOf = function(){
		var val = this._secondsToTicks(this._expr());
		return val + (this._plusNow ? Tone.Transport.ticks : 0);
	};

	/**
	 *  Return the time in ticks.
	 *  @return  {Ticks}
	 */
	Tone.TransportTime.prototype.toTicks = function(){
		return this.valueOf();
	};

	/**
	 *  Return the time in seconds.
	 *  @return  {Seconds}
	 */
	Tone.TransportTime.prototype.toSeconds = function(){
		var val = this._expr();
		return val + (this._plusNow ? Tone.Transport.seconds : 0);
	};

	/**
	 *  Return the time as a frequency value
	 *  @return  {Frequency} 
	 */
	Tone.TransportTime.prototype.toFrequency = function(){
		return 1/this.toSeconds();
	};

	return Tone.TransportTime;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 133 */
/***/ (function(module, exports) {

module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAAASklEQVR4Ae2WUQEAERTAtFLtfb7IEoAGALAF2O4ABmoBCBp0rj6jc/UZmat3waJHjz6Dvpl+/f7A5MSySSZBggQJufPx2/p8B4AIFY44W50u+/YAAAAASUVORK5CYII="

/***/ }),
/* 134 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(136)


/***/ }),
/* 135 */
/***/ (function(module, exports) {

;(function (global) {
    "use strict";

    var lastId = -1;

    // Visibility.js allow you to know, that your web page is in the background
    // tab and thus not visible to the user. This library is wrap under
    // Page Visibility API. It fix problems with different vendor prefixes and
    // add high-level useful functions.
    var self = {

        // Call callback only when page become to visible for user or
        // call it now if page is visible now or Page Visibility API
        // doesn’t supported.
        //
        // Return false if API isn’t supported, true if page is already visible
        // or listener ID (you can use it in `unbind` method) if page isn’t
        // visible now.
        //
        //   Visibility.onVisible(function () {
        //       startIntroAnimation();
        //   });
        onVisible: function (callback) {
            var support = self.isSupported();
            if ( !support || !self.hidden() ) {
                callback();
                return support;
            }

            var listener = self.change(function (e, state) {
                if ( !self.hidden() ) {
                    self.unbind(listener);
                    callback();
                }
            });
            return listener;
        },

        // Call callback when visibility will be changed. First argument for
        // callback will be original event object, second will be visibility
        // state name.
        //
        // Return listener ID to unbind listener by `unbind` method.
        //
        // If Page Visibility API doesn’t supported method will be return false
        // and callback never will be called.
        //
        //   Visibility.change(function(e, state) {
        //       Statistics.visibilityChange(state);
        //   });
        //
        // It is just proxy to `visibilitychange` event, but use vendor prefix.
        change: function (callback) {
            if ( !self.isSupported() ) {
                return false;
            }
            lastId += 1;
            var number = lastId;
            self._callbacks[number] = callback;
            self._listen();
            return number;
        },

        // Remove `change` listener by it ID.
        //
        //   var id = Visibility.change(function(e, state) {
        //       firstChangeCallback();
        //       Visibility.unbind(id);
        //   });
        unbind: function (id) {
            delete self._callbacks[id];
        },

        // Call `callback` in any state, expect “prerender”. If current state
        // is “prerender” it will wait until state will be changed.
        // If Page Visibility API doesn’t supported, it will call `callback`
        // immediately.
        //
        // Return false if API isn’t supported, true if page is already after
        // prerendering or listener ID (you can use it in `unbind` method)
        // if page is prerended now.
        //
        //   Visibility.afterPrerendering(function () {
        //       Statistics.countVisitor();
        //   });
        afterPrerendering: function (callback) {
            var support   = self.isSupported();
            var prerender = 'prerender';

            if ( !support || prerender != self.state() ) {
                callback();
                return support;
            }

            var listener = self.change(function (e, state) {
                if ( prerender != state ) {
                    self.unbind(listener);
                    callback();
                }
            });
            return listener;
        },

        // Return true if page now isn’t visible to user.
        //
        //   if ( !Visibility.hidden() ) {
        //       VideoPlayer.play();
        //   }
        //
        // It is just proxy to `document.hidden`, but use vendor prefix.
        hidden: function () {
            return !!(self._doc.hidden || self._doc.webkitHidden);
        },

        // Return visibility state: 'visible', 'hidden' or 'prerender'.
        //
        //   if ( 'prerender' == Visibility.state() ) {
        //       Statistics.pageIsPrerendering();
        //   }
        //
        // Don’t use `Visibility.state()` to detect, is page visible, because
        // visibility states can extend in next API versions.
        // Use more simpler and general `Visibility.hidden()` for this cases.
        //
        // It is just proxy to `document.visibilityState`, but use
        // vendor prefix.
        state: function () {
            return self._doc.visibilityState       ||
                   self._doc.webkitVisibilityState ||
                   'visible';
        },

        // Return true if browser support Page Visibility API.
        //
        //   if ( Visibility.isSupported() ) {
        //       Statistics.startTrackingVisibility();
        //       Visibility.change(function(e, state)) {
        //           Statistics.trackVisibility(state);
        //       });
        //   }
        isSupported: function () {
            return !!(self._doc.visibilityState ||
                      self._doc.webkitVisibilityState);
        },

        // Link to document object to change it in tests.
        _doc: document || {},

        // Callbacks from `change` method, that wait visibility changes.
        _callbacks: { },

        // Listener for `visibilitychange` event.
        _change: function(event) {
            var state = self.state();

            for ( var i in self._callbacks ) {
                self._callbacks[i].call(self._doc, event, state);
            }
        },

        // Set listener for `visibilitychange` event.
        _listen: function () {
            if ( self._init ) {
                return;
            }

            var event = 'visibilitychange';
            if ( self._doc.webkitVisibilityState ) {
                event = 'webkit' + event;
            }

            var listener = function () {
                self._change.apply(self, arguments);
            };
            if ( self._doc.addEventListener ) {
                self._doc.addEventListener(event, listener);
            } else {
                self._doc.attachEvent(event, listener);
            }
            self._init = true;
        }

    };

    if ( typeof(module) != 'undefined' && module.exports ) {
        module.exports = self;
    } else {
        global.Visibility = self;
    }

})(this);


/***/ }),
/* 136 */
/***/ (function(module, exports, __webpack_require__) {

;(function (window) {
    "use strict";

    var lastTimer = -1;

    var install = function (Visibility) {

        // Run callback every `interval` milliseconds if page is visible and
        // every `hiddenInterval` milliseconds if page is hidden.
        //
        //   Visibility.every(60 * 1000, 5 * 60 * 1000, function () {
        //       checkNewMails();
        //   });
        //
        // You can skip `hiddenInterval` and callback will be called only if
        // page is visible.
        //
        //   Visibility.every(1000, function () {
        //       updateCountdown();
        //   });
        //
        // It is analog of `setInterval(callback, interval)` but use visibility
        // state.
        //
        // It return timer ID, that you can use in `Visibility.stop(id)` to stop
        // timer (`clearInterval` analog).
        // Warning: timer ID is different from interval ID from `setInterval`,
        // so don’t use it in `clearInterval`.
        //
        // On change state from hidden to visible timers will be execute.
        Visibility.every = function (interval, hiddenInterval, callback) {
            Visibility._time();

            if ( !callback ) {
                callback = hiddenInterval;
                hiddenInterval = null;
            }

            lastTimer += 1;
            var number = lastTimer;

            Visibility._timers[number] = {
                visible:  interval,
                hidden:   hiddenInterval,
                callback: callback
            };
            Visibility._run(number, false);

            if ( Visibility.isSupported() ) {
                Visibility._listen();
            }
            return number;
        };

        // Stop timer from `every` method by it ID (`every` method return it).
        //
        //   slideshow = Visibility.every(5 * 1000, function () {
        //       changeSlide();
        //   });
        //   $('.stopSlideshow').click(function () {
        //       Visibility.stop(slideshow);
        //   });
        Visibility.stop = function(id) {
            if ( !Visibility._timers[id] ) {
                return false;
            }
            Visibility._stop(id);
            delete Visibility._timers[id];
            return true;
        };

        // Callbacks and intervals added by `every` method.
        Visibility._timers = { };

        // Initialize variables on page loading.
        Visibility._time = function () {
            if ( Visibility._timed ) {
                return;
            }
            Visibility._timed     = true;
            Visibility._wasHidden = Visibility.hidden();

            Visibility.change(function () {
                Visibility._stopRun();
                Visibility._wasHidden = Visibility.hidden();
            });
        };

        // Try to run timer from every method by it’s ID. It will be use
        // `interval` or `hiddenInterval` depending on visibility state.
        // If page is hidden and `hiddenInterval` is null,
        // it will not run timer.
        //
        // Argument `runNow` say, that timers must be execute now too.
        Visibility._run = function (id, runNow) {
            var interval,
                timer = Visibility._timers[id];

            if ( Visibility.hidden() ) {
                if ( null === timer.hidden ) {
                    return;
                }
                interval = timer.hidden;
            } else {
                interval = timer.visible;
            }

            var runner = function () {
                timer.last = new Date();
                timer.callback.call(window);
            }

            if ( runNow ) {
                var now  = new Date();
                var last = now - timer.last ;

                if ( interval > last ) {
                    timer.delay = setTimeout(function () {
                        timer.id = setInterval(runner, interval);
                        runner();
                    }, interval - last);
                } else {
                    timer.id = setInterval(runner, interval);
                    runner();
                }

            } else {
              timer.id = setInterval(runner, interval);
            }
        };

        // Stop timer from `every` method by it’s ID.
        Visibility._stop = function (id) {
            var timer = Visibility._timers[id];
            clearInterval(timer.id);
            clearTimeout(timer.delay);
            delete timer.id;
            delete timer.delay;
        };

        // Listener for `visibilitychange` event.
        Visibility._stopRun = function (event) {
            var isHidden  = Visibility.hidden(),
                wasHidden = Visibility._wasHidden;

            if ( (isHidden && !wasHidden) || (!isHidden && wasHidden) ) {
                for ( var i in Visibility._timers ) {
                    Visibility._stop(i);
                    Visibility._run(i, !isHidden);
                }
            }
        };

        return Visibility;
    }

    if ( typeof(module) != 'undefined' && module.exports ) {
        module.exports = install(__webpack_require__(135));
    } else {
        install(window.Visibility)
    }

})(window);


/***/ }),
/* 137 */
/***/ (function(module, exports, __webpack_require__) {

var require;var require;(function(f){if(true){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.webvrui = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return require(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(_dereq_,module,exports){
/*!
* screenfull
* v3.2.2 - 2017-06-14
* (c) Sindre Sorhus; MIT License
*/
(function () {
	'use strict';

	var document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};
	var isCommonjs = typeof module !== 'undefined' && module.exports;
	var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

	var fn = (function () {
		var val;

		var fnMap = [
			[
				'requestFullscreen',
				'exitFullscreen',
				'fullscreenElement',
				'fullscreenEnabled',
				'fullscreenchange',
				'fullscreenerror'
			],
			// New WebKit
			[
				'webkitRequestFullscreen',
				'webkitExitFullscreen',
				'webkitFullscreenElement',
				'webkitFullscreenEnabled',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			// Old WebKit (Safari 5.1)
			[
				'webkitRequestFullScreen',
				'webkitCancelFullScreen',
				'webkitCurrentFullScreenElement',
				'webkitCancelFullScreen',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			[
				'mozRequestFullScreen',
				'mozCancelFullScreen',
				'mozFullScreenElement',
				'mozFullScreenEnabled',
				'mozfullscreenchange',
				'mozfullscreenerror'
			],
			[
				'msRequestFullscreen',
				'msExitFullscreen',
				'msFullscreenElement',
				'msFullscreenEnabled',
				'MSFullscreenChange',
				'MSFullscreenError'
			]
		];

		var i = 0;
		var l = fnMap.length;
		var ret = {};

		for (; i < l; i++) {
			val = fnMap[i];
			if (val && val[1] in document) {
				for (i = 0; i < val.length; i++) {
					ret[fnMap[0][i]] = val[i];
				}
				return ret;
			}
		}

		return false;
	})();

	var screenfull = {
		request: function (elem) {
			var request = fn.requestFullscreen;

			elem = elem || document.documentElement;

			// Work around Safari 5.1 bug: reports support for
			// keyboard in fullscreen even though it doesn't.
			// Browser sniffing, since the alternative with
			// setTimeout is even worse.
			if (/5\.1[.\d]* Safari/.test(navigator.userAgent)) {
				elem[request]();
			} else {
				elem[request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);
			}
		},
		exit: function () {
			document[fn.exitFullscreen]();
		},
		toggle: function (elem) {
			if (this.isFullscreen) {
				this.exit();
			} else {
				this.request(elem);
			}
		},
		onchange: function (callback) {
			document.addEventListener(fn.fullscreenchange, callback, false);
		},
		onerror: function (callback) {
			document.addEventListener(fn.fullscreenerror, callback, false);
		},
		raw: fn
	};

	if (!fn) {
		if (isCommonjs) {
			module.exports = false;
		} else {
			window.screenfull = false;
		}

		return;
	}

	Object.defineProperties(screenfull, {
		isFullscreen: {
			get: function () {
				return Boolean(document[fn.fullscreenElement]);
			}
		},
		element: {
			enumerable: true,
			get: function () {
				return document[fn.fullscreenElement];
			}
		},
		enabled: {
			enumerable: true,
			get: function () {
				// Coerce to boolean in case of old WebKit
				return Boolean(document[fn.fullscreenEnabled]);
			}
		}
	});

	if (isCommonjs) {
		module.exports = screenfull;
	} else {
		window.screenfull = screenfull;
	}
})();

},{}],3:[function(_dereq_,module,exports){
'use strict';

var _enterVrButton = _dereq_('./enter-vr-button');

var _enterVrButton2 = _interopRequireDefault(_enterVrButton);

var _states = _dereq_('./states');

var _states2 = _interopRequireDefault(_states);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

/* global AFRAME */

if (typeof AFRAME !== 'undefined' && AFRAME) {
  AFRAME.registerComponent('webvr-ui', {
    dependencies: ['canvas'],

    schema: {
      enabled: { type: 'boolean', default: true },
      color: { type: 'string', default: 'white' },
      background: { type: 'string', default: 'black' },
      corners: { type: 'string', default: 'square' },
      disabledOpacity: { type: 'number', default: 0.5 },

      textEnterVRTitle: { type: 'string' },
      textExitVRTitle: { type: 'string' },
      textVRNotFoundTitle: { type: 'string' }
    },

    init: function init() {},

    update: function update() {
      var scene = document.querySelector('a-scene');
      scene.setAttribute('vr-mode-ui', { enabled: !this.data.enabled });

      if (this.data.enabled) {
        if (this.enterVREl) {
          return;
        }

        var options = {
          color: this.data.color,
          background: this.data.background,
          corners: this.data.corners,
          disabledOpacity: this.data.disabledOpacity,
          textEnterVRTitle: this.data.textEnterVRTitle,
          textExitVRTitle: this.data.textExitVRTitle,
          textVRNotFoundTitle: this.data.textVRNotFoundTitle,
          onRequestStateChange: function onRequestStateChange(state) {
            if (state == _states2.default.PRESENTING) {
              scene.enterVR();
            } else {
              scene.exitVR();
            }
            return false;
          }
        };

        var enterVR = this.enterVR = new _enterVrButton2.default(scene.canvas, options);

        this.enterVREl = enterVR.domElement;

        document.body.appendChild(enterVR.domElement);

        enterVR.domElement.style.position = 'absolute';
        enterVR.domElement.style.bottom = '10px';
        enterVR.domElement.style.left = '50%';
        enterVR.domElement.style.transform = 'translate(-50%, -50%)';
        enterVR.domElement.style.textAlign = 'center';
      } else {
        if (this.enterVREl) {
          this.enterVREl.parentNode.removeChild(this.enterVREl);
          this.enterVR.remove();
        }
      }
    },

    remove: function remove() {
      if (this.enterVREl) {
        this.enterVREl.parentNode.removeChild(this.enterVREl);
        this.enterVR.remove();
      }
    }
  });
}

},{"./enter-vr-button":5,"./states":7}],4:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
// Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

var _LOGO_SCALE = 0.8;
var _WEBVR_UI_CSS_INJECTED = {};

/**
 * Generate the innerHTML for the button
 *
 * @return {string} html of the button as string
 * @param {string} cssPrefix
 * @param {Number} height
 * @private
 */
var generateInnerHTML = function generateInnerHTML(cssPrefix, height) {
    var logoHeight = height * _LOGO_SCALE;
    var svgString = generateVRIconString(cssPrefix, logoHeight) + generateNoVRIconString(cssPrefix, logoHeight);

    return '<button class="' + cssPrefix + '-button">\n          <div class="' + cssPrefix + '-title"></div>\n          <div class="' + cssPrefix + '-logo" >' + svgString + '</div>\n        </button>';
};

/**
 * Inject the CSS string to the head of the document
 *
 * @param {string} cssText the css to inject
 */
var injectCSS = exports.injectCSS = function injectCSS(cssText) {
    // Create the css
    var style = document.createElement('style');
    style.innerHTML = cssText;

    var head = document.getElementsByTagName('head')[0];
    head.insertBefore(style, head.firstChild);
};

/**
 * Generate DOM element view for button
 *
 * @return {HTMLElement}
 * @param {Object} options
 */
var createDefaultView = exports.createDefaultView = function createDefaultView(options) {
    var fontSize = options.height / 3;
    if (options.injectCSS) {
        // Check that css isnt already injected
        if (!_WEBVR_UI_CSS_INJECTED[options.cssprefix]) {
            injectCSS(generateCSS(options, fontSize));
            _WEBVR_UI_CSS_INJECTED[options.cssprefix] = true;
        }
    }

    var el = document.createElement('div');
    el.innerHTML = generateInnerHTML(options.cssprefix, fontSize);
    return el.firstChild;
};

var createVRIcon = exports.createVRIcon = function createVRIcon(cssPrefix, height) {
    var el = document.createElement('div');
    el.innerHTML = generateVRIconString(cssPrefix, height);
    return el.firstChild;
};

var createNoVRIcon = exports.createNoVRIcon = function createNoVRIcon(cssPrefix, height) {
    var el = document.createElement('div');
    el.innerHTML = generateNoVRIconString(cssPrefix, height);
    return el.firstChild;
};

var generateVRIconString = function generateVRIconString(cssPrefix, height) {
    var aspect = 28 / 18;
    return '<svg class="' + cssPrefix + '-svg" version="1.1" x="0px" y="0px" \n        width="' + aspect * height + 'px" height="' + height + 'px" viewBox="0 0 28 18" xml:space="preserve">\n        <path d="M26.8,1.1C26.1,0.4,25.1,0,24.2,0H3.4c-1,0-1.7,0.4-2.4,1.1C0.3,1.7,0,2.7,0,3.6v10.7\n        c0,1,0.3,1.9,0.9,2.6C1.6,17.6,2.4,18,3.4,18h5c0.7,0,1.3-0.2,1.8-0.5c0.6-0.3,1-0.8,1.3-1.4l\n        1.5-2.6C13.2,13.1,13,13,14,13v0h-0.2 h0c0.3,0,0.7,0.1,0.8,0.5l1.4,2.6c0.3,0.6,0.8,1.1,1.3,\n        1.4c0.6,0.3,1.2,0.5,1.8,0.5h5c1,0,2-0.4,2.7-1.1c0.7-0.7,1.2-1.6,1.2-2.6 V3.6C28,2.7,27.5,\n        1.7,26.8,1.1z M7.4,11.8c-1.6,0-2.8-1.3-2.8-2.8c0-1.6,1.3-2.8,2.8-2.8c1.6,0,2.8,1.3,2.8,2.8\n        C10.2,10.5,8.9,11.8,7.4,11.8z M20.1,11.8c-1.6,0-2.8-1.3-2.8-2.8c0-1.6,1.3-2.8,2.8-2.8C21.7\n        ,6.2,23,7.4,23,9 C23,10.5,21.7,11.8,20.1,11.8z"/>\n    </svg>';
};

var generateNoVRIconString = function generateNoVRIconString(cssPrefix, height) {
    var aspect = 28 / 18;
    return '<svg class="' + cssPrefix + '-svg-error" x="0px" y="0px" \n        width="' + aspect * height + 'px" height="' + aspect * height + 'px" viewBox="0 0 28 28" xml:space="preserve">\n        <path d="M17.6,13.4c0-0.2-0.1-0.4-0.1-0.6c0-1.6,1.3-2.8,2.8-2.8s2.8,1.3,2.8,2.8s-1.3,2.8-2.8,2.8\n        c-0.2,0-0.4,0-0.6-0.1l5.9,5.9c0.5-0.2,0.9-0.4,1.3-0.8\n        c0.7-0.7,1.1-1.6,1.1-2.5V7.4c0-1-0.4-1.9-1.1-2.5c-0.7-0.7-1.6-1-2.5-1\n        H8.1 L17.6,13.4z"/>\n        <path d="M10.1,14.2c-0.5,0.9-1.4,1.4-2.4,1.4c-1.6,0-2.8-1.3-2.8-2.8c0-1.1,0.6-2,1.4-2.5\n        L0.9,5.1 C0.3,5.7,0,6.6,0,7.5v10.7c0,1,0.4,1.8,1.1,2.5c0.7,0.7,1.6,1,2.5,1\n        h5c0.7,0,1.3-0.1,1.8-0.5c0.6-0.3,1-0.8,1.3-1.4l1.3-2.6 L10.1,14.2z"/>\n        <path d="M25.5,27.5l-25-25C-0.1,2-0.1,1,0.5,0.4l0,0C1-0.1,2-0.1,2.6,0.4l25,25c0.6,0.6,0.6,1.5\n        ,0,2.1l0,0 C27,28.1,26,28.1,25.5,27.5z"/>\n    </svg>';
};

/**
 * Generate the CSS string to inject
 *
 * @param {Object} options
 * @param {Number} [fontSize=18]
 * @return {string}
 */
var generateCSS = exports.generateCSS = function generateCSS(options) {
    var fontSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 18;

    var height = options.height;
    var borderWidth = 2;
    var borderColor = options.background ? options.background : options.color;
    var cssPrefix = options.cssprefix;

    var borderRadius = void 0;
    if (options.corners == 'round') {
        borderRadius = options.height / 2;
    } else if (options.corners == 'square') {
        borderRadius = 2;
    } else {
        borderRadius = options.corners;
    }

    return '\n    @font-face {\n        font-family: \'Karla\';\n        font-style: normal;\n        font-weight: 400;\n        src: local(\'Karla\'), local(\'Karla-Regular\'), \n             url(https://fonts.gstatic.com/s/karla/v5/31P4mP32i98D9CEnGyeX9Q.woff2) format(\'woff2\');\n        unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;\n    }\n    @font-face {\n        font-family: \'Karla\';\n        font-style: normal;\n        font-weight: 400;\n        src: local(\'Karla\'), local(\'Karla-Regular\'), \n             url(https://fonts.gstatic.com/s/karla/v5/Zi_e6rBgGqv33BWF8WTq8g.woff2) format(\'woff2\');\n        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, \n                       U+20AC, U+2212, U+2215, U+E0FF, U+EFFD, U+F000;\n    }\n\n    button.' + cssPrefix + '-button {\n        font-family: \'Karla\', sans-serif;\n\n        border: ' + borderColor + ' ' + borderWidth + 'px solid;\n        border-radius: ' + borderRadius + 'px;\n        box-sizing: border-box;\n        background: ' + (options.background ? options.background : 'none') + ';\n\n        height: ' + height + 'px;\n        min-width: ' + fontSize * 9.6 + 'px;\n        display: inline-block;\n        position: relative;\n\n        cursor: pointer;\n    }\n    \n    button.' + cssPrefix + '-button:focus {\n      outline: none;\n    }\n\n    /*\n    * Logo\n    */\n\n    .' + cssPrefix + '-logo {\n        width: ' + height + 'px;\n        height: ' + height + 'px;\n        position: absolute;\n        top:0px;\n        left:0px;\n        width: ' + (height - 4) + 'px;\n        height: ' + (height - 4) + 'px;\n    }\n    .' + cssPrefix + '-svg {\n        fill: ' + options.color + ';\n        margin-top: ' + ((height - fontSize * _LOGO_SCALE) / 2 - 2) + 'px;\n        margin-left: ' + height / 3 + 'px;\n    }\n    .' + cssPrefix + '-svg-error {\n        fill: ' + options.color + ';\n        display:none;\n        margin-top: ' + ((height - 28 / 18 * fontSize * _LOGO_SCALE) / 2 - 2) + 'px;\n        margin-left: ' + height / 3 + 'px;\n    }\n\n\n    /*\n    * Title\n    */\n\n    .' + cssPrefix + '-title {\n        color: ' + options.color + ';\n        position: relative;\n        font-size: ' + fontSize + 'px;\n        padding-left: ' + height * 1.05 + 'px;\n        padding-right: ' + (borderRadius - 10 < 5 ? height / 3 : borderRadius - 10) + 'px;\n    }\n\n    /*\n    * disabled\n    */\n\n    button.' + cssPrefix + '-button[disabled=true] {\n        opacity: ' + options.disabledOpacity + ';\n        cursor: default;\n    }\n\n    button.' + cssPrefix + '-button[disabled=true] > .' + cssPrefix + '-logo > .' + cssPrefix + '-svg {\n        display:none;\n    }\n\n    button.' + cssPrefix + '-button[disabled=true] > .' + cssPrefix + '-logo > .' + cssPrefix + '-svg-error {\n        display:initial;\n    }\n  ';
};

},{}],5:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webvrManager = _dereq_('./webvr-manager');

var _webvrManager2 = _interopRequireDefault(_webvrManager);

var _dom = _dereq_('./dom');

var _states = _dereq_('./states');

var _states2 = _interopRequireDefault(_states);

var _eventemitter = _dereq_('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

/**
 * A button to allow easy-entry and messaging around a WebVR experience
 * @class
 */
var EnterVRButton = function (_EventEmitter) {
  _inherits(EnterVRButton, _EventEmitter);

  /**
   * Construct a new Enter VR Button
   * @constructor
   * @param {HTMLCanvasElement} sourceCanvas the canvas that you want to present in WebVR
   * @param {Object} [options] optional parameters
   * @param {HTMLElement} [options.domElement] provide your own domElement to bind to
   * @param {Boolean} [options.injectCSS=true] set to false if you want to write your own styles
   * @param {Function} [options.beforeEnter] should return a promise, opportunity to intercept request to enter
   * @param {Function} [options.beforeExit] should return a promise, opportunity to intercept request to exit
   * @param {Function} [options.onRequestStateChange] set to a function returning false to prevent default state changes
   * @param {string} [options.textEnterVRTitle] set the text for Enter VR
   * @param {string} [options.textVRNotFoundTitle] set the text for when a VR display is not found
   * @param {string} [options.textExitVRTitle] set the text for exiting VR
   * @param {string} [options.color] text and icon color
   * @param {string} [options.background] set to false for no brackground or a color
   * @param {string} [options.corners] set to 'round', 'square' or pixel value representing the corner radius
   * @param {string} [options.disabledOpacity] set opacity of button dom when disabled
   * @param {string} [options.cssprefix] set to change the css prefix from default 'webvr-ui'
   */
  function EnterVRButton(sourceCanvas, options) {
    _classCallCheck(this, EnterVRButton);

    var _this = _possibleConstructorReturn(this, (EnterVRButton.__proto__ || Object.getPrototypeOf(EnterVRButton)).call(this));

    options = options || {};

    options.color = options.color || 'rgb(80,168,252)';
    options.background = options.background || false;
    options.disabledOpacity = options.disabledOpacity || 0.5;
    options.height = options.height || 55;
    options.corners = options.corners || 'square';
    options.cssprefix = options.cssprefix || 'webvr-ui';

    options.textEnterVRTitle = options.textEnterVRTitle || 'ENTER VR';
    options.textVRNotFoundTitle = options.textVRNotFoundTitle || 'VR NOT FOUND';
    options.textExitVRTitle = options.textExitVRTitle || 'EXIT VR';

    options.onRequestStateChange = options.onRequestStateChange || function () {
      return true;
    };
    // Currently `beforeEnter` is unsupported by Firefox
    options.beforeEnter = options.beforeEnter || undefined;
    options.beforeExit = options.beforeExit || function () {
      return new Promise(function (resolve) {
        return resolve();
      });
    };

    options.injectCSS = options.injectCSS !== false;

    _this.options = options;

    _this.sourceCanvas = sourceCanvas;

    // Pass in your own domElement if you really dont want to use ours
    _this.domElement = options.domElement || (0, _dom.createDefaultView)(options);
    _this.__defaultDisplayStyle = _this.domElement.style.display || 'initial';

    // Create WebVR Manager
    _this.manager = new _webvrManager2.default();
    _this.manager.checkDisplays();
    _this.manager.addListener('change', function (state) {
      return _this.__onStateChange(state);
    });

    // Bind button click events to __onClick
    _this.domElement.addEventListener('click', function () {
      return _this.__onEnterVRClick();
    });

    _this.__forceDisabled = false;
    _this.setTitle(_this.options.textEnterVRTitle);
    return _this;
  }

  /**
   * Set the title of the button
   * @param {string} text
   * @return {EnterVRButton}
   */


  _createClass(EnterVRButton, [{
    key: 'setTitle',
    value: function setTitle(text) {
      this.domElement.title = text;
      ifChild(this.domElement, this.options.cssprefix, 'title', function (title) {
        if (!text) {
          title.style.display = 'none';
        } else {
          title.innerText = text;
          title.style.display = 'initial';
        }
      });

      return this;
    }

    /**
     * Set the tooltip of the button
     * @param {string} tooltip
     * @return {EnterVRButton}
     */

  }, {
    key: 'setTooltip',
    value: function setTooltip(tooltip) {
      this.domElement.title = tooltip;
      return this;
    }

    /**
     * Show the button
     * @return {EnterVRButton}
     */

  }, {
    key: 'show',
    value: function show() {
      this.domElement.style.display = this.__defaultDisplayStyle;
      this.emit('show');
      return this;
    }

    /**
     * Hide the button
     * @return {EnterVRButton}
     */

  }, {
    key: 'hide',
    value: function hide() {
      this.domElement.style.display = 'none';
      this.emit('hide');
      return this;
    }

    /**
     * Enable the button
     * @return {EnterVRButton}
     */

  }, {
    key: 'enable',
    value: function enable() {
      this.__setDisabledAttribute(false);
      this.__forceDisabled = false;
      return this;
    }

    /**
     * Disable the button from being clicked
     * @return {EnterVRButton}
     */

  }, {
    key: 'disable',
    value: function disable() {
      this.__setDisabledAttribute(true);
      this.__forceDisabled = true;
      return this;
    }

    /**
     * clean up object for garbage collection
     */

  }, {
    key: 'remove',
    value: function remove() {
      this.manager.remove();

      if (this.domElement.parentElement) {
        this.domElement.parentElement.removeChild(this.domElement);
      }
    }

    /**
     * Returns a promise getting the VRDisplay used
     * @return {Promise.<VRDisplay>}
     */

  }, {
    key: 'getVRDisplay',
    value: function getVRDisplay() {
      return _webvrManager2.default.getVRDisplay();
    }

    /**
     * Check if the canvas the button is connected to is currently presenting
     * @return {boolean}
     */

  }, {
    key: 'isPresenting',
    value: function isPresenting() {
      return this.state === _states2.default.PRESENTING || this.state == _states2.default.PRESENTING_FULLSCREEN;
    }

    /**
     * Request entering VR
     * @return {Promise}
     */

  }, {
    key: 'requestEnterVR',
    value: function requestEnterVR() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (_this2.options.onRequestStateChange(_states2.default.PRESENTING)) {
          if (_this2.options.beforeEnter) {
            return _this2.options.beforeEnter().then(function () {
              return _this2.manager.enterVR(_this2.manager.defaultDisplay, _this2.sourceCanvas);
            }).then(resolve);
          } else {
            return _this2.manager.enterVR(_this2.manager.defaultDisplay, _this2.sourceCanvas).then(resolve);
          }
        } else {
          reject(new Error(_states2.default.ERROR_REQUEST_STATE_CHANGE_REJECTED));
        }
      });
    }

    /**
     * Request exiting presentation mode
     * @return {Promise}
     */

  }, {
    key: 'requestExit',
    value: function requestExit() {
      var _this3 = this;

      var initialState = this.state;

      return new Promise(function (resolve, reject) {
        if (_this3.options.onRequestStateChange(_states2.default.READY_TO_PRESENT)) {
          return _this3.options.beforeExit().then(function () {
            return (
              // if we were presenting VR, exit VR, if we are
              // exiting fullscreen, exit fullscreen
              initialState === _states2.default.PRESENTING ? _this3.manager.exitVR(_this3.manager.defaultDisplay) : _this3.manager.exitFullscreen()
            );
          }).then(resolve);
        } else {
          reject(new Error(_states2.default.ERROR_REQUEST_STATE_CHANGE_REJECTED));
        }
      });
    }

    /**
     * Request entering the site in fullscreen, but not VR
     * @return {Promise}
     */

  }, {
    key: 'requestEnterFullscreen',
    value: function requestEnterFullscreen() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        if (_this4.options.onRequestStateChange(_states2.default.PRESENTING_FULLSCREEN)) {
          if (_this4.options.beforeEnter) {
            return _this4.options.beforeEnter().then(function () {
              return _this4.manager.enterFullscreen(_this4.sourceCanvas);
            }).then(resolve);
          } else {
            return _this4.manager.enterFullscreen(_this4.sourceCanvas).then(resolve);
          }
        } else {
          reject(new Error(_states2.default.ERROR_REQUEST_STATE_CHANGE_REJECTED));
        }
      });
    }

    /**
     * Set the disabled attribute
     * @param {boolean} disabled
     * @private
     */

  }, {
    key: '__setDisabledAttribute',
    value: function __setDisabledAttribute(disabled) {
      if (disabled || this.__forceDisabled) {
        this.domElement.setAttribute('disabled', 'true');
      } else {
        this.domElement.removeAttribute('disabled');
      }
    }

    /**
     * Handling click event from button
     * @private
     */

  }, {
    key: '__onEnterVRClick',
    value: function __onEnterVRClick() {
      if (this.state == _states2.default.READY_TO_PRESENT) {
        this.requestEnterVR();
      } else if (this.isPresenting()) {
        this.requestExit();
      }
    }

    /**
     * @param {State} state the state that its transitioning to
     * @private
     */

  }, {
    key: '__onStateChange',
    value: function __onStateChange(state) {
      if (state != this.state) {
        if (this.state === _states2.default.PRESENTING || this.state === _states2.default.PRESENTING_FULLSCREEN) {
          this.emit('exit', this.manager.defaultDisplay);
        }
        this.state = state;

        switch (state) {
          case _states2.default.READY_TO_PRESENT:
            this.show();
            this.setTitle(this.options.textEnterVRTitle);
            if (this.manager.defaultDisplay) {
              this.setTooltip('Enter VR using ' + this.manager.defaultDisplay.displayName);
            }
            this.__setDisabledAttribute(false);
            this.emit('ready', this.manager.defaultDisplay);
            break;

          case _states2.default.PRESENTING:
          case _states2.default.PRESENTING_FULLSCREEN:
            if (!this.manager.defaultDisplay || !this.manager.defaultDisplay.capabilities.hasExternalDisplay || state == _states2.default.PRESENTING_FULLSCREEN) {
              this.hide();
            }
            this.setTitle(this.options.textExitVRTitle);
            this.__setDisabledAttribute(false);
            this.emit('enter', this.manager.defaultDisplay);
            break;

          // Error states
          case _states2.default.ERROR_BROWSER_NOT_SUPPORTED:
            this.show();
            this.setTitle(this.options.textVRNotFoundTitle);
            this.setTooltip('Browser not supported');
            this.__setDisabledAttribute(true);
            this.emit('error', new Error(state));
            break;

          case _states2.default.ERROR_NO_PRESENTABLE_DISPLAYS:
            this.show();
            this.setTitle(this.options.textVRNotFoundTitle);
            this.setTooltip('No VR headset found.');
            this.__setDisabledAttribute(true);
            this.emit('error', new Error(state));
            break;

          case _states2.default.ERROR_REQUEST_TO_PRESENT_REJECTED:
            this.show();
            this.setTitle(this.options.textVRNotFoundTitle);
            this.setTooltip('Something went wrong trying to start presenting to your headset.');
            this.__setDisabledAttribute(true);
            this.emit('error', new Error(state));
            break;

          case _states2.default.ERROR_EXIT_PRESENT_REJECTED:
          default:
            this.show();
            this.setTitle(this.options.textVRNotFoundTitle);
            this.setTooltip('Unknown error.');
            this.__setDisabledAttribute(true);
            this.emit('error', new Error(state));
        }
      }
    }
  }]);

  return EnterVRButton;
}(_eventemitter2.default);

/**
 * Function checking if a specific css class exists as child of element.
 *
 * @param {HTMLElement} el element to find child in
 * @param {string} cssPrefix css prefix of button
 * @param {string} suffix class name
 * @param {function} fn function to call if child is found
 * @private
 */


exports.default = EnterVRButton;
var ifChild = function ifChild(el, cssPrefix, suffix, fn) {
  var c = el.querySelector('.' + cssPrefix + '-' + suffix);
  c && fn(c);
};

},{"./dom":4,"./states":7,"./webvr-manager":8,"eventemitter3":1}],6:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebVRManager = exports.State = exports.dom = exports.EnterVRButton = undefined;

var _webvrManager = _dereq_('./webvr-manager');

var _webvrManager2 = _interopRequireDefault(_webvrManager);

var _states = _dereq_('./states');

var _states2 = _interopRequireDefault(_states);

var _dom = _dereq_('./dom');

var dom = _interopRequireWildcard(_dom);

var _enterVrButton = _dereq_('./enter-vr-button');

var _enterVrButton2 = _interopRequireDefault(_enterVrButton);

_dereq_('./aframe-component');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.EnterVRButton = _enterVrButton2.default;
exports.dom = dom;
exports.State = _states2.default;
exports.WebVRManager = _webvrManager2.default; // Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

},{"./aframe-component":3,"./dom":4,"./enter-vr-button":5,"./states":7,"./webvr-manager":8}],7:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

// Not yet presenting, but ready to present
var READY_TO_PRESENT = 'ready';

// In presentation mode
var PRESENTING = 'presenting';
var PRESENTING_FULLSCREEN = 'presenting-fullscreen';

// Checking device availability
var PREPARING = 'preparing';

// Errors
var ERROR_NO_PRESENTABLE_DISPLAYS = 'error-no-presentable-displays';
var ERROR_BROWSER_NOT_SUPPORTED = 'error-browser-not-supported';
var ERROR_REQUEST_TO_PRESENT_REJECTED = 'error-request-to-present-rejected';
var ERROR_EXIT_PRESENT_REJECTED = 'error-exit-present-rejected';
var ERROR_REQUEST_STATE_CHANGE_REJECTED = 'error-request-state-change-rejected';
var ERROR_UNKOWN = 'error-unkown';

exports.default = {
  READY_TO_PRESENT: READY_TO_PRESENT,
  PRESENTING: PRESENTING,
  PRESENTING_FULLSCREEN: PRESENTING_FULLSCREEN,
  PREPARING: PREPARING,
  ERROR_NO_PRESENTABLE_DISPLAYS: ERROR_NO_PRESENTABLE_DISPLAYS,
  ERROR_BROWSER_NOT_SUPPORTED: ERROR_BROWSER_NOT_SUPPORTED,
  ERROR_REQUEST_TO_PRESENT_REJECTED: ERROR_REQUEST_TO_PRESENT_REJECTED,
  ERROR_EXIT_PRESENT_REJECTED: ERROR_EXIT_PRESENT_REJECTED,
  ERROR_REQUEST_STATE_CHANGE_REJECTED: ERROR_REQUEST_STATE_CHANGE_REJECTED,
  ERROR_UNKOWN: ERROR_UNKOWN
};

},{}],8:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _states = _dereq_('./states');

var _states2 = _interopRequireDefault(_states);

var _eventemitter = _dereq_('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _screenfull = _dereq_('screenfull');

var _screenfull2 = _interopRequireDefault(_screenfull);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

/**
 * WebVR Manager is a utility to handle VR displays
 */
var WebVRManager = function (_EventEmitter) {
  _inherits(WebVRManager, _EventEmitter);

  /**
   * Construct a new WebVRManager
   */
  function WebVRManager() {
    _classCallCheck(this, WebVRManager);

    var _this = _possibleConstructorReturn(this, (WebVRManager.__proto__ || Object.getPrototypeOf(WebVRManager)).call(this));

    _this.state = _states2.default.PREPARING;

    // Bind vr display present change event to __onVRDisplayPresentChange
    _this.__onVRDisplayPresentChange = _this.__onVRDisplayPresentChange.bind(_this);
    window.addEventListener('vrdisplaypresentchange', _this.__onVRDisplayPresentChange);

    _this.__onChangeFullscreen = _this.__onChangeFullscreen.bind(_this);
    if (_screenfull2.default.enabled) {
      document.addEventListener(_screenfull2.default.raw.fullscreenchange, _this.__onChangeFullscreen);
    }
    return _this;
  }

  /**
   * Check if the browser is compatible with WebVR and has headsets.
   * @return {Promise<VRDisplay>}
   */


  _createClass(WebVRManager, [{
    key: 'checkDisplays',
    value: function checkDisplays() {
      var _this2 = this;

      return WebVRManager.getVRDisplay().then(function (display) {
        _this2.defaultDisplay = display;
        _this2.__setState(_states2.default.READY_TO_PRESENT);
        return display;
      }).catch(function (e) {
        delete _this2.defaultDisplay;
        if (e.name == 'NO_DISPLAYS') {
          _this2.__setState(_states2.default.ERROR_NO_PRESENTABLE_DISPLAYS);
        } else if (e.name == 'WEBVR_UNSUPPORTED') {
          _this2.__setState(_states2.default.ERROR_BROWSER_NOT_SUPPORTED);
        } else {
          _this2.__setState(_states2.default.ERROR_UNKOWN);
        }
      });
    }

    /**
     * clean up object for garbage collection
     */

  }, {
    key: 'remove',
    value: function remove() {
      window.removeEventListener('vrdisplaypresentchange', this.__onVRDisplayPresentChange);
      if (_screenfull2.default.enabled) {
        document.removeEventListener(_screenfull2.default.raw.fullscreenchanged, this.__onChangeFullscreen);
      }

      this.removeAllListeners();
    }

    /**
     * returns promise returning list of available VR displays.
     * @return {Promise<VRDisplay>}
     */

  }, {
    key: 'enterVR',


    /**
     * Enter presentation mode with your set VR display
     * @param {VRDisplay} display the display to request present on
     * @param {HTMLCanvasElement} canvas
     * @return {Promise.<TResult>}
     */
    value: function enterVR(display, canvas) {
      var _this3 = this;

      this.presentedSource = canvas;
      return display.requestPresent([{
        source: canvas
      }]).then(function () {},
      // this could fail if:
      // 1. Display `canPresent` is false
      // 2. Canvas is invalid
      // 3. not executed via user interaction
      function () {
        return _this3.__setState(_states2.default.ERROR_REQUEST_TO_PRESENT_REJECTED);
      });
    }

    /**
     * Exit presentation mode on display
     * @param {VRDisplay} display
     * @return {Promise.<TResult>}
     */

  }, {
    key: 'exitVR',
    value: function exitVR(display) {
      var _this4 = this;

      return display.exitPresent().then(function () {
        _this4.presentedSource = undefined;
      },
      // this could fail if:
      // 1. exit requested while not currently presenting
      function () {
        return _this4.__setState(_states2.default.ERROR_EXIT_PRESENT_REJECTED);
      });
    }

    /**
     * Enter fullscreen mode
     * @param {HTMLCanvasElement} canvas
     * @return {boolean}
     */

  }, {
    key: 'enterFullscreen',
    value: function enterFullscreen(canvas) {
      if (_screenfull2.default.enabled) {
        _screenfull2.default.request(canvas);
      } else {
        // iOS
        this.__setState(_states2.default.PRESENTING_FULLSCREEN);
      }
      return true;
    }

    /**
     * Exit fullscreen mode
     * @return {boolean}
     */

  }, {
    key: 'exitFullscreen',
    value: function exitFullscreen() {
      if (_screenfull2.default.enabled && _screenfull2.default.isFullscreen) {
        _screenfull2.default.exit();
      } else if (this.state == _states2.default.PRESENTING_FULLSCREEN) {
        this.checkDisplays();
      }
      return true;
    }

    /**
     * Change the state of the manager
     * @param {State} state
     * @private
     */

  }, {
    key: '__setState',
    value: function __setState(state) {
      if (state != this.state) {
        this.emit('change', state, this.state);
        this.state = state;
      }
    }

    /**
     * Triggered on fullscreen change event
     * @param {Event} e
     * @private
     */

  }, {
    key: '__onChangeFullscreen',
    value: function __onChangeFullscreen(e) {
      if (_screenfull2.default.isFullscreen) {
        if (this.state != _states2.default.PRESENTING) {
          this.__setState(_states2.default.PRESENTING_FULLSCREEN);
        }
      } else {
        this.checkDisplays();
      }
    }

    /**
     * Triggered on vr present change
     * @param {Event} event
     * @private
     */

  }, {
    key: '__onVRDisplayPresentChange',
    value: function __onVRDisplayPresentChange(event) {
      try {
        var display = void 0;
        if (event.display) {
          // In chrome its supplied on the event
          display = event.display;
        } else if (event.detail && event.detail.display) {
          // Polyfill stores display under detail
          display = event.detail.display;
        }

        if (display && display.isPresenting && display.getLayers()[0].source !== this.presentedSource) {
          // this means a different instance of WebVRManager has requested to present
          return;
        }

        var isPresenting = this.defaultDisplay && this.defaultDisplay.isPresenting;
        this.__setState(isPresenting ? _states2.default.PRESENTING : _states2.default.READY_TO_PRESENT);
      } catch (err) {
        // continue regardless of error
      }
    }
  }], [{
    key: 'getVRDisplay',
    value: function getVRDisplay() {
      return new Promise(function (resolve, reject) {
        if (!navigator || !navigator.getVRDisplays) {
          var e = new Error('Browser not supporting WebVR');
          e.name = 'WEBVR_UNSUPPORTED';
          reject(e);
          return;
        }

        var rejectNoDisplay = function rejectNoDisplay() {
          // No displays are found.
          var e = new Error('No displays found');
          e.name = 'NO_DISPLAYS';
          reject(e);
        };

        navigator.getVRDisplays().then(function (displays) {
          // Promise succeeds, but check if there are any displays actually.
          for (var i = 0; i < displays.length; i++) {
            if (displays[i].capabilities.canPresent) {
              resolve(displays[i]);
              break;
            }
          }

          rejectNoDisplay();
        }, rejectNoDisplay);
      });
    }
  }]);

  return WebVRManager;
}(_eventemitter2.default);

exports.default = WebVRManager;

},{"./states":7,"eventemitter3":1,"screenfull":2}]},{},[6])(6)
});

/***/ }),
/* 138 */,
/* 139 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _domready = __webpack_require__(13);

var _domready2 = _interopRequireDefault(_domready);

__webpack_require__(54);

var _Config = __webpack_require__(4);

var _Splash = __webpack_require__(52);

var _Splash2 = _interopRequireDefault(_Splash);

var _initAframeScene = __webpack_require__(51);

var _initAframeScene2 = _interopRequireDefault(_initAframeScene);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function main() {
  if (_Config.supported) {
    console.log("-".repeat(100));
    (0, _Splash2.default)();
    (0, _initAframeScene2.default)();
  }
} /**
   * Copyright 2017 Google Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the 'License');
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an 'AS IS' BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

(0, _domready2.default)(main);

/***/ })
],[139]);