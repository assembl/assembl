'use strict';

var Marionette = require('./shims/marionette.js'),
    Assembl = require('./app.js'),
    Ctx = require('./common/context.js'),
    Agents = require('./models/agents.js'),
    Storage = require('./objects/storage.js'),
    Loader = require('./views/loader.js'),
    NavBar = require('./views/navBar.js'),
    UrlParser = require('./url/url.js'),
    GroupContainer = require('./views/groups/groupContainer.js'),
    PanelSpecTypes = require('./utils/panelSpecTypes.js'),
    CollectionManager = require('./common/collectionManager.js'),
    ViewsFactory = require('./objects/viewsFactory.js'),
    AdminDiscussion = require('./views/admin/adminDiscussion.js'),
    AdminNotificationSubscriptions = require('./views/admin/adminNotificationSubscriptions.js'),
    AdminPartners = require('./views/admin/adminPartners.js'),
    UserNotificationSubscriptions = require('./views/user/userNotificationSubscriptions.js'),
    Profile = require('./views/user/profile.js'),
    Authorization = require('./views/authorization.js'),
    Permissions = require('./utils/permissions.js'),
    Account = require('./views/user/account.js'),
    AdminDiscussionSettings = require('./views/admin/adminDiscussionSettings.js'),
    FirstIdeaToShowVisitor = require('./views/visitors/firstIdeaToShowVisitor.js'),
    i18n = require('./utils/i18n.js');

var routeManager = Marionette.Object.extend({

    initialize: function () {
        window.assembl = {};

        this.collectionManager = new CollectionManager();

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
        this.restoreViews(true);
    },

    edition: function () {
        Assembl.headerRegions.show(new NavBar());
        if (this.userHaveAccess()) {
            var edition = new AdminDiscussion();
            Assembl.groupContainer.show(edition);
        }
    },

    partners: function () {
        Assembl.headerRegions.show(new NavBar());
        if (this.userHaveAccess()) {
            var partners = new AdminPartners();
            Assembl.groupContainer.show(partners);
        }
    },

    notifications: function () {
        Assembl.headerRegions.show(new NavBar());
        if (this.userHaveAccess()) {
            var notifications = new AdminNotificationSubscriptions();
            Assembl.groupContainer.show(notifications);
        }
    },

    settings: function(){
        Assembl.headerRegions.show(new NavBar());
        if (this.userHaveAccess()) {
            var adminSetting = new AdminDiscussionSettings();
            Assembl.groupContainer.show(adminSetting);
        }
    },

    userNotifications: function () {
        Assembl.headerRegions.show(new NavBar());
        if (this.userHaveAccess()) {
            var user = new UserNotificationSubscriptions();
            Assembl.groupContainer.show(user);
        }
    },

    profile: function () {
        Assembl.headerRegions.show(new NavBar());
        if (this.userHaveAccess()) {
            var profile = new Profile();
            Assembl.groupContainer.show(profile);
        }
    },

    account: function(){
        Assembl.headerRegions.show(new NavBar());
        if (this.userHaveAccess()) {
            var account = new Account();
            Assembl.groupContainer.show(account);
        }
    },

    post: function (id) {
        //TODO: add new behavior to show messageList Panel
      this.restoreViews().then(function(groups) {
        var firstGroup = groups.children.first();
        var messageList = firstGroup.findViewByType(PanelSpecTypes.MESSAGE_LIST);
        if(!messageList) {
          if(firstGroup.isSimpleInterface()) {
            Assembl.vent.trigger("navigation:selected", 'debate', { show_help: false });
          }
          else {
            throw new Error("WRITEME:  There was no group with a messagelist available");
          }
        }
        firstGroup.setCurrentIdea(null);
        Assembl.vent.trigger('messageList:showMessageById', id);

        //Backbone.history.navigate('/', {replace: true});
      });
    },

    idea: function (id) {
        //TODO: add new behavior to show messageList Panel
        this.restoreViews();

        setTimeout(function () {
            //TODO: fix this horrible hack
            //We really need to address panels explicitely
            Assembl.vent.trigger("navigation:selected", 'debate');
            Assembl.vent.trigger('DEPRECATEDideaList:selectIdea', id, "from_url", true);
        }, 0);
        //TODO: fix this horrible hack that prevents calling
        //showMessageById over and over.
        //window.history.pushState('object or string', 'Title', '../');
        Backbone.history.navigate('/', {replace: true});
    },
    
    sentryTest: function () {
      //This crashes on purpose
      crashme();
    },

    loadCurrentUser: function () {
        var user = null;
        if (Ctx.getCurrentUserId()) {
            user = new Agents.Model();
            user.fetchFromScriptTag('current-user-json');
        }
        else {
            user = new Agents.Collection().getUnknownUser();
        }
        user.fetchPermissionsFromScriptTag();
        Ctx.setCurrentUser(user);
        Ctx.loadCsrfToken(true);
    },

    groupSpec: function(path) {
        console.log(path);
        Ctx.isNewUser();
        try {
            var structure = UrlParser.parse("/"+path);
            console.log(structure);
            this.restoreViews(false, structure);
        } catch (err) {
            console.error(err);
            this.restoreViews(true);
        }
    },

    /**
     * @param from_home:  If true, the function was called from the home view
     * @return promise to a GroupContainer
     */
    restoreViews: function (from_home, url_structure) {
        Assembl.headerRegions.show(new NavBar());
        Assembl.groupContainer.show(new Loader());
        /**
         * Render the current group of views
         * */
        var groupSpecsP = this.collectionManager.getGroupSpecsCollectionPromise(ViewsFactory, url_structure);

        return groupSpecsP.then(function (groupSpecs) {
            var groupsView = new GroupContainer({
                collection: groupSpecs
            });
            if (!from_home) {
                activate_tour = false;
            }
            var lastSave = Storage.getDateOfLastViewSave(),
                currentUser = Ctx.getCurrentUser();
            if (lastSave && !lastSave.getDate()) {
                // case of Invalid Date
                lastSave = null;
            }

            groupsView.render(); //So children can be used

            if (from_home && !lastSave && (
                    currentUser.isUnknownUser() || currentUser.get('is_first_visit'))) {
                var collectionManager = CollectionManager();
                Promise.join(collectionManager.getAllIdeasCollectionPromise(),
                             collectionManager.getAllExtractsCollectionPromise(),
                             collectionManager.getAllIdeaLinksCollectionPromise(),
                             function(ideas, extracts, links) {
                    var visitor = new FirstIdeaToShowVisitor(extracts);
                    ideas.visitBreadthFirst(links, visitor, ideas.getRootIdea().getId());
                    var idea = visitor.ideaWithExtract || visitor.firstIdea;
                    if (idea !== undefined) {
                        // the table of ideas view did not start listening yet.
                        // TODO: Break magic timeout.
                        setTimeout(function () {
                            Assembl.vent.trigger('DEPRECATEDideaList:selectIdea', idea.id);
                        }, 250);
                    }
                });
            }
            else if (!lastSave
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
                        var groupContent = groupsView.children.findByModel(navigableGroupSpec);
                        groupContent.NavigationResetContextState();
                    });
                }
            }

            Assembl.groupContainer.show(groupsView);

            return groupsView;
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

module.exports = new routeManager();