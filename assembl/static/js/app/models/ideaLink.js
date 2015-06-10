'use strict';

var _ = require('../shims/underscore.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js');

/**
 * @class IdeaModel
 */
var IdeaLinkModel = Base.Model.extend({

    /**
     * @init
     */
    initialize: function (obj) {
        obj = obj || {};
        var that = this;
    },

    /**
     * Defaults
     */
    defaults: {
        source: '',
        target: '',
        original_uri: null,
        is_tombstone: false,
        order: 1
    },

    /*correctParentBug: function () {
        var child = this.collection.collectionManager._allIdeasCollection.get(this.get('target'));
        if (!child) {
            console.log("correct parent bug: unknown child");
            return;
        }
        if (child.get('parentId') === null) {
            console.log("correct parent bug");
            child.set('parentId', this.get('source'));
            child.get('parents').push(this.get('source'));
        }
    },*/

    validate: function(attrs, options){
        /**
         * check typeof variable
         * */

    }

});

/**
 * @class IdeaColleciton
 */
var IdeaLinkCollection = Base.Collection.extend({

    /**
     * The model
     * @type {IdeaModel}
     */
    model: IdeaLinkModel,

    /**
     * Url
     * @type {String}
     */
    url: Ctx.getApiV2DiscussionUrl("idea_links"),

    /**
     * add function
     * @type {IdeaModel}
     */
    /*add: function (models, options) {
        models = Backbone.Collection.prototype.set.call(this, models, options);
        if (_.isArray(models)) {
            _.each(models, function (m) {
                m.correctParentBug();
            })
        } else {
            models.correctParentBug();
        }
        return models;
    }*/
});

module.exports = {
    Model: IdeaLinkModel,
    Collection: IdeaLinkCollection
};


