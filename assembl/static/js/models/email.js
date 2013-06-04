define(['backbone'], function(Backbone){

    /**
     * @class EmailModel
     */
    var EmailModel = Backbone.Model.extend({
        defaults: {
            subject: '',
            level: 1,
            total: 1,
            hasChildren: false
        }
    });

    /**
     * @class EmailColleciton
     */
    var EmailCollection = Backbone.Collection.extend({
        model: EmailModel
    });

    return {
        Model: EmailModel,
        Collection: EmailCollection
    }

});
