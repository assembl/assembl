'use strict';

define(['backbone.marionette', 'models/agents'],
    function (Marionette, Agents) {

        var userProfile = Marionette.ItemView.extend({
            template: '#tmpl-profile',
            className: 'admin-profile',
            ui: {
                close: '.bx-alert-success .bx-close',
                profile: '.js_saveProfile',
                form: '.core-form .form-horizontal'
            },

            initialize: function () {
                this.model = new Agents.Model();
                this.model.getSingleUser();
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

            saveProfile: function (e) {
                e.preventDefault();

                var username = this.$('input[name=username]').val(),
                    name = this.$('input[name="name"]').val(),
                    pass1 = this.$('input[name="password1"]').val(),
                    pass2 = this.$('input[name="password2"]').val(),
                    email = this.$('input[name="add_email"]').val();

                this.model.set({
                    username: username,
                    name: name,
                    password1: pass1,
                    password2: pass2,
                    add_email: email
                });

                this.model.save(null, {
                    success: function (model, resp) {
                        console.debug('succes', model, resp)
                    },
                    error: function (model, resp) {
                        console.debug('error', model, resp)
                    }
                })
            },

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            }

        });

        return userProfile;
    });