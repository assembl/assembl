define(['jasmine'], function(){

    return describe('Model email', function(){

        it('must have app.model.Email', function(){

            expect(app.model.Email).toBe(Object);

        });

    });

});