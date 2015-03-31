'use strict';

define(['backbone.marionette', 'app', 'common/context', 'models/agents', 'objects/storage', 'views/navBar', 'views/groups/groupContainer', 'common/collectionManager', 'objects/viewsFactory', 'views/admin/adminDiscussion', 'views/admin/adminNotificationSubscriptions', 'views/admin/adminPartners', 'views/user/userNotificationSubscriptions', 'views/user/profile', 'views/authorization', 'utils/permissions', 'views/user/account', 'views/admin/adminDiscussionSettings', 'utils/i18n'],
    function (Marionette, Assembl, Ctx, Agents, storage, navBar, GroupContainer, CollectionManager, viewsFactory, adminDiscussion, adminNotificationSubscriptions, adminPartners, userNotificationSubscriptions, userProfile, Authorization, Permissions, userAccount, adminSettings, i18n) {

        var routeManager = Marionette.Object.extend({

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
                Backbone.history.navigate('', true);
            },

            home: function () {
                Ctx.isNewUser();
                this.restoreViews();
            },

            edition: function () {
                Assembl.headerRegions.show(new navBar());
                if (this.userHaveAccess()) {
                    var edition = new adminDiscussion();
                    Assembl.groupContainer.show(edition);
                }
            },

            partners: function () {
                Assembl.headerRegions.show(new navBar());
                if (this.userHaveAccess()) {
                    var partners = new adminPartners();
                    Assembl.groupContainer.show(partners);
                }
            },

            notifications: function () {
                Assembl.headerRegions.show(new navBar());
                if (this.userHaveAccess()) {
                    var notifications = new adminNotificationSubscriptions();
                    Assembl.groupContainer.show(notifications);
                }
            },

            settings: function(){
                Assembl.headerRegions.show(new navBar());
                if (this.userHaveAccess()) {
                    var adminSetting = new adminSettings();
                    Assembl.groupContainer.show(adminSetting);
                }
            },

            userNotifications: function () {
                Assembl.headerRegions.show(new navBar());
                if (this.userHaveAccess()) {
                    var user = new userNotificationSubscriptions();
                    Assembl.groupContainer.show(user);
                }
            },

            profile: function () {
                Assembl.headerRegions.show(new navBar());
                if (this.userHaveAccess()) {
                    var profile = new userProfile();
                    Assembl.groupContainer.show(profile);
                }
            },

            account: function(){
                Assembl.headerRegions.show(new navBar());
                if (this.userHaveAccess()) {
                    var account = new userAccount();
                    Assembl.groupContainer.show(account);
                }
            },

            post: function (id) {
                //TODO: add new behavior to show messageList Panel
                this.restoreViews();

                // test if this issue fixed
                Assembl.vent.trigger("navigation:selected", 'debate');
                Assembl.vent.trigger('messageList:showMessageById', id);

                /*setTimeout(function () {
                    //TODO: fix this horrible hack
                    //We really need to address panels explicitely
                    Assembl.vent.trigger("navigation:selected", 'debate');
                    Assembl.vent.trigger('messageList:showMessageById', id);
                }, 0);*/
                //TODO: fix this horrible hack that prevents calling
                //showMessageById over and over.
                //window.history.pushState('object or string', 'Title', '../');
                console.log("DEFAULT ");
                Backbone.history.navigate('/', {replace: true});
            },

            idea: function (id) {
                //TODO: add new behavior to show messageList Panel
                this.restoreViews();

                setTimeout(function () {
                    //TODO: fix this horrible hack
                    //We really need to address panels explicitely
                    Assembl.vent.trigger("navigation:selected", 'debate');
                    Assembl.vent.trigger('ideaList:selectIdea', id);
                }, 0);
                //TODO: fix this horrible hack that prevents calling
                //showMessageById over and over.
                //window.history.pushState('object or string', 'Title', '../');
                Backbone.history.navigate('/', {replace: true});
            },

            loadCurrentUser: function () {
                if (Ctx.getCurrentUserId()) {
                    this.user = new Agents.Model();
                    this.user.fetchFromScriptTag('current-user-json');
                }
                else {
                    this.user = new Agents.Collection().getUnknownUser();
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

            userHaveAccess: function () {
                /**
                 * TODO: backend api know private discussion and can redirect to login
                 * add this method to home page route
                 * */
                var route = Backbone.history.fragment,
                    access = false;

                if (!Ctx.getCurrentUserId()) {
                    var authorization = new Authorization({
                        error: 401,
                        message: i18n.gettext('You must be logged in to access this page.')
                    });
                    Assembl.groupContainer.show(authorization);
                    return;
                }

                switch(route){
                    case 'edition':
                    case 'settings':
                    case 'notifications':
                    case 'partners':
                        access = (!Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) ? false : true;
                        break;

                    default:
                        access = (!Ctx.getCurrentUser().can(Permissions.READ)) ? false : true;
                        break;
                }

                if(!access){
                    var authorization = new Authorization({
                        error: 401,
                        message: i18n.gettext('Your level of permissions do not allow you to see the rest of this content')
                    });
                    Assembl.groupContainer.show(authorization);
                }

                return access;
            }

        });


        return new routeManager();
    });