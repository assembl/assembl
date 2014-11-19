define(['models/base', 'utils/panelSpecTypes'], function (Base, PanelSpecTypes) {
    'use strict';

    /**
     * @class PanelSpecModel
     * 
     * Represents a panel in the interface.  When added to the collection,
     * the matching view (panelWrapper) will be instanciated
     */
    var PanelSpecModel = Base.Model.extend({
        defaults: {
            type: '',
            hidden: false,
            locked: false
        },
        
        /** This returns undefined if the model is valid */
        validate: function (attributes, options) {
          var viewsFactory = require('objects/viewsFactory');
          if (viewsFactory === undefined) {
            throw "You must define viewsFactory to run validation"
          }
          var view;
          try {
            view = viewsFactory(this);
            if (view === undefined) {
              return "The view is undefined";
            }
          }
          catch (err) {
            return "An exception was thrown trying to create the view for this panelSpec";
          }
          //Everything ok
        },

        isOfType: function(psType) {
          return PanelSpecTypes.getById(this.get('type')) == psType;
        }
    });

    var PanelSpecs = Base.Collection.extend({
        model: PanelSpecModel,
    
        validate: function (attributes, options) {
            var invalid = [];
            this.each(function (panelSpec) {
                if (!panelSpec.isValid()) {
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
