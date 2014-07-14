define(['backbone', 'underscore', 'jquery', 'modules/context', 'models/idea', 'app', 'views/idea'],
function(Backbone, _, $, Ctx, Idea, app, IdeaView){
    'use strict';
    
    var AllMessagesInIdeaListView = IdeaView.extend({
        /**
         * The template
         * @type {[type]}
         */
        template: Ctx.loadTemplate('allMessagesInIdeaList'),

        /**
         * The render
         */
        render: function(){
            app.trigger('render');
            Ctx.cleanTooltips(this.$el);
            var data = this.model.toJSON();

            this.$el.addClass('idealist-item');
            if(this.model.get('num_posts') == 0) {
                this.$el.addClass('hidden');
            }
            else {
                this.$el.removeClass('hidden');
            }
            
            this.$el.html(this.template(data));
            Ctx.initTooltips(this.$el);
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
            if( assembl.messageList ){
                assembl.messageList.filterThroughPanelLock(function(){
                    assembl.messageList.showAllMessages();
                }, 'syncWithCurrentIdea');
            }
            Ctx.setCurrentIdea(null);
        }
    });


    return AllMessagesInIdeaListView;
});
