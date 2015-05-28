'use strict';

var Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js') ,
    CollectionManager = require('../common/collectionManager.js'),
    Marionette = require('../shims/marionette.js'),
    $ = require('../shims/jquery.js');


var IdeaWidgets = Marionette.ItemView.extend({

    // custom properties

    inspiration_widget_create_url: null,
    inspiration_widgets: null,
    inspiration_widget_url: null,
    inspiration_widget_configure_url: null,
    vote_widget_create_url: null,
    vote_widgets: null,


    // overwritten properties and methods

    template: '#tmpl-ideaPanelWidgets',
    initialize: function (options) {
        //console.log("IdeaWidgets::initialize()");
        if (!this.model) {
            this.model = null;
        }
        if ( "template" in options && options.template ){
            this.template = options.template;
        }
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
            i18n_vote = i18n.gettext('Vote on the \'%s\' idea'); // declared only to be spotted for the generation of the .pot file (I didn't manage our tool to detect it in ideaPanelWidgets.tmpl)

        if (this.model) {
            //console.log("there is a model");
            idea = this.model;
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
            vote_widgets: this.vote_widgets
        };
    },

    onRender: function(){
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
            previous.inspiration_widget_create_url = that.inspiration_widget_create_url;
            previous.inspiration_widgets = that.inspiration_widgets;
            previous.inspiration_widget_url = that.inspiration_widget_url;
            previous.inspiration_widget_configure_url = that.inspiration_widget_configure_url;
            previous.vote_widget_create_url = that.vote_widget_create_url;
            previous.vote_widgets = that.vote_widgets;
            var promise = Ctx.getWidgetDataAssociatedToIdeaPromise(this.model.getId());
            promise.done(
                function (data) {
                    //console.log("populateAssociatedWidgetData received data: ", data);

                    that.resetAssociatedWidgetData();

                    if ("inspiration_widget_create_url" in data) {
                        that.inspiration_widget_create_url = data.inspiration_widget_create_url;
                    }

                    if ("inspiration_widgets" in data) {
                        that.inspiration_widgets = data.inspiration_widgets;
                    }

                    if ("inspiration_widget_url" in data) {
                        that.inspiration_widget_url = data.inspiration_widget_url;
                    }

                    if ("inspiration_widget_configure_url" in data) {
                        that.inspiration_widget_configure_url = data.inspiration_widget_configure_url;
                        //console.log("inspiration_widget_configure_url: ", data.inspiration_widget_configure_url);
                    }

                    if ("vote_widget_create_url" in data) {
                        that.vote_widget_create_url = data.vote_widget_create_url;
                        //console.log("vote_widget_create_url: ", data.vote_widget_create_url);
                    }

                    if ("vote_widgets" in data) {
                        that.vote_widgets = data.vote_widgets;
                        //console.log("vote_widgets: ", data.vote_widgets);
                    }

                    if (
                        previous.inspiration_widget_create_url != that.inspiration_widget_create_url
                        || previous.inspiration_widgets != that.inspiration_widgets
                        || previous.inspiration_widget_url != that.inspiration_widget_url
                        || previous.inspiration_widget_configure_url != that.inspiration_widget_configure_url
                        || previous.vote_widget_create_url != that.vote_widget_create_url
                        || previous.vote_widgets != that.vote_widgets
                    ) {

                        that.render();
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
