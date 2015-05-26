'use strict';

var Backbone = require('backbone');

var FlipSwitchButtonModel = Backbone.Model.extend({
    defaults: {
        'isOn': false,
        'labelOn': 'on',
        'labelOff': 'off'
    },
    validate: function(attrs, options){
        if ( attrs.isOn !== false && attrs.isOne !== true )
            return "isOn attribute should be a boolean";
        return;
    }
});

module.exports = FlipSwitchButtonModel;
