(function($){

    var CLASS = 'is-highlighted',
        TIME = 1000;

    $.fn.highlight = function(){
        var that = this;

        that.addClass(CLASS);

        setTimeout(function(){
            that.removeClass(CLASS);
        }, TIME);

        return this;
    };

})(jQuery);