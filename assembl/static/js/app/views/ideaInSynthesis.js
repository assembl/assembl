'use strict';

define(['backbone', 'underscore', 'app', 'common/context', 'utils/i18n', 'utils/permissions', 'views/ckeditorField', 'views/messageSend', 'objects/messagesInProgress', 'common/collectionManager', 'bluebird'],
    function (Backbone, _, Assembl, Ctx, i18n, Permissions, CKEditorField, MessageSendView, MessagesInProgress, CollectionManager, Promise) {

        var IdeaInSynthesisView = Backbone.View.extend({
            /**
             * Tag name
             * @type {String}
             */
            tagName: 'div',

            /**
             * The template
             * @type {[type]}
             */
            template: Ctx.loadTemplate('ideaInSynthesis'),

            synthesis: null,

            /**
             * @init
             */
            initialize: function (options) {
                this.listenTo(this.model, 'change:shortTitle change:longTitle change:segments', this.render);
                this.synthesis = options.synthesis || null;
                this.messageListView = options.messageListView;
                this.editing = false;
            },

            /**
             * The render
             * @param renderParams {}
             * @return {IdeaInSynthesisView}
             */
            render: function () {
                var that = this,
                    data = this.model.toJSON(),
                    authors = [],
                    collectionManager = new CollectionManager();

                Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
                    collectionManager.getAllUsersCollectionPromise(),
                    this.model.getExtractsPromise(),
                    function (allMessageStructureCollection, allUsersCollection, ideaExtracts) {
                        that.$el.addClass('synthesis-idea');
                        that.$el.attr('id', 'synthesis-idea-' + that.model.id);
                        Ctx.removeCurrentlyDisplayedTooltips(that.$el);
                        ideaExtracts.forEach(function (segment) {
                            var post = allMessageStructureCollection.get(segment.get('idPost'));
                            if (post) {
                                var creator = allUsersCollection.get(post.get('idCreator'));
                                if (creator) {
                                    authors.push(creator);
                                }
                            }
                        });

                        data.id = that.model.getId();
                        data.editing = that.editing;
                        data.longTitle = that.model.getLongTitleDisplayText();
                        data.authors = _.uniq(authors);
                        data.subject = data.longTitle;
                        data.synthesis_is_published = that.synthesis.get("published_in_post") != null;

                        that.$el.html(that.template(data));
                        Ctx.initTooltips(that.$el);
                        if (that.editing && data.synthesis_is_published === false) {
                            that.renderCKEditor();
                        }
                        that.renderReplyView();
                    });
                return this;
            },

            /**
             * renders the ckEditor if there is one editable field
             */
            renderCKEditor: function () {
                var that = this,
                    area = this.$('.synthesis-expression-editor');

                this.ckeditor = new CKEditorField({
                    'model': this.model,
                    'modelProp': 'longTitle',
                    'placeholder': this.model.getLongTitleDisplayText(),
                    'showPlaceholderOnEditIfEmpty': true
                });

                this.ckeditor.on('save cancel', function () {
                    that.editing = false;
                    that.render();
                });


                this.ckeditor.renderTo(area);
                this.ckeditor.changeToEditMode();
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

                this.replyView = new MessageSendView({
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
                    'messageList': this.messageListView,
                    'enable_button': false
                });
                this.$('.synthesisIdea-replybox').append(this.replyView.render().el);
            },

            /**
             * The events
             * @type {Object}
             */
            events: {
                'click .synthesis-expression': 'onEditableAreaClick',
                'click .synthesisIdea-replybox-openbtn': 'focusReplyBox',
                'click .messageSend-cancelbtn': 'closeReplyBox',
                'blur .synthesis-expression-editor': 'closeEditableAreaClick'
            },

            /**
             *  Focus on the reply box, and open it if closed
             **/
            focusReplyBox: function () {
                this.openReplyBox();

                var that = this;
                window.setTimeout(function () {
                    that.$('.messageSend-body').focus();
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
            onEditableAreaClick: function (ev) {
                if (Ctx.getCurrentUser().can(Permissions.EDIT_IDEA)) {
                    this.editing = true;
                    this.render();
                }
            },

            closeEditableAreaClick: function(){
                if (Ctx.getCurrentUser().can(Permissions.EDIT_IDEA)) {
                    this.editing = false;
                    this.render();
                }
            }
        });

        return IdeaInSynthesisView;
    });
