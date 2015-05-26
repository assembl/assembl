'use strict';

var Base = require('./base.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js');

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
        var viewsFactory = require('../objects/viewsFactory.js');
        if (viewsFactory === undefined) {
            throw new Error("You must define viewsFactory to run validation");
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

    /**
     @return an instance of PanelSpecType, or throws an exception
     */
    getPanelSpecType: function (psType) {
      return PanelSpecTypes.getByRawId(this.get('type'));
    },

    isOfType: function (psType) {
      return PanelSpecTypes.getByRawId(this.get('type')) == psType;
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

module.exports = {
    Model: PanelSpecModel,
    Collection: PanelSpecs
};
