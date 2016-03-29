'use strict';

var Marionette = require('../shims/marionette.js'),
    Backbone = require('backbone'),
    _ = require('underscore'),
    $ = require('jquery'),
    Promise = require('bluebird'),
    Moment = require('moment'),
    Types = require('../utils/types.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js');


var IdeaContentLinkTypeRank = function() {
    var IDEA_RELATED_POST_LINK = Types.IDEA_RELATED_POST_LINK,
        EXTRACT = Types.EXTRACT;

    this._ranks = {};
    this._ranks[IDEA_RELATED_POST_LINK] = 0;
    this._ranks[EXTRACT] = 1;
};

IdeaContentLinkTypeRank.prototype = {
    getRank: function(t){
        if (this._ranks[t]) {
            return this._ranks[t];
        }
        else {
            return null;
        }
    }
};


var Model = Base.Model.extend({
  constructor: function IdeaContentLinkModel() {
    Base.Model.apply(this, arguments);
  },

    urlRoot: Ctx.getApiV2Url(Types.IDEA_CONTENT_LINK),

    defaults: {
        idIdea: null,
        idPost: null,
        creation_date: null,
        idCreator: null,
        created: null
    },

    getPostCreatorModelPromise: function(){
        var that = this,
            messageId = this.get('idPost');

        return this.collection.collectionManager.getMessageFullModelPromise(messageId)
            .then(function(messageModel){
                var postCreatorId = messageModel.get('idCreator');
                return Promise.join(postCreatorId, that.collection.collectionManager.getAllUsersCollectionPromise(),
                    function(postCreatorId, users) {
                        var u = users.get(postCreatorId);
                        if (!u){
                            throw new Error("[ideaContentLink] user with id " + that.get('idCreator') + " was not found");
                        }
                        return Promise.resolve(u);
                    }); 
            });
    },

    getLinkCreatorModelPromise: function(){
        var that = this;
        return this.collection.collectionManager.getAllUsersCollectionPromise()
            .then(function(users){
                var u = users.get(that.get('idCreator'));

                if (!u) {
                    throw new Error("[ideaContentLink] user with id " + that.get('idCreator') + " was not found");
                }

                return Promise.resolve(u);
            })
            .error(function(e){
                console.error(e.statusText);
            });
    },

    getMessageStructurePromise: function(){
        var that = this;
        return this.collection.collectionManager.getAllMessageStructureCollectionPromise()
            .then(function(messages){
                var m = messages.find(function(message){
                    return message.id === that.get('idPost');
                });

                if (!m) {
                    throw new Error("[ideaContentLink] message with id " + that.get('idPost') + " was not found");
                }

                return Promise.resolve(m);
            })
            .error(function(e){
                console.error(e.statusText);
            });
    },

    getIdeaModelPromise: function(){
        var that = this;
        return this.collection.collectionManager.getAllIdeasCollectionPromise()
            .then(function(ideas){
                var i = ideas.find(function(idea){
                    return idea.id === that.get('idIdea');
                });

                if (!i) {
                    throw new Error("[ideaContentLink] idea with id " + that.get('idIdea') + " was not found");
                }

                return Promise.resolve(i);
            })
            .error(function(e){
                console.error(e.statusText);
            });
    },

    //Helper function for the comparator, might not work
    isDirect: function(){
        return this.get('idPost') === this.collection.messageModel.id;
    },

    //Backend sends a created field instead of a creation_date
    getCreationDate: function(){
        return this.get('creation_date') ? this.get('creation_date') : this.get('created');
    }
});


/*
    This Collection is NOT created from an API call, like most other
    models, collections. It will be created from an array that
    will be passed from the message model.
 */
var Collection = Base.Collection.extend({
  constructor: function IdeaContentLinkCollection() {
    Base.Collection.apply(this, arguments);
  },

    //This URL currently does not exist. 2016-02-02 
    url: Ctx.getApiV2DiscussionUrl('idea_content_link'),

    model: Model,

    initialize: function(attrs, options){
        this.messageModel = options.message || {};
        Base.Collection.prototype.initialize.call(this, attrs, options);
    },

    /*
        Firstly, sort based on direct vs indirect, then sort based on types. If the types match, sort in ascending order
     */
    comparator: function(one, two){
        function sortByDate(one, two){
            var d1 = Moment(one.getCreationDate()),
                d2 = Moment(one.getCreationDate());

            if (d1.isBefore(d2)) {return -1;}
            if (d2.isBefore(d1)) {return 1;}
            else {return 0;}                
        };

        function sortByType(one, two){
            var t1 = one.get('@type'),
                t2 = two.get('@type'),
                ranker = new IdeaContentLinkTypeRank(),
                rank1 = ranker.getRank(t1),
                rank2 = ranker.getRank(t2);

            if (rank1 < rank2) { return -1; }
            if (rank2 < rank1) { return 1; }
            else {
                return sortByDate(one, two);
            }
        };

        var isDirect1 = one.isDirect(),
            isDirect2 = two.isDirect();

        if (isDirect1 && !isDirect2) { return -1;}
        if (!isDirect1 && isDirect2) { return 1; }
        else {
            return sortByType(one, two);
        }
    },

    /*
        @return Array   The string of short names of the ideas that a message is associated to
                        Note: It does not contain those that the user clipboarded
     */
    getIdeaNamesPromise: function(){
        var that = this;
        return this.collectionManager.getAllIdeasCollectionPromise()
            .then(function(ideas){

                var usableIdeaContentLinks = that.filter(function(icl) {
                    if (icl){
                        return icl.get('idIdea') !== null;
                    }
                    else {
                        return false;
                    }
                });

                var m = _.map(usableIdeaContentLinks, function(ideaContentLink) {
                    var idIdea = ideaContentLink.get('idIdea');
                    var ideaModel = ideas.get(idIdea);
                    if (!ideaModel){
                        throw new Error("Idea " + idIdea + " on " + ideaContentLink.id + 
                                        " is NOT part of the ideas collection!");
                    }
                    return ideaModel.getShortTitleDisplayText();
                });

                //Sometimes there are duplicate names?
                // console.log("In getIdeaNamesPromise:");
                // console.log("Idea Content Link Collection used: ", that);
                // console.log("The names being passed: ", m);

                return Promise.resolve(m);
            })
            .error(function(e){
                console.error("[IdeaContentLink] Error in getting idea names: ", e.statusText);
            });
    },

});

module.exports = {
    Model: Model,
    Collection: Collection
}    
