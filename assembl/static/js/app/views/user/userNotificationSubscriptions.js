'use strict';

var Marionette = require('../../shims/marionette.js'),
    Assembl = require('../../app.js'),
    $ = require('../../shims/jquery.js'),
    _ = require('../../shims/underscore.js'),
    Promise = require('bluebird'),
    CollectionManager = require('../../common/collectionManager.js'),
    Ctx = require('../../common/context.js'),
    NotificationSubscription = require('../../models/notificationSubscription.js'),
    RolesModel = require('../../models/roles.js'),
    i18n = require('../../utils/i18n.js'),
    Roles = require('../../utils/roles.js'),
    emailAccounts = require('../../models/emailAccounts.js');

/**
 * User notification
 * */
var Notification = Marionette.ItemView.extend({
    template:'#tmpl-userSubscriptions',
    tagName:'label',
    className:'checkbox dispb',
    initialize: function(options){
      this.role = options.role;
      this.roles = options.roles;

      this.listenTo(this.roles, 'remove add', function(model){
        this.role = (_.size(this.roles)) ? model : undefined;
        this.render();
      });

      if(this.model === 'undefined'){
        this.template = "#tmpl-loader";
      }

    },
    ui: {
      currentSubscribeCheckbox: ".js_userNotification"
    },
    events: {
      'click @ui.currentSubscribeCheckbox': 'userNotification'
    },
    serializeData: function () {
        return {
            subscription: this.model,
            role: this.role,
            i18n: i18n
        }
    },
    userNotification: function (e) {
        var elm = $(e.target);
        var status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

        this.model.set("status", status);
        this.model.set("creation_origin", "USER_REQUESTED");
        this.model.save(null, {
            success: function (model, resp) {
            },
            error: function (model, resp) {
                console.error('ERROR: userNotification', resp)
            }
        });
    }
});

var Notifications = Marionette.CollectionView.extend({
    childView: Notification,
    initialize: function(options){
       this.collection = options.notificationsUser;
       this.childViewOptions = {
         role: options.role,
         roles: options.roles
       }
    },
    collectionEvents: {
      'reset': 'render'
    }
});

/**
 * Notification template
 * */
var TemplateSubscription = Marionette.ItemView.extend({
    template: '#tmpl-templateSubscription',
    tagName:'label',
    className:'checkbox dispb',
    initialize: function(options){
      this.role = options.role;
      this.roles = options.roles;
      this.notificationsUser = options.notificationsUser;
      this.notificationTemplates = options.notificationTemplates;

      this.listenTo(this.roles, 'remove add', function(model){
        this.role = (_.size(this.roles)) ? model : undefined;
        this.render();
      });

    },
    ui: {
      newSubscribeCheckbox: ".js_userNewNotification"
    },
    events: {
      'click @ui.newSubscribeCheckbox': 'userNewSubscription'
    },
    serializeData: function () {
      return {
        subscription: this.model,
        role: this.role,
        i18n: i18n
      }
    },
    userNewSubscription: function (e) {
        var elm = $(e.target),
            that = this,
            status = elm.is(':checked') ? 'ACTIVE' : 'UNSUBSCRIBED';

        var notificationSubscriptionTemplateModel = this.notificationTemplates.get(elm.attr('id'));

        var notificationSubscriptionModel = new NotificationSubscription.Model({
                creation_origin: "USER_REQUESTED",
                status: status,
                '@type': notificationSubscriptionTemplateModel.get('@type'),
                discussion: notificationSubscriptionTemplateModel.get('discussion'),
                human_readable_description: notificationSubscriptionTemplateModel.get('human_readable_description')
            });

        this.notificationsUser.add(notificationSubscriptionModel);

        notificationSubscriptionModel.save(null, {
            success: function(model, response, options) {
                that.notificationTemplates.remove(notificationSubscriptionTemplateModel);
            },
            error: function (model, resp) {
                that.notificationsUser.remove(notificationSubscriptionModel);
                console.error('ERROR: userNewSubscription', resp)
            }
        })
    }

});

var TemplateSubscriptions = Marionette.CollectionView.extend({
    childView: TemplateSubscription,
    initialize: function(options){
        var addableGlobalSubscriptions = new Backbone.Collection();

        options.notificationTemplates.each(function (template) {
            var alreadyPresent = options.notificationsUser.find(function (subscription) {
                if (subscription.get('@type') === template.get('@type')) {
                    return true;
                }
                else {
                    return false
                }
            });
            if (alreadyPresent === undefined) {
                addableGlobalSubscriptions.add(template)
            }
        });

        this.collection = addableGlobalSubscriptions;

        this.childViewOptions = {
            role: options.role,
            roles: options.roles,
            notificationsUser: options.notificationsUser,
            notificationTemplates: addableGlobalSubscriptions
        }

    },
    collectionEvents: {
      'reset': 'render'
    }
});

