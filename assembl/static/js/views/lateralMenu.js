define(['backbone', 'underscore', 'jquery', 'app', 'views/email'],
function(Backbone, _, $, app, EmailView){
    'use strict';

    var LateralMenu = Backbone.View.extend({
        initialize: function(){
            this.on('toggle', this.toggle, this);
        },

        /**
         * Flag whether it is open or not
         * @type {Boolean}
         */
        isOpen: false,

        /**
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('lateralMenu'),

        /**
         * The render
         * @return {LateralMenu}
         */
        render: function(){
            this.$el.html(this.template());

            return this;
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'click  #lateralmenu-button': 'toggle'
        },

        // Events

        /**
         * Open or close the lateralmenu
         * @event
         */
        toggle: function(){
            if (this.isOpen) this.close();
            else this.open();
        },

        /**
         * Open the lateralmenu
         */
        open: function(){
            this.$el.animate({translateX: 0}, app.lateralMenuAnimationTime, app.ease);
            this.isOpen = true;
            app.trigger('lateralmenu.open');
        },

        /**
         * Close the lateralMenu
         */
        close: function(){
            var data = {translateX: '-' + app.lateralMenuWidth + 'px' };
            this.$el.animate(data, app.lateralMenuAnimationTime, app.ease);
            this.isOpen = false;
            app.trigger('lateralmenu.close');
        }



    });

    return LateralMenu;
});
