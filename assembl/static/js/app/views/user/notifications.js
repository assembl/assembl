define(['backbone.marionette', 'jquery', 'underscore', 'common/collectionManager', 'common/context', 'models/notificationSubscription'],
    function (Marionette, $, _, CollectionManager, Ctx, NotificationSubscription) {
        'use strict';

        var Notifications = Marionette.LayoutView.extend({
            template: '#tmpl-user-notifications',
            className: 'admin-notifications',
            ui: {
              currentSubscribeCheckbox: ".js_userNotification",
              newSubscribeCheckbox: ".js_userNewNotification",
            },
            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                this.collection = new Backbone.Collection();
                this.notificationTemplates = new Backbone.Collection();
                $.when(collectionManager.getNotificationsUserCollectionPromise(), collectionManager.getNotificationsDiscussionCollectionPromise()).then(
                    function (NotificationsUser, notificationTemplates) {
                        that.collection = NotificationsUser;
                        that.notificationTemplates = notificationTemplates;
                        that.render();
                    });

            },
            events: {
                'click @ui.currentSubscribeCheckbox': 'userNotification',
                'click @ui.newSubscribeCheckbox': 'userNewSubscription',
            },

            collectionEvents: {
                'add': 'render'
            },

            serializeData: function () {
                
                /*No need to filter in this case
                 * var userNotifications = _.filter(this.collection.models, function (m) {
                    return m.get('creation_origin') === 'USER_REQUESTED';
                });
                */
                var that = this,
                    addableGlobalSubscriptions = []
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
                    addableGlobalSubscriptions: addableGlobalSubscriptions
                }
            },

            userNewSubscription : function (e) {
              var elm = $(e.target);

              var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';
              var notificationSubscriptionTemplateModel = this.notificationTemplates.get(elm.attr('id'));
              var notificationSubscriptionModel = new NotificationSubscription.Model(
                  {creation_origin: "USER_REQUESTED",
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
            }

        });

        return Notifications;
    });