define(function (require) {

    var Assembl = require('app'),
        AssemblPanel = require('views/assemblPanel');

    var HomePanel = AssemblPanel.extend({
        template: '#tmpl-home',
        panelType: 'homeNavPanel',
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