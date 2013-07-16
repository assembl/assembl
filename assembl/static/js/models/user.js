define(['backbone', 'app'], function(Backbone, app){
    'use strict';

    /**
     * @class UserModel
     */
    var UserModel = Backbone.Model.extend({

        /**
         * Returns the whole url for the user's avatar
         * 
         * @param  {Number} [size=44] The size
         * @return {String}
         */
        getAvatarUrl: function(size){
            size = size || 44;

            var url = this.get('avatarUrl');
            if( !url ){
                url = '//placehold.it/'+size+'x'+size;
            } else {
                url += '?s=44';
            }

            return url;
        },

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
