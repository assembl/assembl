define(['zepto', 'underscore', 'ckeditor'],
function($, _, ckeditor){
    'use strict';

    ckeditor.disableAutoInline = true;

    var PANEL_QUANTITY = 'data-panel-qty',
        DRAGBOX_MAX_LENGTH = 25;

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
         * @type {Zepto}
         */
        doc: $(document),

        /**
         * Reference to the body as Zepto object
         * @type {Zepto}
         */
        body: $(document.body),

        /**
         * Current user
         * @type {User}
         */
        currentUser: null,

        /**
         * Default ease for all kids of animation
         * @type {String}
         */
        ease: 'ease',

        /**
         * The date format
         * @type {String}
         */
        dateFormat: 'd/m/Y',

        /**
         * The datetime format
         * @type {string}
         */
        datetimeFormat: 'd/m/Y H:i:s',

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
         * The lateral menu width
         * @type {number}
         */
        lateralMenuWidth: 453,

        /**
         * The selection tooltip.
         * @type {Zepto}
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
         * Show or hide the given panel
         * @param  {String} panelName
         */
        togglePanel: function(panelName){
            var panel = app[panelName];
            if( panel === undefined ){
                return false;
            }

            if( panel.$el.hasClass('is-visible') ){
                app.closePanel(panel);
            } else {
                app.openPanel(panel);
            }
        },

        /**
         * Open the given panel
         * @param {backbone.View} panel 
         */
        openPanel: function(panel){
            if( panel.$el.hasClass('is-visible') ){
                return false;
            }

            app.openedPanels += 1;
            app.body.attr(PANEL_QUANTITY, app.openedPanels);
            panel.$el.addClass('is-visible');
            if( panel.button ) {
                panel.button.addClass('is-activated');
            }
        },

        /**
         * Close the given panel
         * @param {backbone.View} panel
         */
        closePanel: function(panel){
            if( ! panel.$el.hasClass('is-visible') ){
                return false;
            }

            app.openedPanels -= 1;
            app.body.attr(PANEL_QUANTITY, app.openedPanels);
            panel.$el.removeClass('is-visible');
            if( panel.button ) {
                panel.button.removeClass('is-activated');
            }
        },

        /**
         * @return {Segment}
         */
        getDraggedSegment: function(){
            if( app.draggedSegment && app.draggedSegment.collection ){
                app.draggedSegment.collection.remove(app.draggedSegment);
            }

            var segment = app.draggedSegment;
            app.draggedSegment = null;

            return segment;
        },

        /**
         * @return {Idea}
         */
        getDraggedIdea: function(){
            if( app.ideaList && app.draggedIdea ){
                app.ideaList.removeIdea(app.draggedIdea);
            }

            var idea = app.draggedIdea;
            app.draggedIdea = null;

            return idea;
        },

        /**
         * @return {User}
         */
        getCurrentUser: function(){
            return app.currentUser;
        },

        /**
         * Creates the selection tooltip
         */
        createSelectionTooltip: function(){
            app.selectionTooltip = $('<div>', { 'class': 'textbubble' } );
            app.body.append(app.selectionTooltip.hide());
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
         * @param {array} args
         */
        trigger: function(eventName, args){
            if( eventName in o ){
                _.each(o[eventName], function(func){
                    func.apply(window, args);
                });
            }
        },

        /**
         * Returns a template from an script tag
         * @param {string} id The id of the script tag
         * @return {function} The _.template return
         */
        loadTemplate: function(id){
            return _.template( $('#tmpl-'+id).html() );
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
         * Shows the dragbox when user starts dragging an element
         * @param  {Event} ev The event object
         * @param  {String} text The text to be shown in the .dragbox
         */
        showDragbox: function(ev, text){
            if( app.dragbox === null ){
                app.dragbox = document.createElement('div');
                app.dragbox.className = 'dragbox';
                app.dragbox.setAttribute('hidden', 'hidden');

                app.body.append(app.dragbox);
            }

            app.dragbox.removeAttribute('hidden');

            if( text.length > DRAGBOX_MAX_LENGTH ){
                text = text.substring(0, DRAGBOX_MAX_LENGTH) + '...';
            }
            app.dragbox.innerHTML = text;

            if( ev.dataTransfer ) {
                ev.dataTransfer.effectAllowed = 'copy';
                ev.dataTransfer.setData("Text", text);
                ev.dataTransfer.setDragImage(app.dragbox, 10, 10);
            }

            $(ev.currentTarget).one("dragend", function(){
                app.dragbox.setAttribute('hidden', 'hidden');
            });
        },

        /**
         * Return the current time
         * @return {timestamp}
         */
        getCurrentTime: function(){
            return (new Date()).getTime();
        },

        /**
         * Format date
         * @param {Date|timestamp} date
         * @param {string} [format=app.dateFormat] The format
         * @return {string}
         */
        formatDate: function(date, format){
            format = format || app.dateFormat;

            if( ! _.isDate(date) ){
                date = new Date(date);
            }

            var addZeroIfNecessary = function(value){
                return value < 10 ? '0' + value : value;
            };

            var dateObject = {
                'd': 'getDate',
                'm': 'getMonth',
                'y': 'getFullYear',
                'Y': 'getFullYear',
                'H': 'getHours',
                'i': 'getMinutes',
                's': 'getSeconds'
            };

            return format.replace(/\w/g, function(letter, pos){
                return (letter in dateObject) ? addZeroIfNecessary(date[dateObject[letter]]()) : letter;
            });
        },

        /**
         * Format date time
         * @param {Date|timestamp} date
         * @param {String} [format=app.datetimeFormat] The format
         * @return {string}
         */
        formatDatetime: function(date, format){
            return app.formatDate(date, format || app.datetimeFormat);
        },

        /**
         * Shows the context menu given the options
         * @param {Number} x 
         * @param {Number} y 
         * @param {Object} scope The scope where the functions will be executed
         * @param {Object<string:function>} items The items on the context menu
         */
        showContextMenu: function(x, y, scope, items){
            app.hideContextMenu();

            var menu = $('<div>').addClass('contextmenu');
            menu.css({'top': y, 'left': x});

            _.each(items, function(func, text){
                var item = $('<a>').addClass('contextmenu-item').text(text);
                item.on('click', func.bind(scope) );
                menu.append( item );
            });

            app.body.append( menu );
            app.doc.on("click", app.hideContextMenu);
        },

        /**
         * Removes all .contextmenu on the page
         * @param {Event} [ev=null] If given, checks to see if it was clicked outside
         */
        hideContextMenu: function(ev){
            if( ev && ev.target.classList.contains('contextmenu')){
                return;
            }

            $('.contextmenu').remove();
            app.doc.off('click', app.hideContextMenu);
        },

        /**
         * Set the given Idea as the current one to be edited
         * @param  {Idea} [idea]
         */
        setCurrentIdea: function(idea){
            if( app.ideaPanel && app.ideaPanel.idea !== null ){
                app.ideaPanel.idea.set('isSelected', false);
            }

            if( idea !== null ){
                idea.set('isSelected', true);
                app.openPanel(app.ideaPanel);
            } else {
                app.closePanel(app.ideaPanel);
            }

            app.ideaPanel.setCurrentIdea(idea);
        },

        /**
         * Get the current Idea
         * @return {Idea}
         */
        getCurrentIdea: function(){
            return app.ideaPanel.idea;
        },

        /**
         * @init
         * inits ALL app components
         */
        init: function(){
            app.body.removeClass('preload');
            app.createSelectionTooltip();
        }
    };

    return window.app;
});
