define(['backbone', 'underscore', 'jquery', 'models/idea', 'models/segment', 'app', 'permissions'],
function(Backbone, _, $, Idea, Segment, app, Permissions){
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
         * @param {IdeaModel} obj the model
         * @param {dict} view_data: data from the render visitor
         *   are the last child of their respective parents.
         */
        initialize: function(obj, view_data){
            /*if( _.isUndefined(this.model) ){
                this.model = new Idea.Model();
            }*/
            //console.log("initialize: ",obj, view_data, this);
            var that = this;
            this.view_data = view_data;
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'replacedBy', this.onReplaced);
            app.on('idea:select', function(idea) {
                that.onIsSelectedChange(idea);
            });
        },

        /**
         * The render
         * @return {IdeaView}
         */
        render: function(){
            app.trigger('render');
            var view_data = this.view_data;
            var render_data = view_data[this.model.getId()];
            if (render_data === undefined) {
                return this;
            }
            var data = this.model.toJSON();
            _.extend(data, render_data);

            this.$el.addClass('idealist-item');
            app.cleanTooltips(this.$el);
            this.onIsSelectedChange(app.getCurrentIdea());

            if( data.isOpen === true ){
                this.$el.addClass('is-open');
            } else {
                this.$el.removeClass('is-open');
            }

            if( data.longTitle ){
                data.longTitle = ' - ' + data.longTitle.substr(0, 50);
            }

            data.segments = this.model.getSegments();
            data.shortTitle = this.model.getShortTitleDisplayText();
            this.$el.html(this.template(data));
            app.initTooltips(this.$el);
            var rendered_children = [];
            _.each(data['children'], function(idea, i){
                var ideaView = new IdeaView({model:idea}, view_data);
                rendered_children.push( ideaView.render().el );
            });
            this.$('.idealist-children').append( rendered_children );

            return this;
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
            'drop .idealist-body': 'onDrop'
        },

        /**
         * @event
         */
        onIsSelectedChange: function(idea){
            //console.log("IdeaView:onIsSelectedChange(): new: ", idea, "current: ", this.model, this);
            if( idea === this.model ){
                this.$el.addClass('is-selected');
            } else {
                this.$el.removeClass('is-selected');
            }
        },

        /**
         * @event
         */
        onReplaced: function(newObject){
            this.model = newObject;
            //That makes no sense, there is no way to know it's the current idea
            //app.setCurrentIdea(newObject);
        },


        /**
         * @event
         */
        onCheckboxChange: function(ev){
            ev.stopPropagation();
            this.model.save({'inNextSynthesis': ev.currentTarget.checked});
            //Optimisation.  It would self render once the socket propagates, 
            //but this gives better responsiveness.
            app.synthesisPanel.render();
        },

        /**
         * @event
         * Select this idea as the current idea
         */
        onTitleClick: function(ev){
            var that = this;
            ev.stopPropagation();
            if( app.messageList ){
                app.messageList.filterThroughPanelLock(function(){
                    app.messageList.addFilterIsRelatedToIdea(that.model);
                }, 'syncWithCurrentIdea');
            }
            if( this.model === app.getCurrentIdea() ){
                app.setCurrentIdea(null);
            } else {
                app.setCurrentIdea(this.model);
            }
        },

        /**
         * @event
         */
        onDragStart: function(ev){
            if( ev ){
                ev.stopPropagation();
            }
            if(app.getCurrentUser().can(Permissions.EDIT_IDEA)){
                ev.currentTarget.style.opacity = 0.4;
                ev.originalEvent.dataTransfer.effectAllowed = 'move';
                ev.originalEvent.dataTransfer.dropEffect = 'all';

                app.showDragbox(ev, this.model.get('shortTitle'));
                app.draggedIdea = this.model;
            }
        },

        /**
         * @event
         */
        onDragEnd: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }
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

            if( ev.originalEvent ){
                ev = ev.originalEvent;
            }

            if( this.dragOverCounter > 30 ){
                this.model.set('isOpen', true);
            }

            ev.dataTransfer.dropEffect = 'all';

            if( app.draggedIdea !== null ){

                // Do nothing if it is the same idea
                if( app.draggedIdea.cid === this.model.cid ){
                    ev.dataTransfer.dropEffect = 'none';
                    return;
                }

                // If it is a descendent, do nothing
                if( this.model.isDescendantOf(app.draggedIdea) ){
                    ev.dataTransfer.dropEffect = 'none';
                    return;
                }

                if( ev.target.classList.contains('idealist-abovedropzone') ){
                    this.$el.addClass('is-dragover-above');
                } else if( ev.target.classList.contains('idealist-dropzone') ){
                    this.$el.addClass('is-dragover-below');
                } else {
                    this.$el.addClass('is-dragover');
                }
            }

            if( app.draggedSegment !== null || app.draggedAnnotation !== null ){
                if( ev.target.classList.contains('idealist-dropzone') ){
                    this.$el.addClass('is-dragover-below');
                } else {
                    this.$el.addClass('is-dragover');
                }
            }

            this.dragOverCounter += 1;
        },

        /**
         * @event
         */
        onDragLeave: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.dragOverCounter = 0;
            this.$el.removeClass('is-dragover is-dragover-above is-dragover-below');
        },

        /**
         * @event
         */
        onDrop: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            var isDraggedBelow = this.$el.hasClass('is-dragover-below'),
                isDraggedAbove = this.$el.hasClass('is-dragover-above');

            this.$('.idealist-body').trigger('dragleave');

            var segment = app.getDraggedSegment();
            if( segment ){
                if( isDraggedBelow ){
                    // Add as a child idea
                    var newIdea = this.model.addSegmentAsChild(segment);
                    app.setCurrentIdea(newIdea);
                } else {
                    // Add to the current idea
                    this.model.addSegment(segment);
                }

                return;
            }

            var annotation = app.getDraggedAnnotation();
            if( annotation ){
                if( isDraggedBelow ){
                    // Add as a child idea
                    app.currentAnnotationIdIdea = null;
                    app.currentAnnotationNewIdeaParentIdea = this.model;
                    app.saveCurrentAnnotationAsExtract();
                } else {
                    // Add as a segment
                    app.currentAnnotationIdIdea = this.model.getId();
                    app.currentAnnotationNewIdeaParentIdea = null;
                    app.saveCurrentAnnotationAsExtract();
                }
                
                return;
            }

            if( app.draggedIdea && app.draggedIdea.cid !== this.model.cid ){

                var idea = app.getDraggedIdea();

                // If it is a descendent, do nothing
                if( this.model.isDescendantOf(idea) ){
                    return;
                }

                if( isDraggedAbove ){
                    this.model.addSiblingAbove(idea);
                } else if ( isDraggedBelow ){
                    this.model.addSiblingBelow(idea);
                } else {
                    this.model.addChild(idea);
                }

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
