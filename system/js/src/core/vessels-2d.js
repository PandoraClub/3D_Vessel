var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');
var Preloader = require('../utils/preloader.js');
var DataLoader = require('./data-loader.js');
var ModelsFactory = require('./models-factory.js');
var i18labels = require('./i18labels.js');

//Class VesselsApp2D
export class VesselsApp2D {

    constructor (btnLaunch, opts = {}) {

        let me = this;

        const version = 1.0;

        this.options = __s__.extend({
            loaderColor: "#f2f2f2",
            loaderColorSucess: "#79e3da",
            sizes: [
                { name: "Letter", w: 8.5, h: 11.0 },
                { name: "Legal", w: 8.5, h: 14.0 },
                { name: "A4", w: 8.3, h: 11.7 },
                { name: "A3", w: 11.7, h: 16.5 }
            ],
            dpis: [
                { name: "300 dpi", res: 300 },
                { name: "150 dpi", res: 150 }
            ],
            extraSpace: { 
                labelsTopHeight: 8,
                labelsLeftWidth: 7,
                extraOOGratio: 1 / 4
            },
            padding: { w: 0.04, h: 11.0 },
            aboveBelowSep: 2,
        }, opts);

        this._node = (function(){
            let divMainC, divForm, divProgress,
                dropdwnOr, dropdwnSz, dropdwnDp, dropdwnRw, dropdwnClr, spanOr,
                ulColors, btnSave, btnCancel, colorPickerDiv, colorPickerJoe,
                key, filter, arrLis = [], divHolder, k,
                baseId = "printopts-container-" + Math.round(Math.random() * 100000);
            
            //Main DOM element
            divMainC = document.createElement("div");
            divMainC.className = "printopts-container";
            divMainC.id = baseId;

            divForm = document.createElement("div");
            divForm.className = "printopts-form";
            divForm.innerHTML = "<h2>" + i18labels.PRINTOPTS_TITLE + "</h2>";
            divForm.id = baseId + "-form";
            divMainC.appendChild(divForm);  

            divProgress = document.createElement("div");
            divProgress.className = "printopts-progress";
            divProgress.id = baseId + "-progress";
            divMainC.appendChild(divProgress);  

            divHolder = document.createElement("div");
            divHolder.className = "printopts-container-top";
            divForm.appendChild(divHolder);        

            //Orientation
            dropdwnOr = document.createElement("SELECT");
            dropdwnOr.id = baseId + "-dropdwn-orientation";
            divHolder.appendChild(dropdwnOr);

            arrLis = [];
            arrLis.push("<option value='0'>" + i18labels.PRINTOPTS_ORIENTATION_LANDSCAPE + "</option>");
            arrLis.push("<option value='1'>" + i18labels.PRINTOPTS_ORIENTATION_PORTRAIT + "</option>");
            dropdwnOr.innerHTML = arrLis.join("");

            //DPI
            dropdwnDp = document.createElement("SELECT");
            dropdwnDp.id = baseId + "-dropdwn-dpi";
            divHolder.appendChild(dropdwnDp);

            arrLis = [];
            for(key in me.options.dpis) {
                filter = me.options.dpis[key];
                arrLis.push("<option value='" + key + "'>" + filter.name + "</option>");
            }
            dropdwnDp.innerHTML = arrLis.join("");

            //Sizes
            dropdwnSz = document.createElement("SELECT");
            dropdwnSz.id = baseId + "-dropdwn-sizes";
            divHolder.appendChild(dropdwnSz);

            arrLis = [];
            for(key in me.options.sizes) {
                filter = me.options.sizes[key];
                arrLis.push("<option value='" + key + "'>" + filter.name + "</option>");
            }
            dropdwnSz.innerHTML = arrLis.join("");

            //Per Row
            dropdwnRw = document.createElement("SELECT");
            dropdwnRw.id = baseId + "-dropdwn-perrow";
            divHolder.appendChild(dropdwnRw);     

            //Color by
            dropdwnClr = document.createElement("SELECT");
            dropdwnClr.id = baseId + "-dropdwn-colorby";
            divHolder.appendChild(dropdwnClr);           

            //Buttons
            btnSave = document.createElement("button");
            btnSave.innerHTML = i18labels.PRINTOPTS_GO;
            btnSave.className = "save";
            divForm.appendChild(btnSave);

            spanOr = document.createElement("span");
            spanOr.innerHTML = " or ";
            divForm.appendChild(spanOr);

            btnCancel = document.createElement("button");
            btnCancel.innerHTML = "CANCEL";
            divForm.appendChild(btnCancel);

            //Refs
            divMainC.dropdwnOr = dropdwnOr;
            divMainC.dropdwnSz = dropdwnSz;
            divMainC.dropdwnDp = dropdwnDp;
            divMainC.dropdwnRw = dropdwnRw;
            divMainC.dropdwnClr = dropdwnClr;
            divMainC.btnSave = btnSave;
            divMainC.btnCancel = btnCancel;
            divMainC.divForm = divForm;
            divMainC.divProgress = divProgress;

            document.body.appendChild(divMainC);

            if (btnLaunch) {
                __d__.addEventLnr(btnLaunch, "click", me.toggleHandler.bind(me));
                __d__.addEventLnr(dropdwnOr, "change", me.dropFilterChanged.bind(me));
                __d__.addEventLnr(dropdwnSz, "change", me.dropFilterChanged.bind(me));
                __d__.addEventLnr(dropdwnDp, "change", me.dropFilterChanged.bind(me));
                __d__.addEventLnr(btnCancel, "click", me.close.bind(me));
                __d__.addEventLnr(btnSave, "click", me.launchPdfStart.bind(me));
            }
                 
            return divMainC;       
        }());

        this.title = "";
        this.btnLaunch = btnLaunch;
        this.width = 0;
        this.height = 0;
        this.inchFactor = 0;
        this.lineWidth = 1;

        this.baseUrl = "";
        this.baseDownloadUrl = "";
        this.data = null;
        this.dataLoader = new DataLoader.DataLoader(null);

        this.modelsFactory = null;

        //Optional callbacks
        this.onToggled = null;
        this.onSaved = null;
        this.postUrl = null;

        this._init();

        
    }//constructor

