var ves2d = require('../core/vessels-2d.js'),
    __s__ = require('../utils/js-helpers.js'),
    __d__ = require('../utils/dom-utilities.js'),
    colorWidget = require('../colors/colors-widget.js'),
    i18labels = require('../core/i18labels.js');

var app2d, data,
    queryParams = __s__.getQueryParams(),
    btnLaunch = document.getElementById("btnLaunch");
    
window.appVessels2D = ves2d.VesselsApp2D;

/* Main program 2D ------------------------------------------------  */

//Example
app2d = new ves2d.VesselsApp2D(btnLaunch);
app2d.loadUrl(queryParams.json, i18labels.LOADING_DATA)
    .then(
        function(loadedData) {
            let modelsFactory = app2d.modelsFactory,
                clrs,
                maxDepth, maxDepthHalf;
            
            //--Start: This is needed for stand-alone functioning
            //Process data
            app2d.data = app2d.loadData(loadedData);

            //Pass 1. Map to  models
            for(let j = 0, lenJ = app2d.data.data.info.contsL; j < lenJ; j += 1) {
                modelsFactory.addIsoModel(app2d.data.data.conts[j]);
            }

            //Pass 2. Add colors (random)
            modelsFactory.extendSpecs(app2d.data.filters);

            //Pass 3. Get colors from settings
            clrs = new colorWidget.ColorsWidget(null, app2d.data.filters, null);
            if (window.userSettings) { clrs.mergeColorSettings(window.userSettings); }
            
            //--End: This is needed for stand-alone functioning

            //app2d
            app2d.applyColorsFilter(app2d.data.filters);         
            app2d.setTitle(loadedData.VesselName, loadedData.PlaceOfDeparture, loadedData.VoyageNumber);
            app2d.setMetaData(loadedData.VesselName, loadedData.VesselCallSign, loadedData.Sender, loadedData.Recipient, loadedData.PlaceOfDeparture, loadedData.VoyageNumber, loadedData.FooterLeft, loadedData.FooterRight)
            app2d.postUrl = window.generatePdfRoute;


        }, function(msg) {
            console.error(msg);
        });



window.example2d = app2d;
