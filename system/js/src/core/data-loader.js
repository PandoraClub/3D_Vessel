var i18labels = require('./i18labels.js');
var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');

export class DataLoader {

    constructor(divLoading) {

        this.divLoading = divLoading;

    }
    
    //Takes an URL and loads the data. 
    //Promise: resolves with the data obj. 
    loadUrl (jsonUrl, loadingText = "", progressCallback = null) {
        let me = this;
        
        return new Promise(
            function(resolve, reject) {
                let req,
                    ajaxError = function (evt) {
                        if (me.divLoading) {
                            me.divLoading.setMessage(evt.responseText, true);
                            me.divLoading.updateLoader(0.0, 1.0);
                        }
                        console.error(evt);
                    },
                    transferProgress = (evt) => {
                        if (evt.lengthComputable) {
                            let percentComplete = evt.loaded / evt.total;
                            me.divLoading.updateLoader(percentComplete, 0.5);
                        }
                    };

                function transferComplete(ev) {
                    let d;
                    try {
                        if (req.status === 200) {
                            d = JSON.parse(req.responseText);
                            resolve(d); //<----- Resolves
                        } else {
                            reject(req.statusText);
                        }
                    }
                    catch( e ) {
                        reject(i18labels.ERROR_PARSING_JSON + " " + e.description);
                    }
                }//transferComplete

                if (!jsonUrl) {
                    reject(i18labels.INVALID_DATA_SOURCE);
                    return;
                }

                if (me.divLoading) {
                    me.divLoading.show();
                    me.divLoading.startAnimation();
                    if (loadingText) { me.divLoading.setMessage(loadingText); }
                }

                req = new XMLHttpRequest(); 

                __d__.addEventLnr(req, "load", transferComplete);
                __d__.addEventLnr(req, "error", ajaxError);
                if (me.divLoading || progressCallback !== null) { __d__.addEventLnr(req, "progress", progressCallback || transferProgress); }   

                req.open('GET', jsonUrl + (jsonUrl.indexOf("?") > 0 ? "&" : "?") + "t=" + (new Date()) * 1);                
                req.send();

            }
        );
        
    }