    loadUrl (jsonUrl, loadingMessage, progressCallback) {
        return this.dataLoader.loadUrl(jsonUrl, loadingMessage, progressCallback);
    }

    loadData (jsonObj) {
        return this.dataLoader.generateStructuredData(jsonObj);
    }

    _init () {
        let me = this, j, lenJ, mod;

        //Initialize models factory
        this.modelsFactory = new ModelsFactory.ModelsFactory(this);
    }

    dropFilterChanged() {
        let res = this.options.dpis[this._node.dropdwnDp.value].res,
            size = this.options.sizes[this._node.dropdwnSz.value],
            arrLis, k,
            rws, bayW,
            dropdwnRw = this._node.dropdwnRw,
            optsPaddingW = this.options.padding.w, paddingW;

        this.width =  res * size[this._node.dropdwnOr.value === "1" ? "w" : "h"];
        this.height = res * size[this._node.dropdwnOr.value !== "1" ? "w" : "h"] - 1;

        arrLis = [];
        arrLis.push("<option value='1'>" + i18labels.PRINTOPTS_PERROW + ": 1</option>");
        for(k = 2; k < 9; k +=1) {
            bayW = Math.round(this.width / (k * (1 + optsPaddingW)));
            if (bayW < res * 0.3) { break; }
            arrLis.push("<option data-w='" + bayW + "' value='" + k + "'>" + i18labels.PRINTOPTS_PERROW + ": " + k + "</option>");
        }
        dropdwnRw.innerHTML = arrLis.join("");
        dropdwnRw.selectedIndex = Math.floor(arrLis.length / 2);                      

    }

    applyColorsFilter(filters) {
        let arrLis = [], key, filter;
        for(key in filters) {
            filter = filters[key];
            arrLis.push("<option value='" + key + "'>" + i18labels.PRINTOPTS_COLORBY + ": " + filter.name + "</option>");
        }
        this._node.dropdwnClr.innerHTML = arrLis.join("");  
    }

    toggleHandler(ev) {
        this.toggle(!this.isOpened);
    }

    close() {
        this.toggle(false);
    }

    toggle(doOpen = true) {
        this._node.style.display = doOpen ? "block" : "none";
        this.isOpened = doOpen;

        if (!doOpen) { if (this.onToggled) { this.onToggled(false); } return; }

        this._node.divForm.style.display = "block";
        this._node.divProgress.style.display = "none";

        //Populate color options
        this.dropFilterChanged();

        //If callback
        if (this.onToggled) { this.onToggled(true); }

    }

