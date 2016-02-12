'use strict';

var Base = require('./base.js'),
    Jed = require('jed'),
    Ctx = require('../common/context.js'),
    Permissions = require('../utils/permissions.js'),
    i18n = require('../utils/i18n.js'),
    Roles = require('../utils/roles.js');

var discussionModel = Base.Model.extend({
  url: Ctx.getApiV2DiscussionUrl(),
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
  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
  },

  hasTranslationService: function(){
    return Ctx.hasTranslationService();
  },

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

var discussionCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl(),
  model: discussionModel
});

module.exports = {
  Model: discussionModel,
  Collection: discussionCollection
};
