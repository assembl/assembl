define(function(require){
    'use strict';

     var Marionette = require('marionette');

    /**
     * @class AssemblPanel
     */
    var AssemblPanel = Marionette.LayoutView.extend({
      template: "#tmpl-groupItem"
    });
    return AssemblPanel;
});
