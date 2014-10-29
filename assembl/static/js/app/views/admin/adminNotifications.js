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
              "reset": "render" // equivalent to view.listenTo(view.collection, "reset", view.render, view)
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
                var elm = $(e.target),
                    idResource = elm.attr('id').split('/')[1];

                var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

                $.ajax({
                    url: '/data/Discussion/' + Ctx.getDiscussionId() + '/notificationSubscriptions/' + idResource,
                    type: 'PUT',
                    data: {
                        creation_origin: 'DISCUSSION_DEFAULT',
                        status: status
                    },
                    success: function () {
                    },
                    error: function () {
                    }
                });
            }


        });

        return adminNotifications;
    });