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

var _allFacebookPermissions = undefined; 
var getAllFacebookPermissions = function() {
  if (_allFacebookPermissions){ return _allFacebookPermissions;}
  else{
    _allFacebookPermissions = $('#js_fb-permissions-list').html().trim();
    return _allFacebookPermissions;
  }
};

window.moment = Moment; //Purely debug

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

/**
 * Global token placeholder
 *
 * Page and Group will look like:
 * {
 *   page_id: {
 *     token: null,
 *     expiration: null
 *   }
 * }
 * @type {Object}
 */
var fb_token = function(){
  this.user = null;
  this.page = null;
  this.group = null;
  this.collectionManager = new CollectionManager();
}

fb_token.prototype = {
  setUserToken: function(token, expiration){
    if (!this.user) {
      this.user = {
        token: null,
        expiration: null
      };
    }
    this.user.token = token;
    if (typeof expiration === 'number') {
      this.user.expiration = Moment().utc().add(expiration, 'seconds');
    }
    else {
      this.user.expiration = Moment().utc(expiration);
    }
  },
  setPageToken: function(pageId, token, expiration){
    if (!this.page){
      this.page = {};
    }
    this.page[pageId].token = token;
    if (typeof expiration === 'number') {
      this.page[pageId].expiration = Moment().utc().add(expiration, 'seconds');
    }
    else {
      this.page[pageId].expiration = Moment().utc(expiration);
    }
  },
  setGroupToken: function(groupId, token, expiration){
    if (!this.group){
      this.group = {};
    }
    this.group[groupId].token = token
    if (typeof expiration === 'number') {
      this.group[groupId].expiration = Moment().utc().add(expiration, 'seconds');
    }
    else {
      this.group[groupId].expiration = Moment().utc(expiration);
    }
  },
  getUserToken: function(){
    return this.user.token;
  },
  getPageToken: function(pageId){
    if (!this.page.hasOwnProperty(pageId)) {
      return null;
    }
    else {
      return this.page[pageId].token;
    }
  },
  getGroupToken: function(groupId){
    if (!this.group.hasOwnProperty(groupId)) {
      return null;
    }
    else {
      return this.group[groupId].token;
    }
  },
  getAllPageTokens: function(){
    return this.page;
  },
  getAllGroupTokens: function(){
    return this.group;
  },
  isUserTokenExpired: function(){
    if (this.user){
      var now = Moment().utc();
      return now.isAfter(this.user.expiration);
    }
    else {
      //If there is no token, then it is equivalent to having
      //an expired token. Must get a new one and set it.
      return true;
    }
  },
  isPageTokenExpired: function(pageId){
    if (this.page.hasOwnProperty(pageId)){
      var now = Moment().utc();
      return now.isAfter(this.page.expiration);
    }
    else {
      return true;
    }
  },
  isGroupTokenExpired: function(groupId){
    if (this.group.hasOwnProperty(groupId)){
      var now = Moment().utc();
      return now.isAfter(this.group.expiration);
    }
    else {
      return true;
    }    
  }
}

//Is it important to type it to the window object? Not certain
window.FB_TOKEN = new fb_token();

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

