'use strict';

var App = require('./app.js'),
    Router = require('./router.js'),
    Ctx = require('./common/context.js'),
    Socket = require('./utils/socket.js'),
    raven = require('raven');

(function(){

    var router = new Router();
    var socket = new Socket();

    App.start();

    window.Ctx = Ctx;

    if (raven_url.length) {
        raven.config(raven_url).install();
        raven.setUserContext({id: Ctx.getCurrentUserId()});
    }
    else {
        //Disables raven for development
        raven.config(false);
        raven.debug = false;
    }

})();