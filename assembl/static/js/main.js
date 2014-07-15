requirejs.config(requirejs_config);

require(["modules/assembl","modules/context","jquery","router","utils/socket"],
    function(Assembl, Ctx, $, Router, Socket){
    'use strict';

    Assembl.start();

    // The router
    assembl.router = new Router();

    // The socket
    assembl.socket = new Socket();
    Assembl.commands.setHandler('socket:open', function(){ $('#onlinedot').addClass('is-online').attr('title', 'online'); });
    Assembl.commands.setHandler('socket:close', function(){ $('#onlinedot').removeClass('is-online').attr('title', 'offline'); });

    // Let the game begins...
    Backbone.history.start({hashChange: false, root: "/"});

});
