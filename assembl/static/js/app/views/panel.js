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
         * A locked panel will not react to external UI state changes, such as 
         * selecting a new current idea.
         */
        panelIsLocked: false,
        
        unlockCallbackQueue: {},
        
        /**
         *  @init
         */
        initialize: function(){
            var that = this;
            this.lockButton = this.button.find('.lock-button');
            // TODO ghourlier: listenTo breaks the lock. Try to see why?
            // There's an error without the following line at least:
            // _.extend(this.lockButton, Backbone.Events);
            // but it still does not work.
            //this.listenTo(this.lockButton, 'click', function(event){
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
         * Process a callback that can be inhibited by panel locking.
         * If the panel is unlocked, the callback will be called immediately.
         * If the panel is locked, visual notifications will be shown, and the
         * callback will be memorized in a queue, removing duplicates.
         * Callbacks receive no parameters.
         * If queued, they must assume that they can be called at a later time,
         * and have the means of getting any updated information they need.
         * 
         *
         */
        filterThroughPanelLock: function(callback, queueWithId){
            if (!this.panelIsLocked){
                callback();
            }
            else{
                var lockButton = this.button.highlight();//.find('.lock-anchor');
                if(queueWithId){
                    if(this.unlockCallbackQueue[queueWithId]!==undefined){
                    }
                    else{
                         this.unlockCallbackQueue[queueWithId]=callback;
                    }
                }
            }
        },
        
        /**
         * Toggle the lock state of the panel
         */
        toggleLock: function(){
            if(this.panelIsLocked){
                this.unlockPanel();
            } else {
                this.lockPanel();
            }
        },
        /**
         * lock the panel if unlocked
         */
        lockPanel: function(){
           if(!this.panelIsLocked){
               this.panelIsLocked = true;
               this.renderPanelButton();
           }
        },

        /**
         * unlock the panel if locked
         */
        unlockPanel: function(){
           if(this.panelIsLocked){
               this.panelIsLocked = false;
               this.renderPanelButton();
               if(_.size(this.unlockCallbackQueue) > 0) {
                   //console.log("Executing queued callbacks in queue: ",this.unlockCallbackQueue);
                   _.each(this.unlockCallbackQueue, function(callback){
                       callback();
                   });
                   //We presume the callbacks have their own calls to render
                   //this.render();
                   this.unlockCallbackQueue = {};
               }
               
           }
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
