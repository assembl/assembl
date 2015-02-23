'use strict';

define(['backbone.marionette', 'jquery', 'underscore','common/collectionManager', 'common/context', 'models/discussion', 'models/discussionSource', 'utils/i18n', 'jquery-autosize', 'bluebird'],
    function (Marionette, $, _, CollectionManager, Ctx, Discussion, DiscussionSource, i18n, autosize, Promise) {

        var adminDiscussion = Marionette.ItemView.extend({
            template: '#tmpl-adminDiscussion',
            className: 'admin-notifications',
            ui: {
              discussion: '.js_saveDiscussion'
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

            },
            onRender: function(){
                this.$('#introduction').autosize();
            },
            events: {
              'click @ui.discussion': 'saveDiscussion'
            },

            serializeData: function () {
                return {
                    discussion: this.model,
                    Ctx: Ctx
                }
            },

            saveDiscussion: function (e) {
                e.preventDefault();

                var introduction = this.$('textarea[name=introduction]').val(),
                    topic = this.$('input[name=topic]').val(),
                    slug = this.$('input[name=slug]').val(),
                    objectives = this.$('textarea[name=objectives]').val();

                this.model.set({
                    introduction:introduction,
                    topic: topic,
                    slug: slug,
                    objectives: objectives
                });

                this.model.save(null, {
                    success: function (model, resp) {
                        $.bootstrapGrowl(i18n.gettext('Your settings were saved'), {
                            ele: 'body',
                            type: 'success',
                            offset: {from: 'bottom', amount:20},
                            align: 'left',
                            delay: 4000,
                            allow_dismiss: true,
                            stackup_spacing: 10
                        });
                    },
                    error: function (model, resp) {
                        $.bootstrapGrowl(i18n.gettext('Your settings fail to update'), {
                            ele: 'body',
                            type: 'error',
                            offset: {from: 'bottom', amount:20},
                            align: 'left',
                            delay: 4000,
                            allow_dismiss: true,
                            stackup_spacing: 10
                        });
                    }
                })

            }

        });

        return adminDiscussion;
    });