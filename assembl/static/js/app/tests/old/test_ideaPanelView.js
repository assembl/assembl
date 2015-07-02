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
            app._draggedSegment = { title: 'Something' };
            view.panel.trigger('dragover');

            expect(view.panel.hasClass('is-dragover')).toBeTruthy();

            view.panel.trigger('dragleave');
            expect(view.panel.hasClass('is-dragover')).toBeFalsy();
        });

        it('should add the current segment when drop', function(){
            spyOn(IdeaPanel.prototype, 'addSegment');
            app._draggedSegment = { title: 'Something' };

            view = getView();

            view.panel.trigger('drop');
            expect(view.addSegment).toHaveBeenCalled();
        });

    });

});
