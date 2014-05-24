define(['models/base','underscore', 'models/segment', 'app', 'i18n', 'types', 'permissions'],
function(Base, _, Segment, app, i18n, Types, Permissions){
    'use strict';

    /**
     * @class IdeaModel
     */
    var IdeaLinkModel = Base.Model.extend({

        /**
         * @init
         */
        initialize: function(obj){
            obj = obj || {};
            var that = this;
        },

        /**
         * Defaults
         */
        defaults: {
            source: '',
            target: '',
            order: 1
        },
    });

    /**
     * @class IdeaColleciton
     */
    var IdeaLinkCollection = Base.Collection.extend({

        /**
         * The model
         * @type {IdeaModel}
         */
        model: IdeaLinkModel,
    });

    return {
        Model: IdeaLinkModel,
        Collection: IdeaLinkCollection
    };

});
