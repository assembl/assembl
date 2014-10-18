define(['models/base', 'modules/context'], function (Base, Ctx) {
    'use strict';

    var notificationModel = Base.Model.extend({
        url: Ctx.getApiV2DiscussionUrl("notificationSubscriptions"),
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

    var notificationCollection = Base.Collection.extend({
        url: Ctx.getApiV2DiscussionUrl("notificationSubscriptions") + '/?view=extended',
        model: notificationModel
    });

    return {
        Model: notificationModel,
        Collection: notificationCollection
    };

});