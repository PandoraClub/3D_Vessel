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
                    mesh.visible = true;
            });
        }
    },

    baynumView : function baynumView(ev)
    {
        console.log("123123");
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

        // function hexToRgb(hex) 
        // {
        //     var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        //     return result ? {
        //         r: parseInt(result[1], 16),
        //         g: parseInt(result[2], 16),
        //         b: parseInt(result[3], 16)
        //     } : null;
        // }

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
                color = hexToRgb(fltr.color);

                if(arr[0] == "t")
                {
                    var rgb;

                    for(var i = 0; i < material.materials.length; i ++)
                    {
                        rgb = hexToRgb("#" + fltr.hexColor.toString(16));
                        rgb = rgba2rgb({red: rgb.r, green: rgb.g, blue: rgb.b, alpha : 0.65});

                        material.materials[i].color.setRGB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
                        // material.materials[i].color.setHex(fltr.hexColor);
                    }
                }
                else
                {
                    var texture  = app3d.renderer3d.drawTexture(material.mode, fltr.color);

                    for (var i = 0; i < material.materials.length; i ++)
                    {
                        material.materials[i].map = texture;
                    }
                }

                for(var i = 0; i < fltr.indexes.length; i ++)
                {
                    mesh = app3d.data.allContainerMeshesObj[fltr.indexes[i].cDash];
                    mesh.material = material;
                }
// console.log(fltr.indexes[i].cDash);
//                     mesh = app3d.data.allContainerMeshesObj[fltr.indexes[i].cDash];

//                     if(mesh.is_tank)
//                     {
//                         for(var j = 0; j < mesh.material.materials.length; j ++)
//                         {
//                             mesh.material.materials[j].color.setHex(fltr.hexColor);
//                         }
//                     }
//                     else
//                     {
//                         var texture  = app3d.renderer3d.drawTexture(mesh.material.mode, fltr.color);

//                         if(mesh.material && mesh.material.materials)
//                         {
//                             for (var j = 0; j < mesh.material.materials.length; j ++)
//                             {
//                                 mesh.material.materials[j].map = texture;
//                             }
//                         }
//                     }
//                 }

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