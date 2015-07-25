'use strict';

describe('creativityApp', function() {

  var scope, ratingCtl, $httpBackend, sessionCtl, configService;

  beforeEach(module("creativityApp"));
  beforeEach(inject(function(_$httpBackend_, $controller, $rootScope, _configService_) {

    $rootScope = $rootScope;
    scope = $rootScope.$new();
    $httpBackend = _$httpBackend_;
    configService = _configService_;

    $httpBackend.when('GET', 'app/locales/fr.json')
            .respond({
              comment: "Blablabla",
              acomment: "new comment"
            });

    var $controller = $controller;

    ratingCtl = function() {
      return $controller('ratingCtl', {
        '$scope': scope
      })
    }

    sessionCtl = function() {
      return $controller('sessionCtl', {
        '$scope': scope
      })
    }

  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();

  });

  it('Should set local', function() {
    $httpBackend.expectGET('app/locales/fr.json');
    $httpBackend.flush();
  });

  describe('rating controller : ', function() {

    expect(angular.isFunction(configService.getWidget())).toBe(true);

    it('Should return data', function() {

      //$httpBackend.when('GET', '/data/Discussion/1/widgets/1/base_idea/-/children')
      //  .respond(200, [{}]);

      //$httpBackend.expect('GET', '/data/Discussion/1/widgets/1/base_idea/-/children');
      //$httpBackend.flush();

      /*scope.$apply(function(){
       scope.runTest();
       });*/
       
    })

  });

  describe('session controller : ', function() {
    sessionCtl = function() {
      return $controller('sessionCtl', {
        '$scope': scope
      })
    }

    it('Variable should defined', function() {

    });
  })

});
