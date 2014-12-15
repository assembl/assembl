'use strict';

define(['backbone.marionette', 'models/user', 'common/context'],
    function (Marionette, User, Ctx) {

        var userProfile = Marionette.ItemView.extend({
            template: '#tmpl-profile',
            className: 'admin-profile',
            initialize: function () {

                this.model = new User.Model();
                this.model.url = Ctx.getApiUrl('agents/') + Ctx.getCurrentUserId();
                this.model.fetch();

            },

            modelEvents: {
                'sync': 'render'
            },

            serializeData: function () {
                return {
                    profile: this.model
                }
            }
        });

        return userProfile;
    });