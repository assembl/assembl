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
    panelSpec = require('../models/panelSpec'),
    PanelSpecTypes = require('../utils/panelSpecTypes'),
    viewsFactory = require('../objects/viewsFactory'),
    groupSpec = require('../models/groupSpec'),
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
  initialize: function(options) {
      this.synthesis = options.synthesis || null;
      this.messageListView = options.messageListView;
      this.editing = false;
      this.authors = [];
      this.original_idea = this.model;

      this.parentPanel = options.parentPanel;
      if (this.parentPanel === undefined) {
        throw new Error("parentPanel is mandatory");
      }

      var that = this,
      collectionManager = new CollectionManager();
      function render_with_info(allMessageStructureCollection, allUsersCollection, ideaExtracts) {

        ideaExtracts.forEach(function(segment) {
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

      if (this.synthesis.get('is_next_synthesis')) {
        Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
            collectionManager.getAllUsersCollectionPromise(),
            this.model.getExtractsPromise(),
            render_with_info);
      } else {
        // idea is a tombstone; get the original
        Promise.resolve(collectionManager.getAllIdeasCollectionPromise()).then(
          function(ideas) {
            var original_idea = ideas.get(that.model.get('original_uri'));
            if (original_idea) {
              // original may be null if idea deleted.
              that.original_idea = original_idea;
            }

            Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
                collectionManager.getAllUsersCollectionPromise(),
                that.original_idea.getExtractsPromise(),
                render_with_info);
          });
      }

      this.listenTo(this.parentPanel.getGroupState(), "change:currentIdea", function(state, currentIdea) {
        that.onIsSelectedChange(currentIdea);
      });
    },

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
      'change:shortTitle change:longTitle change:segments':'render'
    },

  canEdit: function() {
      return Ctx.getCurrentUser().can(Permissions.EDIT_IDEA) && this.synthesis.get("published_in_post") === null;
    },

  serializeData: function() {
      //As all ideas in a previously posted synthesis are tombstoned, the original idea is 
      //gathered from the original_uri attribute and view is re-rendered. Therefore, the 
      //original idea is expected to be the one that contants the num_posts field.
      var numMessages = this.original_idea.get('num_posts');
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
        ctxNumMessages: i18n.sprintf(i18n.gettext("%d message are available under this idea"), numMessages),
        numMessages: numMessages
      }
    },

  /**
   * The render
   * @param renderParams {}
   * @return {IdeaInSynthesisView}
   */
  onRender: function() {

    Ctx.removeCurrentlyDisplayedTooltips(this.$el);

    if (this.canEdit()) {
      this.$el.addClass('canEdit');
    }

    this.$el.attr('id', 'synthesis-idea-' + this.model.id);

    this.onIsSelectedChange(this.parentPanel.getGroupState().get('currentIdea'));
    Ctx.initTooltips(this.$el);
    if (this.editing && !this.model.get('synthesis_is_published')) {
      this.renderCKEditorIdea();
    }

    this.renderReplyView();
  },

  /**
   * renders the ckEditor if there is one editable field
   */
  renderCKEditorIdea: function() {
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

      this.listenTo(this.ideaSynthesis, 'save cancel', function() {
        that.editing = false;
        that.render();
      });

      this.ideaSynthesis.renderTo(area);
      this.ideaSynthesis.changeToEditMode();
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
      var panel = this.getPanel();

      if (panel.isPrimaryNavigationPanel()) {
        panel.getContainingGroup().setCurrentIdea(this.original_idea);
      }
      
      // If the panel isn't the primary navigation panel, OR if we explicitly
      // ask for a popup, we need to create a modal group to see the idea
      if (!panel.isPrimaryNavigationPanel() || forcePopup) {
        //navigateToIdea called, and we are not the primary navigation panel
        //Let's open in a modal Group
        var ModalGroup = require('./groups/modalGroup.js');
        var defaults = {
          panels: new panelSpec.Collection([
                  {type: PanelSpecTypes.IDEA_PANEL.id, minimized: false},
                  {type: PanelSpecTypes.MESSAGE_LIST.id, minimized: false}
              ],
              {'viewsFactory': viewsFactory })
        };
        var groupSpecModel = new groupSpec.Model(defaults);
        var setResult = groupSpecModel.get('states').at(0).set({currentIdea: this.original_idea}, {validate: true});
        if (!setResult) {
          throw new Error("Unable to set currentIdea on modal Group");
        }

        var idea_title = Ctx.stripHtml(this.model.getShortTitleDisplayText());

        //console.log("idea_title: ", idea_title);
        var modal_title_template = i18n.gettext("Exploring idea \"%s\"");

        //console.log("modal_title_template:", modal_title_template);
        var modal_title = null;
        if (modal_title_template && idea_title)
          modal_title = i18n.sprintf(i18n.gettext("Exploring idea \"%s\""), idea_title);

        //console.log("modal_title:", modal_title);
        var modal = new ModalGroup({"model": groupSpecModel, "title": modal_title});
        Assembl.slider.show(modal);
      }
    },

  makeEditable: function() {
      if (this.canEdit()) {
        this.editing = true;
        this.render();
      }
    }

});

module.exports = IdeaInSynthesisView;
