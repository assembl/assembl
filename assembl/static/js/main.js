define([
    "app",
    "zepto",
    "views/lateralMenu",
    "views/ideaList",
    "views/ideaPanel",
    "views/segmentList",
    "views/message",
    "models/user",
    "models/segment"
], function(app, $, LateralMenu, IdeaList, IdeaPanel, SegmentList, Message, User, Segment){
    'use strict';

    app.init();

    app.currentUser = new User.Model();
    app.currentUser.fetch();

    // Lateral menu
    app.lateralMenu = new LateralMenu({el: '#lateralMenu'}).render();
    $('#assembl-mainbutton').on('click', app.lateralMenu.trigger.bind(app.lateralMenu, 'toggle'));
    app.currentUser.on('change', app.lateralMenu.render, app.lateralMenu);

    // Idea list
    app.ideaList = new IdeaList({el: '#idealist', button: '#button-ideaList'});
    app.ideaList.ideas.fetch({reset: true});

    // Segment List
    app.segmentList = new SegmentList({el: '#segmentlist', button: '#button-segmentList'});
    app.segmentList.segments.on('change reset', app.ideaList.render, app.ideaList);
    app.segmentList.segments.fetch({reset: true});

    // Idea panel
    app.ideaPanel = new IdeaPanel({el: '#ideaPanel', button: '#button-ideaPanel'}).render();
    app.segmentList.segments.on('change reset', app.ideaPanel.render, app.ideaPanel);

    // Message
    app.messages = new Message({el: '#messages', button: '#button-messages'}).render();

    app.on('lateralmenu.open', function(){
        app.messages.hideTooltip();
    });
    app.selectionTooltip.on('click', function(){
        app.selectionTooltip.hide();
        var text = app.selectionTooltip.attr('data-segment'),
            segment = new Segment.Model({ text:text });

        app.segmentList.segments.add(segment);
        app.openPanel(app.segmentList);
    });


});
