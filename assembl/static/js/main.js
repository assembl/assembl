define([
    "app",
    "zepto",
    "views/inbox",
    "views/lateralMenu",
    "views/segmentList",
    "views/message",
    "models/idea"
], function(app, $, Inbox, LateralMenu, SegmentList, Message, Idea){
    'use strict';

    app.init();

    // Table of contents
    app.tableOfContents = new IdeaList({ el: '#table-of-contents' });
    app.tableOfContent.ideas.fetch({reset: true});

    // var inboxEmails = new Email.Collection();
    // app.inbox = new Inbox({collection: inboxEmails}).render();
    // app.inbox.collection.fetch({reset: true});

    // Lateral menu
    // var lateralMenuEmails = new Email.Collection();
    // app.lateralMenu = new LateralMenu({el: '#lateralMenu', emails: lateralMenuEmails});
    // app.lateralMenu.emails.fetch({reset: true});

    // $('#assembl-mainbutton').on('click', app.lateralMenu.trigger.bind(app.lateralMenu, 'toggle'));

    // SegmentList
    // app.segmentList = new SegmentList({el: '#segmentlist'}).render();

    // Message
    // app.message = new Message({el: '#message'}).render();
    // app.on('lateralmenu.open', function(){
    //     app.message.hideTooltip();
    // });
    // app.selectionTooltip.on('click', function(){
    //     app.selectionTooltip.hide();
    //     var segment = app.selectionTooltip.attr('data-segment');
    //     app.segmentList.addSegment(segment);
    // });


});
