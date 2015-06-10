'use strict';

var Backbone = require('../shims/backbone.js'),
    Marionette = require('../shims/marionette.js'),
    Assembl = require('../app.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Permissions = require('../utils/permissions.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    i18n = require('../utils/i18n.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    autosize = require('jquery-autosize'),
    Messages = require('../models/message.js'),
    Agents = require('../models/agents.js'),
    Promise = require('bluebird');

/**
 * @init
 *
 * @param {
 *
 * reply_message_id:  The id of the message model this replies to
 *  (if any)
 *
 * reply_idea:  The idea object this message comments or
 *  replies to (if any)
 *
 * cancel_button_label:  String, the label used for the Cancel button
 *
 * send_button_label:  String, the label used for the Send button
 *
 * allow_setting_subject:  Boolean, if true, the user is allowed to set
 *  his own subject for the message
 *
 * subject_label:  String:  If set, the label of the subject field.
 *
 * default_subject:  String:  If set, the dfault subject if the user
 *  doesn't change it.  Can be used even if allow_setting_subject is
 *  false.  Is the default value sent to the server.
 *
 * mandatory_subject_missing_msg:  String.  If set, the user must
 *  provide a mesasge subject.  If he doesn't, this string is used as
 *  the error message
 *
 * body_help_message:  String:  The text present in the body field to
 *  tell the user what to do.  It is NOT used as a default value sent
 *  to the server, the user must replace it.
 *
 * mandatory_body_missing_msg:  String.  Providing a body is always
 *  mandatory.  Only sets the error displayed to the user if he doesn't
 *  provide a body
 *
 * messageList: MessageListView that we expect to refresh once the
 *  message has been processed
 *
 * send_callback:  Function.  A callback to call once the message has
 *  been accepted by the server, and the mesasgeList has refreshed.
 *
 *  }
 */

var messageSend = Marionette.ItemView.extend({
    template: '#tmpl-messageSend',
    className: 'messageSend',
    initialize: function (options) {
        //console.log("options given to the constructor of messageSend: ", options);
        this.options = options;
        this.sendInProgress = false;
        this.initialBody = (this.options.body_help_message !== undefined) ?
            this.options.body_help_message : i18n.gettext('Type your message here...');

        this.messageList = options.messageList;
        this.msg_in_progress_ctx = options.msg_in_progress_ctx;
    },

    ui: {
        sendButton: '.messageSend-sendbtn',
        cancelButton: '.messageSend-cancelbtn',
        messageBody: '.js_messageSend-body',
        messageSubject: '.messageSend-subject',
        topicSubject: '.topic-subject .formfield',
        permissionDeniedWarningMessage: '.js_warning-message-for-message-post'
    },

    events: {
        'click @ui.sendButton': 'onSendMessageButtonClick',
        'click @ui.cancelButton': 'onCancelMessageButtonClick',
        'blur @ui.messageBody': 'onBlurMessage',
        'focus @ui.messageBody': 'onFocusMessage',
        'keyup @ui.messageBody': 'onChangeBody'
    },

    serializeData: function () {
        var reply_idea = ('reply_idea' in this.options) ? this.options.reply_idea : null;
        var reply_message_id = ('reply_message_id' in this.options) ? this.options.reply_message_id : null;
        var show_target_context_with_choice = ('show_target_context_with_choice' in this.options) ? this.options.show_target_context_with_choice : null;
        //var i18n_post_message_in_this_idea = i18n.gettext('Under the idea "%s"'); // declared only to be spotted for the generation of the .pot file (I didn't manage our tool to detect it in messageSend.tmpl)
        //var i18n_post_message_in_general_conversation = i18n.gettext('In the general conversation'); // declared only to be spotted for the generation of the .pot file (I didn't manage our tool to detect it in messageSend.tmpl)
        var canPost = Ctx.getCurrentUser().can(Permissions.ADD_POST);
        //var requiredRolesToPost = null;

        return {
            i18n: i18n,
            body_help_message: this.initialBody,
            allow_setting_subject: this.options.allow_setting_subject || this.options.allow_setting_subject,
            cancel_button_label: this.options.cancel_button_label ? this.options.cancel_button_label : i18n.gettext('Cancel'),
            send_button_label: this.options.send_button_label ? this.options.send_button_label : i18n.gettext('Send'),
            subject_label: this.options.subject_label ? this.options.subject_label : i18n.gettext('Subject:'),
            canPost: canPost,
            msg_in_progress_body: this.options.msg_in_progress_body,
            msg_in_progress_title: this.options.msg_in_progress_title,
            reply_idea: reply_idea,
            reply_message_id: reply_message_id,
            show_target_context_with_choice: show_target_context_with_choice,
            enable_button: this.options.enable_button
        }
    },

    onRender: function () {
      var that = this,
          collectionManager = new CollectionManager(),
          canPost = Ctx.getCurrentUser().can(Permissions.ADD_POST);
        Ctx.removeCurrentlyDisplayedTooltips(this.$el);
        Ctx.initTooltips(this.$el);

        if(!Ctx.getCurrentUser().can(Permissions.ADD_POST)) {
          collectionManager.getDiscussionModelPromise().then(function(discussion) {
            var rolesMissingMessageForPermission = discussion.getRolesMissingMessageForPermission(Ctx.getCurrentUser(), Permissions.ADD_POST),
                messageString,
                warningMessage;
            if('reply_message_id' in that.options) {
              messageString = i18n.gettext("Before you can reply to this message %s")
            }
            else{
              messageString = i18n.gettext("Before you can post a message %s")
            }
            warningMessage = i18n.sprintf(messageString, rolesMissingMessageForPermission);
            that.ui.permissionDeniedWarningMessage.html(warningMessage);
          });
        }
    },

    onSendMessageButtonClick: function (ev) {
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

        if(this.sendInProgress !== false) {
          return;
        }
        /*
        if (this.options.reply_idea) {
            reply_idea_id = this.options.reply_idea.getId();
        }
        */
        if ( chosenTargetIdeaField && chosenTargetIdeaField.val() )
        {
            reply_idea_id = chosenTargetIdeaField.val();
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

        var model = new Messages.Model({
            subject: message_subject,
            message: message_body,
            reply_id: reply_message_id,
            idea_id: reply_idea_id
        });

        model.save(null, {
            success: function (model, resp) {
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
                        function (allRole, notificationsUser, notificationsDiscussion) {

                            var defaultActiveNotificationsDicussion = _.filter(notificationsDiscussion.models, function (model) {
                                // keep only the list of notifications which become active when a user follows a discussion
                                return (model.get('creation_origin') === 'DISCUSSION_DEFAULT') && (model.get('status') === 'ACTIVE');
                            });

                            var userActiveNotifications = _.filter(notificationsUser.models, function (model) {
                                return (model.get('status') === 'ACTIVE');
                            });

                            var agent = new Agents.Model();
                            agent.getSingleUser();
                            agent.fetch({
                                success: function(model, resp) {
                                //if ((agent.get('post_count') === 0 || agent.get('post_count') < 2) && this.roles.get('role') === null) {
                                if ((agent.get('post_count') === 0 || agent.get('post_count') < 2) &&
                                    userActiveNotifications.length < defaultActiveNotificationsDicussion.length){ // we could make a real diff here but this is enough for now

                                    that.showPopInFirstPost();
                                }
                            }});
                        }
                    );
                }

                // clear draft on success... so not lost in case of failure.
                that.clearPartialMessage();
                if (that.messageList) {
                  that.messageList.loadPendingMessages().then(function () {
                    if (_.isFunction(that.options.send_callback)) {
                      that.options.send_callback();
                    }
                    var el = that.ui.messageBody;
                    if (el.length > 0)
                        el[0].text = '';
                    el = that.ui.messageSubject;
                    if (el.length > 0)
                        el[0].text = '';

                    var current_idea = that.messageList.getGroupState().get('currentIdea');
                    // if the user was top-posting into the current idea or answering to someone or top-posting from the general conversation context, scroll to his message
                    if ( reply_idea_id || reply_message_id || (!current_idea && !reply_message_id && !reply_idea_id) ) {
                      that.messageList.showMessageById(model.id);
                    }
                    // if the user was top-posting into the general conversation from an idea (versus answering to someone or top-posting into the current idea)
                    else if ( current_idea && !reply_idea_id ) {
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
                        groupContent.resetDebateState();
                        //FIXME:  Remove this magic delay.  Benoitg - 2015-06-09
                        setTimeout(function(){
                          that.messageList.showMessageById(model.id);
                        }, 500);
                      }

                      // Solution 3: Show some info with a link to his message in its context (in "All messages" or "Orphan messages"), like "Your message has been successfully posted in the general conversation. Click here to see it in context"
                    }
                  });
                }
                setTimeout(function () {
                    btn.text(btn_original_text);
                    that.ui.cancelButton.trigger('click');
                }, 5000);
            },
            error: function (model, resp) {
              that.sendInProgress = false;
              console.error('ERROR: onSendMessageButtonClick', model, resp);
            }
        })

    },

    onCancelMessageButtonClick: function () {
        this.clearPartialMessage();
    },

    onBlurMessage: function () {
        //console.log("onBlurMessage()");
        this.savePartialMessage();

        /* Quentin: turned off, because the "when I'm writing a message, I don't want the interface to reload" fix will be done using filtering on message collection add event
        var panelWrapper = this.options.messageList._panelWrapper;
        if ( panelWrapper.isPanelLocked() && panelWrapper.getPanelLockedReason() == "USER_IS_WRITING_A_MESSAGE" ) {
          console.log("onBlurMessage() will autoUnlockPanel()");
          panelWrapper.autoUnlockPanel(false, "USER_WAS_WRITING_A_MESSAGE");
        }
        */
    },

    onFocusMessage: function() {
      //console.log("onFocusMessage()");
      //TODO: use a better mecanism than panel locking to address the problem of reloading UI when the user is writing a message (for example when other new messages arrive at the same time)
      /* Quentin: turned off, because the "when I'm writing a message, I don't want the interface to reload" fix will be done using filtering on message collection add event
      var panelWrapper = this.options.messageList._panelWrapper;
      if ( !panelWrapper.isPanelLocked() ) {
        console.log("onFocusMessage() will autoLockPanel()");
        panelWrapper.autoLockPanel(false, "USER_IS_WRITING_A_MESSAGE");
      }
      */
    },

    savePartialMessage: function () {
        var message_body = this.ui.messageBody,
            message_title = this.ui.messageSubject;

        if ((message_body.length > 0 && message_body.val().length > 0) || (message_title.length > 0 && message_title.val().length > 0)) {
          MessagesInProgress.saveMessage(this.msg_in_progress_ctx, message_body.val(), message_title.val());
        }
    },

    clearPartialMessage: function () {
        if ( this.ui.messageBody.length > 0 )
          this.ui.messageBody.val('');
        if ( this.ui.messageSubject.length > 0 )
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


    onChangeBody: function () {
        this.ui.messageBody.autosize();
    },

    showPopInFirstPost: function () {
        Assembl.vent.trigger('navBar:subscribeOnFirstPost');
    }

});


module.exports = messageSend;
