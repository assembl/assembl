define(function (require) {

  var AssemblPanel = require('views/assemblPanel'),
 CollectionManager = require('modules/collectionManager'),
             Types = require('utils/types'),
                 _ = require('underscore'),
              i18n = require('utils/i18n');

    var SynthesisInNavigationPanel = AssemblPanel.extend({
        template:'#tmpl-synthesisInNavigationPanel',
        
        ui: {
          synthesisList: ".synthesisList",
          synthesisListHeader: ".synthesisListHeader"
        },
        
        initialize: function(options){
          this.groupContent = options.groupContent;
        },

        events: {
          'click .synthesisList > li': 'onSynthesisClick',
        },
        
        onRender: function(){
          var that = this,
          collectionManager = new CollectionManager();
          //console.log(this.groupContent.model);
          $.when(collectionManager.getAllMessageStructureCollectionPromise(), collectionManager.getAllSynthesisCollectionPromise()).done(
              function(allMessageStructureCollection, allSynthesisCollection) {
                var synthesisMessages = allMessageStructureCollection.where({'@type': Types.SYNTHESIS_POST}),
                    html = '';
                if(synthesisMessages.length > 0) {
                  _.each(synthesisMessages, function(message) {
                    var synthesis = allSynthesisCollection.get(message.get('publishes_synthesis'));
                    html += "<li data-message-id="+message.id+">" + message.get('date') + " " + synthesis.get('subject') + "</li>";
                  });
                  that.ui.synthesisList.html(html);
                }
                else {
                  that.ui.synthesisListHeader.html(i18n.gettext("No synthesis of the discussion has been published yet"));
                }
              })

        },
        
        onSynthesisClick: function(ev) {
          var messageId = ev.currentTarget.attributes['data-message-id'].value,
              messageListView = this.groupContent.getViewByTypeName('message');
          messageListView.toggleFilterByPostId(messageId);
          // TODO: Make sure it's expanded
        }
         
    });

    
    return SynthesisInNavigationPanel;
});