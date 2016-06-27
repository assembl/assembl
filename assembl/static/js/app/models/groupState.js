'use strict';
/**
 * 
 * @module app.models.groupState
 */

var Base = require('./base.js'),
    Idea = require('./idea.js');

/**
 * @class app.models.groupState.GroupStateModel
 *
 * Represents the state of a panel group (current idea, selected 
 * navigation, minimised states, etc.)
 */
var GroupStateModel = Base.Model.extend({
  constructor: function GroupStateModel() {
    Base.Model.apply(this, arguments);
  },

  defaults: {
    currentIdea: null
  },

  toJSON:  function(options) {
    var json = Base.Model.prototype.toJSON.apply(this, arguments);
    if (json.currentIdea !== null && json.currentIdea instanceof Idea.Model) {
      json.currentIdea = json.currentIdea.get("@id");
    }

    return json;
  },

  /** This returns undefined if the model is valid */
  validate: function(attributes, options) {
    //console.log("groupState::validate called with", attributes, options);
    if (attributes['currentIdea'] === null) {
      return; //Ok
    }
    else if (attributes['currentIdea'] === undefined) {
      return "currentIdea can be null, but not undefined";
    }
    else if (!(attributes.currentIdea instanceof Idea.Model)) {
      return "currentIdea isn't an instance of Idea";
    }
  }
});

var GroupStates = Base.Collection.extend({
  constructor: function GroupStates() {
    Base.Collection.apply(this, arguments);
  },

  model: GroupStateModel,

  validate: function() {
    var invalid = [];
    this.each(function(groupState) {
      if (!groupState.validate()) {
        invalid.push(groupState);
      }
    });
    if (invalid.length) {
      console.warn("GroupState.Collection: removing " + invalid.length + " invalid groupStates from " + this.length + " groupStates.");
      this.remove(invalid);
      console.warn("GroupState.Collection: after removal, number of remaining valid groupStates: " + this.length);
    }

    return (this.length > 0);
  }
});

module.exports = {
  Model: GroupStateModel,
  Collection: GroupStates
};
