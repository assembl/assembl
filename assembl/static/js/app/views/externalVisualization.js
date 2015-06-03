'use strict';

var Marionette = require('../shims/marionette.js'),
    i18n = require('../utils/i18n.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js');


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


module.exports = externalVisualizationPanel;
