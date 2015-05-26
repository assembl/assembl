'use strict';

var App = require('./app.js'),
    Router = require('./router');
    //Ctx = require('./common/context'),
    //Socket = require('./utils/socket'),
    //dropdown = require('../lib/dropdown');
    //raven = require('raven');

var router = new Router();
//var socket = new Socket();

//App.start();

//window.Ctx = Ctx;

/*(function(){

    /*if (raven_url.length) {
      raven.config(raven_url).install();
      raven.setUserContext({id: Ctx.getCurrentUserId()});
    }
    else {
      //Disables raven for development
      raven.config(false);
      raven.debug=false;
    }

    var router = new Router();

    App.start();

    // The socket
    var socket = new Socket();

    //Probably not the right way, but I don't know how to make the Ctx accessible
    //to the header
    window.Ctx = Ctx

})();*/
