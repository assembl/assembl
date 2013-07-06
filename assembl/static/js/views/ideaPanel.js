define(['backbone', 'underscore', 'models/idea', 'app', 'ckeditor'],
function(Backbone, _, Idea, app, ckeditor){
    'use strict';

    var EDITOR_ID = 'ideaPanel-longtitle';

    /**
     * @class IdeaPanel
     */
    var IdeaPanel = Backbone.View.extend({
        /**
         * The tempate
         * @type {_.template}
         */
        template: app.loadTemplate('ideaPanel'),

        /**
         * @init
         */
        initialize: function(){

        },

        /**
         * The render
         */
        render: function(){
            this.$el.html( this.template() );
            ckeditor.inline( EDITOR_ID ).on( 'blur', this.onLongTitleBlur.bind(this) );

            return this;
        },

        /**
         * Events
         */
        events: {},

        /**
         * @event
         */
        onLongTitleBlur: function(){
            var data = ckeditor.instances[EDITOR_ID].getData();

            this.idea.set('longTitle', data);
        }

    });

    return IdeaPanel;
});