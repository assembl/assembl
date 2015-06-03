'use strict';

var App = require('./app.js'),
    Router = require('./router.js'),
    Ctx = require('./common/context.js'),
    Socket = require('./utils/socket.js'),
    Raven = require('raven-js');

if (raven_url.length) {
    Raven.config(raven_url).install();
    Raven.setUserContext({id: Ctx.getCurrentUserId()});
}
else {
    //Disables raven for development
    Raven.config(false);
    Raven.debug = false;
}

var router = new Router();
var socket = new Socket();

window.Ctx = Ctx;

App.start();