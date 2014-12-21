'use strict';

define(['common/context', 'app', 'utils/panelSpecTypes', 'views/idea'],
    function (Ctx, Assembl, PanelSpecTypes, IdeaView) {

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
                var messageListView = this.getContainingGroup().findViewByType(PanelSpecTypes.MESSAGE_LIST);
                messageListView.triggerMethod('messageList:clearAllFilters');
                messageListView.triggerMethod('messageList:addFilterIsSynthesisMessage');

                Ctx.DEPRECATEDsetCurrentIdea(null);

                this.getContainingGroup().resetDebateState();
            }
        });

        return SynthesisIdeaView;
    });
