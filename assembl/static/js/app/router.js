define(['backbone.marionette', 'routeManager'],
    function (Marionette, routeManager) {
        'use strict';

        var Router = Marionette.AppRouter.extend({
            controller: routeManager,
            appRoutes: {
                "": "home",
                "edition": "edition",
                "partners": "partners",
                "notifications": "notifications",
                "users/notifications": "userNotifications",
                "users/edit": "profile",
                "*actions": "defaults"
            }

        });

        return Router;
    });


