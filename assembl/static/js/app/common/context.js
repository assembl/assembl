'use strict';

var $ = require('../shims/jquery.js'),
    _ = require('../shims/underscore.js'),
    Moment = require('moment'),
    Promise = require('bluebird'),
    App =  require('../app.js'),
    Permissions =  require('../utils/permissions.js'),
    Roles =  require('../utils/roles.js'),
    i18n =  require('../utils/i18n.js');

var Context = function () {

    this.DISCUSSION_SLUG = $('#discussion-slug').val();
    this.DISCUSSION_ID = $('#discussion-id').val();
    this.SOCKET_URL = $('#socket-url').val();
    this.CURRENT_USER_ID = $('#user-id').val();
    /**
     * Send debugging output to console.log to observe when views render
     * @type {boolean}
     */
    this.debugRender = false;

    /**
     * Send debugging output to console.log to observe annotator related
     * events
     * @type {boolean}
     */
    this.debugAnnotator = false;

    /**
     * Send debugging output to console.log to observe socket input
     * @type {boolean}
     */
    this.debugSocket = false;

    /**
     * Prefix used to generate the id of the element used by annotator to find it's annotation
     * @type {string}
     */
    this.ANNOTATOR_MESSAGE_BODY_ID_PREFIX = "message-body-";

    /**
     * Current user
     * @type {User}
     */
    this.currentUser = null;

    /**
     * Csrf token
     * @type {String}
     */
    this.csrfToken = null;

    /**
     * Default ease for all kids of animation
     * @type {String}
     */
    this.ease = 'ease';

    /**
     * The date format
     * @type {String}
     */
    this.dateFormat = 'DD/MM/YYYY';

    /**
     * The datetime format
     * @type {string}
     */
    this.datetimeFormat = 'DD/MM/YYYY HH:mm:ss';

    /**
     * Current dragged segment
     * @type {Segment}
     */
    this._draggedSegment = null;

    /**
     * Current dragged idea
     * @type {Idea}
     */
    this.draggedIdea = null;

    /**
     * Current dragged annotation
     * @type {Annotation}
     */
    this._draggedAnnotation = null;

    /**
     * The selection tooltip.
     * @type {jQuery}
     */
    this.annotatorSelectionTooltip = null;

    /**
     * Reference to dragbox
     * @type {HTMLDivElement}
     */
    this.dragbox = null;

    /**
     * Qty of opened panels
     * @type {Number}
     */
    this.openedPanels = 0;

    this.AVAILABLE_MESSAGE_VIEW_STYLES = {
        TITLE_ONLY: {
            id: "viewStyleTitleOnly",
            label: i18n.gettext('Message titles')
        },
        PREVIEW: {
            id: "viewStylePreview",
            label: i18n.gettext('Message previews')
        },
        FULL_BODY: {
            id: "viewStyleFullBody",
            label: i18n.gettext('Complete messages')
        }
    };

    /*
     * Current discussion
     * @type {Discussion}
     */
    this.discussion = undefined;

    /*
     * Current discussion Promise object
     * @type {Promise}
     */
    this.discussionPromise = undefined;


    /*
     * Cached associative array (String -> Promise which returns an Object[String -> String]) of widget data associated to an idea
     * @type {Object}
     */
    this.cachedWidgetDataAssociatedToIdeasPromises = {};

    /*
     * Timeout (created by setTimeout()) which hides the popover
     */
    this.timeoutIdHidePopover = null;

    this.init();
}

