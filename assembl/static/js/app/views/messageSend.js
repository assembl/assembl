define(function (require) {
    'use strict';

    var Backbone = require('backbone'),
        Assembl = require('app'),
        _ = require('underscore'),
        $ = require('jquery'),
        Ctx = require('common/context'),
        Permissions = require('utils/permissions'),
        i18n = require('utils/i18n');

    var MessageSendView = Backbone.View.extend({
        /**
         * The tempate
         * @type {_.template}
         */
        template: Ctx.loadTemplate('messageSend'),
        className: 'messageSend',
        /**
         * @type {Base.Model}
         */
        model: null,

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
        initialize: function (options) {
            this.options = options;
            this.initialBody = (this.options.body_help_message !== undefined) ?
                this.options.body_help_message : i18n.gettext('Type your message here...');

            this.messageList = options.messageList;
        },

        /**
         * The render
         */
        render: function () {
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);
            var data = {
                body_help_message: this.initialBody,
                allow_setting_subject: this.options.allow_setting_subject || this.options.allow_setting_subject,
                cancel_button_label: this.options.cancel_button_label ? this.options.cancel_button_label : i18n.gettext('Cancel'),
                send_button_label: this.options.send_button_label ? this.options.send_button_label : i18n.gettext('Send'),
                subject_label: this.options.subject_label ? this.options.subject_label : i18n.gettext('Subject:'),
                canPost: Ctx.getCurrentUser().can(Permissions.ADD_POST)
            }

            this.$el.html(this.template(data));
            Ctx.initTooltips(this.$el);

            return this;
        },

        /**
         * @events
         */
        events: {
            'click .messageSend-sendbtn': 'onSendMessageButtonClick',
            'click .messageSend-cancelbtn': 'onCancelMessageButtonClick',
            'focus .messageSend-body': 'onFocusMessage',
            'blur .messageSend-body': 'onBlurMessage',
            'keyup .messageSend-body': 'onChangeBody'
        },

        /**
         * @event
         */
        onSendMessageButtonClick: function (ev) {
            var btn = $(ev.currentTarget),
            //url = app.getApiUrl('posts'),
                that = this,
                btn_original_text = btn.text(),
                message_body_field = this.$('.messageSend-body'),
                message_body = message_body_field.val(),
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
            if (!message_body || (message_body == this.initialBody)) {
                if (this.options.mandatory_body_missing_msg) {
                    alert(this.options.mandatory_body_missing_msg)
                } else {
                    alert(i18n.gettext('You need to type a message before you can send your message...'));
                }
                return;
            }
            btn.text(i18n.gettext('Sending...'));

            success_callback = function (data, textStatus, jqXHR) {
                btn.text(i18n.gettext('Message posted!'));
                if (that.messageList) {
                    that.listenToOnce(that.messageList, "messageList:render_complete", function () {
                        if (_.isFunction(that.options.send_callback)) {
                            that.options.send_callback();
                        }

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
            };
            this.sendPostToServer(message_body, message_subject, reply_message_id, reply_idea_id, success_callback);

        },

        /**
         * @event
         */
        onCancelMessageButtonClick: function () {
            this.$('.messageSend-body').val(this.initialBody);
            this.$('.messageSend-sendbtn').addClass("hidden");
            this.$('.messageSend-cancelbtn').addClass("hidden");
        },

        /**
         * @event
         */
        onFocusMessage: function () {
            if (this.$('.messageSend-body').val() == this.initialBody) {
                this.$('.messageSend-body').val('');
            }
        },

        /**
         * @event
         */
        onBlurMessage: function () {
            if (this.$('.messageSend-body').val() == '') {
                this.$('.messageSend-body').val(this.initialBody);
            }
        },

        /**
         * @event
         */
        onChangeBody: function () {
            var message_body = this.$('.messageSend-body').val();

            if (message_body && message_body != this.initialBody) {
                this.$('.messageSend-body').removeClass("text-muted");
                this.$('.messageSend-sendbtn').removeClass("hidden");
                this.$('.messageSend-cancelbtn').removeClass("hidden");
            }
            else {
                this.$('.messageSend-body').addClass("text-muted");
                this.$('.messageSend-sendbtn').addClass("hidden");
                this.$('.messageSend-cancelbtn').addClass("hidden");
            }
        },

        /**
         * Sends a post to the server
         * TODO: Must be converted to real backbone sync
         */
        sendPostToServer: function (message_body, message_subject, reply_message_id, reply_idea_id, success_callback) {

            var url = Ctx.getApiUrl('posts'),
                data = {};

            data.message = message_body;
            if (message_subject) {
                data.subject = message_subject;
            }
            if (reply_message_id) {
                data.reply_id = reply_message_id;
            }
            if (reply_idea_id) {
                data.idea_id = reply_idea_id;
            }

            this.$('.messageSend-body').val('');
            this.$('.topic-subject .formfield').val('');

            $.ajax({
                type: "post",
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: url,
                success: success_callback
            });

        }

    });

    return MessageSendView;
});
