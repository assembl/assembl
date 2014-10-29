define(['backbone.marionette', 'jquery', 'underscore', 'common/collectionManager', 'common/context'],
    function (Marionette, $, _, CollectionManager, Ctx) {
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
                    return m.get('creation_origin') === 'USER_REQUEST';
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
              console.log("WRITEME:  POST to proper api point")
            },
            
            userNotification: function (e) {
                var elm = $(e.target),
                    idResource = elm.attr('id').split('/')[1];

                var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

                /**
                 * Default notifications for user
                 *
                 * SubscriptionFollowAllMessages
                 * SubscriptionFollowSyntheses
                 * SubscriptionOnPost
                 * SubscriptionOnExtract
                 * SubscriptionOnUserAccount
                 * SubscriptionFollowOwnMessageDirectReplies
                 * */

                if (status && idResource) {

                    $.ajax({
                        url: '/data/User/' + Ctx.getCurrentUserId() + '/notification_subscriptions/' + idResource,
                        type: 'PUT',
                        data: {
                            creation_origin: 'USER_REQUESTED',
                            status: status
                        },
                        success: function (jqXHR, textStatus) {
                            console.log(textStatus)
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log(textStatus)
                            console.log(errorThrown)
                        }
                    });

                }

            }

        });

        return Notifications;
    });