define(['backbone.marionette', 'routeManager'],
    function (Marionette, routeManager) {
        'use strict';

        var Router = Marionette.AppRouter.extend({
            controller: routeManager,
            //Note:  This should match with assembl/lib/frontend_url.py
            appRoutes: {
                "": "home",
                "edition": "edition",
                "partners": "partners",
                "notifications": "notifications",
                "users/notifications": "userNotifications",
                "users/edit": "profile",
                "posts/:id": "post",
                "*actions": "defaults"
            }

        });

        return Router;
    });


