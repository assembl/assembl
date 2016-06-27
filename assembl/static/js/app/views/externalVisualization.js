'use strict';
/**
 * 
 * @module app.views.externalVisualization
 */

var Marionette = require('../shims/marionette.js'),
    i18n = require('../utils/i18n.js'),
    Ctx = require('../common/context.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js');

var externalVisualizationPanel = Marionette.ItemView.extend({
  constructor: function externalVisualizationPanel() {
    Marionette.ItemView.apply(this, arguments);
  },

  template: '#tmpl-externalViz',
  panelType: PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT,
  className: 'externalViz',
  gridSize: AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE,
  hideHeader: true,
  getTitle: function() {
    return i18n.gettext('CI Dashboard'); // unused
  },
  ui: {
    external_visualization: 'iframe#external_visualization'
  },
  initialize: function(options) {
    this.listenTo(this, 'contextPage:render', this.render);
  },
  setUrl: function(url) {
    this.ui.external_visualization.attr('src', url);
  }
});

var dashboardVisualizationPanel = externalVisualizationPanel.extend({
  constructor: function dashboardVisualizationPanel() {
    externalVisualizationPanel.apply(this, arguments);
  },

  panelType: PanelSpecTypes.CI_DASHBOARD_CONTEXT,
  onRender: function(options) {
    if (!this.urlSetStarted) {
        this.urlSetStarted = true;
        var that = this;
        Ctx.deanonymizationCifInUrl(Ctx.getPreferences().ci_dashboard_url, function(url) {
            that.setUrl(url);
        });
    }
  }
});

module.exports = {
    externalVisualizationPanel: externalVisualizationPanel,
    dashboardVisualizationPanel: dashboardVisualizationPanel
};
