define(['backbone', 'app', 'jquery', 'i18n'], function(Backbone, app, $, i18n){
    'use strict';

    var AVATAR_PLACEHOLDER = '//placehold.it/{0}';

    /**
     * @class UserModel
     */
    var UserModel = Backbone.Model.extend({

        /**
         * Overwritting the idAttribute
         * @type {String}
         */
        idAttribute: '@id',

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
         * If there is an user logged in, get his/her information
         */
        loadCurrentUser: function(){
            this.set('id', $('#user-id').val());
            this.set('name', $('#user-displayname').val());
        },

        /**
         * return the avatar's url
         * @param  {Number} [size=44] The avatar size
         * @return {string}
         */
        getAvatarUrl: function(size){
            var id = this.get('@id');

            return id ? app.formatAvatarUrl(app.extractId(id), size) : app.format(AVATAR_PLACEHOLDER, size);
        }
    });



    /**
     * @class UserCollection
     */
    var UserCollection = Backbone.Collection.extend({
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
        id: 0,
        name: i18n.gettext('Unknown user')
    });


    return {
        Model: UserModel,
        Collection: UserCollection
    };

});
