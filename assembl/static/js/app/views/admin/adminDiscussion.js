'use strict';

define(['backbone.marionette', 'jquery', 'common/collectionManager', 'common/context', 'models/discussion'],
    function (Marionette, $, CollectionManager, Ctx, Discussion) {

        var adminDiscussion = Marionette.LayoutView.extend({
            template: '#tmpl-adminDiscussion',
            className: 'admin-notifications',
            ui: {
                discussion: '.js_saveDiscussion'
            },
            initialize: function () {
                var that = this,
                    collectionManager = new CollectionManager();

                this.model = new Backbone.Model();

                $.when(collectionManager.getDiscussionCollectionPromise()).then(
                    function (Discussion) {
                        that.model = Discussion.models[0];
                        that.render();
                    });

            },

            events: {
                'click @ui.discussion': 'saveDiscussion'
            },

            serializeData: function () {
                return {
                    discussion: this.model,
                    ctx: Ctx
                }
            },

            saveDiscussion: function (e) {
                e.preventDefault();

                var topic = this.$('input[name=topic]').val(),
                    slug = this.$('input[name=slug]').val(),
                    objectives = this.$('textarea[name=objectives]').val();

                var discussion = new Discussion.Model({
                    topic: topic,
                    slug: slug,
                    objectives: objectives
                });

                discussion.save(null, {
                    success: function (model, resp) {
                        console.debug(model, resp)
                    },
                    error: function (model, resp) {
                        console.debug(model, resp)
                    }
                })

            }

        });

        return adminDiscussion;
    });