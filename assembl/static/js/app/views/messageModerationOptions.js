'use strict';

var Backbone = require('backbone'),
    Marionette = require('../shims/marionette.js'),
    Assembl = require('../app.js'),
    _ = require('underscore'),
    $ = require('jquery'),
    Ctx = require('../common/context.js'),
    AgentViews = require('./agent.js'),
    i18n = require('../utils/i18n.js');


var messageModerationOptions = Marionette.LayoutView.extend({
  constructor: function messageModerationOptions() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-messageModerationOptions',
  className: 'messageModerationOptions',
  initialize: function(options) {
    //console.log("messageModerationOptions::initialize() options: ", options);
    this.options = options;

    if ( !("message_publication_status" in options) ){
      this.options.message_publication_status = "PUBLISHED";
    }

    if ( !("message_moderated_version" in options) ){
      this.options.message_moderated_version = Ctx.getPreferences().moderation_template;
    }
    
    if ( !("message_moderation_remarks" in options) ){
      this.options.message_moderation_remarks = "";
    }

    if ( !("message_original_body_safe" in options) ){
      this.options.message_original_body_safe = "";
    }
  },

  ui: {
    publicationStatusSelect: '.js_messagePublicationStatusSelect',
    moderationDetails: '.js_moderationDetails',
    messageModerator: '.js_messageModerator',
    messageModeratorAvatar: '.js_messageModerator .js_avatarContainer',
    messageModeratorName: '.js_messageModerator .js_nameContainer',
    messageModeratedVersion: '.js_messageModeratedVersion',
    messageModerationRemarks: '.js_messageModerationRemarks',
    saveButton: '.js_messageModerationSaveButton',
    cancelButton: '.js_messageModerationCancelButton'
  },

  events: {
    'change @ui.publicationStatusSelect': 'onPublicationStatusSelectChange',
    'click @ui.saveButton': 'onSaveButtonClick',
    'click @ui.cancelButton': 'onCancelButtonClick'
  },

  onShow: function(){
    var that = this;

    this.updateContent();

    if ( this.model.get("moderator") ){
      this.model.getModeratorPromise().then(function(messageModerator){
        var agentAvatarView = new AgentViews.AgentAvatarView({
          model: messageModerator
        });
        that.ui.messageModeratorAvatar.html(agentAvatarView.render().el);

        var agentNameView = new AgentViews.AgentNameView({
          model: messageModerator
        });
        that.ui.messageModeratorName.html(agentNameView.render().el);
      });
    }    
  },

  onPublicationStatusSelectChange: function(ev){
    this.updateContent();
  },

  updateContent: function(){
    if ( this.ui.publicationStatusSelect.val() == "PUBLISHED" ){
      this.ui.moderationDetails.addClass("hidden");
    }
    else {
      this.ui.moderationDetails.removeClass("hidden");
    }

    if ( this.model.get("moderator") ){
      this.ui.messageModerator.removeClass('hidden');
    }
    else {
      this.ui.messageModerator.addClass("hidden");
    }
  },

  onSaveButtonClick: function(){
    var publication_state = this.ui.publicationStatusSelect.val();
    if ( publication_state == "PUBLISHED" ){
      this.model.save({
        publication_state: publication_state
      }, {patch: true}); // send a PATCH request, not a PUT
    }
    else {
      this.model.save({
        publication_state: publication_state,
        moderation_text: this.ui.messageModeratedVersion.val(),
        moderator_comment: this.ui.messageModerationRemarks.val()
      }, {patch: true}); // send a PATCH request, not a PUT
    }
    this.trigger("moderationOptionsSave");
    this.trigger("moderationOptionsClose");
  },

  onCancelButtonClick: function(){
    this.trigger("moderationOptionsClose");
  },

  serializeData: function() {
    return {
      i18n: i18n,
      message_publication_status: this.options.message_publication_status,
      message_moderated_version: this.options.message_moderated_version,
      message_moderation_remarks: this.options.message_moderation_remarks,
      message_original_body_safe: this.options.message_original_body_safe
    }
  },

});

module.exports = messageModerationOptions;
