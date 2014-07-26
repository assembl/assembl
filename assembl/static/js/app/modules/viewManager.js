define(function(require){
    'use strict';

    var Marionette = require('marionette');

    var viewManager = Marionette.Controller.extend({

        init: function(options){
            this.segmentList = options.segmentList;
            this.ideaList = options.ideaList;
            this.ideaPanel = options.ideaPanel;
            this.messageList =  options.messageList;
            this.synthesisPanel = options.synthesisPanel;
        },

        executeView: function(view, func, params){

            switch(view){
                case 'ideaList':
                    this.ideaList.prototype[func].apply(params);
                    break;
                case 'ideaPanel':
                    this.ideaPanel.prototype[func].apply(params);
                    break;
                case 'segmentList':
                    this.segmentList.prototype[func].apply(params);
                    break;
                case 'messageList':
                    this.messageList.prototype[func].apply(params);
                    break;
                case 'synthesisPanel':
                    this.synthesisPanel.prototype[func].apply(params);
                    break;
            }
        }
    });

    return new viewManager();

});