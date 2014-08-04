define(function(require) {

    var Marionette = require('marionette'),
       SegmentList = require('views/segmentList'),
         IdeaPanel = require('views/ideaPanel'),
       MessageList = require('views/messageList'),
    SynthesisPanel = require('views/synthesisPanel'),
        Navigation = require('views/navigation');

    var viewsFactory = Marionette.Object.extend({

        segmentList: function(){
            return new SegmentList();
        },
        navigation: function(){
            return Navigation;
        },
        ideaPanel: function(){
            return new IdeaPanel();
        },
        messageList: function(){
            return new MessageList();
        },
        synthesisPanel: function(){
            return new SynthesisPanel();
        }

    });

    return new viewsFactory();
});