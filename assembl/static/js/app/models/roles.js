'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    Roles = require('../utils/roles.js');

var roleModel = Base.Model.extend({
  urlRoot: Ctx.getApiV2DiscussionUrl("/all_users/current/local_roles"),

  defaults: {
    'requested': false,
    'discussion': null,
    'role': null,
    'user': null,
    '@id': null,
    '@type': null,
    '@view': null
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  }

});

var roleCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl("/all_users/current/local_roles"),
  model: roleModel,
  

  isUserSubscribedToDiscussion: function() {
    var role =  this.find(function(local_role) {
      return local_role.get('role') === Roles.PARTICIPANT;
    });
    return role !== undefined;
  },

  UnsubscribeUserFromDiscussion: function() {
  var that = this,
      role =  this.find(function(local_role) {
        return local_role.get('role') === Roles.PARTICIPANT;
      });

  role.destroy({
    success: function(model, resp) {
      that.remove(model);
    },
    error: function(model, resp) {
      console.error('ERROR: unSubscription failed', resp);
    }});
  }
});

module.exports = {
  Model: roleModel,
  Collection: roleCollection
};
