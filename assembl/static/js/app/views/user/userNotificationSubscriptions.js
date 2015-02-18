'use strict';

define(['backbone.marionette','app', 'jquery', 'underscore', 'common/collectionManager', 'common/context', 'models/notificationSubscription', 'models/roles', 'utils/i18n', 'utils/roles', 'models/emailAccounts'],
    function (Marionette, Assembl, $, _, CollectionManager, Ctx, NotificationSubscription, RolesModel, i18n, Roles, emailAccounts) {

        /**
         * User notification
         * */
        var Notification = Marionette.ItemView.extend({
            template:'#tmpl-userSubscriptions',
            tagName:'label',
            className:'checkbox dispb',
            initialize: function(options){

              if(this.model === 'undefined'){
                this.template = "#tmpl-loader";
              }

              this.role = options.roles;
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
                    role: this.role,
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
                var collectionManager = new CollectionManager(),
                    that = this;

                this.notificationsUser = undefined;
                this.roles = undefined;

                $.when(collectionManager.getNotificationsUserCollectionPromise(),
                    collectionManager.getLocalRoleCollectionPromise()).then(
                    function (NotificationsUser, allRole) {
                        that.collection = NotificationsUser;
                        that._initialEvents();

                        if(allRole.length){
                            that.roles = allRole.at(0);
                        }else {
                            that.roles = null;
                        }
                        that.childViewOptions = {
                            roles: that.roles
                        }
                        that.render();
                    });

                this.childViewOptions = {
                   roles: this.roles
               }
            }
        });

        /**
         * Notification template
         * */
        var TemplateSubscription = Marionette.ItemView.extend({
            template: '#tmpl-templateSubscription',
            tagName:'label',
            className:'checkbox dispb',
            initialize: function(options){
              this.roles = options.roles
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
                roles: this.roles,
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
                        that.notificationTemplates.remove(notificationSubscriptionTemplateModel);
                    },
                    error: function (model, resp) {
                        that.notificationsUser.remove(notificationSubscriptionModel);
                        console.error('ERROR: userNewSubscription', resp)
                    }
                })
            }

        });

        var TemplateSubscriptions = Marionette.CollectionView.extend({
            childView: TemplateSubscription,
            initialize: function(){
                var that = this,
                    collectionManager = new CollectionManager(),
                    addableGlobalSubscriptions = new Backbone.Collection();

                this.notificationTemplates = undefined;
                this.notificationsUser = undefined;
                this.roles = undefined;

                $.when(collectionManager.getNotificationsUserCollectionPromise(),
                    collectionManager.getNotificationsDiscussionCollectionPromise(),
                    collectionManager.getLocalRoleCollectionPromise()).then(
                    function (NotificationsUser, notificationTemplates, allRole) {
                        that.notificationsUser = NotificationsUser;
                        that.notificationTemplates = notificationTemplates;

                        if(allRole.length){
                            that.roles = allRole.at(0);
                        }else {
                            that.roles = null;
                        }

                        that.notificationTemplates.each(function (template) {
                            var alreadyPresent = that.notificationsUser.find(function (subscription) {
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

                        that.collection = addableGlobalSubscriptions;
                        that._initialEvents();

                        that.childViewOptions = {
                            roles: that.roles,
                            notificationsUser: that.notificationsUser,
                            notificationTemplates: addableGlobalSubscriptions
                        }

                        that.render();
                    });

            }
        });

        /**
         *  Choose an email to notify user
         * */
        var NotificationByEmail = Marionette.ItemView.extend({
            template: '#tmpl-notificationByEmail',
            tagName: 'label',
            className: 'radio',
            ui: {
              preferredEmail: '.js_preferred'
            },
            initialize: function(){


            },
            events: {
              'click @ui.preferredEmail': 'preferredEmail'
            },
            serializeData: function(){
                return {
                    account: this.model
                }
            },
            preferredEmail: function(){

                var preferred = (this.$('input[name="email_account"]:checked').val()) ? true : false;

                this.model.set({preferred: preferred});

                this.model.save(null, {
                    success: function(){

                        console.debug('success');
                    },
                    error: function(){
                        console.debug('error');
                    }
                })

            }

        });

        var NotificationByEmails = Marionette.CompositeView.extend({
            template: '#tmpl-notificationByEmails',
            childView: NotificationByEmail,
            childViewContainer:'.controls'
        })


        /**
         * Subscripbe / Unsubscribe action
         * */
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
            initialize: function(){
                var collectionManager = new CollectionManager(),
                    that = this;

                this.model = undefined;

                $.when(collectionManager.getLocalRoleCollectionPromise()).then(
                    function (allRole) {

                        if(allRole.length){
                            that.model = allRole.at(0);
                        }else {
                            that.model = null;
                        }
                        that.render();
                    });

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
            regions: {
              userNotifications:'#userNotifications',
              templateSubscription: '#templateSubscriptions',
              userSubscriber: '#subscriber',
              notifByEmail: '#notifByEmail'
            },
            onRender: function () {

               var subscriber = new Subscriber();
               this.userSubscriber.show(subscriber);

               var userNotification = new Notifications();
               this.userNotifications.show(userNotification);

               var templateSubscriptions = new TemplateSubscriptions();
               this.templateSubscription.show(templateSubscriptions);

               var emailAccount = new emailAccounts.Collection();
               var notificationByEmails = new NotificationByEmails({
                   collection: emailAccount
               });
               emailAccount.fetch();

               this.notifByEmail.show(notificationByEmails);
            },

            serializeData: function () {
                return {
                    i18n: i18n
                }
            }

        });

        return userNotificationSubscriptions;
    });