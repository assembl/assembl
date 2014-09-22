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
        minimizeable: false,
        closeable: true,
        DEFAULT_GRID_SIZE: 3,
        gridSize: 3,
        IDEA_PANEL_GRID_SIZE: 3,
        MESSAGE_PANEL_GRID_SIZE: 5,
        NAVIGATION_PANEL_GRID_SIZE: 4,
        CLIPBOARD_GRID_SIZE: 3,
        CONTEXT_PANEL_GRID_SIZE: 8, //MESSAGE_PANEL_GRID_SIZE + IDEA_PANEL_GRID_SIZE
        SYNTHESIS_PANEL_GRID_SIZE: 8,
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
