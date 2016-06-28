'use strict';
/**
 * The application router.
 * @module app.router
 */

var Marionette = require('./shims/marionette.js'),
    routeManager = require('./routeManager.js'),
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
  appRoutes: {
    "": "home",
    "edition": "edition",
    "partners": "partners",
    "notifications": "notifications",
    "settings": "settings",
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
    "profile/*id": "user",
    "G/*path": "groupSpec",
    "*actions": "defaults"
  }

});

// Monkey patch ensures that shared knowledge is in a single file
// TODO: improve.
message.Model.prototype.routerBaseUrl = "posts/";
idea.Model.prototype.routerBaseUrl = "idea/";
agent.Model.prototype.routerBaseUrl = "profile/";

module.exports = Router;
