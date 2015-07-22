'use strict';

var Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js') ,
    CollectionManager = require('../common/collectionManager.js'),
    Marionette = require('../shims/marionette.js'),
    $ = require('../shims/jquery.js'),
    _ = require('../shims/underscore.js');


var IdeaWidgets = Marionette.ItemView.extend({

    // custom properties

    inspiration_widget_create_url: null,
    inspiration_widgets: null,
    inspiration_widget_url: null,
    inspiration_widget_configure_url: null,
    vote_widget_create_url: null,
    vote_widgets: null,
    session_widget_create_url: null,
    renders_due_to_widgets: 0,

    // overwritten properties and methods

    template: '#tmpl-ideaPanelWidgets',
    className: 'tac',
    initialize: function (options) {
        //console.log("IdeaWidgets::initialize()");
        if (!this.model) {
            this.model = null;
        }
        if ( "template" in options && options.template ){
            this.template = options.template;
        }
        this.renders_due_to_widgets = 0;
    },

    modelEvents: {
        'change': 'render'
    },
    ui: {
        'modal': '.js_openTargetInModal'
    },
    events: {
        'click @ui.modal': 'openTargetInModal'
    },

    serializeData: function () {
        var currentUser = Ctx.getCurrentUser(),
            idea = null,
            i18n_vote = i18n.gettext('Vote on the \'%s\' idea'),
            session_url = null; // declared only to be spotted for the generation of the .pot file (I didn't manage our tool to detect it in ideaPanelWidgets.tmpl)

        if (this.model) {
            //console.log("there is a model");
            idea = this.model;
        }

        if(currentUser.can(Permissions.ADMIN_DISCUSSION)){
            session_url = this.session_widget_admin_url
        }else{
            session_url = this.session_widget_user_url
        }

        return {
            ctx: Ctx,
            i18n: i18n,
            idea: idea,
            canUseWidget: currentUser.can(Permissions.ADD_POST),
            canCreateWidgets: currentUser.can(Permissions.ADMIN_DISCUSSION),
            inspiration_widget_create_url: this.inspiration_widget_create_url,
            inspiration_widgets: this.inspiration_widgets,
            inspiration_widget_url: this.inspiration_widget_url,
            inspiration_widget_configure_url: this.inspiration_widget_configure_url,
            vote_widget_create_url: this.vote_widget_create_url,
            vote_widgets: this.vote_widgets,
            session_widgets: this.session_widgets,
            session_widget_configure_url: this.session_widget_configure_url,
            session_widget_create_url: this.session_widget_create_url,
            session_widget_url: session_url
        };
    },

    onRender: function(){
        //console.log("ideaWidgets::onRender()");
        this.populateAssociatedWidgetData();
    },


    // custom methods

    clearWidgetDataAssociatedToIdea: function () {
        // console.log("clearWidgetDataAssociatedToIdea()");
        this.resetAssociatedWidgetData();
        /* In case once the admin deletes the widget after having opened the configuration modal,
         we have to invalidate widget data for this idea and all its sub-ideas recursively.
         So to make it more simple we invalidate all widget data. */
        Ctx.invalidateWidgetDataAssociatedToIdea("all");
    },

    resetAssociatedWidgetData: function() {
        this.inspiration_widget_create_url = null;
        this.inspiration_widgets = null;
        this.inspiration_widget_url = null;
        this.inspiration_widget_configure_url = null;
        this.vote_widget_create_url = null;
        this.vote_widgets = null;
    },

    populateAssociatedWidgetData: function () {
        //console.log("ideaWidget::populateAssociatedWidgetData()");
        if (this.model) {
            var that = this;
            var previous = {};

            var expected_properties = [
                "inspiration_widget_create_url",
                "inspiration_widgets",
                "inspiration_widget_url",
                "inspiration_widget_configure_url",
                "vote_widget_create_url",
                "vote_widgets",
                "session_widgets", // or "session_widget"?
                "session_widget_admin_url",
                "session_widget_create_url",
                "session_widget_user_url"
            ];

            expected_properties.forEach(function(el){
                previous[el] = that[el];
            });

            var promise = Ctx.getWidgetDataAssociatedToIdeaPromise(this.model.getId());

            promise.then(function (data) {

                    // console.log("populateAssociatedWidgetData received data: ", data);

                    that.resetAssociatedWidgetData();

                    var received_properties = {};
                    var changed = false;
                    var areArraysAndHaveSameContent = function (a, b){
                        if ( !$.isArray(a) || !$.isArray(b) )
                            return false;
                        if ( a.length != b.length )
                            return false;
                        return (JSON.stringify(a) == JSON.stringify(b));
                    };
                    expected_properties.forEach(function(el){
                        if (el in data) {
                            // console.log("analysing property: " + el);
                            received_properties[el] = data[el];
                            that[el] = received_properties[el];
                            if ( previous[el] != received_properties[el] ){
                                if ( el == "inspiration_widgets" ){ // special case: this is an object
                                    if ( _.isObject(previous[el]) && _.isObject(received_properties[el]) ){
                                        if ( !_.isEqual(previous[el], received_properties[el]) ){
                                            // console.log("property " + el + " has changed");
                                            // console.log("old value: ", previous[el]);
                                            // console.log("new value: ", received_properties[el]);
                                            changed = true;
                                        }
                                    } else {
                                        // console.log("property " + el + " has changed");
                                        // console.log("old value: ", previous[el]);
                                        // console.log("new value: ", received_properties[el]);
                                        changed = true;
                                    }
                                }
                                else {
                                    if ( !areArraysAndHaveSameContent(previous[el], received_properties[el]) ){
                                        // console.log("property " + el + " has changed");
                                        // console.log("old value: ", previous[el]);
                                        // console.log("new value: ", received_properties[el]);
                                        changed = true;
                                    }
                                }
                            }
                        }
                    });

                    if ( changed ){
                        console.log("content changed => we have to re-render");
                        if ( ++that.renders_due_to_widgets < 10 )
                            that.render();
                        else
                            console.log("we will not re-render, because we have tried too many times");
                    }
                }
            );
        }

    },

    openTargetInModal: function (evt) {
        var that = this;
        var onDestroyCallback = function () {
            //console.log("openTargetInModal onDestroyCallback()");
            setTimeout(function () {
                //Ctx.invalidateWidgetDataAssociatedToIdea("all");
                that.clearWidgetDataAssociatedToIdea();
                //that.fetchModelAndRender();
                that.render();
            }, 0);
        };
        var options = {
            footer: false
        };
        if (evt && evt.currentTarget && $(evt.currentTarget).hasClass("js_clearWidgetDataAssociatedToIdea"))
        {
            //console.log("openTargetInModal has js_clearWidgetDataAssociatedToIdea");
            return Ctx.openTargetInModal(evt, onDestroyCallback, options);
        }
        else
        {
            //console.log("openTargetInModal has not js_clearWidgetDataAssociatedToIdea");
            return Ctx.openTargetInModal(evt, null, options);
        }
    }

});


module.exports = IdeaWidgets;
