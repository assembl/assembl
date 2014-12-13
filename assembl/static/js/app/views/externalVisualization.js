'use strict';

define(['backbone.marionette', 'utils/i18n', 'utils/panelSpecTypes', 'views/assemblPanel'],
    function (Marionette, i18n, PanelSpecTypes, AssemblPanel) {

        var externalVisualizationPanel = Marionette.ItemView.extend({
            template: '#tmpl-externalViz',
            panelType: PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT,
            className: 'externalViz',
            gridSize: AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE,
            hideHeader: true,
            getTitle: function () {
                return i18n.gettext('Dashboard'); // unused
            },
            ui: {
                external_visualization: 'iframe#external_visualization'
            },
            initialize: function (options) {
                this.listenTo(this, 'contextPage:render', this.render);
            },
            setUrl: function(url) {
                this.ui.external_visualization.attr('src', url);
            }
        });
        return externalVisualizationPanel;
    });
