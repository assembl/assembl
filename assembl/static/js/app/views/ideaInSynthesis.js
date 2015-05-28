'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    CKEditorField = require('./ckeditorField.js'),
    MessageSendView = require('./messageSend.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Promise = require('bluebird');


var IdeaInSynthesisView = Marionette.ItemView.extend({
    synthesis: null,
    /**
     * The template
     * @type {[type]}
     */
    template: '#tmpl-loader',

    /**
     * @init
     */
    initialize: function (options) {
      this.synthesis = options.synthesis || null;
      this.messageListView = options.messageListView;
      this.editing = false;
      this.authors = [];

      var that = this,
      collectionManager = new CollectionManager();

      Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
          collectionManager.getAllUsersCollectionPromise(),
          this.model.getExtractsPromise(),
          function (allMessageStructureCollection, allUsersCollection, ideaExtracts) {

        ideaExtracts.forEach(function (segment) {
          var post = allMessageStructureCollection.get(segment.get('idPost'));
          if (post) {
            var creator = allUsersCollection.get(post.get('idCreator'));
            if (creator) {
              that.authors.push(creator);
            }
          }
        });

        that.template = '#tmpl-ideaInSynthesis';
        that.render();
      });
    },

    /**
     * The events
     * @type {Object}
     */
    events: {
      'click .js_synthesis-expression': 'onTitleClick',
      'click .synthesisIdea-replybox-openbtn': 'focusReplyBox',
      'click .messageSend-cancelbtn': 'closeReplyBox'
    },

    modelEvents: {
      'change:shortTitle change:longTitle change:segments':'render'
    },

    canEdit: function() {
      return Ctx.getCurrentUser().can(Permissions.EDIT_IDEA) && this.synthesis.get("published_in_post") === null;
    },

    serializeData: function(){
      return {
        id: this.model.getId(),
        editing: this.editing,
        longTitle: this.model.getLongTitleDisplayText(),
        authors: _.uniq(this.authors),
        subject: this.model.get('longTitle'),
        canEdit: this.canEdit()
      }
    },

    /**
     * The render
     * @param renderParams {}
     * @return {IdeaInSynthesisView}
     */
    onRender: function () {

      Ctx.removeCurrentlyDisplayedTooltips(this.$el);

      this.$el.addClass('synthesis-idea');
      this.$el.attr('id', 'synthesis-idea-' + this.model.id);

      Ctx.initTooltips(this.$el);
      if (this.editing && !this.model.get('synthesis_is_published')) {
        this.renderCKEditorIdea();
      }
      this.renderReplyView();
    },

    /**
     * renders the ckEditor if there is one editable field
     */
    renderCKEditorIdea: function () {
      var that = this,
      area = this.$('.synthesis-expression-editor');

      var model = this.model.getLongTitleDisplayText();

      this.ideaSynthesis = new CKEditorField({
        'model': this.model,
        'modelProp': 'longTitle',
        'placeholder': model,
        'showPlaceholderOnEditIfEmpty': true,
        'autosave': true,
        'hideButton': true
      });

      this.listenTo(this.ideaSynthesis, 'save cancel', function(){
        that.editing = false;
        that.render();
      });

      this.ideaSynthesis.renderTo(area);
      this.ideaSynthesis.changeToEditMode();
    },

    /**
     * renders the reply interface
     */
    renderReplyView: function () {
      var that = this,
      partialCtx = "synthesis-idea-" + this.model.getId(),
      partialMessage = MessagesInProgress.getMessage(partialCtx),
      send_callback = function () {
        Assembl.vent.trigger('messageList:currentQuery');
        that.messageListView.getContainingGroup().setCurrentIdea(that.model);
      };

      var replyView = new MessageSendView({
        'allow_setting_subject': false,
        'reply_message_id': this.synthesis.get('published_in_post'),
        'reply_idea': this.model,
        'body_help_message': i18n.gettext('Type your response here...'),
        'cancel_button_label': null,
        'send_button_label': i18n.gettext('Send your reply'),
        'subject_label': null,
        'default_subject': 'Re: ' + Ctx.stripHtml(this.model.getLongTitleDisplayText()).substring(0, 50),
        'mandatory_body_missing_msg': i18n.gettext('You did not type a response yet...'),
        'mandatory_subject_missing_msg': null,
        'msg_in_progress_body': partialMessage['body'],
        'msg_in_progress_ctx': partialCtx,
        'send_callback': send_callback,
        'messageList': this.messageListView
      });

      this.$('.synthesisIdea-replybox').html(replyView.render().el);
    },

    /**
     *  Focus on the reply box, and open it if closed
     **/
    focusReplyBox: function () {
      this.openReplyBox();

      var that = this;
      window.setTimeout(function () {
        that.$('.js_messageSend-body').focus();
      }, 100);
    },
    /**
     *  Opens the reply box the reply button
     */
    openReplyBox: function () {
      this.$('.synthesisIdea-replybox').removeClass("hidden");
    },

    /**
     *  Closes the reply box
     */
    closeReplyBox: function () {
      this.$('.synthesisIdea-replybox').addClass("hidden");
    },

    /**
     * @event
     */
    onTitleClick: function (ev) {
      if (this.canEdit()) {
        this.makeEditable();
      }
      else {
        this.navigateToIdea();
      }
    },

    navigateToIdea: function () {
        console.log('WRITEME ideaInSysthesis: navigateToIdea called');
    },

    makeEditable: function () {
      if (this.canEdit()) {
        this.editing = true;
        this.render();
      }
    }

});


module.exports = IdeaInSynthesisView;
