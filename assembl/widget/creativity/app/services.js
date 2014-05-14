"use strict";

var creativityServices = angular.module('creativityServices', ['ngResource']);

creativityServices.factory('globalVideoConfig', function($http){

    var api_rest = 'test/config_test.json';

    return {
        fetch : function() {
            return $http.get(api_rest);
        }
    }

});

creativityServices.factory('globalConfig', function($http){

    var api_rest = 'test/config_test.json';

    return {
        fetch : function() {
            return $http.get(api_rest);
        }
    }

});

creativityServices.factory('globalMessages', function($http){

    var api_rest = 'test/session.json';

    return {
        fetch: function() {
            return $http.get(api_rest);
        }
    }

});

//CONFIG
creativityServices.factory('configService', [function(){
    return {
       init: function(){

           $.ajax({
               url:'http://localhost:6543/data/Discussion/1/widgets',
               type:'POST',
               data: {
                   widget_type:'creativity',
                   settings: JSON.stringify({"idea":"local:Idea/2"})
               },
               success: function(data, textStatus, jqXHR){

                   getConfig(jqXHR.getResponseHeader('location'));
               },
               error: function(jqXHR, textStatus, errorThrown){

                   console.log(jqXHR);

               }

           })

           function getConfig(value){

               var widget = value.split(':');

               console.log('http://localhost:6543/data/'+widget[1]);

           }

       }

    }

}]);


//CARD inspire me: send an idea to assembl
creativityServices.factory('sendIdeaService', ['$resource',function($resource){
    return $resource('http://localhost:6543/api/v1/discussion/:discussionId/posts')
}]);

// WIP: use Angular's REST and Custom Services as our Model for Messages
creativityServices.factory('Discussion', ['$resource', function($resource){
    return $resource('http://localhost:6543/data/Discussion/:discussionId', {}, {
        query: {method:'GET', params:{discussionId:'1'}, isArray:false}
        });
}]);


// JukeTube

creativityServices.service('JukeTubeVideosService', ['$window', '$rootScope', '$log', function ($window, $rootScope, $log) {

  var service = this;
  var initialized = false;

  var youtube = {
    ready: false,
    player: null,
    playerId: null,
    videoId: null,
    videoTitle: null,
    playerHeight: '480',
    playerWidth: '640',
    state: 'stopped'
  };

  var results = [];
  var upcoming = [ {id: 'Pjzr1zI830c', title: 'Imagination for People (English)'} ];
  var pageInfo = {
    //currentPage: 1,
    nextPageToken: '',
    prevPageToken: '',
    resultsPerPage: '',
    totalResults: 0
  };

  this.init = function (){
    console.log('JukeTubeVideosService.init()');
    if ( initialized === true )
      return;

    console.log('JukeTubeVideosService.init() go');
    $window.onYouTubeIframeAPIReady = function () {
      service.onYouTubeIframeAPIReady();
    };

    var tag = $window.document.createElement('script');
    tag.src = "http://www.youtube.com/iframe_api";
    var firstScriptTag = $window.document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    initialized = true;
  }

  this.init();
  

  this.onYouTubeIframeAPIReady = function(){
    $log.info('Youtube API is ready');
    youtube.ready = true;
    service.bindPlayer('placeholder');
    service.loadPlayer();
  }

  function onYoutubeReady (event) {
    $log.info('YouTube Player is ready');
    youtube.player.cueVideoById(upcoming[0].id);
    youtube.videoId = upcoming[0].id;
    youtube.videoTitle = upcoming[0].title;
  }

  function onYoutubeStateChange (event) {
    if (event.data == YT.PlayerState.PLAYING) {
      youtube.state = 'playing';
    } else if (event.data == YT.PlayerState.PAUSED) {
      youtube.state = 'paused';
    } else if (event.data == YT.PlayerState.ENDED) {
      youtube.state = 'ended';
      service.launchPlayer(upcoming[0].id, upcoming[0].title);
    }
    $rootScope.$apply();
  }

  this.bindPlayer = function (elementId) {
    $log.info('Binding to ' + elementId);
    youtube.playerId = elementId;
  };

  this.createPlayer = function () {
    $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
    return new YT.Player(youtube.playerId, {
      height: youtube.playerHeight,
      width: youtube.playerWidth,
      playerVars: {
        rel: 0,
        showinfo: 0
      },
      events: {
        'onReady': onYoutubeReady,
        'onStateChange': onYoutubeStateChange
      }
    });
  };

  this.loadPlayer = function () {
    if (youtube.ready && youtube.playerId) {
      if (youtube.player) {
        try{
          youtube.player.destroy();
        }catch(err){
          console.log(err);
        }
      }
      youtube.player = service.createPlayer();
    }
  };

  this.launchPlayer = function (id, title) {
    youtube.player.loadVideoById(id);
    youtube.videoId = id;
    youtube.videoTitle = title;
    return youtube;
  }

  this.processResults = function (data) {
    pageInfo = {
      //currentPage: 1,
      nextPageToken: '',
      prevPageToken: '',
      resultsPerPage: '',
      totalResults: 0
    };

    if ( data.nextPageToken )
      pageInfo.nextPageToken = data.nextPageToken;
    else
      pageInfo.nextPageToken = '';

    if ( data.prevPageToken )
      pageInfo.prevPageToken = data.prevPageToken;
    else
      pageInfo.prevPageToken = '';

    if ( data.pageInfo )
    {
      if ( data.pageInfo.resultsPerPage )
        pageInfo.resultsPerPage = data.pageInfo.resultsPerPage;
      if ( data.pageInfo.totalResults )
        pageInfo.totalResults = data.pageInfo.totalResults;
    }


    results.length = 0;
    for (var i = data.items.length - 1; i >= 0; i--) {
      results.push({
        id: data.items[i].id.videoId,
        title: data.items[i].snippet.title,
        description: data.items[i].snippet.description,
        thumbnail: data.items[i].snippet.thumbnails.default.url,
        author: data.items[i].snippet.channelTitle,
        publishedAt: data.items[i].snippet.publishedAt.substring(0,10)
      });
    }
    return results;
  }

  this.getYoutube = function () {
    return youtube;
  };

  this.getResults = function () {
    return results;
  };

  this.getPageInfo = function () {
    return pageInfo;
  };

}]);