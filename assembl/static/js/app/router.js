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

            //"idea/:id": "idea",
            //"idea/:discussion/:id": "ideaSlug",
            //"message/:id": "message",
            //"message/:discussion/:id": "messageSlug",
            //"account": "profile",
            //"account/notifications": "notifications",
            //"admin/discussion/edit/:id":"editDiscussion",
            //"user/:type/:user":"editProfile"
            "*actions": "defaults"
        }

    });

    return Router;
});


