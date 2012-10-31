define([
    'app'
], 

function(app){

    /* For now we are using our own Annotation model that is
    somewhat similar to OpenAnnotation except 
    instead of storing prefix and postfix, store start and end points e.g. 
        * coordinates
        * timestamps
        * characters
    */
    var Annotation = Backbone.Model.extend({
        defaults: function() {
            return {
                creator: null, // user id of the annotation creator
                created: null, // date of creation
                body: null, // body of the annotation
                annotates: null, // id of message this annotation is taken from
                start: null, // start parameter
                end: null // end parameter
            }
        }
    });

    return Annotation;

});