'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    $ = require('../shims/jquery.js');

//ContentSource + PostSource
var Source = Base.Model.extend({
  urlRoot: Ctx.getApiV2DiscussionUrl('sources'),
  defaults: {
    'name': 'ContentSource_' + this.cid,
    'creation_date': null,
    'discussion_id': null,
    'last_import': null,
    'connection_error': null,
    'error_description': null,
    'error_backoff_until': null,
    'number_of_imported_posts': 0,
    '@type': 'ContentSource'
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
    console.log('this', this);
    console.log('The proto', Source.prototype);
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
    console.log('this', this);
    console.log('The proto', Source.prototype);
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
  model: Source,
  parse: function(res) {
    var that = this;
    _.each(res, function(s, i, arr) {
      var t = s["@type"];
      switch (t) {
        case 'ContentSource':
        case 'PostSource':
          that.add(new Source(s));
          break;
        case 'AbstractMailbox':
        case 'IMAPMailbox':
        case 'MailingList':
        case 'AbstractFilesystemMailbox':
        case 'MaildirMailbox':
          that.add(new Email(s));
          break;
        case 'FacebookGenericSource':
        case 'FacebookGroupSource':
        case 'FacebookGroupSourceFromUser':
        case 'FacebookPagePostsSource':
        case 'FacebookPageFeedSource':
        case 'FacebookPageFeedSource':
        case 'FacebookSinglePostSource':
          that.add(new Facebook(s));
          break;
        default:
          console.error('Could not add object to source collection', s);
          break;
      }
    });
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

