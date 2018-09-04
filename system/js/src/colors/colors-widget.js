var __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    i18labels = require('../core/i18labels.js');

//Class ColorsWidget
export class ColorsWidget {
    constructor(btn, filters, referenz = null) {
        let me = this;
        
        this.isOpened = false;
        this.btn = btn;
        this.referenz = referenz;
        this.filters = filters || {};

        this._currentOption = null;

        this._node = (function(){
            let divMainC, dropdwn, ulColors, btnSave, btnCancel, colorPickerDiv, colorPickerJoe,
                key, filter, arrLis = [], divHolder, j, orderedNames, k, lenK,
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
            for(key in filters) { orderedNames.push({name: filters[key].name, key: key }); }
            orderedNames = orderedNames.sort((a, b) => a.name >= b.name ? 1 : -1 );

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
        }());

        //Optional callbacks
        this.onToggled = null;
        this.onSaved = null;
        this.postUrl = null;

        this._jsonColors = {};

    }

    //Updates filters with json.colors
    mergeColorSettings(json) {
        let jsonObj = json, key, color, key2, 
            filters = this.filters, arr, compoundKey;

        if (typeof(json) === "String") { jsonObj = JSON.parse(json); }
        if (!jsonObj.colors) { console.warn(i18labels.NO_COLOR_SETTINGS); return; }

        for (key in jsonObj.colors) {
            arr = key.split("___");

            if (!filters[arr[0]] || !filters[arr[0]].obs.hasOwnProperty(arr[1])) { continue; }

            color = jsonObj.colors[key];
            filters[arr[0]].obs[arr[1]].color = color;
            filters[arr[0]].obs[arr[1]].hexColor = parseInt(color.replace(/^#/, ''), 16);
            filters[arr[0]].obs[arr[1]].colorIsRandom = false;
            
        }

        this._jsonColors = jsonObj.colors;
    }

    toggleHandler(ev) {
        this.toggle(!this.isOpened);
    }

    close() {
        this.toggle(false);
    }

    toggle(doOpen = true) {
        let filters = this.filters;
        this._node.style.display = doOpen ? "block" : "none";
        this.isOpened = doOpen;

        if (!doOpen) { if (this.onToggled) { this.onToggled(false); } return; }

        //Following code when the widget is opened
        this._node.colorsTemp = {};

        if (this.referenz && this.referenz.value !== "" && filters[this.referenz.value]) {
            this._node.dropdwn.value = this.referenz.value;
        }

        //Populate color options
        this.dropFilterChanged();

        //If callback
        if (this.onToggled) { this.onToggled(true); }

    }

    _makeHeightVisible(h) {
        let hNum = Number(h),
            hInt = Math.floor(hNum),
            hDec = (hNum - hInt) * 1.2;
            return String(hInt + hDec).replace(".", "'") + "\"";
    }

    dropFilterChanged () {
        let me = this,
            arr = [], key,
            tfLabels = { "0" : "no", "1": "yes" },
            filterKey = this._node.dropdwn.value,
            currFilter = this.filters[filterKey],
            lis, firstLi, currColor, text,
            orderedKeys, m, lenM;

        orderedKeys = _.keys(currFilter.obs).sort();
        for(m = 0, lenM = orderedKeys.length; m < lenM; m += 1) {
            key = orderedKeys[m];
            currColor = me._node.colorsTemp[filterKey + "___" + key ] || currFilter.obs[key].color;
            text = (filterKey === "h" ? me._makeHeightVisible(key) : key);
            arr.push("<li class='" + (!currFilter.obs[key].colorIsRandom ? "customized" : "") + "' data-color='" + currColor + "' id='liColor_" + filterKey + "___" + key + "'><span style='background:" +
                currColor + "'> </span>" + 
                (currFilter.tf ? tfLabels[key] : text) + "&nbsp;</li>");
        }

        this._node.ulColors.innerHTML = arr.join("");
        lis = this._node.ulColors.getElementsByTagName("LI");
        if (!lis || lis.length === 0) { return; } 
        
        firstLi = lis[0];
        firstLi.className += " selected"; 
        this._currentOption = firstLi;
        
        //Initialize colorPicker
        if (!this._node.colorPickerJoe) {
            this._node.colorPickerJoe = colorjoe.rgb(this._node.colorPickerDiv, firstLi.getAttribute("data-color"), ['hex']);
            this._node.colorPickerJoe.on("change", function(color) {
                let optionValue = me._currentOption.id.replace("liColor_", ""),
                    prevVal = me._currentOption.getAttribute("data-color"),
                    newVal = color.hex();

                me._currentOption.setAttribute("data-color", newVal);
                me._currentOption.getElementsByTagName("SPAN")[0].style.background = newVal;
                me._node.colorsTemp[optionValue] = newVal;
                if (prevVal !== newVal && me._currentOption.className.indexOf("customized") < 0) { me._currentOption.className += " customized"; }
            });
        } else {
            this._node.colorPickerJoe.set(firstLi.getAttribute("data-color"));
        }
        
    }

    selectOption(ev) {
        let me = this,
            li = ev.target,
            lis, j, lenJ;

        if (li.tagName !== "LI") { return; }
        lis = this._node.ulColors.getElementsByTagName("LI");
        if (li.className.indexOf("selected") >= 0) { return; }

        for (j = 0, lenJ = lis.length; j < lenJ; j += 1) {
            if (li !== lis[j]) {
                lis[j].className = lis[j].className.replace("selected", "");
            }
        }

        setTimeout(function() {
            let newVal = li.getAttribute("data-color");

            li.className += " selected";
            me._node.colorPickerJoe.set(newVal, true);            
            me._currentOption = li;

            setTimeout(function() {
                let hex = (me._node.colorPickerJoe.e).getElementsByTagName("INPUT");
                if (hex && hex.length > 0) {hex[0].value = newVal; }
            }, 150);
            
        }, 150);
    }

    saveColors() {
        let key, 
            colorsTemp = this._node.colorsTemp,
            filters = this.filters, filtersCustomized = {},
            dataToPost = [],
            arr, color,
            req;

        for (key in colorsTemp) {
            arr = key.split("___");
            if (arr.length !== 2) { continue; }

            color = colorsTemp[key];
            filters[arr[0]].obs[arr[1]].color = color;
            filters[arr[0]].obs[arr[1]].hexColor = parseInt(color.replace(/^#/, ''), 16);
            filters[arr[0]].obs[arr[1]].colorIsRandom = false;

            if (!filtersCustomized[arr[0]]) { filtersCustomized[arr[0]] = true; }

            dataToPost.push({attributeKey: arr[0], attributeValue: arr[1], hexColor: color });
        }

        this.close();

        if (this.onSaved) {
            this.onSaved(filters, colorsTemp, filtersCustomized);
        }

        if (!this.postUrl || dataToPost.length === 0) { return; }

        req = new XMLHttpRequest();
        req.open('POST', this.postUrl);
        req.setRequestHeader('Content-Type', 'application/json');
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status === 200) {
                console.log(req.responseText);
            }
        }
        req.send(JSON.stringify(dataToPost));

    }

    getColors() {
        let r = {}, fltr, inst, filters = this.filters;
        for (fltr in filters) {
            r[fltr] = {};
            for (inst in filters[fltr].obs) {
                r[fltr][inst] = { color: filters[fltr].obs[inst].color, colorIsRandom: filters[fltr].obs[inst].colorIsRandom };
            }
        }
        return r;
    }

}