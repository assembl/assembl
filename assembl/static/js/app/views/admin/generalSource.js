var Marionette = require('../../shims/marionette.js'),
    i18n = require('../../utils/i18n.js'),
    Types = require('../../utils/types.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Promise = require('bluebird'),
    EmailSourceEditView = require("./emailSettings.js"),
    FacebookSourceEditView = require("../facebookViews.js");

function getSourceEditView(model) {
  var form;
  switch (model.get("@type")) {
    case Types.ABSTRACT_MAILBOX:
    case Types.IMAPMAILBOX:
    case Types.MAILING_LIST:
    case Types.ABSTRACT_FILESYSTEM_MAILBOX:
    case Types.MAILDIR_MAILBOX:
      form = EmailSourceEditView;
      break;
    case Types.FACEBOOK_GENERIC_SOURCE:
    case Types.FACEBOOK_GROUP_SOURCE:
    case Types.FACEBOOK_GROUP_SOURCE_FROM_USER:
    case Types.FACEBOOK_PAGE_POSTS_SOURCE:
    case Types.FACEBOOK_PAGE_FEED_SOURCE:
    case Types.FACEBOOK_SINGLE_POST_SOURCE:
      form = FacebookSourceEditView.init;
      break;
    default:
      console.error("Not edit view for source of type "+model.get("@type"));
      return;
  }
  return new form({model: model});
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
        return {
            name: this.model.get('name')
        }
    },

    updateView: function(evt){
        this.render(); //Update 
    }
});

function getSourceDisplayView(model) {
  // TODO
  return new ReadSource({model: model});
};


var Source = Marionette.LayoutView.extend({
  template: '#tmpl-adminDiscussionSettingsGeneralSource',
  regions: {
    readOnly: '.source-read',
    form: '.source-edit'
  },

  onShow: function(){
    var display_view = getSourceDisplayView(this.model);
    this.getRegion('readOnly').show(display_view);
    var edit_view = getSourceEditView(this.model);
    this.getRegion('form').show(edit_view);
  }
});


var DiscussionSourceList = Marionette.CollectionView.extend({
    childView: Source
});


module.exports = {
    Item: ReadSource,
    Root: Source,
    DiscussionSourceList: DiscussionSourceList
}
