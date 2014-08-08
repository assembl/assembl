define(function(require){
  'use strict';

  var Marionette = require('marionette');

  /**
   * An abstract class every panel should eventually extend
   * @class AssemblPanel
   */
  var AssemblPanel = Marionette.LayoutView.extend({
    template: "#tmpl-groupItem",
    
    /**
     * Show the panel is currently loading data
     */
    blockPanel: function(){
        this.$el.addClass('is-loading');
    },

    /**
     * Show the has finished loading data
     */
    unblockPanel: function(){
      this.$el.removeClass('is-loading');
    }
  });
  return AssemblPanel;
});
