define(function(require){
    'use strict';

    var Marionette = require('marionette'),
        Controller = require('modules/controller');

    var Router = Marionette.AppRouter.extend({

        /**
         * Router strings
         * @type {Object}
         */
        controller: Controller,
        appRoutes: {
            ":slug/": "home",
            ":slug/idea/:id" : "idea",
            ":slug/idea/:slug/:id" : "ideaSlug",
            ":slug/message/:id": "message",
            ":slug/message/:slug/:id" : "messageSlug"
        }
    });

    return Router;
});
