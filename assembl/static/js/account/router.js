define(['marionette', 'account/app', 'account/views/profile', 'account/views/notifications', 'modules/collectionManager'],
    function (Marionette, App, profileView, notificationsView, CollectionManager) {
        'use strict';

        var Router = Marionette.AppRouter.extend({

            routes: {
                "profile": "profile",
                "notifications": "notifications",
                "*action": "defaults"
            },

            selectMenu: function (menu) {
                $('.adminMenu a').parent().removeClass('active');
                $('.adminMenu a[href="#' + menu + '"]').parent().addClass('active');
            },

            defaults: function () {
                Backbone.history.navigate('profile', true);
            },

            profile: function () {
                this.selectMenu('profile');

                var profile = new profileView();
                App.contentContainer.show(profile);
            },

            notifications: function () {
                this.selectMenu('notifications');

                var notifications = new notificationsView();
                App.contentContainer.show(notifications);
            }

        });

        return Router;
    });