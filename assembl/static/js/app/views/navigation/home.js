define(function (require) {

    var Marionette = require('marionette'),
    AssemblPanel = require('views/assemblPanel');

    var HomePanel = AssemblPanel.extend({
        template:'#tmpl-home'

    });

    return HomePanel;
});