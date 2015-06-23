'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js');

/**
 * @class SynthesisModel
 */
var SynthesisModel = Base.Model.extend({

    /**
     * @init
     */
    initialize: function () {
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

    validate: function(attrs, options){
        /**
         * check typeof variable
         * */

    }


});
/**
 * @class IdeaColleciton
 */
var SynthesisCollection = Base.Collection.extend({
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
      return this.filter(function(model){ return model.get('published_in_post') != null; });
    },

    /** Get the last published synthesis
     * @return Message.Model or null
     */
    getLastPublisedSynthesis: function () {
      var publishedSyntheses = this.getPublishedSyntheses(),
          lastSynthesis = null;
      if (publishedSyntheses.length > 0) {
        _.sortBy(publishedSyntheses, function (model) {
          return model.get('creation_date');
        });
        lastSynthesis = _.last(publishedSyntheses);
      }
      return lastSynthesis;
    },
});

module.exports = {
    Model: SynthesisModel,
    Collection: SynthesisCollection
};

