"use strict";

define(['backbone.marionette', 'models/discussionSource'], function (Marionette, DiscussionSource) {

    var EmailSender = Marionette.ItemView.extend({
        template: '#tmpl-discussionSource',
        ui: {
            source:'.js_saveSource'
        },
        events: {
            'click @ui.source':'saveSource'
        },
        serializeData: function(){
            return {
                source: this.model
            }
        },

        saveSource: function(e){
            e.preventDefault();

            var name = this.$('#name').val(),
                admin_sender = this.$('#admin_sender').val(),
                post_email_address = this.$('#post_email_address').val(),
                host = this.$('#host').val(),
                most_common_recipient_address = this.$('#most_common_recipient_address').val(),
                discussion_id = this.$('#discussion_id').val(),
                use_ssl = this.$('#use_ssl:checked').val(),
                folder = this.$('#folder').val(),
                port = parseInt(this.$('#port').val());

            this.model.set({
                name : name,
                admin_sender : admin_sender,
                post_email_address : post_email_address,
                host : host,
                most_common_recipient_address : most_common_recipient_address,
                discussion_id : discussion_id,
                use_ssl : use_ssl,
                folder : folder,
                port : port
            });

            this.model.save(null, {
                success: function(model, resp){

                    console.debug('success');

                },
                error: function(model, resp){

                    console.debug('error');

                }
            });
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

    var AdminDiscussionSettings = Marionette.LayoutView.extend({
        template: '#tmpl-adminDiscussionSettings',
        className: 'admin-settings',
        regions: {
            source: "#source-container"
        },
        onRender: function(){
            var discussionSource = new DiscussionSource.Collection();

            var emailSenderList = new EmailSenderList({
                collection: discussionSource
            });
            discussionSource.fetch();

            this.source.show(emailSenderList);
        }

    });


    return AdminDiscussionSettings;
});