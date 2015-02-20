'use strict';

define(['backbone.marionette', 'common/collectionManager', 'utils/permissions', 'common/context', 'utils/i18n', 'jquery'],
    function (Marionette, CollectionManager, Permissions, Ctx, i18n, $) {

        var notifications = Marionette.ItemView.extend({
            template: '#tmpl-adminNotification',
            className: 'controls',
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

        var notificationList = Marionette.CompositeView.extend({
            template: '#tmpl-adminNotificationList',
            childView: notifications,
            childViewContainer: '.control-group',
            className:'mtl'
        });

        var defaultNotification = Marionette.ItemView.extend({
            template: '#tmpl-defaultNotification',
            ui: {
                autoSubscribeCheckbox: ".js_adminAutoSubscribe"
            },
            events: {
                'click @ui.autoSubscribeCheckbox': 'updateAutoSubscribe'
            },
            serializeData: function () {
                return {
                    discussion: this.model
                }
            },
            updateAutoSubscribe: function(){
                var that = this,
                    val = (this.$('.autoSubscribe:checked').val()) ? true : false;

                this.model.set('subscribe_to_notifications_on_signup', val);

                this.model.save(null, {
                    success: function (model, resp) {

                    },
                    error: function (model, resp) {
                        console.debug(model, resp);
                    }
                })
            }
        });

        var adminNotificationSubscriptions = Marionette.LayoutView.extend({
            template: '#tmpl-adminNotificationSubscriptions',
            className: 'admin-notifications',
            regions: {
              notification:'#notification-content',
              autoSubscribe:'#notification-auto-subscribe'
            },
            ui: {
                close: '.bx-alert-success .bx-close'
            },
            events: {
               'click @ui.close': 'close'
            },
            initialize: function () {
                this.collectionManager = new CollectionManager();

                if (!Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) {
                    // TODO ghourlier: Éviter que les gens n'ayant pas l'autorisation accèdent à cet écran.
                    alert("This is an administration screen.");
                    return;
                }
            },

            onBeforeShow: function(){
                var that = this;

                $.when(this.collectionManager.getDiscussionModelPromise(),
                    this.collectionManager.getNotificationsDiscussionCollectionPromise())
                    .then(function (Discussion, NotificationsDiscussion) {

                        var defaultNotif = new defaultNotification({
                            model: Discussion
                        });
                        that.getRegion('autoSubscribe').show(defaultNotif);

                        var notif = new notificationList({
                            collection: NotificationsDiscussion
                        });
                        that.getRegion('notification').show(notif);

                    });

            },

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            }

        });

        return adminNotificationSubscriptions;
    });