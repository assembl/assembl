define(['backbone', 'underscore', 'app', 'models/user', 'models/message'],
function(Backbone, _, app, User, Message){
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
            
            if( this.attributes['@id'] ){
                this.url = app.getGenericApiUrl(this.attributes['@id']);
            }

            if( this.attributes.created ){
                this.attributes.creationDate = this.attributes.created;
            }

            if( ! this.get('creationDate') ){
                this.set( 'creationDate', app.getCurrentTime() );
            }

            var ranges = this.attributes.ranges,
                _serializedRange = [],
                _ranges = [];

            _.each(ranges, function(range, index){

                if( !(range instanceof Range.SerializedRange) ){
                    ranges[index] = new Range.SerializedRange(range);
                }

                _ranges[index] = ranges[index];

            });

            // We need to create a copy 'cause annotator destroy all ranges
            // once it creates the highlight
            this.attributes._ranges = _ranges;

            // cleaning
            delete this.attributes.highlights;
        },

        /**
         * Overwritting the idAttribute
         * @type {String}
         */
        idAttribute: '@id',

        /**
         * @type {Object}
         */
        defaults: {
            text: '',
            quote: '',
            idPost: null,
            idIdea: null,
            creationDate: null,
            idCreator: null,
            ranges: [],
            target: null
        },

        /**
         * Validation
         */
        validate: function(attrs, options){
            var currentUser = app.getCurrentUser(),
                id = currentUser.get('id') || currentUser.get('@id');

            if( !id ){
                return i18n.gettext('You must be logged in to create segments');
            }
        },

        /**
         * @return {Idea} The Post the segments is associated to, if any
         * 
         * FIXME:  Once proper lazy loading is implemented, this must be changed
         * to use it.  As it is, it will leak memory
         * 
         */
        getAssociatedPost: function(){
            var post = null,
                idPost = this.attributes.idPost;

            if (idPost) {
                if(app.segmentPostCache[idPost]) {
                    return app.segmentPostCache[idPost];
                }
                var posts = app.messageList.messages.where({id:idPost});
                if(posts.length){
                    post = posts[0];
                }
                else {
                    post = new Message.Model({id: idPost});
                    post.fetch({async:false});
                }
                app.segmentPostCache[idPost] = post;
            }
            return post;
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save();
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

            return app.format("<i class='{0}'></i>", cls);
        },

        /**
         * Returns the segent's creator
         * @return {User}
         */
        getCreator: function(){
            var creatorId = this.get('idCreator');
            return app.users.getById(creatorId);
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
                if( item.get('idIdea') !== null ){
                    return false;
                }

                return item.getCreator().get('id') == currentUser.id;
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
