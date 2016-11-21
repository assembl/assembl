"use strict";
/**
 * @module app.views.preferencesView
 */

var Marionette = require("../shims/marionette.js"),
    Backbone = require("backbone"),
    _ = require("underscore"),
    i18n = require("../utils/i18n.js"),
    Types = require("../utils/types.js"),
    Ctx = require("../common/context.js"),
    Permissions = require("../utils/permissions.js"),
    DiscussionPreference = require("../models/discussionPreference.js"),
    CollectionManager = require("../common/collectionManager.js"),
    AdminNavigationMenu = require('./admin/adminNavigationMenu.js'),
    UserNavigationMenu = require('./user/userNavigationMenu.js'),
    Growl = require('../utils/growl.js');

/**
 * @function app.views.preferencesView.getPreferenceEditView
 * Get the appropriate subclass of BasePreferenceView
 */
function getPreferenceEditView(preferenceModel, subViewKey) {
  var modelType = preferenceModel.value_type,
      subViewKey = (subViewKey !== undefined)?String(subViewKey).split('_'):undefined;
  while (true) {
    var isList = modelType.substring(0, 8) == "list_of_",
        isDict = modelType.substring(0, 11) == "strdict_of_";
    if (isList) {
      if (subViewKey !== undefined) {
        modelType = modelType.substring(8);
        subViewKey.shift();
      } else {
        return ListPreferenceView;
      }
    } else if (isDict) {
      if (subViewKey !== undefined) {
        modelType = modelType.substring(11);
        subViewKey.shift();
      } else {
        return StrDictPreferenceView;
      }
    } else {
      break;
    }
  }

  switch (modelType) {
    case "bool":
      return BoolPreferenceView;
    case "text":
      return TextPreferenceView;
    case "json":
      return JsonPreferenceView;
    case "int":
      return IntPreferenceView;
    case "string":
      return StringPreferenceView;
    case "langstr":
    {
      if (subViewKey !== undefined && subViewKey.length > 0) {
        return StringPreferenceView;
      } else {
        return LangStrPreferenceView;
      }
    }
    case "scalar":
      return ScalarPreferenceView;
    case "locale":
      return LocalePreferenceView;
    case "url":
      return UrlPreferenceView;
    case "email":
      return EmailPreferenceView;
    case "domain":
      return DomainPreferenceView;
    default:
      console.error("Not edit view for preference of type " + modelType);
      return undefined;
  }
}


/**
 * A single preference item
 * @class app.views.preferencesView.PreferencesItemView
 */
