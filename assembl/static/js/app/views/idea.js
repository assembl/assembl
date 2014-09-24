define(function (require) {
    'use strict';

    var Backbone = require('backbone'),
        _ = require('underscore'),
        Assembl = require('modules/assembl'),
        Ctx = require('modules/context'),
        Permissions = require('utils/permissions');

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
        template: Ctx.loadTemplate('idea'),

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
        initialize: function (options, view_data) {
            var that = this;
            this.view_data = view_data;
            this.groupContent = options.groupContent;

            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'replacedBy', this.onReplaced);

            this.listenTo(Assembl.vent, 'idea:selected', function (idea) {
                that.onIsSelectedChange(idea);
            });
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'change input[type="checkbox"]': 'onCheckboxChange',
            'click .idealist-title': 'onTitleClick',
            'click .js_idealist-title-unread-count': 'onUnreadCountClick',
            'click .idealist-arrow': 'toggle',
            'dragstart .idealist-body': 'onDragStart',
            'dragend .idealist-body': 'onDragEnd',
            'dragover .idealist-body': 'onDragOver',
            'dragleave .idealist-body': 'onDragLeave',
            'drop .idealist-body': 'onDrop'
        },

        /**
         * The render
         * @return {IdeaView}
         */
        render: function () {
            var that = this,
                view_data = this.view_data,
                render_data = view_data[this.model.getId()];
            if (render_data === undefined) {
                return this;
            }
            var data = this.model.toJSON();
            _.extend(data, render_data);

            this.$el.addClass('idealist-item');
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);
            this.onIsSelectedChange(Ctx.getCurrentIdea());

            if (data.isOpen === true) {
                this.$el.addClass('is-open');
            } else {
                this.$el.removeClass('is-open');
            }

            if (data.longTitle) {
                data.longTitle = ' - ' + data.longTitle.substr(0, 50);
            }

            data.shortTitle = this.model.getShortTitleDisplayText();
            this.$el.html(this.template(data));
            Ctx.initTooltips(this.$el);
            var rendered_children = [];
            _.each(data['children'], function (idea, i) {
                var ideaView = new IdeaView({model: idea, groupContent: that.groupContent}, view_data);
                rendered_children.push(ideaView.render().el);
            });
            this.$('.idealist-children').append(rendered_children);

            return this;
        },

        /**
         * Show the childen
         */
        open: function () {
            this.model.set('isOpen', true);
            this.$el.addClass('is-open');
        },

        /**
         * Hide the childen
         */
        close: function () {
            this.model.set('isOpen', false);
            this.$el.removeClass('is-open');
        },

        /**
         * @event
         */
        onIsSelectedChange: function (idea) {
            //console.log("IdeaView:onIsSelectedChange(): new: ", idea, "current: ", this.model, this);
            if (idea === this.model) {
                this.$el.addClass('is-selected');
            } else {
                this.$el.removeClass('is-selected');
            }
        },

        /**
         * @event
         */
        onReplaced: function (newObject) {
            this.model = newObject;
            //That makes no sense, there is no way to know it's the current idea
            //app.setCurrentIdea(newObject);
        },


        /**
         * @event
         */
        onCheckboxChange: function (ev) {
            ev.stopPropagation();
            this.model.save({'inNextSynthesis': ev.currentTarget.checked});
            //Optimisation.  It would self render once the socket propagates, 
            //but this gives better responsiveness.
            Assembl.commands.execute('synthesisPanel:render');
        },

        /**
         * @event
         * Select this idea as the current idea
         */
        onTitleClick: function (e) {
            var messageListView;
            e.stopPropagation();
            if(Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.SIMPLE) {
              messageListView = this.groupContent.getViewByTypeName('messageList');
              messageListView.triggerMethod('messageList:clearAllFilters');
            }
            if (this.model === Ctx.getCurrentIdea()) {
                // We want to avoid the "All messages" state,
                // unless the user clicks explicitly on "All messages".
                // TODO benoitg: Review this decision.
                //Ctx.setCurrentIdea(null);
              //This is so the messageList refreshes.  
            } else {
                Ctx.setCurrentIdea(this.model);
            }
            this.groupContent.resetDebateState();
        },

        /**
         * @event
         * Select this idea as the current idea, and show only unread messages of this idea
         */
        onUnreadCountClick: function (e) {
            e.stopPropagation();

            Assembl.vent.trigger('messageList:addFilterIsRelatedToIdea', this.model, true);
            Ctx.setCurrentIdea(this.model);
        },

        /**
         * @event
         */
        onDragStart: function (ev) {
            if (ev) {
                ev.stopPropagation();
            }
            if (Ctx.getCurrentUser().can(Permissions.EDIT_IDEA)) {
                ev.currentTarget.style.opacity = 0.4;
                ev.originalEvent.dataTransfer.effectAllowed = 'move';
                ev.originalEvent.dataTransfer.dropEffect = 'all';

                Ctx.showDragbox(ev, this.model.get('shortTitle'));
                Ctx.draggedIdea = this.model;
            }
        },

        /**
         * @event
         */
        onDragEnd: function (ev) {
            if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            }
            ev.currentTarget.style.opacity = '';
            Ctx.draggedSegment = null;
        },

        /**
         * @event
         */
        onDragOver: function (ev) {
            if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            }

            if (ev.originalEvent) {
                ev = ev.originalEvent;
            }

            if (this.dragOverCounter > 30) {
                this.model.set('isOpen', true);
            }

            ev.dataTransfer.dropEffect = 'all';

            if (Ctx.draggedIdea !== null) {

                // Do nothing if it is the same idea
                if (Ctx.draggedIdea.cid === this.model.cid) {
                    ev.dataTransfer.dropEffect = 'none';
                    return;
                }

                // If it is a descendent, do nothing
                if (this.model.isDescendantOf(Ctx.draggedIdea)) {
                    ev.dataTransfer.dropEffect = 'none';
                    return;
                }

                if (ev.target.classList.contains('idealist-abovedropzone')) {
                    this.$el.addClass('is-dragover-above');
                } else if (ev.target.classList.contains('idealist-dropzone')) {
                    this.$el.addClass('is-dragover-below');
                } else {
                    this.$el.addClass('is-dragover');
                }
            }

            if (Ctx.draggedSegment !== null || Ctx.getDraggedAnnotation() !== null) {
                if (ev.target.classList.contains('idealist-dropzone')) {
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
        onDragLeave: function (ev) {
            if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.dragOverCounter = 0;
            this.$el.removeClass('is-dragover is-dragover-above is-dragover-below');
        },

        /**
         * @event
         */
        onDrop: function (ev) {
            if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            }

            var isDraggedBelow = this.$el.hasClass('is-dragover-below'),
                isDraggedAbove = this.$el.hasClass('is-dragover-above');

            this.$('.idealist-body').trigger('dragleave');

            var segment = Ctx.getDraggedSegment();
            if (segment) {
                if (isDraggedBelow) {
                    // Add as a child idea
                    var newIdea = this.model.addSegmentAsChild(segment);
                    Ctx.setCurrentIdea(newIdea);
                } else {
                    // Add to the current idea
                    this.model.addSegment(segment);
                }

                return;
            }

            var annotation = Ctx.getDraggedAnnotation();
            if (annotation) {
                if (isDraggedBelow) {
                    // Add as a child idea
                    Ctx.currentAnnotationIdIdea = null;
                    Ctx.currentAnnotationNewIdeaParentIdea = this.model;
                    Ctx.saveCurrentAnnotationAsExtract();
                } else {
                    // Add as a segment
                    Ctx.currentAnnotationIdIdea = this.model.getId();
                    Ctx.currentAnnotationNewIdeaParentIdea = null;
                    Ctx.saveCurrentAnnotationAsExtract();
                }

                return;
            }

            if (Ctx.draggedIdea && Ctx.draggedIdea.cid !== this.model.cid) {

                var idea = Ctx.getDraggedIdea();

                // If it is a descendent, do nothing
                if (this.model.isDescendantOf(idea)) {
                    return;
                }

                if (isDraggedAbove) {
                    this.model.addSiblingAbove(idea);
                } else if (isDraggedBelow) {
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
        toggle: function (ev) {
            if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            }

            if (this.$el.hasClass('is-open')) {
                this.close();
            } else {
                this.open();
            }
        }

    });

    return IdeaView;
});
