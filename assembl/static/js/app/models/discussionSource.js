'use strict';
/**
 * Represents a discussion's messages from an external source.
 * @module app.models.discussionSource
 */
var Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    $ = require('jquery');
/**
 * Source model
 * Frontend model for :py:class:`assembl.models.generic.ContentSource`
 * @class app.models.discussionSource.sourceModel
 * @extends app.models.base.BaseModel
 */
var sourceModel = Base.Model.extend({
  constructor: function sourceModel() {
    Base.Model.apply(this, arguments);
  },
  urlRoot: Ctx.getApiV2DiscussionUrl() + 'sources',
  defaults: {
    'name': '',
    'admin_sender': '',
    'post_email_address': '',
    'creation_date': '',
    'host': '',
    'discussion_id': '',
    '@type': '',
    'folder': '',
    'use_ssl': false,
    'port': 0
  },
  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
  },
  /**
   * Run import to backend server
   * @function app.models.discussionSource.sourceModel.doReimport
   */
  doReimport: function() {
    var url = this.url() + '/fetch_posts';
    return $.post(url, {reimport: true});
  },
  /**
   * Run process to backend server
   * @function app.models.discussionSource.sourceModel.doReprocess
   */
  doReprocess: function() {
    var url = this.url() + '/fetch_posts';
    return $.post(url, {reprocess: true});
  }
});
/**
 * Sources collection
 * @class app.models.discussionSource.sourceCollection
 * @extends app.models.base.BaseCollection
 */
var sourceCollection = Base.Collection.extend({
  constructor: function sourceCollection() {
    Base.Collection.apply(this, arguments);
  },
  url: Ctx.getApiV2DiscussionUrl() + 'sources',
  model: sourceModel
});

module.exports = {
  Model: sourceModel,
  Collection: sourceCollection
};

