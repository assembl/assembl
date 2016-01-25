'use strict';

var Backbone = require('../shims/backbone.js'),
    Raven = require('raven-js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    FlipSwitchButtonModel = require('../models/flipSwitchButton.js'),
    FlipSwitchButtonView = require('./flipSwitchButton.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Promise = require('bluebird');

/**
 * Constants
 */
var DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX = "js_defaultMessageView-",
    MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX = "js_messageList-view-";

var MessageListHeader = Marionette.ItemView.extend({
  template: '#tmpl-messageListHeader',
  className: 'messageListHeaderItsMe',
  initialize: function(options) {
    //console.log("MessageListHeader::initialize()");
    var that = this;

    this.options = options;
    this.ViewStyles = options.ViewStyles;
    this.messageList = options.messageList;
    this.defaultMessageStyle = options.defaultMessageStyle;
    this.expertViewIsAvailable = options.expertViewIsAvailable;
    this.isUsingExpertView = options.isUsingExpertView;
    this.currentViewStyle = options.currentViewStyle;
    this.currentQuery = options.currentQuery;

    this.toggleButtonModelInstance = new FlipSwitchButtonModel({
      labelOn: "on", // TODO: i18n
      labelOff: "off", // TODO: i18n
      isOn: this.isUsingExpertView
    });
    this.toggleButtonModelInstance.on("change:isOn", function() {
      //console.log("messageListHeader got the change:isOn event");
      that.toggleExpertView();
    });
  },

  ui: {
    queryInfo: ".messageList-query-info",
    expertViewToggleButton: '.show-expert-mode-toggle-button',
    viewStyleDropdown: ".js_messageListViewStyle-dropdown",
    defaultMessageViewDropdown: ".js_defaultMessageView-dropdown",
    filtersDropdown: '.js_filters-dropdown'
  },

  events: function() {
    var that = this;
    var data = {
        //'click @ui.expertViewToggleButton': 'toggleExpertView' // handled by change:isOn model event instead
    };

    _.each(this.ViewStyles, function(messageListViewStyle) {
      var key = 'click .' + messageListViewStyle.css_class;
      data[key] = 'onSelectMessageListViewStyle';
    });

    _.each(Ctx.AVAILABLE_MESSAGE_VIEW_STYLES, function(messageViewStyle) {
      var key = 'click .' + that.getMessageViewStyleCssClass(messageViewStyle);
      data[key] = 'onSelectDefaultMessageViewStyle';
    });

    _.each(this.messageList.currentQuery.availableFilters, function(availableFilterDef) {
          var candidateFilter = new availableFilterDef();
          if (_.isFunction(candidateFilter.getImplicitValuePromise)) {
            var key = 'click .' + candidateFilter.getAddButtonCssClass();
            data[key] = 'onAddFilter';
          }
        });

    //console.log(data);
    return data;
  },

  serializeData: function() {
    return {
      expertViewIsAvailable: this.expertViewIsAvailable,
      isUsingExpertView: this.isUsingExpertView,
      availableViewStyles: this.ViewStyles,
      Ctx: Ctx,
      currentViewStyle: this.currentViewStyle
    };
  },

  onRender: function() {
    this.renderMessageListViewStyleDropdown();
    this.renderDefaultMessageViewDropdown();
    this.renderMessageListFiltersDropdown();
    this.renderToggleButton();

    if (!this.isUsingExpertView) {
      this.renderUserViewButtons();
    }

    this.renderQueryInfo();
    Ctx.initTooltips(this.$el);
    Assembl.vent.trigger("requestTour", "message_list_options");
  },

  renderToggleButton: function() {
    //console.log("messageListHeader::renderToggleButton()");
    // check that ui is here (it may not be, for example if logged out). I could not use a region here because the region would not always have been present in DOM, which is not possible
    var el = this.ui.expertViewToggleButton;
    if (el && this.expertViewIsAvailable) {
      var v = new FlipSwitchButtonView({model: this.toggleButtonModelInstance});
      el.html(v.render().el);
    }
  },

  toggleExpertView: function() {
    //console.log("messageListHeader::toggleExpertView()");
    this.isUsingExpertView = !this.isUsingExpertView;
    this.messageList.triggerMethod("setIsUsingExpertView", this.isUsingExpertView);

    // TODO: avoid waiting for the end of animation, by re-rendering only the content (region?) on the left (not this button)
    var that = this;
    setTimeout(function() {
      that.render();
    }, 500);
  },

  /**
   * Renders the messagelist view style dropdown button
   */
  renderMessageListViewStyleDropdown: function() {
    var that = this,
        html = "";

    html += '<a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">';
    html += this.currentViewStyle.label;
    html += '<span class="icon-arrowdown"></span></a>';
    html += '<ul class="dropdown-menu">';
    _.each(this.ViewStyles, function(messageListViewStyle) {
      html += '<li><a class="' + messageListViewStyle.css_class + '">' + messageListViewStyle.label + '</a></li>';
    });
    html += '</ul>';
    this.ui.viewStyleDropdown.html(html);
  },

  /**
   * Renders the messagelist view style dropdown button
   */
  renderMessageListFiltersDropdown: function() {
    var that = this,
        filtersPromises = [];

    _.each(this.messageList.currentQuery.availableFilters, function(availableFilterDef) {
          var candidateFilter = new availableFilterDef(),

          implicitValuePromise = undefined;
          if (_.isFunction(candidateFilter.getImplicitValuePromise)) {
            implicitValuePromise = candidateFilter.getImplicitValuePromise();
            if (implicitValuePromise !== undefined) {
              filtersPromises.push(Promise.join(candidateFilter.getLabelPromise(), implicitValuePromise, function(label, value) {
                if (value !== undefined) {
                  return '<li><a class="' + candidateFilter.getAddButtonCssClass() + '" data-filterid="' + candidateFilter.getId() + '" data-toggle="tooltip" title="" data-placement="left" data-original-title="' + candidateFilter.getHelpText() + '">' + label + '</a></li>';
                }
                else {
                  return '';
                }
              }));
            }
          }
        });
    Promise.all(filtersPromises).then(function(filterButtons) {
          var html = "";
          html += '<a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">';
          html += i18n.gettext('Add filter');
          html += '<span class="icon-arrowdown"></span></a>';
          html += '<ul class="dropdown-menu">';
          html += filterButtons.join('');
          html += '</ul>';
          that.ui.filtersDropdown.html(html);
        })

  },

  /**
   * get a view style css_class
   * @param {messageViewStyle}
   * @return {String}
   */
  getMessageViewStyleCssClass: function(messageViewStyle) {
    return DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX + messageViewStyle.id;
  },

  /**
   * get a view style definition by id
   * @param {messageViewStyle.id}
   * @return {messageViewStyle or undefined}
   */
  getMessageListViewStyleDefByCssClass: function(messageListViewStyleClass) {
    return _.find(this.ViewStyles, function(viewStyle) {
      return viewStyle.css_class == messageListViewStyleClass;
    });
  },

  /**
   * get a view style definition by id
   * @param {messageViewStyle.id}
   * @return {messageViewStyle or undefined}
   */
  getMessageViewStyleDefByCssClass: function(messageViewStyleClass) {
    var that = this;
    return _.find(Ctx.AVAILABLE_MESSAGE_VIEW_STYLES, function(messageViewStyle) {
      return that.getMessageViewStyleCssClass(messageViewStyle) == messageViewStyleClass;
    });
  },

  /**
   * @event
   */
  onSelectMessageListViewStyle: function(e) {
    //console.log("messageListHeader::onSelectMessageListViewStyle()");
    var messageListViewStyleClass,
        messageListViewStyleSelected,
        classes = $(e.currentTarget).attr('class').split(" ");
    messageListViewStyleClass = _.find(classes, function(cls) {
      return cls.indexOf(MESSAGE_LIST_VIEW_STYLES_CLASS_PREFIX) === 0;
    });
    var messageListViewStyleSelected = this.getMessageListViewStyleDefByCssClass(messageListViewStyleClass);

    this.messageList.setViewStyle(messageListViewStyleSelected);
    this.messageList.render();
  },

  /**
   * @event
   */
  onSelectDefaultMessageViewStyle: function(e) {
    var classes = $(e.currentTarget).attr('class').split(" "),
        defaultMessageListViewStyleClass;
    defaultMessageListViewStyleClass = _.find(classes, function(cls) {
      return cls.indexOf(DEFAULT_MESSAGE_VIEW_LI_ID_PREFIX) === 0;
    });
    var messageViewStyleSelected = this.getMessageViewStyleDefByCssClass(defaultMessageListViewStyleClass);

    this.defaultMessageStyle = messageViewStyleSelected;
    this.messageList.triggerMethod("setDefaultMessageStyle", messageViewStyleSelected);

    //this.setIndividualMessageViewStyleForMessageListViewStyle(messageViewStyleSelected);
    this.messageList.triggerMethod("setIndividualMessageViewStyleForMessageListViewStyle", messageViewStyleSelected);

    this.renderDefaultMessageViewDropdown();
  },

  /**
   * @event
   */
  onAddFilter: function(ev) {
      var that = this,
          filterId = ev.currentTarget.getAttribute('data-filterid'),
          filterDef = this.messageList.currentQuery.getFilterDefById(filterId),
          filter = new filterDef(),
          queryChanged = false;

      var execute = function(value){
        queryChanged = that.messageList.currentQuery.addFilter(filterDef, value);
        if (queryChanged) {
          that.messageList.render();
        }
      };

      var should_ask_value_from_user = "should_ask_value_from_user" in filterDef ? filterDef.should_ask_value_from_user : false;
      if ( should_ask_value_from_user && "askForValue" in filter && _.isFunction(filter.askForValue) ){
        filter.askForValue();
        filter.getImplicitValuePromise().then(function(implicitValue) {
          if ( implicitValue ){
            that.messageList.currentQuery.clearFilter(filterDef);
            execute(implicitValue);
          }
        });
      }
      else {
        filter.getImplicitValuePromise().then(function(implicitValue) {
          execute(implicitValue);
        });
      }

    },

  /**
   * Renders the default message view style dropdown button
   */
  renderDefaultMessageViewDropdown: function() {
    var that = this,
        html = "";

    html += '<a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">';
    html += this.defaultMessageStyle.label;
    html += '<span class="icon-arrowdown"></span></a>';
    html += '<ul class="dropdown-menu">';
    _.each(Ctx.AVAILABLE_MESSAGE_VIEW_STYLES, function(messageViewStyle) {
      html += '<li><a class="' + that.getMessageViewStyleCssClass(messageViewStyle) + '">' + messageViewStyle.label + '</a></li>';
    });
    html += '</ul>';
    this.ui.defaultMessageViewDropdown.html(html);
  },

  /**
   * Renders the search result information
   */
  renderUserViewButtons: function() {
    var that = this,
        resultNumTotal,
        resultNumUnread;

    _.each(this.ViewStyles, function(viewStyle) {
      if (that.currentViewStyle === viewStyle) {
        that.$("."+viewStyle.css_class).addClass('selected');
      }
      else {
        that.$("."+viewStyle.css_class).removeClass('selected');
      }
    });

    //this.currentQuery.getResultNumTotal() === undefined ? resultNumTotal = '' : resultNumTotal = i18n.sprintf("%d", this.currentQuery.getResultNumTotal());
    this.$("."+this.ViewStyles.THREADED.css_class).html(this.ViewStyles.THREADED.label);

    this.$("."+this.ViewStyles.RECENTLY_ACTIVE_THREADS.css_class).html(this.ViewStyles.RECENTLY_ACTIVE_THREADS.label);
    //this.currentQuery.getResultNumUnread() === undefined ? resultNumUnread = '' : resultNumUnread = i18n.sprintf("%d", this.currentQuery.getResultNumUnread());

    this.$("."+this.ViewStyles.NEW_MESSAGES.css_class).html(this.ViewStyles.NEW_MESSAGES.label);
    this.$("."+this.ViewStyles.REVERSE_CHRONOLOGICAL.css_class).html(this.ViewStyles.REVERSE_CHRONOLOGICAL.label);
  },

  /**
   * Renders the search result information
   */
  renderQueryInfo: function() {
      var that = this;
      this.currentQuery.getHtmlDescriptionPromise().then(function(htmlDescription) {
        that.ui.queryInfo.html(htmlDescription);
      })

    }
});

module.exports = MessageListHeader;
