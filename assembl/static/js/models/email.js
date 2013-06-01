define(['backbone'], function(B){

    return B.Model.extend({
        defaults: {
            subject: '',
            level: 1,
            total: 1,
            hasChildren: false
        }
    });

});