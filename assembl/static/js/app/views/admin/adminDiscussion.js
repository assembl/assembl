'use strict';

define(['backbone.marionette', 'jquery', 'underscore','common/collectionManager', 'common/context', 'models/discussion', 'models/discussionSource'],
    function (Marionette, $, _, CollectionManager, Ctx, Discussion, DiscussionSource) {

        var EmailSender = Marionette.ItemView.extend({
            template: '#tmpl-emailSender',
            ui: {
              emailSender:'.js_emailSender'
            },
            events: {
              'click @ui.emailSender':'emailSender'
            },
            serializeData: function(){
              return {
                  source: this.model
              }
            },
            emailSender: function(e){
              var email = document.querySelector('#email_sender');

              if(email.validity.valid){
                  e.preventDefault();

                  this.model.set({
                      admin_sender: email.value
                  });

                  this.model.save(null, {
                      success: function(model, resp){

                      },
                      error: function(model, resp){

                      }
                  });


              }
            }
        });

        var EmailSenderList = Marionette.CollectionView.extend({
            childView: EmailSender
        });

        var adminDiscussion = Marionette.LayoutView.extend({
            template: '#tmpl-adminDiscussion',
            className: 'admin-notifications',
            ui: {
              discussion: '.js_saveDiscussion',
              close: '.bx-alert-success .bx-close'
            },
            regions: {
              sender: "#emailSender-container"
            },
            initialize: function () {
                var that = this,
                    collectionManager = new CollectionManager();

                this.model = new Discussion.Model();

                $.when(collectionManager.getDiscussionModelPromise()).then(
                    function (Discussion) {
                        _.extend(that.model.attributes, Discussion.attributes);
                        that.render();
                    });
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

            onRender: function(){
                var discussionSource = new DiscussionSource.Collection();

                var emailSenderList = new EmailSenderList({
                    collection: discussionSource
                });
                discussionSource.fetch();

                this.sender.show(emailSenderList);
            },

            close: function () {
                this.$('.bx-alert-success').addClass('hidden');
            },

            saveDiscussion: function (e) {
                e.preventDefault();

                var topic = this.$('input[name=topic]').val(),
                    slug = this.$('input[name=slug]').val(),
                    objectives = this.$('textarea[name=objectives]').val(),
                    that = this;

                this.model.url = '/api/v1/discussion/' + Ctx.getDiscussionId();

                this.model.set({
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