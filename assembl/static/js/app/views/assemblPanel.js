define(function (require) {
    'use strict';

    var Marionette = require('marionette');

    /**
     * An abstract class every panel should eventually extend
     * @class AssemblPanel
     */
    var AssemblPanel = Marionette.LayoutView.extend({
        template: "#tmpl-groupItem",
        lockable: false,
        DEFAULT_GRID_SIZE: 1,
        gridSize: 1,
        IDEA_PANEL_GRID_SIZE: 1,
        MESSAGE_PANEL_GRID_SIZE: 2,
        NAVIGATION_PANEL_GRID_SIZE: 1,
        CLIPBOARD_GRID_SIZE: 1,
        CONTEXT_PANEL_GRID_SIZE: 3, //MESSAGE_PANEL_GRID_SIZE + IDEA_PANEL_GRID_SIZE
        /**
         * Show the panel is currently loading data
         */
        blockPanel: function () {
            this.$el.addClass('is-loading');
        },

        /**
         * Show the has finished loading data
         */
        unblockPanel: function () {
            this.$el.removeClass('is-loading');
        }
    });
    return AssemblPanel;
});
