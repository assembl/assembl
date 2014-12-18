'use strict';

define(['models/base', 'common/context'], function (Base, Ctx) {

    var postCollection = Base.Collection.extend({
        url: Ctx.getApiV2DiscussionUrl("/all_users/" + Ctx.getCurrentUserId() + "/posts_created"),

        parse: function (resp, options) {
            var data = resp;
            return data;
        },

        isFirsPostFromUser: function () {
            var isFirst = false;

            this.fetch({
                success: function (model, resp) {
                    if (resp.length < 2) {
                        isFirst = true;
                    }
                },
                error: function (model, resp) {
                }
            });

            return isFirst;
        }
    });


    return {
        Collection: postCollection
    };
});