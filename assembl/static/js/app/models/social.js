'use strict';

var $ = require('../shims/jquery.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Agents = require('./agents.js');

var FacebookAccessToken = Base.Model.extend({
    //Things to add: Promise function to get the agent model
    //represented by this model.
    
    urlRoot: Ctx.getApiV2Url('/FacebookAccessTokens'),

    defaults: {
        user_id: null,
        token: null,
        expiration: null,
        tokenType: null,
        object_name: null,
        '@view': null,
        '@type': null
    }
});

module.exports = {
  Facebook: FacebookAccessToken
}


