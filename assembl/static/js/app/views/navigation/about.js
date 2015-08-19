'use strict';

var Assembl = require('../../app.js'),
    AssemblPanel = require('../assemblPanel.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js'),
    Analytics = require('../../analytics/dispatcher.js');

var AboutNavPanel = AssemblPanel.extend({
  template: '#tmpl-about',
  panelType: PanelSpecTypes.NAVIGATION_PANEL_ABOUT_SECTION,
  className: 'aboutNavPanel',
  ui: {
    debate: '.js_go-to-debate'
  },
  events: {
    'click @ui.debate': 'goToDebate',
    'click .js_test_stuff_analytics': 'testAnalytics'
  },
  initialize: function(options) {
      Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
    },
  goToDebate: function() {
    Assembl.vent.trigger("navigation:selected", "debate");
  },
  testAnalytics: function(e){
    e.stopPropagation();
    e.preventDefault();
    var a = Analytics.getInstance();
    a.setCustomVariable("Type1_index2", 'value1_index2', {scope: 'visit', index: 2});
    a.commit({piwik: true});
  }
});

module.exports = AboutNavPanel;
