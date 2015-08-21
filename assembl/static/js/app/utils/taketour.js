"use strict";

var i18n =  require('./i18n.js');

// Tours
var onStart = require('./tours/onStart.js');
var onShowSynthesis = require('./tours/onShowSynthesis.js');

var Taketour = {

  tours_by_name: {},

  tour_assembl: [
    {
      name:"on_start",
      tour: onStart
    },
    {
      name:"on_show_synthesis",
      tour: onShowSynthesis
    }
  ],

  setTour: function() {

      hopscotch.configure({
      onShow: function() {
        //that.$(".panel-body").scroll(that, that.scrollLogger);
      },
      onNext:function() {
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

    for (var i=0; i<this.tour_assembl.length; i++) {
       var tour = this.tour_assembl[i];
       tour.order = i;
       this.tours_by_name[tour.name] = tour;
    }

    //return hopscotch.startTour(this.tour, 0);
  }




}

module.exports = Taketour;

