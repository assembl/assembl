'use strict';

var Marionette = require('../shims/marionette.js'),
    Promise = require('bluebird'),
    $ = require('jquery'),
    _ = require('underscore'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    GroupSpec = require('../models/groupSpec.js'),
    CollectionManager = require('../common/collectionManager.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    viewsFactory = require('../objects/viewsFactory.js'),
    RolesModel = require('../models/roles.js'),
    Permissions = require('../utils/permissions.js'),
    i18n = require('../utils/i18n.js'),
    Roles = require('../utils/roles.js'),
    Widget = require('../models/widget.js'),
    DefineGroupModal = require('./groups/defineGroupModal.js'),
    WidgetLinks = require('./widgetLinks.js'),
    Analytics = require('../internal_modules/analytics/dispatcher.js'),
    AgentViews = require('./agent.js');

var navBarLeft = Marionette.LayoutView.extend({
  constructor: function navBarLeft() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-navBarLeft',
  className: 'navbar-left',
  initialize: function(options) {
    this.isAdminDiscussion = Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION);
  },
  regions: {
    widgetMenuConfig: ".navbar-widget-configuration-links",
    widgetMenuCreation: ".navbar-widget-creation-links"
  },
  onRender: function() {
    var that = this;
    this.listenTo(Assembl.vent, 'socket:open', function() {
      that.$('#onlinedot').addClass('is-online');
    });
    this.listenTo(Assembl.vent, 'socket:close', function() {
      that.$('#onlinedot').removeClass('is-online');
    });

    // show a dropdown to admins, for widgets management
    // TODO: add to the dropdown the "discussion permissions" and "discussion parameters" options => so this IdeaWidgets view would only add <li>s to a dropdown which will be built elsewhere
    if (this.isAdminDiscussion) {
      // find root idea
      var collectionManager = new CollectionManager();
      Promise.join(collectionManager.getAllIdeasCollectionPromise(),
          collectionManager.getAllWidgetsPromise(),
        function(allIdeasCollection, widgets) {
        if(!that.isViewDestroyed()) {
          var rootIdea = allIdeasCollection.getRootIdea();
          if (rootIdea) {
            var confWidgets = new Widget.WidgetSubset([], {
              parent: widgets,
              context: Widget.Model.prototype.DISCUSSION_MENU_CONFIGURE_CTX,
              idea: rootIdea});
            if (confWidgets.length) {
              var configuration = new WidgetLinks.WidgetLinkListView({collection: confWidgets});
              that.widgetMenuConfig.show(configuration);
            }
            var creation = new WidgetLinks.WidgetLinkListView({
              collection: Widget.globalWidgetClassCollection,
              context: Widget.Model.prototype.DISCUSSION_MENU_CREATE_CTX,
              idea: rootIdea
            });
            that.widgetMenuCreation.show(creation);
          } else {
            console.log("rootIdea problem: ", rootIdea);
            this.$el.find(".discussion-title-dropdown").addClass("hidden");
          }
        }
      });
    } else {
      this.$el.find(".discussion-title-dropdown").addClass("hidden");
    }
  },
  serializeData: function() {
    return {
      isAdminDiscussion: this.isAdminDiscussion
    };
  }
});

var navBarRight = Marionette.LayoutView.extend({
  constructor: function navBarRight() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-loader',
  className: 'navbar-right',
  initialize: function(options) {
    var that = this,
        collectionManager = new CollectionManager(),
        realTemplate = '#tmpl-navBarRight';

    if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {
      collectionManager.getLocalRoleCollectionPromise()
      .then(function(localRoles) {
        that.localRoles = localRoles;
        that.isUserSubscribedToDiscussion = localRoles.isUserSubscribedToDiscussion();
        that.template = realTemplate;

        that.render();
        that.onBeforeShow();

        if (localRoles) {
          that.listenTo(localRoles, 'remove add', function(model) {
            that.isUserSubscribedToDiscussion = localRoles.isUserSubscribedToDiscussion();
            that.render();
          });
        }
      });
    }
    else {
      this.isUserSubscribedToDiscussion = false;
      this.template = realTemplate;
    }

  },
  ui: {
    currentLocal: '.js_setLocale',
    joinDiscussion: '.js_joinDiscussion',
    needJoinDiscussion: '.js_needJoinDiscussion',

  },
  events: {
    'click @ui.currentLocal': 'setLocale',
    'click @ui.joinDiscussion': 'joinPopin',
    'click @ui.needJoinDiscussion': 'needJoinDiscussion'
  },

  regions: {
    userAvatarRegion: '.user-avatar-container'
  },

  onBeforeShow: function() {
    if(this.template === '#tmpl-loader') {
      return {};
    }

    var userAvatarView = new AgentViews.AgentAvatarView({
      model: Ctx.getCurrentUser(),
      avatarSize: 25
    });
    if (!Ctx.getCurrentUser().isUnknownUser()) {
        this.userAvatarRegion.show(userAvatarView);
    }
  },

  serializeData: function() {
    if(this.template === '#tmpl-loader') {
      return {};
    }
    var retval = {}
    return {
      Ctx: Ctx,
      isUserSubscribedToDiscussion: this.isUserSubscribedToDiscussion,
      canSubscribeToDiscussion: Ctx.getCurrentUser().can(Permissions.SELF_REGISTER),
      isAdminDiscussion: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)
    }
  },
  templateHelpers: function() {
    return {
      urlNotifications: function() {
        return '/' + Ctx.getDiscussionSlug() + '/user/notifications';
      },
      urlLogOut: function() {
        return '/' + Ctx.getDiscussionSlug() + '/logout';
      },
      userProfile: function() {
        return '/' + Ctx.getDiscussionSlug() + '/user/profile';
      },
      discussionSettings: function() {
        return '/' + Ctx.getDiscussionSlug() + '/edition';
      },
      discussionPermissions: function() {
        return '/admin/permissions/discussion/' + Ctx.getDiscussionId();
      }
    }
  },
  setLocale: function(e) {
    var lang = $(e.target).attr('data-locale');
    Ctx.setLocale(lang);
  },
  needJoinDiscussion: function() {
    if (!this._store.getItem('needJoinDiscussion')) {
      this._store.setItem('needJoinDiscussion', true);
    }
    var analytics = Analytics.getInstance();
    analytics.trackEvent(analytics.events.JOIN_DISCUSSION_CLICK);
  },

  joinPopin: function() {
    var analytics = Analytics.getInstance();
    Assembl.vent.trigger('navBar:joinDiscussion');
    analytics.trackEvent(analytics.events.JOIN_DISCUSSION_CLICK);
  }
});

