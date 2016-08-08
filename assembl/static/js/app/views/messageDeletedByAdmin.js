'use strict';
/**
 * 
 * @module app.views.message
 */

var Marionette = require('../shims/marionette.js'),
    Raven = require('raven-js'),
    Backbone = require('backbone'),
    _ = require('underscore'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    scrollUtils = require('../utils/scrollUtils.js'),
    MessageSendView = require('./messageSend.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    CollectionManager = require('../common/collectionManager.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    $ = require('jquery'),
    Promise = require('bluebird'),
    messageExport = require('./messageExportModal.js'),
    AgentViews = require('./agent.js'),
    Types = require('../utils/types.js'),
    AttachmentViews = require('./attachments.js'),
    MessageModerationOptionsView = require('./messageModerationOptions.js'),
    MessageTranslationView = require('./messageTranslationQuestion.js'),
    Analytics = require('../internal_modules/analytics/dispatcher.js'),
    Genie = require('../utils/genieEffect.js'),
    IdeaClassificationOnMessageView = require('./ideaClassificationOnMessage.js'),
    LangString = require('../models/langstring.js'),
    IdeaContentLink = require('../models/ideaContentLink.js'),
    ConfirmModal = require('./confirmModal.js'),
    Growl = require('../utils/growl.js'),
    MessageView = require('./message.js');



/**
 * @class app.views.message.MessageDeletedByAdminView
 */
//var MessageDeletedByAdminView = MessageView.extend({
var MessageDeletedByAdminView = Marionette.LayoutView.extend({
  constructor: function MessageDeletedByAdminView() {
    //MessageView.apply(this, arguments);
    Marionette.LayoutView.apply(this, arguments);
  },

  template: _.template(i18n.gettext("This message has been deleted by an administrator."))
});

module.exports = MessageDeletedByAdminView;

