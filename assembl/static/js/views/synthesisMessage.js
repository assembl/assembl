define(['backbone', 'underscore', 'moment', 'ckeditor', 'app', 'models/message', 'views/message', 'models/synthesis', 'views/synthesisPanel', 'i18n', 'permissions', 'views/messageSend'],
function(Backbone, _, Moment, ckeditor, app, Message, MessageView, Synthesis, SynthesisPanel, i18n, Permissions, MessageSendView){
    'use strict';

    /**
     * @class views.MessageView
     */
    var SynthesisMessageView = MessageView.extend({

        /**
         * @init
         * @param {MessageModel} obj the model
         * @param {Array[boolean]} last_sibling_chain which of the view's ancestors
         *   are the last child of their respective parents.
         */
        initialize: function(obj){
            MessageView.prototype.initialize.apply(this, arguments);
            this.messageListView.off('annotator:initComplete', this.onAnnotatorInitComplete, this);
            console.log(this.model);
            var synthesis_id = this.model.get('publishes_synthesis');
            this.synthesis = app.syntheses.get(synthesis_id)
            if(!this.synthesis) {
                this.synthesis = new Synthesis.Model({'@id': synthesis_id});
                this.synthesis.fetch();
                app.syntheses.add(this.synthesis);
            }
            console.log(this.synthesis);
        },

        /**
         * The thread message template
         * @type {_.template}
         */
        template: app.loadTemplate('message'),

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
            });
            this.$('.message-body').append(synthesisPanel.render().el);
            return;
        },
        
    });


    return SynthesisMessageView;

});
