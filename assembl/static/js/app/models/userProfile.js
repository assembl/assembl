"use strict";

var $ = require('../shims/jquery.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js');


var userProfile = Base.Model.extend({
    url: Ctx.getApiV2DiscussionUrl()+'all_users/'+Ctx.getCurrentUserId(),
    defaults: {
        username: '',
        name: '',
        post_count: 0,
        preferred_email: '',
        verified: false,
        avatar_url_base: '',
        creation_date: '',
        real_name: '',
        permissions: [],
        '@type': '',
        '@view': ''
    },

    validate: function(attrs, options){
        /**
         * check typeof variable
         * */
    }

});

module.exports = {
    Model: userProfile
};
