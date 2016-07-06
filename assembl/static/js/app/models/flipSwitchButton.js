'use strict';
/**
 * Button to switch to less/more filter options
 * @module app.models.flipSwitchButton
 */
var Backbone = require('backbone');
/**
 * Flip switch button model
 * @class app.models.flipSwitchButton.FlipSwitchButtonModel
 */
var FlipSwitchButtonModel = Backbone.Model.extend({
  /**
   * Defaults
   * @type {Object}
   */
  defaults: {
    'isOn': false,
    'labelOn': 'on',
    'labelOff': 'off'
  },
  /**
   * Validate the model attributes
   * @function app.models.discussionSource.sourceModel.validate
   */
  validate: function(attrs, options) {
    if (attrs.isOn !== false && attrs.isOne !== true)
        return "isOn attribute should be a boolean";
    return;
  }
});

module.exports = FlipSwitchButtonModel;
