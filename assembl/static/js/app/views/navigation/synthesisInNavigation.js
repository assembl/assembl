'use strict';

define(['backbone.marionette', 'views/assemblPanel', 'common/collectionManager', 'utils/types', 'common/context', 'underscore', 'utils/i18n', 'utils/panelSpecTypes', 'bluebird'],
    function (Marionette, AssemblPanel, CollectionManager, Types, Ctx, _, i18n, PanelSpecTypes, Promise) {

        var SynthesisItem = Marionette.ItemView.extend({
            template: '#tmpl-synthesisItemInNavigation',
            initialize: function(options){
                this.allSynthesisCollection = options.allSynthesisCollection;
                this.panel = options.panel;
            },
            events:{
               'click .js_synthesisList': 'onSelectedSynthesis'
            },
            serializeData: function(){
                var synthesis = this.allSynthesisCollection.get(this.model.get('publishes_synthesis'));

                return{
                    id:this.model.id,
                    subject: synthesis.get('subject'),
                    date: Ctx.formatDate(this.model.get('date'))
                }
            },

            onSelectedSynthesis: function (e) {
                var messageId =  $(e.currentTarget).attr('data-message-id');
                this.displaySynthesis(messageId);
            },

            displaySynthesis: function (messageId) {
                var messageListView = this.panel.getContainingGroup().findViewByType(PanelSpecTypes.MESSAGE_LIST);
                messageListView.currentQuery.clearAllFilters();
                messageListView.toggleFilterByPostId(messageId);
                messageListView.showMessageById(messageId, undefined, false);

                //messageListView.ui.stickyBar.addClass('hidden');
                //messageListView.ui.replyBox.addClass('hidden');

                // Show that entry is selected
                this.selectSynthesisInMenu(messageId);
            },

            selectSynthesisInMenu: function (messageId) {
                $(".synthesisItem").closest('li').removeClass("selected");
                this.$(".synthesisItem[data-message-id=\"" + messageId + "\"]").addClass("selected");
            }

        });

        var SynthesisList = Marionette.CollectionView.extend({
            childView: SynthesisItem,
            initialize: function(options){

                var synthesisMessages = this.collection.where({'@type': Types.SYNTHESIS_POST});

                _.sortBy(synthesisMessages, function (message) {
                    return message.get('date');
                });
                synthesisMessages.reverse();

                this.collection = new Backbone.Collection(synthesisMessages);

                this.childViewOptions = {
                    allSynthesisCollection: options.allSynthesisCollection,
                    panel: options.panel
                }
            }

        });

        var SynthesisInNavigationPanel = AssemblPanel.extend({
            template: '#tmpl-synthesisInNavigationPanel',
            panelType: PanelSpecTypes.NAVIGATION_PANEL_SYNTHESIS_SECTION,
            className: 'synthesisNavPanel',
            ui: {
                synthesisListHeader: ".synthesisListHeader"
            },
            regions:{
                synthesisContainer: '.synthesisList'
            },

            initialize: function (options) {
              Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
            },

            onBeforeShow: function(){
                var that = this,
                    collectionManager = new CollectionManager();

                Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
                    collectionManager.getAllSynthesisCollectionPromise(),
                    function (allMessageStructureCollection, allSynthesisCollection) {

                        var synthesisMessages = allMessageStructureCollection.where({'@type': Types.SYNTHESIS_POST});

                        if (synthesisMessages.length > 0) {

                            var synthesisList = new SynthesisList({
                                collection: allMessageStructureCollection,
                                allSynthesisCollection: allSynthesisCollection,
                                panel: that
                            });

                            that.getRegion('synthesisContainer').show(synthesisList);

                            // TODO: find way to do that
                            //that.displaySynthesis(synthesisMessages[0].id);
                        }
                        else {
                            that.ui.synthesisListHeader.html(i18n.gettext("No synthesis of the discussion has been published yet"));
                        }
                    })

            }

        });

        return SynthesisInNavigationPanel;
    });