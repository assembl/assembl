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
          this.groupManager = options.groupManager;
        },

        events: {
          'click .synthesisList > li': 'onSynthesisClick',
        },
        
        onRender: function(){
          var that = this,
          collectionManager = new CollectionManager();
          console.log(this.groupManager.groupSpec);
          $.when(collectionManager.getAllMessageStructureCollectionPromise(), collectionManager.getAllSynthesisCollectionPromise()).done(
              function(allMessageStructureCollection, allSynthesisCollection) {
                var synthesisMessages = allMessageStructureCollection.where({'@type': Types.SYNTHESIS_POST}),
                    html = '';
                if(synthesisMessages.length > 0) {
                  _.each(synthesisMessages, function(message) {
                    var synthesis = allSynthesisCollection.get(message.get('publishes_synthesis'));
                    html += "<li data-mesage-id="+message.id+">" + message.get('date') + " " + synthesis.get('subject') + "</li>";
                  });
                  that.ui.synthesisList.html(html);
                }
                else {
                  that.ui.synthesisListHeader.html(i18n.gettext("No synthesis of the discussion has been published yet"));
                }
              })

        },
        
        onSynthesisClick: function(ev) {
          console.log("onSynthesisClick fired", ev);
          var messageId = ev.currentTarget.attributes['data-mesage-id'],
              messageListView = "FIXMEMAGIC";
          //FIXME:  Uncomment this once the messageListView is proprely instanciated/found in the current panelGroup.
          //messageListView.toggleFilterByPostId(messageId);
          
        }
         
    });

    
    return SynthesisInNavigationPanel;
});