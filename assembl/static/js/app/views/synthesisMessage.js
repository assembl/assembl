define(function(require){
    'use strict';

       var ckeditor = require('ckeditor'),
                Ctx = require('modules/context'),
        MessageView = require('views/message'),
          Synthesis = require('models/synthesis'),
     SynthesisPanel = require('views/synthesisPanel');

    /**
     * @class views.MessageView
     */
    var SynthesisMessageView = MessageView.extend({

        /**
         * @init
         */
        initialize: function(obj){
          var that = this;
          MessageView.prototype.initialize.apply(this, arguments);
          this.stopListening(this.messageListView, 'annotator:initComplete', this.onAnnotatorInitComplete);
          var synthesis_id = this.model.get('publishes_synthesis');
          if(!this.synthesis) {
            this.synthesis = new Synthesis.Model({'@id': synthesis_id});
            this.synthesisPromise = this.synthesis.fetch();
          }
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
            data['subject'] = '';
            data['body'] = '';
            if(this.viewStyle == this.availableMessageViewStyles.PREVIEW) {
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
                body;
            this.synthesisPromise.done(
                function() {
                  that.$('.message-subject').html(that.synthesis.get('subject'));
                  that.synthesisPanel = new SynthesisPanel({
                    model: that.synthesis
                  });
                  that.synthesisPanel.template = Ctx.loadTemplate('synthesisPanelMessage');
                  that.synthesisPanel.render();
                  if(that.viewStyle == that.availableMessageViewStyles.PREVIEW) {
                    //Strip HTML from preview
                    //bodyFormat = "text/plain";
                    body = $(that.synthesisPanel.el).text();
                    that.$('.message-body > div').prepend(body);
                  }
                  else {
                    body = that.synthesisPanel.el;
                    that.$('.message-body').html(body);
                  }
                  
                });
            
            return;
        }
        
    });


    return SynthesisMessageView;

});
