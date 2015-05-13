requirejs.config(requirejs_config);

require(["app", "common/context", "jquery", "router", "utils/socket", "dropdown"],
    function (Assembl, Ctx, $, Router, Socket) {
        'use strict';
        if (raven_url.length) {
            require(['raven', 'raven.console', 'raven.backbone', 'raven.require'],
                function (raven, rc, rb, rr) {
                    raven.config(raven_url).install();
                    raven.setUserContext({id: Ctx.getCurrentUserId()});
                });
        }
        else {
          //Disables raven for development
          require(['raven'],
              function (raven) {
                  raven.config(false);
                  raven.debug=false;
              });
        }

        var router = new Router();

        Assembl.start();

        // The socket
        var socket = new Socket();

        //Probably not the right way, but I don't know how to make the Ctx accessible
        //to the header
        window.Ctx = Ctx;

        /**
         * TODO: write doc
         * */
        window.AssemblDebug = require("debug");
        AssemblDebug.disable();

        window.addEventListener("unhandledrejection", function(e) {
            // NOTE: e.preventDefault() must be manually called to prevent the default
            // action which is currently to log the stack trace to console.warn
            e.preventDefault();
            // NOTE: parameters are properties of the event detail property
            var reason = e.detail.reason;
            var promise = e.detail.promise;
            // See Promise.onPossiblyUnhandledRejection for parameter documentation
        });

        window.addEventListener("rejectionhandled", function(e) {
            // NOTE: e.preventDefault() must be manually called prevent the default
            // action which is currently unset (but might be set to something in the future)
            e.preventDefault();
            // NOTE: parameters are properties of the event detail property
            var promise = e.detail.promise;
            // See Promise.onUnhandledRejectionHandled for parameter documentation
        });

    });
