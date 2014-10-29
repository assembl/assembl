define(['backbone.marionette', 'jquery', 'underscore', 'common/collectionManager', 'common/context'],
    function (Marionette, $, _, CollectionManager, Ctx) {
        'use strict';

        var Notifications = Marionette.LayoutView.extend({
            template: '#tmpl-user-notifications',
            className: 'admin-notifications',
            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                this.collection = new Backbone.Collection();

                $.when(collectionManager.getNotificationsUserCollectionPromise()).then(
                    function (NotificationsUser) {
                        that.collection.reset(NotificationsUser.models);
                    });

            },

            events: {
                'click .js_userNotification': 'userNotification'
            },

            collectionEvents: {
                'reset': 'render'
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
                    idResource = elm.attr('id').split('/')[1];

                var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

                /**
                 * Default notifications for user
                 *
                 * SubscriptionFollowAllMessages
                 * SubscriptionFollowSyntheses
                 * SubscriptionOnPost
                 * SubscriptionOnExtract
                 * SubscriptionOnUserAccount
                 * SubscriptionFollowOwnMessageDirectReplies
                 * */

                if (status && idResource) {

                    $.ajax({
                        url: '/data/User/' + Ctx.getCurrentUserId() + '/notification_subscriptions/' + idResource,
                        type: 'PUT',
                        data: {
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

            }

        });

        return Notifications;
    });