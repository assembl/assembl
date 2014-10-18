requirejs.config(requirejs_config);

require(['account/app', 'account/router'], function (App, Router) {
    'use strict';

    var router = new Router();

    App.start();

});