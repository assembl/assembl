'use strict';

define(['app', 'views/assemblPanel', 'utils/panelSpecTypes'],
    function (Assembl, AssemblPanel, PanelSpecTypes) {

        var HomePanel = AssemblPanel.extend({
            template: '#tmpl-home',
            panelType: PanelSpecTypes.NAVIGATION_PANEL_HOME_SECTION,
            className: 'homeNavPanel',
            ui: {
                debate: '.js_go-to-debate'
            },
            events: {
                'click @ui.debate': 'goToDebate'
            },
            initialize: function (options) {
              Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize(options);
            },
            goToDebate: function () {
                Assembl.vent.trigger("navigation:selected", "debate");
            }
        });

        return HomePanel;
    });