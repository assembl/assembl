'use strict';

define(['backbone.marionette', 'common/collectionManager', 'utils/permissions', 'common/context', 'utils/i18n'],
    function (Marionette, CollectionManager, Permissions, Ctx, i18n) {

        var notifications = Marionette.ItemView.extend({
            template: '#tmpl-adminNotification',
            ui: {
               subscribeCheckbox: ".js_adminNotification"
            },
            events: {
               'click @ui.subscribeCheckbox': 'discussionNotification'
            },
            serializeData: function () {
                return {
                    i18n: i18n,
                    notification: this.model
                }
            },
            discussionNotification: function (e) {
                var elm = $(e.target),
                    status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

                this.model.set("status", status);
                this.model.save(null, {
                    success: function (model, resp) {
                    },
                    error: function (model, resp) {
                        console.error('ERROR: discussionNotification', resp);
                    }
                });
            }
        });

        var notificationList = Marionette.CollectionView.extend({
            childView: notifications,
            collectionEvents: {
                "reset": "render", // equivalent to view.listenTo(view.collection, "reset", view.render, view)
                "sync": "render"
            }
        });

        var adminNotificationSubscriptions = Marionette.LayoutView.extend({
            template: '#tmpl-adminNotificationSubscriptions',
            className: 'admin-notifications',
            regions: {
              notification:'#notification-content'
            },
            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                if (!Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) {
                    // TODO ghourlier: Éviter que les gens n'ayant pas l'autorisation accèdent à cet écran.
                    alert("This is an administration screen.");
                    return;
                }

                $.when(collectionManager.getNotificationsDiscussionCollectionPromise()).then(
                    function (NotificationsDiscussion) {
                        that.notifications = NotificationsDiscussion;
                        that.render();
                    });
            },
            onRender: function(){
                var notif = new notificationList({
                    collection: this.notifications
                });
                this.notification.show(notif)
            }

        });

        return adminNotificationSubscriptions;
    });