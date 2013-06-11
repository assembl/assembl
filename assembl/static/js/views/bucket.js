define(['backbone', 'underscore', 'jquery', 'app', 'views/email'],
function(Backbone, _, $, app, EmailView){
    'use strict';

    var Bucket = Backbone.View.extend({
        initialize: function(){
            this.on('toggle', this.toggle, this);
        },

        /**
         * The main wrapper
         * @type {jQuery}
         */
        wrapper: $('#wrapper'),

        /**
         * Flag whether it is open or not
         * @type {Boolean}
         */
        isOpen: false,

        /**
         * Flag wether the bucket is moving ot not
         * @type {Boolean}
         */
        isMoving: false,

        /**
         * The current with when the bucket is open
         * @type {Number}
         */
        currentWidth: app.bucketMinWidth,

        /**
         * Margin on left
         * @type {Number}
         */
        leftMargin: 0,

        /**
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('bucket'),

        /**
         * The render
         * @return {LateralMenu}
         */
        render: function(){
            this.$el.html(this.template());

            return this;
        },

        /**
         * Add a segment to the bucket
         * @param {string} segment
         */
        addSegment: function(segment){
            var li = $('<li>').text( segment );
            this.$('#bucket-list').append(li);

            this.open();
        },

        /**
         * Sets the left margin
         * @param {Number} [leftMargin]
         */
        setLeftMargin: function(leftMargin){
            this.leftMargin = leftMargin;

            this.resize( this.$el.width(), leftMargin );
        },

        /**
         * Set the width and the translateX using animation
         * @return {[type]}
         */
        resize: function(width, translateX){
            var bucketWidth = width >= app.bucketMinWidth ? width : app.bucketMinWidth;

            this.$el.animate({ width: bucketWidth+'px', translateX: translateX+'px' }, app.bucketAnimationTime, app.ease);
            this.wrapper.animate({ translateX: (width+translateX)+'px' }, app.bucketAnimationTime, app.ease);
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'click  #bucket-closebutton': 'close',
            'mousedown #bucket-divisor': 'startResize'
        },

        /**
         * Open the bucket
         */
        open: function(){
            var translateX = this.leftMargin,
                width;

            if( this.currentWidth <= app.bucketDefaultOpenWidth ){
                width = app.bucketDefaultOpenWidth;
            } else {
                width = this.currentWidth;
            }

            this.resize( width, translateX );
        },

        /**
         * @event
         */
        close: function(){
            this.resize( 0, this.leftMargin );
        },

        /**
         * @event
         */
        startResize: function(ev){
            var doc, self, mousemove, mouseup;

            self = this;
            doc = $(document);
            mousemove = function(ev){ self.onMouseMove(ev); };
            mouseup = function(){
                self.stopResize();
                doc.off('mousemove', mousemove)
                  .off('mouseup', mouseup);
            };

            doc.on('mousemove', mousemove)
              .on('mouseup', mouseup);

            app.body.addClass('user-select-none');
            this.isMoving = true;
            ev.preventDefault();
        },

        /**
         * @event
         */
        stopResize: function(){
            this.isMoving = false;
            app.body.removeClass('user-select-none');
        },

        /**
         * @event
         */
        onMouseMove: function(ev){
            if( ! this.isMoving ){
                return;
            }

            var x = ev.clientX - this.leftMargin;

            var width = x >= app.bucketMinWidth ? x : app.bucketMinWidth,
                translateX = width + this.leftMargin;

            this.currentWidth = width;
            this.$el.animate( { width: width, translateX: this.leftMargin+'px' }, 0 );
            this.wrapper.animate({ translateX: translateX+'px' }, 0);
        }

    });

    return Bucket;
});
