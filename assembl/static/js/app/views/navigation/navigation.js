define(function(require) {

     var Marionette = require('marionette'),
           IdeaList = require('views/ideaList'),
sidebarNotification = require('views/navigation/notification'),
            HomePanel = require('views/navigation/home'),
       AssemblPanel = require('views/assemblPanel'),
                  $ = require('jquery');

    var navigation = AssemblPanel.extend({
        template: "#tmpl-navigation",
        className: "groupPanel navSidebar",
        regions: {
           dashboard:'.dashboard',
           ideaTable:'.ideasTable',
           synthesis:'.synthesis',
           notification:'.navNotification'
        },
        events: {
          'click .nav': 'toggleMenu'
        },
        initialize: function(){
            var that = this;

            $(window).resize(function(){
                that.initVar();
                that.setSideBarHeight();
            });

            this._window = null;
            this._sideBarHeight = null;
            this._accordion = null;

            this.initVar();
        },
        onRender: function(){
           this.setSideBarHeight();
           this.notification.show(new sidebarNotification());
        },
        toggleMenu: function(e){
            var elm =  $(e.target),
                view = elm.attr('data-view');

            this.loadView(view);

            if(!elm.next('div.second-level').is(':visible')){
                $('div.second-level').slideUp();
                elm.next('div.second-level').slideDown();
            }
        },
        setSideBarHeight: function(){
            this.$el.find('.side-menu').css('height', this._accordion);
            this.$el.css('height', this._sideBarHeight);

        },
        loadView: function(view){
           switch(view){
               case 'home-panel':
                   console.log('load home panel');
                   var homePanel = new HomePanel();
                   this.context.show(homePanel);
                   break;
               case 'ideaTable':
                   console.log('load idea table');
                   var idealist = new IdeaList();
                   this.ideaTable.show(idealist);
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