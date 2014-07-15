define(['jasmine', 'app', 'jquery', 'modules/context'], function(jasmine, app, $, ctx){

	// Fixtures
	var txt = '<script id="tmpl-test" type="text/x-tmpl">test something</script>'
	$('body').append(txt);

	return describe('app main module', function(){

		it('must exist', function(){
			expect(window.app).not.toBeUndefined();
		});

		it('must load a template by id', function(){

			var tmpl = ctx.loadTemplate('test');

			expect(typeof tmpl).toBe('function');
			expect(tmpl()).toBe('test something');
		});


	});

});
