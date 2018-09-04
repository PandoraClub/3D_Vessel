(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var scene = require('../core/vessels-3d.js'),
    ves2d = require('../core/vessels-2d.js'),
    __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    colorWidget = require('../colors/colors-widget.js'),
    i18labels = require('../core/i18labels.js');

var node = document.getElementById("app-3d"),
    titleNode = document.getElementById("titleH1"),
    bayNode = document.getElementById("titleBay"),
    infoNode = document.getElementById("info-window"),
    dropColors = document.getElementById("dropColors"),
    launchColorsWidget = document.getElementById("launchColorsWidget"),
    btnLaunchPDF = document.getElementById("btnLaunchPDF"),
    queryParams = __s__.getQueryParams(),
    app3d,
    app2d,
    controlsControl;

controlsControl = 
{
    dropFilter: null,
    dropFilterValue: null,
    showWireframes: null,
    currentlyHidden: [],
    latestFilter: "",
    dropBays: null,
    dropBaysDictionary: {},
    dropAddHouse: null,
    openBayInfo: null,
    closeBayInfo: null,
    bayInfo: null,
    bayInfoIframe: null,
    baySelected: "",
    shipHouseSpace: 20.5,
    isExpanded: false,
    prevnextCont: null,
    prevnextNum: 1,
    numContsByBlock: null,
    hatchDecksVisible: true,

    init: function init() {
        var ctrlColors = dropColors,
            ctrlFilter = document.getElementById("dropFilter"),
            j = undefined,
            opt = undefined,
            me = controlsControl,
            k = undefined,
            lenK = undefined,
            filters = app3d.data.filters;

        me.dropFilterValue = document.getElementById("dropFilterValue");
        me.showWireframes = document.getElementById("showWireframesFiltered");
        me.expandViewBtn = document.getElementById("expandView");
        me.baynumViewBtn = document.getElementById("baynumView");
        me.shipViewBtn = document.getElementById("shipView");
        me.prevnextCont = document.getElementById("prevnext-container");
        me.dropFilter = ctrlFilter;
        me.checkboxHatchCovers = document.getElementById("view-hcs");
        me.navBaysNext = document.getElementById("bay-next");
        me.navBaysPrev = document.getElementById("bay-prev");

        //added by swell
        me.multiContainer   = document.getElementById("btn_find_multi");
        me.closeMultipopup  = document.getElementById("btn_close");
        me.btnApplyFilter   = document.getElementById("btn_apply_filter");
        me.btnClearFilter   = document.getElementById("btn_clear_filter");
        me.btnNav           = document.getElementById("nav_buttons");
        //added end

        opt = document.createElement("option");
        opt.value = "";opt.innerHTML = "None";
        ctrlFilter.appendChild(opt);

        $(".btn_collapse").click(function()
        {
            var org_height = $(this).parent().children("group").height();

            if($(this).hasClass("expand"))
            {
                $(this).removeClass("expand");
                $(this).parent().children("group").animate({height : "0px"});
                $(this).parent().children("group").attr("org_height", org_height);
                $(this).find("span").html("+");
            }
            else
            {
                org_height = $(this).parent().children("group").attr("org_height");

                $(this).addClass("expand");
                $(this).parent().children("group").animate({height : org_height + "px"});
                $(this).find("span").html("-");
            }
        });

        var orderedNames = [];
        
        for (j in filters) 
        {
            orderedNames.push({ name: filters[j].name, key: j });
        }
        
        orderedNames = orderedNames.sort(function (a, b) 
        {
            return a.name >= b.name ? 1 : -1;
        });

        $.each(filters, function(key, val)
        {
            opt = document.createElement("option");
            opt.value = key;
            opt.innerHTML = filters[key].name;
            ctrlFilter.appendChild(opt);
        });

         $.each(filters, function(key, val)
        {
            opt = document.createElement("option");
            opt.value = key;
            opt.innerHTML = filters[key].name;
            ctrlColors.appendChild(opt);
        });
        
        ctrlColors.value = "d";

        __d__.addEventLnr(ctrlFilter, "change", me.prepareFilter);
        __d__.addEventLnr(me.dropFilterValue, "change", me.processFilterValue);
        __d__.addEventLnr(ctrlColors, "change", me.colorize);
        __d__.addEventLnr(me.showWireframes, "change", me.listenWireframeDisplay);
        __d__.addEventLnr(window, "keydown", me.checkKeyPressed);
        __d__.addEventLnr(me.expandViewBtn, "change", me.expandView);
        __d__.addEventLnr(me.baynumViewBtn, "change", me.baynumView);
        
        __d__.addEventLnr(me.shipViewBtn, "change", me.shipView);
        __d__.addEventLnr(me.checkboxHatchCovers, "change", me.toggleHatchCovers);

        __d__.addEventLnr(me.navBaysNext, "click", function () {
            __s__.callOnCondition(me.isExpanded, me.expandViewNext, me.baysControlNext);
        });
        __d__.addEventLnr(me.navBaysPrev, "click", function () {
            __s__.callOnCondition(me.isExpanded, me.expandViewPrev, me.baysControlPrev);
        });

        //added by swell
        __d__.addEventLnr(me.multiContainer, "click", function () 
        {
            $("#search_popup").fadeIn();
            $("#search_content").focus();
        });

        __d__.addEventLnr(me.closeMultipopup, "click", function () 
        {
            $("#search_popup").fadeOut();
        });

        __d__.addEventLnr(me.btnClearFilter, "click", function () 
        {
            me.showHiddenMeshes();
            $("#search_content").val("");
            $("#search_popup").fadeOut();
        });

        __d__.addEventLnr(me.btnNav, "click", function ()
        {
            var right  = $(".info-panel").css("right");
            var width  = $("#app-3d").width();
            var height = $("#app-3d").height();

            if(!right || right == "0px")
            {
                $(this).animate({"right" : "0px"});
                $(this).children("span").html("+");
                $(".info-panel").animate({"right" : "-240px"});
                $("#titleBay").animate({"right" : "0px"});

                width += 240; 
                app3d.renderer3d.resize3DViewer(width, height);
            }
            else
            {
                $(this).animate({"right" : "240px"});
                $(this).children("span").html("-");
                $(".info-panel").animate({"right" : "0px"});
                $("#titleBay").animate({"right" : "240px"});

                app3d.renderer3d.resize3DViewer(width, height);
            }
        });

        __d__.addEventLnr(me.btnApplyFilter, "click", function () 
        {
            var filter_data = $("#search_content").val();
            var filter_arr  = [];
            var currentlyHidden = [];

            filter_data = me.replaceAll(filter_data, " ", ",");
            filter_data = me.replaceAll(filter_data, "||", ",");
            filter_data = me.replaceAll(filter_data, "|", ",");
            filter_data = me.replaceAll(filter_data, ";", ",");
            filter_data = me.replaceAll(filter_data, "\n", ",");

            filter_arr = filter_data.split(",");

            me.showHiddenMeshes();

            // changed by Swell

            $.each(app3d.data.allContainerMeshesObj, function(key, mesh)
            {
                if($.inArray(key, filter_arr) == -1)
                {
                    if (me.showWireframes.checked) 
                    {
                        mesh.isBasic = true;
                        app3d.renderer3d.switchMeshWireframe(mesh, "show");
                    } 
                    else 
                    {
                        app3d.renderer3d.switchMeshWireframe(mesh, "hide");
                    }

                    currentlyHidden.push(key);
                }
            });

            me.currentlyHidden = currentlyHidden;

            $("#search_popup").fadeOut();
        });

        me.addBaysControl();
        me.addHouseControl();
        me.pauseControls(false);
    },

    escapeRegExp :function (str) 
    {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    },

    replaceAll : function(str, find, replace) 
    {
        return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
    },

    // added swell end

    addBaysControl: function addBaysControl() {
        var key,
            j,
            lenJ,
            bayGroup,
            dropBays = document.getElementById("dropBays"),
            bays = [],
            oddB,
            prevOddExists,
            nextOddExists,
            oneOddExists,
            me = controlsControl,
            iBay,
            g3Bays = app3d.renderer3d.g3Bays,
            dataStructured = app3d.data.dataStructured,
            lis = ["<option value=''>All bays</option>"];

        function changeBay(ev) {
            var v = ev.target.value;
            me.isolateBay(v);
        }

        for (key in g3Bays) {
            bayGroup = g3Bays[key];
            if (bayGroup.children.length > 0) bays.push(bayGroup.name.replace("b", ""));
        }

        bays = bays.sort(__s__.sortNumeric);
        for (j = 0, lenJ = bays.length; j < lenJ; j += 1) {
            iBay = Number(bays[j]);
            oddB = iBay % 2 === 1;
            if (oddB) {
                if (dataStructured[bays[j]].n) {
                    lis.push("<option value='" + bays[j] + "'>" + bays[j] + "</option>");
                    me.dropBaysDictionary[bays[j]] = bays[j];
                }
            } else {
                prevOddExists = j + 1 < lenJ && Number(bays[j + 1]) === iBay + 1;
                if (!prevOddExists && !me.dropBaysDictionary[__s__.pad(iBay - 1, 3)]) {
                    lis.push("<option value='" + __s__.pad(iBay, 3) + "'>" + __s__.pad(iBay - 1, 3) + "</option>");
                    me.dropBaysDictionary[__s__.pad(iBay - 1, 3)] = __s__.pad(iBay, 3);
                }
            }
        }

        dropBays.innerHTML = lis.join("");
        me.dropBays = dropBays;
        __d__.addEventLnr(me.dropBays, "change", changeBay);

        me.openBayInfo = document.getElementById("open-panel");
        me.closeBayInfo = document.getElementById("close-panel");
        me.bayInfo = document.getElementById("bay-panel");
        me.bayInfoIframe = document.getElementById("bay-iframe-container");

        __d__.addEventLnr(me.openBayInfo, "click", me.showBayInfo);
        __d__.addEventLnr(me.closeBayInfo, "click", me.showBayInfo);
        me.openBayInfo.style.left = "-300px";
    },

    baysControlNext: function baysControlNext() {
        var me = controlsControl,
            c = me.dropBays.selectedIndex + 1,
            maxIndex = me.dropBays.length;
        if (c < maxIndex) {
            me.dropBays.selectedIndex = c;
            me.isolateBay(me.dropBays.value);
        }
        me.navBaysPrev.className = "prevnext bay-prev noselect " + (c > 2 ? "active" : "");
        me.navBaysNext.className = "prevnext bay-next noselect " + (c + 1 >= maxIndex ? "" : "active");
    },

    baysControlPrev: function baysControlPrev() {
        var me = controlsControl,
            c = me.dropBays.selectedIndex - 1,
            maxIndex = me.dropBays.length;
        if (c >= 0) {
            me.dropBays.selectedIndex = c;
            me.isolateBay(me.dropBays.value);
        }
        me.navBaysPrev.className = "prevnext bay-prev noselect " + (c > 2 ? "active" : "");
        me.navBaysNext.className = "prevnext bay-next noselect " + (c + 1 >= maxIndex ? "" : "active");
    },

    addHouseControl: function addHouseControl() 
    {
        var me = controlsControl,
            dropAddHouse = document.getElementById("dropAddHouse"),
            dataStructured = app3d.data.dataStructured,
            key,
            bays,
            j,
            lenJ,
            lis = ["<option value=''>No house</option>"];

        bays = __s__.objKeysToArray(me.dropBaysDictionary);
        bays = bays.sort(__s__.sortNumeric);
        
        for (j = bays.length - 1; j >= 0; j -= 1) 
        {
            key = bays[j];

            if (dataStructured[key].maxD > 20) 
            {
                lis.push("<option value='" + me.dropBaysDictionary[key] + "'>before " + key + "</option>");
            }
        }

        dropAddHouse.innerHTML = lis.join("");

        __d__.addEventLnr(dropAddHouse, "change", me.moveShipHouseLnr);
        me.dropAddHouse = dropAddHouse;

        var num = $("#dropAddHouse").children(":nth-child(4)").val();

        $("#dropAddHouse").val(num);

        me.moveShipHouse(num);
    },

    _makeHeightVisible: function _makeHeightVisible(h) {
        var hNum = Number(h),
            hInt = Math.floor(hNum),
            hDec = (hNum - hInt) * 1.2;
        return String(hInt + hDec).replace(".", "'") + "\"";
    },

    prepareFilter: function prepareFilter(e) {
        var v = e.target.value,
            key,
            currentFilter,
            opts = ["<option value=''>No filter</option>"],
            me = controlsControl,
            filters = app3d.data.filters;

        if (!v) {
            me.pauseControls(true);
            me.showHiddenMeshes();
            me.pauseControls(false);
            me.dropFilterValue.value = "";
            me.dropFilterValue.innerHTML = opts.join("");
            me.dropFilterValue.setAttribute("disabled", "disabled");
            return;
        }

        if (me.latestFilter !== v) {
            me.pauseControls(true);
            me.showHiddenMeshes();
            me.pauseControls(false);
        }

        me.latestFilter = v;
        me.dropFilterValue.removeAttribute("disabled");
        me.dropFilterValue.innerHTML = "";
        currentFilter = filters[v];

        if (currentFilter.tf) {
            opts.push("<option value='1'>yes</option>");
            opts.push("<option value='0'>no</option>");
        } else {
            var orderedKeys = _.keys(currentFilter.obs).sort(),
                m = undefined,
                lenM = undefined;
            for (m = 0, lenM = orderedKeys.length; m < lenM; m += 1) {
                opts.push("<option value='" + orderedKeys[m] + "'>" + (v === "h" ? me._makeHeightVisible(orderedKeys[m]) : orderedKeys[m]) + "</option>");
            }
        }
        me.dropFilterValue.innerHTML = opts.join("");
    },

    processFilterValue: function processFilterValue(e) {
        var v = e.target.value,
            me = controlsControl,
            filter = me.dropFilter,
            j,
            lenJ,
            key,
            showWireframes = me.showWireframes.checked,
            filters = app3d.data.filters,
            allContainerMeshesObj = app3d.data.allContainerMeshesObj,
            currentlyHidden = [],
            newFilterIndexes,
            mesh;

        me.pauseControls(true);
        me.showHiddenMeshes();
        
        if (v === "") 
        {
            me.pauseControls(false);return;
        }

        newFilterIndexes = filters[me.dropFilter.value].obs;
        
        for (key in newFilterIndexes) 
        {
            if (me.dropFilterValue.value === key) 
            {
                continue;
            }

            for (j = 0, lenJ = newFilterIndexes[key].indexes.length; j < lenJ; j += 1) 
            {
                mesh = allContainerMeshesObj[newFilterIndexes[key].indexes[j].c];
                
                if (showWireframes) 
                {
                    mesh.isBasic = true;
                    app3d.renderer3d.switchMeshWireframe(mesh, "show");
                } 
                else 
                {
                    // mesh.visible = false;
                    app3d.renderer3d.switchMeshWireframe(mesh, "hide");
                }
                currentlyHidden.push(newFilterIndexes[key].indexes[j].c);
            }
        }

        me.currentlyHidden = currentlyHidden;
        me.pauseControls(false);
    },

    /* modified by Swell on 2017/5/2 */
    processWireframeDisplay: function processWireframeDisplay(toWireframes) 
    {
        var me = controlsControl,
            currentlyHidden = me.currentlyHidden,
            j,
            mesh,
            allContainerMeshesObj = app3d.data.allContainerMeshesObj,
            lenJ = currentlyHidden.length;

        var singleGeometry = new THREE.Geometry();
        var mesh = null;
        var cube = null

        if (lenJ) 
        {
            for (j = 0; j < lenJ; j += 1) 
            {
                mesh = allContainerMeshesObj[currentlyHidden[j]];

                if (toWireframes) 
                {
                    app3d.renderer3d.switchMeshWireframe(mesh, "show");
                }
                else 
                {
                    app3d.renderer3d.switchMeshWireframe(mesh, "hide");
                }
            }
        }
    },

    listenWireframeDisplay: function listenWireframeDisplay(ev) {
        var v = ev.target.checked,
            me = controlsControl;

        me.pauseControls(true);
        me.processWireframeDisplay(v);
        me.pauseControls(false);
    },

    showHiddenMeshes: function showHiddenMeshes() 
    {
        var currentlyHidden = controlsControl.currentlyHidden,
            j,
            mesh,
            lenJ = currentlyHidden.length,
            allContainerMeshesObj = app3d.data.allContainerMeshesObj;

        if (lenJ > 0) 
        {
            for (j = 0; j < lenJ; j += 1) 
            {
                mesh = allContainerMeshesObj[currentlyHidden[j]];
                
                if (mesh.isBasic) 
                {
                    app3d.renderer3d.switchMeshWireframe(mesh, "hide");
                    // mesh.material = app3d.renderer3d.allMaterials[mesh.materialPos];
                    // mesh.isBasic = false;

                    // if(mesh.helper)
                    // {
                    //     app3d.renderer3d.scene.remove(mesh.helper);
                    //     mesh.helper = null;
                    // }
                }

                mesh.visible = true;
            }
        }
        controlsControl.currentlyHidden = [];
    },

    pauseControls: function pauseControls(disable) {
        var me = controlsControl,
            prevAttr;

        if (disable) {
            prevAttr = me.dropFilterValue.getAttribute("disabled");
            me.dropFilter.setAttribute("disabled", "disabled");
            me.dropFilterValue.setAttribute("disabled", "disabled");
            me.dropFilterValue.setAttribute("prevAttr", prevAttr);
            me.showWireframes.setAttribute("disabled", "disabled");
            me.dropBays.setAttribute("disabled", "disabled");
            me.dropAddHouse.setAttribute("disabled", "disabled");
            return;
        }
        //else
        prevAttr = me.dropFilterValue.getAttribute("prevAttr");
        me.dropFilter.removeAttribute("disabled");
        if (prevAttr !== "disabled") {
            me.dropFilterValue.removeAttribute("disabled");
        }
        me.showWireframes.removeAttribute("disabled");

        if (!me.isExpanded) {
            me.dropBays.removeAttribute("disabled");
            if (!me.baySelected) {
                me.dropAddHouse.removeAttribute("disabled");
            }
        }
    },

    colorize: function colorize(e, mode) {
        var v = e.target.value,
            j,
            lenJ,
            mesh,
            obj,
            allContainerMeshesObj = app3d.data.allContainerMeshesObj,
            filters = app3d.data.filters,
            data = app3d.data.data;

        var material;
        var hexColor;

        if(!mode)
            $("#hint_area").css("display", "block");

        setTimeout(function()
        {
            controlsControl.showColorsTable(v);

            for (j = 0, lenJ = data.info.contsL; j < lenJ; j += 1) 
            {
                obj = data.conts[j];
                mesh = allContainerMeshesObj[obj.cDash];
                mesh.materialPos = filters[v].obs[obj[v]].materialPos;
                hexColor = app3d.renderer3d.allMaterials[mesh.materialPos].hexColor;

                if(mesh.is_tank != app3d.renderer3d.allMaterials[mesh.materialPos].is_tank)
                {
                    if(mesh.is_tank)
                        app3d.renderer3d.allMaterials[mesh.materialPos] = app3d.renderer3d.createMaterial("tank", hexColor);
                    else
                    {
                        app3d.renderer3d.allMaterials[mesh.materialPos] = app3d.renderer3d.createMaterial("container", hexColor, mesh.material.mode);
                    }
                }
                
                mesh.material = app3d.renderer3d.allMaterials[mesh.materialPos];
            }

            $("#hint_area").css("display", "none");
        }, 100);
    },

    isolateBay: function isolateBay(sBay) 
    {
        var force = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        var me = controlsControl,
            iBay = Number(sBay),
            sepZ = 40,
            topY = 500,
            newZ,
            dataStructured = app3d.data.dataStructured,
            filters = app3d.data.filters,
            g3Bays = app3d.renderer3d.g3Bays,
            shipHouse = app3d.renderer3d.shipHouse;

        function animateBays(bayToAnimate, timing, addC, delC, bayY) {
            var key, i, bayM, bayMeven, iEvenBay, addToShipHouse, bayGroup;

            iEvenBay = bayToAnimate - 1;
            if (!g3Bays["b" + __s__.pad(iEvenBay, 3)]) {
                iEvenBay += 2;
            }

            for (key in g3Bays) {
                bayGroup = g3Bays[key];
                i = Number(bayGroup.name.replace("b", ""));
                if (i !== bayToAnimate && i !== iEvenBay) {
                    if (i < bayToAnimate) {
                        TweenLite.to(bayGroup.position, timing, { z: bayGroup.originalZ - addC, delay: delC, ease: Power2.easeInOut });
                    } else {
                        TweenLite.to(bayGroup.position, timing, { z: bayGroup.originalZ + addC, delay: delC, ease: Power2.easeInOut });
                    }
                }
            }

            if (app3d.renderer3d.shipHouse.mesh.visible) {
                addToShipHouse = bayToAnimate < shipHouse.currPosBay ? addC : -addC;
                TweenLite.to(shipHouse.mesh.position, timing, { z: shipHouse.currPosZ + addToShipHouse, delay: delC, ease: Power2.easeInOut });
            }

            bayM = g3Bays["b" + __s__.pad(bayToAnimate, 3)];
            bayMeven = g3Bays["b" + __s__.pad(iEvenBay, 3)];
            if (bayM) {
                TweenLite.to(bayM.position, timing, { y: bayY, delay: 0.5, ease: Power2.easeInOut });
                //bayM.labels.visible = !!bayY;
            }
            if (bayMeven) {
                TweenLite.to(bayMeven.position, timing, { y: bayY, delay: 0.5, ease: Power2.easeInOut });
            }

            return bayM.originalZ;
        }

        function separateBay(sBay) {
            var key,
                i,
                bayGroup,
                camZ,
                camY,
                camX,
                cY,
                topPos,
                baySelected,
                bayY,
                delayUp,
                me = controlsControl,
                openBaypanelButtonZ,
                addC,
                opened,
                options = app3d.options,
                controls = app3d.renderer3d.controls,
                camPos = app3d.renderer3d.camera.position;

            me.pauseControls(true);
            me.expandViewBtn.setAttribute("disabled", "disabled");
            opened = me.baySelected !== "";
            if (opened) {
                //cerramos
                animateBays(Number(me.baySelected), 0.35, 0, 0, 0);
                //abrimos
                if (iBay > 0) {
                    newZ = animateBays(iBay, 0.4, sepZ, .75, topY);
                }
            } else {
                //abrimos uno nuevo
                newZ = animateBays(iBay, 1, sepZ, 0, topY);
            }

            if (sBay !== "") {
                me.baySelected = sBay;
                camZ = newZ - 240;
                camY = topY;
                camX = 0;
                cY = topY - 10;
                delayUp = 0.5;
                controls.dampingFactor = options.dampingFactorIn;
                openBaypanelButtonZ = 30;
                newZ += 11;
                me.checkboxHatchCovers.setAttribute("disabled", "disabled");
                me.expandViewBtn.setAttribute("disabled", "disabled");
                app3d._bayNode.innerHTML = "<small>bay</small> " + iBay;

                me.prevnextCont.style.display = "block";
                var cbb = me.dropBays.selectedIndex,
                    maxIndex = me.dropBays.length;
                me.navBaysPrev.className = "prevnext bay-prev noselect " + (cbb > 1 ? "active" : "");
                me.navBaysNext.className = "prevnext bay-next noselect " + (cbb + 1 === maxIndex ? "" : "active");
            } else {
                me.baySelected = "";
                camZ = me.initialCameraPosition.z;
                camY = me.initialCameraPosition.y;
                camX = me.initialCameraPosition.x;
                cY = 0;
                newZ = me.initialCameraPosition.targetZ;
                delayUp = 0;
                controls.dampingFactor = options.dampingFactorOut;
                openBaypanelButtonZ = -300;
                me.checkboxHatchCovers.removeAttribute("disabled");
                me.prevnextCont.style.display = "none";
            }
            TweenLite.to(camPos, 1, { x: camX, y: camY, z: camZ, delay: delayUp, ease: Power2.easeInOut });
            TweenLite.to(controls.target, 2.0, { y: cY, x: 0, z: newZ, ease: Power2.easeInOut });
            TweenLite.to(me.openBayInfo, 1.0, { left: openBaypanelButtonZ, delay: delayUp * 4, ease: Power2.easeInOut });
            setTimeout(function () {
                if (me.baySelected === "") {
                    me.expandViewBtn.removeAttribute("disabled");
                }
                me.pauseControls(false);
            }, 2500);
        }

        if(sBay == "")
        {
            $.each(app3d.data.allContainerMeshesObj, function(key, mesh)
            {
                if(mesh.is_under)
                    mesh.visible = false;
            });
        }
        else
        {
            $.each(app3d.data.allContainerMeshesObj, function(key, mesh)
            {
                if(mesh.is_under)
                    mesh.visible = true;
            });
        }
        
        separateBay(!sBay ? "" : sBay);
        if (!!sBay) {
            me.dropAddHouse.setAttribute("disabled", "disabled");
        } else {
            me.dropAddHouse.removeAttribute("disabled");
        }
    },

    showBayInfo: function showBayInfo(ev) {

        var show = ev.target.id === "open-panel",
            me = controlsControl,
            sizeH,
            fileToLoad;

        if (show) {
            me.bayInfo.style.display = "block";
            app3d.pauseRendering();
            sizeH = Math.floor(app3d.height * 0.85);
            me.bayInfoIframe.src = (window.bayviewRoute || "") + "?filetoload=" + queryParams.filetoload + "&from3d=true&bay=" + Number(me.baySelected || 0);
            me.bayInfoIframe.style.height = sizeH + "px";
        } else {
            me.bayInfo.style.display = "none";
            app3d.resumeRendering();
            me.bayInfoIframe.src = "";
        }
    },

    tryToLaunchBay: function tryToLaunchBay(sBay) {
        var me = controlsControl,
            dataStructured = app3d.data.dataStructured,
            iBay,
            tryBay;

        if (!sBay || sBay === "n") {
            return;
        }

        if (dataStructured[sBay]) {
            me.dropBays.value = me.dropBaysDictionary[sBay];
            me.isolateBay(sBay);
            return;
        }

        iBay = Number(sBay);
        tryBay = __s__.pad(iBay + 1, 3);

        if (dataStructured[tryBay]) {
            me.dropBays.value = tryBay;
            me.isolateBay(tryBay);
        }
    },

    moveShipHouseLnr: function moveShipHouseLnr(ev) {
        var v = ev.target.value;
        controlsControl.moveShipHouse(v);
        app3d.renderer3d.createBayNumbers();

    },

    moveShipHouse: function moveShipHouse(v) 
    {
        var key,
            bayGroup,
            i,
            me = controlsControl,
            bays,
            j,
            lenJ,
            shipHouse = app3d.renderer3d.shipHouse,
            g3Bays = app3d.renderer3d.g3Bays,
            hatchCovers = app3d.renderer3d.hatchCovers,
            shipHouseSpace = me.shipHouseSpace,
            bayText = null;
        
        app3d.pauseRendering();

        if (shipHouse.currPosBay > 0) 
        {
            for (key in g3Bays) 
            {
                bayGroup = g3Bays[key];
                i = Number(bayGroup.name.replace("b", ""));
                
                if (i < shipHouse.currPosBay) 
                {
                    bayGroup.position.z += shipHouseSpace;
                    bayGroup.originalZ += shipHouseSpace;

                    if (hatchCovers[key]) 
                    {
                        hatchCovers[key].position.z += shipHouseSpace;
                        hatchCovers[key].originalZ += shipHouseSpace;
                    }
                }
            }
        }

        if (v === "") 
        {
            shipHouse.mesh.visible = false;
            shipHouse.currPosBay = 0;

            app3d.resumeRendering();
            return;
        }

        shipHouse.currPosBay = Number(v);

        for (key in g3Bays) 
        {
            bayGroup = g3Bays[key];
            i = Number(bayGroup.name.replace("b", ""));
            
            if (i < shipHouse.currPosBay) 
            {
                bayGroup.position.z -= shipHouseSpace;
                bayGroup.originalZ -= shipHouseSpace;

                if (hatchCovers[key]) 
                {
                    hatchCovers[key].position.z -= shipHouseSpace;
                    hatchCovers[key].originalZ -= shipHouseSpace;
                }
            }
        }

        shipHouse.mesh.visible = true;
        shipHouse.mesh.position.z = g3Bays["b" + v].position.z - shipHouseSpace - 0.5;
        shipHouse.currPosZ = Number(shipHouse.mesh.position.z);

        app3d.resumeRendering();
    },

    checkKeyPressed: function checkKeyPressed(e) {
        var me = controlsControl;

        switch (e.keyCode) {
            case 27:
                if (me.isExpanded) {
                    return;
                }

                if (me.baySelected !== "") {
                    me.dropBays.value = "";
                    me.bayInfo.style.display = "none";
                    app3d.renderer3d._isRendering = true;
                    me.isolateBay("");
                } else {
                    TweenLite.to(app3d.renderer3d.camera.position, 1.0, { y: me.initialCameraPosition.y,
                        x: me.initialCameraPosition.x,
                        z: me.initialCameraPosition.z,
                        ease: Power2.easeInOut
                    });
                }

                break;
        }
    },

    showColorsTable: function showColorsTable(attr) {
        var me = controlsControl,
            tableColors = document.getElementById("tableColors"),
            liColors = [],
            key,
            attr,
            isTf,
            val,
            filters = app3d.data.filters,
            currentFilter = filters[attr],
            orderedKeys,
            m,
            lenM;

        isTf = currentFilter.tf;
        orderedKeys = !isTf ? _.keys(currentFilter.obs).sort() : ["1", "0"];

        for (m = 0, lenM = orderedKeys.length; m < lenM; m += 1) {
            key = orderedKeys[m];
            val = currentFilter.obs[key];
            if (isTf) {
                if (val) {
                    liColors.push("<li><span style='background:" + val.color + "'></span>" + (key === "1" ? "yes" : "no") + "</li>");
                }
            } else {
                liColors.push("<li><span style='background:" + val.color + "'></span>" + (attr === "h" ? me._makeHeightVisible(key) : key) + "</li>");
            }
        }
        tableColors.innerHTML = liColors.join("");
    },
    // added by swell
    shipView : function shipView(ev)
    {
        var checked = ev.target.checked;

        if(checked)
        {
            app3d.renderer3d.simpleDeck.visible = true;
            app3d.renderer3d.shipText.visible = true;

            $.each(app3d.data.allContainerMeshesObj, function(key, mesh)
            {
                if(mesh.is_under)
                    mesh.visible = false;
            });
        }
        else
        {
            app3d.renderer3d.simpleDeck.visible = false;
            app3d.renderer3d.shipText.visible = false;

            $.each(app3d.data.allContainerMeshesObj, function(key, mesh)
            {
                if(!mesh.isBasic && mesh.is_under)
                {
                    mesh.visible = true;
                }
            });
        }
    },

    baynumView : function baynumView(ev)
    {
        app3d.renderer3d.shipText.traverse(function(child)
        {
            if(child.name == "baynumber")
            {
                child.traverse(function(texts)
                {
                    texts.visible = ev.target.checked;
                });

                return;
            }
        });
    },

    expandView: function expandView(ev) 
    {
        var me = controlsControl,
            doExpand = ev.target.checked,
            iBay = undefined,
            g3Bay = undefined,
            key = undefined,
            j = undefined,
            g3Bays = app3d.renderer3d.g3Bays,
            dataStructured = app3d.data.dataStructured,
            maxWidth = app3d.renderer3d.maxWidth,
            extraSep = app3d.options.extraSep,
            xAdd = maxWidth * (9.5 + extraSep) * 1.5,
            xAccum = xAdd,
            visib = true,
            lastBay = app3d.data.lastBay;

        if($("#expandView").parent().find(":checked").length)
        {
            $("#dropAddHouse").attr("disabled", "disabled");

            $.each(app3d.data.allContainerMeshesObj, function(key, mesh)
            {
                if(mesh.is_under)
                    mesh.visible = true;
            });
        }
        else
        {
            $("#dropAddHouse").removeAttr("disabled");

            $.each(app3d.data.allContainerMeshesObj, function(key, mesh)
            {
                if(mesh.is_under)
                    mesh.visible = false;
            });
        }

        //Aggregates num of containers by block
        function calculateContsByBlock() {
            if (me.numContsByBlock) {
                return;
            }

            var ncbb = {},
                j = undefined,
                key = undefined,
                numContsByBay = app3d.data.numContsByBay;

            for (j = 1; j <= lastBay + 1; j += 1) {
                key = __s__.pad(j, 3);
                g3Bay = g3Bays["b" + key];
                if (!g3Bay) {
                    continue;
                }
                if (!ncbb[g3Bay.compactBlockNum]) {
                    ncbb[g3Bay.compactBlockNum] = { n: 0 };
                }

                ncbb[g3Bay.compactBlockNum].n += numContsByBay[key] || 0;
            }

            me.numContsByBlock = ncbb;
        }

        //Expands the bays horizontally
        function expandBays() 
        {
            var cbbj = undefined,
                firstBay = 0;

            me.dropBays.setAttribute("disabled", "disabled");
            me.dropAddHouse.setAttribute("disabled", "disabled");

            for (j = 1; j <= lastBay + 1; j += 1) 
            {
                key = __s__.pad(j, 3);
                g3Bay = g3Bays["b" + key];

                if (!g3Bay) 
                {
                    continue;
                }
                
                cbbj = me.numContsByBlock[g3Bay.compactBlockNum];

                if (g3Bay.isBlockStart && cbbj.n) 
                {
                    xAccum -= xAdd;
                    g3Bay.labels.visible = true;
                    if (!firstBay) {
                        firstBay = g3Bay.iBay;
                    }
                }

                g3Bay.position.z = j & 1 && !g3Bay.isBlockStart ? 22.5 + extraSep : 0;
                g3Bay.position.x = xAccum;
                g3Bay.position.y = 0;
            }

            me.prevnextNum = 1;
            me.navBaysPrev.className = "prevnext bay-prev noselect ";
            app3d._bayNode.innerHTML = "<small>bay</small> 1";

            app3d.renderer3d.simpleDeck.visible = false;
            app3d.renderer3d.shipText.visible = false;

            app3d.renderer3d.hatchDeck.visible = false;
            app3d.renderer3d.shipHouse.prevVisible = app3d.renderer3d.shipHouse.mesh.visible;
            app3d.renderer3d.shipHouse.mesh.visible = false;
            app3d.renderer3d.camera.position.set(0, /*app3d.data.aboveTiers.n * 0*/-2, -xAdd * 0.8);
            app3d.renderer3d.controls.target.set(0, 0, 20);
            me.prevnextCont.style.display = "block";

            me._showBaysHatchCovers(me.hatchDecksVisible);

            me.openBayInfo.style.left = "30px";
            me.baySelected = __s__.pad(firstBay, 3);
        }

        function contractBays() {
            for (key in g3Bays) {
                g3Bay = g3Bays[key];
                g3Bay.position.z = g3Bay.originalZ;
                g3Bay.position.x = 0;
                g3Bay.position.y = 0;
                if (g3Bay.labels) {
                    g3Bay.labels.visible = false;
                }
            }

            var ic = controlsControl.initialCameraPosition;
            app3d.renderer3d.setCameraPosition(ic.x, ic.y, ic.z);
            app3d.renderer3d.controls.target.x = 0;
            app3d.renderer3d.controls.target.y = 0;
            app3d.renderer3d.controls.target.z = ic.targetZ;

            app3d.renderer3d.simpleDeck.visible = true;
            app3d.renderer3d.shipText.visible = true;

            app3d.renderer3d.hatchDeck.visible = me.hatchDecksVisible;
            app3d.renderer3d.shipHouse.mesh.visible = app3d.renderer3d.shipHouse.prevVisible;

            me.prevnextCont.style.display = "none";
            me.pauseControls(false);

            me.openBayInfo.style.left = "-300px";
            me.baySelected = "";
        }

        calculateContsByBlock();
        me.isExpanded = doExpand;

        app3d.pauseRendering();
        (doExpand ? expandBays : contractBays)();
        app3d.resumeRendering();
    },

    expandViewNext: function expandViewNext() {
        controlsControl.expandViewNextPrev(true);
    },
    expandViewPrev: function expandViewPrev() {
        controlsControl.expandViewNextPrev(false);
    },

    expandViewNextPrev: function expandViewNextPrev(next) {
        var me = controlsControl,
            timing = 0.5,
            key = undefined,
            gBay = undefined,
            newBlockNum = undefined,
            g3Bays = app3d.renderer3d.g3Bays,
            lastBay = app3d.data.lastBay;

        var myXAnd = function myXAnd(a, b) {
            return a ? b : !b;
        };

        function showBays() {
            var g3Bay = undefined,
                j = undefined;

            newBlockNum = me.prevnextNum;
            do {
                newBlockNum = newBlockNum + (next ? 1 : -1);
                if (newBlockNum <= 0 || newBlockNum > app3d.renderer3d.maxCompactBlockNums) {
                    return null;
                }
            } while (me.numContsByBlock[newBlockNum].n <= 0);

            me.navBaysPrev.className = "prevnext bay-prev noselect " + (newBlockNum > 1 ? "active" : "");
            me.navBaysNext.className = "prevnext bay-next noselect " + (newBlockNum === app3d.renderer3d.maxCompactBlockNums ? "" : "active");

            for (j = 1; j <= lastBay + 1; j += 1) {
                key = __s__.pad(j, 3);
                g3Bay = g3Bays["b" + key];

                if (!g3Bay) {
                    continue;
                }
                if (g3Bay.compactBlockNum === newBlockNum) {
                    if (me.numContsByBlock[g3Bay.compactBlockNum].n) {
                        return g3Bay;
                    }
                }
            }
            return null;
        }

        gBay = showBays();
        if (!gBay) {
            return;
        }

        TweenLite.to(app3d.renderer3d.camera.position, timing, { x: gBay.position.x, ease: Power2.easeInOut });
        TweenLite.to(app3d.renderer3d.controls.target, timing, { x: gBay.position.x, ease: Power2.easeInOut });
        app3d._bayNode.innerHTML = "<small>bay</small> " + gBay.iBay;
        me.baySelected = __s__.pad(gBay.iBay, 3);

        me.prevnextNum = newBlockNum;
    },

    toggleHatchCovers: function toggleHatchCovers(ev) {
        var me = controlsControl,
            v = ev.target.checked,
            hcs = app3d.renderer3d.hatchDeck;

        me.hatchDecksVisible = v;

        if (!me.isExpanded) 
        {
            hcs.visible = v;
            app3d.renderer3d.hatchDeck1.visible = v;
            me._showBaysHatchCovers(false);
        }
        else
        {
            hcs.visible = false;
            app3d.renderer3d.hatchDeck1.visible = false;
            me._showBaysHatchCovers(v);
        }

        // if(app3d.renderer3d.hatchDeck1.visible == false)
        // {
        //     $.each(app3d.data.allContainerMeshesObj, function(key, mesh)
        //     {
        //         if(mesh.is_under)
        //             mesh.visible = true;
        //     });
        // }
        // else
        // {
        //     $.each(app3d.data.allContainerMeshesObj, function(key, mesh)
        //     {
        //         if(mesh.is_under)
        //             mesh.visible = false;
        //     });
        // }
    },

    _showBaysHatchCovers: function _showBaysHatchCovers(s) {
        var key = undefined,
            g3Bay = undefined,
            g3Bays = app3d.renderer3d.g3Bays;

        for (key in g3Bays) {
            g3Bay = g3Bays[key];
            if (!g3Bay.isBlockStart) {
                continue;
            }
            if (g3Bay.hatchC) {
                g3Bay.hatchC.visible = s;
            }
        }
    },

    disableRendering: function disableRendering(isShown) {
        app3d.toggleRendering(!isShown);
        app3d.renderer3d.controls.enabled = !isShown;
    },

    // update scene after custom colors
    updateSceneAfterCustomColors: function updateSceneAfterCustomColors(filters, changes, filtersCustomized) {

        $("#hint_area").css("display", "block");

        setTimeout(function()
        {
            var key = undefined,
                arr = undefined,
                color = undefined,
                fltr = undefined,
                material = undefined;

            app3d.data.filters = filters;

            var data = app3d.data.data;
            var j,
                lenJ,
                mesh,
                obj;

            for (key in changes) 
            {
                arr = key.split("___");

                if (arr.length !== 2) 
                {
                    continue;
                }
                
                fltr = filters[arr[0]].obs[arr[1]];
                material = app3d.renderer3d.allMaterials[fltr.materialPos];

                for(var i = 0; i < fltr.indexes.length; i ++)
                {
                    mesh = app3d.data.allContainerMeshesObj[fltr.indexes[i].cDash];

                    if(mesh.is_tank != material.is_tank)
                    {
                        if(mesh.is_tank)
                            material = app3d.renderer3d.createMaterial("tank", fltr.hexColor);
                        else
                        {
                            material = app3d.renderer3d.createMaterial("container", fltr.hexColor, mesh.material.mode);
                        }
                    }

                    mesh.material = material;
                }

                material.needsUpdate = true;
            }

            controlsControl.showColorsTable(dropColors.value);
            $("#hint_area").css("display", "none");
        }, 100);
    }

}; //controlsControl

/* Main program 3D ------------------------------------------------  */

//Initialize
app3d = new scene.VesselsApp3D(node, titleNode, infoNode, bayNode);
//LoadUrl
app3d.loadUrl(queryParams.json, i18labels.LOADING_DATA).then(function (loadedData) 
{
    var renderer3d = app3d.renderer3d,
        clrs = undefined,
        modelsFactory = app3d.modelsFactory,
        data = undefined,
        maxDepth = undefined,
        maxDepthHalf = undefined;
    
    renderer3d.obj_container = null;
    renderer3d.obj_tank = null;

    //Title
    app3d.updateHtmlTitle(loadedData.VesselName, loadedData.PlaceOfDeparture, loadedData.VoyageNumber);

    data = app3d.loadData(loadedData);
    //Process data

    app3d.data = data;
    app3d.vesselCarrier = loadedData.VesselCarrier;

    //Generate 3D objects
    //Pass 1. Map to bays & models
    
    for (var j = 0, lenJ = app3d.data.data.info.contsL; j < lenJ; j += 1) 
    {
        var obj = app3d.data.data.conts[j];

        renderer3d.createBay(obj.bay);
        modelsFactory.addIsoModel(obj);
    }
    //Pass 2.
    modelsFactory.extendSpecs(app3d.data.filters);

    //Initialize the colorsWidget
    clrs = new colorWidget.ColorsWidget(launchColorsWidget, app3d.data.filters, dropColors);
    clrs.onToggled = controlsControl.disableRendering;
    clrs.onSaved = controlsControl.updateSceneAfterCustomColors;
    clrs.postUrl = window.writeColorsRoute;
    
    if (window.userSettings) {
        clrs.mergeColorSettings(window.userSettings);
    }

    //Pass 3.
    
    // modified by swell

    var mtlLoader   = new THREE.MTLLoader();
    var objLoader = new THREE.OBJLoader();

    mtlLoader.setPath("system/model/");
    mtlLoader.load("tank.mtl", function (materials) 
    {
        objLoader.setMaterials(materials);
        objLoader.setPath("system/model/");
        objLoader.load("tank.obj", function (object) 
        {
            renderer3d.obj_tank = object;
    
            mtlLoader.setPath("system/model/");
            mtlLoader.load("container.mtl", function (materials) 
            {
                materials.preload();

                // renderer3d.map_40 = THREE.ImageUtils.loadTexture( "system/model/container_side-top_40.jpg" );

                objLoader.setMaterials(materials);
                objLoader.setPath("system/model/");
                objLoader.load("container.obj", function (object) 
                {
                    renderer3d.obj_container = object;

                    modelsFactory.createBaseMaterials(app3d.data.filters, modelsFactory.isoModels);
                    renderer3d.createBaseModels(modelsFactory.isoModels);
                    renderer3d.create3dContainersFromData(app3d.data);

                    if (app3d.data.data.conts[0]) 
                    {
                        renderer3d.putInfoWindow(app3d.data.data.conts[0]);
                    }

                    //Init controls of this app
                    controlsControl.init();
                    controlsControl.tryToLaunchBay(app3d.initialBay);
                    controlsControl.colorize({target : {value : "d"}}, "init");

                    //Reposition camera
                    maxDepth = renderer3d.maxDepth;
                    maxDepthHalf = Math.round(maxDepth / 2);
                    controlsControl.initialCameraPosition = renderer3d.setCameraPosition(-Math.round(maxDepth * 0.75), 350, Math.round(maxDepth * 0.5));

                    renderer3d.controls.maxDistance = maxDepth * 1.5;
                    renderer3d.controls.target.z = maxDepthHalf;
                    controlsControl.initialCameraPosition.targetZ = maxDepthHalf;

                    //Initialize the generatePDF functionality
                    app2d = new ves2d.VesselsApp2D(btnLaunchPDF);
                    app2d.data = data;
                    app2d.applyColorsFilter(app2d.data.filters);

                    app2d.setTitle(loadedData.VesselName, loadedData.PlaceOfDeparture, loadedData.VoyageNumber);
                    app2d.setMetaData(loadedData.VesselName, loadedData.VesselCallSign, loadedData.Sender, loadedData.Recipient, loadedData.PlaceOfDeparture, loadedData.VoyageNumber, loadedData.FooterLeft, loadedData.FooterRight);

                    app2d.postUrl = window.generatePdfRoute;
                    app2d.baseUrl = window.generatePdfBaseUrlRoute || "";
                    app2d.baseDownloadUrl = window.downloadPdfBaseUrlRoute || "";
                    app2d.onToggled = controlsControl.disableRendering;

                    window.appVessels2D = app2d;
                });
            });
        });
    });
}, 
function (msg) 
{
    app3d._node.loadingDiv.setMessage(msg, true);
    app3d._node.loadingDiv.updateLoader(0.0, 1.0);
});

/*
.catch(function(msg) {
  app3d._node.loadingDiv.setMessage(msg, true);
  app3d._node.loadingDiv.updateLoader(0.0, 1.0);
})*/window.appVessels3D = app3d;

},{"../colors/colors-widget.js":2,"../core/i18labels.js":4,"../core/vessels-2d.js":7,"../core/vessels-3d.js":8,"../utils/dom-utilities.js":12,"../utils/js-helpers.js":13}],2:[function(require,module,exports){
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
            
            for (key in filters) 
            {
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

            for (key in colorsTemp) 
            {
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

},{"../core/i18labels.js":4,"../utils/dom-utilities.js":12,"../utils/js-helpers.js":13}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var i18labels = require('./i18labels.js');
var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');

var DataLoader = (function () {
    function DataLoader(divLoading) {
        _classCallCheck(this, DataLoader);

        this.divLoading = divLoading;
    }

    //Takes an URL and loads the data.
    //Promise: resolves with the data obj.

    _createClass(DataLoader, [{
        key: 'loadUrl',
        value: function loadUrl(jsonUrl) {
            var loadingText = arguments.length <= 1 || arguments[1] === undefined ? "" : arguments[1];
            var progressCallback = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

            var me = this;

            return new Promise(function (resolve, reject) {
                var req = undefined,
                    ajaxError = function ajaxError(evt) {
                    if (me.divLoading) {
                        me.divLoading.setMessage(evt.responseText, true);
                        me.divLoading.updateLoader(0.0, 1.0);
                    }
                    console.error(evt);
                },
                    transferProgress = function transferProgress(evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        me.divLoading.updateLoader(percentComplete, 0.5);
                    }
                };

                function transferComplete(ev) {
                    var d = undefined;
                    try {
                        if (req.status === 200) {
                            d = JSON.parse(req.responseText);
                            resolve(d); //<----- Resolves
                        } else {
                                reject(req.statusText);
                            }
                    } catch (e) {
                        reject(i18labels.ERROR_PARSING_JSON + " " + e.description);
                    }
                } //transferComplete

                if (!jsonUrl) {
                    reject(i18labels.INVALID_DATA_SOURCE);
                    return;
                }

                if (me.divLoading) {
                    me.divLoading.show();
                    me.divLoading.startAnimation();
                    if (loadingText) {
                        me.divLoading.setMessage(loadingText);
                    }
                }

                req = new XMLHttpRequest();

                __d__.addEventLnr(req, "load", transferComplete);
                __d__.addEventLnr(req, "error", ajaxError);
                if (me.divLoading || progressCallback !== null) {
                    __d__.addEventLnr(req, "progress", progressCallback || transferProgress);
                }

                req.open('GET', jsonUrl + (jsonUrl.indexOf("?") > 0 ? "&" : "?") + "t=" + new Date() * 1);
                req.send();
            });
        }

        //Takes a JSON Vessels info
        //Returns processed data
    }, {
        key: 'generateStructuredData',
        value: function generateStructuredData(d) {

            var lenD = undefined,
                j = undefined,
                obj = undefined,
                lenJ = undefined,
                hCalc = undefined,
                tmp = undefined,
                bb = 0,
                bc = 0,
                bt = 0,
                bays = {},
                cells = {},
                tiers = {},
                belowTiers = undefined,
                aboveTiers = undefined,
                data = undefined,
                dataNode = undefined,
                dataStructured = undefined,
                filters = undefined,
                dataStructuredKeysArr = [],
                key = undefined,
                keyEven = undefined,
                keyEvenPrev = undefined,
                iTierMin = undefined,
                iTierMinAbove = undefined,
                iTierMax = undefined,
                iTierMaxAbove = undefined,
                maxWidth = 0,
                lastBay = "",
                hasZeroCell = false,
                maxCell = 0,
                numContsByBay = {},
                containersIDs = {},
                allContainerMeshesObj = {};

            function addStructured(ob) {
                var bay2 = ob.bay,
                    ibay = ob.iBay;
                if (ibay % 2 === 0) {
                    bay2 = __s__.pad(ibay - 1, 3);
                }

                if (!numContsByBay[ob.bay]) {
                    numContsByBay[ob.bay] = 1;
                } else {
                    numContsByBay[ob.bay] += 1;
                }

                if (!dataStructured[bay2]) {
                    dataStructured[bay2] = { cells: {}, n: 0 };
                    dataStructured.n += 1;
                    dataStructured[bay2].maxD = 20;
                    dataStructuredKeysArr.push(bay2);
                }
                if (!dataStructured[bay2].cells[ob.cell]) {
                    dataStructured[bay2].cells[ob.cell] = { tiers: {}, n: 0 };
                    dataStructured[bay2].n += 1;
                    if (!hasZeroCell && ob.cell === "00") {
                        hasZeroCell = true;
                    }
                }
                dataStructured[bay2].cells[ob.cell].tiers[ob.tier] = ob;
                dataStructured[bay2].cells[ob.cell].n += 1;

                if (maxWidth < dataStructured[bay2].n) {
                    maxWidth = dataStructured[bay2].n;
                }
                if (ob.depth > dataStructured[bay2].maxD) {
                    dataStructured[bay2].maxD = ob.depth;
                }
                if (obj.tier < "70") {
                    if (!belowTiers.tiers[obj.tier]) {
                        belowTiers.tiers[obj.tier] = { h: ob.h, accH: 0 };
                        belowTiers.n += 1;
                    }
                    if (ob.h > belowTiers.tiers[obj.tier].h) {
                        belowTiers.tiers[obj.tier].h = ob.h;
                    }
                } else {
                    if (!aboveTiers.tiers[obj.tier]) {
                        aboveTiers.tiers[obj.tier] = { h: ob.h, accH: 0 };
                        aboveTiers.n += 1;
                    }
                }
                if (!tiers[obj.tier]) {
                    tiers[obj.tier] = { maxH: obj.h };
                } else {
                    tiers[obj.tier].maxH = Math.max(tiers[obj.tier].maxH, obj.h);
                }
            }

            function addFilter(vv, name, tf) {
                filters[vv] = { name: name, obs: {}, tf: tf };
            }

            function connectToFilters(ob) {
                if (!filters.s.obs[ob.s]) {
                    filters.s.obs[ob.s] = { c: 1, indexes: [] };
                }
                if (!filters.i.obs[ob.i]) {
                    filters.i.obs[ob.i] = { c: 1, indexes: [] };
                }
                if (!filters.r.obs[ob.r]) {
                    filters.r.obs[ob.r] = { c: 1, indexes: [] };
                }
                if (!filters.w.obs[ob.w]) {
                    filters.w.obs[ob.w] = { c: 1, indexes: [] };
                }
                if (!filters.o.obs[ob.o]) {
                    filters.o.obs[ob.o] = { c: 1, indexes: [] };
                }
                if (!filters.d.obs[ob.d]) {
                    filters.d.obs[ob.d] = { c: 1, indexes: [] };
                }
                if (!filters.f.obs[ob.f]) {
                    filters.f.obs[ob.f] = { c: 1, indexes: [] };
                }
                if (!filters.t.obs[ob.t]) {
                    filters.t.obs[ob.t] = { c: 1, indexes: [] };
                }
                if (!filters.x.obs[ob.x]) {
                    filters.x.obs[ob.x] = { c: 1, indexes: [] };
                }
                if (!filters.v.obs[ob.v]) {
                    filters.v.obs[ob.v] = { c: 1, indexes: [] };
                }
                if (!filters.l.obs[ob.l]) {
                    filters.l.obs[ob.l] = { c: 1, indexes: [] };
                }
                if (!filters.h.obs[ob.h]) {
                    filters.h.obs[ob.h] = { c: 1, indexes: [] };
                }
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
            if (!dataNode) {
                console.error("No data!. Halting generateStructuredData.");return null;
            }
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

            addFilter("d", "Port of Discharge", false);
            addFilter("f", "Port of Load", false);
            addFilter("i", "Equipment Type", false);
            addFilter("o", "Line Operator", false);
            addFilter("s", "Is Full", true);
            addFilter("l", "Length", false);
            addFilter("h", "Height", false);
            addFilter("w", "Is Hazardous", true);
            addFilter("x", "Is OOG", true);
            addFilter("r", "Is Reefer", true);
            addFilter("t", "Is Tank", true);
            addFilter("v", "Is VGM Weight", true);

            //Iterate through data
            for (j = 0, lenD = data.conts.length; j < lenD; j += 1) 
            {
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
                
                if (obj.f === undefined && obj.ld !== undefined) 
                {
                    obj.f = obj.ld;
                }

                containersIDs["cont_" + obj.cDash] = obj;

                addStructured(obj);
                connectToFilters(obj);
            }

            //Iterate trough bays
            lastBay = _.max(_.keys(dataStructured));
            for (j = 1, lenD = Number(lastBay); j <= lenD; j += 2) {
                key = __s__.pad(j, 3);
                keyEvenPrev = __s__.pad(j - 1, 3);

                if (!dataStructured[key]) {
                    continue;
                }

                dataStructured[key].isBlockStart = true;
                if (numContsByBay[keyEvenPrev]) {
                    dataStructured[key].isBlockStart = false;
                }

                dataStructured[key].maxCell = _.chain(dataStructured[key].cells).keys().sort().last().value();
            }

            //Min/Max tiers below & above
            iTierMin = Number(_.min(_.keys(belowTiers.tiers)));
            iTierMinAbove = Number(_.min(_.keys(aboveTiers.tiers)));
            iTierMax = Number(_.max(_.keys(belowTiers.tiers)));
            iTierMaxAbove = Number(_.max(_.keys(aboveTiers.tiers)));

            return {
                data: data,
                dataStructured: dataStructured,
                dataStructuredKeysArr: dataStructuredKeysArr.sort(__s__.sortNumeric),
                belowTiers: belowTiers,
                aboveTiers: aboveTiers,
                containersIDs: containersIDs,
                numContsByBay: numContsByBay,
                allContainerMeshesObj: allContainerMeshesObj,
                filters: filters,
                iTierMin: iTierMin,
                iTierMinAbove: iTierMinAbove,
                iTierMax: iTierMax,
                iTierMaxAbove: iTierMaxAbove,
                tiers: tiers,
                maxWidth: maxWidth,
                firstBay: _.min(_.keys(dataStructured)),
                lastBay: lastBay,
                hasZeroCell: hasZeroCell
            };
        }
    }]);

    return DataLoader;
})();

exports.DataLoader = DataLoader;

},{"../utils/dom-utilities.js":12,"../utils/js-helpers.js":13,"./i18labels.js":4}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var RColor = require('../utils/random-color.js');

var ModelsFactory = (function () {
    function ModelsFactory(appScene) {
        _classCallCheck(this, ModelsFactory);

        this.models = {};
        this.isoModels = {};
        this.appScene = appScene;
    }

    _createClass(ModelsFactory, [{
        key: 'addIsoModel',
        value: function addIsoModel(obj) {
            var me = this,
                isoModels = me.isoModels;

            if (!isoModels[obj.i]) {
                isoModels[obj.i] = {
                    d: obj.depth,
                    h: obj.h,
                    t: obj.t
                };
            }
        }
    }, {
        key: 'extendSpecs',
        value: function extendSpecs(filters) {
            var j,
                lenJ,
                key,
                val,
                attr,
                spec,
                me = this,
                rcolor = new RColor.RColor(),
                color,
                hexColor;

            for (key in filters) {
                attr = filters[key];
                for (val in attr.obs) {

                    spec = attr.obs[val];

                    color = rcolor.get(true);
                    hexColor = parseInt(color.replace(/^#/, ''), 16);

                    spec.color = color;
                    spec.hexColor = hexColor;
                    spec.colorIsRandom = true;
                }
            }
        }
    }, {
        key: 'createBaseMaterials',
        value: function createBaseMaterials(filters, isoModel) {
            var j,
                lenJ,
                key,
                val,
                attr,
                spec,
                me = this,
                material,
                materialPos,
                hexColor,
                renderer3d = this.appScene.renderer3d;

            var texture, mode = "texture_20";
            var material = null;

            for (key in filters) 
            {
                attr = filters[key];

                for (val in attr.obs) 
                {
                    spec = attr.obs[val];

                    if(isoModel[val] && isoModel[val].d > 20)
                        mode = "texture_40";

                    hexColor = spec.hexColor;

                    if(key == "t")
                    {
                        material = renderer3d.createMaterial("tank", hexColor);
                    }
                    else
                    {
                        material = renderer3d.createMaterial("container", hexColor, mode);
                    }

                    renderer3d.allMaterials.push(material);
                    materialPos = renderer3d.allMaterials.length - 1;

                    spec.materialPos = materialPos;
                }
            }
        }
    }]);

    return ModelsFactory;
})();

exports.ModelsFactory = ModelsFactory;

},{"../utils/random-color.js":15}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    SpriteText2D = require('../text2D/SpriteText2D.js'),
    textAlign = require('../text2D/textAlign.js');

//Class Renderer3D

var Renderer3D = (function () {
    function Renderer3D(parent, w, h) {
        _classCallCheck(this, Renderer3D);

        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        this.controls = null;

        this.appScene = parent;
        this.container = parent._node;
        this.width = w;
        this.height = h;
        this.frames = 0;

        this._INTERSECTED = null;
        this.followMouseEvents = false;

        this.mouseStart = new THREE.Vector2();
        this.mouseLastClick = new Date();

        this._isRendering = true;
        this._floatingCamera = true;
        this._modelsLoaded = {};

        this.g3Bays = {};
        this.models = {};
        this.maxDepth = 0;
        this.maxWidth = 0;
        this.shipText = null;

        this.shipHouse = null;
        this.simpleDeck = null;
        this.hatchCover = null;

        this.hatchCovers = {};

        this.allMaterials = [];
        this.basicMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, wireframe: false });
        this.selectionMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide, opacity: 1, transparent: false });

        this.containersGroup = null;
    }

    _createClass(Renderer3D, [{
        key: 'init',
        value: function init() {
            var me = this,
                material = undefined,
                light = undefined,
                lightsGroup = undefined,
                mesh = undefined,
                lightPosAn = 800,
                options = this.appScene.options;

            function prepareDirectionalLight(x, y, z) {
                var ll = new THREE.DirectionalLight(0xffffff, 0.30);
                ll.position.set(x, y, z);
                ll.castShadow = true;
                ll.shadow.camera.left = -lightPosAn;
                ll.shadow.camera.right = lightPosAn;
                ll.shadow.camera.top = lightPosAn;
                ll.shadow.camera.bottom = -lightPosAn;
                ll.shadow.camera.far = 1600;
                ll.shadow.camera.near = 1;

                return ll;
            }

            if (this.container === null || this.container === undefined) {
                console.error("Container is null. Halting.");return;
            }
            if (!this.width) {
                console.error("Width is null or zero. Halting.");return;
            }
            if (!this.height) {
                console.error("Height is null or zero. Halting.");return;
            }

            this.scene = new THREE.Scene();
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });
            this.renderer.setClearColor(options.colors.background, 1);

            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(this.width, this.height);

            this.container.divRenderC.appendChild(this.renderer.domElement);

            this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 30000);
            this.camera.position.z = options.initialCameraPosition.z;
            this.camera.position.x = options.initialCameraPosition.x;
            this.camera.position.y = options.initialCameraPosition.y;

            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = options.dampingFactorOut || 0.2;
            this.controls.minPolarAngle = Math.PI / 5;
            this.controls.maxPolarAngle = Math.PI / 5 * 4;
            this.controls.maxDistance = options.initialCameraPosition.z * 2;
            this.controls.minDistance = options.initialCameraPosition.z / 2;
            this.controls.enableKeys = true;
            this.controls.enablePan = true;

            // this.scene.add(this.controls);

            this.raycaster = new THREE.Raycaster();
            this.mouseVector = new THREE.Vector2();

            lightsGroup = new THREE.Group();

            light = prepareDirectionalLight(-lightPosAn, lightPosAn, -lightPosAn);
            lightsGroup.add(light);

            light = prepareDirectionalLight(lightPosAn, lightPosAn, -lightPosAn);
            lightsGroup.add(light);

            light = prepareDirectionalLight(lightPosAn, lightPosAn, lightPosAn);
            lightsGroup.add(light);

            light = prepareDirectionalLight(-lightPosAn, lightPosAn, lightPosAn);
            lightsGroup.add(light);

            light = new THREE.DirectionalLight(0xf8f7ee, 0.15);
            light.position.set(0, -300, -50);
            lightsGroup.add(light);

            this.lightsGroup = lightsGroup;

            light = new THREE.AmbientLight(options.colors.sunlight, 0.7);
            //light.castShadow = true;
            this.scene.add(light);
            this.scene.add(lightsGroup);

            var containersGroup = new THREE.Object3D();

            this.scene.add(containersGroup);
            this.containersGroup = containersGroup;

            __d__.addEventLnr(window, "mousemove", function (e) {
                me.mouseVector.x = e.clientX / me.width * 2 - 1;
                me.mouseVector.y = -(e.clientY / me.height) * 2 + 1;
            });
        }
    }, {
        key: 'createBay',
        value: function createBay(k) {
            var me = this,
                holder = undefined,
                bbox = undefined,
                hatchC = undefined;

            if (me.g3Bays["b" + k]) {
                return me.g3Bays["b" + k];
            }

            //Create holder
            holder = new THREE.Group();
            holder.name = "b" + k;
            holder.iBay = Number(k);
            holder.isBlockStart = false;

            //Add to bays-array & scene
            me.g3Bays["b" + k] = holder;
            me.containersGroup.add(holder);

            return holder;
        }
    }, {
        key: '_addLabelsToBay',
        value: function _addLabelsToBay(bay, posY, posZ) {
            var fwdStr = arguments.length <= 3 || arguments[3] === undefined ? "FWD" : arguments[3];
            var aftStr = arguments.length <= 4 || arguments[4] === undefined ? "AFT" : arguments[4];

            var holderLabels = undefined,
                aboveTiersN = this.appScene.data.aboveTiers.n,
                extraSep = this.appScene.options.extraSep,
                labelScale = this.appScene.options.labelScale || 2;

            holderLabels = new THREE.Group();
            holderLabels.name = "labels";
            holderLabels.visible = false;
            bay.labelsCanBeVisible = true;

            //Create FWD/AFT Labels
            var textMesh = new SpriteText2D(fwdStr, {
                align: textAlign.center,
                font: '32px Arial',
                fillStyle: '#888888' });

            textMesh.position.z = -15;
            textMesh.scale.set(labelScale, labelScale, 1);
            holderLabels.add(textMesh);

            textMesh = new SpriteText2D(aftStr, {
                align: textAlign.center,
                font: '32px Arial',
                fillStyle: '#888888' });

            textMesh.position.z = 60;
            textMesh.scale.set(labelScale, labelScale, 1);
            holderLabels.add(textMesh);

            //Add to Bay       
            bay.add(holderLabels);
            bay.labels = holderLabels;
            holderLabels.position.y = posY;
            holderLabels.position.z = posZ;
            //holderLabels.position.x = 3; 
        }
    }, {
        key: 'createMaterial',
        value: function createMaterial(type, hexColor, mode) 
        {
            var material = null;

            if(type == "tank")
            {
                material = this.addTankMaterial(hexColor);
                material.is_tank = 1;
            }
            else
            {
                material = this.addContainerMaterial(hexColor, mode);
                material.is_tank = 0;
            }

            return material;
        }
    }, {
        key: 'addContainerMaterial',
        value: function addContainerMaterial(hexColor, mode) 
        {
            var material = this.obj_container.children[0].material.clone();
            var texture  = this.drawTexture(mode, "#" + hexColor.toString(16));

            for (var i = 0; i < material.materials.length; i ++)
            {
                material.materials[i].map = texture;
                material.materials[i].hex_color = hexColor;
            }

            material.mode = mode;
            material.hexColor = hexColor;

            return material;
        }
    }, {
        key: 'addTankMaterial',
        value: function addTankMaterial(hexColor) 
        {
            var material = this.obj_tank.children[0].material.clone();
            var rgb      = [];

            for (var i = 0; i < material.materials.length; i ++)
            {
                rgb = hexToRgb("#" + hexColor.toString(16));
                rgb = rgba2rgb({red: rgb.r, green: rgb.g, blue: rgb.b, alpha : 0.65});

                material.materials[i].color.setRGB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
            }

            material.hexColor = hexColor;

            return material;
        }
    },{
        key: 'createBaseModels',
        value: function createBaseModels(isoModels) 
        {
            // modified by swell
            var me = this,
                key,
                isoModel,
                h,
                obj,
                spec,
                cldr,
                filters = this.appScene.data.filters,
                geom,
                mesh;

            for (key in isoModels) 
            {
                isoModel = isoModels[key];
                h = isoModel.h;
                spec = filters.i.obs[key];

                if (!isoModel.t) 
                {
                    mesh = me.obj_container.children[0].clone();

                    var box     = new THREE.Box3().setFromObject( mesh );
                    var size    = box.size();
                    var mtl     = me.allMaterials[spec.materialPos];
                    var geo     = mesh.geometry.clone();

                    mesh = new THREE.Mesh(geo, mtl);
                    mesh.scale.set(isoModel.d / size.x, h / size.y, 8 / size.z);
                    mesh.rotation.y = Math.PI / 2;
                } 
                else 
                {
                    var material = me.allMaterials[filters.t.obs[0].materialPos]; //me.obj_tank.children[0].material.clone();

                    var geometry = me.obj_tank.children[0].geometry.clone();
                    var box     = new THREE.Box3().setFromObject( me.obj_tank );
                    var size    = box.size();

                    // me.allMaterials[spec.materialPos].is_tank = 1;

                    // for(var i = 0; i < mtlArr.length; i ++)
                    // {
                    //     mtlArr[i].color.set(me.allMaterials[spec.materialPos].materials[0].hex_color);
                    // }

                    mesh = new THREE.Mesh(geometry, material);
                    mesh.is_tank = 1;
                    mesh.scale.set(8 / size.x, 8 / size.y, isoModel.d / size.z);
                    mesh.position.x = mesh.position.x + 8 / size.x / 2;
                    mesh.position.y = mesh.position.y + 8 / size.y / 2;
                }

                mesh.materialPos = spec.materialPos;
                mesh.dynamic = true;
                this.models[key] = mesh;
            }
        }
    },
    {
        key: 'drawTexture',
        value : function drawTexture(mode, color)
        {
            if(!mode)
                return;

            var width   = 256;
            var height  = 523;
            var canvas  = document.createElement("canvas");

            if(mode == "texture_40")
            {
                width  = 504;
                height = 523;
            }

            $(canvas).css("width",  width  + "px");
            $(canvas).css("height", height + "px");

            $(canvas).attr("width", width  + "px");
            $(canvas).attr("height",height + "px");


            var context = canvas.getContext('2d');
            var image   = document.getElementById(mode);

            context.drawImage(image, 0, 0);
            context.globalAlpha = 0.65;
            context.globalCompositeOperation = "source-atop";
            context.fillStyle = color;
            context.rect(0, 0, width, height);
            context.fill();

            var texture = new THREE.Texture(canvas) 
            texture.needsUpdate = true;

            return texture;
        }
    },
    {
        key: 'create3dShip',
        value: function create3dShip(d) 
        {
            var mtlLoader   = new THREE.MTLLoader();
            var current     = this;

            mtlLoader.setPath("system/model/");
            mtlLoader.load("ship.mtl", function (materials) 
            {
                materials.preload();

                var objLoader = new THREE.OBJLoader();

                objLoader.setMaterials(materials);
                objLoader.setPath("system/model/");
                objLoader.load("ship.obj", function (object) 
                {
                    var obj_size = new THREE.Box3().setFromObject( object ).size();
                    var size = current.scene.ship_len;

                    object.position.set(0, -138, size / 2 - size / 20);
                    object.scale.set((size + 120) / obj_size.x, 25, 25);
                    object.rotation.set(0, Math.PI / -2, 0);

                    object.traverse(function(child)
                    {

                        if(child.name == "polymsh599")
                        {
                            current.hatchDeck1 = child;
                        }

                        if( child.name == "polymsh599" )
                        {
                            child.material = new THREE.MeshPhongMaterial({color : 0x666666});
                        }
                    });

                    current.simpleDeck = object;
                    current.scene.add(object);
                    current.initfont();
                });
            });
        }
    },
    {
        key: 'switchMeshWireframe',
        value: function switchMeshWireframe(mesh, isWireframe) 
        {
            var me = this;
            var helper = null;

            if(isWireframe == "show")
            {
                helper = new THREE.BoxHelper(mesh);
                helper.material.color.setRGB( 1, 1, 1 );
                helper.material.transparent = true;
                helper.material.opacity = 0.7;

                mesh.helper  = helper;
                mesh.visible = false;
                mesh.isBasic = true;

                me.scene.add(helper);
            }
            else
            {
                if(mesh.helper)
                {
                    me.scene.remove(mesh.helper);
                    mesh.helper = null;
                    mesh.isBasic = false;
                }
            }
        }
    },
    {
        key: 'create3dContainersFromData',
        value: function create3dContainersFromData(d) {
            var me = this,
                data = d.data,
                belowTiers = d.belowTiers,
                aboveTiers = d.aboveTiers,
                iTierMin = d.iTierMin,
                iTierMinAbove = d.iTierMinAbove,
                dataStructured = d.dataStructured,
                allContainerMeshesObj = d.allContainerMeshesObj,
                numContsByBay = d.numContsByBay,
                g3Bays = this.g3Bays,
                loadingDiv = this.appScene._node.loadingDiv,
                extraSep = this.appScene.options.extraSep,
                j = undefined,
                lenJ = data.info.contsL,
                len = undefined,
                key = undefined,
                key2 = undefined,
                key3 = undefined,
                aCell = undefined,
                arrCellTiers = undefined,
                tierHeightAcc = undefined,
                point = undefined,
                model = undefined,
                mesh = undefined,
                spec = undefined,
                h = undefined,
                bT = undefined,
                zAccum = 0,
                x = undefined,
                y = undefined,
                z = undefined,
                prevBay = undefined,
                extraAdd = undefined,
                hasZeroRow = undefined,
                isOdd = undefined,
                floorAbove = 6,
                floorBelow = 15 - extraSep,
                lastBay = undefined,
                iBay = undefined,
                iCell = undefined,
                iTier = undefined,
                lastBayDepth = undefined,
                g3Bay = undefined,
                maxDepth = undefined,
                tmpArr = [],
                compactBlockNum = undefined,
                keyEven = undefined,
                keyEvenPrev = undefined,
                bayEven = undefined,
                numContsByBlock = {},
                materialHatch = new THREE.MeshStandardMaterial({ color: 0x666666 }),
                compareLocations = function compareLocations(a, b) {
                a.p === b.p ? 0 : a.p < b.p ? -1 : 1;
            };

            lastBay = _.max(_.keys(dataStructured));
            lastBayDepth = dataStructured[lastBay].maxD;
            floorBelow = _.reduce(belowTiers.tiers, function (memo, ob) {
                return memo + ob.h + extraSep;
            }, 0) + floorBelow;

            compactBlockNum = 0;

            //Position of Bays
            for (j = 1; j <= lastBay; j += 2) 
            {
                key = __s__.pad(j, 3);
                keyEven = __s__.pad(j + 1, 3);
                keyEvenPrev = __s__.pad(j - 1, 3);
                bayEven = g3Bays["b" + keyEven];

                if (!dataStructured[key]) 
                {
                    dataStructured[key] = { cells: {}, n: 0, z: 0 };
                }

                if (j % 2 === 1) 
                {
                    zAccum += 22.5 + extraSep;
                }

                //Odd
                dataStructured[key].z = zAccum;
                g3Bay = me.createBay(key);
                g3Bay.position.z = zAccum;
                g3Bay.originalZ = zAccum;
                g3Bay.isBlockStart = true;

                //Even
                if (bayEven) 
                {
                    bayEven.position.z = zAccum;
                    bayEven.originalZ = zAccum;
                }

                //Even Previous (to check if it starts a new block)
                if (numContsByBay[keyEvenPrev]) 
                {
                    g3Bay.isBlockStart = false;
                }

                if (g3Bay.isBlockStart) 
                {
                    compactBlockNum += 1;
                    this._addLabelsToBay(g3Bay, aboveTiers.n * (9.5 + extraSep), //y
                    0 //z
                    );
                }

                //Blocks for side-by-side
                g3Bay.compactBlockNum = compactBlockNum;
                if (bayEven) 
                {
                    bayEven.compactBlockNum = compactBlockNum;
                }
            }

            maxDepth = zAccum + lastBayDepth;
            this.maxDepth = maxDepth;
            this.maxWidth = d.maxWidth;
            this.maxCompactBlockNums = compactBlockNum;

            //Iterate to create 3d containers & position
            for (j = 0, lenJ = data.info.contsL; j < lenJ; j += 1) 
            {
                point = data.conts[j];
                model = me.models[String(point.i)];
                iBay = point.iBay;

                iCell = Number(point.cell);
                x = (iCell % 2 === 0 ? iCell / 2 : -(iCell + 1) / 2) * (8 + extraSep); // x coordinate

                iTier = Number(point.tier); // y coordinate

                var is_under = 0;
                
                if (iTier >= 70) 
                {
                    y = (iTier - iTierMinAbove) / 2 * (9.5 + extraSep) + floorAbove;
                }
                else 
                {
                    is_under = 1;
                    y = (iTier - iTierMin) / 2 * (9.5 + extraSep) - floorBelow;
                }

                // swell modfied
                mesh = model.clone();
                mesh.materialPos = model.materialPos;

                var size     = new THREE.Box3().setFromObject( mesh ).size();

                mesh.name = "cont_" + point.cDash;
                mesh.objRef = point;

                if(model.is_tank)
                {
                    mesh.is_tank = 1;
                    mesh.position.x = x - size.x / 2;
                    mesh.position.y = y;
                    mesh.position.z = 0;
                    mesh.visible = false;
                }
                else
                {
                    mesh.is_tank = 0;
                    mesh.position.x = x;
                    mesh.position.y = y;
                    mesh.position.z = size.z / (2);
                }

                if(is_under)
                {
                    mesh.visible = false;
                    mesh.is_under = 1;
                }

                mesh.updateMatrix();
                mesh.matrixAutoUpdate = false;
                mesh.isBasic = false; //Basic material adhoc

                g3Bays["b" + point.bay].add(mesh);
                allContainerMeshesObj[point.cDash] = mesh;
            }

            // modified by swell
            me.create3dShip(me.data);
            me._createHouse(aboveTiers.n);
            me._createHatchCovers();
            // me.initfont();

            loadingDiv.stopAnimation();
            setTimeout(function () {
                loadingDiv.hide();
            }, 500);
        }
    }, 
    {
        key : 'initfont',
        value : function initfont()
        {
            var loader = new THREE.FontLoader();
            var current = this;

            loader.load( 'system/model/helvetiker_bold.typeface.json', function ( response ) 
            {
                // app3d.renderer3d.font = response;
                var title = $("#titleH1").html().split("/");
                var textMat = new THREE.MeshPhongMaterial({color : 0xFFFFFF});
                var textGeo = new THREE.TextGeometry( title[0], 
                {
                    font: response,
                    size: 12,
                    height : 3,
                    extrudeMaterial: 0.1
                });

                var textSide = new THREE.TextGeometry( current.appScene.vesselCarrier, 
                {
                    font: response,
                    size: 28,
                    height : 3,
                    extrudeMaterial: 0.1
                });

                var mesh    = new THREE.Mesh(textGeo, textMat);
                var side1   = new THREE.Mesh(textSide, textMat);
                var side2   = new THREE.Mesh(textSide, textMat);
                var t_size  = new THREE.Box3().setFromObject( mesh ).size();
                var s_size  = new THREE.Box3().setFromObject( side1 ).size();
                var group   = new THREE.Object3D();

                // console.log(size);
                mesh.position.set(t_size.x / -2, -30, current.scene.ship_len + 40);
                
                side1.rotation.set(0, Math.PI / -2, 0) ;
                side1.position.set(-102, -50, current.scene.ship_len / 2 - s_size.x / 2);

                side2.rotation.set(0, Math.PI / 2, 0) ;
                side2.position.set(102, -50, current.scene.ship_len / 2 + s_size.x / 2);

                group.add(mesh);

                if(current.appScene.vesselCarrier)
                {
                    group.add(side1);
                    group.add(side2);
                }

                current.scene.add(group);
                current.shipText = group;
                current.load_font = response;
                current.createBayNumbers();
            });
        }
    },
    {
        key: 'createBayNumbers',
        value: function createBayNumbers(visible) 
        {
            var current = this;
            var group   = new THREE.Object3D();
            var bayNum  = 1;
            var font    = current.load_font;
            var textMat = new THREE.MeshPhongMaterial({color : 0xFFFFFF});
            var visible = false;

            group.name = "baynumber";

            if(!font)
                return;

            current.shipText.traverse(function (child) 
            {
                if(child.name == "baynumber")
                {
                    current.shipText.remove(child);
                    visible = child.children[0].visible;
                }
            });

            $.each(current.hatchCovers, function(key, hatch)
            {
                hatch.updateMatrixWorld(true);

                var textBay  = new THREE.TextGeometry( bayNum, 
                {
                    font: font,
                    size: 11,
                    height : 3,
                    extrudeMaterial: 0.1
                });

                var textBay1 = new THREE.TextGeometry( bayNum + 2, 
                {
                    font: font,
                    size: 11,
                    height : 3,
                    extrudeMaterial: 0.1
                });

                var bay1 = new THREE.Mesh(textBay, textMat);
                var bay2 = bay1.clone(); 

                var bay3 = new THREE.Mesh(textBay1, textMat);
                var bay4 = bay3.clone();

                bay1.visible = visible;
                bay2.visible = visible;
                bay3.visible = visible;
                bay4.visible = visible;

                bay1.baseBay = current.hatchCovers[key].baseBay;
                bay2.baseBay = current.hatchCovers[key].baseBay;
                bay3.baseBay = current.hatchCovers[key].baseBay;
                bay4.baseBay = current.hatchCovers[key].baseBay;

                bay1.rotation.y = Math.PI / 2;
                bay2.rotation.y = Math.PI / -2;
                bay3.rotation.y = Math.PI / 2;
                bay4.rotation.y = Math.PI / -2;

                bay1.position.set(110, -10, hatch.position.z + 20);
                bay2.position.set(-110, -10, hatch.position.z);
                bay3.position.set(110, -10, hatch.position.z + 40);
                bay4.position.set(-110, -10, hatch.position.z + 20);

                group.add(bay1);
                group.add(bay2);
                group.add(bay3);
                group.add(bay4);

                bayNum += 4;
            });

            current.shipText.add(group);
        }
    },
    {
        key: '_createHatchCovers',
        value: function _createHatchCovers() {
            var extraSep = this.appScene.options.extraSep,
                maxWidth = this.maxWidth,
                maxDepth = this.maxDepth,
                maxWidthFeet = maxWidth * (8 + extraSep),
                dataStructured = this.appScene.data.dataStructured,
                g3Bays = this.g3Bays,
                lastBay = this.appScene.data.lastBay,
                addZeroCell = this.appScene.data.hasZeroCell ? 1 : 0,
                hatchesArr = [],
                j = undefined,
                lenJ = undefined,
                key = undefined,
                g3Bay = undefined,
                gbn = undefined,
                icb = [],
                icbn = undefined,
                maxBlock = 0,
                symmetricMax = undefined,
                hatchGroup3D = new THREE.Group(),
                msh = undefined,
                block = undefined,
                hatch = undefined,
                posL = undefined,
                x = undefined,
                z = undefined,
                dd = undefined,
                hatchLine = undefined,
                materialHatch = new THREE.MeshStandardMaterial({ color: 0x666666 });

            var maxContsDepth = 45;

            var xCoordinate = function xCoordinate(pos) {
                return (pos % 2 === 0 ? pos / 2 : -(pos + 1) / 2) * (8 + extraSep);
            };

            function generateHatchArray(w) {
                var hatchNum = undefined,
                    hatchNumInt = undefined,
                    hatchWidth = undefined,
                    hatchDiff = undefined,
                    arrHatchesWidth = undefined;

                if (w === 0) {
                    return [1];
                }

                hatchWidth = w === 5 || w === 6 || w === 9 ? 3 : w <= 4 ? w : 4;
                hatchNum = w / hatchWidth;
                hatchNumInt = Math.ceil(hatchNum);
                arrHatchesWidth = new Array(hatchNumInt);

                //Fill array
                for (var _j = 0; _j < hatchNumInt; _j += 1) {
                    arrHatchesWidth[_j] = hatchWidth;
                }
                hatchDiff = Math.ceil((hatchNum - Math.floor(hatchNum)) * hatchWidth);
                if (hatchDiff > 0) {
                    arrHatchesWidth[Math.floor(hatchNumInt / 2)] = hatchDiff;
                }

                return arrHatchesWidth;
            }

            function createHatch3D(w, d) 
            {
                var obj = undefined,
                    geom = undefined,
                    mesh = undefined,
                    wFeet = w * (8 + extraSep) - extraSep;

                obj = new THREE.Shape([new THREE.Vector2(-wFeet, 0), new THREE.Vector2(-wFeet, d), new THREE.Vector2(0, d), new THREE.Vector2(0, 0)]);

                geom = new THREE.ExtrudeGeometry(obj, {
                    bevelEnabled: false,
                    steps: 1,
                    amount: 3
                });

                mesh = new THREE.Mesh(geom, materialHatch);
                mesh.rotation.x = Math.PI / 2;
                geom.translate(8.5 + extraSep, 0, 0);
                return mesh;
            }

            //Generate info of widths per Block (width, depth)
            for (j = 1; j <= lastBay + 1; j += 2) {
                key = __s__.pad(j, 3);
                g3Bay = g3Bays["b" + key];
                if (!g3Bay) {
                    continue;
                }

                gbn = Number(g3Bay.compactBlockNum);

                if (!icb[gbn]) {
                    icb[gbn] = {
                        baseBay: g3Bay.iBay,
                        cbn: gbn,
                        cells: dataStructured[key].n,
                        maxD: dataStructured[key].maxD || 0,
                        posLeft: dataStructured[key].n ? Number(_.max(_.filter(_(dataStructured[key].cells).keys(), function (k) {
                            return Number(k) % 2 === 0;
                        }), function (kk) {
                            return Number(kk);
                        })) : 0,
                        posRight: dataStructured[key].n ? Number(_.max(_.filter(_(dataStructured[key].cells).keys(), function (k) {
                            return Number(k) % 2 === 1;
                        }), function (kk) {
                            return Number(kk);
                        })) : 0
                    };
                } else {
                    icb[gbn].posLeft = dataStructured[key].n ? Math.max(icb[gbn].posLeft, Number(_.max(_.filter(_(dataStructured[key].cells).keys(), function (k) {
                        return Number(k) % 2 === 0;
                    }), function (kk) {
                        return Number(kk);
                    }))) : 0;
                    icb[gbn].posRight = dataStructured[key].n ? Math.max(icb[gbn].posRight, Number(_.max(_.filter(_(dataStructured[key].cells).keys(), function (k) {
                        return Number(k) % 2 === 1;
                    }), function (kk) {
                        return Number(kk);
                    }))) : 0;
                }
                maxBlock = gbn;
            }

            //Get accum up & down the vessel
            icb[1].maxLeftUp = icb[1].posLeft;
            icb[1].maxRightUp = icb[1].posRight;
            icb[maxBlock].maxLeftDown = icb[maxBlock].posLeft;
            icb[maxBlock].maxRightDown = icb[maxBlock].posRight;

            for (j = 2, lenJ = maxBlock + 1; j < lenJ; j += 1) {

                icb[j].maxLeftUp = Math.max(icb[j - 1].maxLeftUp, icb[j].posLeft);
                icb[j].maxRightUp = Math.max(icb[j - 1].maxRightUp, icb[j].posRight);

                icb[lenJ - j].maxLeftDown = Math.max(icb[lenJ - j + 1].maxLeftDown, icb[lenJ - j].posLeft);
                icb[lenJ - j].maxRightDown = Math.max(icb[lenJ - j + 1].maxRightDown, icb[lenJ - j].posRight);
            }

            //Create vessel shape (oval type: few-more-few). Define "borders"
            for (j = 1, lenJ = maxBlock + 1; j < lenJ; j += 1) {
                icb[j].maxLeft = Number(Math.min(icb[j].maxLeftUp, icb[j].maxLeftDown));
                icb[j].maxRight = Number(Math.min(icb[j].maxRightUp, icb[j].maxRightDown));

                //Even the load is not symmetric, this will make it symmetric
                symmetricMax = Math.max(icb[j].maxLeft, icb[j].maxRight);

                dd = !icb[j].maxD ? 22.5 : icb[j].maxD <= 20 ? 22.5 : 45;
                if (dd === 0) {
                    continue;
                }

                //Calculate hatches width and depth
                if (j === 1) {
                    hatchesArr.push({
                        d: dd,
                        l: icb[j].maxLeft,
                        b: icb[j].baseBay,
                        hts: generateHatchArray(symmetricMax + addZeroCell)
                    });
                } else {
                    if (icb[j].maxLeft === icb[j - 1].maxLeft && icb[j].maxRight === icb[j - 1].maxRight && hatchesArr[hatchesArr.length - 1].d + (icb[j].maxD || 45) <= maxContsDepth) {
                        hatchesArr[hatchesArr.length - 1].d += icb[j].maxD || 45;
                    } else {
                        hatchesArr.push({
                            d: dd,
                            l: icb[j].maxLeft,
                            b: icb[j].baseBay,
                            hts: generateHatchArray(symmetricMax + addZeroCell)
                        });
                    }
                }
            }

            //Create 3D Hatches (Vessel)
            z = 22.5;

            for (j = 0, lenJ = hatchesArr.length; j < lenJ; j += 1) 
            {
                block = hatchesArr[j];

                hatchLine = new THREE.Group();
                hatchLine.name = "baseBay-" + block.b;
                hatchLine.baseBay = block.b;
                this.hatchCovers["b" + __s__.pad(block.b, 3)] = hatchLine;

                posL = block.l;
                x = xCoordinate(posL); // x coordinate

                for (var k = 0, lenK = block.hts.length; k < lenK; k += 1) 
                {
                    hatch = block.hts[k];
                    msh = createHatch3D(hatch, block.d);

                    msh.position.x = x - 2 * extraSep;

                    hatchLine.add(msh);
                    x -= hatch * (8 + extraSep);
                }

                hatchLine.position.z = z;
                hatchLine.originalZ = z;
                hatchGroup3D.add(hatchLine);
                z += block.d + 2 * extraSep;
            }

            //Create 3D Hatches (by Bay)
            for (key in g3Bays) 
            {
                g3Bay = g3Bays[key];

                if (g3Bay.isBlockStart) 
                {
                    icbn = icb[g3Bay.compactBlockNum];
                    if (!icbn.maxD) 
                    {
                        continue;
                    }

                    var xL = xCoordinate(icbn.maxLeft),
                        xR = xCoordinate(icbn.maxRight);

                    //Add hatchC
                    var obj = new THREE.Shape([new THREE.Vector2(xL + addZeroCell * (8 + extraSep), 0), new THREE.Vector2(xR, 0), new THREE.Vector2(xR, icbn.maxD), new THREE.Vector2(xL + addZeroCell * (8 + extraSep), icbn.maxD)]);
                    var geom = new THREE.ExtrudeGeometry(obj, 
                    {
                        bevelEnabled: false,
                        steps: 1,
                        amount: 2
                    });
                    var mesh = new THREE.Mesh(geom, materialHatch);

                    mesh.rotation.x = Math.PI / 2;
                    mesh.position.y = 1;
                    mesh.visible = false;
                    
                    g3Bay.add(mesh);
                    g3Bay.hatchC = mesh;
                }
            }

            this.scene.add(hatchGroup3D);
            hatchGroup3D.position.y = 1.5;

            var length = 0;

            for(var i = 0; i < hatchesArr.length; i ++)
            {
                length += hatchesArr[i].d * 1;
            }

            length += hatchesArr[hatchesArr.length - 1].d * 1;

            this.scene.ship_len = length;
            this.hatchDeck = hatchGroup3D;
        }
    }, {
        key: '_createShipDeck',
        value: function _createShipDeck() 
        {
            /* modified by swell */
            return;
            var material = new THREE.LineBasicMaterial({ color: 0x3d8ca8, opacity: 1, linewidth: 2 }),
                extraSep = this.appScene.options.extraSep,
                maxWidth = this.maxWidth,
                maxDepth = this.maxDepth,
                ellipse = undefined,
                ellipsePath = new THREE.CurvePath(),
                ellipseGeometry = undefined,
                line = undefined,
                maxWidthFeet = maxWidth * (8 + extraSep) / 4;

            ellipsePath.add(new THREE.EllipseCurve(4, 20, maxWidthFeet, maxWidthFeet * 3, Math.PI, 0, false));
            ellipsePath.add(new THREE.EllipseCurve(4, maxDepth, maxWidthFeet, maxWidthFeet * 0.75, 0, Math.PI, false));
            ellipsePath.closePath();
            ellipseGeometry = ellipsePath.createPointsGeometry(150);
            line = new THREE.Line(ellipseGeometry, material);
            line.rotation.x = Math.PI / 2;
            this.scene.add(line);

            this.simpleDeck = line;
        }
    }, {
        key: '_createHouse',
        value: function _createHouse(hAbv) 
        {
            var extraSep = this.appScene.options.extraSep,
                maxWidth = this.maxWidth,
                belowTiers = this.appScene.data.belowTiers,
                maxWidthFeet = maxWidth * (8 + extraSep) / 2 * 0.9,
                maxHeightFeet = Math.max(1, hAbv) * (9.5 + extraSep) + 6,
                geom,
                obj,
                mesh,
                rectGeom,
                hBel = Math.max(1, belowTiers.n * 0.7),
                yBelow = hBel * (9.5 + extraSep),
                xBelow = hBel * (8 + extraSep) / 2,
                obj3d,
                materialWindows = new THREE.MeshPhongMaterial({ color: 0x5cb2da, side: THREE.DoubleSide }),
                materialHouse = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });

            obj = new THREE.Shape([new THREE.Vector2(0, -yBelow), new THREE.Vector2(-xBelow, -yBelow), new THREE.Vector2(-maxWidthFeet, 0), new THREE.Vector2(-maxWidthFeet, maxHeightFeet), new THREE.Vector2(-maxWidthFeet - 0.25 * maxWidthFeet, maxHeightFeet + 10), new THREE.Vector2(-maxWidthFeet - 0.25 * maxWidthFeet, maxHeightFeet + 20), new THREE.Vector2(-maxWidthFeet, maxHeightFeet + 20), new THREE.Vector2(-maxWidthFeet + 0.125 * maxWidth, maxHeightFeet + 24), new THREE.Vector2(maxWidthFeet - 0.125 * maxWidth, maxHeightFeet + 24), new THREE.Vector2(maxWidthFeet, maxHeightFeet + 20), new THREE.Vector2(maxWidthFeet + 0.25 * maxWidthFeet, maxHeightFeet + 20), new THREE.Vector2(maxWidthFeet + 0.25 * maxWidthFeet, maxHeightFeet + 10), new THREE.Vector2(maxWidthFeet, maxHeightFeet), new THREE.Vector2(maxWidthFeet, 0), new THREE.Vector2(xBelow, -yBelow), new THREE.Vector2(0, -yBelow)]);

            geom = new THREE.ExtrudeGeometry(obj, {
                bevelEnabled: false,
                steps: 1,
                amount: 20
            });

            mesh = new THREE.Mesh(geom, materialHouse);
            mesh.matrixAutoUpdate = false;

            obj3d = new THREE.Object3D();
            obj3d.name = "house";
            obj3d.add(mesh);

            obj = new THREE.Shape([new THREE.Vector2(-1.125 * maxWidthFeet, 0), new THREE.Vector2(-1.125 * maxWidthFeet, 7), new THREE.Vector2(1.125 * maxWidthFeet, 7), new THREE.Vector2(1.125 * maxWidthFeet, 0)]);

            rectGeom = new THREE.ShapeGeometry(obj);
            mesh = new THREE.Mesh(rectGeom, materialWindows);
            mesh.position.y = maxHeightFeet + 10;
            mesh.position.z = -0.25;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);

            mesh = new THREE.Mesh(rectGeom, materialWindows);
            mesh.position.y = maxHeightFeet + 10;
            mesh.position.z = 20.25;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);

            rectGeom = new THREE.SphereGeometry(5, 32, 32);
            mesh = new THREE.Mesh(rectGeom, materialHouse);
            mesh.position.y = maxHeightFeet + 24;
            mesh.position.z = 10;
            mesh.position.x = maxWidthFeet - 10;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);

            rectGeom = new THREE.SphereGeometry(5, 32, 32);
            mesh = new THREE.Mesh(rectGeom, materialHouse);
            mesh.position.y = maxHeightFeet + 24;
            mesh.position.z = 10;
            mesh.position.x = -maxWidthFeet + 10;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            obj3d.add(mesh);

            obj3d.position.x = 4;
            obj3d.position.z = -20;
            obj3d.visible = false;
            this.scene.add(obj3d);

            this.shipHouse = { mesh: obj3d, dropdown: null, currPosBay: 0, currPosZ: 0 };
        }
    }, {
        key: 'setCameraPosition',
        value: function setCameraPosition(x, y, z) {
            this.camera.position.z = z;
            this.camera.position.x = -1000;
            this.camera.position.y = y;
            this.controls.maxDistance = z * 2;
            this.controls.minDistance = z / 2;
            return { x: x, y: y, z: z };
        }
    }, {
        key: 'resize3DViewer',
        value: function resize3DViewer(w, h) {
            if (!this.camera) {
                return;
            }
            this.width = w;
            this.height = h;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        }
    }, {
        key: 'loadModel',
        value: function loadModel(mainScene, modelFilesDir, modelFilesMtl, modelFilesObj) {

            var that = this,
                node = this.container,
                loadDiv = node.loadingDiv,
                options = this.appScene.options,
                mats = undefined,
                mesh = undefined,
                rt = undefined,
                cm = undefined,
                loader = undefined,
                mtlLoader = undefined,
                objLoader = undefined,
                onProgress = function onProgress(xhr) {
                var percentComplete = xhr.loaded / (xhr.total || 3000000);
                loadDiv.updateLoader(percentComplete, 0.3);
            },
                onLoaded = function onLoaded(fileObj) {
                var ev = __d__.addEventDsptchr("modelLoaded");

                //Dispatch event
                ev.data = { model: fileObj };
                node.dispatchEvent(ev);

                //Finish the loading div
                loadDiv.updateLoader(1, 0.5);

                //Hide the loading div
                setTimeout(function () {
                    loadDiv.hide();
                }, 500);
            };

            return new Promise(function (resolve, reject) {
                var modelName = modelFilesObj.replace(".", "_");

                if (that._modelsLoaded[modelName]) {
                    resolve(modelName);return;
                }

                loadDiv = that.container.loadingDiv;
                loadDiv.setPercentage(0);
                loadDiv.setMessage("Loading model...");
                loadDiv.show();

                mtlLoader = new THREE.MTLLoader();
                mtlLoader.setBaseUrl(modelFilesDir + "textures/");
                mtlLoader.setPath(modelFilesDir);
                mtlLoader.load(modelFilesMtl, function (materials) {
                    var cm = undefined,
                        loader = undefined;

                    materials.preload();

                    objLoader = new THREE.OBJLoader();
                    objLoader.setPath(modelFilesDir);
                    objLoader.setMaterials(materials);
                    objLoader.load(modelFilesObj, function (object) 
                    {
                       var m = undefined,
                            mesh = new THREE.Object3D();
                        //Iterate the 3D Model
                        object.traverse(function (child) {
                            m = new THREE.Mesh(child.geometry, child.material);
                            m.name = child.name;
                            m.receiveShadow = true;
                            m.castShadow = true;
                            mesh.add(m);
                        });

                        //Add it to a Map of models
                        that._modelsLoaded[modelName] = mesh;
                        onLoaded();
                        resolve(modelName);
                        return;
                    }, onProgress, function (xhr) {
                        window.alert('An error happened loading assets');
                        console.error(xhr);
                        reject();
                    });
                });
            });
        }
    }, {
        key: 'animate',
        value: function animate() {
            var me = this;

            function anim() {
                requestAnimationFrame(anim);
                me.controls.update();
                me.render();
            }
            anim();
        }
    }, {
        key: 'render',
        value: function render() {
            var intersects = undefined,
                lenI = undefined,
                nameSel = undefined,
                selObj = undefined,
                mesh = undefined;

            if (!this._isRendering) {
                return;
            }

            this.frames += 1;

            if (this.frames & 1) 
            {

                this.raycaster.setFromCamera(this.mouseVector.clone(), this.camera);

                intersects = this.raycaster.intersectObjects(this.containersGroup.children, true);
                lenI = intersects.length;

                if (lenI > 1) 
                {
                    var containersIDs = this.appScene.data.containersIDs;

                    nameSel = intersects[0].object.name;

                    if (nameSel !== null && nameSel !== undefined) 
                    {
                        selObj = containersIDs[nameSel];

                        if (selObj) 
                        {
                            if (intersects[0].object !== this._INTERSECTED) 
                            {
                                //Any highlighted? return to normal texture
                                if (this._INTERSECTED) 
                                {
                                    if(this._INTERSECTED.isBasic)
                                    {
                                        this.switchMeshWireframe(this._INTERSECTED, "show");
                                    }
                                    else
                                    {
                                        this._INTERSECTED.material = this._INTERSECTED.mat_prev;
                                    }
                                }
                                //Highlight it
                                this._INTERSECTED = intersects[0].object;
                                
                                if (!this._INTERSECTED.isBasic) 
                                {
                                    this._INTERSECTED.mat_prev = this._INTERSECTED.material;
                                    this._INTERSECTED.material = new THREE.MeshPhongMaterial({color : 0x0000FF});
                                }

                                this.putInfoWindow(selObj);
                            }
                        }
                    }
                } 
                else 
                {
                    if (this._INTERSECTED) 
                    {
                        if(this._INTERSECTED.isBasic)
                        {
                            this.switchMeshWireframe(this._INTERSECTED, "show");
                        }
                        else
                        {
                            this._INTERSECTED.material = this._INTERSECTED.mat_prev;
                        }

                        // this._INTERSECTED.material = this._INTERSECTED.isBasic ? this.basicMaterial : new THREE.MeshPhongMaterial({color : 0x0000FF});
                        // this._INTERSECTED.material = this._INTERSECTED.isBasic ? this.basicMaterial : this.allMaterials[this._INTERSECTED.materialPos];
                        this._INTERSECTED = null;
                    }
                }
            }

            //this.lightsGroup.rotation.x = this.camera.rotation.x;
            //this.lightsGroup.rotation.y = this.camera.rotation.y;
            //this.lightsGroup.rotation.z = this.camera.rotation.z;

            this.renderer.render(this.scene, this.camera);
        }
    }, {
        key: 'putInfoWindow',
        value: function putInfoWindow(selObj) {
            this.appScene._infoNode.innerHTML = "<small>Position:</small> " + selObj.p + "<br />" + "<small>ID:</small> " + selObj.c + "<br />" + "<small>ISO:</small> " + selObj.i + (selObj.r ? " / Reefer" : "") + " <small>Status:</small> " + (selObj.s ? "full" : "empty") + "<br />" + "<small>Carrier:</small> " + selObj.o + "<br />" +
            //"<small>hazardous:</small> " + (selObj.w ? "yes" : "no") + "<br />" +
            //"<small>tank:</small> " + (selObj.t ? "yes" : "no") + "<br />" +
            //"<small>OOG:</small> " + (selObj.x ? "yes" : "no") + "<br />" +
            "<small>POD:</small> " + selObj.d + "<br />" + "<small>POL:</small> " + (selObj.f || "") + " <small>Weight:</small> " + selObj.m + "MT";

            this.appScene._bayNode.innerHTML = "<small>bay</small> " + selObj.iBay;

            $("#nav_buttons").css("display", "block");
        }
    }]);

    return Renderer3D;
})();

