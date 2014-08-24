define(function(require){
    'use strict';

    var Base = require('models/base');

    var PanelSpecModel = Base.Model.extend({
        defaults: {
            type: '',
            hidden: false,
            locked: false,
            gridWidth: 1
        },
        validate: function(viewsFactory) {
            return viewsFactory(this) !== undefined;
        }

    });

    var PanelSpecs = Base.Collection.extend({
        model: PanelSpecModel,
        validate: function(viewsFactory) {
            var invalid = [];
            this.each(function (panelSpec) {
                if (!panelSpec.validate(viewsFactory)) {
                    invalid.push(panelSpec);
                }
            });
            if (invalid.length) {
                this.remove(invalid);
            }
            return (this.length > 0);
        }
    });

    return {
        Model: PanelSpecModel,
        Collection: PanelSpecs
    };
});
