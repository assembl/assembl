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
                $('.idealist-item').removeClass('is-selected');

                var messageListView = this.getContainingGroup().findViewByType(PanelSpecTypes.MESSAGE_LIST);

                if(messageListView){
                    messageListView.triggerMethod('messageList:clearAllFilters');
                    messageListView.triggerMethod('messageList:addFilterIsSynthesisMessage');

                    this._groupContent.setCurrentIdea(null);
                    this._groupContent.resetDebateState();

                    this.$el.addClass('is-selected');
                }
            }
        });

        return SynthesisIdeaView;
    });
