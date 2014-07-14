define(['jquery', 'underscore', 'ckeditor', 'moment', 'moment_lang', 'i18n', 'zeroclipboard', 'types', 'permissions'],
    function($, _, ckeditor, Moment, MomentLang, i18n, ZeroClipboard, Types, Permissions){
    'use strict';

    ckeditor.disableAutoInline = true;

    var PANEL_QUANTITY = 'data-panel-qty',
        CONTEXT_MENU_WIDTH = 150,
        DRAGBOX_MAX_LENGTH = 25,
        DISCUSSION_SLUG = $('#discussion-slug').val(),
        DISCUSSION_ID = $('#discussion-id').val(),
        SOCKET_URL = $('#socket-url').val(),
        CURRENT_USER_ID = $('#user-id').val();
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
         * Reference to the body as jQuery object
         * @type {jQuery}
         */
        doc: $(document),

        /**
         * Reference to the body as jQuery object
         * @type {jQuery}
         */
        body: $(document.body),


        /**
         * The current slug for the discussion
         * @type {String}
         */
        slug: DISCUSSION_SLUG,


        /**
         * The url for the changes websocket
         * @type {String}
         */
        socket_url: SOCKET_URL,

        /**
         * The current discussion id
         * @type {string}
         */
        discussionID: DISCUSSION_ID,

        /**
         * The a cache for posts linked by segments
         * FIXME:  Remove once lazy loading is implemented
         * @type {string}
         */
        segmentPostCache: {},
        
        /**
         * Current user
         * @type {User}
         */
        currentUser: null,

        /**
         * Csrf token
         * @type {String}
         */
        csrfToken: null,

        /**
         * Default ease for all kids of animation
         * @type {String}
         */
        ease: 'ease',

        /**
         * The date format
         * @type {String}
         */
        dateFormat: 'DD/MM/YYYY',

        /**
         * The datetime format
         * @type {string}
         */
        datetimeFormat: 'DD/MM/YYYY HH:mm:ss',

        /**
         * The time for all animations related to lateralMenu
         * @type {Number}
         */
        lateralMenuAnimationTime: 600,

        /**
         * Current dragged segment
         * @type {Segment}
         */
        draggedSegment: null,

        /**
         * Current dragged idea
         * @type {Idea}
         */
        draggedIdea: null,

        /**
         * Current dragged annotation
         * @type {Annotation}
         */
        draggedAnnotation: null,

        /**
         * The lateral menu width
         * @type {number}
         */
        lateralMenuWidth: 453,

        /**
         * The selection tooltip.
         * @type {jQuery}
         */
        selectionTooltip: null,

        /**
         * Reference to dragbox
         * @type {HTMLDivElement}
         */
        dragbox: null,

        /**
         * Qty of opened panels
         * @type {Number}
         */
        openedPanels: 0,

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
         * @param {array} args
         */
        trigger: function(eventName, args){
            if( eventName in o ){
                _.each(o[eventName], function(func){
                    func.apply(window, args);
                });
            }
        }

    };

    return window.app;
});
