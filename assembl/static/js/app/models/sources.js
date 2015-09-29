'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    $ = require('../shims/jquery.js');

//ContentSource + PostSource
var Source = Base.Model.extend({
  // urlRoot: Ctx.getApiV2DiscussionUrl('sources'),
  defaults: {
    'name': 'ContentSource_' + this.cid,
    'creation_date': null,
    /*
      'discussion_id': null,
      If urlRoot of an object is a ClassInstance, then the front-end model
      MUST pass the discussion_id explicitly. However, since the urlRoot
      is an InstanceContext or CollectionContext after Discussion 
      (eg. /data/Discussion/1/sources/ instead of /data/ContentSource),
      the api v2 can infer the discussion_id through the context of the
      traversal. POSTing with discussion_id: null yields a 400 Error from
      backend.
     */
    'last_import': null,
    'connection_error': null,
    'error_description': null,
    'error_backoff_until': null,
    'number_of_imported_posts': 0,
    '@type': 'ContentSource',
    'is_content_sink': false // Used by API V2 as flag for side-effectful POST creation only.
    // DO NOT use for any other scenario than creating facebook content_sinks
  },
  doReimport: function() {
    var url = this.url() + '/fetch_posts';
    return $.post(url, {reimport: true});
  },
  doReprocess: function() {
    var url = this.url() + '/fetch_posts';
    return $.post(url, {reprocess: true});
  }
});

//Lump different email types into one email type??
var Email = Source.extend({
  defaults: function() {
    return _.extend(Source.prototype.defaults, {
      'admin_sender': '',
      'post_email_address': '',
      'host': '',
      'folder': '',
      'use_ssl': false,
      'port': 0
    });
  }
});

var Facebook = Source.extend({
  defaults: function() {
    return _.extend(Source.prototype.defaults, {
      'fb_source_id': null,
      'url_path': null,
      'creator_id': null
    });
  }
});

var ContentSourceId = Base.Model.extend({
  urlRoot: Ctx.getApiV2Url('ContentSourceIDs'),
  defaults: {
    'source_id': '', //Source.id
    'post_id': '', //message.id
    'message_id_in_source': '' //The ID from where the source came from
  }
});

var sourceCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl() + 'sources',
  url2: Ctx.getApiV2DiscussionUrl() + 'sources',

  // model: Source,
  supportedSources: {
    Base: ['ContentSource', 'PostSource'],
    Email: ['AbstractMailbox', 'IMAPMailbox', 'MailingList', 'AbstractFilesystemMailbox', 'MaildirMailbox'],
    Loomio: ['FeedPostSource', 'LoomioPostSource'], 
    EdgeRyder: ['EdgeSenseDrupalSource'],
    Facebook: ['FacebookGenericSource', 'FacebookGroupSource', 'FacebookGroupSourceFromUser', 'FacebookPagePostsSource', 'FacebookPageFeedSource', 'FacebookSinglePostSource']
  },

  isBase: function(t){
    return _.contains(this.supportedSources.Base, t);
  },

  isEmail: function(t){
    return _.contains(this.supportedSources.Email, t);
  },

  isLoomio: function(t){
    return _.contains(this.supportedSources.Loomio, t);
  },

  isEdgeRyder: function(t){
    return _.contains(this.supportedSources.EdgeRyder, t);
  },

  isFacebook: function(t){
    return _.contains(this.supportedSources.Facebook, t);
  },

  getModelClass: function(t){
    if (this.isBase(t)) {
      return Source;
    }
    else if (this.isEmail(t)){
      return Email;
    }
    else if (this.isFacebook(t)){
      return Facebook;
    }
    else if (this.isLoomio(t)){
      console.error('Loomio model is not yet implemented');
      return Source
    }
    else if (this.isEdgeRyder(t)){
      console.error('EdgeRyder model is not yet implemented');
      return Source;
    }
    else {
      throw new Error('Type ' + t + ' is not a supported type!');
    }
  },

  getViewClass: function(t){
    if (this.isEmail(t)){
      var c = require('../views/admin/emailSettings.js');
      return c
    }
    else if (this.isFacebook(t)){
      var c = require('../views/facebookModal.js');
      return c.init;
    }
    else {
      throw new Error('Type ' + t + ' does not have a view!');
    }
  },

  parse: function(res) {
    var that = this, 
        models = [];
    _.each(res, function(s, i, arr) {
      var t = s["@type"],
          cls = that.getModelClass(t);

      models.push(new cls(s));
    });

    return models;
  }
});

module.exports = {
  Model: {
    Source: Source,
    Email: Email,
    Facebook: Facebook,
    ContentSourceID: ContentSourceId
  },
  Collection: sourceCollection
};

