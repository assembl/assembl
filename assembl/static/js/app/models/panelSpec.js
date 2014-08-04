define(function(require){
    'use strict';

    var Base = require('models/base');

    var PanelSpecModel = Base.Model.extend({
        defaults: {
           type: ''
        }
    });

    var PanelSpecs = Base.Collection.extend({
        // initialize: function(options){
        //     this.models = this.parse(this.models);
        // },
        parse: function(model) {
            return _.map(model.group, function(grp) {
                return new PanelSpecModel(grp);
            });
        },

        model: PanelSpecModel
    });

    var GroupSpecs = Base.Collection.extend({
        model: PanelSpecs
    });

    return {
        Model: PanelSpecModel,
        Collection: PanelSpecs,
        CollectionOfCollection: GroupSpecs
    };

});
