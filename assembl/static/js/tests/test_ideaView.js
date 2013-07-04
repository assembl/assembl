define(['jasmine', 'underscore', 'app', 'views/idea'],
function(jasmine, _, app, IdeaView){

    var view,
        fixIdea,
        DATA_LEVEL = 'data-idealist-level';

    function getView(){
        var v = new IdeaView();
        v.model = new Backbone.Model({
            subject: 'Default Suject',
            total: 10,
            level: 1,
            hasCheckbox: true,
            hasChildren: false,
            hasOptions: false
        });

        //
        setFixtures('<ul id="fix-idea"></ul>');
        fixIdea = $('#fix-idea');
        fixIdea.append( v.render().el );
        return v;
    }

    return describe('Idea view', function(){

        beforeEach(function(){
            view = getView();
        });

        it('uses the right template', function(){
            var tmpl = app.loadTemplate('idea');

            expect(tmpl(view.model.toJSON())).toBe(view.template(view.model.toJSON()));
        });

        it('should have the arrow if hasChildren is true', function(){
            expect(view.el).not.toContain('span.idealist-label-arrow');

            view.model.set('hasChildren', true);
            fixIdea.empty().append( view.render().el );

            expect(view.el).toContain('span.idealist-label-arrow');
        });

        it('should show the options when it swipes to left', function(){
            var label = view.$('.idealist-label');
            label.trigger('swipeLeft');

            expect(label.get(0)).toHaveClass('is-optioned');
        });

        it('should hide the options when it swipes to right', function(){
            var label = view.$('.idealist-label');

            label.addClass('is-optioned');
            label.trigger('swipeRight');

            expect(label.get(0)).not.toHaveClass('is-optioned');
        });

        it('should have the data-idealist-level the same of level attribute', function(){
            var level = ~~view.el.getAttribute(DATA_LEVEL);

            expect( level ).toBe( view.model.get('level') );
        });

        it('should trigger toggle method when click in the arrow', function(){
            spyOn(IdeaView.prototype, 'toggle').andCallThrough();
            view = new IdeaView({model:view.model});

            view.model.set('hasChildren', true);
            fixIdea.empty().append( view.render().el );

            var arrow = view.$('.idealist-label-arrow').eq(0);
            arrow.trigger('click');

            expect(view.toggle).toHaveBeenCalled();
            expect(view.el).toHaveClass('is-open');

            arrow.trigger('click');
            expect(view.toggle.callCount).toBe(2);
        });

        it('should have the .has-options class if hasOptions is true', function(){
            view.model.set('hasOptions', true);
            fixIdea.empty().append( view.render().el );

            expect(view.$('.idealist-label').get(0)).toHaveClass('has-options');
        });

        it('should have the .idealist-label in the label property', function(){
            expect( view.label ).toBe('.idealist-label');
        });

        it('should add an idea if it is in .is-dragover-below state', function(){
            view.label.classList.add('is-dragover-below');

            //view.add
            // view.addSegment({ text: 'nada' });
            // view.segment
        });

    });

});
