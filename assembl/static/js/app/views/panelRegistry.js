define(function (require) {
    var AssemblPanel = require('views/assemblPanel'),
        IdeaPanel = require('views/ideaPanel'),
        MessageList = require('views/messageList'),
        HomePanel = require('views/navigation/home'),
        NavigationPanel = require('views/navigation/navigation');
    'use strict';

    var panelTypeRegistry = {
        'idea-panel': IdeaPanel,
        'message': MessageList,
        'home-panel': HomePanel,
        'navigation': NavigationPanel,
    };

    function createPanel(spec) {
        try {
            return panelTypeRegistry[spec.get('type')];
        } catch (err) {
            console.log('invalid spec:', spec);
        }
        return AssemblPanel;
    }

    return createPanel;
});
