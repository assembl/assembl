'use strict';

var App = require('./app.js'),
    Router = require('./router.js'),
    Ctx = require('./common/context.js'),
    Socket = require('./utils/socket.js'),
    Taketour = require('./utils/taketour.js'),
    CollectionManager = require('./common/collectionManager.js'),
    Raven = require('raven-js');

/**
 * Init current language
 * */
Ctx.initLocale();

if (raven_url.length) {
  Raven.config(
      raven_url,
      {
        ignoreErrors: ['AttributeError: \'ZMQRouter\' object has no attribute \'loop\''] //Squelch error untill https://github.com/mrjoes/sockjs-tornado/pull/67 goes through
      }
).install();
  Raven.setUserContext({id: Ctx.getCurrentUserId()});
  window.Raven = Raven;
  require('raven-js/plugins/console.js');
}
else {
  //Disables raven for development
  Raven.config(false);
  Raven.debug = false;
}

var router = new Router();
var collectionManager = new CollectionManager();
var socket = collectionManager.getConnectedSocketPromise();

window.Ctx = Ctx;

App.start();

// available in simple interface
if (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.SIMPLE) {

  var currentUser = Ctx.getCurrentUser();
  if (activate_tour && (currentUser.isUnknownUser() || currentUser.get('is_first_visit'))) {
    // start take tour due to the dom latencies
    setTimeout(function() {
      // may have been disabled by the router
      if (activate_tour) {
        Taketour.init();
      }
    }, 4000);
  }
}

