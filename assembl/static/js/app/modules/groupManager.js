define(function(require){
    'use strict';

        var Assembl = require('modules/assembl'),
        SegmentList = require('views/segmentList'),
           IdeaList = require('views/ideaList'),
          IdeaPanel = require('views/ideaPanel'),
        MessageList = require('views/messageList'),
     SynthesisPanel = require('views/synthesisPanel'),
                  $ = require('jquery'),
                  _ = require('underscore');

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
            if(this._groupIsLocked){
                this.unlockGroup();
            } else {
                this.lockGroup();
            }
        },

        scrollToRight: function(){
            var left = $('#panelarea').width();

            $('#panelarea').animate({ scrollLeft: left}, 1000);
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

            var Item = Backbone.Model.extend(),
                Items = Backbone.Collection.extend({
                    model: Item
                });

            var GridItem = Marionette.ItemView.extend({
                template: "#tmpl-item-template",
                initialize: function(options){
                    this.views = options.model.toJSON();
                    this.panelGroup = options.panelGroup;
                },
                onRender: function(){
                    this.$el = this.$el.children();
                    this.$el.unwrap();
                    this.setElement(this.$el);

                    switch(this.views.type){
                        case 'idea-list':
                            this.$el.addClass('ideaList');
                            var ideaList =  new IdeaList({
                                el: this.$el
                            });
                            this.$el.append(ideaList.render().el);
                            break;
                        case 'idea-panel':
                            this.$el.addClass('ideaPanel');
                            var ideaPanel = new IdeaPanel({
                                el: this.$el
                            });
                            this.$el.append(ideaPanel.render().el);
                            break;
                        case 'message':
                            this.$el.addClass('segmentList');
                            var messageList = new MessageList({
                                el: this.$el,
                                panelGroup: this.panelGroup
                            });
                            this.$el.append(messageList.render().el);
                            break;
                        case 'clipboard':
                            this.$el.addClass('messageList');
                            var segmentList = new SegmentList({
                                el: this.$el
                            });
                            this.$el.append(segmentList.render().el);
                            break;
                        case 'synthesis':
                            this.$el.addClass('synthesisPanel');
                            var synthesisPanel = new SynthesisPanel({
                                el: this.$el
                            });
                            this.$el.append(synthesisPanel.render().el);
                            break;
                    }
                }
            });

            var Grid = Marionette.CompositeView.extend({
                template: "#tmpl-grid-template",
                childView: GridItem,
                childViewContainer: ".panelarea-table",
                childViewOptions: {
                   panelGroup: that
                },
                initialize: function(){
                    /**
                     * Need this compositeView id
                     * to identify which localStorage to delete
                     * */
                },
                events:{
                  'click .add-group':'addGroup',
                  'click .close-group':'closeGroup',
                  'click .lock-group':'lockGroupCb'
                },
                onRenderTemplate: function(){
                   this.$el.addClass('wrapper-group');
                   that.stateButton = this.$el.find('.lock-group').children('i');
                },
                addGroup: function(){
                    var self = this;

                    var Modal = Backbone.Modal.extend({
                        template: _.template($('#tmpl-create-group').html()),
                        cancelEl:'.btn-cancel',
                        initialize: function(){
                           this.$el.addClass('group-modal');
                        },
                        events:{
                           'click .js_selectItemGroup':'selectItemGroup',
                           'click .js_createGroup':'createGroup'
                        },
                        selectItemGroup: function(e){
                            var elm  = $(e.target).parent();

                            if(elm.hasClass('ideas')){
                                if($('.itemGroup.synthesis').hasClass('is-selected')){
                                   $('.itemGroup.synthesis').removeClass('is-selected');
                                }
                                elm.addClass('is-selected');

                            } else if(elm.hasClass('synthesis')){
                                if($('.itemGroup.ideas').hasClass('is-selected')){
                                   $('.itemGroup.ideas').removeClass('is-selected')
                                }
                                elm.addClass('is-selected');

                            } else {
                                if(elm.hasClass('is-selected')){
                                    elm.removeClass('is-selected');
                                } else {
                                    elm.addClass('is-selected');
                                }
                            }
                        },
                        createGroup: function(){
                           var items = [];
 
                           $('.itemGroup.is-selected').each(function(){
                               var item = $(this).children('a').attr('data-item');
                               items.push(item);
                           });

                           that.createGroupItem(items);

                           this.$el.unbind();
                           this.$el.remove();
                        }

                    });

                    var modalView = new Modal();

                    $('.modal').html(modalView.render().el);
                },

                closeGroup: function(){

                    //TODO: delete reference to localStorage
                    this.unbind();
                    this.remove();
                },

                lockGroupCb: function(e){
                   that.toggleLock();
                }

            });

            var groups = new Items(collection.group);

            return new Grid({
                collection: groups
            });
        },

        getGroupItem: function(){
            var items = this.getStorageGroupItem(),
                 that = this;
            // insure that the dom is empty before filling
            //$('#panelarea').empty();
            items.forEach(function(item){
               var group = that.createViewGroupItem(item).render().el;
               $('#panelarea').append(group);
            });
        }

    });

    return new groupManager();

});