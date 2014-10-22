define(['jquery', 'app/models/base', 'app/modules/context'], function ($, Base, Ctx) {
    'use strict';

    var root = 'User/' + Ctx.getCurrentUserId() + '/notification_subscriptions';

    var notificationsUserModel = Base.Model.extend({
        url: Ctx.getApiV2Url(root) + '/?view=extended',
        defaults: {
            '@id': null,
            '@type': null,
            status: null,
            followed_object: null,
            parent_subscription: null,
            discussion: null,
            last_status_change_date: null,
            creation_date: null,
            creation_origin: null,
            user: null
        }

    });

    var notificationsUserCollection = Base.Collection.extend({
        url: Ctx.getApiV2Url(root) + '/?view=extended',
        model: notificationsUserModel
    });

    return {
        Model: notificationsUserModel,
        Collection: notificationsUserCollection
    };
});