define(function(require){
    'use strict';

    var Marionette = require('marionette'),
           Assembl = require('modules/assembl'),
               Ctx = require('modules/context'),
      groupManager = require('modules/groupManager'),
              User = require('models/user'),
            navBar = require('views/navBar'),
       contextPage = require('views/contextPage'),
      Notification = require('views/notification'),
 CollectionManager = require('modules/collectionManager');

    var routeController = Marionette.Controller.extend({

        initialize: function(){
           window.assembl = {};

           var collectionManager = new CollectionManager();
            /**
             * fulfill app.currentUser
             */
            function loadCurrentUser(){
              var user;
                if( Ctx.getCurrentUserId() ){
                  user = new User.Model();
                  user.fetchFromScriptTag('current-user-json');
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
            Assembl.headerRegions.show(new navBar());

            if(!window.localStorage.getItem('showNotification')){
               $('#wrapper #groupContainer').css('top', '76px');
               Assembl.notificationRegion.show(new Notification());
            }
            /**
             * Render the current group of views
             * */
            groupManager.getGroupItem();
        },

        contextPage: function(){
          Assembl.headerRegions.show(new navBar());

          var cp = new contextPage({});
          $('#panelarea').append( cp.render().el );
        },

        idea: function(id){
            //Ctx.openPanel(assembl.ideaList);
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
            //TODO: add new behavior to show messageList Panel
            //Ctx.openPanel(assembl.messageList);
            Assembl.vent.trigger('messageList:showMessageById', id);
        },

        /**
         * Alias for `message`
         */
        messageSlug: function(slug, id){
            return this.message(slug +'/'+ id);
        }

    });

    return new routeController();

});