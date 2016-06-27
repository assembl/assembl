/**
 * 
 * @module app.views.admin.sourceEditViews
 */
var Marionette = require('../../shims/marionette.js'),
    i18n = require('../../utils/i18n.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Promise = require('bluebird'),
    SourceViewBase = require('../sourceEditView.js');

//This needs to become the emailSourceEditView

var EmailSourceEditView = SourceViewBase.extend({
  constructor: function EmailSourceEditView() {
    SourceViewBase.apply(this, arguments);
  },

  template: '#tmpl-emailSource',

  fetchValues: function(){
    return {
      name: this.$('#name').val(),
      admin_sender: this.$('#admin_sender').val(),
      post_email_address: this.$('#post_email_address').val(),
      host: this.$('#host').val(),
      use_ssl: this.$('#use_ssl:checked').val(),
      folder: this.$('#folder').val(),
      port: parseInt(this.$('#port').val()),
      username: this.$('#username').val(),
      password: this.$('#password').val()
    }
  }

});

module.exports = {
  EmailSource: EmailSourceEditView
};