// ********************************** DEBUGGING FUNCTIONS ********************************************************
var loginUser_fake = function(success){
  var scope = getAllFacebookPermissions();
  window.FB.login(function(resp){
    if (resp.status !== 'connected'){
      console.error("Fuck you for not accepting.");
    }
    else {
      console.log('User is logged in with response ', resp);
      window.FB_TOKEN.setUserToken(resp.authResponse.accessToken, resp.authResponse.expiresIn);
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

// ***************************************************************************************************************


var fbApi = function(options, success, error){
  var source = options.endpoint,
      httpType = options.http || 'get',
      qs = options.fields;

  console.log('The endpoint ', source);
  console.log('httpType ', httpType);
  console.log('fields', qs);
  console.log('The error', error);
  console.log('The qs', qs);
  console.log('')
  window.FB.api(source, httpType, qs, function(resp){
    console.log('API call response', resp);
    if (_.has(resp, 'error')){
      if (error !== 'function'){
        console.log('The error is undefined', error);
        var eMessage = i18n.gettext('An error occured whilst communicating with Facebook. Close the box and try again.');
        $('.js_export_error_message').text(eMessage);
        console.error(resp.error);
      }
      else {
        console.log('The error is supposed to be a function', error);
        error(resp); 
      }
    }
    else{
      success(resp);
    }
  });
}

//Might cause a stack overflow if the data is very large, or many many pages....
var getAllPaginatedEntities = function(endPoint, options, success){
  var extractData = function(resp){
    var set = {}
    resp.data.forEach(function(d, i, arr){
      set[d.id] = d;
    });
    return set;
  }

  /**
   * Appends the values from set2 into set1
   * @param  {[Object]} set1 Obj with key of {fb_id: data}
   * @param  {[Object]} set2 Obj with key of {fb_id: data}
   * @return {[Object]}      Obj with unique objects of {fb_id: data}
   */

  var getData = function(resp, data, uniqueSet){
    console.log('getData is called.');
    var paging = resp.paging;
    if (!paging.hasOwnProperty('next')){
      var results = data.concat(resp.data); //Concat last page of data with current data 
      success(results); //results *COULD* have duplicates. Check downstream to ensure it works.
      return;
    }
    else {
      fbApi({endpoint: resp.paging.next, fields: options}, function(resp){
        getData(resp, data.concat(resp.data));
      });
    }
  };

  fbApi({endpoint: endPoint, fields: options}, function(resp){
    console.log('first set of data', resp);
    getData(resp, resp.data);
  });
}


// var validatePermissionsAccepted = function(){
//   getAllPaginatedEntities('me/permissions', {access_token: window.FB_TOKEN.getUserToken()}, function(permissions){
//     var permissionList = getAllFacebookPermissions(),
//         permissionDict = _.extend({}, _.values(permissionList)); //This might not work, check.

//     _.each(permissions, function(p,i,arr){
      
//     });
//   });
// }

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
      //var collectionManager = new CollectionManager();
      window.FB_TOKEN.collectionManager.getFacebookAccessTokensPromise()
        .then(function(tokens){
          if (tokens.hasUserToken()) {
            //At this point, the page/group tokens are not priority
            //They will be dealt with by their respective views
            //on instantiation, but must first store them in the 
            //global token singleton
            console.log('The tokens', tokens);
            _.each(tokens, function(t, i, arr){
              console.log('Token number', i, t);
            });

            var token = tokens.getUserToken();
            console.log('Currently existing user token', token);
            token.save({
              token: resp.authResponse.accessToken
            }, {
              patch: true,
              success: function(model, resp, opt) {
                console.log('Facebook Access Token updated successful.');
                // console.log('Saved model', model);
                // console.log('Resp object', resp);
                // console.log('Options object', opt);
                window.FB_TOKEN.setUserToken(model.get('token'), model.get('expiration'));
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
              token_type: "user",
              "@type": "FacebookAccessToken"
            });
            token.save(null, {
              success: function(model, resp, opt){
                console.log('New Facebook Access Token saved successfully.');
                // console.log('Saved model', model);
                // console.log('Resp object', resp);
                // console.log('Options object', opt);
                window.FB_TOKEN.setUserToken(model.get('token'), model.get('expiration'));
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
          //Maybe send them to the login page to sign up with facebook?
        }
        else {
          //Cache all current tokens, then update userToken accordingly.
          tokens.each(function(token,i,arr){
            var fb_id = token.get('object_fb_id'),
                t = token.get('token'),
                e = token.get('expiration');

            if (token.isPageToken()){
              window.FB_TOKEN.setPageToken(fb_id, t, e);
            }
            else if(token.isGroupToken()){
              window.FB_TOKEN.setGroupToken(fb_id, t, e);
            }
            else {
              //This might be unnecessary here
              window.FB_TOKEN.setUserToken(t,e);
            }
          });
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
                var state = new fbState(true, null, window.FB_TOKEN);
                renderView(state);
              });
            }
            else {
              //Token not expired, serve it up
              window.FB_TOKEN.setUserToken(userToken.get('token'), userToken.get('expiration'));
              var state = new fbState(true, null, window.FB_TOKEN);
              renderView(state);
            }
          }
        }
    });
}

var errorView = Marionette.ItemView.extend({
  template: '#tmpl-exportPostModal-fb-token-error',
  initialize: function(options){
    this.vent = options.vent; //Event Aggregator
    console.log('initializing errorView with options', options);
    if (options.ready === false) {
      if (options.errorState === 'permissions') {
        this.msg = i18n.gettext("Great! You already have a facebook account. Below are the list of permissions we need for the exportation process.");
        this.subMsg = i18n.gettext('Click here if you agree with these permissions.');
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
        that.vent.trigger("loadFbView", window.FB_TOKEN);
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

      //Fix error from pages initialization
      //Bring changes back into here. 
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
        ], 
        groups: this.userGroups
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

      //Set up pushing the page access tokens
      //
      //Very important

      var tokens = window.FB_TOKEN.getAllPageTokens();
      var that = this;
      if (!tokens){
        var access_token = window.FB_TOKEN.getUserToken();
        getAllPaginatedEntities("me/accounts", {
          access_token: access_token,
          fields: 'id,access_token,name'
        }, function(adminData){
          //The admin data is passed in.
          console.log('The admin Data', adminData);
          that.userAdmins = adminData; 
          getAllPaginatedEntities("me/likes", {
            access_token: access_token,
            fields: 'id,name'
          }, function(pageData){
            console.log('pageData', pageData);
            var _extraToAdd = [];
            that.userAdmins.forEach(function(admin, i, array){
              var p = _.find(pageData, function(page){
                return (page.id === admin.id)
              });
              if (!p) {
                _extraToAdd.push(admin);
              }
            });
            that.pages = pageData.concat(_extraToAdd); //Error starts from here

            //Save the admin tokens to the backend
            _.each(function(t,i,arr){
              var model = new Social.Facebook.Token.Model({
                token: t.access_token,
                object_fb_id: t.id,
                object_name: t.name,
                token_type: 'page',
                "@type": "FacebookAccessToken"
              });
              model.save(null, {
                success: function(model, resp, opt){
                  console.log('Page token saved successfully', model);
                  window.FB_TOKEN.setPageToken(
                    model.get('object_fb_id'),
                    model.get('token'),
                    model.get('expiration')
                  );
                },
                error: function(model, resp, opt){
                  //Cache locally for use then
                  //This is hacky, but set the cached expiration to 30 min from now
                  var expTime = 30 * 60; //30 min in seconds
                  window.FB_TOKEN.setPageToken(t.id, t.access_token, expTime);
                  console.error("Could not save page token to backend", resp);
                }
              });
            });
          });          
        });
      }
          //If expired, fetch them and store them
          //If not expired, use them to make the call
      else {
        //Check token expiry
        window.FB_TOKEN.getFacebookAccessTokensPromise()
          .then(function(tokens){
            //Tokens are already resolved at this point
            //If there are new tokens, must save them as well
            getAllPaginatedEntities("me/accounts", {
              access_token: access_token,
              fields: 'id,access_token,name'
            }, function(adminData){
              //First, check if any new tokens must be created
              var storedPageTokens = tokens.filter(function(token){
                return token.isPageToken();
              });
              var storedTokenMap = {};
              _.each(storedPageTokens, function(t,i,a){
                //Uniqueness constraint from DB ensures no duplicates
                storedTokenMap[t.id] = t;
              });
              _.each(adminData, function(t, i, arr){
                if ( !(_.has(storedTokenMap, t.id)) ){
                  var newPageToken = new Social.Facebook.Token.Model({
                    token_type: 'page',
                    object_fb_id: t.id,
                    token: t.access_token,
                    "@type": "FacebookAccessToken"
                  });
                  newPageToken.save(null, {
                    success: function(model, resp, opt){
                      console.log('Great! Added a new page admin token', mode);
                      window.FB_TOKEN.setPageToken(
                        model.get('object_fb_id'),
                        model.get('token'),
                        model.get('expiration')
                      )
                    },
                    error: function(model, resp, opt){
                      //Same as before, if fail, hacky solutoin
                      //Expires 30 min from now
                      window.FB_TOKEN.setPageToken(t.id, t.access_token, 30*60);
                      console.error('Failed to save new page token', mode);
                    }
                  });
                }
              });
              
              //Fix the error here to remove duplicates
              console.log('Error point reached');
            });
            
          });

      }

      //Update the screen
      that.userPages = pageData.concat(_extraToAdd);
      console.log('The admin pages', that.userAdmins);
      that.template = '#tmpl-exportPostModal-fb-page';
      that.render();

    },
    events: {
      'blur .js_fb-page-id': 'updatePageId',
      'change .js_fb-page-voice': 'updateSender'
    },
    updatePageId: function(e){
      var value = $(e.currentTarget)
                  .find('option:selected')
                  .val(); //This is botched

      _updateBundledData(this.bundle, {
        page_pageId: value 
      });
    },
    updateSender: function(e) {
      var value = this.$(event.currentTarget)
                      .find('option:selected')
                      .val();

      console.log('The options:selected', value);
      // _updateBundledData(this.bundle, {
      //   sender: {
      //     name: $(e.target).val()
      //   }
      // });
    },
    serializeData: function() {
      var tmp = [
          {value: 'null', description: ''},
          {value: 'self', description: 'Yourself'}
        ];

      var extras = _.map(this.userAdmins, function(admin){
        return {
          value: admin.id,
          description: admin.name
        };
      });
      

      return {
        userManagedPagesList: tmp.concat(extras),
        pages: this.pages
      };
    }

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
        credentials: window.FB_TOKEN,
        attachPic: null,
        attachSubject: null,
        attachCaption: null,
        attachDesc: null,
        sender: null,
      };

      this.vent.on("submitFacebook", this.submitForm, this);
    },
    serializeData: function(){
      return {
        messageBody: this.model.get('body')
      }
    },
    test: function(e) {
      // loginUser(function(){
      //   console.log('Successfully logged in and received a Facebook access token.');
      // });
      getAllPaginatedEntities("me/likes", {
        access_token: window.FB_TOKEN.getUserToken()
      }, function(data){
        console.log('I was able to paginate properly! ', data);
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
