'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js'),
    $ = require('../shims/jquery.js');

//ContentSource + PostSource
var Source = Base.Model.extend({
  urlRoot: Ctx.getApiV2DiscussionUrl('sources'),
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

var FacebookSource = Source.extend({
  defaults: function() {
    return _.extend(Source.prototype.defaults, {
      'fb_source_id': null,
      'url_path': null,
      'is_content_sink': false,
      'creator_id': Ctx.getCurrentUserId()
    });
  }
});

var FacebookSinglePostSource = FacebookSource.extend({
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_SINGLE_POST_SOURCE
    });
  }
});

var FacebookGroupSource = FacebookSource.extend({
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_GROUP_SOURCE
    });
  }
});

var FacebookGroupSourceFromUser = FacebookSource.extend({
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_GROUP_SOURCE_FROM_USER
    });
  }
});

var FacebookPagePostsSource = FacebookSource.extend({
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_PAGE_POSTS_SOURCE
    });
  }
});

var FacebookPageFeedSource = FacebookSource.extend({
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_PAGE_FEED_SOURCE
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

function getSourceClassByType(type) {
    switch (type) {
      case Types.FACEBOOK_GENERIC_SOURCE:
        return FacebookGenericSource;
      case Types.FACEBOOK_GROUP_SOURCE:
        return FacebookGroupSource;
      case Types.FACEBOOK_GROUP_SOURCE_FROM_USER:
        return FacebookGroupSourceFromUser;
      case Types.FACEBOOK_PAGE_POSTS_SOURCE:
        return FacebookPagePostsSource;
      case Types.FACEBOOK_PAGE_FEED_SOURCE:
        return FacebookPageFeedSource;
      case Types.FACEBOOK_SINGLE_POST_SOURCE:
        return FacebookSinglePostSource;
      case Types.IMAPMAILBOX:
      case Types.MAILING_LIST:
        return Email;
      default:
        console.error("Unknown source type:" + type);
        return Source;
    }
  }

var sourceCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl() + 'sources',

  // model: Source,
  // supportedSources: {
  //   //Note:  All these constants should be in utils/types.js, not here as strings
  //   Base: ['ContentSource', 'PostSource'],
  //   Email: ['AbstractMailbox', 'IMAPMailbox', 'MailingList', 'AbstractFilesystemMailbox', 'MaildirMailbox'],
  //   Loomio: ['FeedPostSource', 'LoomioPostSource'], 
  //   EdgeRyder: ['EdgeSenseDrupalSource'],
  //   Facebook: ['FacebookGenericSource', 'FacebookGroupSource', 'FacebookGroupSourceFromUser', 'FacebookPagePostsSource', 'FacebookPageFeedSource', 'FacebookSinglePostSource']
  // },

  model: function(attrs, options) {
    var sourceClass = getSourceClassByType(attrs["@type"]);
    if (sourceClass !== undefined) {
      return new sourceClass(attrs, options);
    }
  }
});

module.exports = {
  Model: {
    Source: Source,
    Email: Email,
    FacebookSinglePostSource: FacebookSinglePostSource,
    FacebookGroupSource: FacebookGroupSource,
    FacebookGroupSourceFromUser: FacebookGroupSourceFromUser,
    FacebookPagePostsSource: FacebookPagePostsSource,
    FacebookPageFeedSource: FacebookPageFeedSource,
    ContentSourceID: ContentSourceId
  },
  Collection: sourceCollection,
  getSourceClassByType: getSourceClassByType
};

