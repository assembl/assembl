define(['jquery', 'underscore', 'ckeditor', 'moment', 'i18n', 'zeroclipboard', 'types', 'permissions'],
function($, _, ckeditor, Moment, i18n, ZeroClipboard, Types, Permissions){
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
         * Ckeditor default configuration
         * @type {object}
         */
        CKEDITOR_CONFIG: {
            toolbar: [  ['Bold', 'Italic', 'Outdent', 'Indent', 'NumberedList', 'BulletedList'] ],
            extraPlugins: 'sharedspace',
            removePlugins: 'floatingspace,resize',
            sharedSpaces: { top: 'ckeditor-toptoolbar', bottom: 'ckeditor-bottomtoolbar' }
        },

        AVAILABLE_MESSAGE_VIEW_STYLES: {
            TITLE_ONLY: {id: "viewStyleTitleOnly",
                label: i18n._('Titles only')
            },
            PREVIEW: {id: "viewStylePreview",
                label: i18n._('Show preview')
            },
            FULL_BODY: {id: "viewStyleFullBody",
                label: i18n._('Complete text')
            }
        },
        
        /**
         * get a view style definition by id
         * @param {messageViewStyle.id}
         * @return {messageViewStyle or undefined}
         */
        getMessageViewStyleDefById: function(messageViewStyleId){
            var retval = _.find(this.AVAILABLE_MESSAGE_VIEW_STYLES, function(messageViewStyle){ return messageViewStyle.id == messageViewStyleId; });
            return retval;
        },
        /**
         * Prefix used to generate the id of the element used by annotator to find it's annotation
         * @type {string}
         */
        ANNOTATOR_MESSAGE_BODY_ID_PREFIX: "message-body-",
        
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
         * Formats the given to the generic api url
         * @param {string} id The class name used in the api
         * @return {string} The url formatted
         *
         * ex: 'local:Extract/1' -> '/api/v1/discussion/1/generic/Extract/1'
         */
        getGenericApiUrl: function(id){
            var url = '/api/v1/discussion/' + DISCUSSION_ID + '/generic/';
            return id.replace('local:', url);
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

            app.addPanelToStorage(panel.el.id);

            if( panel.button ) {

                panel.button.parent().addClass('is-activated');
            }
            app.trigger("panel:open", [panel]);
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
            
            app.removePanelFromStorage(panel.el.id);

            if( panel.button ) {
                panel.button.parent().removeClass('is-activated');
            }
            app.trigger("panel:close", [panel]);
        },

        /**
         * @return {Object} The Object with all panels in the localStorage
         */
        getPanelsFromStorage: function(){
            var panels = JSON.parse(localStorage.getItem('panels')) || {};
            return panels;
        },

        /**
         * Adds a panel in the localStoage
         * @param {string} panelId
         * @return {Object} The current object
         */
        addPanelToStorage: function(panelId){
            var panels = app.getPanelsFromStorage();
            panels[panelId] = 'open';
            localStorage.setItem('panels', JSON.stringify(panels));

            return panels;
        },

        /**
         * Remove a panel from the localStorage by its id
         * @param  {string} panelId
         * @return {Object} The remaining panels
         */
        removePanelFromStorage: function(panelId){
            var panels = app.getPanelsFromStorage();
            delete panels[panelId];
            localStorage.setItem('panels', JSON.stringify(panels));

            return panels;
        },

        /**
         * @return {Object} The Object with mesagelistconfig in the localStorage
         */
        getMessageListConfigFromStorage: function(){
            var messageListConfig = JSON.parse(localStorage.getItem('messageListConfig')) || {};
            return messageListConfig;
        },

        /**
         * Adds a panel in the localStorage
         * @param {Object} The Object with mesagelistconfig in the localStorage
         * @return {Object} The Object with mesagelistconfig in the localStorage
         */
        setMessageListConfigToStorage: function(messageListConfig){
            localStorage.setItem('messageListConfig', JSON.stringify(messageListConfig));
            return messageListConfig;
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

            if( segment ){
                delete segment.attributes.highlights;
            }

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
         * @return {Annotation}
         */
        getDraggedAnnotation: function(){
            var annotation = app.draggedAnnotation;
            app.draggedAnnotation = null;

            return annotation;
        },

        /**
         * fulfill app.currentUser
         */
        loadCurrentUser: function(){
            if( app.users ){
                app.currentUser = app.users.getByNumericId(CURRENT_USER_ID) || app.users.getUnknownUser();
                app.currentUser.fetchPermissionsFromScripTag();
                app.loadCsrfToken(true);
                app.trigger('user:loaded', [app.getCurrentUser()]);
            }
        },

        /**
         * @return {User}
         */
        getCurrentUser: function(){
            return app.currentUser || app.users.getUnknownUser();
        },

        /**
         * fallback: synchronously load app.csrfToken
         */
        loadCsrfToken: function(async){
            $.ajax('/api/v1/token', {
                async: async,
                dataType: 'text',
                success: function(data) {
                    app.csrfToken = data;
                }
            });
            return app.csrfToken;
        },

        /**
         * @return {User}
         */
        getCsrfToken: function(){
            return app.csrfToken || app.loadCsrfToken(false);
        },

        /**
         * Return the Post related to the given annotation
         * @param {Annotation} annotation
         * @return {Message}
         */
        getPostFromAnnotation: function(annotation){
            var span = $(annotation.highlights[0]),
                messageId = span.closest('[id^="'+this.ANNOTATOR_MESSAGE_BODY_ID_PREFIX+'"]').attr('id');

            return app.messageList.messages.get(messageId.substr(this.ANNOTATOR_MESSAGE_BODY_ID_PREFIX.length));
        },


        /**
         * Saves the current annotation if there is any
         */
        saveCurrentAnnotation: function(){
            if( app.currentUser.can(Permissions.EDIT_EXTRACT) &&
                app.messageList.annotatorEditor ){
                app.messageList.annotatorEditor.element.find('.annotator-save').click();
            }
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
            if( ev.originalEvent ){
                ev = ev.originalEvent;
            }

            if( app.dragbox === null ){
                app.dragbox = document.createElement('div');
                app.dragbox.className = 'dragbox';
                app.dragbox.setAttribute('hidden', 'hidden');

                app.body.append(app.dragbox);
            }

            app.dragbox.removeAttribute('hidden');

            text = text || i18n.gettext('Extract');

            if( text.length > DRAGBOX_MAX_LENGTH ){
                text = text.substring(0, DRAGBOX_MAX_LENGTH) + '...';
            }
            app.dragbox.innerHTML = text;

            if( ev.dataTransfer ) {
                ev.dataTransfer.dropEffect = 'all';
                ev.dataTransfer.effectAllowed = 'copy';
                ev.dataTransfer.setData("text/plain", text);
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
         * Capitalize the first letter of the string
         * @param {string} str
         * @return {string}
         */
        capitalize: function(str){
            return str.charAt(0).toUpperCase() + str.slice(1);
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

            if( date === null ){
                return '';
            }

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
            if (idea != this.getCurrentIdea()) {
                app.trigger('idea:select', [idea]);
            }
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
            var id = idea.getId();
            return app.segmentList && app.segmentList.segments ? app.segmentList.segments.where({idIdea:id}) : [];
        },

        /**
         * Returns the order number for a new root idea
         * @return {Number}
         */
        getOrderForNewRootIdea: function(){
            var lastIdea = app.ideaList.ideas.last();
            return lastIdea ? lastIdea.get('order') + 1 : 0;
        },

        /**
         * Returns the collection from the giving object's @type .
         * @param {BaseModel} item
         * @param {String} [type=item['@type']] The model type
         * @return {BaseCollection}
         */
        getCollectionByType: function(item, type){
            type = type || item['@type'];

            switch(type){
                case Types.EXTRACT:
                    return app.segmentList.segments;

                case Types.IDEA:
                case Types.ROOT_IDEA:
                    return app.ideaList.ideas;

                case Types.POST:
                case Types.ASSEMBL_POST:
                case Types.SYNTHESIS_POST:
                case Types.IMPORTED_POST:
                case Types.EMAIL:
                    return app.messageList.messages;

                case Types.USER:
                    return app.users;
            }

            return null;
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
                app.ideaPanel.showSegment(segment);
            } else {
                // It is in the segmentList
                app.segmentList.showSegment(segment);
            }
        },

        /**
         * Shows the segment source in the better way related to the source
         * e.g.: If it is an email, opens it, if it is a webpage, open in another window ...
         * @param {Segment} segment
         */
        showTargetBySegment: function(segment){
            var target = segment.get('target');
            
            switch(target['@type']){
                case 'Webpage':
                    window.open(target.url, "_blank");
                    break;

                default:
                    // This will treat:
                    // ['Email', 'Post', 'AssemblPost', 'SynthesisPost', 'ImportedPost']

                    var selector = app.format('[data-annotation-id="{0}"]', segment.id);
                    app.messageList.showMessageById(segment.get('idPost'), function(){
                        $(selector).highlight();
                    });
                    break;
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
         * Given the string in the format "local:ModelName/{id}" returns the id
         * @param  {String} str
         * @return {String}
         */
        extractId: function(str){
            return str.split('/')[1];
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
         * Returns a fancy date (ex: a few seconds ago) 
         * @return {String}
         */
        getDateFormated: function(date){
            var momentDate = moment(date);
            return momentDate ? momentDate.fromNow() : momentDate;
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

        setLocale: function(locale){
            document.cookie = "_LOCALE_="+locale+"; path=/";
            location.reload(true);
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
                title: function() { return this.getAttribute('data-tooltip'); },
                opacity: 0.95
            });
        },

        /**
         * @init
         */
        initClipboard: function(){
            if( ! app.clipboard ){
                ZeroClipboard.setDefaults( { moviePath: '/static/js/bower/zeroclipboard/ZeroClipboard.swf' } );
                app.clipboard = new ZeroClipboard();
                app.clipboard.on('complete', function(client, args){
                    // Nothing to do, nowhere to go uouuu ...
                });

                app.clipboard.on('mouseover', function(client, args){
                    $(this).trigger('mouseover');
                });

                app.clipboard.on('mouseout', function(client, args){
                    $(this).trigger('mouseout');
                });
            }

            $('[data-copy-text]').each(function(i, el){
                var text = el.getAttribute('data-copy-text');
                text = app.format('{0}//{1}/{2}{3}', location.protocol, location.host, DISCUSSION_SLUG, text);
                el.removeAttribute('data-copy-text');

                el.setAttribute('data-clipboard-text', text);
                app.clipboard.glue(el);
            });
        },

        /**
         * @init
         * inits ALL app components
         */
        init: function(){
            app.loadCurrentUser();

            app.body.removeClass('preload');
            app.createSelectionTooltip();
            app.initTooltips();

            app.doc.on('click', '.dropdown-label', app.onDropdownClick);
            app.doc.on('ajaxError', app.onAjaxError);

            app.on('render', function(){
                app.cleanTooltips();
                window.setTimeout(app.initTooltips, 500);
            });
        }
    };

    return window.app;
});
