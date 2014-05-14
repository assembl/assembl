define([
    "app",
    "jquery",
    "views/lateralMenu",
    "views/ideaList",
    "views/ideaPanel",
    "views/segmentList",
    "views/messageList",
    "models/synthesis",
    "views/synthesisPanel",
    "models/user",
    "models/segment",
    "router",
    "socket"
], function(app, $, LateralMenu, IdeaList, IdeaPanel, SegmentList, MessageList, Synthesis, SynthesisPanel, User, Segment, Router, Socket){
    'use strict';

    app.init();

    // The router
    app.router = new Router();

    // The socket
    app.socket = new Socket();
    app.on('socket:open', function(){ $('#onlinedot').addClass('is-online').attr('title', 'online'); });
    app.on('socket:close', function(){ $('#onlinedot').removeClass('is-online').attr('title', 'offline'); });

    // User
    app.users = new User.Collection();
    app.users.on('reset', app.loadCurrentUser);
    app.users.fetchFromScriptTag('users-json');

    // Lateral menu
    // app.lateralMenu = new LateralMenu({el: '#lateralMenu'}).render();
    // $('#assembl-mainbutton').on('click', app.lateralMenu.trigger.bind(app.lateralMenu, 'toggle'));
    // app.getCurrentUser().on('change', app.lateralMenu.render, app.lateralMenu);

    // The order of these initialisations matter...
    // Segment List
    app.segmentList = new SegmentList({el: '#segmentList', button: '#button-segmentList'});

    // Idea list
    app.ideaList = new IdeaList({el: '#ideaList', button: '#button-ideaList'});

    // Idea panel
    app.ideaPanel = new IdeaPanel({el: '#ideaPanel', button: '#button-ideaPanel'}).render();

    // Message
    app.messageList = new MessageList({el: '#messageList', button: '#button-messages'}).render();
    app.messageList.loadInitialData();

    // Synthesis
    app.syntheses = new Synthesis.Collection();
    var nextSynthesisModel = new Synthesis.Model({'@id': 'next_synthesis'});
    nextSynthesisModel.fetch();
    app.syntheses.add(nextSynthesisModel);
    app.synthesisPanel = new SynthesisPanel({
        el: '#synthesisPanel',
        button: '#button-synthesis',
        model: nextSynthesisModel 
    });
    

    // Fetching the ideas
    app.segmentList.segments.fetchFromScriptTag('extracts-json');
    app.ideaList.ideas.fetchFromScriptTag('ideas-json');

    // Let the game begins...
    Backbone.history.start({hashChange: false, root: "/" + app.slug });

});
