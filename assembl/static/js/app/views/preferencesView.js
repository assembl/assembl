"use strict";

var Marionette = require("../shims/marionette.js"),
    Backbone = require("../shims/backbone.js"),
    _ = require("../shims/underscore.js"),
    i18n = require("../utils/i18n.js"),
    Types = require("../utils/types.js"),
    Ctx = require("../common/context.js"),
    CollectionManager = require("../common/collectionManager.js");

function getPreferenceEditView(preferenceModel, subView) {
  var modelType = preferenceModel.value_type,
      isList = modelType.substring(0, 8) == "list_of_",
      useList = isList && !subView;
  if (useList) {
    return ListPreferenceView;
  } else if (isList) {
    modelType = modelType.substring(8);
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
    case "scalar":
      return ScalarPreferenceView;
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

var BasePreferenceView = Marionette.ItemView.extend({
  constructor: function BasePreferenceView() {
    Marionette.ItemView.apply(this, arguments);
  },
  template: "#tmpl-basePreferenceView",
  initialize: function(options) {
    this.mainPrefWindow = options.mainPrefWindow;
    this.preferences = options.mainPrefWindow.preferences;
    this.key = options.key;
    this.preferenceData = options.mainPrefWindow.preferenceData[this.key];
    this.listKey = options.listKey;
  },
  tagName: "span",
  serializeData: function() {
    var preferenceValue = this.model.get("value");
    if (this.listKey !== undefined) {
      preferenceValue = preferenceValue[this.listKey];
    }
    return {
      i18n: i18n,
      preference: preferenceValue,
      preferenceData: this.preferenceData,
      inList: this.listKey !== undefined
    };
  }
});

var BoolPreferenceView = BasePreferenceView.extend({
  constructor: function BoolPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  template: '#tmpl-boolPreferenceView'
});

var TextPreferenceView = BasePreferenceView.extend({
  constructor: function TextPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  template: '#tmpl-textPreferenceView'
});

var JsonPreferenceView = TextPreferenceView.extend({
  constructor: function JsonPreferenceView() {
    TextPreferenceView.apply(this, arguments);
  },
  template: '#tmpl-jsonPreferenceView'
});


var StringPreferenceView = BasePreferenceView.extend({
  constructor: function StringPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  template: '#tmpl-stringPreferenceView'
});


var IntPreferenceView = StringPreferenceView.extend({
  constructor: function IntPreferenceView() {
    StringPreferenceView.apply(this, arguments);
  }
});



var ScalarPreferenceView = BasePreferenceView.extend({
  constructor: function ScalarPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  template: '#tmpl-scalarPreferenceView'
});


var UrlPreferenceView = StringPreferenceView.extend({
  constructor: function UrlPreferenceView() {
    StringPreferenceView.apply(this, arguments);
  }
});


var EmailPreferenceView = StringPreferenceView.extend({
  constructor: function EmailPreferenceView() {
    StringPreferenceView.apply(this, arguments);
  }
});


var DomainPreferenceView = StringPreferenceView.extend({
  constructor: function DomainPreferenceView() {
    StringPreferenceView.apply(this, arguments);
  }
});


// The collection view for the items in a preference-as-list
var ListSubviewCollectionView = Marionette.CollectionView.extend({
  constructor: function ListSubviewCollectionView() {
    Marionette.CollectionView.apply(this, arguments);
  },
  childView: function() {
    return getPreferenceEditView(this.preferenceData, true);
  }
});

// A single preference which is a list
var ListPreferenceView = BasePreferenceView.extend({
  constructor: function ListPreferenceView() {
    BasePreferenceView.apply(this, arguments);
  },
  template: "#tmpl-listPreferenceView",
  childViewOptions: function(model, index) {
    return {
      key: model.id,
      model: this.model,
      mainPrefWindow: this.mainPrefWindow,
      listKey: index
    };
  }
});

// A single preference item
var PreferencesItemView = Marionette.LayoutView.extend({
  constructor: function PreferencesItemView() {
    Marionette.LayoutView.apply(this, arguments);
  },
  regions: {
    subview: ".js_prefItemSubview"
  },
  ui: {
    resetButton: ".js_reset"
  },
  events: {
    "click @ui.resetButton": "resetPreference"
  },
  resetPreference: function() {
    // Do we have the parent value? Probably not.
  },
  template: "#tmpl-preferenceItemView",
  initialize: function(options) {
    this.mainPrefWindow = options.mainPrefWindow;
    this.preferences = options.mainPrefWindow.preferences;
    this.preferenceData = options.mainPrefWindow.preferenceData[this.model.id];
    this.key = this.model.id;
    this.childViewOptions = {
        mainPrefWindow: options.mainPrefWindow,
        key: this.key,
        model: this.model
    };
    this.listKey = options.listKey;
  },
  serializeData: function() {
    var preferenceValue = this.model.get("value");
    if (this.listKey !== undefined) {
      preferenceValue = preferenceValue[this.listKey];
    }
    return {
      i18n: i18n,
      preference: preferenceValue,
      preferenceData: this.preferenceData,
      inList: this.listKey !== undefined
    };
  },
  onRender: function(){
    var subview = getPreferenceEditView(this.preferenceData);
    this.getRegion("subview").show(new subview(this.childViewOptions));
  }
});


// The list of all preferences
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


// Which preferences will we show?
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


var UserPreferenceCollectionSubset = PreferenceCollectionSubset.extend({
  constructor: function UserPreferenceCollectionSubset() {
    PreferenceCollectionSubset.apply(this, arguments);
  },
  prefDataSieve: function(pd) {
    return pd.allow_user_override !== undefined && Ctx.getCurrentUser().can(pd.allow_user_override);
  }
});


var DiscussionPreferenceCollectionSubset = PreferenceCollectionSubset.extend({
  constructor: function DiscussionPreferenceCollectionSubset() {
    PreferenceCollectionSubset.apply(this, arguments);
  },
  prefDataSieve: function(pd) {
    return pd.show_in_preferences !== false;
  }
});


// The preferences window
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
      preferenceCollView: "#js_preferences"
  },
  onRender: function() {
    if (this.template === "#tmpl-loader") {
        return;
    }
    var prefList = new PreferencesCollectionView({
        collection: this.preferences,
        mainPrefWindow: this});
    this.showChildView("preferenceCollView", prefList);
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
  }
});


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
  }
});


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
  }
});


module.exports = {
    DiscussionPreferencesView: DiscussionPreferencesView,
    UserPreferencesView: UserPreferencesView
};

