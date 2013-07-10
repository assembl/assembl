define(['jasmine', 'underscore', 'models/idea'], function(jasmine, _, Idea){

    return describe('Idea Model', function(){

        var idea,
            collection;

        beforeEach(function(){
            idea = new Idea.Model();
            idea.set('id', idea.cid);

            collection = new Idea.Collection();
            collection.add(idea);
        });

        it('should have the Model', function(){
            expect(Idea.Model).not.toBeUndefined();
        });

        it('must have the default attributes', function(){

            // The default attributes
            var attrs = {
                shortTitle: 'New idea',
                longTitle: 'Please add a description',
                level: 1,
                total: 1,
                hasCheckbox: true,
                featured: false,
                active: false,
                parentId: null
            };

            for( var key in attrs )if(attrs.hasOwnProperty(key)){
                expect(idea.get(key)).toBe(attrs[key]);
            }
        });

        it('should add a segment', function(){
            expect(idea.attributes.segments.length).toBe(0);
            idea.addSegment({ title: 'something'});

            expect(idea.attributes.segments.length).toBe(1);
        });


        it('should return all children', function(){
            var children = idea.getChildren();
            expect(children.length).toBe(0);
        });

        it('should add a child', function(){
            var theChild = new Idea.Model();
            idea.addChild(theChild);

            var children = idea.getChildren();
            expect(children.length).toBe(1);

            expect(children[0].get('parentId')).toBe(idea.get('id'));
        });

    });

});
