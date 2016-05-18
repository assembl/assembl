'use strict';

var Marionette = require('../shims/marionette.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    $ = require('jquery'),
    _ = require('underscore'),
    d3 = require('d3'),
    i18n = require('../utils/i18n.js'),
    Moment = require('moment'),
    Permissions = require('../utils/permissions.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js'),
    CKEditorField = require('./reusableDataFields/ckeditorField.js'),
    Statistics = require('./statistics.js'),
    Types = require('../utils/types.js'),
    Promise = require('bluebird');

var Partner = Marionette.ItemView.extend({
  constructor: function Partner() {
    Marionette.ItemView.apply(this, arguments);
  },

  template: '#tmpl-partnerItem',
  className: 'gu gu-2of7 partnersItem mrl',
  serializeData: function() {
    return {
      organization: this.model
    }
  },
  templateHelpers: function() {
    return {
      htmlEntities: function(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }
    };
  }

});

var PartnerList = Marionette.CompositeView.extend({
  constructor: function PartnerList() {
    Marionette.CompositeView.apply(this, arguments);
  },

  template: '#tmpl-partnerList',
  childView: Partner,
  className:'gr mvxl',
  childViewContainer: '.partnersList',
  initialize: function(options) {
    this.nbOrganisations = options.nbOrganisations;
  },
  serializeData: function() {
    return {
      userCanEditDiscussion: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION),
      nbOrganisations: this.nbOrganisations,
      urlEdit: '/' + Ctx.getDiscussionSlug() + '/partners'
    }
  }

});

var Synthesis = Marionette.ItemView.extend({
  constructor: function Synthesis() {
    Marionette.ItemView.apply(this, arguments);
  },

  template: '#tmpl-synthesisContext',
  initialize: function(options) {
      var that = this;

      this.model = new Backbone.Model();

      //WRITEME:  Add a listenTo on allSynthesisCollection to get an updated synthesis
      var synthesisMessage = options.allMessageStructureCollection.getLastSynthesisPost();
      if (synthesisMessage) {
        var synthesis = options.allSynthesisCollection.get(synthesisMessage.get('publishes_synthesis'));
        this.model.set({
          creation_date: synthesisMessage.get('date'),
          introduction: synthesis.get('introduction')
        });
      }
      else {
        this.model.set({
          empty: i18n.gettext("No synthesis of the discussion has been published yet")
        });
      }
    },

  events: {
    'click .js_readSynthesis': 'readSynthesis'
  },

  modelEvents: {
    'change': 'render'
  },

  serializeData: function() {
    return {
      synthesis: this.model,
      ctx: Ctx
    }
  },

  readSynthesis: function() {
    Assembl.vent.trigger("DEPRECATEDnavigation:selected", "synthesis");
  }

});

var Instigator = Marionette.LayoutView.extend({
  constructor: function Instigator() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-instigator',
  initialize: function() {
  },

  ui: {
      instigatorDescriptionRegion: '.js_region-instigator-editor'
  },

  regions: {
    regionInstigatorDescription: '@ui.instigatorDescriptionRegion'
  },

  events: {
  },

  serializeData: function() {
    return {
      instigator: this.model,
      Ctx: Ctx,
      userCanEditDiscussion: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)
    }
  },

  onRender: function() {
    this.renderCKEditorInstigator();
  },

  renderCKEditorInstigator: function() {

    var uri = this.model.id.split('/')[1];
    this.model.url = Ctx.getApiV2DiscussionUrl('partner_organizations/') + uri;

    var instigator = new CKEditorField({
      model: this.model,
      modelProp: 'description',
      canEdit: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)
    });

    this.regionInstigatorDescription.show(instigator);

  },

  templateHelpers: function() {
    return {
      editInstigatorUrl: function() {
              return '/' + Ctx.getDiscussionSlug() + '/partners';
            }
    }
  }

});

