"use strict";

define(['backbone.marionette', 'models/discussionSource'], function (Marionette, DiscussionSource) {

    var EmailSender = Marionette.ItemView.extend({
        template: '#tmpl-discussionSource',
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

    var AdminDiscussionSettings = Marionette.LayoutView.extend({
        template: '#tmpl-adminDiscussionSettings',
        className: 'admin-settings',
        initialize: function(){

        },
        regions: {
            sender: "#emailSender-container"
        },
        onRender: function(){
            var discussionSource = new DiscussionSource.Collection();

            var emailSenderList = new EmailSenderList({
                collection: discussionSource
            });
            discussionSource.fetch();

            this.sender.show(emailSenderList);
        }

    });


    return AdminDiscussionSettings;
});