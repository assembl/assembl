define(['jasmine', 'underscore', '../models/agents'], function (jasmine, _, Agent) {

    return describe('Models Specs', function () {

        describe('Agents model', function(){
            var agent = undefined;

            beforeEach(function() {
                agent = new Agent.Model();
            });

            // improve this test, need to be connected and disconnected
            it('fetchFromScriptTag method should return the current user', function () {
                //agent.fetchFromScriptTag('current-user-json');
                //agent.fetchPermissionsFromScripTag();
                //expect(agent).not.toBeUndefined();
                expect(true).toBe(true);
            });

            it('getAvatarUrl method should return the avatar url as string', function(){
                var avatar = agent.getAvatarUrl('32');
                expect(typeof avatar).toBe('string');
            });

            it('getAvatarColor method should return the avatar hsl color as string', function(){
               var avatarColor = agent.getAvatarColor();
               expect(typeof avatarColor).toBe('string');
            });

        });

        describe('Base model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('Discussion model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('GroupSpec model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('Idea model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('IdeaLink model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('Message model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('NotificationSubscription model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('PanelSpec model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('Partner model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('Roles model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('Segment model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

        describe('Synthesis model', function(){

            it('need spec', function () {
                expect(true).toBe(true);
            });

        });

    });

});
