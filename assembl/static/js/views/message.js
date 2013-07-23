define(['backbone', 'underscore', 'moment', 'app', 'models/message'],
function(Backbone, _, Moment, app, Message){
    'use strict';

    /**
     * @class views.MessageView
     */
    var MessageView = Backbone.View.extend({
        tagName: 'div',
        className: 'message',

        /**
         * @init
         */
        initialize: function(){
            this.model.on('change:collapsed', this.render, this);
        },

        /**
         * The thread message template
         * @type {_.template}
         */
        template: app.loadTemplate('message'),

        /**
         * The render
         * @return {MessageView}
         */
        render: function(){
            var data = this.model.toJSON();

            data['date'] = new Moment(data.date).fromNow();

            if( data.collapsed ){
                this.$el.addClass('message--collapsed');
            } else {
                this.$el.removeClass('message--collapsed');
            }

            this.$el.html(this.template(data));
            return this;
        },

        events: {
            'click .iconbutton': 'onIconbuttonClick',
            'click .message-title': 'onIconbuttonClick'
        },

        /**
         * @event
         */
        onIconbuttonClick: function(){
            var collapsed = this.model.get('collapsed');
            this.model.set('collapsed', !collapsed);
        }
    });


    return MessageView;

});