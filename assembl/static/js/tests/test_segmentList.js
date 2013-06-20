define(['jasmine', 'backbone', 'underscore', 'jquery', 'app', 'views/segmentList'],
function(jasmine, Backbone, _, $, app, SegmentList){

    function getView(){
        var v = new SegmentList();
        v.model = new Backbone.Model({});

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
            spyOn(SegmentList.prototype, 'render');

            view.addSegment({ text: 'nada' });

            expect(view.render).toHaveBeenCalled();
            expect(view.segments.length).toBe(1);
        });

        it('should remove a segment by its cid', function(){
            spyOn(SegmentList.prototype, 'render');

            view.addSegment({ text: 'nada' });
            expect(view.segments.length).toBe(1);

            var cid = view.segments.at(0).cid;
            this.removeSegmentByCid(cid);

            expect(view.segments.length).toBe(0);
            expect(view.render).toHaveBeenCalled();
            expect(view.render.callCount).toBe(2);
        });

        it('should remove a segment by clicking in the .closebutton', function(){
            view.addSegment({ text: 'nada' });
            expect(view.segments.length).toBe(1);

            view.$('.closebutton').trigger('click');
            expect(view.segments.length).toBe(0);
        });

    });

});
