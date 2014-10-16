define(function () {
    'use strict';

    var Base = require('models/base'),
        Ctx = require('modules/context');


    var notificationModel = Base.Model.extend({

        defaults: {
            discussion: true,
            creation_date: true,
            creation_origin: true,
            parent_subscription: true,
            status: true,
            last_status_change_date: true,
            user: true
        }

    });

    var notificationCollection = Base.Collection.extend({

        url: Ctx.getApiV2DiscussionUrl("notificationSubscriptions"),

        model: notificationModel
    });

    return {
        Model: notificationModel,
        Collection: notificationCollection
    };

});