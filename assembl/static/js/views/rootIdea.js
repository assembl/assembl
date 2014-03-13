define(['backbone', 'underscore', 'jquery', 'models/idea', 'app', 'views/idea'],
function(Backbone, _, $, Idea, app, IdeaView){
    'use strict';
    
    var RootIdeaView = IdeaView.extend({
        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('rootIdea'),

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
                app.messageList.showAllMessages();
            }
        }
    });


    return RootIdeaView;
});
