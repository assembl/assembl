'use strict';
/**
 * Description of the columns of classified messages under an idea
 * @module app.models.ideaMessageColumn
 */
var _ = require('underscore'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js');

/**
 * A category of classified messages under an idea
 * Frontend model for :py:class:`assembl.models.idea_msg_column.IdeaMessageColumn`
 * @class app.models.ideaMessageColumn.IdeaMessageColumnModel
 * @extends app.models.base.BaseModel
 */
var IdeaMessageColumnModel = Base.Model.extend({
  /**
   * @function app.models.ideaMessageColumn.IdeaMessageColumnModel.initialize
   */
  initialize: function(obj) {
    obj = obj || {};
    var that = this;
  },
  /**
   * Defaults
   * @type {Object}
   */
  defaults: {
    'idea': null,
    'message_classifier': '',
    'column_name': null,
    'header': '',
    'previous_column': null,
  },
  /**
   * Validate the model attributes
   * @function app.models.ideaMessageColumn.IdeaMessageColumnModel.validate
   */
  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
  },

  parse: function(rawModel) {
    if (rawModel.name !== undefined) {
      rawModel.name = new LangString.Model(rawModel.name, {parse: true});
    }
    return rawModel;
  },
});
/**
 * The collection of categories of classified messages under an idea
 * @class app.models.ideaMessageColumn.IdeaLinkCollection
 * @extends app.models.base.BaseCollection
 */
var IdeaMessageColumnCollection = Base.Collection.extend({
  /**
   * The model
   * @type {IdeaMessageColumnModel}
   */
  model: IdeaMessageColumnModel,
  /**
   * NOT YET FUNCTIONAL, but cannot be left empty.
   * @member {string} app.models.ideaMessageColumn.IdeaMessageColumnCollection.url
   */
  url: function() {
    return this.targetIdea.urlRoot() + '/' + this.targetIdea.getNumericId() + '/message_columns';
  },

  initialize: function(models, options) {
    if (!options.targetIdea) {
      throw new Error("targetIdea must be provided to calculate url");
    }
    this.targetIdea = options.targetIdea;
  },

});

module.exports = {
  Model: IdeaMessageColumnModel,
  Collection: IdeaMessageColumnCollection,
};

