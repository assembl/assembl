define(function(require){

    var SegmentList = require('views/segmentList'),
           IdeaList = require('views/ideaList'),
          IdeaPanel = require('views/ideaPanel'),
        MessageList = require('views/messageList'),
          Synthesis = require('models/synthesis'),
     SynthesisPanel = require('views/synthesisPanel'),
               User = require('models/user'),
                Ctx = require('modules/context'),
               Idea = require('models/idea'),
           IdeaLink = require('models/ideaLink'),
                  $ = require('jquery'),
            Message = require('views/message');

   function _createGroupItem(collection){
       /**
        * PanelGroupItem Creation
        * */
       var Item = Backbone.Model.extend(),
           Items = Backbone.Collection.extend({
           model: Item
       });

       var GridItem = Marionette.ItemView.extend({
           template: "#tmpl-item-template",
           //className: 'panelItem',
           initialize: function(options){
               this.type = options.model.attributes.type;
           },
           onRender: function(){
               this.$el = this.$el.children();
               this.$el.unwrap();
               this.setElement(this.$el);

               switch(this.type){
                   case 'idea-list':
                       console.log('idea-list');
                       this.ideas = new Idea.Collection();
                       var ideaList =  new IdeaList({
                           ideas: this.ideas,
                           ideaLinks: new IdeaLink.Collection()
                       });
                       ideaList.ideas.fetchFromScriptTag('ideas-json');
                       this.$el.append(ideaList.render().el);

                       console.log('wrapper', this.$el);

                       break;
                   case 'idea-panel':
                       console.log('idea-panel');
                       this.ideas = new Idea.Collection();
                       var ideaPanel = new IdeaPanel({
                           ideas: this.ideas
                       });

                       this.$el.append(ideaPanel.render().el);
                       break;
                   case 'message':
                       console.log('message');

                       var segmentList = new SegmentList();
                       segmentList.segments.fetchFromScriptTag('extracts-json');

                       var messageList = new MessageList({
                           segmentList: segmentList
                       });
                       messageList.messages.fetch({
                           reset:true
                       });

                       /*var message = new Message({
                           messageList: messageList
                       })*/

                       this.$el.append(messageList.render().el);

                       break;
                   case 'clipboard':
                       console.log('clipboard');

                       var segmentList = new SegmentList();
                       segmentList.segments.fetchFromScriptTag('extracts-json');
                       this.$el.append(segmentList.render().el);
                       break;
                   case 'synthesis':
                       console.log('synthesis');
                       /*window.assembl.syntheses = new Synthesis.Collection();
                       var nextSynthesisModel = new Synthesis.Model({'@id': 'next_synthesis'});
                       nextSynthesisModel.fetch();
                       assembl.syntheses.add(nextSynthesisModel);
                       view = new SynthesisPanel({
                           el: '#synthesisPanel',
                           button: '#button-synthesis',
                           model: nextSynthesisModel
                       }) */
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
           onRenderTemplate: function(){
               this.$el.css('height', '100%');
               this.$el.css('display', 'inline-block');
           }
       });

       var items = new Items(collection.group);

       return new Grid({
           collection: items
       });
   }

   return function(){

       if(window.localStorage){

       }

       var Data = [
           {
               group:[
                   {type:'idea-list'},
                   {type:'idea-panel'},
                   {type:'message'}
               ]
           },
           {
               group:[
                   {type:'idea-list'},
                   {type:'idea-panel'},
                   {type:'message'}
               ]
           }
       ];

       Data.forEach(function(item){

           var group = _createGroupItem(item);

           $('#panelarea').append(group.render().el);

       })

       //$('#group-content').append()

       //return _createGroupItem(Data);
   }

});