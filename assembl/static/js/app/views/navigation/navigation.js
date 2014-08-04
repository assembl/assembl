define(function(require) {

     var Marionette = require('marionette'),
           IdeaList = require('views/ideaList'),
sidebarNotification = require('views/navigation/notification'),
            Context = require('views/navigation/context'),
          Dashboard = require('views/navigation/dashboard'),
       AssemblPanel = require('views/assemblPanel'),
                  $ = require('jquery');

    var navigation = AssemblPanel.extend({
        template: "#tmpl-navigation",
        className: "navSidebar",
        regions: {
           context:'.context',
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
                that.setSideBarHeight();
            });

            this.window_height = $(window).height() - 61;
            this.adsBox_height = 150;
            this.li_height = 140;
            this.sizeMenu = (this.window_height - this.adsBox_height) - this.li_height;
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
                elm.next('div.second-level').css('height', this.sizeMenu).slideDown();
            }
        },
        setSideBarHeight: function(){
            var accordion = (this.window_height - this.adsBox_height);

            this.$el.find('.side-menu').css('height', accordion);
            this.$el.css('height', this.window_height);
        },
        loadView: function(view){
           switch(view){
               case 'context':
                   console.log('load context');
                   var context = new Context();
                   this.context.show(context);

                   break;
               case 'dashboard':
                   console.log('load dashboard');
                   var dashboard = new Dashboard();
                   this.dashboard.show(dashboard);
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
        }

    });
    navigation.prototype.registerPanelType('navigation', navigation);

    return navigation;
});