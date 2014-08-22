define(function (require) {

    var Assembl = require('modules/assembl'),
        Marionette = require('marionette'),
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
            'click .nav': 'toggleMenuByEvent'
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

            this._accordionContentHeight = null;

            this.listenTo(Assembl.vent, 'navigation:selected', this.toggleMenuByName);
        },
        onShow: function () {
            this.initVar();
            this.setSideBarHeight();
            //this.notification.show(new sidebarNotification());
        },
        toggleMenuByName: function(itemName){
            var elm = this.$('.nav[data-view='+itemName+']');
            this.toggleMenuByElement(elm);
        },
        toggleMenuByEvent: function(evt){
            var elm = $(evt.target);
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
            this.$('div.second-level').css('height', this._accordionContentHeight);
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

        // This method needs the DOM elements of the View to be rendered. So it should not be called in onRender(), but rather in onShow() or onDomRefresh()
        initVar: function () {
            // check wether DOM elements are already rendered
            if ( this.$el && this.$el.height() )
            {
                var number_of_li = this.$('.side-menu > li').length;
                var total_li_height = 35 * number_of_li;

                var container_height = this.$el.height();
                this._accordionContentHeight = container_height - total_li_height - 10;
            }
            else
            { // fallback: set an initial estimation
                var _header = $('#header').height(),
                _window = $(window).height(),
                _li = 35*3,
                _headerGroup = 25;
                _sideBarHeight = (_window - _header) - _headerGroup;
                this._accordionContentHeight = (this._sideBarHeight - _li) - 15;
            }
            
        }

    });

    return NavigationView;
});
