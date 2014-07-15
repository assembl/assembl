define(function(require){
    'use strict';

        var Backbone = require('backbone'),
                   _ = require('underscore'),
            ckeditor = require('ckeditor'),
                 Ctx = require('modules/context'),
                 app = require('app'),
               Types = require('types'),
         MessageView = require('views/message'),
SynthesisMessageView = require('views/synthesisMessage'),
                i18n = require('i18n');

    /**
     * @class views.MessageFamilyView
     */
    var MessageFamilyView = Backbone.View.extend({
        /**
         * @type {String}
         */
        tagName: 'div',

        /**
         * @type {String}
         */
        className: 'message-family-container',

        /**
         * @init
         * @param {MessageModel} obj the model
         * @param {Array[boolean]} last_sibling_chain which of the view's ancestors
         *   are the last child of their respective parents.
         */
        initialize: function(obj, last_sibling_chain){
            if ( _.isUndefined(last_sibling_chain)) {
                last_sibling_chain = [];
            }
            this.last_sibling_chain = last_sibling_chain;
            this.messageListView = obj.messageListView;
            this.collapsed = obj.collapsed;
            //this.model.on('change:collapsed', this.onCollapsedChange, this);
            //this.listenTo(this.model, 'change:collapsed', this.onCollapsedChange);
        },

        /**
         * The thread message template
         * @type {_.template}
         */
        template: Ctx.loadTemplate('messageFamily'),

        /**
         * Stores the current level
         * @type {Number}
         */
        currentLevel: null,

        /**
         * The render
         * @param {Number} [level] The hierarchy level
         * @return {MessageView}
         */
        render: function(level){

            app.trigger('render');
            var data = this.model.toJSON(),
                children,
                messageView;

            level = this.currentLevel !== null ? this.currentLevel : 1;
            Ctx.cleanTooltips(this.$el);
            if( ! _.isUndefined(level) ){
                this.currentLevel = level;
            }
            if(!this.messageListView.renderedMessageViewsPrevious[this.model.id]){
                var messageViewClass = undefined;
                var messageType = this.model.get('@type');
                switch(messageType){
                    case Types.ASSEMBL_POST:
                    case Types.EMAIL:
                        messageViewClass = MessageView;
                        break;

                case Types.SYNTHESIS_POST:
                    messageViewClass = SynthesisMessageView;
                    break;
                default:
                    console.log("messageFamily.render():  WARNING:  Unknown Post type: ", messageType, "creating a default MessageView");
                    messageViewClass = MessageView;
                }
                
                messageView = new messageViewClass({

                model : this.model,
                messageListView: this.messageListView
                });
                messageView.render();
            }
            else {
                messageView = this.messageListView.renderedMessageViewsPrevious[this.model.id];
            }
            this.messageListView.renderedMessageViewsCurrent[this.model.id] = messageView;
            
            data['id'] = data['@id'];
            data['level'] = level;
            data['last_sibling_chain'] = this.last_sibling_chain;
            data['hasChildren'] = this.hasChildren;

            if (level > 1) {
                if (this.last_sibling_chain[level - 1]) {
                    this.$el.addClass('last-child');
                } else {
                    this.$el.addClass('child');
                }
            } else {
                this.$el.addClass('root');
            }
            
            this.el.setAttribute('data-message-level', data['level']);

            this.$el.html( this.template(data) );
            Ctx.initTooltips(this.$el);
            this.$el.find('>.message-family-arrow>.message').replaceWith(messageView.el);
            
            this.onCollapsedChange();

            Ctx.initClipboard();

            return this;
        },

        events: {
            'click >.message-family-arrow>.link-img': 'onIconbuttonClick'
            //'click >.message-family-container>.message-family-arrow>.link-img': 'onIconbuttonClick',
        },

        /**
         * @event
         * Collapse icon has been toggled
         */
        onIconbuttonClick: function(ev){
            //var collapsed = this.model.get('collapsed');
            //this.model.set('collapsed', !collapsed);

            this.collapsed = !this.collapsed;

            this.onCollapsedChange();
        },
        

        /**
         * @event
         */
        onCollapsedChange: function(){
            var collapsed = this.collapsed,
                target = this.$el,
                children = target.find(">.messagelist-children").last();
            if( collapsed ){
                this.$el.removeClass('message--expanded');
                children.hide();
            } else {
                this.$el.addClass('message--expanded');
                children.show();
            }
        }
    });


    return MessageFamilyView;

});
