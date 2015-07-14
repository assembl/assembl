'use strict';

var $ = require('../shims/jquery.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Agents = require('./agents.js'),
    Moment = require('moment');

var FacebookAccessToken = Base.Model.extend({
    urlRoot: function(){
        var fbId = Ctx.getCurrentUserFacebookAccountId();
        if (!fbId) {
            throw new Error("There is no Facebook Account for this user");
        }
        else {
            var route = Ctx.getApiV2DiscussionUrl('/all_users/current/accounts/') +
                Ctx.extractId(fbId) + "/access_tokens";
            return route;
        }
    },
    defaults: {
        fb_account_id: null,
        token: null,
        expiration: null,
        token_type: null,
        object_name: null,
        object_fb_id: null,
        '@view': null,
        '@type': null
    },

    isExpired: function(){
        var d = new Moment(this.expiration).utc();
        var now = new Moment.utc();
        return now.isAfter(d);
    },

    isUserToken: function(){
        return this.get('token_type') === 'user';
    },

    isPageToken: function(){
        return this.get('token_type') === 'page';
    }, 

    isGroupToken: function(){
        return this.get('token_type') === 'group';
    }
});

var FacebookAccessTokens = Base.Collection.extend({
    //Things to add: Promise function to get the agent model
    //represented by this model.
    model: FacebookAccessToken,
    url: function(){
        var fbId = Ctx.getCurrentUserFacebookAccountId();
        if (!fbId) {
            throw new Error("There is no Facebook Account for this user");
        }
        else {
            var route = Ctx.getApiV2DiscussionUrl('/all_users/current/accounts/') +
                Ctx.extractId(fbId) + "/access_tokens";
            return route;
        }
    },
    getUserToken: function(){
        var tmp = this.find(function(model){ return model.isUserToken(); });
        if (!tmp) return null;
        else return tmp;
    },

    hasUserToken: function(){
        var tmp = this.find(function(model){ return model.isUserToken(); });
        if (!tmp) return false;
        else return true;
    }
});

module.exports = {
  Facebook: {
    Token: {
        Model: FacebookAccessToken,
        Collection: FacebookAccessTokens
    } 
  }
}


