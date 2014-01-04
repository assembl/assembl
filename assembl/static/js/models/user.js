define(['models/base', 'app', 'jquery', 'i18n', 'permissions'], function(Base, app, $, i18n, Permissions){
    'use strict';

    var AVATAR_PLACEHOLDER = '//placehold.it/{0}';
    var UNKNOWN_USER_ID = 'system.Everyone';

    /**
     * @class UserModel
     */
    var UserModel = Base.Model.extend({

        /**
         * @type {String}
         */
        url: app.getApiUrl('agents/'),

        /**
         * Defaults
         * @type {Object}
         */
        defaults: {
            id: null,
            name: '',
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
                throw new Error(app.format("Script tag #{0} doesn't exist", id));
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

            return id != UNKNOWN_USER_ID ? app.formatAvatarUrl(app.extractId(id), size) : app.format(AVATAR_PLACEHOLDER, size);
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
        }

    });


    /**
     * @class UserCollection
     */
    var UserCollection = Base.Collection.extend({
        /**
         * @type {String}
         */
        url: app.getApiUrl('agents/'),

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
