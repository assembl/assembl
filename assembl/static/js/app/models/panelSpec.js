define(function(require){
    'use strict';

    var Base = require('models/base');

    var PanelSpecModel = Base.Model.extend({
        defaults: {
            type: '',
            hidden: false,
            gridWidth: 1
        }
    });

    var PanelSpecs = Base.Collection.extend({
        model: PanelSpecModel
    });

    return {
        Model: PanelSpecModel,
        Collection: PanelSpecs
    };
});
