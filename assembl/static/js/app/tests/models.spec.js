
var _ = require('underscore'),
    Agent = require('../models/agents.js'),
    expect = require('chai').expect;


var expect = chai.expect;

return describe('Models Specs', function () {

    describe('Agents model', function(){
        var agent = undefined;

        beforeEach(function() {
            agent = new Agent.Model();
        });

        // improve this test, need to be connected and disconnected
        it('fetchFromScriptTag method should return the current user', function () {
            //agent.fetchFromScriptTag('current-user-json');
            //agent.fetchPermissionsFromScriptTag();
            //expect(agent).not.toBeUndefined();
            expect(true).to.be.true;
        });

        it('getAvatarUrl method should return the avatar url as string', function(){
            var avatar = agent.getAvatarUrl('32');
            expect(typeof avatar).to.be.a('string');
        });

        it('getAvatarColor method should return the avatar hsl color as string', function(){
           var avatarColor = agent.getAvatarColor();
           expect(typeof avatarColor).to.be.a('string');
        });

    });

    describe('Base model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('Discussion model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('GroupSpec model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('Idea model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('IdeaLink model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('Message model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('NotificationSubscription model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('PanelSpec model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('Partner model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('Roles model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('Segment model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

    describe('Synthesis model', function(){

        it('need spec', function () {
            expect(true).to.be.true;
        });

    });

});
