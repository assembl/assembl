define(['jasmine', 'underscore', 'views/inbox'], function(jasmine, _, Inbox){

    return describe('Index view', function(){

        var inbox;

        beforeEach(function(){
            inbox = new Inbox();

            setFixtures('<div id="fix-inbox"></div>');
        });

        it('should have the Model', function(){
            expect(Email.Model).not.toBeUndefined();
        });


    });

});