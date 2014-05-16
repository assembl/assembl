"use strict";

creativityApp.directive('vote', function(){
    return{
        restrict:'E',
        transclude: true,
        scope: {
            id:'=id'
        },
        templateUrl:'app/partials/vote.html',
        link: function(scope, elements, attrs){

            scope.rate = 0;

            scope.rateUp = function(){
               if(scope.rate > 4){
                   return;
               }
                scope.rate += 1;
            }

            scope.rateDown = function(){
                if(scope.rate <= 0){
                    return;
                }
                scope.rate -= 1;
            }


        }
    }
})
