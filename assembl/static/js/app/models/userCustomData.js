'use strict';
/**
 * 
 * @module app.models.userCustomData
 */

var Backbone = require('backbone'),
    Ctx = require('../common/context.js');

// We do not use Base.Model.extend(), because we want to keep Backbone's default behaviour with model urls
/**
 * Custom key-value storage bound to a user and a namespace
 * Frontend model for :py:class:`assembl.models.user_key_values.DiscussionPerUserNamespacedKeyValue`
 * @class app.models.userCustomData.UserCustomDataModel
 * @extends Backbone.Model
 */
var UserCustomDataModel = Backbone.Model.extend({
  constructor: function UserCustomDataModel() {
    Backbone.Model.apply(this, arguments);
  },

  urlRoot: Ctx.getApiV2DiscussionUrl('user_ns_kv')
});

module.exports = {
  Model: UserCustomDataModel
};
