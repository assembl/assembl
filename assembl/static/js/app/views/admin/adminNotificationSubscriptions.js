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
                        $('.bx-alert-success').removeClass('hidden');
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
            ui: {
                autoSubscribeCheckbox: ".js_adminAutoSubscribe",
                close: '.bx-alert-success .bx-close'
            },
            events: {
               'click @ui.autoSubscribeCheckbox': 'updateAutoSubscribe',
               'click @ui.close': 'close'
            },
            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                if (!Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) {
                    // TODO ghourlier: Éviter que les gens n'ayant pas l'autorisation accèdent à cet écran.
                    alert("This is an administration screen.");
                    return;
                }

                $.when(collectionManager.getNotificationsDiscussionCollectionPromise(),
                    collectionManager.getDiscussionModelPromise()).then(
                    function (NotificationsDiscussion, Discussion) {
                        that.notifications = NotificationsDiscussion;
                        that.discussion = Discussion;
                        that.render();
                    });
            },
            serializeData: function () {
                return {
                    discussion: this.discussion
                }
            },
            onRender: function(){
                var notif = new notificationList({
                    collection: this.notifications
                });
                this.notification.show(notif);
            },

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            },

            updateAutoSubscribe: function(e){
                var that = this;
                var val = this.$('#notification-auto-subscribe input').is(':checked');

                this.discussion.set('subscribe_to_notifications_on_signup', val);

                this.discussion.save(null, {
                    success: function (model, resp) {
                        that.$('.bx-alert-success').removeClass('hidden');
                    },
                    error: function (model, resp) {
                        console.debug(model, resp);
                    }
                })
            }

        });

        return adminNotificationSubscriptions;
    });