'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js');

var Account = Base.Model.extend({
    defaults: {
      //E-mail account specifics
      will_merge_if_validated: false,
      verified: false,
      profile: 0,
      preferred: false,
      //IdentityProviderAccount specifics
      provider: null,
      username: null,
      domain: null,
      userid: null,
      picture_url: null,
      //Standards
      '@type': null,
      'email': null,
      '@id': null
    },
    validate: function(attrs, options){
        /**
         * check typeof variable
         * */

    },

    isFacebookAccount: function(){
      return (this.get("@type") === 'FacebookAccount');
    }

});


var Accounts = Base.Collection.extend({
    url: Ctx.getApiV2DiscussionUrl("/all_users/current/accounts"),
    model: Account,

    hasFacebookAccount: function(){
      var tmp = this.find(function(model){
        return model.isFacebookAccount();
      });
      if (!tmp) return false;
      else return true;
    }
});

module.exports = {
    Model: Account,
    Collection: Accounts
};
