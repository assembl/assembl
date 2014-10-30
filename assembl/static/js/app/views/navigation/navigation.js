define(function (require) {

    var Assembl = require('app'),
        Marionette = require('backbone.marionette'),
        IdeaList = require('views/ideaList'),
        sidebarNotification = require('views/navigation/notification'),
        HomePanel = require('views/navigation/home'),
        SynthesisInNavigationPanel = require('views/navigation/synthesisInNavigation'),
        AssemblPanel = require('views/assemblPanel'),
        ctx = require('common/context'),
        Permissions = require('utils/permissions'),
        $ = require('jquery');

    var NavigationView = AssemblPanel.extend({
        template: "#tmpl-navigation",
        panelType: "navSidebar",
        className: "navSidebar",
        hideHeader: true,
        gridSize: AssemblPanel.prototype.NAVIGATION_PANEL_GRID_SIZE,
        minWidth: 350,
        getTitle: function () {
            return 'Navigation'; // unused
        },
        regions: {
            home: '.home',
            debate: '.debate',
            synthesis: '.synthesis',
            notification: '.navNotification'
        },
        ui: {
            navigation: '.js_navigation',
            ideaFromIdealist: '.js_addIdeaFromIdeaList',
            level: 'div.second-level'
        },
        events: {
            'click @ui.navigation': 'toggleMenuByEvent',
            'click @ui.ideaFromIdealist': 'addIdeaFromIdeaList'
        },
        initialize: function (options) {
            var that = this;

            this.groupContent = options.groupContent;

            $(window).resize(function () {
                that.setSideBarHeight();
            });

            this._accordionContentHeight = null;
            this._accordionHeightTries = 0;

            this.listenTo(Assembl.vent, 'navigation:selected', this.toggleMenuByName);
        },
        onShow: function () {
            this.setSideBarHeight();
            //this.notification.show(new sidebarNotification());
        },
        toggleMenuByName: function (itemName) {
            var elm = this.$('.nav[data-view=' + itemName + ']');
            this.toggleMenuByElement(elm);
        },
        toggleMenuByEvent: function (evt) {
            if ($(evt.target).hasClass("panel-header-minimize"))
                return;
            var elm = $(evt.currentTarget); // use currentTarget instead of target, so that we are sure that it is a .nav element
            this.toggleMenuByElement(elm);
        },
        /**
         * Toggle a navigation accordion item
         * @param  {jQuery selection of a DOM element} elm
         */
        toggleMenuByElement: function (elm) {
            var view = elm.attr('data-view');

            if (elm.next(this.ui.level).is(':hidden')) {
                this.$('.nav').next('div:visible').slideUp();
                this.$('.nav').removeClass('active');
                elm.addClass('active');
                elm.next(this.ui.level).slideDown();

                this.loadView(view);
            }
        },
        setSideBarHeight: function () {
            this.initVar();
            this.ui.level.css('height', this._accordionContentHeight);
        },
        loadView: function (view) {
            // clear aspects of current state
            switch (this.groupContent.model.get('navigationState')) {
                case 'synthesis':
                    var messageListView = this.groupContent.getViewByTypeName('messageList');
                    if (messageListView) {
                        messageListView.currentQuery.clearAllFilters();
                        if (view == 'debate') {
                            setTimeout(function () {
                                messageListView.render();
                            });
                        }
                    }
                    break;
            }
            this.groupContent.model.set('navigationState', view);
            // set new state
            switch (view) {
                case 'home':
                    var homePanel = new HomePanel({
                        groupContent: this.groupContent
                    });
                    this.home.show(homePanel);
                    this.groupContent.resetContextState();
                    break;
                case 'debate':
                    var idealist = new IdeaList({
                        groupContent: this.groupContent,
                        nav: true
                    });
                    this.debate.show(idealist);
                    this.groupContent.resetDebateState();
                    break;
                case 'synthesis':
                    var synthesisInNavigationPanel = new SynthesisInNavigationPanel({
                        groupContent: this.groupContent
                    });
                    this.synthesis.show(synthesisInNavigationPanel);
                    this.groupContent.resetSynthesisMessagesState(synthesisInNavigationPanel);
                    break;
                default:
                    break
            }
        },

        // This method needs the DOM elements of the View to be rendered. So it should not be called in onRender(), but rather in onShow() or onDomRefresh()
        initVar: function () {
            // check wether DOM elements are already rendered

            var _header = $('#header').height(),
                _window = $(window).height(),
                _li = 40 * 3,
                _headerGroup = $(".groupHeader").first().height() ? $(".groupHeader").first().height() : ( $(".groupHeader").first().hasClass('editable') ? 25 : 3 ),
                _sideBarHeight = (_window - _header) - _headerGroup,
                that = this;

            if (this.$el && this.$el.parent() && this.$el.parent().height()) {

                this._accordionContentHeight = _sideBarHeight - _li;
            }
            else { // fallback: set an initial estimation

                this._accordionContentHeight = _sideBarHeight - _li - 15;

                if (++this._accordionHeightTries < 10) // prevent infinite loop
                {
                    setTimeout(function () {
                        that.setSideBarHeight();
                    }, 500);
                }
            }

        },

        serializeData: function () {
            return {
                Ctx: ctx,
                hasMinimize: ctx.canUseExpertInterface(),
                canAdd: ctx.getCurrentUser().can(Permissions.ADD_IDEA)
            }
        },

        addIdeaFromIdeaList: function () {
            Assembl.vent.trigger('ideaList:addChildToSelected');
        }


    });

    return NavigationView;
});
