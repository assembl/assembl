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

        it('should have the arrow if children.length > 0', function(){
            expect(view.el).not.toContain('span.idealist-arrow');

            view.model.get('children').add({ shortTitle: 'nothing' });
            fixIdea.empty().append( view.render().el );

            expect(view.el).toContain('span.idealist-arrow');
        });

        it('should have the data-idealist-level the same of level attribute', function(){
            var level = ~~view.el.getAttribute(DATA_LEVEL);

            expect( level ).toBe( view.model.get('level') );
        });

        it('should set the isSelect flag to true when clicked', function(){
            view.$('.idealist-title').trigger('click');
            expect(view.el).toHaveClass('is-selected');
        });

        it('should set the state to .is-dragover when there is a segment over', function(){
            var body = view.$('.idealist-body');
            body.trigger('dragover');

            expect(view.$el.hasClass('is-dragover')).toBeTruthy();

            body.trigger('dragleave');
            expect(view.$el.hasClass('is-dragover')).toBeFalsy();
        });

        it('should set the state to .is-dragover-below when there is a segment over in the below area', function(){
            var dropzone = view.$('.idealist-dropzone');
            dropzone.trigger('dragover');

            expect(view.$el.hasClass('is-dragover-below')).toBeTruthy();

            dropzone.trigger('dragleave');
            expect(view.$el.hasClass('is-dragover-below')).toBeFalsy();
        });

        it('should set the app.draggedIdea when dragstart', function(){
            view.model = new Backbone.Model({ shortTitle: 'something'});

            var body = view.$('.idealist-body');
            body.trigger('dragstart');

            expect(app.draggedIdea.get('shortTitle')).toBe('something');
        });

    });

});
