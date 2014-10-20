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

                $.when(collectionManager.getNotificationsUserCollectionPromise()).then(
                    function (NotificationsUser) {
                        that.collection.add(NotificationsUser.models);
                    });

            },

            events: {
                'click .js_userNotification': 'userNotification'
            },

            collectionEvents: {
                'add': 'render'
            },

            serializeData: function () {

                var userNotifications = _.filter(this.collection.models, function (m) {
                    return m.get('creation_origin') === 'USER_REQUEST';
                });

                return {
                    UserNotifications: userNotifications
                }
            },

            userNotification: function (e) {
                var elm = $(e.target),
                    status = 'UNSUBSCRIBED',
                    idResource = elm.attr('id').split('/')[1];

                /**
                 * SubscriptionFollowAllMessages
                 * SubscriptionFollowSyntheses
                 * SubscriptionOnPost
                 * SubscriptionOnExtract
                 * SubscriptionOnUserAccount
                 * SubscriptionFollowOwnMessageDirectReplies
                 * */

                /**
                 * valid url to enable notification discussion
                 * curl -X POST http://localhost:6543/data/Discussion/1/notificationSubscriptions -d "Content-Type=application/x-www-form-urlencoded" -d "type=NotificationSubscriptionFollowOwnMessageDirectReplies" -d "creation_origin=USER_REQUESTED"
                 *
                 * url to enable notification user
                 * curl -X PUT http://localhost:6543/data/User/432/notification_subscriptions -d "Content-Type=application/x-www-form-urlencoded" -d "type=NotificationSubscriptionFollowAllMessages" -d "creation_origin=USER_REQUESTED" -d "status=UNACTIVE"
                 *
                 * */

                if (elm.is(':checked')) {
                    status = 'ACTIVE';
                }

                $.ajax({
                    url: '/data/User/' + Ctx.getCurrentUserId() + '/notification_subscriptions/' + idResource,
                    type: 'PUT',
                    data: {
                        type: elm.val(),
                        creation_origin: 'USER_REQUESTED',
                        status: status
                    },
                    success: function (jqXHR, textStatus) {
                        console.log(textStatus)
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log(textStatus)
                        console.log(errorThrown)
                    }
                });

            }

        });

        return Notifications;
    });