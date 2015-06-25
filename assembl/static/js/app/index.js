'use strict';

var App = require('./app.js'),
    Router = require('./router.js'),
    Ctx = require('./common/context.js'),
    Socket = require('./utils/socket.js'),
    Taketour = require('./utils/taketour.js'),
    CollectionManager = require('./common/collectionManager.js'),
    Raven = require('raven-js');

require('./utils/taketour.js');

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

// available in simple interface
if(Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.SIMPLE){

    var collectionManager = new CollectionManager();

    collectionManager.getCurrentUser().then(function(currentUser){

        if(!currentUser.get('is_first_visit')){

            // start take tour due to the dom latencies
            setTimeout(function(){

                Taketour.init();

            }, 4000);

        }

    });

}









