define(['jquery', 'underscore', 'ckeditor', 'models/user', 'moment', 'i18n'],
function($, _, ckeditor, User, Moment, i18n){
    'use strict';

    ckeditor.disableAutoInline = true;

    var PANEL_QUANTITY = 'data-panel-qty',
        CONTEXT_MENU_WIDTH = 150,
        DRAGBOX_MAX_LENGTH = 25,
        DISCUSSION_ID = $('#discussion-id').val();

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
         * Ckeditor default configuration
         * @type {object}
         */
        CKEDITOR_CONFIG: {
            toolbar: [  ['Bold', 'Italic', 'Outdent', 'Indent', 'NumberedList', 'BulletedList'] ],
            extraPlugins: 'sharedspace',
            removePlugins: 'floatingspace,resize',
            sharedSpaces: { top: 'ckeditor-toptoolbar', bottom: 'ckeditor-bottomtoolbar' }
        },

        /**
         * The currnet discussion id
         * @type {string}
         */
        discussionID: null,

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
         * Formats the url to the current api url
         * @param  {string} url
         * @return {string} The url formatted
         */
        getApiUrl: function(url){
            if( url[0] !== '/' ){
                url = '/' + url;
            }
            return '/api/v1/discussion/' + DISCUSSION_ID + url;
        },

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
            app.body.removeClass('is-fullscreen');
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
            if( app.isInFullscreen() ){
                app.body.addClass('is-fullscreen');
            }

            panel.$el.removeClass('is-visible');
            if( panel.button ) {
                panel.button.removeClass('is-activated');
            }
        },

        /**
         * Checks if there is a panel in fullscreen mode
         * ( i.e.: there is only one open )
         * @return {Boolean}
         */
        isInFullscreen: function(){
            return app.openedPanels === 1;
        },

        /**
         * @return {Segment}
         */
        getDraggedSegment: function(){
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
            return app.currentUser || new User.Model();
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
         * @return {function} The Underscore.js _.template return
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
         * Format string function
         * @param {string} string
         * @param {string} ...
         * @return {string}
         */
        format: function(str){
            var args = [].slice.call(arguments, 1);

            return str.replace(/\{(\d+)\}/g, function(a,b){
                return typeof args[b] != 'undefined' ? args[b] : a;
            });
        },

        /**
         * Format date
         * @param {Date|timestamp} date
         * @param {string} [format=app.dateFormat] The format
         * @return {string}
         */
        formatDate: function(date, format){
            format = format || app.dateFormat;

            date = new Moment(date);
            return date.format(format);
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
         * Formats a plain text message to html
         * @param  {string} str
         * @return {string} The text formatted with HTML
         */
        formatMessageToDisplay: function(str){
            // We were having problem for anything inside < > where 
            // being traited as a tag. So, if there is an @ inside chevrons
            // we're going to translate < to &lt; and > to &gt;
            str = str.replace(/(<.+@.+\.?>)/g, function(text) {
                return text.replace('<', '&lt;').replace('>', '&gt;');
            });

            return str.trim().replace(/(\n)/gi, '<br />');
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

            // Adjusting position
            if( (x + CONTEXT_MENU_WIDTH) > (window.innerWidth - 50) ){
                x = window.innerWidth - CONTEXT_MENU_WIDTH - 10;
            }

            menu.css({'top': y, 'left': x});

            _.each(items, function(func, text){
                var item = $('<a>').addClass('contextmenu-item').text(text);
                item.on('click', func.bind(scope) );
                menu.append( item );
            });

            app.body.append( menu );
            window.setTimeout(function(){
                app.doc.on("click", app.hideContextMenu);
            });

            // Adjusting menu position
            var menuY = menu.height() + y,
                maxY = window.innerHeight - 50;

            if( menuY >= maxY ){
                menu.css({'top': maxY - menu.height() });
            }
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

            app.trigger('idea:select', [idea]);
        },

        /**
         * Get the current Idea
         * @return {Idea}
         */
        getCurrentIdea: function(){
            return app.ideaPanel.idea;
        },

        /**
         * Returns an array with all segments for the given idea
         * @param {Idea} idea
         * @return {Array<Segment>}
         */
        getSegmentsByIdea: function(idea){
            var id = idea.get('id');
            return app.segmentList && app.segmentList.segments ? app.segmentList.segments.where({idIdea:id}) : [];
        },

        /**
         * Returns the order number for a new root idea
         * @return {Number}
         */
        getOrderForNewRootIdea: function(){
            return app.ideaList.ideas.last().get('order') + 1;
        },

        /**
         * Shows the related segment from the given annotation
         * @param  {annotation} annotation
         */
        showSegmentByAnnotation: function(annotation){
            var segment = app.segmentList.segments.getByAnnotation(annotation);

            if( !segment ){
                return;
            }

            if( segment.get('idIdea') ){
                // It is in the ideaList
            } else {
                // It is in the segmentList
                app.segmentList.showSegment(segment);
            }


        },

        /**
         * Updates the order in the idea list
         */
        updateIdealistOrder: function(){
            var children = app.ideaList.ideas.where({ parentId: null }),
                currentOrder = 1;

            _.each(children, function(child){
                child.set('order', currentOrder);
                child.save();
                currentOrder += 1;
            });
        },

        /**
         * @see http://blog.snowfinch.net/post/3254029029/uuid-v4-js
         * @return {String} an uuid
         */
        createUUID: function(){
            var uuid = "", i = 0, random;

            for (; i < 32; i++) {
                random = Math.random() * 16 | 0;

                if (i == 8 || i == 12 || i == 16 || i == 20) {
                    uuid += "-";
                }

                uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
            }

            return uuid;
        },

        /**
         * @param  {Number} userID The user's ID
         * @param  {Number} [size=44] The avatar size
         * @return {String} The avatar's url formatted with the given size
         */
        formatAvatarUrl: function(userID, size){
            size = size || 44;
            return app.format("/user/id/{0}/avatar/{1}", userID, size);
        },


        /**
         * @param  {String} html
         * @return {String} The new string without html tags
         */
        stripHtml: function(html){
            return html ? $.trim( $('<div>'+html+'</div>').text() ) : html;
        },

        /**
         * Sets the given panel as fullscreen closing all other ones
         * @param {Panel} targetPanel
         */
        setFullscreen: function(targetPanel){
            var panels = [
                app.ideaList,
                app.segmentList,
                app.ideaPanel,
                app.messageList,
                app.synthesisPanel
            ];

            _.each(panels, function(panel){
                if( targetPanel !== panel ){
                    app.closePanel(panel);
                    app.body.addClass('is-fullscreen');
                }
            });

            app.setCurrentIdea(null);
        },

        /**
         * @event
         */
        onDropdownClick: function(ev){
            var dropdown = $(ev.target);

            if( !dropdown.hasClass("dropdown-label") ){
                return;
            }

            var parent = dropdown.parent();

            var onMouseLeave = function(ev){
                parent.removeClass('is-open');
            };

            if( parent.hasClass('is-open') ){
                onMouseLeave();
                return;
            }

            parent.addClass('is-open');
            app.body.one('click', onMouseLeave);
        },

        /**
         * @event
         */
        onAjaxError: function( ev, jqxhr, settings, exception ){
            var message = i18n._('ajaxerror-message');
            message = "url: " + settings.url + "\n" + message + "\n" + exception;

            alert( message );
            //window.location.reload();
        },

        /**
         * Removes all tooltips from the screen
         */
        cleanTooltips: function(){
            $('.tipsy').remove();
        },

        /**
         * Returns (yep, it doesn't actually prints) the idea formatted to be displayed
         * at the synthesis email
         * 
         * @param  {Idea} idea
         * @param  {string} email The react's email
         * @return {string}
         */
        printIdea: function(idea, email){
            var longTitle = escape(idea.getLongTitleDisplayText()),
                span = $("<span>"+idea.getLongTitleDisplayText()+"</span>"),
                children = [],
                segments = app.getSegmentsByIdea(idea),
                tmpl = app.loadTemplate('synthesisIdeaEmail'),
                authors = [];

            span.find('p:first-child').css('margin-top', 0);
            span.find('p:last-child').css('margin-bottom', 0);
            
            segments.forEach(function(segment) {
                authors.push(segment.get("source_creator").name);
            });

            _.each(idea.getSynthesisChildren(), function(child){
                children.push( app.printIdea(child) );
            });

            return tmpl({
                id: idea.get('id'),
                level: idea.getSynthesisLevel(),
                editing: idea.get('synthesisPanel-editing') || false,
                longTitle: span.html(),
                authors: _.uniq(authors),
                email: email,
                subject: longTitle,
                reactLabel: i18n.gettext('react'),
                children: children
            });
        },

        /**
         * @init
         */
        initTooltips: function(){
            // reference: http://onehackoranother.com/projects/jquery/tipsy/

            $('[data-tooltip]').tipsy({
                delayIn: 400,
                live: true,
                gravity: function(){ return this.getAttribute('data-tooltip-position') || 's'; },
                title: function() { return this.getAttribute('data-tooltip'); }
            });
        },

        /**
         * @init
         * inits ALL app components
         */
        init: function(){
            app.body.removeClass('preload');
            app.createSelectionTooltip();
            app.initTooltips();

            app.doc.on('click', '.dropdown-label', app.onDropdownClick);
            app.doc.on('ajaxError', app.onAjaxError);

            app.on('render', app.cleanTooltips);

            app.currentUser = {
                name: 'Peter Parker',
                avatarUrl: '//placehold.it/44'
            };
        }
    };

    if( typeof $.data !== "function" ){
        $.data = function(el, key, value){
            if( arguments.length === 3 ){
                // set
                return $(el).data(key, value);
            } else {
                // get
                return $(el).data(key);
            }
        };

        $.fn.stop = function(){ return this; };
    }

    return window.app;
});