var navBar = Marionette.LayoutView.extend({
  constructor: function navBar() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-navBar',
  tagName: 'nav',
  className: 'navbar navbar-default',
  initialize: function() {
    this._store = window.localStorage;
    this.showPopInDiscussion();
    this.showPopInOnFirstLoginAfterAutoSubscribeToNotifications();
    this.listenTo(Assembl.vent, 'navBar:subscribeOnFirstPost', this.showPopInOnFirstPost);
    this.listenTo(Assembl.vent, 'navBar:joinDiscussion', this.joinDiscussion)
  },
  ui: {
    groups: '.js_addGroup',
    expertInterface: '.js_switchToExpertInterface',
    simpleInterface: '.js_switchToSimpleInterface'
  },
  events: {
    'click @ui.groups': 'addGroup',
    'click @ui.expertInterface': 'switchToExpertInterface',
    'click @ui.simpleInterface': 'switchToSimpleInterface'
  },
  regions: {
      'navBarLeft':'#navBarLeft',
      'navBarRight':'#navBarRight'
    },

  serializeData: function() {
    return {
      Ctx: Ctx
    }
  },

  onBeforeShow: function() {
    var navRight = new navBarRight();
    this.getRegion('navBarRight').show(navRight);
    this.getRegion('navBarLeft').show(new navBarLeft());
  },

  switchToExpertInterface: function(e) {
    Ctx.setInterfaceType(Ctx.InterfaceTypes.EXPERT);
  },

  switchToSimpleInterface: function(e) {
    Ctx.setInterfaceType(Ctx.InterfaceTypes.SIMPLE);
  },

  addGroup: function() {
    var collectionManager = new CollectionManager(),
        groupSpecsP = collectionManager.getGroupSpecsCollectionPromise(viewsFactory);

    Assembl.slider.show(new DefineGroupModal({groupSpecsP: groupSpecsP}));
  },

  // @param popinType: null, 'first_post', 'first_login_after_auto_subscribe_to_notifications'
  joinDiscussion: function(evt, popinType) {
    var self = this,
        collectionManager = new CollectionManager();

    var model = new Backbone.Model({
      notificationsToShow: null
    });

    var modalClassName = 'generic-modal popin-wrapper modal-joinDiscussion';
    var modalTemplate = _.template($('#tmpl-joinDiscussion').html());

    if (popinType == 'first_post') {
      modalClassName = 'generic-modal popin-wrapper modal-firstPost';
      modalTemplate = _.template($('#tmpl-firstPost').html());
    }
    else if (popinType == 'first_login_after_auto_subscribe_to_notifications') {
      modalClassName = 'generic-modal popin-wrapper modal-firstPost';
      modalTemplate = _.template($('#tmpl-firstLoginAfterAutoSubscribeToNotifications').html());
    }

    collectionManager.getNotificationsDiscussionCollectionPromise()
            .then(function(discussionNotifications) {
              model.notificationsToShow = _.filter(discussionNotifications.models, function(m) {
                // keep only the list of notifications which become active when a user follows a discussion
                return (m.get('creation_origin') === 'DISCUSSION_DEFAULT') && (m.get('status') === 'ACTIVE');
              });

              // we show the popin only if there are default notifications
              // Actually we want the modal either way; commenting the condition for now. MAP
              //if ( model.notificationsToShow && model.notificationsToShow.length ){

              var Modal = Backbone.Modal.extend({
  constructor: function Modal() {
    Backbone.Modal.apply(this, arguments);
  },

                template: modalTemplate,
                className: modalClassName,
                cancelEl: '.close, .js_close',
                submitEl: '.js_subscribe',

                model: model,
                initialize: function() {
                  var that = this;
                  this.$('.bbm-modal').addClass('popin');
                  var analytics = Analytics.getInstance(),
                      previousPage = analytics.getCurrentPage();

                  this.returningPage = previousPage;
                  analytics.changeCurrentPage(analytics.pages.NOTIFICATION);
                },
                // events: {
                //   'click .js_subscribe': 'subscription',
                //   'click .js_close': 'closeModal'
                // },
                serializeData: function() {
                  return {
                    i18n: i18n,
                    notificationsToShow: model.notificationsToShow,
                    urlNotifications: '/' + Ctx.getDiscussionSlug() + '/user/notifications'
                  }
                },
                submit: function(ev) {
                  var that = this;

                  if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {

                    var LocalRolesUser = new RolesModel.Model({
                      role: Roles.PARTICIPANT,
                      discussion: 'local:Discussion/' + Ctx.getDiscussionId()
                    });
                    LocalRolesUser.save(null, {
                      success: function(model, resp) {
                        var analytics = Analytics.getInstance();
                        analytics.trackEvent(analytics.events.JOIN_DISCUSSION);

                        // TODO: Is there a simpler way to do this? MAP
                        self.navBarRight.currentView.ui.joinDiscussion.css('visibility', 'hidden');
                        self._store.removeItem('needJoinDiscussion');

                        // reload user data and its permissions (so for example now when he clicks on the "reply" button of a message, it should not show "Before you can reply to this message..." anymore)
                        try { // we try to be a good Single Page Application and update user data without reloading the whole page
                          Ctx.updateCurrentUser();
                        } catch (e) { // but if it does not work, we reload the page
                          console.log("Error while reloading user data: " + e.message);
                          location.reload();
                        }
                      },
                      error: function(model, resp) {
                        console.error('ERROR: joinDiscussion->subscription', resp);
                      }
                    })
                  }
                },

                cancel: function() {
                  self._store.removeItem('needJoinDiscussion');
                  var analytics = Analytics.getInstance();
                  analytics.trackEvent(analytics.events.JOIN_DISCUSSION_REFUSED);
                  analytics.changeCurrentPage(this.returningPage, {default: true}); //if page is null, go back to / page
                }
              });
              Assembl.slider.show(new Modal());

              //}
            }

        );

  },

  showPopInOnFirstPost: function() {
    this.joinDiscussion(null, 'firstPost');
  },

  showPopInOnFirstLoginAfterAutoSubscribeToNotifications: function() {
    if (typeof first_login_after_auto_subscribe_to_notifications != 'undefined'
        && first_login_after_auto_subscribe_to_notifications == true)
    {
      this.joinDiscussion(null, 'first_login_after_auto_subscribe_to_notifications');
    }
  },

  showPopInDiscussion: function() {
    var needPopIn = this._store.getItem('needJoinDiscussion');
    if (needPopIn && Ctx.getCurrentUserId() && this.roles.get('role') === null) {
      this.joinDiscussion();
    } else {
      this._store.removeItem('needJoinDiscussion');
    }
  }

});

module.exports = navBar;
