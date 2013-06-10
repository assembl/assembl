define(['jasmine', 'backbone', 'underscore', 'jquery', 'app', 'views/bucket'],
function(jasmine, Backbone, _, $, app, Bucket){

    app.bucketAnimationTime = 0;

    function testPropertyOverBrowsers(el, property, expectedValue){
        var p = property;

        if( el.css(p) !== null ){
            expect(el.css(p)).toBe(expectedValue);
        }

        p = '-webkit-' + property;
        if( el.css(p) !== null ){
            expect(el.css(p)).toBe(expectedValue);
        }

        p = '-moz-' + property;
        if( el.css(p) !== null ){
            expect(el.css(p)).toBe(expectedValue);
        }
    }

    function getView(){
        var v = new Bucket();
        v.model = new Backbone.Model({});

        setFixtures('<ul id="fix-bucket"></ul>');
        $('#fix-bucket').append( v.render().el );

        return v;
    }


    return describe('Bucket view', function(){
        var view;

        beforeEach(function(){
            view = getView();
        });

        it('depends on #wrapper', function(){
            expect( $('#wrapper').length ).toBe(1);
        });

        it('should start with leftMargin === 0 ', function(){
            expect( view.leftMargin ).toBe(0);
        });

        it('uses the right template', function(){
            var tmpl = _.template( $('#tmpl-bucket').html() );

            expect(tmpl(view.model.toJSON())).toBe(view.template(view.model.toJSON()));
        });

        it('must start closed', function(){
            expect(view.isOpen).toBeFalsy();
        });

        it('must have the divisor', function(){
            expect( view.$('#bucket-divisor').length ).toBe(1);
        });

        it('must have the close button', function(){
            expect( view.$('#bucket-closebutton').length ).toBe(1);
        });

        it('should open', function(){
            view.open();

            expect(view.$el.width()).toBe(app.bucketDefaultOpenWidth);

            var value = 'translateX('+app.bucketDefaultOpenWidth+'px)';
            testPropertyOverBrowsers(view.wrapper,'transform', value);
        });

        it('should close', function(){
            view.close();

            expect(view.$el.width()).toBe(app.bucketMinWidth);

            var value = 'translateX(0px)';
            testPropertyOverBrowsers(view.wrapper,'transform', value);
        });

        it('should start resize when mousedown on the divisor', function(){
            spyOn(Bucket.prototype, 'startResize').andCallThrough();
            spyOn(Bucket.prototype, 'stopResize').andCallThrough();
            view = getView();

            view.$('#bucket-divisor').trigger('mousedown');
            expect(view.isMoving).toBeTruthy();
            expect(view.startResize).toHaveBeenCalled();

            $(document).trigger('mouseup');
            expect(view.isMoving).toBeFalsy();
            expect(view.stopResize).toHaveBeenCalled();
        });

        it('should obey the leftMargin when open or close', function(){
            expect(view.leftMargin).toBe(0);
            var leftMargin = 200;

            view.leftMargin = leftMargin;
            view.open();

            var value = 'translateX('+leftMargin+'px)';
            testPropertyOverBrowsers(view.$el,'transform', value);

            var width = view.$el.width()+leftMargin;
            value = 'translateX('+width+'px)';
            testPropertyOverBrowsers(view.wrapper,'transform', value);

            view.close();

            value = 'translateX('+leftMargin+'px)';
            testPropertyOverBrowsers(view.$el,'transform', value);
            testPropertyOverBrowsers(view.wrapper,'transform', value);

            // clean up
            view.leftMargin = 0;
            view.close();
        });

        it('should define the leftMargin', function(){
            view.setLeftMargin(100);
            expect(view.leftMargin).toBe(100);

            view.setLeftMargin(0);
            expect(view.leftMargin).toBe(0);
        });

    });

});
