define(function(require){
    'use strict';

    var Base = require('models/base'),
         Ctx = require('modules/context'),
           _ = require('underscore'),
        User = require('models/user'),
     Message = require('models/message');

    /**
     * @class SegmentModel
     */
    var SegmentModel = Base.Model.extend({

        /**
         * @init
         */
        initialize: function(){
            if( this.attributes.created ){
                this.attributes.creationDate = this.attributes.created;
            }

            if( ! this.get('creationDate') ){
                this.set( 'creationDate', Ctx.getCurrentTime() );
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
            var that = this;

            this.listenTo(this,"change:idIdea", function(){
              that.collection.collectionManager.getAllIdeasCollectionPromise().done(
                  function(allIdeasCollection) {
                    var previousIdea, 
                        idea;
                    
                    if(that.previous("idIdea") !== null) {
                      previousIdea = allIdeasCollection.get(that.previous("idIdea"));
                      //console.log("Segment:initialize:triggering idea change (previous idea)");
                      previousIdea.trigger('change');
                    }
                    if(that.get('idIdea') !== null) {
                    
                      idea = allIdeasCollection.get(that.get('idIdea'));
                      //console.log("Segment:initialize:triggering idea change (new idea)");
                      idea.trigger('change');
                    }
                        });
                  })
            // cleaning
            delete this.attributes.highlights;
        },

        /**
         * @type {string}
         */
        urlRoot: Ctx.getApiUrl("extracts"),

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
            var currentUser = Ctx.getCurrentUser(),
                id = currentUser.getId();

            if( !id ){
                return i18n.gettext('You must be logged in to create segments');
            }
        },

        /** Return a promise for the Post the segments is associated to, if any
         * @return {$.Defered.Promise}
         */
        getAssociatedPostPromise: function(){
          var that = this,
          deferred = $.Deferred();
          this.collection.collectionManager.getAllMessageStructureCollectionPromise().done(
              function(allMessageStructureCollection) {
                var post = null,
                idPost = that.get('idPost');
                post = allMessageStructureCollection.get(idPost);
                deferred.resolve(post);
              }
          );
          return deferred.promise();
        },

        /**
         * Return the html markup to the icon
         * @return {string}
         */
        getTypeIcon: function(){
            var cls = 'icon-',
                target = this.get('target'),
                idPost = this.idPost;

            // todo(Marc-Antonie): review this `type` because `idPost`
            // is a string and doesn't have `@type` attribute

            if (target != null) {
                switch(target['@type']){
                    case 'Webpage':
                        cls += 'link';
                        break;

                    case 'Email':
                    case 'Post':
                    case 'AssemblPost':
                    case 'SynthesisPost':
                    case 'ImportedPost':
                    default:
                        cls += 'mail';
                }
            } else if (idPost != null) {
                cls += 'mail';
            }


            return Ctx.format("<i class='{0}'></i>", cls);
        },

        /**
         * Returns the segent's creator
         * @return {User}
         */
        getCreatorDEPRECATED: function(){
            var creatorId = this.get('idCreator');
            return this.collection.collectionManager._allUsersCollection.getById(creatorId);
        },

        /**
         * Alias for `.get('quote') || .get('text')`
         * @return {String}
         */
        getQuote: function(){
            return this.get('quote') || this.get('text');
        }
    });

    /**
     * @class SegmentColleciton
     */
    var SegmentCollection = Base.Collection.extend({

        /**
         * @type {String}
         */
        url: Ctx.getApiUrl("extracts"),

        /**
         * @type {IdeaModel}
         */
        model: SegmentModel,

        /**
         * @init
         */
        initialize: function(){
         
        },
        
        /**
         * Return the segments to compose the clipboard
         * @return {Array<Segment>}
         */
        getClipboard: function(){
            var currentUser = Ctx.getCurrentUser(),
                segments;

            return this.filter(function(item){
                if( item.get('idIdea') !== null ){
                    return false;
                }
                return item.get('idCreator') == currentUser.id;
            });
        },

        /**
         * Returns the segment related to the annotation
         * @param  {annotation} annotation
         * @return {Segment}
         */
        getByAnnotation: function(annotation){
            return this.get(annotation['@id']);
        }
    });

    return {
        Model: SegmentModel,
        Collection: SegmentCollection
    };

});
