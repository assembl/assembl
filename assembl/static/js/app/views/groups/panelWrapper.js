define(function (require) {

    var Marionette = require('marionette'),
      viewsFactory = require('objects/viewsFactory'),
         panelSpec = require('models/panelSpec');
    
    /** 
     * A wrapper for a panel, used anywhere in a panelGroup
     */
    var PanelWrapper = Marionette.LayoutView.extend({
        template: "#tmpl-panelWrapper",
        regions: {
           contents:'.panelContents',
        },
        className: "groupPanel",
        initialize: function(options) {
            var contentClass = viewsFactory(options.contentSpec);
            this.contentsView = new contentClass({
                groupContent: options.groupContent
            });
        },
        onRender: function() {
            this.contents.show(this.contentsView);
        }
    });
    return PanelWrapper;
});