'use strict';

describe('creativityApp', function(){

    beforeEach(angular.mock.module("creativityApp"));

    describe('Controller: rating', function(){

        it('Should be defined', angular.mock.inject(function($rootScope, $controller) {

            this.scope = $rootScope.$new();
            $controller('MyController', {
                $scope: this.scope
            });

        }));

    })

});