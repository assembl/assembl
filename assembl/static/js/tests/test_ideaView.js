define(['jasmine', 'underscore', 'app', 'views/idea'],
function(jasmine, _, app, IdeaView){

    var view,
        fixIdea,
        DATA_LEVEL = 'data-idealist-level';

    function getView(){
        var model = new Backbone.Model({
            shortTitle: '',
            longTitle: '',
            total: 1,
            level: 1,
            hasCheckbox: true,
            hasChildren: false,
            hasOptions: false
        });

        var v = new IdeaView({model: model});

        //
        setFixtures('<div id="fix-idea"></div>');
        fixIdea = $('#fix-idea');
        fixIdea.append( v.render().el );
        return v;
    }

    return describe('Idea view', function(){

        beforeEach(function(){
            view = getView();
        });

        it('should have the arrow if hasChildren is true', function(){
            expect(view.el).not.toContain('span.idealist-arrow');

            view.model.set('hasChildren', true);
            fixIdea.empty().append( view.render().el );

            expect(view.el).toContain('span.idealist-arrow');
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

            var arrow = view.$('.idealist-arrow').eq(0);
            arrow.trigger('click');

            expect(view.toggle).toHaveBeenCalled();
            expect(view.el).toHaveClass('is-open');
        });

        it('should set the isSelect flag to true when clicked', function(){
            view.$('.idealist-title').trigger('click');
            expect(view.el).toHaveClass('is-selected');
        });

    });

});
