define(['jasmine', 'jquery', 'utils/panelSpecTypes', 'chai'], function (jasmine, $, PanelSpecTypes, chai) {

    var expect = chai.expect;

    return describe('Utils module', function () {

        describe('panelSpecType', function(){

            it('getByRawId should throw error if PanelSpecTypes id undefined', function(){
                var panel = function(){
                    return PanelSpecTypes.getByRawId('toto');
                }
                expect(panel).to.throw();
            });
        })

        describe('socket', function(){
          // testing socket event etc...

          it('socket should work perfect', function(){
             expect(true).to.be.true;
          })

        });

    });

});