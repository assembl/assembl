define(function(require){

    var Marionette = require('marionette'),
           Assembl = require('modules/assembl'),
               Ctx = require('modules/context');

    var SegmentList = require('views/segmentList'),
           IdeaList = require('views/ideaList'),
          IdeaPanel = require('views/ideaPanel'),
        MessageList = require('views/messageList'),
          Synthesis = require('models/synthesis'),
     SynthesisPanel = require('views/synthesisPanel'),
               User = require('models/user'),
             navBar = require('views/navBar'),
       Notification = require('views/notification');

    var Controller = Marionette.Controller.extend({

        initialize: function(){
            var $w = window.assembl = {};

            // User
            $w.users = new User.Collection();
            $w.users.on('reset', Ctx.loadCurrentUser());
            $w.users.fetchFromScriptTag('users-json');

            // The order of these initialisations matter...
            // Segment List
            //$w.segmentList = new SegmentList({el: '#segmentList', button: '#button-segmentList'});
            //$w.segmentList.segments.fetchFromScriptTag('extracts-json');

            // Idea list
            //$w.ideaList = new IdeaList({el: '#ideaList', button: '#button-ideaList'});

            // Idea panel
            //$w.ideaPanel = new IdeaPanel({el: '#ideaPanel', button: '#button-ideaPanel'}).render();

            // Message
            //$w.messageList = new MessageList({el: '#messageList', button: '#button-messages'}).render();
            //$w.messageList.messages.fetch({reset:true});

            // Synthesis
            //$w.syntheses = new Synthesis.Collection();
            //var nextSynthesisModel = new Synthesis.Model({'@id': 'next_synthesis'});
            //nextSynthesisModel.fetch();

            /*$w.syntheses.add(nextSynthesisModel);
            $w.synthesisPanel = new SynthesisPanel({
                el: '#synthesisPanel',
                button: '#button-synthesis',
                model: nextSynthesisModel
            });*/

            //$w.ideaList.ideas.fetchFromScriptTag('ideas-json');

            //init notification bar
            //var notification = new Notification();

            /*Assembl.vent.on('setLocale', function(locale){

                console.log('setLocale', locale);

            })*/


        },

        /**
         * Load the default view
         * */
        home: function(){
            console.log("home controller");

            Assembl.headerRegions.show(new navBar());

            if(!window.localStorage.getItem('showNotification')){
                Assembl.notificationRegion.show(new Notification());
            }

            /**
             * PanelGroupItem Creation
             * */

            var Item = Backbone.Model.extend();
            var Items = Backbone.Collection.extend({
                model: Item
            });

            var GridItem = Marionette.ItemView.extend({
                template: "#tmpl-item-template",
                tagName: 'div',
                className: 'span2',
                initialize: function() {

                    console.log('GridItem', this.model)

                }
            });

            var GridRow = Marionette.CompositeView.extend({
                template: "#tmpl-row-template",
                childView: GridItem,
                childViewContainer: "div.row-fluid",
                initialize: function() {
                    this.collection = new Backbone.Collection(_.toArray(this.model.attributes));

                    console.log('GridRow', this.collection)
                },
                onRender: function(){
                    // Unwrap the element to prevent infinitely
                    this.$el = this.$el.children();
                    this.$el.unwrap();
                    this.setElement(this.$el);
                }
            });

            var Grid = Marionette.CompositeView.extend({
                template: "#tmpl-grid-template",
                childView: GridRow,
                childViewContainer: "section",
                initialize: function() {
                    var grid = this.collection.groupBy(function(list, iterator) {
                        return Math.floor(iterator / 4); // 4 == number of columns
                    });

                    this.collection = new Backbone.Collection(_.toArray(grid));
                },

                onRender: function(){


                }
            });

            var Data = [
                {type: 'ideaList'},
                {type: 'ideaPanel'},
                {type: 'message'},
                {type: 'clipboard'}
            ];

            var items = new Items(Data);

            var grid = new Grid({
                collection: items
            });

            Assembl.panelGroupControl.show(grid);

            /**
             * end code
             * */

           /* var panels = Ctx.getPanelsFromStorage();
            _.each(panels, function(value, name){
                var panel = assembl[name];
                if( panel && name !== 'ideaPanel' ){
                    Ctx.openPanel(panel);
                }
            });
            if(assembl.openedPanels < 1) {
                /* If no panel would be opened on load, open the table of ideas
                 * and the Message panel so the user isn't presented with a
                 * blank screen

                Ctx.openPanel(assembl.ideaList);
                Ctx.openPanel(assembl.messageList);
            } */
        },

        idea: function(id){
            Ctx.openPanel(assembl.ideaList);
            var idea = assembl.ideaList.ideas.get(id);
            if( idea ){
                Ctx.setCurrentIdea(idea);
            }
        },

        /**
         * Alias for `idea`
         */
        ideaSlug: function(slug, id){
            return this.idea(slug +'/'+ id);
        },

        message: function(id){
            Ctx.openPanel(assembl.messageList);
            assembl.messageList.messages.once('reset', function(){
                assembl.messageList.showMessageById(id);
            });
        },

        /**
         * Alias for `message`
         */
        messageSlug: function(slug, id){
            return this.message(slug +'/'+ id);
        }

    });

    return new Controller();

});