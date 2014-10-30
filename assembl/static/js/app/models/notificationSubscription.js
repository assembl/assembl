define(['models/base', 'common/context'], function (Base, Ctx) {
    'use strict';

    var notificationsSubscriptionModel = Base.Model.extend({
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

    var notificationsSubscriptionCollection = Base.Collection.extend({
        model: notificationsSubscriptionModel,
        
        /**
         * Set the collection url for a specific user subscription
         */
        setUrlToUserSubscription: function() {
          var root = 'Discussion/' + Ctx.getDiscussionId() + '/all_users/' + Ctx.getCurrentUserId() + '/notification_subscriptions';
          this.url = Ctx.getApiV2Url(root) + '/?view=extended';
        },
        
        /**
         * Set the collection url for global discussion template subscription
         */
        setUrlToDiscussionTemplateSubscriptions: function() {
          this.url = Ctx.getApiV2DiscussionUrl("user_templates/-/notification_subscriptions") + '/?view=extended';
        }
    });

    return {
        Model: notificationsSubscriptionModel,
        Collection: notificationsSubscriptionCollection
    };

});