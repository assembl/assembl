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
    Ctx = require('../../common/context.js');

var StatsModal = Backbone.Modal.extend({
  constructor: function StatsModal() {
    Backbone.Modal.apply(this, arguments);
  },

  template: '#tmpl-discussionStatisticsModal',
  className: 'group-modal popin-wrapper',
  cancelEl: '.js_close',
  keyControl: false,
  events: {
    'click #get_stats': 'getStats',
    'click #get_participant_stats': 'getParticipantStats',
  },
  initialize: function(options) {
    Ctx.setCurrentModalView(this);
  },
  serializeData: function() {
    return {
      isDiscussionAdmin: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION),
    };
  },
  doDownload: function(url, filename) {
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
  getStats: function(ev) {
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
    'posts', 'cumulative_posts', 'liking', 'cumulative_liking', 'liked', 'cumulative_liked',
    'replies_received', 'cumulative_replies_received', 'active'],
  getParticipantStats: function(ev) {
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

module.exports = StatsModal;
