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
         * The render
         */
        render: function(){
            app.trigger('render');

            var data = this.model.toJSON();

            this.$el.addClass('idealist-item');
            this.$el.html(this.template(data));
            return this;
        },

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
