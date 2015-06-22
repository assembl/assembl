'use strict';

var Marionette = require('../shims/marionette.js'),
    Backbone = require('../shims/backbone.js'),
    _ = require('../shims/underscore.js'),
    i18n = require('../utils/i18n.js'),
    $ = require('../shims/jquery.js'),
    Promise = require('bluebird'),
    Moment = require('moment'),
    CollectionManager = require('../common/collectionManager.js'),
    Social = require('../models/social.js');

var FbStatus = {
  OFFLINE: 'user not logged in',
  CONNECTED: 'user is connected',
  UNAUTHORIZED: 'user has not authenticated assembl'
}

var _allFacebookPermissions = undefined; 
var getAllFacebookPermissions = function() {
  if (_allFacebookPermissions){ return _allFacebookPermissions;}
  else{
    _allFacebookPermissions = $('#js_fb-permissions-list').html().trim();
    return _allFacebookPermissions;
  }
}

// var fbState = function(r, s, m, sm, token){
//   this.ready = r;
//   this.fbStatus = s;
//   this.msg = m;
//   this.submsg = sm;
//   this.token = token;
// }

/**
 * Encapsulating the state of the user and their facebook account
 * @param  {[type]} r The ready state, true if user has fbAccount && accessToken
 * @param  {[type]} e The error stae, enum{'re-login', 'create'}
 * @param  {[type]} t The USER access token that will be used to make API calls
 * @return {[type]}   nill
 */
var fbState = function(r, e, t) {
  this.ready = r;
  this.errorState = e;
  this.token = t;
}

//For debugging purposes only
var resolveState_shim = function(renderer){
  var state = new fbState(true, null);
  renderer(state);
}

// var checkState = function(renderView) {
//   window.FB.getLoginStatus(function(resp){
//     console.log('Check facebook status response:', resp);
//     if (resp.status === 'connected') {
//       var currentState = new fbState(true, FbStatus.CONNECTED, null, null, resp.authResponse.accessToken);
//       renderView(currentState);
//     }
//     else if (resp.status == 'not_authorized') {
//       var statusMessage = i18n.gettext("We are sorry, but Assembl does not have your permission to continue. Below are a summary of permissions that Assembl requires in order to continue.");
//       var sub = i18n.gettext("Click here to continue");
//       var currentState = new fbState(false, FbStatus.UNAUTHORIZED, statusMessage, sub, null);
//       renderView(currentState);
//     }
//     else {
//       var msg = i18n.gettext("You are currently not logged into facebook. Before logging in, please be aware that Assembl will need the following permissions in order to export the current message.");
//       var sub = i18n.gettext("Click here to login to Facebook");
//       var currentState = new fbState(false, FbStatus.OFFLINE, msg, sub, null);
//       renderView(currentState);
//     }
//   }, true); //true to force fb to check the state from their servers instead of local cache
// }

var checkState = function(renderView) {
    //Check for an access token
    var collectionManager = new CollectionManager();
    //if this account IS a facebookAccount, then check for
    //permissions and move on
    
    collectionManager.getAllUserAccountsPromise()
      .then(function(accounts){
        // Assumes that there is only 1 facebook account per user
        var fb = accounts.find(function(account){
          return account.get("@type") === "FacebookAccount";
        });
        if (!fb) {
          //Create an error view, ask the user to create a fb account
          //And merge it with the current account before moving
          //forward
          var state = new fbState(false, null);
          renderView(state);
          return false;
        }
        else {
          return collectionManager.getFacebookAccessTokensPromise()
        }
      })
      .then(function(tokens){
        if (tokens === false) {
          console.log('Do nothing, you have made a facebook error view');
        }
        else {
          console.log("Here are the access tokens", tokens);
          
          window.FB.getLoginStatus(function(resp){
            if (resp.status !== 'connected') {
              console.log('Not signed into facebook, give them login option');
              var state = new fbState(false, null);
              //renderView(state);
            }
            else {
              var newToken = resp.authResponse.accessToken;
              //Check if there is a userToken, if not, make one and save it.
              var expiredToken = _.any(tokens, function(token){
                return ( token.isExpired() && token.isUserToken() );
              });
              console.log('newToken is', newToken);
              var state = new fbState(true, newToken);
              renderView(state);
            }

          });
        }
    });
}


    //If not, check the accounts collection to see if this Account
    //has a relationship with the other account
    // collectionManager.getFacebookAccessTokensPromise().then(function(tokens){
    //     console.log('Here I am, rock you like a Harry Kane');
    //     var validUserToken = tokens.find(function(token){
    //       var date = Moment().utc(token.get('expiration'));
    //       if (date.isAfter(Moment().utc()) {
    //         //access_token has expired.
    //         //Update the access_token
    //         //Check that permissions are still the same as requested. If not, re-log in with full permissions
    //         //Ensure that the FacbookAccount's app_id matches the app_id of the SDK being used!
    //         var state = new fbState(false, null);
    //         renderView(state);
    //       }
    //       else {
    //         //Check that the current permissions of this access_token match those of the
    //         //FacebookExport
    //         window.FB.api('me/permissions')

    //         //Check how long there is left in the expiration. If less than X, renew and push to backend
    //         const TIME_TO_UPDATE_TOKEN = 1; //hour
    //         if ( date.duration().subtract(Moment().utc().duration()).asHours() <= TIME_TO_UPDATE_TOKEN ) {
    //           window.FB.login(function(resp){
    //             //Push to backend
    //           }, getAllFacebookPermissions());
    //         }
    //       }

    //     });
    //   //When there are no access_tokens, means there is no FacebookAccount
    //   //After fixing the velruse package to send the access_token into profile.
    // })
