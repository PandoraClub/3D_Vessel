var __s__ = require('../utils/js-helpers.js');
var __d__ = require('../utils/dom-utilities.js');
var Preloader = require('../utils/preloader.js');
var Renderer = require('./renderer.js');
var DataLoader = require('./data-loader.js');
var ModelsFactory = require('./models-factory.js');
var i18labels = require('./i18labels.js');

//Class VesselsApp3D
export class VesselsApp3D {

    constructor (node, titleNode, infoNode, bayNode, opts) {

        let me = this,
            queryParams = __s__.getQueryParams();

        const version = 1.1;

        this.options = __s__.extend({
            extraSep: 0.5,
            loaderColor: "#f2f2f2",
            loaderColorSucess: "#79e3da",
            colors: { background: 0xd2eef8, sunlight: 0xe2e2ee },
            dampingFactorOut: 0.2, dampingFactorIn: 0.75,
            initialCameraPosition: { x: 0, y: 0, z: 100}, 
            labelScale: 8,
            screenshots : { width: 600, height: 600, format: "png", transparent: true }
        }, opts);


        this.width = 0;
        this.height = 0;

        this._titleNode = titleNode; 
        this._bayNode = bayNode; 
        this._infoNode = infoNode; 
        this._node = (function createDomElements() {
            let divMainC, divRenderC, divLloadingC, divLoadingText,
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
  
        }());  

        this.initialBay = queryParams.bay;

        this.data = null;
        this.dataLoader = new DataLoader.DataLoader(this._node.loadingDiv);

        this.renderer3d = null;
        this.modelsFactory = null;
        this._init();

        
    }//constructor

    loadUrl (jsonUrl, loadingMessage, progressCallback) {
        return this.dataLoader.loadUrl(jsonUrl, loadingMessage, progressCallback);
    }

    loadData (jsonObj) {
        return this.dataLoader.generateStructuredData(jsonObj);
    }

    _init () {
        let me = this, j, lenJ, mod,
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


        __d__.addEventLnr(window, "resize", function() { 
            me.updateSize(); 
        } );

    }

    updateHtmlTitle (vessel, departure, voyage) {
        let me = this, title;

        if (!me._titleNode) { return; }
            
        title = (vessel ? vessel : "") + (departure ? " / " + departure : "") + (voyage ? " / " + voyage : "");

        if (title) {
            me._titleNode.innerHTML = title;
            document.title = title + " / " + document.title;
        } else {
            me._titleNode.style.display = "none";
        }
    }

    getDimensions() {
        return { width: this.width, height: this.height };  
    }

    _setDimensions(w, h) {
        this.width = w;
        this.height = h;
    }

    updateSize() {
        let  divMainC, par, ev,
            dim, w, h;

        divMainC = this._node;
        par = divMainC.parentNode;

        if (par === null || par === undefined) { return; }
        
        dim = this.getDimensions();
        w = par.offsetWidth;
        h = par.offsetHeight;
        
        if (dim.width !== w || dim.height !== h) {
            divMainC.style.width = w + "px";
            divMainC.style.height = h + "px";
            if (this.renderer3d) { this.renderer3d.resize3DViewer(w, h); }
            this._setDimensions(w, h);

            ev = __d__.addEventDsptchr("resize");
            this._node.dispatchEvent(ev);                
        }      
    }

    pauseRendering() {
        if (this.renderer3d) { this.renderer3d._isRendering = false; }
    }

    resumeRendering() {
        if (this.renderer3d) { this.renderer3d._isRendering = true; }
    }

    toggleRendering(doRender = true) {
        if (!this.renderer3d) { return; }
        this.renderer3d._isRendering = !!doRender;
    }

    

    //Generate screenshots
    //Returns an image/data format
    generateScreenshot(
        width = this.options.screenshots.width,
        height = this.options.screenshots.height,
        format = this.options.screenshots.format,
        transparent = this.options.screenshots.transparent) {

        //...TBD

        return data;
    }
      
}