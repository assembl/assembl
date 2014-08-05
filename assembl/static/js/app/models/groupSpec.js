define(function(require){
    'use strict';

    var Base = require('models/base'),
    panelSpec = require('models/panelSpec');

    var GroupSpecModel = Base.Model.extend({
        parse: function(model) {
            model.panels = new panelSpec.Collection(model.panels);
            model.panels.groupSpec = this;
            return model;
        },

        defaults: {
           locked: false,
           panels: new panelSpec.Collection([
               {type:'navigation'},
               {type:'idea-panel'},
               {type:'message'}
           ])
        }
    });

    var GroupSpecs = Base.Collection.extend({
        model: GroupSpecModel
    });

    return {
        Model: GroupSpecModel,
        Collection: GroupSpecs
    };

});
