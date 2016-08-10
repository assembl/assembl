'use strict';
/**
 * 
 * @module app.views.message
 */

var i18n = require('../utils/i18n.js'),
    MessageDeletedByUserView = require('./messageDeletedByUser.js');



/**
 * @class app.views.message.MessageDeletedByAdminView
 */
var MessageDeletedByAdminView = MessageDeletedByUserView.extend({
  constructor: function MessageDeletedByAdminView() {
    MessageDeletedByUserView.apply(this, arguments);
  },

  body: i18n.gettext("This message has been deleted by an administrator.")
});

module.exports = MessageDeletedByAdminView;

