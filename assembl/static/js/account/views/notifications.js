define(['marionette', 'jquery', 'underscore', 'modules/collectionManager', 'modules/context'],
    function (Marionette, $, _, CollectionManager, Ctx) {
    'use strict';

    var Notifications = Marionette.LayoutView.extend({
        template: '#tmpl-user-notifications',
        className: 'user-notifications prs',
        initialize: function () {
            var collectionManager = new CollectionManager(),
                that = this;

            this.collection = new Backbone.Collection();

            $.when(collectionManager.getNotificationsDiscussionCollectionPromise()).then(
                function (NotificationsDiscussion) {
                    that.collection.add(NotificationsDiscussion.models);
                });

            $.when(collectionManager.getNotificationsUserCollectionPromise()).then(
                function (NotificationsUser) {
                    that.collection.add(NotificationsUser.models);
                });
        },

        events: {
            'click .js_enableNotification': 'notifications'
        },

        collectionEvents: {
            'add': 'render'
        },

        serializeData: function () {

            var discussionPush = _.filter(this.collection.models, function (m) {
                return m.get('creation_origin') === 'DISCUSSION_DEFAULT';
            });

            var userPush = _.filter(this.collection.models, function (m) {
                return m.get('creation_origin') === 'USER_REQUEST';
            });

            return {
                DiscussionPush: discussionPush,
                UserPush: userPush
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
             * valid url to enable notification discussion
             * curl -X POST http://localhost:6543/data/Discussion/1/notificationSubscriptions -d "Content-Type=application/x-www-form-urlencoded" -d "type=NotificationSubscriptionFollowOwnMessageDirectReplies" -d "creation_origin=USER_REQUESTED"
             *
             * url to enable notification user
             * curl -X PUT http://localhost:6543/data/User/432/notification_subscriptions -d "Content-Type=application/x-www-form-urlencoded" -d "type=NotificationSubscriptionFollowAllMessages" -d "creation_origin=USER_REQUESTED" -d "status=UNACTIVE"
             *
             * */

            return;
            $.ajax({
                url: '/data/User/' + Ctx.getCurrentUserId() + '/notification_subscriptions',
                type: 'PUT',
                data: {
                    type: elm.val(),
                    creation_origin: 'USER_REQUESTED',
                    status: 'UNACTIVE'
                },
                success: function () {
                },
                error: function () {
                }
            });

        }

    });

    return Notifications;
});