var PreferencesItemView = Marionette.LayoutView.extend({
  constructor: function PreferencesItemView() {
    Marionette.LayoutView.apply(this, arguments);
  },
  regions: {
    subview: ".js_prefItemSubview"
  },
  ui: {
    resetButton: ".js_reset",
    errorMessage: ".control-error",
    controlGroup: ".control-group"
  },
  events: {
    "click @ui.resetButton": "resetPreference",
  },
  template: "#tmpl-preferenceItemView",
  isKeyView: false,
  resetPreference: function() {
    var that = this, model = this.model;
    model.sync("delete", this.model, {
      success: function(model1, resp) {
        model.sync("read", model, {
          success: function(model2, resp2) {
            // this should be done by backbone, but isn't because we have a success?
            model.set(that.valueModelKey(), model2);
            // neutralize change
            model.changed = {};
            model._subcollectionCache = undefined;
            Growl.showBottomGrowl(Growl.GrowlReason.SUCCESS,
              i18n.gettext("Your settings were reset to default"));
            that.render();
          }, error: function(model, resp) {
            Growl.showBottomGrowl(Growl.GrowlReason.ERROR,
              i18n.gettext("Your settings were not be reset, but could not be read back."));
            resp.handled = true;
          }
        });
      }, error: function(model, resp) {
        Growl.showBottomGrowl(Growl.GrowlReason.ERROR,
          i18n.gettext("Your settings could not be reset."));
        resp.handled = true;
      }
    });
    return false;
  },
  initialize: function(options) {
    this.mainPrefWindow = options.mainPrefWindow;
    this.preferences = options.mainPrefWindow.preferences;
    this.key = options.key || this.model.id;
    this.listKey = options.listKey;
    this.preferenceData = options.mainPrefWindow.preferenceData[this.key];
    this.listCollectionView = options.listCollectionView;
    this.childViewOptions = {
        mainPrefWindow: options.mainPrefWindow,
        key: this.key,
        model: this.model,
        listKey: this.listKey,
        preferenceData: this.preferenceData,
        preferenceItemView: this,
        preference: this.model.get("value"),
    };
  },
  serializeData: function() {
    var model = this.model;
    if (this.listKey !== undefined) {
      var listKey = String(this.listKey).split("_"),
          lastKey = parseInt(listKey[listKey.length - 1]);
      model = this.listCollectionView.listView.submodels.models[lastKey];
    }
    return {
      i18n: i18n,
      preference: model.get(this.isKeyView ? "key" : "value"), // isKeyView of editview, really...
      preferenceData: this.preferenceData,
      canModify: this.mainPrefWindow.canSavePreference(this.key),
      listKey: this.listKey,
      inList: this.listKey !== undefined
    };
  },
  onRender: function() {
    var subview = getPreferenceEditView(this.preferenceData, this.listKey);
    if (subview) {
        this.getRegion("subview").show(new subview(this.childViewOptions));
    } else {
        console.error("Missing preference subview for ", this.preferenceData);
    }
  },
  showError: function(error) {
    this.ui.errorMessage.text(error);
    this.ui.errorMessage.removeClass("hidden");
    this.ui.controlGroup.addClass("error");
  },
  hideError: function(error) {
    this.ui.errorMessage.addClass("hidden");
    this.ui.errorMessage.text();
    this.ui.controlGroup.removeClass("error");
  }
});


/**
 * A single preference item in a ListPreferenceView
 * @class app.views.preferencesView.ListPreferencesItemView
 * @extends app.views.preferencesView.PreferencesItemView
 */
var ListPreferencesItemView = PreferencesItemView.extend({
  constructor: function ListPreferencesItemView() {
    PreferencesItemView.apply(this, arguments);
  },
  ui: {
    deleteButton: ".js_delete",
    errorMessage: ".control-error",
    controlGroup: ".control-group"
  },
  events: {
    "click @ui.deleteButton": "deleteItem"
  },
  template: "#tmpl-listPreferenceItemView",
  deleteItem: function(event) {
    this.model.collection.remove(this.model);
    this.listCollectionView.render();
    return false;
  },
});


/**
 * Abstract class for preference views
 * @class app.views.preferencesView.BasePreferenceView
 */
var BasePreferenceView = Marionette.LayoutView.extend({
  constructor: function BasePreferenceView() {
    Marionette.LayoutView.apply(this, arguments);
  },
  ui: {
    prefValue: ".pref_value"
  },
  events: {
    "change @ui.prefValue": "prefChanged"
  },
  template: "#tmpl-basePreferenceView",
  tagName: "span",
  isKeyView: false,
  valueModelKey: function() {
    return (this.isKeyView)?"key":"value";
  },
  initialize: function(options) {
    this.mainPrefWindow = options.mainPrefWindow;
    this.preferences = options.mainPrefWindow.preferences;
    this.key = options.key;
    this.preferenceData = options.mainPrefWindow.preferenceData[this.key];
    this.listKey = options.listKey;
    this.preferenceItemView = options.preferenceItemView;
  },
  prefChanged: function() {
    var value = this.getValue();
    try {
        value = this.processValue(value);
        this.preferenceItemView.hideError();
        this.model.set(this.valueModelKey(), value);
    } catch (err) {
        this.preferenceItemView.showError(err);
    }
  },
  getValue: function() {
    return this.ui.prefValue.val();
  },
  serializeData: function() {
    var preferenceValue = this.model.get(this.valueModelKey());
    return {
      i18n: i18n,
      preference: preferenceValue,
      preferenceData: this.preferenceData,
      canModify: this.mainPrefWindow.canSavePreference(this.key),
      inList: this.listKey !== undefined
    };
  },
  processValue: function(value) {
    return value;
  }
});

