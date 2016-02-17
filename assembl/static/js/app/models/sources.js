'use strict';

var Base = require('./base.js'),
    i18n = require('../utils/i18n.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js'),
    $ = require('../shims/jquery.js');

//ContentSource + PostSource
var Source = Base.Model.extend({
   constructor: function Source() {
    Base.Model.apply(this, arguments);
  },
  urlRoot: Ctx.getApiV2DiscussionUrl('sources'),
  localizedName: i18n.gettext("Abstract content source"),
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
  fetchUrl: function(){
    return this.url() + '/fetch_posts';
  },
  doReimport: function() {
    return $.ajax(
      this.fetchUrl(), {
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: {reimport: true}
    });
  },
  doReprocess: function() {
    return $.ajax(
      this.fetchUrl(), {
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: {reprocess: true}
    });
  }
});

var IMAPMailboxSource = Source.extend({
   constructor: function IMAPMailboxSource() {
    Source.apply(this, arguments);
  },
  localizedName: i18n.gettext("IMAP mailbox"),
  defaults: function() {
    return _.extend(Source.prototype.defaults, {
      '@type': Types.IMAPMAILBOX,
      'admin_sender': '',
      'post_email_address': '',
      'host': '',
      'folder': '',
      'use_ssl': false,
      'port': 0
    });
  }
});

var MailingListSource = IMAPMailboxSource.extend({
   constructor: function MailingListSource() {
    IMAPMailboxSource.apply(this, arguments);
  },
  localizedName: i18n.gettext("Mailing list"),
  defaults: function() {
    return _.extend(IMAPMailboxSource.prototype.defaults(), {
      '@type': Types.MAILING_LIST
    });
  }
});

var FacebookSource = Source.extend({
   constructor: function FacebookSource() {
    Source.apply(this, arguments);
  },
  //An Abstract Class. Use children only!
  defaults: function() {
    return _.extend(Source.prototype.defaults, {
      'fb_source_id': null,
      'url_path': null,
      'lower_bound': null,
      'upper_bound': null,
      'creator_id': Ctx.getCurrentUserId()
    });
  }
});

var FacebookSinglePostSource = FacebookSource.extend({
   constructor: function FacebookSinglePostSource() {
    FacebookSource.apply(this, arguments);
  },
  localizedName: i18n.gettext("Comments to a given facebook post (by URL)"),
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_SINGLE_POST_SOURCE
    });
  }
});

var FacebookGroupSource = FacebookSource.extend({
   constructor: function FacebookGroupSource() {
    FacebookSource.apply(this, arguments);
  },
  localizedName: i18n.gettext("Posts from a Facebook group (by URL)"),
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_GROUP_SOURCE
    });
  }
});

var FacebookGroupSourceFromUser = FacebookSource.extend({
   constructor: function FacebookGroupSourceFromUser() {
    FacebookSource.apply(this, arguments);
  },
  localizedName: i18n.gettext("Posts from a Facebook group to which you're subscribed"),
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_GROUP_SOURCE_FROM_USER
    });
  }
});

var FacebookPagePostsSource = FacebookSource.extend({
   constructor: function FacebookPagePostsSource() {
    FacebookSource.apply(this, arguments);
  },
  localizedName: i18n.gettext("Posts from a Facebook page to which you're subscribed"),
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_PAGE_POSTS_SOURCE
    });
  }
});

var FacebookPageFeedSource = FacebookSource.extend({
   constructor: function FacebookPageFeedSource() {
    FacebookSource.apply(this, arguments);
  },
  localizedName: i18n.gettext("Posts from users on a Facebook page to which you're subscribed"),
  defaults: function() {
    return _.extend(FacebookSource.prototype.defaults(), {
      '@type': Types.FACEBOOK_PAGE_FEED_SOURCE
    });
  }
});

var ContentSourceId = Base.Model.extend({
  constructor: function ContentSourceId() {
    Base.Model.apply(this, arguments);
  },

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
        return IMAPMailboxSource;
      case Types.MAILING_LIST:
        return MailingListSource;
      default:
        console.error("Unknown source type:" + type);
        return Source;
    }
  }

var sourceCollection = Base.Collection.extend({
  constructor: function sourceCollection() {
    Base.Collection.apply(this, arguments);
  },
  url: Ctx.getApiV2DiscussionUrl() + 'sources',

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
    IMAPMailboxSource: IMAPMailboxSource,
    MailingListSource: MailingListSource,
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

