'use strict';

var Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    IdeaView = require('./idea.js');


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
        if (this.model.get('num_orphan_posts') === 0) {
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
        $('.idealist-item').removeClass('is-selected');

        var messageListView = this.getContainingGroup().findViewByType(PanelSpecTypes.MESSAGE_LIST);

        if (messageListView) {
            e.stopPropagation();

            messageListView.triggerMethod('messageList:clearAllFilters');
            messageListView.triggerMethod('messageList:addFilterIsOrphanMessage');

            this._groupContent.setCurrentIdea(null);
            this._groupContent.resetDebateState();

            this.$el.addClass('is-selected');
        }
    }
});


module.exports = OrphanMessagesInIdeaListView;
