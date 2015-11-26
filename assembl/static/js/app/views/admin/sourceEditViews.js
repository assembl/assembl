var Marionette = require('../../shims/marionette.js'),
    i18n = require('../../utils/i18n.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Promise = require('bluebird'),
    SourceViewBase = require('../sourceEditView.js');

//This needs to become the emailSourceEditView

var EmailSourceEditView = SourceViewBase.extend({
  template: '#tmpl-emailSource',

  fetchValue: function(){
    return 
  }

});

module.exports = {
  EmailSource: EmailSourceEditView
};
