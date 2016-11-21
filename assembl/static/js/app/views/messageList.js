'use strict';
/**
 * 
 * @module app.views.messageList
 */

var Backbone = require('backbone'),
    MessageListHeaderView = require('./messageListHeader.js'),
    _ = require('underscore'),
    $ = require('jquery'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Announcements = require('./announcements.js'),
    MessageSendView = require('./messageSend.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js'),
    BaseMessageListMixin = require('./baseMessageList.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Widget = require('../models/widget.js'),
    Promise = require('bluebird');

/**
 * @class app.views.messageList.BaseMessageList
 * @extends app.views.assemblPanel.AssemblPanel
 * @extends app.views.baseMessageList.BaseMessageListMixin
 */
var BaseMessageList = BaseMessageListMixin(AssemblPanel);

/**
 * @class app.views.messageList.MessageList
 * @extends app.views.messageList.BaseMessageList
 */
var MessageList = BaseMessageList.extend({
  constructor: function MessageList() {
    BaseMessageList.apply(this, arguments);
  },

  message_template: '#tmpl-messageList',
  panelType: PanelSpecTypes.MESSAGE_LIST,
  className: 'panel messageList',
  lockable: true,
  gridSize: AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE,
  minWidth: 450, // basic, may receive idea offset.
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
    messageFamilyList: '.js_messageFamilies_region',
    announcementRegion: '.js_announcement_region',
    stickyBar: '.sticky-box',
    topPost: '.messagelist-replybox',
    inspireMe: '.js_inspireMe',
    inspireMeAnchor: '.js_inspireMeAnchor',
    pendingMessage: '.pendingMessage',
    contentPending: '.real-time-updates',
    printButton: '.js_messageListView-print'
  },

  regions: {
    messageListHeader: '.messageListHeader',
    topPostRegion: '@ui.topPost',
    announcementRegion: '@ui.announcementRegion'
  },

  initialize: function(options) {
    //console.log("messageList::initialize()");
    BaseMessageList.prototype.initialize.apply(this, arguments);
    var that = this;
    this.isUsingExpertView = (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.EXPERT); // TODO?: have a dedicated flag

    if(!this.isViewDestroyed()) {
      //Yes, it IS possible the view is already destroyed in initialize, so we check
      this.listenTo(this.getGroupState(), "change:currentIdea", function(state, currentIdea) {
        if (currentIdea) {
          if (currentIdea.id) {
            if (that.currentQuery.isQueryValid() === false) {
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
            that.listenToOnce(currentIdea, "acquiredId", function() {
              that.ideaChanged();
            });
            return;
          }
        }

        this.ideaChanged();
      });

      this.listenTo(Assembl.vent, 'messageList:showMessageById', function(id, callback) {
        //console.log("Calling showMessageById from messageList:showMessageById with params:", id, callback);
        that.showMessageById(id, callback);
      });

      this.listenTo(this, 'messageList:addFilterIsRelatedToIdea', function(idea, only_unread) {
        that.getPanelWrapper().filterThroughPanelLock(
            function() {
              that.addFilterIsRelatedToIdea(idea, only_unread);
            }, 'syncWithCurrentIdea');
      });

      this.listenTo(this, 'messageList:clearAllFilters', function() {
        that.getPanelWrapper().filterThroughPanelLock(
            function() {
              that.currentQuery.clearAllFilters();
            }, 'clearAllFilters');
      });

      this.listenTo(this, 'messageList:addFilterIsOrphanMessage', function() {
        that.getPanelWrapper().filterThroughPanelLock(
            function() {
              that.addFilterIsOrphanMessage();
            }, 'syncWithCurrentIdea');
      });

      this.listenTo(this, 'messageList:addFilterIsSynthesisMessage', function() {
        that.getPanelWrapper().filterThroughPanelLock(
            function() {
              that.addFilterIsSynthesisMessage();
            }, 'syncWithCurrentIdea');
      });

      this.listenTo(Assembl.vent, 'messageList:showAllMessages', function() {
        that.getPanelWrapper().filterThroughPanelLock(
            function() {
              that.showAllMessages();
            }, 'syncWithCurrentIdea');
      });

      this.listenTo(Assembl.vent, 'messageList:currentQuery', function() {
        if (!that.getPanelWrapper().isPanelLocked()) {
          that.currentQuery.clearAllFilters();
        }
      });

      this.listenTo(Assembl.vent, 'messageList:replyBoxFocus', function() {
        that.onReplyBoxFocus();
      });

      this.listenTo(Assembl.vent, 'messageList:replyBoxBlur', function() {
        that.onReplyBoxBlur();
      });
    }
  },

  /**
   * The events
   * @type {Object}
   */
  events: function() {
    var data = {
        'click .js_messageList-allmessages': 'showAllMessages',

        'click @ui.loadPreviousMessagesButton': 'showPreviousMessages',
        'click @ui.loadNextMessagesButton': 'showNextMessages',
        'click @ui.loadAllButton': 'showAllMessagesAtOnce',

        'click .js_openTargetInModal': 'openTargetInModal',

        'click .js_scrollToTopPostBox': 'scrollToTopPostBox',

        'click .js_loadPendingMessages': 'loadPendingMessages',
        'click @ui.printButton': 'togglePrintableClass'
    };
    return data;
  },

  getTitle: function() {
    return i18n.gettext('Messages');
  },

  inspireMeLink: null,

  ideaChanged: function() {
    var that = this;
    this.getPanelWrapper().filterThroughPanelLock(
            function() {
              that.syncWithCurrentIdea();
            }, 'syncWithCurrentIdea');
  },

  /**
   * Synchronizes the panel with the currently selected idea (possibly none)
   */
  syncWithCurrentIdea: function() {
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

        if (this.currentQuery.isFilterConfigSameAsSnapshot(snapshot) === false) {
          if (Ctx.debugRender) {
            console.log("messageList:syncWithCurrentIdea(): triggering render because the filter was modified");
            console.log("messageList:syncWithCurrentIdea(): Query is now: ", this.currentQuery._query);
          }

          this.render();
        }
      }
    },

  showInspireMeIfAvailable: function() {
      var currentIdea = this.getGroupState().get("currentIdea");

      if (!currentIdea) {
        return;
      }
      var that = this,
          collectionManager = new CollectionManager();
      collectionManager.getAllWidgetsPromise().then(function(widgets) {
        var relevantWidgets = widgets.relevantWidgetsFor(
          currentIdea, Widget.Model.prototype.MESSAGE_LIST_INSPIREME_CTX);

        if (relevantWidgets.length > 0) {
          var widget = relevantWidgets[0];
          // TODO : Handle multiple widgets.
          that.inspireMeLink = widget.getUrl(
            Widget.Model.prototype.MESSAGE_LIST_INSPIREME_CTX, currentIdea.getId());
          that.ui.inspireMeAnchor.attr("href", that.inspireMeLink);
          that.ui.inspireMe.removeClass("hidden");
        } else {
          that.inspireMeLink = null;
          that.ui.inspireMe.addClass("hidden");
        }
      }).error(function() {
        that.inspireMeLink = null;
        that.ui.inspireMe.addClass("hidden");
      });
    },

  /**
   * This is used by groupContent.js
   */
  getMinWidthWithOffset: function(offset) {
    return this.minWidth + offset;
  },

  getCurrentViewPortBottom: function() {
    return this.getCurrentViewPortTop() + this.ui.panelBody.height() - this.ui.stickyBar.height();
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

  isInPrintableView: function() {
      if (this.ui.messageList.hasClass('printable')) {
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
  togglePrintableClass: function(ev) {
      console.log("togglePrintableClass", $(ev.currentTarget), this.ui.messageList);
      if (this.isInPrintableView()) {
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

  serializeData: function() {
    var data = BaseMessageList.prototype.serializeData.apply(this, arguments);
    data.inspireMeLink = this.inspireMeLink;
    return data;
  },

  onBeforeRender: function() {
      //Save some state from the previous render
      BaseMessageList.prototype.onBeforeRender.apply(this, arguments);

      if (this.currentQuery.isQueryValid()) {
        this.template = this.message_template;
      }
      else if (this.getGroupState().get('currentIdea') !== null) {
        this.template = this.message_template;

        //We will sync with current idea in onRender
      }
      else {
        //Display the help message to select an idea
        this.template = '#tmpl-helperDebate';

        //This used to be conditional, but makes no sense now as there would be 
        // nothing to display unless we chose to diaplay all messages
        /*
         * var collectionManager = new CollectionManager();
                        collectionManager.getDiscussionModelPromise().then(function (discussion){
                            if ( discussion.get("show_help_in_debate_section") ){

                            }
                        });
         */
      }

      //console.log("onBeforeRender:  template is now:", this.template);
    },

  onRender: function() {
    BaseMessageList.prototype.onRender.apply(this, arguments);
    var that = this,
        collectionManager = new CollectionManager(),
        renderId = _.clone(this._renderId);

    if (this.currentQuery.isQueryValid()) {
      this.blockPanel();
      /* TODO:  Most of this should be a listen to the returned collection */
      Promise.join(this.currentQuery.getResultMessageStructureCollectionPromise(),
          this.currentQuery.getResultMessageIdCollectionPromise(),
              function(messageStructureCollection, resultMessageIdCollection) {
                if (!that.isViewDestroyed()) {

                  if (Ctx.debugRender) {
                    console.log("messageList:onRender() structure collection ready for render id:", renderId);
                  }

                  if (renderId != that._renderId) {
                    console.log("messageList:onRender() structure collection arrived too late, this is render %d, and render %d is already in progress.  Aborting.", renderId, that._renderId);
                    return;
                  }

                  that.destroyAnnotator();

                  //Some messages may be present from before
                  that.ui.messageFamilyList.empty();
                  that.clearRenderedMessages();

                  that.render_real();
                  that.showInspireMeIfAvailable();
                  that.renderMessageListHeader();
                  that.ui.panelBody.scroll(function() {

                    var msgBox = that.$('.messagelist-replybox').height(),
                    scrollH = $(this)[0].scrollHeight - (msgBox + 25),
                    panelScrollTop = $(this).scrollTop() + $(this).innerHeight();

                    if (panelScrollTop >= scrollH) {
                      that.ui.stickyBar.fadeOut();
                    } else {
                      if (!that.aReplyBoxHasFocus) {
                        that.ui.stickyBar.fadeIn();
                      }
                    }

                    //This event cannot be bound in ui, because backbone binds to
                    //the top element and scroll does not propagate
                    that.$(".panel-body").scroll(that, that.scrollLogger);

                  });
                }
              });
    }
    else if (this.getGroupState().get('currentIdea') !== null) {
      this.syncWithCurrentIdea();
    }
    else {
      //console.log("We should have rendered the help message:", this.template);
      that.renderIsComplete = true;
      that.trigger("messageList:render_complete", "Render complete");
    }
  },

  showAnnouncement: function(announcement) {
    var announcementMessageView = new Announcements.AnnouncementMessageView({model: announcement});
    this.announcementRegion.show(announcementMessageView);
    this.ui.announcementRegion.removeClass('hidden');
  },

  showTopPostBox: function(options) {
    this.newTopicView = new MessageSendView(options);
    this.topPostRegion.show(this.newTopicView);
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

  constrainViewStyle: function(viewStyle) {
    if (!viewStyle) {
      //If invalid, set global default
      viewStyle = this.ViewStyles.RECENTLY_ACTIVE_THREADS;
    }
    // Do we need still need this code ?
    else if (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.SIMPLE) {
      if (Ctx.getCurrentUser().isUnknownUser()) {
        viewStyle = this.ViewStyles.RECENTLY_ACTIVE_THREADS;
      }
      else if ((viewStyle !== this.ViewStyles.RECENTLY_ACTIVE_THREADS) && (viewStyle !== this.ViewStyles.REVERSE_CHRONOLOGICAL)) {
        //Recently active threads is default view
        viewStyle = this.ViewStyles.RECENTLY_ACTIVE_THREADS;
      }
    }
    return viewStyle;
  },

  /**
   * Shows posts which are descendent of a given post
   * @param {string} postId
   */
  addFilterByPostId: function(postId) {
    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_DESCENDENT_OF_POST, postId);
    this.render();
  },

  /**
   * Toggle hoist on a post (filter which shows posts which are descendent of a given post)
   */
  toggleFilterByPostId: function(postId) {
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
  showAllMessages: function() {
    //console.log("messageList:showAllMessages() called");
    this.currentQuery.clearAllFilters();
    this.render();
  },

  /**
   * Load posts that belong to an idea
   * @param {string} ideaId
   * @param {boolean} show only unread messages (this parameter is optional and is a flag)
   */
  addFilterIsRelatedToIdea: function(idea, only_unread) {
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
      if (this.currentQuery.isFilterConfigSameAsSnapshot(snapshot) === false) {
        if (Ctx.debugRender) {
          console.log("messageList:addFilterIsRelatedToIdea(): triggering render because new filter was modified");
          console.log("messageList:addFilterIsRelatedToIdea(): Query is now: ", this.currentQuery._query);
        }

        this.render();
      }
    },

  /**
   * Load posts that are synthesis posts
   * @param {string} ideaId
   */
  addFilterIsSynthesisMessage: function() {
    //Can't filter on an idea at the same time as getting synthesis messages
    this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null);
    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_SYNTHESIS, true);
    this.render();
  },

  /**
   * Load posts that are synthesis posts
   * @param {string} ideaId
   */
  addFilterIsOrphanMessage: function() {
    //Can't filter on an idea at the same time as getting orphan messages
    this.currentQuery.clearFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, null);
    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_ORPHAN, true);
    this.render();
  },

  openTargetInModal: function(evt) {
    return Ctx.openTargetInModal(evt);
  },

  onReplyBoxFocus: function() {
      this.aReplyBoxHasFocus = true;
      this.ui.stickyBar.fadeOut();
    },

  onReplyBoxBlur: function() {
      this.aReplyBoxHasFocus = false;

      // commented out because it will reappear on scroll if necessary (and forcing it is bad if the user clics from a message reply box to the bottom comment box)
      //this.ui.stickyBar.fadeIn();
    },

});

module.exports = MessageList;
