define(['jquery', 'underscore'], function($, _){
    'use strict';

    /** Constants */
    var DATA_HEIGHT = 'data-accordion-height';

    /** Reference to lateralmenu-button */
    var lateralMenuButton = $('#lateralmenu-button'),
        lateralMenuModal = $('.lateralmenu-modal');

    /**
     * @event
     */
    function onHeaderClick(ev){
        var area = $(ev.currentTarget).parent();

        if( area.hasClass('is-open') ){
            app.closeArea( area );
        } else {
            app.openArea( area );
        }

    }

    /**
     * Closes all open areas
     */
    function closeAllAreas(){
        $('.accordion-area.is-open').each(function(i, el){
            app.closeArea($(el));
        });
    }


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
         * Open a closed area
         * @param  {jQuery} area
         */
        openArea: function(area){
            closeAllAreas();

            var body = area.find('.accordion-body');
                //height = this.getBodyHeight(body);

            area.addClass('is-open');
            //body.css('height', height);
        },

        /**
         * Closes an open area
         * @param  {jQuery} area
         */
        closeArea: function(area){
            area
                .removeClass('is-open');
                /*
                .find('.accordion-body')
                .css('max-height', '0px');
                */
        },

        /**
         * Returns the height of the given .accordion-body
         * @param  {jQuery} body
         * @return {Number}
         */
        getBodyHeight: function(body){
            var height = null; //body.attr(DATA_HEIGHT);

            if( height === null ){

                body.css({
                    position: 'absolute',
                    height: 'auto',
                    visibility: 'hidden'
                });

                height = body.height();

                body
                    .css({
                        position: 'static',
                        height: '0px',
                        overflow: 'hidden',
                        visibility: 'visible'
                    })
                    .attr(DATA_HEIGHT, height+'px');
            }

            return height;
        },

        /**
         * Returns a template from an script tag
         * @param {string} id The id of the script tag
         * @return {function} The _.template return
         */
        loadTemplate: function(id){
            return _.template($('#tmpl-'+id).html());
        },


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

            $('.accordion-header', scope).on('click', onHeaderClick);

            app.body.removeClass( 'preload' );
        }
    };

    return window.app = app;
});
