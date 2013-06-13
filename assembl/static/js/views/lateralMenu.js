define(['backbone', 'underscore', 'jquery', 'app', 'views/email'],
function(Backbone, _, $, app, EmailView){
    'use strict';

    var LateralMenu = Backbone.View.extend({
        initialize: function(obj){
            this.on('toggle', this.toggle, this);

            if( obj.emails ){
                this.emails = obj.emails;
                this.emails.on('reset', this.render, this);
                this.emails.fetch({ reset: true });
            }
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
            this.$el.html( this.template() );

            if( this.emails ){
                var emailList = this.$('#lateralmenu-emaillist');

                this.emails.each(function(email){
                    var emailView = new EmailView({model:email});
                    emailList.append(emailView.render().el);
                });
            }

            return this;
        },

        /**
         * Open a closed area
         * @param  {jQuery} area
         */
        openArea: function(area){
            var body = area.find('.accordion-body'),
                height = this.getBodyHeight(body);

            area.addClass('is-open');
            body.animate({height: height+'px'}, 'fast', app.ease);
        },

        /**
         * Closes an open area
         * @param  {jQuery} area
         */
        closeArea: function(area){
            area
                .removeClass('is-open')
                .find('.accordion-body')
                .animate({height:0}, 'fast', app.ease);
        },

        /**
         * Returns the height of the given .accordion-body
         * @param  {jQuery} body
         * @return {Number}
         */
        getBodyHeight: function(body){
            body.css({
                position: 'absolute',
                height: 'auto',
                visibility: 'hidden'
            });

            var height = body.height();

            body.css({
                position: 'static',
                height: '0px',
                overflow: 'hidden',
                visibility: 'visible'
            });

            return height;
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'click  #lateralmenu-button': 'toggle',
            'click .accordion-header': 'toggleArea'
        },

        // Events

        toggleArea: function(ev){
            var area = $(ev.currentTarget).parent();

            if( area.hasClass('is-open') ){
                this.closeArea( area );
            } else {
                this.openArea( area );
            }
        },

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
            var data = { translateX: '-' + app.lateralMenuWidth + 'px' };
            this.$el.animate(data, app.lateralMenuAnimationTime, app.ease);
            this.isOpen = false;
            app.trigger('lateralmenu.close');
        }

    });

    return LateralMenu;
});
