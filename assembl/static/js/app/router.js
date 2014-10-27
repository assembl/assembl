define(function (require) {
    'use strict';

    var Marionette = require('marionette'),
        routeManager = require('app/routeManager');

    var Router = Marionette.AppRouter.extend({
        controller: routeManager,
        appRoutes: {
            "": "home",
            "edition": "edition",
            "partners": "partners",
            "notifications": "notifications",
            "account/notifications": "userNotifications",
            "account/profile": "profile",
            "*actions": "defaults"
        }

    });

    return Router;
});


