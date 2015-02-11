"use strict";

define(['jquery', 'models/base', 'common/context'],
    function ($, Base, Ctx) {

    var userProfile = Base.Model.extend({
        idAttribute: '@id',
        url: '/data/User/'+Ctx.getCurrentUserId(),
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
        }

    });

    return {
        Model: userProfile
    }
});