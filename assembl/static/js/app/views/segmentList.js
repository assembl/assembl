define(function(require){
    'use strict';

    var Backbone = require('backbone'),
               _ = require('underscore'),
               $ = require('jquery'),
         Assembl = require('modules/assembl'),
             Ctx = require('modules/context'),
         Segment = require('models/segment'),
           Types = require('utils/types'),
            i18n = require('utils/i18n'),
     Permissions = require('utils/permissions'),
CollectionManager = require('modules/collectionManager');

    var SegmentList = Backbone.View.extend({
        /**
         * @init
         */
        initialize: function(options){
          var that = this,
              collectionManager = new CollectionManager();

          collectionManager.getAllExtractsCollectionPromise().done(
              function(allExtractsCollection) {
                that.listenTo(allExtractsCollection, 'all', this.render);
                
                that.listenTo(allExtractsCollection, 'invalid', function(model, error){
                  alert(error);
                });

                that.listenTo(allExtractsCollection, 'add remove destroy change reset', this.render);

                that.listenTo(allExtractsCollection, 'add', function(segment){
                  that.highlightSegment(segment);
                });
          });

          Assembl.vent.on('segmentList:showSegment', function(segment){
              that.showSegment(segment);
          });

        },

        /**
         * The template
         * @type {_.template}
         */
        template: Ctx.loadTemplate('segmentList'),

        /**
         * The panel element
         * @type {jQuery}
         */
        panel: null,

        /**
         * The render
         * @return {segmentList}
         */
        render: function(){
          var that = this,
              collectionManager = new CollectionManager();
          if(Ctx.debugRender) {
            console.log("segmentList:render() is firing");
          }
          Ctx.cleanTooltips(this.$el);
            
          collectionManager.getAllExtractsCollectionPromise().done(
              function(allExtractsCollection) {

                var extracts = allExtractsCollection.getClipboard(),
                currentUser = Ctx.getCurrentUser(),
                data = {
                  segments : extracts,
                  ctx : Ctx,
                  canEditExtracts : currentUser.can(Permissions.EDIT_EXTRACT),
                  canEditMyExtracts : currentUser.can(Permissions.EDIT_MY_EXTRACT)
                },
                top = 0;

                $.when( collectionManager.getAllUsersCollectionPromise(),
                    collectionManager.getAllMessageStructureCollectionPromise()
                    ).then(
                        function( allUsersCollection, allMessagesCollection) {
                          
                          /* We need a real view for that benoitg - 2014-07-23 */
                          var ideaExtractList = that.$('.postitlist'),
                          template = Ctx.loadTemplate('segment');
                  
                          _.each(extracts, function(extract) {
                            var post = allMessagesCollection.get(extract.get('idPost'));
                            ideaExtractList.append( template(
                                {segment: extract,
                                  post: post,
                                  postCreator: allUsersCollection.get(post.get('idCreator')),
                                  canEditExtracts : currentUser.can(Permissions.EDIT_EXTRACT),
                                  canEditMyExtracts : currentUser.can(Permissions.EDIT_MY_EXTRACT),
                                  ctx : Ctx
                                }) );
                          });
                        }
                    );
                if( that.panel ){
                  top = that.panel.find('.panel-body')[0].scrollTop;
                }
                that.$el.html(that.template(data));
                Ctx.initTooltips(that.$el);
                that.panel = that.$('.panel');
      
                if( top > 0 ){
                  that.panel.find('.panel-body')[0].scrollTop = top;
                }
              });
          return this;
        },

        /**
         * Add a segment to the clipboard.  If the segment exists, it will be 
         * unlinked from it's idea (if any).
         * @param {Segment} segment
         */
        addSegment: function(segment){
          var that = this,
          collectionManager = new CollectionManager();

          collectionManager.getAllExtractsCollectionPromise().done(
              function(allExtractsCollection) {
                delete segment.attributes.highlights;

                allExtractsCollection.add(segment, {merge: true});
                segment.save('idIdea', null);
              });
        },

        /**
         * Transform an annotator annotation as a segment. 
         * The segment isn't saved.
         * @param {annotation} annotation
         * @param {Number} [idIdea=null] 
         * @return {Segment}
         */
        addAnnotationAsSegment: function(annotation, idIdea){
          var that = this,
              idPost = Ctx.getPostIdFromAnnotation(annotation),
              collectionManager = new CollectionManager();
          console.log("addAnnotationAsSegment called");

          var segment = new Segment.Model({
              target: { "@id": idPost, "@type": Types.EMAIL },
              text: annotation.text,
              quote: annotation.quote,
              idCreator: Ctx.getCurrentUser().getId(),
              ranges: annotation.ranges,
              idPost: idPost,
              idIdea: idIdea
          });

          if( segment.isValid() ){
            collectionManager.getAllExtractsCollectionPromise().done(
                function(allExtractsCollection) {
                  delete segment.attributes.highlights;
                    allExtractsCollection.add(segment);
                });
          } 
          else {
            alert( segment.validationError );
          }

          return segment;
        },

        /**
         * Creates a segment with the given text and adds it to the segmentList
         * @param  {string} text
         * @param  {string} [post=null] The origin post
         * @return {Segment}
         */
        addTextAsSegment: function(text, post){
            var idPost = null;

            if( post ){
                idPost = post.getId();
            }

            var segment = new Segment.Model({
                target: { "@id": idPost, "@type": Types.EMAIL },
                text: text,
                quote: text,
                idCreator: Ctx.getCurrentUser().getId(),
                idPost: idPost
            });

            if( segment.isValid() ){
                this.addSegment(segment);
                segment.save();
            }
        },

        /**
         * Removes a segment by its cid
         * @param  {String} cid
         */
        removeSegmentByCid: function(cid){
          var that = this,
          collectionManager = new CollectionManager();

          collectionManager.getAllExtractsCollectionPromise().done(
              function(allExtractsCollection) {
                var model = allExtractsCollection.get(cid);

                if(model){
                  model.destroy();
                }
              });
        },

        /**
         * Shows the given segment
         * @param {Segment} segment
         */
        showSegment: function(segment){
            //TODO: add a new behavior for this (popin...)
            //Ctx.openPanel(assembl.segmentList);
            this.highlightSegment(segment);
        },
        
        /**
         * Highlight the given segment with an small fx
         * @param {Segment} segment
         */
        highlightSegment: function(segment){
            var selector = Ctx.format('.box[data-segmentid={0}]', segment.cid),
                box = this.$(selector);

            if( box.length ){
                var panelBody = this.$('.panel-body');
                var panelOffset = panelBody.offset().top;
                var offset = box.offset().top;
                // Scrolling to the element
                var target = offset - panelOffset + panelBody.scrollTop();
                panelBody.animate({ scrollTop: target });
                box.highlight();
            }
        },

        
        /**
         * Closes the panel
         */
        closePanel: function(){
            if( this.button ){
                this.button.trigger('click');
            }
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'dragstart .postit': "onDragStart",
            'dragend .postit': "onDragEnd",
            'dragover .panel': 'onDragOver',
            'dragleave .panel': 'onDragLeave',
            'drop .panel': 'onDrop',

            'click .closebutton': "onCloseButtonClick",
            'click #segmentList-clear': "onClearButtonClick",
            'click #segmentList-closeButton': "closePanel",

            'click .segment-link': "onSegmentLinkClick"
        },

        /**
         * @event
         */
        onDragStart: function(ev){
          var that = this,
          collectionManager = new CollectionManager();

          collectionManager.getAllExtractsCollectionPromise().done(
              function(allExtractsCollection) {
                ev.currentTarget.style.opacity = 0.4;

                var cid = ev.currentTarget.getAttribute('data-segmentid'),
                    segment = allExtractsCollection.get(cid);

                Ctx.showDragbox(ev, segment.getQuote());
                Ctx.draggedSegment = segment;
              });

            
        },

        /**
         * @event
         */
        onDragEnd: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            ev.currentTarget.style.opacity = '';
            Ctx.draggedSegment = null;
        },

        /**
         * @event
         */
        onDragOver: function(ev){
            ev.preventDefault();

            var isText = false;
            if( ev.dataTransfer && ev.dataTransfer.types && ev.dataTransfer.types.indexOf('text/plain') > -1 ){
                isText = Ctx.draggedIdea ? false : true;
            }

            if( Ctx.draggedSegment !== null || isText ){
                this.panel.addClass("is-dragover");
            }

            if( Ctx.getDraggedAnnotation() !== null ){
                this.panel.addClass("is-dragover");
            }
        },

        /**
         * @event
         */
        onDragLeave: function(){
            this.panel.removeClass('is-dragover');
        },

        /**
         * @event
         */
        onDrop: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.panel.trigger('dragleave');

            var idea = Ctx.getDraggedIdea();
            if( idea ){
                return; // Do nothing
            }

            var segment = Ctx.getDraggedSegment();
            if( segment ){
                this.addSegment(segment);
                return;
            }

            var annotation = Ctx.getDraggedAnnotation();
            if( annotation ){
                Ctx.saveCurrentAnnotationAsExtract();
                return;
            }

            var text = ev.dataTransfer.getData("Text");
            if( text ){
                this.addTextAsSegment(text);
                return;
            }
        },

        /**
         * @event
         */
        onCloseButtonClick: function(ev){
            var cid = ev.currentTarget.getAttribute('data-segmentid');
            this.removeSegmentByCid(cid);
        },

        /**
         * @event
         */
        onClearButtonClick: function(ev){
          var collectionManager = new CollectionManager(),
              ok = confirm( i18n.gettext('Are you sure you want to empty your entire clipboard?') );
          
          if( ok ){
            collectionManager.getAllExtractsCollectionPromise().done(
                function(allExtractsCollection) {
                  var segments = allExtractsCollection.getClipboard();
                  _.each(segments, function(segment){
                    segment.destroy();
                  });
                });
          }
        },

        /**
         * @event
         */
        onSegmentLinkClick: function(ev){
            var cid = ev.currentTarget.getAttribute('data-segmentid'),
                collectionManager = new CollectionManager();

            collectionManager.getAllExtractsCollectionPromise().done(
                function(allExtractsCollection) {
                  var segment = allExtractsCollection.get(cid);
                  Ctx.showTargetBySegment(segment);
                });
        }
    });

    return SegmentList;
});
