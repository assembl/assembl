'use strict';

define(['backbone.marionette', 'backbone', 'underscore', 'jquery', 'utils/i18n', 'backbone.modal', 'backbone.marionette.modals'], function (Marionette, Backbone, _, $, i18n, modal1, modal2) {
    var that = this,
        fb = window.FB,
        status = null;

    var FbStatus = {
      OFFLINE: 'user not logged in',
      CONNECTED: 'user is connected',
      UNAUTHORIZED: 'user has not authenticated assembl'
    }

    var fbState = function(r, s, m){
      this.ready = r;
      this.fbStatus = s;
      this.msg = m;
    }

    var errorView = Marionette.ItemView.extend({
      initialize: function(options){
        this.msg = options.message;
      },
      serializeData: function() {
        return {
          message: this.msg
        }
      },
      template: '#tmpl-exportPostModal-fb-token-error'
    });

    var groupView = Marionette.ItemView.extend({
        template: '#tmpl-exportPostModal-fb-group',
        serializeData: function() {
          return {
            userManagedGroupList: [
              {value: 'null', description: ''},
              {value: 'self', description: 'Yourself'}
            ]
          }
        },
    });
    var pageView = Marionette.ItemView.extend({
        template: '#tmpl-exportPostModal-fb-page',
        serializeData: function() {
          return {
            userManagedPagesList: [
              {value: 'null', description: ''},
              {value: 'self', description: 'Yourself'}
              //Add more after API call made
            ]
          }
        },
    });

    var fbLayout = Marionette.LayoutView.extend({
        template: "#tmpl-exportPostModal-fb",
        regions: {
          subform: '.fb-targeted-form'
        },
        events: {
          'change .js_fb-supportedList': 'defineView',
          'click .js_fb-get-permissions': 'getToken'
        },
        initialize: function(options) {
          var msg = options.errorMessage;
          console.log('facebook root view initializing');
          //check that the user is logged into facebook
          fb.getLoginStatus(function(resp){
            console.log('the facebook response happening', resp);
            if (resp.status == 'not_authorized'){
              var statusMessage = i18n.gettext("We are sorry, but Assembl does not have your permission to continue. ") +
                i18n.gettext("Below are a summary of permissions that Assembl requires in order to continue.");
              // ready = false;
              // status = FbStatus.UNAUTHORIZED;
              // statusMessage = statusMessage;
              status = new fbState(false, FbStatus.UNAUTHORIZED, statusMessage);
            }
            else if (resp.status == 'connected') {
              // ready = true,
              // status = FbStatus.CONNECTED;
              status = new fbState(true, FbStatus.CONNECTED, '');
            }
            else {
              // ready = false;
              // status = FbStatus.OFFLINE;
              status = new fbState(false, FbStatus.OFFLINE, i18n.gettext("You are currently not logged into facebook."));
            }
          });
        },
        getToken: function(event) {
          console.log('I will get the access token!', event);
        },
        defineView: function(event){
          var value = this.$(event.currentTarget)
                          .find('option:selected')
                          .val();

          var accessToken = false;

          switch(value) {
            case 'page':
              this.getRegion('subform').show(new pageView());
              break;
            case 'group':
              this.getRegion('subform').show(new groupView());
              break;
            default:
              //This might be the wrong approach to emptying the region
              this.getRegion('subform').reset();
              break;
          }

        }
    });

  return {
    api: fb,
    root: fbLayout,
    group: groupView,
    page: pageView,
    error: errorView,
    state: status
  }
});
