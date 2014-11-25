'use strict';

define(['backbone', 'backbone.marionette', 'app', 'underscore', 'jquery', 'common/context', 'utils/permissions', 'objects/messagesInProgress', 'utils/i18n', 'jquery-autosize', 'models/message'],
    function (Backbone, Marionette, Assembl, _, $, Ctx, Permissions, MessagesInProgress, i18n, autosize, Messages) {

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
                messageBody: '.messageSend-body'
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
                    this.onChangeBody();
                }
            },

            onSendMessageButtonClick: function (ev) {
                var btn = $(ev.currentTarget),
                    that = this,
                    btn_original_text = btn.text(),
                    message_body = this.ui.messageBody.val(),
                    message_subject_field = this.$('.topic-subject .formfield'),
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

                /*success_callback = function (data, textStatus, jqXHR) {
                 btn.text(i18n.gettext('Message posted!'));
                    if (that.messageList) {
                        that.listenToOnce(that.messageList, "messageList:render_complete", function () {
                            if (_.isFunction(that.options.send_callback)) {
                                that.options.send_callback();
                            }
                            // clear on success... so not lost in case of failure.
                            MessagesInProgress.clearMessage(that.msg_in_progress_ctx);
                            var el = that.$el.$('.messageSend-body');
                            if (el.length > 0)
                                el[0].text = '';
                            el = that.$el.$('.messageSend-subject');
                            if (el.length > 0)
                                el[0].text = '';

                            setTimeout(function () {
                                //TODO:  This delay will no longer be necessary once backbone sync is done below in sendPostToServer
                                //console.log("Calling showMessageById for "+data['@id']);
                                Assembl.vent.trigger('messageList:showMessageById', data['@id']);

                            }, 1000);
                        });
                    }
                    setTimeout(function () {
                        btn.text(btn_original_text);
                        that.$('.messageSend-cancelbtn').trigger('click');
                    }, 5000);
                 }; */
                // This is not too good, but it allows the next render to come.
                message_subject_field.value = "";
                //message_body_field.addClass("text-muted");
                //this.sendPostToServer(message_body, message_subject, reply_message_id, reply_idea_id, success_callback);

                var model = new Messages.Model({
                    subject: message_subject,
                    message: message_body,
                    reply_id: reply_message_id,
                    idea_id: reply_idea_id
                });

                model.save(null, {
                    success: function (model, resp) {
                        that.ui.messageBody.val('');
                        that.$('.topic-subject .formfield').val('');

                        btn.text(i18n.gettext('Message posted!'));
                        if (that.messageList) {
                            that.listenToOnce(that.messageList, "messageList:render_complete", function () {
                                if (_.isFunction(that.options.send_callback)) {
                                    that.options.send_callback();
                                }
                                // clear on success... so not lost in case of failure.
                                MessagesInProgress.clearMessage(that.msg_in_progress_ctx);
                                var el = that.$el.$('.messageSend-body');
                                if (el.length > 0)
                                    el[0].text = '';
                                el = that.$el.$('.messageSend-subject');
                                if (el.length > 0)
                                    el[0].text = '';

                                setTimeout(function () {
                                    //TODO:  This delay will no longer be necessary once backbone sync is done below in sendPostToServer
                                    //console.log("Calling showMessageById for "+data['@id']);
                                    Assembl.vent.trigger('messageList:showMessageById', data['@id']);

                                }, 1000);
                            });
                        }
                        setTimeout(function () {
                            btn.text(btn_original_text);
                            that.$('.messageSend-cancelbtn').trigger('click');
                        }, 5000);
                    },
                    error: function (model, resp) {
                        console.debug('error', model, resp)
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
                    var message_title = this.$('.messageSend-subject').val();
                    MessagesInProgress.saveMessage(this.msg_in_progress_ctx, message_body.val(), message_title);
                }
            },

            clearPartialMessage: function () {
                this.ui.messageBody.val('');
                MessagesInProgress.clearMessage(this.msg_in_progress_ctx);
            },

            onChangeBody: function () {
                var message_body = this.ui.messageBody.val();
                this.ui.messageBody.autosize();

                if (message_body && message_body.length > 0) {
                    this.ui.sendButton.removeClass("hidden");
                    this.ui.cancelButton.removeClass("hidden");
                }
                else {
                    this.ui.sendButton.addClass("hidden");
                    this.ui.cancelButton.addClass("hidden");
                }
            }

        });

        return messageSend;
    });
