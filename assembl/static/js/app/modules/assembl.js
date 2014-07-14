define(['marionette'], function (Marionette) {

    var App = new Marionette.Application();

    App.addInitializer(function(){
        App.addRegions({
            ideaListRegion:'#ideaList',
            ideaPanelRegion:'#ideaPanel',
            clipboardRegion:'#segmentList',
            messagesRegion:'#messageList',
            synthesisRegion:'#synthesisPanel'
        })
    });

    App.addInitializer(function(){
        console.log('Assembl Start');
    });

    return App;
});