"use strict";

var Marionette = require('../shims/marionette.js'),
    i18n =  require('./i18n.js'),
    TourModel = require('../models/tour.js'),
    Ctx = require('../common/context.js'),
    _ = require('../shims/underscore.js'),
    AssemblTours = require('./tours/assemblTours.js');


var TourManager = Marionette.Object.extend({
  nextTours: [],
  tourModel: undefined,
  currentTour: undefined,
  firstTourStarted: false,
  hopscotch_i18n: {
          nextBtn: i18n.gettext('Next'),
          prevBtn: i18n.gettext('Back'),
          doneBtn: i18n.gettext('Done'),
          skipBtn: i18n.gettext('Skip'),
          closeTooltip: i18n.gettext('Close')
      },

  initialize: function() {
    var that = this,
        currentUser = Ctx.getCurrentUser();
    this.user = currentUser;
    hopscotch.configure({
      onShow: function() {
        that.onShow();
      },
      onNext: function() {
          // need to scroll messageListPanel there.
      },
      i18n: this.hopscotch_i18n
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
    for (var i in AssemblTours) {
        var tour = AssemblTours[i];
        tour.position = i;
        tour.tour.id = tour.name;
        toursById[tour.name] = tour;
        if (tour.autostart && !this.isTourSeen(tour.name)) {
            this.nextTours.push(tour);
        }
    }
    this.toursById = toursById;

    setTimeout(function() {
      that.firstTourStarted = true;
      if (that.nextTours.length > 0) {
        that.currentTour = that.getNextTour(true);
        if (that.currentTour !== undefined) {
          that.startCurrentTour();
        }
      }
    }, 4000);
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
          seen = JSON.parse(window.localStorage.getItem('toursSeen') || "{}");
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
    var tour = this.toursById[tourName];
    if (tour === undefined) {
      console.error("Unknown tour: " + tourName);
      return;
    }
    if (this.isTourSeen(tourName)) {
      return;
    }
    if (this.currentTour !== undefined || !this.firstTourStarted) {
      if (this.nextTours.length === 0) {
        this.nextTours.push(tour);
        if (this.currentTour !== undefined) {
          // change the "Done" to "Next" live.
          this.checkForLastStep();
        }
      } else {
        // insert in-order, unless it's already there.
        var pos = _.sortedIndex(this.nextTours, tour, "position");
        if (!((pos < this.nextTours.length && this.nextTours[pos] === tour)
          || (pos > 0 && this.nextTours[pos - 1] === tour))) {
          this.nextTours.splice(pos, 0, tour);
        }
      }
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

  onShow: function() {
    if (this.currentTour === undefined) {
      console.error("onShow came after tour was cleared");
      this.currentTour = this.toursById(hopscotch.getCurrTour().id);
    }
    this.checkForLastStep();
    var stepNum = hopscotch.getCurrStepNum(),
        step = this.currentTour.tour.steps[stepNum];
    //console.log("onShow", this.currentTour.name, stepNum);
    this.currentTour.wasSeen = true;
    if (step.stepOnShow !== undefined) {
      step.stepOnShow();
    }
      //that.$(".panel-body").scroll(that, that.scrollLogger);
  },

  checkForLastStep: function() {
    var stepNum = hopscotch.getCurrStepNum(),
        step = this.currentTour.tour.steps[stepNum];
    if (stepNum + 1 == this.currentTour.tour.steps.length) {
      var nextTour = this.getNextTour(false),
          nextButton = $(".hopscotch-next");
      if (nextTour !== undefined) {
        nextButton.text(i18n.gettext("Next"));
      }
    }
  },

  afterLastStep: function() {
    if (this.currentTour === undefined) {
      console.error("afterLastStep came after tour was cleared");
      this.currentTour = this.toursById(hopscotch.getCurrTour().id);
    }
    if (this.currentTour.cleanup !== undefined) {
      this.currentTour.cleanup();
    }
    this.tourIsSeen(this.currentTour.name);
    this.currentTour = this.getNextTour(true);
    if (this.currentTour !== undefined) {
      this.startCurrentTour();
    }
  },

  startCurrentTour: function() {
    var that = this, tour = this.currentTour;
    // We may be within the end signal, so make it asynchronous.
    setTimeout(function() {
      hopscotch.startTour(tour.tour);
      // Some tour steps fail
      setTimeout(function() {
        if (!tour.wasSeen) {
          if (tour.numErrors === undefined) {
            tour.numErrors = 1;
          } else {
            tour.numErrors += 1;
          }
          if (tour.numErrors > 1) {
            console.error("Tour was not seen:", tour);
            that.currentTour = that.getNextTour(true);
          }
          if (that.currentTour !== undefined) {
            that.startCurrentTour();
          }
        }
      }, 1000);
    }, 0);
  }
});

module.exports = TourManager;
