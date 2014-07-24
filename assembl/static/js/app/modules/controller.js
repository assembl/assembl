define(function(require){

    var Marionette = require('marionette'),
           Assembl = require('modules/assembl'),
               Ctx = require('modules/context'),
             Group = require('modules/group'),
                 $ = require('jquery');

    var SegmentList = require('views/segmentList'),
           IdeaList = require('views/ideaList'),
          IdeaPanel = require('views/ideaPanel'),
        MessageList = require('views/messageList'),
          Synthesis = require('models/synthesis'),
     SynthesisPanel = require('views/synthesisPanel'),
               User = require('models/user'),
             navBar = require('views/navBar'),
       Notification = require('views/notification'),
  CollectionManager = require('modules/collectionManager');

    var Controller = Marionette.Controller.extend({

        initialize: function(){
           window.assembl = {};

           var collectionManager = new CollectionManager();
            
            // User
            /**
             * fulfill app.currentUser
             */
            function loadCurrentUser(){
              var user
                if( Ctx.getCurrentUserId() ){
                  user = new User.Model();
                  user.fetchFromScriptTag('current-user-json')
                }
                else {
                  user = new User.Collection().getUnknownUser();
                }
                user.fetchPermissionsFromScripTag();
                Ctx.setCurrentUser(user);
                Ctx.loadCsrfToken(true);
            }
            loadCurrentUser();
            //We only need this here because we still use deprecated access functions
            collectionManager.getAllUsersCollectionPromise();
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

            var resolveGroup = new Group();

            /**
             * end code
             * */

            /*var panels = Ctx.getPanelsFromStorage();
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
                //Ctx.openPanel(assembl.messageList);
            }*/
        },

        idea: function(id){
            Ctx.openPanel(assembl.ideaList);
            collectionManager.getAllIdeasCollectionPromise().done(
                function(allIdeasCollection) {
                  var idea = allIdeasCollection.get(id);
                  if( idea ){
                    Ctx.setCurrentIdea(idea);
                  }
                });
        },

        /**
         * Alias for `idea`
         */
        ideaSlug: function(slug, id){
            return this.idea(slug +'/'+ id);
        },

        message: function(id){
            Ctx.openPanel(assembl.messageList);
            assembl.messageList.showMessageById(id);
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