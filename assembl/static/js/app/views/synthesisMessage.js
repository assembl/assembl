define(['backbone', 'underscore', 'moment', 'ckeditor', 'modules/context', 'models/message', 'views/message', 'models/synthesis', 'views/synthesisPanel'],
function(Backbone, _, Moment, ckeditor, Ctx, Message, MessageView, Synthesis, SynthesisPanel){
    'use strict';

    /**
     * @class views.MessageView
     */
    var SynthesisMessageView = MessageView.extend({

        /**
         * @init
         */
        initialize: function(obj){
            MessageView.prototype.initialize.apply(this, arguments);
            this.stopListening(this.messageListView, 'annotator:initComplete', this.onAnnotatorInitComplete);
            var synthesis_id = this.model.get('publishes_synthesis');
            this.synthesis = assembl.syntheses.get(synthesis_id)
            if(!this.synthesis) {
                this.synthesis = new Synthesis.Model({'@id': synthesis_id});
                this.synthesis.fetch();
                assembl.syntheses.add(this.synthesis);
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
            data['subject'] = this.synthesis.get('subject');
            return data;
        },
        /**
         * Meant for derived classes to override
         * @type {}
         */
        postRender: function() {
            var synthesisPanel = new SynthesisPanel({
                model: this.synthesis
                //el: '#message_'+_.escape(this.model.getNumericId())+'_synthesis'
            });
            synthesisPanel.template = Ctx.loadTemplate('synthesisPanelMessage');
            synthesisPanel.render();
            this.$('.message-body').html(synthesisPanel.el);
            return;
        }
        
    });


    return SynthesisMessageView;

});
