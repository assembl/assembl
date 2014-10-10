define(function (require) {
    'use strict';

    var Marionette = require('marionette'),
        Assembl = require('modules/assembl'),
        Ctx = require('modules/context'),
        collectionManager = require('modules/collectionManager'),
        User = require('models/user'),
        storage = require('objects/storage'),
        navBar = require('views/navBar'),
    //contextPage = require('views/contextPage'),
        GroupContainer = require('views/groups/groupContainer'),
        CollectionManager = require('modules/collectionManager'),
        viewsFactory = require('objects/viewsFactory'),
        Notification = require('views/notification'),
        adminView = require('views/admin/adminDiscussion');

    var routeManager = Marionette.Controller.extend({

        initialize: function () {
            window.assembl = {};

            var collectionManager = new CollectionManager(),
                that = this;

            this.user = null;

            /**
             * fulfill app.currentUser
             */
            this.loadCurrentUser();
        },

        /**
         * Load the default view
         * */
        home: function () { // a.k.a. "index", "discussion root"

            this.isNewProfile();

            this.restoreViews();
        },

        idea: function (id) {
            collectionManager.getAllIdeasCollectionPromise().done(
                function (allIdeasCollection) {
                    var idea = allIdeasCollection.get(id);
                    if (idea) {
                        Ctx.setCurrentIdea(idea);
                    }
                });
        },

        ideaSlug: function (slug, id) {
            return this.idea(slug + '/' + id);
        },

        message: function (id) {
            //TODO: add new behavior to show messageList Panel
            //Ctx.openPanel(assembl.messageList);
            Assembl.vent.trigger('messageList:showMessageById', id);
        },

        messageSlug: function (slug, id) {
            return this.message(slug + '/' + id);
        },

        adminDiscussion: function () {
            var admin = new adminView();
            Assembl.adminContainer.show(admin);
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
            var groupSpecsP = collectionManager().getGroupSpecsCollectionPromise(viewsFactory);

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
                        return aGroupSpec.getNavigationPanelSpec();
                    });
                    if (navigableGroupSpec) {
                        window.setTimeout(function () {
                            var groupContent = group.children.findByModel(navigableGroupSpec);
                            groupContent.resetContextState();
                        });
                    }
                }
                group.resizeAllPanels();
                Assembl.groupContainer.show(group);
            });
        },

        isNewProfile: function () {

            var currentUser = window.localStorage.getItem('lastCurrentUser');

            if (currentUser) {
                if (this.user.get('@id') != currentUser) {
                    window.localStorage.removeItem('expertInterfacegroupItems');
                    window.localStorage.removeItem('simpleInterfacegroupItems');
                }
            } else {
                window.localStorage.setItem('lastCurrentUser', this.user.get('@id'));
            }
        }

    });

    return new routeManager();

});