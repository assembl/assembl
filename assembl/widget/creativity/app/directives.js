"use strict";

creativityApp.directive('rate', function(){
    return{
        restrict:'E',
        template:'<a class="glyphicon glyphicon-chevron-down text-danger"></a><input class="rate" type="text" name="rate" value="1" disabled><a class="glyphicon glyphicon-chevron-up text-success"></a>',
        link: function(scope, elements, attrs){


        }
    }
})
