"use strict";

creativityApp.directive('rate', function(){
    return{
        restrict:'E',
        template:'<a class="glyphicon glyphicon-chevron-down text-danger rate-down" ng-click="rateDown()"></a><input class="rate" type="text" name="rate" ng-model="rate" value="{{rate}}" disabled><a class="glyphicon glyphicon-chevron-up text-success rate-up" ng-click="rateUp()"></a>',
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
