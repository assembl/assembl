'use strict';

var IdeaView = require('./idea.js'),
    Ctx = require('../common/context.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js');


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
        $('.idealist-item').removeClass('is-selected');
        // Quentin: Where else could we put this code so that it can be called by several things?
        // I had to duplicate this code into views/messageSend.js
        var messageListView = this._groupContent.findViewByType(PanelSpecTypes.MESSAGE_LIST);

            messageListView.triggerMethod('messageList:clearAllFilters');
            this._groupContent.setCurrentIdea(null);
            //Yes, this will cause double-renders in some cases.  Will be fixed once messageList observes it's result list.
            messageListView.render();
            this._groupContent.resetDebateState(false);

            this.$el.addClass('is-selected');
    }
});


module.exports = AllMessagesInIdeaListView;
