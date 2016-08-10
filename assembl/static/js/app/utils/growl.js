/**
 * 
 * @module app.utils.growl
 */
var $ = require('jquery'),
    _ = require('underscore');

/*
    An easy to use growling function for use in Assembl

    If an alternative growling method is desired, please extend this file
    and sprinkle across code-base accordingly
 */
var GrowlReason = {
    SUCCESS: 'success',
    ERROR: 'danger'
};

var defaultGrowlSettings = {
    ele: 'body',
    // type: either 'success' or 'error' 
    offset: {from: 'bottom', amount:20},
    align: 'right',
    delay: 4000,
    allow_dismiss: true,
    stackup_spacing: 10
};

var showBottomGrowl = function(growl_reason, msg, settings){
  var mergedSettings = _.extend(defaultGrowlSettings, {
    type: growl_reason
  });
  mergedSettings = _.extend(mergedSettings, settings);
  $.bootstrapGrowl(msg, mergedSettings);
};

module.exports = {
    GrowlReason: GrowlReason,
    showBottomGrowl: showBottomGrowl
};
