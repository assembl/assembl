'use strict';
/**
 * 
 * @module app.views.message
 */

var Marionette = require('../shims/marionette.js'),
    Raven = require('raven-js'),
    Backbone = require('backbone'),
    _ = require('underscore'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    scrollUtils = require('../utils/scrollUtils.js'),
    MessageSendView = require('./messageSend.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    CollectionManager = require('../common/collectionManager.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    $ = require('jquery'),
    Promise = require('bluebird'),
    messageExport = require('./messageExportModal.js'),
    AgentViews = require('./agent.js'),
    Types = require('../utils/types.js'),
    AttachmentViews = require('./attachments.js'),
    MessageModerationOptionsView = require('./messageModerationOptions.js'),
    MessageTranslationView = require('./messageTranslationQuestion.js'),
    Analytics = require('../internal_modules/analytics/dispatcher.js'),
    Genie = require('../utils/genieEffect.js'),
    IdeaClassificationOnMessageView = require('./ideaClassificationOnMessage.js'),
    LangString = require('../models/langstring.js'),
    IdeaContentLink = require('../models/ideaContentLink.js'),
    ConfirmModal = require('./confirmModal.js'),
    Growl = require('../utils/growl.js'),
    MessageModel = require('../models/message.js');

var MIN_TEXT_TO_TOOLTIP = 5,
    TOOLTIP_TEXT_LENGTH = 10,
    IDEA_CLASSIFICATION_LENGTH = 3;


/**
 * @class app.views.message.IdeaClassificationNameListView
 * Classification view that is shown in the underneath each message
 */
var IdeaClassificationNameListView = Marionette.ItemView.extend({
  constructor: function IdeaClassificationNameListView() {
    Marionette.ItemView.apply(this, arguments);
  },

  template: '#tmpl-loader',

  ui: {
    'idea': '.js_idea-classification-idea'
  },

  events: {
    "click @ui.idea": "onIdeaClick"
  },


  initialize: function(options){
    var cm = new CollectionManager(),
        that = this,
        ideaContentLinks = cm.getIdeaContentLinkCollectionOnMessage(this.model);

    this.messageView = options.messageView;
    this.ideaContentLinks = ideaContentLinks;

    // console.log("------- init of idea classification on message with body: -----------");
    // console.log(this.messageView._body.value() );
    // console.log("IdeaContentLinks", this.ideaContentLinks);

    if (_.isEmpty(ideaContentLinks)) {
      console.log("About to remove the ideaClassificationRegion");
      this.messageView.removeIdeaClassificationView();
    }

    //Check if it is a Post type.
    if (! Types.isInstance(this.model.get('@type'), Types.POST) ) {
      console.log("About to remove the ideaClassificationRegion");
      this.messageView.removeIdeaClassificationView();
    }

    else {

      //Current implementation of IdeaContentLink Collection is the creation of the
      //collection each time for a message for IdeaContentLinks associated with the
      //message. During the App lifetime, IdeaContentLinks can be created, destroyed,
      //Ideas created, renamed, destroyed. This collection is stale; it does not know
      //of any of these changes. As a result, on each init, clear the collection
      //of any IdeaContentLinks that are out of date.


      //First, let's remove the extracts that no longer exist.
      //Then let's update with the ideas that no longer exist.

      // cm.getAllExtractsCollectionPromise()
      //   .then(function(extracts){
      //     var staleIdeaContentLinks = that.ideaContentLinks.filter(function(icl){
      //       var exists = extracts.get(icl.id);
      //       return exists ? false: true;
      //     });

      //     console.log("---- Removing stale extracts -----");
      //     console.log("From body: ", that.messageView._body.value());
      //     console.log("staleIdeaContentLinks", staleIdeaContentLinks);
      //     console.log("All Extracts", extracts);
      //     //Remove the stale data from the collection
      //     that.ideaContentLinks.remove(staleIdeaContentLinks);
      //     return cm.getAllIdeasCollectionPromise();
      //   })
      //   .then(function(ideas){

      //     var staleIdeaContentLinks = that.ideaContentLinks.filter(function(icl){
      //       var exists = ideas.get(icl.get('idIdea'));
      //       return exists ? false : true;
      //     });

      //     console.log("---- Removing stale ideas -----");
      //     console.log("From body: ", that.messageView._body.value());
      //     console.log("staleIdeaContentLinks", staleIdeaContentLinks);
      //     console.log("All Ideas", ideas);
      //     //Now remove the stale links to ideas that no longer exist
      //     that.ideaContentLinks.remove(staleIdeaContentLinks);
      //     return that.ideaContentLinks.getIdeaNamesPromise();
      //   })
      this.ideaContentLinks.getIdeaNamesPromise()
        .then(function(ideaNames){
          that.ideaNames = ideaNames;

          if (!that.isViewDestroyed()) {
            if (_.isEmpty(ideaNames)) {
              that.messageView.removeIdeaClassificationView();
            }
            else {
              that.template = "#tmpl-ideaClassificationInMessage"
              that.render();
            }
          }
        })
        .error(function(e){
          console.error(e.statusText);
        });
    }

  },

  serializeData: function(){
    if (this.template === '#tmpl-loader'){
      return {};
    }

    var count = this.ideaNames? this.ideaNames.length: 0,
        first = null,
        rest = null;

    if (count <= IDEA_CLASSIFICATION_LENGTH ){
      first = this.ideaNames;
      rest = [];
    }

    if (count > IDEA_CLASSIFICATION_LENGTH) {
      first = _.first(this.ideaNames, IDEA_CLASSIFICATION_LENGTH);
      rest = _.rest(this.ideaNames, IDEA_CLASSIFICATION_LENGTH);
    }

    return {
      names: this.ideaNames,
      count: count,
      first: first,
      rest: rest,
      i18n: i18n,
      linked_to_msg: i18n.ngettext(
        "This message is linked to the following idea: ",
        "This message is linked to the following ideas: ", count),
      other_ideas_msg: i18n.sprintf(
        i18n.ngettext(
            "and %d other idea</a>",
            "and %d other ideas</a>",
            rest.length),
        rest.length)
    };
  },

  onIdeaClick: function(e){
    var that = this,
        analytics = Analytics.getInstance();

    analytics.trackEvent(analytics.events.NAVIGATE_TO_CLASSIFICATION_ON_MESSAGE);

    var modalView = new IdeaClassificationOnMessageView({
      groupContent: this.messageView.messageListView.getContainingGroup(),
      messageModel: this.model,
      messageView: this.messageView,
      ideaContentLinks: this.ideaContentLinks
    });

    Ctx.setCurrentModalView(modalView);
    Assembl.slider.show(modalView);
  }
});


/**
 * @class app.views.message.MessageView
 */
var MessageView = Marionette.LayoutView.extend({
  constructor: function MessageView() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-loader',
  availableMessageViewStyles: Ctx.AVAILABLE_MESSAGE_VIEW_STYLES,
  /**
   * @type {string}
   */
  className: 'message',

  /**
   * Flags if it is selecting a text or not
   * @type {boolean}
   */
  isSelecting: true,

  /**
   * Flags if the message is hoisted
   * @type {boolean}
   */
  isHoisted: false,

  /**
   * Is the reply box currently visible
   * @type {boolean}
   */
  replyBoxShown: false,

  /**
   * does the reply box currently have the focus
   * @type {boolean}
   */
  replyBoxHasFocus: false,

  /**
   * how many times the message has been re-rendered
   * @type {number}
   */
  reRendered: 0,

  moderationTemplate: Ctx.loadTemplate('moderatedBody'),

  /**
   * Show annotations (extracts and gems) in the message
   * @type {boolean}
   */
  showAnnotations: null,

  /**
   * The Marionette view for moderation
   * @type {Marionette_view}
   */
  messageModerationOptionsView: null,

  /**
   * @init
   * @param {MessageModel} obj: the model
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
    this.showAnnotations = this.canShowAnnotations();

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

    /*
      Flags used to identify message translation states
     */
    
    /*
      Flag used during render to determine whether to show original body or 
      translated.
      This is TRIGGERED by user interaction with the "show original" link
     */
    this.useOriginalContent = false;

    /*
      Flag that is used during render to show the translation question again
      Triggered by user interaction with the message menu, "show translation question"
     */
    this.forceTranslationQuestion = false;

    /*
      Flag that is used during render to hide the show/hide the translation question from
      other re-rendering paths than indicated by forceTranslationQuestion
     */
    this.hideTranslationQuestion = false;

    /*
      Flag used in view init to check wether the current user has any
      user language preferences
     */
    this.unknownPreference = false;

    /*
      Flag that indicates whether the discussion has an active translator service
      It's kind of defunct now, as Ctx contains this information now
     */
    this.hasTranslatorService = false;

    /*
      Flag that indicates whether there was an error with translation of the body

     */
    this.bodyTranslationError = false;


    /*
      Flag controlled by the method processContent that will determine whether the message
      is translated or original. This does NOT change with user input. Only changes with
      user language preferences and/or translation errors.
     */
    this.isMessageTranslated = null;

    /*
      Flags for controlling moderation state in the view.
     */
    this.moderationOptions = {
      isModerated: false,
      purpose: null
    };

    this.isCompleteDataLoaded();

  },

  /** IMPORTANT NOTE:  If this returns false, if WILL initiate a data fetch */
  isCompleteDataLoaded: function(){
    var that = this;

    if (this.template === '#tmpl-message' && this.model.get('@view') ===  'default') {
      return true;
    }
    else {
      this.template = '#tmpl-loader';
      Promise.join(
          this.model.getCreatorPromise(),
          this.model.collection.collectionManager.getUserLanguagePreferencesPromise(Ctx),
          this.model.collection.collectionManager.getMessageFullModelPromise(this.model.id),
          function(creator, ulp, messageFullModel) {
            //Not doing anything with messageFullModel, this.model is already
            //the right link, we just want the content of the model updated
            if(!that.isViewDestroyed()) {
              that.creator = creator;

              //To initalize functions called to set up translations
              that.initiateTranslationState(ulp);
              that.processContent();

              that.template = '#tmpl-message';
              that.render();
            }
        });
      return false;
    }
  },

  modelEvents: {
      'replacedBy':'onReplaced',
      'change:like_count':'renderLikeCount',
      'change':'guardedRender',
      'openWithFullBodyView': 'onOpenWithFullBodyView'
  },

  guardedRender: function(){
    if (Ctx.debugRender) {
      console.log("MessageView modelEvents change fired from", this.model);
    }
    if(!this.isViewDestroyed()) {
      if (!this.changeIsPartialRender()) {
        this.render();
      }
    }
  },

  ui: {
      jumpToParentButton: ".js_message-jumptoparentbtn",
      jumpToMessageInThreadButton: ".js_message-jump-to-message-in-thread",
      jumpToMessageInReverseChronologicalButton: ".js_message-jump-to-message-in-reverse-chronological",
      showAllMessagesByThisAuthorButton: ".js_message-show-all-by-this-author",
      toggleExtracts: ".js_message-toggle-extracts",
      moderationOptionsButton: ".js_message-moderation-options",
      deleteMessageButton: ".js_message-delete",
      messageReplyBox: ".js_messageReplyBoxRegion",
      likeLink: ".js_likeButton",
      shareLink: ".js_shareButton",
      likeCounter: ".js_likeCount",
      avatar: ".js_avatarContainer",
      name: ".js_nameContainer",
      translation: ".js_regionMessageTranslationQuestions",
      attachments: ".js_regionMessageAttachments",
      moderationOptions: ".js_regionMessageModerationOptions",
      showTranslationPref: ".js_show-translation-preferences",
      showMoreDropDown: ".dropdown-toggle", //Used for show/hiding translation view
      showOriginal: '.js_translation_show_original', //Show original region
      showOriginalString: '.js_trans_show_origin',
      showTranslatedString: '.js_trans_show_translated',
      ideaClassificationRegion: '.js_idea-classification-region',
      messageBodyAnnotatorAllowed: '.js_messageBodyAnnotatorSelectionAllowed'

    },

    regions: {
      avatar: "@ui.avatar",
      name: "@ui.name",
      translationRegion: "@ui.translation",
      attachmentsRegion: "@ui.attachments",
      moderationOptionsRegion: "@ui.moderationOptions",
      messageReplyBoxRegion: "@ui.messageReplyBox",
      ideaClassification: "@ui.ideaClassificationRegion"
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
    'click @ui.deleteMessageButton' : 'onDeleteMessageClick',
    "click @ui.showTranslationPref" : "onShowTranslationClick",

    //
    'click .js_messageReplyBtn': 'onMessageReplyBtnClick',
    'click .messageSend-cancelbtn': 'onReplyBoxCancelBtnClick',

    'click @ui.showOriginalString': 'onShowOriginalClick',
    'click @ui.showTranslatedString': 'onShowTranslatedClick',

    //These two are from messageSend.js, do NOT use @ui
    'focus .js_messageSend-body': 'onReplyBoxFocus',
    'blur .js_messageSend-body': 'onReplyBoxBlur',

    //
    'mousedown  @ui.messageBodyAnnotatorAllowed': 'startAnnotatorTextSelection',
    'mousemove  @ui.messageBodyAnnotatorAllowed': 'updateAnnotatorTextSelection',
    'mouseleave @ui.messageBodyAnnotatorAllowed': 'onMouseLeaveMessageBodyAnnotatorSelectionAllowed',
    'mouseenter @ui.messageBodyAnnotatorAllowed': 'updateAnnotatorTextSelection',

    // menu
    'click .js_message-markasunread': 'markAsUnread',
    'click .js_message-markasread': 'markAsRead',

    'click .js_message-export-facebook': 'exportToFacebook',

    'click .js_openTargetInPopOver': 'openTargetInPopOver'
  },

  /**
   * @param {string} htmlOrText: p and br tags are replaced with
   * spaces, and all html is stripped
   * @returns string
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
   * @returns langstring
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

  /**
   * @returns langstring
   */
  generateSafeOriginalBody: function() {
    var body = this.model.get('body').originalValue();
    if(this.model.get('bodyMimeType') !== "text/html") {
        body = Ctx.stripHtml(body);
    }
    return body;
  },

  processContent: function() {
    var body = this.model.get('body') || LangString.Model.empty,
        subject = this.model.get('subject') || LangString.Model.empty;

    if (this.hasTranslatorService) {

      if (!this.useOriginalContent) {
        var processedBody = body.bestWithErrors(this.translationData, false),
            processedSubject = subject.bestWithErrors(this.translationData, true);

        //bestWithError will make this the original value if error

        // specialCase: Hide IDENTICAL_TRANSLATION error
        if (processedBody.error == 13) {
            this.bodyTranslationError = 0;
            this._body = body.original();
            this.isMessageTranslated = false;
            if (processedSubject.error) {
                this._subject = subject.original();
            } else {
                this._subject = processedSubject.entry;
            }
        } else {
            this.bodyTranslationError = processedBody.error;
            this.unknownPreference = this.translationData.getPreferenceForLocale(
              processedBody.entry.getOriginalLocale()).get("source_of_evidence") === null;
            this._body = processedBody.entry;
            this._subject = processedSubject.entry;
            this.isMessageTranslated = this._body.isMachineTranslation();
        }
      }
      else {
        this._body = body.original();
        this._subject = subject.original();
        this.isMessageTranslated = false;
      }
    }
    else {
      this._body = body.original();
      this._subject = subject.original();
      this.isMessageTranslated = false;
    }
  },

  serializeData: function() {
    if (this.template == "#tmpl-loader") {
        return {};
    }
    this.processContent();
    var bodyFormatClass,
        that = this,
        moderatedBody = null,
        metadata_json = this.model.get('metadata_json'), // this property needs to exist to display the inspiration source of a message (creativity widget)
        bodyFormat = this.model.get('bodyMimeType'),
        isModerated = false,
        moderationType,
        moderationLangString;

    if (this.viewStyle === this.availableMessageViewStyles.PREVIEW || this.viewStyle === this.availableMessageViewStyles.TITLE_ONLY) {
      if (bodyFormat === "text/html") {
        //Strip HTML from preview
        bodyFormat = "text/plain";
        this._body = this._body.applyFunction(this.generateBodyPreview);
      }
    }


    if (this.model.get("publication_state") == "MODERATED_TEXT_ON_DEMAND" || this.model.get("publication_state") == "MODERATED_TEXT_NEVER_AVAILABLE") {
    //if (this.model.get("moderation_text")) {
      bodyFormat = "text/html";
      //@TODO: should the body be this._body??
      moderatedBody = new LangString.EntryModel({
        // '@language': ??? not sure on template language, needs work.
        value: this.moderationTemplate({
          ctx: Ctx,
          viewStyle: this.viewStyle,
          subject: this._subject.value(),
          body: this._body.value(),
          publication_state: this.model.get("publication_state"),
          moderation_text: this.model.get("moderation_text"),
          moderator: this.model.get("moderator"),
          message_id: this.model.id.split('/')[1]
      })});

      //Set a langstring, in order to ensure that the body has a langstring().
      moderationLangString = new LangString.Model({
        entries: [moderatedBody]
      }, {parse: true});
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
            {'t': this._subject.value()},
            {'s': Ctx.getPreferences().social_sharing }
          ]
        );

    var html_export_url = null;
    if (this.model.getBEType() == Types.SYNTHESIS_POST) {
      html_export_url = Ctx.getApiV2DiscussionUrl("posts/" + this.model.getNumericId() + "/html_export");
    }

    var user_can_delete_this_message = ( Ctx.getCurrentUserId() == Ctx.extractId(this.model.get('idCreator')) && Ctx.getCurrentUser().can(Permissions.DELETE_MY_POST) ) || Ctx.getCurrentUser().can(Permissions.DELETE_POST);

    return {
      message: this.model,
      messageListView: this.messageListView,
      viewStyle: this.viewStyle,
      metadata_json: metadata_json,
      creator: this.creator,
      parentId: this.model.get('parentId'),
      subject: this._subject,
      body: this.moderationOptions.isModerated ? moderatedBody : this._body,
      bodyTranslationError: this.bodyTranslationError,
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
      user_can_moderate: Ctx.getCurrentUser().can(Permissions.MODERATE_POST),
      user_can_delete_this_message: user_can_delete_this_message,
      unknownPreference: this.unknownPreference,
      useOriginalContent: this.useOriginalContent,
      isTranslatedMessage: this.isMessageTranslated,
      canShowTranslation: this.canShowTranslation(),
      showOriginalText: LangString.LocaleUtils.getServiceShowOriginalString(),
      showOriginalUrl: LangString.LocaleUtils.getServiceShowOriginalUrl(),
      isModerated: this.moderationOptions.isModerated
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
      var likeFound = false, changedAttributes = this.model.changedAttributes();
      for (var propName in changedAttributes) {
        if (propName === "like_count") {
          likeFound = true;
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

      return likeFound;
    },

  render: function() {
    //This code was used to get the Marionette Render method.
    //TODO: Check to see if this is still valid code. AY
    var base_object = Object.getPrototypeOf(this),
        base_render = base_object.render;
    while (Object.getPrototypeOf(base_object).render === base_render) {
      base_object = Object.getPrototypeOf(base_object);
    }

    Object.getPrototypeOf(base_object).render.apply(this, arguments);
  },

  onBeforeRender: function(){
    this.isCompleteDataLoaded();
    //Check if the message is moderated
    
    if (this.model.get('publication_state') == "MODERATED_TEXT_ON_DEMAND" || this.model.get("publication_state") == "MODERATED_TEXT_NEVER_AVAILABLE"){
      //Naive implemntation. When other publication states are used, update the code here.
      this.moderationOptions.isModerated = true;
      this.moderationOptions.purpose = this.model.get('publication_state');
    }
  },

  /**
   * The render
   * @returns {MessageView}
   */
  onRender: function() {
    if (this.template == "#tmpl-loader") {
        return {};
    }

    var publication_state = this.model.get('publication_state');
    if ( publication_state && publication_state in MessageModel.DeletedPublicationStates ){
      // This message is deleted, so it should not be displayed using the regular Message view, but using the MessageDeletedByUser or MessageDeletedByAdmin view.
      // Code runs into this case when the user has just deleted a message, and its messageFamily is going to re-render it using the correct MessageDeletedByUser or MessageDeletedByAdmin view.
      return;
    }
    else {
      
      var that = this,
          modelId = this.model.id,
          partialMessage = MessagesInProgress.getMessage(modelId);

      //Important flag to display/remove annotations is this.showAnnotations
      this.showAnnotations = this.canShowAnnotations();

      if (Ctx.debugLangstring){
        console.log("---- Message onRender called ----------------");
        console.log("Local states of a message view:");
        console.log("forceTranslationQuestion: ", this.forceTranslationQuestion);
        console.log("useOriginalContent: ", this.useOriginalContent);
        console.log("unknownPreference: ", this.unknownPreference);
        console.log("bodyTranslationError: ", this.bodyTranslationError);
        console.log("isMessageTranslated: ", this.isMessageTranslated);
        console.log("Discrepency? ", !(this.isMessageTranslated !== this.showAnnotations));
        console.log("_body.value: ", this._body.value());
        console.log("_body.isMachineTranslation(): ", this._body.isMachineTranslation());
      }

      if (Ctx.debugAnnotator) {
        console.log("showAnnotations: ", this.showAnnotations);
      }

      if (!this.showAnnotations) {
        this.removeAnnotations();
      }

      // do not render the whole thing if only the like_count changed.
      // it may kill the message being edited.
      if (this.changeIsPartialRender()) {
        return;
      }

      if (Ctx.debugRender) {
        console.log("message:render() is firing for message", this.model.id);
      }


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

      this.postRender();

      if (this.viewStyle === that.availableMessageViewStyles.FULL_BODY && (this.replyBoxShown || partialMessage.body)) {

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

      //Translation view should only be shown when the message is in full view or in preview mode. Otherwise,
      //do not show it
      //Also, only the body translation triggers the translation view
      if (this.viewStyle == this.availableMessageViewStyles.FULL_BODY ||
          this.viewStyle == this.availableMessageViewStyles.PREVIEW) {

        if (this.canShowTranslation() ) {
          if ( (this.forceTranslationQuestion && !this.hideTranslationQuestion) || (
              this.unknownPreference && !this.bodyTranslationError)) {
            //Only show the translation view *iff* the message was translated by the backend
            var translationView = new MessageTranslationView({messageModel: this.model, messageView: this});
            this.translationRegion.show(translationView);
            this.translationRegion.$el.removeClass("hidden");
          } else if (this.translationRegion.$el) {
            this.translationRegion.$el.addClass("hidden");
          }
        }
      }

      if (this.viewStyle === this.availableMessageViewStyles.FULL_BODY) {
        //Only the full body view uses annotator
        this.messageListView.requestAnnotatorRefresh();
        this.renderAttachments();
        this.renderIdeaClassification();
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
        if (!that.canShowAnnotations()) {
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
    * @function app.views.message.MessageView.removeAnnotations
    * Seperating the logic of toggling annotations into seperate functions
    */
  removeAnnotations: function(){
    if (this.showAnnotations) {
      this.showAnnotations = false;
      if (this.annotator && this.loadedAnnotations){
        for (var annotation_id in this.loadedAnnotations){
          this.annotator.deleteAnnotation(this.loadedAnnotations[annotation_id]);
        }
      }
    }
  },

  /*
    Seperating the logic of toggling annotations into seperate functions
    Horrible name. @TODO: Think of better name. Conflicts with flag showAnnotations
   */
  addAnnotations: function(){
    if (!this.showAnnotations){
      this.showAnnotations = true;
      this.loadAnnotations();
    }
  },

  /**
   * @function app.views.message.MessageView.showSegmentByAnnotation
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
  constructor: function Modal() {
    Backbone.Modal.apply(this, arguments);
  },

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

  renderIdeaClassification: function(){
    if (!this.model.hasIdeaContentLinks() ){
      //console.log('message ' + this.model.id + " does not have idea content links");
      return;
    }
    
    else {
      var view = new IdeaClassificationNameListView({
        messageView: this,
        model: this.model
      });

      this.getRegion('ideaClassification').show(view);  
    }
    
  },

  removeIdeaClassificationView: function(){
    this.getRegion('ideaClassification').empty();
  },

  renderAttachments: function(){

    /**
     * @class app.views.message.MessageView.MessageAttachmentCollectionView
     */
    var MessageAttachmentCollectionView = Marionette.CollectionView.extend({
      constructor: function MessageAttachmentCollectionView() {
        Marionette.CollectionView.apply(this, arguments);
      },

      childView: AttachmentViews.AttachmentView
    });

    this.attachmentsCollectionView = new MessageAttachmentCollectionView({
      collection: this.model.get('attachments')
    });

    if (this.canShowAttachments()){
      this.attachmentsRegion.show(this.attachmentsCollectionView);
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
   * @param  {number} x
   * @param  {number} y
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
    if(this.replyView){//FIX ME
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
    }
    if (this.ui.messageReplyBox.length) {
      // if the .js_messageSend-body field is not present, this means the user is not logged in, so we scroll to the alert box
      //console.log("Scrooling to reply box instead");
      scrollUtils.scrollToElement(this.ui.messageReplyBox);
    }
    else {
      console.error("Tried to focus on the reply box of a message, but reply box isn't onscreen.  This should not happen!");
    }
  },

  onReplyBoxCancelBtnClick: function(e) {
      this.replyBoxShown = false;
      this.render();
  },

  onShowOriginalClick: function(e) {
      this.useOriginalContent = true;
      this.forceTranslationQuestion = false;
      this.hideTranslationQuestion = true;
      this.render();
  },

  onShowTranslatedClick: function(e) {
      this.useOriginalContent = false;
      this.forceTranslationQuestion = false;
      this.hideTranslationQuestion = false;
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
      message_original_body_safe: this.generateSafeOriginalBody()
    });
    this.getRegion("moderationOptionsRegion").show(this.messageModerationOptionsView);
    this.listenToOnce(this.messageModerationOptionsView, 'moderationOptionsSaveAndClose', this.onModerationOptionsSaveAndClose);
    this.listenToOnce(this.messageModerationOptionsView, 'moderationOptionsClose', this.onModerationOptionsClose);
  },

  onDeleteMessageClick: function(ev){
    var that = this;
    // We could try to minimize context switching for the user, by scrolling the viewport to the message the user wants to delete, as soon as the confirmation popin opens, using this line of code:
    // that.messageListView.scrollToMessage(that.model, false, false);
    
    var onSubmit = function(ev){
      var analytics = Analytics.getInstance();
      analytics.trackEvent(analytics.events.MESSAGE_LIKED);
      // we could use that.model.destroy() instead, and add || method == "delete" to models/message.js::sync()
      var message_delete_url = that.model.getApiV2Url();
      Promise.resolve(
        $.ajax(message_delete_url, {
          method: "DELETE",
          contentType: "application/json",
          dataType: "json"
        })
      ).then(function(data) {
        Growl.showBottomGrowl(
          Growl.GrowlReason.SUCCESS,
          i18n.gettext('Message has been successfully deleted.'),
          { delay: 12000 }
        );

        // Refresh the messageList
        that.messageListView.render();
        setTimeout(function(){
          that.messageListView.showMessageById(that.model.id, null, true, false);
        }, 500);
        
      }).catch(function(e) {
        Growl.showBottomGrowl(
          Growl.GrowlReason.ERROR,
          i18n.gettext('Error: Message could not be deleted.'),
          { delay: 12000 }
        );
      });
    };
    var confirm = new ConfirmModal({
      contentText: i18n.gettext('Are you sure you want to delete this message?'),
      cancelText: i18n.gettext('No'),
      submitText: i18n.gettext('Yes'),
      onSubmit: onSubmit,
    });
    Assembl.slider.show(confirm);
  },

  onShowTranslationClick: function(ev){
    this.forceTranslationQuestion = true;
    this.hideTranslationQuestion = false;
    this.render();
  },

  onHideQuestionClick: function(e) {
    this.forceTranslationQuestion = false;
    this.hideTranslationQuestion = true;
    this.render();
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

      if (this.messageListView.isInPrintableView() || !this.canShowAnnotations()) {
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
   * @returns {Selection}
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
   * @param event
   * @returns {null}
   */
  exportToFacebook: function(event) {
      var modal = new messageExport({
        exportedMessage: this.model,
        messageView: this
      });
      $('#slider').html(modal.render().el);
  },

  /**
   * Method that will close the translation region by using a genie effect
   * @param  {Function}  cb:  A parameterless callback 
   */
  closeTranslationView: function(cb){
    var $source = this.$(this.ui.translation),
        $target = this.$(this.ui.showMoreDropDown),
        that = this;

    this.hideTranslationQuestion = true;

    Genie.geniefy($source, $target, 500)
      .then(function(){
        that.getRegion("translationRegion").empty();
        if (cb) {
          cb();
        }
      });
  },

  canShowAnnotations: function(){
    var c = Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT);

    if (this.isMessageTranslated){
      return false;
    }

    return c;
  },

  /*
    Utility method to initialize the state of translation for proper view rendering for translations
    @param {Object}  preference:   The UserLanguagePreference Collection 
   */
  initiateTranslationState: function(preferences){
    //console.log("vody:", this.model.get("body"));
    var translationData = preferences.getTranslationData();
    var body = this.model.get("body");
    var locale = "und";
    try {
      locale = body.original().getBaseLocale();
    } catch(e) {}
    var preference = preferences.getPreferenceForLocale(locale);

    //Dict cache of locale -> full name
    this.langCache = Ctx.getLocaleToLanguageNameCache();

    //User language preferences
    this.translationData = translationData;

    //Flag allowing modification by user
    this.useOriginalContent = false;

    /*
      Flag that indicates whether the message body is translated or not
     */
    this.isMessageTranslated = false;
    this.unknownPreference = preference === undefined;
    if (_.isEmpty(this.langCache) ){
      this.hasTranslatorService = false;
    }
    else {
      this.hasTranslatorService = Ctx.hasTranslationService();
    }
  },

  /*
    Logic check that the translation view should be shown
   */
  canShowTranslation: function(){
    return (Ctx.isUserConnected() && this.hasTranslatorService
        && this.model.getBEType() != Types.SYNTHESIS_POST);
  },

  /*
    ~ Deprecated ~
    Utility method to reset the state variables required by the translation view logic
   */
  resetTranslationState: function(){
    this.unknownPreference = false;
    this.forceTranslationQuestion = false;
    this.hideTranslationQuestion = false;
    this.useOriginalContent = false;
    this.showAnnotations = this.canShowAnnotations();
    // this.bodyTranslationError = false;  //This could be wrong. Perhaps, should call processContent
    this.processContent();
  },

  canShowAttachments: function(){
    if (this.moderationOptions.isModerated){
      if (this.moderationOptions.purpose === 'MODERATED_TEXT_NEVER_AVAILABLE'){
        return false;
      }
      return true;
    }
    return true;
  }

});

module.exports = MessageView;