/**
 * View to set a Boolean preference
 * @class app.views.preferencesView.BoolPreferenceView
 * @extends app.views.preferencesView.BasePreferenceView
 */
var BoolPreferenceView = BasePreferenceView.extend({
  constructor: function BoolPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  template: '#tmpl-boolPreferenceView',
  getValue: function() {
    return this.ui.prefValue.filter(":checked").val() !== undefined;
  }
});


/**
 * View to set a text preference
 * @class app.views.preferencesView.TextPreferenceView
 * @extends app.views.preferencesView.BasePreferenceView
 */
var TextPreferenceView = BasePreferenceView.extend({
  constructor: function TextPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  template: '#tmpl-textPreferenceView'
});


/**
 * View to set a JSON value preference
 * @class app.views.preferencesView.JsonPreferenceView
 * @extends app.views.preferencesView.TextPreferenceView
 */
var JsonPreferenceView = TextPreferenceView.extend({
  constructor: function JsonPreferenceView() {
    TextPreferenceView.apply(this, arguments);
  },
  template: '#tmpl-jsonPreferenceView',
  processValue: function(value) {
    try {
        return JSON.parse(value);
    } catch (err) {
        throw i18n.gettext("This is not valid JSON: ") + err.message;
    }
  }
});


/**
 * View to set a string value preference
 * @class app.views.preferencesView.StringPreferenceView
 * @extends app.views.preferencesView.BasePreferenceView
 */
var StringPreferenceView = BasePreferenceView.extend({
  constructor: function StringPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  template: '#tmpl-stringPreferenceView'
});


/**
 * View for string preference, which is a key in a strdict_of_...
 * @class app.views.preferencesView.StringKeyPreferenceView
 * @extends app.views.preferencesView.StringPreferenceView
 */
var StringKeyPreferenceView = StringPreferenceView.extend({
  constructor: function StringKeyPreferenceView() {
    StringPreferenceView.apply(this, arguments);
  },
  isKeyView: true,
});



/**
 * A single preference item in a StrDictPreferenceView
 * @class app.views.preferencesView.DictPreferencesItemView
 * @extends app.views.preferencesView.PreferencesItemView
 */
var DictPreferencesItemView = PreferencesItemView.extend({
  constructor: function DictPreferencesItemView() {
    PreferencesItemView.apply(this, arguments);
  },
  ui: {
    deleteButton: ".js_delete",
    errorMessage: ".control-error",
    controlGroup: ".control-group"
  },
  regions: {
    key_subview: ".js_prefKeySubview",
    subview: ".js_prefValueSubview",
  },

  events: {
    "click @ui.deleteButton": "deleteItem"
  },
  template: "#tmpl-dictPreferenceItemView",
  deleteItem: function(event) {
    this.model.collection.remove(this.model);
    this.listCollectionView.render();
    return false;
  },
  keySubview: StringKeyPreferenceView,
  onRender: function() {
    var key_subview = this.keySubview;
    this.getRegion("key_subview").show(new key_subview(this.childViewOptions));
    var subview = getPreferenceEditView(this.preferenceData, this.listKey);
    if (subview) {
        this.getRegion("subview").show(new subview(this.childViewOptions));
    } else {
        console.error("Missing preference subview for ", this.preferenceData);
    }
  },

});



/**
 * View to set an integer value preference
 * @class app.views.preferencesView.IntPreferenceView
 * @extends app.views.preferencesView.StringPreferenceView
 */
var IntPreferenceView = StringPreferenceView.extend({
  constructor: function IntPreferenceView() {
    StringPreferenceView.apply(this, arguments);
  },
  processValue: function(value) {
    try {
        return Number.parseInt(value);
    } catch (err) {
        throw i18n.gettext("Please enter a number");
    }
  }
});



/**
 * View to set a scalar value preference (chosen from a set)
 * @class app.views.preferencesView.ScalarPreferenceView
 * @extends app.views.preferencesView.BasePreferenceView
 */
