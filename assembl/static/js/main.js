requirejs.config(requirejs_config);

require([
    "modules/assembl",
    "modules/context",
    "app",
    "jquery",
    "router",
    "socket"
], function(Assembl, Ctx, app, $,Router, Socket){
    'use strict';

    Assembl.start();

    // The router
    assembl.router = new Router();

    // The socket
    assembl.socket = new Socket();
    app.on('socket:open', function(){ $('#onlinedot').addClass('is-online').attr('title', 'online'); });
    app.on('socket:close', function(){ $('#onlinedot').removeClass('is-online').attr('title', 'offline'); });


    // Let the game begins...
    Backbone.history.start({hashChange: false, root: "/"});

});
