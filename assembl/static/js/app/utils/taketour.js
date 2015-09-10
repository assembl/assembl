"use strict";

var Marionette = require('../shims/marionette.js'),
    i18n =  require('./i18n.js'),
    TourModel = require('../models/tour.js'),
    Ctx = require('../common/context.js'),
    _ = require('../shims/underscore.js');

// Tours
var onStart = require('./tours/onStart.js'),
    onShowSynthesis = require('./tours/onShowSynthesis.js');


var assembl_tours = [
    {
        name:"on_start",
        autostart: true,
        tour: onStart
    },
    {
        name:"on_show_synthesis",
        autostart: true,
        tour: onShowSynthesis
    }
];

var TourManager = Marionette.Object.extend({

  nextTours: [],
  tourModel: undefined,
  currentTour: undefined,
  // lastStep: undefined,

  initialize: function() {
    var that = this,
        currentUser = Ctx.getCurrentUser();
    this.user = currentUser;
    hopscotch.configure({
        onShow: function() {
          if (hopscotch.getCurrStepNum() + 1 == that.currentTour.tour.length) {
            that.beforeLastStep();
          }
            //that.$(".panel-body").scroll(that, that.scrollLogger);
        },
        onNext: function() {
            // need to scroll messageListPanel there.
        },
        i18n: {
            nextBtn: i18n.gettext('Next'),
            prevBtn: i18n.gettext('Back'),
            doneBtn: i18n.gettext('Done'),
            skipBtn: i18n.gettext('Skip'),
            closeTooltip: i18n.gettext('Close')
        }
    });
    hopscotch.listen('end', function() {
      that.afterLastStep();
    });
    if (!currentUser.isUnknownUser()) {
      this.tourModel = new TourModel.Model();
      this.tourModel.fetch({
        success: function() {
          that.initialize2();
        }});
    } else {
      this.initialize2();
    }
  },
  initialize2: function() {
    var that = this, toursById = {};
    for (var i in assembl_tours) {
        var tour = assembl_tours[i];
        tour.position = i;
        toursById[tour.name] = tour;
        if (tour.autostart && !this.isTourSeen(tour.name)) {
            this.nextTours.push(tour);
        }
    }
    this.toursById = toursById;

    if (this.nextTours.length > 0) {
      setTimeout(function() {
        that.currentTour = that.getNextTour(true);
        if (that.currentTour !== undefined)
          that.startCurrentTour();
      }, 4000);
    }
  },

  isTourSeen: function(tourName) {
      if (this.tourModel === undefined) {
        var seen = JSON.parse(window.localStorage.getItem('toursSeen') || "{}");
        return seen[tourName];
      } else {
          return this.tourModel.get(tourName);
      }
  },

  tourIsSeen: function(tourName) {
      if (this.tourModel === undefined) {
        var seen = {};
        try {
          JSON.parse(window.localStorage.getItem('toursSeen') || "{}");
        } catch (err) {
          console.error("wrong toursSeen in localStorage:" + err);
        }
        seen[tourName] = true;
        window.localStorage.setItem('toursSeen', JSON.stringify(seen));
      } else {
          this.tourModel.isSeen(tourName);
      }
  },

  getNextTour: function(remove) {
    while (this.nextTours.length > 0) {
      var tour = this.nextTours[0];
      if (tour.condition !== undefined) {
        if (!tour.condition()) {
            this.nextTours.shift();
            continue;
        }
      }
      if (remove) {
          return this.nextTours.shift();
      } else {
          return tour;
      }
    }
    return undefined;
  },

  requestTour: function(tourName) {
    var tour = this.toursById(tourName);
    if (tour === undefined) {
      console.error("Unknown tour: " + tourName);
      return;
    }
    if (this.isTourSeen(tourName)) {
      return;
    }
    if (this.currentTour !== undefined) {
      this.currentTour.push(tour);
      _.sort(this.currentTour, function(tour) {
        return tour.position;
      });
      return;
    }
    if (tour.condition !== undefined && !tour.condition()) {
      return;
    }
    if (tour.beforeStart !== undefined) {
      tour.beforeStart();
    }
    // TODO: Scroll to show ID?
    this.currentTour = tour;
    this.startCurrentTour();
  },

  beforeLastStep: function() {
    var nextTour = this.getNextTour(false);
    if (nextTour !== undefined) {
      // tell hopscotch that there is a next step
    }
  },

  afterLastStep: function() {
    if (this.currentTour.cleanup !== undefined) {
      this.currentTour.cleanup();
    }
    this.tourIsSeen(this.currentTour.name);
    this.currentTour = this.getNextTour(true);
    if (this.currentTour != undefined) {
      this.startCurrentTour();
    }
  },

  startCurrentTour: function() {
    var that = this, hopscotchTour = this.currentTour.tour;
    // this.lastStep = hopscotch_tour.steps[hopscotch_tour.steps.length - 1];
    // We may be within the end signal, so make it asynchronous.
    setTimeout(function() {
      hopscotch.startTour(hopscotchTour);
    }, 0);
  }
});

module.exports = TourManager;
