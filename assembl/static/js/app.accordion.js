/**
 * @class app.accordion
 */
app.accordion = new function($){
    'use strict';

    /** Constants */
    var self = this,
        DATA_HEIGHT = 'data-accordion-height';

    /**
     * @event
     */
    function onHeaderClick(ev){
        var area = $(ev.currentTarget).parent();

        if( area.hasClass('is-open') ){
            self.closeArea( area );
        } else {
            self.openArea( area );
        }

    }

    /**
     * Closes all open areas
     */
    function closeAllAreas(){
        $('.accordion-area.is-open').each(function(i, el){
            app.closeArea($(el));
        });
    }

    /**
     * Open a closed area
     * @param  {jQuery} area
     */
    self.openArea = function(area){
        var body = area.find('.accordion-body'),
            height = this.getBodyHeight(body);

        area.addClass('is-open');
        body.css('height', height);
    };

    /**
     * Closes an open area
     * @param  {jQuery} area
     */
    self.closeArea = function(area){
        area
            .removeClass('is-open')
            .find('.accordion-body')
            .css('height', '0px');
    };

    /**
     * Returns the height of the given .accordion-body
     * @param  {jQuery} body
     * @return {Number}
     */
    self.getBodyHeight = function(body){
        var height = body.attr(DATA_HEIGHT);

        if( height === null ){

            body.css({
                position: 'absolute',
                height: 'auto',
                visibility: 'hidden'
            });

            height = body.height();

            body
                .css({
                    position: 'static',
                    height: '0px',
                    overflow: 'hidden',
                    visibility: 'visible'
                })
                .attr(DATA_HEIGHT, height+'px');
        }

        return height;
    };

    /**
     * @init
     * @param  {jQuery} scope
     */
    self.init = function( scope ){
        $('.accordion-header', scope).on('click', onHeaderClick);
    };

}(app.$);


/**
//var emails = new EmailList();

emails.reset([
    new Email({ subject: "Systhème sur l'innocation monétaire", level: 1, total: 22, hasChildren: false }),
    new Email({ subject: "L'expédition sur l'innovation monétaire", level: 1, total: 189, hasChildren: true }),
    new Email({ subject: "Présentation des participants", level: 2, total: 51, hasChildren: false }),
    new Email({ subject: "Les monnais ont plusieurs rôles", level: 2, total: 88, hasChildren: true }),
    new Email({ subject: "Un principe de résolution des dettes", level: 3, total: 70, hasChildren: false }),
    new Email({ subject: "Long text to make it not fit here and for the overflow and test the ellipsis", level: 3, total: 70, hasChildren: false })
]);

app.Viu = Backbone.View.extend({
    el: '#esse',

    render: function(){
        var data = [];
        emails.each(function(email){
            var emailView = new EmailView({model:email});
            data.push( emailView.render().el );
        });

        this.$el.html( data );
        return this;
    },
    events: {
        'click li': 'onLiClick'
    },

    // Events
    onLiClick: function(){
        console.log('oi');
    }
});


window.viu = new app.Viu({collection: emails});
viu.render();
*/
