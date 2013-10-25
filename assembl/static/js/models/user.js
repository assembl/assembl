define(['backbone', 'app', 'jquery'], function(Backbone, app, $){
    'use strict';

    /**
     * @class UserModel
     */
    var UserModel = Backbone.Model.extend({

        // Todo: add the right endpoint here
        url: "/static/js/tests/fixtures/user.json",

        /**
         * Defaults
         * @type {Object}
         */
        defaults: {
            name: '',
            avatarUrl: ''
        },

        /**
         * If there is an user logged in, get his/her information
         */
        loadCurrentUser: function(){
            this.set('id', $('#user-id').val());
            this.set('name', $('#user-displayname').val());
        }
    });


    return {
        Model: UserModel
    };

});
