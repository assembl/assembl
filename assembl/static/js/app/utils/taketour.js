"use strict";

var Marionette = require('../shims/marionette.js'),
    i18n =  require('./i18n.js'),
    TourModel = require('../models/tour.js'),
    Ctx = require('../common/context.js'),
    _ = require('../shims/underscore.js');

// Tours
var onStart = require('./tours/onStart.js'),
    onShowSynthesis = require('./tours/onShowSynthesis.js');


var TakeTour = Marionette.Object.extend({

    _nextTours: [],
    _seenTours: undefined,
    _tourModel: new TourModel.Model(),

    initialize: function(){

        this.tour_assembl = [
            {
                name:"on_start",
                autostart: true,
                tour: onStart
            },
            {
                name:"on_show_synthesis",
                autostart: false,
                tour: onShowSynthesis
            }
        ];

        this.initTour();
    },

    initTour: function() {
        var tourModel = new TourModel.Model(),
            currentUser = Ctx.getCurrentUser(),
            that = this;

        hopscotch.configure({
            onShow: function() {
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

        // Recovery disabled tour
        if (Ctx.getCurrentUser().isUnknownUser()) {
            // TODO: Fetch _seenTours from localStorage
            this._seenTours = {};
        } else {
            this._tourModel.fetch({
                success: function(model, response, options){
                    that._seenTours = response;
                },
                error: function(model, response, options){

                }
            });
        }

        hopscotch.listen('end', function(){
            var currentTour = hopscotch.getCurrTour();

            // after each end we delete the tour
            that.deleteTour(currentTour.id);

            console.debug('active', hopscotch.isActive, hopscotch.getCurrTour());

            if (that._nextTours.length) {
               that.runTour(that._nextTours[0]);
            }

        });
    },

    getCurrentTour: function(){
       return hopscotch.getCurrTour();
    },

    getNextTours: function(){
        return this._nextTours;
    },

    setNextTours: function(index, name){
        this._nextTours[index] = name;
    },

    deleteTour: function(name){
        sessionStorage.removeItem('hopscotch.tour.state');

        for(var i = 0, len = this._nextTours.length; i < len; i++) {
            if (this._nextTours[i] === name) {
                this._nextTours.splice(i, 1);
                //this._tourModel.save(name, {patch: true});
                break;
            }
        }
    },

    startTour: function(name){
        var index = -1;

        // check if the tour has been seen[]
        if(_.contains(_.keys(this._seenTours), name)){
            console.debug("Tour already seen");
            return;
        } else {
            //If there is an ongoing round
            for(var i = 0, len = this.tour_assembl.length; i < len; i++) {
                if (this.tour_assembl[i].name === name) {
                    index = i;
                    this.setNextTours(index, name);
                    break;
                }
            }
        }

        // check if the _nextTours[] have still tour to load
        // avoid to reload the current tour running by hopscotch.getCurrTour()
        if(this._nextTours.length){
            this.runTour(this._nextTours[0]);
        }

    },

    // private function
    runTour: function(name){
        var tour = undefined;

        for(var i = 0, len = this.tour_assembl.length; i < len; i++) {
            if (this.tour_assembl[i].name === name) {
                tour = this.tour_assembl[i].tour;
                break;
            }
        }
        // not adapter to load multiple tour on single page
        hopscotch.startTour(tour);
    }

});

module.exports = new TakeTour();