exports.Renderer3D = Renderer3D;

},{"../text2D/SpriteText2D.js":10,"../text2D/textAlign.js":11,"../utils/dom-utilities.js":12,"../utils/js-helpers.js":13}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');
var Preloader = require('../utils/preloader.js');
var DataLoader = require('./data-loader.js');
var ModelsFactory = require('./models-factory.js');
var i18labels = require('./i18labels.js');

//Class VesselsApp2D

var VesselsApp2D = (function () {
    function VesselsApp2D(btnLaunch) {
        var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, VesselsApp2D);

        var me = this;

        var version = 1.0;

        this.options = __s__.extend({
            loaderColor: "#f2f2f2",
            loaderColorSucess: "#79e3da",
            sizes: [{ name: "Letter", w: 8.5, h: 11.0 }, { name: "Legal", w: 8.5, h: 14.0 }, { name: "A4", w: 8.3, h: 11.7 }, { name: "A3", w: 11.7, h: 16.5 }],
            dpis: [{ name: "300 dpi", res: 300 }, { name: "150 dpi", res: 150 }],
            extraSpace: {
                labelsTopHeight: 8,
                labelsLeftWidth: 7,
                extraOOGratio: 1 / 4
            },
            padding: { w: 0.04, h: 11.0 },
            aboveBelowSep: 2
        }, opts);

        this._node = (function () {
            var divMainC = undefined,
                divForm = undefined,
                divProgress = undefined,
                dropdwnOr = undefined,
                dropdwnSz = undefined,
                dropdwnDp = undefined,
                dropdwnRw = undefined,
                dropdwnClr = undefined,
                spanOr = undefined,
                ulColors = undefined,
                btnSave = undefined,
                btnCancel = undefined,
                colorPickerDiv = undefined,
                colorPickerJoe = undefined,
                key = undefined,
                filter = undefined,
                arrLis = [],
                divHolder = undefined,
                k = undefined,
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
            for (key in me.options.dpis) {
                filter = me.options.dpis[key];
                arrLis.push("<option value='" + key + "'>" + filter.name + "</option>");
            }
            dropdwnDp.innerHTML = arrLis.join("");

            //Sizes
            dropdwnSz = document.createElement("SELECT");
            dropdwnSz.id = baseId + "-dropdwn-sizes";
            divHolder.appendChild(dropdwnSz);

            arrLis = [];
            for (key in me.options.sizes) {
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
        })();

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
    }

    //constructor

    _createClass(VesselsApp2D, [{
        key: 'loadUrl',
        value: function loadUrl(jsonUrl, loadingMessage, progressCallback) {
            return this.dataLoader.loadUrl(jsonUrl, loadingMessage, progressCallback);
        }
    }, {
        key: 'loadData',
        value: function loadData(jsonObj) {
            return this.dataLoader.generateStructuredData(jsonObj);
        }
    }, {
        key: '_init',
        value: function _init() {
            var me = this,
                j = undefined,
                lenJ = undefined,
                mod = undefined;

            //Initialize models factory
            this.modelsFactory = new ModelsFactory.ModelsFactory(this);
        }
    }, {
        key: 'dropFilterChanged',
        value: function dropFilterChanged() {
            var res = this.options.dpis[this._node.dropdwnDp.value].res,
                size = this.options.sizes[this._node.dropdwnSz.value],
                arrLis = undefined,
                k = undefined,
                rws = undefined,
                bayW = undefined,
                dropdwnRw = this._node.dropdwnRw,
                optsPaddingW = this.options.padding.w,
                paddingW = undefined;

            this.width = res * size[this._node.dropdwnOr.value === "1" ? "w" : "h"];
            this.height = res * size[this._node.dropdwnOr.value !== "1" ? "w" : "h"] - 1;

            arrLis = [];
            arrLis.push("<option value='1'>" + i18labels.PRINTOPTS_PERROW + ": 1</option>");
            for (k = 2; k < 9; k += 1) {
                bayW = Math.round(this.width / (k * (1 + optsPaddingW)));
                if (bayW < res * 0.3) {
                    break;
                }
                arrLis.push("<option data-w='" + bayW + "' value='" + k + "'>" + i18labels.PRINTOPTS_PERROW + ": " + k + "</option>");
            }
            dropdwnRw.innerHTML = arrLis.join("");
            dropdwnRw.selectedIndex = Math.floor(arrLis.length / 2);
        }
    }, {
        key: 'applyColorsFilter',
        value: function applyColorsFilter(filters) 
        {
            var arrLis = [],
                key = undefined,
                filter = undefined;

            for (key in filters) {
                filter = filters[key];
                arrLis.push("<option value='" + key + "'>" + i18labels.PRINTOPTS_COLORBY + ": " + filter.name + "</option>");
            }
            this._node.dropdwnClr.innerHTML = arrLis.join("");
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

            this._node.style.display = doOpen ? "block" : "none";
            this.isOpened = doOpen;

            if (!doOpen) {
                if (this.onToggled) {
                    this.onToggled(false);
                }return;
            }

            this._node.divForm.style.display = "block";
            this._node.divProgress.style.display = "none";

            //Populate color options
            this.dropFilterChanged();

            //If callback
            if (this.onToggled) {
                this.onToggled(true);
            }
        }
    }, {
        key: 'launchPdfStart',
        value: function launchPdfStart() {
            var rws = this._node.dropdwnRw.value,
                res = this.options.dpis[this._node.dropdwnDp.value].res,
                filterBy = this._node.dropdwnClr.value,
                w = this.width,
                h = this.height;

            this.pdfStart(rws, res, w, h, filterBy);
        }
    }, {
        key: 'pdfStart',
        value: function pdfStart(rws, res, width, height, filterBy, inchFactor) {
            var me = this,
                aboveBelowSep = this.options.aboveBelowSep,
                data = this.data,
                dataStructured = _.clone(data.dataStructured),
                dataStructuredKeysArr = _.clone(data.dataStructuredKeysArr),
                hasZeroCell = data.hasZeroCell,
                maxH = undefined,
                maxW = undefined,
                j = undefined,
                lenJ = undefined,
                positionsX = [0],
                positionsY = [0],
                positions = [],
                bayW = undefined,
                bayWTotal = undefined,
                bayH = undefined,
                nextBayH = undefined,
                contHeight = 8,
                contWidth = 8,
                paddingW = undefined,
                optsPaddingW = me.options.padding.w,
                maxCell = undefined,
                cellsWidth = undefined,
                mapCells = {},
                mapTiers = {},
                tierH = 0,
                bayImages = [],
                canvasPage = undefined,
                ctxPage = undefined,
                pageX = undefined,
                pageY = undefined,
                divForm = this._node.divForm,
                divProgress = this._node.divProgress,
                labelsTopHeight = this.options.extraSpace.labelsTopHeight,
                labelsLeftWidth = this.options.extraSpace.labelsLeftWidth,
                extraOOGratio = this.options.extraSpace.extraOOGratio,
                extraHbase = undefined,
                extraWbase = undefined,
                boxW = undefined,
                boxH = undefined,
                boxTimesH = undefined,
                boxTop = undefined,
                boxLeft = undefined,
                legendCanvases = undefined,
                fontFactor = 1,
                doLog = true;

            function drawContainer(obj) {
                var inchFactor = arguments.length <= 1 || arguments[1] === undefined ? me.inchFactor : arguments[1];
                var noColor = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
                var onlyPlus = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

                var canvas = document.createElement("canvas"),
                    ctx = undefined,
                    color = undefined,
                    txt = undefined;

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

                if (!obj.s) {
                    //Not full
                    txt = "e";
                }
                if (obj.r) {
                    //Reefer
                    txt = "r";
                }

                if (txt) {
                    var calcFactor = inchFactor / 4;
                    if (rws < 7) {
                        calcFactor = calcFactor + (8 - rws) * 0.2;
                    }
                    ctx.font = 14 * calcFactor + "px Arial";
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#333333";
                    ctx.fillText(txt, 4 * inchFactor, 7 * inchFactor);
                }

                if (obj.w) {
                    //Hazardous
                    ctx.strokeStyle = "#666666";
                    ctx.lineWidth = 1;
                    ctx.moveTo(0, contHeight * inchFactor / 2);
                    ctx.lineTo(contWidth * inchFactor / 2, 0);
                    ctx.lineTo(contWidth * inchFactor, contHeight * inchFactor / 2);
                    ctx.lineTo(contWidth * inchFactor / 2, contHeight * inchFactor);
                    ctx.lineTo(0, contHeight * inchFactor / 2);
                    ctx.stroke();
                }

                if (obj.h === 9.5) {
                    //High-cube
                    ctx.fillStyle = "#333333";
                    ctx.beginPath();
                    ctx.moveTo(contWidth * inchFactor * 3 / 4, 0);
                    ctx.lineTo(contWidth * inchFactor, contHeight * inchFactor / 3);
                    ctx.lineTo(contWidth * inchFactor / 2, contHeight * inchFactor / 3);
                    ctx.lineTo(contWidth * inchFactor * 3 / 4, 0);
                    ctx.fill();
                }

                switch (obj.l) {//Length
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

            function drawContainerPlus(obj) {
                var inchFactor = arguments.length <= 1 || arguments[1] === undefined ? me.inchFactor : arguments[1];
                var noColor = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

                return drawContainer(obj, inchFactor, noColor, true);
            }

            function drawContainerOOG(obj) {
                var inchFactor = arguments.length <= 1 || arguments[1] === undefined ? me.inchFactor : arguments[1];

                var canvas = document.createElement("canvas"),
                    ctx = undefined,
                    color = undefined,
                    txt = undefined,
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
                var t = undefined,
                    tier = undefined,
                    c = undefined,
                    cell = undefined,
                    dataBay = dataStructured[key],
                    dataBay2 = undefined,
                    cnv = undefined,
                    ctx = undefined,
                    y = undefined,
                    x = undefined,
                    titleT = key,
                    calcFactor = undefined,
                    contWidthCenter = Math.round(contWidth / 2) * me.inchFactor,
                    contHeightFactored = contHeight * me.inchFactor,
                    contWidthFactored = contWidth * me.inchFactor,
                    doLog = true;

                cnv = document.createElement("canvas");
                cnv.width = bayWTotal;
                cnv.height = maxH * me.inchFactor + labelsTopHeight * 2 * me.inchFactor;

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
                if (rws < 7) {
                    calcFactor = calcFactor + (8 - rws) * 0.2;
                }

                ctx.font = 24 * calcFactor + "px Georgia";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(titleT, bayWTotal / 2, Math.max(labelsTopHeight / 2 * me.inchFactor, 0.5 * me.inchFactor));

                ctx.font = 10 * calcFactor + "px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#666666";
                ctx.strokeStyle = "#dddddd";
                ctx.lineWidth = 2 * me.lineWidth;
                ctx.save();

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
                        var cnt = drawContainer(cell.tiers[t]);
                        ctx.drawImage(cnt, x, y);
                    }
                }

                //2nd pass for OOG extras icons
                for (c in dataBay.cells) {
                    cell = dataBay.cells[c];
                    for (t in cell.tiers) {
                        if (!cell.tiers[t].g) {
                            continue;
                        }
                        x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                        y = (mapTiers[Number(t)] - contHeight + labelsTopHeight) * me.inchFactor;
                        var cnt = drawContainerOOG(cell.tiers[t]);
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
                                if (cell.tiers[t].iBay & 1) {
                                    continue;
                                }
                                x = (mapCells[Number(c)] + labelsLeftWidth) * me.inchFactor;
                                y = (mapTiers[Number(t)] - contHeight + labelsTopHeight) * me.inchFactor;
                                var cnt = drawContainerPlus(cell.tiers[t]);
                                ctx.drawImage(cnt, x, y);
                            }
                        }
                    }
                }

                return cnv;
            }

            function drawLegend() {
                var f = undefined,
                    cnv = undefined,
                    ctx = undefined,
                    x = 0,
                    y = 0,
                    xInit = Math.round(6 * me.inchFactor),
                    yInit = Math.round(labelsTopHeight * me.inchFactor * 2),
                    yHeight = maxH * me.inchFactor + labelsTopHeight * 2 * me.inchFactor,
                    yAdd = Math.round(14 * me.inchFactor),
                    xPad = Math.round(18 * me.inchFactor),
                    maxX = 0,
                    calcFactor = undefined,
                    containerFactor = 1.25,
                    extraH = Math.round(contHeight * extraOOGratio * me.inchFactor * containerFactor),
                    extraW = Math.round(contWidth * extraOOGratio * me.inchFactor * containerFactor),
                    obs = undefined,
                    obj = undefined,
                    canvases = [],
                    columns = 0,
                    verticalNum = 0,
                    verticalMax = 0;

                function addCanvas() {
                    //create new canvas
                    cnv = document.createElement("canvas");
                    cnv.width = bayWTotal * 1.5;
                    cnv.height = yHeight;
                    ctx = cnv.getContext("2d");
                    ctx.font = 19 * calcFactor + "px Arial";
                    ctx.textAlign = "left";
                    ctx.fillStyle = "#444444";

                    x = xInit;y = yInit;columns = 0;
                    canvases.push(cnv);
                }

                function addLabel(txt, obj) {
                    var cleanFilter = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

                    if (cleanFilter) {
                        obj[filterBy] = "";
                    }

                    if (verticalNum === 0 && columns === 0) {
                        addCanvas();
                    }
                    y = verticalNum * yAdd + yInit;

                    ctx.drawImage(drawContainer(obj, me.inchFactor * containerFactor, cleanFilter), x, y);
                    if (obj.g) {
                        ctx.drawImage(drawContainerOOG(obj, me.inchFactor * containerFactor), x - extraW, y - extraH);
                    }

                    ctx.fillText(txt, x + 14 * me.inchFactor, y + 8 * me.inchFactor);

                    maxX = Math.round(Math.max(maxX, ctx.measureText(txt).width));
                    verticalNum += 1;

                    if (verticalNum === verticalMax - 1) {
                        y = yInit;x += xInit + xPad + maxX;maxX = 0;columns += 1;
                        if (columns > 1) {
                            columns = 0;x = xInit;
                        }
                        verticalNum = 0;
                    }
                }

                calcFactor = fontFactor;
                if (rws < 7) {
                    calcFactor = calcFactor + (8 - rws) * 0.2;
                }
                if (rws < 4) {
                    containerFactor = 1.2;
                }

                verticalMax = Math.floor(yHeight / yAdd);
                verticalNum = 0;

                for (f in data.filters[filterBy].obs) {
                    obj = { s: 1 };
                    obj[filterBy] = f;
                    addLabel(f, obj, false);
                }

                //Add Labels
                addLabel("Hazardous", { s: 1, w: 1 });
                addLabel("Empty", { s: 0 });
                addLabel("Reefer", { s: 1, r: 1 });
                addLabel("High-cube", { s: 1, h: 9.5 });
                addLabel("40-footer", { s: 1, l: 40 });
                addLabel("45-footer", { s: 1, l: 45 });

                //Add OOG
                addLabel("Break Bulk", { s: 1, g: "x" });
                addLabel("Oversize Top", { s: 1, g: "t" });
                addLabel("Oversize Left", { s: 1, g: "l" });
                addLabel("Oversize Right", { s: 1, g: "r" });
                addLabel("Oversize Front", { s: 1, g: "f" });
                addLabel("Oversize Back", { s: 1, g: "b" });

                return canvases;
            }

            function sendPagesToServer() {
                var postUrl = me.postUrl,
                    reqUpload = undefined,
                    json = undefined,
                    isLndscp = undefined,
                    j = undefined,
                    lenJ = undefined,
                    closeBtn = undefined,
                    handlerUpload = function handlerUpload(e) {
                    if (e.lengthComputable) {
                        var percentage = Math.round(e.loaded * 100 / e.total);
                        divProgress.innerHTML = e.loaded < e.total ? percentage + "%" : "Finishing, please wait...";
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

                reqUpload.fail(function (err) {
                    console.error(err);
                    if (!divProgress) {
                        return;
                    }

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
                var j = undefined,
                    lenJ = undefined,
                    n = undefined,
                    dataStructuredKeysArrExtended = [],
                    cBay = undefined,
                    key = undefined,
                    iBay = undefined,
                    nextOdd = undefined;

                for (j = 0, lenJ = dataStructuredKeysArr.length; j < lenJ; j += 1) {
                    key = dataStructuredKeysArr[j];
                    dataStructuredKeysArrExtended.push(key);
                    iBay = Number(key);
                    cBay = dataStructured[key];
                    n = j + 1;

                    if (cBay.isBlockStart && n < lenJ && Number(dataStructuredKeysArr[n]) !== iBay + 2 || n === lenJ) {
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
            if (divForm) {
                divForm.style.display = "none";
            }
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

            boxTop = Math.round((height - boxH) / 2);
            boxLeft = Math.round((width - boxW) / 2);

            //Positions in pixels for each Bay
            positionsX[0] = 0;
            positionsY[0] = 0;
            legendCanvases = drawLegend();
            positions = [{ x: 0, y: 0 }];

            for (j = 1, lenJ = dataStructuredKeysArr.length + legendCanvases.length; j < lenJ; j += 1) {
                positionsY[j] = positionsY[j - 1];
                positionsX[j] = positionsX[j - 1] + bayWTotal + paddingW;

                if (j % rws === 0) {
                    positionsY[j] = positionsY[j - 1] + nextBayH;
                    positionsX[j] = 0;
                }
                if (positionsY[j] + nextBayH > height) {
                    positionsY[j] = 0;
                }
                positions.push({ x: positionsX[j], y: positionsY[j] });
            }

            //console.log("Positions", positions);
            //console.log("Dimensions", { bayW, bayH, nextBayH, boxW, boxH, boxLeft, boxTop });

            //Cells positions
            maxCell = Number(_.max(dataStructured, function (k) {
                return k.maxCell;
            }).maxCell);
            cellsWidth = (maxCell + (hasZeroCell ? 1 : 0)) * contWidth;
            var lPos = 0,
                rPos = cellsWidth - contWidth;
            for (j = maxCell, lenJ = hasZeroCell ? 0 : 1; j >= lenJ; j -= 1) {
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
            for (j = data.iTierMin, lenJ = data.iTierMax; j <= lenJ; j += 2) {
                mapTiers[j] = maxH - tierH;
                tierH += contHeight;
            }
            tierH += aboveBelowSep * 2;
            for (j = data.iTierMinAbove, lenJ = data.iTierMaxAbove; j <= lenJ; j += 2) {
                mapTiers[j] = maxH - tierH;
                tierH += contHeight;
            }

            //Prepare 1st page
            canvasPage = document.createElement("canvas");
            canvasPage.width = width;canvasPage.height = height;
            ctxPage = canvasPage.getContext("2d");
            pageY = 0;

            setTimeout(function () {
                var lenJ = dataStructuredKeysArr.length,
                    legends = legendCanvases || drawLegend(),
                    lenK = legends.length,
                    nX = undefined;
                //Iterate bays & pages
                for (var _j = 0; _j < lenJ; _j += 1) {
                    var bayInfo = dataStructuredKeysArr[_j],
                        im = undefined;
                    if (!bayInfo) {
                        continue;
                    }

                    if (positions[_j].x === 0 && positions[_j].y === 0) {
                        canvasPage = document.createElement("canvas");
                        canvasPage.width = width;canvasPage.height = height;
                        ctxPage = canvasPage.getContext("2d");
                        bayImages.push(canvasPage);
                    }

                    im = drawBay(dataStructuredKeysArr[_j]);
                    ctxPage.drawImage(im, positions[_j].x + boxLeft, positions[_j].y + boxTop);
                }

                //Iterate legends & pages
                for (var k = 0; k < lenK; k += 1) {
                    nX = lenJ + k;
                    if (positions[nX].x === 0 && positions[nX].y === 0) {
                        canvasPage = document.createElement("canvas");
                        canvasPage.width = width;canvasPage.height = height;
                        ctxPage = canvasPage.getContext("2d");
                        bayImages.push(canvasPage);
                    }

                    ctxPage.drawImage(legends[k], Math.round(positions[nX].x + boxLeft), Math.round(positions[nX].y + boxTop));
                }

                divProgress.innerHTML = i18labels.PRINTOPTS_SENDINGPAGES;
                sendPagesToServer();
            }, 1000);

            window.pagess = bayImages;
        }
    }, {
        key: 'setTitle',
        value: function setTitle(vessel, departure, voyage) {
            var title = (vessel ? vessel : "") + (departure ? " / " + departure : "") + (voyage ? " / " + voyage : "");

            if (title) {
                this.title = title;
            }
        }
    }, {
        key: 'setMetaData',
        value: function setMetaData(vesselName, vesselCallSign, sender, recipient, placeOfDeparture, voyageNumber, footerLeft, footerRight) {
            this.metaData = {
                vesselName: vesselName,
                vesselCallSign: vesselCallSign,
                sender: sender,
                recipient: recipient,
                placeOfDeparture: placeOfDeparture,
                voyageNumber: voyageNumber,
                footerLeft: footerLeft,
                footerRight: footerRight
            };
        }
    }]);

    return VesselsApp2D;
})();

exports.VesselsApp2D = VesselsApp2D;

},{"../utils/dom-utilities.js":12,"../utils/js-helpers.js":13,"../utils/preloader.js":14,"./data-loader.js":3,"./i18labels.js":4,"./models-factory.js":5}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');
var Preloader = require('../utils/preloader.js');
var Renderer = require('./renderer.js');
var DataLoader = require('./data-loader.js');
var ModelsFactory = require('./models-factory.js');
var i18labels = require('./i18labels.js');

//Class VesselsApp3D

var VesselsApp3D = (function () {
    function VesselsApp3D(node, titleNode, infoNode, bayNode, opts) {
        _classCallCheck(this, VesselsApp3D);

        var me = this,
            queryParams = __s__.getQueryParams();

        var version = 1.1;

        this.options = __s__.extend({
            extraSep: 0.5,
            loaderColor: "#f2f2f2",
            loaderColorSucess: "#79e3da",
            colors: { background: 0xd2eef8, sunlight: 0xe2e2ee },
            dampingFactorOut: 0.2, dampingFactorIn: 0.75,
            initialCameraPosition: { x: 0, y: 0, z: 100 },
            labelScale: 8,
            screenshots: { width: 600, height: 600, format: "png", transparent: true }
        }, opts);

        this.width = 0;
        this.height = 0;

        this._titleNode = titleNode;
        this._bayNode = bayNode;
        this._infoNode = infoNode;
        this._node = (function createDomElements() {
            var divMainC = undefined,
                divRenderC = undefined,
                divLloadingC = undefined,
                divLoadingText = undefined,
                baseId = "app3d-container-" + Math.round(Math.random() * 100000);

            //Main DOM element
            divMainC = document.createElement("div");
            divMainC.className = "app3d-container";
            divMainC.id = baseId;

            //Renderer container
            divRenderC = document.createElement("div");
            divRenderC.className = "app3d-render-container";
            divRenderC.id = baseId + "-render";
            divMainC.appendChild(divRenderC);
            divMainC.divRenderC = divRenderC;

            //Loading div
            divLloadingC = document.getElementById("app-3d-loading-div");
            if (!divLloadingC) {
                divLloadingC = document.createElement("div");
                divLloadingC.className = "app3d-loading-div";
                divLloadingC.id = baseId + "-loading-div";
                divMainC.appendChild(divLloadingC);
            }

            //Loading text inside loading div
            divLoadingText = document.getElementById("app-3d-loading-div-text");
            if (!divLoadingText) {
                divLoadingText = document.createElement("div");
                divLoadingText.className = "app3d-loading-div-text";
                divLoadingText.id = baseId + "-loading-text";
                divLloadingC.appendChild(divLoadingText);
            }

            //initialize loader functions
            divMainC.loadingDiv = new Preloader(divLloadingC, divLoadingText, 100, me.options, "img-loader-logo");

            //Append to DOM element
            node.appendChild(divMainC);

            return divMainC;
        })();

        this.initialBay = queryParams.bay;

        this.data = null;
        this.dataLoader = new DataLoader.DataLoader(this._node.loadingDiv);

        this.renderer3d = null;
        this.modelsFactory = null;
        this._init();
    }

    //constructor

    _createClass(VesselsApp3D, [{
        key: 'loadUrl',
        value: function loadUrl(jsonUrl, loadingMessage, progressCallback) {
            return this.dataLoader.loadUrl(jsonUrl, loadingMessage, progressCallback);
        }
    }, {
        key: 'loadData',
        value: function loadData(jsonObj) {
            return this.dataLoader.generateStructuredData(jsonObj);
        }
    }, {
        key: '_init',
        value: function _init() {
            var me = this,
                j = undefined,
                lenJ = undefined,
                mod = undefined,
                node = this._node,
                hasWebGL = Detector.canvas && Detector.webgl;

            //Check WebGL
            if (!hasWebGL) {
                node.loadingDiv.show();
                node.loadingDiv.setMessage(node.parentNode.getAttribute(!window.WebGLRenderingContext ? "data-gpu" : "data-webgl"));
                return;
            }

            //Initialize renderer
            this.updateSize();
            this.renderer3d = new Renderer.Renderer3D(this, this.width, this.height);
            this.renderer3d.init();

            this.renderer3d.animate();

            //Initialize models factory
            this.modelsFactory = new ModelsFactory.ModelsFactory(this);

            __d__.addEventLnr(window, "resize", function () {
                me.updateSize();
            });
        }
    }, {
        key: 'updateHtmlTitle',
        value: function updateHtmlTitle(vessel, departure, voyage) {
            var me = this,
                title = undefined;

            if (!me._titleNode) {
                return;
            }

            title = (vessel ? vessel : "") + (departure ? " / " + departure : "") + (voyage ? " / " + voyage : "");

            if (title) {
                me._titleNode.innerHTML = title;
                document.title = title + " / " + document.title;
            } else {
                me._titleNode.style.display = "none";
            }
        }
    }, {
        key: 'getDimensions',
        value: function getDimensions() {
            return { width: this.width, height: this.height };
        }
    }, {
        key: '_setDimensions',
        value: function _setDimensions(w, h) {
            this.width = w;
            this.height = h;
        }
    }, {
        key: 'updateSize',
        value: function updateSize() {
            var divMainC = undefined,
                par = undefined,
                ev = undefined,
                dim = undefined,
                w = undefined,
                h = undefined;

            divMainC = this._node;
            par = divMainC.parentNode;

            if (par === null || par === undefined) {
                return;
            }

            dim = this.getDimensions();
            w = par.offsetWidth;
            h = par.offsetHeight;

            if (dim.width !== w || dim.height !== h) {
                divMainC.style.width = w + "px";
                divMainC.style.height = h + "px";
                if (this.renderer3d) {
                    this.renderer3d.resize3DViewer(w, h);
                }
                this._setDimensions(w, h);

                ev = __d__.addEventDsptchr("resize");
                this._node.dispatchEvent(ev);
            }
        }
    }, {
        key: 'pauseRendering',
        value: function pauseRendering() {
            if (this.renderer3d) {
                this.renderer3d._isRendering = false;
            }
        }
    }, {
        key: 'resumeRendering',
        value: function resumeRendering() {
            if (this.renderer3d) {
                this.renderer3d._isRendering = true;
            }
        }
    }, {
        key: 'toggleRendering',
        value: function toggleRendering() {
            var doRender = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            if (!this.renderer3d) {
                return;
            }
            this.renderer3d._isRendering = !!doRender;
        }

        //Generate screenshots
        //Returns an image/data format
    }, {
        key: 'generateScreenshot',
        value: function generateScreenshot() {
            var width = arguments.length <= 0 || arguments[0] === undefined ? this.options.screenshots.width : arguments[0];
            var height = arguments.length <= 1 || arguments[1] === undefined ? this.options.screenshots.height : arguments[1];
            var format = arguments.length <= 2 || arguments[2] === undefined ? this.options.screenshots.format : arguments[2];
            var transparent = arguments.length <= 3 || arguments[3] === undefined ? this.options.screenshots.transparent : arguments[3];

            //...TBD

            return data;
        }
    }]);

    return VesselsApp3D;
})();

exports.VesselsApp3D = VesselsApp3D;

},{"../utils/dom-utilities.js":12,"../utils/js-helpers.js":13,"../utils/preloader.js":14,"./data-loader.js":3,"./i18labels.js":4,"./models-factory.js":5,"./renderer.js":6}],9:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var fontHeightCache = {};

var CanvasText = (function () {
  function CanvasText() {
    _classCallCheck(this, CanvasText);

    this.textWidth = null;
    this.textHeight = null;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 128;
    this.canvas.height = 128;
    this.ctx = this.canvas.getContext('2d');
  }

  _createClass(CanvasText, [{
    key: 'drawText',
    value: function drawText(text, ctxOptions) {

      this.ctx.font = ctxOptions.font;
      this.textWidth = Math.ceil(this.ctx.measureText(text).width);
      this.textHeight = getFontHeight(this.ctx.font);

      //this.canvas.width = THREE.Math.nextPowerOfTwo(this.textWidth)
      //this.canvas.height = THREE.Math.nextPowerOfTwo(this.textHeight)
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = ctxOptions.fillStyle;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      //this.ctx.

      this.ctx.font = ctxOptions.font;
      this.ctx.fillStyle = "#000";
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

      return this.canvas;
    }
  }, {
    key: 'width',
    get: function get() {
      return this.canvas.width;
    }
  }, {
    key: 'height',
    get: function get() {
      return this.canvas.height;
    }
  }]);

  return CanvasText;
})();

function getFontHeight(fontStyle) {
  var result = fontHeightCache[fontStyle];

  if (!result) {
    var body = document.getElementsByTagName('body')[0];
    var dummy = document.createElement('div');

    var dummyText = document.createTextNode('span');
    dummy.appendChild(dummyText);
    dummy.setAttribute('style', 'font:' + fontStyle + ';position:absolute;top:0;left:0');
    body.appendChild(dummy);
    result = dummy.offsetHeight;

    fontHeightCache[fontStyle] = result;
    body.removeChild(dummy);
  }

  return result;
}

module.exports = CanvasText;

},{}],10:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var textAlign = require('./textAlign.js'),
    CanvasText = require('./CanvasText.js');

var SpriteText2D = (function (_THREE$Object3D) {
  _inherits(SpriteText2D, _THREE$Object3D);

  function SpriteText2D() {
    var text = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, SpriteText2D);

    _get(Object.getPrototypeOf(SpriteText2D.prototype), 'constructor', this).call(this);

    this._font = options.font || '30px Arial';
    this._fillStyle = options.fillStyle || '#FFFFFF';

    this.canvas = new CanvasText();

    this.align = options.align || textAlign.center;

    // this._textAlign = options.align || "center"
    // this.anchor = Label.fontAlignAnchor[ this._textAlign ]
    this.antialias = typeof (options.antialias === "undefined") ? true : options.antialias;
    this.text = text;
  }

  _createClass(SpriteText2D, [{
    key: 'updateText',
    value: function updateText() {
      this.canvas.drawText(this._text, {
        font: this._font,
        fillStyle: this._fillStyle
      });

      // cleanup previous texture
      this.cleanUp();

      this.texture = new THREE.Texture(this.canvas.canvas);
      this.texture.needsUpdate = true;
      this.applyAntiAlias();

      if (!this.material) {
        this.material = new THREE.SpriteMaterial({ map: this.texture });
      } else {
        this.material.map = this.texture;
      }

      if (!this.sprite) {
        this.sprite = new THREE.Sprite(this.material);
        this.geometry = this.sprite.geometry;
        this.add(this.sprite);
      }

      //this.sprite.scale.set(this.canvas.width, this.canvas.height, 1)

      //this.sprite.position.x = ((this.canvas.width/2) - (this.canvas.textWidth/2)) + ((this.canvas.textWidth/2) * this.align.x)
      //this.sprite.position.y = (- this.canvas.height/2) + ((this.canvas.textHeight/2) * this.align.y)
    }
  }, {
    key: 'cleanUp',
    value: function cleanUp() {
      if (this.texture) {
        this.texture.dispose();
      }
    }
  }, {
    key: 'applyAntiAlias',
    value: function applyAntiAlias() {
      if (this.antialias === false) {
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.LinearMipMapLinearFilter;
      }
    }
  }, {
    key: 'width',
    get: function get() {
      return this.canvas.textWidth;
    }
  }, {
    key: 'height',
    get: function get() {
      return this.canvas.textHeight;
    }
  }, {
    key: 'text',
    get: function get() {
      return this._text;
    },
    set: function set(value) {
      if (this._text !== value) {
        this._text = value;
        this.updateText();
      }
    }
  }, {
    key: 'font',
    get: function get() {
      return this._font;
    },
    set: function set(value) {
      if (this._font !== value) {
        this._font = value;
        this.updateText();
      }
    }
  }, {
    key: 'fillStyle',
    get: function get() {
      return this._fillStyle;
    },
    set: function set(value) {
      if (this._fillStyle !== value) {
        this._fillStyle = value;
        this.updateText();
      }
    }
  }]);

  return SpriteText2D;
})(THREE.Object3D);

