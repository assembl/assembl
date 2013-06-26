define(['jasmine', 'underscore', 'models/segment'], function(jasmine, _, Segment){

    return describe('Model segment', function(){

        var segment;

        beforeEach(function(){
            segment = new Segment.Model();
        });

        it('should have the Model', function(){
            expect(Segment.Model).not.toBeUndefined();
        });

        it('must have the default attributes', function(){

            // The default attributes
            var attrs = {
                text: '',
                idPost: null,
                date: null
            };

            for( var key in attrs )if(attrs.hasOwnProperty(key)){
                expect(segment.get(key)).toBe(attrs[key]);
            }

        });

    });

});
