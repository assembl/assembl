define(function(require){

    var Marionette = require('marionette'),
               Ctx = require('modules/context');

    var navBar = Marionette.LayoutView.extend({
        template:'#tmpl-navBar',

        events: {
            'click .lang': 'setLocale'
        },

        setLocale: function(e){
            var lang = $(e.target).attr('data-locale');
            Ctx.setLocale(lang);
        }

    });

    return navBar;

});