"use strict";

var Marionette = require('../shims/marionette.js'),
    i18n =  require('./i18n.js'),
    TourModel = require('../models/tour.js'),
    _ = require('../shims/underscore.js');

// Tours
var onStart = require('./tours/onStart.js'),
    onShowSynthesis = require('./tours/onShowSynthesis.js');


var TakeTour = Marionette.Object.extend({

    _nextTours: [],
    _seenTours: undefined,

    initialize: function(){

        this.tour_assembl = [
            {
              name:"on_start",
              conditional: function(){

              },
              autostart: true,
              tour: onStart
            },
            {
              name:"on_show_synthesis",
              conditional: '',
              autostart: false,
              tour: onShowSynthesis
            }

        ];

        this.initTour();
    },

    initTour: function() {
        var tourModel = new TourModel.Model(),
            that = this,
            currentTour = hopscotch.getCurrTour();

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

        /*for (var i=0; i<this.tour_assembl.length; i++) {
            var tour = this.tour_assembl[i];
            tour.order = i;
            this._nextTours[tour.name] = tour;
        }*/

        // Recovery disabled tour
        tourModel.fetch({
            success: function(model, response, options){
                that._seenTours = response;
            },
            error: function(model, response, options){

            }
        });
    },

    disabledTour: function(tour){
        console.debug('disabledTour', tour);

    },

    startTour: function(name){
        var index = -1;

        // check if the tour has been seen[]
        if(_.contains(_.keys(this._seenTours), name)){
            console.debug("Tour already seen");
            return;
        } else {
            //If there is an ongoing round
            if(hopscotch.getCurrTour()){
                //find index of "name" in assembl_tour[];
                for(var i = 0, len = this.tour_assembl.length; i < len; i++) {
                    if (this.tour_assembl[i].name === name) {
                        index = i;
                        break;
                    }
                }

                this._nextTours[index] = name;
            } else {

                for(var i = 0, len = this.tour_assembl.length; i < len; i++) {
                    if (this.tour_assembl[i].name === name) {

                        if(this.tour_assembl[i].condition())



                        break;
                    }
                }


            }

            console.debug("show this tour", name);
            // need to return "hopscotch" object with proper tour
            //return hopscotch.startTour(this.tour, 0);
        }

    }

});

module.exports = new TakeTour();

