webpackJsonp([1],{

/***/ 138:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(53);

var _domready = __webpack_require__(13);

var _domready2 = _interopRequireDefault(_domready);

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

function sendEvent(category, action) {
	if (window.googleAnalytics) {
		window.googleAnalytics('send', 'event', category, action);
	}
}

var supportsWebAudio = function supportsWebAudio() {
	return !!(window.webkitAudioContext || window.AudioContext);
};

var supportsWebGL = function supportsWebGL() {
	var c = document.createElement('canvas');
	try {
		return window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'));
	} catch (e) {
		return false;
	}
};

(0, _domready2.default)(function () {
	var supported = supportsWebAudio() && supportsWebGL();
	if (!supported) {
		document.querySelector('#fallback').classList.add('visible');
		sendEvent('init', 'unsupported');
	} else {
		sendEvent('init', 'supported');
	}
});

/***/ }),

/***/ 53:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(80);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(11)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./fallback.scss", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./fallback.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 80:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(10)();
// imports


// module
exports.push([module.i, "#fallback {\n  position: absolute;\n  top: 0px;\n  left: 0px;\n  width: 100%;\n  height: 100%;\n  background-color: black;\n  color: white;\n  font-family: sans-serif;\n  display: none; }\n  #fallback #text {\n    line-height: 30px;\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    width: 300px;\n    font-size: 20px;\n    text-align: center;\n    transform: translate(-50%, -50%); }\n    #fallback #text a {\n      color: white; }\n  #fallback.visible {\n    display: block; }\n", ""]);

// exports


/***/ })

},[138]);