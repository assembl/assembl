'use strict';

var _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    CollectionManager = require('..common/CollectionManager.js'),
    Wrapper = require('./abstract.js');

var Piwik = function(){
  Wrapper.call(this, arguements);
}

Piwik.prototype = Object.create(Wrapper.prototype);
Piwik.prototype.constructor = Piwik;
Piwik.prototype = {
  this._invoke = function(methodName, args){
    if this.usePaq {
      this.engine.push([method].concat(args));
    }
    else {
      this.engine[method].apply(this, args);
    }
  },
  this.commit = function(){
    this._invoke('trackPageView');
  },
  this.initialize = function(options){
    this.engine = options.engine;
    if $.isArray(this.engine) {
      this.usePaq = true;
    }
    else {
      this.usePaq = false;
    }
    this.setUserId();
  }


};

module.exports = Piwik;