var ScalarPreferenceView = BasePreferenceView.extend({
  constructor: function ScalarPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  template: '#tmpl-scalarPreferenceView',
  serializeData: function() {
    var data = BasePreferenceView.prototype.serializeData.apply(this, arguments);
    // Note: This is unsorted. Maybe should by value?
    data.scalarOptions = data.preferenceData.scalar_values;
    return data;
  }
});


/**
 * View to set a locale value preference (chosen from the set of locales)
 * @class app.views.preferencesView.LocalePreferenceView
 * @extends app.views.preferencesView.ScalarPreferenceView
 */
var LocalePreferenceView = ScalarPreferenceView.extend({
  constructor: function LocalePreferenceView() {
    BasePreferenceView.apply(this, arguments);
    //ScalarPreferenceView.apply(this, arguments);
  },
  serializeData: function() {
    var data = ScalarPreferenceView.prototype.serializeData.apply(this, arguments);
    data.scalarOptions = Ctx.getLocaleToLanguageNameCache();
    return data;
  }
});


/**
 * View for locale preference, which is a key in a Langstring
 * @class app.views.preferencesView.LocaleKeyPreferenceView
 * @extends app.views.preferencesView.LocalePreferenceView
 */
var LocaleKeyPreferenceView = LocalePreferenceView.extend({
  constructor: function LocaleKeyPreferenceView() {
    LocalePreferenceView.apply(this, arguments);
  },
  isKeyView: true,
});


/**
 * A single preference item in a StrDictPreferenceView
 * @class app.views.preferencesView.StrDictPreferencesItemView
 * @extends app.views.preferencesView.DictPreferencesItemView
 */
var StrDictPreferencesItemView = DictPreferencesItemView.extend({
  constructor: function StrDictPreferencesItemView() {
    DictPreferencesItemView.apply(this, arguments);
  },
  keySubview: LocaleKeyPreferenceView,
});


/**
 * View to set a URL value preference
 * @class app.views.preferencesView.UrlPreferenceView
 * @extends app.views.preferencesView.StringPreferenceView
 */
var UrlPreferenceView = StringPreferenceView.extend({
  constructor: function UrlPreferenceView() {
    StringPreferenceView.apply(this, arguments);
  },
  regexp: new RegExp('^(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i'),
  processValue: function(value) {
    if (!this.regexp.test(value)) {
        throw i18n.gettext("This does not appear to be a URL");
    }
    return value;
  }
});


/**
 * View to set an email value preference
 * @class app.views.preferencesView.EmailPreferenceView
 * @extends app.views.preferencesView.StringPreferenceView
 */
var EmailPreferenceView = StringPreferenceView.extend({
  constructor: function EmailPreferenceView() {
    StringPreferenceView.apply(this, arguments);
  },
  regexp: new RegExp("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"),
  processValue: function(value) {
    if (!this.regexp.test(value)) {
        throw i18n.gettext("This does not appear to be an email");
    }
    return value;
  }
});


/**
 * View to set a domain (DNS name) value preference
 * @class app.views.preferencesView.DomainPreferenceView
 * @extends app.views.preferencesView.StringPreferenceView
 */
var DomainPreferenceView = StringPreferenceView.extend({
  constructor: function DomainPreferenceView() {
    StringPreferenceView.apply(this, arguments);
  },
  // too lenient: accepts single element ("com")
  regexp: new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\.[a-zA-Z]{2,3})$"),
  processValue: function(value) {
    if (!this.regexp.test(value)) {
        throw i18n.gettext("This does not appear to be a domain");
    }
    return value.toLowerCase();
  }
});


/**
 * The collection view for the items in a preference-as-list
 * @class app.views.preferencesView.ListSubviewCollectionView
 */
