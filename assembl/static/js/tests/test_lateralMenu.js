define(['jasmine-jquery', 'backbone', 'underscore', 'jquery', 'app', 'views/lateralMenu'],
function(jasmine, Backbone, _, $, app, LateralMenu){

    // Instantaneously
    app.lateralMenuAnimationTime = 0;

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
        var v = new LateralMenu();
        v.model = new Backbone.Model({});

        setFixtures('<ul id="fix-lateralmenu"></ul>');
        $('#fix-lateralmenu').append( v.render().el );

        return v;
    }


    return describe('LateralMenu view', function(){
        var view;

        beforeEach(function(){
            view = getView();
        });

        it('uses the right template', function(){
            var tmpl = _.template( $('#tmpl-lateralMenu').html() );

            expect(tmpl(view.model.toJSON())).toBe(view.template(view.model.toJSON()));
        });

        it('must have the #assembl-mainbutton in the template', function(){
            expect( $('#assembl-mainbutton').length ).toBe(1);
        });

        it('must have the #wrapper in the template', function(){
            expect( $('#wrapper').length ).toBe(1);

            expect( view.wrapper.get(0) ).toBe('#wrapper');
        });

        it('must have the close button', function(){
            expect( view.$('#lateralmenu-button').length ).toBe(1);
        });

        it('should open and close when click on the mainbutton', function(){
            expect(view.isOpen).toBeFalsy();

            spyOn(LateralMenu.prototype, 'toggle').andCallThrough();
            spyOn(LateralMenu.prototype, 'open').andCallThrough();
            spyOn(LateralMenu.prototype, 'close').andCallThrough();
            view = getView();

            view.$('#lateralmenu-button').click();

            expect(view.isOpen).toBeTruthy();
            expect(view.toggle).toHaveBeenCalled();
            expect(view.open).toHaveBeenCalled();
            expect(view.close).not.toHaveBeenCalled();

            view.$('#lateralmenu-button').click();
            expect(view.isOpen).toBeFalsy();
            expect(view.toggle.callCount).toBe(2);
            expect(view.close).toHaveBeenCalled();
        });

        it('should open and close', function(){
            var wrapperValue = 'translateX(' + app.lateralMenuWidth + 'px)',
                elValue = 'translateX(-' + app.lateralMenuWidth + 'px)';

            view.open();
            testPropertyOverBrowsers(view.$el,'transform', 'translateX(0px)');
            testPropertyOverBrowsers(view.wrapper,'transform', wrapperValue);
            expect(view.isOpen).toBeTruthy();

            view.close();
            testPropertyOverBrowsers(view.$el,'transform', elValue);
            testPropertyOverBrowsers(view.wrapper,'transform', 'translateX(0px)');
            expect(view.isOpen).toBeFalsy();
        });

    });

});
