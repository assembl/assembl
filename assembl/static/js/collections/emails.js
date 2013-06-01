define(['backbone', 'models/email'], function(B, Email){

    return B.Collection.extend({
        model: Email
    });

});