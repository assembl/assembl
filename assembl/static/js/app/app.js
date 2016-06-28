'use strict';
/**
 * App initialization.
 * @module app.app
 */

var Marionette = require('./shims/marionette.js'),
    $ = require('jquery'),
    classlist = require('classlist-polyfill'),
    Raven = require('raven-js'),
    _ = require('underscore');

var App = new Marionette.Application();

App.addInitializer(function() {
  App.addRegions({
    headerRegions: '#header',
    infobarRegion: '#infobar',
    groupContainer: '#groupContainer',
    contentContainer: '#content-container',
    slider: '#slider'
  })
});

App.on('start', function() {
  if (Backbone.history) {
    Backbone.history.start({
      pushState: true,
      root: '/' + $('#discussion-slug').val()
    });

    if (Backbone.history._hasPushState) {
      $(document).delegate("a", "click", function(evt) {
        var href = $(this).attr("href");
        var protocol = this.protocol + "//";

        // Note that we only care about assembl #tags.
        // We should prefix ours. For now, detect annotator.
        if (_.any(this.classList, function(cls) {
          return cls.indexOf('annotator-') === 0;
        })) return;
        if (typeof href !== 'undefined' && href.slice(protocol.length) !== protocol && /^#.+$/.test(href)) {
          evt.preventDefault();
          Backbone.history.navigate(href, true);
        }
      });
    }
  }
  // Temporary code for Catalyst demo
  var that = this;
  function messageListener(event) {
    try {
      var data = event.data,
          dlen = data.length;
      if (dlen > 2 && data[dlen-2] == ",") {
        // bad json
        data = data.substring(0, dlen-2) + data[dlen-1];
      }
      data = JSON.parse(data);
      if (data.event == "click" && data.target.substring(0, 11) == "local:Idea/") {
        // TODO: look for right group. Also handle Content.
        that.vent.trigger('DEPRECATEDideaList:selectIdea', data.target);
      }
    } catch (e) {}
  }
  if (window.addEventListener){
    addEventListener("message", messageListener, false);
  } else {
    attachEvent("onmessage", messageListener);
  }
    
    if (activate_tour /*&& (currentUser.isUnknownUser() || currentUser.get('is_first_visit'))*/) {
      var TourManager = require('./utils/tourManager.js'),
          tourManager = new TourManager();
      this.tourManager = tourManager;
      tourManager.listenTo(this.vent, "requestTour", function(tourName) {
        if (tourName === undefined) {
          console.error("undefined tour name");
        } else {
          tourManager.requestTour(tourName);
        }
      });
    }
});

App.on('start', function() {
  // Tell Explorer not to cache Ajax requests.
  // http://stackoverflow.com/questions/4303829/how-to-prevent-a-jquery-ajax-request-from-caching-in-internet-explorer
  $.ajaxSetup({ cache: false });

  // change dynamically tab title
  document.title = document.querySelector('#discussion-topic').value; // not needed anymore on the debate page

  // change dynamically favicon in tab
  var link = document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = '/static/img/icon/infinite-1.png';
  document.getElementsByTagName('head')[0].appendChild(link);

});

_.extend(Backbone.Marionette.View.prototype, {
  /*
   * Use to check if you should (re)render
   */
  isViewRenderedAndNotYetDestroyed: function() {
    if (this.isRendered === true && this.isDestroyed === false) {
      return true;
    }
    else {
      return false;
    }
  },

  listenTo: function() {
    var that = this;
    // Often, we listen on a promise in the initalizer. The view may already be dead.
    Raven.context(function() {
      if (that.isViewDestroyed()) {
        throw new Error("listenTo on a destroyed view");
      }
    });

    Object.getPrototypeOf(Backbone.Marionette.View.prototype).listenTo.apply(this, arguments);
  },

  listenToOnce: function() {
    var that = this;
    // Often, we listen on a promise in the initalizer. The view may already be dead.
    Raven.context(function() {
      if (that.isViewDestroyed()) {
        throw new Error("listenToOnce on a destroyed view");
      }
    });

    Object.getPrototypeOf(Backbone.Marionette.View.prototype).listenToOnce.apply(this, arguments);
  },

  /*
   * Use to check if you should (re)render
   */
  isViewDestroyed: function() {
    return this.isDestroyed;
  },

  /* Use to check if you already rendered at least once
   */
  isViewRendered: function() {
   return this.isRendered;
 },
});

module.exports = App;
