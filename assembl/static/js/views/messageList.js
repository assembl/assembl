define(['backbone', 'underscore', 'jquery', 'app', 'views/messageListItem', 'views/message', 'models/message', 'i18n'],
function(Backbone, _, $, app, MessageListItem, MessageView, Message, i18n){
    'use strict';

    /**
     * Constants
     */
    var MESSAGE_MODE = 'is-message-mode',
        NO_FILTER = '',
        SYNTHESIS_FILTER = 'synthesis';

    /**
     * @class views.MessageList
     */
    var MessageList = Backbone.View.extend({
        /**
         *  @init
         */
        initialize: function(obj){
            if( obj.button ){
                this.button = $(obj.button).on('click', app.togglePanel.bind(window, 'messageList'));
            }

            this.messages.on('reset', this.render, this);
            this.messageThread.on('reset', this.renderThread, this);

            var that = this;
            app.on('idea:select', function(idea){
                if( idea ){
                    app.openPanel(app.messageList);
                    that.loadData(idea.get('id'));
                    that.$el.addClass(MESSAGE_MODE);
                }
            });
        },

        /**
         * Flag whether it is being selected or not
         * @type {Boolean}
         */
        isSelecting: false,

        /**
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('messageList'),

        /**
         * The view's data
         * @type {Object}
         */
        data: { page: 1, rootIdeaID: 0 },

        /**
         * Default filter for the request
         * @type {String}
         */
        filters: NO_FILTER,

        /**
         * The collapse/expand flag
         * @type {Boolean}
         */
        collapsed: false,

        /**
         * The message collapse/expand flag
         * @type {Boolean}
         */
        threadCollapsed: false,

        /**
         * The collection
         * @type {MessageCollection}
         */
        messages: new Message.Collection(),

        /**
         * The current message thread
         * @type {MessageCollection}
         */
        messageThread: new Message.Collection(),

        /**
         * The panel for message thread
         * @type {jQuery}
         */
        messageThreadPanel: null,

        /**
         * The annotator reference
         * @type {Annotator}
         */
        annotator: null,

        /**
         * The render function
         * @return {views.Message}
         */
        render: function(){
            app.trigger('render');
            var list = document.createDocumentFragment(),
                messages = this.messages.getRootMessages();

            _.each(messages, function(message){
                var messageListItem = new MessageListItem({model:message});
                list.appendChild(messageListItem.render().el);
            });

            var data = {
                page: this.data.page,
                maxPage: this.data.maxPage,
                inbox: this.data.inbox,
                total: this.data.total,
                startIndex: this.data.startIndex,
                endIndex: this.data.endIndex,
                collapsed: this.collapsed,
                threadCollapsed: this.threadCollapsed
            };

            this.$el.html( this.template(data) );
            if( messages.length > 0 ){
                this.$('.idealist').append( list );
            } else {
                this.$('.idealist').append( app.format("<div class='margin'>{0}</div>", i18n.gettext('No messages')) );
            }


            this.chk = this.$('#messageList-mainchk');
            this.messageThreadPanel = this.$('#messageList-thread');

            this.renderThread();
            //this.closeThread();

            return this;
        },

        /**
         * Render the thread section
         */
        renderThread: function(){
            var list = document.createDocumentFragment(),
                messages = this.messageThread.getRootMessages();

            _.each(messages, function(message){
                var messageView = new MessageView({model:message}),
                    view = messageView.render(),
                    children = view.getRenderedChildrenInCascade();

                list.appendChild(view.el);
                _.each(children, function(child){
                    list.appendChild(child);
                });
            });

            if( messages.length > 0 ){
                this.messageThreadPanel.empty().append(list);
            } else {
                this.messageThreadPanel.empty().append( app.format("<div class='margin'>{0}</div>", i18n.gettext('No messages')) );
            }

            this.initAnnotator();
        },

        /**
         * Inits the annotator instance
         */
        initAnnotator: function(){
            this.destroyAnnotator();

            this.messageThreadPanel.annotator();
            this.annotator = this.messageThreadPanel.data('annotator');

            if( ! this.annotator ){
                return;
            }

            var annotations = this.messages.getAnnotations(),
                that = this;

            this.annotator.subscribe('annotationsLoaded', function(annotations){
                _.each(annotations, function(annotation){
                    
                    var highlights = annotation.highlights,
                        func = app.showSegmentByAnnotation.bind(window, annotation);

                    _.each(highlights, function(highlight){
                        highlight.setAttribute('data-annotation-id', annotation.id);
                        $(highlight).on('click', func);
                    });

                });
            });

            this.annotator.subscribe('annotationCreated', function(annotation){
                var segment = app.segmentList.addAnnotationAsSegment( annotation, app.currentAnnotationIdIdea );

                if( !segment.isValid() ){
                    annotator.deleteAnnotation(annotation);
                } else if( app.currentAnnotationIdea ){
                    app.currentAnnotationIdea.addSegmentAsChild(segment);
                }

                app.currentAnnotationIdea = null
                app.currentAnnotationIdIdea = null;
            });

            this.annotator.subscribe('annotationEditorShown', function(editor, annotation){
                app.body.append(editor.element);
                var save = $(editor.element).find(".annotator-save");
                save.text(i18n.gettext('Send to clipboard'));
                var textarea = editor.fields[0].element.firstChild,
                    div = $('<div>', { 'draggable': true, 'class': 'annotator-textarea' });

                div.html(annotation.quote);

                div.on('dragstart', function(ev){
                    app.showDragbox(ev, annotation.quote);
                    app.draggedAnnotation = annotation;
                });

                div.on('dragend', function(ev){
                    app.draggedAnnotation = null;
                });

                $(textarea).replaceWith(div);
                if( $(editor.element).find(".annotator-draganddrop-help").length == 0 ) {
                    $(editor.element).find(".annotator-textarea").after("<div class='annotator-draganddrop-help'>" + i18n.gettext('You can drag the segment above directly to the table of ideas') + "</div>");
                }
                that.annotatorEditor = editor;
            });

            this.annotator.subscribe('annotationViewerShown', function(viewer, annotation){
                // We do not need the annotator's tooltip
                viewer.hide();
            });

            // Loading the annotations
            if( annotations.length ){
                setTimeout(function(){
                    that.annotator.loadAnnotations( annotations ); 
                }, 10);
            }

        },


        /**
         * destroy the current annotator instance and remove all listeners
         */
        destroyAnnotator: function(){
            if( !this.annotator ){
                return;
            }

            this.annotator.unsubscribe('annotationsLoaded');
            this.annotator.unsubscribe('annotationCreated');
            this.annotator.unsubscribe('annotationEditorShown');
            this.annotator.unsubscribe('annotationViewerShown');

            this.annotator.destroy();
        },

        /**
         * Blocks the panel
         */
        blockPanel: function(){
            this.$('.panel').addClass('is-loading');
        },

        /**
         * Unblocks the panel
         */
        unblockPanel: function(){
            this.$('.panel').removeClass('is-loading');
        },

        /**
         * Sets the panel as full screen
         */
        setFullscreen: function(){
            app.setFullscreen(this);
        },

        /**
         * Load the data
         * @param {number} [rootIdeaID=null]
         */
        loadData: function(rootIdeaID){
            var that = this,
                data = {
                    'page': this.data.page
                };

            if( this.filters !== NO_FILTER ){
                data.filters = this.filters;
            }

            if( rootIdeaID !== undefined ){
                this.data.rootIdeaID = rootIdeaID;
                data['root_idea_id'] = rootIdeaID;
            }

            this.blockPanel();
            this.collapsed = false;

            $.getJSON( app.getApiUrl('posts'), data, function(data){
                that.data = data;
                that.data.rootIdeaID = rootIdeaID;
                that.messages.reset(data.posts);
                that.messageThread.reset(data.posts);
            });
        },

        /**
         * Load the next data
         */
        loadNextData: function(){
            if( _.isNumber(this.data.page) ){
                this.data.page += 1;
            } else {
                this.data.page = 1;
            }

            if( this.data.page > this.data.maxPage ){
                this.data.page = this.data.maxPage;
            } else {
                this.loadData();
            }
        },

        /**
         * Load the previous data
         */
        loadPreviousData: function(){
            if( _.isNumber(this.data.page) ){
                this.data.page -= 1;
            } else {
                this.data.page = 1;
            }

            if( this.data.page < 1 ){
                this.data.page = 1;
            } else {
                this.loadData();
            }
        },

        /**
         * Close the panel
         */
        closePanel: function(){
            if( this.button ){
                this.button.trigger('click');
            }
        },

        /**
         * Collapse ALL messages
         */
        collapseMessages: function(){
            this.messages.each(function(message){
                message.attributes.isOpen = false;
            });

            this.collapsed = true;
            this.render();
        },

        /**
         * Expand ALL messages
         */
        expandMessages: function(){
            this.messages.each(function(message){
                message.attributes.isOpen = true;
            });

            this.collapsed = false;
            this.render();
        },

        /**
         * Expand All messages of the open thread
         */
        expandThreadMessages: function(){
            this.messageThread.each(function(message){
                message.set('collapsed', false);
            });

            this.threadCollapsed = false;

            this.$('#messageList-message-collapseButton')
                .removeClass('icon-download-1')
                .addClass('icon-upload');
        },

        /**
         * Collapse All messages of the open thread
         */
        collapseThreadMessages: function(){
            this.messageThread.each(function(message){
                message.set('collapsed', true);
            });

            this.threadCollapsed = true;

            this.$('#messageList-message-collapseButton')
                .removeClass('icon-upload')
                .addClass('icon-download-1');
        },

        /**
         * Open the message thread by the given id
         * @param  {String} id
         */
        openMessageByid: function(id){
            var message = this.messages.get(id);

            if( message ){
                this.loadThreadById(id);
            }
        },

        /**
         * Loads the message thread by post id
         * @param {Number} id
         * @param {Function} [callback] Callback function
         */
        loadThreadById: function(id, callback){
            var that = this;

            this.blockPanel();
            $.getJSON( app.getApiUrl('posts'), {'root_post_id': id}, function(json){
                that.unblockPanel();
                that.$el.addClass(MESSAGE_MODE);
                that.messageThread.reset(json.posts);

                if( _.isFunction(callback) ){
                    setTimeout(function(){
                        callback(json);
                    }, 10);
                }
            });
        },

        /**
         * Closes the thread panel and returns to the message lists
         */
        closeThread: function(){
            this.$el.removeClass(MESSAGE_MODE);
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'click .idealist-title': 'onTitleClick',
            'click #messageList-collapseButton': 'toggleMessages',
            'click #messageList-returnButton': 'onReturnButtonClick',

            'click #messageList-inbox': 'loadInbox',
            'click #messageList-insynthesis': 'loadSynthesisMessages',

            'click #messageList-message-collapseButton': 'toggleThreadMessages',

            'click #messageList-prevButton': 'loadPreviousData',
            'click #messageList-nextButton': 'loadNextData',

            'change #messageList-mainchk': 'onChangeMainCheckbox',
            'click #messageList-selectall': 'selectAll',
            'click #messageList-selectnone': 'selectNone',
            'click #messageList-selectread': 'selectRead',
            'click #messageList-selectunread': 'selectUnread',

            'click #messageList-closeButton': 'closePanel',
            'click #messageList-fullscreenButton': 'setFullscreen',
        },

        /**
         * @event
         */
        onTitleClick: function(ev){
            var id = ev.currentTarget.getAttribute('data-messageid');

            this.openMessageByid(id);
        },

        /**
         * @event
         * Load the inbox without filtering
         */
        loadInbox: function(){
            this.filters = NO_FILTER;
            this.loadData();
        },

        /**
         * @event
         */
        loadSynthesisMessages: function(){
            this.filters = SYNTHESIS_FILTER;
            this.loadData(this.data.rootIdeaID);
        },

        /**
         * Collapse or expand the messages
         */
        toggleMessages: function(){
            if( this.collapsed ){
                this.expandMessages();
            } else {
                this.collapseMessages();
            }
        },

        /**
         * Collapse or expand the messages of the open thread
         */
        toggleThreadMessages: function(){
            if( this.threadCollapsed ){
                this.expandThreadMessages();
            } else {
                this.collapseThreadMessages();
            }
        },

        /**
         * @event
         */
        onReturnButtonClick: function(ev){
            this.closeThread();
        },

        /**
         * @event
         */
        onChangeMainCheckbox: function(){
            var checked = this.chk.get(0).checked;

            this.messages.each(function(message){
                message.set('checked', checked);
            });
        },


        /**
         * @event
         */
        selectAll: function(){
            this.chk.get(0).checked = true;
            this.onChangeMainCheckbox();
        },

        /**
         * @event
         */
        selectNone: function(){
            this.chk.get(0).checked = false;
            this.onChangeMainCheckbox();
        },

        /**
         * @event
         */
        selectRead: function(){
            this.messages.each(function(message){
                var isRead = message.get('read');
                message.set('checked', isRead);
            });
        },

        /**
         * @event
         */
        selectUnread: function(){
            this.messages.each(function(message){
                var isUnread = !message.get('read');
                message.set('checked', isUnread);
            });
        }

    });

    return MessageList;
});
