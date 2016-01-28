'use strict';

var Marionette = require('../../shims/marionette.js'),
    $ = require('../../shims/jquery.js'),
    i18n = require('../../utils/i18n.js'),
    AdminNavigationMenu = require('./adminNavigationMenu.js'),
    Promise = require('bluebird'),
    Ctx = require('../../common/context.js'),
    i18n = require('../../utils/i18n.js'),
    Growl = require('../../utils/growl.js');

var adminDiscussionPreferences = Marionette.LayoutView.extend({
  template: '#tmpl-top_loader',
  className: 'admin-profile',
  ui: {
    close: '.bx-alert-success .bx-close',
    saveButton: '.js_saveButton',
    form: '.core-form .form-horizontal'
  },
  regions: {
    navigationMenuHolder: '.navigation-menu-holder'
  },
  preferencesKeys: ["simple_view_panel_order", "require_email_domain", "default_allow_access_to_moderated_text", "translation_service"],
  preferencesValues: {},

  initialize: function() {
    var that = this;
    this.getReadUserPreferencePromise("preference_data").then(function(res){
          that.preferenceData = res;
          that.template = '#tmpl-adminDiscussionPreferences';
          that.render();
        }).catch(function(e) {
            console.error(e);
        });
  },

  events: {
    'click @ui.saveButton': 'onSaveButtonClick',
    'click @ui.close': 'close'
  },

  serializeData: function() {
    return {
      i18n: i18n,
      pref_data: this.preferenceData
    };
  },

  onShow: function() {
    var menu = new AdminNavigationMenu({selectedSection: "discussion_preferences"});
    this.getRegion('navigationMenuHolder').show(menu);

    this.showUpdatedPreferencesValues();
  },

  showUpdatedPreferencesValues: function(){
    var that = this;
    var preferences = this.preferencesKeys;
    preferences.forEach(function(preferenceKey){
        var promise = that.getReadUserPreferencePromise(preferenceKey);
        promise.then(function(res){
          that.preferencesValues[preferenceKey] = res;
          that.setUserInputPreferenceValue(preferenceKey, res);
        }).catch(function(e) {
            console.error(e);
        });
    });
  },

  savePreferences: function(){
    var that = this;
    var preferences = this.preferencesKeys;
    var promises = [];
    preferences.forEach(function(preferenceKey){
      var preferenceValue = that.getUserInputPreferenceValue(preferenceKey);
      if ( !(preferenceKey in that.preferencesValues) || preferenceValue != that.preferencesValues[preferenceKey] ){
        var promise = that.getSaveUserPreferencePromise(preferenceKey, preferenceValue);
        promise.catch(function(e) {
          console.error(e);
        });
        promises.push(promise);
      }
    });
    Promise.all(promises).then(function(res){
      Growl.showBottomGrowl(Growl.GrowlReason.SUCCESS, i18n.gettext("Your settings were saved!"));
    }).catch(function(e) {
        console.error(e);
    });
  },

  getUserInputPreferenceSelector: function(preferenceName){
    return "#admin_discussion_preferences_" + preferenceName;
  },

  getUserInputPreferenceValue: function(preferenceName){
    var selector = this.getUserInputPreferenceSelector(preferenceName);
    if ( this.preferenceData[preferenceName].value_type == "list_of_domain" ){ // preferences of type Array
      var inputVal = this.$(selector).val();
      var res = inputVal.split(",");
      res.forEach(function(el,index){
        res[index] = el.trim();
      });
      return res;
    }
    else if ( this.preferenceData[preferenceName].value_type == "bool" ){ // preferences of type Boolean, which show as checkboxes
      var val = this.$(selector).prop("checked");
      val = val ? true : false;
      return val;
    }
    else {
      return this.$(selector).val();
    }
  },

  setUserInputPreferenceValue: function(preferenceName, preferenceValue){
    var selector = this.getUserInputPreferenceSelector(preferenceName);
    if ( this.preferenceData[preferenceName].value_type == "list_of_domain" ){ // preferences of type Array
      var val = "";
      if ( preferenceValue instanceof Array ){
        val = preferenceValue.join(", ");
      }
      this.$(selector).val(val);
    }
    else if ( this.preferenceData[preferenceName].value_type == "bool") { // preferences of type Boolean, which show as checkboxes
      console.log("preferenceValue: ", preferenceValue);
      var val = preferenceValue ? true : false;
      this.$(selector).prop("checked", preferenceValue);
    }
    else {
      this.$(selector).val(preferenceValue);
    }
  },

  getUserPreferenceURL: function(preferenceName){
    var user_id = Ctx.getCurrentUserId();
    var url = Ctx.getApiV2DiscussionUrl("settings/" + preferenceName); // example: "http://localhost:6543/data/Discussion/6/settings/simple_view_panel_order"
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
    console.log("adminDiscussionPreferences::getSaveUserPreferencePromise(): ", preferenceName, value);
    var url = this.getUserPreferenceURL(preferenceName);
    var data = null;
    if ( (typeof value != "string") && !(value instanceof Array) && (typeof value != "boolean") ){
      console.log("warning, preference value should be a string or an array or a boolean. value received: ", value);
    }
    data = JSON.stringify(value);
    console.log("data we are going to send: ", data);
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

module.exports = adminDiscussionPreferences;
