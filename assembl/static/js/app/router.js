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
                "test2": "userNotifications",
                "users/edit": "profile",
                "posts/:id": "post",
                "*actions": "defaults"
            }

        });

        return Router;
    });


