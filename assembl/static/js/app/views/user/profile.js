'use strict';

define(['backbone.marionette', 'models/user', 'common/context'],
    function (Marionette, User, Ctx) {

    var userProfile = Marionette.LayoutView.extend({
        template: '#tmpl-profile',
        className: 'admin-profile',
        regions: {

        },
        initialize: function () {

            this.model = new User.Model();
            this.model.url = Ctx.getApiUrl('agents/') + Ctx.getCurrentUserId();
            this.model.fetch();

        },
        modelEvents: {
            'sync': 'render'
        },

        events: {

        },

        serializeData: function () {
            return {
                profile: this.model
            }
        },

        onRender: function () {


            console.debug(this.model);
        }

    });

    return userProfile;
});