var ListSubviewCollectionView = Marionette.CollectionView.extend({
  constructor: function ListSubviewCollectionView() {
    Marionette.CollectionView.apply(this, arguments);
  },
  initialize: function(options) {
    this.mainPrefWindow = options.mainPrefWindow;
    this.preferences = options.preferences;
    this.key = options.key;
    this.listKey = options.listKey;
    this.listView = options.listView;
    this.preferenceData = options.preferenceData;
  },
  childViewOptions: function(model, index) {
    // This is bizarrely called before initialize;
    // then we have the options in the object
    var options = this.options;
    if (options === undefined) {
      options = this;
    }
    if (this.listKey != undefined) {
      index = this.listKey + "_" + index;
    }
    return {
      mainPrefWindow: options.mainPrefWindow,
      listCollectionView: this,
      preferences: options.preferences,
      key: options.key,
      preferenceData: options.preferenceData,
      isList: true,
      // or model itself?
      // model: this.collection.models[index],
      listKey: index
    };
  },
  childView: ListPreferencesItemView
});


/**
 * The collection view for the items in a preference-as-dict
 * @class app.views.preferencesView.DictSubviewCollectionView
 */
var DictSubviewCollectionView = Marionette.CollectionView.extend({
  constructor: function DictSubviewCollectionView() {
    Marionette.CollectionView.apply(this, arguments);
  },
  initialize: function(options) {
    this.mainPrefWindow = options.mainPrefWindow;
    this.preferences = options.preferences;
    this.key = options.key;
    this.listKey = options.listKey;
    this.listView = options.listView;
    this.preferenceData = options.preferenceData;
  },
  childViewOptions: function(model, index) {
    // This is bizarrely called before initialize;
    // then we have the options in the object
    var options = this.options;
    if (options === undefined) {
      options = this;
    }
    if (this.listKey != undefined) {
      index = this.listKey + "_" + index;
    }
    return {
      mainPrefWindow: options.mainPrefWindow,
      listCollectionView: this,
      preferences: options.preferences,
      key: options.key,
      preferenceData: options.preferenceData,
      isList: true,
      // model: this.collection.models[index],
      listKey: index
    };
  },
  childView: DictPreferencesItemView,
});


/**
 * The collection view for the items in a LangStr
 * @class app.views.preferencesView.StrDictSubviewCollectionView
 * @extends app.views.preferencesView.DictSubviewCollectionView
 */
var StrDictSubviewCollectionView = DictSubviewCollectionView.extend({
  constructor: function StrDictSubviewCollectionView() {
    DictSubviewCollectionView.apply(this, arguments);
  },
  childView: StrDictPreferencesItemView,
});


/**
 * A single preference which is a list
 * @class app.views.preferencesView.ListPreferenceView
 * @extends app.views.preferencesView.BasePreferenceView
 */
var ListPreferenceView = BasePreferenceView.extend({
  constructor: function ListPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  initialize: function(options) {
    BasePreferenceView.prototype.initialize.apply(this, arguments);
    this.submodels = this.model.valueAsCollection(this.preferenceData);
  },
  ui: {
    addToList: ".js_add_to_listpref"
  },
  regions: {
    listPreference: ".js_listPreference"
  },
  events: {
    "click @ui.addToList": "addToList"
  },
  template: "#tmpl-listPreferenceView",
  onRender: function() {
    var subview = new ListSubviewCollectionView({
      collection: this.submodels,
      mainPrefWindow: this.mainPrefWindow,
      preferences: this.preferences,
      key: this.key,
      listView: this,
      listKey: this.listKey,
      preferenceData: this.preferenceData,
    });
    this.showChildView("listPreference", subview);
  },
  addToList: function() {
    var defaultVal = this.preferenceData.item_default;
    if (_.isObject(defaultVal)) {
      // shallow clone, hopefully good enough
      defaultVal = _.clone(defaultVal);
    }
    // Note: Maybe it should not have an ID?
    var model = new DiscussionPreference.Model({
      id: null, value: defaultVal
    }, {parse: true});
    this.submodels.add([model]);
    this.render();
    return false;
  }
});



/**
 * A single preference which is a dict, with string keys
 * @class app.views.preferencesView.DictPreferenceView
 * @extends app.views.preferencesView.ListPreferenceView
 */
