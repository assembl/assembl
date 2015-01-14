'use strict';

define(['backbone', 'backbone.marionette', 'app', 'underscore', 'jquery', 'common/context', 'utils/permissions', 'objects/messagesInProgress', 'utils/i18n', 'jquery-autosize', 'models/message', 'models/agents', 'models/roles', 'utils/roles', 'backbone.modal', 'backbone.marionette.modals'],
    function (Backbone, Marionette, Assembl, _, $, Ctx, Permissions, MessagesInProgress, i18n, autosize, Messages, Agents, RolesModel, Roles) {

        /**
         * @init
         *
         * @param {
         *
         * reply_message_id:  The id of the message model this replies to
         *  (if any)
         *
         * reply_idea_id:  The id of the idea object this message comments or
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
                this.options = options;
                this.initialBody = (this.options.body_help_message !== undefined) ?
                    this.options.body_help_message : i18n.gettext('Type your message here...');

                this.messageList = options.messageList;
                this.msg_in_progress_ctx = options.msg_in_progress_ctx
            },

            ui: {
                sendButton: '.messageSend-sendbtn',
                cancelButton: '.messageSend-cancelbtn',
                messageBody: '.messageSend-body',
                messageSubject: '.messageSend-subject',
                topicSubject: '.topic-subject .formfield'
            },

            events: {
                'click @ui.sendButton': 'onSendMessageButtonClick',
                'click @ui.cancelButton': 'onCancelMessageButtonClick',
                'blur @ui.messageBody': 'onBlurMessage',
                'keyup @ui.messageBody': 'onChangeBody'
            },

            serializeData: function () {
                return {
                    body_help_message: this.initialBody,
                    allow_setting_subject: this.options.allow_setting_subject || this.options.allow_setting_subject,
                    cancel_button_label: this.options.cancel_button_label ? this.options.cancel_button_label : i18n.gettext('Cancel'),
                    send_button_label: this.options.send_button_label ? this.options.send_button_label : i18n.gettext('Send'),
                    subject_label: this.options.subject_label ? this.options.subject_label : i18n.gettext('Subject:'),
                    canPost: Ctx.getCurrentUser().can(Permissions.ADD_POST),
                    msg_in_progress_body: this.options.msg_in_progress_body,
                    msg_in_progress_title: this.options.msg_in_progress_title
                }
            },

            onRender: function () {
                Ctx.removeCurrentlyDisplayedTooltips(this.$el);
                Ctx.initTooltips(this.$el);

                if (this.options.msg_in_progress_body
                    || this.options.msg_in_progress_title) {
                    // no need anymore
                    //this.onChangeBody();
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
                    success_callback = null;

                if (this.options.reply_idea_id) {
                    reply_idea_id = this.options.reply_idea_id;
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
                        that.ui.topicSubject.val('');

                        // clear on success... so not lost in case of failure.
                        MessagesInProgress.clearMessage(that.msg_in_progress_ctx);
                        if (that.messageList) {
                            that.listenToOnce(that.messageList, "messageList:render_complete", function () {
                                if (_.isFunction(that.options.send_callback)) {
                                    that.options.send_callback();
                                }
                                var el = that.ui.messageBody;
                                if (el.length > 0)
                                    el[0].text = '';
                                el = that.ui.messageSubject;
                                if (el.length > 0)
                                    el[0].text = '';

                                setTimeout(function () {
                                    //TODO:  This delay will no longer be necessary once backbone sync is done below in sendPostToServer
                                    //console.log("Calling showMessageById for "+data['@id']);
                                    Assembl.vent.trigger('messageList:showMessageById', model.id);

                                }, 1000);
                            });
                        }
                        setTimeout(function () {
                            btn.text(btn_original_text);
                            that.ui.cancelButton.trigger('click');
                        }, 5000);

                        /**
                         * Check if the number of user's post is superior to 2
                         * */
                        var agent = new Agents.Model();
                        agent.getSingleUser();
                        agent.fetch();

                        if (agent.get('post_count') < 2) {
                            this.showPopInFirstPost();
                        }

                    },
                    error: function (model, resp) {
                        console.error('ERROR: onSendMessageButtonClick', model, resp);
                    }
                })

            },

            onCancelMessageButtonClick: function () {
                this.clearPartialMessage();
                this.ui.sendButton.addClass("hidden");
                this.ui.cancelButton.addClass("hidden");
            },

            onBlurMessage: function () {
                this.savePartialMessage();
            },

            savePartialMessage: function () {
                var message_body = this.ui.messageBody;
                if (message_body.length > 0) {
                    var message_title = this.ui.messageSubject.val();
                    MessagesInProgress.saveMessage(this.msg_in_progress_ctx, message_body.val(), message_title);
                }
            },

            clearPartialMessage: function () {
                this.ui.messageBody.val('');
                MessagesInProgress.clearMessage(this.msg_in_progress_ctx);
            },

            
            onChangeBody: function () {
                this.ui.messageBody.autosize();

                /**
                 * not necesary anymore 
                 *
                 var message_body = this.ui.messageBody.val();
                if (message_body && message_body.length > 0) {
                    this.ui.sendButton.removeClass("hidden");
                    this.ui.cancelButton.removeClass("hidden");
                }
                else {
                    this.ui.sendButton.addClass("hidden");
                    this.ui.cancelButton.addClass("hidden");
                }*/
            },

            showPopInFirstPost: function () {

                var Modal = Backbone.Modal.extend({
                    template: _.template($('#tmpl-firstPost').html()),
                    className: 'group-modal popin-wrapper modal-firstPost',
                    cancelEl: '.close, .btn-cancel',
                    initialize: function () {
                        this.$('.bbm-modal').addClass('popin');
                    },
                    events: {
                        'click .js_subscribe': 'subscription'
                    },
                    subscription: function () {
                        var that = this;

                        if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {

                            var LocalRolesUser = new RolesModel.Model({
                                role: Roles.PARTICIPANT,
                                discussion: 'local:Discussion/' + Ctx.getDiscussionId()
                            });
                            LocalRolesUser.save(null, {
                                success: function (model, resp) {
                                    //TODO: need to hide the header button to subscribe  ?
                                    that.triggerSubmit();
                                },
                                error: function (model, resp) {
                                    console.error('ERROR: showPopInFirstPost->subscription', resp);
                                }
                            })
                        }
                    }
                });

                Assembl.slider.show(new Modal());

            }

        });

        return messageSend;
    });