/**
 *  Choose an email to notify user
 * */
var NotificationByEmail = Marionette.ItemView.extend({
    template: '#tmpl-notificationByEmail',
    tagName: 'label',
    className: 'radio',
    ui: {
      preferredEmail: '.js_preferred'
    },
    events: {
      'click @ui.preferredEmail': 'preferredEmail'
    },
    serializeData: function(){
        return {
            account: this.model
        }
    },
    preferredEmail: function(){

        var preferred = (this.$('input[name="email_account"]:checked').val()) ? true : false;

        this.model.set({preferred: preferred});

        this.model.save(null, {
            success: function(){

                console.debug('success');
            },
            error: function(){
                console.debug('error');
            }
        })

    }

});

var NotificationByEmails = Marionette.CompositeView.extend({
    template: '#tmpl-notificationByEmails',
    childView: NotificationByEmail,
    childViewContainer:'.controls'
})


/**
 * Subscripbe / Unsubscribe action
 * */
var Subscriber = Marionette.ItemView.extend({
    template:'#tmpl-userSubscriber',
    ui: {
        unSubscription: ".js_unSubscription",
        subscription: ".js_subscription",
        btnSubscription:'.btnSubscription',
        btnUnsubscription:'.btnUnsubscription'
    },
    events: {
        'click @ui.unSubscription': 'unSubscription',
        'click @ui.subscription': 'subscription'
    },
    initialize: function(options){
        this.roles = options.roles;
        this.role = options.role;

        this.listenTo(this.roles, 'remove add', function(model){
            this.role = (_.size(this.roles)) ? model : undefined;
            this.render();
        });
    },
    serializeData: function(){
        return {
            role: this.role
        }
    },

    unSubscription: function () {
        var that = this;

        if (this.role) {
            this.role.destroy({
                success: function (model, resp) {
                    that.roles.remove(model);
                },
                error: function (model, resp) {
                    console.error('ERROR: unSubscription failed', resp);
                }});
        }
    },

    subscription: function(){
        var that = this;

        if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {

            var LocalRolesUser = new RolesModel.Model({
                role: Roles.PARTICIPANT,
                discussion: 'local:Discussion/' + Ctx.getDiscussionId(),
                user_id: Ctx.getCurrentUserId()
            });

            LocalRolesUser.save(null, {
                success: function (model, resp) {
                    that.roles.add(model);
                },
                error: function (model, resp) {
                    console.error('ERROR: joinDiscussion->subscription', resp);
                }});
        }
    }

});

var userNotificationSubscriptions = Marionette.LayoutView.extend({
    template: '#tmpl-userNotificationSubscriptions',
    className: 'admin-notifications',
    regions: {
      userNotifications:'#userNotifications',
      templateSubscription: '#templateSubscriptions',
      userSubscriber: '#subscriber',
      notifByEmail: '#notifByEmail'
    },
    onBeforeShow: function () {
        var that = this,
            collectionManager = new CollectionManager();

        Promise.join(collectionManager.getNotificationsUserCollectionPromise(),
               collectionManager.getNotificationsDiscussionCollectionPromise(),
               collectionManager.getLocalRoleCollectionPromise(),
            function (NotificationsUser, notificationTemplates, allRoles) {

                var role =  allRoles.find(function (local_role) {
                        return local_role.get('role') === Roles.PARTICIPANT;
                    });
                var subscriber = new Subscriber({
                    role: role,
                    roles: allRoles
                });
                that.getRegion('userSubscriber').show(subscriber);

                var templateSubscriptions = new TemplateSubscriptions({
                    notificationTemplates: notificationTemplates,
                    notificationsUser: NotificationsUser,
                    role: role,
                    roles: allRoles
                });
                that.getRegion('templateSubscription').show(templateSubscriptions);

                var userNotification = new Notifications({
                    notificationsUser: NotificationsUser,
                    role: role,
                    roles: allRoles
                });
                that.getRegion('userNotifications').show(userNotification);

            });

       var emailAccount = new emailAccounts.Collection();
       var notificationByEmails = new NotificationByEmails({
           collection: emailAccount
       });
       emailAccount.fetch();

       this.notifByEmail.show(notificationByEmails);
    },

    serializeData: function () {
        return {
            i18n: i18n
        }
    }

});

module.exports = userNotificationSubscriptions;