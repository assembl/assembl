define(['jasmine', 'backbone', 'underscore', 'jquery', 'app', 'views/segmentList'],
function(jasmine, Backbone, _, $, app, SegmentList){

    function getView(){
        var v = new SegmentList();

        setFixtures('<ul id="fix-segmentlist"></ul>');
        $('#fix-segmentlist').append( v.render().el );

        return v;
    }


    return describe('SegmentList view', function(){
        var view;

        beforeEach(function(){
            view = getView();
        });

        it('should add a new segment', function(){
            spyOn(SegmentList.prototype, 'render').andCallThrough();
            view = getView();

            view.addSegment( new Backbone.Model({ text: 'nada' }) );

            expect(view.render).toHaveBeenCalled();
            expect(view.segments.length).toBe(1);
        });

        it('should remove a segment by clicking in the .closebutton', function(){
            view.addSegment( new Backbone.Model({ text: 'nada' }) );
            expect(view.segments.length).toBe(1);

            view.$('.closebutton').trigger('click');
            expect(view.segments.length).toBe(0);
        });

        it('should set the app._draggedSegment as the current dragged segment', function(){
            view.addSegment( new Backbone.Model({ text: 'nada' }) );
            view.$('.box').trigger('dragstart');

            expect(app._draggedSegment.get('text')).toBe('nada');

            view.$('.box').trigger('dragend');
            expect(app._draggedSegment).toBe(null);
        });

        it('should remove the segment by click', function(){
            view.addSegment( new Backbone.Model({ text: 'nada' }) );
            expect(view.segments.length).toBe(1);

            view.$('.closebutton').trigger('click');
            expect(view.segments.length).toBe(0);
        });

    });

});
