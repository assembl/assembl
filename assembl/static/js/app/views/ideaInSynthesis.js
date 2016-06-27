'use strict';
/**
 * 
 * @module app.views.ideaInSynthesis
 */

var Marionette = require('../shims/marionette.js'),
    _ = require('underscore'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    CKEditorField = require('./reusableDataFields/ckeditorField.js'),
    MessageSendView = require('./messageSend.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    CollectionManager = require('../common/collectionManager.js'),
    panelSpec = require('../models/panelSpec'),
    PanelSpecTypes = require('../utils/panelSpecTypes'),
    viewsFactory = require('../objects/viewsFactory'),
    groupSpec = require('../models/groupSpec'),
    Promise = require('bluebird'),
    Analytics = require('../internal_modules/analytics/dispatcher.js'),
    openIdeaInModal = require('./modals/ideaInModal.js');

var IdeaInSynthesisView = Marionette.LayoutView.extend({
  constructor: function IdeaInSynthesisView() {
    Marionette.LayoutView.apply(this, arguments);
  },

  synthesis: null,
  /**
   * The template
   * @type {template}
   */
  template: '#tmpl-loader',

  /**
   * The events
   * @type {Object}
   */
  events: {
      'click .js_synthesis-expression': 'onTitleClick',
      'click .js_synthesisIdea': 'navigateToIdea',
      'click .js_viewIdeaInModal': 'showIdeaInModal',
      'click .synthesisIdea-replybox-openbtn': 'focusReplyBox',
      'click .messageSend-cancelbtn': 'closeReplyBox'
  },

  modelEvents: {
    //THIS WILL NOT ACTUALLY RUN UNTILL CODE IS REFACTORED SO MODEL IS THE REAL IDEA OR THE TOOMBSTONE.  See initialize - benoitg
    /*'change:shortTitle change:longTitle change:segments':'render'*/
  },

  regions: {
    regionExpression: ".js_region-synthesis-expression"
  },

  /**
   * @init
   */
  initialize: function(options) {
      this.synthesis = options.synthesis || null;
      this.messageListView = options.messageListView;
      this.editing = false;
      this.authors = [];
      this.original_idea = undefined;

      this.parentPanel = options.parentPanel;
      if (this.parentPanel === undefined) {
        throw new Error("parentPanel is mandatory");
      }

      var that = this,
      collectionManager = new CollectionManager();
      // Calculate the contributors of the idea: authors of important segments (nuggets)
      // Should match Idea.get_synthesis_contributors in the backend
      function render_with_info(allMessageStructureCollection, allUsersCollection, ideaExtracts) {
        if (!that.isViewDestroyed()) {
          ideaExtracts.filter(function(segment){
            return segment.get("important");
          }).forEach(function(segment) {
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
        }
      }
      // idea is either a tombstone or from a different collection; get the original
      Promise.resolve(collectionManager.getAllIdeasCollectionPromise()).then(function(allIdeasCollection) {
        if (!that.isViewDestroyed()) {
          var idea = that.model,
          original_idea = undefined;
          if (that.synthesis.get('is_next_synthesis')) {
            original_idea = allIdeasCollection.get(that.model.id);
          } 
          else {
            original_idea = allIdeasCollection.get(that.model.get('original_uri'));
          }
          if (original_idea) {
            // original may be null if idea deleted.
            that.original_idea = original_idea;
            idea = original_idea;
          }
          Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
              collectionManager.getAllUsersCollectionPromise(),
              idea.getExtractsPromise(),
              render_with_info);

          //console.log("About to connect idea change event to idea:", idea, "for synthesis: ", that.synthesis);
          that.listenTo(idea, "change:shortTitle change:longTitle change:segments", function() {
            /*if (Ctx.debugRender) {
            console.log("idesInSynthesis:change event on original_idea, firing render");
          }*/
            //
            console.log("Re-assigning model:", that.model);
            //This is evil and a stop-gap measure. - benoitg
            that.model = idea;
            that.render();
          });
        }
      });

      this.listenTo(this.parentPanel.getGroupState(), "change:currentIdea", function(state, currentIdea) {
        that.onIsSelectedChange(currentIdea);
      });
    },

  canEdit: function() {
      return Ctx.getCurrentUser().can(Permissions.EDIT_IDEA) && this.synthesis.get("published_in_post") === null;
    },

  serializeData: function() {
      //As all ideas in a previously posted synthesis are tombstoned, the original idea is 
      //gathered from the original_uri attribute and view is re-rendered. Therefore, the 
      //original idea is expected to be the one that contants the num_posts field.
      var numMessages;
      if(this.original_idea) {
        numMessages = this.original_idea.get('num_posts');
      }
      if (!numMessages) {
        numMessages = 0;
      }
      
      return {
        id: this.model.getId(),
        editing: this.editing,
        longTitle: this.model.getLongTitleDisplayText(),
        authors: _.uniq(this.authors),
        subject: this.model.get('longTitle'),
        canEdit: this.canEdit(),
        isPrimaryNavigationPanel: this.getPanel().isPrimaryNavigationPanel(),
        ctxNumMessages: i18n.sprintf(i18n.ngettext(
          "%d message is available under this idea",
          "%d messages are available under this idea",
          numMessages), numMessages),
        numMessages: numMessages
      }
    },

  /**
   * The render
   * @returns {IdeaInSynthesisView}
   */
  onRender: function() {
    /*if (Ctx.debugRender) {
      console.log("idesInSynthesis:onRender() is firing");
    }*/
    if(this.template != "#tmpl-loader") {
      Ctx.removeCurrentlyDisplayedTooltips(this.$el);

      if (this.canEdit()) {
        this.$el.addClass('canEdit');
      }

      this.$el.attr('id', 'synthesis-idea-' + this.model.id);

      this.onIsSelectedChange(this.parentPanel.getGroupState().get('currentIdea'));
      Ctx.initTooltips(this.$el);
      this.renderCKEditorIdea();

      //Currently disabled, but will be revived at some point
      //this.renderReplyView();
    }
  },

  /**
   * renders the ckEditor if there is one editable field
   */
  renderCKEditorIdea: function() {
    var model = this.model.getLongTitleDisplayText();

    var ideaSynthesis = new CKEditorField({
      model: this.model,
      modelProp: 'longTitle',
      placeholder: model,
      showPlaceholderOnEditIfEmpty: true,
      canEdit: this.canEdit(),
      autosave: true,
      hideButton: true
    });

    this.regionExpression.show(ideaSynthesis);
  },

  /**
   * renders the reply interface
   */
  renderReplyView: function() {
      var that = this,
      partialCtx = "synthesis-idea-" + this.model.getId(),
      partialMessage = MessagesInProgress.getMessage(partialCtx),
      send_callback = function() {
        Assembl.vent.trigger('messageList:currentQuery');
        that.getPanel().getContainingGroup().setCurrentIdea(that.original_idea);
      };

      var replyView = new MessageSendView({
        'allow_setting_subject': false,
        'reply_message_id': this.synthesis.get('published_in_post'),
        'reply_idea': this.original_idea,
        'body_help_message': i18n.gettext('Type your response here...'),
        'cancel_button_label': null,
        'send_button_label': i18n.gettext('Send your reply'),
        'subject_label': null,
        'default_subject': 'Re: ' + Ctx.stripHtml(this.original_idea.getLongTitleDisplayText()).substring(0, 50),
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
  focusReplyBox: function() {
      this.openReplyBox();

      var that = this;
      window.setTimeout(function() {
        if (Ctx.debugRender) {
          console.log("ideaInSynthesis:focusReplyBox() stealing browser focus");
        }
        that.$('.js_messageSend-body').focus();
      }, 100);
    },
  /**
   *  Opens the reply box the reply button
   */
  openReplyBox: function() {
      this.$('.synthesisIdea-replybox').removeClass("hidden");
    },

  /**
   *  Closes the reply box
   */
  closeReplyBox: function() {
      this.$('.synthesisIdea-replybox').addClass("hidden");
    },

  /**
   * @event
   */
  onIsSelectedChange: function(idea) {
    //console.log("IdeaView:onIsSelectedChange(): new: ", idea, "current: ", this.model, this);
    if (idea === this.model || idea === this.original_idea) {
      this.$el.addClass('is-selected');
    } else {
      this.$el.removeClass('is-selected');
    }
  },

  /**
   * @event
   */
  onTitleClick: function(ev) {
      ev.stopPropagation();
      if (this.canEdit()) {
        this.makeEditable();
      }

      this.navigateToIdea(ev);
    },

  getPanel: function() {
      return this.parentPanel;
    },
    
  showIdeaInModal: function(ev) {
      this.navigateToIdea(ev, true);
    },
    
  navigateToIdea: function(ev, forcePopup) {
      var panel = this.getPanel(),
          analytics = Analytics.getInstance();

      analytics.trackEvent(analytics.events.NAVIGATE_TO_IDEA_IN_SYNTHESIS);
      openIdeaInModal(panel, this.original_idea, forcePopup);
  },

  makeEditable: function() {
      if (this.canEdit()) {
        this.editing = true;
        this.render();
      }
    }

});

module.exports = IdeaInSynthesisView;
