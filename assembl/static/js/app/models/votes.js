'use strict';

var _ = require('underscore'),
    Backbone = require("backbone"),
    Base = require("./base.js"),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    Ctx = require("../common/context.js");

var TokenCategorySpecificationModel = Base.Model.extend({
  constructor: function TokenCategorySpecificationModel() {
    Base.Model.apply(this, arguments);
  },
  defaults: {
    "name": null, // (LangString) the display/translated name of the token category. Example: "Positive"
    "typename": null, // (string) identifier name of the token category. Categories with the same name can be compared.
    "total_number": null, // (integer) number of available tokens in the bag, that the voter can allocate on several candidates
    "token_vote_specification": null, // (string) the id of a token vote spec this category is associated to
    "image": null, // (string) URL of an image of a token
    "maximum_per_idea": null, // (integer) maximum number of tokens a voter has the right to put on an idea
    "@type": "TokenCategorySpecification",
    "@view": "voting_widget"
  }
});

var TokenCategorySpecificationCollection = Base.Collection.extend({
  constructor: function TokenCategorySpecificationCollection() {
    Base.Collection.apply(this, arguments);
  },
  model: TokenCategorySpecificationModel,
  url: function(){
    return Ctx.getApiV2DiscussionUrl('widgets/' + this.widgetModel.id + '/vote_specifications');
  },

  initalize: function(options){
    this.ideaModel = options.ideaModel;
  }
});

var VoteResultModel = Base.Model.extend({
  constructor: function VoteResultModel(){
    Base.Model.apply(this, arguments);
  }
});

var VoteResultCollection = Base.Collection.extend({
  model: VoteResultModel,

  initalize: function(options){
    this.voteSpecification = options.voteSpecification;
  }
});

module.exports = {
  TokenCategorySpecificationModel: TokenCategorySpecificationModel,
  TokenCategorySpecificationCollection: TokenCategorySpecificationCollection
}
