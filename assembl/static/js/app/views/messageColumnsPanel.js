'use strict';
/**
 * 
 * @module app.views.messageList
 */

var Backbone = require('backbone'),
    Marionette = require("../shims/marionette.js"),
    Raven = require('raven-js'),
    ObjectTreeRenderVisitor = require('./visitors/objectTreeRenderVisitor.js'),
    objectTreeRenderVisitorReSort = require('./visitors/objectTreeRenderVisitorReSort.js'),
    MessageFamilyView = require('./messageFamily.js'),
    MessageListHeaderView = require('./messageListHeader.js'),
    _ = require('underscore'),
    $ = require('jquery'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Message = require('../models/message.js'),
    i18n = require('../utils/i18n.js'),
    PostQuery = require('./messageListPostQuery.js'),
    Permissions = require('../utils/permissions.js'),
    Announcements = require('./announcements.js'),
    MessageSendView = require('./messageSend.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    scrollUtils = require('../utils/scrollUtils.js'),
    AssemblPanel = require('./assemblPanel.js'),
    BaseMessageListMixin = require('./baseMessageList.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Widget = require('../models/widget.js'),
    Promise = require('bluebird');


/**
 * @class app.views.messageColumnsPanel.MessageColumnsPanel
 */
var MessageColumnsPanel = AssemblPanel.extend({
  constructor: function MessageColumnsPanel() {
    AssemblPanel.apply(this, arguments);
  },

  template: '#tmpl-messageColumns',
  panelType: PanelSpecTypes.MESSAGE_COLUMNS,
  className: 'panel messageColumns',
  lockable: true,
  gridSize: AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE,
  minWidth: 450,
  debugPaging: false,
  debugScrollLogging: false,
  columnsView: undefined,
  _renderId: 0,
  ui: {
    ideaColumnHeader: ".js_ideaColumnHeader",
    ideaAnnouncement: ".js_ideaAnnouncement",
    messageColumnsList: ".js_messageColumnsList",
  },

  regions: {
    messageColumnsList: '@ui.messageColumnsList',
  },

  initialize: function(options) {
    AssemblPanel.prototype.initialize.apply(this, arguments);
    var that = this,
        current_idea = this.getGroupState().get('currentIdea'),
        collectionManager = new CollectionManager();
    if(this.isViewDestroyed()) {
      return;
    }
    this.messagesStructureCollectionPromise = collectionManager.getAllMessageStructureCollectionPromise();
    this.messageRequestWorker =  collectionManager.getMessageFullModelRequestWorker(
      collectionManager, this.messagesStructureCollectionPromise)
    collectionManager.getUserLanguagePreferencesPromise(Ctx).then(function(ulp) {
      that.translationData = ulp.getTranslationData();
    });
    this.setCurrentIdea(current_idea);
    this.listenTo(this.getGroupState(), "change:currentIdea", function(groupState) {
      that.setCurrentIdea(groupState.get('currentIdea'));
    });
    this.listenTo(Assembl.vent, 'messageList:showMessageById', function(id, callback) {
      that.showMessageById(id, callback);
    });
  },
  setCurrentIdea: function(idea) {
    if (this.isViewDestroyed()) {
      return;
    }
    if (idea === undefined) {
      idea = currentIdea;
    } else if (this.currentIdea === idea) {
      return;
    }
    this.currentIdea = idea;
    this.render();
  },

  onRender: function() {
    if (this.isViewDestroyed()) {
      return;
    }
    var idea = this.currentIdea,
        columns = idea.get("message_columns"),
        announcements = idea.get("announcements");
    if (columns === undefined || columns.length === 0) {
      console.log("TODO: this view should not be alive.");
      return;
    }
    // first approximation
    this.ui.ideaColumnHeader.html(idea.get("shortTitle"));
    if (announcements !== undefined && announcements.length > 0) {
      this.ui.ideaAnnouncement.html(announcements.models[0].get("body"));
    }
    // TODO: What if translation data is not ready by now?
    this.showChildView(
      "messageColumnsList",
      new MessageColumnList({
        basePanel: this,
        idea: this.currentIdea,
        translationData: this.translationData,
        collection: columns,
        messageRequestWorker: this.messageRequestWorker,
      }));
  },
  getTitle: function() {
    return i18n.gettext('Messages');
  },
});

/**
 * @class app.views.messageColumnsPanel.BaseMessageColumnView
 * @extends Marionette.LayoutView
 * @extends app.views.baseMessageList.BaseMessageListMixin
 */
var BaseMessageColumnView = BaseMessageListMixin(Marionette.LayoutView);


/**
 * A single column of messages
 * @class app.views.messageColumnsPanel.MessageColumnView
 * @extends app.views.messageColumnsPanel.BaseMessageColumnView
 */
var MessageColumnView = BaseMessageColumnView.extend({
  constructor: function MessageColumnView() {
    BaseMessageColumnView.apply(this, arguments);
  },
  message_template: '#tmpl-messageColumn',
  currentViewStyle: BaseMessageColumnView.prototype.ViewStyles.REVERSE_CHRONOLOGICAL,

  isCurrentViewStyleThreadedType: function() {
    return false;
  },
  getTargetMessageViewStyleFromMessageListConfig: function() {
    return Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.FULL_BODY;
  },
  showTopPostBox: function(options) {
    options.message_classifier = this.model.get('message_classifier');
    options.message_classifier_name = this.model.get('name').bestValue(this.translationData);
    options.reply_idea = this.idea;
    // Todo: use those options in messageSendView. Maybe use a more lightweight view also?
    this.newTopicView = new MessageSendView(options);
    this.topPostRegion.show(this.newTopicView);
  },
  ui: {
    panelBody: ".subpanel-body",
    messageColumnHeader: '.js_messageColumnHeader',
    messageColumnDescription: '.js_messageColumnDescription',
    topPostRegion: '.js_topPostRegion',
    messageFamilyList: '.js_messageFamilies_region',
    pendingMessage: '.pendingMessage',
    messageList: '.messageList-list',
    topArea: '.js_messageList-toparea',
    bottomArea: '.js_messageList-bottomarea',
    contentPending: '.real-time-updates',
  },
  regions: {
    messageFamilyList: '@ui.messageFamilyList',
    topPostRegion: '@ui.topPostRegion',
  },
  initialize: function(options) {
    console.log("initializing new MessageColumnView with ", this.model.attributes);
    BaseMessageColumnView.prototype.initialize.apply(this, arguments);
    var that = this,
    collectionManager = new CollectionManager();
    this.idea = options.idea;
    this.messageRequestWorker = options.messageRequestWorker;
    this.showMessageByIdInProgress = false;
    this.basePanel = options.basePanel;
    this.setCurrentIdea(this.idea);
    this.translationData = options.translationData;
    this.messagesIdsPromise = this.currentQuery.getResultMessageIdCollectionPromise();
    this.messagesIdsPromise.then(function() {
      if (that.isViewDestroyed()) {
        return;
      }
      that.template = that.message_template;
      that.render();
    });
  },

  setCurrentIdea: function(idea) {
    this.currentQuery.initialize();
    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, this.idea.getId());
    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_CLASSIFIED_UNDER, this.model.get("message_classifier"));
  },

  getGroupState: function() {
    return this.basePanel.getGroupState();
  },

  getContainingGroup: function() {
    return this.basePanel.getContainingGroup();
  },

  /**
   * Synchronizes the panel with the currently selected idea (possibly none)
   */
  syncWithCurrentIdea: function() {
    this.render();
  },

  onRender: function() {
    if (this.isViewDestroyed()) {
      return;
    }
    BaseMessageColumnView.prototype.onRender.apply(this, arguments);
    var that = this;
    var renderId = _.clone(this._renderId);

    this.ui.messageColumnHeader.html(this.model.get('name').bestValue(this.translationData));
    this.ui.messageColumnDescription.html(this.model.get('header'));
    this.messagesIdsPromise.then(function(resultMessageIdCollection) {
      if (that.isViewDestroyed()) {
        return;
      }
      // var views_promise = that.getRenderedMessagesFlatPromise(resultMessageIdCollection);
      // that.getRegion('messageFamilyList').show(new())

      // views_promise.then(function(views) {
        // if (that.isViewDestroyed()) {
        //   return;
        // }

        if (renderId != that._renderId) {
          console.log("messageList:onRender() structure collection arrived too late, this is render %d, and render %d is already in progress.  Aborting.", renderId, that._renderId);
          return;
        }

        that.destroyAnnotator();

        //Some messages may be present from before
        that.ui.messageFamilyList.empty();
        that.clearRenderedMessages();

        that.render_real();
        that.ui.panelBody.scroll(function() {

          var msgBox = that.$('.messagelist-replybox').height(),
          scrollH = $(this)[0].scrollHeight - (msgBox + 25),
          panelScrollTop = $(this).scrollTop() + $(this).innerHeight();

          // if (panelScrollTop >= scrollH) {
          //   that.ui.stickyBar.fadeOut();
          // } else {
          //   if (!that.aReplyBoxHasFocus) {
          //     that.ui.stickyBar.fadeIn();
          //   }
          // }

          //This event cannot be bound in ui, because backbone binds to
          //the top element and scroll does not propagate
          that.$(".panel-body").scroll(that, that.scrollLogger);
        });
    });
  },

});

/**
 * The collections of columns to be seen on this idea
 * @class app.views.messageColumnsPanel.MessageColumnList
 */
var MessageColumnList = Marionette.CollectionView.extend({
  constructor: function MessageColumnList() {
    Marionette.CollectionView.apply(this, arguments);
  },
  initialize: function(options) {
    // propagate options to MessageColumnViews
    this.childViewOptions = options;
  },
  childView: MessageColumnView,
});


module.exports = MessageColumnsPanel;
