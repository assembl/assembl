define(function (require) {

    var AssemblPanel = require('views/assemblPanel');

    var HomePanel = AssemblPanel.extend({
        template:'#tmpl-home'
    });

    return HomePanel;
});