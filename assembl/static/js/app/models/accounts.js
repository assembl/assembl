'use strict';

/**
 * @module app.models.accounts
 */

var Base = require('./base.js'),
    Ctx = require('../common/context.js');

/**
 * A user's (email or social) account.
 * Frontend model for :py:class:`assembl.models.auth.AbstractAgentAccount`
 * @class app.models.accounts.Account
 * @extends app.models.base.BaseModel
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
  /**
   * Returns true if the Account type is a Facebook account
   * @returns {Boolean}
   * @function app.models.accounts.isFacebookAccount
   */
  isFacebookAccount: function() {
      return (this.get("@type") === 'FacebookAccount');
    }

});

/**
 * Accounts collection
 * @class app.models.accounts.Accounts
 * @extends app.models.base.BaseCollection
 */
var Accounts = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl("/all_users/current/accounts"),
  model: Account,

  constructor: function Accounts() {
    Base.Collection.apply(this, arguments);
  },
  /**
   * Returns true if the Account type is a Facebook account
   * @returns {Boolean}
   * @function app.models.accounts.hasFacebookAccount
   */
  hasFacebookAccount: function() {
      var tmp = this.find(function(model) {
        return model.isFacebookAccount();
      });
      if (!tmp) return false;
      else return true;
    }, 
  /**
   * Returns data of Facebook account
   * @returns {Object}
   * @function app.models.accounts.getFacebookAccount
   */
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
