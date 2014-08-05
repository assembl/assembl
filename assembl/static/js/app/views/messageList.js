define(function(require){
    'use strict';

                  var Backbone = require('backbone'),
       objectTreeRenderVisitor = require('views/visitors/objectTreeRenderVisitor'),
             MessageFamilyView = require('views/messageFamily'),
                             _ = require('underscore'),
                             $ = require('jquery'),
                       Assembl = require('modules/assembl'),
                           Ctx = require('modules/context'),
                       Message = require('models/message'),
                          i18n = require('utils/i18n'),
                     PostQuery = require('views/messageListPostQuery'),
                   Permissions = require('utils/permissions'),
               MessageSendView = require('views/messageSend'),
                   SegmentList = require('views/segmentList'),
                  AssemblPanel = require('views/assemblPanel'),
             CollectionManager = require('modules/collectionManager');

    /**
     * Constants
     */
    var DIV_ANNOTATOR_HELP = Ctx.format("<div class='annotator-draganddrop-help'>{0}</div>", i18n.gettext('You can drag the segment above directly to the table of ideas') ),
        DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX = "defaultMessageView-",
        MESSAGE_LIST_VIEW_LI_ID_PREFIX = "messageList-view-",
        /* The maximum number of messages that can be loaded at the same time
         * before being removed from memory
         */
        MAX_MESSAGES_IN_DISPLAY = 50,
        /* The number of messages to load each time the user reaches scrools to 
         * the end or beginning of the list.
         */
        MORE_PAGES_NUMBER = 20;

    /**
     * @class views.MessageList
     */
    var MessageList = AssemblPanel.extend({

        className:'groupPanel messageList',

        ViewStyles: {
          THREADED: {
            id: "threaded",
            css_id: "messageList-view-threaded",
            label: i18n.gettext('Threaded')
          },
          CHRONOLOGICAL: {
            id: "chronological",
            css_id: "messageList-view-chronological",
            label: i18n.gettext('Chronological')
          },
          REVERSE_CHRONOLOGICAL: {
            id: "reverse_chronological",
            css_id: "messageList-view-activityfeed",
            label: i18n.gettext('Reverse-Chronological')
          },
          NEW_MESSAGES: {
            id: "new_messages",
            css_id: "messageList-view-newmessages",
            label: i18n.gettext('New Messages')
          }
        },
        
        currentViewStyle: null,

        /**
         * If there were any render requests inhibited while rendering was 
         * processed
         */
        numRenderInhibitedDuringRendering: 0,
        
        
        storedMessageListConfig: Ctx.getMessageListConfigFromStorage(),
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
         * get a view style definition by css_id
         * @param {viewStyle.id}
         * @return {viewStyle or undefined}
         */
        getViewStyleDefByCssId: function(viewStyleId){
            var retval = _.find(this.ViewStyles, function(viewStyle){ return viewStyle.css_id == viewStyleId; });
            return retval;
        },
        /**
         *  @init
         */
        initialize: function(options){
            var that = this,
            collectionManager = new CollectionManager();

            this.renderedMessageViewsCurrent = {};
            
            this.setViewStyle(this.getViewStyleDefById(this.storedMessageListConfig.viewStyleId) || this.ViewStyles.THREADED);
            this.defaultMessageStyle = Ctx.getMessageViewStyleDefById(this.storedMessageListConfig.messageStyleId) || Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.PREVIEW;

            this.panelGroup = options.groupManager;
            /**
             * @ghourlier
             * TODO: Usually it would necessary to push notification rather than fetch every time the model change
             * Need to be a call to action
             * Benoitg:  Why?  There is no way to know if the message is, or isn't relevent to the user, and worthy
             * of notification.  Everything else updates realtime, why make an exception for messages?
             * */
            /* TODO:  PORT THIS TO NEW SYSTEM - benoitg -2014-07-23
             * 
             * this.listenTo(this.messages, 'add reset', function(){
                that.invalidateResultsAndRender();
                that.initAnnotator();

            });*/
            collectionManager.getAllMessageStructureCollectionPromise().done(
                function(allMessageStructureCollection) {
                  that.listenTo(allMessageStructureCollection, 'add reset', function(){
                    that.currentQuery.invalidateResults();
                    that.render();
                  });
                }
            );
            
            collectionManager.getAllExtractsCollectionPromise().done(
                function(allExtractsCollection) {
                  that.initAnnotator();//Not sure if this is necessary anymore - benoitg-2014-07-29
                  that.listenTo(allExtractsCollection, 'add remove reset', that.initAnnotator);
                }
            );

            Assembl.vent.on('idea:selected', function(idea){
                //console.log("vent.on idea:selected fired");
                if(idea && that.currentQuery.isFilterInQuery(that.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, idea.getId())) {
                    //Filter is already in sync
                    //TODO:  Detect the case where there is no idea selected, and we already have no filter on ideas
                    return;

                } else {
                    that.panelGroup.filterThroughPanelLock.apply(that.panelGroup, [
                        function(){
                            that.syncWithCurrentIdea();
                        }, 'syncWithCurrentIdea'
                    ]);
                }
            });

            Assembl.vent.on('messageList:showMessageById', function(id, callback){
                that.showMessageById(id, callback);
            });

            Assembl.vent.on('messageList:addFilterIsRelatedToIdea', function(idea, only_unread){
                that.panelGroup.filterThroughPanelLock.apply(that.panelGroup, [
                    function(){
                        that.addFilterIsRelatedToIdea(idea, only_unread)
                    }, 'syncWithCurrentIdea'
                ]);
            });

            Assembl.vent.on('messageList:addFilterIsOrphanMessage', function(){
                that.panelGroup.filterThroughPanelLock.apply(that.panelGroup, [
                    function(){
                        that.addFilterIsOrphanMessage();
                    }, 'syncWithCurrentIdea'
                ]);
            });

            Assembl.vent.on('messageList:addFilterIsSynthesisMessage', function(){
                that.panelGroup.filterThroughPanelLock.apply(that.panelGroup, [
                    function(){
                        that.addFilterIsSynthesMessage();
                    }, 'syncWithCurrentIdea'
                ]);
            });

            Assembl.vent.on('messageList:showAllMessages', function(){
                that.panelGroup.filterThroughPanelLock.apply(that.panelGroup, [
                    function(){
                        that.showAllMessages();
                    }, 'syncWithCurrentIdea'
                ]);
            });

            Assembl.vent.on('messageList:currentQuery', function(){
                if(!that.panelGroup.isGroupLocked()) {
                    that.currentQuery.clearAllFilters();
                }
            });
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

                'click #messageList-message-collapseButton': 'toggleThreadMessages',

                'click #messageList-closeButton': 'closePanel',
                'click #messageList-fullscreenButton': 'setFullscreen',

                'click #messageList-prevbutton': 'showPreviousMessages',
                'click #messageList-morebutton': 'showNextMessages'
            };

            _.each(this.ViewStyles, function(messageListViewStyle){
              var key = 'click #'+messageListViewStyle.css_id;
              data[key] = 'onMessageListViewStyle';
            } );
            
            _.each(Ctx.AVAILABLE_MESSAGE_VIEW_STYLES, function(messageViewStyle){
                var key = 'click #'+DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX+messageViewStyle.id;
                data[key] = 'onDefaultMessageViewStyle';
            } );

            return data;
        },
        
        /**
         * Synchronizes the panel with the currently selected idea (possibly none)
         */
        syncWithCurrentIdea: function(){
            var currentIdea = Ctx.getCurrentIdea(),
                filterValue;

            Ctx.openPanel(this);
            //!currentIdea?filterValue=null:filterValue=currentIdea.getId();
            //console.log("messageList:syncWithCurrentIdea(): New idea is now: ",currentIdea, this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, filterValue));
            //TODO benoitg - this logic should really be un postQuery, not here - 2014-07-29
            if(currentIdea && this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, currentIdea.getId())) {
                //Filter is already in sync
                return;
            }
            else if (!currentIdea && (this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null) == false)) {
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
                if(Ctx.debugRender) {
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
        template: Ctx.loadTemplate('messageList'),

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

        allMessageStructureCollection: undefined,
        //messages

        /**
         * The array generated by objectTreeRenderVisitor's data_by_object
         * when visiting the message tree
         * @type {}
         */
        visitorViewData: {},

        /**
         * An index for the visitorViewData mapping traversal order with 
         * object id.  Generated by objectTreeRenderVisitor's order_lookup_table
         * when visiting the message tree
         * @type []
         */
        visitorOrderLookupTable: [],
        
        /**
         * A list of "root" messages that have no parent or ancestors in the set
         * of messages to display.  GGenerated by objectTreeRenderVisitor's roots
         * when visiting the message tree
         * @type []
         */
        visitorRootMessagesToDisplay: [],
        /**
         * Stores the first offset of messages onscreen
         * 
         * @type {Number}
         */
        offsetStart: 0,

        /**
         * Stores the last offset of messages onscreen
         * @type {Number}
         */
        offsetEnd: MORE_PAGES_NUMBER,
        
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
         * Reset the offset values to initial values
         */
        resetOffsets: function(){
            this.offsetStart = 0;
            this.offsetEnd = MORE_PAGES_NUMBER;
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
                    var selector = Ctx.format('[id="{0}"]', previousScrollTarget.messageHtmlId);
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
         *

         */
        calculateThreadedMessagesOffsets: function(data_by_object, order_lookup_table, requestedOffsets){
            var returnedDataOffsets = {},
                numMessages = order_lookup_table.length,
                i;
            if(numMessages>0) {
                //Find preceding root message, and include it
                //It is not possible that we do not find one if there is 
                //at least one message
                for(i=requestedOffsets['offsetStart']; i>=0; i--) {
                    if(data_by_object[order_lookup_table[i]]['last_ancestor_id']==undefined){
                        returnedDataOffsets['offsetStart']=i;
                        break;
                    }
                }
            }
            else {
                returnedDataOffsets['offsetStart']=0;
            }
            if(requestedOffsets['offsetEnd']>(numMessages-1)) {
                returnedDataOffsets['offsetEnd']=(numMessages-1);
            }
            else {
                if(data_by_object[order_lookup_table[requestedOffsets['offsetEnd']]]['last_ancestor_id']==undefined) {
                    returnedDataOffsets['offsetEnd'] = requestedOffsets['offsetEnd'];
                }
                else {
                    //If the requested offsetEnd isn't a root, find next root message, and stop just
                    //before it
                    
                    for(i=requestedOffsets['offsetEnd']; i<numMessages; i++) {
                        if(data_by_object[order_lookup_table[i]]['last_ancestor_id']==undefined){
                            returnedDataOffsets['offsetEnd']=i-1;
                            break;
                        }
                    }
                    if (returnedDataOffsets['offsetEnd']==undefined) {
                        //It's possible we didn't find a root, if we are at the very end of the list
                        returnedDataOffsets['offsetEnd']=numMessages;
                    }
                }
            }
            
            return returnedDataOffsets;
        },
        
        /**
         * @param messageId of the message that we want onscreen
         * @return {} requetedOffset structure
         */
        calculateRequestedOffsetToShowMessage: function(messageId){
            return this.calculateRequestedOffsetToShowOffset(this.getMessageOffset(messageId));
        },
            
        /**
         * @param messageOffset of the message that we want onscreen
         * @return {} requetedOffset structure
         */
        calculateRequestedOffsetToShowOffset: function(messageOffset){
            var requestedOffsets = {},
            requestedOffsets;
            
            requestedOffsets['offsetStart']=null;
            requestedOffsets['offsetEnd']=null;
            
            if((messageOffset < this.offsetStart) && (messageOffset > (this.offsetStart - MAX_MESSAGES_IN_DISPLAY))){
                //If within allowable messages onscreen, we "extend" the view
                requestedOffsets['offsetStart'] = messageOffset;
                if(this.offsetEnd - requestedOffsets['offsetStart'] <= MAX_MESSAGES_IN_DISPLAY) {
                    requestedOffsets['offsetEnd'] = this.offsetEnd;
                }
                else {
                    requestedOffsets['offsetEnd'] = requestedOffsets['offsetStart'] + MAX_MESSAGES_IN_DISPLAY;
                }
            }
            else if((messageOffset > this.offsetEnd) && (messageOffset < (this.offsetEnd + MAX_MESSAGES_IN_DISPLAY))){
                //If within allowable messages onscreen, we "extend" the view
                requestedOffsets['offsetEnd'] = messageOffset;
                if(requestedOffsets['offsetEnd'] - this.offsetStart <= MAX_MESSAGES_IN_DISPLAY) {
                    requestedOffsets['offsetStart'] = this.offsetStart;
                }
                else {
                    requestedOffsets['offsetStart'] = requestedOffsets['offsetEnd'] - MAX_MESSAGES_IN_DISPLAY;
                }
            }
            else {
                //request an offset centered on the message
                requestedOffsets['offsetStart'] = messageOffset-Math.floor(MORE_PAGES_NUMBER/2);
                requestedOffsets['offsetStart'] = messageOffset+Math.ceil(MORE_PAGES_NUMBER/2);
            }
            
            return requestedOffsets;
        },

        
        /**                
         * Returns the messages to be rendered
         * @return {Message[]}
         */
        getAllMessagesToDisplay: function(){
            var toReturn = [],
                that = this,
                model = null,
                messages = this.allMessageStructureCollection;

            that.messageIdsToDisplay.forEach(function(id){
                model = messages.get(id);
                if (model){
                    toReturn.push(model);
                } else {
                    console.log('ERROR:  getAllMessagesToDisplay():  Message with id '+id+' not found!');
                }
            });

            return toReturn;
        },

        /**
         * Load the new batch of messages according to the requested `offsetStart`
         * and `offsetEnd` prop
         */
        showMessages: function(requestedOffsets){
            var that = this,
                ideaList = this.$('.idealist'),
                views,
                models,
                offsets,
                returnedOffsets = {};
                
            /* The MessageFamilyView will re-fill the renderedMessageViewsCurrent
             * array with the newly calculated rendered MessageViews.
             */
            this.renderedMessageViewsCurrent = {};
            //console.log("requestedOffsets:",requestedOffsets);
            if ((this.currentViewStyle == this.ViewStyles.THREADED) ||
                (this.currentViewStyle == this.ViewStyles.NEW_MESSAGES)) {
                models = this.visitorRootMessagesToDisplay;
                returnedOffsets = this.calculateThreadedMessagesOffsets(this.visitorViewData, that.visitorOrderLookupTable, requestedOffsets);
                views = this.getRenderedMessagesThreaded(models, 1, this.visitorViewData, returnedOffsets);
            } else {
                models = this.getAllMessagesToDisplay();
                views = this.getRenderedMessagesFlat(models, requestedOffsets, returnedOffsets);
            }
            //console.log("returnedOffsets:", returnedOffsets);
            this.offsetStart = returnedOffsets['offsetStart']
            this.offsetEnd = returnedOffsets['offsetEnd']
            ideaList.empty();

            if( views.length === 0 ){
                ideaList.append( Ctx.format("<div class='margin'>{0}</div>", i18n.gettext('No messages')) );
            } else {
                ideaList.append( views );
            }

            if( this.offsetStart <= 0 ){
                this.$('#messageList-toparea').addClass('hidden');
            } else {
                this.$('#messageList-toparea').removeClass('hidden');
            }

            if( this.offsetEnd >= (models.length-1) ){
                this.$('#messageList-bottomarea').addClass('hidden');
            } else {
                this.$('#messageList-bottomarea').removeClass('hidden');
            }

            this.initAnnotator();
        },

        /**
         * Show the next bunch of messages to be displayed.
         */
        showNextMessages: function(){
            var requestedOffsets = {};

            requestedOffsets = this.getNextMessagesRequestedOffsets();

            this.showMessages(requestedOffsets);
        },

        /**
         * Show the previous bunch of messages to be displayed
         */
        showPreviousMessages: function(){
            var requestedOffsets = {};

            requestedOffsets = this.getPreviousMessagesRequestedOffsets();

            this.showMessages(requestedOffsets);
        },

        /**
         * Get the requested offsets when scrolling down
         * @private
         */
        getNextMessagesRequestedOffsets: function(){
            var retval = {};

            retval['offsetEnd'] = this.offsetEnd + MORE_PAGES_NUMBER;

            if((retval['offsetEnd'] - this.offsetStart) > MAX_MESSAGES_IN_DISPLAY){
                retval['offsetStart'] = this.offsetStart + ((retval['offsetEnd'] -this.offsetStart) - MAX_MESSAGES_IN_DISPLAY)
            }
            else {
                retval['offsetStart'] = this.offsetStart;
            }
            retval['scrollTransitionWasAtOffset'] = this.offsetEnd;
            return retval;
        },

        /**
         * Get the requested offsets when scrooling up
         * @private
         */
        getPreviousMessagesRequestedOffsets: function(){
            var messagesInDisplay,
            retval = {};

            retval['offsetStart'] = this.offsetStart - MORE_PAGES_NUMBER;
            if( retval['offsetStart'] < 0 ){
                retval['offsetStart'] = 0;
            }

            
            if(this.offsetEnd - retval['offsetStart'] > MAX_MESSAGES_IN_DISPLAY){
                retval['offsetEnd'] = this.offsetEnd - ((this.offsetEnd - retval['offsetStart']) - MAX_MESSAGES_IN_DISPLAY)
            }
            else {
                retval['offsetEnd'] = this.offsetEnd;
            }
            retval['scrollTransitionWasAtOffset'] = this.offsetStart;
            return retval;
        },

        /**
         * @return {Number} returns the current number of messages displayed 
         * in the message list
         */
        getCurrentNumberOfMessagesDisplayed: function(){
            var ret = 0; 
            /*
             * This recursively calculates the number of children for every
             * root.  Not required unless we implement breaking in the middle of
             * a thread (and would still needs to be modified). benoitg- 2014-05-16
            _.each(this.renderedMessageViewsCurrent, function(message){
                if( ! message.model.get('parentId') ){
                    ret += message.model.getDescendantsCount() + 1;
                }
            });
            */
            ret = _.size(this.renderedMessageViewsCurrent);
            return ret;
        },
        
        /**
         * The actual rendering for the render function
         * @return {views.Message}
         */
        render_real: function(){
            var that = this,
                views = [],
                data = {
                    availableViewStyles: this.ViewStyles,
                    currentViewStyle: this.currentViewStyle,
                    DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX: DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX,
                    collapsed: this.collapsed,
                    queryInfo: this.currentQuery.getHtmlDescription(),
                    canPost: Ctx.getCurrentUser().can(Permissions.ADD_POST)
                },
                previousScrollTarget = null;
            /*
            console.log("messageIdsToDisplay is: ");
            console.log(that.messageIdsToDisplay);
            */
            if( ! (Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT))){
              $("body").addClass("js_annotatorUserCannotAddExtract"); 
            }
            Ctx.cleanTooltips(this.$el);
            previousScrollTarget = this.getPreviousScrollTarget();
            
            this.$el.html( this.template(data) );

            Ctx.initTooltips(this.$el);


            this.renderCollapseButton();
            this.renderDefaultMessageViewDropdown();
            this.renderMessageListViewStyleDropdown();

            this.newTopicView = new MessageSendView({
                'allow_setting_subject': true,
                'reply_idea': null,
                'body_help_message': i18n.gettext('You can start a new topic in this discussion by typing a subject above, and a first post here...'),
                'send_button_label': i18n.gettext('Start a new topic in this discussion'),
                'subject_label': i18n.gettext('New topic subject:'),
                'mandatory_body_missing_msg': i18n.gettext('You need to type a comment first...'),
                'mandatory_subject_missing_msg': i18n.gettext('You need to set a subject to add a new topic...'),
                'messageList':that
            });

            this.$('#messagelist-replybox').append( this.newTopicView.render().el );

            // Resetting the messages
            this.resetOffsets();
            var collectionManager = new CollectionManager();
            collectionManager.getAllMessageStructureCollectionPromise().done(
                function(allMessageStructureCollection) {
                    that.allMessageStructureCollection = allMessageStructureCollection;
                    that.showMessages({
                        offsetStart: 0,
                        offsetEnd: MORE_PAGES_NUMBER
                    })
                    that.scrollToPreviousScrollTarget(previousScrollTarget);
                    Assembl.vent.trigger("messageList:render_complete", "Render complete");
                })
            

            
            return this;
        },

        /**
         * The render function
         * @return {views.Message}
         */
        render: function(){
            var that = this,
                collectionManager = new CollectionManager();

            var successCallback = function(messageStructureCollection, resultMessageIdCollection){
                that = that.render_real();
                that.unblockPanel();
            }
            
            /* This should be a listen to the returned collection */
            var changedDataCallback = function(messageStructureCollection, resultMessageIdCollection) {
                function inFilter(message) {
                    return that.messageIdsToDisplay.indexOf(message.getId()) >= 0;
                    };
                that.messageIdsToDisplay = resultMessageIdCollection;
                that.visitorViewData = {};
                that.visitorOrderLookupTable = [];
                that.visitorRootMessagesToDisplay = [];
                messageStructureCollection.visitDepthFirst(objectTreeRenderVisitor(that.visitorViewData, that.visitorOrderLookupTable, that.visitorRootMessagesToDisplay, inFilter));
            }

            
            if(Ctx.debugRender) {
                console.log("messageList:render() is firing");
            }

            // TODO:  Not clean, this is just so something is shown immediately.
            // Data not yet available should be handled in render_real - benoitg
            this.render_real();
            this.blockPanel();
            
            $.when(collectionManager.getAllMessageStructureCollectionPromise(),
                    this.currentQuery.getResultMessageIdCollectionPromise()).done(
                changedDataCallback, successCallback);

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
            html += '</span><i class="icon-arrowdown"></i>';
            html += '<ul class="dropdown-list">';
            _.each(Ctx.AVAILABLE_MESSAGE_VIEW_STYLES, function(messageViewStyle) {
                html += '<li id="' + DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX + messageViewStyle.id +'" class="dropdown-listitem">'+ messageViewStyle.label+'</li>';
            });
            html += '</ul>';
            div.html(html);
        },

        /**
         * Renders the messagelist view style dropdown button
         */
        renderMessageListViewStyleDropdown: function(){
            var that = this,
                div = this.$('#js_messageListViewStyle-dropdown'),
                html = "";

            html += '<span class="dropdown-label text-bold">';
            html += this.currentViewStyle.label;
            html += '</span><i class="icon-arrowdown"></i>';
            html += '<ul class="dropdown-list">';
            _.each(this.ViewStyles, function(messageListViewStyle) {
                html += '<li id="' + messageListViewStyle.css_id + '" class="dropdown-listitem">'+ messageListViewStyle.label+'</li>';
            });
            html += '</ul>';
            div.html(html);
        
        },
        
        /**
         * Return a list with all views.el already rendered for a flat view
         * @param {Message.Model[]} messages
         * @param {} requestedOffsets The requested offsets
         * @param {} returnedDataOffsets The actual offsets of data actually returned (may be different
         * from requestedOffsets
         * @return {HTMLDivElement[]}
         */
        getRenderedMessagesFlat: function(messages, requestedOffsets, returnedDataOffsets){
            var list = [],
                filter = this.currentFilter,
                len = messages.length,
                i = _.isUndefined(requestedOffsets['offsetStart']) ? 0 : requestedOffsets['offsetStart'],
                view, model, children, prop, isValid;
            
            returnedDataOffsets['offsetStart'] = i;
            returnedDataOffsets['offsetEnd'] = _.isUndefined(requestedOffsets['offsetEnd']) ? MORE_PAGES_NUMBER : requestedOffsets['offsetEnd'];
            if( returnedDataOffsets['offsetEnd'] < len ){
                // if offsetEnd is bigger than len, do not use it
                len = returnedDataOffsets['offsetEnd'] + 1;
            }
            else {
                returnedDataOffsets['offsetEnd'] = len - 1;
            }

            for (; i < len; i++) {
                model = messages[i];
                if( _.isUndefined(model) ){
                    continue;
                }

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
         * @param {Message.Model[]} list of root messages to render at the current level
         * @param {Number} [level=1] The current hierarchy level
         * @param {Object[]} data_by_object render information from ideaRendervisitor
         * @return {HTMLDivElement[]}
         */
        getRenderedMessagesThreaded: function(messages, level, data_by_object, offsets){
            var list = [],
                i = 0,
                len = messages.length,
                view, model, children, prop, isValid,
                last_sibling_chain,
                current_message_info;
            /**  [last_sibling_chain] which of the view's ancestors are the last child of their respective parents.
             * 
             * @param message
             * @param data_by_object
             * @returns
             */
            function buildLastSibblingChain(message, data_by_object) {
                var last_sibling_chain = [],
                current_message_id = message.getId(),
                next_parent,
                current_message_info;
                while(current_message_id) {
                    current_message_info = data_by_object[current_message_id]
                    //console.log("Building last sibbiling chain, current message: ",current_message_id, current_message_info);
                    last_sibling_chain.unshift(current_message_info['is_last_sibling']);
                    current_message_id = current_message_info['last_ancestor_id'];
                }
                return last_sibling_chain;
            }

            if( _.isUndefined(level) ){
                level = 1;
            }

            for (i; i < len; i++) {
                model = messages[i];
                current_message_info = data_by_object[model.getId()];
                if((current_message_info['traversal_order'] >= offsets['offsetStart'])
                   && (current_message_info['traversal_order'] <= offsets['offsetEnd'])){
                    if(current_message_info['last_sibling_chain'] == undefined) {
                        current_message_info['last_sibling_chain'] = buildLastSibblingChain(model, data_by_object);
                    }
                    last_sibling_chain = current_message_info['last_sibling_chain']
                    //console.log(last_sibling_chain);
                    view = new MessageFamilyView({model:model, messageListView:this}, last_sibling_chain);
                    view.currentLevel = level;
                    children = current_message_info['children'];
                    var subviews = this.getRenderedMessagesThreaded(children, level+1, data_by_object, offsets);
                    view.hasChildren = (subviews.length > 0);
                    list.push(view.render().el);
                    view.$('.messagelist-children').append( subviews );
    
                    /* TODO:  benoitg:  We need good handling when we skip a grandparent, but I haven't ported this code yet.
                     * We should also handle the case where 2 messages have the same parent, but the parent isn't in the set */
                    /*if (!isValid && this.hasDescendantsInFilter(model)) {
                        //Generate ghost message
                        var ghost_element = $('<div class="message message--skip"><div class="skipped-message"></div><div class="messagelist-children"></div></div>');
                        console.log("Invalid message was:",model);
                        list.push(ghost_element);
                        children = model.getChildren();
                        ghost_element.find('.messagelist-children').append( this.getRenderedMessagesThreaded(
                            children, level+1, data_by_object) );
                    }
                    */
                }
            }
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
            var that = this;

            this.destroyAnnotator();
            //console.log("initAnnotator called");
            // Saving the annotator reference
            this.annotator = this.$('#messageList-list').annotator().data('annotator');

            // TODO: Re-render message in messagelist if an annotation was added...
            this.annotator.subscribe('annotationCreated', function(annotation){
                //FIXME: find another way to reach this function by events or call without instanciate the class
                var segmentList = new SegmentList();
                var segment = segmentList.addAnnotationAsSegment(annotation, Ctx.currentAnnotationIdIdea);

                if( !segment.isValid() ){
                    annotator.deleteAnnotation(annotation);
                } else if( Ctx.currentAnnotationNewIdeaParentIdea ){
                    //We asked to create a new idea from segment
                    that.panelGroup.lockGroup();
                    var newIdea = Ctx.currentAnnotationNewIdeaParentIdea.addSegmentAsChild(segment);
                    Ctx.setCurrentIdea(newIdea);
                }
                else {
                    segment.save();
                }
                Ctx.currentAnnotationNewIdeaParentIdea = null;
                Ctx.currentAnnotationIdIdea = null;
            });

            this.annotator.subscribe('annotationEditorShown', function(annotatorEditor, annotation){
                $(document.body).append(annotatorEditor.element);
                var save = $(annotatorEditor.element).find(".annotator-save");
                save.text(i18n.gettext('Send to clipboard'));
                var textarea = annotatorEditor.fields[0].element.firstChild,
                    div = $('<div>', { 'draggable': true, 'class': 'annotator-textarea' });

                div.html(annotation.quote);

                div.on('dragstart', function(ev){
                    Ctx.showDragbox(ev, annotation.quote);
                    Ctx.setDraggedAnnotation(annotation, annotatorEditor);
                });

                div.on('dragend', function(ev){
                    Ctx.setDraggedAnnotation(null, annotatorEditor);
                });

                $(textarea).replaceWith(div);
                if( $(annotatorEditor.element).find(".annotator-draganddrop-help").length === 0 ) {
                    $(annotatorEditor.element).find(".annotator-textarea").after(DIV_ANNOTATOR_HELP);
                }
                //Because the MessageView will need it
                that.annotatorEditor = annotatorEditor;
            });

            this.annotator.subscribe('annotationViewerShown', function(viewer, annotation){
                // We do not need the annotator's tooltip
                viewer.hide();
            });

            // We need extra time for annotator to be ready, but I don't 
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

            this.trigger("annotator:destroy", this.annotator);

            this.annotator.unsubscribe('annotationsLoaded');
            this.annotator.unsubscribe('annotationCreated');
            this.annotator.unsubscribe('annotationEditorShown');
            this.annotator.unsubscribe('annotationViewerShown');

            this.annotator.destroy();
            this.annotator = null;
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
            //console.log("messageList:showAllMessages() called");
            this.currentQuery.clearAllFilters();
            this.render();
        },
        
        /**
         * Load posts that belong to an idea
         * @param {String} ideaId
         * @param {bool} show only unread messages (this parameter is optional and is a flag)
         */
        addFilterIsRelatedToIdea: function(idea, only_unread){
            //Can't filter on an idea at the same time as getting synthesis messages
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_SYNTHESIS, null);
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_ORPHAN, null);
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null);

            if ( arguments.length > 1 )
            {
                if ( only_unread === null )
                    this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_UNREAD, null);
                else
                    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_UNREAD, only_unread);
            }
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
            this.currentQuery.setView(this.currentQuery.availableViews.THREADED);
          }
          else if(viewStyle === this.ViewStyles.REVERSE_CHRONOLOGICAL) {
            this.currentViewStyle = this.ViewStyles.REVERSE_CHRONOLOGICAL;
            this.currentQuery.setView(this.currentQuery.availableViews.REVERSE_CHRONOLOGICAL);
          }
          else if(viewStyle === this.ViewStyles.CHRONOLOGICAL) {
            this.currentViewStyle = this.ViewStyles.CHRONOLOGICAL;
            this.currentQuery.setView(this.currentQuery.availableViews.CHRONOLOGICAL);
          }
          else if(viewStyle === this.ViewStyles.NEW_MESSAGES) {
            this.currentViewStyle = this.ViewStyles.NEW_MESSAGES;
            this.currentQuery.setView(this.currentQuery.availableViews.THREADED);
          }
          else {
            throw "Unsupported view style";
          }
          if(this.storedMessageListConfig.viewStyleId != viewStyle.id) {
            this.storedMessageListConfig.viewStyleId = viewStyle.id;
            Ctx.setMessageListConfigToStorage(this.storedMessageListConfig);
          }
        
        },

        /**
         * @event
         */
        onMessageListViewStyle: function(e){
            var messageListViewStyleId = (e.currentTarget.id);
            var messageListViewStyleSelected = this.getViewStyleDefByCssId(messageListViewStyleId);
            this.setViewStyle(messageListViewStyleSelected);
            this.render();
        },
        
        /**
         * @event
         */
        onDefaultMessageViewStyle: function(e){
            var messageViewStyleId = (e.currentTarget.id).replace(DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX, '');
            var messageViewStyleSelected = Ctx.getMessageViewStyleDefById(messageViewStyleId);
            this.defaultMessageStyle = messageViewStyleSelected;
            this.setIndividualMessageViewStyleForMessageListViewStyle(messageViewStyleSelected);
            this.renderDefaultMessageViewDropdown();
        },
        
        getTargetMessageViewStyleFromMessageListConfig: function(messageView){
          var targetMessageViewStyle;
          if(this.currentViewStyle == this.ViewStyles.NEW_MESSAGES) {
            if(messageView.model.get('read')) {
              targetMessageViewStyle = Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.TITLE_ONLY;
            }
            else {
              targetMessageViewStyle = this.defaultMessageStyle;
            }
          }
          else {
            targetMessageViewStyle = this.defaultMessageStyle;
          }
          return targetMessageViewStyle;
        },
        
        /**
         * @event
         * Set the default messageView, re-renders messages if the view doesn't match
         * @param messageViewStyle (ex:  preview, title only, etc.)
         */
        setIndividualMessageViewStyleForMessageListViewStyle: function(messageViewStyle){
          // ex: Chronological, Threaded, etc.
          var that = this,
              messageListViewStyle = this.currentViewStyle;
          
          _.each(this.renderedMessageViewsCurrent, function(messageView) {
            var targetMessageViewStyle = that.getTargetMessageViewStyleFromMessageListConfig(messageView);
            if (messageView.viewStyle !== targetMessageViewStyle)  {
              messageView.setViewStyle(targetMessageViewStyle);
              messageView.render();
            }
          });

          if(this.storedMessageListConfig.messageStyleId != messageViewStyle.id) {
            this.storedMessageListConfig.messageStyleId = messageViewStyle.id;
            Ctx.setMessageListConfigToStorage(this.storedMessageListConfig);
          }
        },
        /** Return the message offset in the current view, in the set of filtered 
         * messages
         * @param {String} messageId
         * @return {Integer} [callback] The message offest if message is found
         */
        getMessageOffset: function(messageId){
            var messageOffset;
            if ((this.currentViewStyle == this.ViewStyles.THREADED) ||
                (this.currentViewStyle == this.ViewStyles.NEW_MESSAGES)) {
                messageOffset = this.visitorViewData[messageId].traversal_order;
            } else {
                messageOffset = this.messageIdsToDisplay.indexOf(messageId);
            }
            return messageOffset;
        },
        
        /**
         * Is the message currently onscreen (in the set of filtered messages
         * AND between the offsets onscreen
         * @param {String} id
         * @return{Boolean} true or false 
         */
        isMessageOnscreen: function(id){
            var messageIndex = this.getMessageOffset(id);
            //console.log("isMessageOnscreen", this.offsetStart, messageIndex, this.offsetEnd)
            return (this.offsetStart <= messageIndex) && (messageIndex <= this.offsetEnd);
        },
        
        /**
         * Highlights the message by the given id
         * @param {String} id
         * @param {Function} [callback] The callback function to call if message is found
         */
        showMessageById: function(id, callback){
            //TODO:  Use a promise here, it will crash most of the time... benoitg 2014-07-23
            var that = this,
                selector = Ctx.format('[id="message-{0}"]', id),
                el,
                messageIsDisplayed = false,
                that = this,
                requestedOffsets,
                collectionManager = new CollectionManager();

            collectionManager.getAllMessageStructureCollectionPromise().done(
                function(allMessageStructureCollection) {
                  var message = allMessageStructureCollection.get(id)
                  that.messageIdsToDisplay.forEach(function(displayedId){
                      if (displayedId == id){
                          messageIsDisplayed = true;
                      }
                  });
                  
                  if(messageIsDisplayed && !that.isMessageOnscreen(id)) {
                      var success = function() {
                          console.log("showMessageById() message " + id + " not onscreen, calling showMessageById() recursively");
                          that.showMessageById(id, callback);
                      };
                      requestedOffsets = that.calculateRequestedOffsetToShowMessage(id);
                      that.showMessages(requestedOffsets);
                      that.listenToOnce(that, "messageList:render_complete", success);
                  }
                  if( !messageIsDisplayed ){
                      //The current filters might not include the message
                    that.showAllMessages();
                      var success = function() {
                          console.log("showMessageById() message " + id + " not found, calling showMessageById() recursively");
                          that.showMessageById(id, callback);
                      };
                      that.listenToOnce(that, "messageList:render_complete", success);
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
                          var panelBody = that.$('.panel-body');
                          var panelOffset = panelBody.offset().top;
                          var offset = el.offset().top;
                          // Scrolling to the element
                          var target = offset - panelOffset + panelBody.scrollTop();
                          panelBody.animate({ scrollTop: target }, { complete: real_callback });
                      } else {
                          console.log("showMessageById(): ERROR:  Message " + id + " not found in the DOM with selector: " + selector);
                      }
                  }
                  else {
                      console.log("showMessageById(): ERROR:  Message " + id + " not found in collection");
                  }
                });

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
        }

    });

    return MessageList;
});
