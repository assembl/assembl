define(['jasmine', 'underscore', 'app', 'views/email'],
function(jasmine, _, app, EmailView){


	return describe('Email view', function(){
        var view,
            fixEmails;

        beforeEach(function(){
            view = new EmailView();
            view.model = new Backbone.Model({
                subject: 'Default Suject',
                total: 0,
                hasChildren: false
            });

            //
            setFixtures('<ul id="fix-email"></ul>');
            fixEmails = $('#fix-email');
            fixEmails.append( view.render().el );
        });

		it('uses the right template', function(){
			var tmpl = app.loadTemplate('email');
            var email = (new Email.Model()).toJSON();

			expect(tmpl(email)).toBe(view.template(email));
		});


        it('must change the state to .is-selected when checkbox is selected', function(){
            var chk = view.$('input').first();
            chk.trigger('click');
            
            expect(view.el).toHaveClass('is-selected');
        });


	});

});
