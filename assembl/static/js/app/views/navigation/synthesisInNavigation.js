'use strict';

var Marionette = require('../../shims/marionette.js'),
    _ = require('../../shims/underscore.js'),
    Promise = require('bluebird'),
    AssemblPanel = require('../assemblPanel.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Types = require('../../utils/types.js'),
    Ctx = require('../../common/context.js'),
    i18n = require('../../utils/i18n.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js');


var SynthesisItem = Marionette.ItemView.extend({
    template: '#tmpl-synthesisItemInNavigation',
    initialize: function(options){
        this.panel = options.panel;
    },
    events:{
       'click .js_synthesisList': 'onSelectedSynthesis'
    },
    serializeData: function(){
      return {
        id: this.model.get('published_in_post'),
        subject: this.model.get('subject'),
        date: Ctx.formatDate(this.model.get('creation_date'))
      };
    },

    onSelectedSynthesis: function (e) {
        var messageId =  $(e.currentTarget).attr('data-message-id');
        this.panel.displaySynthesis(messageId);
    }

});

var SynthesisList = Marionette.CollectionView.extend({
    childView: SynthesisItem,
    initialize: function(options){

        var publishedSyntheses = this.collection.getPublishedSyntheses();

        _.sortBy(publishedSyntheses, function (message) {
            return message.get('creation_date');
        });
        publishedSyntheses.reverse();

        this.collection = new Backbone.Collection(publishedSyntheses);

        this.childViewOptions = {
            panel: options.panel
        }
    }

});

var SynthesisInNavigationPanel = AssemblPanel.extend({
    template: '#tmpl-loader',
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

    selectSynthesisInMenu: function (messageId) {
      $(".synthesisItem").closest('li').removeClass("selected");
      this.$(".synthesisItem[data-message-id=\"" + messageId + "\"]").addClass("selected");
    },

    displaySynthesis: function (messageId) {
        var messageListView = this.getContainingGroup().findViewByType(PanelSpecTypes.MESSAGE_LIST);
        messageListView.currentQuery.clearAllFilters();
        messageListView.toggleFilterByPostId(messageId);
        messageListView.showMessageById(messageId, undefined, false);

        messageListView.ui.stickyBar.addClass('hidden');
        messageListView.ui.replyBox.addClass('hidden');

        // Show that entry is selected
        this.selectSynthesisInMenu(messageId);
    },

    displaySynthesisList: function (allMessageStructureCollection, allSynthesisCollection) {
      var lastPublisedSynthesis = allSynthesisCollection.getLastPublisedSynthesis();

      if (lastPublisedSynthesis) {

        var synthesisList = new SynthesisList({
          collection: allSynthesisCollection,
          panel: this
        });

        this.getRegion('synthesisContainer').show(synthesisList);
        this.displaySynthesis(lastPublisedSynthesis.get('published_in_post'));
      }
      else {
        this.ui.synthesisListHeader.html(i18n.gettext("No synthesis of the discussion has been published yet"));
      }
    },
  
    onBeforeShow: function(){
      var that = this,
      collectionManager = new CollectionManager();

      Promise.join(collectionManager.getAllMessageStructureCollectionPromise(),
          collectionManager.getAllSynthesisCollectionPromise(),
          function (allMessageStructureCollection, allSynthesisCollection) {
            that.template = '#tmpl-synthesisInNavigationPanel';
            that.render();
            that.displaySynthesisList(allMessageStructureCollection, allSynthesisCollection);
            that.listenTo(allSynthesisCollection, 'add reset', function() {
              //console.log("Re-displaying synthesis list from collection update...", allSynthesisCollection.length);
              that.displaySynthesisList(allMessageStructureCollection, allSynthesisCollection);
            });
          });
    }

});

module.exports = SynthesisInNavigationPanel;