module.exports = SpriteText2D;

},{"./CanvasText.js":9,"./textAlign.js":11}],11:[function(require,module,exports){
"use strict";

module.exports = {
  center: new THREE.Vector2(0, 0),
  left: new THREE.Vector2(1, 0),
  topLeft: new THREE.Vector2(1, -1),
  topRight: new THREE.Vector2(-1, -1),
  right: new THREE.Vector2(-1, 0),
  bottomLeft: new THREE.Vector2(1, 1),
  bottomRight: new THREE.Vector2(-1, 1)
};

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _default = (function () {
    function _default(node, textNode, radius, opts, imgName, initialMessage) {
        if (node === undefined) node = mandatory();

        _classCallCheck(this, _default);

        var canv = undefined;

        if (node === null || node === undefined) {
            return;
        }

        this.node = node;
        canv = document.createElement("canvas");

        this.messages = textNode;
        this.canv = canv;
        this.ctx = canv.getContext("2d");
        this.loadCurrent = 0;
        this.radius = radius;

        this.canv.width = Math.round(radius * 2);
        this.canv.height = Math.round(radius * 2);
        this.setPixelRatio();

        this.opts = opts;
        this.node.appendChild(canv);

        this.image = imgName ? document.getElementById(imgName) : null;
        if (initialMessage) {
            this.setMessage(initialMessage);
        }
    }

    _createClass(_default, [{
        key: "rectLoader",
        value: function rectLoader() {
            var per = this.loadCurrent,
                ctx = this.ctx,
                cen = this.radius,
                cenDouble = cen * 2,
                cenHalf = Math.round(cen / 2),
                angle = per * 2 * Math.PI,
                options = this.opts;

            ctx.clearRect(0, 0, cenDouble, cenDouble);

            ctx.beginPath();
            ctx.arc(cen, cen, cenHalf, 0, 2 * Math.PI, false);
            ctx.fillStyle = options.loaderColor;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = options.loaderColor;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cen, cen, Math.round(cenHalf / 2), 0, angle, false);
            ctx.lineWidth = cenHalf;
            ctx.strokeStyle = options.loaderColorSucess;
            ctx.stroke();

            if (this.image) {
                ctx.drawImage(this.image, cenHalf, cenHalf, cen, cen);
            }
        }
    }, {
        key: "setPixelRatio",
        value: function setPixelRatio() {

            var oldWidth = undefined,
                oldHeight = undefined,
                ctx = this.ctx,
                devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1,
                ratio = devicePixelRatio / backingStoreRatio;

            if (devicePixelRatio !== backingStoreRatio) {

                oldWidth = this.canv.width;
                oldHeight = this.canv.height;

                this.canv.width = oldWidth * ratio;
                this.canv.height = oldHeight * ratio;

                this.canv.style.width = oldWidth + "px";
                this.canv.style.height = oldHeight + "px";

                this.ctx.scale(ratio, ratio);
            }
        }
    }, {
        key: "setMessage",
        value: function setMessage(message) {
            var isError = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            if (this.messages) {
                this.messages.innerHTML = message;
                this.messages.style.color = isError ? "red" : "";
            }
        }
    }, {
        key: "updateLoader",
        value: function updateLoader(per, speed) {
            var me = this;
            if (!me.node) {
                return;
            }
            TweenLite.to(me, speed, {
                loadCurrent: per,
                ease: Power1.easeInOut,
                onUpdate: me.rectLoader,
                onUpdateScope: me
            });
        }
    }, {
        key: "startAnimation",
        value: function startAnimation() {
            if (!this.node) {
                return;
            }
            this.rectLoader();
            this.updateLoader(0.4, 2);
        }
    }, {
        key: "stopAnimation",
        value: function stopAnimation() {
            if (!this.node) {
                return;
            }
            this.updateLoader(1, 0.25);
        }
    }, {
        key: "setPercentage",
        value: function setPercentage(per) {
            if (!this.node) {
                return;
            }
            this.loadCurrent = per;
            this.rectLoader();
        }
    }, {
        key: "show",
        value: function show() {
            if (!this.node) {
                return;
            }
            this.node.style.display = "block";
        }
    }, {
        key: "hide",
        value: function hide() {
            if (!this.node) {
                return;
            }
            this.node.style.display = "none";
        }
    }], [{
        key: "mandatory",
        value: function mandatory() {
            throw new Error('Missing parameter');
        }
    }]);

    return _default;
})();

exports["default"] = _default;
module.exports = exports["default"];

},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RColor = (function () {
    function RColor() {
        _classCallCheck(this, RColor);

        this.hue = Math.random(), this.goldenRatio = 0.618033988749895;
        this.hexwidth = 2;
    }

    _createClass(RColor, [{
        key: "hsvToRgb",
        value: function hsvToRgb(h, s, v) {
            var h_i = Math.floor(h * 6),
                f = h * 6 - h_i,
                p = v * (1 - s),
                q = v * (1 - f * s),
                t = v * (1 - (1 - f) * s),
                r = 255,
                g = 255,
                b = 255;
            switch (h_i) {
                case 0:
                    r = v, g = t, b = p;break;
                case 1:
                    r = q, g = v, b = p;break;
                case 2:
                    r = p, g = v, b = t;break;
                case 3:
                    r = p, g = q, b = v;break;
                case 4:
                    r = t, g = p, b = v;break;
                case 5:
                    r = v, g = p, b = q;break;
            }
            return [Math.floor(r * 256), Math.floor(g * 256), Math.floor(b * 256)];
        }
    }, {
        key: "padHex",
        value: function padHex(str) {
            if (str.length > this.hexwidth) return str;
            return new Array(this.hexwidth - str.length + 1).join('0') + str;
        }
    }, {
        key: "get",
        value: function get(hex, saturation, value) {
            this.hue += this.goldenRatio;
            this.hue %= 1;
            if (typeof saturation !== "number") {
                saturation = 0.5;
            }
            if (typeof value !== "number") {
                value = 0.95;
            }
            var rgb = this.hsvToRgb(this.hue, saturation, value);
            if (hex) {
                return "#" + this.padHex(rgb[0].toString(16)) + this.padHex(rgb[1].toString(16)) + this.padHex(rgb[2].toString(16));
            } else {
                return rgb;
            }
        }
    }]);

    return RColor;
})();

