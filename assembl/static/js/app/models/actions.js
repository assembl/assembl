'use strict';

/**
 * An action done by a user.
 * @module app.models.actions
 */

var Base = require('./base.js'),
    Ctx = require('../common/context.js');

/**
 * Action model
 * Frontend model for :py:class:`assembl.models.action.Action`
 * @class app.models.actions.actionModel
 * @extends app.models.base.BaseModel
 */
 
var actionModel = Base.Model.extend({
  urlRoot: Ctx.getApiV2DiscussionUrl("/all_users/current/actions"),

  defaults: {
    target: null,
    user: null,
    target_type: "Content",
    '@id': null,
    '@type': null,
    '@view': null
  },

  constructor: function actionModel() {
    Base.Model.apply(this, arguments);
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  }

});

/**
 * Actions collection
 * @class app.models.actions.actionCollection
 * @extends app.models.base.BaseCollection
 */
 
var actionCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl("/all_users/current/actions"),
  model: actionModel,
  constructor: function actionCollection() {
    Base.Collection.apply(this, arguments);
  },
});

module.exports = {
  Model: actionModel,
  Collection: actionCollection
};
