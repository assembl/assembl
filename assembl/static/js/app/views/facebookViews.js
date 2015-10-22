'use strict';

var Marionette = require('../shims/marionette.js'),
    Backbone = require('../shims/backbone.js'),
    _ = require('../shims/underscore.js'),
    i18n = require('../utils/i18n.js'),
    $ = require('../shims/jquery.js'),
    Types = require('../utils/types.js'),
    Promise = require('bluebird'),
    Moment = require('moment'),
    CollectionManager = require('../common/collectionManager.js'),
    Social = require('../models/social.js'),
    Source = require('../models/sources.js');

var _allFacebookPermissions = undefined;
var getAllFacebookPermissions = function() {
  if (_allFacebookPermissions) { return _allFacebookPermissions;}
  else {
    _allFacebookPermissions = $('#js_fb-permissions-list').html().trim();
    return _allFacebookPermissions;
  }
};

//window.moment = Moment; //Purely debug
var _convertTimeToISO8601 = function(time) {
  var m = new Moment().utc().add(time, 'seconds');
  return m.toISOString();
};

var _composeMessageBody = function(model, creator) {
  var msg = i18n.sprintf(i18n.gettext("The following message was posted by %s on Assembl:\n\n\n"), creator.get('name'));

  msg += model.get('body');
  msg += "\n\n\n"

  msg += i18n.gettext("** Please be aware that comments below will be imported into an Assembl discussion **");
  return msg;
};

var _updateBundledData = function(bundle, updates) {
  //jQuery extend does deep copy
  //Nested object in bundle
  $.extend(bundle, updates);
};

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
var fb_token = function() {
  this.user = null;
  this.page = null;
  this.group = null;
  this.collectionManager = new CollectionManager();
  
  this.setExpiration = function(e, success) {
    var time = null;
    if (typeof e === 'number') {
      //Ensure that the incoming datetime has no timezone information
      //before adding the UTC timezone to it
      time = new Moment().utc().add(e, 'seconds');
    }
    else {
      var tzoneTime = new Social.Facebook.Token.Time().processTimeToUTC(e);
      time = new Moment(tzoneTime).utc();
    }

    success(time);
  };
};

fb_token.prototype = {
  setUserToken: function(token, expiration) {
    if (!this.user) {
      this.user = {
        token: null,
        expiration: null
      };
    }

    this.user.token = token;
    var that = this;
    this.setExpiration(expiration, function(value) {
      that.user.expiration = value;
    });
  },
  setPageToken: function(pageId, token, expiration) {
    if (!this.page) {
      this.page = {};
    }

    if (!this.page[pageId]) {
      this.page[pageId] = {};
    }

    this.page[pageId]['token'] = token;
    var that = this;
    this.setExpiration(expiration, function(value) {
      that.page[pageId]['expiration'] = value;
    });
  },
  setGroupToken: function(groupId, token, expiration) {
    if (!this.group) {
      this.group = {};
    }

    if (!this.group[groupId]) {
      this.group[groupId] = {};
    }

    this.group[groupId]['token'] = token;
    this.setExpiration(expiration, function(value) {
      that.group[groupId]['expiration'] = value;
    });
  },
  getUserToken: function() {
    if (_.has(this.user, 'token')) {
      return this.user.token;
    }
    else {
      return null;
    }
  },
  getPageToken: function(pageId) {
    if (!_.has(this.page, pageId)) {
      return null;
    }
    else {
      return this.page[pageId].token;
    }
  },
  getGroupToken: function(groupId) {
    if (!_.has(this.group, groupId)) {
      return null;
    }
    else {
      return this.group[groupId].token;
    }
  },
  getAllPageTokens: function() {
    return this.page;
  },
  getAllGroupTokens: function() {
    return this.group;
  },
  isUserTokenExpired: function() {
    if (this.user) {
      var now = Moment().utc();
      return now.isAfter(this.user.expiration);
    }
    else {
      //If there is no token, then it is equivalent to having
      //an expired token. Must get a new one and set it.
      return true;
    }
  },
  isPageTokenExpired: function(pageId) {
    if (this.page.hasOwnProperty(pageId)) {
      var now = new Moment().utc();
      return now.isAfter(this.page.expiration);
    }
    else {
      return true;
    }
  },
  isGroupTokenExpired: function(groupId) {
    if (this.group.hasOwnProperty(groupId)) {
      var now = new Moment().utc();
      return now.isAfter(this.group.expiration);
    }
    else {
      return true;
    }    
  }
};

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
};

