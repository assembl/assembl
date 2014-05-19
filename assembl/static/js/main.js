requirejs.config({
  baseUrl: "/static/js/",
  urlArgs: "bust=" + (new Date()).getTime(),
  waitSeconds: 20,
  paths: {
    'app': 'app/app',
    'router': 'app/router',
    'views':'app/views',
    'models':'app/models',
    'i18n': 'app/i18n',
    'socket': 'app/socket',
    'types': 'app/types',
    'permissions': 'app/permissions',

    'jquery': "bower/jquery/jquery",
    'tipsy': 'bower/tipsy/src/javascripts/jquery.tipsy',
    'jquery-highlight': 'lib/jquery-highlight/jquery.highlight',

    'backbone': 'bower/backbone/backbone',
    'underscore': 'bower/underscore/underscore',

    'annotator': 'lib/annotator/annotator-full.min',

    'jasmine': 'bower/jasmine/lib/jasmine-core/jasmine',
    'jasmine-html': 'bower/jasmine/lib/jasmine-core/jasmine',
    'jasmine-jquery': 'bower/jasmine-jquery/lib/jasmine-jquery',

    'ckeditor': 'bower/ckeditor/ckeditor',
    'ckeditor-sharedspace': 'lib/ckeditor-sharedcontainer/plugin',

    'moment': 'bower/momentjs/moment',
    'zeroclipboard': 'bower/zeroclipboard/ZeroClipboard',
    'sockjs': 'bower/sockjs/sockjs',
    'cytoscape': 'bower/cytoscape/cytoscape',
    'jit': 'bower/jit/Jit/jit',
    'sprintf': 'bower/sprintf/src/sprintf'
  },
  shim: {
    backbone: {
        deps: ['underscore', 'jquery'],
        exports: 'Backbone'
    },
    'underscore': {
        exports: '_'
    },
    'jquery': {
        exports: 'jQuery'
    },
    'jquery-highlight': {
        deps: ['jquery'],
        exports: 'jQuery'
    },
    'app': {
        deps: ['annotator', 'ckeditor', 'tipsy', 'i18n', 'jquery-highlight', 'zeroclipboard'],
        exports: 'app'
    },
    'i18n': {
        exports: 'i18n'
    },
    'socket': {
        deps: ['sockjs']
    },
    'jasmine': {
        exports: 'jasmine'
    },
    'jasmine-html': {
        deps: ['jasmine', 'jasmine-jquery'],
        exports: 'jasmine'
    },
    'jasmine-jquery': {
        deps: ['jasmine'],
        exports: 'jasmine'
    },
    'ckeditor': {
        exports: 'CKEDITOR'
    },
    'ckeditor-sharedspace': {
        deps: ['ckeditor'],
        exports: 'CKEDITOR'
    },
    'tipsy': {
        deps: ['jquery']
    },
    'zeroclipboard' : {
        exports: 'ZeroClipboard'
    },
    'sockjs': {
        deps: ['jquery'],
        exports: 'SockJS'
    },
    'cytoscape': {
        deps: ['jquery'],
        exports: 'cytoscape'
    },
    'jit': {
        deps: [],
        exports: '$jit'
    },
    'annotator' : {
        deps: ['jquery'],
        exports: 'Annotator'
    },
    'sprintf' : {
        deps: [],
        exports: 'sprintf'
    }
  }
});


require([
    "app",
    "jquery",
    "views/ideaList",
    "views/ideaPanel",
    "views/segmentList",
    "views/messageList",
    "models/synthesis",
    "views/synthesisPanel",
    "models/user",
    "models/segment",
    "router",
    "socket",
    "i18n"
], function(app, $, IdeaList, IdeaPanel, SegmentList, MessageList, Synthesis, SynthesisPanel, User, Segment, Router, Socket, i18n){
    'use strict';

    app.init();

    i18n(json);

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
