'use strict';

var _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    // CollectionManager = require('..common/CollectionManager.js'),
    // Ctx = require('../common/context.js'),
    Wrapper = require('./abstract.js');

var Piwik = function(){
  Wrapper.call(this, arguements);
}

Piwik.prototype = Object.create(Wrapper.prototype);
Piwik.prototype.constructor = Piwik;
Piwik.prototype = {
  _invoke: function(methodName, args){
    if (this.usePaq) {
      this.engine.push([method].concat(args));
    }
    else {
      this.engine[method].apply(this, args);
    }
  },

  commit: function(){
    this._invoke('changeCurrentPage');
  },

  initialize: function(options){
    this.engine = options.engine;
    if ($.isArray(this.engine)) {
      this.usePaq = true;
    }
    else {
      this.usePaq = false;
    }
    this.setUserId();
  },

  setUserId: function(userId){
    if (userId) {
      this._invoke('setUserId', [userId]);
      this.commit();
    }
  }



};

module.exports = Piwik;
