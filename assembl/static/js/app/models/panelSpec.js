define(function(require){
    'use strict';

    var Base = require('models/base');
    /**
     * @class IdeaModel
     */
    var PanelSpecModel = Base.Model.extend({

        /**
         * @init
         */
        initialize: function(obj){
            obj = obj || {};
            var that = this;
        },

        /**
         * Defaults
         */
        defaults: {
            type: '',
        },
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

        /**
         * The model
         * @type {PanelSpecModel}
         */
        model: PanelSpecModel,
    });

    var GroupSpecs = Base.Collection.extend({
        /**
         * The model
         * @type {GroupItemSpec}
         */
        model: PanelSpecs,
    });

    return {
        Model: PanelSpecModel,
        Collection: PanelSpecs,
        CollectionOfCollection: GroupSpecs
    };

});
