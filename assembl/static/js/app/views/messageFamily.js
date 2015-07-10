'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    i18n = require('../utils/i18n.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js'),
    MessageView = require('./message.js'),
    SynthesisMessageView = require('./synthesisMessage.js');

/**
 * @class views.MessageFamilyView
 */
var MessageFamilyView = Marionette.ItemView.extend({
    template: '#tmpl-messageFamily',
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
    initialize: function (options) {

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
    },

    serializeData: function(){
      var hasParentsOrChildrenOutOfScope = false,
          firstMessage = this.model,
          numAncestors = undefined,
          numDescendants = undefined,
          visitorData = this.messageListView.visitorViewData[this.model.id],
          numAncestorsOutOfContext = 0,
          numDescendantsOutOfContext = 0;

      //console.log(this.model.id, visitorData);
      if( this.messageListView.isViewStyleThreadedType() ) {
        if( (visitorData.filtered_descendant_count !== visitorData.real_descendant_count) || visitorData.real_ancestor_count !== visitorData.level && firstMessage.get("parentId") && this.level === 1 ) {
          hasParentsOrChildrenOutOfScope = true;
          numAncestorsOutOfContext = visitorData.real_ancestor_count - visitorData.level;
          numDescendantsOutOfContext = visitorData.real_descendant_count - visitorData.filtered_descendant_count;
        }
      }
      else {
        if( visitorData.real_descendant_count > 0 || visitorData.real_ancestor_count > 0 ) {
          hasParentsOrChildrenOutOfScope = true;
          numAncestorsOutOfContext = visitorData.real_ancestor_count;
          numDescendantsOutOfContext = visitorData.real_descendant_count;
        }
      }

      return {
        id: this.model.get('@id'),
        level: this.level,
        last_sibling_chain: this.last_sibling_chain,
        hasChildren: this.hasChildren,
        hasParentsOrChildrenOutOfScope: hasParentsOrChildrenOutOfScope,
        numAncestorsOutOfContext: numAncestorsOutOfContext,
        numDescendantsOutOfContext: numDescendantsOutOfContext
      }
    },

    /**
     * The render
     * @param {Number} [level] The hierarchy level
     * @return {MessageView}
     */
    onRender: function () {
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
            this.$el.addClass('bx bx-default root');
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
    onIconbuttonClick: function (ev) {
        //var collapsed = this.model.get('collapsed');
        //this.model.set('collapsed', !collapsed);

        this.collapsed = !this.collapsed;

        this.onCollapsedChange();
    },

    /**
     * @event
     * Collapse icon has been toggled
     */
    onViewConversationClick: function (ev) {
      ev.preventDefault();
      var panelSpec = require('../models/panelSpec.js');
      var PanelSpecTypes = require('../utils/panelSpecTypes.js');
      var ModalGroup = require('./groups/modalGroup.js');
      var viewsFactory = require('../objects/viewsFactory');
      var groupSpec = require('../models/groupSpec');

      var defaults = {
          panels: new panelSpec.Collection([
                                            {type: PanelSpecTypes.MESSAGE_LIST.id, minimized: false}
                                            ],
                                            {'viewsFactory': viewsFactory })
      };
      var groupSpecModel = new groupSpec.Model(defaults);
      var modal_title = i18n.sprintf(i18n.gettext("Zooming on the conversation around \"%s\""), this.model.get('subject'));
      var modal = new ModalGroup({"model": groupSpecModel, "title": modal_title});
      var group = modal.getGroup();
      var messagePanel = group.findViewByType(PanelSpecTypes.MESSAGE_LIST);
      messagePanel.setViewStyle(messagePanel.ViewStyles.THREADED, true)
      messagePanel.currentQuery.addFilter(this.messageListView.currentQuery.availableFilters.POST_IS_DESCENDENT_OR_ANCESTOR_OF_POST, this.model.id);
      console.log("About to manually trigger messagePanel render");
      messagePanel.render();
      Assembl.slider.show(modal);
      messagePanel.showMessageById(this.model.id, undefined, true, true); 
    },

    /**
     * @event
     */
    onCollapsedChange: function () {
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