var Introduction = Marionette.LayoutView.extend({
  constructor: function Introduction() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-introductions',
  initialize: function() {
    this.editingIntroduction = false;
    this.editingObjective = false;
  },

  ui: {
    introduction: '.js_editIntroduction',
    objective: '.js_editObjective',
    seeMoreIntro: '.js_introductionSeeMore',
    seeMoreObjectives: '.js_objectivesSeeMore',
    introductionEditor: '.context-introduction-editor',
    objectiveEditor: '.context-objective-editor'
  },
  
  regions: {
    objectiveEditorRegion: "@ui.objectiveEditor",
    introductionEditorRegion: "@ui.introductionEditor"
  },

  events: {
    'click @ui.seeMoreIntro': 'seeMore',
    'click @ui.seeMoreObjectives': 'seeMore',
    'click @ui.introduction': 'editIntroduction',
    'click @ui.objective':'editObjective'
  },

  serializeData: function() {
    return {
      context: this.model,
      editingIntroduction: this.editingIntroduction,
      editingObjective: this.editingObjective,
      userCanEditDiscussion: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)
    }
  },

  onRender: function() {
    this.renderCKEditorIntroduction();
    this.renderCKEditorObjective();
  },

  editIntroduction: function() {
    if (Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) {
      this._introductionEditor.changeToEditMode();
    }
  },

  editObjective: function() {
    if (Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) {
      this._objectiveEditor.changeToEditMode();
    }
  },

  renderCKEditorIntroduction: function() {
    var that = this,
        area = this.$('.context-introduction-editor');

    var introduction = new CKEditorField({
      'model': this.model,
      'modelProp': 'introduction',
      canEdit: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)
    });

    this.introductionEditorRegion.show(introduction);
    this._introductionEditor = introduction;
  },

  renderCKEditorObjective: function() {
    var that = this,
        area = this.$('.context-objective-editor');

    var objective = new CKEditorField({
      'model': this.model,
      'modelProp': 'objectives',
      canEdit: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)
    });

    this.objectiveEditorRegion.show(objective);
    this._objectiveEditor = objective;
  }

});

var ContextPage = Marionette.LayoutView.extend({
  constructor: function ContextPage() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-contextPage',
  panelType: PanelSpecTypes.DISCUSSION_CONTEXT,
  className: 'contextPanel',
  gridSize: AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE,
  hideHeader: true,
  getTitle: function() {
    return i18n.gettext('Home'); // unused
  },

  regions: {
    organizations: '#context-partners',
    synthesis: '#context-synthesis',
    statistics: '#context-statistics',
    instigator: '#context-instigator',
    introductions: '#context-introduction'
  },

  onBeforeShow: function() {
    var that = this,
        collectionManager = new CollectionManager();

    Promise.join(collectionManager.getDiscussionModelPromise(),
        collectionManager.getAllPartnerOrganizationCollectionPromise(),
        collectionManager.getAllMessageStructureCollectionPromise(),
        collectionManager.getAllSynthesisCollectionPromise(),

            function(DiscussionModel, AllPartner, allMessageStructureCollection, allSynthesisCollection) {
              try { if (!that.isViewDestroyed() ){
                var partnerInstigator =  AllPartner.find(function(partner) {
                  return partner.get('is_initiator');
                });

                /*
                From Marionette doc for LayoutView:
                <<
                Once you've rendered the layoutView, you now have direct access
                to all of the specified regions as region managers.

                layoutView.getRegion('menu').show(new MenuView());
                >>
                This means layoutView.getRegion('...').show(...) has to be called after the layoutview has been rendered.
                So it has to be called in an onRender() method, or in an onBeforeShow() or onShow() method.
                But when the page http://localhost:6543/sandbox/posts/local%3AContent%2F568 is accessed using Chromium, we get this error:
                TypeError: Cannot read property 'show' of undefined
                So, getRegion() does not seem to always find the region, why?
                This current onBeforeShow() method seems to be called twice, so maybe the view is destroyed or replaced before getting the result of the promise.
                This answer http://stackoverflow.com/questions/25070398/re-rendering-of-backbone-marionette-template-on-trigger-event suggests that we should use listeners instead.
                We may have to dig in this direction. Until then, and because the view is rendered correctly the second time, we simply ignore the problem, using a try/catch.
                */
                
                var introduction = new Introduction({
                  model: DiscussionModel
                });
                that.getRegion('introductions').show(introduction);

                if (partnerInstigator !== undefined) {
                    var instigator = new Instigator({
                      model: partnerInstigator
                    });
                    that.getRegion('instigator').show(instigator);
                }

                that.getRegion('statistics').show(new Statistics());

                var synthesis = new Synthesis({
                  allMessageStructureCollection: allMessageStructureCollection,
                  allSynthesisCollection: allSynthesisCollection
                });
                that.getRegion('synthesis').show(synthesis);

                var NonInstigatorSubset = Backbone.Subset.extend({
                  constructor: function NonInstigatorSubset() {
                    Backbone.Subset.apply(this, arguments);
                  },

                  sieve: function(partner) {
                    return partner !== partnerInstigator;
                  }
                });

                var nonInstigatorSubset = new NonInstigatorSubset([], {
                  parent: AllPartner
                });
                
                var partners = new PartnerList({
                  nbOrganisations: nonInstigatorSubset.length,
                  collection: nonInstigatorSubset
                });
                that.getRegion('organizations').show(partners);

              } } catch (e) {
                console.log("Aborting rendering of ContextPanel's regions, probably because the view was replaced since.");

                console.log("Here is the error:");
                console.log(e);
              }
            }

        );
  }

});

module.exports = ContextPage;