// ********************************** DEBUGGING FUNCTIONS ********************************************************
var loginUser_fake = function(success) {
  var scope = getAllFacebookPermissions();
  window.FB.login(function(resp) {
    if (resp.status !== 'connected') {
      console.error("User did not accept the list of permissions");
    }
    else {
      window.FB_TOKEN.setUserToken(resp.authResponse.accessToken, resp.authResponse.expiresIn);
      success();
    }
  });
};

//For debugging purposes only
var checkState_shim = function(renderer) { 
  loginUser_fake(function() {
    var state = new fbState(true, null);
    renderer(state);
  });
};

//Also for debugging simple functions in the root view
var checkState_shim_2 = function(renderer) { 
  var state = new fbState(true, null, null);
  renderer(state);
};

// ***************************************************************************************************************

var fbApi = function(options, success, error) {
  var source = options.endpoint,
      httpType = options.http || 'get',
      qs = options.fields;

  window.FB.api(source, httpType, qs, function(resp) {
    if (_.has(resp, 'error')) {
      if (error !== 'function') {
        var eMessage = i18n.gettext('An error occured whilst communicating with Facebook. Close the box and try again.');
        $('.js_export_error_message').text(eMessage);
        console.error(resp.error);
      }
      else {
        error(resp); 
      }
    }
    else {
      success(resp);
    }
  });
};

//Might cause a stack overflow if the data is very large, or many many pages....
var getAllPaginatedEntities = function(endPoint, options, success) {
  /**
   * Appends the values from set2 into set1
   * @param  {[Object]} set1 Obj with key of {fb_id: data}
   * @param  {[Object]} set2 Obj with key of {fb_id: data}
   * @return {[Object]}      Obj with unique objects of {fb_id: data}
   */

  var getData = function(resp, data) {
    if (_.has(resp, 'paging') && _.has(resp.paging, 'next')) {
      fbApi({endpoint: resp.paging.next, fields: options}, function(resp) {
        getData(resp, data.concat(resp.data));
      });
    }
    else {
      var results = data.concat(resp.data); //Concat last page of data with current data 
      success(results); //results *COULD* have duplicates. Check downstream to ensure it works.
      return;      
    }
  };

  fbApi({endpoint: endPoint, fields: options}, function(resp) {
    getData(resp, resp.data);
  });
};

//Used to make a unique list from paginated data above.
//Must have an ID field in order to create a unique list
var uniqify = function(data) {
  var tmp = {};
  _.each(data, function(d, i, a) {
    if (!(_.has(tmp, d.id))) {
      tmp[d.id] = d;
    }
  });
  return _.values(tmp);
};

// var validatePermissionsAccepted = function(){
//   getAllPaginatedEntities('me/permissions', {access_token: window.FB_TOKEN.getUserToken()}, function(permissions){
//     var permissionList = getAllFacebookPermissions(),
//         permissionDict = _.extend({}, _.values(permissionList)); //This might not work, check.

//     _.each(permissions, function(p,i,arr){
      
//     });
//   });
// }

var _processLogin = function(resp, success, error) {

  window.FB_TOKEN.collectionManager.getFacebookAccessTokensPromise()
    .then(function(tokens) {
      if (tokens.hasUserToken()) {
        //At this point, the page/group tokens are not priority
        //They will be dealt with by their respective views
        //on instantiation, but must first store them in the 
        //global token singleton

        var token = tokens.getUserToken();
        //console.log('Currently existing user token', token);
        token.save({
          token: resp.authResponse.accessToken,
          expiration: _convertTimeToISO8601(resp.authResponse.expiresIn)
        }, {
          patch: true,
          success: function(model, resp, opt) {
            window.FB_TOKEN.setUserToken(model.get('token'), model.get('expiration'));
            success();
          },
          error: function(model, resp, opt) {
            window.FB_TOKEN.setUserToken(model.get('token'), model.get('expiration'));
            error();
          }
        }); 
      }
      else {
        //No user token, must make one
        var token = new Social.Facebook.Token.Model({
          token: resp.authResponse.accessToken,
          expiration: _convertTimeToISO8601(resp.authResponse.expiresIn),
          token_type: "user",
          "@type": "FacebookAccessToken"
        });
        token.save(null, {
          success: function(model, resp, opt) {
            window.FB_TOKEN.setUserToken(model.get('token'), model.get('expiration'));
            success()
          },
          error: function(model, resp, opt) {
            window.FB_TOKEN.setUserToken(model.get('token'), model.get('expiration'));
            error();
          }
        });
      }
    })
    .error(function(e){
      // Cannot get the access tokens from db
      console.error("Could not get the access tokens from the server");
      error();
    });
};

