'use strict';
/**
 * The collection of idea snapshots in a synthesis
 * @module app.models.synthesis
 */

var Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    Idea = require("./idea.js"),
    i18n = require('../utils/i18n.js');


/**
 * Synthesis ideas collection
 * @class app.models.synthesis.SynthesisIdeaCollection
 * @extends app.models.idea.IdeaCollection
 */
 
var SynthesisIdeaCollection = Idea.Collection.extend({
  constructor: function SynthesisIdeaCollection() {
    Idea.Collection.apply(this, arguments);
  },

  initialize: function(models, options) {
    var synthesis = options.synthesis,
        id = synthesis.getNumericId();
    this.url = Ctx.getApiV2DiscussionUrl("/syntheses/" + id + "/ideas");
  },
  // Here I actually need double inheritance; cheating with function references.
  add: Base.RelationsCollection.prototype.add,
  remove: Base.RelationsCollection.prototype.remove
});

/**
 * Synthesis model
 * Frontend model for :py:class:`assembl.models.idea_graph_view.Synthesis`
 * @class app.models.synthesis.SynthesisModel
 * @extends app.models.base.BaseModel
 */
 
var SynthesisModel = Base.Model.extend({
  constructor: function SynthesisModel() {
    Base.Model.apply(this, arguments);
  },


  /**
   * @init
   */
  initialize: function() {
    //What was this?  Benoitg - 2014-05-13
    //this.on('change', this.onAttrChange, this);
  },

  /**
   * The urlRoot endpoint
   * @type {String}
   */
  urlRoot: Ctx.getApiUrl('explicit_subgraphs/synthesis'),

  /**
   * Default values
   * @type {Object}
   */
  defaults: {
    subject: i18n.gettext('Add a title'),
    introduction: i18n.gettext('Add an introduction'),
    conclusion: i18n.gettext('Add a conclusion'),
    ideas: [],
    published_in_post: null
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
  },
  set: function(key, val, options) {
    var ob = Base.Model.prototype.set.apply(this, arguments);
    if ((key == "ideas" || key.ideas !== undefined) && this.ideasCollection !== undefined) {
        this.ideasCollection.reset(this.get("ideas"), {parse: true});
    }
    return ob;
  },
  getIdeasCollection: function() {
    if (this.ideasCollection === undefined) {
        // cache since it is the result of parsing.
        this.ideasCollection = new SynthesisIdeaCollection(
            this.get("ideas"), {parse: true, synthesis: this});
        //this.ideasCollection.collectionManage = collectionManager;
    }
    return this.ideasCollection;
  }
});

/**
 * Synthesis collection
 * Frontend model for :py:class:`assembl.models.idea_graph_view.Synthesis`
 * @class app.models.synthesis.SynthesisCollection
 * @extends app.models.base.BaseCollection
 */
 
var SynthesisCollection = Base.Collection.extend({
  constructor: function SynthesisCollection() {
    Base.Collection.apply(this, arguments);
  },

  /**
   * Url
   * @type {String}
   */
  url: Ctx.getApiUrl("explicit_subgraphs/synthesis"),

  /**
   * The model
   * @type {SynthesisModel}
   */
  model: SynthesisModel,

  getPublishedSyntheses: function() {
      return this.filter(function(model) { return model.get('published_in_post') != null; });
    },

  /** Get the last published synthesis
   * @returns Message.Model or null
   */
  getLastPublisedSynthesis: function() {
      var publishedSyntheses = this.getPublishedSyntheses(),
          lastSynthesis = null;
      if (publishedSyntheses.length > 0) {
        _.sortBy(publishedSyntheses, function(model) {
          return model.get('creation_date');
        });
        lastSynthesis = _.last(publishedSyntheses);
      }

      return lastSynthesis;
    }
});

module.exports = {
  Model: SynthesisModel,
  Collection: SynthesisCollection
};

