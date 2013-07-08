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
         * Counter used to open the idea when it is dragover
         * @type {Number}
         */
        dragOverCounter: 0,

        /**
         * @init
         */
        initialize: function(obj){
            if( _.isUndefined(this.model) ){
                this.model = new Idea.Model();
            }

            var children = this.model.get('children');

            if( _.isUndefined(children) ){
                children = new Idea.Collection();
                this.model.set('children', children);
            }

            this.model.on('change', this.render, this);
            children.on('add', this.render, this);
            children.on('remove', this.render, this);
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
            this.$('.idealist-children').append( this.getRenderedChildren(data.level) );

            return this;
        },

        /**
         * Returns all children rendered
         * @param {Number} parentLevel 
         * @return {Array<HTMLDivElement>}
         */
        getRenderedChildren: function(parentLevel){
            var children = this.model.get('children'),
                ret = [];

            children.each(function(idea, i){
                idea.set('level', parentLevel + 1);

                var ideaView = new IdeaView({model:idea});
                ret.push( ideaView.render().el );
            });

            return ret;
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'click .idealist-title': 'onTitleClick',
            'click .idealist-arrow': 'toggle',

            'dragstart .idealist-body': 'onDragStart',
            'dragend .idealist-body': 'onDragEnd',

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
        onDragStart: function(ev){
            if( ev ){
                ev.stopPropagation();
            }
            ev.currentTarget.style.opacity = 0.4;

            app.showDragbox(ev, this.model.get('shortTitle'));
            app.draggedIdea = this.model;
            console.log( this.model );
        },

        /**
         * @event
         */
        onDragEnd: function(ev){
            ev.currentTarget.style.opacity = '';
            app.draggedSegment = null;
        },

        /**
         * @event
         */
        onDragOver: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.dragOverCounter += 1;

            if( this.dragOverCounter > 30 ){
                this.model.set('isOpen', true);
            }

            if( app.draggedSegment !== null || app.draggedIdea !== null ){
                this.$el.addClass('is-dragover');
            }
        },

        /**
         * @event
         */
        onDragLeave: function(ev){
            this.dragOverCounter = 0;
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

            var isDraggedBelow = this.$el.hasClass('is-dragover-below');
            this.$('.idealist-body').trigger('dragleave');

            var segment = app.getDraggedSegment();
            if( segment ){
                if( isDraggedBelow ){
                    // Add as a child
                    this.model.addSegmentAsChild(segment);
                } else {
                    // Add as a segment
                    this.model.addSegment(segment);
                }

                return;
            }

            if( app.draggedIdea && app.draggedIdea.cid !== this.model.cid ){
                var idea = app.getDraggedIdea();
                this.model.addChild(idea);
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

            if( app.draggedSegment !== null ){
                this.$el.addClass('is-dragover-below');
            }
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
