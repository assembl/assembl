define(['backbone', 'underscore', 'jquery', 'app', 'i18n', 'permissions'],
function(Backbone, _, $, app, i18n, Permissions){
    'use strict';

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
         * A locked panel will not react to external UI state changes, such as 
         * selecting a new current idea.
         */
        panelIsLocked: false,
        
        /**
         *  @init
         */
        initialize: function(){
            var that = this;
            this.lockButton = this.button.find('.lock-button');
            this.lockButton.on('click', function(event){
                    that.onLockButtonClick(event);
                });
        },
        /**
         * The events
         * @type {Object}
         */
        events: function() {
            var data = {
                    
            }
            return data;
        },
        
        /**
         * Toggle the lock state of the panel
         */
        toggleLock: function(){
            this.panelIsLocked = !this.panelIsLocked;
            this.renderPanelButton();
            //TODO: This is not optimal if we have no event queued
            //this.render();
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
            var anchor = this.button.find('.lock-anchor');
            if(this.panelIsLocked){
                anchor.addClass('icon-lock');
                anchor.removeClass('icon-lock-open');
            }
            else {
                anchor.addClass('icon-lock-open');
                anchor.removeClass('icon-lock');
            }
        },
        
        /**
         * Blocks the panel
         */
        blockPanel: function(){
            this.$('.panel').addClass('is-loading');
        },

        /**
         * Unblocks the panel
         */
        unblockPanel: function(){
            this.$('.panel').removeClass('is-loading');
        },

        /**
         * Sets the panel as full screen
         */
        setFullscreen: function(){
            app.setFullscreen(this);
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
