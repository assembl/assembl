define(['backbone.marionette', 'common/collectionManager'],
    function (Marionette, CollectionManager) {
        'use strict';


        var adminNotifications = Marionette.LayoutView.extend({
            template: '#tmpl-adminNotifications',
            className: 'admin-notifications',
            ui: {
              subscribeCheckbox: ".js_adminNotification"
            },
            collectionEvents: {
              "reset": "render", // equivalent to view.listenTo(view.collection, "reset", view.render, view)
              "sync": "render"
            },
            initialize: function () {
                var collectionManager = new CollectionManager(),
                    that = this;

                this.collection = new Backbone.Collection();
                
                $.when(collectionManager.getNotificationsDiscussionCollectionPromise()).then(
                    function (NotificationsDiscussion) {
                        that.collection.reset(NotificationsDiscussion.models);
                    });
            },

            events: {
                'click @ui.subscribeCheckbox': 'discussionNotification'
            },

            serializeData: function () {
                var discussionNotifications = _.filter(this.collection.models, function (m) {
                    return m.get('creation_origin') === 'DISCUSSION_DEFAULT';
                });

                return {
                    DiscussionNotifications: discussionNotifications
                }
            },

            discussionNotification: function (e) {
                var elm = $(e.target);

                var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';
                
                var notificationSubscriptionModel = this.collection.get(elm.attr('id'));
                notificationSubscriptionModel.set("status", status);
                notificationSubscriptionModel.save();
            }


        });

        return adminNotifications;
    });