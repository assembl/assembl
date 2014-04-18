define(['backbone', 'underscore', 'jquery', 'models/idea', 'app', 'views/idea'],
function(Backbone, _, $, Idea, app, IdeaView){
    'use strict';

    var SynthesisIdeaView = IdeaView.extend({
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
            if( app.messageList ){
                app.messageList.addFilterIsSynthesMessage();
            }
            app.setCurrentIdea(null);
        }
    });


    return SynthesisIdeaView;
});
