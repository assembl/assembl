'use strict';

var Backbone = require('../shims/backbone.js'),
    Raven = require('raven-js'),
    objectTreeRenderVisitor = require('./visitors/objectTreeRenderVisitor.js'),
    objectTreeRenderVisitorReSort = require('./visitors/objectTreeRenderVisitorReSort.js'),
    MessageFamilyView = require('./messageFamily.js'),
    MessageListHeaderView = require('./messageListHeader.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Message = require('../models/message.js'),
    i18n = require('../utils/i18n.js'),
    PostQuery = require('./messageListPostQuery.js'),
    Permissions = require('../utils/permissions.js'),
    MessageSendView = require('./messageSend.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Promise = require('bluebird');


/**
 * Constants
 */
var DIV_ANNOTATOR_HELP = Ctx.format("<div class='annotator-draganddrop-help'>{0}</div>", i18n.gettext('You can drag the segment above directly to the table of ideas')),
    MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX = "js_messageList-view-",
/* The maximum number of messages that can be loaded at the same time
 * before being removed from memory
 */
    MAX_MESSAGES_IN_DISPLAY = 50,
/* The number of messages to load each time the user scrolls to
 * the end or beginning of the list.
 */
    MORE_PAGES_NUMBER = 20,
    SLOW_WORKER_DELAY_VALUE = 20;

/**
 * @class views.MessageList
 */
var MessageList = AssemblPanel.extend({
    template: '#tmpl-messageList',
    panelType: PanelSpecTypes.MESSAGE_LIST,
    className: 'panel messageList',
    lockable: true,
    gridSize: AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE,
    minWidth: 400, // basic, may receive idea offset.
    debugPaging: false,
    debugScrollLogging: false,
    _renderId: 0,

    ui: {
        panelBody: ".panel-body",
        topArea: '.js_messageList-toparea',
        bottomArea: '.js_messageList-bottomarea',
        //collapseButton: '.js_messageList-collapseButton', // FIXME: this seems to be not used anymore, so I (Quentin) commented it out
        loadPreviousMessagesButton: '.js_messageList-prevbutton',
        loadNextMessagesButton: '.js_messageList-morebutton',
        loadAllButton: '.js_messageList-loadallbutton',
        messageList: '.messageList-list',
        stickyBar: '.sticky-box',
        replyBox: '.messagelist-replybox',
        inspireMe: '.js_inspireMe',
        inspireMeAnchor: '.js_inspireMeAnchor',
        pendingMessage: '.pendingMessage',
        contentPending: '.real-time-updates',
        printButton: '.js_messageListView-print'
    },

    regions: {
      messageListHeader: '.messageListHeader'
    },

    initialize: function (options) {
      //console.log("messageList::initialize()");
      Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
      var that = this,
          collectionManager = new CollectionManager(),
          d = new Date();
      this.renderIsComplete = false;
      this.showMessageByIdInProgress = false;
      this.scrollLoggerPreviousScrolltop = 0;
      this.scrollLoggerPreviousTimestamp = d.getTime() ;
      this.renderedMessageViewsCurrent = {};
      this._nbPendingMessage = 0;
      this.aReplyBoxHasFocus = false;

      this.expertViewIsAvailable = !Ctx.getCurrentUser().isUnknownUser(); // TODO: enable it also for logged out visitors (but for this we need to disable user-related filters, like read)
      this.isUsingExpertView = (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.EXPERT); // TODO?: have a dedicated flag

      this.setViewStyle(this.getViewStyleDefById(this.storedMessageListConfig.viewStyleId));
      this.defaultMessageStyle = Ctx.getMessageViewStyleDefById(this.storedMessageListConfig.messageStyleId) || Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.PREVIEW;

      collectionManager.getAllMessageStructureCollectionPromise()
        .then(function (allMessageStructureCollection) {

          that.resetPendingMessages(allMessageStructureCollection);

          var callback = _.bind(function() {
            //Here, this is the collection
            var nbPendingMessage = this.length - that._initialLenAllMessageStructureCollection;
            that.showPendingMessages(nbPendingMessage);
          }, allMessageStructureCollection);

          that.listenTo(allMessageStructureCollection, 'add', callback);
        }
      );

      collectionManager.getAllExtractsCollectionPromise()
          .then(function (allExtractsCollection) {
              that.listenToOnce(allExtractsCollection, 'add remove reset', function(eventName) {
                  // console.log("about to call initAnnotator because allExtractsCollection was updated with:", eventName);
                  that.initAnnotator();
                });
              }
          );

      this.listenTo(this.getGroupState(), "change:currentIdea", function (state, currentIdea) {
        if (currentIdea) {
          if (currentIdea.id) {
            if(that.currentQuery.isQueryValid() === false) {
              //This will occur upon loading the panel, untill we truly serialize the query
              console.log("WRITEME:  Real query serialization in groupstate");
              that.ideaChanged();
            }
            else if (that.currentQuery.isFilterInQuery(that.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, currentIdea.getId())) {
              //Filter is already in sync
              //TODO:  Detect the case where there is no idea selected, and we already have no filter on ideas
              return;
            }
          } else {
            that.listenToOnce(currentIdea, "acquiredId", function () {
              that.ideaChanged();
            });
            return;
          }
        }
        this.ideaChanged();
      });

      this.listenTo(Assembl.vent, 'messageList:showMessageById', function (id, callback) {
        //console.log("Calling showMessageById from messageList:showMessageById with params:", id, callback);
        that.showMessageById(id, callback);
      });

      this.listenTo(this, 'messageList:addFilterIsRelatedToIdea', function (idea, only_unread) {
          that.getPanelWrapper().filterThroughPanelLock(
              function () {
                  that.addFilterIsRelatedToIdea(idea, only_unread);
              }, 'syncWithCurrentIdea');
      });

      this.listenTo(this, 'messageList:clearAllFilters', function () {
          that.getPanelWrapper().filterThroughPanelLock(
              function () {
                  that.currentQuery.clearAllFilters();
              }, 'clearAllFilters');
      });

      this.listenTo(this, 'messageList:addFilterIsOrphanMessage', function () {
          that.getPanelWrapper().filterThroughPanelLock(
              function () {
                  that.addFilterIsOrphanMessage();
              }, 'syncWithCurrentIdea');
      });

      this.listenTo(this, 'messageList:addFilterIsSynthesisMessage', function () {
          that.getPanelWrapper().filterThroughPanelLock(
              function () {
                  that.addFilterIsSynthesMessage();
              }, 'syncWithCurrentIdea');
      });

      this.listenTo(Assembl.vent, 'messageList:showAllMessages', function () {
          that.getPanelWrapper().filterThroughPanelLock(
              function () {
                  that.showAllMessages();
              }, 'syncWithCurrentIdea');
      });

      this.listenTo(Assembl.vent, 'messageList:currentQuery', function () {
          if (!that.getPanelWrapper().isPanelLocked()) {
              that.currentQuery.clearAllFilters();
          }
      });

      this.listenTo(Assembl.vent, 'messageList:replyBoxFocus', function () {
        that.onReplyBoxFocus();
      });

      this.listenTo(Assembl.vent, 'messageList:replyBoxBlur', function () {
        that.onReplyBoxBlur();
      });
    },

    /**
     * The events
     * @type {Object}
     */
    events: function () {
      var data = {
        'click .post-query-filter-info .js_deleteFilter ': 'onFilterDeleteClick',

        'click .js_messageList-allmessages': 'showAllMessages',

        'click .js_messageList-prevbutton': 'showPreviousMessages',
        'click .js_messageList-morebutton': 'showNextMessages',
        'click @ui.loadAllButton': 'showAllMessagesAtOnce',

        'click .js_openTargetInModal': 'openTargetInModal',

        'click .js_scrollToMsgBox': 'scrollToMsgBox',

        'click .js_loadPendingMessages': 'loadPendingMessages',
        'click @ui.printButton': 'togglePrintableClass'
      };
      return data;
    },

    getTitle: function () {
        return i18n.gettext('Discussion');
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
            label: i18n.gettext('Oldest first')
        },
        REVERSE_CHRONOLOGICAL: {
            id: "reverse_chronological",
            css_class: MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX + "activityfeed",
            label: i18n.gettext('Newest first')
        },
        NEW_MESSAGES: {
            id: "new_messages",
            css_class: MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX + "newmessages",
            label: i18n.gettext('New messages threaded')
        }
    },

    currentViewStyle: null,

    /**
     * Is the current view style a non-flat view
     */
    isViewStyleThreadedType: function () {
      return this.currentViewStyle === this.ViewStyles.THREADED ||
             this.currentViewStyle === this.ViewStyles.NEW_MESSAGES;
    },

    /**
     * If there were any render requests inhibited while rendering was
     * processed
     */
    numRenderInhibitedDuringRendering: 0,


    storedMessageListConfig: Ctx.DEPRECATEDgetMessageListConfigFromStorage(),

    inspireMeLink: null,

    saveMessagesInProgress: function () {
        if (this.newTopicView !== undefined) {
            this.newTopicView.savePartialMessage();
        }
        // Otherwise I need to work from the DOM and not view objects, for those are buried in messages
        var messageFields = this.$('.js_messageSend-body');

        function not_empty(b) {
            return b.value.length !== 0;
        }

        messageFields = _.filter(messageFields, not_empty);

        _.each(messageFields, function (f) {
            var parent_messages = $(f).parents('.message');
            if (parent_messages.length > 0) {
                var messageId = parent_messages[0].attributes.getNamedItem('id').value.substr(8);
                MessagesInProgress.saveMessage(messageId, f.value);
            } else {
                // this was the newTopicView
            }
        });
    },

    /**
     * get a view style definition by id
     * @param {viewStyle.id}
     * @return {viewStyle or undefined}
     */
    getViewStyleDefById: function (viewStyleId) {
        var retval = _.find(this.ViewStyles, function (viewStyle) {
            return viewStyle.id === viewStyleId;
        });
        return retval;
    },

    ideaChanged: function () {
        var that = this;
        this.getPanelWrapper().filterThroughPanelLock(
            function () {
                that.syncWithCurrentIdea();
            }, 'syncWithCurrentIdea');
    },

    /**
     * Synchronizes the panel with the currently selected idea (possibly none)
     */
    syncWithCurrentIdea: function () {
      var currentIdea = this.getGroupState().get('currentIdea'),
      filterValue,
      snapshot = this.currentQuery.getFilterConfigSnapshot();

      //console.log("messageList:syncWithCurrentIdea(): New idea is now: ",currentIdea, this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, filterValue));
      //TODO benoitg - this logic should really be in postQuery, not here - 2014-07-29
      if (currentIdea && this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, currentIdea.getId())) {
        //Filter is already in sync
        return;
      }
      else if (!currentIdea && (this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null) === false)) {
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
        }
        if(this.currentQuery.isFilterConfigSameAsSnapshot(snapshot) === false) {
          if (Ctx.debugRender) {
            console.log("messageList:syncWithCurrentIdea(): triggering render because the filter was modified");
            console.log("messageList:syncWithCurrentIdea(): Query is now: ",this.currentQuery._query);
          }
          this.render();
        }
      }
    },

    showInspireMeIfAvailable: function(){
      var currentIdea = this.getGroupState().get('currentIdea');
      if ( !currentIdea ) {
        return;
      }
      var that = this;

      var promise = Ctx.getWidgetDataAssociatedToIdeaPromise(currentIdea.getId());
      that.ui.inspireMe.addClass('hidden');
      //that.ui.inspireMe.hide();
      promise.done(
          function (data) {
              //console.log("showInspireMeIfAvailable getWidgetDataAssociatedToIdeaPromise received data: ", data);
              if ("inspiration_widget_url" in data && data.inspiration_widget_url) {
                  that.inspireMeLink = data.inspiration_widget_url;
                  //console.log("change the href of the inspireMe link");
                  that.ui.inspireMeAnchor.attr("href", that.inspireMeLink);
                  //that.render();
              }
              else {
                that.inspireMeLink = null;
              }

              if (!that.inspireMeLink) {
                  that.ui.inspireMe.addClass('hidden');
                  //that.ui.inspireMe.hide();
              }
              else {
                  that.ui.inspireMe.removeClass('hidden');
                  //that.ui.inspireMe.show();
              }
          }
      );
    },

    /**
     * The collapse/expand flag
     * @type {Boolean}
     */
    collapsed: false,

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
     * Stores the first offset of messages currently onscreen
     *
     * @type {Number}
     */
    offsetStart: undefined,

    /**
     * Stores the last offset of messages currently onscreen
     * @type {Number}
     */
    offsetEnd: undefined,

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
     * Note:  this.renderedMEssageViewsCurrent must not have been
     * for this function to work.
     */
    getPreviousScrollTarget: function () {
        var panelOffset = null,
            panelScrollTop = 0,
            messageViewScrolledInto = null,
            messageViewScrolledIntoOffset = -Number.MAX_VALUE,
            retval = null,
            debug = false;
        //We may have been called on the first render, so we have to check
        if (_.isFunction(this.ui.panelBody.size) && (this.ui.panelBody.offset() !== undefined)) {
            panelOffset = this.ui.panelBody.offset().top;
            panelScrollTop = this.ui.panelBody.scrollTop();
            if(debug) {
              console.log("this.ui.panelBody", this.ui.panelBody, "panelScrollTop", panelScrollTop);
            }
            if (panelScrollTop !== 0) {
                // Scrolling to the element
                //var target = offset - panelOffset + panelBody.scrollTop();
                //console.log("panelOffset", panelOffset);
                var selector = $('.message');
                if(this.renderedMessageViewsCurrent=== undefined) {
                  throw new Error("this.renderedMessageViewsCurrent is undefined");
                }
                _.each(this.renderedMessageViewsCurrent, function (view) {
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
                    });
                });
                if (messageViewScrolledInto) {
                    //console.log("message in partial view has subject:", messageViewScrolledInto.model.get('subject'));
                    var messageHtmlId = messageViewScrolledInto.$el.attr('id');
                    retval = {messageHtmlId: messageHtmlId,
                        innerOffset: messageViewScrolledIntoOffset};
                }
            }
        }
        if(debug) {
          console.log("getPreviousScrollTarget returning: ", retval);
        }
        return retval;
    },

    scrollToPreviousScrollTarget: function () {
      var previousScrollTarget = this._previousScrollTarget,
      debug = false;

      if (previousScrollTarget) {
        if(debug){
          console.log("scrollToPreviousScrollTarget(): Trying to scroll to:", previousScrollTarget);
        }
        //We may have been called on the first render, so we have to check
        if (this.ui.panelBody.offset() !== undefined) {
            var selector = Ctx.format('[id="{0}"]', previousScrollTarget.messageHtmlId);
            var message = this.$(selector);
            if (!_.size(message)) {
                //console.log("scrollToPreviousScrollTarget() can't find element with id:",previousScrollTarget.messageHtmlId);
                return;
            }

          // Scrolling to the element
          this.scrollToElement(message, undefined, previousScrollTarget.innerOffset, false)
        }
      }
    },

    /**
     * This is used by groupContent.js
     */
    getMinWidthWithOffset: function (offset) {
        return this.minWidth + offset;
    },

    renderMessageListHeader: function() {
      var messageListHeader = new MessageListHeaderView({
          expertViewIsAvailable: this.expertViewIsAvailable,
          isUsingExpertView: this.isUsingExpertView,
          ViewStyles: this.ViewStyles,
          currentViewStyle: this.currentViewStyle,
          messageList: this,
          defaultMessageStyle: this.defaultMessageStyle,
          currentQuery: this.currentQuery
      });
      this.getRegion("messageListHeader").show(messageListHeader);
    },

    onSetIsUsingExpertView: function(isUsingExpertView) {
        //console.log("messageList::onSetIsUsingExpertView()");
        this.isUsingExpertView = isUsingExpertView;
    },

    /**
     * Calculate the offsets of messages actually displayed from a request
     * @return The actual offset array
     */
    calculateMessagesOffsets: function (requestedOffsets) {
      var returnedDataOffsets = {},
          len = _.size(this.resultMessageIdCollection);

      if ((this.currentViewStyle === this.ViewStyles.THREADED) ||
          (this.currentViewStyle === this.ViewStyles.NEW_MESSAGES)) {
        returnedDataOffsets = this._calculateThreadedMessagesOffsets(this.visitorViewData, this.visitorOrderLookupTable, requestedOffsets);
      } else {
        returnedDataOffsets.offsetStart = _.isUndefined(requestedOffsets.offsetStart) ? 0 : requestedOffsets.offsetStart;
        returnedDataOffsets.offsetEnd = _.isUndefined(requestedOffsets.offsetEnd) ? MORE_PAGES_NUMBER : requestedOffsets.offsetEnd;
        if (returnedDataOffsets.offsetEnd < len) {
            // if offsetEnd is bigger or equal than len, do not use it
            len = returnedDataOffsets.offsetEnd + 1;
        }
        else {
            returnedDataOffsets.offsetEnd = len - 1;
        }
      }
      if (this.debugPaging) {
        console.log("calculateMessagesOffsets() called with requestedOffsets:", requestedOffsets, " returning ", returnedDataOffsets);
      }
      return returnedDataOffsets;
    },

    _calculateThreadedMessagesOffsets: function (data_by_object, order_lookup_table, requestedOffsets) {
      var returnedDataOffsets = {},
          numMessages = order_lookup_table.length;

      if (numMessages > 0) {
        //Find preceding root message, and include it
        //It is not possible that we do not find one if there is
        //at least one message
        //Gaby: Never declare an incremental variable "i" out of loop, it's a memory leak
        for (var i = requestedOffsets.offsetStart; i >= 0; i--) {
          if (data_by_object[order_lookup_table[i]]['last_ancestor_id'] === null) {
            returnedDataOffsets.offsetStart = i;
            break;
          }
        }
      }
      else {
        returnedDataOffsets.offsetStart = 0;
      }
      if (requestedOffsets.offsetEnd > (numMessages - 1)) {
        returnedDataOffsets.offsetEnd = (numMessages - 1);
      }
      else {
        if (data_by_object[order_lookup_table[requestedOffsets.offsetEnd]]['last_ancestor_id'] === null) {
          returnedDataOffsets.offsetEnd = requestedOffsets.offsetEnd;
        }
        else {
          //If the requested offsetEnd isn't a root, find next root message, and stop just
          //before it

          for (var i = requestedOffsets.offsetEnd; i < numMessages; i++) {
            if (data_by_object[order_lookup_table[i]]['last_ancestor_id'] === null) {
              returnedDataOffsets.offsetEnd = i;
              break;
            }
          }
          if (returnedDataOffsets.offsetEnd === undefined) {
            //It's possible we didn't find a root, if we are at the very end of the list
            returnedDataOffsets.offsetEnd = numMessages;
          }
        }
      }
      return returnedDataOffsets;
    },

    /**
     * @param messageId of the message that we want onscreen
     * @return {} requetedOffset structure
     */
    calculateRequestedOffsetToShowMessage: function (messageId, visitorOrderLookupTable, resultMessageIdCollection) {
        return this.calculateRequestedOffsetToShowOffset(this.getMessageOffset(messageId, visitorOrderLookupTable, resultMessageIdCollection));
    },

    /**
     * @param messageOffset of the message that we want onscreen
     * @return {} requetedOffset structure
     */
    calculateRequestedOffsetToShowOffset: function (messageOffset) {
        var requestedOffsets = {},
            requestedOffsets;

        requestedOffsets.offsetStart = null;
        requestedOffsets.offsetEnd = null;

        if (this._offsetStart !== undefined && (messageOffset < this._offsetStart) && (messageOffset > (this._offsetStart - MAX_MESSAGES_IN_DISPLAY))) {
            //If within allowable messages currently onscreen, we "extend" the view
            requestedOffsets.offsetStart = messageOffset;
            if (this._offsetEnd - requestedOffsets.offsetStart <= MAX_MESSAGES_IN_DISPLAY) {
                requestedOffsets.offsetEnd = this._offsetEnd;
            }
            else {
                requestedOffsets.offsetEnd = requestedOffsets.offsetStart + MAX_MESSAGES_IN_DISPLAY;
            }
        }
        else if (this._offsetEnd !== undefined && (messageOffset > this._offsetEnd) && (messageOffset < (this._offsetEnd + MAX_MESSAGES_IN_DISPLAY))) {
            //If within allowable messages currently onscreen, we "extend" the view
            requestedOffsets.offsetEnd = messageOffset;
            if (requestedOffsets.offsetEnd - this._offsetStart <= MAX_MESSAGES_IN_DISPLAY) {
                requestedOffsets.offsetStart = this._offsetStart;
            }
            else {
                requestedOffsets.offsetStart = requestedOffsets.offsetEnd - MAX_MESSAGES_IN_DISPLAY;
            }
        }
        else {
            //Else we request an offset centered on the message
            requestedOffsets.offsetStart = messageOffset - Math.floor(MORE_PAGES_NUMBER / 2);
            if (requestedOffsets.offsetStart < 0) {
                requestedOffsets.offsetStart = 0;
            }
            requestedOffsets.offsetEnd = requestedOffsets.offsetStart + MORE_PAGES_NUMBER;
        }

        return requestedOffsets;
    },

    /** Essentially the default value of showMessages.
     * Whoever first calls it will get this as the first value of the messagelist upon render */
    requestMessages: function (requestedOffsets) {
        this._requestedOffsets = requestedOffsets;
    },

    /**
     * Get the message ids to show, or shown onscreen for a specific
     * offset
     * @return list of message ids, in the order they are shown onscreen
     * */
    getMessageIdsToShow: function (requestedOffsets) {
      var messageIdsToShow = [],
          returnedOffsets = this.calculateMessagesOffsets(requestedOffsets);
      if ((this.currentViewStyle === this.ViewStyles.THREADED) ||
          (this.currentViewStyle === this.ViewStyles.NEW_MESSAGES)) {
        messageIdsToShow = this.visitorOrderLookupTable.slice(returnedOffsets.offsetStart, returnedOffsets.offsetEnd+1);
      } else {
        if (this.debugPaging) {
          console.log("getMessageIdsToShow() about to slice collection", this.resultMessageIdCollection);
        }
        messageIdsToShow = this.resultMessageIdCollection.slice(returnedOffsets.offsetStart, returnedOffsets.offsetEnd+1);
      }
      if (this.debugPaging) {
        console.log("getMessageIdsToShow() called with requestedOffsets:", requestedOffsets, " returning ", _.size(messageIdsToShow), "/", _.size(this.resultMessageIdCollection), " message ids: ", messageIdsToShow);
      }
      return messageIdsToShow;
    },

    /**
     * Load the new batch of messages according to the requested `offsetStart`
     * and `offsetEnd` prop
     *
     * If requestedOffsets is falsy, the value set by requestMessages is used
     */
    showMessages: function (requestedOffsets) {
        var that = this,
            views_promise,
            offsets,
            numMessages,
            messageIdsToShow,
            returnedOffsets = {},
            messageFullModelsToShowPromise,
            previousScrollTarget;
        //Because of a hack to call showMessageById from render_real
        //Note that this can also be set to false in onRender()
        this.renderIsComplete = false;


        if (this.debugPaging || Ctx.debugRender) {
            console.log("showMessages() called with requestedOffsets:", requestedOffsets);
        }

        if (!requestedOffsets) {
            if (requestedOffsets === undefined) {
                if (that.debugPaging) {
                    console.log("showMessages() setting offset request to default:", this._requestedOffsets);
                }
                this.requestMessages({
                    offsetStart: 0,
                    offsetEnd: MORE_PAGES_NUMBER
                });
            }
            if (that.debugPaging) {
                console.log("showMessages() using previously set offset request:", this._requestedOffsets);
            }
            requestedOffsets = this._requestedOffsets;
        }
        else {
            this._requestedOffsets = requestedOffsets;
        }

        previousScrollTarget = this.getPreviousScrollTarget();
        if(previousScrollTarget) {
          //The above will only succeed if we are paging.
          //But the previousScrollTarget MAY have been set successfully
          //in onBeforeRender (if this isn't the first render), so we
          //only overwrite it if it actually succeeded
          this._previousScrollTarget = previousScrollTarget;
        }

        /* The MessageFamilyView will re-fill the renderedMessageViewsCurrent
         * array with the newly calculated rendered MessageViews.
         */
        this.renderedMessageViewsCurrent = {};
        this.suspendAnnotatorRefresh();

        returnedOffsets = this.calculateMessagesOffsets(requestedOffsets);
        messageIdsToShow = this.getMessageIdsToShow(requestedOffsets);
        numMessages = _.size(this.resultMessageIdCollection);
        if ((this.currentViewStyle === this.ViewStyles.THREADED) ||
            (this.currentViewStyle === this.ViewStyles.NEW_MESSAGES)) {
          views_promise = this.getRenderedMessagesThreadedPromise(_.clone(this.visitorRootMessagesToDisplay), 1, this.visitorViewData, messageIdsToShow);
        } else {
          views_promise = this.getRenderedMessagesFlatPromise(messageIdsToShow);
        }

        this._offsetStart = returnedOffsets.offsetStart;
        this._offsetEnd = returnedOffsets.offsetEnd;

        return views_promise.then(function (views) {
            if (that.debugPaging) {
                console.log("showMessages() showing requestedOffsets:", requestedOffsets, "returnedOffsets:", returnedOffsets, "messageIdsToShow", messageIdsToShow, "out of numMessages", numMessages, "root views", views);
            }

            if (views.length === 0) {
                //TODO:  This is probably where https://app.asana.com/0/15264711598672/20633284646643 occurs
                that.ui.messageList.html(Ctx.format("<div class='margin'>{0}</div>", i18n.gettext('No messages')));
            } else {
                that.ui.messageList.html(views);
            }
            that.scrollToPreviousScrollTarget();
            that.$el.find('.js_messageList-loadprevloader').addClass('hidden');
            if (that._offsetStart <= 0) {
                that.ui.topArea.addClass('hidden');
            } else {
                that.ui.topArea.removeClass('hidden');
            }
            that.$el.find('.js_messageList-loadmoreloader').addClass('hidden');
            if (that._offsetEnd >= (numMessages - 1)) {
                that.ui.bottomArea.addClass('hidden');
            } else {
                that.ui.bottomArea.removeClass('hidden');
            }

            that.resumeAnnotatorRefresh();
            that.unblockPanel();
            that.renderIsComplete = true;
            that.trigger("messageList:render_complete", "Render complete");
            return true;
        }).catch(function(e) {
          console.error("An error occured during rendering: ", e);
          that.ui.messageList.html("<div class='error'>We are sorry, a technical error occured during rendering.</div>");
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
        //console.log("doAnnotatorRefresh(): About to call initAnnotator");
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
        this.$el.find('.js_messageList-loadmoreloader').removeClass('hidden');
        this.ui.bottomArea.addClass('hidden');
        requestedOffsets = this.getNextMessagesRequestedOffsets();
        //console.log("showNextMessages calling showMessages");
        this.showMessages(requestedOffsets);
    },

    /**
     * Show the previous bunch of messages to be displayed
     */
    showPreviousMessages: function () {
        var requestedOffsets = {};
        this.$el.find('.js_messageList-loadprevloader').removeClass('hidden');
        this.ui.topArea.addClass('hidden');
        requestedOffsets = this.getPreviousMessagesRequestedOffsets();
        //console.log("showPreviousMessages calling showMessages");
        this.showMessages(requestedOffsets);
    },

    /**
     * Show all messages on screen, regardless of the time it will take.
     */
    showAllMessagesAtOnce: function () {
      var that = this;
      this.$el.find('.js_messageList-loadmoreloader').removeClass('hidden');
      this.ui.bottomArea.addClass('hidden');
      this.currentQuery.getResultMessageIdCollectionPromise().then(function(resultMessageIdCollection) {
        var requestedOffsets = {
        'offsetStart': 0,
        'offsetEnd': _.size(resultMessageIdCollection)
        };
        //console.log("showAllMessages calling showMessages");
        that.showMessages(requestedOffsets);
      });
    },

    isInPrintableView: function () {
      if(this.ui.messageList.hasClass('printable')) {
        return true
      }
      else {
        return false;
      }
    },

    /**
     * Hide elements of the messageList to make it more printable and
     * copy-pastable in word processing documents
     */
    togglePrintableClass: function (ev) {
      console.log("togglePrintableClass", $(ev.currentTarget), this.ui.messageList);
      if(this.isInPrintableView()) {
        this.ui.messageList.removeClass('printable');
        $(ev.currentTarget).addClass('btn-secondary');
        $(ev.currentTarget).removeClass('btn-primary');
      }
      else {
        this.ui.messageList.addClass('printable');
        $(ev.currentTarget).addClass('btn-primary');
        $(ev.currentTarget).removeClass('btn-secondary');
      }
    },

    /**
     * Get the requested offsets when scrolling down
     * @private
     */
    getNextMessagesRequestedOffsets: function () {
        var retval = {};

        retval.offsetEnd = this._offsetEnd + MORE_PAGES_NUMBER;

        if ((retval.offsetEnd - this._offsetStart) > MAX_MESSAGES_IN_DISPLAY) {
            retval.offsetStart = this._offsetStart + ((retval.offsetEnd - this._offsetStart) - MAX_MESSAGES_IN_DISPLAY)
        }
        else {
            retval.offsetStart = this._offsetStart;
        }
        retval['scrollTransitionWasAtOffset'] = this._offsetEnd;
        return retval;
    },

    /**
     * Get the requested offsets when scrolling up
     * @private
     */
    getPreviousMessagesRequestedOffsets: function () {
        var messagesInDisplay,
            retval = {};

        retval.offsetStart = this._offsetStart - MORE_PAGES_NUMBER;
        if (retval.offsetStart < 0) {
            retval.offsetStart = 0;
        }


        if (this._offsetEnd - retval.offsetStart > MAX_MESSAGES_IN_DISPLAY) {
            retval.offsetEnd = this._offsetEnd - ((this._offsetEnd - retval.offsetStart) - MAX_MESSAGES_IN_DISPLAY)
        }
        else {
            retval.offsetEnd = this._offsetEnd;
        }
        retval.scrollTransitionWasAtOffset = this._offsetStart;
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
            //availableViewStyles: this.ViewStyles,
            currentViewStyle: this.currentViewStyle,
            collapsed: this.collapsed,
            canPost: Ctx.getCurrentUser().can(Permissions.ADD_POST),
            inspireMeLink: this.inspireMeLink
        };
    },

    isMessageIdInResults: function (messageId, resultMessageIdList) {
      //console.log("isMessageIdInResults called with ", messageId, resultMessageIdList)
      if (!resultMessageIdList) {
        throw new Error("isMessageIdInResults():  resultMessageIdList needs to be provided");
      }

      return undefined != _.find(resultMessageIdList, function (resultMessageId) {
        return messageId === resultMessageId;
      });
    },

    /**
     * Retrieves the first new message id (if any) for the current user
     * @return Message.Model or undefined
     */
    findFirstUnreadMessageId: function (visitorOrderLookupTable, messageCollection, resultMessageIdCollection) {
        var that = this;
        return _.find(visitorOrderLookupTable, function (messageId) {
            var is_new = messageCollection.get(messageId).get('read') === false;
            //console.log(is_new, messageCollection.get(messageId));
            return is_new && that.isMessageIdInResults(messageId, resultMessageIdCollection);
        });
    },


    /**
     * The actual rendering for the render function
     * @return {views.Message}
     */
    render_real: function () {
      var that = this,
          views = [],
          renderId = _.clone(this._renderId),
      // We could distinguish on current idea, but I think that would be confusing.
          partialMessageContext = "new-topic-" + Ctx.getDiscussionId(),
          partialMessage = MessagesInProgress.getMessage(partialMessageContext);

      if (Ctx.debugRender) {
        console.log("messageList:render_real() is firing for render id:", renderId, "the current view style is:", this.currentViewStyle);
      }

      if (!(Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT))) {
          $("body").addClass("js_annotatorUserCannotAddExtract");
      }

      Ctx.initTooltips(this.$el);

      //this.renderCollapseButton(); // FIXME: this seems to be not used anymore, so I (Quentin) commented it out

      var options = {
        'allow_setting_subject': true,
        'send_button_label': i18n.gettext('Send'),
        'subject_label': i18n.gettext('Subject'),
        'body_help_message': i18n.gettext('Add a subject above and start a new topic here'),
        'mandatory_body_missing_msg': i18n.gettext('You need to type a comment first...'),
        'mandatory_subject_missing_msg': i18n.gettext('You need to set a subject to add a new topic...'),
        'msg_in_progress_ctx': partialMessageContext,
        'msg_in_progress_title': partialMessage['title'],
        'msg_in_progress_body': partialMessage['body'],
        'messageList': that,
        'show_target_context_with_choice': true
      };

      var currentIdea = this.getGroupState().get('currentIdea');

      if (currentIdea && this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, currentIdea.getId())) {
        options.reply_idea = currentIdea;
      }

      this.newTopicView = new MessageSendView(options);
      this.$('.messagelist-replybox').html(this.newTopicView.render().el);

      var collectionManager = new CollectionManager();
      Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
                   this.currentQuery.getResultMessageIdCollectionPromise(),
          function (allMessageStructureCollection, resultMessageIdCollection) {

          if (Ctx.debugRender) {
            console.log("messageList:render_real() collection ready, processing for render id:", renderId);
          }
          if (renderId != that._renderId) {
            console.log("messageList:render_real() collections arrived too late, this is render %d, and render %d is already in progress.  Aborting.", renderId, that._renderId);
            return;
          }
          var first_unread_id = that.findFirstUnreadMessageId(that.visitorOrderLookupTable, allMessageStructureCollection, resultMessageIdCollection);
          //console.log("that.showMessageByIdInProgress", that.showMessageByIdInProgress);
          if (that.showMessageByIdInProgress === false
              && that.currentViewStyle === that.ViewStyles.NEW_MESSAGES
              && first_unread_id
              && !that._previousScrollTarget) {
            that.renderIsComplete = true;//showMessageById will call showMessages and actually finish the render
            //We do not trigger the render_complete event here, the line above is just to un-inhibit showMessageById
            if (that.debugPaging) {
              console.info("render_real: calling showMessageById to display the first unread message");
            }
            that.showMessageById(first_unread_id, undefined, undefined, false);
          }
          else if (that.showMessageByIdInProgress === false && (that._offsetStart === undefined || that._offsetEnd === undefined)) {
            //If there is nothing currently onscreen
            //Would avoid rendering twice, and would allow showMessageById to just request showing messages systematically
            if (that.debugPaging) {
              console.info("render_real: calling showMessages");
            }
            that.showMessages();
          }
          else {
            if (that.debugPaging) {
              console.info("render_real: Already running showMessageById will finish the job");
            }
            that.renderIsComplete = true;
            that.trigger("messageList:render_complete", "Render complete");
          }
          that._startPostRenderSlowCallbackProcessing();
        })
      return this;
    },

    onBeforeDestroy: function () {
        this.saveMessagesInProgress();
    },

    onBeforeRender: function () {
        this.saveMessagesInProgress();
        this._clearPostRenderSlowCallbacksCallbackProcessing();
        Ctx.removeCurrentlyDisplayedTooltips(this.$el);
        this._previousScrollTarget = this.getPreviousScrollTarget();
    },

    /**
     * The render function
     * @return {views.Message}
     */
    onRender: function () {
        var that = this,
            collectionManager = new CollectionManager();
        this.renderIsComplete = false;  //only showMessages should set this false
        this._renderId++;
        var renderId = _.clone(this._renderId);
        if (Ctx.debugRender) {
            console.log("messageList:onRender() is firing for render id:", renderId);
        }
;
        //Clear internal state
        this._offsetStart = undefined;
        this._offsetEnd = undefined;

        if(this.currentQuery.isQueryValid()) {
          /* TODO:  Most of this should be a listen to the returned collection */
          Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
              this.currentQuery.getResultMessageIdCollectionPromise(),
              function (messageStructureCollection, resultMessageIdCollection) {

            var resultMessageIdCollectionReference = resultMessageIdCollection;

            function inFilter(message) {
              return resultMessageIdCollectionReference.indexOf(message.getId()) >= 0;
            };
            if (Ctx.debugRender) {
              console.log("messageList:onRender() structure collection ready for render id:", renderId);
            }
            if (renderId != that._renderId) {
              console.log("messageList:onRender() structure collection arrived too late, this is render %d, and render %d is already in progress.  Aborting.", renderId, that._renderId);
              return;
            }
            that.destroyAnnotator();
            //Some messages may be present from before
            that.ui.messageList.empty();
            // TODO: Destroy the message and messageFamily views, as they keep zombie listeners and DOM
            // In particular, message.loadAnnotations gets called with different views on the same model,
            // including zombie views, and we get nested annotator tags as a result.
            // (Annotator looks at fresh DOM every time).  Is that still the case?  Benoitg - 2014-09-19
            // TODO long term: Keep them with a real CompositeView.
            that.resultMessageIdCollection = resultMessageIdCollection;
            that.visitorViewData = {};
            that.visitorOrderLookupTable = [];
            that.visitorRootMessagesToDisplay = [];

            messageStructureCollection.visitDepthFirst(objectTreeRenderVisitor(that.visitorViewData, that.visitorOrderLookupTable, that.visitorRootMessagesToDisplay, inFilter));

            that.visitorOrderLookupTable = [];
            that.visitorRootMessagesToDisplay = [];
            objectTreeRenderVisitorReSort(
                that.visitorViewData,
                that.visitorOrderLookupTable,
                that.visitorRootMessagesToDisplay,
                function (message) {
                  return message.get('date');
                });
            that.render_real();
            that.showInspireMeIfAvailable();
            that.renderMessageListHeader();
            that.ui.panelBody.scroll(function () {

              var msgBox = that.$('.messagelist-replybox').height(),
              scrollH = $(this)[0].scrollHeight - (msgBox + 25),
              panelScrollTop = $(this).scrollTop() + $(this).innerHeight();

              if (panelScrollTop >= scrollH) {
                that.ui.stickyBar.fadeOut();
              } else {
                if ( !that.aReplyBoxHasFocus ){
                  that.ui.stickyBar.fadeIn();
                }
              }

              //This event cannot be bound in ui, because backbone binds to
              //the top element and scroll does not propagate
              that.$(".panel-body").scroll(that, that.scrollLogger);

            });
          });

          this.blockPanel();
        };
    },

    // FIXME: this seems to be not used anymore, so I (Quentin) commented it out
    /**
     * Renders the collapse button
     * /
    renderCollapseButton: function () {
        if (this.collapsed) {
            this.ui.collapseButton.attr('data-tooltip', i18n.gettext('Expand all'));
            this.ui.collapseButton.removeClass('icon-upload').addClass('icon-download-1');
        } else {
            this.ui.collapseButton.attr('data-tooltip', i18n.gettext('Collapse all'));
            this.ui.collapseButton.removeClass('icon-download-1').addClass('icon-upload');
        }
    },
    */

    onSetDefaultMessageStyle: function(defaultMessageStyle) {
      this.defaultMessageStyle = defaultMessageStyle;
    },

    /**
     * Return a list with all views.el already rendered for a flat view
     * @param {Message.Model[]} messages
     * @param {} requestedOffsets The requested offsets
     * @param {} returnedDataOffsets The actual offsets of data actually returned (may be different
     * from requestedOffsets
     * @return {HTMLDivElement[]}
     */
    getRenderedMessagesFlatPromise: function (requestedIds) {
        var that = this,
            view,
            collectionManager = new CollectionManager();

        return collectionManager.getMessageFullModelsPromise(requestedIds)
            .then(function (fullMessageModels) {
                var list = [];
                _.each(fullMessageModels, function (fullMessageModel) {
                    view = new MessageFamilyView({
                        model: fullMessageModel,
                        messageListView: that,
                        hasChildren: []
                    });
                    list.push(view.render().el);
                });
                //console.log("getRenderedMessagesFlatPromise():  Resolving promise with:",list);
                return Promise.resolve(list);
            });
    },

    /**
     * Return a list with all views.el already rendered for threaded views
     * @param {Message.Model[]} list of messages to render at the current level
     * @param {Number} [level=1] The current hierarchy level
     * @param {Object[]} data_by_object render information from ideaRendervisitor
     * @param {[]} messageIdsToShow messageIds of the message to show (those in the offset range)
     * @return [jquery.promise]
     */
    getRenderedMessagesThreadedPromise: function (sibblings, level, data_by_object, messageIdsToShow) {
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
            collectionManager = new CollectionManager(),
            debug = false;
        if (debug) {
            console.log("getRenderedMessagesThreadedPromise() num sibblings:", _.size(sibblings), "level:", level, "messageIdsToShow", messageIdsToShow);
        }
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
        //This actually replaces the for loop for sibblings -benoitg - I wrote it, but can't remember why...
        /* This recursively pops untill a valid model is found, and returns false if not */
        var popFirstValidFromSibblings = function (sibblings) {
            var model = sibblings.shift(),
                current_message_info;
            if (model) {
                current_message_info = data_by_object[model.getId()];
            }
            else {
                //array was empty
                return undefined;
            }
            //Only process if message is within requested offsets
            if (_.contains(messageIdsToShow, model.id)) {
                return model;
            }
            else {
                if (debug) {
                    console.log("popFirstValidFromSibblings() discarding message " + model.getId() + " at offset " + current_message_info['traversal_order']);
                }
                return popFirstValidFromSibblings(sibblings);
            }
        };
        messageStructureModel = popFirstValidFromSibblings(sibblings);

        if (!messageStructureModel) {
            if (debug) {
                console.log("getRenderedMessagesThreadedPromise() sibblings is now empty, returning.");
            }
            return Promise.resolve([]);
        }
        current_message_info = data_by_object[messageStructureModel.getId()];
        if (debug) {
            console.log("getRenderedMessagesThreadedPromise() processing message: ", messageStructureModel.id, " at offset", current_message_info['traversal_order'], "with", _.size(current_message_info['children']), "children");
        }

        if (current_message_info['last_sibling_chain'] === undefined) {
            current_message_info['last_sibling_chain'] = buildLastSibblingChain(messageStructureModel, data_by_object);
        }
        last_sibling_chain = current_message_info['last_sibling_chain']
        //console.log(last_sibling_chain);

        children = _.clone(current_message_info['children']);

        //Process children, if any
        if (_.size(children) > 0) {
            var subviews_promise = this.getRenderedMessagesThreadedPromise(children, level + 1, data_by_object, messageIdsToShow);
        }
        else {
            var subviews_promise = [];
        }

        //Process sibblings, if any (this is for-loop rewritten as recursive calls to avoid locking the browser)
        if (sibblings.length > 0) {
            var sibblingsviews_promise = this.getRenderedMessagesThreadedPromise(sibblings, level, data_by_object, messageIdsToShow);
        }
        else {
            var sibblingsviews_promise = [];
        }

        return Promise.join(subviews_promise, sibblingsviews_promise, collectionManager.getMessageFullModelPromise(messageStructureModel.getId()),
            function (subviews, sibblingsviews, messageFullModel) {

            view = new MessageFamilyView({
                model: messageFullModel,
                messageListView: that,
                currentLevel: level,
                hasChildren: subviews,
                last_sibling_chain: last_sibling_chain});

            // pass logic to the init view
            //view.currentLevel = level;
            //Note:  benoitg: We could put a setTimeout here, but apparently the promise is enough to unlock the browser
            //view.hasChildren = (subviews.length > 0);
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
             ghost_element.find('.messagelist-children').append( this.getRenderedMessagesThreadedPromise(
             children, level+1, data_by_object) );
             }
             */
            if (sibblingsviews.length > 0) {
                list = list.concat(sibblingsviews);
            }
            return Promise.resolve(list);
        });
    },

    annotator_config: {
        externals: {
          "jQuery": "/static/js/bower/jquery/jquery.js",
          "styles": "/static/css/lib/annotator.min.css"
        }
      },

    /**
     * Inits the annotator instance
     */
    initAnnotator: function () {
        var that = this;

        this.destroyAnnotator();
        //console.log("initAnnotator called");
        // Saving the annotator reference
        this.annotator = this.ui.messageList.annotator(this.annotator_config).data('annotator');

        // TODO: Re-render message in messagelist if an annotation was added...
        this.annotator.subscribe('annotationCreated', function (annotation) {
            var collectionManager = new CollectionManager();
           collectionManager.getAllExtractsCollectionPromise()
                .then(function (allExtractsCollection) {
                    var segment = allExtractsCollection.addAnnotationAsExtract(annotation, Ctx.currentAnnotationIdIdea);
                    if (!segment.isValid()) {
                        annotator.deleteAnnotation(annotation);
                    } else if (Ctx.currentAnnotationNewIdeaParentIdea) {
                        //We asked to create a new idea from segment
                      console.log("FIXME:  What's the proper behaviour here now that groups are separated?  " +
                          "We should probably find out if the group is the same as the origin, and lock ONLY in that case");
                        that.getPanelWrapper().autoLockPanel();

                        var newIdea = Ctx.currentAnnotationNewIdeaParentIdea.addSegmentAsChild(segment);
                        that.getContainingGroup().setCurrentIdea(newIdea);
                    }
                    else {
                        segment.save(null, {
                            success: function (model, resp) {
                                that.trigger("annotator:success", that.annotator);
                            },
                            error: function (model, resp) {
                                console.error('ERROR: initAnnotator', resp);
                            }
                        });
                    }
                    Ctx.currentAnnotationNewIdeaParentIdea = null;
                    Ctx.currentAnnotationIdIdea = null;
                });
        });

        this.annotator.subscribe('annotationEditorShown', function (annotatorEditor, annotation) {
            $(document.body).append(annotatorEditor.element);
            var save = $(annotatorEditor.element).find(".annotator-save");
            save.text(i18n.gettext('Send to clipboard'));
            var cancel = $(annotatorEditor.element).find(".annotator-cancel");
            cancel.text(i18n.gettext('Cancel'));
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

        this.annotator.subscribe('annotationViewerTextField', function(field, annotation){
          var collectionManager = new CollectionManager();
          //$(field).html("THIS IS A TEST");
          //console.log(annotation);
          collectionManager.getAllExtractsCollectionPromise().then(function(extracts){
            return extracts.get(annotation['@id']).getAssociatedIdeaPromise().then(function(idea){
              var txt = '';
              if(idea) {
                txt = i18n.sprintf(i18n.gettext('This extract was organized in the idea "%s" by the facilitator of the debate'), idea.getShortTitleDisplayText());
              }
              else {
                txt = i18n.gettext('This extract is in a harvester\'s clipboard and hasn\' been sorted yet.');
              }
              $(field).html(txt);

            });

          });

        });

        //FIXME: I do not why but between the init and when the annotation is shown there is a duplicate DOM created
        this.annotator.subscribe('annotationViewerShown', function (viewer, annotation) {
            var controls = $(viewer.element).find(".annotator-controls");
                controls.hide();

            var annotationItem = $(viewer.element).find(".annotator-item");

            // Delete the duplicate DOM
            annotationItem.each(function(index){
                if(index > 0) $(this).remove();
            });
            // We do not need the annotator's tooltip
            //viewer.hide();
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
        var alreadyHere = this.currentQuery.isFilterInQuery(this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, postId);
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
      var snapshot = this.currentQuery.getFilterConfigSnapshot();
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
      if(this.currentQuery.isFilterConfigSameAsSnapshot(snapshot) === false) {
        if (Ctx.debugRender) {
          console.log("messageList:addFilterIsRelatedToIdea(): triggering render because new filter was modified");
          console.log("messageList:addFilterIsRelatedToIdea(): Query is now: ",this.currentQuery._query);
        }
        this.render();
      }
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

    openTargetInModal: function (evt) {
        return Ctx.openTargetInModal(evt);
    },

    onSetViewStyle: function(viewStyle) {
      //console.log("messageList::onSetViewStyle()");
      this.setViewStyle(viewStyle);
      this.render();
    },


    /**
     * @event
     * Set the view to the selected viewStyle, if allowable by the current user
     * Otherwise, sets the default style
     * Does NOT re-render
     *
     */
    setViewStyle: function (viewStyle) {
      //console.log("setViewStyle called with: ", viewStyle, "interface type: ", Ctx.getCurrentInterfaceType(), "current user is unknown?:", Ctx.getCurrentUser().isUnknownUser());
      if (!viewStyle) {
          //If invalid, set global default
          viewStyle = this.ViewStyles.NEW_MESSAGES;
      }

      if (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.SIMPLE) {
          if (Ctx.getCurrentUser().isUnknownUser()) {
              //Only threaded view makes sense for annonymous users
              viewStyle = this.ViewStyles.THREADED;
          }
          else if ((viewStyle !== this.ViewStyles.NEW_MESSAGES) && (viewStyle !== this.ViewStyles.REVERSE_CHRONOLOGICAL)) {//THREADED used to be allowed
              //New messages is default view
              viewStyle = this.ViewStyles.NEW_MESSAGES;
          }
      }

      if (viewStyle === this.ViewStyles.THREADED) {
          this.currentViewStyle = viewStyle;
          this.currentQuery.setView(this.currentQuery.availableViews.THREADED);
      }
      else if (viewStyle === this.ViewStyles.REVERSE_CHRONOLOGICAL) {
          this.currentViewStyle = viewStyle;
          this.currentQuery.setView(this.currentQuery.availableViews.REVERSE_CHRONOLOGICAL);
      }
      else if (viewStyle === this.ViewStyles.CHRONOLOGICAL) {
          this.currentViewStyle = viewStyle;
          this.currentQuery.setView(this.currentQuery.availableViews.CHRONOLOGICAL);
      }
      else if (viewStyle === this.ViewStyles.NEW_MESSAGES) {
          this.currentViewStyle = viewStyle;
          this.currentQuery.setView(this.currentQuery.availableViews.THREADED);
      }
      else {
          throw new Error("Unsupported view style");
      }
      if (this.storedMessageListConfig.viewStyleId != viewStyle.id) {
          this.storedMessageListConfig.viewStyleId = viewStyle.id;
          Ctx.DEPRECATEDsetMessageListConfigToStorage(this.storedMessageListConfig);
      }
      //console.log("setViewStyle finished, currentViewStyle:", this.currentViewStyle, "stored viewStyleId: ", this.storedMessageListConfig.viewStyleId);
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

    onSetIndividualMessageViewStyleForMessageListViewStyle: function(messageViewStyle) {
        //console.log("messageList::onSetIndividualMessageViewStyleForMessageListViewStyle()");
        this.setIndividualMessageViewStyleForMessageListViewStyle(messageViewStyle);
    },

    /**
     * @event
     * Set the default messageView, re-renders messages if the view doesn't match
     * @param messageViewStyle (ex:  preview, title only, etc.)
     */
    setIndividualMessageViewStyleForMessageListViewStyle: function (messageViewStyle) {
        // ex: Chronological, Threaded, etc.
        var that = this;

        _.each(this.renderedMessageViewsCurrent, function (messageView) {
            var targetMessageViewStyle = that.getTargetMessageViewStyleFromMessageListConfig(messageView);
            if (messageView.viewStyle !== targetMessageViewStyle) {
                messageView.setViewStyle(targetMessageViewStyle);
                messageView.render();
            }
        });

        if (this.storedMessageListConfig.messageStyleId != messageViewStyle.id) {
            this.storedMessageListConfig.messageStyleId = messageViewStyle.id;
            Ctx.DEPRECATEDsetMessageListConfigToStorage(this.storedMessageListConfig);
        }
    },

    /** Returns a list of message id in order of traversal.
     * Return -1 if message not found */
    getResultThreadedTraversalOrder: function (messageId, visitorOrderLookupTable, resultMessageIdCollection) {
      var that = this,
          retval = -1;
      _.every(visitorOrderLookupTable, function (visitorMessageId) {
          if(that.isMessageIdInResults(visitorMessageId, resultMessageIdCollection)) {
            retval++;
          }
          if(messageId === visitorMessageId) {
            //Break the loop
            return false;
          }
          else {
            return true
          }
      });
      return retval;
  },
    /** Return the message offset in the current view, in the set of filtered
     * messages
     * @param {String} messageId
     * @return {Integer} [callback] The message offest if message is found
     */
    getMessageOffset: function (messageId, visitorOrderLookupTable, resultMessageIdCollection) {
      var messageOffset;
      if ((this.currentViewStyle === this.ViewStyles.THREADED) ||
          (this.currentViewStyle === this.ViewStyles.NEW_MESSAGES)) {
        try {
          if (!this.visitorViewData[messageId]) {
            throw new Error("visitor data for message is missing");
          }
          if (visitorOrderLookupTable === undefined) {
            throw new Error("visitorOrderLookupTable message is missing");
          }
          if (resultMessageIdCollection === undefined) {
            throw new Error("resultMessageIdCollection is missing");
          }
        } catch(e) {
          Raven.captureException(e,
              { messageId: messageId,
                visitorViewData: this.visitorViewData
              }
          );
        }

          messageOffset = this.getResultThreadedTraversalOrder(messageId, visitorOrderLookupTable, resultMessageIdCollection);
      } else {
          messageOffset = resultMessageIdCollection.indexOf(messageId);
  }
      //console.log("getMessageOffset returning", messageOffset, " for message id", messageId);
      return messageOffset;
    },

    /**
     * Is the message currently onscreen (in the set of filtered messages
     * AND between the offsets onscreen.
     * This does NOT mean it's view has already finished rendering,
     * nor that it's vithin the current scroll viewport
     * @param {String} id
     * @return{Boolean} true or false
     */
    isMessageOnscreen: function (id) {
      //console.log("isMessageOnscreen called for ", id, "Offsets are:", this._offsetStart, this._offsetEnd)
      if(this._offsetStart === undefined || this._offsetEnd === undefined) {
        //console.log("The messagelist hasn't displayed any messages yet");
        return false;
      }
      var messagesOnScreenIds = this.getMessageIdsToShow({
          'offsetStart': this._offsetStart,
          'offsetEnd': this._offsetEnd
        });

      return _.contains(messagesOnScreenIds, id);
    },

    /**
     * @return:  A list of jquery selectors
     */
    getOnScreenMessagesSelectors: function () {
      if(this._offsetStart === undefined || this._offsetEnd === undefined) {
        throw new Error("The messagelist hasn't displayed any messages yet");
      }
      var that = this,
          messagesOnScreenIds = this.getMessageIdsToShow({
              'offsetStart': this._offsetStart,
              'offsetEnd': this._offsetEnd
            }),
          messagesOnScreenJquerySelectors = [];

      _.each(messagesOnScreenIds, function(messageId) {
        var selector = that.getMessageSelector(messageId);
        messagesOnScreenJquerySelectors.push(selector);
      });
      return messagesOnScreenJquerySelectors;
    },

    /**
     * scrolls to any dom element in the messageList.
     * Unlike scrollToMessage, the element must already be onscreen.
     * This is also called by views/message.js
     *
     * @param callback:  will be called once animation is complete
     * @param margin:  How much to scroll up or down from the top of the
     * element.  Default is 30px for historical reasons
     * @param animate:  Should the scroll be smooth
     */
    scrollToElement: function (el, callback, margin, animate) {
      //console.log("scrollToElement called with: ", el, callback, margin, animate);
      //console.log("this.ui.panelBody: ", this.ui.panelBody);
      if (el && _.isFunction(this.ui.panelBody.size) && this.ui.panelBody.offset() !== undefined) {
        var panelOffset = this.ui.panelBody.offset().top,
            panelScrollTop = this.ui.panelBody.scrollTop(),
            elOffset = el.offset().top,
            target;
        margin = margin || 30;
        if (animate === undefined) {
          animate = true;
        }
        target = elOffset - panelOffset + panelScrollTop - margin;
        //console.log(elOffset, panelOffset, panelScrollTop, margin, target);
        if(animate) {
          this.ui.panelBody.animate({ scrollTop: target }, { complete: callback });
        }
        else {
          this.ui.panelBody.scrollTop(target);
          if(_.isFunction(callback)) {
            callback();
          }
        }
      }
    },

    /**
     * Get a jquery selector for a specific message id
     */
    getMessageSelector: function (messageId) {
      var selector = Ctx.format('[id="message-{0}"]', messageId);
      return this.$(selector);
    },

    /** scrolls to a specific message, retrying untill relevent renders
     * are complete
     */
    scrollToMessage: function (messageModel, shouldHighlightMessageSelected, shouldOpenMessageSelected, callback, failedCallback, recursionDepth, originalRenderId) {
      var that = this,
      MAX_RETRIES = 50, //Stop after ~30 seconds
      debug = false;

      if(debug) {
        console.log("scrollToMessage called with args:", messageModel.id, shouldHighlightMessageSelected, shouldOpenMessageSelected, callback, failedCallback, recursionDepth, originalRenderId);
      }

      recursionDepth = recursionDepth || 0;
      originalRenderId = originalRenderId || _.clone(this._renderId);
      var RETRY_INTERVAL = Math.floor(200 * Math.log(2 + recursionDepth));  // increasing interval

      shouldHighlightMessageSelected = (typeof shouldHighlightMessageSelected === "undefined") ? true : shouldHighlightMessageSelected;
      shouldOpenMessageSelected = (typeof shouldOpenMessageSelected === "undefined") ? true : shouldOpenMessageSelected;

      if (!messageModel) {
        throw new Error("scrollToMessage(): ERROR:  messageModel wasn't provided");
      }
      if (recursionDepth === 0 && this._scrollToMessageInProgressId) {
        console.log("scrollToMessage():  a scrollToMessage was already in progress, aborting for ", messageModel.id);
        Raven.captureMessage("scrollToMessage():  a scrollToMessage was already in progress, aborting", {message_id: messageModel.id})
        if (_.isFunction(failedCallback)) {
          failedCallback();
        }
        return;
      }
      else if (originalRenderId !== this._renderId) {
        //This is a normal condition now
        //console.info("scrollToMessage():  obsolete render, aborting for ", messageModel.id);
        //Raven.captureMessage("scrollToMessage():  obsolete render, aborting", {message_id: messageModel.id})
        if(this._scrollToMessageInProgressId === originalRenderId) {
          this._scrollToMessageInProgressId = false;
        }
        if (_.isFunction(failedCallback)) {
          failedCallback();
        }
        return;
      }
      else {
        this._scrollToMessageInProgressId = originalRenderId;
      }
      var animate_message = function (message) {
        var el = that.getMessageSelector(message.id);

        if (el[0]) {
          if (shouldOpenMessageSelected) {
            // console.log("showMessageById(): sending openWithFullBodyView
            // to message", message.id);
            message.trigger('openWithFullBodyView');
            /*setTimeout(function () {
              if(debug) {
                console.log("scrollToMessage(): INFO:  shouldOpenMessageSelected is true, calling recursively after a delay with same recursion depth");
              }
              that.scrollToMessage(messageModel, shouldHighlightMessageSelected, false, callback, failedCallback, recursionDepth, originalRenderId);
            }, 1000); //Add a delay if we had to open the message*/
          }
          var real_callback = function () {
            if (shouldHighlightMessageSelected) {
              //console.log(that.currentViewStyle);
              //console.log(el);
              try {
                el.highlight();
              } catch (e) {
                console.log(e);
              }
            }
            if (_.isFunction(callback)) {
              callback();
            }
          }
          that.scrollToElement(el, real_callback);
        }
        else {
          // Trigerring openWithFullBodyView above requires the message to
          // re-render. We may have to give it time
          if (recursionDepth <= MAX_RETRIES) {
            if(debug || recursionDepth >= 2) {
              Raven.captureMessage(
                "scrollToMessage():  Message still not found in the DOM, calling recursively",
                { message_id: message.id,
                  selector: el,
                  next_call_recursion_depth: recursionDepth + 1
                }
              );
              console.log("scrollToMessage():  Message " + message.id + " not found in the DOM with selector: ", el , ", calling recursively with ", recursionDepth + 1);
            }
            setTimeout(function () {
              that.scrollToMessage(messageModel, shouldHighlightMessageSelected, shouldOpenMessageSelected, callback, failedCallback, recursionDepth + 1, originalRenderId);
            }, RETRY_INTERVAL);
          }
          else {
            console.log("scrollToMessage(): MAX_RETRIES has been reached: ", recursionDepth);
            that._scrollToMessageInProgressId = false;
            Raven.captureMessage(
              "scrollToMessage():  scrollToMessage(): MAX_RETRIES has been reached",
              { message_id: messageModel.id,
                recursionDepth: recursionDepth}
              );
            if (_.isFunction(failedCallback)) {
              failedCallback();
            }
            return;
          }
        }

      };

      if (this.renderIsComplete) {
        animate_message(messageModel);
        this._scrollToMessageInProgressId = false;
      }
      else {
        if (debug) {
          console.log("scrollToMessage(): waiting for render to complete");
        }
        this.listenToOnce(this, "messageList:render_complete", function () {
          if (debug) {
            console.log("scrollToMessage(): render has completed, animating");
          }
          animate_message(messageModel);
          this._scrollToMessageInProgressId = false;
        });
      }

    },

    /**
     * Highlights the message by the given id
     * @param {String} id
     * @param {Function} [callback] Optional: The callback function to call if message is found
     * @param {Boolean} shouldHighlightMessageSelected, defaults to true
     */
    showMessageById: function (id, callback, shouldHighlightMessageSelected, shouldOpenMessageSelected, shouldRecurseMaxMoreTimes) {
      var that = this,
          collectionManager = new CollectionManager(),
          shouldRecurse,
          debug=false;

      if(debug) {
        console.log("showMessageById called with args:", id, callback, shouldHighlightMessageSelected, shouldOpenMessageSelected, shouldRecurseMaxMoreTimes);
        console.log("this.showMessageByIdInProgress:",this.showMessageByIdInProgress);
      }
      if(!id) {
        throw new Error("showMessageById called with an empty id");
      }

      if (this.showMessageByIdInProgress === true && shouldRecurseMaxMoreTimes === undefined) {
        Raven.context(function() {
          throw new Error("showMessageById():   a showMessageById was already in progress, aborting")
        },
        {requestes_message_id: id});
      }
      else if (shouldRecurseMaxMoreTimes === undefined) {
          this.showMessageByIdInProgress = true;
      }

      shouldRecurseMaxMoreTimes = (typeof shouldRecurseMaxMoreTimes === "undefined") ? 3 : shouldRecurseMaxMoreTimes;
      shouldRecurse = shouldRecurseMaxMoreTimes > 0;

      if (!this.renderIsComplete) {
          // If there is already a render in progress, really weird things
          // can happen.  Wait untill things calm down.
        if (debug) {
          console.log("showMessageById(): Render is in progress, setting up listener");
        }
        this.listenToOnce(that, "messageList:render_complete", function () {
          if (debug) {
            console.log("showMessageById(): calling recursively after waiting for render to complete");
          }
          that.showMessageById(id, callback, shouldHighlightMessageSelected, shouldOpenMessageSelected, shouldRecurseMaxMoreTimes - 1);
        });
        return;
      }

      Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
          this.currentQuery.getResultMessageIdCollectionPromise(),

          function (allMessageStructureCollection, resultMessageIdCollection) {
              var message = allMessageStructureCollection.get(id),
                  messageIsInFilter = that.isMessageIdInResults(id, resultMessageIdCollection),
                  requestedOffsets;

              if (messageIsInFilter && !that.isMessageOnscreen(id)) {
                  if (shouldRecurse) {
                      var success = function () {
                        if(debug) {
                          console.log("showMessageById(): INFO: message " + id + " was in query results but not onscreen, we requested a page change and now call showMessageById() recursively after waiting for render to complete");
                        }
                        that.showMessageById(id, callback, shouldHighlightMessageSelected, shouldOpenMessageSelected, 0);
                      };
                      requestedOffsets = that.calculateRequestedOffsetToShowMessage(id, that.visitorOrderLookupTable, resultMessageIdCollection);
                      that.requestMessages(requestedOffsets); //It may be that a render in progress that will actually use it
                      if(debug) {
                        console.log("showMessageById() requesting page change with requestedOffset:", requestedOffsets);
                      }
                      that.listenToOnce(that, "messageList:render_complete", success);
                      that.showMessages(requestedOffsets);
                  }
                  else {
                    Raven.context(function() {
                      throw new Error("showMessageById():  Message is in query results but not in current page, and we are not allowed to recurse");
                      },
                      {requested_message_id: id}
                    );
                  }
                  return;
              }
              if (!messageIsInFilter) {
                  //The current filters might not include the message
                  if (shouldRecurse) {
                      that.showAllMessages();
                      var success = function () {
                          console.log("showMessageById(): WARNING: message " + id + " not in query results, calling showMessageById() recursively after clearing filters");
                          that.showMessageById(id, callback, shouldHighlightMessageSelected, shouldOpenMessageSelected, shouldRecurseMaxMoreTimes - 1);
                      };
                      that.listenToOnce(that, "messageList:render_complete", success);
                  }
                  else {
                    Raven.context(function() {
                      throw new Error("showMessageById:  Message is not in query results, and we are not allowed to recurse");
                      },
                      {requested_message_id: id}
                    );
                  }
                  return;
              }

              var real_callback = function () {
                  if (_.isFunction(callback)) {
                      callback();
                  }
              };
              //console.log("showMessageById: DEBUG:  handing off to scrollToMessage");
              that.scrollToMessage(message, shouldHighlightMessageSelected, shouldOpenMessageSelected, real_callback);
              that.showMessageByIdInProgress = false;
          });

    },


    /**
     * @event
     */
    onFilterDeleteClick: function (ev) {
        var valueIndex = ev.currentTarget.getAttribute('data-value-index');
        var filterid = ev.currentTarget.getAttribute('data-filterid');
        var filter = this.currentQuery.getFilterDefById(filterid);
        this.currentQuery.clearFilter(filter, valueIndex);
        this.render();
    },

    scrollToMsgBox: function () {
        this.scrollToElement(this.$('.messagelist-replybox'));
        this.$('.messageSend-subject').focus();
    },


    checkMessagesOnscreen: function() {
      var that = this,
          messageDoms = this.getOnScreenMessagesSelectors(),
          currentScrolltop = this.ui.panelBody.scrollTop(),
          currentViewPortTop = this.ui.panelBody.offset().top,
          currentViewPortBottom = currentViewPortTop + this.ui.panelBody.height() - this.ui.stickyBar.height();
      if(this.debugScrollLogging) {
        //console.log(messageDoms);
        //console.log("checkMessagesOnscreen(): currentScrolltop", currentScrolltop, "currentViewPortTop", currentViewPortTop, "currentViewPortBottom", currentViewPortBottom);
      }

      _.each(messageDoms, function(messageSelector) {
        if ( !messageSelector )
          return;
        var messageTop = messageSelector.offset().top,
            messageBottom = messageTop + messageSelector.height(),
            messageHeight = messageBottom - messageTop,
            heightAboveViewPort = currentViewPortTop - messageTop,
            heightBelowViewPort = messageBottom - currentViewPortBottom,
            messageWhiteSpaceRatio = (messageSelector.find(".js_messageHeader").height() + messageSelector.find(".js_messageBottomMenu").height() - 15) / messageHeight, //15px message padding bottom
            ratioOnscreen;
        if (heightAboveViewPort < 0) {
          heightAboveViewPort = 0;
        }
        else if (heightAboveViewPort > messageHeight) {
          heightAboveViewPort = messageHeight;
        }
        if (heightBelowViewPort < 0) {
          heightBelowViewPort = 0;
        }
        else if (heightBelowViewPort > messageHeight) {
          heightBelowViewPort = messageHeight;
        }
        ratioOnscreen = (messageHeight - heightAboveViewPort - heightBelowViewPort) / messageHeight;

        //console.log("message heightAboveViewPort ", heightAboveViewPort, "heightBelowViewPort",heightBelowViewPort );
        if(that.debugScrollLogging) {
          console.log("message % on screen: ", ratioOnscreen * 100, "messageWhiteSpaceRatio", messageWhiteSpaceRatio );
        }
      });
    },

    showPendingMessages: function(nbMessage){
      this._originalDocumentTitle = document.querySelector('#discussion-topic').value;
      document.title = ' ('+ nbMessage +') '+ this._originalDocumentTitle;

      var msg = i18n.sprintf(i18n.ngettext(
          '%d new message has been posted.  Click here to refresh',
          '%d new messages have been posted.  Click here to refresh',
          nbMessage), nbMessage);

      if(nbMessage > 0){
        this.ui.pendingMessage.html(msg);
        this.ui.contentPending.removeClass('hidden').slideDown('slow');
      }
    },

    resetPendingMessages: function(allMessageStructureCollection){
      this._initialLenAllMessageStructureCollection = allMessageStructureCollection.length;
      if(this._originalDocumentTitle) {
        document.title = this._originalDocumentTitle;
      }
    },
    /**
     * @return A promise
     */
    loadPendingMessages: function(){
      var that = this,
          collectionManager = new CollectionManager();
      return collectionManager.getAllMessageStructureCollectionPromise()
        .then(function (allMessageStructureCollection) {
          that.resetPendingMessages(allMessageStructureCollection);
          that.currentQuery.invalidateResults();
          that.render();
        });
    },

    onReplyBoxFocus: function(){
      this.aReplyBoxHasFocus = true;
      this.ui.stickyBar.fadeOut();
    },

    onReplyBoxBlur: function(){
      this.aReplyBoxHasFocus = false;
      // commented out because it will reappear on scroll if necessary (and forcing it is bad if the user clics from a message reply box to the bottom comment box)
      //this.ui.stickyBar.fadeIn();
    },

    /**
     * WARNING, this is a jquery handler, not a backbone one
     * Processes the scroll events to ultimately generate analytics
     * @event
     * @param ev The jquery event, with the view as ev.data
     */
    scrollLogger: _.debounce(function (ev) {
      var that = ev.data,
      //alert("scroll");
      CURRENT_FONT_SIZE_PX = 13,
      //Approximate using messagelist width - 2 * (messageList padding + messageFamily padding, messageFamily margin, message margin.
      //This is only a good estimation for flat viewss
      averageMessageWidth = that.ui.messageList.width() - 2 * (20 + 6 + 6 + 10),
      //Character per line:  normally between 45 to 75, 66 is considered ideal.
      //Average character per line = div width / font size in px*0.4
      CURRENT_CHARACTERS_PER_LINE = averageMessageWidth / (CURRENT_FONT_SIZE_PX*0.4),
      //(gotcha:  ideally substract non-character size of message, but still count header)
      ESTIMATED_LINE_HEIGHT = 1.5 * CURRENT_FONT_SIZE_PX,
      //Character per word: 5.1 average for english language + 1 space => multipy WPM*5 to get CPM
      LINE_CARACTERS_PER_WORD = 5.1 + 1,
      WORDS_PER_LINE = CURRENT_CHARACTERS_PER_LINE / LINE_CARACTERS_PER_WORD,
      currentScrolltop = that.ui.panelBody.scrollTop(),
      d = new Date(),
      currentTimeStamp = d.getTime(),
      distance = currentScrolltop - that.scrollLoggerPreviousScrolltop,
      elapsedMilliseconds = currentTimeStamp - that.scrollLoggerPreviousTimestamp,
      scrollLines = distance / ESTIMATED_LINE_HEIGHT,
      scrollLinesPerMinute = scrollLines / elapsedMilliseconds*1000*60,
      scrollWordsPerMinute = scrollLinesPerMinute * WORDS_PER_LINE;

      if(that.debugScrollLogging) {
        /*console.log("CURRENT_FONT_SIZE_PX", CURRENT_FONT_SIZE_PX);
        console.log("averageMessageWidth", averageMessageWidth);
        console.log("CURRENT_CHARACTERS_PER_LINE", CURRENT_CHARACTERS_PER_LINE);
        console.log("ESTIMATED_LINE_HEIGHT", ESTIMATED_LINE_HEIGHT);
        console.log("LINE_CARACTERS_PER_WORD", LINE_CARACTERS_PER_WORD);
        console.log("WORDS_PER_LINE", WORDS_PER_LINE);
        console.log("CURRENT_FONT_SIZE_PX", CURRENT_FONT_SIZE_PX);
        console.log("scrollLines", scrollLines);
        console.log("scrollLinesPerMinute", scrollLinesPerMinute);
*/
        console.log("Distance: ",distance, "px, scrollWordsPerMinute: ", scrollWordsPerMinute);
      }
      that.scrollLoggerPreviousScrolltop = currentScrolltop;
      that.scrollLoggerPreviousTimestamp = currentTimeStamp;
      that.checkMessagesOnscreen();
    }, 1000)

});


module.exports = MessageList;
