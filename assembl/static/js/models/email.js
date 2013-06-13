define(['backbone'], function(Backbone){
    'use strict';

    /**
     * @class EmailModel
     */
    var EmailModel = Backbone.Model.extend({
        url: "/static/js/tests/fixtures/email.json",
        defaults: {
            subject: '',
            level: 1,
            total: 1,
            hasCheckbox: true,
            hasChildren: false,
            hasOptions: true,
            featured: false,
            active: false
        }
    });

    /**
     * @class EmailColleciton
     */
    var EmailCollection = Backbone.Collection.extend({
        url: "/static/js/tests/fixtures/emails.json",
        model: EmailModel
    });

    return {
        Model: EmailModel,
        Collection: EmailCollection
    };

});
