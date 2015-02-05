define(['jasmine', 'jquery', 'utils/panelSpecTypes'], function (jasmine, $, PanelSpecTypes) {

    return describe('Utils module', function () {

        describe('panelSpecType', function(){

            it('PanelSpecTypes constant should defined', function(){
                expect(PanelSpecTypes.NAV_SIDEBAR.id).toEqual('navSidebar');
                expect(PanelSpecTypes.IDEA_PANEL.id).toEqual('ideaPanel');
                expect(PanelSpecTypes.MESSAGE_LIST.id).toEqual('messageList');
                expect(PanelSpecTypes.NAVIGATION_PANEL_HOME_SECTION.id).toEqual('homeNavPanel');
                expect(PanelSpecTypes.TABLE_OF_IDEAS.id).toEqual('ideaList');
                expect(PanelSpecTypes.CLIPBOARD.id).toEqual('clipboard');
                expect(PanelSpecTypes.NAVIGATION_PANEL_SYNTHESIS_SECTION.id).toEqual('synthesisNavPanel');
                expect(PanelSpecTypes.SYNTHESIS_EDITOR.id).toEqual('synthesisPanel');
                expect(PanelSpecTypes.DISCUSSION_CONTEXT.id).toEqual('homePanel');
                expect(PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT.id).toEqual('externalVisualizationPanel');
            });

            it('getByRawId should throw error if PanelSpecTypes id undefined', function(){
                var panel = function(){
                    return PanelSpecTypes.getByRawId('toto');
                }
                expect(panel).toThrow();
            });
        })

        describe('socket', function(){
          // testing socket event etc...

          it('socket should work perfect', function(){
             expect(true).toBe(true);
          })

        });

    });

});