var StrDictPreferenceView = ListPreferenceView.extend({
  constructor: function StrDictPreferenceView() {
    ListPreferenceView.apply(this, arguments);
  },
  initialize: function(options) {
    // skip ListPreferenceView
    BasePreferenceView.prototype.initialize.apply(this, arguments);
    this.submodels = this.model.valueAsCollection(this.preferenceData);
  },
  subviewClass: DictSubviewCollectionView,
  onRender: function() {
    var subview = new this.subviewClass({
      collection: this.submodels,
      mainPrefWindow: this.mainPrefWindow,
      preferences: this.preferences,
      key: this.key,
      listView: this,
      listKey: this.listKey,
      preferenceData: this.preferenceData,
    });
    this.showChildView("listPreference", subview);
  },
  addToList: function() {
    var default_key = 'item_default';
    if (this.listKey !== undefined) {
      default_key += "_" + String(this.listKey).split('_').length;
    }
    var defaultVal = this.preferenceData[default_key];
    if (_.isObject(defaultVal)) {
      // shallow clone, hopefully good enough
      defaultVal = _.clone(defaultVal);
    }
    // Note: Maybe it should not have an ID?
    var model = new DiscussionPreference.Model({ key: "", value: defaultVal });
    this.submodels.add([model]);
    this.render();
    return false;
  },
});


/**
 * @class app.views.preferencesView.LangStrPreferenceView
 * @extends app.views.preferencesView.StrDictPreferenceView
 */
var LangStrPreferenceView = StrDictPreferenceView.extend({
  constructor: function LangStrPreferenceView() {
    StrDictPreferenceView.apply(this, arguments);
  },
  subviewClass: StrDictSubviewCollectionView,
});


/**
 * The list of all preferences
 * @class app.views.preferencesView.PreferencesCollectionView
 */
var PreferencesCollectionView = Marionette.CollectionView.extend({
  constructor: function PreferencesCollectionView() {
    Marionette.CollectionView.apply(this, arguments);
  },
  initialize: function(options) {
    this.mainPrefWindow = options.mainPrefWindow;
    this.childViewOptions = {
        mainPrefWindow: options.mainPrefWindow
    };
  },
  childView: PreferencesItemView
});


/**
 * Which preferences will we show?
 * @class app.views.preferencesView.PreferenceCollectionSubset
 */
var PreferenceCollectionSubset = Backbone.Subset.extend({
  constructor: function PreferenceCollectionSubset() {
    Backbone.Subset.apply(this, arguments);
  },
  beforeInitialize: function(models, options) {
    var preferenceData = options.parent.get("preference_data"),
        modifiable = _.filter(preferenceData.get("value"), this.prefDataSieve),
        keys = {};
    _.map(modifiable, function(pd) {
      keys[pd.id] = true;
    });
    this.keys = keys;
  },
  prefDataSieve: function(pd) {
    return true;
  },
  sieve: function(preference) {
    return this.keys[preference.id];
  }
});


/**
 * The subset of preferences which allow a per-user override
 * @class app.views.preferencesView.UserPreferenceCollectionSubset
 * @extends app.views.preferencesView.PreferenceCollectionSubset
 */
var UserPreferenceCollectionSubset = PreferenceCollectionSubset.extend({
  constructor: function UserPreferenceCollectionSubset() {
    PreferenceCollectionSubset.apply(this, arguments);
  },
  prefDataSieve: function(pd) {
    return pd.allow_user_override !== undefined && Ctx.getCurrentUser().can(pd.allow_user_override);
  }
});


/**
 * The subset of preferences which allow a per-discussion override
 * @class app.views.preferencesView.DiscussionPreferenceCollectionSubset
 * @extends app.views.preferencesView.PreferenceCollectionSubset
 */
var DiscussionPreferenceCollectionSubset = PreferenceCollectionSubset.extend({
  constructor: function DiscussionPreferenceCollectionSubset() {
    PreferenceCollectionSubset.apply(this, arguments);
  },
  prefDataSieve: function(pd) {
    return pd.show_in_preferences !== false;
  }
});


/**
 * The preferences window
 * @class app.views.preferencesView.PreferencesView
 */
