'use strict';

var Base = require("./base.js");

var InfobarItemCollection = Base.Collection.extend({
  constructor: function InfobarCollection() {
    Base.Collection.apply(this, arguments);
  }
});


var InfobarItemModel = Base.Model.extend({
    constructor:function InfobarItemModel(){
        Base.Model.apply(this, arguments);
    }
});


var WidgetInfobarItemModel = InfobarItemModel.extend({
    constructor:function WidgetInfobarItemModel(){
        Base.Model.apply(this, arguments);
    }
});

var CookieInfobarItemModel = InfobarItemModel.extend({
    constructor:function CookieInfobarItemModel(){
        Base.Model.apply(this, arguments);
    }
});

module.exports = {
    InfobarItemCollection:InfobarItemCollection,
    InfobarItemModel:InfobarItemModel,
    WidgetInfobarItemModel:WidgetInfobarItemModel,
    CookieInfobarItemModel:CookieInfobarItemModel,
};