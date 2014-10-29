define(function (require) {
    'use strict';

    var IdeaView = require('views/idea'),
        Ctx = require('common/context');

    var AllMessagesInIdeaListView = IdeaView.extend({
        /**
         * The template
         * @type {[type]}
         */
        template: Ctx.loadTemplate('allMessagesInIdeaList'),

        /**
         * The render
         */
        render: function () {
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);
            var data = this.model.toJSON();

            this.$el.addClass('idealist-item');
            if (this.model.get('num_posts') == 0) {
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
        onTitleClick: function () {
            var messageListView = this.groupContent.getViewByTypeName('messageList');
            messageListView.triggerMethod('messageList:clearAllFilters');
            Ctx.setCurrentIdea(null);
            //Yes, this will cause double-renders in some cases.  Will be fixed once messageList observes it's result list.
            messageListView.render();
            this.groupContent.resetDebateState(false);
        }
    });


    return AllMessagesInIdeaListView;
});
