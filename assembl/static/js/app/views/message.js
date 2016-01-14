'use strict';

var Marionette = require('../shims/marionette.js'),
    Raven = require('raven-js'),
    Backbone = require('../shims/backbone.js'),
    _ = require('../shims/underscore.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    MessageSendView = require('./messageSend.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    CollectionManager = require('../common/collectionManager.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    $ = require('../shims/jquery.js'),
    Promise = require('bluebird'),
    messageExport = require('./messageExportModal.js'),
    AgentViews = require('./agent.js'),
    Types = require('../utils/types.js'),
    AttachmentViews = require('./attachments.js'),
    MessageModerationOptionsView = require('./messageModerationOptions.js'),
    MessageTranslationView = require('./messageTranslation.js'),
    Analytics = require('../internal_modules/analytics/dispatcher.js');

var MIN_TEXT_TO_TOOLTIP = 5,
    TOOLTIP_TEXT_LENGTH = 10;
/**
 * @class views.MessageView
 */
var MessageView = Marionette.LayoutView.extend({
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

  moderationTemplate: Ctx.loadTemplate('moderatedBody'),

  /**
   * Show annotations (extracts and gems) in the message
   * @type {Boolean}
   */
  showAnnotations: null,

  /**
   * The Marionette view for moderation
   * @type {Marionette view}
   */
  messageModerationOptionsView: null,

  /**
   * State maintained for the translation view
   * @type {Object}
   */
  messageTranslationState: null,

  /**
   * @init
   * @param {MessageModel} obj the model
   */
  initialize: function(options) {
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
    this.showAnnotations = Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT); // TODO: this could be set from a user account preference, or from a toggle in the Messages panel

    if(!this.isViewDestroyed()) {
      //Yes, it IS possible the view is already destroyed in initialize, so we check
      this.listenTo(this.messageListView, 'annotator:destroy', this.onAnnotatorDestroy);
      this.listenTo(this.messageListView, 'annotator:initComplete', this.onAnnotatorInitComplete);
      this.listenTo(this.messageListView, 'annotator:success', this.render);
    }
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
    this.model.getCreatorPromise().then(function(creator) {
      if(!that.isViewDestroyed()) {
        that.creator = creator;
        that.template = '#tmpl-message';
        that.render();
      }
    });
    this.model.collection.collectionManager.getUserLanguagePreferencesPromise().then(function(ulp) {
        that.translationData = ulp.getTranslationData();
    });
  },
  modelEvents: {
      'replacedBy':'onReplaced',
      'change:like_count':'renderLikeCount',
      'change':'render',
      'openWithFullBodyView': 'onOpenWithFullBodyView'
    },
  instrumentedRender: function(){
    console.log("MessageView modelEvents change fired from", this.model);
    this.render();
  },
    
  ui: {
      jumpToParentButton: ".js_message-jumptoparentbtn",
      jumpToMessageInThreadButton: ".js_message-jump-to-message-in-thread",
      jumpToMessageInReverseChronologicalButton: ".js_message-jump-to-message-in-reverse-chronological",
      showAllMessagesByThisAuthorButton: ".js_message-show-all-by-this-author",
      toggleExtracts: ".js_message-toggle-extracts",
      moderationOptionsButton: ".js_message-moderation-options",
      messageReplyBox: ".js_messageReplyBoxRegion",
      likeLink: ".js_likeButton",
      shareLink: ".js_shareButton",
      likeCounter: ".js_likeCount",
      avatar: ".js_avatarContainer",
      name: ".js_nameContainer",
      translation: ".js_regionMessageTranslation",
      attachments: ".js_regionMessageAttachments",
      moderationOptions: ".js_regionMessageModerationOptions"
    },

    regions: {
      avatar: "@ui.avatar",
      name: "@ui.name",
      translationRegion: "@ui.translation",
      attachmentsRegion: "@ui.attachments",
      moderationOptionsRegion: "@ui.moderationOptions",
      messageReplyBoxRegion: "@ui.messageReplyBox"
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
    'click @ui.likeLink': 'onClickLike',
    'click @ui.shareLink': 'onClickShare',
    'click @ui.jumpToParentButton': 'onMessageJumpToParentClick',
    'click @ui.jumpToMessageInThreadButton': 'onMessageJumpToMessageInThreadClick',
    'click @ui.jumpToMessageInReverseChronologicalButton': 'onMessageJumpToMessageInReverseChronologicalClick',
    'click @ui.showAllMessagesByThisAuthorButton': 'onShowAllMessagesByThisAuthorClick',
    'click .js_showModeratedMessage': 'onShowModeratedMessageClick',
    'click @ui.toggleExtracts' : 'onToggleExtractsClick',
    'click @ui.moderationOptionsButton' : 'onModerationOptionsClick',

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

    'click .js_message-export-facebook': 'exportToFacebook',

    'click .js_openTargetInPopOver': 'openTargetInPopOver'
  },

  /**
   * @param htmlOrText Any string, p and br tags are replaced with
   * spaces, and all html is stripped
   * @return string
   */
  generateBodyPreview: function(htmlOrText) {
      // The div is just there in case there actually isn't any html
      // in which case jquery would crash without it
      var bodyWithoutNewLine = $("<div>" + String(htmlOrText) + "</div>");
      bodyWithoutNewLine.find("p").after(" ");
      bodyWithoutNewLine.find("br").replaceWith(" ");
      return bodyWithoutNewLine.text().replace(/\s{2,}/g, ' ');
    },

  /**
   * @return string
   */
  generateSafeBody: function() {
    var body;

    if(this.model.get('bodyMimeType') === "text/html") {
      //We assume that that HTML has been sanitized by the backend.
      body = this.model.get('body');
    }
    else {
      //Get rid of all tags, to avoid any layout problem
      body = this.model.get('body').applyFunction(Ctx.stripHtml);
    }
    return body;
  },

  serializeData: function() {
    var bodyFormatClass,
        that = this,
        body,
        metadata_json = this.model.get('metadata_json'), // this property needs to exist to display the inspiration source of a message (creativity widget)
        bodyFormat = this.model.get('bodyMimeType');

    if (this.viewStyle === this.availableMessageViewStyles.PREVIEW || this.viewStyle === this.availableMessageViewStyles.TITLE_ONLY) {
      if (bodyFormat === "text/html") {
        //Strip HTML from preview
        bodyFormat = "text/plain";
        body = this.model.get('body').applyFunction(this.generateBodyPreview);
      }
    }

    body = (body) ? body : this.generateSafeBody();

    if (this.model.get("publication_state") != "PUBLISHED") {
    //if (this.model.get("moderation_text")) {
      bodyFormat = "text/html";
      body = this.moderationTemplate({
        ctx: Ctx,
        viewStyle: this.viewStyle,
        subject: this.model.get("subject").best(that.translationData),
        body: body.best(that.translationData),
        publication_state: this.model.get("publication_state"),
        moderation_text: this.model.get("moderation_text"),
        moderator: this.model.get("moderator"),
        message_id: this.model.id.split('/')[1]
      });
    }

    if (bodyFormat !== null) {
      bodyFormatClass = "body_format_" + bodyFormat.replace("/", "_");
    }

    var direct_link_relative_url = this.model.getRouterUrl({
      parameters: {
        'source': 'share'
      },
      relative: true
    }),
        share_link_url = Ctx.appendExtraURLParams("/static/widget/share/index.html",
          [
            {'u': Ctx.getAbsoluteURLFromRelativeURL(direct_link_relative_url)},
            {'t': this.model.get('subject').bestValue(that.translationData)},
            {'s': Ctx.getPreferences().social_sharing }
          ]
        );

    var html_export_url = null;
    if (this.model.getBEType() == Types.SYNTHESIS_POST) {
      html_export_url = Ctx.getApiV2DiscussionUrl("posts/" + this.model.getNumericId() + "/html_export");
    }

    return {
      message: this.model,
      messageListView: this.messageListView,
      viewStyle: this.viewStyle,
      metadata_json: metadata_json,
      creator: this.creator,
      parentId: this.model.get('parentId'),
      subject: this.model.get("subject").best(that.translationData),
      body: body.best(that.translationData),
      bodyFormatClass: bodyFormatClass,
      messageBodyId: Ctx.ANNOTATOR_MESSAGE_BODY_ID_PREFIX + this.model.get('@id'),
      isHoisted: this.isHoisted,
      ctx: Ctx,
      i18n: i18n,
      user_can_see_email: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION),
      user_can_export_post: Ctx.getCurrentUser().can(Permissions.EXPORT_EXTERNAL_SOURCE),
      user_is_connected: !Ctx.getCurrentUser().isUnknownUser(),
      read: this.model.get('read'),
      nuggets: _.size(this.model.get('extracts')),
      direct_link_relative_url: direct_link_relative_url,
      share_link_url: share_link_url,
      html_export_url: html_export_url,
      user_can_moderate: Ctx.getCurrentUser().can(Permissions.MODERATE_POST)
    };
  },

  renderLikeCount: function() {
      // specialized render because we do not want a full render.
      // it may kill a message being written.
      if (Ctx.debugRender) {
        console.log("message:renderLikeCount() is firing for message", this.model.id);
      }

      var count = this.model.get('like_count');
      if (count > 0) {
        this.ui.likeCounter.children(".js_likeCountI").text(String(count));
        this.ui.likeCounter.show();
      } else {
        this.ui.likeCounter.hide();
      }
    },

  changeIsPartialRender: function() {
      var changedAttributes = this.model.changedAttributes();
      for (var propName in changedAttributes) {
        if (propName === "like_count") {
          continue;
        }

        if (!changedAttributes.hasOwnProperty(propName)) {
          continue;
        }

        // is __prototype__ in there? Not on chrome.
        if (Ctx.debugRender) {
          console.log("changeIsPartialRender found change in", propName);
        }

        return false;
      }

      return true;
    },

  render: function() {
    if (this.changeIsPartialRender()) {
      return;
    }

    var base_object = Object.getPrototypeOf(this),
        base_render = base_object.render;
    while (Object.getPrototypeOf(base_object).render === base_render) {
      base_object = Object.getPrototypeOf(base_object);
    }

    Object.getPrototypeOf(base_object).render.apply(this, arguments);
  },

  /**
   * The render
   * @return {MessageView}
   */
  onRender: function() {
    var that = this,
        modelId = this.model.id,
        partialMessage = MessagesInProgress.getMessage(modelId);

    // do not render the whole thing if only the like_count changed.
    // it may kill the message being edited.
    if (this.changeIsPartialRender()) {
      return;
    }

    if (Ctx.debugRender) {
      console.log("message:render() is firing for message", this.model.id);
    }

    if (this.template === '#tmpl-message') {
      if (partialMessage.body) {
        //Somebody started writing a message and didn't finish, make sure they see it.
        //console.log("Opening in full view because of reply in progress: ", partialMessage['body'])
        this.setViewStyle(this.availableMessageViewStyles.FULL_BODY);
      }
      else {
        this.setViewStyle(this.viewStyle);
      }

      this.clearAnnotationsToLoadCache();
      Ctx.removeCurrentlyDisplayedTooltips(this.$el);

      this.renderAuthor();

      this.$el.attr("id", "message-" + this.model.get('@id'));
      this.$el.addClass(this.model.get('@type'));

      if (Ctx.getCurrentUser().isUnknownUser()) {
        this.$el.removeClass('unread').addClass('read');
      }else {
        if (this.model.get('read')) {
          this.$el.removeClass('unread').addClass('read');
        } else {
          this.$el.removeClass('read').addClass('unread');
        }
      }

      Ctx.initTooltips(this.$el);
      if (this.viewStyle === this.availableMessageViewStyles.FULL_BODY) {
        Ctx.convertUrlsToLinks(this.$el.children('.message-body')); // we target only the body part of the message, not the title
        Ctx.makeLinksShowOembedOnHover(this.$el.children('.message-body'));
      }
      if (this.model.get('metadata_json')) {
        Ctx.makeLinksShowOembedOnHover(this.$el.find(".inspirationSource"));
      }

      this.replyView = new MessageSendView({
        allow_setting_subject: false,
        reply_message_id: modelId,
        reply_message_model: this.model,
        body_help_message: i18n.gettext('Type your response here...'),
        cancel_button_label: null,
        send_button_label: i18n.gettext('Send your reply'),
        subject_label: null,
        mandatory_body_missing_msg: i18n.gettext('You did not type a response yet...'),
        messageList: that.messageListView,
        msg_in_progress_body: partialMessage.body,
        msg_in_progress_ctx: modelId,
        mandatory_subject_missing_msg: null
      });

      this.postRender();

      if (this.viewStyle === that.availableMessageViewStyles.FULL_BODY && (this.replyBoxShown || partialMessage.body)) {
        this.ui.messageReplyBox.removeClass('hidden');
        this.messageReplyBoxRegion.show(this.replyView);
        if (this.replyBoxHasFocus) {
          //console.log("Focusing reply box, message had this.replyBoxHasFocus == true");
          this.focusReplyBox();
        }
      }
      else {
        this.ui.messageReplyBox.addClass('hidden');
      }

      if (this.model.get('like_count') > 0) {
        this.ui.likeCounter.show();
      } else {
        this.ui.likeCounter.hide();
      }

      if (this.viewStyle == this.availableMessageViewStyles.FULL_BODY ||
          this.viewStyle == this.availableMessageViewStyles.PREVIEW) {
        //if (this.model.isMachineTranslated()){
        //   var translationView = new translationView({messageModel: this.model});
        //   this.regions.translationRegion.show(translationView);
        // }
        var translationView = new MessageTranslationView({messageModel: this.model});
        this.getRegion("translationRegion").show(translationView);
      }
      

      if (this.viewStyle === this.availableMessageViewStyles.FULL_BODY) {
        //Only the full body view uses annotator
        this.messageListView.requestAnnotatorRefresh();

        var AttachmentEditableCollectionView = Marionette.CollectionView.extend({
          childView: AttachmentViews.AttachmentView
        });

        this.attachmentsCollectionView = new AttachmentEditableCollectionView({
          collection: this.model.get('attachments')
        });
        

        this.attachmentsRegion.show(this.attachmentsCollectionView);
      }

      if (this.viewStyle === that.availableMessageViewStyles.FULL_BODY && this.messageListView.defaultMessageStyle !== this.availableMessageViewStyles.FULL_BODY) {
        this.showReadLess();
      }

      if (this.messageListView.isCurrentViewStyleThreadedType() && 
          that.messageFamilyView.currentLevel !== 1) {
        this.model.getParentPromise().then(function(parentMessageModel) {
          //console.log("comparing:", parentMessageModel.getSubjectNoRe(), that.model.getSubjectNoRe());
          if (parentMessageModel && parentMessageModel.getSubjectNoRe() === that.model.getSubjectNoRe()) {
            //console.log("Hiding redundant title")
            that.$(".message-subject").addClass('hidden');
          }
        });
      }

      if (this.viewStyle === this.availableMessageViewStyles.PREVIEW) {

        var applyEllipsis = function() {
          /* We use https://github.com/MilesOkeefe/jQuery.dotdotdot to show
           * Read More links for message previews
           */
          that.$(".ellipsis").dotdotdot({
            after: "a.readMore",
            callback: function(isTruncated, orgContent) {
              //console.log("dotdotdot initialized on message", that.model.id);
              //console.log(isTruncated, orgContent);
              if (isTruncated)
              {
                that.$(".ellipsis > a.readMore, .ellipsis > p > a.readMore").removeClass('hidden');
              }
              else
                          {
                            that.$(".ellipsis > a.readMore, .ellipsis > p > a.readMore").addClass('hidden');
                            if (that.model.get('body') && that.model.get('body').length > 610) // approximate string length for text which uses 4 full lines
                            {
                              if (Ctx.debugRender) {
                                console.log("there may be a problem with the dotdotdot of message ", that.model.id, "so we will maybe re-render it");
                              }

                              if (++that.reRendered < 5) // we use this to avoid infinite loop of render() calls
                              {
                                if (Ctx.debugRender) {
                                  console.log("yes, we will re-render => tries: ", that.reRendered);
                                }

                                setTimeout(function() {
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

        that.messageListView.requestPostRenderSlowCallback(function() {

          setTimeout(function() {
            //console.log("Initializing ellipsis on message", that.model.id);
            var current_navigation_state = that.messageListView.getContainingGroup().model.get('navigationState');

            //console.log("current_navigation_state:", current_navigation_state);
            if (current_navigation_state === 'about')
            {
              that.listenToOnce(Assembl.vent, 'DEPRECATEDnavigation:selected', applyEllipsis);
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
        if (current_navigation_state !== undefined) {
          //console.log('Setting listener on DEPRECATEDnavigation:selected');
          that.listenTo(Assembl.vent, 'DEPRECATEDnavigation:selected', function(navSection) {
            //console.log('New navigation has just been selected:', navSection);
            if (navSection === 'debate') {
              //console.log('Updating dotdotdot because debate has just been selected');
              that.messageListView.requestPostRenderSlowCallback(function() {
                that.$(".ellipsis").trigger('update.dot');
              });
            }
          });
        }

      }
    }

  },

  renderAuthor: function() {
    var agentAvatarView = new AgentViews.AgentAvatarView({
      model: this.creator
    });
    this.avatar.show(agentAvatarView);
    var agentNameView = new AgentViews.AgentNameView({
      model: this.creator
    });
    this.name.show(agentNameView);
  },

  /**
   * Meant for derived classes to override
   * @type {}
   */
  transformDataBeforeRender: function(data) {
    return data;
  },

  /**
   * Meant for derived classes to override
   * @type {}
   */
  postRender: function() {
    return;
  },

  onClickLike: function(e) {
    var that = this,
    liked_uri = this.model.get('liked'),
    analytics = Analytics.getInstance();

    if (liked_uri) {
      analytics.trackEvent(analytics.events.MESSAGE_UNLIKED);
      Promise.resolve($.ajax(Ctx.getUrlFromUri(this.model.get('liked')), {
        method: "DELETE"})).then(function(data) {
          that.model.set('liked', false);
        }).catch(function(e) {
          that.model.set('liked', liked_uri);
          return false;
        });
    } else {
      analytics.trackEvent(analytics.events.MESSAGE_LIKED);
      Promise.resolve($.ajax(
          "/data/Discussion/" + Ctx.getDiscussionId() + "/posts/" + this.model.getNumericId() + "/actions", {
            method: "POST",
            contentType: "application/json",
            dataType: "json",
            data: '{"@type":"LikedPost"}'
          })).then(function(data) {
            that.model.set('liked', data['@id']);
          }).catch(function(e) {
            that.model.set('liked', liked_uri);
            return false;
          });
    }

    return false;
    },

    onClickShare: function(e) {
      var analytics = Analytics.getInstance();
      analytics.trackEvent(analytics.events.MESSAGE_SHARE_BTN_CLICKED);
    },

  /**
   * Should be called each render
   */
  clearAnnotationsToLoadCache: function() {
    this.annotationsToLoad = undefined;
  },

  /**
   * Get the list of annotations to render in the message body
   */
  getAnnotationsToLoadPromise: function() {
    var that = this,
        annotationsPromise = this.model.getAnnotationsPromise(), //TODO:  This is fairly CPU intensive, and may be worth caching.
        annotationsToLoad = [],
        filter;

    return annotationsPromise.then(function(annotations) {
      if (that.annotationsToLoad === undefined) {
        // Is this the right permission to see the clipboard?
        if (!Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
          filter = function(extract) {
            return extract.idIdea;
          }
        }
        else {
          filter = function() {
            return true;
          };
        }

        _.each(annotations, function(annotation) {
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
  loadAnnotations: function() {
    var that = this;

    if (this.annotator && this.showAnnotations && (this.viewStyle == this.availableMessageViewStyles.FULL_BODY)) {
      this.getAnnotationsToLoadPromise().done(function(annotationsToLoad) {
        if(!that.isViewDestroyed()) {
          // Loading the annotations
          if (annotationsToLoad.length) {
            if (!that.annotator) {
              Raven.captureMessage('Missing annotation')
              console.error("missing annotation", {tags: { messageId: that.id,
                annotator: that.annotator }});
              return;
            }
            // This call is synchronous I believe - benoitg
            that.annotator.loadAnnotations(_.clone(annotationsToLoad));
            _.each(annotationsToLoad, function(annotation) {
              that.loadedAnnotations[annotation['@id']] = annotation;
            });
            setTimeout(function() {
              that.renderAnnotations(annotationsToLoad);
            }, 1);
          }
        }
      });

    }
  },

  /**
   * Shows the related extract from the given annotation
   * @param  {annotation} annotation
   */
  showSegmentByAnnotation: function(annotation) {
    var that = this,
        currentIdea = this.messageListView.getGroupState().get('currentIdea'),
        collectionManager = new CollectionManager();
    if (annotation.idIdea == null || (
        currentIdea != null && currentIdea.id == annotation.idIdea))
      return;
    var Modal = Backbone.Modal.extend({
      template: _.template($('#tmpl-showSegmentByAnnotation').html()),
      className: 'generic-modal popin-wrapper modal-showSegment',
      cancelEl: '.js_close',
      keyControl: false,
      initialize: function() {
        this.$('.bbm-modal').addClass('popin');
      },
      events: {
              'click .js_redirectIdea':'redirectToIdea'
            },
      redirectToIdea: function() {
        var self = this;

        Promise.join(collectionManager.getAllExtractsCollectionPromise(),
            collectionManager.getAllIdeasCollectionPromise(),
                    function(allExtractsCollection, allIdeasCollection) {

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
                          console.log("TODO:  NOT implemented yet.  Should pop panel in a lightbox.  See example at the end of Modal object in navigation.js ");
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
  renderAnnotations: function(annotations) {
    var that = this;

    if(!this.isViewDestroyed()) {
      _.each(annotations, function(annotation) {
        var highlights = annotation.highlights,
        func = that.showSegmentByAnnotation.bind(that, annotation);

        _.each(highlights, function(highlight) {
          highlight.setAttribute('data-annotation-id', annotation['@id']);
          $(highlight).on('click', func);
        });
      });
    }
  },

  /**
   * @event
   * param Annotator object
   */
  onAnnotatorInitComplete: function(annotator) {
    this.annotator = annotator;

    //Normally render has been called by this point, no need for a full render
    this.loadAnnotations();
  },

  /**
   * @event
   */
  onAnnotatorDestroy: function(annotator) {
    this.annotator = null;

    // Resets loaded annotations to initial
    this.loadedAnnotations = {};
  },

  /**
   * Hide the annotator selection tooltip displayed during the selection,
   * before it completes
   */
  hideAnnotatorSelectionTooltip: function() {
    Ctx.annotatorSelectionTooltip.hide();
  },

  /**
   * Show/update the annotator selection tooltip displayed during the selection,
   * before it completes.
   * @param  {number} x
   * @param  {number} y
   * @param  {string} text
   */
  showAnnotatorSelectionTooltip: function(x, y, text) {
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
  showAnnotatorSelectionSaveOptions: function(x, y) {
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

  onMessageReplyBtnClick: function(e) {
    var analytics = Analytics.getInstance();
    e.preventDefault();

    //So it is saved if the view refreshes
    this.replyBoxHasFocus = true;
    analytics.trackEvent(analytics.events.MESSAGE_REPLY_BTN_CLICKED);

    if (!this.isMessageOpened()) {
      //console.log("Message was not opened, opening after clicking on reply box");
      this.doOpenMessage();
    }
    else {
      //console.log("Message already open, focusing on reply box");
      this.focusReplyBox();
    }
  },

  /**
   *  Focus on the reply box, and open the message if closed
   **/
  focusReplyBox: function() {
    var that = this;

    if (!this.isMessageOpened()) {
      console.error("Tried to focus on the reply box of a closed message, this should not happen!");
    }

    if (!this.replyBoxHasFocus) {
      console.error("Tried to focus on the reply box of a message that isn't supposed to have focus, this should not happen!");
    }

    var el = this.replyView.ui.messageBody;
    if (el instanceof jQuery && el.length) {
      if (!el.is(':visible')) {
        console.error("Element not yet visible...");
      }

      setTimeout(function() {
        if(!that.isViewDestroyed()) {
          if (Ctx.debugRender) {
            console.log("Message:focusReplyBox() stealing browser focus");
          }
          /* Attempt to figure out what steals the focus..
            $( document ).bind( "focusin", function( event ) {
            console.log("Global focusin", event);
            });*/
          var retval = el.focus();
          //console.log("jqery called focus, returned:", retval, "has focus: ", retval.is(":focus"), $( document.activeElement ));
          var maintainFocus = function(ev) {
            if(!that.isViewDestroyed() && !el.is(":focus")) {
              if (Ctx.debugRender) {
                console.warn("focus was quickly lost.  Focusing again to work around the problem.");
              }
              setTimeout(function() {
                el.focus();
              }, 500); //Yes, magic constant, but we are already in a workaround.  If we don'T wait, something steals the focus again

            }
          };
          el.on( "focusout", maintainFocus);
          setTimeout(function() {
            el.off( "focusout", maintainFocus);
          }, 1500);

        }
      }, 1);//This settimeout is necessary, at least for chrome, to focus properly.
      //Now this no longer works on either chrome and firefox.  Focus is stolen for some reason I cannot pinpoint.  Annotator?  Browser bug?

    }
    else if (this.ui.messageReplyBox.length) {
      // if the .js_messageSend-body field is not present, this means the user is not logged in, so we scroll to the alert box
      //console.log("Scrooling to reply box instead");
      this.messageListView.scrollToElement(this.ui.messageReplyBox);
    }
    else {
      console.error("Tried to focus on the reply box of a message, but reply box isn't onscreen.  This should not happen!");
    }
  },

  onReplyBoxCancelBtnClick: function(e) {
      this.replyBoxShown = false;
      this.render();
    },

  onMessageHoistClick: function(ev) {
    // we will hoist the post, or un-hoist it if it is already hoisted
    this.isHoisted = this.messageListView.toggleFilterByPostId(this.model.getId());
    this.render(); // so that the isHoisted property will now be considered
  },

  onMessageJumpToParentClick: function(ev) {
      this.messageListView.showMessageById(this.model.get('parentId'));
    },

  onMessageJumpToMessageInThreadClick: function(ev) {
      this.messageListView.currentQuery.clearAllFilters();
      this.messageListView.setViewStyle(this.messageListView.ViewStyles.NEW_MESSAGES);
      this.messageListView.render();
      this.messageListView.showMessageById(this.model.id);
    },

  onToggleExtractsClick: function(ev) {
    if ( this.showAnnotations === true ){
      this.showAnnotations = false;
      if ( this.annotator && this.loadedAnnotations ){
        for ( var annotation_id in this.loadedAnnotations ){
          this.annotator.deleteAnnotation(this.loadedAnnotations[annotation_id]);
        }
      }
    } else {
      this.showAnnotations = true;
      this.loadAnnotations();
    }
  },

  onModerationOptionsClick: function(ev) {
    console.log("message::onModerationOptionsClick()");
    if ( this.messageModerationOptionsView ){
      // this.destroyMessageModerationOptionsView(); // uncomment to toggle
      return;
    }
    this.messageModerationOptionsView = new MessageModerationOptionsView({
      model: this.model,
      message_publication_status: this.model.get("publication_state"),
      message_moderated_version: this.model.get("moderation_text"),
      message_moderation_remarks: this.model.get("moderator_comment"),
      message_original_body_safe: this.generateSafeBody()
    });
    this.getRegion("moderationOptionsRegion").show(this.messageModerationOptionsView);
    this.listenToOnce(this.messageModerationOptionsView, 'moderationOptionsSaveAndClose', this.onModerationOptionsSaveAndClose);
    this.listenToOnce(this.messageModerationOptionsView, 'moderationOptionsClose', this.onModerationOptionsClose);
  },

  destroyMessageModerationOptionsView: function(){
    console.log("message::destroyMessageModerationOptionsView()");
    if ( this.messageModerationOptionsView ){
      console.log("destroying");
      this.messageModerationOptionsView.destroy();
      this.messageModerationOptionsView = null;
    }
  },

  onModerationOptionsSaveAndClose: function(){
    console.log("message:onModerationOptionsSaveAndClose()");
    this.destroyMessageModerationOptionsView();
    this.render();
  },

  onModerationOptionsClose: function(){
    console.log("message:onModerationOptionsClose()");
    this.destroyMessageModerationOptionsView();
  },

  onMessageJumpToMessageInReverseChronologicalClick: function(ev) {
      this.messageListView.currentQuery.clearAllFilters();
      this.messageListView.setViewStyle(this.messageListView.ViewStyles.REVERSE_CHRONOLOGICAL);
      this.messageListView.render();
      this.messageListView.showMessageById(this.model.id);
    },

  onShowAllMessagesByThisAuthorClick: function(ev) {
      this.messageListView.currentQuery.clearAllFilters();
      this.messageListView.currentQuery.addFilter(this.messageListView.currentQuery.availableFilters.POST_IS_FROM, this.model.get('idCreator'));
      this.messageListView.render();
      this.messageListView.showMessageById(this.model.id);
    },

  onShowModeratedMessageClick: function(ev) {
    var message_number = ev.target.attributes["data"].value;
    this.$("#js_moderated_message_" + message_number).toggleClass('hidden');
  },

  /**
   * You need to re-render after this
   */
  setViewStyle: function(style) {
    if (style === this.availableMessageViewStyles.TITLE_ONLY) {
      this.$el.removeClass(this.availableMessageViewStyles.FULL_BODY.id);
      this.$el.removeClass(this.availableMessageViewStyles.PREVIEW.id);
      this.$el.addClass(this.availableMessageViewStyles.TITLE_ONLY.id);
      this.viewStyle = style;
    }
    else if (style === this.availableMessageViewStyles.FULL_BODY) {
      this.$el.removeClass(this.availableMessageViewStyles.TITLE_ONLY.id);
      this.$el.removeClass(this.availableMessageViewStyles.PREVIEW.id);
      this.$el.addClass(this.availableMessageViewStyles.FULL_BODY.id);
      this.viewStyle = style;

    }
    else if (style === this.availableMessageViewStyles.PREVIEW) {
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
  isMessageOpened: function() {
      if (this.viewStyle === this.availableMessageViewStyles.FULL_BODY &&
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
  doOpenMessage: function() {
      var shouldReRender = false;
      if (!this.isMessageOpened()) {
        this.setViewStyle(this.availableMessageViewStyles.FULL_BODY);
        this.replyBoxShown = true;
        shouldReRender = true;
      }

      var read = this.model.get('read');
      if (read === false && Ctx.getCurrentUser().isUnknownUser() === false) {
        var target = this.$('.readUnreadIndicator');
        this.model.setRead(true, target); // causes a re-render
        shouldReRender = false; // because previous this.model.setRead() will already cause a re-render
      }

      if ( shouldReRender ){
        this.render();
      }
    },

  /**
   * move the message to it's "closed" state, which is dependent on the
   * view
   */
  doCloseMessage: function() {
      if (this.isMessageOpened()) {
        this.setViewStyle(this.messageListView.getTargetMessageViewStyleFromMessageListConfig(this));
        this.replyBoxShown = false;
        this.render();
      }
    },

  /**
   * Change the message view Style and re-render.
   * In most cases will switch between FULL_BODY and another view
   */
  toggleViewStyle: function() {
      this.isMessageOpened() ? this.doCloseMessage() : this.doOpenMessage();
    },

  /**
   * @event
   */
  onMessageTitleClick: function(e) {
    if (e) {
      var target = $(e.target);
      if (target.is('a') && !(
          target.hasClass('js_readMore') || target.hasClass('js_readLess'))) {
        return;
      }

      e.stopPropagation();
      e.preventDefault();
    }

    this.doProcessMessageTitleClick();
  },

  /**
   */
  doProcessMessageTitleClick: function() {
    this.toggleViewStyle();
  },

  /**
   * This il only called by messageList::showMessageById
   */
  onOpenWithFullBodyView: function(e) {
      //console.log("onOpenWithFullBodyView()");
      if (!this.isMessageOpened()) {
        this.doOpenMessage();
      }
    },

  /**
   * @event
   * Starts annotator text selection process
   */
  startAnnotatorTextSelection: function() {
      if (Ctx.debugAnnotator) {
        console.log("startAnnotatorTextSelection called");
      }

      if (this.messageListView.isInPrintableView() || !Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
        return;
      }

      this.hideAnnotatorSelectionTooltip();
      this.isSelecting = true;
      this.$el.addClass('is-selecting');

      var that = this;

      $(document).one('mouseup', function(ev) {
        that.finishAnnotatorTextSelection(ev);
      });
    },

  /**
   * @event
   * Does the selection
   */
  updateAnnotatorTextSelection: function(ev) {
      if (Ctx.debugAnnotator) {
        console.log("updateAnnotatorTextSelection called");
      }

      if (this.messageListView.isInPrintableView()) {
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
  onMouseLeaveMessageBodyAnnotatorSelectionAllowed: function() {
      if (Ctx.debugAnnotator) {
        console.log("onMouseLeaveMessageBodyAnnotatorSelectionAllowed called");
      }

      if (this.messageListView.isInPrintableView()) {
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
          if ('removeAllRanges' in selection) {
            selection.removeAllRanges();
          }
          else if ('empty' in selection) {
            selection.empty();
          }
        })();
      }

    },

  /**
   * Return the selected text on the document (DOM Selection, nothing
   * annotator specific)
   * @return {Selection}
   */
  getSelectedText: function() {
      if (Ctx.debugAnnotator) {
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
  finishAnnotatorTextSelection: function(ev) {
      var isInsideAMessage = false,
          selectedText = this.getSelectedText(),
          user = Ctx.getCurrentUser(),
          text = selectedText.focusNode ? selectedText.getRangeAt(0).cloneContents() : '';

      if (Ctx.debugAnnotator) {
        console.log("finishAnnotatorTextSelection called");
      }

      text = text.textContent || '';

      if (ev) {
        isInsideAMessage = $(ev.target).closest('.is-selecting').length > 0;
      }

      if (this.isSelecting && text.length > MIN_TEXT_TO_TOOLTIP && isInsideAMessage) {
        if (user.can(Permissions.ADD_EXTRACT)) {
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
  onReplaced: function(newObject) {
    this.setElement(newObject);

    // TODO André: also look at this one, please!
    // It will not be triggered for a while, though.
    this.render();
  },

  /**
   * Mark the current message as unread
   */
  markAsUnread: function(ev) {
    var target = this.$('.readUnreadIndicator'),
        analytics = Analytics.getInstance();

    analytics.trackEvent(analytics.events.MESSAGE_MANUALLY_MARKED_UNREAD);
    ev.stopPropagation();
    Ctx.removeCurrentlyDisplayedTooltips(this.$el);
    this.model.setRead(false, target);
  },

  /**
   * Mark the current message as read
   */
  markAsRead: function(ev) {
    var target = this.$('.readUnreadIndicator'),
        analytics = Analytics.getInstance();

    analytics.trackEvent(analytics.events.MESSAGE_MANUALLY_MARKED_READ);
    ev.stopPropagation();
    Ctx.removeCurrentlyDisplayedTooltips(this.$el);
    this.model.setRead(true, target);
  },

  onReplyBoxFocus: function(e) {
      this.replyBoxHasFocus = true;
      if (!this.model.get('read')) {
        this.model.setRead(true); // we do not call markAsRead on purpose
      }

      Assembl.vent.trigger('messageList:replyBoxFocus');
    },

  onReplyBoxBlur: function(e) {
      this.replyBoxHasFocus = false;
      Assembl.vent.trigger('messageList:replyBoxBlur');
    },

  /**
   * Show the read less link
   * */
  showReadLess: function() {
    this.$('.readLess').removeClass('hidden');
  },

  openTargetInPopOver: function(evt) {
    console.log("message openTargetInPopOver(evt: ", evt);
    return Ctx.openTargetInPopOver(evt);
  },

  /**
   * [exportToFacebook global function that
   *  uses the facebook javascript sdk to push
   *  to facebook]
   * @param  {event}
   * @return {null}
   */
  exportToFacebook: function(event) {
      var modal = new messageExport({
        exportedMessage: this.model,
        messageView: this
      });
      $('#slider').html(modal.render().el);
    }

});

module.exports = MessageView;

