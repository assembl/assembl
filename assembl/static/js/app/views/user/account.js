'use strict';

var Marionette = require('../../shims/marionette.js'),
    $ = require('../../shims/jquery.js'),
    emailAccounts = require('../../models/emailAccounts.js'),
    Ctx = require('../../common/context.js'),
    userProfile = require('../../models/userProfile.js'),
    i18n = require('../../utils/i18n.js');


var email = Marionette.ItemView.extend({
    template:'#tmpl-associateAccount',
    className:'associate-email mbs',
    ui: {
      verifyEmail: '.js_verifyEmail'
    },
    events: {
      'click @ui.verifyEmail': 'verifyEmail'
    },
    serializeData: function(){
        return {
          email: this.model
        }
    },
    verifyEmail: function(){
        var urlRoot = this.model.urlRoot +'/'+ this.model.get('@id').split('/')[1]+'/verify';

        var verify = new Backbone.Model();
            verify.url = urlRoot;

        verify.save(null, {
            success: function(model, resp){

                console.debug('success', resp)

            },
            error: function(model, resp){

                console.debug('error', resp)

            }
        })
    }
});

var emailList = Marionette.CompositeView.extend({
    template: '#tmpl-associateAccounts',
    childView: email,
    childViewContainer:'.controls'
});

var userAccount =  Marionette.ItemView.extend({
    template: '#tmpl-userAccountForm',
    ui: {
      'account': '.js_saveAccount'
    },
    events: {
        'click @ui.account': 'saveAccount'
    },
    modelEvents:{
      'add change':'render'
    },
    serializeData: function(){
        return {
            user: this.model
        }
    },
    templateHelpers: function(){
        return {
            urlDiscussion: function(){
                return '/' + Ctx.getDiscussionSlug() + '/';
            }
        }
    },
    saveAccount: function(e){
        e.preventDefault();

        var pass1 = this.$('input[name="new_password"]'),
            pass2 = this.$('input[name="confirm_password"]'),
            user = this.$('input[name="username"]'),
            p_pass1 = pass1.parent().parent(),
            p_pass2 = pass2.parent().parent();

        if(pass1.val() || pass2.val()){
            if(pass1.val() !== pass2.val()){
                p_pass1.addClass('error');
                p_pass2.addClass('error');
                return false;

            } else if(pass1.val() === pass2.val()) {
                p_pass1.addClass('error');
                p_pass2.addClass('error');

                this.model.set({
                    username: user.val(),
                    password: pass1.val()
                });
            }
        } else {
            this.model.set({username: user.val()});
        }

        this.model.save(null,{
            success: function(model, resp){

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
            error: function(model, resp){

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
        });

    }
});

var account = Marionette.LayoutView.extend({
    template: '#tmpl-userAccount',
    className: 'admin-account',
    regions: {
      'accounts':'#associate_account',
      'accountForm': '#userAccountForm'
    },
    ui: {
      'addEmail': '.js_addEmail'
    },
    initialize: function(){
        this.emailCollection = new emailAccounts.Collection();
        this.userAcount = new userProfile.Model();
    },
    events: {
        'click @ui.addEmail': 'addEmail'
    },
    onBeforeShow: function(){
        var account = new emailList({
            collection: this.emailCollection
        });
        this.emailCollection.fetch();
        this.getRegion('accounts').show(account);

        var userAccountForm = new userAccount({
            model: this.userAcount
        });
        this.userAcount.fetch();
        this.getRegion('accountForm').show(userAccountForm);

    },

    addEmail: function(e){
        e.preventDefault();

        var that = this,
            email = this.$('input[name="new_email"]').val(),
            emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if(email && emailRegex.test(email)){

            var emailModel = new emailAccounts.Model({
                email: email,
                '@type': 'EmailAccount'
            });

            emailModel.save(null, {
                success:function(){
                    that.render();
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
                error: function(model, resp){
                    resp.handled = true;
                    var message = Ctx.getErrorMessageFromAjaxError(resp);
                    if (message === null) {
                        message = i18n.gettext('Your settings fail to update');
                    }
                    $.bootstrapGrowl(message, {
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

    }

});

module.exports = account;