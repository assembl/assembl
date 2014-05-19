define(['base', 'app'], function(Base, app){
    'use strict';

    /**
     * @class Source
     */
    var Source = Base.Model.extend({

        /**
         * Default values
         * @type {Object}
         */
        defaults: {
           '@id': '',
           '@type': '',
           creation_date: '',
           discussion_id: 0,
           folder: '',
           host: '',
           last_import: null,
           most_common_recipient_address: '',
           name: '',
           port: 0,
           use_ssl: false,
           username: ''
        },

        /**
         * The url
         * @type {String}
         */
        urlRoot: app.getApiUrl('sources/')

    });

    return {
        Model: Source
    };

});