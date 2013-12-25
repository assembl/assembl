define(['backbone', 'jquery', 'app'], function(Backbone, $, app){
    'use strict';

    var Router = Backbone.Router.extend({

        /**
         * Router strings
         * @type {Object}
         */
        routes: {
            "": "home",
            "idea/:id" : "idea",
            "idea/:slug/:id" : "ideaSlug",
            "message/:id": "message",
            "message/:slug/:id" : "messageSlug"
        },

        /**
         * Router for Idea
         * @param  {Number} id
         */
        idea: function(id){
            app.openPanel( app.ideaList );
            var idea = app.ideaList.ideas.get(id);
            if( idea ){
                app.setCurrentIdea(idea);
            }
        },

        /**
         * Alias for `idea`
         */
        ideaSlug: function(slug, id){
            return this.idea(slug +'/'+ id);
        },

        /**
         * Router for Message
         * @param  {Number} id
         */
        message: function(id){
            app.openPanel( app.messageList );
            app.messageList.messages.once('reset', function(){
                app.messageList.showMessageById(id);
            });
        },

        /**
         * Alias for `message`
         */
        messageSlug: function(slug, id){
            return this.message(slug +'/'+ id);
        },

        /**
         * Default home page
         */
        home: function(){
            var panels = app.getPanelsFromStorage();
            _.each(panels, function(value, name){
                var panel = app[name];
                if( panel && name !== 'ideaPanel' ){
                    app.openPanel(panel);
                }
            });
        }

    });


    return Router;
});
