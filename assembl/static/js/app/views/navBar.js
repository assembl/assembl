define(function(require){

    var Marionette = require('marionette'),
               Ctx = require('modules/context');

    var navBar = Marionette.LayoutView.extend({
        template:'#tmpl-navBar',
        tagName:'nav',
        className:'navbar navbar-default',
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