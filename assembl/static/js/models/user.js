define(['models/base', 'app', 'jquery', 'i18n'], function(Base, app, $, i18n){
    'use strict';

    var AVATAR_PLACEHOLDER = '//placehold.it/{0}';

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
         * return the avatar's url
         * @param  {Number} [size=44] The avatar size
         * @return {string}
         */
        getAvatarUrl: function(size){
            var id = this.getId();

            return id ? app.formatAvatarUrl(app.extractId(id), size) : app.format(AVATAR_PLACEHOLDER, size);
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
        id: 0,
        name: i18n.gettext('Unknown user')
    });


    return {
        Model: UserModel,
        Collection: UserCollection
    };

});
