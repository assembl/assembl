define(function(require){
    'use strict';

    var Backbone = require('backbone'),
              _  = require('underscore'),
             Ctx = require('modules/context');

    /**
     * Constants
     */

    /**
     * @class views.Panel
     */
    var Panel = Backbone.View.extend({
        /**
         * The button in the top menubar for this panel.  Filled by initialize
         * of derived classes
         */
        button: null,
        
        /**
         *  @init
         */
        initialize: function(){
            var that = this;

            //FIXME: need to move in groupItem
            //this.lockButton = this.button.find('.lock-button');

            // TODO ghourlier: listenTo breaks the lock. Try to see why?
            // There's an error without the following line at least:
            // _.extend(this.lockButton, Backbone.Events);
            // but it still does not work.
            //this.listenTo(this.lockButton, 'click', function(event){
            /*this.lockButton.on('click', function(event){
                    that.onLockButtonClick(event);
            });*/
        },
        /**
         * The events
         * @type {Object}
         */
        events: function() {

        },

        
        /**
         * @event
         */
        onLockButtonClick: function(ev){
            if( ev ){
                //Prevent the panel button below the lock from being triggered
                ev.stopPropagation();
            }
            this.toggleLock();
        },
        
        /**
         * Render the button
         */
        renderPanelButton: function(){
            /*var anchor = this.button.find('.lock-anchor');
            if(this.panelIsLocked){
                anchor.addClass('icon-lock');
                anchor.removeClass('icon-lock-open');
            }
            else {
                anchor.addClass('icon-lock-open');
                anchor.removeClass('icon-lock');
            }*/
        },

        /**
         * Sets the panel as full screen
         */
        setFullscreen: function(){
            Ctx.setFullscreen(this);
        },

        /**
         * Close the panel
         */
        closePanel: function(){
            if( this.button ){
                this.button.trigger('click');
            }
        }

    });

    return Panel;
});
