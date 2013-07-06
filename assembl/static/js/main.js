define([
    "app",
    "zepto",
    "views/lateralMenu",
    "views/ideaList",
    "views/ideaPanel",
    "views/segmentList",
    "views/message"
], function(app, $, LateralMenu, IdeaList, IdeaPanel, SegmentList, Message){
    'use strict';

    app.init();

    // Lateral menu
    app.lateralMenu = new LateralMenu({el: '#lateralMenu'}).render();
    $('#assembl-mainbutton').on('click', app.lateralMenu.trigger.bind(app.lateralMenu, 'toggle'));

    // Idea list
    $('#button-ideaList').on('click', app.togglePanel.bind(window, 'ideaList'));
    app.ideaList = new IdeaList({el: '#idealist'});
    app.ideaList.ideas.fetch({reset: true});

    // Idea panel
    app.ideaPanel = new IdeaPanel({el: '#ideaPanel'}).render();
    app.togglePanel('ideaPanel');

    // Segment List
    $('#button-segmentList').on('click', app.togglePanel.bind(window, 'segmentList'));
    app.segmentList = new SegmentList({el: '#segmentlist'});
    app.segmentList.render();

    // Message
    $('#button-messages').on('click', app.togglePanel.bind(window, 'messages'));
    app.messages = new Message({el: '#messages'}).render();

    app.on('lateralmenu.open', function(){
        app.messages.hideTooltip();
    });
    app.selectionTooltip.on('click', function(){
        app.selectionTooltip.hide();
        var segment = app.selectionTooltip.attr('data-segment');
        app.segmentList.addSegment(segment);
    });


});
