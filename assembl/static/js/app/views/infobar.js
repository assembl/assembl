'use strict';

var Marionette = require('../shims/marionette.js'),
    Assembl = require('../app.js'),
    CookiesManager = require("../utils/cookiesManager.js"),
    Widget = require('../models/widget.js'),
    Ctx = require('../common/context.js'),
    $ = require('jquery');

var CookieInfobarItemView = Marionette.LayoutView.extend({
  constructor: function CookiebarItem() {
    Marionette.LayoutView.apply(this, arguments);
  },
  template: '#tmpl-cookieBanner',
  ui:{
    cookiesBtn:"#js_cookie-btn"
  },
  events:{
    "click @ui.cookiesBtn":"openCookiesSettings"
  },
  openCookiesSettings:function(){
    var piwikIframe = new PiwikIframeModal();
    Assembl.slider.show(piwikIframe); 
    CookiesManager.setCookiesAuthorization();
    this.closeInfobar();
  },
  closeInfobar: function() {
    this.destroy();
    this.model.set("closeInfobar", true);
    Assembl.vent.trigger('infobar:closeItem');
  }
});

var PiwikIframeModal = Backbone.Modal.extend({
  constructor: function PiwikIframeModal(){
    Backbone.Modal.apply(this, arguments);
  },
  template: '#tmpl-piwikIframeModal',
  className: 'modal-ckeditorfield popin-wrapper',
  keyControl:false,
  cancelEl: '.close'
});

var WidgetInfobarItemView = Marionette.LayoutView.extend({
  constructor: function InfobarItem() {
    Marionette.LayoutView.apply(this, arguments);
  },
  template: '#tmpl-infobar',
  className: 'content-infobar',
  ui: {
    button: ".btn"
  },
  events: {
    "click @ui.button": "onButtonClick",
    'click .js_closeInfobar': 'closeInfobar',
    'click .js_openSession': 'openSession',
    'click .js_openTargetInModal': 'openTargetInModal'
  },
  onButtonClick: function(evt) {
    if ( evt && _.isFunction(evt.preventDefault) ){
      evt.preventDefault();
    }
    var context = Widget.Model.prototype.INFO_BAR;
    var openTargetInModalOnButtonClick = (this.model.getCssClasses(context).indexOf("js_openTargetInModal") != -1);
    if ( openTargetInModalOnButtonClick !== false ) {
      var options = {
        footer: false
      };
      Ctx.openTargetInModal(evt, null, options);
    }
    else {
      this.model.trigger("buttonClick", context);
    }
    return false;
  },
  serializeModel: function(model) {
    return {
      model: model,
      message: model.getDescriptionText(Widget.Model.prototype.INFO_BAR),
      call_to_action_msg: model.getLinkText(Widget.Model.prototype.INFO_BAR),
      share_link: model.getShareUrl(Widget.Model.prototype.INFO_BAR),
      widget_endpoint: model.getUrl(Widget.Model.prototype.INFO_BAR),
      call_to_action_class: model.getCssClasses(Widget.Model.prototype.INFO_BAR),
      locale: Ctx.getLocale(),
      shows_button: model.showsButton(Widget.Model.prototype.INFO_BAR)
    };
  },
  closeInfobar: function() {
    this.destroy();
    this.model.set("closeInfobar", true);
    Assembl.vent.trigger('infobar:closeItem');
  }
});

var InfobarsView = Marionette.CollectionView.extend({
  constructor: function Infobars() {
    Marionette.CollectionView.apply(this, arguments);
  },
  getChildView:function(item){
    if(item.get('@type')){
      return WidgetInfobarItemView;
    }else{
      return CookieInfobarItemView;
    }
  },
  initialize: function(options) {
    this.childViewOptions = {
      parentPanel: this
    };
    this.adjustInfobarSize();
  },
  collectionEvents: {
    "add remove reset change": "adjustInfobarSize"
  },
  //TO DO: refactor because should not be necessary to set the top of 'groupContainer' in js file
  adjustInfobarSize: function(evt) {
    var el = Assembl.groupContainer.$el;
    var n = this.collection.length;
    this.collection.each(function(itemView){
      if(itemView.get('closeInfobar')){
        n--;
      }
    });
    for (var i = n - 2; i <= n + 2; i++) {
      if (i === n) {
        el.addClass("hasInfobar-" + String(i));
      } else {
        el.removeClass("hasInfobar-" + String(i));
      }
    }
  }
});

module.exports = {
  InfobarsView: InfobarsView
};
