'use strict';

var Marionette = require('../shims/marionette.js'),
    Assembl = require('../app.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    availableFilters = require('./postFilters.js');

var AgentView = Marionette.ItemView.extend({
  constructor: function AgentView() {
    Marionette.ItemView.apply(this, arguments);
  },
  ui: {
    avatar: '.js_agentAvatar',
    name: '.js_agentName'
  },

  events: {
    'click @ui.avatar': 'onAvatarClick',
    'click @ui.name': 'onAvatarClick'
  },

  serializeData: function() {
    return {
      i18n: i18n,
      show_email: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION),
      agent: this.model
    }
  },

  onRender: function() {
    Ctx.removeCurrentlyDisplayedTooltips(this.$el);
    Ctx.initTooltips(this.$el);
  },

  onAvatarClick: function(e) {
    e.stopPropagation();
    showUserMessages(this.model);
  }
  
});

var AgentAvatarView = AgentView.extend({
  constructor: function AgentAvatarView() {
    AgentView.apply(this, arguments);
  },

  template: '#tmpl-agentAvatar',
  className: 'agentAvatar',
  avatarSize: null,
  initialize: function(options){
    if ( "avatarSize" in options ){
      this.avatarSize = options.avatarSize;
    }
    else {
      this.avatarSize = 30;
    }
  },
  serializeData: function() {
    return {
      agent: this.model,
      avatarSize: this.avatarSize
    };
  }
});

var AgentNameView = AgentView.extend({
  constructor: function AgentNameView() {
    AgentView.apply(this, arguments);
  },

  template: '#tmpl-agentName',
  className: 'agentName'
});

function showUserMessages(userModel) {
  var filters =  [{filterDef: availableFilters.POST_IS_FROM, value: userModel.id}],
  ModalGroup = require('./groups/modalGroup.js'),
  modal_title = i18n.sprintf(i18n.gettext("All messages by %s"), userModel.get('name')),
  modalFactory = ModalGroup.filteredMessagePanelFactory(modal_title, filters),
  modal = modalFactory.modal,
  messageList = modalFactory.messageList;

  Assembl.slider.show(modal);
} 

module.exports = {
  AgentAvatarView: AgentAvatarView,
  AgentNameView: AgentNameView,
  showUserMessages: showUserMessages
};
