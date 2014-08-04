define(function(require){
    'use strict';

    var Base = require('models/base');

    var PanelSpecModel = Base.Model.extend({
        defaults: {
           type: ''
        }
    });

    var PanelSpecs = Base.Collection.extend({
        model: PanelSpecModel
    });

    var GroupSpec = Base.Model.extend({
        parse: function(model) {
            model.group = new PanelSpecs(model.group);
            return model;
        },

        defaults: {
           locked: false,
           group: []
        }
    });

    var GroupSpecs = Base.Collection.extend({
        model: GroupSpec
    });

    return {
        Model: PanelSpecModel,
        Collection: PanelSpecs,
        CollectionOfCollection: GroupSpecs
    };

});
