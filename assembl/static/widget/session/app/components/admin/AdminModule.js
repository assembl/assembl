'use strict';

var AdminModule = angular.module('AdminModule', ['ui.router']);

AdminModule.config(['$stateProvider', '$urlRouterProvider', function($stateProvider) {
  $stateProvider
        .state('session.admin', {
          url: '/admin?config',
          templateUrl: 'app/components/admin/AdminView.html',
          controller: 'AdminController',
          activetab: 'admin',
          resolve: {
            config: ['WidgetService', '$stateParams', function(WidgetService, $stateParams) {
              if ($stateParams.config) {
                var id = decodeURIComponent($stateParams.config).split('/')[1];
                return WidgetService.get({id: id}).$promise;
              }else {
                console.warn('no config param set');
              }
            }]
          }
        })
        .state('session.create', {
          url: '/admin/create_from_idea?admin&idea&view',
          templateUrl: 'app/components/admin/CreateView.html',
          controller: 'CreateController',
          activetab: 'create',
          resolve: {
            idea: ['IdeaService', '$stateParams', function(IdeaService, $stateParams) {
              if ($stateParams.idea) {
                var id =  $stateParams.idea.split('/')[1];
                return IdeaService.get({id: id}).$promise
              }else {
                console.warn('no idea param set');
              }
            }]
          }
        });
}]);
