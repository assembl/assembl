'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    ckeditor = require('ckeditor'),
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
      return {
        id: this.model.get('@id'),
        level: this.level,
        last_sibling_chain: this.last_sibling_chain,
        hasChildren: this.hasChildren
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
        'click >.message-family-arrow>.link-img': 'onIconbuttonClick'
        //'click >.message-family-container>.message-family-arrow>.link-img': 'onIconbuttonClick',
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