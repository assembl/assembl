define(function (require) {

    var Marionette = require('marionette');

    var context = Marionette.ItemView.extend({
        template:'#tmpl-context'

    });

    return context;
});