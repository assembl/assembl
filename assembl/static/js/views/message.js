define(['backbone', 'underscore', 'moment', 'ckeditor', 'app', 'models/message'],
function(Backbone, _, Moment, ckeditor, app, Message){
    'use strict';

    var MIN_TEXT_TO_TOOLTIP = 5,
        TOOLTIP_TEXT_LENGTH = 10;

    /**
     * @class views.MessageView
     */
    var MessageView = Backbone.View.extend({
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
         * @init
         */
        initialize: function(){
            this.model.on('change:collapsed', this.render, this);
        },

        /**
         * The thread message template
         * @type {_.template}
         */
        template: app.loadTemplate('message'),

        /**
         * The render
         * @return {MessageView}
         */
        render: function(){
            var data = this.model.toJSON();

            data['date'] = app.formatDate(data.date);
            data['level'] = this.model.getLevel();
            this.el.setAttribute('data-message-level', data['level']);

            if( data.collapsed ){
                this.$el.addClass('message--collapsed');
            } else {
                this.$el.removeClass('message--collapsed');
            }

            this.$el.html(this.template(data));
            return this;
        },

        /**
         * Hide the selection tooltip
         */
        hideTooltip: function(){
            app.selectionTooltip.hide();
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

            text = text.substr(0, TOOLTIP_TEXT_LENGTH) + '...' + text.substr( - TOOLTIP_TEXT_LENGTH );

            app.selectionTooltip
              .show()
              .attr('data-segment', segment)
              .text(text)
              .css({ top: y, left: x, 'margin-left': marginLeft });
        },

        /**
         *  Opens the reply box and removes the reply button 
         */
        openReplyBox: function(){
            this.$('.message-replaybox-openbtn').hide();
            this.$('.message-replybox').show();
        },

        /**
         *  Closes the reply box and shows the reply button 
         */
        closeReplyBox: function(){
            this.$('.message-replaybox-openbtn').show();
            this.$('.message-replybox').hide();
        },

        /**
         * Sends the message to the server
         */
        sendMessage: function(ev){
            var btn = $(ev.currentTarget),
                url = app.getApiUrl('posts'),
                data = {},
                that = this;

            data.message = this.$('.message-textarea').val();
            if( this.model.get('id') ){
                data.reply_id = this.model.get('id');
            }

            btn.text('Sending...');

            $.ajax({
                type: "post",
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: url,
                success: function(){
                    btn.text('Send');
                    that.closeReplyBox();
                }
            });

        },

        /**
         * Shows the options to the selected text
         * @param  {Number} x
         * @param  {Number} y
         */
        showSelectionOptions: function(x, y){
            var items = {
                'Add to clipboard' : this.contextMenuItem1
            };

            this.hideTooltip();
            app.showContextMenu(x, y, this, items);
        },


        /**
         * CONTEXT MENU
         */
        contextMenuItem1: function(){
            app.segmentList.addTextAsSegment( app.selectionTooltip.attr('data-segment'), this.model.id );
            app.openPanel(app.segmentList);
        },


        events: {
            'click .iconbutton': 'onIconbuttonClick',
            'click .message-title': 'onIconbuttonClick',

            //
            'click .message-replaybox-openbtn': 'openReplyBox',
            'click .message-cancelbtn': 'closeReplyBox',
            'click .message-sendbtn': 'sendMessage',

            //
            'mousedown .message-body': 'startSelection',
            'mousemove .message-body': 'doTheSelection',
            'mouseleave .message-body': 'onMouseLeaveMessageBody',
            'mouseenter .message-body': 'doTheSelection'
        },

        /**
         * @event
         */
        onIconbuttonClick: function(){
            var collapsed = this.model.get('collapsed');
            this.model.set('collapsed', !collapsed);
        },

        /**
         * @event
         * Starts the selection tooltip
         */
        startSelection: function(){
            this.hideTooltip();
            this.isSelecting = true;
            this.$el.addClass('is-selecting');

            var that = this;

            app.doc.one('mouseup', function(ev){
                that.stopSelection(ev);
            });
        },

        /**
         * @event
         * Does the selection
         */
        doTheSelection: function(ev){
            if( ! this.isSelecting ){
                return;
            }

            if( $(ev.target).closest('.is-selecting').length === 0 ){
                // If it isn't inside the one which started, don't show it
                return;
            }

            var selectedText = app.getSelectedText(),
                text = selectedText.getRangeAt(0).cloneContents();

            text = text.textContent || '';

            if( text.length > MIN_TEXT_TO_TOOLTIP ){
                this.showTooltip(ev.clientX, ev.clientY, text);
            } else {
                this.hideTooltip();
            }
        },

        /**
         * @event
         */
        onMouseLeaveMessageBody: function(){
            if( this.isSelecting ){
                this.hideTooltip();
            }
        },

        /**
         * @event
         */
        stopSelection: function(ev){
            var isInsideAMessage = false,
                selectedText = app.getSelectedText(),
                text = selectedText.getRangeAt(0).cloneContents();

            text = text.textContent || '';

            if( ev ){
                isInsideAMessage = $(ev.target).closest('.is-selecting').length > 0;
            }

            if( this.isSelecting && text.length > MIN_TEXT_TO_TOOLTIP && isInsideAMessage ){
                this.showSelectionOptions(ev.clientX - 50, ev.clientY);
            }

            this.isSelecting = false;
            this.$el.removeClass('is-selecting');
        }
    });


    return MessageView;

});
