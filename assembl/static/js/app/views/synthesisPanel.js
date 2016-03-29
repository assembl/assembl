'use strict';

var ObjectTreeRenderVisitor = require('./visitors/objectTreeRenderVisitor.js'),
    Raven = require('raven-js'),
    _ = require('underscore'),
    $ = require('jquery'),
    Marionette = require("../shims/marionette.js"),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    MessageModel = require('../models/message.js'),
    ideaLink = require('../models/ideaLink.js'),
    Synthesis = require('../models/synthesis.js'),
    Idea = require('../models/idea.js'),
    Permissions = require('../utils/permissions.js'),
    IdeaFamilyView = require('./ideaFamily.js'),
    IdeaInSynthesisView = require('./ideaInSynthesis.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js'),
    i18n = require('../utils/i18n.js'),
    EditableField = require('./reusableDataFields/editableField.js'),
    CKEditorField = require('./reusableDataFields/ckeditorField.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Promise = require('bluebird');

var SynthesisPanel = AssemblPanel.extend({
  constructor: function SynthesisPanel() {
    AssemblPanel.apply(this, arguments);
  },

  template: '#tmpl-loader',
  realTemplate: '#tmpl-synthesisPanel',
  panelType: PanelSpecTypes.SYNTHESIS_EDITOR,
  className: 'synthesisPanel',
  gridSize: AssemblPanel.prototype.SYNTHESIS_PANEL_GRID_SIZE,
  /**
   * @init
   */
  initialize: function(obj) {
    AssemblPanel.prototype.initialize.apply(this, arguments);
    var that = this,
        collectionManager = new CollectionManager();

    if (obj.template) {
      this.realTemplate = obj.template;
    }

    if ( "showAsMessage" in obj ){
      this.showAsMessage = obj.showAsMessage;
    }

    //This is used if the panel is displayed as part of a message
    // that publishes this synthesis
    this.messageListView = obj.messageListView;
    this.synthesisIdeaRoots = new Idea.Collection();

    Promise.join(collectionManager.getAllSynthesisCollectionPromise(),
                collectionManager.getAllIdeasCollectionPromise(),
                collectionManager.getAllIdeaLinksCollectionPromise(),
            function(synthesisCollection, allIdeasCollection, allIdeaLinksCollection) {
              if (!that.isViewDestroyed()) {
                that.ideas = allIdeasCollection;
                var rootIdea = allIdeasCollection.getRootIdea(),
                raw_ideas;

                if (!that.model) {
                  //If unspecified, we find the next_synthesis
                  that.model = _.find(synthesisCollection.models, function(model) {
                    return model.get('is_next_synthesis');
                  });
                  that.bindEntityEvents(that.model, that.getOption('modelEvents'));
                }
                that.synthesisIdeas = that.model.getIdeasCollection();
                that.synthesisIdeas.collectionManager = collectionManager;

                that.listenTo(allIdeaLinksCollection, 'reset change:source change:target change:order remove add destroy', function() {
                  //console.log("RE_RENDER FROM CHANGE ON allIdeaLinksCollection");
                  that.render()
                });
                that.template = that.realTemplate;

                that.render();
              }
            });

    //Assembl.commands.setHandler('synthesisPanel:render', this.render);

    this.propagateVisibility(true);
  },

  regions: {
    ideas: ".synthesisPanel-ideas",
    title: ".synthesisPanel-title",
    introduction: ".synthesisPanel-introduction",
    conclusion: ".synthesisPanel-conclusion"
  },

  events: {
    'click .synthesisPanel-publishButton': 'publish'
  },

  modelEvents:{
      'reset change':'render'
    },

  getTitle: function() {
    return i18n.gettext('Synthesis');
  },

  /**
   * The model
   * @type {Synthesis}
   */
  model: null,

  /**
   * The ideas collection
   * @type {Ideas.Collection}
   */
  ideas: null,

  /**
   * The synthesis ideas collection (owned by the synthesis)
   * @type {Ideas.Collection}
   */
  synthesisIdeas: null,

  /**
   * The synthesis root ideas collection (local)
   * @type {Ideas.Collection}
   */
  synthesisIdeaRoots: null,

  /**
   * Flag
   * @type {Boolean}
   */
  collapsed: false,

  showAsMessage: false,

  serializeData: function() {
    var currentUser = Ctx.getCurrentUser(),
        canSend = currentUser.can(Permissions.SEND_SYNTHESIS),
        canEdit = currentUser.can(Permissions.EDIT_SYNTHESIS),
            data = {
              canSend: canSend,
              canEdit: canEdit,
              Ctx: Ctx
            };

    if (this.model)
        data = _.extend(this.model.toJSON(), data);

    return data;
  },

  /**
   * The render
   * @return {SynthesisPanel}
   */
  onRender: function() {
      if (Ctx.debugRender) {
        console.log("synthesisPanel:onRender() is firing");
      }

      var that = this;

      if(that.template !== that.realTemplate) {
        return;
      }

      var view_data = {},
      order_lookup_table = [],
      roots = [],
      collectionManager = new CollectionManager(),
      canEdit = Ctx.getCurrentUser().can(Permissions.EDIT_SYNTHESIS);

      Ctx.removeCurrentlyDisplayedTooltips(this.$el);

      function renderSynthesis(ideasCollection, ideaLinksCollection) {
        // Getting the scroll position
        var body = that.$('.body-synthesis'),
            ideasRegion = that.getRegion("ideas"),
        y = body.get(0) ? body.get(0).scrollTop : 0,
            synthesis_is_published = that.model.get("published_in_post"),
            rootIdea = that.ideas.getRootIdea();

        function inSynthesis(idea) {
          //console.log("Checking",idea,"returning:", retval, "synthesis is next synthesis:", that.model.get('is_next_synthesis'));
          return (!idea.hidden) && idea != rootIdea && ideasCollection.contains(idea);
        }

        if (rootIdea) {
          ideasCollection.visitDepthFirst(ideaLinksCollection, new ObjectTreeRenderVisitor(view_data, order_lookup_table, roots, inSynthesis), rootIdea.getId(), true);
        }

        that.synthesisIdeaRoots.reset(roots);
        var synthesisIdeaRootsView = new Marionette.CollectionView({
          collection: that.synthesisIdeaRoots,
          childView: IdeaFamilyView,
          childViewOptions: {
            view_data: view_data,
            innerViewClass: IdeaInSynthesisView,
            innerViewClassInitializeParams: {
              synthesis: that.model,
              messageListView: that.messageListView,
              parentPanel: that
            }
          }
        });

        ideasRegion.show(synthesisIdeaRootsView);
        body.get(0).scrollTop = y;
        if (canEdit && !synthesis_is_published) {
          var titleField = new EditableField({
            model: that.model,
            modelProp: 'subject'
          });
          that.getRegion("title").show(titleField);

          var introductionField = new CKEditorField({
            model: that.model,
            modelProp: 'introduction',
            placeholder: i18n.gettext("You can add an introduction to your synthesis here..."),
            showPlaceholderOnEditIfEmpty: true,
            autosave: true,
            hideButton: true
          });
          that.getRegion("introduction").show(introductionField);

          var conclusionField = new CKEditorField({
            model: that.model,
            modelProp: 'conclusion',
            placeholder: i18n.gettext("You can add a conclusion to your synthesis here..."),
            showPlaceholderOnEditIfEmpty: true,
            autosave: true,
            hideButton: true
          });
          that.getRegion("conclusion").show(conclusionField);
        }
        else {
          // TODO: Use regions here.
          that.$('.synthesisPanel-title').html(that.model.get('subject'));
          that.$('.synthesisPanel-introduction').html(that.model.get('introduction'));
          that.$('.synthesisPanel-conclusion').html(that.model.get('conclusion'));
        }
        
        Ctx.initTooltips(that.$el);

        if (that.getContainingGroup().model.get('navigationState') == "synthesis") {
          that.$('.synthesisPanel-introduction')[0].id = "tour_step_synthesis_intro";
          Assembl.vent.trigger("requestTour", "synthesis_intro");
          if (roots.length > 0) {
            that.$('.synthesisPanel-ideas')[0].id = "tour_step_synthesis_idea1";
            Assembl.vent.trigger("requestTour", "synthesis_idea1");
          }
        }

      }

      if (this.model.get('is_next_synthesis')) {
        collectionManager.getAllIdeaLinksCollectionPromise().then(function (ideaLinks) {
            renderSynthesis(that.synthesisIdeas, ideaLinks);
        });
      } else {
        var synthesisIdeaLinksCollection = new ideaLink.Collection(that.model.get("idea_links"), {parse: true});
        synthesisIdeaLinksCollection.collectionManager = collectionManager;
        renderSynthesis(this.synthesisIdeas, synthesisIdeaLinksCollection);
      }

      return this;
    },

  /* This will show/hide the checkboxes next to each idea of the tables of ideas when a synthesis creation panel is present/absent. */
  propagateVisibility: function(isVisible) {
    if ( this.showAsMessage ){
      return;
    }
    var el = Assembl.groupContainer.$el;
    if ( el ){
      if (isVisible){
        el.addClass("hasSynthesisPanel");
      }
      else {
        var groupContainerView = this.getPanelWrapper().groupContent.groupContainer;
        var groups = groupContainerView.findGroupsWithPanelInstance(this.panelType);
        if ( !groups || ( groups &&  groups.length < 2) ){
          //console.log("this is the last group which was containing a Synthesis creation panel, so we can remove the CSS class");
          el.removeClass("hasSynthesisPanel");
        }
      }
    }
  },

  onBeforeDestroy: function(){
    this.propagateVisibility(false);
  },

  /**
   * Publish the synthesis
   */
  publish: function() {
    var ok = confirm(i18n.gettext("Are you sure you want to publish the synthesis? You will not be able to delete it afterwards, and participants who subscribed to notifications related to the synthesis will receive a notification by email."));
    if (ok) {
      this._publish();
    }
  },

  /**
   * Publishes the synthesis
   */
  _publish: function() {
    this.blockPanel();

    var publishes_synthesis_id = this.model.id,
        that = this;

    var synthesisMessage = new MessageModel.Model({
      publishes_synthesis_id: publishes_synthesis_id,
      subject: null,
      body: null
    });

    synthesisMessage.save(null, {
      success: function(model, resp) {
        alert(i18n.gettext("Synthesis has been successfully published!"));

        // The next_synthesis is the same idea as before, so no need to reload.
        that.unblockPanel();
      },
      error: function(model, resp) {
        Raven.captureMessage('Failed publishing synthesis!');
        alert(i18n.gettext("Failed publishing synthesis!"));
        that.model = new Synthesis.Model({'@id': 'next_synthesis'});
        that.model.fetch();
        that.unblockPanel();
      }
    });

  }

});

module.exports = SynthesisPanel;

