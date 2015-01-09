'use strict';

define(['ckeditor', 'common/context', 'views/message', 'models/synthesis', 'views/synthesisPanel', 'common/collectionManager'],
    function (ckeditor, Ctx, MessageView, Synthesis, SynthesisPanel, CollectionManager) {

        /**
         * @class views.MessageView
         */
        var SynthesisMessageView = MessageView.extend({

            /**
             * @init
             */
            initialize: function (obj) {
                var that = this,
                    collectionManager = new CollectionManager();
                MessageView.prototype.initialize.apply(this, arguments);
                this.stopListening(this.messageListView, 'annotator:initComplete', this.onAnnotatorInitComplete);
                this.synthesisId = this.model.get('publishes_synthesis');
                this.allSynthesisCollectionPromise = collectionManager.getAllSynthesisCollectionPromise()
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
                    body;
                this.allSynthesisCollectionPromise.done(
                    function (allSynthesisCollection) {
                        var synthesis = allSynthesisCollection.get(that.synthesisId);
                        if (!synthesis) {
                            // TODO
                            console.log("BUG: Could not get synthesis after post. Maybe too early.")
                            return;
                        }
                        that.$('.message-subject').html(synthesis.get('subject'));
                        that.synthesisPanel = new SynthesisPanel({
                            model: synthesis,
                            messageListView: that.messageListView,
                            panelWrapper: that.messageListView.getPanelWrapper()
                        });
                        that.synthesisPanel.template = Ctx.loadTemplate('synthesisPanelMessage');
                        that.synthesisPanel.render();
                        if (that.viewStyle == that.availableMessageViewStyles.PREVIEW) {
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
