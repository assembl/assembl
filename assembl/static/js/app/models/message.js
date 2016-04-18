'use strict';

var _ = require('underscore'),
    $ = require('jquery'),
    Promise = require('bluebird'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Base = require('./base.js'),
    LangString = require('./langstring.js'),
    Types = require('../utils/types.js'),
    Permissions = require('../utils/permissions.js'),
    Attachment = require('./attachments.js');

/**
 * @class MessageModel
 */
var MessageModel = Base.Model.extend({
  constructor: function MessageModel() {
    Base.Model.apply(this, arguments);
  },
  /**
   * The url
   * @type {String}
   */
  urlRoot: Ctx.getApiUrl('posts'),

  getApiV2Url: function() {
    return Ctx.getApiV2DiscussionUrl('/posts/'+this.getNumericId());
  },

  /**
   * Default values
   * @type {Object}
   */
  defaults: {
    '@view': undefined,
    collapsed: true,
    checked: false,
    read: false,
    parentId: null,
    subject: null,
    like_count: 0,
    liked: false,
    hidden: false,
    body: null,
    idCreator: null,
    avatarUrl: null,
    date: null,
    bodyMimeType: null,
    attachments: undefined,
    publishes_synthesis_id: null,
    metadata_json: null, // this property needs to exist to display the inspiration source of a message (creativity widget)
    publication_state: "PUBLISHED",
    moderator: null,
    moderation_text: null,
    moderated_on: null,
    moderator_comment: null
  },

  parse: function(rawModel) {
    if(rawModel.attachments !== undefined) {
      rawModel.attachments = new Attachment.Collection(rawModel.attachments,
          {parse: true,
          objectAttachedToModel: this}
          );
    }
    if (rawModel.subject !== undefined) {
        rawModel.subject = new LangString.Model(rawModel.subject, {parse: true});
    }
    if (rawModel.body !== undefined) {
        rawModel.body = new LangString.Model(rawModel.body, {parse: true});
    }
    //console.log("Message Model parse() called, returning:", rawModel.attachments);
    return rawModel;
  },

  /**
   * @return {String} the subject, with any re: stripped
   */
  getSubjectNoRe: function() {
      var subject = this.get('subject').originalValue();
      if (subject) {
        return subject.replace(/( *)?(RE) *(:|$) */igm, "");
      }
      else {
        return subject;
      }
    },

  /**
   * @return Array  Json objects representing idea_content_links
   */
  getIdeaContentLinks: function(){
    var idl = this.get('indirect_idea_content_links');
    if (!idl) {
      return [];
    }

    return idl;
  },

  hasIdeaContentLinks: function(){
    var idls = this.getIdeaContentLinks();
    return idls.length > 0;
  },

  /**
   * @return {Number} the quantity of all descendants
   */
  getDescendantsCount: function() {
    var children = this.getChildren(),
        count = children.length;

    _.each(children, function(child) {
      count += child.getDescendantsCount();
    });

    return count;
  },

  visitDepthFirst: function(visitor, includeHidden) {
    var ancestry = [this.getId()];
    this.collection.visitDepthFirst(visitor, this, ancestry, includeHidden);
  },

  /**
   * Return all direct children
   * @return {MessageModel[]}
   */
  getChildren: function() {
    return this.collection.where({ parentId: this.getId() });
  },

  /**
   * Return a promise to the parent message (if any)
   * Else a promise to null
   * @return {Promise}
   */
  getParentPromise: function() {
      if (this.get('parentId')) {
        return this.collection.collectionManager.getMessageFullModelPromise(this.get('parentId'));
      }
      else {
        return Promise.resolve(null);
      }
    },

  getAncestorCount: function() {
      var parents = this.collection.where({ parentId: this.getId() });
      if (parents.length) {
        return parents[0].getAncestorCount() + 1
      }
      else {
        return 0;
      }
    },

  getParent: function(){
    return this.collection.where({parentId: this.get('parentId')});
  },

  /**
   * Returns a promise to all segments in the annotator format
   * @return {Object[]}
   */
  getAnnotationsPromise: function() {
    var that = this;
    return this.getExtractsPromise()
            .then(function(extracts) {
              var ret = [];

              _.each(extracts, function(extract) {
                //Why this next line?  Benoitg-2014-10-03
                extract.attributes.ranges = extract.attributes._ranges;
                ret.push(_.clone(extract.attributes));
              });

              return ret;
            }

        );
  },

  /**
   * Return all segments in the annotator format
   * @return {Object[]}
   */
  getExtractsPromise: function() {
    var that = this;
    return this.collection.collectionManager.getAllExtractsCollectionPromise()
            .then(function(allExtractsCollection) {
              return Promise.resolve(allExtractsCollection.where({idPost: that.getId()}))
                    .catch(function(e) {
                      console.error(e.statusText);
                    });
            }

        );
  },

  /** 
   * Return a promise for the post's creator
   */
  getCreatorPromise: function() {
    var that = this;

    return this.collection.collectionManager.getAllUsersCollectionPromise()
      .then(function(allUsersCollection) {
        return Promise.resolve(allUsersCollection.getById(that.get('idCreator')))
          .catch(function(e) {
            console.error(e.statusText);
          });
      });
  },

  /**
   * Return a promise for the post's moderator
   */
  getModeratorPromise: function() {
    var that = this;

    return this.collection.collectionManager.getAllUsersCollectionPromise()
      .then(function(allUsersCollection) {
        return Promise.resolve(allUsersCollection.getById(that.get('moderator')))
          .catch(function(e) {
            console.error(e.statusText);
          });
      });
  },

  /**
   * @event
   */
  onAttrChange: function() {
    this.save(null, {
      success: function(model, resp) {
            },
      error: function(model, resp) {
        console.error('ERROR: onAttrChange', resp);
      }
    });
  },

  /**
   * Set the `read` property
   * @param {Boolean} value
   * @param jquery element
   */
  setRead: function(value, target) {
    if(target) {
      target.removeClass('readUnreadIndicator').addClass('is-loading');
    }

    var user = Ctx.getCurrentUser(),
        that = this;

    if (user.isUnknownUser()) {
      // Unknown User can't mark as read
      return;
    }

    var isRead = this.get('read');
    if (value === isRead) {
      return; // Nothing to do
    }

    this.set('read', value, { silent: true });

    this.url = Ctx.getApiUrl('post_read/') + this.getId();
    this.save({'read': value}, {
      success: function(model, resp) {
        if(target) {
          target.addClass('readUnreadIndicator').removeClass('is-loading');
        }
        that.trigger('change:read', [value]);
        that.trigger('change', that);
        Assembl.reqres.request('ideas:update', resp.ideas);
      },
      error: function(model, resp) {}
    });

  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  },

  sync: function(method, model, options) {
    console.log("message::sync() ", method, model, options);
    if ( method == "patch" ){ // for REST calls of type PATCH, we use APIv2 instead of APIv1
      console.log("we are in patch case");
      var options2 = options ? _.clone(options) : {};
      options2.url = this.getApiV2Url();
      return Backbone.sync(method, model, options2);
    }
    console.log("we are in default case");
    return Backbone.sync(method, model, options);
  },

  destroy: function(options){
    var attachments = this.get('attachments'),
        that = this;
    return Promise.resolve(attachments.destroyAll(options))
      .then(function(){
        return Base.Model.prototype.destroy.call(that, options);
      });
  }
});

var MessageCollection = Base.Collection.extend({
  constructor: function MessageCollection() {
    Base.Collection.apply(this, arguments);
  },
  /**
   * The url
   * @type {String}
   */
  url: Ctx.getApiUrl("posts?view=id_only"),

  /**
   * The model
   * @type {MessageModel}
   */
  model: MessageModel,

  /** Our data is inside the posts array */
  parse: function(response) {
    if(response.posts !== undefined) {
      //APIV1
      return response.posts;
    }
    else {
      //APIV2 and socket
      return response;
    }
  },

  /** Get the last synthesis
   * @return Message.Model or null
   */
  getLastSynthesisPost: function() {
      var lastSynthesisPost = null,
          synthesisMessages = this.where({'@type': Types.SYNTHESIS_POST});
      if (synthesisMessages.length > 0) {
        _.sortBy(synthesisMessages, function(message) {
          return message.get('date');
        });
        lastSynthesisPost = _.last(synthesisMessages);
      }

      return lastSynthesisPost;
    },

  /**
   * Traversal function.
   * @param visitor visitor function.  If visitor returns true, traversal continues
   * @return {Object[]}
   */
  visitDepthFirst: function(visitor, message, ancestry, includeHidden) {
    var that = this;
    if (ancestry === undefined) {
      ancestry = [];
    }

    if (message === undefined) {
      var rootMessages = this.where({ parentId: null });
      var results = _.map(rootMessages, function(rootMessage) {
        return that.visitDepthFirst(visitor, rootMessage, ancestry, includeHidden);
      });
      return visitor.post_visit(undefined, results);
    }
    else if (includeHidden !== true && message.get('hidden')) {
      // TODO: Do we want to recurse on children of hidden parents?
      // It could be useful for moderation.
      return undefined;
    }
    else if (visitor.visit(message, ancestry)) {
      //Copy ancestry
      ancestry = ancestry.slice(0);
      ancestry.push(message.getId());
      var children = _.sortBy(message.getChildren(), function(child) {
        return child.get('date');
      });
      var results = _.map(children, function(child) {
        return that.visitDepthFirst(visitor, child, ancestry, includeHidden);
      });
      return visitor.post_visit(message, results);
    }
    else {
      console.log("Fallback case, returning undefined");
      return undefined;
    }
  }

});

module.exports = {
  Model: MessageModel,
  Collection: MessageCollection
};

