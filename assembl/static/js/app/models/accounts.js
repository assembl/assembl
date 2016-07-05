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
  /**
   * @member {string} app.models.accounts.Account.urlRoot
   */
  urlRoot: Ctx.getApiV2DiscussionUrl("/all_users/current/accounts"),
  /**
   * Defaults
   * @type {Object}
   */
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
  /**
   * @function app.models.accounts.Account.constructor
   */
  constructor: function Account() {
    Base.Model.apply(this, arguments);
  },
  /**
   * Validate the model attributes
   * @function app.models.accounts.Account.validate
   */
  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
  },
  /**
   * Returns true if the Account type is a Facebook account
   * @returns {Boolean}
   * @function app.models.accounts.Account.isFacebookAccount
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
  /**
   * @member {string} app.models.accounts.Accounts.url
   */
  url: Ctx.getApiV2DiscussionUrl("/all_users/current/accounts"),
  /**
   * The model
   * @type {Account}
   */
  model: Account,
  /**
   * @function app.models.accounts.Accounts.constructor
   */
  constructor: function Accounts() {
    Base.Collection.apply(this, arguments);
  },
  /**
   * Returns true if the Account type is a Facebook account
   * @returns {Boolean}
   * @function app.models.accounts.Accounts.hasFacebookAccount
   */
  hasFacebookAccount: function() {
      var tmp = this.find(function(model) {
        return model.isFacebookAccount();
      });
      if (!tmp) return false;
      else return true;
    }, 
  /**
   * Returns Facebook account data
   * @returns {Object}
   * @function app.models.accounts.Accounts.getFacebookAccount
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