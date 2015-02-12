'use strict';

define(['backbone.marionette','app', 'jquery', 'underscore', 'common/collectionManager', 'common/context', 'models/notificationSubscription', 'models/roles', 'utils/i18n', 'utils/roles'],
    function (Marionette, Assembl, $, _, CollectionManager, Ctx, NotificationSubscription, RolesModel, i18n, Roles) {

        var Notification = Marionette.ItemView.extend({
            template:'',
            initialize: function(){

            },
            ui: {
              currentSubscribeCheckbox: ".js_userNotification"
            },
            events: {
              'click @ui.currentSubscribeCheckbox': 'userNotification'
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
            }
        });

        var Notifications = Marionette.CollectionView.extend({
           childView: Notification

        });

        var GlobalSubscription = Marionette.ItemView.extend({
            template: '#tmpl-globalSubscriptions',
            tagName: 'form',
            className: 'core-form mbn',
            initialize: function(options){
              this.isUserSubscribed = options.isUserSubscribed;
            },
            ui: {
              newSubscribeCheckbox: ".js_userNewNotification"
            },
            events: {
              'click @ui.newSubscribeCheckbox': 'userNewSubscription'
            },
            serializeData: function () {
              return {
                subscription: this.model,
                isUserSubscribed: this.isUserSubscribed,
                i18n: i18n
              }
            },
            userNewSubscription: function (e) {
                var elm = $(e.target),
                    status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

                this.model.set({status: status});
                this.model.save(null, {
                    success: function(model, response, options) {
                        //that.collection.add(model);
                        //that.notificationTemplates.remove(notificationSubscriptionTemplateModel);
                        //that.render();
                    },
                    error: function (model, resp) {
                        console.error('ERROR: userNewSubscription', resp)
                    }
                })
            }
        });

        var GlobalSubscriptions = Marionette.CollectionView.extend({
            childView: GlobalSubscription,
            initialize: function(options){
                this.isUserSubscribed = options.isUserSubscribed;
                this.notificationTemplates = options.notificationTemplates;

                var addableGlobalSubscriptions = new Backbone.Collection();

                this.notificationTemplates.each(function (template) {
                    var alreadyPresent = options.notificationsUser.find(function (subscription) {
                        if (subscription.get('@type') === template.get('@type')) {
                            return true;
                        }
                        else {
                            return false
                        }
                    });
                    if (alreadyPresent === undefined) {
                        addableGlobalSubscriptions.add(template)
                    }
                });

                this.collection = addableGlobalSubscriptions;

                this.childViewOptions = {
                  isUserSubscribed: options.isUserSubscribed
                }
            }
        });

        var userNotificationSubscriptions = Marionette.LayoutView.extend({
            template: '#tmpl-userNotificationSubscriptions',
            className: 'admin-notifications',
            ui: {
              unSubscription: ".js_unSubscription",
              close: '.bx-alert-success .bx-close'
            },
            regions: {
              userNotifications:'#userNotifications',
              globalSubscriptions: '#globalSubscriptions'
            },
            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                that.notificationTemplates = new Backbone.Collection();
                that.notificationsUser = new Backbone.Collection();

                this.model = new Backbone.Model();
                this.roles = new RolesModel.Model();

                $.when(collectionManager.getNotificationsUserCollectionPromise(),
                    collectionManager.getNotificationsDiscussionCollectionPromise(),
                    collectionManager.getLocalRoleCollectionPromise()).then(
                    function (NotificationsUser, notificationTemplates, allRole) {
                        that.notificationsUser = NotificationsUser;
                        that.notificationTemplates = notificationTemplates;
                        //FIXME: unduplicated models
                        if (allRole.models.length) {
                            that.model = allRole;
                            that.roles = _.first(allRole.models);
                        }
                        that.render();
                    });

                this.listenTo(Assembl.vent, "globalSubscriptions:render", this.render);

            },
            events: {
                'click @ui.unSubscription': 'unSubscription',
                'click @ui.close': 'close'
            },

            onRender: function () {
                //TODO: change this system when we will have many subscriptions
                /*if (!this.roles.isUserSubscribed()) {
                    this.ui.currentSubscribeCheckbox.attr('disabled', true);
                }*/

                /**
                 *  Refactoring
                 *
                 *  miss userNotification , do we need it there ?
                 *
                 *  var userNotification = new Notifications({
                 *   collection: ''
                 *  });
                 *
                 *  //userNotifications
                 *  //this.userNotifications.show(userNotification);
                 *
                 * */

                //globalSubscriptions
                var globalSubscriptions = new GlobalSubscriptions({
                    notificationTemplates: this.notificationTemplates,
                    notificationsUser: this.notificationsUser,
                    isUserSubscribed: this.roles.isUserSubscribed()
                });
                this.globalSubscriptions.show(globalSubscriptions);

            },

            serializeData: function () {
                return {
                    i18n: i18n,
                    isUserSubscribed: this.roles.isUserSubscribed()
                }
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