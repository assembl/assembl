define(['marionette', 'jquery', 'modules/collectionManager'], function (Marionette, $, CollectionManager) {
    'use strict';

    var Notifications = Marionette.LayoutView.extend({
        template: '#tmpl-user-notifications',
        className: 'user-notifications',
        initialize: function () {
            var collectionManager = new CollectionManager(),
                that = this;

            this.collection = new Backbone.Collection();

            $.when(collectionManager.getAllNotificationsCollectionPromise()).then(
                function (AllNotifications) {
                    that.collection.add(AllNotifications.models);
                });
        },

        events: {
            'click .enableOption': 'notifications'
        },

        collectionEvents: {
            'add': 'render'
        },

        serializeData: function () {
            return {
                notifications: this.collection.models
            }
        },

        notifications: function (e) {
            var elm = $(e.target);

            var SubscriptionFollowAllMessages,
                SubscriptionFollowSyntheses,
                SubscriptionOnPost,
                SubscriptionOnExtract,
                SubscriptionOnUserAccount,
                SubscriptionFollowOwnMessageDirectReplies;

            console.log(elm.val(), elm.is(':checked'));

            /**
             * valid url to enable notification
             * curl -X POST http://localhost:6543/data/Discussion/1/notificationSubscriptions -d "Content-Type=application/x-www-form-urlencoded" -d "type=NotificationSubscriptionFollowOwnMessageDirectReplies" -d "creation_origin=USER_REQUESTED"
             * */
        }

    });

    return Notifications;
});