define([
    "app",
    "zepto",
    "views/lateralMenu",
    "views/ideaList",
    "views/segmentList",
    "views/message"
], function(app, $, LateralMenu, IdeaList, SegmentList, Message){
    'use strict';

    app.init();

    // Lateral menu
    app.lateralMenu = new LateralMenu({el: '#lateralMenu'}).render();
    $('#assembl-mainbutton').on('click', app.lateralMenu.trigger.bind(app.lateralMenu, 'toggle'));

    // Idea list
    app.ideaList = new IdeaList({ el: '#idealist' });
    app.ideaList.ideas.fetch({reset: true});

    // Segment List
    app.segmentList = new SegmentList({el: '#segmentlist'});
    app.segmentList.render();

    // Message
    app.message = new Message({el: '#message'}).render();
    app.on('lateralmenu.open', function(){
        app.message.hideTooltip();
    });
    app.selectionTooltip.on('click', function(){
        app.selectionTooltip.hide();
        var segment = app.selectionTooltip.attr('data-segment');
        app.segmentList.addSegment(segment);
    });


});
