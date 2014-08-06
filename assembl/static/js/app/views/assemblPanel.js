define(function(require){
  'use strict';

  var Marionette = require('marionette');

  /**
   * An abstract class every panel should eventually extend
   * @class AssemblPanel
   */
  var AssemblPanel = Marionette.LayoutView.extend({
    template: "#tmpl-groupItem"
  });
  return AssemblPanel;
});