    //Takes a JSON Vessels info
    //Returns processed data
    generateStructuredData (d) {

        let lenD, j, obj, lenJ,
            hCalc, tmp,
            bb = 0, bc = 0, bt = 0,
            bays = {}, cells = {}, tiers = {}, 
            belowTiers,
            aboveTiers,
            data, dataNode, dataStructured, filters, dataStructuredKeysArr = [],
            key, keyEven, keyEvenPrev,
            iTierMin, iTierMinAbove,
            iTierMax, iTierMaxAbove,
            maxWidth = 0,
            lastBay = "",
            hasZeroCell = false,
            maxCell = 0,
            numContsByBay = {},
            containersIDs = {}, allContainerMeshesObj = {};
            
        function addStructured(ob) {
            let bay2 = ob.bay, ibay = ob.iBay;
            if (ibay % 2 === 0) { bay2 = __s__.pad(ibay - 1, 3)}

            if (!numContsByBay[ob.bay]) {
                numContsByBay[ob.bay] = 1;
            } else {
                numContsByBay[ob.bay] += 1;
            }
            
            if (!dataStructured[bay2]) {
                dataStructured[bay2] = { cells: {}, n: 0};
                dataStructured.n += 1;
                dataStructured[bay2].maxD = 20;
                dataStructuredKeysArr.push(bay2);
            }
            if (!dataStructured[bay2].cells[ob.cell]) {
                dataStructured[bay2].cells[ob.cell] = { tiers: {}, n: 0};
                dataStructured[bay2].n += 1;
                if (!hasZeroCell && ob.cell === "00") { hasZeroCell = true; }
            }
            dataStructured[bay2].cells[ob.cell].tiers[ob.tier] = ob;
            dataStructured[bay2].cells[ob.cell].n += 1;

            if (maxWidth < dataStructured[bay2].n) { maxWidth = dataStructured[bay2].n; }
            if (ob.depth > dataStructured[bay2].maxD) { dataStructured[bay2].maxD = ob.depth; }
            if (obj.tier < "70") {
                if(!belowTiers.tiers[obj.tier]) {
                    belowTiers.tiers[obj.tier] = { h: ob.h, accH: 0 };
                    belowTiers.n += 1;
                }
                if (ob.h > belowTiers.tiers[obj.tier].h) { belowTiers.tiers[obj.tier].h = ob.h; }
            } else {
                if(!aboveTiers.tiers[obj.tier]) {
                    aboveTiers.tiers[obj.tier] = { h: ob.h, accH: 0 };
                    aboveTiers.n += 1;
                }
            }
            if(!tiers[obj.tier]) {
                tiers[obj.tier] = { maxH: obj.h };
            } else {
                tiers[obj.tier].maxH = Math.max(tiers[obj.tier].maxH, obj.h);
            }
        }
        
        function addFilter(vv, name, tf) { 
            filters[vv] = { name: name, obs: {}, tf: tf }; 
        }
        
        function connectToFilters(ob) {
            if (!filters.s.obs[ob.s]) { filters.s.obs[ob.s] = { c: 1, indexes: [] }; }
            if (!filters.i.obs[ob.i]) { filters.i.obs[ob.i] = { c: 1, indexes: [] }; }
            if (!filters.r.obs[ob.r]) { filters.r.obs[ob.r] = { c: 1, indexes: [] }; }
            if (!filters.w.obs[ob.w]) { filters.w.obs[ob.w] = { c: 1, indexes: [] }; }
            if (!filters.o.obs[ob.o]) { filters.o.obs[ob.o] = { c: 1, indexes: [] }; }
            if (!filters.d.obs[ob.d]) { filters.d.obs[ob.d] = { c: 1, indexes: [] }; }
            if (!filters.f.obs[ob.f]) { filters.f.obs[ob.f] = { c: 1, indexes: [] }; }
            if (!filters.t.obs[ob.t]) { filters.t.obs[ob.t] = { c: 1, indexes: [] }; }
            if (!filters.x.obs[ob.x]) { filters.x.obs[ob.x] = { c: 1, indexes: [] }; }
            if (!filters.v.obs[ob.v]) { filters.v.obs[ob.v] = { c: 1, indexes: [] }; }
            if (!filters.l.obs[ob.l]) { filters.l.obs[ob.l] = { c: 1, indexes: [] }; }
            if (!filters.h.obs[ob.h]) { filters.h.obs[ob.h] = { c: 1, indexes: [] }; }
            filters.s.obs[ob.s].indexes.push(ob);
            filters.i.obs[ob.i].indexes.push(ob);
            filters.r.obs[ob.r].indexes.push(ob);
            filters.w.obs[ob.w].indexes.push(ob);
            filters.o.obs[ob.o].indexes.push(ob);
            filters.d.obs[ob.d].indexes.push(ob);
            filters.f.obs[ob.f].indexes.push(ob);
            filters.t.obs[ob.t].indexes.push(ob);
            filters.x.obs[ob.x].indexes.push(ob);
            filters.v.obs[ob.v].indexes.push(ob);
            filters.l.obs[ob.l].indexes.push(ob);
            filters.h.obs[ob.h].indexes.push(ob);
        }

        //Initialize the data object
        dataNode = d["3DVesselData"] || d["2DVesselData"];
        if (!dataNode) { console.error("No data!. Halting generateStructuredData."); return null; }
        data = {
            conts: dataNode,
            info: { contsL: dataNode.length }
        };

        //Initialize structured data objects
        dataStructured = { n: 0 };
        belowTiers = { n: 0, tiers: {} };
        aboveTiers = { n: 0, tiers: {} };

        //Initialize filters
        filters = {};
        addFilter("i", "Equipment Type", false);
        addFilter("s", "Is Full", true);
        addFilter("r", "Is Reefer", true);
        addFilter("w", "Is Hazardous", true);
        addFilter("t", "Is Tank", true);
        addFilter("x", "Is OOG", true);
        addFilter("o", "Line Operator", false);
        addFilter("d", "Port of Discharge", false);
        addFilter("f", "Port of Load", false);
        addFilter("v", "Is VGM Weight", true);
        addFilter("l", "Length", false);
        addFilter("h", "Height", false);

        //Iterate through data
        for (j = 0, lenD = data.conts.length; j < lenD; j += 1) {
            
            obj = data.conts[j];
            obj.bay = obj.p.substr(0, 3);
            obj.cell = obj.p.substr(3, 2);
            obj.tier = obj.p.substr(5, 2);
            obj.h = Number(Math.floor(obj.h)) + (obj.h - Math.floor(obj.h)) * 5 / 6;
            obj.depth = Number(Math.floor(obj.l)) + (obj.l - Math.floor(obj.l)) * 5 / 6;
            obj.iBay = Number(obj.bay);
            obj.iTier = Number(obj.tier);
            obj.myJ = j;
            obj.cDash = obj.c.replace(/\s/ig, "-");
            if (obj.f === undefined && obj.ld !== undefined) { obj.f = obj.ld; }
            
            containersIDs["cont_" + obj.cDash] = obj;
            
            addStructured(obj);
            connectToFilters(obj);
        }

        //Iterate trough bays
        lastBay = _.max(_.keys(dataStructured));
        for (j = 1, lenD = Number(lastBay); j <= lenD; j += 2) {
            key = __s__.pad(j, 3);
            keyEvenPrev = __s__.pad(j - 1, 3);

            if (!dataStructured[key]) { continue; }
            
            dataStructured[key].isBlockStart = true;
            if (numContsByBay[keyEvenPrev]) { dataStructured[key].isBlockStart = false; }

            dataStructured[key].maxCell = _.chain(dataStructured[key].cells).keys().sort().last().value();            
        }
        
        //Min/Max tiers below & above
        iTierMin = Number(_.min(_.keys(belowTiers.tiers)));                  
        iTierMinAbove = Number(_.min(_.keys(aboveTiers.tiers)));
        iTierMax = Number(_.max(_.keys(belowTiers.tiers)));                  
        iTierMaxAbove = Number(_.max(_.keys(aboveTiers.tiers)));

        return {
            data,
            dataStructured,
            dataStructuredKeysArr: dataStructuredKeysArr.sort(__s__.sortNumeric),
            belowTiers,
            aboveTiers,
            containersIDs,
            numContsByBay,
            allContainerMeshesObj,
            filters,
            iTierMin,
            iTierMinAbove,
            iTierMax,
            iTierMaxAbove,
            tiers,
            maxWidth,
            firstBay: _.min(_.keys(dataStructured)),
            lastBay,
            hasZeroCell
        };                           
                    
    }


}
