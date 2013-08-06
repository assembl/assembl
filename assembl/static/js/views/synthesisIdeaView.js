define(['backbone', 'underscore', 'zepto', 'models/idea', 'models/segment', 'app'],
function(Backbone, _, $, Idea, Segment, app){
    'use strict';

    var SymthesisIdeaView = Backbone.View.extend({
        /**
         * Tag name
         * @type {String}
         */
        tagName: 'div',

        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('symthesisIdea'),

        /**
         * @init
         */
        initialize: function(obj){
            if( _.isUndefined(this.model) ){
                this.model = new Idea.Model();
            }

            this.model.on('change:shortTitle change:longTitle change:inSynthesis', this.render, this);
        },

        /**
         * The render
         * @return {IdeaView}
         */
        render: function(){
            var data = this.model.toJSON(),
                doc = document.createDocumentFragment();

            this.$el.addClass('idealist-item');

            if( data.isOpen === true ){
                this.$el.addClass('is-open');
            } else {
                this.$el.removeClass('is-open');
            }

            data.children = this.model.getChildren();
            data.level = this.model.getLevel();

            if( data.longTitle ){
                data.longTitle = ' - ' + data.longTitle.substr(0, 50);
            }

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

            _.each(children, function(idea, i){
                idea.set('level', parentLevel + 1);

                var ideaView = new SymthesisIdeaView({model:idea});
                ret.push( ideaView.render().el );
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
            'click .idealist-arrow': 'toggle',
            'click .idealist-removebtn': 'remove'
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
        },


        /**
         * Remove the idea from the synthesis
         */
        remove: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.model.set('inSynthesis', false);
        }

    });

    return SymthesisIdeaView;
});
