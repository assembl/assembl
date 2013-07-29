define(['backbone', 'app'], function(Backbone, app){
    'use strict';

    /**
     * @class UserModel
     */
    var UserModel = Backbone.Model.extend({

        url: "/static/js/tests/fixtures/user.json",
        defaults: {
            name: '',
            avatarUrl: ''
        }
    });


    return {
        Model: UserModel
    };

});
