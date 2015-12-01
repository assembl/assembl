var $ = require('../shims/jquery.js'),
    _ = require('../shims/underscore.js');

/*
    An easy to use growling function for use in Assembl

    If an alternative growling method is desired, please extend this file
    and sprinkle across code-base accordingly
 */
var GrowlReason = {
    SUCCESS: 'success',
    ERROR: 'error'
};

var defaultGrowlSettings = {
    ele: 'body',
    // type: either 'success' or 'error' 
    offset: {from: 'bottom', amount:20},
    align: 'left',
    delay: 4000,
    allow_dismiss: true,
    stackup_spacing: 10
};

var showBottomGrowl = function(growl_reason, msg){
  $.bootstrapGrowl(msg, _.extend(defaultGrowlSettings, {
    type: growl_reason
    }));
};

module.exports = {
    GrowlReason: GrowlReason,
    showBottomGrowl: showBottomGrowl
};
