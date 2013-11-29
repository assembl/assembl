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
            "message/:id" : "message"
        },

        /**
         * Router for Idea
         * @param  {Number} id
         */
        idea: function(id){
            app.openPanel( app.ideaList );
            app.ideaList.ideas.once('reset', function(){

                var idea = app.ideaList.ideas.get(id);
                if( idea ){
                    app.setCurrentIdea(idea);
                }

            });
        },

        /**
         * Router for Message
         * @param  {Number} id
         */
        message: function(id){
            app.openPanel( app.messageList );
            app.messageList.loadThreadById(id);
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

            app.messageList.loadData();
        }

    });


    return Router;
});
