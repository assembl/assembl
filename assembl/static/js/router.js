define(function (require) {
    'use strict';

    var Marionette = require('marionette'),
        RouteManager = require('modules/routeManager');

    var Router = Marionette.AppRouter.extend({

        controller: RouteManager,
        appRoutes: {
            "": "home",
            "edition": "edition",

            //"idea/:id": "idea",
            //"idea/:discussion/:id": "ideaSlug",
            //"message/:id": "message",
            //"message/:discussion/:id": "messageSlug",
            //"account": "profile",
            //"account/notifications": "notifications",
            //"admin/discussion/edit/:id":"editDiscussion",
            //"user/:type/:user":"editProfile"
            "*actions": "home"
        }

    });

    return Router;
});


