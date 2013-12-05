define(['backbone', 'underscore', 'jquery', 'app', 'models/message'],
function(Backbone, _, $, app, Message){
    'use strict';

    var MessageListView = Backbone.View.extend({
        /**
         * Tag name
         * @type {String}
         */
        tagName: 'div',

        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('messageListItem'),

        /**
         * @init
         */
        initialize: function(){

            this.model.on('change:read', this.onReadChange, this);
            this.model.on('change:checked', this.onCheckedChange, this);
        },

        /**
         * The render
         * @return {MessageListView}
         */
        render: function(){
            app.trigger('render');
            var data = this.model.toJSON(),
                doc = document.createDocumentFragment();

            this.$el.addClass('idealist-item');

            if( data.isOpen === true ){
                this.$el.addClass('is-open');
            } else {
                this.$el.removeClass('is-open');
            }

            data.id = this.model.getId();
            data.children = this.model.getChildren();
            data.level = this.model.getLevel();
            data.creator = this.model.getCreator();

            this.$el.html( this.template(data) );
            this.$('.idealist-children').append( this.getRenderedChildren(data.level) );

            return this;
        },

        /**
         * Returns all children rendered
         * @param {Number} parentLevel
         * @return {Array<HTMLDivElement>}
         */
        getRenderedChildren: function(parentLevel){
            var children = this.model.getChildren(),
                ret = [];

            _.each(children, function(message, i){
                message.set('level', parentLevel + 1);

                var messageListView = new MessageListView({model:message});
                ret.push( messageListView.render().el );
            });

            return ret;
        },

        /**
         * Show the childen
         */
        open: function(){
            this.model.set('isOpen', true);
            this.$el.addClass('is-open');
        },

        /**
         * Hide the childen
         */
        close: function(){
            this.model.set('isOpen', false);
            this.$el.removeClass('is-open');
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'change [type="checkbox"]': 'onCheckboxChange',
            'click .idealist-arrow': 'toggle'
        },

        /**
         * @event
         */
        onReadChange: function(){
            var method = this.model.get('read') ? 'removeClass' : 'addClass';
            this.$('.idealist-title')[method]('text-bold');
        },

        /**
         * @event
         */
        onCheckboxChange: function(ev){
            ev.stopPropagation();
            this.model.set('inSynthesis', ev.currentTarget.checked);
        },

        /**
         * @event
         */
        onCheckedChange: function(ev){
            var checked = this.model.get('checked');
            this.$('.chk-checkbox').get(0).checked = checked;
        },

        /**
         * Toggle show/hide an item
         * @event
         * @param  {Event} ev
         */
        toggle: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            if( this.$el.hasClass('is-open') ){
                this.close();
            } else {
                this.open();
            }
        }

    });

    return MessageListView;
});
