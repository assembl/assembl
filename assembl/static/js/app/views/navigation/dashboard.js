define(function (require) {

    var Marionette = require('marionette');

    var dashboard = Marionette.ItemView.extend({
        template:'#tmpl-dashboard'

    });

    return dashboard;
});