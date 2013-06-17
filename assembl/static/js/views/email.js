define(['backbone', 'underscore', 'jquery', 'models/email', 'app'],
function(Backbone, _, $, Email, app){
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

            function clean(el){
                el.classList.remove('is-dragover');
                el.classList.remove('is-dragover-above');
                el.classList.remove('is-dragover-below');
            }

            //this.$el.on('dragenter', function(ev){ });
            this.$el.on('dragleave', function(ev){
                clean(this);
            });

            this.$el.on('dragover', function(ev){
                ev.preventDefault();
                clean(this);

                var above = this.offsetTop + 10,
                    below = this.offsetTop + 30,
                    y = ev.clientY,
                    cls = 'is-dragover';

                if( y <= above ){
                    cls += '-above';
                } else if ( y >= below ){
                    cls += '-below';
                }

                this.classList.add( cls );
            });

            var self = this;
            this.$el.on('drop', function(ev){
                this.classList.remove('is-dragover');
                ev.stopPropagation();
                var li = app.bucketDraggedSegment;

                self.addChild( li.html() );
                li.remove();
                return false;
            });

            this.$el.html(this.template(data));
            return this;
        },

        /**
         * add an item as child
         * @param  {string} html
         * @return {EmailView}
         */
        addChild: function(html){
            if( !this.$el.hasClass('is-open') ){
                this.showItemInCascade( this.$el.next(), this.model.get('level') );
            }

            var email = new Email.Model({
                subject: html,
                level: this.model.get('level') + 1
            });

            var emailView = new EmailView({model: email});
            this.$el.after(emailView.render().el);

            return emailView;
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
