'use strict';
/**
 * Infobars for cookie and widget settings
 * @module app.models.infobar
 */

var Base = require("./base.js");

/**
 * Info bar model
 * @class app.models.infobar.InfobarModel
 * @extends app.models.base.BaseModel
 */

var InfobarModel = Base.Model.extend({
    constructor:function InfobarModel(){
        Base.Model.apply(this, arguments);
    }
});

/**
 * Widget bar model
 * @class app.models.infobar.WidgetInfobarModel
 * @extends app.models.infobar.InfobarModel
 */
 
var WidgetInfobarModel = InfobarModel.extend({
    constructor:function WidgetInfobarModel(){
        Base.Model.apply(this, arguments);
    }
});

/**
 * Cookie bar model
 * @class app.models.infobar.WidgetInfobarModel
 * @extends app.models.infobar.InfobarModel
 */
 
var CookieInfobarModel = InfobarModel.extend({
    constructor:function CookieInfobarModel(){
        Base.Model.apply(this, arguments);
    }
});

/**
 * Cookie and widget bars collection
 * @class app.models.infobar.InfobarsCollection
 * @extends app.models.base.BaseCollection
 */

var InfobarsCollection = Base.Collection.extend({
  constructor: function InfobarsCollection() {
    Base.Collection.apply(this, arguments);
  }
});

module.exports = {
    InfobarsCollection:InfobarsCollection,
    InfobarModel:InfobarModel,
    WidgetInfobarModel:WidgetInfobarModel,
    CookieInfobarModel:CookieInfobarModel,
};