"use strict";

var i18n =  require('./i18n.js'),
    TourModel = require('../models/tour.js'),
    _ = require('underscore');

// Tours
var onStart = require('./tours/onStart.js'),
    onShowSynthesis = require('./tours/onShowSynthesis.js');

var Taketour = {

  tours_by_name: {},
  disabled_tour: undefined,

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

  initTour: function() {
      var tourModel = new TourModel.Model(),
          that = this;

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

    tourModel.fetch({
       success: function(model, response, options){
          that.disabled_tour = response;
       },
       error: function(model, response, options){

       }
    })

  },

  showTour: function(tour){

      // show the initial tour "on_start"
      if(!this.disabled_tour) return;

      // check if the tour is in the disabled_tour[]
      if(_.contains(_.keys(this.disabled_tour), tour)){

          console.debug("don't show this tour");

      } else {

          console.debug("show this tour");

          // need to return "hopscotch" object with proper tour
          //return hopscotch.startTour(this.tour, 0);
      }

  }


}

module.exports = Taketour;

