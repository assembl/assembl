'use strict';

define(['backbone.marionette','backbone', 'underscore', 'ckeditor', 'app', 'common/context', 'utils/i18n', 'utils/permissions', 'views/messageSend', 'objects/messagesInProgress', 'models/agents', 'common/collectionManager', 'utils/panelSpecTypes', 'jquery', 'jquery.dotdotdot', 'bluebird',  'backbone.modal', 'backbone.marionette.modals'],
    function (Marionette, Backbone, _, ckeditor, Assembl, Ctx, i18n, Permissions, MessageSendView, MessagesInProgress, Agents, CollectionManager, PanelSpecTypes, $, dotdotdot, Promise, modal1, modal2) {

        var MIN_TEXT_TO_TOOLTIP = 5,
            TOOLTIP_TEXT_LENGTH = 10;
        /**
         * @class views.MessageView
         */
        var MessageView = Marionette.ItemView.extend({
            template: '#tmpl-loader',
            availableMessageViewStyles: Ctx.AVAILABLE_MESSAGE_VIEW_STYLES,
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
             * how many times the message has been re-rendered
             * @type {Number}
             */
            reRendered: 0,

            /**
             * @init
             * @param {MessageModel} obj the model
             */
            initialize: function (options) {
                var that = this;

                /*this.listenTo(this, "all", function(eventName) {
                 console.log("message event received: ", eventName);
                 });

                 this.listenTo(this.model, "all", function(eventName) {
                 console.log("message model event received: ", eventName);
                 });*/

                this.messageListView = options.messageListView;
                this.messageFamilyView = options.messageFamilyView;
                this.viewStyle = this.messageListView.getTargetMessageViewStyleFromMessageListConfig(this);

                this.listenTo(this.messageListView, 'annotator:destroy', this.onAnnotatorDestroy);
                this.listenTo(this.messageListView, 'annotator:initComplete', this.onAnnotatorInitComplete);
                this.listenTo(this.messageListView, 'annotator:success', this.render);
                /**
                 * The collection of annotations loaded in annotator for this message.
                 * They do not need to be re-loaded on render
                 * @type {Annotation}
                 */
                this.loadedAnnotations = {};

                this.level = this.currentLevel !== null ? this.currentLevel : 1;

                if (!_.isUndefined(this.level)) {
                    this.currentLevel = this.level;
                }

                this.creator = undefined;
                this.model.getCreatorPromise().then(function(creator){
                    that.creator = creator;
                    that.template = '#tmpl-message';
                    that.render();
                });
            },
            modelEvents: {
              'replacedBy':'onReplaced',
              'change':'render',
              'openWithFullBodyView': 'onOpenWithFullBodyView'
            },
            
            ui: {
              jumpToParentButton: ".js_message-jumptoparentbtn",
              jumpToMessageInThreadButton: ".js_message-jump-to-message-in-thread",
              jumpToMessageInReverseChronologicalButton: ".js_message-jump-to-message-in-reverse-chronological",
              showAllMessagesByThisAuthorButton: ".js_message-show-all-by-this-author",
              messageReplyBox: ".message-replybox"
            },
            

            /**
             * @event
             */
            events: {

                'click .js_messageHeader': 'onMessageTitleClick',
                'click .js_messageTitle': 'onMessageTitleClick',
                'click .js_readMore': 'onMessageTitleClick',
                'click .js_readLess': 'onMessageTitleClick',
                'click .message-hoistbtn': 'onMessageHoistClick',
                'click @ui.jumpToParentButton': 'onMessageJumpToParentClick',
                'click @ui.jumpToMessageInThreadButton': 'onMessageJumpToMessageInThreadClick',
                'click @ui.jumpToMessageInReverseChronologicalButton': 'onMessageJumpToMessageInReverseChronologicalClick',
                'click @ui.showAllMessagesByThisAuthorButton': 'onShowAllMessagesByThisAuthorClick',

                //
                'click .js_messageReplyBtn': 'onMessageReplyBtnClick',
                'click .messageSend-cancelbtn': 'onReplyBoxCancelBtnClick',
                //These two are from messageSend.js, do NOT use @ui
                'focus .js_messageSend-body': 'onReplyBoxFocus',
                'blur .js_messageSend-body': 'onReplyBoxBlur',
                //
                'mousedown .js_messageBodyAnnotatorSelectionAllowed': 'startAnnotatorTextSelection',
                'mousemove .js_messageBodyAnnotatorSelectionAllowed': 'updateAnnotatorTextSelection',
                'mouseleave .js_messageBodyAnnotatorSelectionAllowed': 'onMouseLeaveMessageBodyAnnotatorSelectionAllowed',
                'mouseenter .js_messageBodyAnnotatorSelectionAllowed': 'updateAnnotatorTextSelection',

                // menu
                'click .js_message-markasunread': 'markAsUnread',
                'click .js_message-markasread': 'markAsRead',

                'click .js_openTargetInPopOver': 'openTargetInPopOver'
            },

            /**
             * @param htmlOrText Any string, p and br tags are replaced with 
             * spaces, and all html is stripped
             * @return string
             */
            generateBodyPreview: function(htmlOrText){
              // The div is just there in case there actually isn't any html
              // in which case jquery would crash without it
              var bodyWithoutNewLine = $("<div>" + String(htmlOrText) + "</div>");
              bodyWithoutNewLine.find("p").after(" ");
              bodyWithoutNewLine.find("br").replaceWith(" ");
              return bodyWithoutNewLine.text().replace(/\s{2,}/g, ' ');
            },
            
            serializeData: function(){
                var bodyFormatClass,
                    body,
                    metadata_json = this.model.get('metadata_json'), // this property needs to exist to display the inspiration source of a message (creativity widget)
                    bodyFormat = this.model.get('bodyMimeType');

                if (this.viewStyle == this.availableMessageViewStyles.PREVIEW || this.viewStyle == this.availableMessageViewStyles.TITLE_ONLY) {
                    if (bodyFormat == "text/html") {
                        //Strip HTML from preview
                        bodyFormat = "text/plain";
                        body = this.generateBodyPreview(this.model.get('body'));
                    }
                }

                body = (body) ? body : this.model.get('body');

                if (bodyFormat !== null) {
                    bodyFormatClass = "body_format_" + this.model.get('bodyMimeType').replace("/", "_");
                }

                var direct_link_relative_url = Ctx.getRelativeURLFromDiscussionRelativeURL("posts/" + encodeURIComponent(this.model.get('@id'))),
                    //share_link_url = "/static/js/bower/expando/add/index.htm?u=" +
                    share_link_url = "/static/widget/share/index.html?u=" +
                    encodeURIComponent(Ctx.getAbsoluteURLFromRelativeURL(direct_link_relative_url)) + "&t=" +
                    encodeURIComponent(this.model.get('subject'));

                return {
                    message: this.model,
                    messageListView: this.messageListView,
                    viewStyle: this.viewStyle,
                    metadata_json: metadata_json,
                    creator: this.creator,
                    parentId: this.model.get('parentId'),
                    body: body,
                    bodyFormatClass: bodyFormatClass,
                    messageBodyId: Ctx.ANNOTATOR_MESSAGE_BODY_ID_PREFIX + this.model.get('@id'),
                    isHoisted: this.isHoisted,
                    ctx: Ctx,
                    i18n: i18n,
                    user_can_see_email: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION),
                    user_is_connected: !Ctx.getCurrentUser().isUnknownUser(),
                    read: this.model.get('read'),
                    nuggets: _.size(this.model.get('extracts')),
                    direct_link_relative_url: direct_link_relative_url,
                    share_link_url: share_link_url
                }
            },

            /**
             * The render
             * @return {MessageView}
             */
            onRender: function () {
                var that = this,
                    modelId = this.model.id,
                    partialMessage = MessagesInProgress.getMessage(modelId);
                if (Ctx.debugRender) {
                    console.log("message:render() is firing for message", this.model.id);
                }
                if (this.template == '#tmpl-message') {
                  if(partialMessage['body']) {
                    //Somebody started writing a message and didn't finish, make sure they see it.
                    //console.log("Opening in full view because of reply in progress: ", partialMessage['body'])
                    this.setViewStyle(this.availableMessageViewStyles.FULL_BODY);
                  }
                  else {
                    this.setViewStyle(this.viewStyle);
                  }
                  
                  this.clearAnnotationsToLoadCache();
                  Ctx.removeCurrentlyDisplayedTooltips(this.$el);
  
                  this.$el.attr("id", "message-" + this.model.get('@id'));
                  this.$el.addClass(this.model.get('@type'));

                    if(Ctx.getCurrentUser().isUnknownUser()){
                        this.$el.removeClass('unread').addClass('read');
                    }else {
                        if (this.model.get('read')) {
                            this.$el.removeClass('unread').addClass('read');
                        } else {
                            this.$el.removeClass('read').addClass('unread');
                        }
                    }
  
                  Ctx.initTooltips(this.$el);
                  if ( this.viewStyle == this.availableMessageViewStyles.FULL_BODY ){
                      Ctx.convertUrlsToLinks(this.$el.children('.message-body')); // we target only the body part of the message, not the title
                      Ctx.makeLinksShowOembedOnHover(this.$el.children('.message-body'));
                  }
  
                  that.replyView = new MessageSendView({
                      allow_setting_subject: false,
                      reply_message_id: modelId,
                      body_help_message: i18n.gettext('Type your response here...'),
                      cancel_button_label: null,
                      send_button_label: i18n.gettext('Send your reply'),
                      subject_label: null,
                      mandatory_body_missing_msg: i18n.gettext('You did not type a response yet...'),
                      messageList: that.messageListView,
                      msg_in_progress_body: partialMessage['body'],
                      msg_in_progress_ctx: modelId,
                      mandatory_subject_missing_msg: null
                  });
                  that.ui.messageReplyBox.append(this.replyView.render().el);
  
                  this.postRender();
  
                  if (this.replyBoxShown || partialMessage['body']) {
                    this.ui.messageReplyBox.removeClass('hidden');
                      if ( this.replyBoxHasFocus )
                          this.focusReplyBox();
                  }
                  else {
                    this.ui.messageReplyBox.addClass('hidden');
                  }
  
                  if (this.viewStyle == this.availableMessageViewStyles.FULL_BODY) {
                      //Only the full body view uses annotator
                      this.messageListView.requestAnnotatorRefresh();
                  }
  
                  if (this.viewStyle == that.availableMessageViewStyles.FULL_BODY && this.messageListView.defaultMessageStyle != this.availableMessageViewStyles.FULL_BODY) {
                      this.showReadLess();
                  }
  
  
                  if(this.messageListView.isViewStyleThreadedType()
                      && that.messageFamilyView.currentLevel !== 1) {
                      this.model.getParentPromise().then(function(parentMessageModel){
                          //console.log("comparing:", parentMessageModel.getSubjectNoRe(), that.model.getSubjectNoRe());
                          if(parentMessageModel.getSubjectNoRe() === that.model.getSubjectNoRe() ) {
                              //console.log("Hiding redundant title")
                              that.$(".message-subject").addClass('hidden');
                          }
                      });
                  }
  
  
                  if (this.viewStyle == this.availableMessageViewStyles.PREVIEW) {
  
                      var applyEllipsis = function(){
                          /* We use https://github.com/MilesOkeefe/jQuery.dotdotdot to show
                           * Read More links for message previews
                           */
                          that.$(".ellipsis").dotdotdot({
                              after: "a.readMore",
                              callback: function (isTruncated, orgContent) {
                                  //console.log("dotdotdot initialized on message", that.model.id);
                                  //console.log(isTruncated, orgContent);
                                  if (isTruncated)
                                  {
                                      that.$(".ellipsis > a.readMore, .ellipsis > p > a.readMore").removeClass('hidden');
                                  }
                                  else
                                  {
                                      that.$(".ellipsis > a.readMore, .ellipsis > p > a.readMore").addClass('hidden');
                                      if ( that.model.get('body') && that.model.get('body').length > 610 ) // approximate string length for text which uses 4 full lines
                                      {
                                          if (Ctx.debugRender) {
                                            console.log("there may be a problem with the dotdotdot of message ", that.model.id, "so we will maybe re-render it");
                                          }
                                          if ( ++that.reRendered < 5 ) // we use this to avoid infinite loop of render() calls
                                          {
                                              if (Ctx.debugRender) {
                                                console.log("yes, we will re-render => tries: ", that.reRendered);
                                              }
                                              setTimeout(function(){
                                                  that.render();
                                              }, 500);
                                          }
                                          else
                                          {
                                              if (Ctx.debugRender) {
                                                console.log("no, we won't re-render it because we already tried several times: ", that.reRendered);
                                              }
                                          }
                                      }
                                  }
                              },
                              watch: "window" //TODO:  We should trigger updates from the panel algorithm instead
                          });
                      };
  
                      that.messageListView.requestPostRenderSlowCallback(function () {
  
                          setTimeout(function(){
                              //console.log("Initializing ellipsis on message", that.model.id);
                              var current_navigation_state = that.messageListView.getContainingGroup().model.get('navigationState');
                              //console.log("current_navigation_state:", current_navigation_state);
                              if ( current_navigation_state == 'about' )
                              {
                                  that.listenToOnce(Assembl.vent, 'navigation:selected', applyEllipsis);
                                  return;
                              }
                              applyEllipsis();
                          }, 100);
  
  
                          /* We no longer need this, but probably now need to
                           * update when the panels change size with the
                           * new system benoitg-2014-09-18
                           *
                           * that.listenTo(that.messageListView, "messageList:render_complete", function () {
                           that.$(".ellipsis").trigger('update.dot');
                           });*/
                      });
  
                      var current_navigation_state = that.messageListView.getContainingGroup().model.get('navigationState');
                      //console.log("current_navigation_state:", current_navigation_state);
                      //Why do we need the following block?  benoitg-2015-03-03
                      //console.log('current_navigation_state is:', current_navigation_state);
                      if ( current_navigation_state !== undefined ){
                          //console.log('Setting listener on navigation:selected');
                          that.listenTo(Assembl.vent, 'navigation:selected', function(navSection) {
                              //console.log('New navigation has just been selected:', navSection);
                              if(navSection == 'debate') {
                                  //console.log('Updating dotdotdot because debate has just been selected');
                                  that.messageListView.requestPostRenderSlowCallback(function () {
                                      that.$(".ellipsis").trigger('update.dot');
                                  });
                              }
                          });
                      }
  
                  }
                }

            },

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
                    annotationsPromise = this.model.getAnnotationsPromise(), //TODO:  This is fairly CPU intensive, and may be worth caching.
                    annotationsToLoad = [],
                    filter;

                return annotationsPromise.then(function (annotations) {
                    if (that.annotationsToLoad === undefined) {
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
                        that.annotationsToLoad = annotationsToLoad;
                    }
                    return that.annotationsToLoad;
                });
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
                    currentIdea = this.messageListView.getContainingGroup().getCurrentIdea(),
                    collectionManager = new CollectionManager();
                if (annotation.idIdea == null || (
                    currentIdea != null && currentIdea.id == annotation.idIdea))
                  return;
                var Modal = Backbone.Modal.extend({
                    template: _.template($('#tmpl-showSegmentByAnnotation').html()),
                    className: 'group-modal popin-wrapper modal-showSegment',
                    cancelEl: '.js_close',
                    keyControl: false,
                    initialize: function () {
                       this.$('.bbm-modal').addClass('popin');
                    },
                    events: {
                      'click .js_redirectIdea':'redirectToIdea'
                    },
                    redirectToIdea: function(){
                        var self = this;

                        Promise.join(collectionManager.getAllExtractsCollectionPromise(),
                            collectionManager.getAllIdeasCollectionPromise(),
                            function (allExtractsCollection, allIdeasCollection) {

                                var segment = allExtractsCollection.getByAnnotation(annotation);
                                if (!segment) {
                                    console.error("message::showSegmentByAnnotation(): the extract doesn't exist");
                                    return;
                                }
                                if (segment.get('idIdea')) {
                                    if (that.messageListView.getContainingGroup().findViewByType(PanelSpecTypes.IDEA_PANEL)) {
                                        //FIXME:  Even this isn't proper behaviour.  Maybe we should just pop a panel systematically in this case.
                                        that.messageListView.getContainingGroup().setCurrentIdea(allIdeasCollection.get(annotation.idIdea), "from_annotation", true);
                                        Assembl.vent.trigger('DEPRECATEDideaPanel:showSegment', segment);
                                    }
                                    else {
                                        console.log("TODO:  NOT implemented yet.  Should pop panel in a lightbox.  See example at the end of Modal object in navigation.js ");
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

                                self.destroy();
                            });
                    }

                });

                var modal = new Modal();

                $('#slider').html(modal.render().el);

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

            onMessageReplyBtnClick: function (e) {
              e.preventDefault();
              //So it is saved if the view refreshes
              this.replyBoxHasFocus = true;
              if(!this.isMessageOpened()) {
                this.doOpenMessage();
              }
              else {
                this.focusReplyBox();
              }
            },
            
            /**
             *  Focus on the reply box, and open the message if closed
             **/
            focusReplyBox: function () {
              if(!this.isMessageOpened()) {
                console.error("Tried to focus on the reply box of a closed message, this should not happen!");
              }
              if(!this.replyBoxHasFocus) {
                console.error("Tried to focus on the reply box of a message that isn't supposed to have focus, this should not happen!");
              }
              var el = this.replyView.ui.messageBody;
              if ( el.length ){
                if(!el.is(':visible')) {
                  console.error("Element not yet visible...")
                }
                
                setTimeout(function () {
                  el.focus();
                }, 1);//This settimeout is necessary, at least for chrome, to focus properly
              }
              else if (this.ui.messageReplyBox.length){ 
                // if the .js_messageSend-body field is not present, this means the user is not logged in, so we scroll to the alert box
                //console.log("Scrooling to reply box instead");
                this.messageListView.scrollToElement(this.ui.messageReplyBox);
              }
              else {
                console.error("Tried to focus on the reply box of a message, but reply box isn't onscreen.  This should not happen!");
              }
            },

            onReplyBoxCancelBtnClick: function (e) {
              this.replyBoxShown = false;
              this.render();
            },

            onMessageHoistClick: function (ev) {
                // we will hoist the post, or un-hoist it if it is already hoisted
                this.isHoisted = this.messageListView.toggleFilterByPostId(this.model.getId());
                this.render(); // so that the isHoisted property will now be considered
            },
            
            onMessageJumpToParentClick: function (ev) {
              this.messageListView.showMessageById(this.model.get('parentId'));
            },

            onMessageJumpToMessageInThreadClick: function (ev) {
              this.messageListView.currentQuery.clearAllFilters();
              this.messageListView.setViewStyle(this.messageListView.ViewStyles.NEW_MESSAGES);
              this.messageListView.render();
              this.messageListView.showMessageById(this.model.id);
            },

            onMessageJumpToMessageInReverseChronologicalClick: function (ev) {
              this.messageListView.currentQuery.clearAllFilters();
              this.messageListView.setViewStyle(this.messageListView.ViewStyles.REVERSE_CHRONOLOGICAL);
              this.messageListView.render();
              this.messageListView.showMessageById(this.model.id);
            },
            
            
            onShowAllMessagesByThisAuthorClick: function (ev) {
              this.messageListView.currentQuery.clearAllFilters();
              this.messageListView.currentQuery.addFilter(this.messageListView.currentQuery.availableFilters.POST_IS_FROM, this.model.get('idCreator'));
              this.messageListView.render();
              this.messageListView.showMessageById(this.model.id);
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

            /**
             * Is the message currently in it's "opened" state?
             */
            isMessageOpened: function () {
              if(this.viewStyle === this.availableMessageViewStyles.FULL_BODY &&
                 this.replyBoxShown === true) {
                 return true;
              }
              else {
                return false;
              }
            },

            /**
             * move the message to it's "opened" state (FULL_BODY, reply box shown
             * etc.
             */
            doOpenMessage: function () {
              if(!this.isMessageOpened()) {
                this.setViewStyle(this.availableMessageViewStyles.FULL_BODY);
                this.replyBoxShown = true;
                this.render();
              }
              else {
                //Message is already in the right state
              }
              var read = this.model.get('read');
              if (read === false) {
                this.model.setRead(true);
              }
            },

            /**
             * move the message to it's "closed" state, which is dependent on the 
             * view
             */
            doCloseMessage: function () {
              if(this.isMessageOpened()) {
                this.setViewStyle(this.messageListView.getTargetMessageViewStyleFromMessageListConfig(this));
                this.replyBoxShown = false;
                this.render();
              }
              else {
                //Message is already in the right state
              }
            },

            /**
             * Change the message view Style and re-render.
             * In most cases will switch between FULL_BODY and another view
             */
            toggleViewStyle: function () {
              this.isMessageOpened()?this.doCloseMessage():this.doOpenMessage();
            },
            
            /**
             * @event
             */
            onMessageTitleClick: function (e) {
                if(e) {
                  var target = $(e.target);
                  if(target.is('a') && !(
                      target.hasClass('js_readMore') || target.hasClass('js_readLess')))
                    return;
                  e.stopPropagation();
                  e.preventDefault();
                }
                this.doProcessMessageTitleClick();
            },

            /**
             */
            doProcessMessageTitleClick: function () {
                this.toggleViewStyle();
            },
            
            /** 
             * This il only called by messageList::showMessageById
             */
            onOpenWithFullBodyView: function(e) {
              //console.log("onOpenWithFullBodyView()");
              if(!this.isMessageOpened()) {
                this.doOpenMessage();
              }
            },

            /**
             * @event
             * Starts annotator text selection process
             */
            startAnnotatorTextSelection: function () {
              if(Ctx.debugAnnotator) {
                console.log("startAnnotatorTextSelection called");
              }
              if(this.messageListView.isInPrintableView()) {
                return;
              }
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
              if(Ctx.debugAnnotator) {
                console.log("updateAnnotatorTextSelection called");
              }
              if(this.messageListView.isInPrintableView()) {
                return;
              }
                if (!this.isSelecting) {
                return;
              }

              if ($(ev.target).closest('.is-selecting').length === 0) {
                // If it isn't inside the one which started, don't show it
                return;
              }

              var selectedText = this.getSelectedText(), text = selectedText.focusNode ? selectedText
                  .getRangeAt(0).cloneContents()
                  : '';

              text = text.textContent || '';

              if (text.length > MIN_TEXT_TO_TOOLTIP) {
                this
                    .showAnnotatorSelectionTooltip(ev.clientX, ev.clientY, text);
              }
              else {
                this.hideAnnotatorSelectionTooltip();
              }
            },

            /**
             * @event
             */
            onMouseLeaveMessageBodyAnnotatorSelectionAllowed: function () {
              if(Ctx.debugAnnotator) {
                console.log("onMouseLeaveMessageBodyAnnotatorSelectionAllowed called");
              }
              if(this.messageListView.isInPrintableView()) {
                return;
              }
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
              if(Ctx.debugAnnotator) {
                console.log("getSelectedText called");
              }
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

              if(Ctx.debugAnnotator) {
                console.log("finishAnnotatorTextSelection called");
              }
              text = text.textContent || '';

              if (ev) {
                isInsideAMessage = $(ev.target).closest('.is-selecting').length > 0;
              }

              if (this.isSelecting && text.length > MIN_TEXT_TO_TOOLTIP && isInsideAMessage) {
                if(user.can(Permissions.ADD_EXTRACT)) {
                  this.showAnnotatorSelectionSaveOptions(ev.clientX - 50, ev.clientY);
                }
                else {
                  console.warn('finishAnnotatorTextSelection() called but current user does not have Permissions.ADD_EXTRACT');
                }
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

            onReplyBoxFocus: function(e){
              this.replyBoxHasFocus = true;
              if ( !this.model.get('read') ) {
                  this.model.setRead(true); // we do not call markAsRead on purpose
              }
              Assembl.vent.trigger('messageList:replyBoxFocus');
            },

            onReplyBoxBlur: function(e){
              this.replyBoxHasFocus = false;
              Assembl.vent.trigger('messageList:replyBoxBlur');
            },

            /**
             * Show the read less link
             * */
            showReadLess: function () {
                this.$('.readLess').removeClass('hidden');
            },

            openTargetInPopOver: function (evt) {
                console.log("message openTargetInPopOver(evt: ", evt);
                return Ctx.openTargetInPopOver(evt);
            }


        });


        return MessageView;

    });
