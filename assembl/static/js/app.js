define(['jquery', 'collections/emails'], function($, Emails){
    'use strict';

    /** Reference to lateralmenu-button */
    var lateralMenuButton = $('#lateralmenu-button'),
        lateralMenuModal = $('.lateralmenu-modal');

    var app = {
        /**
         * Zepto or jQuery.
         * The winner
         * @type {Object}
         */
        $: $,

        /**
         * Reference to the body as Zepto object
         * @type {Zepto}
         */
        body: $(document.body),

        /**
         * @init
         * inits ALL app components
         */
        init: function(scope){

            lateralMenuButton.click(function(ev){
                app.body.toggleClass( 'is-lateralmenu-open' );
            });

            lateralMenuModal.on('click', function(){
                lateralMenuButton.trigger('click');
            });

            app.body.removeClass( 'preload' );
        }
    };

    app.init();

    return app;
});
