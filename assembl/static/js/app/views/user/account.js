'use strict';

define(['backbone.marionette', 'models/emailAccounts'], function (Marionette, emailAccounts) {

    var email = Marionette.ItemView.extend({
        template:'#tmpl-associateAccount',
        className:'associate-email mbs',
        serializeData: function(){
            return {
              email: this.model
            }
        },
        templateHelpers: function () {
            return {
                social: function(){

                }
            }
        }
    });

    var emailList = Marionette.CompositeView.extend({
        template: '#tmpl-associateAccounts',
        childView: email,
        childViewContainer:'.controls',
        initialize: function(){

            var tab = [
                {
                    profile: "local:AgentProfile/1",
                    username: "maparent@gmail.com",
                    picture_url: "https://lh4.googleusercontent.com/-TiKStAuP_Lo/AAAAAAAAAAI/AAAAAAAABJ8/Ix617kwUUPo/photo.jpg",
                    provider: "google",
                    '@id': "local:AbstractAgentAccount/187",
                    '@type': "IdentityProviderAccount",
                    email: "maparent@gmail.com",
                    '@view': "default"
                },
                {
                    profile: "local:AgentProfile/1",
                    '@id': "local:AbstractAgentAccount/384",
                    '@type': "IdentityProviderAccount",
                    '@view': "default",
                    email: "maparent@gmail.com",
                    provider: "facebook"
                },
                {
                    profile: "local:AgentProfile/1",
                    will_merge_if_validated: false,
                    verified: true,
                    preferred: true,
                    '@type': "EmailAccount",
                    '@id': "local:AbstractAgentAccount/1",
                    email: "maparent@gmail.com",
                    '@view': "default"
                }
            ];

            var toto = new Backbone.Collection();
            toto.add(tab);

            this.collection = toto;
        }
    });

    var account = Marionette.LayoutView.extend({
        template: '#tmpl-userAccount',
        className: 'admin-account',
        ui: {
          close: '.bx-alert-success .bx-close'
        },
        regions: {
          'accounts':'#associate_account'
        },
        onRender: function(){
            var emailCollection = new emailAccounts.Collection();
            var account = new emailList({
                collection: emailCollection
            });

            //FIXME: 403 on this model
            emailCollection.fetch();
            this.accounts.show(account);
        }

    });

    return account;
});