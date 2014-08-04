define(function (require) {

    var Marionette = require('marionette'),
        AssemblPanel = require('views/assemblPanel');

    var groupItem = Marionette.ItemView.extend({
        template: "#tmpl-groupItem"
    });

    return groupItem;
});