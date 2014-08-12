define(function (require) {

    var Marionette = require('marionette'),
        panelClassByTypeName = require('objects/viewsFactory'),
        panelSpec = require('models/panelSpec');

    /**
     * A wrapper for a panel, used anywhere in a panelGroup
     */
    var PanelWrapper = Marionette.LayoutView.extend({
        template: "#tmpl-panelWrapper",
        regions: {
            contents: '.panelContents'
        },
        panelType: "groupPanel",
        className: "groupPanel",
        modelEvents: {
          "change:hidden": "setHidden",
          "change:gridWidth": "setGridWidth"
        },
        initialize: function (options) {
            var that = this,
                contentClass = panelClassByTypeName(options.contentSpec);
            this.contentsView = new contentClass({
                groupContent: options.groupContent
            });
            Marionette.bindEntityEvents(this, this.model, this.modelEvents);
        },
        onRender: function () {
            this.setGridWidth();
            this.contents.show(this.contentsView);
            this.setHidden();
        },
        setHidden: function() {
            if (this.model.get('hidden')) {
                this.$el.hide();
            } else {
                this.$el.css('display', 'table-cell');
            }
        },
        setGridWidth: function() {
            // Grid width can only be 1 or 2
            this.$el.removeClass("panelGridWidth-"+(2-this.model.get('gridWidth')));
            this.$el.addClass("panelGridWidth-"+this.model.get('gridWidth'));
        }
    });
    return PanelWrapper;
});