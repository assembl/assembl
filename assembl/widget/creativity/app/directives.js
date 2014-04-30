"use strict";

creativityApp.directive('rate', function($compile){
    return{
        restrict:'E',
        replace: true,
        template:'<button href="#" type="button" class="btn btn-xs btn-primary vote">{{"vote"| translate }}</button>',
        link: function(scope, elements){

           $(elements).popover({
                container:'.session-comment .caption',
                html:true,
                placement:'left',
                trigger:'click',
                content:function(){
                    return $compile(
                        '<span class="label label-default rating-1" ng-click="rate(1)">1</span>' +
                        '<span class="label label-default rating-2" ng-click="rate(2)">2</span>' +
                        '<span class="label label-default rating-3" ng-click="rate(3)">3</span>' +
                        '<span class="label label-default rating-4" ng-click="rate(4)">4</span>' +
                        '<span class="label label-default rating-5" ng-click="rate(5)">5</span>')(scope);
                }

            });

            scope.rate = function(rate){

               $(elements).popover('destroy');

               elements.parent().html('<button href="#" type="button" class="btn btn-xs btn-success vote"><span class="glyphicon glyphicon-ok"></span></button>');

               $compile(elements.contents())(scope);

            }
        }
    }
})
