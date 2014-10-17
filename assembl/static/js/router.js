define(function (require) {
    'use strict';

    var Marionette = require('marionette'),
        RouteManager = require('modules/routeManager');

    //window.location.hash = window.location.hash.replace(/#!/, '#');

    var Router = Marionette.AppRouter.extend({

        controller: RouteManager,
        appRoutes: {
            ":discussion_slug/": "home",
            ":discussion_slug/edition": "edition",
            ":discussion_slug/account": "profile",
            ":discussion_slug/account/notifications": "notifications",

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


