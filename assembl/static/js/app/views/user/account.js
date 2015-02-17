'use strict';

define(['backbone.marionette', 'models/emailAccounts', 'common/context', 'models/userProfile','jquery', 'utils/i18n'],
    function (Marionette, emailAccounts, Ctx, userProfile, $, i18n) {

    var email = Marionette.ItemView.extend({
        template:'#tmpl-associateAccount',
        className:'associate-email mbs',
        serializeData: function(){
            return {
              email: this.model
            }
        }
    });

    var emailList = Marionette.CompositeView.extend({
        template: '#tmpl-associateAccounts',
        childView: email,
        childViewContainer:'.controls'
    });

    var account = Marionette.LayoutView.extend({
        template: '#tmpl-userAccount',
        className: 'admin-account',
        regions: {
          'accounts':'#associate_account'
        },
        ui: {
          'account': '.js_saveAccount',
          'addEmail': '.js_addEmail'
        },
        initialize: function(){
            this.emailCollection = new emailAccounts.Collection();
            this.emailCollection.fetch();

            this.model = new userProfile.Model();
            this.model.fetch();
        },
        events: {
            'click @ui.account': 'saveAccount',
            'click @ui.addEmail': 'addEmail'
        },
        modelEvents: {
          'sync': 'render'
        },
        onBeforeShow: function(){
            var account = new emailList({
                collection: this.emailCollection
            });
            this.getRegion('accounts').show(account);
        },
        serializeData: function(){

            console.debug(this.model);

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

        },

        addEmail: function(e){
            e.preventDefault();



        }

    });

    return account;
});