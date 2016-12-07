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
    CKEditorField = require('./reusableDataFields/ckeditorField.js'),
    BaseMessageListMixin = require('./baseMessageList.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Widget = require('../models/widget.js'),
    Promise = require('bluebird');

/**
 * Constants
 */
var MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX = "js_messageList-view-";

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
    messageColumnsList: ".js_messageColumnsList"
  },

  regions: {
    messageColumnsList: '@ui.messageColumnsList',
    ideaAnnouncement: '@ui.ideaAnnouncement'
  },
  serializeData: function() {
    return {
      announcementImgBackgroundLink:this.announcementImgBackgroundLink
    };
  },
  initialize: function(options) {
    AssemblPanel.prototype.initialize.apply(this, arguments);
    var that = this,
        current_idea = this.getGroupState().get('currentIdea'),
        collectionManager = new CollectionManager();
    if(this.isViewDestroyed()) {
      return;
    }
    this.translationDataPromise = collectionManager.getUserLanguagePreferencesPromise(Ctx);
    this.setCurrentIdea(current_idea);
    this.listenTo(this.getGroupState(), "change:currentIdea", function(groupState) {
      that.setCurrentIdea(groupState.get('currentIdea'));
      that.attachmentCollection = that.currentIdea.get('attachments');
      that.setAnnoucementBackground();
      that.render();
    });
    this.listenTo(Assembl.vent, 'messageList:showMessageById', function(id, callback) {
      that.showMessageById(id, callback);
    });

    if (current_idea !== null) {
      this.attachmentCollection = current_idea.get('attachments');
      this.setAnnoucementBackground();
      this.listenTo(current_idea.get('attachments'), 'add remove change', function(){
        this.setAnnoucementBackground();
        that.render();
      });
    }
  },
  setAnnoucementBackground: function(){
      var attachmentModel = this.attachmentCollection.getSingleAttachment();
      if (attachmentModel){
        this.announcementImgBackgroundLink = attachmentModel.get('external_url');
      }else{
        this.announcementImgBackgroundLink = null;
      }
  },
  setCurrentIdea: function(idea) {
    if (this.isViewDestroyed()) {
      return;
    }
    if (idea == null) {
      idea = this.currentIdea || this.getGroupState().get("currentIdea");
    }
    if (this.currentIdea === idea) {
      return;
    }
    if (idea != null) {
      this.announcementPromise = idea.getApplicableAnnouncementPromise();
    }
    this.currentIdea = idea;
  },

  onRender: function() {
    var that = this;
    if (this.isViewDestroyed()) {
      return;
    }
    var that = this,
        idea = this.currentIdea;
    if (idea == undefined) {
      // after message send, somehow...
      idea = this.getGroupState().get("currentIdea");
      this.setCurrentIdea(idea);
    }
    if (idea == undefined) {
      console.warn("WHY is the idea undefined?");
      return;
    }
    var columns = idea.get("message_columns");
    if (columns === undefined || columns.length === 0) {
      console.log("TODO: this view should not be alive.");
      return;
    }
    // first approximation
    // this.ui.ideaColumnHeader.html(idea.get("shortTitle"));
    this.announcementPromise.then(function(announcement) {
      if (that.isViewDestroyed() || announcement === undefined) {
        return;
      }
      var announcementMessageView = new Announcements.AnnouncementMessageView({model: announcement, hide_creator:true});
      that.showChildView('ideaAnnouncement', announcementMessageView);
      that.ui.ideaAnnouncement.removeClass('hidden');
    });

    this.showChildView(
      "messageColumnsList",
      new MessageColumnList({
        basePanel: this,
        idea: this.currentIdea,
        translationDataPromise: this.translationDataPromise,
        collection: columns,
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

  isCurrentViewStyleThreadedType: function() {
    return false;
  },
  getTargetMessageViewStyleFromMessageListConfig: function() {
    return Ctx.AVAILABLE_MESSAGE_VIEW_STYLES.FULL_BODY;
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
    viewStyleDropdown: ".js_messageListViewStyle-dropdown",
    messageCount: '.js_messageCount',
    loadPendingMessages: '.js_loadPendingMessages',
  },
  regions: {
    messageFamilyList: '@ui.messageFamilyList',
    topPostRegion: '@ui.topPostRegion',
    messageColumnDescription: '@ui.messageColumnDescription',
  },

  events: function() {
    var events = {
     'click @ui.loadPendingMessages': 'loadPendingMessages',
    };
    _.each(this.ViewStyles, function(messageListViewStyle) {
      events['click .' + messageListViewStyle.css_class] = 'onSelectMessageListViewStyle';
    });
    return events;
  },

  /**
   * This is a subset of {app.views.baseMessageList.BaseMessageListMixin.ViewStyles}
   * @member app.views.messageColumnsPanel.ViewStyles
   * @type {Object}
   */
  ViewStyles: {
    REVERSE_CHRONOLOGICAL: {
      id: "reverse_chronological",
      css_class: MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX + "activityfeed",
      label: i18n.gettext('Newest messages first')
    },
    POPULARITY: {
      id: "popularity",
      css_class: MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX + "popularmessages",
      label: i18n.gettext('Most popular messages first')
    },
    CHRONOLOGICAL: {
      id: "chronological",
      css_class: MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX + "chronological",
      label: i18n.gettext('Oldest messages first')
    },
  },

  constrainViewStyle: function(viewStyle) {
    if (!viewStyle) {
      //If invalid, set global default
      viewStyle = this.ViewStyles.REVERSE_CHRONOLOGICAL;
    }
    return viewStyle;
  },

  initialize: function(options) {
    BaseMessageColumnView.prototype.initialize.apply(this, arguments);
    var that=this,
        collectionManager = new CollectionManager();
    this.idea = options.idea;
    this.classifier = this.model.get("message_classifier");
    this.showMessageByIdInProgress = false;
    this.basePanel = options.basePanel;
    this.translationDataPromise = options.translationDataPromise;
    this.setViewStyle(this.ViewStyles.REVERSE_CHRONOLOGICAL);
    this.setCurrentIdea(this.idea);
  },

  setCurrentIdea: function(idea) {
    var that = this;
    this.currentQuery.initialize();
    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_IS_IN_CONTEXT_OF_IDEA, this.idea.getId());
    this.currentQuery.addFilter(this.currentQuery.availableFilters.POST_CLASSIFIED_UNDER, this.classifier);
    this.messagesIdsPromise = this.currentQuery.getResultMessageIdCollectionPromise();
    this.messagesIdsPromise.then(function() {
      if (that.isViewDestroyed()) {
        return;
      }
      that.template = that.message_template;
      that.render();
    });
  },

  invalidateQuery: function() {
    BaseMessageColumnView.prototype.invalidateQuery.apply(this, arguments);
    this.messagesIdsPromise = this.currentQuery.getResultMessageIdCollectionPromise();
  },

  addPendingMessage: function(message, messageCollection) {
    if (message.get("message_classifier") == this.classifier) {
      this.nbPendingMessage += 1;
      this.showPendingMessages(this.nbPendingMessage);
    }
  },

  getGroupState: function() {
    return this.basePanel.getGroupState();
  },

  getContainingGroup: function() {
    return this.basePanel.getContainingGroup();
  },

  unblockPanel: function() {
    this.basePanel.unblockPanel();
  },

  /**
   * Synchronizes the panel with the currently selected idea (possibly none)
   */
  syncWithCurrentIdea: function() {
    var currentIdea = this.getGroupState().get('currentIdea');
    this.setCurrentIdea(currentIdea);
  },

  serializeData: function() {
    var data = BaseMessageColumnView.prototype.serializeData.apply(this, arguments);
    _.extend(data, {
      column: this.model,
      numColumns: this.model.collection.length,
      canPost: Ctx.getCurrentUser().can(Permissions.ADD_POST),
      color: this.model.get('color') || 'black',
    });
    return data;
  },

  processIsEnded: function() {
    // heuristic: process is ended if header has content.
    var header = this.model.get('header');
    return header != undefined && header.length > 0;
  },

  onRender: function() {
    if (this.isViewDestroyed()) {
      return;
    }
    BaseMessageColumnView.prototype.onRender.apply(this, arguments);
    var that = this,
        canEdit = Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION),
        renderId = _.clone(this._renderId);

    if (this.processIsEnded() || canEdit) {
      this.messageColumnDescription.show(new CKEditorField({
        model: this.model,
        modelProp: 'header',
        canEdit: canEdit,
      }));
    }
    this.renderMessageListViewStyleDropdown();
    Promise.join(this.messagesIdsPromise, this.translationDataPromise, function(resultMessageIdCollection, translationData) {
      if (that.isViewDestroyed()) {
        return;
      }

      if (renderId != that._renderId) {
        console.log("messageList:onRender() structure collection arrived too late, this is render %d, and render %d is already in progress.  Aborting.", renderId, that._renderId);
        return;
      }

      that.destroyAnnotator();

      that.ui.messageCount.html(i18n.sprintf(
        i18n.ngettext("%d message on theme “%s”", "%d messages on theme “%s”", resultMessageIdCollection.length),
        resultMessageIdCollection.length,
        that.model.get('name').bestValue(translationData)));

      //Some messages may be present from before
      that.ui.messageFamilyList.empty();
      that.clearRenderedMessages();

      that.render_real();
      that.ui.panelBody.scroll(function() {
        var msgBox = that.$('.messagelist-replybox').height(),
        scrollH = $(this)[0].scrollHeight - (msgBox + 25),
        panelScrollTop = $(this).scrollTop() + $(this).innerHeight();

        //This event cannot be bound in ui, because backbone binds to
        //the top element and scroll does not propagate
        that.$(".panel-body").scroll(that, that.scrollLogger);
      });
      var colWidth = (100 / that.collection.length) + '%';
      $('.subpanel-body').css({'width':colWidth, 'float':'left'});
      if(that.model.get('header').length > 0){
        $('.js_messageColumnDescription').addClass('message-column-description');
      }else{
        $('.js_messageColumnDescription').removeClass('message-column-description');
      }
    });
  },

  showTopPostBox: function(options) {
    var that = this;
    if (this.processIsEnded()) {
      return;
    }
    this.translationDataPromise.then(function(translationData) {
      _.extend(options, {
        mandatory_subject_missing_msg: null,
        allow_setting_subject: false,
        message_classifier: that.classifier,
        reply_idea: that.idea,
        show_target_context_with_choice: false,
        message_send_title: i18n.sprintf(
          i18n.gettext("Add your thoughts on theme “%s”"),
          that.model.get('name').bestValue(translationData)),
        show_cancel_button:true
      });
      // Todo: use those options in messageSendView. Maybe use a more lightweight view also?
      that.newTopicView = new MessageSendView(options);
      that.topPostRegion.show(that.newTopicView);
    });
  },

  /**
   * Renders the messagelist view style dropdown button
   */
  renderMessageListViewStyleDropdown: function() {
    var that = this,
        html = "";

    html += '<a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">';
    html += '<span class="dropdown-label">'+this.currentViewStyle.label+'</span>';
    html += '<span class="icon-arrowdown"></span></a>';
    html += '<ul class="dropdown-menu">';
    _.each(this.ViewStyles, function(messageListViewStyle) {
      html += '<li><a class="' + messageListViewStyle.css_class + '">' + messageListViewStyle.label + '</a></li>';
    });
    html += '</ul>';
    this.ui.viewStyleDropdown.html(html);
  },

  /**
   * @event
   */
  onSelectMessageListViewStyle: function(e) {
    //console.log("messageListHeader::onSelectMessageListViewStyle()");
    var messageListViewStyleClass,
        messageListViewStyleSelected,
        classes = $(e.currentTarget).attr('class').split(" ");
    messageListViewStyleClass = _.find(classes, function(cls) {
      return cls.indexOf(MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX) === 0;
    });
    var messageListViewStyleSelected = this.getMessageListViewStyleDefByCssClass(messageListViewStyleClass);

    this.setViewStyle(messageListViewStyleSelected);
    this.render();
  },

  /**
   * get a view style definition by id
   * @param {messageViewStyle.id} messageListViewStyleClass
   * @returns {messageViewStyle | undefined}
   */
  getMessageListViewStyleDefByCssClass: function(messageListViewStyleClass) {
    return _.find(this.ViewStyles, function(viewStyle) {
      return viewStyle.css_class == messageListViewStyleClass;
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