    launchPdfStart() {
        let rws = this._node.dropdwnRw.value,
            res = this.options.dpis[this._node.dropdwnDp.value].res,
            filterBy = this._node.dropdwnClr.value,
            w = this.width,
            h = this.height;
        
        this.pdfStart(rws, res, w, h, filterBy);
    }

    pdfStart(rws, res, width, height, filterBy, inchFactor) {
        let me = this,
            aboveBelowSep = this.options.aboveBelowSep,
            data = this.data,
            dataStructured = _.clone(data.dataStructured),
            dataStructuredKeysArr = _.clone(data.dataStructuredKeysArr),
            hasZeroCell = data.hasZeroCell,
            maxH, maxW, j, lenJ,
            positionsX = [0],
            positionsY = [0],
            positions = [],
            bayW, bayWTotal, bayH, nextBayH,
            contHeight = 8, contWidth = 8,
            paddingW, optsPaddingW = me.options.padding.w,
            maxCell, cellsWidth, mapCells = {}, mapTiers = {}, tierH = 0,
            bayImages = [], canvasPage, ctxPage, pageX, pageY,
            divForm = this._node.divForm,
            divProgress = this._node.divProgress,
            labelsTopHeight = this.options.extraSpace.labelsTopHeight,
            labelsLeftWidth = this.options.extraSpace.labelsLeftWidth,
            extraOOGratio = this.options.extraSpace.extraOOGratio,
            extraHbase, 
            extraWbase,            
            boxW, boxH, boxTimesH, boxTop, boxLeft,  
            legendCanvases,  
            fontFactor = 1, doLog = true;

        function drawContainer(obj, inchFactor = me.inchFactor, noColor = false, onlyPlus = false) {
            let canvas = document.createElement("canvas"), ctx, color, txt; 
            
            canvas.width = contWidth * inchFactor;
            canvas.height = contHeight * inchFactor;
            ctx = canvas.getContext("2d");

            if (!noColor) {
                color = data.filters[filterBy].obs[obj[filterBy]].color;
                ctx.fillStyle = color;
                ctx.strokeStyle = __s__.lightenDarkenColor(color, -30);
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#666666";
            }

            ctx.lineWidth = 2 * me.lineWidth * inchFactor / me.inchFactor;
            ctx.rect(0, 0, contWidth * inchFactor, contHeight * inchFactor);
            ctx.fill();
            ctx.stroke();

            if (onlyPlus) {
                ctx.beginPath();
                ctx.fillStyle = "#666666";
                ctx.rect(contWidth * inchFactor / 9 * 4, contHeight * inchFactor / 9 * 3, contWidth * inchFactor / 9, contHeight * inchFactor / 9 * 3);
                ctx.fill();
                ctx.rect(contWidth * inchFactor / 9 * 3, contHeight * inchFactor / 9 * 4, contWidth * inchFactor / 9 * 3, contHeight * inchFactor / 9);
                ctx.fill();
                return canvas;
            }
        
            if (!obj.s) { //Not full
                txt = "e";
            } 
            if (obj.r) { //Reefer
                txt = "r";
            }

            if (txt) {
                let calcFactor = inchFactor / 4;
                if (rws < 7) { calcFactor = calcFactor + (8 - rws) * 0.2; }
                ctx.font = (14 * calcFactor) + "px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "#333333";
                ctx.fillText(txt, 4 * inchFactor, 7 * inchFactor);
            }

            if (obj.w) { //Hazardous
                ctx.strokeStyle = "#666666";
                ctx.lineWidth = 1;
                ctx.moveTo(0, contHeight * inchFactor / 2);
                ctx.lineTo(contWidth * inchFactor / 2, 0);
                ctx.lineTo(contWidth * inchFactor, contHeight * inchFactor / 2);
                ctx.lineTo(contWidth * inchFactor / 2, contHeight * inchFactor);
                ctx.lineTo(0, contHeight * inchFactor / 2);
                ctx.stroke();
            }

            if (obj.h === 9.5) { //High-cube
                ctx.fillStyle = "#333333";
                ctx.beginPath();
                ctx.moveTo(contWidth * inchFactor * 3 / 4, 0);
                ctx.lineTo(contWidth * inchFactor, contHeight * inchFactor / 3);
                ctx.lineTo(contWidth * inchFactor / 2, contHeight * inchFactor / 3);
                ctx.lineTo(contWidth * inchFactor * 3 / 4, 0);
                ctx.fill();
            }

            switch (obj.l) { //Length
                case 40:
                    ctx.fillStyle = "#333333";
                    ctx.beginPath();
                    ctx.rect(0, 0, contWidth * inchFactor / 2, 1 * inchFactor);
                    ctx.fill();
                    break;
                case 45:
                    ctx.moveTo(0, 0);
                    ctx.fillStyle = "#333333";
                    ctx.beginPath();
                    ctx.arc(0, 0, 3 * inchFactor, Math.PI * 2, Math.PI);
                    ctx.fill();
                    break;
            }

            return canvas;
        }

        function drawContainerPlus(obj, inchFactor = me.inchFactor, noColor = false) {
            return drawContainer(obj, inchFactor, noColor, true);
        }

        function drawContainerOOG(obj, inchFactor = me.inchFactor) {
            let canvas = document.createElement("canvas"), ctx, color, txt,
                oog = obj.g,
                cW = contWidth * inchFactor,
                cH = contHeight * inchFactor,
                extraH = contHeight * extraOOGratio * inchFactor, 
                extraW = contWidth * extraOOGratio * inchFactor,    
                tw = cW + extraH * 2,
                th = cH + extraW * 2;
            
            canvas.width = tw;
            canvas.height = th;
            ctx = canvas.getContext("2d");
            ctx.fillStyle = "#444444";

            if (oog.indexOf("t") >= 0) {
                ctx.beginPath();
                ctx.ellipse(tw / 2, extraH, cW / 2, extraH, 0, Math.PI, 2 * Math.PI);
                ctx.fill();
            }

            if (oog.indexOf("l") >= 0) {
                ctx.beginPath();
                ctx.ellipse(extraW, th / 2, extraW, cH / 2, 0, 1 / 2 * Math.PI, 3 / 2 * Math.PI);
                ctx.fill();
            }

            if (oog.indexOf("r") >= 0) {
                ctx.beginPath();
                ctx.ellipse(extraW + cW, th / 2, extraW, cH / 2, 0, 3 / 2 * Math.PI, 1 / 2 * Math.PI);
                ctx.fill();
            }

            if (oog.indexOf("f") >= 0) {
                ctx.beginPath();
                ctx.moveTo(extraW, extraH + cH / 4);
                ctx.lineTo(extraW + cW, extraH + cH / 4);
                ctx.stroke();
            }

            if (oog.indexOf("b") >= 0) {
                ctx.beginPath();
                ctx.moveTo(extraW, cH + extraH - cH / 4);
                ctx.lineTo(extraW + cW, cH + extraH - cH / 4);
                ctx.stroke();
            }

            if (oog.indexOf("x") >= 0) {
                ctx.beginPath();
                ctx.moveTo(extraW, extraH);
                ctx.lineTo(tw - extraW, th - extraH);
                ctx.moveTo(tw - extraW, extraH);
                ctx.lineTo(extraW, th - extraH);
                ctx.stroke();
            }                                

            return canvas;
        }
        
        function drawBay(key) {
            let t, tier, c, cell, dataBay = dataStructured[key], dataBay2,
                cnv, ctx, y, x, titleT = key, calcFactor,    
                contWidthCenter = Math.round(contWidth / 2) * me.inchFactor,
                contHeightFactored = contHeight * me.inchFactor,
                contWidthFactored = contWidth * me.inchFactor, doLog = true;

            cnv = document.createElement("canvas");
            cnv.width = bayWTotal;
            cnv.height = (maxH * me.inchFactor + labelsTopHeight * 2 * me.inchFactor);
            
            ctx = cnv.getContext("2d");

            if (dataBay.isBlockStart && dataBay.maxD > 20) {
                titleT += " (" + __s__.pad(Number(key) + 1, 3) + ")";
            }
            if (!dataBay.isBlockStart) {
                dataBay2 = dataStructured[__s__.pad(Number(key) - 2, 3)];
                if (dataBay2.maxD > 20) {
                    titleT += " (" + __s__.pad(Number(key) - 1, 3) + ")";
                }
            }

            calcFactor = fontFactor;
            if (rws < 7) { calcFactor = calcFactor + (8 - rws) * 0.2; }
            
            ctx.font = (24 * calcFactor) + "px Georgia";
            ctx.textAlign = "center";
            ctx.textBaseline="top"; 
            ctx.fillText(titleT, bayWTotal / 2, Math.max(labelsTopHeight / 2 * me.inchFactor, 0.5 * me.inchFactor));

            ctx.font = (10 * calcFactor) + "px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle"; 
            ctx.fillStyle = "#666666";
            ctx.strokeStyle = "#dddddd"
            ctx.lineWidth = 2 * me.lineWidth;
            ctx.save();

            console.log( "Step 1, Bay " + key);

            //Grid & Numbering
            x = Math.floor((_.max(mapCells) + contWidth + labelsLeftWidth * 1.5) * me.inchFactor);
            for (t in mapTiers) {
                y = (mapTiers[t] - contHeight + labelsTopHeight) * me.inchFactor + (contHeightFactored + 6) / 2;
                ctx.fillText(__s__.pad(t, 2), labelsLeftWidth / 2 * me.inchFactor, y);
                ctx.fillText(__s__.pad(t, 2), x, y);
            } 
            for (c in mapCells) {
                x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                ctx.fillText(__s__.pad(c, 2), contWidthCenter + x, (_.min(mapTiers) - labelsTopHeight * 0.5) * me.inchFactor); 
                ctx.fillText(__s__.pad(c, 2), contWidthCenter + x, (_.max(mapTiers) + labelsTopHeight * 1.5) * me.inchFactor);
                for (t in mapTiers) {
                    y = (mapTiers[t] - contHeight + labelsTopHeight) * me.inchFactor;
                    ctx.rect(x, y, contWidthFactored, contHeightFactored);
                    ctx.stroke();
                }
            }
            
            //Containers info
            for (c in dataBay.cells) {
                cell = dataBay.cells[c];
                for (t in cell.tiers) {
                    x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                    y = (mapTiers[Number(t)] - contHeight + labelsTopHeight) * me.inchFactor;
                    let cnt = drawContainer(cell.tiers[t]);
                    ctx.drawImage(cnt, x, y);
                }
            }

            //2nd pass for OOG extras icons
            for (c in dataBay.cells) {
                cell = dataBay.cells[c];
                for (t in cell.tiers) {
                    if (!cell.tiers[t].g) { continue; }
                    x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                    y = (mapTiers[Number(t)] - contHeight + labelsTopHeight) * me.inchFactor;
                    let cnt = drawContainerOOG(cell.tiers[t]);
                    ctx.drawImage(cnt, x - extraWbase, y - extraHbase);
                }
            }
            

            //Add even bays if not blockStart
            if (!dataBay.isBlockStart) {
                dataBay = dataStructured[__s__.pad(Number(key) - 2, 3)];
                if (dataBay) { 

                    for (c in dataBay.cells) {
                        cell = dataBay.cells[c];
                        for (t in cell.tiers) {
                            if (cell.tiers[t].iBay & 1) { continue; }
                            x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                            y = (mapTiers[Number(t)] - contHeight + labelsTopHeight) * me.inchFactor;
                            let cnt = drawContainerPlus(cell.tiers[t]);
                            ctx.drawImage(cnt, x, y);
                        }
                    }
                }
            }

            return cnv;
                
        }

        function drawLegend() {
            let f, cnv, ctx, 
                x = 0, 
                y = 0,
                xInit = Math.round(6 * me.inchFactor),
                yInit = Math.round(labelsTopHeight * me.inchFactor * 2),
                yHeight = (maxH * me.inchFactor + labelsTopHeight * 2 * me.inchFactor),
                yAdd = Math.round(14 * me.inchFactor),
                xPad = Math.round(18 * me.inchFactor),
                maxX = 0,
                calcFactor, containerFactor = 1.25,
                extraH = Math.round(contHeight * extraOOGratio * me.inchFactor * containerFactor), 
                extraW = Math.round(contWidth * extraOOGratio * me.inchFactor * containerFactor),
                obs, obj, canvases = [], columns = 0, 
                verticalNum = 0, verticalMax = 0;

            function addCanvas() {
                //create new canvas
                cnv = document.createElement("canvas");
                cnv.width = bayWTotal * 1.5;
                cnv.height = yHeight;
                ctx = cnv.getContext("2d");
                ctx.font = (19 * calcFactor) + "px Arial";
                ctx.textAlign = "left";
                ctx.fillStyle = "#444444";
                
                x = xInit; y = yInit; columns = 0;
                canvases.push(cnv);
            }

            function addLabel(txt, obj, cleanFilter = true) {
                if (cleanFilter) { obj[filterBy] = ""; }

                if (verticalNum === 0 && columns === 0) { addCanvas(); }
                y = verticalNum * yAdd + yInit;

                ctx.drawImage(drawContainer(obj, me.inchFactor * containerFactor, cleanFilter), x, y);
                if (obj.g) { ctx.drawImage(drawContainerOOG(obj, me.inchFactor * containerFactor), x - extraW, y - extraH); }
                
                ctx.fillText(txt, x + 14 * me.inchFactor, y + 8 * me.inchFactor);
                
                maxX = Math.round(Math.max(maxX, ctx.measureText(txt).width));
                verticalNum += 1;
                                
                if (verticalNum === verticalMax - 1) { 
                    y = yInit; x += xInit + xPad + maxX; maxX = 0; columns += 1; 
                    if (columns > 1) { columns = 0; x = xInit; } 
                    verticalNum = 0;
                }
            }

            calcFactor = fontFactor;
            if (rws < 7) { calcFactor = calcFactor + (8 - rws) * 0.2; }
            if (rws < 4) { containerFactor = 1.2; }

            verticalMax = Math.floor(yHeight / yAdd);
            verticalNum = 0;
                        
            for (f in data.filters[filterBy].obs) {
                obj = { s: 1 };
                obj[filterBy] = f;
                addLabel(f, obj, false);
            }

            //Add Labels
            addLabel("Hazardous", { s: 1, w: 1});
            addLabel("Empty", { s: 0});
            addLabel("Reefer", { s: 1, r: 1});
            addLabel("High-cube", { s: 1, h: 9.5});
            addLabel("40-footer", { s: 1, l: 40});
            addLabel("45-footer", { s: 1, l: 45});

            //Add OOG
            addLabel("Break Bulk", { s: 1, g: "x"});       
            addLabel("Oversize Top", { s: 1, g: "t"});       
            addLabel("Oversize Left", { s: 1, g: "l"});       
            addLabel("Oversize Right", { s: 1, g: "r"});       
            addLabel("Oversize Front", { s: 1, g: "f"});       
            addLabel("Oversize Back", { s: 1, g: "b"});       

            //console.log(canvases.length);
            return canvases;
        }

        function sendPagesToServer() {
            let postUrl = me.postUrl, reqUpload, json, isLndscp,
                j, lenJ, closeBtn,
                handlerUpload = (e) => {
                    if (e.lengthComputable) {
                        var percentage = Math.round((e.loaded * 100) / e.total);
                        divProgress.innerHTML = e.loaded < e.total ? percentage + "%" : "Finishing, please wait..." ;
                    }
                };

            //Serialize data
            isLndscp = me._node.dropdwnOr.value === "0";
            json = {
                title: me.title,
                numImages: bayImages.length,
                pageSize: me.options.sizes[me._node.dropdwnSz.value].name,
                pageSizeW: me.options.sizes[me._node.dropdwnSz.value][isLndscp ? "h" : "w"],
                pageSizeH: me.options.sizes[me._node.dropdwnSz.value][isLndscp ? "w" : "h"] - 1,
                pageOrientation: !isLndscp ? "P" : "L",
                filterBy: i18labels.PRINTOPTS_COLORBY + ": " + data.filters[filterBy].name,
                vesselName: me.metaData.vesselName,
                vesselCallSign: me.metaData.vesselCallSign,
                sender: me.metaData.sender,
                recipient: me.metaData.recipient,
                placeOfDeparture: me.metaData.placeOfDeparture,
                voyageNumber: me.metaData.voyageNumber,
                footerLeft: me.metaData.footerLeft,
                footerRight: me.metaData.footerRight,
                locationUrl: me.baseUrl,
                downloadUrl: me.baseDownloadUrl
            };
            for (j = 0, lenJ = bayImages.length; j < lenJ; j += 1) {
                json["page_" + j] = bayImages[j].toDataURL("image/png");
            }
            //console.log(json);

            //Send it to server
            reqUpload = jQuery.ajax({
                url: postUrl,
                type: "POST",
                data: json,
                timeout: 7200000 //2 hours
            });

            if (divProgress) {
                reqUpload.uploadProgress(handlerUpload);
            }
            
            reqUpload.fail(function(err) {
                console.error(err);
                if (!divProgress) { return; } 
                
                divProgress.innerHTML = "An error has ocurred.";
                closeBtn = document.createElement("button");
                closeBtn.innerHTML = "Close this window";
                __d__.addEventLnr(closeBtn, "click", me.close.bind(me));
                divProgress.appendChild(closeBtn);
            });

            reqUpload.done(function (result) {
                console.log(result);
                if (result.download) {
                    divProgress.innerHTML = "<a href='" + result.download + "' target='_blank'>Download PDF</a><br /><br />";
                    closeBtn = document.createElement("button");
                    closeBtn.innerHTML = "Close this window";
                    __d__.addEventLnr(closeBtn, "click", me.close.bind(me));
                    divProgress.appendChild(closeBtn);
                } else {
                    divProgress.innerHTML = "An error has ocurred.";                    
                }
            });
        }

        function extendBaysToMissing() {
            let j, lenJ, n,
                dataStructuredKeysArrExtended = [], cBay, key, iBay,
                nextOdd;

            for (j = 0, lenJ = dataStructuredKeysArr.length; j < lenJ; j += 1) {
                key = dataStructuredKeysArr[j];
                dataStructuredKeysArrExtended.push(key);
                iBay = Number(key);
                cBay = dataStructured[key]; 
                n = j + 1;

                if (cBay.isBlockStart && 
                    (n < lenJ && Number(dataStructuredKeysArr[n]) !== iBay + 2) || (n === lenJ)) {
                    nextOdd = __s__.pad(iBay + 2, 3);
                    dataStructuredKeysArrExtended.push(nextOdd);
                    dataStructured[nextOdd] = { 
                        n: 0, 
                        maxD: cBay.maxD,
                        isBlockStart: false,
                        cells: {},
                        maxCell: cBay.maxCell
                    };
                }
            }
            dataStructuredKeysArr = dataStructuredKeysArrExtended;
        }

        extendBaysToMissing();

        //Show progress
        if (divForm) { divForm.style.display = "none"; }
        if (divProgress) {
            divProgress.style.display = "block";
            divProgress.innerHTML = i18labels.PRINTOPTS_PAGEPROGRESS;
        }    

        maxH = (data.belowTiers.n + data.aboveTiers.n) * contHeight + aboveBelowSep * 2 + 2 * labelsTopHeight;
        maxW = (data.maxWidth + (hasZeroCell ? 1 : 0)) * contWidth + 2 * labelsLeftWidth;
        bayWTotal = Math.floor(width / (rws * (1 + optsPaddingW)));
        paddingW = Math.floor(bayWTotal * optsPaddingW);

        //Line width (depends on the resolution)
        this.lineWidth = Math.round(res / 300);

        //Pixels per inch factor
        this.inchFactor = bayWTotal / maxW; // (1 / Math.max(maxH / height, maxW / bayW));
        fontFactor = res / 300;

        bayW = Math.floor(bayWTotal - labelsLeftWidth * 2 * me.inchFactor);

        //Extra size for OOG
        extraHbase = contHeight * extraOOGratio * me.inchFactor;
        extraWbase = contWidth * extraOOGratio * me.inchFactor;       

        //Bay dimensions
        bayH = Math.floor((maxH + contHeight) * me.inchFactor);
        nextBayH = Math.floor(bayH + me.options.padding.h * me.inchFactor);
        boxW = bayWTotal * rws + paddingW * (rws - 1);

        boxTimesH = Math.min(Math.floor(height / nextBayH), Math.ceil(dataStructuredKeysArr.length / rws));
        boxH = Math.floor(boxTimesH * bayH + (boxTimesH - 1) * me.options.padding.h * me.inchFactor);

        boxTop  = Math.round((height - boxH) / 2);
        boxLeft = Math.round((width - boxW) / 2);

        //Positions in pixels for each Bay
        positionsX[0] = 0;
        positionsY[0] = 0;
        legendCanvases = drawLegend();
        positions = [{x: 0, y: 0}];
        
        for(j = 1, lenJ = dataStructuredKeysArr.length + legendCanvases.length; j < lenJ; j += 1) {
            positionsY[j] = positionsY[j - 1];
            positionsX[j] = positionsX[j - 1] + bayWTotal + paddingW;
            
            if (j % rws === 0) { 
                positionsY[j] = positionsY[j - 1] + nextBayH;
                positionsX[j] = 0;
            }
            if (positionsY[j] + nextBayH > height) { positionsY[j] = 0; }
            positions.push( { x: positionsX[j], y: positionsY[j] });
        }

        //console.log("Positions", positions);
        //console.log("Dimensions", { bayW, bayH, nextBayH, boxW, boxH, boxLeft, boxTop });

        //Cells positions
        maxCell = Number(_.max(dataStructured, (k) => k.maxCell).maxCell);
        cellsWidth = (maxCell + (hasZeroCell ? 1 : 0)) * contWidth;
        let lPos = 0, rPos = cellsWidth - contWidth;
        for(j = maxCell, lenJ = hasZeroCell ? 0 : 1; j >= lenJ; j -= 1) {
            if (j % 2 === 0) {
                mapCells[j] = lPos;
                lPos += contWidth;
            } else {
                mapCells[j] = rPos;
                rPos -= contWidth;
            }
        }

        //Tiers positions
        tierH = 0;
        for(j = data.iTierMin, lenJ = data.iTierMax; j <= lenJ; j += 2) {
            mapTiers[j] = maxH - tierH;
            tierH += contHeight;
        }
        tierH += aboveBelowSep * 2;
        for(j = data.iTierMinAbove, lenJ = data.iTierMaxAbove; j <= lenJ; j += 2) {
            mapTiers[j] = maxH - tierH;
            tierH += contHeight;
        }

        //Prepare 1st page
        canvasPage = document.createElement("canvas");
        canvasPage.width = width; canvasPage.height = height;
        ctxPage = canvasPage.getContext("2d");
        pageY = 0;

        setTimeout(function() {
            let lenJ = dataStructuredKeysArr.length,
                legends = legendCanvases || drawLegend(),
                lenK = legends.length,
                nX;
            //Iterate bays & pages
            for (let j = 0; j < lenJ; j += 1) {
                let bayInfo = dataStructuredKeysArr[j], im;
                if (!bayInfo) { continue;} 

                if (positions[j].x === 0 && positions[j].y === 0) {
                    canvasPage = document.createElement("canvas");
                    canvasPage.width = width; canvasPage.height = height;
                    ctxPage = canvasPage.getContext("2d");
                    bayImages.push(canvasPage);
                }
                
                im = drawBay(dataStructuredKeysArr[j]);
                ctxPage.drawImage(im, positions[j].x + boxLeft, positions[j].y + boxTop);
            }

            //Iterate legends & pages
            for (let k = 0; k < lenK; k += 1) {
                nX = lenJ + k;
                if (positions[nX].x === 0 && positions[nX].y === 0) {
                    canvasPage = document.createElement("canvas");
                    canvasPage.width = width; canvasPage.height = height;
                    ctxPage = canvasPage.getContext("2d");
                    bayImages.push(canvasPage);
                }
                
                ctxPage.drawImage(legends[k], 
                    Math.round(positions[nX].x + boxLeft), 
                    Math.round(positions[nX].y + boxTop));
                    
            }


            divProgress.innerHTML = i18labels.PRINTOPTS_SENDINGPAGES;
            sendPagesToServer();

        }, 1000);

        window.pagess = bayImages;
    }

    setTitle (vessel, departure, voyage) {
        let title = (vessel ? vessel : "") + 
                (departure ? " / " + departure : "") +
                (voyage ? " / " + voyage : "");

        if (title) {
            this.title = title;
        }
    }

    setMetaData(vesselName, vesselCallSign, sender, recipient, placeOfDeparture, voyageNumber, footerLeft, footerRight) {
        this.metaData = {
            vesselName: vesselName,
            vesselCallSign:vesselCallSign,
            sender: sender,
            recipient: recipient,
            placeOfDeparture: placeOfDeparture,
            voyageNumber: voyageNumber,
            footerLeft: footerLeft,
            footerRight: footerRight
        };
    }


      
}