define(['backbone', 'underscore', 'jquery', 'app', 'views/panel', 'views/messageFamily', 'models/message', 'i18n', 'views/messageListPostQuery', 'permissions', 'views/messageSend'],
function(Backbone, _, $, app, PanelView, MessageFamilyView, Message, i18n, PostQuery, Permissions, MessageSendView){
    'use strict';

    /**
     * Constants
     */
    var DIV_ANNOTATOR_HELP = app.format("<div class='annotator-draganddrop-help'>{0}</div>", i18n.gettext('You can drag the segment above directly to the table of ideas') ),
    DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX = "defaultMessageView-";

    /**
     * @class views.MessageList
     */
    var MessageList = PanelView.extend({
        ViewStyles: {
            THREADED: {id: "threaded",
                        css_id: "messageList-view-threaded",
                        label: i18n.gettext('Threaded')
                        },
            CHRONOLOGICAL: {id: "chronological",
                        css_id: "messageList-view-chronological",
                        label: i18n.gettext('Chronological')
                        },
            REVERSE_CHRONOLOGICAL: {id: "reverse_chronological",
                        css_id: "messageList-view-activityfeed",
                        label: i18n.gettext('Reverse-Chronological')
                        }
        },
        
        currentViewStyle: null,
        /**
         * Is the view currently rendering
         */
        currentlyRendering: false,
        /**
         * If there were any render requests inhibited while rendering was 
         * processed
         */
        numRenderInhibitedDuringRendering: 0,
        
        
        storedMessageListConfig: app.getMessageListConfigFromStorage(),
        /**
         * get a view style definition by id
         * @param {viewStyle.id}
         * @return {viewStyle or undefined}
         */
        getViewStyleDefById: function(viewStyleId){
            var retval = _.find(this.ViewStyles, function(viewStyle){ return viewStyle.id == viewStyleId; });
            return retval;
        },
        /**
         *  @init
         */
        initialize: function(obj){
            /*this.on("all", function(eventName) {
                console.log("messageList event received: ", eventName);
              });
            this.messages.on("all", function(eventName) {
                console.log("messageList collection event received: ", eventName);
              });*/
            if( obj.button ){
                this.button = $(obj.button).on('click', app.togglePanel.bind(window, 'messageList'));
            }

            PanelView.prototype.initialize.apply(this);
            this.renderedMessageViewsPrevious = {};
            this.renderedMessageViewsCurrent = {};
            
            this.setViewStyle(this.getViewStyleDefById(this.storedMessageListConfig.viewStyleId) || this.ViewStyles.THREADED);
            this.defaultMessageStyle = app.getMessageViewStyleDefById(this.storedMessageListConfig.messageStyleId) || app.AVAILABLE_MESSAGE_VIEW_STYLES.PREVIEW;

            /**
             * @ghourlier
             * TODO: Usually it would necessary tu push notification rather than fetch every time the model change
             * Need to be a call to action
             * */
            this.listenTo(this.messages, 'add reset', function(){

                var emptySubject = this.$('.messageSend .messageSend-subject').val(),
                    emptyBody = this.$('.messageSend .messageSend-body').val();

                if(emptySubject != '' && emptySubject !== undefined){

                  return;
                }

                that.messagesFinishedLoading = true;
                that.invalidateResultsAndRender();
                that.initAnnotator();

            });

            //this.listenTo(this.messages, 'add', this.invalidateResultsAndRender);
            // TODO:  Benoitg:  I didn't write this part, but i think it needs a
            // re-render, not just an init
            // this.listenTo(this.messages, 'change', this.initAnnotator);
            // TODO:  FIXME!!! Benoitg - 2014-05-05
            this.listenTo(app.segmentList.segments, 'add remove reset', this.initAnnotator);
            
            var that = this;
            app.on('idea:select', function(idea){
                if(idea && that.currentQuery.isFilterInQuery(that.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, idea.getId())) {
                    //Filter is already in sync
                    //TODO:  Detect the case where there is no idea selected, and we already have no filter on ideas
                    return;
                }
                else {
                    that.filterThroughPanelLock(function(){
                        that.syncWithCurrentIdea();
                    }, 'syncWithCurrentIdea');
                }
            });
            
        },
        
        invalidateResultsAndRender: function(){
            this.currentQuery.invalidateResults();
            this.render();
        },
        
        /**
         * Synchronizes the panel with the currently selected idea (possibly none)
         */
        syncWithCurrentIdea: function(){
            var currentIdea = app.getCurrentIdea();
            //console.log("messageList:syncWithCurrentIdea(): New idea is now: ",currentIdea);
            app.openPanel(app.messageList);
            if(currentIdea && this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, currentIdea.getId())) {
                //Filter is already in sync
                //TODO:  Detect the case where there is no idea selected, and we already have no filter on ideas
                return;
            }
            else {
                this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null);
                
                if( currentIdea ){
                    this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_ORPHAN, null);
                    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, currentIdea.getId());
                    //app.openPanel(app.messageList);
                }
                if(app.debugRender) {
                    console.log("messageList:syncWithCurrentIdea(): triggering render because new idea was selected");
                }
                //console.log("messageList:syncWithCurrentIdea(): Query is now: ",this.currentQuery._query);
                this.render();
            }
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
        collapsed: false,

        /**
         * List of message id's to be displayed in the interface
         * @type {MessageCollection}
         */
        messageIdsToDisplay: [],

        /**
         * Collection with all messsages in the discussion.
         * @type {MessageCollection}
         */
        messages: new Message.Collection(),
        messagesFinishedLoading: false,
        
        /**
         * The annotator reference
         * @type {Annotator}
         */
        annotator: null,

        
        /**
         * The current server-side query applied to messages
         * @type {Object}
         */
        currentQuery: new PostQuery(),
        
        /**
         * Returns the messages with no parent in the messages to be rendered
         * TODO:  This is used in threading, but is sub-optimal as it won't 
         * tie messages to their grandparent in partial views.  benoitg
         * @return {Message[]}
         */
        getRootMessagesToDisplay: function(){
            var toReturn = [],
                that = this,
                messages = this.messages;
            messages.each(function(model){
                var parentId = model.get('parentId');
                var id = model.getId();
                if( that.messageIdsToDisplay.indexOf(id) >= 0
                    && (parentId == null 
                        || that.messageIdsToDisplay.indexOf(parentId) == -1 
                        )
                    ){
                    toReturn.push(model);
                }
            });
            return toReturn;
        },
        
        getPreviousScrollTarget: function(){
            var panelBody = this.$('.panel-body'),
            panelOffset = null,
            panelScrollTop = 0,
            messageViewScrolledInto = null,
            messageViewScrolledIntoOffset = -Number.MAX_VALUE,
            retval = null;
            //We may have been called on the first render, so we have to check
            if(panelBody.offset() !== undefined) {
                panelOffset = panelBody.offset().top;
                panelScrollTop = panelBody.scrollTop();
                //console.log("panelBody", panelBody, "panelScrollTop", panelScrollTop);
                if(panelScrollTop !== 0){
                    // Scrolling to the element
                    //var target = offset - panelOffset + panelBody.scrollTop();
                    //console.log("panelOffset", panelOffset);
                    var selector = $('.message');
                    _.every(this.renderedMessageViewsCurrent, function(view){
                        var retval = true;
                        //console.log("view",view);
                        var collection = view.$el.find(selector).addBack(selector);
                        //console.log("collection", collection);
                        collection.each(function(){
                            //console.log(this);
                            var messageOffset = $(this).offset().top - panelOffset;
                            //console.log("message ", $(this).attr('id'), "position", messageOffset);
                            if(messageOffset < 0){
                                if(messageOffset > messageViewScrolledIntoOffset) {
                                    messageViewScrolledInto = view;
                                    messageViewScrolledIntoOffset = messageOffset;
                                }
                            }
                            else {
                                // the list is not in display order in threaded view
                                // so I don't see a way to break out
                                // scroll position, break out of the loop
                                // retval = false;
                            }
                            return retval;
                        });
                        return retval;
                    });
                    if(messageViewScrolledInto) {
                        //console.log("message in partial view has subject:", messageViewScrolledInto.model.get('subject'));
                        var messageHtmlId = messageViewScrolledInto.$el.attr('id');
                        retval = {messageHtmlId: messageHtmlId,
                                  innerOffset: messageViewScrolledIntoOffset};
                    }
                }
            }
            return retval;
        },
        
        scrollToPreviousScrollTarget: function(previousScrollTarget){
            var panelBody = this.$('.panel-body'),
            panelOffset = null,
            panelScrollTop = 0;

            if(previousScrollTarget) {
                //console.log("scrollToPreviousScrollTarget(): Trying to scroll to:", previousScrollTarget)
                //We may have been called on the first render, so we have to check
                if(panelBody.offset() !== undefined) {
                    //console.log("panelBody", panelBody);
                    panelOffset = panelBody.offset().top;
                    panelScrollTop = panelBody.scrollTop();
                    //console.log("panelScrollTop", panelScrollTop, "panelOffset", panelOffset);
                    var selector = app.format('[id="{0}"]', previousScrollTarget.messageHtmlId);
                    var message = this.$(selector);
                    if(!_.size(message)) {
                        //console.log("scrollToPreviousScrollTarget() can't find element with id:",previousScrollTarget.messageHtmlId);
                        return;
                    }
                    var messageCurrentOffset = message.offset().top;
                    //console.log("messageCurrentOffset", messageCurrentOffset);

                    // Scrolling to the element
                    var target = messageCurrentOffset - panelOffset - previousScrollTarget.innerOffset;
                    //console.log("target",target);
                    panelBody.animate({ scrollTop: target });
                }
            }
        },
        /**
         * Returns the the messages to be rendered
         * @return {Message[]}
         */
        getAllMessagesToDisplay: function(){
            var toReturn = [],
                that = this,
                model = null,
                messages = this.messages;
            that.messageIdsToDisplay.forEach(function(id){
                model = messages.get(id);
                if (model){
                    toReturn.push(model);
                }
                else {
                    console.log('ERROR:  getAllMessagesToDisplay():  Message with id '+id+' not found!')
                }
            });
            return toReturn;
        },

        /**
         * The actual rendering for the render function
         * @return {views.Message}
         */
        render_real: function(){
            var that = this,
                views = [],
                previousScrollTarget = null;
            /*
            console.log("messageIdsToDisplay is: ");
            console.log(that.messageIdsToDisplay);
            */
            previousScrollTarget = this.getPreviousScrollTarget();
            //The MessageFamilyView will re-fill the array with the rendered MessageView
            this.renderedMessageViewsPrevious = _.clone(this.renderedMessageViewsCurrent);
            this.renderedMessageViewsCurrent = {};
            if (this.currentViewStyle == this.ViewStyles.THREADED) {
                views = this.getRenderedMessagesThreaded(this.getRootMessagesToDisplay(), 1, []);
            }
            else {
                views = this.getRenderedMessagesFlat(this.getAllMessagesToDisplay());
            }
            var data = {
                    availableViewStyles: this.ViewStyles,
                    currentViewStyle: this.currentViewStyle,
                    DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX: DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX,
                    collapsed: this.collapsed,
                    queryInfo: this.currentQuery.getHtmlDescription(),
                    canPost: app.getCurrentUser().can(Permissions.ADD_POST)
                };

            this.$el.html( this.template(data) );

            if( views.length > 0 ){
                this.$('.idealist').append( views );
            } else {
                this.$('.idealist').append( app.format("<div class='margin'>{0}</div>", i18n.gettext('No messages')) );
            }

            this.renderCollapseButton();
            this.renderDefaultMessageViewDropdown();
            this.chk = this.$('#messageList-mainchk');
            this.newTopicView = new MessageSendView({
                'allow_setting_subject': true,
                'reply_idea': null,
                'body_help_message': i18n.gettext('You can start a new topic in this discussion by typing a subject above, and a first post here...'),
                'send_button_label': i18n.gettext('Start a new topic in this discussion'),
                'subject_label': i18n.gettext('New topic subject:'),
                'mandatory_body_missing_msg': i18n.gettext('You need to type a comment first...'),
                'mandatory_subject_missing_msg': i18n.gettext('You need to set a subject to add a new topic...')
            });
            
            this.$('#messagelist-replybox').append( this.newTopicView.render().el );
            this.scrollToPreviousScrollTarget(previousScrollTarget);
            this.initAnnotator();
            return this;
        },
        /**
         * The render function
         * @return {views.Message}
         */
        render: function(){
            var that = this;
            function renderStatus() {
                if(that.currentlyRendering) return "a render is already in progress, ";
                else return "no render already in progress, ";
            }
            if(app.debugRender) {
                console.log("messageList:render() is firing, "+renderStatus()+this.messages.length+" messages in collection.");
            }
            this.currentlyRendering = true;

            app.trigger('render');
            this.renderPanelButton();
            if(this.messagesFinishedLoading) {
                this.blockPanel();
                this.currentQuery.execute(function(data){
                    that.messageIdsToDisplay = data;
                    that = that.render_real();
                    that.unblockPanel();
                    that.trigger("render_complete", "Render complete");
                });
            }
            else {
                 this.render_real();
                 this.blockPanel();
            }
            this.currentlyRendering = false;
            return this;
        },
        /**
         * Renders the collapse button
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
         * Renders the default message view style dropdown button
         */
        renderDefaultMessageViewDropdown: function(){
            var that = this,
            div = this.$('#defaultMessageView-dropdown'),
            html = "";

            html += '<span class="dropdown-label text-bold">';
            html += this.defaultMessageStyle.label;
            html += '</span>';
            html += '<ul class="dropdown-list">';
            _.each(app.AVAILABLE_MESSAGE_VIEW_STYLES, function(messageViewStyle) {
                html += '<li id="' + DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX + messageViewStyle.id +'" class="dropdown-listitem">'+ messageViewStyle.label+'</li>';
            });
            html += '</ul>';
            div.html(html);
        },


        /**
         * Return a list with all views.el already rendered for a flat view
         * @param {Message.Model[]} messages
         * @return {HTMLDivElement[]}
         */
        getRenderedMessagesFlat: function(messages){
            var list = [],
            len = messages.length,
            view, model, children, prop, isValid;

            for (var i = 0; i < len; i++) {
                model = messages[i];

                view = new MessageFamilyView({
                    model : model,
                    messageListView : this
                });
                view.hasChildren = false;
                list.push(view.render().el);
            }
            return list;
        },
        
        /**
         * Return a list with all views.el already rendered for threaded views
         * @param {Message.Model[]} messages
         * @param {Number} [level=1] The current hierarchy level
         * @param {Array[boolean]} last_sibling_chain which of the view's ancestors
         *   are the last child of their respective parents.
         * @return {HTMLDivElement[]}
         */
        getRenderedMessagesThreaded: function(messages, level, last_sibling_chain){
            var list = [],
                i = 0,
                len = messages.length,
                view, model, children, prop, isValid;

            if( _.isUndefined(level) ){
                level = 1;
            }
            if( _.isUndefined(last_sibling_chain) ){
                last_sibling_chain = [];
            }
            last_sibling_chain = last_sibling_chain.slice();
            last_sibling_chain.push(true);

            // We need to identify the "last" message of the series while taking
            // the filter into account. It is easier to start from the end.
            var found = false, justfound = true;
            /*console.log("length: ", len);
            console.log(this.messageIdsToDisplay);*/
            for (var i = len - 1; i >= 0; i--) {
                model = messages[i];
                isValid = (this.messageIdsToDisplay.indexOf(model.getId()) >= 0)
                if( isValid ) {
                    /*console.log(model);
                    console.log("Message was valid: "+model.get('subject')+", "+model.get('idCreator'));*/
                    view = new MessageFamilyView({model:model, messageListView:this}, last_sibling_chain);
                    view.currentLevel = level;
                    found = true;
                    children = model.getChildren();
                    var subviews = this.getRenderedMessagesThreaded(
                        children, level+1, last_sibling_chain);
                    view.hasChildren = (subviews.length > 0);
                    list.push(view.render().el);
                    view.$('.messagelist-children').append( subviews );
                }
                if (!found && this.hasDescendantsInFilter(model)) {
                    found = true;
                }
                if (found && justfound) {
                    justfound = false;
                    last_sibling_chain = last_sibling_chain.slice();
                    last_sibling_chain.pop();
                    last_sibling_chain.push(false);
                }
                if (isValid || !found) {
                    // optimization: we already computed descendants.
                    continue;
                }
                if (!isValid && this.hasDescendantsInFilter(model)) {
                    //Generate ghost message
                    var view = $('<div class="message message--skip"><div class="skipped-message"></div><div class="messagelist-children"></div></div>');
                    console.log("Invalid message was:",model);
                    list.push(view);
                    children = model.getChildren();
                    view.find('.messagelist-children').append( this.getRenderedMessagesThreaded(
                        children, level+1, last_sibling_chain) );
                }
            }
            list.reverse();
            return list;
        },

        hasDescendantsInFilter: function(model){
            if (this.messageIdsToDisplay.indexOf(model.getId()) >= 0) {
                console.log("Valid descendant found (direct):", model)
                return true;
            }
            var children = model.getChildren();
            for (var i = children.length - 1; i >= 0; i--) {
                if (this.hasDescendantsInFilter(children[i])) {
                    return true;
                }
            }
            return false;
        },


        /**
         * Inits the annotator instance
         */
        initAnnotator: function(){
            // Won't this cause problems?  Benoitg
            this.destroyAnnotator();

            // Saving the annotator reference
            this.annotator = this.$('#messageList-list').annotator().data('annotator');

            var that = this;

            //TODO:  Re-render message in messagelist if an annotation was added...
            this.annotator.subscribe('annotationCreated', function(annotation){
                var segment = app.segmentList.addAnnotationAsSegment(annotation, app.currentAnnotationIdIdea);
                if( !segment.isValid() ){
                    annotator.deleteAnnotation(annotation);
                } else if( app.currentAnnotationNewIdeaParentIdea ){
                    //We asked to create a new idea from segment
                    that.lockPanel();
                    var newIdea = app.currentAnnotationNewIdeaParentIdea.addSegmentAsChild(segment);
                    app.setCurrentIdea(newIdea);
                }
                else {
                    segment.save();
                }
                app.currentAnnotationNewIdeaParentIdea = null;
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
            //We need extra time for annotator to be ready, but I don't 
            // know why and how much.  benoitg 2014-03-10
            setTimeout( function (){
                that.trigger("annotator:initComplete", that.annotator);
            }, 10);

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
         * Load the initial data to populate the collection
         */
        loadInitialData: function(){
            var that = this;

            $.getJSON( app.getApiUrl('posts'), function(data){
                _.each(data.posts, function(post){
                    post.collapsed = that.collapsed;
                });
                that.messages.reset(data.posts);
                //that = that.render();
            });
        },
        

        /**
         * Shows posts which are descendent of a given post
         * @param {String} postId
         */
        addFilterByPostId: function(postId){
            this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, postId);
            this.render();
        },

        /**
         * Toggle hoist on a post (filter which shows posts which are descendent of a given post)
         */
        toggleFilterByPostId: function(postId){
            var alreadyHere = this.currentQuery.isFilterActive (this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, postId);
            if ( alreadyHere )
            {
                this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, null);
                this.render();
            }
            else
            {
                this.addFilterByPostId(postId);
            }
            return !alreadyHere;
        },
        
        /**
         * @event
         * Shows all messages (clears all filters)
         */
        showAllMessages: function(){
            this.currentQuery.clearAllFilters();
            this.render();
        },
        
        /**
         * Load posts that belong to an idea
         * @param {String} ideaId
         */
        addFilterIsRelatedToIdea: function(idea){
            //Can't filter on an idea at the same time as getting synthesis messages
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_SYNTHESIS, null);
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_ORPHAN, null);
            this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, idea.getId());
            this.render();
        },
        
        /**
         * Load posts that are synthesis posts
         * @param {String} ideaId
         */
        addFilterIsSynthesMessage: function(){
            //Can't filter on an idea at the same time as getting synthesis messages
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null);
            this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_SYNTHESIS, true);
            this.render();
        },

        /**
         * Load posts that are synthesis posts
         * @param {String} ideaId
         */
        addFilterIsOrphanMessage: function(){
            //Can't filter on an idea at the same time as getting orphan messages
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null);
            this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_ORPHAN, true);
            this.render();
        },
        /**
         * Load posts that are read or unread
         * @param {String} ideaId
         */
        addFilterIsUnreadMessage: function(){
            this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_UNREAD, true);
            this.render();
        },

        /**
         * @event
         * Set the view to the selected viewStyle.
         * Does NOT re-render
         * 
         */
        setViewStyle: function(viewStyle){
            if(viewStyle === this.ViewStyles.THREADED) {
                this.currentViewStyle = this.ViewStyles.THREADED;
                this.currentQuery.setView(this.currentQuery.availableViews.THREADED)
            }
            else if(viewStyle === this.ViewStyles.REVERSE_CHRONOLOGICAL) {
                this.currentViewStyle = this.ViewStyles.REVERSE_CHRONOLOGICAL;
                this.currentQuery.setView(this.currentQuery.availableViews.REVERSE_CHRONOLOGICAL)
            }
            else if(viewStyle === this.ViewStyles.CHRONOLOGICAL) {
                this.currentViewStyle = this.ViewStyles.CHRONOLOGICAL;
                this.currentQuery.setView(this.currentQuery.availableViews.CHRONOLOGICAL)
            }
            else {
                throw "Unsupported view style";
            }
            if(this.storedMessageListConfig.viewStyleId != viewStyle.id) {
                this.storedMessageListConfig.viewStyleId = viewStyle.id;
                app.setMessageListConfigToStorage(this.storedMessageListConfig);
            }
            
        },
        /**
         * @event
         * Set the view to threaded view
         */
        setViewStyleThreaded: function(){
            this.setViewStyle(this.ViewStyles.THREADED);
            this.render();
        },
        
        /**
         * @event
         * Set the view to a flat reverse chronological view
         */
        setViewStyleActivityFeed: function(){
            this.setViewStyle(this.ViewStyles.REVERSE_CHRONOLOGICAL);
            this.render();
        },
        
        /**
         * @event
         * Set the view to a flat chronological view
         */
        setViewStyleChronological: function(){
            this.setViewStyle(this.ViewStyles.CHRONOLOGICAL);
            this.render();
        },

        /**
         * @event
         */
        onDefaultMessageViewStyle: function(e){
            var messageViewStyleId = (e.currentTarget.id).replace(DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX, '');
            var messageViewStyleSelected = app.getMessageViewStyleDefById(messageViewStyleId);
            //console.log("onDefaultMessageViewStyle: "+messageViewStyleSelected.label);
            this.setDefaultMessageViewStyle(messageViewStyleSelected);
        },
        
        /**
         * @event
         * Set the default messageView, re-renders messages if the view doesn't match
         */
        setDefaultMessageViewStyle: function(messageViewStyle){
            this.defaultMessageStyle = messageViewStyle;
            
            _.each(this.renderedMessageViewsCurrent, function(messageView) { 
                if (messageView.viewStyle !== messageViewStyle)  {
                    messageView.setViewStyle(messageViewStyle);
                    messageView.render();
                }
            } );
            this.renderDefaultMessageViewDropdown();
            if(this.storedMessageListConfig.messageStyleId != messageViewStyle.id) {
                this.storedMessageListConfig.messageStyleId = messageViewStyle.id;
                app.setMessageListConfigToStorage(this.storedMessageListConfig);
            }
        },
        /**
         * Highlights the message by the given id
         * @param {String} id
         * @param {Function} [callback] The callback function to call if message is found
         */
        showMessageById: function(id, callback){
            var message = this.messages.get(id),
                 selector = app.format('[id="message-{0}"]', id),
                 el,
                 messageIsDisplayed = false,
                 that = this;
            
            if(this.currentlyRendering) {
                var success = function() {
                    console.log("showMessageById() panel was currently rendering, calling showMessageById() recursively");
                    that.showMessageById(id, callback);
                }
                this.listenToOnce(this, "render_complete", success);
                return;
            }
            
            this.messageIdsToDisplay.forEach(function(displayedId){
                if (displayedId == id){
                    messageIsDisplayed = true;
                }
            });
            
            if( !messageIsDisplayed ){
                //The current filters might not include the message
                this.showAllMessages();
                var success = function() {
                    console.log("showMessageById() message " + id + " not found, calling showMessageById() recursively");
                    that.showMessageById(id, callback);
                }
                this.listenToOnce(this, "render_complete", success);
                return;
            }
            var real_callback = function(){
                    $(selector).highlight();
                    if( _.isFunction(callback) ){
                        callback();
                    }
                };

            if( message ){
                message.trigger('showBody');
                el = $(selector);
                if( el[0] ){
                    var panelBody = this.$('.panel-body');
                    var panelOffset = panelBody.offset().top;
                    var offset = el.offset().top;
                    // Scrolling to the element
                    var target = offset - panelOffset + panelBody.scrollTop();
                    panelBody.animate({ scrollTop: target }, { complete: real_callback });
                } else {
                    callback();
                }
            }
            else {
                console.log("showMessageById(): ERROR:  Message " + id + " not found in collection");
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
        events: function() {
            var data = {
            'click .idealist-title': 'onTitleClick',
            'click #post-query-filter-info .closebutton': 'onFilterDeleteClick',
            'click #messageList-collapseButton': 'toggleMessageView',
            'click #messageList-returnButton': 'onReturnButtonClick',

            'click #messageList-allmessages': 'showAllMessages',
            'click #messageList-onlyorphan': 'addFilterIsOrphanMessage',            
            'click #messageList-onlysynthesis': 'addFilterIsSynthesMessage',
            'click #messageList-isunread': 'addFilterIsUnreadMessage',

            'click #messageList-view-threaded': 'setViewStyleThreaded',
            'click #messageList-view-activityfeed': 'setViewStyleActivityFeed',
            'click #messageList-view-chronological': 'setViewStyleChronological',
            
            'click #messageList-message-collapseButton': 'toggleThreadMessages',

            'change #messageList-mainchk': 'onChangeMainCheckbox',
            'click #messageList-selectall': 'selectAll',
            'click #messageList-selectnone': 'selectNone',
            'click #messageList-selectread': 'selectRead',
            'click #messageList-selectunread': 'selectUnread',

            'click #messageList-closeButton': 'closePanel',
            'click #messageList-fullscreenButton': 'setFullscreen'
            }

            var messageDefaultViewStyle = '';
            _.each(app.AVAILABLE_MESSAGE_VIEW_STYLES, function(messageViewStyle) { 
                var key = 'click #'+DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX+messageViewStyle.id;
                data[key] = 'onDefaultMessageViewStyle';
            } );
            _.extend(data, PanelView.prototype.events());
            return data;
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
         */
        onFilterDeleteClick: function(ev){
            //console.log(ev);
            var value = ev.currentTarget.getAttribute('data-value');
            var filterid = ev.currentTarget.getAttribute('data-filterid');
            var filter = this.currentQuery.getFilterDefById(filterid);
            this.currentQuery.clearFilter(filter, value);
            this.render();
        },

        /**
         * Collapse or expand the messages
         */
        toggleMessageView: function(){
            console.log("toggleMessageView");
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
