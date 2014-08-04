define(function(require){

    var Marionette = require('marionette'),
               Ctx = require('modules/context');

    var contextPage = Marionette.LayoutView.extend({
        template:'#tmpl-contextPage',

        /*
        events: {
            'click .lang': 'setLocale'
        },

        setLocale: function(e){
            var lang = $(e.target).attr('data-locale');
            Ctx.setLocale(lang);
        }
        */

    });

    return contextPage;

});