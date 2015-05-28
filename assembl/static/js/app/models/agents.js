'use strict';

var $ = require('../shims/jquery.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Roles = require('../utils/roles.js');


var AVATAR_PLACEHOLDER = '//placehold.it/{0}';
var UNKNOWN_USER_ID = Roles.EVERYONE;

/**
 * @class UserModel
 */
var AgentModel = Base.Model.extend({
    /**
     * @type {String}
     */
    urlRoot: Ctx.getApiUrl('agents/'),

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
        real_name: null,
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
    fetchPermissionsFromScriptTag: function (id) {
        id = id || 'permissions-json';

        try {
            this.permissions = Ctx.getJsonFromScriptTag(id);
        } catch (e) {
            throw new Error("Invalid json");
        }
    },

    fetchPermissionsToScriptTag: function (id){
        //console.log("AgentModel::fetchPermissionsToScriptTag()");
        id = id || 'permissions-json';

        var promise = this.fetchPermissions();
        promise.then(function(permissions){
            try {
                Ctx.writeJsonToScriptTag(permissions, id);
            } catch (e) {
                throw new Error("Invalid json");
            }
        });

        return promise;
    },

    /**
     * Load permissions from database
     */
    fetchPermissions: function () {
        //console.log("AgentModel::fetchPermissions()");
        var that = this;
        var promise = Promise.resolve($.get(Ctx.getApiUrl('permissions/u/' + this.getId())));
        promise.then(function (permissions) {
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
    getAvatarUrl: function (size) {
        var id = this.getId();

        return id != UNKNOWN_USER_ID ? Ctx.formatAvatarUrl(Ctx.extractId(id), size) : Ctx.format(AVATAR_PLACEHOLDER, size);
    },

    getAvatarColor: function () {
        var numColors = 10;
        var hue = Math.round(360.0 * (this.getNumericId() % numColors) / numColors);
        return "hsl(" + hue + ", 60%, 65%)";
    },

    /**
     * @param  {String}  permission The permission name
     * @return {Boolean} True if the user has the given permission
     */
    hasPermission: function (permission) {
        return $.inArray(permission, this.permissions) >= 0;
    },

    /**
     * @alias hasPermission
     */
    can: function (permission) {
        return this.hasPermission(permission);
    },

    /**
     * @return {Boolean} true if the user is an unknown user
     */
    isUnknownUser: function () {
        return this.getId() == UNKNOWN_USER_ID;
    },

    getSingleAgent: function () {
        this.urlRoot = Ctx.getApiUrl('agents/') + Ctx.getCurrentUserId();
    },

    getSingleUser: function () {
        this.urlRoot = Ctx.getApiV2DiscussionUrl('all_users/') + Ctx.getCurrentUserId();
    },

    validate: function(attrs, options){
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
    getById: function (id) {
        var user = this.get(id);
        return user || this.getUnknownUser();
    },

    /**
     * Returns the unknown user
     * @return {User}
     */
    getUnknownUser: function () {
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

