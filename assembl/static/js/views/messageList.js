define(['backbone', 'underscore', 'jquery', 'app', 'views/messageListItem', 'views/message', 'models/message', 'i18n'],
function(Backbone, _, $, app, MessageListItem, MessageView, Message, i18n){
    'use strict';

    /**
     * Constants
     */
    var DIV_ANNOTATOR_HELP = app.format("<div class='annotator-draganddrop-help'>{0}</div>", i18n.gettext('You can drag the segment above directly to the table of ideas') );

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

            this.listenTo(this.messages, 'reset', this.render);
            this.listenTo(this.messages, 'change', this.initAnnotator);

            var that = this;
            app.on('idea:select', function(idea){
                if( idea ){
                    app.openPanel(app.messageList);
                    that.loadDataByIdeaId(idea.getId());
                } else {
                    that.loadDataByIdeaId(null);
                }
            });
        },

        /**
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('messageList'),

        /**
         * The collapse/expand flag
         * @type {Boolean}
         */
        collapsed: true,

        /**
         * Collection with all messsages. Used to be filtered and replace `this.messages`
         * @type {MessageCollection}
         */
        allMessages: new Message.Collection(),

        /**
         * The collection which is being displayed
         * @type {MessageCollection}
         */
        messages: new Message.Collection(),

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

            var that = this,
                rootMessages = this.messages.getRootMessages(),
                views = this.getRenderedMessages(rootMessages);

            var data = {
                inbox: this.messages.length,
                total: this.messages.length,
                collapsed: this.collapsed
            };

            this.$el.html( this.template(data) );

            if( rootMessages.length > 0 ){
                this.$('.idealist').append( views );
            } else {
                this.$('.idealist').append( app.format("<div class='margin'>{0}</div>", i18n.gettext('No messages')) );
            }

            this.renderCollapseButton();
            this.chk = this.$('#messageList-mainchk');
            this.initAnnotator();

            return this;
        },

        /**
         * Rendes the collapse button
         */
        renderCollapseButton: function(){
            var btn = this.$('#messageList-collapseButton');

            if( this.collapsed ){
                btn.attr('data-tooltip', i18n.gettext('Expand all'));
                btn.removeClass('icon-upload').addClass('icon-download-1');
            } else {
                btn.attr('data-tooltip', i18n.gettext('Collapse all'));
                btn.removeClass('icon-download-1').addClass('icon-upload');
            }
        },

        /**
         * Return a list with all views.el already rendered
         * @param {Message.Model[]} messages
         * @param {Number} [level=1] The current hierarchy level
         * @return {HTMLDivElement[]}
         */
        getRenderedMessages: function(messages, level){
            var list = [],
                i = 0,
                len = messages.length,
                view, model, children;

            if( _.isUndefined(level) ){
                level = 1;
            }

            for(; i < len; i += 1){
                model = messages[i];
                view = new MessageView({model:model});
                children = model.getChildren();

                list.push(view.render(level).el);
                list = _.union(list, this.getRenderedMessages(children, level+1));
            }

            return list;
        },

        /**
         * Inits the annotator instance
         */
        initAnnotator: function(){
            this.destroyAnnotator();

            // Saving the annotator reference
            this.annotator = this.$('#messageList-list').annotator().data('annotator');

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

                app.currentAnnotationIdea = null;
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
                if( $(editor.element).find(".annotator-draganddrop-help").length === 0 ) {
                    $(editor.element).find(".annotator-textarea").after(DIV_ANNOTATOR_HELP);
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
            this.annotator = null;
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
         * Load the initial data to populate the collection
         */
        loadInitialData: function(){
            var that = this;

            this.blockPanel();
            this.collapsed = true;

            $.getJSON( app.getApiUrl('posts'), function(data){
                _.each(data.posts, function(post){
                    post.collapsed = true;
                });
                that.allMessages.reset(data.posts);
                that.messages.reset(data.posts);
            });
        },

        /**
         * Shows the related to the given idea
         * @param {String} ideaId
         */
        loadDataByIdeaId: function(ideaId){
            var that = this,
                url = app.getApiUrl('posts'),
                params = {};

            params.root_idea_id = ideaId;
            params.view = 'id_only';

            this.blockPanel();
            this.collapsed = true;

            $.getJSON(url, params, function(data){
                var ids = {},
                    messages = [];

                _.each(data.posts, function(post){
                    ids[post['@id']] = post;
                });

                that.allMessages.each(function(message){
                    if( message.get('@id') in ids ){
                        messages.push(message);
                    }
                });

                that.unblockPanel();
                that.messages.reset(messages);
            });
        },

        /**
         * Highlights the message by the given id
         * @param {String} id
         * @param {Function} [callback] The callback function
         */
        showMessageById: function(id, callback){
            var message = this.messages.get(id),
                 selector = app.format('[id="message-{0}"]', id),
                 el;
            
            if( ! _.isFunction(callback) ){
                callback = $.noop;
            }

            if( message ){
                message.set('collapsed', false);
                el = $(selector);
                if( el[0] ){
                    // Scrolling to the element
                    var top = el[0].parentElement.offsetTop;
                    this.$('.panel-body').animate({ scrollTop: top }, { complete: callback });
                } else {
                    callback();
                }
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
         * Set the new status for collapsed property
         * @param {boolean} value
         */
        setCollapsed: function(value){
            this.messages.each(function(message){
                message.set('collapsed', value, {silent: true});
            });

            this.collapsed = value;
            this.render();
        },

        /**
         * Collapse ALL messages
         */
        collapseMessages: function(){
            this.setCollapsed(true);
        },

        /**
         * Expand ALL messages
         */
        expandMessages: function(){
            this.setCollapsed(false);
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'click .idealist-title': 'onTitleClick',
            'click #messageList-collapseButton': 'toggleMessages',
            'click #messageList-returnButton': 'onReturnButtonClick',

            'click #messageList-inbox': 'showInbox',
            'click #messageList-innextsynthesis': 'loadSynthesisMessages',

            'click #messageList-message-collapseButton': 'toggleThreadMessages',

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
         * Shows the inbox
         */
        showInbox: function(){
            this.loadData();
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
