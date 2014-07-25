define(function(require){

    var SegmentList = require('views/segmentList'),
           IdeaList = require('views/ideaList'),
          IdeaPanel = require('views/ideaPanel'),
        MessageList = require('views/messageList'),
     SynthesisPanel = require('views/synthesisPanel'),
                  $ = require('jquery');


    var groupManager = Marionette.Controller.extend({

        getStorageGroupItem: function(){

           var _defaults = [
               {
                   group:[{type:'idea-list'}, {type:'idea-panel'}, {type:'message'}]
               }
           ];

           if(window.localStorage.getItem('groups')){
               _defaults = window.localStorage.getItem('groups');
           }

           return defaults;
        },

        createGroupItem: function(){
            /**
             * PanelGroupItem Creation
             * */
            var Item = Backbone.Model.extend(),
                Items = Backbone.Collection.extend({
                    model: Item
                });

            var GridItem = Marionette.ItemView.extend({
                template: "#tmpl-item-template",
                initialize: function(options){
                    this.type = options.model.attributes.type;
                },
                onRender: function(){
                    this.$el = this.$el.children();
                    this.$el.unwrap();
                    this.setElement(this.$el);

                    switch(this.type){
                        case 'idea-list':
                            var ideaList =  new IdeaList({
                                el: this.$el
                            });
                            this.$el.append(ideaList.render().el);
                            break;
                        case 'idea-panel':
                            var ideaPanel = new IdeaPanel({
                                el: this.$el
                            });
                            this.$el.append(ideaPanel.render().el);
                            break;
                        case 'message':
                            var messageList = new MessageList({
                                el: this.$el
                            });
                            this.$el.append(messageList.render().el);
                            break;
                        case 'clipboard':
                            var segmentList = new SegmentList({
                                el: this.$el
                            });
                            this.$el.append(segmentList.render().el);
                            break;
                        case 'synthesis':
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
                initialize: function(){

                },
                events:{
                    'click .add-group':'addGroup'
                },
                onRenderTemplate: function(){
                    this.$el.addClass('wrapper-group');
                },
                addGroup: function(){

                    console.log('add group');

                    var Modal = Backbone.Modal.extend({
                        template: _.template($('#tmpl-create-group').html()),
                        cancelEl:'.bbm-button',
                        initialize: function(){
                            this.$el.addClass('group-modal');
                        },

                        events:{
                            'click .itemGroup a':'addToGroup'
                        },

                        addToGroup: function(e){

                            var type = $(e.target).attr('data-item');


                            console.log('add to group', type)
                        }
                    });

                    var modalView = new Modal();

                    $('.modal').html(modalView.render().el);

                }

            });

            var items = this.getStorageGroupItem();

            var groups = new Items(items.group);

            return new Grid({
                collection: groups
            });

        },

        getGroupItem: function(){

            var groups = this.createGroupItem();

            groups.forEach(function(group){

                $('#panelarea').append(group.render().el);

            });
        }
    });


    return new groupManager();

});