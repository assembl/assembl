'use strict';

define(['backbone.marionette', 'models/user', 'common/context'],
    function (Marionette, User, Ctx) {

        var userProfile = Marionette.ItemView.extend({
            template: '#tmpl-profile',
            className: 'admin-profile',
            ui: {
                close: '.bx-alert-success .bx-close',
                profile: '.js_saveProfile'
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
                'click @ui.profile': 'saveProfile',
                'click @ui.close': 'close'
            },

            serializeData: function () {
                return {
                    profile: this.model
                }
            },

            saveProfile: function () {
                //TODO: backbone sync to server
            },

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            }
        });

        return userProfile;
    });