'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    i18n = require('../utils/i18n.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js'),
    MessageView = require('./message.js'),
    SynthesisMessageView = require('./synthesisMessage.js'),
    Analytics = require('../internal_modules/analytics/dispatcher.js'),
    availableFilters = require('./postFilters.js');

/**
 * @class views.MessageFamilyView
 */
var MessageFamilyView = Marionette.ItemView.extend({
  template: '#tmpl-loader',
  /**
   * @type {String}
   */
  className: 'message-family-container',

  /**
   * Stores the current level
   * @type {Number}
   */
  currentLevel: null,

  /**
   * @init
   * @param {MessageModel} obj the model
   * @param {Array[boolean]} options.last_sibling_chain which of the view's ancestors
   *   are the last child of their respective parents.
   */
  initialize: function(options) {
    var that = this;
    if (_.isUndefined(options.last_sibling_chain)) {
      this.last_sibling_chain = [];
    }
    else {
      this.last_sibling_chain = options.last_sibling_chain;
    }

    this.messageListView = options.messageListView;
    this.collapsed = options.collapsed;
    this.currentLevel = options.currentLevel;
    this.hasChildren = (_.size(options.hasChildren) > 0);

    //this.model.on('change:collapsed', this.onCollapsedChange, this);
    //this.listenTo(this.model, 'change:collapsed', this.onCollapsedChange);

    this.level = this.currentLevel !== null ? this.currentLevel : 1;

    if (!_.isUndefined(this.level)) {
      this.currentLevel = this.level;
    }
    this.model.collection.collectionManager.getUserLanguagePreferencesPromise(Ctx).then(function(ulp) {
        that.translationData = ulp.getTranslationData();
        that.template = '#tmpl-messageFamily';
        that.render();
    });
  },

  serializeData: function() {
      var hasParentsOrChildrenOutOfScope = false,
          firstMessage = this.model,
          numAncestors = undefined,
          numDescendants = undefined,
          visitorData = this.messageListView.visitorViewData[this.model.id],
          numAncestorsOutOfContext = 0,
          numDescendantsOutOfContext = 0,
          numAuthorsOutOfContext = 0;

      //console.log(this.model.id, visitorData);
      if (this.messageListView.isCurrentViewStyleThreadedType()) {
        if ((visitorData.filtered_descendant_count !== visitorData.real_descendant_count) || visitorData.real_ancestor_count !== visitorData.level && firstMessage.get("parentId") && this.level === 1) {
          hasParentsOrChildrenOutOfScope = true;
          numAncestorsOutOfContext = visitorData.real_ancestor_count - visitorData.level;
          numDescendantsOutOfContext = visitorData.real_descendant_count - visitorData.filtered_descendant_count;
          numAuthorsOutOfContext = visitorData.real_descendant_authors_list.length - visitorData.filtered_descendant_authors_list.length + visitorData.real_ancestor_authors_list.length - visitorData.filtered_ancestor_authors_list.length;
        }
      }
      else {
        if (visitorData.real_descendant_count > 0 || visitorData.real_ancestor_count > 0) {
          hasParentsOrChildrenOutOfScope = true;
          numAncestorsOutOfContext = visitorData.real_ancestor_count;
          numDescendantsOutOfContext = visitorData.real_descendant_count;
          numAuthorsOutOfContext = _.union(visitorData.real_descendant_authors_list, visitorData.real_ancestor_authors_list, [this.model.get('idCreator')]).length - 1;
        }
      }

      return {
        id: this.model.get('@id'),
        level: this.level,
        last_sibling_chain: this.last_sibling_chain,
        hasChildren: this.hasChildren,
        hasParentsOrChildrenOutOfScope: hasParentsOrChildrenOutOfScope,
        numAncestorsOutOfContext: numAncestorsOutOfContext,
        numDescendantsOutOfContext: numDescendantsOutOfContext,
        numAuthorsOutOfContext: numAuthorsOutOfContext,
        ctxMessageCountTooltip: i18n.sprintf(i18n.ngettext(
          "%d more message is available in this message's full context.",
          "%d more messages are available in this message's full context.",
          (numAncestorsOutOfContext + numDescendantsOutOfContext)),
          (numAncestorsOutOfContext + numDescendantsOutOfContext)),
        ctxAuthorCountTooltip: i18n.sprintf(i18n.ngettext(
          "Messages available in this message's full context are from %d more author.",
          "Messages available in this message's full context are from %d more authors.",
          numAuthorsOutOfContext), numAuthorsOutOfContext)
      };
    },

  /**
   * The render
   * @param {Number} [level] The hierarchy level
   * @return {MessageView}
   */
  onRender: function() {
    if (this.template == "#tmpl-loader") {
        return {};
    }
    var messageView;

    Ctx.removeCurrentlyDisplayedTooltips(this.$el);

    var messageViewClass = MessageView;
    if (!this.model.isInstance(Types.POST)) {
      console.error("not a post?");
    }

    if (this.model.getBEType() == Types.SYNTHESIS_POST) {
      messageViewClass = SynthesisMessageView;
    }

    messageView = new messageViewClass({
      model: this.model,
      messageListView: this.messageListView,
      messageFamilyView: this
    });

    messageView.triggerMethod("render");
    this.messageListView.renderedMessageViewsCurrent[this.model.id] = messageView;

    //data['id'] = data['@id'];
    //data['level'] = level;
    //data['last_sibling_chain'] = this.last_sibling_chain;
    //data['hasChildren'] = this.hasChildren;

    if (this.level > 1) {
      if (this.last_sibling_chain[this.level - 1]) {
        this.$el.addClass('last-child');
      } else {
        this.$el.addClass('child');
      }
    } else {
      this.$el.addClass('bx root');
    }

    this.el.setAttribute('data-message-level',  this.level);

    //this.$el.html(this.template(data));
    Ctx.initTooltips(this.$el);
    this.$el.find('>.message-family-arrow>.message').replaceWith(messageView.el);

    this.onCollapsedChange();

  },

  events: {
      'click >.message-family-arrow>.link-img': 'onIconbuttonClick',

      //'click >.message-family-container>.message-family-arrow>.link-img': 'onIconbuttonClick',
      'click >.message-conversation-block>.js_viewMessageFamilyConversation': 'onViewConversationClick'
    },

  /**
   * @event
   * Collapse icon has been toggled
   */
  onIconbuttonClick: function(ev) {
    //var collapsed = this.model.get('collapsed');
    //this.model.set('collapsed', !collapsed);

    this.collapsed = !this.collapsed;

    this.onCollapsedChange();
  },

  /**
   * @event
   * View the entire conversation of a family (possibly composed of a single message)
   */
  onViewConversationClick: function(ev) {
    var analytics = Analytics.getInstance();
    ev.preventDefault();
    analytics.trackEvent(analytics.events.THREAD_VIEW_COMPLETE_CONVERSATION);

    var filters =  [{filterDef: availableFilters.POST_IS_DESCENDENT_OR_ANCESTOR_OF_POST, value: this.model.id}],
        ModalGroup = require('./groups/modalGroup.js'),
        modal_title = i18n.sprintf(i18n.gettext("Zooming on the conversation around \"%s\""),
                                   this.model.get('subject').bestValue(this.translationData)),
        modalFactory = ModalGroup.filteredMessagePanelFactory(modal_title, filters),
        modal = modalFactory.modal,
        messageList = modalFactory.messageList;

    Assembl.slider.show(modal);
    messageList.showMessageById(this.model.id, undefined, true, true); 
  },

  /**
   * @event
   */
  onCollapsedChange: function() {
    if (this.template == "#tmpl-loader") {
        return;
    }
    var collapsed = this.collapsed,
        target = this.$el,
        children = target.find(">.messagelist-children").last();
    if (collapsed) {
      this.$el.removeClass('message--expanded');
      children.hide();
    } else {
      this.$el.addClass('message--expanded');
      children.show();
    }
  }
});

module.exports = MessageFamilyView;
