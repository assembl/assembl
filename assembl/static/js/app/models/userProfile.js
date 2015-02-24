"use strict";

define(['jquery', 'models/base', 'common/context'],
    function ($, Base, Ctx) {

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

    return {
        Model: userProfile
    }
});