define(['jasmine', 'underscore', 'text!views/email'], function(jasmine, _, EmailView){


	return describe('Email view', function(){

		it('is nothing', function(){
			alert( EmailView );
			expect(true).toBe(true);
		});


	});

});