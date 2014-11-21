define(function (require) {
    'use strict';

    var Ctx = require('common/context'),
        Assembl = require('app'),
        PanelSpecTypes = require('utils/panelSpecTypes'),
        IdeaView = require('views/idea');

    var SynthesisIdeaView = IdeaView.extend({
        /**
         * The template
         * @type {[type]}
         */
        template: Ctx.loadTemplate('synthesisInIdeaList'),

        /**
         * The render
         */
        render: function () {
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);

            var data = this.model.toJSON();

            this.$el.addClass('idealist-item');
            if (this.model.get('num_synthesis_posts') == 0) {
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
            var messageListView = this.groupContent.findViewByType(PanelSpecTypes.MESSAGE_LIST);
            messageListView.triggerMethod('messageList:clearAllFilters');
            messageListView.triggerMethod('messageList:addFilterIsSynthesisMessage');

            Ctx.setCurrentIdea(null);
            //Yes, this will cause double-renders in some cases.  Will be fixed once messageList observes it's result list.
            messageListView.render();
            this.groupContent.resetDebateState();
        }
    });

    return SynthesisIdeaView;
});
