'use strict';

var Assembl = require('../../app.js'),
    AssemblPanel = require('../assemblPanel.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js');

var AboutNavPanel = AssemblPanel.extend({
    template: '#tmpl-about',
    panelType: PanelSpecTypes.NAVIGATION_PANEL_ABOUT_SECTION,
    className: 'aboutNavPanel',
    ui: {
        debate: '.js_go-to-debate'
    },
    events: {
        'click @ui.debate': 'goToDebate'
    },
    initialize: function (options) {
      Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
    },
    goToDebate: function () {
        Assembl.vent.trigger("navigation:selected", "debate");
    }
});

module.exports = AboutNavPanel;
