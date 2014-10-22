define(function (require) {

    var Marionette = require('marionette'),
        App = require('account/app'),
        Ctx = require('common/context'),
        profileView = require('account/views/profile'),
        notificationsView = require('account/views/notifications');

    var routeManager = Marionette.Controller.extend({
        initialize: function () {
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

            if (!Ctx.getCurrentUserId()) {
                return;
            }

            var profile = new profileView();
            App.contentContainer.show(profile);
        },

        notifications: function () {
            this.selectMenu('notifications');

            if (!Ctx.getCurrentUserId()) {
                return;
            }

            var notifications = new notificationsView();
            App.contentContainer.show(notifications);
        }
    })

    return new routeManager();
});