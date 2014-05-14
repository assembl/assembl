define(['backbone', 'underscore', 'jquery', 'models/idea', 'app', 'permissions'],
function(Backbone, _, $, Idea, app, Permissions){
    'use strict';

    var IdeaFamilyView = Backbone.View.extend({
        /**
         * Tag name
         * @type {String}
         */
        tagName: 'div',

        /**
         * The class of view used inside the family
         */
        innerViewClass: null,
        
        /**
         * The template
         * @type {[type]}
         */
        template: app.loadTemplate('ideaFamily'),

        /**
         * @init
         */
        initialize: function(obj, view_data){
            this.view_data = view_data
            this.isOpen = true;
            this.innerViewClass = obj.innerViewClass
        },

        /**
         * The render
         * @return {IdeaInSynthesisView}
         */
        render: function(){
            app.trigger('render');

            var
                that = this,
                data = this.model.toJSON(),
                authors = [],
                segments = app.getSegmentsByIdea(this.model),
                view_data = this.view_data,
                render_data = view_data[this.model.getId()],
                ideaView = new this.innerViewClass({model: this.model});
            _.extend(data, render_data);

            this.$el.addClass('ideafamily-item');
            if(render_data['is_last_sibling']) {
                this.$el.addClass('is-last-sibling');
            }

            // if(!render_data['true_sibling']) {
            //     this.$el.addClass('false-sibling');
            // }

            if(render_data['children'].length > 0) { 
                this.$el.addClass('has-children');
            }else{
                this.$el.addClass('no-children');
            }
            if (render_data['skip_parent']) {
                this.$el.addClass('skip_parent');
            }
            this.$el.addClass('level'+render_data['level']);;
            
            if( this.isOpen === true ){
                this.$el.addClass('is-open');
            } else {
                this.$el.removeClass('is-open');
            }

            data.id = this.model.getId();

            this.$el.html(this.template(data));

            this.$el.find('>.ideafamily-body>.ideafamily-idea').append(ideaView.render().el);

            var rendered_children = [];
            _.each(render_data['children'], function(idea){
                var ideaFamilyView = new IdeaFamilyView({
                    model:idea, 
                    innerViewClass:that.innerViewClass},
                    view_data);
                rendered_children.push( ideaFamilyView.render().el );
            });
            this.$el.find('>.ideafamily-body>.ideafamily-children').append( rendered_children );

            return this;
        }


    });

    return IdeaFamilyView;
});
