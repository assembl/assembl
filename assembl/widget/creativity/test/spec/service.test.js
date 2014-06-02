'use strict';

describe('Unit: Card game', function(){

    var game;

    beforeEach(function() {
        module('creativityServices');

        inject(function(_cardGame_){
            game = _cardGame_;
        })

    });

    it('should have an exciteText function', function () {
        expect(angular.isFunction(game)).toBe(true);
    });

    /*it('Should return an object', function(){
        var game = cardGame.getCards(1);
        expect(game).toBe(Object);
    });*/

});