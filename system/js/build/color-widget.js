(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var colorWidget = require('../colors/colors-widget.js');

window.appColorsWidget = colorWidget.ColorsWidget;

},{"../colors/colors-widget.js":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    i18labels = require('../core/i18labels.js');

//Class ColorsWidget

var ColorsWidget = (function () {
    function ColorsWidget(btn, filters) {
        var referenz = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

        _classCallCheck(this, ColorsWidget);

        var me = this;

        this.isOpened = false;
        this.btn = btn;
        this.referenz = referenz;
        this.filters = filters || {};

        this._currentOption = null;

        this._node = (function () {
            var divMainC = undefined,
                dropdwn = undefined,
                ulColors = undefined,
                btnSave = undefined,
                btnCancel = undefined,
                colorPickerDiv = undefined,
                colorPickerJoe = undefined,
                key = undefined,
                filter = undefined,
                arrLis = [],
                divHolder = undefined,
                j = undefined,
                orderedNames = undefined,
                k = undefined,
                lenK = undefined,
                baseId = "colors-container-" + Math.round(Math.random() * 100000);

            //Main DOM element
            divMainC = document.createElement("div");
            divMainC.className = "colors-container";
            divMainC.innerHTML = "<h2>" + i18labels.CLICK_TO_CHANGE_COLORS + "</h2>";
            divMainC.id = baseId;

            divHolder = document.createElement("div");
            divHolder.className = "colors-container-top";

            dropdwn = document.createElement("SELECT");
            dropdwn.id = baseId + "-dropdwn";
            divHolder.appendChild(dropdwn);

            //Populate dropdown
            orderedNames = [];
            for (key in filters) {
                orderedNames.push({ name: filters[key].name, key: key });
            }
            orderedNames = orderedNames.sort(function (a, b) {
                return a.name >= b.name ? 1 : -1;
            });

            for (k = 0, lenK = orderedNames.length; k < lenK; k += 1) {
                key = orderedNames[k].key;
                filter = filters[key];
                arrLis.push("<option value='" + key + "'>" + filter.name + "</option>");
            }
            dropdwn.innerHTML = arrLis.join("");

            btnSave = document.createElement("button");
            btnSave.innerHTML = "SAVE";
            divHolder.appendChild(btnSave);

            btnCancel = document.createElement("button");
            btnCancel.innerHTML = "CANCEL";
            divHolder.appendChild(btnCancel);

            divMainC.appendChild(divHolder);

            ulColors = document.createElement("ul");
            ulColors.className = "colors-container-ulColors";
            ulColors.id = baseId + "-ulColors";
            divMainC.appendChild(ulColors);

            colorPickerDiv = document.createElement("div");
            colorPickerDiv.className = "colors-container-colorPicker";
            colorPickerDiv.id = baseId + "-colorPicker";
            divMainC.appendChild(colorPickerDiv);

            //Refs
            divMainC.dropdwn = dropdwn;
            divMainC.ulColors = ulColors;
            divMainC.colorPickerDiv = colorPickerDiv;
            divMainC.btnSave = btnSave;
            divMainC.btnCancel = btnCancel;
            divMainC.colorsTemp = {};

            document.body.appendChild(divMainC);

            if (btn) {
                __d__.addEventLnr(btn, "click", me.toggleHandler.bind(me));
                __d__.addEventLnr(dropdwn, "change", me.dropFilterChanged.bind(me));
                __d__.addEventLnr(btnCancel, "click", me.close.bind(me));
                __d__.addEventLnr(btnSave, "click", me.saveColors.bind(me));
                __d__.addEventLnr(ulColors, "click", me.selectOption.bind(me));
            }

            return divMainC;
        })();

        //Optional callbacks
        this.onToggled = null;
        this.onSaved = null;
        this.postUrl = null;

        this._jsonColors = {};
    }

    //Updates filters with json.colors

    _createClass(ColorsWidget, [{
        key: 'mergeColorSettings',
        value: function mergeColorSettings(json) {
            var jsonObj = json,
                key = undefined,
                color = undefined,
                key2 = undefined,
                filters = this.filters,
                arr = undefined,
                compoundKey = undefined;

            if (typeof json === "String") {
                jsonObj = JSON.parse(json);
            }
            if (!jsonObj.colors) {
                console.warn(i18labels.NO_COLOR_SETTINGS);return;
            }

            for (key in jsonObj.colors) {
                arr = key.split("___");

                if (!filters[arr[0]] || !filters[arr[0]].obs.hasOwnProperty(arr[1])) {
                    continue;
                }

                color = jsonObj.colors[key];
                filters[arr[0]].obs[arr[1]].color = color;
                filters[arr[0]].obs[arr[1]].hexColor = parseInt(color.replace(/^#/, ''), 16);
                filters[arr[0]].obs[arr[1]].colorIsRandom = false;
            }

            this._jsonColors = jsonObj.colors;
        }
    }, {
        key: 'toggleHandler',
        value: function toggleHandler(ev) {
            this.toggle(!this.isOpened);
        }
    }, {
        key: 'close',
        value: function close() {
            this.toggle(false);
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            var doOpen = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            var filters = this.filters;
            this._node.style.display = doOpen ? "block" : "none";
            this.isOpened = doOpen;

            if (!doOpen) {
                if (this.onToggled) {
                    this.onToggled(false);
                }return;
            }

            //Following code when the widget is opened
            this._node.colorsTemp = {};

            if (this.referenz && this.referenz.value !== "" && filters[this.referenz.value]) {
                this._node.dropdwn.value = this.referenz.value;
            }

            //Populate color options
            this.dropFilterChanged();

            //If callback
            if (this.onToggled) {
                this.onToggled(true);
            }
        }
    }, {
        key: '_makeHeightVisible',
        value: function _makeHeightVisible(h) {
            var hNum = Number(h),
                hInt = Math.floor(hNum),
                hDec = (hNum - hInt) * 1.2;
            return String(hInt + hDec).replace(".", "'") + "\"";
        }
    }, {
        key: 'dropFilterChanged',
        value: function dropFilterChanged() {
            var me = this,
                arr = [],
                key = undefined,
                tfLabels = { "0": "no", "1": "yes" },
                filterKey = this._node.dropdwn.value,
                currFilter = this.filters[filterKey],
                lis = undefined,
                firstLi = undefined,
                currColor = undefined,
                text = undefined,
                orderedKeys = undefined,
                m = undefined,
                lenM = undefined;

            orderedKeys = _.keys(currFilter.obs).sort();
            for (m = 0, lenM = orderedKeys.length; m < lenM; m += 1) {
                key = orderedKeys[m];
                currColor = me._node.colorsTemp[filterKey + "___" + key] || currFilter.obs[key].color;
                text = filterKey === "h" ? me._makeHeightVisible(key) : key;
                arr.push("<li class='" + (!currFilter.obs[key].colorIsRandom ? "customized" : "") + "' data-color='" + currColor + "' id='liColor_" + filterKey + "___" + key + "'><span style='background:" + currColor + "'> </span>" + (currFilter.tf ? tfLabels[key] : text) + "&nbsp;</li>");
            }

            this._node.ulColors.innerHTML = arr.join("");
            lis = this._node.ulColors.getElementsByTagName("LI");
            if (!lis || lis.length === 0) {
                return;
            }

            firstLi = lis[0];
            firstLi.className += " selected";
            this._currentOption = firstLi;

            //Initialize colorPicker
            if (!this._node.colorPickerJoe) {
                this._node.colorPickerJoe = colorjoe.rgb(this._node.colorPickerDiv, firstLi.getAttribute("data-color"), ['hex']);
                this._node.colorPickerJoe.on("change", function (color) {
                    var optionValue = me._currentOption.id.replace("liColor_", ""),
                        prevVal = me._currentOption.getAttribute("data-color"),
                        newVal = color.hex();

                    me._currentOption.setAttribute("data-color", newVal);
                    me._currentOption.getElementsByTagName("SPAN")[0].style.background = newVal;
                    me._node.colorsTemp[optionValue] = newVal;
                    if (prevVal !== newVal && me._currentOption.className.indexOf("customized") < 0) {
                        me._currentOption.className += " customized";
                    }
                });
            } else {
                this._node.colorPickerJoe.set(firstLi.getAttribute("data-color"));
            }
        }
    }, {
        key: 'selectOption',
        value: function selectOption(ev) {
            var me = this,
                li = ev.target,
                lis = undefined,
                j = undefined,
                lenJ = undefined;

            if (li.tagName !== "LI") {
                return;
            }
            lis = this._node.ulColors.getElementsByTagName("LI");
            if (li.className.indexOf("selected") >= 0) {
                return;
            }

            for (j = 0, lenJ = lis.length; j < lenJ; j += 1) {
                if (li !== lis[j]) {
                    lis[j].className = lis[j].className.replace("selected", "");
                }
            }

            setTimeout(function () {
                var newVal = li.getAttribute("data-color");

                li.className += " selected";
                me._node.colorPickerJoe.set(newVal, true);
                me._currentOption = li;

                setTimeout(function () {
                    var hex = me._node.colorPickerJoe.e.getElementsByTagName("INPUT");
                    if (hex && hex.length > 0) {
                        hex[0].value = newVal;
                    }
                }, 150);
            }, 150);
        }
    }, {
        key: 'saveColors',
        value: function saveColors() {
            var key = undefined,
                colorsTemp = this._node.colorsTemp,
                filters = this.filters,
                filtersCustomized = {},
                dataToPost = [],
                arr = undefined,
                color = undefined,
                req = undefined;

            for (key in colorsTemp) {
                arr = key.split("___");
                if (arr.length !== 2) {
                    continue;
                }

                color = colorsTemp[key];
                filters[arr[0]].obs[arr[1]].color = color;
                filters[arr[0]].obs[arr[1]].hexColor = parseInt(color.replace(/^#/, ''), 16);
                filters[arr[0]].obs[arr[1]].colorIsRandom = false;

                if (!filtersCustomized[arr[0]]) {
                    filtersCustomized[arr[0]] = true;
                }

                dataToPost.push({ attributeKey: arr[0], attributeValue: arr[1], hexColor: color });
            }

            this.close();

            if (this.onSaved) {
                this.onSaved(filters, colorsTemp, filtersCustomized);
            }

            if (!this.postUrl || dataToPost.length === 0) {
                return;
            }

            req = new XMLHttpRequest();
            req.open('POST', this.postUrl);
            req.setRequestHeader('Content-Type', 'application/json');
            req.onreadystatechange = function () {
                if (req.readyState === 4 && req.status === 200) {
                    console.log(req.responseText);
                }
            };
            req.send(JSON.stringify(dataToPost));
        }
    }, {
        key: 'getColors',
        value: function getColors() {
            var r = {},
                fltr = undefined,
                inst = undefined,
                filters = this.filters;
            for (fltr in filters) {
                r[fltr] = {};
                for (inst in filters[fltr].obs) {
                    r[fltr][inst] = { color: filters[fltr].obs[inst].color, colorIsRandom: filters[fltr].obs[inst].colorIsRandom };
                }
            }
            return r;
        }
    }]);

    return ColorsWidget;
})();

exports.ColorsWidget = ColorsWidget;

},{"../core/i18labels.js":3,"../utils/dom-utilities.js":4,"../utils/js-helpers.js":5}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var LOADING_DATA = "Loading 3D Model...";

exports.LOADING_DATA = LOADING_DATA;
var INVALID_DATA_SOURCE = "Error: Missing data source.";
exports.INVALID_DATA_SOURCE = INVALID_DATA_SOURCE;
var ERROR_PARSING_JSON = "Error while parsing the JSON file.";

exports.ERROR_PARSING_JSON = ERROR_PARSING_JSON;
var CLICK_TO_CHANGE_COLORS = "Click on colors to change them. <br /><em>A black dot means there is already a custom colour being used.</em>";
exports.CLICK_TO_CHANGE_COLORS = CLICK_TO_CHANGE_COLORS;
var NO_COLOR_SETTINGS = "No color settings found. Will use random.";

exports.NO_COLOR_SETTINGS = NO_COLOR_SETTINGS;
var PRINTOPTS_TITLE = "Please select the document options";
exports.PRINTOPTS_TITLE = PRINTOPTS_TITLE;
var PRINTOPTS_ORIENTATION = "Orientation";
exports.PRINTOPTS_ORIENTATION = PRINTOPTS_ORIENTATION;
var PRINTOPTS_ORIENTATION_LANDSCAPE = "Landscape";
exports.PRINTOPTS_ORIENTATION_LANDSCAPE = PRINTOPTS_ORIENTATION_LANDSCAPE;
var PRINTOPTS_ORIENTATION_PORTRAIT = "Portrait";
exports.PRINTOPTS_ORIENTATION_PORTRAIT = PRINTOPTS_ORIENTATION_PORTRAIT;
var PRINTOPTS_DPI = "Printer DPI";
exports.PRINTOPTS_DPI = PRINTOPTS_DPI;
var PRINTOPTS_SIZE = "Paper Size";
exports.PRINTOPTS_SIZE = PRINTOPTS_SIZE;
var PRINTOPTS_GO = "GENERATE PDF";
exports.PRINTOPTS_GO = PRINTOPTS_GO;
var PRINTOPTS_PERROW = "Bays per row";
exports.PRINTOPTS_PERROW = PRINTOPTS_PERROW;
var PRINTOPTS_COLORBY = "Colour by";
exports.PRINTOPTS_COLORBY = PRINTOPTS_COLORBY;
var PRINTOPTS_PAGEPROGRESS = "Generating pages, please wait...";
exports.PRINTOPTS_PAGEPROGRESS = PRINTOPTS_PAGEPROGRESS;
var PRINTOPTS_SENDINGPAGES = "Sending pages, please wait...";
exports.PRINTOPTS_SENDINGPAGES = PRINTOPTS_SENDINGPAGES;
var PRINTOPTS_DOWNLOAD = "Download PDF";
exports.PRINTOPTS_DOWNLOAD = PRINTOPTS_DOWNLOAD;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var isInputOrTextarea = function isInputOrTextarea(input) {
    return input && input.tagName && (input.tagName.toLowerCase() === "textarea" || input.tagName.toLowerCase() === "input" && input.type.toLowerCase() === "text");
};

exports.isInputOrTextarea = isInputOrTextarea;
var isHtmlNode = function isHtmlNode(input) {
    return typeof HTMLElement === "object" ? id instanceof HTMLElement : typeof id === "object" && id.nodeType === 1 && typeof id.nodeName === "string";
};

exports.isHtmlNode = isHtmlNode;
var addEventLnr = function addEventLnr(obj, type, fn) {
    if (window.attachEvent) {
        obj["e" + type + fn] = fn;
        obj[type + fn] = function () {
            obj["e" + type + fn](window.event);
        };
        obj.attachEvent("on" + type, obj[type + fn]);
    } else {
        obj.addEventListener(type, fn, false);
    }
};

exports.addEventLnr = addEventLnr;
var addEventDsptchr = function addEventDsptchr(eName) {
    if (window.Event && typeof window.Event === "function") {
        return new Event(eName);
    } else {
        var _event = document.createEvent('Event');
        _event.initEvent(eName, true, true);
        return _event;
    }
};
exports.addEventDsptchr = addEventDsptchr;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.callOnCondition = callOnCondition;
exports.lightenDarkenColor = lightenDarkenColor;
var isArray = function isArray(c) {
    return Array.isArray ? Array.isArray(c) : c instanceof Array;
};

exports.isArray = isArray;
var extend = function extend(base, newObj) {
    var key = undefined,
        obj = JSON.parse(JSON.stringify(base));

    if (newObj) {
        for (key in newObj) {
            if (Object.prototype.hasOwnProperty.call(newObj, key) && Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = newObj[key];
            }
        }
    }
    return obj;
};

exports.extend = extend;
var sortNumeric = function sortNumeric(a, b) {
    return a - b;
};

exports.sortNumeric = sortNumeric;
var trimString = function trimString(s) {
    var start = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
    var end = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

    var sTrimmed = s;
    if (start) {
        sTrimmed = sTrimmed.replace(/^\s\s*/, '');
    }
    if (end) {
        sTrimmed = sTrimmed.replace(/\s\s*$/, '');
    }
    return sTrimmed;
};

exports.trimString = trimString;
var arrayToSet = function arrayToSet(arr) {
    var j = undefined,
        lenJ = undefined,
        outputSet = new Set();
    for (j = 0, lenJ = arr.length; j < lenJ; j += 1) {
        var clazzName = trimString(arr[j]);
        if (!outputSet.has(clazzName)) {
            outputSet.add(clazzName);
        }
    }
    return ouputSet;
};

exports.arrayToSet = arrayToSet;
var objKeysToArray = function objKeysToArray(obj, sortN) {
    var key = undefined,
        arr = [];
    for (key in obj) {
        arr.push(key);
    }
    if (sortN) {
        arr = arr.sort(sortNumeric);
    }
    return arr;
};

exports.objKeysToArray = objKeysToArray;
var decimalToHex = function decimalToHex(d) {
    var hex = Number(d).toString(16);
    hex = "000000".substr(0, 6 - hex.length) + hex;
    return hex.toUpperCase();
};

exports.decimalToHex = decimalToHex;
var pad = function pad(num, size) {
    var s = "000" + String(num);
    return s.substr(s.length - size);
};

exports.pad = pad;
var getQueryParams = function getQueryParams() {
    var qs = document.location.search.split('+').join(' '),
        params = {},
        tokens = undefined,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
};

exports.getQueryParams = getQueryParams;

function callOnCondition(condition, ifTrueCall, ifFalseCall) {
    if (condition) {
        ifTrueCall.apply(null, arguments);
    } else {
        ifFalseCall.apply(null, arguments);
    }
}

;

function lightenDarkenColor(col, amt) {
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }

    var num = parseInt(col, 16);

    var r = (num >> 16) + amt;

    if (r > 255) r = 255;else if (r < 0) r = 0;

    var b = (num >> 8 & 0x00FF) + amt;

    if (b > 255) b = 255;else if (b < 0) b = 0;

    var g = (num & 0x0000FF) + amt;

    if (g > 255) g = 255;else if (g < 0) g = 0;

    return (usePound ? "#" : "") + (g | b << 8 | r << 16).toString(16);
}

;

},{}]},{},[1]);
