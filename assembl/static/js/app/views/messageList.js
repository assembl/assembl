define(function (require) {
    'use strict';

    var Backbone = require('backbone'),
        objectTreeRenderVisitor = require('views/visitors/objectTreeRenderVisitor'),
        MessageFamilyView = require('views/messageFamily'),
        _ = require('underscore'),
        $ = require('jquery'),
        Assembl = require('app'),
        Ctx = require('common/context'),
        Message = require('models/message'),
        i18n = require('utils/i18n'),
        PostQuery = require('views/messageListPostQuery'),
        Permissions = require('utils/permissions'),
        MessageSendView = require('views/messageSend'),
        AssemblPanel = require('views/assemblPanel'),
        CollectionManager = require('common/collectionManager');

    /**
     * Constants
     */
    var DIV_ANNOTATOR_HELP = Ctx.format("<div class='annotator-draganddrop-help'>{0}</div>", i18n.gettext('You can drag the segment above directly to the table of ideas')),
        DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX = "js_defaultMessageView-",
        MESSAGE_LIST_VIEW_LI_ID_PREFIX = "messageList-view-",
        MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX = "js_messageList-view-",
    /* The maximum number of messages that can be loaded at the same time
     * before being removed from memory
     */
        MAX_MESSAGES_IN_DISPLAY = 50,
    /* The number of messages to load each time the user reaches scrools to
     * the end or beginning of the list.
     */
        MORE_PAGES_NUMBER = 20,
        SLOW_WORKER_DELAY_VALUE = 20;

    /**
     * @class views.MessageList
     */
    var MessageList = AssemblPanel.extend({
        panelType: 'messageList',
        className: 'panel messageList',
        lockable: true,
        gridSize: AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE,
        minWidth: 400, // basic, may receive idea offset.

        ui: {
            panelBody: ".panel-body",
            queryInfo: ".messageList-query-info",
            viewStyleDropdown: ".js_messageListViewStyle-dropdown",
            defaultMessageViewDropdown: ".js_defaultMessageView-dropdown",
            topArea: '.js_messageList-toparea',
            bottomArea: '.js_messageList-bottomarea',
            collapseButton: '.js_messageList-collapseButton',
            loadPreviousMessagesButton: '.js_messageList-prevbutton',
            loadNextMessagesButton: '.js_messageList-morebutton',
            messageList: '.messageList-list',
            userThreadedViewButton: '.messageListViewStyleUserThreaded',
            userHighlightNewViewButton: '.messageListViewStyleUserHighlightNew',
            stickyBar: '.sticky-box',
            replyBox: '.messagelist-replybox',
            inspireMe: '.js_inspireMe',
            inspireMeAnchor: '.js_inspireMeAnchor'
        },

        initialize: function (options) {
            var that = this,
                collectionManager = new CollectionManager();
            that.renderIsComplete = false;
            this.renderedMessageViewsCurrent = {};

            this.setViewStyle(this.getViewStyleDefById(this.storedMessageListConfig.viewStyleId));
            this.defaultMessageStyle = Ctx.getMessageViewStyleDefById(this.storedMessageListConfig.messageStyleId) || Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.PREVIEW;

            this.panelWrapper = options.panelWrapper;
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
                function (allMessageStructureCollection) {
                    that.listenTo(allMessageStructureCollection, 'add reset', function () {
                        that.currentQuery.invalidateResults();
                        that.render();
                    });
                }
            );

            collectionManager.getAllExtractsCollectionPromise().done(
                function (allExtractsCollection) {
                    //that.initAnnotator();//Not sure if this is necessary anymore - benoitg-2014-07-29
                    that.listenTo(allExtractsCollection, 'add remove reset', that.initAnnotator);
                }
            );

            this.listenTo(Assembl.vent, 'idea:selected', function (idea) {
                //console.log("vent.on idea:selected fired");
                if (idea) {
                    if (idea.id) {
                        if (that.currentQuery.isFilterInQuery(that.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, idea.getId())) {
                            //Filter is already in sync
                            //TODO:  Detect the case where there is no idea selected, and we already have no filter on ideas
                            return;
                        }
                    } else {
                        this.listenToOnce(idea, "acquiredId", function () {
                            that.ideaChanged();
                        });
                        return;
                    }
                }
                this.ideaChanged();
            });

            this.listenTo(Assembl.vent, 'messageList:showMessageById', function (id, callback) {
                that.showMessageById(id, callback);
            });

            this.listenTo(Assembl.vent, 'messageList:addFilterIsRelatedToIdea', function (idea, only_unread) {
                that.panelWrapper.filterThroughPanelLock(
                    function () {
                        that.addFilterIsRelatedToIdea(idea, only_unread)
                    }, 'syncWithCurrentIdea');
            });

            this.listenTo(this, 'messageList:clearAllFilters', function () {
                that.panelWrapper.filterThroughPanelLock(
                    function () {
                        that.currentQuery.clearAllFilters();
                    }, 'clearAllFilters');
            });

            this.listenTo(this, 'messageList:addFilterIsOrphanMessage', function () {
                that.panelWrapper.filterThroughPanelLock(
                    function () {
                        that.addFilterIsOrphanMessage();
                    }, 'syncWithCurrentIdea');
            });

            this.listenTo(this, 'messageList:addFilterIsSynthesisMessage', function () {
                that.panelWrapper.filterThroughPanelLock(
                    function () {
                        that.addFilterIsSynthesMessage();
                    }, 'syncWithCurrentIdea');
            });

            this.listenTo(Assembl.vent, 'messageList:showAllMessages', function () {
                that.panelWrapper.filterThroughPanelLock(
                    function () {
                        that.showAllMessages();
                    }, 'syncWithCurrentIdea');
            });

            this.listenTo(Assembl.vent, 'messageList:currentQuery', function () {
                if (!that.panelWrapper.isPanelLocked()) {
                    that.currentQuery.clearAllFilters();
                }
            });
        },

        /**
         * The events
         * @type {Object}
         */
        events: function () {
            var that = this,
                data = {
                    'click .idealist-title': 'onTitleClick',
                    'click .post-query-filter-info .js_deleteFilter ': 'onFilterDeleteClick',
                    'click .js_messageList-collapseButton': 'toggleMessageView',

                    'click .js_messageList-allmessages': 'showAllMessages',
                    'click .js_messageList-onlyorphan': 'addFilterIsOrphanMessage',
                    'click .js_messageList-onlysynthesis': 'addFilterIsSynthesMessage',
                    'click .js_messageList-isunread': 'addFilterIsUnreadMessage',

                    'click .js_messageList-fullScreenButton': 'setFullscreen',

                    'click .js_messageList-prevbutton': 'showPreviousMessages',
                    'click .js_messageList-morebutton': 'showNextMessages',

                    'click .js_openTargetInModal': 'openTargetInModal',

                    'click .js_scrollToMsgBox': 'scrollToMsgBox'
                };

            _.each(this.ViewStyles, function (messageListViewStyle) {
                var key = 'click .' + messageListViewStyle.css_class;
                data[key] = 'onMessageListViewStyle';
            });

            _.each(Ctx.AVAILABLE_MESSAGE_VIEW_STYLES, function (messageViewStyle) {
                var key = 'click .' + that.getMessageViewStyleCssClass(messageViewStyle);
                data[key] = 'onDefaultMessageViewStyle';
            });

            return data;
        },

        getTitle: function () {
            return i18n.gettext('Conversations');
        },

        ViewStyles: {
            THREADED: {
                id: "threaded",
                css_class: MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX + "threaded",
                label: i18n.gettext('Threaded')
            },
            CHRONOLOGICAL: {
                id: "chronological",
                css_class: MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX + "chronological",
                label: i18n.gettext('Chronological')
            },
            REVERSE_CHRONOLOGICAL: {
                id: "reverse_chronological",
                css_class: MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX + "activityfeed",
                label: i18n.gettext('Reverse-Chronological')
            },
            NEW_MESSAGES: {
                id: "new_messages",
                css_class: MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX + "newmessages",
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

        inspireMeLink: null,

        /**
         * get a view style definition by id
         * @param {viewStyle.id}
         * @return {viewStyle or undefined}
         */
        getViewStyleDefById: function (viewStyleId) {
            var retval = _.find(this.ViewStyles, function (viewStyle) {
                return viewStyle.id == viewStyleId;
            });
            return retval;
        },
        /**
         * get a view style css_class
         * @param {messageViewStyle}
         * @return {String}
         */
        getMessageViewStyleCssClass: function (messageViewStyle) {
            return DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX + messageViewStyle.id;
        },

        /**
         * get a view style definition by id
         * @param {messageViewStyle.id}
         * @return {messageViewStyle or undefined}
         */
        getMessageViewStyleDefByCssClass: function (messageViewStyleClass) {
            var that = this;
            return  _.find(Ctx.AVAILABLE_MESSAGE_VIEW_STYLES, function (messageViewStyle) {
                return that.getMessageViewStyleCssClass(messageViewStyle) == messageViewStyleClass;
            });
        },
        /**
         * get a view style definition by id
         * @param {messageViewStyle.id}
         * @return {messageViewStyle or undefined}
         */
        getMessageListViewStyleDefByCssClass: function (messageListViewStyleClass) {
            return  _.find(this.ViewStyles, function (viewStyle) {
                return viewStyle.css_class == messageListViewStyleClass;
            });
        },

        ideaChanged: function () {
            var that = this;
            this.panelWrapper.filterThroughPanelLock(
                function () {
                    that.syncWithCurrentIdea();
                }, 'syncWithCurrentIdea');
        },

        /**
         * Synchronizes the panel with the currently selected idea (possibly none)
         */
        syncWithCurrentIdea: function () {
            var currentIdea = Ctx.getCurrentIdea(),
                filterValue,
                that = this;

            Ctx.openPanel(this);
            //!currentIdea?filterValue=null:filterValue=currentIdea.getId();
            //console.log("messageList:syncWithCurrentIdea(): New idea is now: ",currentIdea, this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, filterValue));
            //TODO benoitg - this logic should really be in postQuery, not here - 2014-07-29
            if (currentIdea && this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, currentIdea.getId())) {
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
                this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, null);
                this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_SYNTHESIS, null);

                if (currentIdea) {
                    this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_ORPHAN, null);
                    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, currentIdea.getId());
                    //app.openPanel(app.messageList);
                }
                if (Ctx.debugRender) {
                    console.log("messageList:syncWithCurrentIdea(): triggering render because new idea was selected");
                }
                //console.log("messageList:syncWithCurrentIdea(): Query is now: ",this.currentQuery._query);
                this.render();
            }

            var promise = Ctx.getWidgetDataAssociatedToIdeaPromise(currentIdea.getId());
            that.ui.inspireMe.hide();
            promise.done(
                function (data) {
                    console.log("syncWithCurrentIdea getWidgetDataAssociatedToIdeaPromise received data: ", data);
                    if ( "inspiration_widget_url" in data )
                    {
                        that.inspireMeLink = data.inspiration_widget_url;
                        if ( that.inspireMeLink )
                        {
                            console.log("change the href of the inspireMe link");
                            that.ui.inspireMeAnchor.attr("href", that.inspireMeLink);
                            that.ui.inspireMe.show();
                        }
                        //that.render();
                    }
                    else
                        that.inspireMeLink = null;
                    if ( !that.inspireMeLink )
                        that.ui.inspireMe.hide();
                }
            );
        },

        /**
         * The template
         * @type {_.template}
         */
        template: '#tmpl-messageList',

        /**
         * The collapse/expand flag
         * @type {Boolean}
         */
        collapsed: false,

        /**
         * List of message id's to be displayed in the interface
         * @type {MessageCollection}
         *
         * TODO:  THIS IS TO BE REPLACED WITH getResultMessageIdCollectionPromise(), which is the same data
         */
        DEPRECATEDmessageIdsToDisplay: [],

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
         * Reset the offset values to initial values
         */
        resetOffsets: function () {
            this.offsetStart = 0;
            this.offsetEnd = MORE_PAGES_NUMBER;
        },

        getPreviousScrollTarget: function () {
            var panelOffset = null,
                panelScrollTop = 0,
                messageViewScrolledInto = null,
                messageViewScrolledIntoOffset = -Number.MAX_VALUE,
                retval = null;
            //We may have been called on the first render, so we have to check
            if (this.ui.panelBody.size > 0 && (this.ui.panelBody.offset() !== undefined)) {
                panelOffset = this.ui.panelBody.offset().top;
                panelScrollTop = this.ui.panelBody.scrollTop();
                //console.log("this.ui.panelBody", this.ui.panelBody, "panelScrollTop", panelScrollTop);
                if (panelScrollTop !== 0) {
                    // Scrolling to the element
                    //var target = offset - panelOffset + panelBody.scrollTop();
                    //console.log("panelOffset", panelOffset);
                    var selector = $('.message');
                    _.every(this.renderedMessageViewsCurrent, function (view) {
                        var retval = true;
                        //console.log("view",view);
                        var collection = view.$el.find(selector).addBack(selector);
                        //console.log("collection", collection);
                        collection.each(function () {
                            //console.log(this);
                            var messageOffset = $(this).offset().top - panelOffset;
                            //console.log("message ", $(this).attr('id'), "position", messageOffset);
                            if (messageOffset < 0) {
                                if (messageOffset > messageViewScrolledIntoOffset) {
                                    messageViewScrolledInto = view;
                                    messageViewScrolledIntoOffset = messageOffset;
                                }
                            }
                            else {
                                // the list is not in display order in threaded view
                                // so I don't see a way to break out
                                // scroll position, break out of the loop
                                // retval = false;
                            }
                            return retval;
                        });
                        return retval;
                    });
                    if (messageViewScrolledInto) {
                        //console.log("message in partial view has subject:", messageViewScrolledInto.model.get('subject'));
                        var messageHtmlId = messageViewScrolledInto.$el.attr('id');
                        retval = {messageHtmlId: messageHtmlId,
                            innerOffset: messageViewScrolledIntoOffset};
                    }
                }
            }
            return retval;
        },

        scrollToPreviousScrollTarget: function () {
            var panelOffset = null,
                panelScrollTop = 0,
                previousScrollTarget = this.previousScrollTarget;

            if (previousScrollTarget) {
                //console.log("scrollToPreviousScrollTarget(): Trying to scroll to:", previousScrollTarget)
                //We may have been called on the first render, so we have to check
                if (this.ui.panelBody.offset() !== undefined) {
                    //console.log("panelBody", panelBody);
                    panelOffset = this.ui.panelBody.offset().top;
                    panelScrollTop = this.ui.panelBody.scrollTop();
                    //console.log("panelScrollTop", panelScrollTop, "panelOffset", panelOffset);
                    var selector = Ctx.format('[id="{0}"]', previousScrollTarget.messageHtmlId);
                    var message = this.$(selector);
                    if (!_.size(message)) {
                        //console.log("scrollToPreviousScrollTarget() can't find element with id:",previousScrollTarget.messageHtmlId);
                        return;
                    }
                    var messageCurrentOffset = message.offset().top;
                    //console.log("messageCurrentOffset", messageCurrentOffset);

                    // Scrolling to the element
                    var target = messageCurrentOffset - panelOffset - previousScrollTarget.innerOffset;
                    //console.log("target",target);
                    this.ui.panelBody.animate({ scrollTop: target });
                }
            }
        },

        getMinWidthWithOffset: function (offset) {
            return this.minWidth + offset;
        },

        scrollToElement: function (el) {
            if (this.ui.panelBody.offset() !== undefined) {
                var panelOffset = this.ui.panelBody.offset().top,
                    panelScrollTop = this.ui.panelBody.scrollTop(),
                    elOffset = el.offset().top,
                    margin = 30,
                    target = elOffset - panelOffset + panelScrollTop - margin;

                this.ui.panelBody.animate({ scrollTop: target });
            }
        },

        /**
         *

         */
        calculateThreadedMessagesOffsets: function (data_by_object, order_lookup_table, requestedOffsets) {
            var returnedDataOffsets = {},
                numMessages = order_lookup_table.length;

            if (numMessages > 0) {
                //Find preceding root message, and include it
                //It is not possible that we do not find one if there is 
                //at least one message
                //Gaby: Never declare an incremental variable "i" out of loop, it's a memory leak
                for (var i = requestedOffsets['offsetStart']; i >= 0; i--) {

                    if (data_by_object[order_lookup_table[i]]['last_ancestor_id'] === null) {

                        returnedDataOffsets['offsetStart'] = i;
                        break;
                    }
                }
            }
            else {
                returnedDataOffsets['offsetStart'] = 0;
            }
            if (requestedOffsets['offsetEnd'] > (numMessages - 1)) {
                returnedDataOffsets['offsetEnd'] = (numMessages - 1);
            }
            else {
                if (data_by_object[order_lookup_table[requestedOffsets['offsetEnd']]]['last_ancestor_id'] === null) {
                    returnedDataOffsets['offsetEnd'] = requestedOffsets['offsetEnd'];
                }
                else {
                    //If the requested offsetEnd isn't a root, find next root message, and stop just
                    //before it

                    for (var i = requestedOffsets['offsetEnd']; i < numMessages; i++) {
                        if (data_by_object[order_lookup_table[i]]['last_ancestor_id'] === null) {
                            returnedDataOffsets['offsetEnd'] = i - 1;
                            break;
                        }
                    }
                    if (returnedDataOffsets['offsetEnd'] === undefined) {
                        //It's possible we didn't find a root, if we are at the very end of the list
                        returnedDataOffsets['offsetEnd'] = numMessages;
                    }
                }
            }

            return returnedDataOffsets;
        },

        /**
         * @param messageId of the message that we want onscreen
         * @return {} requetedOffset structure
         */
        calculateRequestedOffsetToShowMessage: function (messageId) {
            return this.calculateRequestedOffsetToShowOffset(this.getMessageOffset(messageId));
        },

        /**
         * @param messageOffset of the message that we want onscreen
         * @return {} requetedOffset structure
         */
        calculateRequestedOffsetToShowOffset: function (messageOffset) {
            var requestedOffsets = {},
                requestedOffsets;

            requestedOffsets['offsetStart'] = null;
            requestedOffsets['offsetEnd'] = null;

            if ((messageOffset < this.offsetStart) && (messageOffset > (this.offsetStart - MAX_MESSAGES_IN_DISPLAY))) {
                //If within allowable messages onscreen, we "extend" the view
                requestedOffsets['offsetStart'] = messageOffset;
                if (this.offsetEnd - requestedOffsets['offsetStart'] <= MAX_MESSAGES_IN_DISPLAY) {
                    requestedOffsets['offsetEnd'] = this.offsetEnd;
                }
                else {
                    requestedOffsets['offsetEnd'] = requestedOffsets['offsetStart'] + MAX_MESSAGES_IN_DISPLAY;
                }
            }
            else if ((messageOffset > this.offsetEnd) && (messageOffset < (this.offsetEnd + MAX_MESSAGES_IN_DISPLAY))) {
                //If within allowable messages onscreen, we "extend" the view
                requestedOffsets['offsetEnd'] = messageOffset;
                if (requestedOffsets['offsetEnd'] - this.offsetStart <= MAX_MESSAGES_IN_DISPLAY) {
                    requestedOffsets['offsetStart'] = this.offsetStart;
                }
                else {
                    requestedOffsets['offsetStart'] = requestedOffsets['offsetEnd'] - MAX_MESSAGES_IN_DISPLAY;
                }
            }
            else {
                //request an offset centered on the message
                requestedOffsets['offsetStart'] = messageOffset - Math.floor(MORE_PAGES_NUMBER / 2);
                requestedOffsets['offsetStart'] = messageOffset + Math.ceil(MORE_PAGES_NUMBER / 2);
            }

            return requestedOffsets;
        },


        /**
         * Returns the messages to be rendered
         * @return {Message[]}
         */
        getAllMessageStructureModelsToDisplay: function () {
            var toReturn = [],
                that = this,
                model = null,
                messages = this.allMessageStructureCollection;

            that.DEPRECATEDmessageIdsToDisplay.forEach(function (id) {
                model = messages.get(id);
                if (model) {
                    toReturn.push(model);
                } else {
                    console.log('ERROR:  getAllMessageStructureModelsToDisplay():  Message with id ' + id + ' not found!');
                }
            });

            return toReturn;
        },

        /**
         * Load the new batch of messages according to the requested `offsetStart`
         * and `offsetEnd` prop
         */
        showMessages: function (requestedOffsets) {
            var that = this,
                views_promise,
                models,
                offsets,
                numMessages,
                returnedOffsets = {},
                messageIdsToShow = [],
                messageFullModelsToShowPromise;

            //console.log("showMessages() called with requestedOffsets: ", requestedOffsets);
            /* The MessageFamilyView will re-fill the renderedMessageViewsCurrent
             * array with the newly calculated rendered MessageViews.
             */
            this.renderedMessageViewsCurrent = {};
            this.suspendAnnotatorRefresh();
            this.previousScrollTarget = this.getPreviousScrollTarget();

            if ((this.currentViewStyle == this.ViewStyles.THREADED) ||
                (this.currentViewStyle == this.ViewStyles.NEW_MESSAGES)) {
                models = this.visitorRootMessagesToDisplay;
                numMessages = _.size(that.visitorOrderLookupTable);
                returnedOffsets = this.calculateThreadedMessagesOffsets(this.visitorViewData, that.visitorOrderLookupTable, requestedOffsets);
                messageIdsToShow = this.visitorOrderLookupTable.slice(returnedOffsets['offsetStart'], returnedOffsets['offsetEnd']);
                var collectionManager = new CollectionManager();

                messageFullModelsToShowPromise = collectionManager.getMessageFullModelsPromise(messageIdsToShow);

                views_promise = this.getRenderedMessagesThreaded(models, 1, this.visitorViewData, returnedOffsets);
            } else {
                models = this.getAllMessageStructureModelsToDisplay();
                numMessages = _.size(models);
                views_promise = this.getRenderedMessagesFlat(models, requestedOffsets, returnedOffsets);
            }
            $.when(views_promise).done(function (views) {
                //console.log("requestedOffsets:",requestedOffsets, "returnedOffsets:", returnedOffsets, "numMessages", numMessages);
                that.offsetStart = returnedOffsets['offsetStart']
                that.offsetEnd = returnedOffsets['offsetEnd']

                if (views.length === 0) {
                    that.ui.messageList.append(Ctx.format("<div class='margin'>{0}</div>", i18n.gettext('No messages')));
                } else {
                    that.ui.messageList.append(views);
                }
                that.scrollToPreviousScrollTarget();
                if (that.offsetStart <= 0) {
                    that.ui.topArea.addClass('hidden');
                } else {
                    that.ui.topArea.removeClass('hidden');
                }

                if (that.offsetEnd >= (numMessages - 1)) {
                    that.ui.bottomArea.addClass('hidden');
                } else {
                    that.ui.bottomArea.removeClass('hidden');
                }

                that.resumeAnnotatorRefresh();
                that.renderIsComplete = true;
                that.trigger("messageList:render_complete", "Render complete");
            });

        },

        /**
         * Used for processing costly operations that needs to happen after
         * the dom is displayed to the user.
         *
         * It will be processed with a delay between each call to avoid locaking the browser
         */
        requestPostRenderSlowCallback: function (callback) {
            this._postRenderSlowCallbackStack.push(callback);

        },

        /**
         * The worker
         */
        _postRenderSlowCallbackWorker: function (messageListView) {
            var that = this;
            //console.log("_postRenderSlowCallbackWorker fired, stack length: ", this._postRenderSlowCallbackStack.length)

            if (this._postRenderSlowCallbackStack.length > 0) {
                //console.log("_postRenderSlowCallbackWorker fired with non-empty stack, popping a callback from stack of length: ", this._postRenderSlowCallbackStack.length)
                var callback = this._postRenderSlowCallbackStack.shift();
                callback();
            }
            this._postRenderSlowCallbackWorkerInterval = setTimeout(function () {
                that._postRenderSlowCallbackWorker();
            }, this.SLOW_WORKER_DELAY_VALUE)
        },

        /**
         *
         */
        _startPostRenderSlowCallbackProcessing: function () {
            var that = this;
            this._postRenderSlowCallbackWorkerInterval = setTimeout(function () {
                that._postRenderSlowCallbackWorker();
            }, this.SLOW_WORKER_DELAY_VALUE);
        },
        /**
         * Stops processing and clears the queue
         */
        _clearPostRenderSlowCallbacksCallbackProcessing: function () {
            clearTimeout(this._postRenderSlowCallbackWorkerInterval);
            this._postRenderSlowCallbackStack = [];
        },

        /**
         * Re-init Annotator.  Needs to be done for all messages when any
         * single message has been re-rendered.  Otherwise, the annotations
         * will not be shown.
         */
        doAnnotatorRefresh: function () {
            if (Ctx.debugRender) {
                console.log("messageList:doAnnotatorRefresh() called for " + _.size(this.renderedMessageViewsCurrent) + " messages");
            }
            this.annotatorRefreshRequested = false;
            this.initAnnotator();
            _.each(this.renderedMessageViewsCurrent, function (messageView) {
                messageView.loadAnnotations();
            });
        },

        /**
         * Should be called by a messageview anytime it has annotations and has
         * rendered a view that shows annotations.
         */
        requestAnnotatorRefresh: function () {
            if (this.annotatorRefreshSuspended === true) {
                this.annotatorRefreshRequested = true;
            }
            else {
                this.doAnnotatorRefresh();
            }

        },

        /**
         * Suspends annotator refresh during initial render
         */
        suspendAnnotatorRefresh: function () {
            this.annotatorRefreshSuspended = true;
        },
        /**
         * Will call a refresh synchronously if any refresh was requested
         * while suspended
         */
        resumeAnnotatorRefresh: function () {
            this.annotatorRefreshSuspended = false;
            if (this.annotatorRefreshRequested === true) {
                this.doAnnotatorRefresh();
            }
        },

        /**
         * Show the next bunch of messages to be displayed.
         */
        showNextMessages: function () {
            var requestedOffsets = {};

            requestedOffsets = this.getNextMessagesRequestedOffsets();

            this.showMessages(requestedOffsets);
        },

        /**
         * Show the previous bunch of messages to be displayed
         */
        showPreviousMessages: function () {
            var requestedOffsets = {};

            requestedOffsets = this.getPreviousMessagesRequestedOffsets();

            this.showMessages(requestedOffsets);
        },

        /**
         * Get the requested offsets when scrolling down
         * @private
         */
        getNextMessagesRequestedOffsets: function () {
            var retval = {};

            retval['offsetEnd'] = this.offsetEnd + MORE_PAGES_NUMBER;

            if ((retval['offsetEnd'] - this.offsetStart) > MAX_MESSAGES_IN_DISPLAY) {
                retval['offsetStart'] = this.offsetStart + ((retval['offsetEnd'] - this.offsetStart) - MAX_MESSAGES_IN_DISPLAY)
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
        getPreviousMessagesRequestedOffsets: function () {
            var messagesInDisplay,
                retval = {};

            retval['offsetStart'] = this.offsetStart - MORE_PAGES_NUMBER;
            if (retval['offsetStart'] < 0) {
                retval['offsetStart'] = 0;
            }


            if (this.offsetEnd - retval['offsetStart'] > MAX_MESSAGES_IN_DISPLAY) {
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
        getCurrentNumberOfMessagesDisplayed: function () {
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

        serializeData: function () {
            return {
                Ctx: Ctx,
                availableViewStyles: this.ViewStyles,
                currentViewStyle: this.currentViewStyle,
                collapsed: this.collapsed,
                canPost: Ctx.getCurrentUser().can(Permissions.ADD_POST),
                inspireMeLink: this.inspireMeLink
            };
        },

        /**
         * Retrieves the first new message id (if any) for the current user
         * @return Message.Model or undefined
         */
        findFirstUnreadMessageId: function (visitorOrderLookupTable, messageCollection) {
          return _.find(visitorOrderLookupTable, function(messageId){
            var is_new = messageCollection.get(messageId).get('read') === false;
            //console.log(is_new, messageCollection.get(messageId));
            return is_new;
            });
        },
        
        
        /**
         * The actual rendering for the render function
         * @return {views.Message}
         */
        render_real: function () {
            var that = this,
                views = [];

            if (!(Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT))) {
                $("body").addClass("js_annotatorUserCannotAddExtract");
            }

            Ctx.initTooltips(this.$el);

            if (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.SIMPLE) {
                this.renderUserViewButtons();
            } else {
                this.renderQueryInfo();
            }

            this.renderCollapseButton();
            this.renderDefaultMessageViewDropdown();
            this.renderMessageListViewStyleDropdown();

            var options = {
                'allow_setting_subject': true,
                'send_button_label': i18n.gettext('Send'),
                'subject_label': i18n.gettext('Subject'),
                'body_help_message': i18n.gettext('Add a subject above and start a new topic here'),
                'mandatory_body_missing_msg': i18n.gettext('You need to type a comment first...'),
                'mandatory_subject_missing_msg': i18n.gettext('You need to set a subject to add a new topic...'),
                'messageList': that
            };

            var currentIdea = Ctx.getCurrentIdea();
            if (currentIdea && this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, currentIdea.getId())) {
                options.reply_idea_id = currentIdea.getId();
            }

            this.newTopicView = new MessageSendView(options);
            this.$('.messagelist-replybox').html(this.newTopicView.render().el);

            // Resetting the messages
            this.resetOffsets();
            var collectionManager = new CollectionManager();
            collectionManager.getAllMessageStructureCollectionPromise().done(
                function (allMessageStructureCollection) {
                    that.allMessageStructureCollection = allMessageStructureCollection;
                    var first_unread_id = that.findFirstUnreadMessageId(that.visitorOrderLookupTable, that.allMessageStructureCollection);
                    that.showMessages({
                      offsetStart: 0,
                      offsetEnd: MORE_PAGES_NUMBER
                    });
                    if (that.currentViewStyle === that.ViewStyles.NEW_MESSAGES && first_unread_id) {
                      console.log('DISABLED (BUGGY):  Highlighting first new message (may not be on the same page)');
                      //that.showMessageById(first_unread_id, undefined, undefined, false);
                    }
                    that._startPostRenderSlowCallbackProcessing();
                })
            return this;
        },

        onBeforeRender: function () {
            this._clearPostRenderSlowCallbacksCallbackProcessing();
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);
        },

        /**
         * The render function
         * @return {views.Message}
         */
        onRender: function () {
            var that = this,
                collectionManager = new CollectionManager();
            this.renderIsComplete = false;
            var successCallback = function (messageStructureCollection, resultMessageIdCollection) {
                that = that.render_real();
                that.unblockPanel();
            }

            /* TODO:  This should be a listen to the returned collection */
            var changedDataCallback = function (messageStructureCollection, resultMessageIdCollection) {
                function inFilter(message) {
                    return that.DEPRECATEDmessageIdsToDisplay.indexOf(message.getId()) >= 0;
                };
                that.destroyAnnotator();
                //Some messages may be present from before
                that.ui.messageList.empty();
                // TODO: Destroy the message and messageFamily views, as they keep zombie listeners and DOM
                // In particular, message.loadAnnotations gets called with different views on the same model,
                // including zombie views, and we get nested annotator tags as a result.
                // (Annotator looks at fresh DOM every time).  Is that still the case?  Benoitg - 2014-09-19
                // TODO long term: Keep them with a real CompositeView.
                that.DEPRECATEDmessageIdsToDisplay = resultMessageIdCollection;
                that.visitorViewData = {};
                that.visitorOrderLookupTable = [];
                that.visitorRootMessagesToDisplay = [];
                messageStructureCollection.visitDepthFirst(objectTreeRenderVisitor(that.visitorViewData, that.visitorOrderLookupTable, that.visitorRootMessagesToDisplay, inFilter));
            }


            if (Ctx.debugRender) {
                console.log("messageList:render() is firing");
            }

            // TODO:  Not clean, this is just so something is shown immediately.
            // Data not yet available should be handled in render_real - benoitg
            this.render_real();
            this.blockPanel();
            //Some messages may be present from before
            this.ui.messageList.empty();

            $.when(collectionManager.getAllMessageStructureCollectionPromise(),
                this.currentQuery.getResultMessageIdCollectionPromise()).done(
                changedDataCallback, successCallback);

            this.ui.panelBody.scroll(function () {

                var msgBox = that.$('.messagelist-replybox').height(),
                    scrollH = $(this)[0].scrollHeight - (msgBox + 25),
                    panelScrollTop = $(this).scrollTop() + $(this).innerHeight();

                if (panelScrollTop >= scrollH) {
                    that.ui.stickyBar.fadeOut();
                } else {
                    that.ui.stickyBar.fadeIn();
                }

            })

        },
        /**
         * Renders the search result information
         */
        renderQueryInfo: function () {
            this.ui.queryInfo.html(this.currentQuery.getHtmlDescription());
        },

        /**
         * Renders the search result information
         */
        renderUserViewButtons: function () {
            var resultNumTotal,
                resultNumUnread;

            if (this.currentViewStyle == this.ViewStyles.THREADED) {
                this.ui.userHighlightNewViewButton.removeClass('selected');
                this.ui.userThreadedViewButton.addClass('selected');
            }
            else if (this.currentViewStyle == this.ViewStyles.NEW_MESSAGES) {
                this.ui.userHighlightNewViewButton.addClass('selected');
                this.ui.userThreadedViewButton.removeClass('selected');
            }
            else {
                console.log("This viewstyle is unknown in user mode:", this.currentViewStyle);
            }
            this.currentQuery.getResultNumTotal() === undefined ? resultNumTotal = '' : resultNumTotal = i18n.sprintf("%d", this.currentQuery.getResultNumTotal());
            this.ui.userThreadedViewButton.html(i18n.sprintf(i18n.gettext('All %s'), resultNumTotal));
            this.currentQuery.getResultNumUnread() === undefined ? resultNumUnread = '' : resultNumUnread = i18n.sprintf("%d", this.currentQuery.getResultNumUnread());
            this.ui.userHighlightNewViewButton.html(i18n.sprintf(i18n.gettext('Unread %s'), resultNumUnread));
        },


        /**
         * Renders the collapse button
         */
        renderCollapseButton: function () {
            if (this.collapsed) {
                this.ui.collapseButton.attr('data-tooltip', i18n.gettext('Expand all'));
                this.ui.collapseButton.removeClass('icon-upload').addClass('icon-download-1');
            } else {
                this.ui.collapseButton.attr('data-tooltip', i18n.gettext('Collapse all'));
                this.ui.collapseButton.removeClass('icon-download-1').addClass('icon-upload');
            }
        },

        /**
         * Renders the default message view style dropdown button
         */
        renderDefaultMessageViewDropdown: function () {
            var that = this,
                html = "";

            html += '<span class="dropdown-label">';
            html += this.defaultMessageStyle.label;
            html += '</span><i class="icon-arrowdown"></i>';
            html += '<ul class="dropdown-list">';
            _.each(Ctx.AVAILABLE_MESSAGE_VIEW_STYLES, function (messageViewStyle) {
                html += '<li class="' + that.getMessageViewStyleCssClass(messageViewStyle) + ' dropdown-listitem">' + messageViewStyle.label + '</li>';
            });
            html += '</ul>';
            this.ui.defaultMessageViewDropdown.html(html);
        },

        /**
         * Renders the messagelist view style dropdown button
         */
        renderMessageListViewStyleDropdown: function () {
            var that = this,
                html = "";

            html += '<span class="dropdown-label">';
            html += this.currentViewStyle.label;
            html += '</span><i class="icon-arrowdown"></i>';
            html += '<ul class="dropdown-list">';
            _.each(this.ViewStyles, function (messageListViewStyle) {
                html += '<li class="' + messageListViewStyle.css_class + ' dropdown-listitem">' + messageListViewStyle.label + '</li>';
            });
            html += '</ul>';
            this.ui.viewStyleDropdown.html(html);

        },

        /**
         * Return a list with all views.el already rendered for a flat view
         * @param {Message.Model[]} messages
         * @param {} requestedOffsets The requested offsets
         * @param {} returnedDataOffsets The actual offsets of data actually returned (may be different
         * from requestedOffsets
         * @return {HTMLDivElement[]}
         */
        getRenderedMessagesFlat: function (messages, requestedOffsets, returnedDataOffsets) {
            var that = this,
                filter = this.currentFilter,
                len = messages.length,
                i = _.isUndefined(requestedOffsets['offsetStart']) ? 0 : requestedOffsets['offsetStart'],
                view,
                messageStructureModel,
                children,
                prop,
                isValid,
                defer = $.Deferred(),
                collectionManager = new CollectionManager(),
                requestedIds = [];

            returnedDataOffsets['offsetStart'] = i;
            returnedDataOffsets['offsetEnd'] = _.isUndefined(requestedOffsets['offsetEnd']) ? MORE_PAGES_NUMBER : requestedOffsets['offsetEnd'];
            if (returnedDataOffsets['offsetEnd'] < len) {
                // if offsetEnd is bigger than len, do not use it
                len = returnedDataOffsets['offsetEnd'] + 1;
            }
            else {
                returnedDataOffsets['offsetEnd'] = len - 1;
            }
            for (; i < len; i++) {
                messageStructureModel = messages[i];
                if (_.isUndefined(messageStructureModel)) {
                    console.log("FIXME:  This should NOT happen!");
                    continue;
                }
                requestedIds.push(messageStructureModel.id);
            }

            collectionManager.getMessageFullModelsPromise(requestedIds).done(
                function (fullMessageModels) {
                    var list = [];
                    _.each(fullMessageModels, function (fullMessageModel) {
                        view = new MessageFamilyView({
                            model: fullMessageModel,
                            messageListView: that
                        });
                        view.hasChildren = false;
                        list.push(view.render().el);
                    });
                    //console.log("getRenderedMessagesFlat():  Resolving promise with:",list);
                    defer.resolve(list);
                },
                function () {
                    defer.reject();
                }
            );

            return defer.promise();
        },

        /**
         * Return a list with all views.el already rendered for threaded views
         * @param {Message.Model[]} list of messages to render at the current level
         * @param {Number} [level=1] The current hierarchy level
         * @param {Object[]} data_by_object render information from ideaRendervisitor
         * @return {jquery.promise}
         */
        getRenderedMessagesThreaded: function (sibblings, level, data_by_object, offsets) {
            var that = this,
                list = [],
                i = 0,
                view,
                messageStructureModel,
                children,
                prop,
                isValid,
                last_sibling_chain,
                current_message_info,
                defer = $.Deferred(),
                collectionManager = new CollectionManager();

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
                while (current_message_id) {
                    current_message_info = data_by_object[current_message_id]
                    //console.log("Building last sibbiling chain, current message: ",current_message_id, current_message_info);
                    last_sibling_chain.unshift(current_message_info['is_last_sibling']);
                    current_message_id = current_message_info['last_ancestor_id'];
                }
                return last_sibling_chain;
            }

            if (_.isUndefined(level)) {
                level = 1;
            }
            //console.log("sibblings",sibblings.length);
            //This actually replaces the for loop for sibblings

            messageStructureModel = sibblings.shift();
            //console.log("messageStructureModel",messageStructureModel);
            if (!messageStructureModel) {
                return list;
            }
            current_message_info = data_by_object[messageStructureModel.getId()];

            //Only process if message is within requested offsets
            if ((current_message_info['traversal_order'] >= offsets['offsetStart'])
                && (current_message_info['traversal_order'] <= offsets['offsetEnd'])) {

                if (current_message_info['last_sibling_chain'] === undefined) {
                    current_message_info['last_sibling_chain'] = buildLastSibblingChain(messageStructureModel, data_by_object);
                }
                last_sibling_chain = current_message_info['last_sibling_chain']
                //console.log(last_sibling_chain);

                children = current_message_info['children'];

                //Process children, if any
                if (_.size(children) > 0) {
                    var subviews_promise = this.getRenderedMessagesThreaded(children, level + 1, data_by_object, offsets);
                }
                else {
                    var subviews_promise = [];
                }

                //Process sibblings, if any (this is for-loop rewritten as recursive calls to avoid locking the browser)
                if (sibblings.length > 0) {
                    var sibblingsviews_promise = this.getRenderedMessagesThreaded(sibblings, level, data_by_object, offsets);
                }
                else {
                    var sibblingsviews_promise = [];
                }

                $.when(subviews_promise, sibblingsviews_promise, collectionManager.getMessageFullModelPromise(messageStructureModel.id)).done(function (subviews, sibblingsviews, messageFullModel) {
                    view = new MessageFamilyView({model: messageFullModel, messageListView: that}, last_sibling_chain);
                    view.currentLevel = level;
                    //Note:  benoitg: We could put a setTimeout here, but apparently the promise is enough to unlock the browser
                    view.hasChildren = (subviews.length > 0);
                    list.push(view.render().el);
                    view.$('.messagelist-children').append(subviews);

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
                    if (sibblingsviews.length > 0) {
                        list = list.concat(sibblingsviews);
                    }
                    defer.resolve(list);
                });
            }
            else {
                return list;
            }
            return defer.promise();
        },


        /**
         * Inits the annotator instance
         */
        initAnnotator: function () {
            var that = this;

            this.destroyAnnotator();
            //console.log("initAnnotator called");
            // Saving the annotator reference
            this.annotator = this.$('.messageList-list').annotator().data('annotator');

            // TODO: Re-render message in messagelist if an annotation was added...
            this.annotator.subscribe('annotationCreated', function (annotation) {
                var collectionManager = new CollectionManager();
                collectionManager.getAllExtractsCollectionPromise().done(
                    function (allExtractsCollection) {
                        var segment = allExtractsCollection.addAnnotationAsExtract(annotation, Ctx.currentAnnotationIdIdea);
                        if (!segment.isValid()) {
                            annotator.deleteAnnotation(annotation);
                        } else if (Ctx.currentAnnotationNewIdeaParentIdea) {
                            //We asked to create a new idea from segment
                            that.panelWrapper.lockPanel();
                            var newIdea = Ctx.currentAnnotationNewIdeaParentIdea.addSegmentAsChild(segment);
                            Ctx.setCurrentIdea(newIdea);
                        }
                        else {
                            segment.save();
                        }
                        Ctx.currentAnnotationNewIdeaParentIdea = null;
                        Ctx.currentAnnotationIdIdea = null;
                    });
            });

            this.annotator.subscribe('annotationEditorShown', function (annotatorEditor, annotation) {
                $(document.body).append(annotatorEditor.element);
                var save = $(annotatorEditor.element).find(".annotator-save");
                save.text(i18n.gettext('Send to clipboard'));
                var textarea = annotatorEditor.fields[0].element.firstChild,
                    div = $('<div>', { 'draggable': true, 'class': 'annotator-textarea' });

                div.html(annotation.quote);

                div.on('dragstart', function (ev) {
                    Ctx.showDragbox(ev, annotation.quote);
                    Ctx.setDraggedAnnotation(annotation, annotatorEditor);
                });

                div.on('dragend', function (ev) {
                    Ctx.setDraggedAnnotation(null, annotatorEditor);
                });

                $(textarea).replaceWith(div);
                if ($(annotatorEditor.element).find(".annotator-draganddrop-help").length === 0) {
                    $(annotatorEditor.element).find(".annotator-textarea").after(DIV_ANNOTATOR_HELP);
                }
                //Because the MessageView will need it
                that.annotatorEditor = annotatorEditor;
            });

            this.annotator.subscribe('annotationViewerShown', function (viewer, annotation) {
                // We do not need the annotator's tooltip
                viewer.hide();
            });

            // We need extra time for annotator to be ready, but I don't 
            // know why and how much.  benoitg 2014-03-10
            setTimeout(function () {
                that.trigger("annotator:initComplete", that.annotator);
            }, 10);

        },

        /**
         * destroy the current annotator instance and remove all listeners
         */
        destroyAnnotator: function () {
            if (!this.annotator) {
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
        addFilterByPostId: function (postId) {
            this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, postId);
            this.render();
        },

        /**
         * Toggle hoist on a post (filter which shows posts which are descendent of a given post)
         */
        toggleFilterByPostId: function (postId) {
            var alreadyHere = this.currentQuery.isFilterActive(this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, postId);
            if (alreadyHere) {
                this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, null);
                this.render();
            }
            else {
                this.addFilterByPostId(postId);
            }
            return !alreadyHere;
        },

        /**
         * @event
         * Shows all messages (clears all filters)
         */
        showAllMessages: function () {
            //console.log("messageList:showAllMessages() called");
            this.currentQuery.clearAllFilters();
            this.render();
        },

        /**
         * Load posts that belong to an idea
         * @param {String} ideaId
         * @param {bool} show only unread messages (this parameter is optional and is a flag)
         */
        addFilterIsRelatedToIdea: function (idea, only_unread) {
            //Can't filter on an idea at the same time as getting synthesis messages
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_SYNTHESIS, null);
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_ORPHAN, null);
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null);
            // this was probably set before... eg by synthesis panel, and is cancelled when clicking an idea.
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, null);

            if (arguments.length > 1) {
                if (only_unread === null)
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
        addFilterIsSynthesMessage: function () {
            //Can't filter on an idea at the same time as getting synthesis messages
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null);
            this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_SYNTHESIS, true);
            this.render();
        },

        /**
         * Load posts that are synthesis posts
         * @param {String} ideaId
         */
        addFilterIsOrphanMessage: function () {
            //Can't filter on an idea at the same time as getting orphan messages
            this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null);
            this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_ORPHAN, true);
            this.render();
        },
        /**
         * Load posts that are read or unread
         * @param {String} ideaId
         */
        addFilterIsUnreadMessage: function () {
            this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_UNREAD, true);
            this.render();
        },

        openTargetInModal: function (evt) {
            return Ctx.openTargetInModal(evt);
        },

        /**
         * @event
         * Set the view to the selected viewStyle, if allowable by the current user
         * Otherwise, sets the default style
         * Does NOT re-render
         *
         */
        setViewStyle: function (viewStyle) {
            if (!viewStyle) {
                //If invalid, set global default
                viewStyle = this.ViewStyles.NEW_MESSAGES;
            }

            if (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.SIMPLE) {
                if (Ctx.getCurrentUser().isUnknownUser() && (viewStyle != this.ViewStyles.THREADED)) {
                    //Only threaded view makes sence for annonymous users
                    viewStyle = this.ViewStyles.THREADED;
                }
                else if ((viewStyle != this.ViewStyles.NEW_MESSAGES) && (viewStyle != this.ViewStyles.THREADED)) {
                    //New messages is default view
                    viewStyle = this.ViewStyles.NEW_MESSAGES;
                }
            }

            if (viewStyle === this.ViewStyles.THREADED) {
                this.currentViewStyle = this.ViewStyles.THREADED;
                this.currentQuery.setView(this.currentQuery.availableViews.THREADED);
            }
            else if (viewStyle === this.ViewStyles.REVERSE_CHRONOLOGICAL) {
                this.currentViewStyle = this.ViewStyles.REVERSE_CHRONOLOGICAL;
                this.currentQuery.setView(this.currentQuery.availableViews.REVERSE_CHRONOLOGICAL);
            }
            else if (viewStyle === this.ViewStyles.CHRONOLOGICAL) {
                this.currentViewStyle = this.ViewStyles.CHRONOLOGICAL;
                this.currentQuery.setView(this.currentQuery.availableViews.CHRONOLOGICAL);
            }
            else if (viewStyle === this.ViewStyles.NEW_MESSAGES) {
                this.currentViewStyle = this.ViewStyles.NEW_MESSAGES;
                this.currentQuery.setView(this.currentQuery.availableViews.THREADED);
            }
            else {
                throw "Unsupported view style";
            }
            if (this.storedMessageListConfig.viewStyleId != viewStyle.id) {
                this.storedMessageListConfig.viewStyleId = viewStyle.id;
                Ctx.setMessageListConfigToStorage(this.storedMessageListConfig);
            }

        },

        /**
         * @event
         */
        onMessageListViewStyle: function (e) {
            var messageListViewStyleClass,
                messageListViewStyleSelected,
                classes = $(e.currentTarget).attr('class').split(" ");
            messageListViewStyleClass = _.find(classes, function (cls) {
                return cls.indexOf(MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX) === 0;
            });
            var messageListViewStyleSelected = this.getMessageListViewStyleDefByCssClass(messageListViewStyleClass);
            this.setViewStyle(messageListViewStyleSelected);
            this.render();
        },


        /**
         * @event
         */
        onDefaultMessageViewStyle: function (e) {
            var classes = $(e.currentTarget).attr('class').split(" "),
                defaultMessageListViewStyleClass;
            defaultMessageListViewStyleClass = _.find(classes, function (cls) {
                return cls.indexOf(DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX) === 0;
            });
            var messageViewStyleSelected = this.getMessageViewStyleDefByCssClass(defaultMessageListViewStyleClass);
            this.defaultMessageStyle = messageViewStyleSelected;
            this.setIndividualMessageViewStyleForMessageListViewStyle(messageViewStyleSelected);
            this.renderDefaultMessageViewDropdown();
        },

        getTargetMessageViewStyleFromMessageListConfig: function (messageView) {
            var defaultMessageStyle,
                targetMessageViewStyle;

            if (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.SIMPLE) {
                defaultMessageStyle = Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.PREVIEW;
            }
            else {
                defaultMessageStyle = this.defaultMessageStyle;
            }
            if (this.currentViewStyle === this.ViewStyles.NEW_MESSAGES) {
                if (messageView.model.get('read') === true) {
                    targetMessageViewStyle = Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.TITLE_ONLY;
                }
                else {
                    if (defaultMessageStyle !== Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.TITLE_ONLY) {
                        targetMessageViewStyle = defaultMessageStyle;
                    }
                    else {
                        targetMessageViewStyle = Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.PREVIEW;
                    }
                }
            }
            else {
                targetMessageViewStyle = defaultMessageStyle;
            }
            return targetMessageViewStyle;
        },

        /**
         * @event
         * Set the default messageView, re-renders messages if the view doesn't match
         * @param messageViewStyle (ex:  preview, title only, etc.)
         */
        setIndividualMessageViewStyleForMessageListViewStyle: function (messageViewStyle) {
            // ex: Chronological, Threaded, etc.
            var that = this,
                messageListViewStyle = this.currentViewStyle;

            _.each(this.renderedMessageViewsCurrent, function (messageView) {
                var targetMessageViewStyle = that.getTargetMessageViewStyleFromMessageListConfig(messageView);
                if (messageView.viewStyle !== targetMessageViewStyle) {
                    messageView.setViewStyle(targetMessageViewStyle);
                    messageView.render();
                }
            });

            if (this.storedMessageListConfig.messageStyleId != messageViewStyle.id) {
                this.storedMessageListConfig.messageStyleId = messageViewStyle.id;
                Ctx.setMessageListConfigToStorage(this.storedMessageListConfig);
            }
        },
        /** Return the message offset in the current view, in the set of filtered
         * messages
         * @param {String} messageId
         * @return {Integer} [callback] The message offest if message is found
         */
        getMessageOffset: function (messageId) {
            var messageOffset;
            if ((this.currentViewStyle == this.ViewStyles.THREADED) ||
                (this.currentViewStyle == this.ViewStyles.NEW_MESSAGES)) {
                if (!this.visitorViewData[messageId]) {
                  console.log("getMessageOffset: ERROR; visitor data for message "+messageId+"isn't in: ", this.visitorViewData);
                }
                messageOffset = this.visitorViewData[messageId].traversal_order;
            } else {
                messageOffset = this.DEPRECATEDmessageIdsToDisplay.indexOf(messageId);
            }
            return messageOffset;
        },

        /**
         * Is the message currently onscreen (in the set of filtered messages
         * AND between the offsets onscreen
         * @param {String} id
         * @return{Boolean} true or false
         */
        isMessageOnscreen: function (id) {
            var messageIndex = this.getMessageOffset(id);
            //console.log("isMessageOnscreen", this.offsetStart, messageIndex, this.offsetEnd)
            return (this.offsetStart <= messageIndex) && (messageIndex <= this.offsetEnd);
        },

        /**
         * Highlights the message by the given id
         * @param {String} id
         * @param {Function} [callback] Optional: The callback function to call if message is found
         * @param {Boolean} shouldHighlightMessageSelected, defaults to true
         */
        showMessageById: function (id, callback, shouldHighlightMessageSelected, shouldOpenMessageSelected, shouldRecurseMaxMoreTimes) {
          var that = this,
          selector = Ctx.format('[id="message-{0}"]', id),
          el,
          messageIsInFilter = false,
          that = this,
          requestedOffsets,
          collectionManager = new CollectionManager(),
          shouldRecurse;
          
          console.log("showMessageById called with args:", id, callback, shouldHighlightMessageSelected, shouldRecurseMaxMoreTimes);
          
          shouldHighlightMessageSelected = (typeof shouldHighlightMessageSelected === "undefined") ? true : shouldHighlightMessageSelected;
          shouldOpenMessageSelected = (typeof shouldOpenMessageSelected === "undefined") ? true : shouldOpenMessageSelected;
          shouldRecurseMaxMoreTimes = (typeof shouldRecurseMaxMoreTimes === "undefined") ? 3 : shouldRecurseMaxMoreTimes;
          shouldRecurse = shouldRecurseMaxMoreTimes > 0;

          $.when(collectionManager.getAllMessageStructureCollectionPromise(),
              this.currentQuery.getResultMessageIdCollectionPromise()).done(
              function (allMessageStructureCollection, resultMessageIdCollection) {
                  var message = allMessageStructureCollection.get(id);

                  //TODO:  This should be a find, not a foreach - benoitg
                  resultMessageIdCollection.forEach(function (displayedId) {
                      if (displayedId === id) {
                          //console.log("showMessageById: OK, found message in query results:", displayedId)
                          messageIsInFilter = true;
                      }
                  });
                  //Not entirely sure if isMessageOnscreen() is safe on first render, even inside the promise - benoitg - 2014-08-21
                  if (messageIsInFilter && !that.isMessageOnscreen(id)) {
                    if(shouldRecurse) {
                      var success = function () {
                          console.log("showMessageById() message " + id + " in query results but not onscreen, calling showMessageById() recursively, only once");
                          that.showMessageById(id, callback, shouldHighlightMessageSelected, shouldOpenMessageSelected, 0);
                      };
                      requestedOffsets = that.calculateRequestedOffsetToShowMessage(id);
                      that.showMessages(requestedOffsets);
                      that.listenToOnce(that, "messageList:render_complete", success);
                    }
                    else {
                      console.log("showMessageById: ERROR:  Message is in query results but not in current page, and we are not allowed to recurse");
                    }
                    return;
                  }
                  if (!messageIsInFilter) {
                      //The current filters might not include the message
                    if(shouldRecurse) {
                      that.showAllMessages();
                      var success = function () {
                          console.log("showMessageById() message " + id + " not in query results, calling showMessageById() recursively after clearing filters");
                          that.showMessageById(id, callback, shouldHighlightMessageSelected, shouldOpenMessageSelected, shouldRecurseMaxMoreTimes-1);
                      };
                      that.listenToOnce(that, "messageList:render_complete", success);
                    }
                    else {
                      console.log("showMessageById: ERROR:  Message is in query results but not in current page, and we are not allowed to recurse");
                    }
                    return;
                  }
                  var real_callback = function () {
                      if (shouldHighlightMessageSelected) {
                          $(selector).highlight();
                      }
                      if (_.isFunction(callback)) {
                          callback();
                      }
                  };


                  if (message) {
                    var animate_message = function(message) {
                      //Trigerring showBody above requires the message to re-render.  Give it time
                      console.log("showMessageById(): TODO:  Waiting for 2 seconds is really bad, need to retry periodically up to a few seconds");
                      setTimeout(function () {
                        if(shouldOpenMessageSelected) {
                          //console.log("showMessageById(): sending showBody to message", message.id);
                          message.trigger('showBody');
                        }
                        el = $(selector);
                        if (el[0]) {
                            var panelOffset = that.ui.panelBody.offset().top;
                            var offset = el.offset().top;
                            // Scrolling to the element
                            var target = offset - panelOffset + that.ui.panelBody.scrollTop();
                            that.ui.panelBody.animate({ scrollTop: target }, { complete: real_callback });
                        } else {
                            console.log("showMessageById(): ERROR:  Message " + id + " not found in the DOM with selector: " + selector);
                        }
                      }, 2000);
                    };
                    
                    if(that.renderIsComplete) {
                      animate_message(message);
                    }
                    else {
                      //console.log("showMessageById(): waiting for render to complete");
                      that.listenToOnce(that, "messageList:render_complete", function() {
                        //console.log("showMessageById(): render has completed, animating");
                        animate_message(message);
                        });
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
        onTitleClick: function (ev) {
            var id = ev.currentTarget.getAttribute('data-messageid');

            this.openMessageByid(id); // FIXME: has this method disappeared?
        },

        /**
         * @event
         */
        onFilterDeleteClick: function (ev) {
            var value = ev.currentTarget.getAttribute('data-value');
            var filterid = ev.currentTarget.getAttribute('data-filterid');
            var filter = this.currentQuery.getFilterDefById(filterid);
            this.currentQuery.clearFilter(filter, value);
            this.render();
        },

        /**
         * Collapse or expand the messages
         */
        toggleMessageView: function () {
            if (this.collapsed) {
                this.expandMessages(); // FIXME: has this method disappeared?
            } else {
                this.collapseMessages(); // FIXME: has this method disappeared?
            }
        },

        scrollToMsgBox: function () {
            this.scrollToElement(this.$('.messagelist-replybox'));
            this.$('.messageSend-subject').focus();
        }

    });

    return MessageList;
});
