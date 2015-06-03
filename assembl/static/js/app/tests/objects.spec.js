
var panelViewByPanelSpec = require('../objects/viewsFactory.js'),
    chai = require('chai').expect;

var expect = chai.expect;

return describe('Objects Specs', function () {

    describe('viewFactory', function () {
        var model = undefined;
        beforeEach(function(){
           model = new Backbone.Model({
               hidden: false,
               locked: false,
               minimized: false,
               type: "test"
           });
        });

        it('panelViewByPanelSpec should throw an error if invalidPanelSpecModel ', function () {
            var panel = function(){
              return panelViewByPanelSpec(model);
            }
            expect(panel).to.throw();
        });

    });

});
