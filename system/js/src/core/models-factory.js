var RColor = require('../utils/random-color.js');

export class ModelsFactory {

    constructor (appScene) {
        this.models = {};
        this.isoModels = {};
        this.appScene = appScene;
    }

    addIsoModel (obj) {
        var me = this,
            isoModels = me.isoModels;
        
        if (!isoModels[obj.i]) {
            isoModels[obj.i] = {
                d: obj.depth,
                h: obj.h,
                t: obj.t
            }
        }
    }

    extendSpecs (filters) {
        var j, lenJ, key, val, 
            attr, spec,
            me = this,
            rcolor = new RColor.RColor(), color, hexColor;
            
        for(key in filters) {
            attr = filters[key];
            for(val in attr.obs) {

                spec = attr.obs[val];

                color = rcolor.get(true);
                hexColor = parseInt(color.replace(/^#/, ''), 16);
                                    
                spec.color = color;
                spec.hexColor = hexColor;
                spec.colorIsRandom = true;
            } 
        }
    }

    createBaseMaterials(filters) {
        var j, lenJ, key, val, attr, spec,
            me = this, material, materialPos,
            hexColor,
            renderer3d = this.appScene.renderer3d;
            
        for(key in filters) {
            attr = filters[key];
            for(val in attr.obs) {

                spec = attr.obs[val];

                hexColor = spec.hexColor;
                materialPos = renderer3d.addContainerMaterial(hexColor);
                                    
                spec.materialPos = materialPos;
            } 
        }
    }


}