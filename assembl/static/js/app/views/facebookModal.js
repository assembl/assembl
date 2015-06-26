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
};

window.USER_TOKEN = {
  token: null,
  expiration: null
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
 * @param  {[type]} e The error stae, enum{'permissions', 're-login', 'create'}
 * @param  {[type]} t The USER access token that will be used to make API calls
 * @return {[type]}   nill
 */
var fbState = function(r, e, t) {
  this.ready = r;
  this.errorState = e;
  this.token = t;
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
function _updateToken(t, e){
  window.USER_TOKEN.token = t;
  if (typeof e === 'number') {
    window.USER_TOKEN.expiration = Moment().utc().add(e, 'seconds');
  }
  else {
    window.USER_TOKEN.expiration = Moment().utc(e);
  }
}

var loginUser_fake = function(success){
  var scope = getAllFacebookPermissions();
  window.FB.login(function(resp){
    if (resp.status !== 'connected'){
      console.error("Fuck you for not accepting.");
    }
    else {
      console.log('User is logged in with response ', resp);
      _updateToken(resp.authResponse.accessToken, resp.authResponse.expiresIn);
      console.log('The USER_TOKEN: ', window.USER_TOKEN);
      success();
    }
  });
}

//For debugging purposes only
var checkState_shim = function(renderer){ 
  loginUser_fake(function(){
    var state = new fbState(true, null);
    renderer(state);    
  });

}

//Also for debugging simple functions in the root view
var checkState_shim_2 = function(renderer){ 
  var state = new fbState(true, null);
  renderer(state);
}

//Delete function for loggin user in. Will need this if user logs out of
//of facebook when form is active
var loginUser = function(success) {
  //Permissions are pre-rendered from the back-end
  //into a hidden div.
  var scope = getAllFacebookPermissions();
  window.FB.login(function(resp){
    console.log('login response', resp);
    //Check list of permissions given to see if it matches what we asked.
    //If not, cannot continue
    //If yes, re-render the view.
    //Add event handlers for if things change
    
    if (resp.status !== 'connected'){
      console.error("Facebook could not log in ")
      //Maybe add a red warning under the errorView that the login process failed
    }

    else {
      //Status is connected
      console.log('Access token from login', resp.authResponse.accessToken);
      console.log('Short term token expires in', resp.authResponse.expiresIn);
      var collectionManager = new CollectionManager();
      collectionManager.getFacebookAccessTokensPromise()
        .then(function(tokens){
          if (tokens.hasUserToken()) {
            var token = tokens.getUserToken();
            console.log('Currently existing token', token);
            token.save({
              token: resp.authResponse.accessToken
            }, {
              patch: true,
              //wait: true, //Wait: Wait for server response before setting new attributes
              success: function(model, resp, opt) {
                console.log('Facebook Access Token updated successful.');
                // console.log('Saved model', model);
                // console.log('Resp object', resp);
                // console.log('Options object', opt);
                _updateToken(model.get('token'), model.get('expiration'));
              },
              error: function(model, resp, opt){
                console.log('Facebook Access Token save NOT updated successfully.');
                // console.log('Saved model', model);
                // console.log('Resp object', resp);
                // console.log('Options object', opt);
              }
            }); 
          }
          else {
            //No user token, must make one
            console.log('New token is being made...');
            console.log('The tokens', tokens);
            console.log('tokens have user token? ', tokens.hasUserToken());
            var token = new Social.Facebook.Token.Model({
              token: resp.authResponse.accessToken,
              //fb_account_id: resp.authResponse.userID,
              token_type: 'user',
              "@type": 'FacebookAccessToken'
            });
            token.save(null, {
              success: function(model, resp, opt){
                console.log('New Facebook Access Token saved successfully.');
                // console.log('Saved model', model);
                // console.log('Resp object', resp);
                // console.log('Options object', opt);
                _updateToken(model.get('token'), model.get('expiration'));
                success()
              },
              error: function(model, resp, opt){
                console.log('New Facebook Access Token NOT saved successfully.');
                // console.log('Saved model', model);
                // console.log('Resp object', resp);
                // console.log('Options object', opt);
              }
            })
          }
        });
    }
  },{scope: scope });
}

//Entry point in this module
var checkState = function(renderView) {
    //if this account IS a facebookAccount, then check for
    //permissions and move on
    // if (!collectionManager) {
    //   collectionManager = new CollectionManager();
    // }
    var collectionManager = new CollectionManager();

    collectionManager.getAllUserAccountsPromise()
      .then(function(accounts){
        // Assumes that there is only 1 facebook account per user
        if ( !accounts.hasFacebookAccount() ) {
          var state = new fbState(false, 'create', null);
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
          var userToken = tokens.getUserToken();
          console.log('UserToken', userToken);
          if (!userToken) {
            var state = new fbState(false, 'permissions',null);
            renderView(state);
          }
          else {
            //Check token expiry
            if ( userToken.isExpired() ) {
              loginUser(function(){
                var state = new fbState(true, null, window.USER_TOKEN);
                renderView(state);
              });
            }
            else {
              //Token not expired, serve it up
              _updateToken(userToken.get('token'), userToken.get('expiration'));
              var state = new fbState(true, null, window.USER_TOKEN);
              renderView(state);
            }
          }
        }
    });
}


          // window.FB.getLoginStatus(function(resp){
          //   if (resp.status !== 'connected') {
          //     console.log('Not signed into facebook, give them login option');
          //     var state = new fbState(false, null);
          //     //renderView(state);
          //   }
          //   else {
          //     var newToken = resp.authResponse.accessToken;
          //     //Check if there is a userToken, if not, make one and save it.
          //     var expiredToken = _.any(tokens, function(token){
          //       return ( token.isExpired() && token.isUserToken() );
          //     });
          //     console.log('newToken is', newToken);
          //     var state = new fbState(true, newToken);
          //     renderView(state);
          //   }

          // });
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
      var nextPage = paging.next;
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

var _composeMessageBody = function(model, creator){
  var msg = i18n.sprintf(i18n.gettext("Message posted by %s on Assembl:\n\n"), creator.get('name'));

  msg += model.get('body');
  msg += "\n\n"

  msg += i18n.gettext("Note: Responses to this post will be imported into an Assembl discussion. If you wish to contribute to the discussion, you can follow the link here.");
  return msg;
}

var _updateBundledData = function(bundle, updates){
  //jQuery extend does deep copy
  //Nested object in bundle
  $.extend(bundle, updates);
}

var errorView = Marionette.ItemView.extend({
  template: '#tmpl-exportPostModal-fb-token-error',
  initialize: function(options){
    this.vent = options.vent; //Event Aggregator
    console.log('initializing errorView with options', options);
    if (options.ready === false) {
      if (options.errorState === 'permissions') {
        this.msg = i18n.gettext("There is an account, must get permissions");
        this.subMsg = i18n.gettext('Click here to continue.');
        this.state = options.errorState;
      }
      else {
        this.msg = i18n.gettext("You must create an account. Warning: This will refersh the page");
        this.subMsg = i18n.gettext("Sign in using your Facebook account");
        this.state = options.errorState;
      }
    }
  },
  serializeData: function() {
    return {
      message: this.msg,
      subMessage: this.subMsg
    }
  },
  ui: {
    login: ".js_fb-create-action"
  },
  events: {
    'click @ui.login': "checkAndLoginUser"
  },
  checkAndLoginUser: function(event){
    if (this.state === 'permissions' ) {
      console.log('clicked on link to log user in');
      var that = this;
      loginUser(function(){
        that.vent.trigger("loadFbView", USER_TOKEN);
      });
    }
    else{
      console.log('I will make an account');
    }
  }
});

var groupView = Marionette.ItemView.extend({
    template: "#tmpl-loader",
    //template: '#tmpl-exportPostModal-fb-group',
    initialize: function(options) {
      this.bundle = options.bundle;
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
      this.bundle = options.bundle;

      var that = this;
      window.FB.api("me/likes", function(resp){
        console.log("the user pages", resp);
        that.userPages = resp.data;
        that.template = "#tmpl-exportPostModal-fb-page";
        that.render();
      });
    },
    events: {
      'blur .js_fb-page-id': 'updatePageId',
      'change .js_fb-page-voice': 'updateSender'
    },
    updatePageId: function(e){
      _updateBundledData(this.bundle, {
        page_pageId: $(e.target).val()
      });
    },
    updateSender: function(e) {
      var a = $(e.target);
      console.log('option change event', e);
      console.log('option change name', a.val());
      console.log('option change value', a.attr('value'));
      // _updateBundledData(this.bundle, {
      //   sender: {
      //     name: $(e.target).val()
      //   }
      // });
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
      this.model = options.model;
      this.creator = options.creator;
      this.vent = options.vent; //Event Aggregator
      this.bundle = {
        endpoint: null,
        message: _composeMessageBody(options.model, this.creator),
        credentials: window.USER_TOKEN,
        attachPic: null,
        attachSubject: null,
        attachCaption: null,
        attachDesc: null,
        sender: null,
      };
      console.log('facebook root view initializing with options', options);

      this.vent.on("submitFacebook", this.submitForm, this);
    },
    test: function(e) {
      loginUser(function(){
        console.log('Successfully logged in and received a Facebook access token.');
      });

    },
    defineView: function(event){
      var value = this.$(event.currentTarget)
                      .find('option:selected')
                      .val();

      switch(value) {
        case 'page':
          this.getRegion('subform').show(new pageView({
            token: this.token,
            bundle: this.bundle
          }));
          break;
        case 'group':
          this.getRegion('subform').show(new groupView({
            token: this.token,
            bundle: this.bundle
          }));
          break;
        case 'me':
          _updateBundledData(this.bundle, {
            endpoint: 'me/feed',
          });
        default:
          //This might be the wrong approach to emptying the region
          this.getRegion('subform').reset();
          break;
      }

    },
    submitForm: function(success){
      //Update the bundle with the values of the form
      //Make validations
      console.log('Form is being submitted...');
      console.log('Here is the current bundle ', this.bundle);
      var endpoint = this.bundle.endpoint;
      var hasAttach = this.bundle.attachPic !== null;
      var args = {
        access_token: this.bundle.credentials.token,
        message: this.bundle.message,
        link : window.location.href,
        //picture : 'http://' + window.location.host +"/" + Ctx.getApiV2DiscussionUrl() + "/mindmap",
        picture: 'http://assembl.coeus.ca/static/css/themes/default/img/crowd2.jpg', //Such a shit hack
        name : $('.js_fb-suggested-name').val(),
        caption : $('.js_fb-suggested-caption').val(),
        description : $('.js_fb-suggested-description').val()
      };
      // if (hasAttach){
      //   args['link'] = {
      //     picture: this.bundle.attachPic,
      //     name: this.bundle.attachSubject,
      //     caption: this.bundle.attachCaption,
      //     description: this.bundle.attachDesc
      //   }
      // }
        // args['link'] = window.location.url;
        // //args['picture'] = 'http://' + window.location.host +"/" + Ctx.getApiV2DiscussionUrl() + "/mindmap";
        // args['name'] = this.bundle.attachSubject;
        // args['caption'] = this.bundle.attachCaption;
        // args['description'] = this.bundle.attachDesc;
      var that = this;
      console.log('args: ', args);
      window.FB.api(endpoint, 'post', args, function(resp){
        console.log('The response of posting to facebook.', resp);
        //The new fb_post_id is in the response
        success();
      });
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
