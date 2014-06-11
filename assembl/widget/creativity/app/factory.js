"use strict";

creativityApp.factory('utils', function($translate){

    var fn = {};

    fn.changeLanguage = function(langKey){
        $translate.use(langKey);
    }

    /**
     * Transform in safe mode raw url
     * */
    fn.urlApi = function(url){
        if(!url) return;

        var
            api = url.toString();
            api = api.split(':')[1],
            api = '/data/'+api;

        return api;
    }

    return fn;
});