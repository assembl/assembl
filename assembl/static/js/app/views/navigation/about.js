'use strict';

var Assembl = require('../../app.js'),
    AssemblPanel = require('../assemblPanel.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js'),
    Analytics = require('../../internal_modules/analytics/dispatcher.js');

var AboutNavPanel = AssemblPanel.extend({
  template: '#tmpl-about',
  panelType: PanelSpecTypes.NAVIGATION_PANEL_ABOUT_SECTION,
  className: 'aboutNavPanel',
  ui: {
    debate: '.js_go-to-debate'
  },
  events: {
    'click @ui.debate': 'goToDebate',
    'click .js_test_stuff_analytics': 'testAnalytics',
    'click .js_trackInteractionExample': 'testAnalytics2'
  },
  initialize: function(options) {
      Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
    },
  goToDebate: function() {
    Assembl.vent.trigger("DEPRECATEDnavigation:selected", "debate");
  },
  testAnalytics: function(e){
    e.stopPropagation();
    e.preventDefault();
    var a = Analytics.getInstance();
    a.trackImpression("DummyContentName", "DummyContentPiece", "http://dummyurl.fc.uk");
  },
  testAnalytics2: function(e){
    e.stopPropagation();
    e.preventDefault();
    var a = Analytics.getInstance();
    a.trackContentInteraction("DummyInteraction", "DummyContentName", "DummyContentPiece", "http://dummyurl.fc.uk");
  }
});

module.exports = AboutNavPanel;
