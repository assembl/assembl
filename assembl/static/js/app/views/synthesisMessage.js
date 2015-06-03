'use strict';

var ckeditor = require('ckeditor'),
    Ctx = require('../common/context.js'),
    MessageView = require('./message.js'),
    Synthesis = require('../models/synthesis.js'),
    SynthesisPanel = require('./synthesisPanel.js'),
    CollectionManager = require('../common/collectionManager.js');

/**
 * @class views.MessageView
 */
var SynthesisMessageView = MessageView.extend({

    /**
     * @init
     */
    initialize: function (obj) {
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
    transformDataBeforeRender: function (data) {
        data['subject'] = '';
        data['body'] = '';
        if (this.viewStyle == this.availableMessageViewStyles.PREVIEW) {
            data['bodyFormat'] = "text/plain";
        }
        return data;
    },
    /**
     * Meant for derived classes to override
     * @type {}
     */
    postRender: function () {
      var that = this,
          body,
          collectionManager = new CollectionManager();

      collectionManager.getAllSynthesisCollectionPromise()
        .then(function (allSynthesisCollection) {
          var synthesis = allSynthesisCollection.get(that.synthesisId);
          if (!synthesis) {
            throw Error("BUG: Could not get synthesis after post. Maybe too early.")
          }
          that.$('.message-subject').html(synthesis.get('subject'));
          if (that.viewStyle == that.availableMessageViewStyles.PREVIEW) {
            //Strip HTML from preview
            //bodyFormat = "text/plain";

            body = MessageView.prototype.generateBodyPreview(synthesis.get('introduction'));
            that.$('.message-body > p').empty().html(body);
          }
          else {
            that.synthesisPanel = new SynthesisPanel({
              model: synthesis,
              messageListView: that.messageListView,
              panelWrapper: that.messageListView.getPanelWrapper(),
              el: that.$('.message-body')
            });
            that.synthesisPanel.template = Ctx.loadTemplate('synthesisPanelMessage');
            that.synthesisPanel.render();
          }
        });
      this.$(".message-body").removeClass('js_messageBodyAnnotatorSelectionAllowed');

      return;
    }

});


module.exports = SynthesisMessageView;

