/**
 *
 * @module app.views.discussionStatisticsModal
 */
var Backbone = require('backbone'),
    Marionette = require('../../shims/marionette.js'),
    i18n = require('../../utils/i18n.js'),
    $ = require('jquery'),
    _ = require('underscore'),
    Permissions = require('../../utils/permissions.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Ctx = require('../../common/context.js');


var DiscussionStatisticsView = Marionette.LayoutView.extend({
  constructor: function DiscussionStatisticsView() {
    Marionette.LayoutView.apply(this, arguments);
  },
  template: '#tmpl-discussionStatisticsModal',

  events: {
    'click #get_stats': 'getStats',
    'click #get_participant_stats': 'getParticipantStats',
  },
  initialize: function(options) {
    var that = this,
        cm = new CollectionManager();
    this.discussionStartDate = Ctx.formatDate(new Date(), 'YYYY-MM-DD');
    cm.getDiscussionModelPromise().then(function(discussion) {
      var field = that.$("#start_date");
      that.discussionStartDate = discussion.get('creation_date').substr(0, 10);
      if (field) {
        field.val(that.discussionStartDate);
      }
    });
  },
  serializeData: function() {
    return {
      isDiscussionAdmin: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION),
      usersFirstVisitURL: Ctx.getApiV2DiscussionUrl("visitors?first=true"),
      usersLastVisitURL: Ctx.getApiV2DiscussionUrl("visitors"),
    };
  },
  onRender: function(){
    // pre-fill a default date, so that the UI can be used right away
    var d = Ctx.formatDate(new Date(), 'YYYY-MM-DD');
    this.$("#start_date").val(this.discussionStartDate);
    this.$("#end_date").val(d);
  },
  doDownload: function(url, filename) {
    // TODO: This will probably fail in IE, see
    // http://stackoverflow.com/questions/13405129/javascript-create-and-save-file
    var el = this.$el,
        a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.class = 'hidden';
    a.id = "hidden_href"
    el.append(a);
    a.click();
    setTimeout(function() {
      el.find('#hidden_href').remove();
    }, 0);
  },
  addCommonStats: function(url) {
    var separator = "?",
        fields = this.$el.find('fieldset'),
        val = fields.children('#start_date').val();
    if (val) {
      url += separator + "start=" + val;
      separator = "&";
    }
    val = fields.children('#end_date').val();
    if (val) {
      url += separator + "end=" + val;
      separator = "&";
    }
    val = fields.children('#interval').val();
    if (val) {
      url += separator + "interval=" + val;
      separator = "&";
    }
    val = fields.children('#format').val();
    if (val) {
      url += separator + "format=" + val;
      separator = "&";
    }
    return url;
  },
  checkDates: function() {
    var fields = this.$el.find('fieldset'),
        startDate = fields.children('#start_date').val(),
        endDate = fields.children('#end_date').val();
    if (endDate <= startDate) {
      alert(_("The end date should be later than the start date"));
    }
    return (endDate > startDate);
  },
  getStats: function(ev) {
    if (!this.checkDates()) {
      ev.preventDefault();
      return;
    }
    try {
      var url = '/time_series_analytics';
      url = this.addCommonStats(url);
      url = Ctx.getApiV2DiscussionUrl(url);
      this.doDownload(url, Ctx.getDiscussionSlug()+"_stats."+this.$el.find('#format').val());
    } catch (e) {
      alert(e);
    }
    ev.preventDefault();
  },
  participantFields: [
    'posts', 'cumulative_posts', 'replies_received', 'cumulative_replies_received', 'active',
    'liking', 'cumulative_liking', 'liked', 'cumulative_liked',
    'disagreeing', 'cumulative_disagreeing', 'disagreed', 'cumulative_disagreed',
    'misunderstanding', 'cumulative_misunderstanding', 'misunderstood', 'cumulative_misunderstood',
    'info_requesting', 'cumulative_info_requesting', 'info_requested', 'cumulative_info_requested',
    ],
  getParticipantStats: function(ev) {
    if (!this.checkDates()) {
      ev.preventDefault();
      return;
    }
    var val, separator = "?",
        fields = this.$el.find('fieldset'),
        url = '/participant_time_series_analytics';
    try {
      url = this.addCommonStats(url);
      if (url.indexOf(separator) > 0) {
        separator = "&";
      }
      for (var i = 0; i < this.participantFields.length; i++) {
        val = this.participantFields[i];
        var field = fields.find('#field_'+val);
        if (field.length && field[0].checked) {
          url += separator + "data=" + val;
          separator = "&";
        }
      }
      val = fields.find('#show_emails');
      if (val.length) {
        url += separator + "show_emails=" + String(!!val[0].checked)
        separator = "&";
      }
      val = fields.children('#sort').val();
      if (val) {
        url += separator + "sort=" + val;
        separator = "&";
      }
      url = Ctx.getApiV2DiscussionUrl(url);
      this.doDownload(url, Ctx.getDiscussionSlug()+"_participant_stats."+fields.children('#format').val());
    } catch (e) {
      alert(e);
    }
    ev.preventDefault();
  },
});


/**
  * The admin modal view
  * It is barely a simple container for the real view: DiscussionStatisticsView
  * @class app.views.modals.DiscussionStatisticsModal
  */
var DiscussionStatisticsModal = Backbone.Modal.extend({
  constructor: function DiscussionStatisticsModal() {
    Backbone.Modal.apply(this, arguments);
  },

  template: '#tmpl-modalWithoutIframe',
  className: 'modal-define-columns popin-wrapper',
  cancelEl: '.close, .js_close',

  initialize: function(options) {
    Ctx.setCurrentModalView(this);
  },

  onRender: function() {
    var contentView = new DiscussionStatisticsView();
    this.$('.js_modal-body').html(contentView.render().el);
  },

  serializeData: function() {
    return {
      modal_title: i18n.gettext('Discussion statistics'),
    };
  },

});

module.exports = DiscussionStatisticsModal;
