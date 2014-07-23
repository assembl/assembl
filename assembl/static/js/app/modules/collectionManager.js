'use strict';

define(function(require){

     var Assembl = require('modules/assembl'),
         Message = require('models/message'),
               $ = require('jquery'),
           Types = require('utils/types'),
            i18n = require('utils/i18n');
     
     /**
      * @class CollectionManager
      * 
      * A singleton to manage lazy loading of server collections
      */
    var CollectionManager = Marionette.Controller.extend({

        /**
         * Collection with all messsages in the discussion.
         * @type {MessageCollection}
         */
        allMessageStructureCollection : undefined,
        allMessageStructureCollectionPromise : undefined,
      
        initialize: function(options){
             ;
          },

          getAllMessageStructureCollectionPromise : function() {

            var that = this,
                deferred = $.Deferred();

            if (this.allMessageStructureCollectionPromise === undefined) {
                this.allMessageStructureCollection = new Message.Collection();

                this.allMessageStructureCollectionPromise = this.allMessageStructureCollection.fetch({
                    success: function(collection, response, options) {
                        that.allMessageStructureCollectionFinishedLoading = true;
                        /*this.listenTo(this.allMessageStructureCollection, 'add reset', function(){
                            that.allMessageStructureCollectionFinishedLoading = true;
                        });*/
                        
                        //console.log('resolving getAllMessageStructureCollectionPromise() from creation success callback', that.allMessageStructureCollection.length);
                        deferred.resolve(that.allMessageStructureCollection);
                    }
                });
            }
            else {
                this.allMessageStructureCollectionPromise.done(function(){
                    //console.log('resolving getAllMessageStructureCollectionPromise() from appended success callback', that.allMessageStructureCollection.length);
                    deferred.resolve(that.allMessageStructureCollection);
                });
            }

            // Returning a Promise so that only this function can modify
            // the Deferred object
            return deferred.promise();
        }
    });
    
    var _instance;

    return function() {
        if ( !_instance ) {
            _instance = new CollectionManager();
        }
        return _instance;
    };

});