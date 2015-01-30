define(['jasmine', 'underscore', '../models/agents'], function (jasmine, _, Agent) {

    /*function getNewModel() {
        var m = new Idea.Model();
        m.set('id', m.cid);
        return m;
    }

    return describe('Idea Model', function () {

        var idea,
            collection;

        beforeEach(function () {
            idea = getNewModel();

            collection = new Idea.Collection();
            collection.add(idea);
        });

        it('should have the Model', function () {
            expect(Idea.Model).not.toBeUndefined();
        });

        it('must have the default attributes', function () {

            // The default attributes
            var attrs = {
                shortTitle: 'New idea',
                longTitle: 'Please add a description',
                numChildIdea: 0,
                hasCheckbox: true,
                featured: false,
                active: false,
                parentId: null
            };

            for (var key in attrs)if (attrs.hasOwnProperty(key)) {
                expect(idea.get(key)).toBe(attrs[key]);
            }
        });

        it('should return all children', function () {
            var children = idea.getChildren();
            expect(children.length).toBe(0);
        });

        it('should add a child', function () {
            var theChild = getNewModel();
            idea.addChild(theChild);

            var children = idea.getChildren();
            expect(children.length).toBe(1);

            expect(children[0].get('parentId')).toBe(idea.get('id'));
        });

        it('should return the parent', function () {
            var theChild = getNewModel();
            idea.addChild(theChild);

            var parent = theChild.getParent();
            expect(parent.cid).toBe(idea.cid);
        });

        it('should check to see if the idea is decendent of', function () {
            var theGrandchild = getNewModel();
            var theChild = getNewModel();

            idea.addChild(theChild);
            theChild.addChild(theGrandchild);

            var result = theGrandchild.isDescendantOf(idea);

            expect(result).toBeTruthy();
        });

        xit('should add a segment', function () {
            expect(idea.attributes.segments.length).toBe(0);
            idea.addSegment({ title: 'something'});

            expect(idea.attributes.segments.length).toBe(1);
        });

    });  */

    return describe('Models Specs', function () {

        describe('Agents model', function(){
            var agent = undefined;

            beforeEach(function() {
                agent = new Agent.Model();
            });

            it('fetchFromScriptTag method should return the current user', function () {
                agent.fetchFromScriptTag('current-user-json');
                agent.fetchPermissionsFromScripTag();
                expect(agent).not.toBeUndefined();
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
