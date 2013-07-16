define(['jasmine', 'underscore', 'app', 'views/ideaPanel'],
function(jasmine, _, app, IdeaPanel){

    var view,
        fixIdea;

    function getView(){
        var v = new IdeaPanel();

        //
        setFixtures('<div id="fix-idea"></div>');
        fixIdea = $('#fix-idea');
        fixIdea.append( v.render().el );
        return v;
    }

    return describe('IdeaPanel View', function(){

        beforeEach(function(){
            view = getView();
        });

        it('should change the state to .is-dragover when it is dragover', function(){
            app.draggedSegment = { title: 'Something' };
            view.panel.trigger('dragover');

            expect(view.panel.hasClass('is-dragover')).toBeTruthy();

            view.panel.trigger('dragleave');
            expect(view.panel.hasClass('is-dragover')).toBeFalsy();
        });

        it('should add the current segment when drop', function(){
            app.draggedSegment = { title: 'Something' };

            view.panel.trigger('drop');
            expect(view.idea.get('segments').length).toBe(1);
        });

        it('should remove the segment when clicking in the .closebutton', function(){
            var segment = { title: "Something" };
            view.addSegment(segment);

            view.$('.closebutton').eq(0).trigger('click');
            expect(view.idea.get('segments').length).toBe(0);
        });

    });

});
