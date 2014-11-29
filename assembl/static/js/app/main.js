requirejs.config(requirejs_config);

require(["app", "common/context", "jquery", "router", "utils/socket"],
    function (Assembl, Ctx, $, Router, Socket) {
        'use strict';
        if (raven_url.length) {
            require(['raven', 'raven.console', 'raven.backbone', 'raven.require'],
            function(raven, rc, rb, rr) {
                raven.config(raven_url).install();    
            });
        }

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
