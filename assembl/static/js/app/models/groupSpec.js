'use strict';

var Base = require('./base.js'),
    panelSpec = require('./panelSpec.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    groupState = require('./groupState.js');

/**
 * @class GroupSpecModel
 *
 * Represents an independent group of panels in the interface.  When added
 * the matching views (groupContainerView) will be instanciated
 */
var GroupSpecModel = Base.Model.extend({
  defaults: function () {
    return {
    "panels": new panelSpec.Collection(),
    "states": new groupState.Collection([new groupState.Model()])
    };
  },
  
  parse: function (model) {
    model.panels = new panelSpec.Collection(model.panels, {parse: true});
    if(model.states && model.states.length > 0) {
      model.states = new groupState.Collection(model.states, {parse: true});
    }
    else {
      model.states = this.defaults().states;
    }
    return model;
  },
  /**
   * @params list of panelSpecTypes
   */
  removePanels: function () {
    var args = Array.prototype.slice.call(arguments);
    var panels = this.get('panels');
    var panelsToRemove = _.filter(panels.models, function (el) {
      return _.contains(args, el.getPanelSpecType());
    });
    if (_.size(args) !== _.size(panelsToRemove)) {
      //console.log("WARNING: groupSpec.Model.removePanels(): " + _.size(args) + " arguments, but found only " + _.size(panelsToRemove) + " panels to remove.");
      //console.log(args, panels, panelsToRemove);
    }
    _.each(panelsToRemove, function (el) {
      panels.remove(el);
    });
  },

  /**
   * @aPanelSpec panelSpec of panel to remove
   */
  removePanelByModel: function (aPanelSpec) {
    this.get('panels').remove(aPanelSpec);
  },

  /**
   * Return the part of the groupSpec that contains the navigation panel
   * (if any)
   */
  findNavigationSidebarPanelSpec: function () {
    return this.get('panels').findWhere({type: PanelSpecTypes.NAV_SIDEBAR.id});
  },

  addPanel: function (options, position) {
    var aPanelSpec = new panelSpec.Model(options);
    if (!aPanelSpec.isValid()) {
      throw new Error("Can't add an invalid panelSpec, error was: " + aPanelSpec.validationError);
    }
    else {
      //console.log("added panelSpec ok:", aPanelSpec, aPanelSpec.isValid());
    }
    var panels = this.get('panels');
    if (position === undefined) {
      panels.add(aPanelSpec);
    } else {
      panels.add(aPanelSpec, {at: position});
    }
  },

  /* @param:  a panel spec type */
  getPanelSpecByType: function (panelSpecType) {
    //Ensure it's a real panelSpecType
    var validPanelSpecType = PanelSpecTypes.validate(panelSpecType);
    if (validPanelSpecType === undefined) {
      //console.error("getPanelSpecByType: the panelSpecType provided isn't valid panelSpecType:", panelSpecType);
      throw new Error("invalid panelSpecType");
    }
    return _.find(this.get('panels').models, function (el) {
      return el.getPanelSpecType() === validPanelSpecType;
    });
  },

  /**
   * Note that despite the name, this function does NOT check that if
   * the panel exists, it exists at the right position. It ONLY checks
   * that the panel exists - benoitg
   * @list_of_options PanelType or array of PanelType
   * @position int order of first panel listed in sequence of panels
   * find or create panels at a given position
   */
  ensurePanelsAt: function (list_of_options, position) {
    var that = this;
    //console.log("ensurePanelsAt() called with",list_of_options, position);
    if (!Array.isArray(list_of_options)) {
      list_of_options = [list_of_options];
    }
    if (_.any(list_of_options, function (el) {
      return !(PanelSpecTypes.validate(el))
    })) {
      //console.error("One of the panelSpecTypes in the following options isn't valid: ", list_of_options);
      throw new Error("One of the panelSpecTypes in the option isn't valid");
    }
    var that = this;
    _.each(list_of_options, function (option) {
      if (!that.getPanelSpecByType(option)) {
        that.addPanel({'type': option.id}, position++);
      }
    });
  },
  validate: function () {
    var navstate = this.get('navigationState');
    //Migrate old data
    if (navstate == 'home') {
      this.set('navigationState', 'about');
    }
    // check other values for validity?
    var panels = this.get('panels');
    return panels.validate();
  }
});

var GroupSpecs = Base.Collection.extend({
  model: GroupSpecModel,
  validate: function () {
    var invalid = [];
    this.each(function (groupSpec) {
      if (!groupSpec.validate()) {
        invalid.push(groupSpec);
      }
    });
    if (invalid.length) {
      console.log("GroupSpec.Collection: removing " + invalid.length + " invalid groupSpecs from " + this.length + " groupSpecs.");
      this.remove(invalid);
      console.log("GroupSpec.Collection: after removal, number of remaining valid groupSpecs: ", (this.length));
    }
    return (this.length > 0);
  }
});

module.exports = {
  Model: GroupSpecModel,
  Collection: GroupSpecs
};


