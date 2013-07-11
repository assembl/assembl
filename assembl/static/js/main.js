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
    app.ideaList = new IdeaList({el: '#idealist', button: '#button-ideaList'});
    app.ideaList.ideas.fetch({reset: true});

    // Idea panel
    app.ideaPanel = new IdeaPanel({el: '#ideaPanel', button: '#button-ideaPanel'}).render();

    // Segment List
    app.segmentList = new SegmentList({el: '#segmentlist', button: '#button-segmentList'});
    app.segmentList.render();
    app.ideaList.ideas.on('remove:segment', function(segment){
        app.segmentList.segments.add(segment.clone());
    });

    // Message
    app.messages = new Message({el: '#messages', button: '#button-messages'}).render();

    app.on('lateralmenu.open', function(){
        app.messages.hideTooltip();
    });
    app.selectionTooltip.on('click', function(){
        app.selectionTooltip.hide();
        var segment = app.selectionTooltip.attr('data-segment');
        app.segmentList.addSegment(segment);
    });


});
