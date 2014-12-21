'use strict';

define(['app', 'backbone.marionette', 'views/ideaList', 'views/navigation/notification', 'views/navigation/home', 'views/navigation/synthesisInNavigation', 'views/navigation/linkListView', 'views/assemblPanel', 'common/context', 'utils/permissions', 'jquery', 'utils/panelSpecTypes', 'jed'],
    function (Assembl, Marionette, IdeaList, sidebarNotification, HomePanel, SynthesisInNavigationPanel, LinkListView, AssemblPanel, ctx, Permissions, $, PanelSpecTypes, Jed) {

        var NavigationView = AssemblPanel.extend({
            template: "#tmpl-navigation",
            panelType: PanelSpecTypes.NAV_SIDEBAR,
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
                notification: '.navNotification',
                visualizationList: '.visualization-list'
            },
            ui: {
                navigation: '.js_navigation',
                ideaFromIdealist: '.js_addIdeaFromIdeaList',
                level: 'div.second-level',
                visualization_tab: '#visualization_tab'
            },
            events: {
                'click @ui.navigation': 'toggleMenuByEvent',
                'click @ui.ideaFromIdealist': 'addIdeaFromIdeaList'
            },
            initialize: function (options) {
                Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize(options);
                var that = this;

                $(window).resize(function () {
                    that.setSideBarHeight();
                });

                this._accordionContentHeight = null;
                this._accordionHeightTries = 0;
                this.visualizationItems = new Backbone.Collection();
                this.num_items = 3;

                ctx.getDiscussionPromise().done(function(discussion) {
                    var settings = discussion['settings'];
                    var jed;
                    try {
                        jed = new Jed(settings['translations'][assembl_locale]);
                    } catch (e) {
                        // console.error(e);
                        jed = new Jed({});
                    }
                    try {
                        // temporary hack
                        var visualization_items = settings['navigation_sections'][0]['navigation_content']['items'];
                        if (visualization_items.length == 0)
                            return;
                        var server_url = document.URL;
                        var server_url_comp1 = server_url.split('://', 2);
                        var server_url_comp2 = server_url_comp1[1].split('/', 1);
                        server_url = server_url_comp1[0]+'://'+server_url_comp2[0];
                        that.visualizationItems.reset(_.map(visualization_items, function(item) {
                            return new Backbone.Model({
                                "url": _.template(item.url, {
                                    "url": encodeURIComponent(server_url+'/data/Discussion/'+ctx.getDiscussionId()+'/jsonld'),
                                    "lang": assembl_locale
                                }),
                                "title": jed.gettext(item.title),
                                "description": jed.gettext(item.description)
                            });
                        }));
                        that.num_items = 4;
                        that.ui.visualization_tab.show();
                        that.setSideBarHeight();
                    } catch (e) {
                        // console.log(e);
                    }
                });
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
                switch (this.getContainingGroup().model.get('navigationState')) {
                    case 'synthesis':
                        var messageListView = this.getContainingGroup().findViewByType(PanelSpecTypes.MESSAGE_LIST);
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
                this.getContainingGroup().model.set('navigationState', view);
                // set new state
                switch (view) {
                    case 'home':
                        var homePanel = new HomePanel({
                            groupContent: this.getContainingGroup(),
                            panelWrapper: this.getPanelWrapper()
                        });
                        this.home.show(homePanel);
                        this.getContainingGroup().resetContextState();
                        break;
                    case 'debate':
                        var idealist = new IdeaList({
                            groupContent: this.getContainingGroup(),
                            panelWrapper: this.getPanelWrapper(),
                            nav: true
                        });
                        this.debate.show(idealist);
                        this.getContainingGroup().resetDebateState();
                        break;
                    case 'synthesis':
                        var synthesisInNavigationPanel = new SynthesisInNavigationPanel({
                            groupContent: this.getContainingGroup(),
                            panelWrapper: this.getPanelWrapper()
                        });
                        this.synthesis.show(synthesisInNavigationPanel);
                        this.getContainingGroup().resetSynthesisMessagesState(synthesisInNavigationPanel);
                        break;
                    case 'visualizations':
                        var visualizationListPanel = new LinkListView({
                            groupContent: this.getContainingGroup(),
                            collection: this.visualizationItems
                        });
                        this.visualizationList.show(visualizationListPanel);
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
                    _li = 40 * this.num_items,
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
                    hasMinimize: (ctx.getCurrentInterfaceType() === ctx.InterfaceTypes.EXPERT),
                    canAdd: ctx.getCurrentUser().can(Permissions.ADD_IDEA)
                }
            },

            addIdeaFromIdeaList: function () {
                Assembl.vent.trigger('ideaList:addChildToSelected');
            }


        });

        return NavigationView;
    });
