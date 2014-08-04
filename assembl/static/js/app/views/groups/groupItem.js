define(function (require) {

    var Marionette = require('marionette'),
       SegmentList = require('views/segmentList'),
         IdeaPanel = require('views/ideaPanel'),
       MessageList = require('views/messageList'),
    SynthesisPanel = require('views/synthesisPanel'),
        Navigation = require('views/navigation');

    var groupItem = Marionette.LayoutView.extend({
        template: "#tmpl-groupItem",
        className: "groupItem",
        regions:{
           navigationPanel:'.idea-list',
           ideaPanel:'.idea-panel',
           clipboardPanel:'.clipboard-panel',
           messagePanel:'.message-panel',
           synthesisPanel:'.synthesis-panel'
        },
        initialize: function(options){
           this.groupManager = options.groupManager;
           this.groups = options.model.toJSON()

        },
        onRender: function(){
          this.setView(this.groups.group);

        },
        setView: function(group){
           var self = this;

           group.forEach(function(item){
              switch(item.type){
                case 'navigation':
                    var navigation = new Navigation();
                    self.navigationPanel.show(navigation);

                    break;
                case 'idea-panel':
                    var panelIdea = new IdeaPanel();
                    self.ideaPanel.show(panelIdea);

                    break;
                case 'message':
                    break;
                case 'clipboard':
                    break;
                case 'synthesis':
                    break;
                default:
                    break
              }
           });
        }
    });

    return groupItem;
});