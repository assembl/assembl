'use strict';

define(['backbone.marionette', 'models/emailAccounts'], function (Marionette, emailAccounts) {

    var email = Marionette.ItemView.extend({
        template:'#tmpl-emailAccount',
        serializeData: function(){
            return {
              email: this.model
            }
        }
    });

    var emailList = Marionette.CollectionView.extend({
        childView: email
    });

    var account = Marionette.LayoutView.extend({
        template: '#tmpl-userAccount',
        className: 'admin-account',
        ui: {
          close: '.bx-alert-success .bx-close'
        },
        regions: {
          'accounts':'#account-content'
        },
        onRender: function(){
            var emailCollection = new emailAccounts.Collection();
            var account = new emailList({
                collection: emailCollection
            });

            //FIXME: 403 on this model
            //emailCollection.fetch();
            //this.accounts.show(account);
        }

    });

    return account;
});