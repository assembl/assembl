define(['backbone', 'underscore', 'jquery', 'app'],
function(Backbone, _, $, app){
    'use strict';

    var DATA_LEVEL = 'data-emaillist-level';

    var EmailView = Backbone.View.extend({
        /**
         * Tag name
         * @type {String}
         */
        tagName: 'li',

        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('email'),

        /**
         * The render
         * @return {EmailView}
         */
        render: function(){
            var data = this.model.toJSON();
            this.el.setAttribute(DATA_LEVEL, data.level);
            this.$el.addClass('emaillist-item');

            if( data.level > 1 ){
                this.$el.addClass('is-hidden');
            }

            this.$el.html(this.template(data));
            return this;
        },

        /**
         * Shows an item and its descendents
         * @param  {jQuery} item
         * @param  {number} parentLevel
         */
        showItemInCascade: function(item, parentLevel){
            if( item.length === 0 ){
                return;
            }

            var currentLevel = ~~item.attr(DATA_LEVEL);

            if( currentLevel === (parentLevel+1) ){
                item.removeClass("is-hidden");
                this.showItemInCascade(item.next(), parentLevel);
            }
        },

        /**
         * Closes an item and its descendents
         * @param  {jQuery} item
         * @param  {number} parentLevel
         */
        closeItemInCascade: function (item, parentLevel){
            if( item.length === 0 ){
                return;
            }

            var currentLevel = ~~item.attr('data-emaillist-level');

            if( currentLevel > parentLevel ){
                item.addClass("is-hidden").removeClass('is-open');
                this.closeItemInCascade(item.next(), parentLevel);
            }
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'click [type=checkbox]': 'onCheckboxClick',
            'swipeLeft .emaillist-label': 'showOptions',
            'swipeRight .emaillist-label': 'hideOptions',
            'click .emaillist-label-arrow': 'toggle'
        },

        /**
         * Shows the option of an item
         * @event
         * @param  {Event} ev
         */
        showOptions: function(ev){
            $(ev.currentTarget).addClass('is-optioned');
        },

        /**
         * Hide the options of an item
         * @event
         * @param  {Event} ev
         */
        hideOptions: function(ev){
            $(ev.currentTarget).removeClass('is-optioned');
        },

        /**
         * Toggle show/hide an item
         * @event
         * @param  {Event} ev
         */
        toggle: function(ev){
            if( this.$el.hasClass('is-open') ){
                this.$el.removeClass('is-open');
                this.closeItemInCascade( this.$el.next(), ~~this.$el.attr(DATA_LEVEL) );
            } else {
                this.$el.addClass('is-open');
                this.showItemInCascade( this.$el.next(), ~~this.$el.attr(DATA_LEVEL) );
            }
        },

        /**
         * @event
         */
        onCheckboxClick: function(ev){
            var chk = ev.currentTarget;

            if( chk.checked ){
                this.$el.addClass('is-selected');
            } else {
                this.$el.removeClass('is-selected');
            }
        }
    });

    /**
     * States
     */
    EmailView.prototype.states = {
        hidden: 'is-hidden',
        optioned: 'is-optioned',
        selected: 'is-selected',
        open: 'is-open'
    };

    return EmailView;
});
