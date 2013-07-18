define(['backbone', 'underscore', 'zepto', 'app', 'views/messageListItem', 'models/message'],
function(Backbone, _, $, app, MessageListItem, Message){
    'use strict';

    var MIN_TEXT_TO_TOOLTIP = 17;

    /**
     * @class views.MessageList
     */
    var MessageList = Backbone.View.extend({
        /**
         *  @init
         */
        initialize: function(obj){
            if( obj.button ){
                this.button = $(obj.button).on('click', app.togglePanel.bind(window, 'messageList'));
            }

            this.messages.on('reset', this.render, this);
        },

        /**
         * Flag wether it is being selected or not
         * @type {Boolean}
         */
        isSelecting: false,

        /**
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('messageList'),

        /**
         * The view's data
         * @type {Object}
         */
        data: {},

        /**
         * The collection
         * @type {MessageCollection}
         */
        messages: new Message.Collection(),

        /**
         * The render function
         * @return {views.Message}
         */
        render: function(){
            var list = document.createDocumentFragment(),
                messages = this.messages.where({parentId: null});

            _.each(messages, function(message){
                var messageListItem = new MessageListItem({model:message});
                list.appendChild(messageListItem.render().el);
            });

            var data = {
                inbox: this.data.inbox,
                total: this.data.total,
                startIndex: this.data.startIndex,
                endIndex: this.data.endIndex
            };

            this.$el.html( this.template(data) );
            this.$('.idealist').append( list );

            return this;
        },

        /**
         * Blocks the panel
         */
        blockPanel: function(){
            this.$('.panel').addClass('is-loading');
        },

        /**
         * Load the data
         */
        loadData: function(){
            var that = this;
            this.blockPanel();

            $.getJSON(this.messages.url, {}, function(data){
                that.data = data;
                that.messages.reset(data.messages);
            });
        },

        /**
         * Shows the selection tooltip
         * @param  {number} x
         * @param  {number} y
         * @param  {string} text
         */
        showTooltip: function(x, y, text){
            var marginLeft = app.selectionTooltip.width() / -2,
                segment = text;

            text = '...' + text.substr( - MIN_TEXT_TO_TOOLTIP );

            app.selectionTooltip
              .show()
              .attr('data-segment', segment)
              .text(text)
              .css({ top: y, left: x, 'margin-left': marginLeft });
        },

        /**
         * Hide the selection tooltip
         */
        hideTooltip: function(){
            app.selectionTooltip.hide();
        },

        /**
         * Close the panel
         */
        closePanel: function(){
            if( this.button ){
                this.button.trigger('click');
            }
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'mousedown .message': 'startSelection',
            'mousemove .message': 'doTheSelection',
            'mouseup .message': 'stopSelection',

            'click #message-closeButton': 'closePanel'
        },

        /**
         * @event
         */
        startSelection: function(ev){
            this.hideTooltip();
            this.isSelecting = true;
        },

        /**
         * @event
         */
        doTheSelection: function(ev){
            if( ! this.isSelecting ){
                return;
            }

            var selectedText = app.getSelectedText(),
                text = selectedText.getRangeAt(0).cloneContents();

            text = text.textContent || '';

            if( text.length > MIN_TEXT_TO_TOOLTIP ){
                this.showTooltip(ev.clientX, ev.clientY, text);
            }
        },

        /**
         * @event
         */
        stopSelection: function(ev){
            this.isSelecting = false;
        }

    });

    return MessageList;
});
