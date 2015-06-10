'use strict';

var _ = require('../shims/underscore.js'),
    Promise = require('bluebird'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Types = require('../utils/types.js'),
    Permissions = require('../utils/permissions.js');

/**
 * @class IdeaModel
 */
var IdeaModel = Base.Model.extend({
    /**
     * @init
     */
    initialize: function (obj) {
        obj = obj || {};
        var that = this;

        obj.creationDate = obj.creationDate || Ctx.getCurrentTime();
        this.set('creationDate', obj.creationDate);
        this.set('hasCheckbox', Ctx.getCurrentUser().can(Permissions.EDIT_SYNTHESIS));

    },

    /**
     * Url
     * @type {String}
     */
    urlRoot: Ctx.getApiUrl("ideas"),

    /**
     * Defaults
     */
    defaults: {
        shortTitle: null,
        longTitle: '',
        definition: '',
        numChildIdea: 0,
        num_posts: 0,
        num_read_posts: 0,
        isOpen: true,
        hidden: false,
        hasCheckbox: false,
        original_uri: null,
        is_tombstone: false,
        featured: false,
        active: false,
        inNextSynthesis: false,
        parentId: null,
        order: 1
    },
    /* The following should be mostly in view code, but currently the
     * longTitle editor code isn't common in ideaPanel and synthesisView
     * At least this is mostly DRY
     */

    /**
     * Returns the display text for a idea definition.
     * Will return the first non-empty from:
     * definition, longTitle, i18n.gettext('Add a definition for this idea')
     * @param
     * @return {Text>}
     */
    getDefinitionDisplayText: function () {
        if (this.get('root') === true) {
            return i18n.gettext('The root idea will not be in the synthesis');
        }

        if (Ctx.stripHtml(this.get('definition'))) {
            return this.get('definition');
        }
        else if (Ctx.stripHtml(this.get('longTitle'))) {
            return this.get('longTitle');
        }
        else {
            if (Ctx.getCurrentUser().can(Permissions.EDIT_IDEA))
                return i18n.gettext('Add a description of this idea');
            else
                return "";
        }
    },

    /**
     * Returns the display text for a idea synthesis expression.
     * Will return the first non-empty from:
     * longTitle, shortTitle, i18n.gettext('Add and expression for the next synthesis')
     * @param
     * @return {Text>}
     */
    getLongTitleDisplayText: function () {
        if (this.get('root') === true) {
            return i18n.gettext('The root idea will never be in the synthesis');
        }

        if (Ctx.stripHtml(this.get('longTitle'))) {
            return this.get('longTitle');
        }
        else if (Ctx.stripHtml(this.get('shortTitle'))) {
            return this.get('shortTitle');
        }
        else if (Ctx.stripHtml(this.get('definition'))) {
            return this.get('definition');
        }
        else {
            return i18n.gettext('Add and expression for the next synthesis');
        }
    },

    /**
     * @return {String} The short Title to be displayed
     * HTML Striping if necessary is the responsability of the caller.
     */
    getShortTitleDisplayText: function () {
        if (this.isRootIdea()) {
            return i18n.gettext('All posts');
        }
        else if (Ctx.stripHtml(this.get('shortTitle'))) {
            return this.get('shortTitle');
        }
        else if (Ctx.stripHtml(this.get('longTitle'))) {
            return this.get('longTitle');
        }
        else if (Ctx.stripHtml(this.get('definition'))) {
            return this.get('definition');
        }
        else {
            return i18n.gettext('New idea');
        }
    },

    /**
     * @return {Boolean} true if the current idea is the root idea
     */
    isRootIdea: function () {
        return this.get('@type') === Types.ROOT_IDEA;
    },

    /**
     * Adds an idea as child
     * @param  {Idea} idea
     */
    addChild: function (idea) {
        this.collection.add(idea);

        if (this.isDescendantOf(idea)) {
            this.save('parentId', null);
        }

        idea.save({
            'order': this.getOrderForNewChild(),
            'parentId': this.getId()}, {
            success: function (model, resp) {
            },
            error: function (model, resp) {
                console.error('ERROR: addChild', resp);
            }
        });
    },

    /**
     * Adds an idea as sibling above
     * @param {Idea} idea
     */
    addSiblingAbove: function (idea) {
        var parent = this.getParent(),
            parentId = parent ? parent.getId() : null,
            index = this.collection.indexOf(this),
            order = this.get('order') - 0.1;

        this.collection.add(idea, { at: index });
        idea.attributes.parentId = parentId;
        idea.attributes.order = order;
        idea.trigger('change:parentId');

        if (parent) {
            parent.updateChildrenOrder();
        } else {
            this.collection.updateRootIdeasOrder();
        }
    },

    /**
     * Adds an idea as sibling below
     * @param {Idea} idea
     */
    addSiblingBelow: function (idea) {
        var parent = this.getParent(),
            parentId = parent ? parent.getId() : null,
            index = this.collection.indexOf(this) + 1,
            order = this.get('order') + 0.1;

        this.collection.add(idea, { at: index });
        idea.attributes.parentId = parentId;
        idea.attributes.order = order;
        idea.trigger('change:parentId');

        if (parent) {
            parent.updateChildrenOrder();
        } else {
            this.collection.updateRootIdeasOrder();
        }
    },

    /**
     * Return all children
     * @return {Idea[]}
     */
    getChildren: function () {
        return this.collection.where({ parentId: this.getId() });
    },

    /**
     * Return the parent idea
     * @return {Idea}
     */
    getParent: function () {
        return this.collection.findWhere({ '@id': this.get('parentId') });
    },

    /**
     * Return all children which belongs to the synthesis
     * @return {Idea[]}
     */
    getSynthesisChildren: function () {
        var children = this.collection.where({ parentId: this.getId() }),
            result = [];

        _.each(children, function (child) {
            if (child.get('inNextSynthesis') === true) {
                result.push(child);
            } else {
                result = _.union(result, child.getSynthesisChildren());
            }
        });

        return result;
    },

    /**
     * Return if the idea is descendant of the given idea
     * @param {Idea} idea
     * @return {Boolean}
     */
    isDescendantOf: function (idea) {
        var parentId = this.get('parentId');

        if (parentId === idea.getId()) {
            return true;
        }

        return parentId === null ? false : this.getParent().isDescendantOf(idea);
    },

    /**
     * @return {Number} the indentantion level
     */
    getLevel: function () {
        var counter = 0,
            parent = this;
        do {
            if (parent.get('root') === true)
                break;
            parent = parent.get('parentId') !== null ? parent.getParent() : null;
            counter += 1;
        } while (parent !== null);

        return counter;
    },

    /**
     * @return {Number} The order number for a new child
     */
    getOrderForNewChild: function () {
        return this.getChildren().length + 1;
    },

    /** Return a promise for all Extracts models for this idea
     * @return {Promise}
     */

    getExtractsPromise: function () {
        var that = this;
        return this.collection.collectionManager.getAllExtractsCollectionPromise()
            .then(function (allExtractsCollection) {
                return Promise.resolve(allExtractsCollection.where({idIdea: that.getId()}))
                    .catch(function(e){
                        console.error(e.statusText);
                    });
            }
        );
    },

    /**
     * Adds a segment
     * @param  {Segment} segment
     */
    addSegment: function (segment) {
        segment.save('idIdea', this.getId(), {
            success: function (model, resp) {
            },
            error: function (model, resp) {
                console.error('ERROR: addSegment', resp);
            }
        });
    },

    /**
     * Adds a segment as a child
     * @param {Segment} segment, possibly unsaved.
     * @return the newly created idea
     */
    addSegmentAsChild: function (segment) {
        // Cleaning
        delete segment.attributes.highlights;

        var data = {
            shortTitle: segment.getQuote().substr(0, 50),
            longTitle: segment.getQuote(),
            parentId: this.getId(),
            order: this.getOrderForNewChild()
        };

        var onSuccess = function (idea) {
            //console.log('addSegmentAsChild(): onSuccess() fired.')
            idea.addSegment(segment);
        };

        return this.collection.create(data, { success: onSuccess });
    },

    /**
     * Updates the order in all children
     */
    updateChildrenOrder: function () {
        var children = _.sortBy(this.getChildren(), function (child) {
                return child.get('order');
            }),
            currentOrder = 1;

        _.each(children, function (child) {
            child.save('order', currentOrder, {
                success: function (model, resp) {
                },
                error: function (model, resp) {
                    console.error('ERROR: updateChildrenOrder', resp);
                }
            });
            currentOrder += 1;
        });
    },

    set: function (key, val, options) {
        if (typeof key === 'object') {
            var attrs = key;
            options = val;
            if (attrs['parentId'] === null && this.id !== undefined && attrs['root'] !== true) {
                console.log("empty parent bug: ", _.clone(attrs));
                var id = attrs['@id'];
                var links = this.collection.collectionManager._allIdeaLinksCollection.where({target: id});
                if (links.length > 0) {
                    console.log('corrected');
                    attrs['parents'] = _.map(links, function (l) {
                        return l.get('source')
                    });
                    attrs['parentId'] = attrs['parents'][0];
                }
            }
            return Backbone.Model.prototype.set.call(this, attrs, options);
        } else {
            return Backbone.Model.prototype.set.call(this, key, val, options);
        }
    },

    /* not used anymore
    getWidgets: function () {
        //console.log("idea widgets: ", this.get('widget_data'));
        return this.get('widget_data');
    },
    */

    /* not used anymore
    getWidgetsOfType: function (type) {
        var widget_data = this.getWidgets();
        var widgets = _.filter(widget_data, function (o) {
            return o["@type"] == type;
        });
        return widgets;
    },
    */

    /* not used anymore, because we are using Context::getWidgetDataAssociatedToIdeaPromise() instead
    getVotableOnWhichWidgets: function () {
        return this.getWidgetsOfType("votable");
    },
    */

    /* not used anymore, because we are using Context::getWidgetDataAssociatedToIdeaPromise() instead
    getInspirationWidgets: function () {
        return this.getWidgetsOfType("inspiration");
    },
    */

    validate: function(attrs, options){
        /**
         * check typeof variable
         * */

    }
});

/**
 * @class IdeaColleciton
 */
var IdeaCollection = Base.Collection.extend({
    /**
     * Url
     * @type {String}
     */
    url: Ctx.getApiUrl("ideas"),

    /**
     * The model
     * @type {IdeaModel}
     */
    model: IdeaModel,

    /**
     * @return {Idea} The root idea
     */
    getRootIdea: function () {
        var retval = this.findWhere({ '@type': Types.ROOT_IDEA });
        if (!retval) {
            _.forEach(this.models, function (model) {
                console.log(model.get('@type'));
            })
            console.error("getRootIdea() failed!");
        }
        return retval;
    },

    /**
     * Returns the order number for a new root idea
     * @return {Number}
     */
    getOrderForNewRootIdea: function () {
        var lastIdea = this.last();
        return lastIdea ? lastIdea.get('order') + 1 : 0;
    },

    /**
     * Updates the order in the idea list
     */
    updateRootIdeasOrder: function () {
        var children = this.where({ parentId: null }),
            currentOrder = 1;

        _.each(children, function (child) {
            child.save('order', currentOrder, {
                success: function (model, resp) {
                },
                error: function (model, resp) {
                    console.error('ERROR: updateRootIdeasOrder', resp);
                }
            });
            currentOrder += 1;
        });
    },

    /**
     * @param idea_links The collection of idea_links to navigate
     * @param visitor Visitor function
     * @param origin_id the id of the root
     * @param ancestry Internal recursion parameter, do not set or use
     */
    visitDepthFirst: function (idea_links, visitor, origin_id, include_ts, ancestry) {
        if (ancestry === undefined) {
            ancestry = [];
        }
        //console.log(idea_links);
        var idea = this.get(origin_id);
        if (idea !== undefined && idea.get('is_tombstone') && include_ts !== true) {
            return;
        }
        if (idea === undefined || visitor(idea, ancestry)) {
            ancestry = ancestry.slice(0);
            ancestry.push(origin_id);
            var child_links = _.sortBy(
                idea_links.where({ source: origin_id }),
                function (link) {
                    return link.get('order');
                });
            // break most cycles. (TODO: handle cycles of missing ideas)
            child_links = child_links.filter(function(l) {
                return ancestry.indexOf(l.get('target')) === -1;
            });
            for (var i in child_links) {
                this.visitDepthFirst(idea_links, visitor, child_links[i].get('target'), include_ts, ancestry);
            }
        }
    },

    /**
     * @param idea_links The collection of idea_links to navigate
     * @param visitor Visitor function
     * @param ancestry Internal recursion parameter, do not set or use
     */
    visitBreadthFirst: function (idea_links, visitor, origin_id, include_ts, ancestry) {
        var continue_visit = true;
        var idea = this.get(origin_id);
        if (ancestry === undefined) {
            ancestry = [];
            if (idea !== undefined)
                continue_visit = visitor(idea, ancestry);
        }
        if (continue_visit) {
            ancestry = ancestry.slice(0);
            ancestry.push(origin_id);
            var child_links = _.sortBy(
                idea_links.where({ source: origin_id }),
                function (link) {
                    return link.get('order');
                });
            // break most cycles. (TODO: handle cycles of missing ideas)
            child_links = child_links.filter(function(l) {
                return ancestry.indexOf(l.get('target')) === -1;
            });
            var children_to_visit = [];
            for (var i in child_links) {
                var link = child_links[i],
                    target_id = link.get('target'),
                    target = this.get(target_id);
                if (target.get('is_tombstone') && include_ts !== true)
                    continue;
                if (visitor(target, ancestry)) {
                    children_to_visit.push(target_id);
                }
            }
            for (var i in children_to_visit) {
                this.visitBreadthFirst(idea_links, visitor, children_to_visit[i], include_ts, ancestry);
            }
        }
    },


});

module.exports = {
    Model: IdeaModel,
    Collection: IdeaCollection
};

