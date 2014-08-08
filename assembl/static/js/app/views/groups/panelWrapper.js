define(function (require) {

    var Marionette = require('marionette'),
      GroupManager = require('modules/groupManager'),
      viewsFactory = require('objects/viewsFactory'),
         panelSpec = require('models/panelSpec');
    var PanelWrapper = Marionette.LayoutView.extend({
        template: "#tmpl-panelWrapper",
        regions: {
           contents:'.panelContents',
        },
        className: "groupPanel",
        initialize: function(options) {
            var contentClass = viewsFactory(options.contentSpec);
            this.contentsView = new contentClass({
                groupContent: options.groupContent,
                groupManager: options.groupManager,
            });
        },
        onRender: function() {
            this.contents.show(this.contentsView);
        }
    });
    return PanelWrapper;
});