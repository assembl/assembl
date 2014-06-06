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
         * The render
         */
        render: function(){
            app.trigger('render');
            app.cleanTooltips(this.$el);
            
            var data = this.model.toJSON();

            this.$el.addClass('idealist-item');
            if(this.model.get('num_synthesis_posts') == 0) {
                this.$el.addClass('hidden');
            }
            else {
                this.$el.removeClass('hidden');
            }
            
            this.$el.html(this.template(data));
            app.initTooltips(this.$el);
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
            if( app.messageList ){
                app.messageList.filterThroughPanelLock(function(){
                    app.messageList.addFilterIsSynthesMessage();
                }, 'syncWithCurrentIdea');
            }
            app.setCurrentIdea(null);
        }
    });


    return SynthesisIdeaView;
});
