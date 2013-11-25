define([
    "app",
    "jquery",
    "views/lateralMenu",
    "views/ideaList",
    "views/ideaPanel",
    "views/segmentList",
    "views/messageList",
    "views/synthesisPanel",
    "models/user",
    "models/segment",
    "router",
    "socket"
], function(app, $, LateralMenu, IdeaList, IdeaPanel, SegmentList, MessageList, SynthesisPanel, User, Segment, Router, Socket){
    'use strict';

    app.init();

    app.currentUser = new User.Model();
    app.currentUser.loadCurrentUser();

    // The router
    app.router = new Router();

    // The socket
    app.socket = new Socket();
    app.on('socket:open', function(){ $('#onlinedot').addClass('is-online').attr('title', 'online'); });
    app.on('socket:close', function(){ $('#onlinedot').removeClass('is-online').attr('title', 'offline'); });

    // User
    app.users = new User.Collection();
    app.users.fetch({ reset: true });

    // Lateral menu
    app.lateralMenu = new LateralMenu({el: '#lateralMenu'}).render();
    $('#assembl-mainbutton').on('click', app.lateralMenu.trigger.bind(app.lateralMenu, 'toggle'));
    app.currentUser.on('change', app.lateralMenu.render, app.lateralMenu);

    // Idea list
    app.ideaList = new IdeaList({el: '#ideaList', button: '#button-ideaList'});

    // Segment List
    app.segmentList = new SegmentList({el: '#segmentList', button: '#button-segmentList'});
    app.segmentList.segments.on('change reset', app.ideaList.render, app.ideaList);
    app.segmentList.segments.on('invalid', function(model, error){ alert(error); });
    app.users.on('reset', app.segmentList.render, app.segmentList);
    
    // Idea panel
    app.ideaPanel = new IdeaPanel({el: '#ideaPanel', button: '#button-ideaPanel'}).render();
    app.segmentList.segments.on('change reset', app.ideaPanel.render, app.ideaPanel);
    app.users.on('reset', app.ideaPanel.render, app.ideaPanel);

    // Message
    app.messageList = new MessageList({el: '#messageList', button: '#button-messages'}).render();
    app.messageList.loadData();

    // Synthesis
    app.synthesisPanel = new SynthesisPanel({el: '#synthesisPanel', button: '#button-synthesis', ideas: app.ideaList.ideas });
    app.synthesisPanel.model.fetch({reset: true});

    // Fetching the ideas
    app.ideaList.ideas.fetch({reset: true});


    /**
     * WARNING:
     * This is a workaround to update the segmentList using ajax
     * In a perfect world, this would be done using websockets
     * or something really cool.
     */
    function updateSegmentList(){
        var func, promisse;

        func = function(){
            setTimeout(updateSegmentList, updateSegmentList.time);
        };

        if( updateSegmentList.canUpdate() ){
            promisse = app.segmentList.segments.fetch({reset: true});
            promisse.then(func);
        } else {
            func();
        }

    }
    updateSegmentList.time = 30 * 1 * 1000; // 30 seconds
    updateSegmentList.disallowedTagNames = ['TEXTAREA', 'INPUT', 'SELECT'];
    updateSegmentList.canUpdate = function(){
        // Checks to see if the activeElement is editable or not
        var el = document.activeElement,
            isEditableField = el.hasAttribute('contenteditable');
        
        return ! (isEditableField || $.inArray(el.tagName, updateSegmentList.disallowedTagNames) > -1);
    };

    // Starting the segment list update loop
    updateSegmentList();

    // Let the game begins...
    var historied = Backbone.history.start({hashChange: false, root: "/" + app.slug });

    if( ! historied ){
        
        // Open the previous panels
        var panels = app.getPanelsFromStorage();
        _.each(panels, function(value, name){
            var panel = app[name];
            if( panel && name !== 'ideaPanel' ){
                app.openPanel(panel);
            }
        });

    }

});