exports.RColor = RColor;

},{}]},{},[1]);

function trim (str) 
{
  return str.replace(/^\s+|\s+$/gm,'');
}

function rgba2rgb(rgba)
{
    var bg = {red: 23, green: 75, blue: 114};
    var alpha = 1 - rgba.alpha;
    var rgb = {red : 0, green : 0, blue : 0};

    rgb.red = Math.round((rgba.alpha * (rgba.red / 255) + (alpha * (bg.red / 255))) * 255);
    rgb.green = Math.round((rgba.alpha * (rgba.green / 255) + (alpha * (bg.green / 255))) * 255);
    rgb.blue = Math.round((rgba.alpha * (rgba.blue / 255) + (alpha * (bg.blue / 255))) * 255);

    return rgb;
}


function rgbaToHex (rgba) 
{
    var parts = rgba.substring(rgba.indexOf("(")).split(","),
        r = parseInt(trim(parts[0].substring(1)), 10),
        g = parseInt(trim(parts[1]), 10),
        b = parseInt(trim(parts[2]), 10),
        a = parseFloat(trim(parts[3].substring(0, parts[3].length - 1))).toFixed(2);

    return ('#' + r.toString(16) + g.toString(16) + b.toString(16) + (a * 255).toString(16).substring(0,2));
}

function hexToRgb(hex) 
{
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}