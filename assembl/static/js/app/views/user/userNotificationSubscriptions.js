define(['backbone.marionette', 'jquery', 'underscore', 'common/collectionManager', 'common/context', 'models/notificationSubscription', 'models/roles', 'utils/i18n'],
    function (Marionette, $, _, CollectionManager, Ctx, NotificationSubscription, RolesModel, i18n) {
        'use strict';

        var userNotificationSubscriptions = Marionette.LayoutView.extend({
            template: '#tmpl-userNotificationSubscriptions',
            className: 'admin-notifications',
            ui: {
              currentSubscribeCheckbox: ".js_userNotification",
              newSubscribeCheckbox: ".js_userNewNotification",
                unSubscription: ".js_unSubscription"
            },

            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                this.collection = new Backbone.Collection();
                this.notificationTemplates = new Backbone.Collection();
                this.roles = new Backbone.Model();

                $.when(collectionManager.getNotificationsUserCollectionPromise(),
                    collectionManager.getNotificationsDiscussionCollectionPromise(),
                    collectionManager.getLocalRoleCollectionPromise()).then(
                    function (NotificationsUser, notificationTemplates, allRole) {
                        that.collection = NotificationsUser;
                        that.notificationTemplates = notificationTemplates;
                        that.roles = allRole;
                        that.render();
                    });

            },
            events: {
                'click @ui.currentSubscribeCheckbox': 'userNotification',
                'click @ui.newSubscribeCheckbox': 'userNewSubscription',
                'click @ui.unSubscription': 'unSubscription'
            },

            onRender: function () {
                //TODO: change this system when we will have many subscriptions
                if (!_.isEmpty(this.roles.models)) {
                    this.ui.unSubscription.removeClass('hidden');
                }
            },

            serializeData: function () {

                var that = this,
                    addableGlobalSubscriptions = [];
                this.notificationTemplates.each(function(template) {
                  var alreadyPresent = that.collection.find(function(subscription) {
                    if (subscription.get('@type') === template.get('@type')){
                      return true;
                    }
                    else {
                      return false
                    }
                  });
                  if(alreadyPresent === undefined) {
                    addableGlobalSubscriptions.push(template)
                  }
                })
                console.log(addableGlobalSubscriptions);
                return {
                    UserNotifications: this.collection.models,
                    addableGlobalSubscriptions: addableGlobalSubscriptions,
                    Roles: this.roles
                }
            },

            userNewSubscription : function (e) {
              var elm = $(e.target);

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
              notificationSubscriptionModel.save()
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
                notificationSubscriptionModel.save();
            },

            unSubscription: function () {

                this.roles.forEach(function (model) {

                    if (model.get('role') === 'r:participant') {
                        var roles = new RolesModel.Model({
                            id: model.get('@id')
                        });

                        roles.destroy(null, {
                            success: function (model, resp) {
                                console.log(resp);
                            },
                            error: function (model, resp) {
                                console.error(resp);
                            }
                        });

                    }

                });

            }

        });

        return userNotificationSubscriptions;
    });