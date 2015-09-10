'use strict';

var Marionette = require('../shims/marionette.js'),
    Assembl = require('../app.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    i18n = require('../utils/i18n.js'),
    availableFilters = require('./postFilters.js');

var AgentView = Marionette.ItemView.extend({
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
      agent: this.model
    }
  },

  onRender: function() {
    Ctx.removeCurrentlyDisplayedTooltips(this.$el);
    Ctx.initTooltips(this.$el);
  },

  onAvatarClick: function(e) {
    e.stopPropagation();

    var filters =  [{filterDef: availableFilters.POST_IS_FROM, value: this.model.id}],
        ModalGroup = require('./groups/modalGroup.js'),
        modal_title = i18n.sprintf(i18n.gettext("All message by %s"), this.model.get('name')),
        modalFactory = ModalGroup.filteredMessagePanelFactory(modal_title, filters),
        modal = modalFactory.modal,
        messageList = modalFactory.messageList;

    Assembl.slider.show(modal);
  }
  
});

var AgentAvatarView = AgentView.extend({
  template: '#tmpl-agentAvatar',
  className: 'agentAvatar'
});

var AgentNameView = AgentView.extend({
  template: '#tmpl-agentName',
  className: 'agentName'
});

module.exports = {
  AgentAvatarView: AgentAvatarView,
  AgentNameView: AgentNameView
};