var PreferencesView = Marionette.LayoutView.extend({
  constructor: function PreferencesView() {
    Marionette.LayoutView.apply(this, arguments);
  },
  template: "#tmpl-loader",
  ui: {
      saveButton: "#js_savePreferences"
  },
  events: {
      "click @ui.saveButton": "save"
  },
  regions: {
    preferenceCollView: "#js_preferences",
    navigationMenuHolder: '.navigation-menu-holder'
  },
  onRender: function() {
    if (this.template === "#tmpl-loader") {
        return;
    }
    var prefList = new PreferencesCollectionView({
        collection: this.preferences,
        mainPrefWindow: this});
    this.showChildView("preferenceCollView", prefList);
    this.showChildView("navigationMenuHolder", this.getNavigationMenu());
  },
  storePreferences: function(prefs) {
    var prefDataArray = prefs.get("preference_data").get("value"),
        prefData = {};
    _.map(prefDataArray, function(pref) {
        prefData[pref.id] = pref;
    });
    this.allPreferences = prefs;
    this.preferenceData = prefData;
    this.template = "#tmpl-preferenceView";
    this.render();
  },
  save: function() {
    var that = this, errors = [], complete = 0,
        toSave = this.allPreferences.filter(function(model) {
          return model.hasChanged();
        });
    function do_complete() {
      complete += 1;
      if (complete == toSave.length) {
        if (errors.length > 0) {
          var names = _.map(errors, function(id) {
            return that.preferenceData[id].name;
          });
          Growl.showBottomGrowl(Growl.GrowlReason.ERROR,
            i18n.gettext("The following settings were not saved: ") + names.join(", "));
        } else {
          Growl.showBottomGrowl(Growl.GrowlReason.SUCCESS,
            i18n.gettext("Your settings were saved!"));
        }
      }
    }
    if (toSave.length == 0) {
      Growl.showBottomGrowl(Growl.GrowlReason.SUCCESS,
            i18n.gettext("Your settings are up-to-date."));
    } else {
      _.map(toSave, function(model) {
          model.save(null, {
            success: function(model) {
              do_complete();
            },
            error: function(model, resp) {
              errors.push(model.id);
              do_complete();
              resp.handled = true;
            }
          });
      });
    }
    return false;
  }
});


/**
 * The discussion preferences window
 * @class app.views.preferencesView.DiscussionPreferencesView
 * @extends app.views.preferencesView.PreferencesView
 */
var DiscussionPreferencesView = PreferencesView.extend({
  constructor: function DiscussionPreferencesView() {
    PreferencesView.apply(this, arguments);
  },
  initialize: function() {
    var that = this,
        collectionManager = new CollectionManager();
    collectionManager.getDiscussionPreferencePromise().then(function(prefs) {
        that.preferences = new DiscussionPreferenceCollectionSubset([], {parent: prefs});
        that.storePreferences(prefs);
    });
  },
  canSavePreference: function(id) {
    var prefData = this.preferenceData[id];
    var neededPerm = prefData.modification_permission || Permissions.ADMIN_DISCUSSION;
    return Ctx.getCurrentUser().can(neededPerm);
  },
  getNavigationMenu: function() {
    return new AdminNavigationMenu({selectedSection: "discussion_preferences"});
  }
});


/**
 * The user preferences window
 * @class app.views.preferencesView.UserPreferencesView
 * @extends app.views.preferencesView.PreferencesView
 */
var UserPreferencesView = PreferencesView.extend({
  constructor: function UserPreferencesView() {
    PreferencesView.apply(this, arguments);
  },
  initialize: function() {
    var that = this,
        collectionManager = new CollectionManager();
    collectionManager.getUserPreferencePromise().then(function(prefs) {
        that.preferences = new UserPreferenceCollectionSubset([], {parent: prefs});
        that.storePreferences(prefs);
    });
  },
  canSavePreference: function(id) {
    var prefData = this.preferenceData[id];
    var neededPerm = prefData.allow_user_override;
    if (neededPerm === undefined) {  // vs null
       neededPerm = Permissions.P_READ;
    }
    return Ctx.getCurrentUser().can(neededPerm);
  },
  getNavigationMenu: function() {
    return new UserNavigationMenu({selectedSection: "discussion_preferences"});
  }
});


module.exports = {
    DiscussionPreferencesView: DiscussionPreferencesView,
    UserPreferencesView: UserPreferencesView
};

