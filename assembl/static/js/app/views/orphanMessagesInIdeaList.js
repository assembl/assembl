define(function(require){
    'use strict';

    var Ctx = require('modules/context'),
        app = require('app'),
   IdeaView = require('views/idea');

    var OrphanMessagesInIdeaListView = IdeaView.extend({
        /**
         * The template
         * @type {[type]}
         */
        template: Ctx.loadTemplate('orphanMessagesInIdeaList'),

        /**
         * The render
         */
        render: function(){
            app.trigger('render');
            Ctx.cleanTooltips(this.$el);
            var data = this.model.toJSON();

            this.$el.addClass('idealist-item');
            if(this.model.get('num_orphan_posts') == 0) {
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
                    assembl.messageList.addFilterIsOrphanMessage();
                }, 'syncWithCurrentIdea');
            }
            Ctx.setCurrentIdea(null);
        }
    });


    return OrphanMessagesInIdeaListView;
});
