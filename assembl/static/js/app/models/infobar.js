'use strict';
/**
 * 
 * @module app.models.infobar
 */

var Base = require("./base.js");

var InfobarsCollection = Base.Collection.extend({
  constructor: function InfobarsCollection() {
    Base.Collection.apply(this, arguments);
  }
});

var InfobarModel = Base.Model.extend({
    constructor:function InfobarModel(){
        Base.Model.apply(this, arguments);
    }
});

var WidgetInfobarModel = InfobarModel.extend({
    constructor:function WidgetInfobarModel(){
        Base.Model.apply(this, arguments);
    }
});

var CookieInfobarModel = InfobarModel.extend({
    constructor:function CookieInfobarModel(){
        Base.Model.apply(this, arguments);
    }
});

module.exports = {
    InfobarsCollection:InfobarsCollection,
    InfobarModel:InfobarModel,
    WidgetInfobarModel:WidgetInfobarModel,
    CookieInfobarModel:CookieInfobarModel,
};