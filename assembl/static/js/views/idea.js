define(['backbone', 'underscore', 'zepto', 'models/idea', 'app'],
function(Backbone, _, $, Idea, app){
    'use strict';

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


            this.model.on('change', this.render, this);
            //children.on('add', this.onAddChild, this);
            //children.on('remove', this.render, this);
        },

        /**
         * The render
         * @return {IdeaView}
         */
        render: function(){
            var data = this.model.toJSON(),
                doc = document.createDocumentFragment();

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

            data.children = this.model.getChildren();


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
            window.a = this.model;
            var children = this.model.getChildren(),
                ret = [];

            _.each(children, function(idea, i){
                idea.set('level', parentLevel + 1);

                var ideaView = new IdeaView({model:idea});
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
            'change [type="checkbox"]': 'onCheckboxChange',
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
         */
        onAddChild: function(ev){
            this.model.set('isOpen', true);
            this.render();
        },

        /**
         * @event
         */
        onCheckboxChange: function(ev){
            ev.stopPropagation();
            this.model.set('featured', ev.currentTarget.checked);
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
                this.close();
            } else {
                this.open();
            }
        }

    });

    return IdeaView;
});
