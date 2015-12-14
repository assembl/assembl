'use strict';

var Backbone = require('../shims/backbone.js'),
    Ctx = require('../common/context.js');

// We do not use Base.Model.extend(), because we want to keep Backbone's default behaviour with model urls
var UserCustomDataModel = Backbone.Model.extend({
  urlRoot: Ctx.getApiV2DiscussionUrl('user_ns_kv')
});

module.exports = {
  Model: UserCustomDataModel
};
