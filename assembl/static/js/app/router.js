define(function(require){
    'use strict';

    var Marionette = require('marionette'),
        RouteManager = require('modules/routeManager');

    var Router = Marionette.AppRouter.extend({

        controller: RouteManager,
        appRoutes: {
            ":slug/": "home",
            ":slug/context": "contextPage",
            ":slug/idea/:id" : "idea",
            ":slug/idea/:slug/:id" : "ideaSlug",
            ":slug/message/:id": "message",
            ":slug/message/:slug/:id" : "messageSlug"
        }
    });

    return Router;
});
