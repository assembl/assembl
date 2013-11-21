define(['backbone', 'jquery', 'app'], function(Backbone, $, app){
    'use strict';

    var Router = Backbone.Router.extend({

        routes: {
            "idea/:id" : "idea"
        },

        idea: function(id){
            app.ideaList.ideas.once('reset', function(){

                var idea = app.ideaList.ideas.get(id);
                if( idea ){
                    app.setCurrentIdea(idea);
                }

            });
        }

    });


    return Router;
});