define(function(require){
    'use strict';

        var Assembl = require('modules/assembl'),
                  $ = require('jquery'),
                  _ = require('underscore'),
            Storage = require('objects/storage'),
       GroupContent = require('views/groups/groupContent');

    var groupManager = Marionette.Controller.extend({

        initialize: function(){
           this.stateButton = null;
        },
        /**
         * A locked panel will not react to external UI state changes, such as
         * selecting a new current idea.
         */
        _groupIsLocked: false,

        _unlockCallbackQueue: {},

        isGroupLocked: function(){
          return this._groupIsLocked;
        },

        /**
         * Process a callback that can be inhibited by panel locking.
         * If the panel is unlocked, the callback will be called immediately.
         * If the panel is locked, visual notifications will be shown, and the
         * callback will be memorized in a queue, removing duplicates.
         * Callbacks receive no parameters.
         * If queued, they must assume that they can be called at a later time,
         * and have the means of getting any updated information they need.
         */
        filterThroughPanelLock: function(callback, queueWithId){
            if (!this._groupIsLocked){
                callback();

            } else {
                if(queueWithId){
                    if(this._unlockCallbackQueue[queueWithId]!==undefined){
                    }
                    else{
                       this._unlockCallbackQueue[queueWithId]=callback;
                    }
                }
            }
        },

        /**
         * lock the panel if unlocked
         */
        lockGroup: function(){
            if(!this._groupIsLocked){
                this._groupIsLocked = true;
                console.log(this.stateButton);
                this.stateButton.addClass('icon-lock').removeClass('icon-lock-open');
            }
        },

        /**
         * unlock the panel if locked
         */
        unlockGroup: function(){
            if(this._groupIsLocked){
                this._groupIsLocked = false;
                this.stateButton.addClass('icon-lock-open').removeClass('icon-lock');

                if(_.size(this._unlockCallbackQueue) > 0) {
                    //console.log("Executing queued callbacks in queue: ",this.unlockCallbackQueue);
                    _.each(this._unlockCallbackQueue, function(callback){
                        callback();
                    });
                    //We presume the callbacks have their own calls to render
                    //this.render();
                    this._unlockCallbackQueue = {};
                }

            }
        },

        /**
         * Toggle the lock state of the panel
         */
        toggleLock: function(){
            if(this._panelIsLocked){
                this.unlockPanel();
            } else {
                this.lockPanel();
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
         * Create a group of panels and store in localStorage
         * */
        createGroupItem: function(items){
            var data = [],
                collection = [],
                groups = {},
                store = window.localStorage,
                that = this;

            //FIXME: viewId need to be uniq to delete the right storage group

            if(items.length){
                items.forEach(function(item){
                   var i = {};
                     i.type = item;

                   data.push(i);
                });
            }

            groups.group = data;

            if(!store.getItem('groupItems')){

                collection.push(groups);
                store.setItem('groupItems', JSON.stringify(collection));

            } else {

                var groupOfItems = JSON.parse(store.getItem('groupItems'));
                groupOfItems.push(groups);

                store.removeItem('groupItems');
                store.setItem('groupItems', JSON.stringify(groupOfItems));
            }

            that.getGroupItem();

            setTimeout(function(){

                that.scrollToRight();

            }, 2000);

        },

        getStorageGroupItem: function(){
           var data = null,
               store = window.localStorage;

           if(!store.getItem('groupItems')){

               var defaults = [
                   {
                       group:[
                           {type:'idea-list'},
                           {type:'idea-panel'},
                           {type:'message'}
                       ]
                   }
               ];

               //Set default group
               store.setItem('groupItems', JSON.stringify(defaults));

               data = JSON.parse(store.getItem('groupItems'));

           } else {

              data = JSON.parse(store.getItem('groupItems'));
           }

           return data;
        },

        /**
         * Wrapper CompositeView for a group
         * */
        createViewGroupItem: function(collection){
            var that = this;

            var groups = new Backbone.Collection(collection);

            return new GroupContent({
                collection: groups
            });
        },

        getGroupItem: function(){
            var items = Storage.getStorageGroupItem(),
                 that = this;
            // insure that the dom is empty before filling
            //$('#panelarea').empty();

            //console.log(items)

            items.forEach(function(item){
               var group = that.createViewGroupItem(item);

               Assembl.groupContainer.show(group);
               //$('#groupContainer').append(group.render().el);
            });
        }

    });

    return new groupManager();

});