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
              conditional: function(){
                  return true;
              },
              beforeStart: function(){
                  //setter les ID dans le DOM pour hopscotch
              },
              autostart: true,
              tour: onStart
            },
            {
                name:'on_ideas'
            },
            {
                name:'on_synthesis'
            },
            {
              name:"on_show_synthesis",
              conditional: function(){
                return false;
              },
              beforeStart: function(){

              },
              autostart: false,
              tour: onShowSynthesis
            },
            {
                name:'on_profile'
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
            this.deleteTour(currentTour.id);

            console.debug('hopscotch', hopscotch.getCurrTour());

            //console.debug('hopscotch', hopscotch, hopscotch.getState(), hopscotch.getCurrTour());

            //that.runTour('on_show_synthesis');

        });

        //console.debug('tour_assembl', this.tour_assembl);
    },

    getCurrentTour: function(){
       return hopscotch.getCurrTour();
    },

    deleteTour: function(name){
       var index = -1;

        console.debug('disabledTour', name);

        for(var i = 0, len = this.tour_assembl.length; i < len; i++) {
            if (this.tour_assembl[i].name === name) {
                index = i;
                //delete in array
                //this._nextTours[index -1];
                //this._tourModel.save(attrs, {patch: true});
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
            if(this.getCurrentTour()){
                //find index of "name" in assembl_tour[];
                for(var i = 0, len = this.tour_assembl.length; i < len; i++) {
                    if (this.tour_assembl[i].name === name) {
                        index = i;
                        this._nextTours[index] = name;
                        break;
                    }
                }

                //console.debug(this._nextTours[index]);
                //runTour

            } else {

                for(var i = 0, len = this.tour_assembl.length; i < len; i++) {
                    if (this.tour_assembl[i].name === name) {
                        index = i;
                        this._nextTours[index] = name;
                        break;
                    }
                }

                this.runTour(this._nextTours[index]);

                //if(this.tour_assembl[i].conditional()){}

                //this.tour_assembl[index].beforeStart();

            }
        }

    },

    runTour: function(name){
        var tour = undefined;

        for(var i = 0, len = this.tour_assembl.length; i < len; i++) {
            if (this.tour_assembl[i].name === name) {
                tour = this.tour_assembl[i].tour;
                break;
            }
        }

        return hopscotch.startTour(tour, 0);
    }

});

module.exports = new TakeTour();