//Delete function for loggin user in. Will need this if user logs out of
//of facebook when form is active
var loginUser = function(success) {
  //Permissions are pre-rendered from the back-end
  //into a hidden div.
  var scope = getAllFacebookPermissions();
  window.FB.login(function(resp) {
    //Check list of permissions given to see if it matches what we asked.
    //If not, cannot continue
    //If yes, re-render the view.
    //Add event handlers for if things change
    if (resp.status !== 'connected') {
      console.error("The user was not logged into Facebook.");
      //Maybe add a red warning under the errorView that the login process failed ?
      $('.js_export_error_message').text(i18n.gettext("You did not log into facebook. Please log-in to continue."));
    }

    else {
      // TODO: Check permission list up to date
      // TODO: Add SDK Event handlers for if they sign out/revoke permissions
      _processLogin(resp, success);
    }
  }, {scope: scope });
};

var checkLoginState = function(options) {
  //Instead of using login function, use the loginState api call, force to get facebook information.
  //If they are not connected, ask to login with our permissions.
  //If they are logged in already, then update the token field!
  //If it fails, raise an error.
  
  window.FB.getLoginStatus(function(resp) {
    if (_.has(resp, 'error')) {
      var errorMessage = i18n.gettext("There was an issue with getting your Facebook login status. Please close this box and contact your discussion administrator.");
      $('.js_export_error_message').text(errorMessage);
    }
    else {
      if (resp.status !== 'connected') {
        options.error();
      }
      else {
        _processLogin(resp, options.success, options.error);
      }
    }
  }, true); //force to fetch status from server, instead of local cache
};

