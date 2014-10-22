define(function (require) {

    var Assembl = require('app/app'),
        AssemblPanel = require('app/views/assemblPanel');

    var HomePanel = AssemblPanel.extend({
        template: '#tmpl-home',
        panelType: 'homeNavPanel',
        className: 'homeNavPanel',

        events: {
            'click .go-to-debate': 'goToDebate'
        },

        goToDebate: function () {
            Assembl.vent.trigger("navigation:selected", "debate");
        }
    });

    return HomePanel;
});