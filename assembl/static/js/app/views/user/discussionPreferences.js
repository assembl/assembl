'use strict';

var Marionette = require('../../shims/marionette.js'),
    $ = require('../../shims/jquery.js'),
    i18n = require('../../utils/i18n.js'),
    UserNavigationMenu = require('./userNavigationMenu.js'),
    Promise = require('bluebird'),
    Ctx = require('../../common/context.js');

var discussionPreferences = Marionette.LayoutView.extend({
  template: '#tmpl-userDiscussionPreferences',
  className: 'admin-profile',
  ui: {
    close: '.bx-alert-success .bx-close',
    saveButton: '.js_saveButton',
    form: '.core-form .form-horizontal'
  },
  regions: {
    navigationMenuHolder: '.navigation-menu-holder'
  },
  preferencesKeys: ["simple_view_panel_order"],

  initialize: function() {
  },

  events: {
    'click @ui.saveButton': 'onSaveButtonClick',
    'click @ui.close': 'close'
  },

  serializeData: function() {
    return {
      //order_of_panels: 'NIM'
    };
  },

  onShow: function() {
    var menu = new UserNavigationMenu({selectedSection: "discussion_preferences"});
    this.getRegion('navigationMenuHolder').show(menu);

    this.showUpdatedPreferencesValues();
  },

  showUpdatedPreferencesValues: function(){
    var that = this;
    var preferences = this.preferencesKeys;
    preferences.forEach(function(preferenceKey){
        var promise = that.getReadUserPreferencePromise(preferenceKey);
        promise.then(function(res){
            that.$("#user_discussion_preferences_" + preferenceKey).val(res);
        }).catch(function(e) {
            console.error(e);
        });
    });
  },

  savePreferences: function(){
    var that = this;
    var preferences = this.preferencesKeys;
    preferences.forEach(function(preferenceKey){
        var preferenceValue = that.$("#user_discussion_preferences_" + preferenceKey).val();
        var promise = that.getSaveUserPreferencePromise(preferenceKey, preferenceValue);
        promise.then(function(res){
            console.log("settings successfully saved! => ", res);
            $.bootstrapGrowl(i18n.gettext('Your settings were saved'), {
              ele: 'body',
              type: 'success',
              offset: {from: 'bottom', amount:20},
              align: 'left',
              delay: 4000,
              allow_dismiss: true,
              stackup_spacing: 10
            });
        }).catch(function(e) {
            console.error(e);
        });
    });
  },

  getUserPreferenceURL: function(preferenceName){
    var user_id = Ctx.getCurrentUserId();
    var url = Ctx.getApiV2DiscussionUrl("all_users/" + user_id + "/preferences/" + preferenceName); // example: "http://localhost:6543/data/Discussion/6/all_users/244/preferences/simple_view_panel_order"
    return url;
  },

  getReadUserPreferencePromise: function(preferenceName){
    var url = this.getUserPreferenceURL(preferenceName);
    var promise = Promise.resolve($.get(url));
    promise.catch(function(e) {
        console.error(e);
    });
    return promise;
  },

  getSaveUserPreferencePromise: function(preferenceName, value){
    var url = this.getUserPreferenceURL(preferenceName);
    var data = '"' + value + '"';
    var promise = Promise.resolve($.ajax(
      url,
      {
        method: "PUT",
        contentType: "application/json",
        data: data
      }
    ));
    promise.catch(function(e) {
        console.error(e);
    });
    return promise;
  },

  onSaveButtonClick: function(e) {
    e.preventDefault();
    this.savePreferences();
  },

  templateHelpers: function() {
    return {
      urlDiscussion: function() {
        return '/' + Ctx.getDiscussionSlug() + '/';
      }
    }
  }
});

module.exports = discussionPreferences;
