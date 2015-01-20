'use strict';

define(['backbone.marionette', 'common/collectionManager', 'utils/permissions', 'common/context', 'utils/i18n'],
    function (Marionette, CollectionManager, Permissions, Ctx, i18n) {

        var adminNotificationSubscriptions = Marionette.LayoutView.extend({
            template: '#tmpl-adminNotificationSubscriptions',
            className: 'admin-notifications',
            ui: {
                subscribeCheckbox: ".js_adminNotification"
            },
            collectionEvents: {
                "reset": "render", // equivalent to view.listenTo(view.collection, "reset", view.render, view)
                "sync": "render"
            },
            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                this.collection = new Backbone.Collection();
                if (!Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) {
                    // TODO ghourlier: Éviter que les gens n'ayant pas l'autorisation accèdent à cet écran.
                    alert("This is an administration screen.");
                    return;
                }

                $.when(collectionManager.getNotificationsDiscussionCollectionPromise()).then(
                    function (NotificationsDiscussion) {
                        that.collection.reset(NotificationsDiscussion.models);
                    });
            },

            events: {
                'click @ui.subscribeCheckbox': 'discussionNotification'
            },

            serializeData: function () {
                var discussionNotifications = _.filter(this.collection.models, function (m) {
                    return m.get('creation_origin') === 'DISCUSSION_DEFAULT';
                });

                return {
                    i18n: i18n,
                    DiscussionNotifications: discussionNotifications
                }
            },

            discussionNotification: function (e) {
                var elm = $(e.target);

                var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

                var notificationSubscriptionModel = this.collection.get(elm.attr('id'));
                notificationSubscriptionModel.set("status", status);
                notificationSubscriptionModel.save(null, {
                    success: function (model, resp) {
                    },
                    error: function (model, resp) {
                        console.error('ERROR: discussionNotification', resp);
                    }
                });
            }


        });

        return adminNotificationSubscriptions;
    });