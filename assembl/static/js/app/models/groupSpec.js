define(function(require){
    'use strict';

    var Base = require('models/base'),
    panelSpec = require('models/panelSpec');

    var GroupSpecModel = Base.Model.extend({
        parse: function(model) {
            model.group = new panelSpec.Collection(model.group);
            model.group.groupSpec = this;
            return model;
        },

        defaults: {
           locked: false,
           group: []
        }
    });

    var GroupSpecs = Base.Collection.extend({
        model: GroupSpecModel
    });

    return {
        Model: GroupSpecModel,
        Collection: GroupSpecs,
    };

});
