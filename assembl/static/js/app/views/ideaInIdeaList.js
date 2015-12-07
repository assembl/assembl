'use strict';

var Backbone = require('../shims/backbone.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Permissions = require('../utils/permissions.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    Analytics = require('../internal_modules/analytics/dispatcher.js');

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
  template: Ctx.loadTemplate('ideaInIdeaList'),

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
  initialize: function(options, view_data) {
    var that = this;
    this.view_data = view_data;
    this.parentPanel = options.parentPanel;
    if (this.parentPanel === undefined) {
      throw new Error("parentPanel is mandatory");
    }

    if (options.groupContent) {
      this._groupContent = options.groupContent;
    }
    else {
      throw new Error("groupContent must be passed in constructor options");
    }

    this.listenTo(this.model, 'change change:inNextSynthesis', this.render);
    this.listenTo(this.model, 'replacedBy', this.onReplaced);

    this.listenTo(this.parentPanel.getGroupState(), "change:currentIdea", function(state, currentIdea) {
          that.onIsSelectedChange(currentIdea);
        });
  },

  /**
   * The events
   * @type {Object}
   */
  events: {
    'change input[type="checkbox"]': 'onCheckboxChange',
    'click .idealist-title': 'onTitleClick',
    'click .idealist-abovedropzone': 'onTitleClick',
    'click .idealist-dropzone': 'onTitleClick',
    'click .js_idealist-title-unread-count': 'onUnreadCountClick',
    'click .idealist-arrow': 'toggle',
    'dragstart .idealist-body': 'onDragStart', // when the user starts dragging this idea
    'dragend .idealist-body': 'onDragEnd',
    'dragover .idealist-body': 'onDragOver',
    'dragleave .idealist-body': 'onDragLeave',
    'drop .idealist-body': 'onDrop',
    'mouseleave > .idealist-body > .idealist-title': 'onMouseLeave',
    'mouseenter > .idealist-body > .idealist-title': 'onMouseEnter',
  },

  /**
   * The render
   * @return {IdeaView}
   */
  render: function() {
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

    this.onIsSelectedChange(this.parentPanel.getGroupState().get('currentIdea'));

    if (data.isOpen === true) {
      this.$el.addClass('is-open');
    } else {
      this.$el.removeClass('is-open');
    }

    if (data.longTitle) {
      data.longTitle = ' - ' + data.longTitle.substr(0, 50);
    }

    data.Ctx = Ctx;
    data.idea_css_class = this.model.getCssClassFromId();

    data.shortTitle = this.model.getShortTitleDisplayText();

    this.$el.html(this.template(data));
    // Ctx.initTooltips(this.$el); // this is already done by ideaList.js and is very CPU intensive
    var rendered_children = [];
    _.each(data['children'], function(idea, i) {
      var ideaView = new IdeaView({model: idea, parentPanel: that.parentPanel, groupContent: that._groupContent}, view_data);
      rendered_children.push(ideaView.render().el);
    });
    this.$('.idealist-children').append(rendered_children);

    return this;
  },

  /**
   * Show the childen
   */
  open: function() {
    this.model.set('isOpen', true);
    this.$el.addClass('is-open');
  },

  /**
   * Hide the childen
   */
  close: function() {
    this.model.set('isOpen', false);
    this.$el.removeClass('is-open');
  },

  /**
   * @event
   */
  onIsSelectedChange: function(idea) {
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
  onMouseEnter: function(idea) {
      this.$('> .idealist-body').addClass('is-hovered');
  },

  /**
   * @event
   */
  onMouseLeave: function(idea) {
      this.$('> .idealist-body').removeClass('is-hovered');
  },

  /**
   * @event
   */
  onReplaced: function(newObject) {
    this.model = newObject;
  },

  getContainingGroup: function() {
    return this._groupContent;
  },

  /**
   * @event
   */
  onCheckboxChange: function(ev) {
    ev.stopPropagation();
    this.model.save({'inNextSynthesis': ev.currentTarget.checked}, {
      success: function(model, resp) {
            },
      error: function(model, resp) {
        console.error('ERROR: onCheckboxChange', resp);
      }
    });

    //Optimisation.  It would self render once the socket propagates,
    //but this gives better responsiveness.
    Assembl.commands.execute('synthesisPanel:render');
  },

  /**
   * @param is_unread:  Filter on the unread status of messages 
   *                      false: only read messages
   *                      true: only unread messages
   *                      null: don't filter
   */
  doIdeaChange: function(is_unread) {
      var messageListView = this._groupContent.findViewByType(PanelSpecTypes.MESSAGE_LIST);
      
      var analytics = Analytics.getInstance();
      console.log('Tracking event on idea ', this.model.getShortTitleDisplayText())
      if(!is_unread) {
        analytics.trackEvent(analytics.events.OPEN_IDEA_IN_TABLE_OF_IDEAS);
      }
      else {
        analytics.trackEvent(analytics.events.OPEN_IDEA_NEW_MESSAGES_IN_TABLE_OF_IDEAS);
      }
      analytics.trackEvent(analytics.events.NAVIGATE_TO_IDEA_IN_TABLE_OF_IDEAS);
      this._groupContent.setCurrentIdea(this.model);
      if (messageListView) {
        //Syncing with current idea below isn't sufficient, as we need to set/unset the unread filter
        messageListView.triggerMethod('messageList:clearAllFilters');
        messageListView.trigger('messageList:addFilterIsRelatedToIdea', this.model, is_unread);
      }

      // Why is this call here?  benoitg - 2015-06-09
      this._groupContent.NavigationResetDebateState(false);
    },

  /**
   * @event
   * Select this idea as the current idea
   */
  onTitleClick: function(e) {
      e.stopPropagation();
      this.doIdeaChange(null);
      if (Ctx.getCurrentUserId()) {
        // tell the backend that the idea was read
        $.ajax("/data/Discussion/" + Ctx.getDiscussionId() + "/ideas/" + this.model.getNumericId() + "/actions", {
          method: "POST",
          contentType: "application/json",
          data: '{"@type":"ViewIdea"}'
        });
      }
    },

  /**
   * @event
   * Select this idea as the current idea, and show only unread messages of this idea
   */
  onUnreadCountClick: function(e) {
    e.stopPropagation();
    this.doIdeaChange(true);
  },

  /**
   * @event
   * when the user starts dragging this idea
   */
  onDragStart: function(ev) {
    //console.log("ideaInIdeaList::onDragStart() ev: ", ev);
    if (ev) {
      ev.stopPropagation();
      Assembl.vent.trigger('idea:dragStart', this.model);
    }

    if (Ctx.getCurrentUser().can(Permissions.EDIT_IDEA)) {
      ev.currentTarget.style.opacity = 0.4;
      ev.originalEvent.dataTransfer.effectAllowed = 'move';
      ev.originalEvent.dataTransfer.dropEffect = 'move';

      Ctx.showDragbox(ev, this.model.get('shortTitle'));
      Ctx.draggedIdea = this.model;
    }
  },

  /**
   * @event
   */
  onDragEnd: function(ev) {
    //console.log("ideaInIdeaList::onDragEnd() ev: ", ev);
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      Assembl.vent.trigger('idea:dragEnd', this.model);
    }

    ev.currentTarget.style.opacity = '';
    Ctx.setDraggedAnnotation(null);
    Ctx.setDraggedSegment(null);
    Ctx.draggedIdea = null;
  },

  /**
   * @event
   */
  onDragOver: function(ev) {
    //console.log("ideaInIdeaList::onDragOver() ev: ", ev);
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      Assembl.vent.trigger('idea:dragOver', this.model);
    }

    if (ev.originalEvent) {
      ev = ev.originalEvent;
    }

    if (this.dragOverCounter > 30) {
      this.model.set('isOpen', true);
    }

    ev.dataTransfer.dropEffect = 'move';

    if (Ctx.draggedIdea !== null) {

      // Do nothing if it is the same idea
      if (Ctx.draggedIdea.cid === this.model.cid) {
        ev.dataTransfer.dropEffect = 'none';
        return;
      }

      // If it is a descendant, do nothing
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
    } else {
      // extract
      if (ev.dataTransfer.effectAllowed == 'link') {
        ev.dataTransfer.dropEffect = 'link';
      } else {
        ev.dataTransfer.dropEffect = 'move';
      }
    }

    if (Ctx.getDraggedSegment() !== null || Ctx.getDraggedAnnotation() !== null) {
      if (ev.target.classList.contains('idealist-dropzone')) {
        this.$el.addClass('is-dragover-below');
      } else {
        this.$el.addClass('is-dragover');
      }
    }

    //We should user a _.debounce instead for performance reasons benoitg 2014-04-13
    this.dragOverCounter += 1;
  },

  /**
   * @event
   * "Finally, the dragleave event will fire at an element when the drag leaves the element. This is the time when you should remove any insertion markers or highlighting. You do not need to cancel this event. [...] The dragleave event will always fire, even if the drag is cancelled, so you can always ensure that any insertion point cleanup can be done during this event." quote https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations
   */
  onDragLeave: function(ev) {
    //console.log("ideaInIdeaList::onDragLeave() ev: ", ev);

    this.dragOverCounter = 0;
    this.$el.removeClass('is-dragover is-dragover-above is-dragover-below');
  },

  // /!\ The browser will not fire the drop event if, at the end of the last call of the dragenter or dragover event listener (right before the user releases the mouse button), one of these conditions is met:
  // * one of ev.dataTransfer.dropEffect or ev.dataTransfer.effectAllowed is "none"
  // * ev.dataTransfer.dropEffect is not one of the values allowed in ev.dataTransfer.dropEffect
  // "If you don't change the effectAllowed property, then any operation is allowed, just like with the 'all' value. So you don't need to adjust this property unless you want to exclude specific types." quote https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations
  // "During a drag operation, a listener for the dragenter or dragover events can check the effectAllowed property to see which operations are permitted. A related property, dropEffect, should be set within one of these events to specify which single operation should be performed. Valid values for the dropEffect are none, copy, move, or link." quote https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
  // ev.preventDefault() is also needed here in order to prevent default action (open as link for some elements)
  onDrop: function(ev) {
    //console.log("ideaInIdeaList::onDrop() ev: ", ev);
    if (Ctx.debugAnnotator) {
      console.log("ideaInIdeaList:onDrop() fired", Ctx.getDraggedSegment(), Ctx.getDraggedAnnotation());
    }
    if (ev) {
      ev.preventDefault();
    }

    var isDraggedBelow = this.$el.hasClass('is-dragover-below'),
        isDraggedAbove = this.$el.hasClass('is-dragover-above');

    this.$('.idealist-body').trigger('dragleave');

    var segment = Ctx.getDraggedSegment();
    if (segment) {
      if (isDraggedBelow) {
        // Add as a child idea
        var newIdea = this.model.addSegmentAsChild(segment);
        this._groupContent.setCurrentIdea(newIdea);
        this._groupContent.NavigationResetDebateState(false);
      } else {
        // Add to the current idea
        this.model.addSegment(segment);
      }

      Ctx.setDraggedSegment(null);
      return;
    }

    var annotation = Ctx.getDraggedAnnotation();
    if (annotation) {
      if (isDraggedBelow) {
        // Add as a child idea
        Ctx.currentAnnotationIdIdea = null;
        Ctx.currentAnnotationNewIdeaParentIdea = this.model;
        Ctx.saveCurrentAnnotationAsExtract();
        this._groupContent.NavigationResetDebateState(false);
      } else {
        // Add as a segment
        Ctx.currentAnnotationIdIdea = this.model.getId();
        Ctx.currentAnnotationNewIdeaParentIdea = null;
        Ctx.saveCurrentAnnotationAsExtract();
      }

      return;
    }

    if (Ctx.draggedIdea) {
      var idea = Ctx.popDraggedIdea();
      if (idea.cid !== this.model.cid) {

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
    }
  },

  /**
   * Toggle show/hide an item
   * @event
   * @param  {Event} ev
   */
  toggle: function(ev) {
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

module.exports = IdeaView;
