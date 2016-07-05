'use strict';
/**
 * Represents a discussion
 * @module app.models.discussion
 */
var Base = require('./base.js'),
    Jed = require('jed'),
    Ctx = require('../common/context.js'),
    Permissions = require('../utils/permissions.js'),
    i18n = require('../utils/i18n.js'),
    Roles = require('../utils/roles.js');
/**
 * Discussion model
 * Frontend model for :py:class:`assembl.models.discussion.Discussion`
 * @class app.models.discussion.discussionModel
 * @extends app.models.base.BaseModel
 */
var discussionModel = Base.Model.extend({
  /**
   * @member {string} app.models.discussion.discussionModel.url
   */
  url: Ctx.getApiV2DiscussionUrl(),
  /**
   * Defaults
   * @type {Object}
   */
  defaults: {
    'introduction': '',
    'objectives': '',
    'creation_date': '',
    'topic': '',
    'introductionDetails': '',
    '@type': '',
    'widget_collection_url': '',
    'slug': '',
    '@view': '',
    'permissions': {},
    'subscribe_to_notifications_on_signup': false,
    'web_analytics_piwik_id_site': null,
    'help_url': null,
    'logo': null,
    'homepage': null,
    'show_help_in_debate_section': true,
    posts: []
  },
  /**
   * @function app.models.discussion.discussionModel.constructor
   */
  constructor: function discussionModel() {
    Base.Model.apply(this, arguments);
  },
  /**
   * Validate the model attributes
   * @function app.models.discussion.discussionModel.validate
   */
  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
  },
  /**
   * Checks if translation service is available
   * @returns {Boolean}
   * @function app.models.discussion.discussionModel.hasTranslationService
   */
  hasTranslationService: function(){
    return Ctx.hasTranslationService();
  },
  /**
   * Returns roles according to permission
   * @param {Object} permission
   * @returns {Array}
   * @function app.models.discussion.discussionModel.getRolesForPermission
   */
  getRolesForPermission: function(permission) {
      var roles = undefined;
      if (_.contains(Permissions, permission)) {
        roles = this.get('permissions')[permission];
        if (roles) {
          return roles;
        }
        else {
          return []
        }
      }
      else {
        throw Error("Permission " + permission + " does not exist");
      }
    },
  /**
   * Get visualizations
   * @returns {BaseCollection}
   * @function app.models.discussion.discussionModel.getVisualizations
   */
  getVisualizations: function() {
    var jed, settings = Ctx.getPreferences(),
        visualizations = settings.visualizations,
        navigation_sections = settings.navigation_sections || {},
        user = Ctx.getCurrentUser(),
        navigation_item_collections = [];
    try {
      jed = new Jed(translations[Ctx.getLocale()]);
    } catch (e) {
      // console.error(e);
      jed = new Jed({});
    }

    for (var i in navigation_sections) {
      var navigation_section = navigation_sections[i],
      permission = navigation_section.requires_permission || Permissions.READ;
      if (user.can(permission)) {
        var visualization_items = navigation_section.navigation_content.items;
        visualization_items = _.filter(visualization_items, function(item) {
          return user.can(item.requires_permission || Permissions.READ) &&
          visualizations[item.visualization] !== undefined;
        });
        if (visualization_items.length === 0)
          continue;
        navigation_item_collections.push(new Base.Collection(
          _.map(visualization_items, function(item) {
          var visualization = visualizations[item.visualization];
          return new Base.Model({
            "url": visualization.url,
            "title": jed.gettext(visualization.title),
            "description": jed.gettext(visualization.description)
          });
        })));
      }
    }
    return navigation_item_collections;
  }
});
/**
 * Discussions collection
 * @class app.models.discussion.discussionCollection
 * @extends app.models.base.BaseCollection
 */
var discussionCollection = Base.Collection.extend({
  /**
   * @member {string} app.models.discussion.discussionCollection.url
   */
  url: Ctx.getApiV2DiscussionUrl(),
  /**
   * The model
   * @type {discussionModel}
   */
  model: discussionModel,
  /**
   * @function app.models.discussion.discussionCollection.constructor
   */
  constructor: function discussionCollection() {
    Base.Collection.apply(this, arguments);
  }
});

module.exports = {
  Model: discussionModel,
  Collection: discussionCollection
};
