'use strict';

define(['backbone', 'underscore', 'ckeditor', 'app', 'common/context', 'utils/i18n', 'utils/permissions', 'views/messageSend', 'objects/messagesInProgress', 'models/agents', 'common/collectionManager', 'utils/panelSpecTypes', 'jquery', 'jquery.dotdotdot'],
    function (Backbone, _, ckeditor, Assembl, Ctx, i18n, Permissions, MessageSendView, MessagesInProgress, Agents, CollectionManager, PanelSpecTypes, $) {

        var MIN_TEXT_TO_TOOLTIP = 5,
            TOOLTIP_TEXT_LENGTH = 10;

        /**
         * @class views.MessageView
         */
        var MessageView = Backbone.View.extend({
            availableMessageViewStyles: Ctx.AVAILABLE_MESSAGE_VIEW_STYLES,
            /**
             * @type {String}
             */
            tagName: 'div',

            /**
             * @type {String}
             */
            className: 'message',

            /**
             * Flags if it is selecting a text or not
             * @type {Boolean}
             */
            isSelecting: true,

            /**
             * Flags if the message is hoisted
             * @type {Boolean}
             */
            isHoisted: false,

            /**
             * Is the reply box currently visible
             * @type {Boolean}
             */
            replyBoxShown: false,

            /**
             * does the reply box currently have the focus
             * @type {Boolean}
             */
            replyBoxHasFocus: false,

            /**
             * @init
             * @param {MessageModel} obj the model
             */
            initialize: function (options) {
                /*this.listenTo(this, "all", function(eventName) {
                 console.log("message event received: ", eventName);
                 });
                 this.listenTo(this.model, "all", function(eventName) {
                 console.log("message model event received: ", eventName);
                 });*/
                this.listenTo(this.model, 'replacedBy', this.onReplaced);
                this.listenTo(this.model, 'showBody', this.onShowBody);
                this.listenTo(this.model, 'change', this.render);

                this.messageListView = options.messageListView;
                this.viewStyle = this.messageListView.getTargetMessageViewStyleFromMessageListConfig(this);
                this.messageListView.on('annotator:destroy', this.onAnnotatorDestroy, this);
                this.messageListView.on('annotator:initComplete', this.onAnnotatorInitComplete, this);

                /**
                 * The collection of annotations loaded in annotator for this message.
                 * They do not need to be re-loaded on render
                 * @type {Annotation}
                 */
                this.loadedAnnotations = {};
            },

            /**
             * @event
             */
            events: {

                'click .js_messageHeader': 'onMessageTitleClick',
                'click .js_readMore': 'onMessageTitleClick',
                'click .js_readLess': 'onMessageTitleClick',
                'click .message-hoistbtn': 'onMessageHoistClick',

                //
                'click .message-replybox-openbtn': 'focusReplyBox',
                'click .messageSend-cancelbtn': 'closeReplyBox',
                //
                'mousedown .js_messageBodyAnnotatorSelectionAllowed': 'startAnnotatorTextSelection',
                'mousemove .js_messageBodyAnnotatorSelectionAllowed': 'updateAnnotatorTextSelection',
                'mouseleave .js_messageBodyAnnotatorSelectionAllowed': 'onMouseLeaveMessageBodyAnnotatorSelectionAllowed',
                'mouseenter .js_messageBodyAnnotatorSelectionAllowed': 'updateAnnotatorTextSelection',

                // menu
                'click .js_message-markasunread': 'markAsUnread',
                'click .js_message-markasread': 'markAsRead'
            },

            /**
             * The thread message template
             * @type {_.template}
             */
            template: Ctx.loadTemplate('message'),

            /**
             * Meant for derived classes to override
             * @type {}
             */
            transformDataBeforeRender: function (data) {
                return data;
            },

            /**
             * Meant for derived classes to override
             * @type {}
             */
            postRender: function () {
                return;
            },

            /**
             * The render
             * @return {MessageView}
             */
            render: function () {
                var that = this,
                    modelId = this.model.id;
                if (Ctx.debugRender) {
                    console.log("message:render() is firing for message", this.model.id);
                }
                $.when(this.model.getCreatorPromise(),
                    this.model.getExtractsPromise()
                ).then(
                    function (creator, extracts) {
                        var data = that.model.toJSON(),
                            children,
                            bodyFormat = null,
                            bodyFormatClass = null,
                            level;
                        level = that.currentLevel !== null ? that.currentLevel : 1;
                        if (!_.isUndefined(level)) {
                            that.currentLevel = level;
                        }
                        Ctx.removeCurrentlyDisplayedTooltips(that.$el);
                        that.clearAnnotationsToLoadCache();
                        that.setViewStyle(that.viewStyle);

                        data['id'] = data['@id'];
                        data['date'] = data.date; //Ctx.formatDate(data.date);
                        data['creator'] = creator;

                        if (!("metadata_json" in data)) // this property needs to exist to display the inspiration source of a message (creativity widget)
                            data['metadata_json'] = null;

                        data['viewStyle'] = that.viewStyle;
                        bodyFormat = that.model.get('bodyMimeType');
                        if (that.viewStyle == that.availableMessageViewStyles.PREVIEW || that.viewStyle == that.availableMessageViewStyles.TITLE_ONLY) {
                            if (bodyFormat == "text/html") {
                                //Strip HTML from preview
                                bodyFormat = "text/plain";
                                // The div is just there in case there actually isn't any html
                                // in which case jquery would crash without it
                                data['body'] = $("<div>" + data['body'] + "</div>").text();
                            }
                        }
                        if (bodyFormat !== null) {
                            bodyFormatClass = "body_format_" + that.model.get('bodyMimeType').replace("/", "_");
                        }
                        data['bodyFormatClass'] = bodyFormatClass;

                        // Do NOT change this, it's the message id stored in the database
                        // by annotator when storing message annotations
                        // It has to contain ONLY raw content of the message provided by the
                        // database for annotator to parse it back properly
                        data['messageBodyId'] = Ctx.ANNOTATOR_MESSAGE_BODY_ID_PREFIX + data['@id'];
                        data['isHoisted'] = that.isHoisted;

                        data['ctx'] = Ctx;

                        that.$el.attr("id", "message-" + data['@id']);
                        data['read'] = that.model.get('read')
                        data['user_is_connected'] = !Ctx.getCurrentUser().isUnknownUser();
                        that.$el.addClass(data['@type']);
                        if (that.model.get('read') || !data['user_is_connected']) {
                            that.$el.addClass('read');
                            that.$el.removeClass('unread');
                        } else {
                            that.$el.addClass('unread');
                            that.$el.removeClass('read');
                        }

                        data['nuggets'] = _.size(data['extracts']);

                        data = that.transformDataBeforeRender(data);
                        that.$el.html(that.template(data));
                        Ctx.initTooltips(that.$el);
                        Ctx.initClipboard();
                        var partialMessage = MessagesInProgress.getMessage(modelId);

                        that.replyView = new MessageSendView({
                            'allow_setting_subject': false,
                            'reply_message_id': modelId,
                            'body_help_message': i18n.gettext('Type your response here...'),
                            'cancel_button_label': null,
                            'send_button_label': i18n.gettext('Send your reply'),
                            'subject_label': null,
                            'mandatory_body_missing_msg': i18n.gettext('You did not type a response yet...'),
                            'messageList': that.messageListView,
                            'msg_in_progress_body': partialMessage['body'],
                            'msg_in_progress_ctx': modelId,
                            'mandatory_subject_missing_msg': null
                        });
                        that.$('.message-replybox').append(that.replyView.render().el);

                        that.postRender();

                        if (that.replyBoxShown) {
                            that.openReplyBox();
                            if ( that.replyBoxHasFocus )
                                that.focusReplyBox();
                        }
                        else {
                            that.closeReplyBox();
                        }

                        if (that.viewStyle == that.availableMessageViewStyles.FULL_BODY) {
                            //Only the full body view uses annotator
                            that.messageListView.requestAnnotatorRefresh();
                        }

                        if (that.viewStyle == that.availableMessageViewStyles.FULL_BODY && that.messageListView.defaultMessageStyle != that.availableMessageViewStyles.FULL_BODY) {
                            that.showReadLess();
                        }
                        if (that.viewStyle == that.availableMessageViewStyles.PREVIEW) {
                            that.messageListView.requestPostRenderSlowCallback(function () {
                                /* We use https://github.com/MilesOkeefe/jQuery.dotdotdot to show
                                 * Read More links for message previews
                                 */
                                //console.log("Initializing dotdotdot on message", that.model.id);
                                that.$(".ellipsis").dotdotdot({
                                    after: "a.readMore",
                                    callback: function (isTruncated, orgContent) {
                                        //console.log(isTruncated, orgContent);
                                        if (isTruncated) {
                                            that.$(".ellipsis > a.readMore, .ellipsis > p > a.readMore").removeClass('hidden');
                                        }
                                        else {
                                            that.$(".ellipsis > a.readMore, .ellipsis > p > a.readMore").addClass('hidden');
                                        }
                                    },
                                    watch: "window" //TODO:  We should trigger updates from the panel algorithm instead
                                })

                                /* We no longer need this, but probably now need to
                                 * update when the panels change size with the
                                 * new system benoitg-2014-09-18
                                 *
                                 * that.listenTo(that.messageListView, "messageList:render_complete", function () {
                                 that.$(".ellipsis").trigger('update.dot');
                                 });*/
                            });

                        }
                    });
                return this;
            },

            /**
             * Should be called each render
             */
            clearAnnotationsToLoadCache: function () {
                this.annotationsToLoad = undefined;
            },

            /**
             * Get the list of annotations to render in the message body
             */
            getAnnotationsToLoadPromise: function () {
                var that = this,
                    deferred = $.Deferred(),
                    annotationsPromise = this.model.getAnnotationsPromise(), //TODO:  This is fairly CPU intensive, and may be worth caching.
                    annotationsToLoad = [],
                    filter;

                annotationsPromise.done(function (annotations) {
                    if (this.annotationsToLoad === undefined) {
                        // Is this the right permission to see the clipboard?
                        if (!Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
                            filter = function (extract) {
                                return extract.idIdea;
                            }
                        }
                        else {
                            filter = function () {
                                return true;
                            };
                        }

                        _.each(annotations, function (annotation) {
                            if (filter(annotation) && !(annotation['@id'] in that.loadedAnnotations)) {
                                annotationsToLoad.push(annotation);
                            }
                        });
                        this.annotationsToLoad = annotationsToLoad;
                    }
                    deferred.resolve(this.annotationsToLoad);
                });


                return deferred.promise();
            },

            /**
             * Render annotator's annotations in the message body
             * Safe to call multiple times, will not double load annotations.
             */
            loadAnnotations: function () {
                var that = this,
                    annotationsToLoad;
                if (this.annotator && (this.viewStyle == this.availableMessageViewStyles.FULL_BODY)) {
                    this.getAnnotationsToLoadPromise().done(function (annotationsToLoad) {
                        // Loading the annotations
                        if (annotationsToLoad.length) {
                            // This call is synchronous I believe - benoitg
                            that.annotator.loadAnnotations(_.clone(annotationsToLoad));
                            _.each(annotationsToLoad, function (annotation) {
                                that.loadedAnnotations[annotation['@id']] = annotation;
                            });

                            setTimeout(function () {
                                that.renderAnnotations(annotationsToLoad);
                            }, 1);
                        }
                    });

                }
            },


            /**
             * Shows the related extract from the given annotation
             * @param  {annotation} annotation
             */
            showSegmentByAnnotation: function (annotation) {
                var that = this,
                    currentIdea = Ctx.DEPRECATEDgetCurrentIdea(),
                    collectionManager = new CollectionManager(),
                    ok = true;

                if (currentIdea) {
                    if (currentIdea.id !== annotation.idIdea) {
                        ok = confirm(i18n.gettext('You will be redirected to another idea in connection with the nugget on which you clicked.'))
                    }
                    else {
                        //It's already the current idea, do nothing
                        ok = false;
                    }
                }

                if (ok) {
                    $.when(
                        collectionManager.getAllExtractsCollectionPromise(),
                        collectionManager.getAllIdeasCollectionPromise()
                    ).then(
                        function (allExtractsCollection, allIdeasCollection) {
                            var segment = allExtractsCollection.getByAnnotation(annotation);
                            if (!segment) {
                                console.error("message::showSegmentByAnnotation(): the extract doesn't exist")
                                return;
                            }
                            if (segment.get('idIdea')) {
                                if (that.messageListView.getContainingGroup().findViewByType(PanelSpecTypes.IDEA_PANEL)) {
                                    //FIXME:  We don't want to affect every panel, only the one in the current group
                                    Ctx.DEPRECATEDsetCurrentIdea(allIdeasCollection.get(annotation.idIdea));
                                    Assembl.vent.trigger('DEPRECATEDideaPanel:showSegment', segment);
                                }
                                else {
                                    console.log("TODO:  NOT implemented yet.  Should pop panel in a lightbox.  See example at the end of Modal object in navigation.js ")
                                }
                            } else {
                                if (that.messageListView.getContainingGroup().findViewByType(PanelSpecTypes.CLIPBOARD)) {
                                  //FIXME:  We don't want to affect every panel, only the one in the current group
                                  //FIXME:  Nothing listens to this anymore
                                  console.error("FIXME:  Nothing listens to DEPRECATEDsegmentList:showSegment anymore");
                                  Assembl.vent.trigger('DEPRECATEDsegmentList:showSegment', segment);
                                }
                                else {
                                    console.log("TODO:  NOT implemented yet.  Should pop panel in a lightbox.  See example at the end of Modal object in navigation.js ")
                                }
                            }
                        }
                    );
                }
            },

            /**
             * Render annotator's annotations in the message body
             */
            renderAnnotations: function (annotations) {
                var that = this;
                _.each(annotations, function (annotation) {
                    var highlights = annotation.highlights,
                        func = that.showSegmentByAnnotation.bind(that, annotation);

                    _.each(highlights, function (highlight) {
                        highlight.setAttribute('data-annotation-id', annotation['@id']);
                        $(highlight).on('click', func);
                    });
                });

            },

            /**
             * @event
             * param Annotator object
             */
            onAnnotatorInitComplete: function (annotator) {
                this.annotator = annotator;

                //Normally render has been called by this point, no need for a full render
                this.loadAnnotations();
            },

            /**
             * @event
             */
            onAnnotatorDestroy: function (annotator) {
                this.annotator = null;

                // Resets loaded annotations to initial
                this.loadedAnnotations = {};
            },

            /**
             * Hide the annotator selection tooltip displayed during the selection,
             * before it completes
             */
            hideAnnotatorSelectionTooltip: function () {
                Ctx.annotatorSelectionTooltip.hide();
            },

            /**
             * Show/update the annotator selection tooltip displayed during the selection,
             * before it completes.
             * @param  {number} x
             * @param  {number} y
             * @param  {string} text
             */
            showAnnotatorSelectionTooltip: function (x, y, text) {
                var marginLeft = Ctx.annotatorSelectionTooltip.width() / -2,
                    segment = text;

                text = text.substr(0, TOOLTIP_TEXT_LENGTH) + '...' + text.substr(-TOOLTIP_TEXT_LENGTH);

                Ctx.annotatorSelectionTooltip
                    .show()
                    .attr('data-segment', segment)
                    .text(text)
                    .css({ top: y, left: x, 'margin-left': marginLeft });
            },

            /**
             * Shows the save options to the selected text once the selection is complete
             * @param  {Number} x
             * @param  {Number} y
             */
            showAnnotatorSelectionSaveOptions: function (x, y) {
                this.hideAnnotatorSelectionTooltip();

                var annotator = this.$el.closest('.messageList-list').data('annotator');

                /*
                 Hack: Here we remove the input of the annotator editor, so then the onAdderClick
                 call will try to give focus to a field which does not exist.
                 So it will not force the browser to scroll the message list up to the top,
                 which is where the editor is initially placed (it is then moved to the cursor
                 position).
                 */
                annotator.editor.element.find(":input:first").remove();

                annotator.onAdderClick.call(annotator);

                //The annotatorEditor is the actual currently active annotatorEditor
                //from the annotator object stored in the DOM of the messagelist.
                //object from annotator
                if (this.messageListView.annotatorEditor) {
                    this.messageListView.annotatorEditor.element.css({
                        'top': y + "px",
                        'left': x + "px"
                    });
                }

            },

            /**
             *  Focus on the reply box, and open it if closed
             **/
            focusReplyBox: function () {
                var that = this;
                var onReplyBoxBlur = function(){
                    that.replyBoxHasFocus = false;
                };
                var waitAndFocus = function(){
                    // we can't execute this immediately because the opening of the message triggers a setRead(true) which triggers a redraw which looses the focus
                    window.setTimeout(function () {
                        var el = that.$('.messageSend-body');
                        if ( el.length )
                        {
                            el.focus();
                            that.replyBoxHasFocus = true;
                            el.on("blur", onReplyBoxBlur);
                        }
                        else { // if the .messageSend-body field is not present, this means the user is not logged in, so we scroll to the alert box
                            that.messageListView.scrollToElement(that.$(".message-replybox"));
                        }
                    }, 100);
                };
                
                if (this.viewStyle.id === 'viewStylePreview') {
                    this.onMessageTitleClick();
                    waitAndFocus();
                    return;
                }

                this.openReplyBox();
                waitAndFocus();
            },

            /**
             *  Opens the reply box the reply button
             */
            openReplyBox: function () {
                this.$('.message-replybox').show();
                this.$('.message-replybox').removeClass('hidden');
                this.replyBoxShown = true;
            },

            /**
             *  Closes the reply box
             */
            closeReplyBox: function () {
                this.$('.message-replybox').hide();
                this.replyBoxShown = false;
            },

            onMessageHoistClick: function (ev) {
                // we will hoist the post, or un-hoist it if it is already hoisted
                this.isHoisted = this.messageListView.toggleFilterByPostId(this.model.getId());
                this.render(); // so that the isHoisted property will now be considered
            },

            /**
             * @event
             */
            onShowBody: function () {
                var read = this.model.get('read');

                if (read === false) {
                    this.model.setRead(true);
                }
                this.setViewStyle(this.availableMessageViewStyles.FULL_BODY);
                this.render();
            },

            /**
             * You need to re-render after this
             */
            setViewStyle: function (style) {
                if (style == this.availableMessageViewStyles.TITLE_ONLY) {
                    this.$el.removeClass(this.availableMessageViewStyles.FULL_BODY.id);
                    this.$el.removeClass(this.availableMessageViewStyles.PREVIEW.id);
                    this.$el.addClass(this.availableMessageViewStyles.TITLE_ONLY.id);
                    this.viewStyle = style;
                }
                else if (style == this.availableMessageViewStyles.FULL_BODY) {
                    this.$el.removeClass(this.availableMessageViewStyles.TITLE_ONLY.id);
                    this.$el.removeClass(this.availableMessageViewStyles.PREVIEW.id);
                    this.$el.addClass(this.availableMessageViewStyles.FULL_BODY.id);
                    this.viewStyle = style;
                    this.replyBoxShown = true;

                }
                else if (style == this.availableMessageViewStyles.PREVIEW) {
                    this.$el.removeClass(this.availableMessageViewStyles.TITLE_ONLY.id);
                    this.$el.removeClass(this.availableMessageViewStyles.FULL_BODY.id);
                    this.$el.addClass(this.availableMessageViewStyles.PREVIEW.id);
                    this.viewStyle = style;
                }
                else {
                    console.log("unsupported view style :" + style);
                }
            },

            toggleViewStyle: function () {
                var previousViewStyle = this.viewStyle;
                if (this.viewStyle == this.availableMessageViewStyles.FULL_BODY) {
                    this.setViewStyle(this.messageListView.getTargetMessageViewStyleFromMessageListConfig(this));
                }
                else {
                    var read = this.model.get('read');
                    if (read === false) {
                        this.model.setRead(true);
                    }
                    this.setViewStyle(this.availableMessageViewStyles.FULL_BODY);
                }
                if (previousViewStyle !== this.viewStyle) {
                    this.render();
                }
            },
            /**
             * @event
             */
            onMessageTitleClick: function (ev) {
                this.toggleViewStyle();
                if (this.viewStyle == this.availableMessageViewStyles.FULL_BODY) {
                    this.openReplyBox();
                }
            },

            /**
             * @event
             * Starts annotator text selection process
             */
            startAnnotatorTextSelection: function () {
                this.hideAnnotatorSelectionTooltip();
                this.isSelecting = true;
                this.$el.addClass('is-selecting');

                var that = this;

                $(document).one('mouseup', function (ev) {
                    that.finishAnnotatorTextSelection(ev);
                });
            },

            /**
             * @event
             * Does the selection
             */
            updateAnnotatorTextSelection: function (ev) {
                if (!this.isSelecting) {
                    return;
                }

                if ($(ev.target).closest('.is-selecting').length === 0) {
                    // If it isn't inside the one which started, don't show it
                    return;
                }

                var selectedText = this.getSelectedText(),
                    text = selectedText.focusNode ? selectedText.getRangeAt(0).cloneContents() : '';

                text = text.textContent || '';

                if (text.length > MIN_TEXT_TO_TOOLTIP) {
                    this.showAnnotatorSelectionTooltip(ev.clientX, ev.clientY, text);
                } else {
                    this.hideAnnotatorSelectionTooltip();
                }
            },

            /**
             * @event
             */
            onMouseLeaveMessageBodyAnnotatorSelectionAllowed: function () {
                if (this.isSelecting) {
                    this.hideAnnotatorSelectionTooltip();
                    this.isSelecting = false;
                    this.$el.removeClass('is-selecting');
                    (function deselect() {
                        var selection = ('getSelection' in window)
                            ? window.getSelection()
                            : ('selection' in document)
                            ? document.selection
                            : null;
                        if ('removeAllRanges' in selection) selection.removeAllRanges();
                        else if ('empty' in selection) selection.empty();
                    })();
                }

            },

            /**
             * Return the selected text on the document (DOM Selection, nothing
             * annotator specific)
             * @return {Selection}
             */
            getSelectedText: function () {
                if (document.getSelection) {
                    return document.getSelection();
                } else if (window.getSelection) {
                    return window.getSelection();
                } else {
                    var selection = document.selection && document.selection.createRange();
                    return selection.text ? selection.text : false;
                }
            },

            /**
             * Finish processing the annotator text selection
             * @event
             */
            finishAnnotatorTextSelection: function (ev) {
                var isInsideAMessage = false,
                    selectedText = this.getSelectedText(),
                    user = Ctx.getCurrentUser(),
                    text = selectedText.focusNode ? selectedText.getRangeAt(0).cloneContents() : '';

                text = text.textContent || '';

                if (ev) {
                    isInsideAMessage = $(ev.target).closest('.is-selecting').length > 0;
                }

                if (user.can(Permissions.ADD_EXTRACT) && this.isSelecting && text.length > MIN_TEXT_TO_TOOLTIP && isInsideAMessage) {
                    this.showAnnotatorSelectionSaveOptions(ev.clientX - 50, ev.clientY);
                } else if (!user.can(Permissions.ADD_EXTRACT)) {
                    console.warn('finishAnnotatorTextSelection() called but current user does not have Permissions.ADD_EXTRACT');
                }

                this.isSelecting = false;
                this.$el.removeClass('is-selecting');
            },

            /**
             * @event
             */
            onReplaced: function (newObject) {
                this.setElement(newObject);
                // TODO André: also look at this one, please!
                // It will not be triggered for a while, though.
                this.render();
            },

            /**
             * Mark the current message as unread
             */
            markAsUnread: function (ev) {
                ev.stopPropagation();
                Ctx.removeCurrentlyDisplayedTooltips(this.$el);
                this.model.setRead(false);
            },

            /**
             * Mark the current message as read
             */
            markAsRead: function (ev) {
                ev.stopPropagation();
                Ctx.removeCurrentlyDisplayedTooltips(this.$el);
                this.model.setRead(true);
            },

            /**
             * Show the read less link
             * */
            showReadLess: function () {
                this.$('.readLess').removeClass('hidden');
            }


        });


        return MessageView;

    });
