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
            data['level'] = this.currentLevel !== null ? this.currentLevel : this.model.getLevel();
            data['last_sibling_chain'] = this.last_sibling_chain;
            data['hasChildren'] = this.hasChildren;

            this.el.setAttribute('data-message-level', data['level']);

            if( data.collapsed ){
                this.$el.addClass('message--collapsed');
            } else {
                this.$el.removeClass('message--collapsed');
            }
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
                children = this.$el.find('>.messagelist-content>.messagelist-children');
            }

            this.$el.html( this.template(data) );

            if (children !== undefined && children.length == 1) {
                this.$el.find('>.messagelist-content>.messagelist-children').replaceWith(children);
            }

            app.initClipboard();

            return this;
        },

        /**
         * Returns all children rendered
         * @param {Number} parentLevel
         * @return {Array<HTMLDivElement>}
         */
        getRenderedChildren: function(parentLevel){
            var children = this.model.getChildren(),
                num_last_child = children.length - 1,
                chain_t = this.last_sibling_chain.slice(),
                chain_f = this.last_sibling_chain.slice(),
                last_chain_elem = this.last_sibling_chain.length,
                ret = [];

            chain_t.push(true);
            chain_f.push(false);
            _.each(children, function(message, i){
                message.set('level', parentLevel + 1);
                var chain = (i == num_last_child)?chain_t:chain_f;

                var messageView = new MessageView({model:message}, chain);
                ret.push( messageView.render().el );
            });
            this.hasChildren = (children.length > 0);

            return ret;
        },

        /**
         * Returns all children recursively rendered
         * @param {Number} parentLevel
         * @return {Array<HTMLDivElement>}
         */
        getRenderedChildrenInCascade: function(parentLevel){
            var children = this.model.getChildren(),
                num_last_child = children.length - 1,
                chain_t = this.last_sibling_chain.slice(),
                chain_f = this.last_sibling_chain.slice(),
                last_chain_elem = this.last_sibling_chain.length,
                ret = [];

            chain_t.push(true);
            chain_f.push(false);
            _.each(children, function(message, i){
                message.set('level', parentLevel + 1);
                var chain = (i == num_last_child)?chain_t:chain_f;

                var messageView = new MessageView({model:message}, chain);
                ret.push( messageView.render().el );
                // TODO maparent: fix this.  This does not work anymore.
                var grandChildren = messageView.getRenderedChildrenInCascade();
                ret = _.union(ret, grandChildren);
            });
            this.hasChildren = (children.length > 0);

            return ret;
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
        sendMessage: function(ev){
            var btn = $(ev.currentTarget),
                url = app.getApiUrl('posts'),
                data = {},
                that = this,
                btn_original_text = btn.text();

            data.message = this.$('.message-textarea').val();
            if( this.model.getId() ){
                data.reply_id = this.model.getId();
            }

            btn.text( i18n.gettext('Sending...') );

            $.ajax({
                type: "post",
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: url,
                success: function(){
                    btn.text(btn_original_text);
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
            'click >.messagelist-widgets>.messagelist-arrow': 'onIconbuttonClick',
            'click .message-title': 'onMessageTitleClick',

            //
            'click .message-replybox-openbtn': 'openReplyBox',
            'click .message-cancelbtn': 'closeReplyBox',
            'click .message-sendbtn': 'sendMessage',

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
        onMessageTitleClick: function(ev){
            if( ev ){
                // Avoiding collapse if clicked on the link
                if( ev.target.id === 'message-linkbutton' ){
                    return;
                }
            }
            app.messageList.addFilterByPostId(this.model.getId());
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
            var children = this.$el.find('>.messagelist-content>.messagelist-children');
            if( collapsed ){
                this.$el.addClass('message--collapsed');
                children.hide();
            } else {
                this.$el.removeClass('message--collapsed');
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
            this.model.set('read', false);
            //this.model.save();
        }
    });


    return MessageView;

});