// }

//Delete function for loggin user in. Will need this if user logs out of
//of facebook when form is active
var loginUser = function(state, model) {
  //Permissions are pre-rendered from the back-end
  //into a hidden div.
  var scope = $('#js_fb-permissions-list')
              .html()
              .trim();
  window.FB.login(function(resp){
    console.log('login response', resp);
    //Check list of permissions given to see if it matches what we asked.
    //If not, cannot continue
    //If yes, re-render the view.
    //Add event handlers for if things change
    if (resp.status === 'connected') {
      //window.FB.api('')
      var time = new Date.getTime() + (resp.authResponse.expiresIn * 1000);
      var token = new Social.Facebook.Token({
        fb_user_id: 1479,
        token: resp.authResponse.accessToken,
        expiration: time,
        tokenType: 'user',
        object_name: null
      });
      token.save();
    }
  },{scope: scope });
}


var _getAllPaginatedEntities = function(endPoint, dataName){
  window.FB.api(endPoint, function(firstPage){
    var results = [];
    var data = firstPage[dataName];
    for (d in data) {
      results.push(d);
    }
    var paging = firstpage.paging;
    var that = this;
    while (paging.hasOwnProperty('next')) {
      var nextPage = firstPage.paging.next;
      var params = $.
      $.getJSON(nextPage, function(newPage){
        var data = newPage[dataName];
        for (d in data) {
          that.results.push(d);
        }
        that.paging = newPage.paging;
      });
    }
  });
}

var _composeMessageBody = function(model){
  var msg = i18n.gettext("");

  msg += model.body;

}

var errorView = Marionette.ItemView.extend({
  template: '#tmpl-exportPostModal-fb-token-error',
  initialize: function(options){
    console.log('initializing errorView with options', options);
    this.state = options.state;
    this.msg = options.message;
    this.subMsg = options.subMessage;
    this.msgModel = options.model;
  },
  serializeData: function() {
    return {
      message: this.msg,
      subMessage: this.subMsg
    }
  },
  events: {
    'click .js_fb-get-permissions': 'userLogin',
  },
  userLogin: function(event) {
    console.log('clicked on link to log user in');
    loginUser(this.state, this.msgModel);
  }
});

var groupView = Marionette.ItemView.extend({
    template: "#tmpl-loader",
    //template: '#tmpl-exportPostModal-fb-group',
    initialize: function(options) {
      var that = this;
      window.FB.api("me/groups", function(resp){
        console.log("The user groups", resp);
        that.userGroups = resp.data;
        that.template = "#tmpl-exportPostModal-fb-group";
        that.render();
      });
    },
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
    template: '#tmpl-loader',
    //template: '#tmpl-exportPostModal-fb-page',
    initialize: function(options) {
      //Make an API call to get the list of all liked pages
      //And store as an object for autocompletion
      
      //Get list of pages the user manages
      //Get their access tokens
      //window.FB.api()
      console.log('initializing page view');
      var that = this;
      window.FB.api("me/likes", function(resp){
        console.log("the user pages", resp);
        that.userPages = resp.data;
        that.template = "#tmpl-exportPostModal-fb-page";
        that.render();
      });
    },
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
      'click .fb-js_test_area': 'test',
    },
    initialize: function(options) {
      this.token = options.token;
      this.bundledData = {
        endpoint: null,
        message : null,
        accessToken: this.token,
        attachPic: null,
        attachSubject: null,
        attachCaption: null,
        attachDesc: null
      };
      console.log('facebook root view initializing with options', options);
    },
    test: function(e) {
      checkState(null);
    },
    updateBundledData: function(){

    },
    defineView: function(event){
      var value = this.$(event.currentTarget)
                      .find('option:selected')
                      .val();

      var accessToken = false;

      switch(value) {
        case 'page':
          this.getRegion('subform').show(new pageView({token: this.token}));
          break;
        case 'group':
          this.getRegion('subform').show(new groupView({tokne: this.token}));
          break;
        case 'me':
          this.updateBundledData();
        default:
          //This might be the wrong approach to emptying the region
          this.getRegion('subform').reset();
          break;
      }

    }
});

module.exports = {
  api: window.FB,
  root: fbLayout,
  group: groupView,
  page: pageView,
  error: errorView,
  resolveState: checkState
}
