define(['jasmine', 'underscore', 'app', 'views/email'],
function(jasmine, _, app, EmailView){

    return describe('Email view', function(){
        var view,
            fixEmails,
            DATA_LEVEL = 'data-emaillist-level';

        beforeEach(function(){
            view = new EmailView();
            view.model = new Backbone.Model({
                subject: 'Default Suject',
                total: 10,
                level: 1,
                hasCheckbox: true,
                hasChildren: false,
                hasOptions: false
            });

            //
            setFixtures('<ul id="fix-email"></ul>');
            fixEmails = $('#fix-email');
            fixEmails.append( view.render().el );
        });

        it('uses the right template', function(){
            var tmpl = app.loadTemplate('email');

            expect(tmpl(view.model.toJSON())).toBe(view.template(view.model.toJSON()));
        });

        it('should have the arrow if hasChildren is true', function(){
            expect(view.el).not.toContain('span.emaillist-label-arrow');

            view.model.set('hasChildren', true);
            fixEmails.empty().append( view.render().el );

            expect(view.el).toContain('span.emaillist-label-arrow');
        });

        it('should show the options when it swipes to left', function(){
            var label = view.$('.emaillist-label');
            label.trigger('swipeLeft');

            expect(label.get(0)).toHaveClass('is-optioned');
        });

        it('should hide the options when it swipes to right', function(){
            var label = view.$('.emaillist-label');

            label.addClass('is-optioned');
            label.trigger('swipeRight');

            expect(label.get(0)).not.toHaveClass('is-optioned');
        });

        it('should have the data-emaillist-level the same of level attribute', function(){
            var level = ~~view.el.getAttribute(DATA_LEVEL);

            expect( level ).toBe( view.model.get('level') );
        });

        it('should be hidden if the level is bigger than 1', function(){
            view.model.set('level', 2);
            fixEmails.empty().append( view.render().el );

            expect( view.el ).toHaveClass('is-hidden');
        });

        it('should have the counter the same of the total property', function(){
            var counter = ~~ view.$('.fixedcounter').text();
            expect( counter ).toBe(view.model.get('total'));
        });

        it('should trigger toggle method when click in the arrow', function(){
            spyOn(EmailView.prototype, 'toggle').andCallThrough();
            spyOn(EmailView.prototype, 'showItemInCascade').andCallThrough();
            spyOn(EmailView.prototype, 'closeItemInCascade').andCallThrough();
            view = new EmailView({model:view.model});

            view.model.set('hasChildren', true);
            fixEmails.empty().append( view.render().el );

            var arrow = view.$('.emaillist-label-arrow');
            arrow.trigger('click');

            expect(view.toggle).toHaveBeenCalled();
            expect(view.showItemInCascade).toHaveBeenCalled();
            expect(view.el).toHaveClass('is-open');

            arrow.trigger('click');
            expect(view.toggle.callCount).toBe(2);
            expect(view.closeItemInCascade).toHaveBeenCalled();
        });

        it('should have the .has-options class if hasOptions is true', function(){
            view.model.set('hasOptions', true);
            fixEmails.empty().append( view.render().el );

            expect(view.$('.emaillist-label').get(0)).toHaveClass('has-options');
        });

    });

});
