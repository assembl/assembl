'use strict';
/**
 * The link between two ideas
 * @module app.models.ideaLink
 */
var _ = require('underscore'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js');
/**
 * Idea link model
 * Frontend model for :py:class:`assembl.models.idea.IdeaLink`
 * @class app.models.ideaLink.IdeaLinkModel
 * @extends app.models.base.BaseModel
 */
var IdeaLinkModel = Base.Model.extend({
  /**
   * @function app.models.ideaLink.IdeaLinkModel.initialize
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
    source: '',
    target: '',
    original_uri: null,
    is_tombstone: false,
    subtype: "idea:InclusionRelation",
    order: 1
  },
  /**
   * Validate the model attributes
   * @function app.models.ideaLink.IdeaLinkModel.validate
   */
  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
  }
});
/**
 * Idea link collection
 * @class app.models.ideaLink.IdeaLinkCollection
 * @extends app.models.base.BaseCollection
 */
var IdeaLinkCollection = Base.Collection.extend({
  /**
   * The model
   * @type {IdeaLinkModel}
   */
  model: IdeaLinkModel,
  /**
   * @member {string} app.models.ideaLink.IdeaLinkCollection.url
   */
  url: Ctx.getApiV2DiscussionUrl("idea_links"),
});

module.exports = {
  Model: IdeaLinkModel,
  Collection: IdeaLinkCollection
};

