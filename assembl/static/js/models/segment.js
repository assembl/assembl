define(['backbone', 'app', 'moment', 'models/user'],
function(Backbone, app, moment, User){
    'use strict';

    /**
     * @class SegmentModel
     */
    var SegmentModel = Backbone.Model.extend({

        /**
         * @init
         */
        initialize: function(){
            this.on('change:idIdea', this.onAttrChange, this);
            //this.on('invalid', function(model, error){ alert( error ); }, this);

            if( this.attributes.created ){
                this.attributes.creationDate = this.attributes.created;
            }

            if( ! this.get('creationDate') ){
                this.set( 'creationDate', app.getCurrentTime() );
            }

            // cleaning
            delete this.attributes.highlights;
        },

        /**
         * @type {String}
         */
        urlRoot: app.getApiUrl("extracts"),

        /**
         * @type {Object}
         */
        defaults: {
            text: '',
            quote: '',
            idPost: null,
            idIdea: null,
            creationDate: null,
            creator: {},
            source_creator: {},
            ranges: []
        },

        /**
         * Validation
         */
        validate: function(attrs, options){
            var currentUser = app.getCurrentUser();
            if( ! currentUser.id ){
                return i18n.gettext('You must be logged in to create segments');
            }
        },

        /**
         * Returns a fancy date (ex: a few seconds ago) 
         * @return {String}
         */
        getCreationDateFormated: function(){
            return moment( this.get('creationDate') ).fromNow();
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save();
        },

        /**
         * @return {Boolean} True if there is a source_creator
         */
        hasSourceCreator: function(){
            return this.attributes.source_creator && this.attributes.source_creator.id !== undefined;
        },


        /**
         * Return the html markup to the icon
         * @return {string}
         */
        getTypeIcon: function(){
            var cls = 'icon-',
                type = this.get('target')['@type'];

            switch(type){
                case 'webpage': 
                    cls += 'link';
                    break;

                case 'email':
                default:
                    cls += 'mail';
            }

            // <% if (segment.get('target')['@type'] == 'webpage') { %>
            //         <a href="<%= segment.get('target').url %>" target="new">{{ gettext("source") }}</a>
            //     <% } %>

            return app.format("<i class='{0}'></i>", cls);
        }
    });

    /**
     * @class SegmentColleciton
     */
    var SegmentCollection = Backbone.Collection.extend({
        /**
         * @type {String}
         */
        url: app.getApiUrl("extracts"),

        /**
         * @type {IdeaModel}
         */
        model: SegmentModel,

        /**
         * Return the segments to compose the clipboard
         * @return {Array<Segment>}
         */
        getClipboard: function(){
            var currentUser = app.getCurrentUser(),
                segments;

            return this.filter(function(item){
                var creator = item.get('creator');

                if( item.get('idIdea') !== null ){
                    return false;
                }

                if( creator ){
                    return creator.id == currentUser.id;
                }
                return false;
            });
        },

        /**
         * Returns the segment related to the annotation
         * @param  {annotation} annotation
         * @return {Segment}
         */
        getByAnnotation: function(annotation){
            return this.get(annotation.id);
        }
    });

    return {
        Model: SegmentModel,
        Collection: SegmentCollection
    };

});
