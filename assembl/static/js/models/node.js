define([
    'app'
], 

function(app){

    /* A node of the full debate summary tree */
    /* Can also be a ToC node or a Synthesis node */
    var Node = Backbone.Model.extend({
        defaults: function() {
            return {
                title: null,
                definition: null,
                extracts: [], // Contains Open Annotations - to be determined how to model
                children: [],
                parent: null,
                featured: false, // Potentially unnecessary - if this node will appear in the short, algorithmically-generated TOC
                isSynthesis: false // If this Node is being used to create a synthesis
            }
        }
    });

    return Node;

});