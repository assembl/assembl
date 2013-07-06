define(['backbone', 'underscore', 'zepto', 'models/idea', 'app'],
function(Backbone, _, $, Idea, app){
    'use strict';

    var DATA_LEVEL = 'data-idealist-level',
        PREVIOUS_VALUE = 'previous-value';

    /**
     * Given the .idealist-label, returns the right offsetTop
     * @param  {.idealist-label} el
     * @param  {Number} [top=0] Initial top
     * @return {Number}
     */
    function getTopPosition(el, top){
        top = top || 0;

        if( el.offsetParent.id === 'wrapper' ){
            return top + el.offsetTop;
        } else {
            return getTopPosition(el.offsetParent, el.offsetTop);
        }

    }

    var IdeaView = Backbone.View.extend({
        /**
         * Tag name
         * @type {String}
         */
        tagName: 'div',

        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('idea'),

        /**
         * @init
         */
        initialize: function(obj){
            if( _.isUndefined(this.model) ){
                this.model = new Idea.Model();
            }

            this.model.on('change', this.render, this);
        },

        /**
         * The render
         * @return {IdeaView}
         */
        render: function(){
            var data = this.model.toJSON(),
                doc = document.createDocumentFragment();

            this.el.setAttribute(DATA_LEVEL, data.level);
            this.$el.addClass('idealist-item');

            if( data.isSelected === true ){
                this.$el.addClass('is-selected');
            } else {
                this.$el.removeClass('is-selected');
            }

            if( data.isOpen === true ){
                this.$el.addClass('is-open');
            } else {
                this.$el.removeClass('is-open');
            }

            if( data.longTitle ){
                data.longTitle = ' - ' + data.longTitle.substr(0, 50);
            }

            this.$el.html(this.template(data));
            this.$('.idealist-children').append( this.getRenderedChildren() );

            return this;
        },

        /**
         * Returns all children rendered
         * @return {Array<HTMLDivElement>}
         */
        getRenderedChildren: function(){
            var children = this.model.get('children'),
                ret = [];

            if( this.model.get('hasChildren') === true ){
                _.each(children, function(idea, i){
                    var ideaView = new IdeaView({model:idea});

                    ret.push( ideaView.render().el );
                });
            }

            return ret;
        },

        /**
         * add an item as child
         * @param  {string} html
         */
        addChild: function(html){
            var idea = new Idea.Model({
                subject: html,
                level: this.model.get('level') + 1
            });

            this.model.addChild(idea);
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'click .idealist-title': 'onTitleClick',
            'click .idealist-arrow': 'toggle',
            'dragover .idealist-body': 'onDragOver',
            'dragleave .idealist-body': 'onDragLeave',
            'drop .idealist-body': 'onDrop',
            'dragover .idealist-dropzone': 'onDropZoneDragOver',
            'dragoleave .idealist-dropzone': 'onDragLeave'
        },

        /**
         * @event
         * Select this idea as the current idea
         */
        onTitleClick: function(ev){
            ev.stopPropagation();
            app.setCurrentIdea(this.model);
        },

        /**
         * @event
         */
        onDragOver: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.$el.addClass('is-dragover');
        },

        /**
         * @event
         */
        onDragLeave: function(ev){
            this.$el.removeClass('is-dragover').removeClass('is-dragover-below');
        },

        /**
         * @event
         */
        onDrop: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.$('.idealist-body').trigger('dragleave');

            var segment = app.getDraggedSegment();

            if( segment ){
                this.model.addSegment(segment);
            }
        },

        /**
         * @event
         */
        onDropZoneDragOver: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.$el.removeClass('is-dragover').addClass('is-dragover-below');
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
                this.model.set('isOpen', false);
                this.$el.removeClass('is-open');
            } else {
                this.model.set('isOpen', true);
                this.$el.addClass('is-open');
            }
        }

    });

    return IdeaView;
});
