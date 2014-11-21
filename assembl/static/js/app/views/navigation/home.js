define(function (require) {

    var Assembl = require('app'),
        PanelSpecTypes = require('utils/panelSpecTypes'),
        AssemblPanel = require('views/assemblPanel');

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

        goToDebate: function () {
            Assembl.vent.trigger("navigation:selected", "debate");
        }
    });

    return HomePanel;
});