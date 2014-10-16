define(function (require) {
    'use strict';

    var Marionette = require('marionette'),
        RouteManager = require('modules/routeManager');

    var Router = Marionette.AppRouter.extend({

        controller: RouteManager,
        appRoutes: {
            ":discussion/": "home",
            ":discussion/idea/:id": "idea",
            ":discussion/idea/:slug/:id": "ideaSlug",
            ":discussion/message/:id": "message",
            ":discussion/message/:slug/:id": "messageSlug",
            ":discussion/account": "editProfile",
            //"admin/discussion/edit/:id":"editDiscussion",
            //"user/:type/:user":"editProfile"
        }
    });

    return Router;
});


