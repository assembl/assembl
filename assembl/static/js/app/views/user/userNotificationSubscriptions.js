'use strict';

define(['backbone.marionette', 'jquery', 'underscore', 'common/collectionManager', 'common/context', 'models/notificationSubscription', 'models/roles', 'utils/i18n', 'utils/roles'],
    function (Marionette, $, _, CollectionManager, Ctx, NotificationSubscription, RolesModel, i18n, Roles) {


        var userNotificationSubscriptions = Marionette.LayoutView.extend({
            template: '#tmpl-userNotificationSubscriptions',
            className: 'admin-notifications',
            ui: {
                currentSubscribeCheckbox: ".js_userNotification",
                newSubscribeCheckbox: ".js_userNewNotification",
                unSubscription: ".js_unSubscription",
                close: '.bx-alert-success .bx-close'
            },

            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                this.collection = new Backbone.Collection();
                this.notificationTemplates = new Backbone.Collection();
                this.model = new Backbone.Model();
                this.roles = new RolesModel.Model();

                $.when(collectionManager.getNotificationsUserCollectionPromise(),
                    collectionManager.getNotificationsDiscussionCollectionPromise(),
                    collectionManager.getLocalRoleCollectionPromise()).then(
                    function (NotificationsUser, notificationTemplates, allRole) {
                        that.collection = NotificationsUser;
                        that.notificationTemplates = notificationTemplates;
                        //FIXME: unduplicated models
                        if (allRole.models.length) {
                            that.model = allRole;
                            that.roles = allRole.models[0];
                        }
                        that.render();
                    });

            },
            events: {
                'click @ui.currentSubscribeCheckbox': 'userNotification',
                'click @ui.newSubscribeCheckbox': 'userNewSubscription',
                'click @ui.unSubscription': 'unSubscription',
                'click @ui.close': 'close'
            },

            onRender: function () {
                //TODO: change this system when we will have many subscriptions
                if (!this.roles.isUserSubscribed()) {
                    this.ui.currentSubscribeCheckbox.attr('disabled', true);
                }
            },

            serializeData: function () {

                var that = this,
                    addableGlobalSubscriptions = [];
                this.notificationTemplates.each(function (template) {
                    var alreadyPresent = that.collection.find(function (subscription) {
                        if (subscription.get('@type') === template.get('@type')) {
                            return true;
                        }
                        else {
                            return false
                        }
                    });
                    if (alreadyPresent === undefined) {
                        addableGlobalSubscriptions.push(template)
                    }
                })

                return {
                    i18n: i18n,
                    UserNotifications: this.collection.models,
                    addableGlobalSubscriptions: addableGlobalSubscriptions,
                    isUserSubscribed: this.roles.isUserSubscribed()
                }
            },

            userNewSubscription: function (e) {
                var elm = $(e.target);
                var that=this;

                var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';
                var notificationSubscriptionTemplateModel = this.notificationTemplates.get(elm.attr('id'));
                var notificationSubscriptionModel = new NotificationSubscription.Model(
                    {
                        creation_origin: "USER_REQUESTED",
                        status: status,
                        '@type': notificationSubscriptionTemplateModel.get('@type'),
                        discussion: notificationSubscriptionTemplateModel.get('discussion')
                    });
                this.collection.add(notificationSubscriptionModel);

                notificationSubscriptionModel.save(null, {
                    success: function(model, response, options) {
                        that.collection.add(model);
                        that.notificationTemplates.remove(notificationSubscriptionTemplateModel);
                        that.render();
                    },
                    error: function (model, resp) {
                        console.error('ERROR: userNewSubscription', resp)
                    }
                })
            },

            userNotification: function (e) {
                var elm = $(e.target);

                var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

                /**
                 * Default notifications for user
                 *
                 * SubscriptionFollowAllMessages
                 * SubscriptionFollowSyntheses
                 * SubscriptionFollowOwnMessageDirectReplies
                 * */

                var notificationSubscriptionModel = this.collection.get(elm.attr('id'));
                notificationSubscriptionModel.set("status", status);

                notificationSubscriptionModel.save(null, {
                    success: function (model, resp) {
                    },
                    error: function (model, resp) {
                        console.error('ERROR: userNotification', resp)
                    }
                });
            },

            unSubscription: function () {
                var that = this;

                this.model.forEach(function (model) {

                    if (model.get('role') === Roles.PARTICIPANT) {
                        var roles = new RolesModel.Model({
                            id: model.get('@id')
                        });

                        roles.destroy({
                            success: function (model, resp) {
                                that.ui.unSubscription.addClass('hidden');
                                that.$('.bx-alert-success').removeClass('hidden');
                            },
                            error: function (model, resp) {
                                console.error('ERROR: unSubscription', resp);
                            }
                        });

                    }

                });

            },

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            }

        });

        return userNotificationSubscriptions;
    });