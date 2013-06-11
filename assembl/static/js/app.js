define(['jquery', 'underscore', 'models/email'],
function($, _, Email, Inbox){
    'use strict';

    /**
     * The observer
     * Who watches the watchmen ?
     * @type {Object}
     */
    var o = {};

    /**
     * @class app
     * The most important object in the world.
     * @type {App}
     */
    window.app = {
        /**
         * Reference to the body as Zepto object
         * @type {jQuery}
         */
        body: $(document.body),

        /**
         * Default ease for all kids of animation
         * @type {String}
         */
        ease: 'ease',

        /**
         * The time for all animations related to lateralMenu
         * @type {Number}
         */
        lateralMenuAnimationTime: 600,

        /**
         * The time for all animations related to bucket
         * @type {Number}
         */
        bucketAnimationTime: 600,

        /**
         * The lateral menu width
         * @type {number}
         */
        lateralMenuWidth: 453,

        /**
         * The bucket min width when collapsed
         * @type {Number}
         */
        bucketMinWidth: 15,

        /**
         * Default width for bucket when it is open
         * @type {Number}
         */
        bucketDefaultOpenWidth: 300,

        /**
         * The selection tooltip.
         * @type {jQuery}
         */
        selectionTooltip: null,

        /**
         * Creates the selection tooltip
         */
        createSelectionTooltip: function(){
            app.selectionTooltip = $('<div>', { 'class': 'textbubble' } );
            app.body.append(app.selectionTooltip.hide());
            //div.on('click', addToBucket);
        },

        /**
         * Subscribe an event
         * @param {string} eventName
         * @param {function} eventFunction
         */
        on: function(eventName, eventFunction){
            if( ! (eventName in o) ){
                o[eventName] = [];
            }

            if( _.isFunction(eventFunction) ){
                o[eventName].push(eventFunction);
            }
        },

        /**
         * Unsubscribe an event
         * @param  {string} eventName
         * @param  {function} eventFunction
         */
        off: function(eventName, eventFunction){
            if( eventName in o ){
                if( _.isFunction(eventFunction) ){
                    o[eventName] = _.without(o[eventName], eventFunction);
                } else {
                    o[eventName] = [];
                }
            }
        },

        /**
         * Triggers an event
         * @param {string} eventName
         */
        trigger: function(eventName){
            if( eventName in o ){
                _.each(o[eventName], function(func){ func(); });
            }
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
         * Return the select text on the document
         * @return {Selection}
         */
        getSelectedText: function(){
            if( document.getSelection ){
                return document.getSelection();
            } else if( window.getSelection ){
                return window.getSelection();
            } else {
                var selection = document.selection && document.selection.createRange();
                return selection.text ? selection.text : false;
            }
        },

        /**
         * @init
         * inits ALL app components
         */
        init: function(){
            app.body.removeClass( 'preload' );
            app.createSelectionTooltip();
        }
    };

    return window.app;
});
