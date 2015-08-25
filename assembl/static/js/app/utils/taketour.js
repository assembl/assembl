"use strict";

var Marionette = require('../shims/marionette.js'),
    i18n =  require('./i18n.js'),
    TourModel = require('../models/tour.js'),
    _ = require('../shims/underscore.js');

// Tours
var onStart = require('./tours/onStart.js'),
    onShowSynthesis = require('./tours/onShowSynthesis.js');


var TakeTour = Marionette.Object.extend({

    _tours_by_name: {},
    _disabled_tour: undefined,

    initialize: function(){
        this.tour_assembl = [
            { name:"on_start", tour: onStart },
            { name:"on_show_synthesis", tour: onShowSynthesis }
        ];

        this.initTour();
    },

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
            this._tours_by_name[tour.name] = tour;
        }

        // Recovery disabled tour
        tourModel.fetch({
            success: function(model, response, options){
                that._disabled_tour = response;
            },
            error: function(model, response, options){

            }
        })

    },

    disabledTour: function(tour){
        console.debug('disabledTour', tour);



    },

    showTour: function(tour){

        // show the initial tour "on_start"
        if(!this._disabled_tour) return;

        // check if the tour is in the disabled_tour[]
        if(_.contains(_.keys(this._disabled_tour), tour)){

            console.debug("do not show this tour");

        } else {

            console.debug("show this tour", tour);

            // need to return "hopscotch" object with proper tour
            //return hopscotch.startTour(this.tour, 0);
        }

    }

});

module.exports = new TakeTour();

