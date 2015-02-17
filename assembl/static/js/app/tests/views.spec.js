define(['chai', 'views/navBar', 'jquery', 'fixtures'], function (chai, navBar, $, fixtures) {

    var expect = chai.expect;

    var view,fixNav;

    function getView(){
        var nav = new navBar();

        fixtures.load('<div id="slider"></div>');
        fixtures.load('<div id="fix-nav"></div>');
        fixNav = $('#fix-nav');
        fixNav.append( nav.render().el );
        return nav;
    }

    return describe('Views Specs', function () {

        describe('Navigation barre', function(){

            beforeEach(function(){
                view = getView();
            });

            it('Views should exist', function () {
                //view.ui.joinDiscussion.click()
                //expect($('#slider')).to.have.html('<div class="group-modal popin-wrapper modal-joinDiscussion bbm-wrapper"></div>');
            });

            afterEach(function(){
                fixtures.cleanUp();
            });

        });

    });
});