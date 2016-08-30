'use strict';
/**
 * 
 * @module app.views.message
 */

var Marionette = require('../shims/marionette.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    $ = require('jquery'),
    AgentViews = require('./agent.js');


// TODO: show ideas associated to the deleted message, using IdeaClassificationNameListView (e.g. which idea the message was top posted in, or to the conversation associated to which ideas does it reply to)
/**
 * @class app.views.message.MessageDeletedByUserView
 */
var MessageDeletedByUserView = Marionette.LayoutView.extend({
  constructor: function MessageDeletedByUserView() {
    Marionette.LayoutView.apply(this, arguments);
  },
  className: 'message message-deleted',

  template: "#tmpl-loader",

  ui: {
    avatar: ".js_avatarContainer",
    name: ".js_nameContainer"
  },

  regions: {
    avatar: "@ui.avatar",
    name: "@ui.name"
  },

  subject: "",
  body: i18n.gettext("This message has been deleted by its author."),

  initialize: function(options) {
    var that = this;

    if ("subject" in options){
      this.subject = options.subject;
    }

    if ("body" in options){
      this.body = options.body;
    }

    this.messageListView = options.messageListView;
    this.messageFamilyView = options.messageFamilyView;
    this.viewStyle = this.messageListView.getTargetMessageViewStyleFromMessageListConfig(this);


    this.model.getCreatorPromise().then(function(creator){
      if(!that.isViewDestroyed()) {
        that.creator = creator;
        that.template = "#tmpl-messageDeletedByUser";
        that.render();
      }
    });
  },

  renderAuthor: function() {
    var agentAvatarView = new AgentViews.AgentAvatarView({
      model: this.creator
    });
    this.avatar.show(agentAvatarView);
    var agentNameView = new AgentViews.AgentNameView({
      model: this.creator
    });
    this.name.show(agentNameView);
  },

  onRender: function(){
    this.$el.attr("id", "message-" + this.model.get('@id'));
    
    if (this.template === "#tmpl-loader") {
      return {};
    }

    this.renderAuthor();

    this.$el.addClass(this.model.get('@type'));

    this.$el.removeClass('unread').addClass('read');

    this.$(".message-subject").addClass('hidden');
  },

  loadAnnotations: function(){
    // empty, needed because called by messageList
  },

  serializeData: function() {
    return {
      message: this.model,
      messageListView: this.messageListView,
      viewStyle: this.viewStyle,
      creator: this.creator,
      parentId: this.model.get('parentId'),
      subject: this.subject,
      body: this.body,
      bodyFormatClass: "body_format_text_plain",
      messageBodyId: Ctx.ANNOTATOR_MESSAGE_BODY_ID_PREFIX + this.model.get('@id'),
      isHoisted: false,
      ctx: Ctx,
      i18n: i18n,
      user_can_see_email: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION),
      user_is_connected: !Ctx.getCurrentUser().isUnknownUser(),
      read: true // we could use this.model.get('read') but read/unread status is not very important for deleted messages and we don't want to emphasize on this message if it's unread
    };
  },
});

module.exports = MessageDeletedByUserView;

