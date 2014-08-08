define(function(require) {

     var Marionette = require('marionette'),
           IdeaList = require('views/ideaList'),
sidebarNotification = require('views/navigation/notification'),
            HomePanel = require('views/navigation/home'),
       AssemblPanel = require('views/assemblPanel'),
                  $ = require('jquery');

    var navigation = AssemblPanel.extend({
        template: "#tmpl-navigation",
        className: "navSidebar",
        regions: {
           home:'.home',
           debate:'.debate',
           synthesis:'.synthesis',
           notification:'.navNotification'
        },
        events: {
          'click .nav': 'toggleMenu'
        },
        initialize: function(options){
            var that = this;

            this.groupContent = options.groupContent;

            $(window).resize(function(){
                that.initVar();
                setTimeout(function(){
                    that.setSideBarHeight();
                }, 1000);
            });

            this._window = null;
            this._sideBarHeight = null;
            this._accordion = null;

            this.initVar();
            this.setSideBarHeight();
        },
        onRender: function(){
           this.setSideBarHeight();
           this.notification.show(new sidebarNotification());
        },
        toggleMenu: function(e){
            var elm =  $(e.target),
                view = elm.attr('data-view');

            this.loadView(view);

            this.groupContent.setNavigationState(view);

            if(!elm.next('div.second-level').is(':visible')){
                this.$('div.second-level').slideUp();
                elm.next('div.second-level').css('height', this._sideBarHeight);
                elm.next('div.second-level').slideDown();
            }
        },
        setSideBarHeight: function(){
            this.$el.find('.side-menu').css('height', this._accordion);
            this.$el.css('height', this._sideBarHeight);
        },
        loadView: function(view){
           switch(view){
               case 'home':
                   console.log('load home panel');
                   var homePanel = new HomePanel();
                   this.home.show(homePanel);
                   break;
               case 'debate':
                   console.log('load idea table');
                   var idealist = new IdeaList();
                   this.debate.show(idealist);
                   break;
               case 'synthesis':
                   console.log('load synthesis');
                   break;
               default:
                   break
           }
        },

        initVar: function(){
            var _header = 60,
                _adsBox = 150,
                _li = 105;

            this._window = $(window).height() - _header;
            this._sideBarHeight = (this._window - _adsBox) - _li;
            this._accordion = this._window - _adsBox;
        }

    });

    return navigation;
});