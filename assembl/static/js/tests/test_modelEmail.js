define(['jasmine', 'underscore', 'models/email'], function(jasmine, _, Email){

    return describe('Model email', function(){

        var email;

        beforeEach(function(){
            email = new Email.Model();
        });

        it('should have the Model', function(){
            expect(Email.Model).not.toBeUndefined();
        });

        it('must have the default attributes', function(){

            // The default attributes
            var attrs = {
                subject: '',
                level: 1,
                total: 1,
                hasChildren: false,
                featured: false,
                active: false
            };

            for( var key in attrs )if(attrs.hasOwnProperty(key)){
                expect(email.get(key)).toBe(attrs[key]);
            }

        });

    });

});
