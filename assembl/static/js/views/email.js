define(['backbone', 'underscore', 'jquery', 'app'],
function(Backbone, _, $, app){
    'use strict';

    var DATA_LEVEL = 'data-emaillist-level';

    var EmailView = Backbone.View.extend({
        tagName: 'li',
        template: app.loadTemplate('email'),
        events: {
            'click [type=checkbox]': 'onCheckboxClick',
            'swipeLeft .emaillist-label': 'showOptions',
            'swipeRight .emaillist-label': 'hideOptions',
            'click .emaillist-label-arrow': 'toggle'
        },
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
        // Methods
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
        // Events,
        showOptions: function(ev){
            $(ev.currentTarget).addClass('is-optioned');
        },
        hideOptions: function(ev){
            $(ev.currentTarget).removeClass('is-optioned');
        },
        toggle: function(ev){
            if( this.$el.hasClass('is-open') ){
                this.$el.removeClass('is-open');
                this.closeItemInCascade( this.$el.next(), ~~this.$el.attr(DATA_LEVEL) );
            } else {
                this.$el.addClass('is-open');
                this.showItemInCascade( this.$el.next(), ~~this.$el.attr(DATA_LEVEL) );
            }
        },
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
