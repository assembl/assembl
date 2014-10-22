define(function (require) {
    'use strict';

    var Assembl = require('app/app'),
        Ctx = require('app/modules/context'),
        IdeaView = require('app/views/idea');

    var OrphanMessagesInIdeaListView = IdeaView.extend({
        /**
         * The template
         * @type {[type]}
         */
        template: Ctx.loadTemplate('orphanMessagesInIdeaList'),

        /**
         * The render
         */
        render: function () {
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);
            var data = this.model.toJSON();

            this.$el.addClass('idealist-item');
            if (this.model.get('num_orphan_posts') == 0) {
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
        onTitleClick: function (e) {
            var messageListView = this.groupContent.getViewByTypeName('messageList');
            if (messageListView) {
                e.stopPropagation();

                messageListView.triggerMethod('messageList:clearAllFilters');
                messageListView.triggerMethod('messageList:addFilterIsOrphanMessage');
                Ctx.setCurrentIdea(null);
                //Yes, this will cause double-renders in some cases.  Will be fixed once messageList observes it's result list.
                messageListView.render();
                if (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.SIMPLE)
                    this.groupContent.resetDebateState();
            }
        }
    });


    return OrphanMessagesInIdeaListView;
});
