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
            if(app.openedPanels < 1) {
                /* If no panel would be opened on load, open the table of ideas
                 * and the Message panel so the user isn't presented with a 
                 * blank screen
                 */
                app.openPanel(app.ideaList);
                app.openPanel(app.messageList);
            }
        }

    });


    return Router;
});
