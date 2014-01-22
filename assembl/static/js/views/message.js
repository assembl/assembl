define(['backbone', 'underscore', 'moment', 'ckeditor', 'app', 'models/message', 'i18n'],
function(Backbone, _, Moment, ckeditor, app, Message, i18n){
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
         * @param {MessageModel} obj the model
         * @param {Array[boolean]} last_sibling_chain which of the view's ancestors
         *   are the last child of their respective parents.
         */
        initialize: function(obj, last_sibling_chain){
            if ( _.isUndefined(last_sibling_chain)) {
                last_sibling_chain = [];
            }
            this.last_sibling_chain = last_sibling_chain;
            this.model.on('change:collapsed', this.onCollapsedChange, this);
            this.model.on('change:bodyShown', this.onBodyShownChange, this);
            this.model.on('change:isSelected', this.onIsSelectedChange, this);
            this.model.on('replaced', this.onReplaced, this);
        },

        /**
         * The thread message template
         * @type {_.template}
         */
        template: app.loadTemplate('message'),

        /**
         * The lastest annotation created by annotator
         * @type {Annotation}
         */
        currentAnnotation: null,

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
            var data = this.model.toJSON(), children;

            if( ! _.isUndefined(level) ){
                this.currentLevel = level;
            }

            data['id'] = data['@id'];
            data['date'] = app.formatDate(data.date);
            data['creator'] = this.model.getCreator();
            data['level'] = this.currentLevel !== null ? this.currentLevel : 0;
            data['last_sibling_chain'] = this.last_sibling_chain;
            data['hasChildren'] = this.hasChildren;

            this.el.setAttribute('data-message-level', data['level']);

            if( data.bodyShown ){
                this.$el.addClass('message--showbody');
            } else {
                this.$el.removeClass('message--showbody');
            }
            if( data.read ){
                this.$el.removeClass('message--unread');
                this.$el.addClass('message--read');
            } else {
                this.$el.removeClass('message--read');
                this.$el.addClass('message--unread');
            }

            if (this.$el !== undefined) {
                // let's not recalculate the rendered children, shall we?
                children = this.$el.find('>.messagelist-link>.messagelist-children, >.messagelist-children');
            }

            this.$el.html( this.template(data) );

            if (children !== undefined && children.length == 1) {
                this.$el.find('>.messagelist-link>.messagelist-children, >.messagelist-children').replaceWith(children);
            }
            this.onCollapsedChange();

            app.initClipboard();

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
            this.$('.message-replybox-openbtn').hide();
            this.$('.message-replybox').show();

            var that = this;
            window.setTimeout(function(){
                that.$('.message-textarea').focus();
            }, 100);
        },

        /**
         *  Closes the reply box and shows the reply button
         */
        closeReplyBox: function(){
            this.$('.message-replybox-openbtn').show();
            this.$('.message-replybox').hide();
        },
                
        /**
         * Sends the message to the server
         */
        onSendMessageButtonClick: function(ev){
            var btn = $(ev.currentTarget),
                that = this,
                btn_original_text = btn.text(),
                reply_message_id = null,
                message_body = this.$('.message-textarea').val(),
                success_callback = null;


            if( this.model.getId() ){
                reply_message_id = this.model.getId();
            }

            btn.text( i18n.gettext('Sending...') );
            success_callback = function(){
                btn.text(btn_original_text);
                that.closeReplyBox();
            }
            app.sendPostToServer(message_body, null, reply_message_id, null, success_callback)

        },

        /**
         * Shows the options to the selected text
         * @param  {Number} x
         * @param  {Number} y
         */
        showSelectionOptions: function(x, y){
            this.hideTooltip();

            var annotator = this.$el.closest('#messageList-list').data('annotator');
            annotator.onAdderClick.call(annotator);

            if( app.messageList.annotatorEditor ){
                app.messageList.annotatorEditor.element.css({
                    'top': y,
                    'left': x
                });
            }
        },

        events: {
            'click >.messagelist-arrow>.link-img': 'onIconbuttonClick',
            'click >.messagelist-link>.messagelist-arrow>.link-img': 'onIconbuttonClick',
            'click .message-title': 'onMessageTitleClick',
            'click .message-hoistbtn': 'onMessageHoistClick',

            //
            'click .message-replybox-openbtn': 'openReplyBox',
            'click .message-cancelbtn': 'closeReplyBox',
            'click .message-sendbtn': 'onSendMessageButtonClick',

            //
            'mousedown .message-body': 'startSelection',
            'mousemove .message-body': 'doTheSelection',
            'mouseleave .message-body': 'onMouseLeaveMessageBody',
            'mouseenter .message-body': 'doTheSelection',

            // menu
            'click #message-markasunread': 'markAsUnread',
            'click #message-replybtn': 'openReplyBox'
        },

        /**
         * @event
         * Collapse icon has been toggled
         */
        onIconbuttonClick: function(ev){
            var collapsed = this.model.get('collapsed');
            this.model.set('collapsed', !collapsed);
        },
        
        /**
         * @event
         */
        onMessageHoistClick: function(ev){
            app.messageList.addFilterByPostId(this.model.getId());
        },
        
        /**
         * @event
         */
        onMessageTitleClick: function(ev){
            if( ev ){
                // Avoiding collapse if clicked on the link
                if( ev.target.id === 'message-linkbutton' ){
                    return;
                }
            }
            var bodyShown = this.model.get('bodyShown');
            this.model.set('bodyShown', !bodyShown);
            if (!bodyShown) {
                this.model.set('collapsed', false);
            }
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
        },

        /**
         * @event
         */
        onCollapsedChange: function(){
            var collapsed = this.model.get('collapsed');
            var target = this.$el;
            var link = target.find(">.messagelist-link");
            if (link.length == 1) {
                target = link;
            }
            var children = target.find(">.messagelist-children").last();
            if( collapsed ){
                this.$el.removeClass('message--expanded');
                children.hide();
            } else {
                this.$el.addClass('message--expanded');
                children.show();
            }

            //this.render();
        },

        /**
         * @event
         */
        onBodyShownChange: function(){
            var bodyShown = this.model.get('bodyShown'),
                read = this.model.get('read');

            if( bodyShown === true && read === false ){
                this.model.setRead(true);
            }

            this.render();
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
         markAsUnread: function(){
             this.model.setRead(false);
         },
         
         /**
          * Mark the current message as read
          */
         markAsRead: function(){
             this.model.setRead(true);
         }
    });


    return MessageView;

});
