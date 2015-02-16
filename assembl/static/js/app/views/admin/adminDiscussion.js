'use strict';

define(['backbone.marionette', 'jquery', 'underscore','common/collectionManager', 'common/context', 'models/discussion', 'models/discussionSource'],
    function (Marionette, $, _, CollectionManager, Ctx, Discussion, DiscussionSource) {

        var adminDiscussion = Marionette.LayoutView.extend({
            template: '#tmpl-adminDiscussion',
            className: 'admin-notifications',
            ui: {
              discussion: '.js_saveDiscussion',
              close: '.bx-alert-success .bx-close'
            },
            initialize: function () {
                var that = this,
                    collectionManager = new CollectionManager();

                this.model = undefined;

                $.when(collectionManager.getDiscussionModelPromise()).then(
                    function (Discussion) {
                        that.model =  Discussion;
                        that.render();
                    });

                console.debug(this.model);
            },

            events: {
              'click @ui.discussion': 'saveDiscussion',
              'click @ui.close': 'close'
            },

            serializeData: function () {
                return {
                    discussion: this.model,
                    Ctx: Ctx
                }
            },

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            },

            saveDiscussion: function (e) {
                e.preventDefault();

                var introduction = this.$('textarea[name=introduction]').val(),
                    topic = this.$('input[name=topic]').val(),
                    slug = this.$('input[name=slug]').val(),
                    objectives = this.$('textarea[name=objectives]').val(),
                    that = this;

                this.model.set({
                    introduction:introduction,
                    topic: topic,
                    slug: slug,
                    objectives: objectives
                });

                this.model.save(null, {
                    success: function (model, resp) {
                        that.$('.bx-alert-success').removeClass('hidden');
                    },
                    error: function (model, resp) {
                        console.debug(model, resp);
                    }
                })

            }

        });

        return adminDiscussion;
    });