define(function (require) {

    var Marionette = require('marionette'),
        IdeaList = require('views/ideaList'),
        sidebarNotification = require('views/navigation/notification'),
        HomePanel = require('views/navigation/home'),
        SynthesisInNavigationPanel = require('views/navigation/synthesisInNavigation'),
        AssemblPanel = require('views/assemblPanel'),
        $ = require('jquery');

    var NavigationView = AssemblPanel.extend({
        template: "#tmpl-navigation",
        panelType: "navSidebar",
        className: "navSidebar",
        hideHeader: true,
        getTitle: function () {
            return 'Navigation'; // unused
        },
        regions: {
            home: '.home',
            debate: '.debate',
            synthesis: '.synthesis',
            notification: '.navNotification'
        },
        events: {
            'click .nav': 'toggleMenu'
        },
        ui: {
            level: 'div.second-level'
        },
        initialize: function (options) {
            var that = this;

            this.groupContent = options.groupContent;

            $(window).resize(function () {
                that.initVar();
                that.setSideBarHeight();
            });

            this._sideBarHeight = null;
            this._accordion = null;

            this.initVar();
            this.setSideBarHeight();
        },
        onRender: function () {
            this.setSideBarHeight();
            //this.notification.show(new sidebarNotification());
        },
        toggleMenu: function (e) {
            var elm = $(e.target),
                view = elm.attr('data-view');

            if (elm.next(this.ui.level).is(':hidden')) {
                this.$('.nav').next('div:visible').slideUp();
                this.$('.nav').removeClass('active');
                elm.addClass('active');
                elm.next(this.ui.level).slideDown();
            }
            this.loadView(view);
        },
        setSideBarHeight: function () {
            this.$el.css('height', this._sideBarHeight);
            this.$('div.second-level').css('height', this._accordion)
        },
        loadView: function (view) {
            this.groupContent.model.set('navigationState', view);
            switch (view) {
                case 'home':
                    var homePanel = new HomePanel({
                        groupContent: this.groupContent
                    });
                    this.home.show(homePanel);
                    this.groupContent.ensureOnlyPanelsVisible('homePanel');
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
                    this.groupContent.removePanels('homePanel');
                    this.groupContent.ensurePanelsVisible('messageList');
                    this.groupContent.ensurePanelsHidden('ideaPanel');
                    this.groupContent.setPanelWidthByType('messageList', 2);
                    break;
                default:
                    break
            }
        },

        initVar: function () {
            var _header = $('#header').height(),
                _window = $(window).height(),
            //_searchBox = 43,
                _li = 105,
                _headerGroup = 25;

            this._sideBarHeight = (_window - _header) - _headerGroup;
            this._accordion = (this._sideBarHeight - _li) - 15;
        }

    });

    return NavigationView;
});
