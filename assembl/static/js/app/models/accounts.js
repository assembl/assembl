'use strict';
/**
 * 
 * @module app.models.accounts
 */

var Base = require('./base.js'),
    Ctx = require('../common/context.js');

/**
 * A user's (email or social) account.
 * Frontend model for :py:class:`assembl.models.auth.AbstractAgentAccount`
 * @class app.models.accounts.Account
 * @extends app.models.Base.Model
 */
var Account = Base.Model.extend({
  urlRoot: Ctx.getApiV2DiscussionUrl("/all_users/current/accounts"),
  defaults: {
      //E-mail account specifics
      will_merge_if_validated: false,
      verified: false,
      profile: 0,
      preferred: false,

      //SocialAuthAccount specifics
      provider: null,
      username: null,
      picture_url: null,

      //Standards
      '@type': null,
      'email': null,
      '@id': null
    },

  constructor: function Account() {
    Base.Model.apply(this, arguments);
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  },

  isFacebookAccount: function() {
      return (this.get("@type") === 'FacebookAccount');
    }

});

var Accounts = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl("/all_users/current/accounts"),
  model: Account,

  constructor: function Accounts() {
    Base.Collection.apply(this, arguments);
  },

  hasFacebookAccount: function() {
      var tmp = this.find(function(model) {
        return model.isFacebookAccount();
      });
      if (!tmp) return false;
      else return true;
    }, 

  getFacebookAccount: function() {
      var tmp = this.find(function(model) {
        return model.isFacebookAccount();
      });
      if (!tmp) return null;
      else return tmp;
    }
});

module.exports = {
  Model: Account,
  Collection: Accounts
};
