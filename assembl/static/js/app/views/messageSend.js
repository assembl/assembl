'use strict';
/**
 * 
 * @module app.views.messageSend
 */

var Backbone = require('backbone'),
    Marionette = require('../shims/marionette.js'),
    Assembl = require('../app.js'),
    _ = require('underscore'),
    $ = require('jquery'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Permissions = require('../utils/permissions.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    i18n = require('../utils/i18n.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    autosize = require('jquery-autosize'),
    LangString = require('../models/langstring.js'),
    Messages = require('../models/message.js'),
    Agents = require('../models/agents.js'),
    Documents = require('../models/documents.js'),
    Attachments = require('../models/attachments.js'),
    AttachmentViews = require('./attachments.js'),
    Promise = require('bluebird'),
    Analytics = require('../internal_modules/analytics/dispatcher.js'),
    linkify = require('linkifyjs');

/**
 * @init
 *
 * @param reply_message_id:  The id of the message model this replies to
 *  (if any)
 *
 * @param reply_message_model: The model of the message; sometimes not given (ex IdeaInSynthesis)
 *
 * @param reply_idea:  The idea object this message comments or
 *  replies to (if any)
 *
 * @param {string} cancel_button_label:  the label used for the Cancel button
 *
 * @param {string} send_button_label:  the label used for the Send button
 *
 * @param {boolean} allow_setting_subject:  if true, the user is allowed to set
 *  his own subject for the message
 *
 * @param {string} subject_label: If set, the label of the subject field.
 *
 * @param {string} default_subject:  If set, the dfault subject if the user
 *  doesn't change it.  Can be used even if allow_setting_subject is
 *  false.  Is the default value sent to the server.
 *
 * @param {string} mandatory_subject_missing_msg: If set, the user must
 *  provide a mesasge subject.  If he doesn't, this string is used as
 *  the error message
 *
 * @param {string} body_help_message: The text present in the body field to
 *  tell the user what to do.  It is NOT used as a default value sent
 *  to the server, the user must replace it.
 *
 * @param {string} mandatory_body_missing_msg: Providing a body is always
 *  mandatory.  Only sets the error displayed to the user if he doesn't
 *  provide a body
 *
 * @param {MessageListView} messageList: MessageListView that we expect to refresh once the
 *  message has been processed
 *
 * @param {function} send_callback:  Function.  A callback to call once the message has
 *  been accepted by the server, and the mesasgeList has refreshed.
 *
 * @param {string} message_classifier: A message classifier that will be set on the message
 *
 * @param {string} message_send_title: An overriding value for the form's title
 */

var messageSendView = Marionette.LayoutView.extend({
  constructor: function messageSendView() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-loader',
  className: 'messageSend',
  initialize: function(options) {
    //console.log("options given to the constructor of messageSend: ", options);
    this.options = options;
    var that = this, collectionManager = new CollectionManager();
    collectionManager.getUserLanguagePreferencesPromise(Ctx).then(function (ulp) {
      that.translationData = ulp;
      that.template = '#tmpl-messageSend';
      that.render();
    });
    this.sendInProgress = false;
    this.initialBody = (this.options.body_help_message !== undefined) ?
        this.options.body_help_message : i18n.gettext('Type your message here...');

    if (this.options.reply_message_id) {
      this.analytics_context = 'MESSAGE_REPLY';
    }
    else if (this.options.reply_idea) {
      this.analytics_context = 'IDEA_REPLY';
    }
    else {
      this.analytics_context = 'TOP_POST';
    }
    this.messageList = options.messageList;
    this.msg_in_progress_ctx = options.msg_in_progress_ctx;

    if (options.reply_message_model) {
      this.reply_message_model = options.reply_message_model;
    }
    else {
      this.reply_message_model = null;
    }

    if(!options.model) {
      this.model = new Messages.Model();
    }

    this.attachmentsCollection = new Attachments.Collection([], {objectAttachedToModel: this.model});
    // this.attachmentsCollection = new Attachments.Collection([], {objectAttachedToModel: this.model})
    this.model.set('attachments', this.attachmentsCollection);
    // this.documentsView = new AttachmentViews.AttachmentEditableCollectionView({
    //   collection: this.attachmentsCollection,
    //   childViewOptions: {
    //     parentView: this
    //   }
    // });
    // var AttachmentEditableCollectionView = Marionette.CollectionView.extend({
    //   constructor: function AttachmentEditableCollectionView() {
    //     Marionette.CollectionView.apply(this, arguments);
    //   },

    //   childView: AttachmentViews.AttachmentEditableView
    // });

    // this.documentsView = new AttachmentEditableCollectionView({
    //   collection: this.attachmentsCollection
    // });
  },

  ui: {
    sendButton: '.messageSend-sendbtn',
    cancelButton: '.messageSend-cancelbtn',
    messageBody: '.js_messageSend-body',
    messageSubject: '.messageSend-subject',
    topicSubject: '.topic-subject .formfield',
    permissionDeniedWarningMessage: '.js_warning-message-for-message-post',
    uploadButton: '.js_upload-button',
    attachments: '.js_attachment-edit-region'
  },

  regions: {
    uploadButton: '@ui.uploadButton',
    attachments: '@ui.attachments'
  },

  events: {
    'click @ui.sendButton': 'onSendMessageButtonClick',
    'click @ui.cancelButton': 'onCancelMessageButtonClick',
    'blur @ui.messageBody': 'onBlurMessage',
    'focus @ui.messageBody': 'onFocusMessage',
    'keyup @ui.messageBody': 'onChangeBody'
  },

  serializeData: function() {
    if (this.template == '#tmpl-loader') {
      return {};
    }
    var show_cancel_button = ('show_cancel_button' in this.options) ? this.options.show_cancel_button : false;
    var reply_idea = ('reply_idea' in this.options) ? this.options.reply_idea : null;
    var reply_idea_title = reply_idea ? reply_idea.getShortTitleDisplayText(this.translationData) : null;
    var reply_message_id = ('reply_message_id' in this.options) ? this.options.reply_message_id : null;
    var show_target_context_with_choice = ('show_target_context_with_choice' in this.options) ? this.options.show_target_context_with_choice : null;
    var message_send_title = this.options.message_send_title;
    if (message_send_title === undefined && reply_message_id === null) {
      message_send_title = i18n.gettext('Start a new discussion thread');
    }

    //var i18n_post_message_in_this_idea = i18n.gettext('Under the idea "%s"'); // declared only to be spotted for the generation of the .pot file (I didn't manage our tool to detect it in messageSend.tmpl)
    //var i18n_post_message_in_general_conversation = i18n.gettext('In the general conversation'); // declared only to be spotted for the generation of the .pot file (I didn't manage our tool to detect it in messageSend.tmpl)
    var canPost = Ctx.getCurrentUser().can(Permissions.ADD_POST);

    //var requiredRolesToPost = null;

    return {
      i18n: i18n,
      body_help_message: this.initialBody,
      message_send_title: message_send_title,
      allow_setting_subject: this.options.allow_setting_subject || this.options.allow_setting_subject,
      cancel_button_label: this.options.cancel_button_label ? this.options.cancel_button_label : i18n.gettext('Cancel'),
      send_button_label: this.options.send_button_label ? this.options.send_button_label : i18n.gettext('Send'),
      subject_label: this.options.subject_label ? this.options.subject_label : i18n.gettext('Subject:'),
      canPost: canPost,
      msg_in_progress_body: this.options.msg_in_progress_body,
      msg_in_progress_title: this.options.msg_in_progress_title,
      reply_idea: reply_idea,
      reply_idea_title: reply_idea_title,
      show_cancel_button: show_cancel_button,
      reply_message_id: reply_message_id,
      show_target_context_with_choice: show_target_context_with_choice,
      enable_button: this.options.enable_button
    }
  },

  onRender: function() {
    if (Ctx.debugRender) {
      console.log("messageSend:render() is firing");
    }
    Ctx.removeCurrentlyDisplayedTooltips(this.$el);
    Ctx.initTooltips(this.$el);
    if (!Ctx.getCurrentUser().can(Permissions.ADD_POST)) {
      var that = this, collectionManager = new CollectionManager();
      collectionManager.getDiscussionModelPromise().then(function(discussion) {
        if (that.isViewDestroyed()) {
          return;
        }
        var routeUrl = null;
        if (that.reply_message_model) {
          routeUrl = that.reply_message_model.getRouterUrl({relative: true});
        }
        var rolesMissingMessageForPermission = Ctx.getCurrentUser().getRolesMissingMessageForPermission(Permissions.ADD_POST, discussion, routeUrl),
        messageString,
        warningMessage;
        if ('reply_message_id' in that.options) {
          messageString = i18n.gettext("Before you can reply to this message %s")
        }
        else {
          messageString = i18n.gettext("Before you can post a message %s")
        }

        warningMessage = i18n.sprintf(messageString, rolesMissingMessageForPermission);
        that.ui.permissionDeniedWarningMessage.html(warningMessage);
      });
    }
    //In case there was a message in progess just restored
    this.processHyperlinks();
  },

  onShow: function() {
    //console.log("messageSend onShow() this.documentsView:", this.documentsView);
    if (this.template === '#tmpl-loader') {
      var that = this;
      setTimeout(function() {
        that.onShow();
      }, 500);
      return;
    }

    // TODO: the attachments and uploadButton regions should either always appear in the template (which is now the case) or be in a subview (which would be better, because in one case they are not used at all)
    var canPost = Ctx.getCurrentUser().can(Permissions.ADD_POST);
    if ( canPost ){
      var documentView = new AttachmentViews.AttachmentEditUploadView({
        collection: this.attachmentsCollection
      });

      this.errorCollection = documentView.getFailedCollection(); 
      var uploadButtonView = new AttachmentViews.AttachmentUploadButtonView({
        objectAttachedToModel: this.model,
        collection: this.attachmentsCollection,
        errorCollection: this.errorCollection
      });
      this.attachments.show(documentView);
      this.uploadButton.show(uploadButtonView);
    }
  },

  onAttach: function() {
    this.ui.messageBody.autosize();
  },

  onSendMessageButtonClick: function(ev) {
    var btn = $(ev.currentTarget),
        that = this,
        btn_original_text = btn.text(),
        message_body = this.ui.messageBody.val(),
        message_subject_field = this.ui.topicSubject,
        message_subject = message_subject_field.val() || this.options.default_subject,
        reply_idea_id = null,
        reply_message_id = null,
        success_callback = null,
        chosenTargetIdeaField = this.$el.find('.messageSend-target input:checked');
    /*console.log("chosenTargetIdea:", chosenTargetIdeaField);
    console.log("chosenTargetIdea val:", chosenTargetIdeaField.val());*/

    if (this.sendInProgress !== false) {
      return;
    }
    // If there is a UI input which tells in which idea to post the message, then post in this idea.
    // The value of this UI input can be empty, which means the message has to be posted in the general debate discussion.
    // If there is no field, post in idea given in options, if any.
    if (chosenTargetIdeaField && chosenTargetIdeaField.length){
      if (chosenTargetIdeaField.val()){
        reply_idea_id = chosenTargetIdeaField.val();
      }
      else {
        reply_idea_id = null;
      }
    } else if (this.options.reply_idea) {
      reply_idea_id = this.options.reply_idea.getId();
    }

    if (this.options.reply_message_id) {
      reply_message_id = this.options.reply_message_id;
    }

    if (!message_subject && (this.options.mandatory_subject_missing_msg || (!reply_idea_id && !reply_message_id))) {
      if (this.options.mandatory_subject_missing_msg) {
        alert(this.options.mandatory_subject_missing_msg)
      } else {
        alert(i18n.gettext('You need to set a subject before you can send your message...'));
      }

      return;
    }

    if (!message_body) {
      if (this.options.mandatory_body_missing_msg) {
        alert(this.options.mandatory_body_missing_msg)
      } else {
        alert(i18n.gettext('You need to type a message before you can send your message...'));
      }

      return;
    }

    this.sendInProgress = true;
    this.savePartialMessage();
    btn.text(i18n.gettext('Sending...'));

    // This is not too good, but it allows the next render to come.
    message_subject_field.value = "";
    var subject_ls = message_subject ? (new LangString.Model({
        entries: new LangString.EntryCollection([
            new LangString.EntryModel({
                value: message_subject
                // @language: make educated guess from discussion and user languages
            })])})) : null,
        body_ls = message_body ? (new LangString.Model({
        entries: new LangString.EntryCollection([
            new LangString.EntryModel({
                value: message_body
                // @language: make educated guess from discussion and user languages
            })])})) : null;

    this.model.set({
      subject: subject_ls,
      body: body_ls,
      reply_id: reply_message_id,
      idea_id: reply_idea_id,
      message_classifier: this.options.message_classifier,
    });

    this.model.save(null, {
      success: function(model, resp) {
        var analytics = Analytics.getInstance();
        analytics.trackEvent(analytics.events['MESSAGE_POSTED_ON_'+that.analytics_context]);
        
        Promise.resolve(that.attachmentsCollection.saveAll()).then(function(){

          btn.text(i18n.gettext('Message posted!'));

          that.ui.messageBody.val('');
          that.ui.messageSubject.val('');
          that.sendInProgress = false;
          /**
           * Show a popin asking the user to receive notifications if he is posting his first message in the discussion, and does not already receive all default discussion's notifications.
           * Note: Currently in Assembl we can receive notifications only if we have a "participant" role (which means that here we have a non-null "roles.get('role')"). This role is only given to a user in discussion's parameters, or when the user "subscribes" to the discussion (subscribing gives the "participant" role to the user and also activates discussion's default notifications for the user).
           * But, we cannot consider that the user does not already receive notifications by checking that he does not have the participant role. Because some discussions can give automatically the add_post permission to all logged in accounts (system.Authenticated role), instead of only those who have the participant role. So these accounts can post messages but are not subscribed to any notification, so we want to show them the first post pop-in.
           * */
          var collectionManager = new CollectionManager();
          if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {

            Promise.join(collectionManager.getLocalRoleCollectionPromise(),
                collectionManager.getNotificationsUserCollectionPromise(),
                collectionManager.getNotificationsDiscussionCollectionPromise(),
                          function(allRole, notificationsUser, notificationsDiscussion) {

                            var defaultActiveNotificationsDicussion = _.filter(notificationsDiscussion.models, function(model) {
                              // keep only the list of notifications which become active when a user follows a discussion
                              return (model.get('creation_origin') === 'DISCUSSION_DEFAULT') && (model.get('status') === 'ACTIVE');
                            });

                            var userActiveNotifications = _.filter(notificationsUser.models, function(model) {
                              return (model.get('status') === 'ACTIVE');
                            });

                            var agent = new Agents.Model({'@id': Ctx.getCurrentUserId()});
                            agent.fetch({
                                  success: function(model, resp) {
                                    var analytics = Analytics.getInstance();

                                    // The <2 condition is because we are in the process of posting, but the agent may, or may not have been updated yet.
                                    if ((agent.get('post_count') === 0 || agent.get('post_count') < 2) &&
                                        userActiveNotifications.length < defaultActiveNotificationsDicussion.length) { // we could make a real diff here but this is enough for now
                                      that.showPopInFirstPost();
                                      analytics.setCustomVariable(analytics.customVariables.HAS_POSTED_BEFORE, true);
                                    }
                                  }});
                          }

                      );
          }

          // clear draft on success... so not lost in case of failure.
          that.clearPartialMessage();
          if (that.messageList) {
            that.messageList.loadPendingMessages().then(function() {
                      if (_.isFunction(that.options.send_callback)) {
                        that.options.send_callback();
                      }

                      var current_idea = that.messageList.getGroupState().get('currentIdea');

                      // if the user was top-posting into the current idea or answering to someone or top-posting from the general conversation context, scroll to his message
                      if (reply_idea_id || reply_message_id || (!current_idea && !reply_message_id && !reply_idea_id)) {
                        that.messageList.showMessageById(model.id);
                      }

                      // if the user was top-posting into the general conversation from an idea (versus answering to someone or top-posting into the current idea)
                      else if (current_idea && !reply_idea_id) {
                        // Solution 1: Show an alert message
                        /*
                        alert(i18n.gettext('Your message has been successfully posted in the general conversation. To see it, go to the bottom of the table of ideas and click on "View posts not yet sorted anywhere", or "All messages".'));
                        */

                        // Solution 2: Redirect user to the "Orphan messages" or "All messages" section of the table of ideas, and highlight his message
                        // TODO: change browser navigation state once we have proper URLs for things, so that the user can go back to the idea where he was
                        // Quentin: this code has been adapted from views/orphanMessagesInIdeaList.js and views/allMessagesInIdeaList.js. Where else could we put it so that it could be called from several places?
                        var groupContent = that.messageList.getContainingGroup();
                        groupContent.setCurrentIdea(null);
                        if (that.messageList) {
                          that.messageList.triggerMethod('messageList:clearAllFilters');

                          //that.messageList.triggerMethod('messageList:addFilterIsOrphanMessage');

                          //FIXME:  Remove this magic delay.  Benoitg - 2015-06-09
                          setTimeout(function() {
                            that.messageList.showMessageById(model.id);
                          }, 500);
                        }

                        // Solution 3: Show some info with a link to his message in its context (in "All messages" or "Orphan messages"), like "Your message has been successfully posted in the general conversation. Click here to see it in context"
                      }
                    });
          }

          setTimeout(function() {
            if (!that.isDestroyed) {
                btn.text(btn_original_text);
                that.ui.cancelButton.trigger('click');
            }
          }, 5000);

        });
      },

      error: function(model, resp) {
              that.sendInProgress = false;
              console.error('ERROR: onSendMessageButtonClick', model, resp);
            }
    })

  },

  onCancelMessageButtonClick: function() {
    this.clearPartialMessage();
    this.model.destroy({errorCollection: this.errorCollection});
  },

  onBlurMessage: function(ev) {
    var analytics = Analytics.getInstance(),
        messageWasSaved = this.savePartialMessage();

    //console.log("onBlurMessage()", ev);

    /* Quentin: turned off, because the "when I'm writing a message, I don't want the interface to reload" fix will be done using filtering on message collection add event
    var panelWrapper = this.options.messageList._panelWrapper;
    if ( panelWrapper.isPanelLocked() && panelWrapper.getPanelLockedReason() == "USER_IS_WRITING_A_MESSAGE" ) {
      console.log("onBlurMessage() will autoUnlockPanel()");
      panelWrapper.autoUnlockPanel(false, "USER_WAS_WRITING_A_MESSAGE");
    }
    */
    if(messageWasSaved) {
      analytics.trackEvent(analytics.events['LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA_ON_'+this.analytics_context]);
    }
    else {
      analytics.trackEvent(analytics.events['LEAVE_EMPTY_MESSAGE_WRITING_AREA_ON_'+this.analytics_context]);
    }

  },

  onFocusMessage: function() {
    var analytics = Analytics.getInstance(),
        message_body = this.ui.messageBody,
        message_title = this.ui.messageSubject;

    //console.log("onFocusMessage()");
    //TODO: use a better mecanism than panel locking to address the problem of reloading UI when the user is writing a message (for example when other new messages arrive at the same time)
    /* Quentin: turned off, because the "when I'm writing a message, I don't want the interface to reload" fix will be done using filtering on message collection add event
      var panelWrapper = this.options.messageList._panelWrapper;
      if ( !panelWrapper.isPanelLocked() ) {
        console.log("onFocusMessage() will autoLockPanel()");
        panelWrapper.autoLockPanel(false, "USER_IS_WRITING_A_MESSAGE");
      }
     */
    if ((message_body.length > 0 && message_body.val().length > 0) || (message_title.length > 0 && message_title.val().length > 0)) {
      analytics.trackEvent(analytics.events['ENTER_NON_EMPTY_MESSAGE_WRITING_AREA_ON_'+this.analytics_context]);
    } else {
      analytics.trackEvent(analytics.events['ENTER_EMPTY_MESSAGE_WRITING_AREA_ON_'+this.analytics_context]);
    }

  },

  /**
   * @returns true if there was a message to save
   */
  savePartialMessage: function() {
    if(this.isViewRenderedAndNotYetDestroyed()) {
      var message_body = this.ui.messageBody,
      message_title = this.ui.messageSubject;

      if ((message_body.length > 0 && message_body.val().length > 0) || (message_title.length > 0 && message_title.val().length > 0)) {
        MessagesInProgress.saveMessage(this.msg_in_progress_ctx, message_body.val(), message_title.val());
        return true;
      }
      else {
        //We may have just emptied the content
        this.clearPartialMessage();
        return false;
      }
    }
  },

  onBeforeDestroy: function() {
    this.savePartialMessage();
  },

  clearPartialMessage: function() {
    if (this.ui.messageBody.length > 0)
      this.ui.messageBody.val('');
    if (this.ui.messageSubject.length > 0)
      this.ui.messageSubject.val('');
    MessagesInProgress.clearMessage(this.msg_in_progress_ctx);

    /* Quentin: turned off, because the "when I'm writing a message, I don't want the interface to reload" fix will be done using filtering on message collection add event
    var panelWrapper = this.options.messageList._panelWrapper;
    if ( panelWrapper.isPanelLocked() && panelWrapper.getPanelLockedReason() == "USER_IS_WRITING_A_MESSAGE" ) {
      console.log("savePartialMessage() will autoUnlockPanel()");
      panelWrapper.autoUnlockPanel("USER_WAS_WRITING_A_MESSAGE");
    }
    */
  },

  _processHyperlinks: _.throttle(function() {
    var that = this,
        messageText = this.ui.messageBody.val()||'',
        links = linkify.find(messageText),
        missingLinks = [],
        goneModels = [];
    //console.log("_processHyperlinks called");
    //console.log(links);
    //console.log(this.attachmentsCollection);

    // this.attachmentsCollection.comparator = function (attachmentModel) {
    //   var index = _.findIndex(links, function(link) {
    //     //console.log(attachmentModel.getDocument().get('uri'), link.href);
    //     return attachmentModel.getDocument().get('uri') === link.href;
    //   })
    //   //console.log("attachmentsCollection comparator returning: ", index);
    //   return index;
    // };
    goneModels = that.attachmentsCollection.filter(function(attachment) {
      var document = attachment.getDocument();

      if (document.isFileType()){
        return false;
      }
      //console.log("filtering for goneModels checking document:", document);
      var found = _.find(links, function(link) {
        //console.log("filtering for goneModels comparing:", document.get('uri'), link.href);
        return document.get('uri') === link.href; 
      });
      return found === undefined;
    });
    //console.log("goneModels: ", goneModels);
    
    that.attachmentsCollection.destroy(goneModels);

    missingLinks = _.filter(links, function(link) {
      var retval;
      //console.log("Checking link", link.href)
      retval = that.attachmentsCollection.filter(function(attachment) {
        var document = attachment.getDocument();
        //console.log("filtering for missingLinks comparing:", document.get('uri'), link.href, document.get('uri') === link.href);
        return (document.get('uri') === link.href)?true:false;
      }).length === 0;
      //console.log("Checking link", link.href, "returned", retval)
      return retval;
    });
    //console.log("missingLinks: ", missingLinks);

    _.each(missingLinks, function(link) {
      if(link.type !== 'url') {
        console.warn("unknown link type: ", link.type);
        return;
      }
      var document = new Documents.DocumentModel({
                                  uri: link.href}),
          attachment = new Attachments.Model({
            document: document,
            objectAttachedToModel: that.model,
            idCreator: Ctx.getCurrentUser().id
          })
      //console.log("Adding missing url", document);
      that.attachmentsCollection.add(attachment);
    });
    //console.log("Attachments after _processHyperlinks:", this.attachmentsCollection);
  }, 500),

  processHyperlinks: function() {
    var that = this;
    this._processHyperlinks();
  },
  
  onChangeBody: function() {
    this.ui.messageBody.autosize();
    this.processHyperlinks();
  },

  showPopInFirstPost: function() {
    Assembl.vent.trigger('navBar:subscribeOnFirstPost');
  }

});

module.exports = messageSendView;
