'use strict';

var $ = require('../shims/jquery.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Promise = require('bluebird'),
    Permissions = require("../utils/permissions.js"),
    Roles = require('../utils/roles.js');

var AVATAR_PLACEHOLDER = '//placehold.it/{0}';
var UNKNOWN_USER_ID = Roles.EVERYONE;

/**
 * @class AgentModel
 */
var AgentModel = Base.Model.extend({
  /**
   * @type {String}
   */
  //urlRoot: Ctx.getApiUrl('agents/'),
  urlRoot:  Ctx.getApiV2DiscussionUrl() + 'all_users/',
  /**
   * Defaults
   * @type {Object}
   */
  defaults: {
    username: null,
    name: null,
    post_count: 0,
    preferred_email: null,
    verified: false,
    avatar_url_base: null,
    creation_date: null,
    is_first_visit: false,
    first_visit: null,
    last_visit: null,
    last_login: null,
    real_name: null,
    permissions: [],
    '@type': null,
    '@view': null
  },

  /**
   * The list with all user's permissions
   * This is usefull only for the logged user.
   * @type {String[]}
   */
  permissions: [],

  /**
   * Load the permissions from script tag
   * and populates `this.permissions`
   *
   * @param {String} [id='permissions-json'] The script tag id
   */
  fetchPermissionsFromScriptTag: function(id) {
    id = id || 'permissions-json';

    try {
      this.permissions = Ctx.getJsonFromScriptTag(id);
    } catch (e) {
      throw new Error("Invalid json");
    }
  },

  /**
   * Load permissions from database
   */
  fetchPermissions: function() {
    //console.log("AgentModel::fetchPermissions()");
    var that = this;
    var promise = Promise.resolve($.get(Ctx.getApiUrl('permissions/u/' + this.getId())));
    promise.then(function(permissions) {
      console.log("AgentModel::fetchPermissions() promise received");
      that.permissions = permissions;
    });
    return promise;
  },

  /**
   * return the avatar's url
   * @param  {Number} [size=44] The avatar size
   * @return {string}
   */
  getAvatarUrl: function(size) {
    var id = this.getId();

    return id != UNKNOWN_USER_ID ? Ctx.formatAvatarUrl(Ctx.extractId(id), size) : Ctx.format(AVATAR_PLACEHOLDER, size);
  },

  getAvatarColor: function() {
    var numColors = 10;
    var hue = Math.round(360.0 * (this.getNumericId() % numColors) / numColors);
    return "hsl(" + hue + ", 60%, 65%)";
  },

  /**
   * @param  {String}  permission The permission name
   * @return {Boolean} True if the user has the given permission
   */
  hasPermission: function(permission) {
    return $.inArray(permission, this.permissions) >= 0;
  },

  /**
   * @alias hasPermission
   */
  can: function(permission) {
    return this.hasPermission(permission);
  },


  /**
   * @return A text message designed to replace X in the question "You cannot perform this operation because X"
   */
  getRolesMissingMessageForPermission: function(permission, discussion) {
      if (this.hasPermission(permission)) {
        return i18n.gettext('need no additional permissions');
      }
      else if (this.isUnknownUser()) {
        return i18n.sprintf(i18n.gettext("you must first <a href='%s'>Sign in</a>"), Ctx.getLoginURL());
      }
      else if (discussion !== undefined) {
        var rolesGrantingPermission = discussion.getRolesForPermission(permission);
        if (_.size(rolesGrantingPermission) > 0) {
          if (_.contains(rolesGrantingPermission, Roles.PARTICIPANT) && _.contains(discussion.getRolesForPermission(Permissions.SELF_REGISTER), Roles.AUTHENTICATED)) {
            return i18n.sprintf(i18n.gettext('you must first join this discussion'));
          }
          else {
            //TODO:  Handle the case of self_register_req
            return i18n.sprintf(i18n.ngettext('you must ask a discussion administrator for the following role: %s', 'you must ask a discussion administrator for one of the following roles: %s', _.size(rolesGrantingPermission)), rolesGrantingPermission.join(', '));
          }
        }
        else {
          return i18n.gettext('the administrator has closed this discussion to all contributions');
        }
      } else {
        return i18n.gettext("you need additional permissions");
      }
    },

  /**
   * @return {Boolean} true if the user is an unknown user
   */
  isUnknownUser: function() {
    return this.getId() == UNKNOWN_USER_ID;
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  }

});

/**
 * @class UserCollection
 */
var AgentCollection = Base.Collection.extend({
  /**
   * @type {String}
   */
  url: Ctx.getApiUrl('agents/'),

  /**
   * The model
   * @type {UserModel}
   */
  model: AgentModel,

  /**
   * Returns the user by his/her id, or return the unknown user
   * @param {Number} id
   * @type {User}
   */
  getById: function(id) {
    var user = this.get(id);
    return user || this.getUnknownUser();
  },

  /**
   * Returns the unknown user
   * @return {User}
   */
  getUnknownUser: function() {
    return UNKNOWN_USER;
  }
});

/**
 * The unknown User
 * @type {UserModel}
 */
var UNKNOWN_USER = new AgentModel({
  '@id': UNKNOWN_USER_ID,
  name: i18n.gettext('Unknown user')
});

module.exports = {
  Model: AgentModel,
  Collection: AgentCollection
};

