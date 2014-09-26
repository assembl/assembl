define(function(require){
    'use strict';

    var Base = require('models/base'),
         Ctx = require('modules/context'),
           $ = require('jquery'),
        i18n = require('utils/i18n');


    var AVATAR_PLACEHOLDER = '//placehold.it/{0}';
    var UNKNOWN_USER_ID = 'system.Everyone';

    /**
     * @class UserModel
     */
    var UserModel = Base.Model.extend({

        /**
         * @type {String}
         */
        url: Ctx.getApiUrl('agents/'),

        /**
         * Defaults
         * @type {Object}
         */
        defaults: {
            id: null,
            name: '',
            description: '',
            avatarUrl: ''
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
        fetchPermissionsFromScripTag: function(id){
            id = id || 'permissions-json';

            var script = document.getElementById(id),
                json;

            if( !script ){
                console.log(Ctx.format("Script tag #{0} doesn't exist", id));
                return {};
            }

            try {
                json = JSON.parse(script.textContent);
                this.permissions = json;
            } catch(e){
                throw new Error("Invalid json");
            }

        },

        /**
         * return the avatar's url
         * @param  {Number} [size=44] The avatar size
         * @return {string}
         */
        getAvatarUrl: function(size){
            var id = this.getId();

            return id != UNKNOWN_USER_ID ? Ctx.formatAvatarUrl(Ctx.extractId(id), size) : Ctx.format(AVATAR_PLACEHOLDER, size);
        },

        getAvatarColor: function() {
            var numColors = 10;
            var hue = Math.round(360.0 * (this.getNumericId() % numColors) / numColors);
            return "hsl("+hue+", 60%, 65%)";
        },

        /**
         * @param  {String}  permission The permission name
         * @return {Boolean} True if the user has the given permission
         */
        hasPermission: function(permission){
            return $.inArray(permission, this.permissions) >= 0;
        },

        /**
         * @alias hasPermission
         */
        can: function(permission){
            return this.hasPermission(permission);
        },

        /**
         * @return {Boolean} true if the user is an unknown user
         */
        isUnknownUser: function(){
            return this.getId() == UNKNOWN_USER_ID;
        }

    });


    /**
     * @class UserCollection
     */
    var UserCollection = Base.Collection.extend({
        /**
         * @type {String}
         */
        url: Ctx.getApiUrl('agents/'),

        /**
         * The model
         * @type {UserModel}
         */
        model: UserModel,

        /**
         * Returns the user by his/her id, or return the unknown user
         * @param {Number} id
         * @type {User}
         */
        getById: function(id){
            var user = this.get(id);
            return user || this.getUnknownUser();
        },

        /**
         * Returns the unknown user
         * @return {User}
         */
        getUnknownUser: function(){
            return UNKNOWN_USER;
        }
    });

    /**
     * The unknown User
     * @type {UserModel}
     */
    var UNKNOWN_USER = new UserModel({
        id: UNKNOWN_USER_ID,
        name: i18n.gettext('Unknown user')
    });


    return {
        Model: UserModel,
        Collection: UserCollection
    };

});
