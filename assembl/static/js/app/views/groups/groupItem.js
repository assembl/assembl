define(function (require) {

    var Marionette = require('marionette'),
        SegmentList = require('views/segmentList'),
        IdeaPanel = require('views/ideaPanel'),
        MessageList = require('views/messageList'),
        SynthesisPanel = require('views/synthesisPanel'),
        Navigation = require('views/navigation/navigation');

    var groupItem = Marionette.ItemView.extend({
        template: "#tmpl-groupItem"
    });

    return groupItem;
});