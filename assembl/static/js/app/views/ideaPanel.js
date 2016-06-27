'use strict';

var Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    EditableField = require('./reusableDataFields/editableField.js'),
    CKEditorField = require('./reusableDataFields/ckeditorField.js'),
    Permissions = require('../utils/permissions.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    MessagesInProgress = require('../objects/messagesInProgress.js'),
    SegmentList = require('./segmentList.js'),
    Announcements = require('./announcements.js'),
    Widget = require('../models/widget.js'),
    AgentViews = require('./agent.js'),
    WidgetLinks = require('./widgetLinks.js'),
    WidgetButtons = require('./widgetButtons.js'),
    CollectionManager = require('../common/collectionManager.js'),
    AssemblPanel = require('./assemblPanel.js'),
    Marionette = require('../shims/marionette.js'),
    $ = require('jquery'),
    _ = require('underscore'),
    Promise = require('bluebird');

var IdeaPanel = AssemblPanel.extend({
  constructor: function IdeaPanel() {
    AssemblPanel.apply(this, arguments);
  },

  template: '#tmpl-ideaPanel',
  panelType: PanelSpecTypes.IDEA_PANEL,
  className: 'ideaPanel',
  minimizeable: true,
  closeable: false,
  gridSize: AssemblPanel.prototype.IDEA_PANEL_GRID_SIZE,
  minWidth: 295,
  ideaPanelOpensAutomatically: true,

  initialize: function(options) {
    AssemblPanel.prototype.initialize.apply(this, arguments);
    var that = this, collectionManager = new CollectionManager();
    this.panelWrapper = options.panelWrapper;

    if (!this.model) {
      this.model = this.getGroupState().get('currentIdea');
    }

    collectionManager.getAllWidgetsPromise();

    var pref = Ctx.getPreferences();
    this.ideaPanelOpensAutomatically = "idea_panel_opens_automatically" in pref ? pref.idea_panel_opens_automatically : true;

    if(!this.isViewDestroyed()) {
      //Yes, it IS possible the view is already destroyed in initialize, so we check
      this.listenTo(this.getGroupState(), "change:currentIdea", function(state, currentIdea) {
        if (!this.isViewDestroyed()) {
          that.setIdeaModel(currentIdea);
        }
      });

      this.listenTo(this.getContainingGroup(), "change:pseudoIdea", function(currentIdea) {
        //console.log("Pseudo-idea listen hack fired on ideaPanel");
        if (!this.isViewDestroyed()) {
          that.setIdeaModel(currentIdea);
        }
      }
      );

      this.listenTo(Assembl.vent, 'DEPRECATEDideaPanel:showSegment', function(segment) {
        if (!this.isViewDestroyed()) {
          that.showSegment(segment);
        }
      });

      if (this.model) {
        //This is a silly hack to go through setIdeaModel properly - benoitg
        var model = this.model;
        this.model = null;
        this.setIdeaModel(model);
      }
    }
  },
  ui: {
    'postIt': '.postitlist',
    'definition': '.js_editDefinitionRegion',
    'longTitle': '.js_editLongTitleRegion',
    'deleteIdea': '.js_ideaPanel-deleteBtn',
    'clearIdea': '.js_ideaPanel-clearBtn',
    'closeExtract': '.js_closeExtract',
    'contributorsSection': '.ideaPanel-section-contributors',
    'announcement': '.ideaPanel-announcement-region',
    'widgetsSection': '.js_ideaPanel-section-widgets',
    'adminSection': '.js_ideaPanel-section-admin',
  },
  regions: {
    segmentList: ".postitlist",
    contributors: ".contributors",
    widgetsInteractionRegion: ".js_ideaPanel-section-access-widgets-region",
    widgetsConfigurationInteraction: ".ideaPanel-section-conf-widgets",
    widgetsCreationInteraction: ".ideaPanel-section-create-widgets",
    widgetsSeeResultsInteraction: ".ideaPanel-section-see-results",
    announcementRegion: "@ui.announcement",
    regionLongTitle: '@ui.longTitle',
    regionDescription: '@ui.definition'
  },
  modelEvents: {
    //Do NOT listen to change here
    //'replacedBy': 'onReplaced',
    'change': 'requestRender'
  },
  events: {
    'dragstart @ui.postIt': 'onDragStart', //Fired on the element that is the origin of the drag, so when the user starts dragging one of the extracts CURRENTLY listed in the idea
    'dragend @ui.postIt': 'onDragEnd',  //Fired on the element that is the origin of the drag
    
    'dragenter': 'onDragEnter', //Fired on drop targets. So when the user is dragging something from anywhere and moving the mouse towards this panel
    'dragover': 'onDragOver', //Fired on drop targets.  Formerly these events were limited to  @ui.postIt, but that resulted in terrible UX.  Let's make the entire idea panel a drop zone
    'dragleave': 'onDragLeave', //Fired on drop targets.  
    'drop': 'onDrop', //Fired on drop targets.  
    'click @ui.closeExtract': 'onSegmentCloseButtonClick',
    'click @ui.clearIdea': 'onClearAllClick',
    'click @ui.deleteIdea': 'onDeleteButtonClick',
    'click .js_openTargetInPopOver': 'openTargetInPopOver'
  },

  requestRender: function() {
    var that = this;

    setTimeout(function(){
      if(!that.isViewDestroyed()) {
        //console.log("Render from ideaList requestRender");
        that.render();
      }
    }, 1);
  },

  getTitle: function() {
    return i18n.gettext('Idea');
  },

  tooltip: i18n.gettext('Detailled information about the currently selected idea in the Table of ideas'),

  /**
   * This is not inside the template because babel wouldn't extract it in
   * the pot file
   */
  getSubIdeasLabel: function(subIdeas) {
    if (subIdeas.length == 0) {
      return i18n.gettext('This idea has no sub-ideas');
    }
    else {
      return i18n.sprintf(i18n.ngettext('This idea has %d sub-idea', 'This idea has %d sub-ideas', subIdeas.length), subIdeas.length);
    }
  },

  /**
   * This is not inside the template because babel wouldn't extract it in
   * the pot file
   */
  getExtractsLabel: function() {
    var len = 0;

    if (this.extractListSubset) {
      len = this.extractListSubset.models.length;
    }

    if (len == 0) {
      if (Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
        return i18n.gettext('No extract was harvested');
      }
      else {
        return i18n.gettext('No important nugget was harvested');
      }
    }
    else {
      if (Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
        return i18n.sprintf(i18n.ngettext('%d extract was harvested', '%d extracts were harvested', len), len);
      }
      else {
        return i18n.sprintf(i18n.ngettext('%d important nugget was harvested', '%d important nuggets were harvested', len), len);
      }
    }
  },

  renderTemplateGetExtractsLabel: function() {
    this.$('.js_extractsSummary').html(
        this.getExtractsLabel());
  },

  serializeData: function() {
    if (Ctx.debugRender) {
      console.log("ideaPanel::serializeData()");
    }

    var subIdeas = {},
        currentUser = Ctx.getCurrentUser(),
        canEdit = currentUser.can(Permissions.EDIT_IDEA) || false,
        canEditNextSynthesis = currentUser.can(Permissions.EDIT_SYNTHESIS),
        direct_link_relative_url = null,
        share_link_url = null,
        contributors = undefined;

    if (this.model) {
      subIdeas = this.model.getChildren();

      direct_link_relative_url = this.model.getRouterUrl({
        parameters: {
          'source': 'share'
        },
        relative: true
      });
      share_link_url = Ctx.appendExtraURLParams("/static/widget/share/index.html",
        [
          {'u': Ctx.getAbsoluteURLFromRelativeURL(direct_link_relative_url) },
          {'t': this.model.get('shortTitle')},
          {'s': Ctx.getPreferences().social_sharing }
        ]
      );
    }

    return {
      idea: this.model,
      subIdeas: subIdeas,
      canEdit: canEdit,
      i18n: i18n,
      getExtractsLabel: this.getExtractsLabel,
      getSubIdeasLabel: this.getSubIdeasLabel,
      canDelete: currentUser.can(Permissions.EDIT_IDEA),
      canEditNextSynthesis: canEditNextSynthesis,
      canEditExtracts: currentUser.can(Permissions.EDIT_EXTRACT),
      canEditMyExtracts: currentUser.can(Permissions.EDIT_MY_EXTRACT),
      canAddExtracts: currentUser.can(Permissions.EDIT_EXTRACT), //TODO: This is a bit too coarse
      Ctx: Ctx,
      direct_link_relative_url: direct_link_relative_url,
      share_link_url: share_link_url
    };

  },

  onRender: function() {
    var that = this, collectionManager = new CollectionManager(),
        currentUser = Ctx.getCurrentUser();

    if (Ctx.debugRender) {
      console.log("ideaPanel::onRender()");
    }

    Ctx.removeCurrentlyDisplayedTooltips(this.$el);

    Ctx.initTooltips(this.$el);

    if (this.model && this.model.id  && this.extractListSubset) {
      //Only fetch extracts if idea already has an id.
      //console.log(this.extractListSubset);
      // display only important extract for simple user
      if (!Ctx.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
        this.extractListSubset.models = _.filter(this.extractListSubset.models, function(model) {
          return model.get('important');
        });
      }

      this.getExtractslist();

      this.renderShortTitle();

      this.renderAnnouncement();

      this.renderCKEditorDescription();

      if (currentUser.can(Permissions.EDIT_SYNTHESIS)) {
        this.renderCKEditorLongTitle();
      }

      this.renderContributors();

      if( currentUser.can(Permissions.EDIT_IDEA) || currentUser.can(Permissions.EDIT_SYNTHESIS) ) {
        this.ui.adminSection.removeClass("hidden");
      }

      collectionManager.getWidgetsForContextPromise(
        Widget.Model.prototype.IDEA_PANEL_ACCESS_CTX,
        that.model).then(function(subset) {
          that.widgetsInteractionRegion.show(
            new WidgetButtons.WidgetButtonListView({collection: subset}));
          if(subset.length > 0) {
            that.ui.widgetsSection.removeClass("hidden");
          }
        });
      if (currentUser.can(Permissions.ADMIN_DISCUSSION)) {
        collectionManager.getWidgetsForContextPromise(
          Widget.Model.prototype.IDEA_PANEL_CONFIGURE_CTX,
          that.model).then(function(subset) {
            that.widgetsConfigurationInteraction.show(
              new WidgetLinks.WidgetLinkListView({collection: subset}));
          });

        //Check that the type of the widgetModel is localType, can see results, then show it.

        that.widgetsCreationInteraction.show(
          new WidgetLinks.WidgetLinkListView({
            context: Widget.Model.prototype.IDEA_PANEL_CREATE_CTX,
            collection: Widget.localWidgetClassCollection,
            idea: that.model
          }));
      }
    }

  },

  onAttach: function() {
    if ( !this.isViewDestroyed() ) {
      if ( !this.ideaPanelOpensAutomatically ){
        this.panelWrapper.minimizePanel(); // even if there is a this.model
      }
    }
  },

  getExtractslist: function() {
    var that = this,
        collectionManager = new CollectionManager();

    if (this.extractListSubset) {
      Promise.join(collectionManager.getAllExtractsCollectionPromise(),
                  collectionManager.getAllUsersCollectionPromise(),
                  collectionManager.getAllMessageStructureCollectionPromise(),
                function(allExtractsCollection, allUsersCollection, allMessagesCollection) {

                  that.extractListView = new SegmentList.SegmentListView({
                    collection: that.extractListSubset,
                    allUsersCollection: allUsersCollection,
                    allMessagesCollection: allMessagesCollection
                  });

                  that.getRegion('segmentList').show(that.extractListView);
                  that.renderTemplateGetExtractsLabel();
                });
    } else {
      this.renderTemplateGetExtractsLabel();
    }
  },

  renderContributors: function() {
    var that = this,
    collectionManager = new CollectionManager();

    collectionManager.getAllUsersCollectionPromise().then(function(allAgents) {
      var contributorsRaw = that.model.get('contributors'),
      contributorsId = [],
      allAgents = allAgents;
      _.each(contributorsRaw, function(contributorId) {
        contributorsId.push(contributorId);
      });
      //console.log(contributorsId);
      var ContributorAgentSubset = Backbone.Subset.extend({
        constructor: function ContributorAgentSubset() {
          Backbone.Subset.apply(this, arguments);
        },

        name: 'ContributorAgentSubset',
        sieve: function(agent) {
          //console.log(agent.id, _.indexOf(contributorsId, agent.id), contributorsId);
          return _.indexOf(contributorsId, agent.id) !== -1;
        },
        parent: function() {
          return allAgents
        }
      });

      var contributors = new ContributorAgentSubset()

      //console.log(contributors);
      var avatarCollectionView = Marionette.CollectionView.extend({
        constructor: function avatarCollectionView() {
          Marionette.CollectionView.apply(this, arguments);
        },

        childView: AgentViews.AgentAvatarView
      });
      var avatarsView = new avatarCollectionView({
        collection: contributors
      });

      that.contributors.show(avatarsView);
      that.ui.contributorsSection.find('.title-text').html(i18n.sprintf(i18n.ngettext('%d contributor', '%d contributors', contributorsId.length), contributorsId.length));

      if(contributorsId.length > 0) {

        that.ui.contributorsSection.removeClass('hidden');
      }
    });

  },

  renderShortTitle: function() {

    var currentUser = Ctx.getCurrentUser(),
        canEdit = currentUser.can(Permissions.EDIT_IDEA) || false,
        modelId = this.model.id,
        partialMessage = MessagesInProgress.getMessage(modelId);

    var shortTitleField = new EditableField({
      'model': this.model,
      'modelProp': 'shortTitle',
      'class': 'panel-editablearea text-bold',
      'data-tooltip': i18n.gettext('Short expression (only a few words) of the idea in the table of ideas.'),
      'placeholder': i18n.gettext('New idea'),
      'canEdit': canEdit,
      'focus': this.focusShortTitle
    });
    shortTitleField.renderTo(this.$('.ideaPanel-shorttitle'));

  },

  /**
   * Add a segment
   * @param  {Segment} segment
   */
  addSegment: function(segment) {
    delete segment.attributes.highlights;

    var id = this.model.getId(),
        that = this;
    segment.save('idIdea', id, {
      success: function(model, resp) {
        //console.log('SUCCESS: addSegment', resp);
        that.extractListView.render();
      },
      error: function(model, resp) {
        console.error('ERROR: addSegment', resp);
      }
    });
  },

  /**
   * Shows the given segment with an small fx
   * @param {Segment} segment
   */
  showSegment: function(segment) {
    var that = this,
        selector = Ctx.format('.box[data-segmentid={0}]', segment.cid),
        idIdea = segment.get('idIdea'),
        box,
        collectionManager = new CollectionManager();

    collectionManager.getAllIdeasCollectionPromise()
            .then(function(allIdeasCollection) {
              var idea = allIdeasCollection.get(idIdea);
              if (!idea) {
                return;
              }

              that.setIdeaModel(idea);
              box = that.$(selector);

              if (box.length) {
                var panelBody = that.$('.panel-body');
                var panelOffset = panelBody.offset().top;
                var offset = box.offset().top;

                // Scrolling to the element
                var target = offset - panelOffset + panelBody.scrollTop();
                panelBody.animate({ scrollTop: target });
                box.highlight();
              }
            }

        );
  },

  onReplaced: function(newObject) {
    if (this.model !== null) {
      this.stopListening(this.model, 'replacedBy acquiredId');
    }

    this.setIdeaModel(newObject);
  },

  /**
   * Set the given idea as the current one
   * @param  {Idea|null} idea
   */
  setIdeaModel: function(idea, reason) {
      var that = this;
      if (reason === "created") {
        this.focusShortTitle = true;
      }
      else {
        this.focusShortTitle = false;
      }

      //console.log("setIdeaModel called with", idea, reason);
      if (idea !== this.model) {
        if (this.model !== null) {
          this.stopListening(this.model);
        }

        this.model = idea;

        //console.log("this.extractListSubset before setIdea:", this.extractListSubset);
        if (this.extractListSubset) {
          this.stopListening(this.extractListSubset);
          this.extractListSubset = null;
        }

        if (this.extractListView) {
          this.extractListView.unbind();
          this.extractListView = null;
        }

        if (this.model) {
          //this.resetView();
          //console.log("setIdeaModel:  we have a model ")
          if (!this.isViewDestroyed()) {
            if ( that.ideaPanelOpensAutomatically ){
              this.panelWrapper.unminimizePanel();
            }
            this.template = '#tmpl-loader';
            if (!this.model.id) {
              //console.log("setIdeaModel:  we have a model, but no id ")
              if (this.isViewRenderedAndNotYetDestroyed()) {
                this.render();
              }

              this.listenTo(this.model, 'acquiredId', function(m) {
                // model has acquired an ID. Reset everything.
                if (!this.isViewDestroyed()) {
                  var model = that.model;
                  that.model = null;
                  that.setIdeaModel(model, reason);
                }
              });
            }
            else {
              //console.log("setIdeaModel:  we have a model, and an id ")
              this.fetchModelAndRender();
            }
          }
        }
      }

      if (idea === null) {
        //console.log("setIdeaModel:  we have NO model ")
        //TODO: More sophisticated behaviour here, depending
        //on if the panel was opened by selection, or by something else.
        //If we don't call render here, the panel will not refresh if we delete an idea.
        if (!this.isViewDestroyed()) {
          this.template = '#tmpl-ideaPanel';
          if ( that.ideaPanelOpensAutomatically ){
            this.panelWrapper.minimizePanel();
          }
        }
        if (this.isViewRenderedAndNotYetDestroyed()) {
          this.render();
        }
      }
    },

  fetchModelAndRender: function() {
      var that = this,
      collectionManager = new CollectionManager(),
      fetchPromise = this.model.fetch({ data: $.param({ view: 'contributors'}) });
      Promise.join(collectionManager.getAllExtractsCollectionPromise(), fetchPromise,
          function(allExtractsCollection, fetchedJQHR) {
            //View could be gone, or model may have changed in the meantime
            if (that.isViewRenderedAndNotYetDestroyed() && that.model) {
              that.extractListSubset = new SegmentList.IdeaSegmentListSubset([], {
                parent: allExtractsCollection,
                ideaId: that.model.id
              });
              that.listenTo(that.extractListSubset, "add remove reset change", that.renderTemplateGetExtractsLabel);

              //console.log("The region:", that.segmentList);
              that.template = '#tmpl-ideaPanel';
              that.render();
            }
          }

      );
    },

  deleteCurrentIdea: function() {
    // to be deleted, an idea cannot have any children nor segments
    var that = this,
        children = this.model.getChildren();

    this.blockPanel();
    this.model.getExtractsPromise()
            .then(function(ideaExtracts) {

              that.unblockPanel();
              if (children.length > 0) {
                that.unblockPanel();
                alert(i18n.gettext('You cannot delete an idea while it has sub-ideas.'));
              }

              // Nor has any segments
              else if (ideaExtracts.length > 0) {
                that.unblockPanel();
                console.log(ideaExtracts);
                alert(i18n.gettext('You cannot delete an idea associated to extracts.'));
              }
              else if (that.model.get('num_posts') > 0) {
                that.unblockPanel();
                alert(i18n.gettext('You cannot delete an idea associated to comments.'));
              }
              else {
                // That's a bingo
                var ok = confirm(i18n.gettext('Confirm that you want to delete this idea.'));

                if (ok) {
                  that.model.destroy({
                    success: function() {
                      that.unblockPanel();
                      that.getContainingGroup().setCurrentIdea(null);
                    },
                    error: function(model, resp) {
                      console.error('ERROR: deleteCurrentIdea', resp);
                    }
                  });
                }
                else {
                  that.unblockPanel();
                }
              }
            });
  },

  // when the user starts dragging one of the extracts listed in the idea
  // no need for any ev.preventDefault() here
  onDragStart: function(ev) {
    //console.log("ideaPanel::onDragStart() ev: ", ev);

    var that = this,
        collectionManager = new CollectionManager();

    //TODO: Deal with editing own extract (EDIT_MY_EXTRACT)
    if (Ctx.getCurrentUser().can(Permissions.EDIT_EXTRACT)) {
      collectionManager.getAllExtractsCollectionPromise()
            .then(function(allExtractsCollection) {
              ev.currentTarget.style.opacity = 0.4;

              ev.originalEvent.dataTransfer.effectAllowed = 'all';
              ev.originalEvent.dataTransfer.dropEffect = 'move';

              var cid = ev.currentTarget.getAttribute('data-segmentid'),
                  segment = allExtractsCollection.getByCid(cid);

              Ctx.showDragbox(ev, segment.getQuote());
              Ctx.setDraggedSegment(segment);

            })
            .catch(function(error){
              console.log("promise error: ", error);
            });
    }
  },

  // "The dragend event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key)." quote https://developer.mozilla.org/en-US/docs/Web/Events/dragend
  onDragEnd: function(ev) {
    //console.log("ideaPanel::onDragEnd() ev: ", ev);

    this.$el.removeClass('is-dragover');
    if ( ev && "currentTarget" in ev ) {
        ev.currentTarget.style.opacity = 1;
    }
    Ctx.setDraggedAnnotation(null);
    Ctx.setDraggedSegment(null);
  },


  // The dragenter event is fired when the mouse enters a drop target while dragging something
  // We have to define dragenter and dragover event listeners which both call ev.preventDefault() in order to be sure that subsequent drop event will fire => http://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome
  // "Calling the preventDefault method during both a dragenter and dragover event will indicate that a drop is allowed at that location." quote https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations#droptargets
  onDragEnter: function(ev) {
    //console.log("ideaPanel::onDragEnter() ev: ", ev);
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    if (Ctx.getDraggedSegment() !== null || Ctx.getDraggedAnnotation() !== null) {
      this.$el.addClass("is-dragover");
    }
    else
      {
      console.log("segment or annotation is null");
      }
  },

  // The dragover event is fired when an element or text selection is being dragged over a valid drop target (every few hundred milliseconds).
  // We have to define dragenter and dragover event listeners which both call ev.preventDefault() in order to be sure that subsequent drop event will fire => http://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome
  // "Calling the preventDefault method during both a dragenter and dragover event will indicate that a drop is allowed at that location." quote https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations#droptargets
  onDragOver: function(ev) {
    //console.log("ideaPanel::onDragOver() ev: ", ev);
    if (Ctx.debugAnnotator) {
      console.log("ideaPanel:onDragOver() fired", Ctx.getDraggedSegment(), Ctx.getDraggedAnnotation());
    }
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    if (ev.originalEvent) {
      ev = ev.originalEvent;
    }

    // /!\ See comment at the top of the onDrop() method
    if ( ev && "dataTransfer" in ev ) {
      if ( "effectAllowed" in ev.dataTransfer
        && (ev.dataTransfer.effectAllowed == "move" || ev.dataTransfer.effectAllowed == "link")
      ){
        ev.dataTransfer.dropEffect = ev.dataTransfer.effectAllowed;
      }
      else {
        ev.dataTransfer.dropEffect = 'link';
        ev.dataTransfer.effectAllowed = 'link';
      }
    }

    if (Ctx.getDraggedSegment() !== null || Ctx.getDraggedAnnotation() !== null) {
      //Because sometimes spurious dragLeave can be fired
      if(!this.$el.hasClass("is-dragover")) {
        console.log("element doesn't have is-dragover class");
        this.$el.addClass("is-dragover");
      }
    }
  },

  // "Finally, the dragleave event will fire at an element when the drag leaves the element. This is the time when you should remove any insertion markers or highlighting. You do not need to cancel this event. [...] The dragleave event will always fire, even if the drag is cancelled, so you can always ensure that any insertion point cleanup can be done during this event." quote https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations
  onDragLeave: function(ev) {
    //console.log("ideaPanel::onDragLeave() ev: ", ev);
    ev.stopPropagation();
    ev.preventDefault();
    if(ev.currentTarget == ev.target) {
    this.$el.removeClass('is-dragover');
    }
  },

  // /!\ The browser will not fire the drop event if, at the end of the last call of the dragenter or dragover event listener (right before the user releases the mouse button), one of these conditions is met:
  // * one of ev.dataTransfer.dropEffect or ev.dataTransfer.effectAllowed is "none"
  // * ev.dataTransfer.dropEffect is not one of the values allowed in ev.dataTransfer.effectAllowed
  // "If you don't change the effectAllowed property, then any operation is allowed, just like with the 'all' value. So you don't need to adjust this property unless you want to exclude specific types." quote https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations
  // "During a drag operation, a listener for the dragenter or dragover events can check the effectAllowed property to see which operations are permitted. A related property, dropEffect, should be set within one of these events to specify which single operation should be performed. Valid values for the dropEffect are none, copy, move, or link." quote https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
  // ev.preventDefault() is also needed here in order to prevent default action (open as link for some elements)
  onDrop: function(ev) {
    //console.log("ideaPanel::onDrop() ev: ", ev);
    if (Ctx.debugAnnotator) {
      console.log("ideaPanel:onDrop() fired");
    }

    if (ev) {
      ev.preventDefault();
    }

    this.$el.removeClass('is-dragover');

    this.$el.trigger('dragleave');

    var segment = Ctx.getDraggedSegment();

    if (segment) {
      this.addSegment(segment);
      Ctx.setDraggedSegment(null);
    }

    var annotation = Ctx.getDraggedAnnotation();

    if (annotation) {
      // Add as a segment
      Ctx.currentAnnotationIdIdea = this.model.getId();
      Ctx.currentAnnotationNewIdeaParentIdea = null;
      Ctx.saveCurrentAnnotationAsExtract();
    }

    if(!segment && !annotation) {
      console.error("Neither a segment nor an annotation was available after Drop");
    }
    this.extractListView.render();
    return;
  },

  onSegmentCloseButtonClick: function(ev) {
    var cid = ev.currentTarget.getAttribute('data-segmentid'),
        collectionManager = new CollectionManager();
    collectionManager.getAllExtractsCollectionPromise().done(
            function(allExtractsCollection) {
              var segment = allExtractsCollection.get(cid);

              if (segment) {
                segment.save('idIdea', null);
              }
            });
  },

  onClearAllClick: function(ev) {
    var ok = confirm(i18n.gettext('Confirm that you want to send all extracts back to the clipboard.'));
    if (ok) {
      // Clone first, because the operation removes extracts from the subset.
      var models = _.clone(this.extractListSubset.models)
      _.each(models, function(extract) {
        extract.set('idIdea', null);
      });
      _.each(models, function(extract) {
        extract.save();
      });
    }
  },

  onDeleteButtonClick: function() {
    this.deleteCurrentIdea();
  },

  renderAnnouncement:  function() {
    var that = this,
    collectionManager = new CollectionManager();

    if (Ctx.getCurrentUser().can(Permissions.EDIT_IDEA)) {
      this.ui.announcement.removeClass('hidden');
      collectionManager.getAllAnnouncementCollectionPromise().then(
          function(allAnnouncementCollection) {
            // Filters on only this idea's announce (should be only one...)
            var AnnouncementIdeaSubset = Backbone.Subset.extend({
              constructor: function AnnouncementIdeaSubset() {
                Backbone.Subset.apply(this, arguments);
              },

              beforeInitialize: function(models, options) {
                this.idea = options.idea;
                if (!this.idea) {
                  throw new Error("AnnouncementIdeaSubset mush have an idea")
                }
              },
              sieve: function(announcement) {
                return announcement.get('idObjectAttachedTo') == this.idea.id;
              }
            });

            var announcementIdeaSubsetCollection = new AnnouncementIdeaSubset(
              [],
              {
                idea: that.model,
                parent: allAnnouncementCollection
              }
            )
            var editableAnnouncementView = new Announcements.AnnouncementEditableCollectionView({
              collection: announcementIdeaSubsetCollection,
              objectAttachedTo: that.model
            });
            that.getRegion('announcementRegion').show(editableAnnouncementView);
          });
    }
  },

  renderCKEditorDescription: function() {
    var that = this;

    var model = this.model.getDefinitionDisplayText();

    if (!model.length) return;

    var description = new CKEditorField({
      'model': this.model,
      'modelProp': 'definition',
      'placeholder': i18n.gettext('You may want to describe this idea for users here...'),
      'showPlaceholderOnEditIfEmpty': false,
      'canEdit': Ctx.getCurrentUser().can(Permissions.EDIT_IDEA),
      autosave: true,
      'openInModal': true
    });

    this.regionDescription.show(description);
  },

  renderCKEditorLongTitle: function() {
    var that = this;

    var model = this.model.getLongTitleDisplayText();
    if (!model.length) return;

    var ckeditor = new CKEditorField({
      'model': this.model,
      'modelProp': 'longTitle',
      'canEdit': Ctx.getCurrentUser().can(Permissions.EDIT_SYNTHESIS),
      autosave: true,
      'openInModal': true
    });

    this.regionLongTitle.show(ckeditor);
  },

  openTargetInPopOver: function(evt) {
    console.log("ideaPanel openTargetInPopOver(evt: ", evt);
    return Ctx.openTargetInPopOver(evt);
  }

});

module.exports = IdeaPanel;
