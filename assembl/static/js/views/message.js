define(['backbone', 'underscore', 'jquery', 'app'],
function(Backbone, _, $, app){
    'use strict';

    var MIN_TEXT_TO_TOOLTIP = 17;

    /**
     * @class views.Message
     */
    var Message = Backbone.View.extend({
        /**
         * Flag wether it is being selected or not
         * @type {Boolean}
         */
        isSelecting: false,

        /**
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('message'),

        /**
         * The render function
         * @return {views.Message}
         */
        render: function(){
            this.$el.html( this.template() );
            return this;
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
         * The events
         * @type {Object}
         */
        events: {
            'mousedown .message-body': 'startSelection',
            'mousemove .message-body': 'doTheSelection',
            'mouseup .message-body': 'stopSelection'
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

            text = text.firstChild ? text.firstChild.textContent : '';

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

    return Message;
});