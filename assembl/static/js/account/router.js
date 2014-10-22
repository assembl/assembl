define(function (require) {
        'use strict';

    var Marionette = require('marionette'),
        routeManager = require('account/routeManager');

    var Router = Marionette.AppRouter.extend({
        controller: routeManager,
        appRoutes: {
                "profile": "profile",
            "notifications": "notifications",
                "*actions": "defaults"
            }

        });

        return Router;
    });