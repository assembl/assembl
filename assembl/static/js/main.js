requirejs.config(requirejs_config);

require(["modules/assembl", "modules/context", "jquery", "app/router", "utils/socket"],
    function (Assembl, Ctx, $, Router, Socket) {
        'use strict';

        Assembl.start();

        // The router
        var router = new Router();

        // The socket
        var socket = new Socket();
        Assembl.commands.setHandler('socket:open', function () {
            $('#onlinedot').addClass('is-online');
        });
        Assembl.commands.setHandler('socket:close', function () {
            $('#onlinedot').removeClass('is-online');
        });

        // Let the game begins...
        Backbone.history.start({hashChange: false, root: "/"});

        //Probably not the right way, but I don't know how to make the Ctx accessible
        //to the header
        window.Ctx = Ctx;

    });
