'use strict';

define(['backbone.marionette','app', 'jquery', 'underscore', 'common/collectionManager', 'common/context', 'models/notificationSubscription', 'models/roles', 'utils/i18n', 'utils/roles'],
    function (Marionette, Assembl, $, _, CollectionManager, Ctx, NotificationSubscription, RolesModel, i18n, Roles) {

        var Notification = Marionette.ItemView.extend({
            template:'#tmpl-userSubscriptions',
            tagName:'label',
            className:'checkbox dispb',
            initialize: function(options){
              this.isUserSubscribed = options.isUserSubscribed;
            },
            ui: {
              currentSubscribeCheckbox: ".js_userNotification"
            },
            events: {
              'click @ui.currentSubscribeCheckbox': 'userNotification'
            },
            serializeData: function () {
                return {
                    subscription: this.model,
                    isUserSubscribed: this.isUserSubscribed,
                    i18n: i18n
                }
            },
            userNotification: function (e) {
                var elm = $(e.target);
                var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

                this.model.set("status", status);
                this.model.save(null, {
                    success: function (model, resp) {
                    },
                    error: function (model, resp) {
                        console.error('ERROR: userNotification', resp)
                    }
                });
            }
        });

        var Notifications = Marionette.CollectionView.extend({
            childView: Notification,
            initialize: function(options){
               this.childViewOptions = {
                   isUserSubscribed: options.isUserSubscribed
               }
            }
        });

        var TemplateSubscription = Marionette.ItemView.extend({
            template: '#tmpl-templateSubscription',
            tagName:'label',
            className:'checkbox dispb',
            initialize: function(options){
              this.isUserSubscribed = options.isUserSubscribed;
              this.notificationsUser = options.notificationsUser;
              this.notificationTemplates = options.notificationTemplates;
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
                    that = this,
                    status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

                var notificationSubscriptionTemplateModel = this.notificationTemplates.get(elm.attr('id'));

                var notificationSubscriptionModel = new NotificationSubscription.Model({
                        creation_origin: "USER_REQUESTED",
                        status: status,
                        '@type': notificationSubscriptionTemplateModel.get('@type'),
                        discussion: notificationSubscriptionTemplateModel.get('discussion'),
                        human_readable_description: notificationSubscriptionTemplateModel.get('human_readable_description')
                    });

                this.notificationsUser.add(notificationSubscriptionModel);

                notificationSubscriptionModel.save(null, {
                    success: function(model, response, options) {
                        that.notificationsUser.add(model);
                        that.notificationTemplates.remove(notificationSubscriptionTemplateModel);
                        that.render();
                    },
                    error: function (model, resp) {
                        console.error('ERROR: userNewSubscription', resp)
                    }
                })
            }

        });

        var TemplateSubscriptions = Marionette.CollectionView.extend({
            childView: TemplateSubscription,
            initialize: function(options){
                this.isUserSubscribed = options.isUserSubscribed;
                this.notificationTemplates = options.notificationTemplates;
                this.notificationsUser = options.notificationsUser;

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
                  isUserSubscribed: this.isUserSubscribed,
                  notificationsUser: this.notificationsUser,
                  notificationTemplates: this.notificationTemplates
                }
            }
        });

        var Subscriber = Marionette.ItemView.extend({
            template:'#tmpl-userSubscriber',
            ui: {
                unSubscription: ".js_unSubscription",
                subscription: ".js_subscription",
                btnSubscription:'.btnSubscription',
                btnUnsubscription:'.btnUnsubscription'
            },
            events: {
                'click @ui.unSubscription': 'unSubscription',
                'click @ui.subscription': 'subscription'
            },

            serializeData: function(){
                return {
                    role: this.model
                }
            },

            unSubscription: function () {
                var that = this;

                if (this.model.get('role') === Roles.PARTICIPANT) {
                    var roles = new RolesModel.Model({
                        id: this.model.get('@id')
                    });

                    roles.destroy({
                        success: function (model, resp) {
                            that.$('.bx-alert-success').removeClass('hidden');
                            that.render();
                        },
                        error: function (model, resp) {
                            console.error('ERROR: unSubscription', resp);
                        }
                    });

                }

            },

            subscription: function(){
                var that = this;

                if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {

                    var LocalRolesUser = new RolesModel.Model({
                        role: Roles.PARTICIPANT,
                        discussion: 'local:Discussion/' + Ctx.getDiscussionId()
                    });

                    LocalRolesUser.save(null, {
                        success: function (model, resp) {
                            that.render();
                        },
                        error: function (model, resp) {
                            console.error('ERROR: joinDiscussion->subscription', resp);
                        }
                    })
                }
            }

        });

        var userNotificationSubscriptions = Marionette.LayoutView.extend({
            template: '#tmpl-userNotificationSubscriptions',
            className: 'admin-notifications',
            ui: {
              close: '.bx-alert-success .bx-close'
            },
            regions: {
              userNotifications:'#userNotifications',
              templateSubscription: '#templateSubscriptions',
              userSubscriber: '#subscriber'
            },
            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                this.notificationTemplates = new Backbone.Collection();
                this.notificationsUser = new Backbone.Collection();
                this.roles = new RolesModel.Model();

                $.when(collectionManager.getNotificationsUserCollectionPromise(),
                    collectionManager.getNotificationsDiscussionCollectionPromise(),
                    collectionManager.getLocalRoleCollectionPromise()).then(
                    function (NotificationsUser, notificationTemplates, allRole) {
                        that.notificationsUser = NotificationsUser;
                        that.notificationTemplates = notificationTemplates;

                        if(allRole.length){
                            _.extend(that.roles.attributes, allRole.at(0).attributes);
                        }

                        that.render();
                    });

            },
            events: {
                'click @ui.close': 'close'
            },

            onRender: function () {

               var userNotification = new Notifications({
                   collection: this.notificationsUser,
                   isUserSubscribed: this.roles.isUserSubscribed()
               });
               this.userNotifications.show(userNotification);

               var templateSubscriptions = new TemplateSubscriptions({
                    notificationTemplates: this.notificationTemplates,
                    notificationsUser: this.notificationsUser,
                    isUserSubscribed: this.roles.isUserSubscribed()
               });
               this.templateSubscription.show(templateSubscriptions);

               var subscriber = new Subscriber({
                    model: this.roles
               })
               this.userSubscriber.show(subscriber);

            },

            serializeData: function () {
                return {
                    i18n: i18n,
                    roles: this.roles
                }
            },

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            }

        });

        return userNotificationSubscriptions;
    });