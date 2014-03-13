define(['backbone', 'underscore', 'jquery', 'models/idea', 'app', 'views/rootIdea'],
function(Backbone, _, $, Idea, app, RootIdeaView){
    'use strict';

    var SynthesisIdeaView = RootIdeaView.extend({
        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('synthesisInIdeaList'),

        /**
         * @events
         */
        events: {
            'click .idealist-title': 'onTitleClick'
        },

        /**
         * @event
         */
        onTitleClick: function(){
            app.setCurrentIdea(this.model);

            if( app.messageList ){
                app.messageList.addFilterIsSynthesMessage();
            }
        }
    });


    return SynthesisIdeaView;
});
