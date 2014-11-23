define(function (require) {

    var Marionette = require('backbone.marionette'),
        Assembl = require('app'),
        Ctx = require('common/context'),
        User = require('models/user'),
        storage = require('objects/storage'),
        navBar = require('views/navBar'),
        GroupContainer = require('views/groups/groupContainer'),
        CollectionManager = require('common/collectionManager'),
        viewsFactory = require('objects/viewsFactory'),
        adminDiscussion = require('views/admin/adminDiscussion'),
        adminNotificationSubscriptions = require('views/admin/adminNotificationSubscriptions'),
        adminPartners = require('views/admin/adminPartners'),
        userNotificationSubscriptions = require('views/user/userNotificationSubscriptions'),
        userProfile = require('views/user/profile'),
        Authorization = require('views/authorization');

    var routeManager = Marionette.Controller.extend({

        initialize: function () {
            window.assembl = {};

            this.collectionManager = new CollectionManager();
            this.user = null;

            /**
             * fulfill app.currentUser
             */
            this.loadCurrentUser();
        },

        defaults: function () {
            Backbone.history.navigate('home', true);
        },

        home: function () {
            Ctx.isNewUser();
            this.restoreViews();
        },

        edition: function () {
            Assembl.headerRegions.show(new navBar());
            if (this.isAuthenticated()) {
                var edition = new adminDiscussion();
                Assembl.groupContainer.show(edition);
            }
        },

        partners: function () {
            Assembl.headerRegions.show(new navBar());
            if (this.isAuthenticated()) {
                var partners = new adminPartners();
                Assembl.groupContainer.show(partners);
            }
        },

        notifications: function () {
            Assembl.headerRegions.show(new navBar());
            if (this.isAuthenticated()) {
                var notifications = new adminNotificationSubscriptions();
                Assembl.groupContainer.show(notifications);
            }
        },

        userNotifications: function () {
            Assembl.headerRegions.show(new navBar());
            if (this.isAuthenticated()) {
                var user = new userNotificationSubscriptions();
                Assembl.groupContainer.show(user);
            }
        },

        profile: function () {
            Assembl.headerRegions.show(new navBar());
            if (this.isAuthenticated()) {
                var profile = new userProfile();
                Assembl.groupContainer.show(profile);
            }
        },
        
        post: function (id) {
          //TODO: add new behavior to show messageList Panel
          this.restoreViews();

          setTimeout(function () {
            //TODO: fix this horrible hack
            //We really need to address panels explicitely
            Assembl.vent.trigger("navigation:selected", 'debate');
            Assembl.vent.trigger('messageList:showMessageById', id);
          }, 1000);
          //TODO: fix this horrible hack that prevents calling 
          //showMessageById over and over.
          window.history.pushState('object or string', 'Title', '../');
        },

        loadCurrentUser: function () {
            if (Ctx.getCurrentUserId()) {
                this.user = new User.Model();
                this.user.fetchFromScriptTag('current-user-json');
            }
            else {
                this.user = new User.Collection().getUnknownUser();
            }
            this.user.fetchPermissionsFromScripTag();
            Ctx.setCurrentUser(this.user);
            Ctx.loadCsrfToken(true);
        },

        restoreViews: function () {
            Assembl.headerRegions.show(new navBar());
            /**
             * Render the current group of views
             * */
            var groupSpecsP = this.collectionManager.getGroupSpecsCollectionPromise(viewsFactory);

            groupSpecsP.done(function (groupSpecs) {
                var group = new GroupContainer({
                    collection: groupSpecs
                });
                var lastSave = storage.getDateOfLastViewSave();
                if (!lastSave
                    || (Date.now() - lastSave.getTime() > (7 * 24 * 60 * 60 * 1000))
                    ) {
                    /* Reset the context of the user view, if it's too old to be
                     usable, or if it wasn't initialized before */
                    // Find if a group exists that has a navigation panel
                    var navigableGroupSpec = groupSpecs.find(function (aGroupSpec) {
                        return aGroupSpec.findNavigationSidebarPanelSpec();
                    });
                    if (navigableGroupSpec) {
                        setTimeout(function () {
                            var groupContent = group.children.findByModel(navigableGroupSpec);
                            groupContent.resetContextState();
                        });
                    }
                }
                //console.log(group);
                group.resizeAllPanels();
                Assembl.groupContainer.show(group);
            });
        },

        isAuthenticated: function () {
            if (!Ctx.getCurrentUserId()) {
                var authorization = new Authorization();
                Assembl.groupContainer.show(authorization);
                return false;
            }
            else {
                return true;
            }
        }

    });


    return new routeManager();
});