define(function(require){

    var Marionette = require('marionette'),
               App = require('modules/assembl'),
               Ctx = require('modules/context');

    var SegmentList = require('views/segmentList'),
           IdeaList = require('views/ideaList'),
          IdeaPanel = require('views/ideaPanel'),
        MessageList = require('views/messageList'),
          Synthesis = require('models/synthesis'),
     SynthesisPanel = require('views/synthesisPanel'),
               User = require('models/user');


    var Controller = Marionette.Controller.extend({

        initialize: function(){
            var $w = window.assembl = {};

            // User
            $w.users = new User.Collection();
            $w.users.on('reset', Ctx.loadCurrentUser());
            $w.users.fetchFromScriptTag('users-json');

            // The order of these initialisations matter...
            // Segment List
            $w.segmentList = new SegmentList({el: '#segmentList', button: '#button-segmentList'});

            // Idea list
            $w.ideaList = new IdeaList({el: '#ideaList', button: '#button-ideaList'});

            // Idea panel
            $w.ideaPanel = new IdeaPanel({el: '#ideaPanel', button: '#button-ideaPanel'});

            // Message
            $w.messageList = new MessageList({el: '#messageList', button: '#button-messages'}).render();
            $w.messageList.messages.fetch({reset:true});

            // Synthesis
            $w.syntheses = new Synthesis.Collection();
            var nextSynthesisModel = new Synthesis.Model({'@id': 'next_synthesis'});
            nextSynthesisModel.fetch();
            $w.syntheses.add(nextSynthesisModel);
            $w.synthesisPanel = new SynthesisPanel({
                el: '#synthesisPanel',
                button: '#button-synthesis',
                model: nextSynthesisModel
            });

            // Fetching the ideas
            $w.segmentList.segments.fetchFromScriptTag('extracts-json');
            $w.ideaList.ideas.fetchFromScriptTag('ideas-json');
        },

        /**
         * Load the default view
         * */
        home: function(){

            console.log('Controller:home');

            //var ideaList = new IdeaList({el: '#ideaList', button: '#button-ideaList'});
            //App.ideaListRegion.show(new MessageTest());

            /*var messages = new Message.Collection();
            var messageList = new MessageList({
                messages: messages,
                el: '#messageList',
                button: '#button-messages'
            });

            messages.fetch({
                reset:true
            });*/

            //App.messagesRegion.show(messageList);

        },

        idea: function(id){
            Ctx.openPanel( app.ideaList );
            var idea = app.ideaList.ideas.get(id);
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
            Ctx.openPanel( app.messageList );
            app.messageList.messages.once('reset', function(){
                app.messageList.showMessageById(id);
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