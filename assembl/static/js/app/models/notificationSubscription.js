'use strict';
/**
 * A user's subscription to being notified of certain situations
 * @module app.models.notificationSubscription
 */

var Base = require('./base.js'),
    Ctx = require('../common/context.js');

/**
 * Notification subscription model
 * Frontend model for :py:class:`assembl.models.notification.NotificationSubscription`
 * @class app.models.notificationSubscription.notificationsSubscriptionModel
 * @extends app.models.base.BaseModel
 */
 
var notificationsSubscriptionModel = Base.Model.extend({
  constructor: function notificationsSubscriptionModel() {
    Base.Model.apply(this, arguments);
  },

  defaults: {
    '@id': null,
    '@type': null,
    status: null,
    followed_object: null,
    parent_subscription: null,
    discussion: null,
    last_status_change_date: null,
    creation_date: null,
    creation_origin: null,
    human_readable_description: null,
    user: null
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  }
});

/**
 * Notifications subscription collection
 * @class app.models.notificationSubscription.notificationsSubscriptionCollection
 * @extends app.models.base.BaseCollection
 */
 
var notificationsSubscriptionCollection = Base.Collection.extend({
  constructor: function notificationsSubscriptionCollection() {
    Base.Collection.apply(this, arguments);
  },

  model: notificationsSubscriptionModel,

  /**
   * Set the collection url for a specific user subscription
   */
  setUrlToUserSubscription: function() {
    var root = 'Discussion/' + Ctx.getDiscussionId() + '/all_users/' + Ctx.getCurrentUserId() + '/notification_subscriptions';
    this.url = Ctx.getApiV2Url(root);
  },

  /**
   * Set the collection url for global discussion template subscription
   */
  setUrlToDiscussionTemplateSubscriptions: function() {
    this.url = Ctx.getApiV2DiscussionUrl("user_templates/-/notification_subscriptions");
  }
});

module.exports = {
  Model: notificationsSubscriptionModel,
  Collection: notificationsSubscriptionCollection
};
