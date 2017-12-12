'use strict';
/**
 * The application router.
 * @module app.router
 */

var Marionette = require('./shims/marionette.js'),
    routeManager = require('./routeManager.js'),
    Ctx = require('./common/context.js'),
    message = require('./models/message.js'),
    idea = require('./models/idea.js'),
    agent = require('./models/agents.js');

/**
 * The Router will forward existing URLs to various handlers according to those routes
 * Keep in sync with :py:class:`assembl.lib.frontend_urls.FrontendUrls`
 * @class app.router.Router
 * @extends Marionette.AppRouter
 */
var Router = Marionette.AppRouter.extend({
  controller: routeManager,

  //Note:  This should match with assembl/lib/frontend_url.py
  discussionRoutes: {
    "": "home",
    "edition": "edition",
    "partners": "partners",
    "notifications": "notifications",
    "settings": "settings",
    "timeline": "timeline",
    "about": "about",
    "discussion_preferences": "adminDiscussionPreferences",
    "sentrytest": "sentryTest",
    "user/notifications": "userNotifications",
    "user/profile": "profile",
    "user/account": "account",
    "user/discussion_preferences": "userDiscussionPreferences",
    "posts/*id": "post",
    "idea/*id": "idea",
    "widget/:id(/:result)": "widgetInModal",
    "vote": "voteWidgetFromV2",
    "vote/:id(/:result)": "voteWidgetFromV2",
    "profile/*id": "user",
    "G/*path": "groupSpec",
    "*actions": "defaults"
  },

  adminRoutes: {
    "global_preferences": "adminGlobalPreferences",
  },

  /* For debug purposes only! */
  onRoute: function(name, path, argument){
    // console.log(arguments);
  }

});

Router.prototype.appRoutes = (Ctx.isAdminApp())?
    Router.prototype.adminRoutes:Router.prototype.discussionRoutes;

// Monkey patch ensures that shared knowledge is in a single file
// TODO: improve.
message.Model.prototype.routerBaseUrl = "posts/";
idea.Model.prototype.routerBaseUrl = "idea/";
agent.Model.prototype.routerBaseUrl = "profile/";

module.exports = Router;
