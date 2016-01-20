'use strict';

var Types = {
  DISCUSSION: 'Discussion',
  EXTRACT: 'Extract',
  ROOT_IDEA: 'RootIdea',
  IDEA: 'Idea',
  IDEA_LINK: 'IdeaLink',
  POST: 'Post',
  SYNTHESIS_POST: 'SynthesisPost',
  EMAIL: 'Email',
  SYNTHESIS: 'Synthesis',
  TABLE_OF_CONTENTS: 'TableOfIdeas',
  USER: 'User',
  PARTNER_ORGANIZATION: 'PartnerOrganization',
  WEBPAGE: 'Webpage',
  DOCUMENT: 'Document',
  POST_ATTACHMENT: 'PostAttachment',
  IDEA_ATTACHMENT: 'IdeaAttachment',
  ANNOUNCEMENT: 'Announcement',
  IDEA_ANNOUNCEMENT: 'IdeaAnnouncement',
  CONTENT_SOURCE: 'ContentSource',
  POST_SOURCE: 'PostSource',
  ABSTRACT_MAILBOX: 'AbstractMailbox',
  IMAPMAILBOX: 'IMAPMailbox',
  MAILING_LIST: 'MailingList',
  ABSTRACT_FILESYSTEM_MAILBOX: 'AbstractFilesystemMailbox',
  MAILDIR_MAILBOX: 'MaildirMailbox',
  FEED_POST_SOURCE: 'FeedPostSource',
  LOOMIO_POST_SOURCE: 'LoomioPostSource',
  EDGE_SENSE_DRUPAL_SOURCE: 'EdgeSenseDrupalSource',
  FACEBOOK_GENERIC_SOURCE: 'FacebookGenericSource',
  FACEBOOK_GROUP_SOURCE: 'FacebookGroupSource',
  FACEBOOK_GROUP_SOURCE_FROM_USER: 'FacebookGroupSourceFromUser',
  FACEBOOK_PAGE_POSTS_SOURCE: 'FacebookPagePostsSource',
  FACEBOOK_PAGE_FEED_SOURCE: 'FacebookPageFeedSource',
  FACEBOOK_SINGLE_POST_SOURCE: 'FacebookSinglePostSource',



  initInheritance: function(inheritance) {
    // This is small, I think it can be synchronous.
    var script = document.getElementById("inheritance-json");
    try {
      this.inheritance = JSON.parse(script.textContent);
    } catch (e) {
      this.inheritance = {};
    }
  },
  getBaseType: function(type) {
    if (this.inheritance === undefined)
        return type;
    while (this.inheritance[type] !== undefined) {
      type = this.inheritance[type];
    }

    return type;
  },
  isInstance: function(type, parentType) {
    if (this.inheritance === undefined)
        return type == parentType;
    while (this.inheritance[type] !== undefined) {
      if (type == parentType)
          return true;
      type = this.inheritance[type];
    }

    return type == parentType;
  }
};
Types.initInheritance();

module.exports = Types;