Context.prototype = {

    getDiscussionSlug: function () {
        return this.DISCUSSION_SLUG;
    },

    getLoginURL: function() {
      return '/' + Ctx.getDiscussionSlug() + '/login';
    },

    getSocketUrl: function () {
        return this.SOCKET_URL;
    },

    getDiscussionId: function () {
        return this.DISCUSSION_ID;
    },

    getCurrentUserId: function () {
        return this.CURRENT_USER_ID;
    },

    setCurrentUserId: function(user_id) {
        this.CURRENT_USER_ID = user_id;
    },

    getCurrentUser: function () {
        return this.currentUser;
    },

    setCurrentUser: function (user) {
        this.currentUser = user;
    },

    getCsrfToken: function () {
        return this.csrfToken || this.loadCsrfToken(false);
    },

    setCsrfToken: function (token) {
        this.csrfToken = token;
    },

    /**
     * Returns a template from an script tag
     * @param {string} id The id of the script tag
     * @return {function} The Underscore.js _.template return
     */
    loadTemplate: function (id) {
        var template = $('#tmpl-' + id);
        if (template.length) {
            // Only for app page
            return _.template(template.html());
        }
    },

    /**
     * get a view style definition by id
     * @param {messageViewStyle.id}
     * @return {messageViewStyle or undefined}
     */
    getMessageViewStyleDefById: function (messageViewStyleId) {
        return  _.find(this.AVAILABLE_MESSAGE_VIEW_STYLES, function (messageViewStyle) {
            return messageViewStyle.id == messageViewStyleId;
        });
    },

    getUrlFromUri: function (str) {
        var start = "local:";
        if (str && str.length && str.indexOf(start) == 0) {
            str = "/data/" + str.slice(start.length);
        }
        return str;
    },

    /**
     * Formats the url to the current api url
     * @param  {string} url
     * @return {string} The url formatted
     */
    getApiUrl: function (url) {
        if (url === undefined)
            url = '/';
        else if (url[0] !== '/') {
            url = '/' + url;
        }
        return '/api/v1/discussion/' + this.getDiscussionId() + url;
    },

    getApiV2Url: function (url) {
        if (url === undefined)
            url = '/';
        else if (url[0] !== '/') {
            url = '/' + url;
        }
        return '/data' + url;
    },

    getApiV2DiscussionUrl: function (url) {
        if (url === undefined)
            url = '/';
        else if (url[0] !== '/') {
            url = '/' + url;
        }
        return this.getApiV2Url('Discussion/' + this.getDiscussionId() + url);
    },

    /**
     * Formats the given to the generic api url
     * @param {string} id The class name used in the api
     * @return {string} The url formatted
     *
     * ex: 'local:Extract/1' -> '/api/v1/discussion/1/generic/Extract/1'
     */
    //FIXME: this method never use in app
    /*getGenericApiUrl: function(id){
     var url = '/api/v1/discussion/' + this.getDiscussionId() + '/generic/';
     return id.replace('local:', url);
     },*/

    /**
     * @return {Object} The Object with mesagelistconfig in the localStorage
     */
    DEPRECATEDgetMessageListConfigFromStorage: function () {
        var messageListConfig = JSON.parse(localStorage.getItem('messageListConfig')) || {};
        return messageListConfig;
    },

    /**
     * Adds a panel in the localStorage
     * @param {Object} The Object with mesagelistconfig in the localStorage
     * @return {Object} The Object with mesagelistconfig in the localStorage
     */
    DEPRECATEDsetMessageListConfigToStorage: function (messageListConfig) {
        localStorage.setItem('messageListConfig', JSON.stringify(messageListConfig));
        return messageListConfig;
    },

    /**
     * Checks if there is a panel in fullscreen mode
     * ( i.e.: there is only one open )
     * @return {Boolean}
     */
    isInFullscreen: function () {
        return this.openedPanels === 1;
    },

    // "this" has to be the popover div: $("#popover-oembed")
    popoverAfterEmbed: function() {
        var screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        var popoverWidth = $(this).outerWidth();
        var popoverHeight = $(this).outerHeight();
        var positionLeft = parseInt($(this).css('left'));
        var positionTop = parseInt($(this).css('top'));
        var newPositionLeft = positionLeft - popoverWidth/2;
        if ( newPositionLeft + popoverWidth > screenWidth )
            newPositionLeft = screenWidth - popoverWidth;
        if ( newPositionLeft < 0 )
            newPositionLeft = 0;
        var newPositionTop = positionTop;
        if ( newPositionTop + popoverHeight > screenHeight )
            newPositionTop = screenHeight - popoverHeight;
        if ( newPositionTop < 0 )
            newPositionTop = 0;
        $(this).css('left', newPositionLeft + 'px' );
        $(this).css('top', newPositionTop + 'px' );
    },

    openTargetInPopOver: function(evt) {
        var that = this;

        var target_url = null;
        if (evt && evt.currentTarget) {
            if ($(evt.currentTarget).attr("data-href"))
                target_url = $(evt.currentTarget).attr("data-href");
            else if ($(evt.currentTarget).attr("href") && $(evt.currentTarget).attr("href") != "#")
                target_url = $(evt.currentTarget).attr("href");
        }
        if (!target_url){
            console.log("context::openTargetInPopOver: no href attribute given");
            return false;
        }

        var popover_width = 500;
        var popover_height = 500;
        var popover_scrolling = "no";
        if (evt && evt.currentTarget) {
            if ($(evt.currentTarget).attr("data-popover-width"))
                popover_width = $(evt.currentTarget).attr("data-popover-width");
            if ($(evt.currentTarget).attr("data-popover-height"))
                popover_height = $(evt.currentTarget).attr("data-popover-height");
            if ($(evt.currentTarget).attr("data-popover-scrolling"))
                popover_scrolling = $(evt.currentTarget).attr("data-popover-scrolling");
        }

        var popover = $("#popover-oembed");

        var iframe = '<iframe width="' + popover_width + '" height="' + popover_height + '" frameborder="0" scrolling="' + popover_scrolling + '" frametransparency="1" src="' + target_url + '"></iframe>';
        popover[0].innerHTML = iframe;

        var triggerHover = function(evt){
            console.log("triggerHover(evt: ", evt);
            popover.css('position','fixed');
            popover.css('top', (evt.pageY-parseInt(popover_height)-14) + 'px');
            popover.css('left', evt.pageX + 'px');
            //popover.css('padding', '25px 50px');
            popover.show();

            that.popoverAfterEmbed.apply(popover[0]);

            window.clearTimeout(that.timeoutIdHidePopover);

            var hidePopover = function(){
                popover.hide();
            };

            popover.unbind("mouseleave"); // this avoids handler accumulation (each call to the following popover.mouseleave() adds a handler)
            popover.mouseleave(function(evt){
                that.timeoutIdHidePopover = setTimeout(hidePopover, 1000);
            });

            popover.unbind("mouseenter"); // this avoids handler accumulation (each call to the following popover.mouseenter() adds a handler)
            popover.mouseenter(function(evt){
                window.clearTimeout(that.timeoutIdHidePopover);
            });


            // hide it after some time even if the user does not put the mouse inside the popover
            that.timeoutIdHidePopover = setTimeout(hidePopover, 4000);
        };

        triggerHover(evt);

        return false;
    },

    // Modal can be dynamically resized once the iframe is loaded, or on demand
    // TODO: options to set modal size
    openTargetInModal: function (evt, onDestroyCallback, options) {
        var target_url = null;
        if (evt && evt.currentTarget) {
            if ($(evt.currentTarget).attr("data-href"))
                target_url = $(evt.currentTarget).attr("data-href");
            else if ($(evt.currentTarget).attr("href") && $(evt.currentTarget).attr("href") != "#")
                target_url = $(evt.currentTarget).attr("href");
        }
        if (!target_url)
            return false;

        var modal_title = "";
        if (evt && evt.currentTarget && $(evt.currentTarget).attr("data-modal-title"))
            modal_title = $(evt.currentTarget).attr("data-modal-title");

        var resizeIframeOnLoad = false;
        if (evt && evt.currentTarget && $(evt.currentTarget).attr("data-modal-resize-on-load"))
            resizeIframeOnLoad = $(evt.currentTarget).attr("data-modal-resize-on-load") != false && $(evt.currentTarget).attr("data-modal-resize-on-load") != "false";

        var resizable = false;
        if (evt && evt.currentTarget && $(evt.currentTarget).attr("data-modal-resizable"))
            resizable = $(evt.currentTarget).attr("data-modal-resizable") != false && $(evt.currentTarget).attr("data-modal-resizable") != "false";

        var model = new Backbone.Model();
        model.set("iframe_url", target_url);
        model.set("modal_title", modal_title);
        model.set("resizeIframeOnLoad", resizeIframeOnLoad);

        var className = 'group-modal popin-wrapper iframe-popin';
        if (options && options.footer === false)
            className += " popin-without-footer";
        if (!resizable)
            className += " popin-fixed-size";

        var Modal = Backbone.Modal.extend({
            template: Ctx.loadTemplate('modalWithIframe'),
            className: className,
            cancelEl: '.close',
            keyControl: false,
            model: model
        });

        window.modal_instance = new Modal();
        if (onDestroyCallback)
            window.modal_instance.onDestroy = onDestroyCallback;
        window.exitModal = function () {
            window.modal_instance.destroy();
        };

        window.resizeIframe = function (iframe, retry) {
            if (!iframe)
                iframe = $(".iframe-popin iframe").get(0);
            if (!iframe)
                return;
            var modal = $(iframe).parents(".bbm-modal");
            if (!modal)
                return;
            var targetHeight = iframe.contentWindow.document.body.scrollHeight; // margins are not included (but paddings are)
            var targetWidth = iframe.contentWindow.document.body.scrollWidth;
            console.log("targetWidth: ", targetWidth);
            if (targetHeight > 10) {
                $(iframe).css("height", ""); // reset style which was originally calc(100vh - 100px);
                var addPixelsToCompensateMargins = 40;
                var animatingProperties = {
                    "height": (targetHeight + addPixelsToCompensateMargins) + "px"
                };
                if (targetWidth > 10) {
                    modal.css("min-width", "initial");
                    $(iframe).css("width", ""); // reset style
                    animatingProperties.width = (targetWidth + addPixelsToCompensateMargins) + "px";
                }

                $(iframe).animate(
                    animatingProperties,
                    {
                        complete: function () {
                            $(this).css("display", "block"); // so that no white horizontal block is shown between iframe and footer or bottom limit of the modal
                        }
                    }
                );
            }
            else if (retry !== false) {
                setTimeout(function () {
                    window.resizeIframe(iframe, false);
                }, 1000);
            }
        };

        Assembl.slider.show(window.modal_instance);

        return false; // so that we cancel the normal behaviour of the clicked link (aka making browser go to "target" attribute of the "a" tag)
    },

    invalidateWidgetDataAssociatedToIdea: function (idea_id) {
        //console.log("invalidateWidgetDataAssociatedToIdea(", idea_id, ")");
        //console.log("this.cachedWidgetDataAssociatedToIdeasPromises: ", this.cachedWidgetDataAssociatedToIdeasPromises);
        if (idea_id == "all")
            this.cachedWidgetDataAssociatedToIdeasPromises = {};
        else
            this.cachedWidgetDataAssociatedToIdeasPromises[idea_id] = null;
    },

    // TODO: do it also for the vote widgets (not only the creativity widgets), and use this promise where we need vote widgets
    getWidgetDataAssociatedToIdeaPromise: function (idea_id) {
        //console.log("getWidgetDataAssociatedToIdeaPromise()");
        var returned_data = {};
        var that = this;
        var deferred = $.Deferred();

        if (idea_id in that.cachedWidgetDataAssociatedToIdeasPromises && that.cachedWidgetDataAssociatedToIdeasPromises[idea_id] != null) {
            //console.log("getWidgetDataAssociatedToIdeaPromise(): we will serve the cached promise");
            that.cachedWidgetDataAssociatedToIdeasPromises[idea_id].done(function (data) {
                deferred.resolve(data);
            });
            return deferred.promise();
        }

        // Get inspiration widgets associated to this idea, via "ancestor_inspiration_widgets"
        // And compute a link to create an inspiration widget

        var inspiration_widgets_url = this.getApiV2DiscussionUrl("ideas/" + this.extractId(idea_id) + "/ancestor_inspiration_widgets");
        var inspiration_widgets = null;
        var inspiration_widget_url = null;
        var inspiration_widget_configure_url = null;
        var showing_widgets_url = this.getApiV2DiscussionUrl("ideas/" + this.extractId(idea_id) + "/showing_widget");

        var locale_parameter = "&locale=" + assembl_locale;

        var inspiration_widget_create_url = "/static/widget/creativity/?admin=1" + locale_parameter + "#/admin/create_from_idea?idea="
            + encodeURIComponent(idea_id + "?view=creativity_widget"); // example: "http://localhost:6543/widget/creativity/?admin=1#/admin/configure_instance?widget_uri=%2Fdata%2FWidget%2F43&target=local:Idea%2F3"
        returned_data["inspiration_widget_create_url"] = inspiration_widget_create_url;

        var vote_widget_create_url = "/static/widget/vote/?admin=1#/admin/create_from_idea?idea=" + encodeURIComponent(idea_id + "?view=creativity_widget"); //TODO: add locale_parameter?
        returned_data["vote_widget_create_url"] = vote_widget_create_url;

        // TODO: Add creativity session creation URLs.

        $.when(
            $.getJSON(inspiration_widgets_url),
            $.getJSON(showing_widgets_url)
        ).done(function(result, result2){
            // done() callback parameters are [data, textStatus, jqXHR], so we extract data
            var data = result[0];
            var data2 = result2[0];

            if (data
                && data instanceof Array
                && data.length > 0
                ) {
                inspiration_widgets = data;
                returned_data["inspiration_widgets"] = inspiration_widgets;
                var inspiration_widget_uri = null;
                if ( "@id" in inspiration_widgets[inspiration_widgets.length - 1] )
                {
                    inspiration_widget_uri = inspiration_widgets[inspiration_widgets.length - 1]["@id"]; // for example: "local:Widget/52"

                    console.log("inspiration_widget_uri: ", inspiration_widget_uri);

                    inspiration_widget_url = "/static/widget/creativity/?config="
                        + Ctx.getUrlFromUri(inspiration_widget_uri)
                        + "&target="
                        + idea_id
                        + locale_parameter; // example: "http://localhost:6543/widget/creativity/?config=/data/Widget/43&target=local:Idea/3#/"
                    //console.log("inspiration_widget_url: ", inspiration_widget_url);
                    returned_data["inspiration_widget_url"] = inspiration_widget_url;

                    inspiration_widget_configure_url = "/static/widget/creativity/?admin=1"
                        + locale_parameter
                        + "#/admin/configure_instance?widget_uri="
                        + Ctx.getUrlFromUri(inspiration_widget_uri)
                        + "&target="
                        + idea_id; // example: "http://localhost:6543/widget/creativity/?admin=1#/admin/configure_instance?widget_uri=%2Fdata%2FWidget%2F43&target=local:Idea%2F3"
                    returned_data["inspiration_widget_configure_url"] = inspiration_widget_configure_url;
                }
                else
                {
                    console.log("error: inspiration widget has no @id field");
                }
            }

            if (data2
                && data2 instanceof Array
                && data2.length > 0
                ) {
                var vote_widgets = [];
                for ( var i = 0; i < data2.length; ++i )
                {
                    if ( "@id" in data2[i] )
                    {
                        var widget_uri = data2[i]["@id"]; // for example: "local:Widget/52"
                        vote_widgets.push({
                            widget_uri: widget_uri,
                            vote_url: "/static/widget/vote/?config=" + widget_uri +encodeURIComponent("?target="+idea_id),
                            configure_url: "/static/widget/vote/?admin=1#/admin/configure_instance?widget_uri=" +widget_uri + "&target=" + idea_id
                        });
                    }
                    else
                    {
                        console.log("error: vote widget has no @id field");
                    }
                }
                returned_data["vote_widgets"] = vote_widgets;
            }

            //deferred.resolve(returned_data); // we rather resolve even if a request failed, so that we still get the widget instanciation links
        }).always(function(){
            deferred.resolve(returned_data);
        });

        that.cachedWidgetDataAssociatedToIdeasPromises[idea_id] = deferred;


        return deferred.promise();
    },


    getDraggedAnnotation: function () {
        return this._draggedAnnotation;
    },

    setDraggedAnnotation: function (annotation, annotatorEditor) {
        this._draggedAnnotation = annotation;
        this._annotatorEditor = annotatorEditor;
    },

    /**
     * @set {Segment}
     * Sets the current
     */
    setDraggedSegment: function(segment){
      this._draggedSegment = segment;
    },

    /**
     * @return {Segment}
     */
    getDraggedSegment: function () {
        var segment = this._draggedSegment;
        //this.setDraggedSegment(null); not necessary;

        if (segment) {
            delete segment.attributes.highlights;
        }

        return segment;
    },

    /**
     * @return {Idea}
     */
    popDraggedIdea: function () {
        if (this.ideaList && this.draggedIdea) {

            Assembl.vent.trigger('ideaList:removeIdea', this.draggedIdea);
        }

        var idea = this.draggedIdea;
        this.draggedIdea = null;

        return idea;
    },

    /**
     * fallback: synchronously load app.csrfToken
     */
    loadCsrfToken: function (async) {
        var that = this;
        $.ajax('/api/v1/token', {
            async: async,
            dataType: 'text',
            success: function (data) {
                that.setCsrfToken(data);
            }
        });
    },

    /**
     * Return the Post related to the given annotation
     * @param {Annotation} annotation
     * @return {Message}
     */
    getPostIdFromAnnotation: function (annotation) {
        var span = $(annotation.highlights[0]),
            messageId = span.closest('[id^="' + this.ANNOTATOR_MESSAGE_BODY_ID_PREFIX + '"]').attr('id');

        return messageId.substr(this.ANNOTATOR_MESSAGE_BODY_ID_PREFIX.length);
    },

    /**
     * Saves the current annotation if there is any
     */
    saveCurrentAnnotationAsExtract: function () {
        if (this.getCurrentUser().can(Permissions.ADD_EXTRACT)) {
            this._annotatorEditor.element.find('.annotator-save').click();
        } else {
            alert("Error: You don't have the permission to save this annotation as an extract.");
            this._annotatorEditor.element.find('.annotator-cancel').click();
        }
        //Saving the annotation as an extract is the end of the annotation's lifecycle
        this.setDraggedAnnotation(null);
    },

    /**
     * Creates the selection tooltip
     */
    __createAnnotatorSelectionTooltipDiv: function () {
        this.annotatorSelectionTooltip = $('<div>', { 'class': 'textbubble' });
        $(document.body).append(this.annotatorSelectionTooltip.hide());
    },

    /**
     * Shows the dragbox when user starts dragging an element
     * @param  {Event} ev The event object
     * @param  {String} text The text to be shown in the .dragbox
     */
    showDragbox: function (ev, text) {

        var dragbox_max_length = 25,
            that = this;

        if (ev.originalEvent) {
            ev = ev.originalEvent;
        }

        if (this.dragbox === null) {
            this.dragbox = document.createElement('div');
            this.dragbox.className = 'dragbox';
            this.dragbox.setAttribute('hidden', 'hidden');

            $(document.body).append(this.dragbox);
        }

        this.dragbox.removeAttribute('hidden');

        text = text || i18n.gettext('Extract');

        if (text.length > dragbox_max_length) {
            text = text.substring(0, dragbox_max_length) + '...';
        }
        this.dragbox.innerHTML = text;

        if (ev.dataTransfer) {
            ev.dataTransfer.dropEffect = 'all';
            ev.dataTransfer.effectAllowed = 'copy';
            ev.dataTransfer.setData("text/plain", text);
            ev.dataTransfer.setDragImage(this.dragbox, 10, 10);
        }

        $(ev.currentTarget).one("dragend", function () {
            that.dragbox.setAttribute('hidden', 'hidden');
        });
    },

    /**
     * Return the current time
     * @return {timestamp}
     */
    getCurrentTime: function () {
        return (new Date()).getTime();
    },

    /**
     * Format string function
     * @param {string} string
     * @param {string} ...
     * @return {string}
     */
    format: function (str) {
        var args = [].slice.call(arguments, 1);

        return str.replace(/\{(\d+)\}/g, function (a, b) {
            return typeof args[b] != 'undefined' ? args[b] : a;
        });
    },

    /**
     * Format date
     * @param {Date|timestamp} date
     * @param {string} [format=app.dateFormat] The format
     * @return {string}
     */
    formatDate: function (date, format) {
        format = format || this.dateFormat;

        if (date === null) {
            return '';
        }

        date = new Moment(date);
        return date.format(format);
    },

    /**
     * Returns a fancy date (ex: a few seconds ago), or a formatted precise date if precise is true
     * @return {String}
     */
    getNiceDateTime: function (date, precise, with_time, forbid_future) {
        // set default values
        precise = (precise === undefined) ? false : precise;
        with_time = (with_time === undefined) ? true : with_time;
        //var momentDate = moment(date);

        // we assume that server datetimes are given in UTC format
        // (Right now, the server gives UTC datetimes but is not explicit enough because it does not append "+0000". So Moment thinks that the date is not in UTC but in user's timezone. So we have to tell it explicitly, using .utc())
        var momentDate = Moment.utc(date);
        momentDate.local(); // switch off UTC mode, which had been activated using .utc()

        if ( forbid_future ) { // server time may be ahead of us of some minutes. In this case, say it was now
            var now = Moment();
            var now_plus_delta = Moment().add(30, 'minutes');
            if ( momentDate > now && momentDate < now_plus_delta )
                momentDate = now;
        }

        if (momentDate) {
            if (precise == true) {
                if (with_time == true)
                    return momentDate.format('LLLL');
                else
                    return momentDate.format('LL');
            }
            var one_year_ago = Moment().subtract(1, 'years');
            if (momentDate.isBefore(one_year_ago)) { // show the exact date
                return momentDate.format('L');
            }
            else { // show "x days ago", or something like that
                return momentDate.fromNow();
            }
        }
        return momentDate; // or date?
    },

    // without time
    getNiceDate: function (date, precise, forbid_future) {
        if (precise === undefined)
            precise = true;
        return this.getNiceDateTime(date, precise, false, true);
    },

    /**
     * Returns a nicely formatted date, but not an approximative expression (i.e. not "a few seconds ago")
     * @return {String}
     */
    getReadableDateTime: function (date) {
        return this.getNiceDateTime(date, true);
    },

    getErrorMessageFromAjaxError: function(response) {
        var message = response.responseText;
        try {
            message = JSON.parse(message);
            return message.error;  // may be undefined
        } catch (Exception) {
            // maybe a text message
        }
        var pos = message.indexOf('ERRMSG:');
        if (pos > 0) {
            message = message.substr(pos+7);
            pos = message.indexOf("<");
            if (pos > 0) {
                message = message.substr(0, pos);
            }
            return message;
        }
        return null;
    },

    /**
     * Shows the context menu given the options
     * @param {Number} x
     * @param {Number} y
     * @param {Object} scope The scope where the functions will be executed
     * @param {Object<string:function>} items The items on the context menu
     */
    //FIXME: this method never use in app
    /*showContextMenu: function(x, y, scope, items){
     var menu_width = 150;


     this.hideContextMenu();

     var menu = $('<div>').addClass('contextmenu');

     // Adjusting position
     if( (x + menu_width) > (window.innerWidth - 50) ){
     x = window.innerWidth - menu_width - 10;
     }

     menu.css({'top': y, 'left': x});

     _.each(items, function(func, text){
     var item = $('<a>').addClass('contextmenu-item').text(text);
     item.on('click', func.bind(scope) );
     menu.append( item );
     });

     $(document.body).append( menu );
     window.setTimeout(function(){
     $(document).on("click", this.hideContextMenu);
     });

     // Adjusting menu position
     var menuY = menu.height() + y,
     maxY = window.innerHeight - 50;

     if( menuY >= maxY ){
     menu.css({'top': maxY - menu.height() });
     }
     },*/

    /**
     * Shows the segment source in the better way related to the source
     * e.g.: If it is an email, opens it, if it is a webpage, open in another window ...
     * @param {Segment} segment
     */
    showTargetBySegment: function (segment) {
        var target = segment.get('target');

        switch (target['@type']) {
            case 'Webpage':
                window.open(target.url, "_blank");
                break;

            default:
                // This will treat:
                // ['Email', 'Post', 'AssemblPost', 'SynthesisPost', 'ImportedPost', 'PostWithMetadata', 'IdeaProposalPost']

                var selector = this.format('[data-annotation-id="{0}"]', segment.id);

                Assembl.vent.trigger('messageList:showMessageById', segment.get('idPost'), function () {
                    $(selector).highlight();
                });

                break;
        }
    },

    /**
     * @see http://blog.snowfinch.net/post/3254029029/uuid-v4-js
     * @return {String} an uuid
     */
    //FIXME: this method never use in app
    /*createUUID: function(){
     var uuid = "", i = 0, random;

     for (; i < 32; i++) {
     random = Math.random() * 16 | 0;

     if (i == 8 || i == 12 || i == 16 || i == 20) {
     uuid += "-";
     }

     uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
     }

     return uuid;
     },*/

    /**
     * Given the string in the format "local:ModelName/{id}" returns the id
     * @param  {String} str
     * @return {String}
     */
    extractId: function (str) {
        return str.split('/')[1];
    },

    /**
     * @param  {Number} userID The user's ID
     * @param  {Number} [size=44] The avatar size
     * @return {String} The avatar's url formatted with the given size
     */
    formatAvatarUrl: function (userID, size) {
        size = size || 44;
        return this.format("/user/id/{0}/avatar/{1}", userID, size);
    },

    /** This removes (rather than escape) all html tags
     * @param  {String} html
     * @return {String} The new string without html tags
     */
    stripHtml: function (html) {
        return html ? $.trim($('<div>' + html + '</div>').text()) : html;
    },

    /** Convert all applicable characters to HTML entities
     * @param  {String} html
     */
    htmlEntities: function(str){
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    /**
     * Use the browser's built-in functionality to quickly and safely
     * escape the string
     */
    escapeHtml: function (str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    },

    /**
     * UNSAFE with unsafe strings; only use on previously-escaped ones!
     */
    unescapeHtml: function (escapedStr) {
      var div = document.createElement('div');
      div.innerHTML = escapedStr;
      var child = div.childNodes[0];
      return child ? child.nodeValue : '';
    },

    /**
     * @event
     */
    onDropdownClick: function (e) {
        if (!e || !(e.target))
            return;
        var dropdown = $(e.target);
        if (!dropdown.hasClass("dropdown-label"))
            dropdown = dropdown.parents(".dropdown-label").first();
        if (!dropdown)
            return;

        var parent = dropdown.parent();

        var onMouseLeave = function (e) {
            parent.removeClass('is-open');
            e.stopPropagation(); // so that onDropdownClick() is not called again immediately after when we click
        };

        if (parent.hasClass('is-open')) {
            onMouseLeave();
            return;
        }

        parent.addClass('is-open');
        $(document.body).one('click', onMouseLeave);
    },

    /**
     * @event
     */
    onAjaxError: function (ev, jqxhr, settings, exception) {
        if (jqxhr.handled)
            return;

        // ignore Ajax errors which come from outside (sub-)domains. This is useful for oembed related errors
        var getHostnameFromUrl = function(data) { // hostname examples: "localhost", "localhost:4321"
            var a = document.createElement('a');
            a.href = data;
            return a.hostname;
        };
        if ( settings && "url" in settings && window.location.hostname != getHostnameFromUrl(settings.url) )
        {
            console.log("ignoring Ajax error from outside domain: ", getHostnameFromUrl(settings.url));
            console.log("the URL which return an error was: ", settings.url);
            return;
        }


        var message = i18n.gettext('ajax error message:');
        message = "url: " + settings.url + "\n" + message + "\n" + exception;

        var model = new Backbone.Model({
            msg: message
        });

        var Modal = Backbone.Modal.extend({
            template: _.template($('#tmpl-ajaxError').html()),
            className: 'group-modal popin-wrapper modal-ajaxError',
            cancelEl: '.close, .js_close',
            model: model,
            initialize: function () {
                this.$('.bbm-modal').addClass('popin');
            },
            events: {
                'click .js_reload': 'reload'
            },

            reload: function () {
                window.location.reload()
            }

        });

        var modal = new Modal();

        $('#slider').html(modal.render().el);
    },

    setLocale: function (locale) {
        document.cookie = "_LOCALE_=" + locale + "; path=/";
        location.reload(true);
    },
    InterfaceTypes: {
        SIMPLE: "SIMPLE",
        EXPERT: "EXPERT"
    },
    /** Set the user interface the user wants
     * @param interface_id, one of SIMPLE, EXPERT
     * */
    setInterfaceType: function (interface_id) {
        document.cookie = "interface=" + interface_id + "; path=/";
        location.reload(true);
    },

    getCookieItem: function (sKey) {
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },

    canUseExpertInterface: function () {
        var user = this.getCurrentUser();
        if (user.can(Permissions.ADD_EXTRACT) ||
            user.can(Permissions.EDIT_EXTRACT) ||
            user.can(Permissions.EDIT_MY_EXTRACT) ||
            user.can(Permissions.ADD_IDEA) ||
            user.can(Permissions.EDIT_IDEA) ||
            user.can(Permissions.EDIT_SYNTHESIS) ||
            user.can(Permissions.SEND_SYNTHESIS) ||
            user.can(Permissions.ADMIN_DISCUSSION) ||
            user.can(Permissions.SYSADMIN)
            ) {
            return true;
        }
        else {
            return false;
        }
    },

    /**
     * scrolls to any dom element in the messageList.
     * Unlike scrollToMessage, the element must already be onscreen.
     * This is also called by views/message.js
     *
     * @param el: DOM element to scroll to
     * @param container: el's DOM container which will scroll
     * @param callback:  will be called once animation is complete
     * @param margin:  How much to scroll up or down from the top of the
     * element.  Default is 30px for historical reasons
     * @param animate:  Should the scroll be smooth
     */
    scrollToElement: function (el, container, callback, margin, animate) {
      //console.log("context::scrollToElement called with: ", el, container, callback, margin, animate);
      if (el && _.isFunction(container.size) && container.offset() !== undefined) {
        var panelOffset = container.offset().top,
            panelScrollTop = container.scrollTop(),
            elOffset = el.offset().top,
            target;
        margin = margin || 30;
        if (animate === undefined) {
          animate = true;
        }
        target = elOffset - panelOffset + panelScrollTop - margin;
        //console.log(elOffset, panelOffset, panelScrollTop, margin, target);
        if(animate) {
          container.animate({ scrollTop: target }, { complete: callback });
        }
        else {
          container.scrollTop(target);
          if(_.isFunction(callback)) {
            callback();
          }
        }
      }
    },

    getCurrentInterfaceType: function () {
        var interfaceType = this.getCookieItem('interface');
        if (!this.canUseExpertInterface()) {
            interfaceType = this.InterfaceTypes.SIMPLE
        }
        else {
            if (interfaceType === null) {
                interfaceType = this.InterfaceTypes.EXPERT
            }
        }
        return interfaceType;
    },

    convertUrlsToLinks: function(el) {
        $(el).linkify();
    },

    makeLinksShowOembedOnHover: function(el) {
        var popover = $("#popover-oembed");
        var that = this;

        var triggerHover = function(evt){
            popover.css('position','fixed');
            popover.css('top', (evt.pageY+2) + 'px');
            popover.css('left', evt.pageX + 'px');
            //popover.css('padding', '25px 50px');
            popover.show();

            popover.Oembed($(this).attr("href"),{
                //initiallyVisible: false,
                embedMethod: "fill",
                //apikeys: {
                    //etsy : 'd0jq4lmfi5bjbrxq2etulmjr',
                //},
                //maxHeight: 200, maxWidth:300
                onError: function(){
                    popover.hide();
                },
                afterEmbed: function(){
                    that.popoverAfterEmbed.apply(this);
                }
            });

            var timeoutIdHidePopover = null;

            popover.unbind("mouseleave"); // this avoids handler accumulation (each call to the following popover.mouseleave() adds a handler)
            popover.mouseleave(function(evt){
                var that = this;
                timeoutIdHidePopover = setTimeout(function(){
                    $(that).hide();
                }, 10);
            });

            popover.unbind("mouseenter"); // this avoids handler accumulation (each call to the following popover.mouseenter() adds a handler)
            popover.mouseenter(function(evt){
                window.clearTimeout(timeoutIdHidePopover);
            });
        };

        el.find("a").mouseenter(function(evt){
            var timeoutIdShowPopover = null;
            var that = this;
            timeoutIdShowPopover = window.setTimeout(function(){
                triggerHover.call(that, evt);
            }, 800); // => this is how much time the mouse has to stay on the link in order to trigger the popover
            $(this).mouseout(function(){
                window.clearTimeout(timeoutIdShowPopover);
            });
        });


    },

    /**
     * @init
     */
    initTooltips: function (elm) {
        elm.find('[data-toggle="tooltip"]').tooltip({
            animation: true,
            container: 'body',
            delay: {"show": 500, "hide": 100}
        });
    },

    /**
     * Removes all tooltips from the screen.  Without this, active
     * tooltips (those currently displayed) will be left dangling
     * if the trigger element is removed from the dom.
     */
    removeCurrentlyDisplayedTooltips: function () {
        //console.log("removeCurrentlyDisplayedTooltips() called");
        //This really does need to be global.
        //Should be fast, they are at the top level and there is only
        //a few of them.  Maybe it can be more specific to be faster
        // ex: html > .tipsy I don't know jquery enough to know
        $('.tooltip').remove();
    },

    getAbsoluteURLFromRelativeURL: function(url) {
        if ( url && url[0] == "/" )
            url = url.substring(1);
        return this.format('{0}//{1}/{2}', location.protocol, location.host, url);
    },

    getAbsoluteURLFromDiscussionRelativeURL: function(url) {
        if ( url && url[0] == "/" )
            url = url.substring(1);
        return this.format('{0}//{1}/{2}/{3}', location.protocol, location.host, this.getDiscussionSlug(), url);
    },

    getRelativeURLFromDiscussionRelativeURL: function(url) {
        if ( url && url[0] == "/" )
            url = url.substring(1);
        return this.format('/{0}/{1}', this.getDiscussionSlug(), url);
    },

    isNewUser: function () {
        var currentUser = null,
            connectedUser = null;

        if (window.localStorage.getItem('lastCurrentUser')) {
            currentUser = window.localStorage.getItem('lastCurrentUser').split('/')[1];
        }

        if (this.currentUser.get('@id') !== Roles.EVERYONE) {
            connectedUser = this.currentUser.get('@id').split('/')[1];
        }

        if (currentUser) {
            if (connectedUser != currentUser) {
                window.localStorage.removeItem('expertInterfacegroupItems');
                window.localStorage.removeItem('simpleInterfacegroupItems');
                window.localStorage.removeItem('composing_messages');
            }
        } else {
            window.localStorage.setItem('lastCurrentUser', this.currentUser.get('@id'));
        }

    },
    /**
     * @init
     * inits ALL app components
     */
    init: function () {
        //this.loadCurrentUser();
        Moment.locale(assembl_locale);

        $(document.body).removeClass('preload');
        this.__createAnnotatorSelectionTooltipDiv();
        //this.initTooltips($("body"));

        $(document).on('click', '.dropdown-label', this.onDropdownClick);
        $(document).on('ajaxError', this.onAjaxError);
    },

    debug: function(view, msg){
        var log = debug(view+':');
        log(msg);
    },

    /*
     * Get from database up-to-date information about current logged-in user.
     * And update HTML script tags content accordingly.
     */
    updateCurrentUser: function() {
        var that = this;
        var user = null;
        if (this.getCurrentUserId()) {
            user = this.getCurrentUser();
            user.fetch({
                success: function(model, resp) {
                    //that.setCurrentUser(user);
                    user.fetchPermissionsToScriptTag();
                    user.toScriptTag('current-user-json');
                    that.loadCsrfToken(true);
                }
            });
        } else {
            /*
            user = new Agents.Collection().getUnknownUser();
            that.setCurrentUser(user);
            that.loadCsrfToken(true);
            */
        }
    },

    getJsonFromScriptTag: function (id) {
        var script = document.getElementById(id),
            json;

        if (!script) {
            console.login(this.format("Script tag #{0} doesn't exist", id));
            return {};
        }

        try {
            json = JSON.parse(script.textContent);
        } catch (e) {
            console.log(script.textContent);
            throw new Error("Invalid json. " + e.message);
        }
        return json;
    },

    writeJsonToScriptTag: function (json, id) {
        var script = document.getElementById(id);

        if (!script) { // TODO: maybe we could create it?
            console.login(this.format("Script tag #{0} doesn't exist", id));
            return;
        }

        try {
            script.textContent = JSON.stringify(json);
        } catch (e) {
            throw new Error("Invalid json. " + e.message);
        }
    },
    /**
     * Executor of lazy code
     * ex :
     *
     * Normale code
     *
     * $(document).ready(function() {
     *  // a lot of li's, lets say 500
     *   $('li').each(function() {
     *       $(this).bind('click', function() {
     *           alert('Yeah you clicked me');
     *       });
     *   });
     * });
     *
     * After refactoring
     *
     *  $(document).ready(function() {
     *       // a lot of li's, lets say 500
     *       $('li').each(function() {
     *       var self = this, doBind = function() {
     *           $(self).bind('click', function() {
     *               alert('Yeah you clicked me');
     *           });
     *       };
     *       $.queue.add(doBind, this);
     *       });
     *  });
     *
     *
     * */
    queue: {
        _timer: null,
        _queue: [],
        add: function(fn, context, time) {
            var setTimer = function(time) {
                queue._timer = setTimeout(function() {
                    time = queue.add();
                    if (queue._queue.length) {
                        setTimer(time);
                    }
                }, time || 2);
            }

            if (fn) {
                queue._queue.push([fn, context, time]);
                if (queue._queue.length == 1) {
                    setTimer(time);
                }
                return;
            }

            var next = queue._queue.shift();
            if (!next) {
                return 0;
            }
            next[0].call(next[1] || window);
            return next[2];
        },
        clear: function() {
            clearTimeout(queue._timer);
            queue._queue = [];
        }
    }

}

module.exports = new Context();