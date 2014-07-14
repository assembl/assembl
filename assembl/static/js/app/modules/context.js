'use strict';

define(function(require){

     var Assembl = require('modules/assembl'),
               $ = require('jquery'),
           Types = require('utils/types'),
     Permissions = require('utils/permissions'),
         Moment  = require('moment'),
    Zeroclipboard =  require('zeroclipboard');

    var Context = function(){

        this.DISCUSSION_SLUG = $('#discussion-slug').val();
        this.DISCUSSION_ID   = $('#discussion-id').val();
        this.SOCKET_URL      = $('#socket-url').val();
        this.CURRENT_USER_ID = $('#user-id').val();
        /**
         * Send debugging output to console.log to observe when views render
         * @type {boolean}
         */
        this.debugRender = false;

        /**
         * Send debugging output to console.log to observe socket input
         * @type {boolean}
         */
        this.debugSocket = false;

        /**
         * Reference to the body as jQuery object
         * @type {jQuery}
         */
        this.doc = $(document);

        /**
         * Reference to the body as jQuery object
         * @type {jQuery}
         */
         this.body = $(document.body);

        /**
         * Prefix used to generate the id of the element used by annotator to find it's annotation
         * @type {string}
         */
         this.ANNOTATOR_MESSAGE_BODY_ID_PREFIX = "message-body-";

        /**
         * The a cache for posts linked by segments
         * FIXME:  Remove once lazy loading is implemented
         * @type {string}
         */
         this.segmentPostCache = {};

        /**
         * Current user
         * @type {User}
         */
        this.currentUser = null;

        /**
         * Csrf token
         * @type {String}
         */
        this.csrfToken = null;

        /**
         * Default ease for all kids of animation
         * @type {String}
         */
        this.ease = 'ease';

        /**
         * The date format
         * @type {String}
         */
        this.dateFormat = 'DD/MM/YYYY';

        /**
         * The datetime format
         * @type {string}
         */
        this.datetimeFormat = 'DD/MM/YYYY HH:mm:ss';

        /**
         * Current dragged segment
         * @type {Segment}
         */
        this.draggedSegment = null;

        /**
         * Current dragged idea
         * @type {Idea}
         */
        this.draggedIdea = null;

        /**
         * Current dragged annotation
         * @type {Annotation}
         */
         this.draggedAnnotation = null;

        /**
         * The selection tooltip.
         * @type {jQuery}
         */
         this.selectionTooltip = null;

        /**
         * Reference to dragbox
         * @type {HTMLDivElement}
         */
         this.dragbox = null;

        /**
         * Qty of opened panels
         * @type {Number}
         */
         this.openedPanels = 0;


         this.AVAILABLE_MESSAGE_VIEW_STYLES = {
            TITLE_ONLY: {
                id: "viewStyleTitleOnly",
                label: i18n.gettext('Message titles')
            },
            PREVIEW: {
                id: "viewStylePreview",
                label: i18n.gettext('Message previews')
            },
            FULL_BODY: {
                id: "viewStyleFullBody",
                label: i18n.gettext('Complete messages')
            }
        }

        this.init();
    }

    Context.prototype = {
        /**
         * The current slug for the discussion
         * @type {String}
         */
        getDiscussionSlug: function(){
            return this.DISCUSSION_SLUG;
        },

        /**
         * The url for the changes websocket
         * @type {String}
         */
        getSocketUrl: function(){
            return this.SOCKET_URL;
        },

        /**
         * The current discussion id
         * @type {string}
         */
        getDiscussionId: function(){
            return this.DISCUSSION_ID;
        },

        /**
         * @return {User_id}
         */
        getCurrentUserId: function(){
            return this.CURRENT_USER_ID;
        },

        /**
         * @return {User}
         */
        getCurrentUser: function(){
            return this.currentUser;
        },

        /**
         * @set {User}
         */
        setCurrentUser: function(user){
            this.currentUser = user;
        },


        /**
         * @return {User}
         */
        getCsrfToken: function(){
            return this.csrfToken || this.loadCsrfToken(false);
        },

        /**
         * @set {User}
         */
        setCsrfToken: function(token){
           this.csrfToken = token;
        },

        /**
         * @return {Annotation}
         */
        getDraggedAnnotation: function(){
            return this.draggedAnnotation = null;
        },
        /**
         * @return {Annotation}
         */
        setDraggedAnnotation: function(annotation){
            this.draggedAnnotation = annotation;
        },

        /**
         * Returns a template from an script tag
         * @param {string} id The id of the script tag
         * @return {function} The Underscore.js _.template return
         */
        loadTemplate: function(id){
            var template = _.template( $('#tmpl-'+id).html() );
            return template;
        },

        /**
         * get a view style definition by id
         * @param {messageViewStyle.id}
         * @return {messageViewStyle or undefined}
         */
        getMessageViewStyleDefById: function(messageViewStyleId){
            return  _.find(this.AVAILABLE_MESSAGE_VIEW_STYLES, function(messageViewStyle){ return messageViewStyle.id == messageViewStyleId; });
        },

        /**
         * Formats the url to the current api url
         * @param  {string} url
         * @return {string} The url formatted
         */
        getApiUrl: function(url){
            if( url[0] !== '/' ){
                url = '/' + url;
            }
            return '/api/v1/discussion/' + this.getDiscussionId() + url;
        },

        /**
         * Formats the given to the generic api url
         * @param {string} id The class name used in the api
         * @return {string} The url formatted
         *
         * ex: 'local:Extract/1' -> '/api/v1/discussion/1/generic/Extract/1'
         */
        getGenericApiUrl: function(id){
            var url = '/api/v1/discussion/' + this.getDiscussionId() + '/generic/';
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
                this.closePanel(panel);
            } else {
                this.openPanel(panel);
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

            this.openedPanels += 1;
            this.body.attr('data-panel-qty', this.openedPanels);
            this.body.removeClass('is-fullscreen');
            panel.$el.addClass('is-visible');

            this.addPanelToStorage(panel.el.id);

            if( panel.button ) {
                panel.button.addClass('active');
            }
            Assembl.vent.trigger("panel:open", [panel]);
        },

        /**
         * Close the given panel
         * @param {backbone.View} panel
         */
        closePanel: function(panel){
            if( ! panel.$el.hasClass('is-visible') ){
                return false;
            }

            this.openedPanels -= 1;
            this.body.attr('data-panel-qty', this.openedPanels);
            if( this.isInFullscreen() ){
                this.body.addClass('is-fullscreen');
            }

            panel.$el.removeClass('is-visible');

            this.removePanelFromStorage(panel.el.id);

            if( panel.button ) {
                panel.button.removeClass('active');
            }
            Assembl.vent.trigger("panel:close", [panel]);
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
            var panels = this.getPanelsFromStorage();
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
            var panels = this.getPanelsFromStorage();
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
            return this.openedPanels === 1;
        },

        /**
         * @return {Segment}
         */
        getDraggedSegment: function(){
            var segment = this.draggedSegment;
            this.draggedSegment = null;

            if( segment ){
                delete segment.attributes.highlights;
            }

            return segment;
        },

        /**
         * @return {Idea}
         */
        getDraggedIdea: function(){
            if( this.ideaList && this.draggedIdea ){
                app.ideaList.removeIdea(this.draggedIdea);
            }

            var idea = this.draggedIdea;
            this.draggedIdea = null;

            return idea;
        },

        /**
         * fallback: synchronously load app.csrfToken
         */
        loadCsrfToken: function(async){
            var that = this;
            $.ajax('/api/v1/token', {
                async: async,
                dataType: 'text',
                success: function(data) {
                    that.csrfToken = data;
                }
            });
            return this.csrfToken;
        },

        /**
         * fulfill app.currentUser
         */
        loadCurrentUser: function(){
            var ctx = new Context();
            if( assembl.users ){
                var user = assembl.users.getByNumericId(this.getCurrentUserId()) || assembl.users.getUnknownUser();
                    user.fetchPermissionsFromScripTag();
                this.setCurrentUser(user);
                this.loadCsrfToken(true);
            }
        },

        /**
         * Return the Post related to the given annotation
         * @param {Annotation} annotation
         * @return {Message}
         */
        getPostFromAnnotation: function(annotation){
            var span = $(annotation.highlights[0]),
                messageId = span.closest('[id^="'+this.ANNOTATOR_MESSAGE_BODY_ID_PREFIX+'"]').attr('id');

            return assembl.messageList.messages.get(messageId.substr(this.ANNOTATOR_MESSAGE_BODY_ID_PREFIX.length));
        },

        /**
         * Saves the current annotation if there is any
         */
        saveCurrentAnnotationAsExtract: function(){
            var ctx = new Context();
            if( ctx.getCurrentUser().can(Permissions.EDIT_EXTRACT) &&
                assembl.messageList.annotatorEditor ){
                assembl.messageList.annotatorEditor.element.find('.annotator-save').click();
            }
        },

        /**
         * Creates the selection tooltip
         */
        createSelectionTooltip: function(){
            this.selectionTooltip = $('<div>', { 'class': 'textbubble' } );
            this.body.append(this.selectionTooltip.hide());
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

            var dragbox_max_length = 25;

            if( ev.originalEvent ){
                ev = ev.originalEvent;
            }

            if( this.dragbox === null ){
                this.dragbox = document.createElement('div');
                this.dragbox.className = 'dragbox';
                this.dragbox.setAttribute('hidden', 'hidden');

                this.body.append(this.dragbox);
            }

            this.dragbox.removeAttribute('hidden');

            text = text || i18n.gettext('Extract');

            if( text.length > dragbox_max_length ){
                text = text.substring(0, dragbox_max_length) + '...';
            }
            this.dragbox.innerHTML = text;

            if( ev.dataTransfer ) {
                ev.dataTransfer.dropEffect = 'all';
                ev.dataTransfer.effectAllowed = 'copy';
                ev.dataTransfer.setData("text/plain", text);
                ev.dataTransfer.setDragImage(this.dragbox, 10, 10);
            }

            $(ev.currentTarget).one("dragend", function(){
                this.dragbox.setAttribute('hidden', 'hidden');
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
            format = format || this.dateFormat;

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
            return this.formatDate(date, format || this.datetimeFormat);
        },

        /**
         * Shows the context menu given the options
         * @param {Number} x
         * @param {Number} y
         * @param {Object} scope The scope where the functions will be executed
         * @param {Object<string:function>} items The items on the context menu
         */
        showContextMenu: function(x, y, scope, items){
            var menu_width = 150;


            this.hideContextMenu();

            var menu = $('<div>').addClass('contextmenu');

            // Adjusting position
            if( (x + menu_width) > (window.innerWidth - 50) ){
                x = window.innerWidth - menu_width - 10;
            }

            menu.css({'top': y, 'left': x});

            _.each(items, function(func, text){
                var item = $('<a>').addClass('contextmenu-item').text(text);
                item.on('click', func.bind(scope) );
                menu.append( item );
            });

            this.body.append( menu );
            window.setTimeout(function(){
                this.doc.on("click", this.hideContextMenu);
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
            this.doc.off('click', this.hideContextMenu);
        },

        /**
         * Set the given Idea as the current one to be edited
         * @param  {Idea} [idea]
         */
        setCurrentIdea: function(idea){
            if (idea != this.getCurrentIdea()) {
                Assembl.vent.trigger('idea:select', idea);
            }
        },

        /**
         * Get the current Idea
         * @return {Idea}
         */
        getCurrentIdea: function(){
            return assembl.ideaPanel.model;
        },

        /**
         * Returns an array with all segments for the given idea
         * @param {Idea} idea
         * @return {Array<Segment>}
         */
        getSegmentsByIdea: function(idea){
            var id = idea.getId();
            return assembl.segmentList && assembl.segmentList.segments ? assembl.segmentList.segments.where({idIdea:id}) : [];
        },

        /**
         * Returns the order number for a new root idea
         * @return {Number}
         */
        getOrderForNewRootIdea: function(){
            var lastIdea = assembl.ideaList.ideas.last();
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
                    return assembl.segmentList.segments;

                case Types.IDEA:
                case Types.ROOT_IDEA:
                case Types.PROPOSAL:
                case Types.ISSUE:
                case Types.CRITERION:
                case Types.ARGUMENT:
                    return assembl.ideaList.ideas;

                case Types.IDEA_LINK:
                    return assembl.ideaList.ideaLinks;

                case Types.POST:
                case Types.ASSEMBL_POST:
                case Types.SYNTHESIS_POST:
                case Types.IMPORTED_POST:
                case Types.EMAIL:
                case Types.IDEA_PROPOSAL_POST:
                    return assembl.messageList.messages;

                case Types.USER:
                    return assembl.users;

                case Types.SYNTHESIS:
                    return assembl.syntheses;
            }

            return null;
        },

        /**
         * Shows the related segment from the given annotation
         * @param  {annotation} annotation
         */
        showSegmentByAnnotation: function(annotation){
            var segment = assembl.segmentList.segments.getByAnnotation(annotation);

            if( !segment ){
                return;
            }

            if( segment.get('idIdea') ){
                assembl.ideaPanel.showSegment(segment);
            } else {
                assembl.segmentList.showSegment(segment);
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

                    var selector = this.format('[data-annotation-id="{0}"]', segment.id);
                    assembl.messageList.showMessageById(segment.get('idPost'), function(){
                        $(selector).highlight();
                    });
                    break;
            }
        },

        /**
         * Updates the order in the idea list
         */
        updateIdealistOrder: function(){
            var children = assembl.ideaList.ideas.where({ parentId: null }),
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
            return this.format("/user/id/{0}/avatar/{1}", userID, size);
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
                assembl.ideaList,
                assembl.segmentList,
                assembl.ideaPanel,
                assembl.messageList,
                assembl.synthesisPanel
            ];

            _.each(panels, function(panel){
                if( targetPanel !== panel ){
                    this.closePanel(panel);
                    this.body.addClass('is-fullscreen');
                }
            });

            this.setCurrentIdea(null);
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
                ev.stopPropagation(); // so that onDropdownClick() is not called again immediately after when we click
            };

            if( parent.hasClass('is-open') ){
                onMouseLeave();
                return;
            }

            parent.addClass('is-open');
            this.body.one('click', onMouseLeave);
        },

        /**
         * @event
         */
        onAjaxError: function( ev, jqxhr, settings, exception ){
            var message = i18n.gettext('ajax error message:');
            message = "url: " + settings.url + "\n" + message + "\n" + exception;

            alert( message );
        },

        /**
         * Removes all tooltips from the screen.  Without this, active
         * tooltips (those currently displayed) will be left dangling
         * if the trigger element is removed from the dom.
         */
        cleanTooltips: function(jqueryElement){
            //console.log("cleanTooltips() called");
            //This really does need to be global.
            //Should be fast, they are at the top level and there is only
            //a few of them.  Maybe it can be more specific to be faster
            // ex: html > .tipsy I don't know jquery enough to know
            $('.tipsy').remove();
        },

        setLocale: function(locale){
            document.cookie = "_LOCALE_="+locale+"; path=/";
            location.reload(true);
        },

        /**
         * @init
         */
        initTooltips: function(jqueryElement){
            // reference: http://onehackoranother.com/projects/jquery/tipsy/
            //console.log("initTooltips() called");
            jqueryElement.find('[data-tooltip]').tipsy({
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
            if( !assembl.clipboard ){
                Zeroclipboard.setDefaults({
                    moviePath: '/static/js/bower/zeroclipboard/ZeroClipboard.swf'
                });
                assembl.clipboard = new Zeroclipboard();

                assembl.clipboard.on(assembl.clipboard, 'mouseover', function(){
                    $(this).trigger('mouseover');
                });

                assembl.clipboard.on('mouseout', function(){
                    $(this).trigger('mouseout');
                });
            }

            var that = this;
            $('[data-copy-text]').each(function(i, el){
                var text = el.getAttribute('data-copy-text');
                text = that.format('{0}//{1}/{2}{3}', location.protocol, location.host, that.getDiscussionSlug(), text);
                el.removeAttribute('data-copy-text');

                el.setAttribute('data-clipboard-text', text);
                assembl.clipboard.glue(el);
            });
        },

        /**
         * @init
         * inits ALL app components
         */
        init: function(){
            //this.loadCurrentUser();
            Moment.lang(assembl_locale);

            this.body.removeClass('preload');
            this.createSelectionTooltip();
            this.initTooltips($("body"));

            this.doc.on('click', '.dropdown-label', this.onDropdownClick);
            this.doc.on('ajaxError', this.onAjaxError);

        }
    }

    return new Context();

});