//Entry point in this module
var checkState = function(renderView) {
  //if this account IS a facebookAccount, then check for
  //permissions and move on
  var collectionManager = new CollectionManager();

  collectionManager.getAllUserAccountsPromise()
      .then(function(accounts) {
        // Assumes that there is only 1 facebook account per user
        if (!accounts.hasFacebookAccount()) {
          var state = new fbState(false, 'create', null);
          renderView(state);
          return false;
        }
        else {
          return collectionManager.getFacebookAccessTokensPromise()
        }
      })
      .then(function(tokens) {
        //If the Promise returns false, do nothing; the errorView has
        //already been created

        if (tokens !== false) {
          //Cache all current tokens, then update userToken accordingly.
          tokens.each(function(token, i, arr) {
            var fb_id = token.get('object_fb_id'),
                t = token.get('token'),
                e = token.get('expiration');

            if (token.isPageToken()) {
              window.FB_TOKEN.setPageToken(fb_id, t, e);
            }
            else if (token.isGroupToken()) {
              window.FB_TOKEN.setGroupToken(fb_id, t, e);
            }
            else {
              //This might be unnecessary here
              if (e === 'infinite'){
                var oneYearInSeconds = 60*60*24*365;
                window.FB_TOKEN.setUserToken(t,oneYearInSeconds);
              }
            }
          });
          var userToken = tokens.getUserToken();
          if (!userToken) {
            var state = new fbState(false, 'permissions', null);
            renderView(state);
          }
          else {
            // First check if it the user token is an infinite token
            if ( userToken.isInfiniteToken() ) {
              var oneYearInSeconds = 60*60*24*365; //Lazy hack
              window.FB_TOKEN.setUserToken(userToken.get('token'), oneYearInSeconds);
              var state = new fbState(true, null, window.FB_TOKEN);
              renderView(state);
            }

            //Check token expiry
            else if ( userToken.isExpired() ) {
              checkLoginState({
                success: function() {
                  var state = new fbState(true, null, window.FB_TOKEN);
                  renderView(state);
                },
                error: function() {
                  var state = new fbState(false, 'update-permissions', null);
                  renderView(state);
                } 
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
};

var errorView = Marionette.ItemView.extend({
  template: '#tmpl-exportPostModal-fb-token-error',
  initialize: function(options) {
    this.vent = options.vent; //Event Aggregator
    if (options.ready === false) {
      if (options.errorState === 'permissions') {
        this.msg = i18n.gettext("Great! You already have a facebook account. Below are the list of permissions we need for the exportation process.");
        this.subMsg = i18n.gettext('Click here if you agree with these permissions.');
        this.state = options.errorState;
      }
      else if (options.errorState === 'update-permissions') {
        this.msg = i18n.gettext("It appears that your session was expired. Click below to refresh your session. As always, below are the permissions that Assembl would need to continue.");
        this.subMsg = i18n.gettext('Click here to continue.');
        this.state = options.errorState;
      }
      else {
        this.msg = i18n.gettext("You must create an account. Warning: This will refresh the page");
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
  checkAndLoginUser: function(event) {
    if (this.state === 'permissions') {
      var that = this;
      loginUser(function() {
        //that.vent.trigger("loadFbView", window.FB_TOKEN);
        that.model.trigger('change', that.model);
        console.error("FIXME:  Need to re-render baseFbView");
      });
    }
    else {
      console.log('I will make an account');
      //this.vent.trigger('closeModal');
      Backbone.history.navigate('user/account', {trigger: true});
    }
  }
});

var groupView = Marionette.ItemView.extend({
  template: "#tmpl-loader",

  //template: '#tmpl-exportPostModal-fb-group',
  initialize: function(options) {
      this.bundle = options.bundle;
      this.vent = options.vent;
      var that = this;

      var opts = {
        access_token: window.FB_TOKEN.getUserToken(),
        fields: 'id,name'
      };
      getAllPaginatedEntities("me/groups", opts, function(groupData) {
        var cleanData = uniqify(groupData);
        that.userGroups = cleanData;

        that.template = '#tmpl-exportPostModal-fb-group';
        that.vent.trigger('clearError');
        that.render();
      });
    },
  events: {
      'change .js_fb-group-id': 'updateEndpoint'
    },
  updateEndpoint: function(e) {
      var value = $(e.currentTarget)
                  .find('option:selected')
                  .val();

      if (value !== 'null') {
        _updateBundledData(this.bundle, {
          endpoint: value + "/feed"
        });
      }
      else {
        _updateBundledData(this.bundle, {
          endpoint: null
        });
      }
      this.vent.trigger('clearError');
    },
  serializeData: function() {
      // var tmp = [
      //   {value: 'null', description: ''},
      //   {value: 'self', description: 'Yourself'}
      // ];
      var tmp = [{value: 'null', description: ''}];
      var m = _.map(this.userGroups, function(g) {
        return {id: g.id, name:g.name}
      });

      return { groups: tmp.concat(m) }
    }
});

var pageView = Marionette.ItemView.extend({
  template: '#tmpl-loader',

  //template: '#tmpl-exportPostModal-fb-page',
  initialize: function(options) {
      this.bundle = options.bundle;
      this.vent = options.vent;
      var that = this;
      var accountOptions = {
        access_token: window.FB_TOKEN.getUserToken(),
        fields: 'id,name,access_token'
      };
      getAllPaginatedEntities("me/accounts", accountOptions, function(adminData) {
        var cleanData = uniqify(adminData);
        that.userPages = cleanData;
        _.each(cleanData, function(d, i, a) {
          window.FB_TOKEN.setPageToken(d.id, d.access_token, 30 * 60); //hack - Give it a 30 min lifespan
        });

        var pageOptions = {
          access_token: window.FB_TOKEN.getUserToken(),
          fields: 'id,name'
        };
        getAllPaginatedEntities("me/likes", pageOptions, function(pageData) {
          var cleanedPages = uniqify(pageData);
          that.pages = cleanedPages;

          that.template = '#tmpl-exportPostModal-fb-page';
          that.render();
          that.vent.trigger('clearError');
        });
      });

    },
  events: {
      'change .js_fb-page-voice': 'updateSender',
      'change .js_fb-page-id': 'updateEndpoint'
    },
  updateEndpoint: function(e) {
      var value = this.$(e.currentTarget)
                      .find('option:selected')
                      .val();
      if (value !== 'null') {
        _updateBundledData(this.bundle, {
          endpoint: value + '/feed'
        });
      }
      else {
        _updateBundledData(this.bundle, {
          endpoint: null
        });
      }
      this.vent.trigger('clearError');
    },
  updateSender: function(e) {
      var value = this.$(e.currentTarget)
                      .find('option:selected')
                      .val();

      if (value === 'self' || value === 'null') {
        var t = window.FB_TOKEN.getUserToken();
        _updateBundledData(this.bundle, {
          credentials: window.FB_TOKEN.getUserToken()
        });
      }
      else {
        _updateBundledData(this.bundle, {
          credentials: window.FB_TOKEN.getPageToken(value)
        });
      }
    },
  serializeData: function() {
      var adminTmp = [
          {value: 'null', description: ''},
          {value: 'self', description: 'Yourself'}
        ];

      var extras = _.map(this.userPages, function(admin) {
        return {
          value: admin.id,
          description: admin.name
        };
      });

      var pageTmp = [{value: 'null', name: ''}];
      var pages = _.map(this.pages, function(page) {
        return {
          value: page.id,
          name: page.name
        }
      });
      
      return {
        userManagedPagesList: adminTmp.concat(extras),
        pages: pageTmp.concat(pages)
      };
    }

});

var exportPostForm = Marionette.LayoutView.extend({
  template: '#tmpl-loader',

  //template: "#tmpl-exportPostModal-fb",
  regions: {
    subform: '.fb-targeted-form'
  },
  events: {
    'change .js_fb-supportedList': 'defineView',
    'click .fb-js_test_area': 'test'
  },
  initialize: function(options) {
    this.token = options.token;
    this.exportedMessage = options.exportedMessage;
    this.vent = options.vent; //Event Aggregator
    this.bundle = {
        endpoint: null,
        credentials: window.FB_TOKEN.getUserToken(),
        attachPic: null,
        attachSubject: null,
        attachCaption: null,
        attachDesc: null
    };

    var that = this;
    var cm = new CollectionManager();
    cm.getDiscussionModelPromise().then(function(d) {
      that.topic = d.get('topic');
      that.desc = i18n.gettext('Assembl is a collective intelligence tool designed to enable open, democratic discussions that lead to idea generation and innovation.');
      that.template = '#tmpl-exportPostModal-fb';
      that.render();
      that.vent.trigger('clearError');
    });

  },
  serializeData: function() {
    return {
      exportedMessage: this.exportedMessage,
      suggestedName: this.topic,
      suggestedCaption: window.location.href,
      suggestedDescription: this.desc
    }
  },
  test: function(e) {
    console.log('User will never see this. Only for developers only!');
  },
  defineView: function(event) {
    var value = this.$(event.currentTarget)
    .find('option:selected')
    .val();

    switch (value) {
      case 'page':
        this.getRegion('subform').show(new pageView({
          token: this.token,
          bundle: this.bundle,
          vent: this.vent
        }));
        break;
      case 'group':
        this.getRegion('subform').show(new groupView({
          token: this.token,
          bundle: this.bundle,
          vent: this.vent
        }));
        break;
      case 'me':
        _updateBundledData(this.bundle, {
          endpoint: "me/feed"
        });
        this.vent.trigger('clearError');
        break;
      default:

        //This might be the wrong approach to emptying the region
        this.getRegion('subform').reset();
      _updateBundledData(this.bundle, {
        endpoint: null
      });
      break;
    }

  },
  saveModel: function(success, error) {
    var that = this,
        errorMsg = i18n.gettext("Facebook was unable to create the post. Close the box and try again.");
    var getName = function() {
      var tmp = $('.js_fb-suggested-name').val();
      if (!tmp) {
        return that.topic;
      }

      return tmp;
    };
    var getCaption = function() {
      var tmp = $('.js_fb-suggested-caption').val();
      if (!tmp) {
        return window.location.href;
      }

      return tmp;
    };
    var getDescription = function() {
      var tmp = $('.js_fb-suggested-description').val();
      if (!tmp) {
        return that.desc;
      }

      return tmp;
    };

    var endpoint = this.bundle.endpoint;
    var hasAttach = this.bundle.attachPic !== null;
    this.exportedMessage.getCreatorPromise().then(function(messageCreator) {
      var args = {
          access_token: that.bundle.credentials,
          message: _composeMessageBody(options.exportedMessage, messageCreator),
          link: window.location.href,

          //picture : 'http://' + window.location.host +"/" + Ctx.getApiV2DiscussionUrl() + "/mindmap",
          picture: 'http://assembl.coeus.ca/static/css/themes/default/img/crowd2.jpg', //Such a shit hack
          name: getName(),
          caption: getCaption(),
          description: getDescription()
      };

      if (!endpoint) {
        var er = i18n.gettext('Please select between pages, groups or your wall as the final destination to complete the form.');
        $('.js_export_error_message').text(er);
      }
      else {
        fbApi({endpoint: endpoint, http:'post', fields: args}, function(resp) {
          if (_.has(resp, 'error')) {
            console.error('There was an error with creating the post', resp.error);
            error(errorMsg);
          }
          else if (!(_.has(resp, 'id'))) {
            console.error('Facebook did not return the ID of the newly created post');
            error(errorMsg);
          } 
          else {
            var fbPostId = resp.id,
                sender = null,
                cm = new CollectionManager();

            // 1) Create the source
            // 2) Create the ContentsourceId
            // 3) POST for a newly created pull source reader
            // 4) Then call success

            errorMsg = i18n.gettext("Something went wrong on Assembl whilst creating your post. Please contact the Discussion administrator for more information.");
            cm.getAllUserAccountsPromise().then(function(accounts) {
              var fbAccount = accounts.getFacebookAccount();
              if (!fbAccount) {
                console.error('This account does NOT have a facebook account');
                error(errorDesc);
              }
              else {
                sender = fbAccount;
                that.model.set({
                  'fb_source_id': fbPostId,
                  'creator_id': sender.get("@id"),
                  'is_content_sink': true,
                  'sink_data': {'post_id': that.exportedMessage.id, 'facebook_post_id': fbPostId}
                });

                that.model.save(null, {
                  success: function(model, resp, op){
                    Promise.resolve($.ajax({
                      type: 'POST',
                      dataType: 'json',
                      url: model.url() + "/fetch_posts",
                      contentType: 'application/x-www-form-urlencoded'
                    })).then(function(resp){
                      if ( _.has(resp, "message") ) {
                        success();
                      }
                      else {
                        console.error("There was a server-side error");
                        error(errorDesc);
                      }
                    }).error(function(error){
                      console.error("There was an error creating the source");
                      error(errorDesc);
                    });
                  },

                  error: function(model, resp, op){
                    console.error('Could not create a Facebook source');
                    error(errorDesc);
                  }
                });
              }
            });
          }
        });  
      }
    });
  }


});

var FacebookSourceForm = Marionette.LayoutView.extend({
  template: '#tmpl-facebookSourceForm',
  regions: {
    'sourcePicker': ".source_picker"
  },
  ui: {
    lower_bound: ".js_lower_bound",
    upper_bound: ".js_upper_bound"
  },
  initialize: function(options) {
    this.token = options.token;
    this.vent = options.vent; //Event Aggregator
    this.bundle = {
        endpoint: null,
        credentials: window.FB_TOKEN.getUserToken()
    };
  },
  getModelData: function(sender) {
    var result = {
      creator_id: sender.get("@id"),
      endpoint: this.bundle.endpoint,
      sink_data: {}
    };
    var limit = this.ui.lower_bound.val();
    if (limit) {
      result.lower_bound = limit;
    }
    limit = this.ui.upper_bound.val();
    if (limit) {
      result.upper_bound = limit;
    }
    return result;
  },
  saveModel: function(success, error) {
    var that = this, cm = new CollectionManager();
    cm.getAllUserAccountsPromise().then(function(accounts) {
      var fbAccount = accounts.getFacebookAccount();
      if (!fbAccount) {
        console.error("This account does NOT have a facebook account");
        error(i18n.gettext("This account does NOT have a facebook account"));
      }
      else {
        that.model.set(that.getModelData(fbAccount));

        that.model.save(null, {
          success: function(model, resp, op){
            Promise.resolve($.ajax({
              type: 'POST',
              dataType: 'json',
              url: model.url() + "/fetch_posts",
              contentType: "application/x-www-form-urlencoded"
            })).then(function(resp){
              if ( _.has(resp, "message") ) {
                success();
              }
              else {
                console.error("There was a server-side error");
                error(i18n.gettext("Could not create the message source"));
              }
            }).error(function(error){
              console.error("There was an error creating the source");
              error(i18n.gettext("There was an error creating the message source"));
            });
          },
          error: function(model, resp, op) {
            console.error("Could not create a Facebook source");
            error(i18n.gettext("There was an error creating the message source"));
          }
        });
      }
    });
  }
});

var publicGroupSourceForm = FacebookSourceForm.extend({
  // TODO (with URL interpretation)
});

var privateGroupSourceForm = FacebookSourceForm.extend({
  onBeforeShow: function() {
    this.groupView = new groupView({
          token: this.token,
          bundle: this.bundle,
          vent: this.vent
        });
    this.getRegion("sourcePicker").show(this.groupView);
  },
  getModelData: function(sender) {
    if (this.bundle.endpoint) {
      var endpoint = this.bundle.endpoint,
          groupId = endpoint.substr(0, endpoint.length - 5),
          modelData = Object.getPrototypeOf(Object.getPrototypeOf(this)).getModelData.apply(this, arguments);
      modelData.fb_source_id = groupId;
      return modelData;
    }
  }
});

var pageSourceForm = FacebookSourceForm.extend({
  onBeforeShow: function() {
    this.pageView = new pageView({
          token: this.token,
          bundle: this.bundle,
          vent: this.vent
        });
    this.getRegion("sourcePicker").show(this.pageView);
  },
  getModelData: function(sender) {
    if (this.bundle.endpoint) {
      var endpoint = this.bundle.endpoint,
          pageId = endpoint.substr(0, endpoint.length - 5),
          modelData = Object.getPrototypeOf(Object.getPrototypeOf(this)).getModelData.apply(this, arguments);
      modelData.fb_source_id = pageId;
      return modelData;
    }
  }
});

var basefbView = Marionette.LayoutView.extend({
  template: '#tmpl-sourceFacebook',
  ui: {
    root: '.js_facebook_view'
  }, 
  regions: {
    subForm: '@ui.root'
  },
  events: {
    'click .js_ok_submit': 'submitForm'
  },
  modelEvents: {
    "change": "render"
  },
  initialize: function(options){
    this.vent = _.extend({}, Backbone.Events);
    this.model = options.model;
    this.exportedMessage = options.exportedMessage;
  },

  onShow: function(){
    var that = this;
    checkState(function(fbState) {
      console.log('The state of the checkState function', fbState);
      if (fbState.ready) {
        var fbView;
        if (that.exportedMessage) {
          fbView = new exportPostForm({
            model: that.model,
            exportedMessage: that.exportedMessage,
            vent: that.vent
          });
        } else {
          var viewClass;
          switch (that.model.get('@type')) {
            case Types.FACEBOOK_GROUP_SOURCE_FROM_USER:
              viewClass = privateGroupSourceForm;
              break;
            case Types.FACEBOOK_PAGE_FEED_SOURCE:
            case Types.FACEBOOK_PAGE_POSTS_SOURCE:
              viewClass = pageSourceForm;
              break;
            case Types.FACEBOOK_GROUP_SOURCE:
              viewClass = publicGroupSourceForm;
              break;
            case Types.FACEBOOK_SINGLE_POST_SOURCE:
              viewClass = exportPostForm;
              break;
            default:
              console.error("unknown type " + that.model.get('@type'));
          }
          if (viewClass) {
            fbView = new viewClass({
              model: that.model,
              vent: that.vent
            });
          }
        }
        that.fbView = fbView;
        if (fbView) {
          that.subForm.show(fbView);
        } else {
          that.subForm.show("");
        }
      }
      else {
        var errView = new errorView({
          ready: fbState.ready,
          errorState: fbState.errorState,
          vent: that.vent,
          model: that.model
        });

        that.subForm.show(errView);
      }
    });

  },
  submitForm: function(e) {
    console.log('submitting form');
    e.preventDefault();
    this.saveModel();
  },
  saveModel: function() {
    // FIXME: @benoitg Where is formType supposed to come from?
    // Nowhere in the code
    if (false && !this.formType) {
      console.log('Cannot continue. Form is incomplete.');
      var er = i18n.gettext("Please select a destination to export to before continuing");
      $('.js_export_error_message').text(er);
    }
    else if (!this.fbView) {
     var er = i18n.gettext("Please complete facebook login");
      $('.js_export_error_message').text(er); 
    } else {
      var that = this;
      console.log('currentView', this.currentView);
      this.fbView.saveModel(function() {
        //that.destroy();
      }, function(msg) {
        that.$('.js_export_error_message').text(msg);
      });
    }
  },

});

module.exports = {
  init: basefbView
};
