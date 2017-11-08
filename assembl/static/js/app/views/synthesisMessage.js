'use strict';
/**
 * 
 * @module app.views.synthesisMessage
 */

var Ctx = require('../common/context.js'),
    LangString = require('../models/langstring.js'),
    MessageView = require('./message.js'),
    Synthesis = require('../models/synthesis.js'),
    SynthesisPanel = require('./synthesisPanel.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Promise = require('bluebird');

/**
 * @class app.views.synthesisMessage.MessageView
 */
var SynthesisMessageView = MessageView.extend({
  constructor: function SynthesisMessageView() {
    MessageView.apply(this, arguments);
  },

  /**
   * @init
   */
  initialize: function(obj) {
    MessageView.prototype.initialize.apply(this, arguments);
    this.stopListening(this.messageListView, 'annotator:initComplete', this.onAnnotatorInitComplete);
    this.synthesisId = this.model.get('publishes_synthesis');
  },

  /**
   * The thread message template
   * @type {_.template}
   */
  template: Ctx.loadTemplate('message'),

  /**
   * Meant for derived classes to override
   * @type {}
   */
  transformDataBeforeRender: function(data) {
    data['subject'] = new LangString.Model.Empty()
    data['body'] = new LangString.Model.Empty();
    if (this.viewStyle == this.availableMessageViewStyles.PREVIEW) {
      data['bodyFormat'] = "text/plain";
    }

    return data;
  },
  /**
   * Meant for derived classes to override
   * @type {}
   */
  postRender: function() {
      var that = this,
          body,
          subject,
          introduction,
          collectionManager = new CollectionManager();

      Promise.join(
        collectionManager.getAllSynthesisCollectionPromise(),
        collectionManager.getUserLanguagePreferencesPromise(Ctx),
        function(allSynthesisCollection, translationData) {
          var synthesis = allSynthesisCollection.get(that.synthesisId);
          if (!synthesis) {
            throw Error("BUG: Could not get synthesis after post. Maybe too early.")
          }

          subject = synthesis.get('subject').bestValue(translationData);
          that.$('.message-subject').html(subject);
          if (that.viewStyle == that.availableMessageViewStyles.PREVIEW) {
            //Strip HTML from preview
            //bodyFormat = "text/plain";

            introduction = synthesis.get('introduction').bestValue(translationData);
            body = MessageView.prototype.generateBodyPreview(introduction);
            that.$('.message-body > p').empty().html(body);
          }
          else {
            that.synthesisPanel = new SynthesisPanel({
              model: synthesis,
              messageListView: that.messageListView,
              panelWrapper: that.messageListView.getPanelWrapper(),
              el: that.$('.message-body'),
              template: '#tmpl-synthesisPanelMessage',
              showAsMessage: true
            });
            that.synthesisPanel.render();
          }
        });
      this.$(".message-body").removeClass('js_messageBodyAnnotatorSelectionAllowed');

      return;
    }

});

module.exports = SynthesisMessageView;

