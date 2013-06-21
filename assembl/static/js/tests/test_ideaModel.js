define(['jasmine', 'underscore', 'models/idea'], function(jasmine, _, Idea){

    return describe('Idea Model', function(){

        var idea;

        beforeEach(function(){
            idea = new Idea.Model();
        });

        it('should have the Model', function(){
            expect(Idea.Model).not.toBeUndefined();
        });

        it('must have the default attributes', function(){

            // The default attributes
            var attrs = {
                subject: '',
                level: 1,
                total: 1,
                hasCheckbox: true,
                hasChildren: false,
                hasOptions: true,
                featured: false,
                active: false
            };

            for( var key in attrs )if(attrs.hasOwnProperty(key)){
                expect(idea.get(key)).toBe(attrs[key]);
            }

        });

    });

});
