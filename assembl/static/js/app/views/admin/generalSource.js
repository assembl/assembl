var Marionette = require('../../shims/marionette.js'),
    i18n = require('../../utils/i18n.js'),
    Types = require('../../utils/types.js'),
    Source = require('../../models/sources.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    EmailSourceEditView = require("./emailSettings.js"),
    FacebookSourceEditView = require("../facebookViews.js");

function getSourceEditView(model_type) {
  var form;
  switch (model_type) {
    case Types.IMAPMAILBOX:
    case Types.MAILING_LIST:
    case Types.ABSTRACT_FILESYSTEM_MAILBOX:
      return EmailSourceEditView;
    case Types.FACEBOOK_GENERIC_SOURCE:
    case Types.FACEBOOK_GROUP_SOURCE:
    case Types.FACEBOOK_GROUP_SOURCE_FROM_USER:
    case Types.FACEBOOK_PAGE_POSTS_SOURCE:
    case Types.FACEBOOK_PAGE_FEED_SOURCE:
    case Types.FACEBOOK_SINGLE_POST_SOURCE:
      return FacebookSourceEditView.init;
    default:
      console.error("Not edit view for source of type "+model_type);
      return;
  }
};



var ReadSource = Marionette.ItemView.extend({
    template: '#tmpl-adminDiscussionSettingsGeneralSourceRead',
    ui: {
        manualStart: '.js_manualStart'
    },

    modelEvents: {
        'change': 'updateView'
    },

    events: {
        'click @ui.manualStart': 'manualStart'
    },

    manualStart: function(evt){
        console.log('A manual start event was clicked');
    },

    serializeData: function(){
      // TODO: Name for the types
        return {
            name: this.model.get('name'),
            type: this.model.localizedName
        }
    },

    updateView: function(evt){
        this.render(); //Update 
    }
});

function getSourceDisplayView(model) {
  // TODO
  return ReadSource;
};


var SourceView = Marionette.LayoutView.extend({
  template: '#tmpl-adminDiscussionSettingsGeneralSource',
  regions: {
    readOnly: '.source-read',
    form: '.source-edit'
  },

  onShow: function(){
    var display_view = getSourceDisplayView(this.model);
    this.getRegion('readOnly').show(new display_view({model: this.model}));
    var editViewClass = getSourceEditView(this.model.get("@type"));
    if (editViewClass !== undefined) {
      this.getRegion('form').show(new editViewClass({model: this.model}));
    } else {
      this.getRegion('form').show("");
    }
  }
});


var CreateSource = Marionette.LayoutView.extend({
  template: '#tmpl-DiscussionSettingsCreateSource',
  regions: {
    edit_form: ".js_editform"
  },
  ui: {
    selector: ".js_contentSourceType",
    create_button: ".js_contentSourceCreate",
  },
  events: {
    'click @ui.create_button': 'createButton',
    'change @ui.selector': 'changeSubForm',
  },
  editView: undefined,
  serializeData: function() {
    var types = [
        Types.IMAPMAILBOX,
        Types.MAILING_LIST,
        Types.FACEBOOK_GROUP_SOURCE,
        Types.FACEBOOK_GROUP_SOURCE_FROM_USER,
        Types.FACEBOOK_PAGE_POSTS_SOURCE,
        Types.FACEBOOK_PAGE_FEED_SOURCE,
        Types.FACEBOOK_SINGLE_POST_SOURCE
      ],
      type_name_assoc = {};
      for (var i in types) {
        type_name_assoc[types[i]] = Source.getSourceClassByType(types[i]).prototype.localizedName;
      }
    return {
      types: types,
      type_names: type_name_assoc
    };
  },
  changeSubForm: function(ev) {
    var sourceType = ev.currentTarget.value;
    var editViewClass = getSourceEditView(sourceType);
    var modelClass = Source.getSourceClassByType(sourceType);
    if (editViewClass !== undefined && modelClass !== undefined) {
      this.editView = new editViewClass({model: new modelClass()});
      this.getRegion('edit_form').show(this.editView);
    } else {
      this.editView = undefined;
      this.getRegion('edit_form').show("");
    }
  },
  createButton: function(ev) {
    if (this.editView !== undefined) {
      this.editView.saveModel();
    }
  }
});


var DiscussionSourceList = Marionette.CollectionView.extend({
    // getChildView: getSourceDisplayView
    childView: SourceView
});


module.exports = {
    Item: ReadSource,
    Root: SourceView,
    CreateSource: CreateSource,
    DiscussionSourceList: DiscussionSourceList
}
