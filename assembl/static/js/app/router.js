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
                "user/notifications": "userNotifications",
                "user/profile": "profile",
                "user/account": "account",
                "posts/:id": "post",
                "idea/:id": "idea",
                "*actions": "defaults"
            }

        });

        return Router;
    });


