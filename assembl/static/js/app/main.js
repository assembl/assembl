requirejs.config(requirejs_config);

require(["app/app", "common/context", "jquery", "app/router", "app/utils/socket"],
    function (Assembl, Ctx, $, Router, Socket) {
        'use strict';

        var router = new Router();

        Assembl.start();

        // The socket
        var socket = new Socket();
        Assembl.commands.setHandler('socket:open', function () {
            $('#onlinedot').addClass('is-online');
        });
        Assembl.commands.setHandler('socket:close', function () {
            $('#onlinedot').removeClass('is-online');
        });

        //Probably not the right way, but I don't know how to make the Ctx accessible
        //to the header
        window.Ctx = Ctx;

    });
